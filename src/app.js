import { calculateAdmissionScore } from "./scoring.js";

const PAGE_SIZE = 12;
const GRADE_FIELDS = [
  ["Chinese", "中文"],
  ["English", "英文"],
  ["Mathematics", "數學（必修部分）"],
  ["CSD", "公民與社會發展"],
];
const DSE_GRADES = ["", "5**", "5*", "5", "4", "3", "2", "1", "U"];
const ELECTIVE_SUBJECTS = [
  ["Biology", "生物"],
  ["Business, Accounting and Financial Studies", "企業、會計與財務概論"],
  ["Business, Accounting and Financial Studies (Accounting)", "企業、會計與財務概論（會計）"],
  ["Business, Accounting and Financial Studies (Business Management)", "企業、會計與財務概論（商業管理）"],
  ["Chemistry", "化學"],
  ["Chinese History", "中國歷史"],
  ["Combined Science", "組合科學"],
  ["Combined Science: Biology + Chemistry", "組合科學（生物、化學）"],
  ["Combined Science: Biology + Physics", "組合科學（生物、物理）"],
  ["Combined Science: Physics + Chemistry", "組合科學（物理、化學）"],
  ["Design and Applied Technology", "設計與應用科技"],
  ["Economics", "經濟"],
  ["Ethics and Religious Studies", "倫理與宗教"],
  ["Geography", "地理"],
  ["Health Management and Social Care", "健康管理與社會關懷"],
  ["History", "歷史"],
  ["ICT", "資訊及通訊科技"],
  ["Integrated Science", "綜合科學"],
  ["Literature in English", "英語文學"],
  ["Literature in Chinese", "中國文學"],
  ["M1", "數學延伸部分 M1"],
  ["M2", "數學延伸部分 M2"],
  ["Music", "音樂"],
  ["Physical Education", "體育"],
  ["Physics", "物理"],
  ["Technology and Living (Fashion, Clothing and Textiles)", "科技與生活（時裝、成衣及紡織）"],
  ["Technology and Living (Food Science and Technology)", "科技與生活（食物科學與科技）"],
  ["Tourism and Hospitality Studies", "旅遊與款待"],
  ["Visual Arts", "視覺藝術"],
];
const CATEGORY_C_LANGUAGES = ["French", "German", "Hindi", "Japanese", "Korean", "Spanish", "Urdu"];
const CATEGORY_C_LABELS = {
  French: "法文", German: "德文", Hindi: "印地語", Japanese: "日文",
  Korean: "韓文", Spanish: "西班牙文", Urdu: "烏爾都文",
};

const institutions = [
  { id: "cityuhk", short: "城大", name: "香港城市大學" },
  { id: "hkbu", short: "浸大", name: "香港浸會大學" },
  { id: "lingnanu", short: "嶺大", name: "嶺南大學" },
  { id: "cuhk", short: "中大", name: "香港中文大學" },
  { id: "eduhk", short: "教大", name: "香港教育大學" },
  { id: "polyu", short: "理大", name: "香港理工大學" },
  { id: "hkust", short: "科大", name: "香港科技大學" },
  { id: "hku", short: "港大", name: "香港大學" },
  { id: "hkmu", short: "都大", name: "香港都會大學" },
];

const state = {
  programmes: [],
  institutions: [],
  catalogueUpdated: "",
  visibleCount: PAGE_SIZE,
  institution: "all",
  funding: "all",
  search: "",
  selectedProgramme: null,
};

const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

function renderFilters() {
  $("#institution-filters").innerHTML = [
    { id: "all", short: "全部院校" },
    ...(state.institutions.length ? state.institutions : institutions),
  ]
    .map(
      (institution) =>
        `<button class="filter-chip${state.institution === institution.id ? " active" : ""}" type="button" data-institution="${institution.id}">${institution.short}</button>`,
    )
    .join("");
}

function filteredProgrammes() {
  const query = state.search.trim().toLocaleLowerCase();
  return state.programmes.filter((programme) => {
    const matchesInstitution = state.institution === "all" || programme.institutionId === state.institution;
    const matchesFunding = state.funding === "all" || programme.fundingCategory === state.funding;
    const searchable = [
      programme.code,
      programme.title,
      programme.titleZh,
      programme.shortName,
      programme.institutionName,
    ].join(" ").toLocaleLowerCase();
    return matchesInstitution && matchesFunding && (!query || searchable.includes(query));
  });
}

function renderProgrammes() {
  const filtered = filteredProgrammes();
  const items = filtered.slice(0, state.visibleCount);
  $("#result-count").textContent = `共 ${filtered.length} 個課程`;
  $("#programme-list").innerHTML = items.length
    ? items.map((programme) => {
        const selfFinancing = programme.fundingCategory === "Self-financing";
        const calculatorLabel = programme.scoreModel?.calculatorSupported
          ? `可計算 · ${programme.scoreModel.cycle}`
          : programme.scoreModel?.verified ? "公式已核實 · 暫不支援計算" : "計分資料待核實";
        return `
          <article class="programme-card" tabindex="0" role="button" data-code="${escapeHTML(programme.code)}" aria-label="查看 ${escapeHTML(programme.code)} ${escapeHTML(programme.titleZh)}">
            <div class="card-meta">
              <span class="programme-code">${escapeHTML(programme.code)}</span>
              <span class="funding-badge${selfFinancing ? " self" : ""}">${selfFinancing ? "自資課程" : "UGC 資助"}</span>
            </div>
            <h3>${escapeHTML(programme.titleZh || programme.title)}</h3>
            <p>${escapeHTML(programme.title)}</p>
            <div class="card-bottom"><span>${escapeHTML(programme.institutionShort)}</span><span>${calculatorLabel}</span></div>
          </article>`;
      }).join("")
    : '<div class="empty-state">找不到符合條件的課程，請試試其他關鍵字或篩選條件。</div>';

  $("#pagination-note").innerHTML =
    filtered.length > items.length
      ? `<button class="load-more" type="button" id="load-more">顯示更多課程（${filtered.length - items.length}）</button>`
      : "";
}

function updateOverview() {
  $("#programme-count").textContent = state.programmes.length.toLocaleString("zh-HK");
  $("#verified-count").textContent = state.programmes.filter((programme) => programme.scoreModel?.calculatorSupported).length;
  $("#updated-date").textContent = state.catalogueUpdated || "—";
  $("#guide-updated-date").textContent = state.catalogueUpdated || "—";
}

function renderGrades() {
  const gradeOptions = (values) => values.map((grade) => `<option value="${grade}">${grade || "—"}</option>`).join("");
  $("#core-grade-inputs").innerHTML = GRADE_FIELDS.map(([key, label]) => `
    <div class="grade-cell">
      <label for="grade-${escapeHTML(key)}">${escapeHTML(label)}</label>
      <select id="grade-${escapeHTML(key)}" data-subject="${escapeHTML(key)}" aria-label="${escapeHTML(label)}成績">
        ${gradeOptions(key === "CSD" ? ["", "Attained", "Not attained"] : DSE_GRADES)}
      </select>
    </div>`).join("");
  $("#elective-grade-inputs").innerHTML = Array.from({ length: 6 }, (_, index) => `
    <div class="elective-grade-row">
      <label class="sr-only" for="elective-subject-${index}">選修科目 ${index + 1}</label>
      <select id="elective-subject-${index}" data-elective-subject aria-label="選修科目 ${index + 1}">
        <option value="">選擇科目 ${index + 1}</option>
        ${ELECTIVE_SUBJECTS.map(([key, label]) => `<option value="${escapeHTML(key)}">${escapeHTML(label)}</option>`).join("")}
      </select>
      <label class="sr-only" for="elective-grade-${index}">選修科目 ${index + 1} 成績</label>
      <select id="elective-grade-${index}" data-elective-grade aria-label="選修科目 ${index + 1} 成績">
        ${gradeOptions(DSE_GRADES)}
      </select>
    </div>`).join("");
  renderCategoryCGrades();
}

function renderElectiveSubjects() {
  const programmeSubjects = state.selectedProgramme?.scoreModel?.subjectChoices ?? [];
  const coreSubjects = new Set(GRADE_FIELDS.map(([key]) => key));
  const subjects = [...new Map([
    ...ELECTIVE_SUBJECTS,
    ...programmeSubjects
      .filter((subject) => !coreSubjects.has(subject))
      .map((subject) => [subject, subject]),
  ]).entries()];
  for (const select of $("#elective-grade-inputs").querySelectorAll("[data-elective-subject]")) {
    const selected = select.value;
    select.innerHTML = `<option value="">選擇科目</option>${subjects
      .map(([key, label]) => `<option value="${escapeHTML(key)}">${escapeHTML(label)}</option>`).join("")}`;
    if (subjects.some(([key]) => key === selected)) select.value = selected;
  }
}

function renderCategoryCGrades() {
  const programme = state.selectedProgramme;
  const languagePoints = programme?.scoreModel?.categoryCLimit ? programme.scoreModel.languagePoints : null;
  const languageSelect = $("#category-c-exam");
  const gradeSelect = $("#grade-other-language");
  const selectedLanguage = languageSelect.value;
  const selectedGrade = gradeSelect.value;
  languageSelect.innerHTML = `<option value="">選擇語言</option>${CATEGORY_C_LANGUAGES
    .map((language) => `<option value="${language}">${CATEGORY_C_LABELS[language]}</option>`).join("")}`;
  if (CATEGORY_C_LANGUAGES.includes(selectedLanguage)) languageSelect.value = selectedLanguage;
  const grades = Object.keys(languagePoints?.[languageSelect.value] ?? {});
  gradeSelect.innerHTML = `<option value="">選擇級別</option>${grades
    .map((grade) => `<option value="${escapeHTML(grade)}">${escapeHTML(grade)}</option>`).join("")}`;
  gradeSelect.disabled = grades.length === 0;
  if (grades.includes(selectedGrade)) gradeSelect.value = selectedGrade;
}

function renderCategoryBGrades() {
  const model = state.selectedProgramme?.scoreModel;
  const subjects = model?.categoryBSubjects ?? [];
  const row = $("#category-b-row");
  const previous = [...row.querySelectorAll(".category-b-entry")].map((entry) => ({
    subject: entry.querySelector("[data-category-b-subject]").value,
    grade: entry.querySelector("[data-category-b-grade]").value,
  }));
  const count = subjects.length ? Math.max(1, model?.categoryBLimit ?? 1) : 0;
  row.hidden = count === 0;
  const grades = Object.keys(model?.categoryBPoints ?? {});
  row.innerHTML = Array.from({ length: count }, (_, index) => `
    <div class="other-language-row category-b-entry">
      <label for="category-b-subject-${index + 1}">應用學習${count > 1 ? ` ${index + 1}` : ""}</label>
      <select id="category-b-subject-${index + 1}" data-category-b-subject aria-label="應用學習科目 ${index + 1}">
        <option value="">選擇科目</option>
        ${subjects.map((subject) => `<option value="${escapeHTML(subject)}">${escapeHTML(subject)}</option>`).join("")}
      </select>
      <select id="category-b-grade-${index + 1}" data-category-b-grade aria-label="應用學習成績 ${index + 1}" disabled>
        <option value="">選擇級別</option>
        ${grades.map((grade) => `<option value="${escapeHTML(grade)}">${escapeHTML(grade)}</option>`).join("")}
      </select>
    </div>`).join("");
  [...row.querySelectorAll(".category-b-entry")].forEach((entry, index) => {
    const subjectSelect = entry.querySelector("[data-category-b-subject]");
    const gradeSelect = entry.querySelector("[data-category-b-grade]");
    if (subjects.includes(previous[index]?.subject)) subjectSelect.value = previous[index].subject;
    gradeSelect.disabled = !subjectSelect.value || grades.length === 0;
    if (grades.includes(previous[index]?.grade)) gradeSelect.value = previous[index].grade;
  });
}

function findProgramme(code) {
  const normalized = code.toUpperCase().replace(/[\s-]/g, "");
  const fullCode = normalized.startsWith("JS") ? normalized : `JS${normalized}`;
  return state.programmes.find((programme) => programme.code.toUpperCase() === fullCode);
}

function showProgramme(programme) {
  state.selectedProgramme = programme;
  const selectedProgramme = $("#selected-programme");
  selectedProgramme.textContent = programme
    ? `${programme.institutionShort} · ${programme.titleZh || programme.title}`
    : "未找到課程，請檢查課程編號。";
  selectedProgramme.dataset.found = String(Boolean(programme));
  renderElectiveSubjects();
  renderCategoryCGrades();
  renderCategoryBGrades();
}

function openProgrammeDialog(programme) {
  const dialog = $("#programme-dialog");
  const institution = state.institutions.find((item) => item.id === programme.institutionId);
  const title = escapeHTML(programme.titleZh || programme.title);
  const sourceUrl = escapeHTML(programme.sourceUrl);
  const model = programme.scoreModel;
  const statistics = programme.scoreStatistics;
  const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);
  const requirements = programme.programmeGeneralRequirements ?? institution?.generalRequirements;
  const requirementsHeading = programme.programmeGeneralRequirements
    ? "高級文憑最低入學要求"
    : "院校整體最低入學要求";
  const formulaStatus = model?.calculatorSupported
    ? `已核實 · ${model.cycle}`
    : model?.verified ? `已收錄（${model.cycle}），計算器尚未支援` : "未有可用的官方公式";
  const requirementLabel = (subject) => ({
    "CHINESE LANGUAGE": "中文（Chinese Language）",
    "CITIZENSHIP AND SOCIAL DEVELOPMENT": "公民與社會發展（Citizenship and Social Development）",
    "ENGLISH LANGUAGE": "英文（English Language）",
    "MATHEMATICS COMPULSORY PART": "數學必修部分（Mathematics Compulsory Part）",
    "ANY 2 SUBJECTS": "任選兩科（Any 2 subjects）",
    "ANY 1 SUBJECT": "任選一科（Any 1 subject）",
    "ANY 3 SUBJECTS": "任選三科（Any 3 subjects）",
    "MATHEMATICS EXTENDED MODULE 1 OR 2": "數學延伸部分 M1 或 M2",
    "Or": "或",
  }[subject] ?? subject);
  const requirementRows = (rows) => (rows?.length
    ? rows.map(({ subject, level, operator }) => operator
      ? `<tr class="requirement-operator"><td colspan="2">或</td></tr>`
      : `<tr><td>${escapeHTML(requirementLabel(subject))}</td><td>${escapeHTML(level)}</td></tr>`).join("")
    : '<tr><td colspan="2">請查看院校官方要求。</td></tr>');
  const statistic = (key) => Number.isFinite(statistics?.[key]) ? statistics[key] : "未有公布";
  const statUpperKey = Number.isFinite(statistics?.upperQuartile)
    ? "upperQuartile" : Number.isFinite(statistics?.highestAttainable) ? "highestAttainable" : null;
  const statUpperLabel = statUpperKey === "highestAttainable" ? "最高可得分" : "上四分位數";
  const statYear = statistics?.year ? `${statistics.year} 收生資料` : "未有官方收生分數";
  const programmeRequirements = [...asList(programme.programmeRequirements), ...asList(model?.requirements)];
  const requirementList = programmeRequirements.length
    ? `<ul class="programme-requirements">${programmeRequirements.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`
    : '<p class="requirements-caption">官方資料未列出已核實的個別科目要求；請以課程官方頁面為準。</p>';
  const exclusivityNotes = asList(model?.mutuallyExclusive).map((pair) =>
    `${pair.join("／")} 不可同時計入主要公式科目。`);
  const formulaNotes = [
    ...asList(model?.formulaRemarks),
    ...asList(model?.weightingRemarks),
    ...asList(model?.scoreRemark),
    ...exclusivityNotes,
  ];
  const bonusScale = Object.entries(model?.bonus?.gradePercentages ?? {})
    .map(([grade, fraction]) => `${grade}=${(fraction * 100).toFixed(2)}%`).join(" · ");
  const sourceLinks = [
    [model?.sourceUrl, "官方公式來源"],
    [model?.formulaDataUrl, "官方公式資料"],
    [model?.conversionSourceUrl, "官方成績換算表"],
    [model?.bonusSourceUrl, "官方第六科加分說明"],
    [statistics?.sourceUrl, "官方收生成績"],
  ].filter(([url], index, items) => url && items.findIndex(([otherUrl]) => otherUrl === url) === index);
  const gradeScale = Object.entries(model?.gradePoints ?? {})
    .map(([grade, points]) => `${grade}=${points}`).join(" · ");
  const subjectWeights = new Map(Object.entries(model?.subjectWeights ?? {}));
  const formulaPlans = model?.alternatives ?? [model?.groups ?? []];
  for (const plan of formulaPlans) {
    for (const group of plan) {
      for (const [subject, weight] of Object.entries(group.weights ?? {})) {
        if (weight > (subjectWeights.get(subject) ?? 1)) subjectWeights.set(subject, weight);
      }
    }
  }
  const weightText = [...subjectWeights]
    .filter(([, weight]) => weight > 1)
    .map(([subject, weight]) => `${subject} × ${weight}`)
    .join(" · ");
  const weightedSelectionText = asList(model?.weightedSelections)
    .map(({ count, subjects, weight }) => `指定 ${count} 科（${subjects.join("／")}）× ${weight}`)
    .join(" · ");
  const languageScales = model?.categoryCLimit
    ? Object.entries(model.languagePoints ?? {}).map(([language, grades]) =>
      `${CATEGORY_C_LABELS[language] ?? language}：${Object.entries(grades).map(([grade, points]) => `${grade}=${points}`).join("、")}`)
    : [];
  const statisticRows = [
    ["下四分位數", "lowerQuartile"],
    ["中位數", "median"],
    [statUpperLabel, statUpperKey],
    ...(Number.isFinite(statistics?.average) ? [["平均分", "average"]] : []),
  ].filter(([, key]) => key);
  $("#programme-detail").innerHTML = `
    <span class="dialog-code">${escapeHTML(programme.code)}</span>
    <h2>${title}</h2>
    <p class="dialog-title-en">${escapeHTML(programme.title)}</p>
    <div class="detail-divider"></div>
    <div class="detail-grid">
      <div><span class="detail-label">院校</span><span class="detail-value">${escapeHTML(programme.institutionName)}</span></div>
      <div><span class="detail-label">資助類別</span><span class="detail-value">${programme.fundingCategory === "Self-financing" ? "自資課程" : "UGC 資助"}</span></div>
      <div><span class="detail-label">課程簡稱</span><span class="detail-value">${escapeHTML(programme.shortName || "—")}</span></div>
      <div><span class="detail-label">課程目錄年度</span><span class="detail-value">2027/28</span></div>
    </div>
    <div class="detail-divider"></div>
    <h3 class="requirements-title">官方收生成績 · ${escapeHTML(statYear)}</h3>
    <div class="score-stat-grid">
      ${statisticRows.map(([label, key]) => `<div><span>${escapeHTML(label)}</span><strong>${escapeHTML(statistic(key))}</strong></div>`).join("")}
    </div>
    <p class="requirements-caption">往年數字只作參考，並非入學門檻或錄取保證；院校未公布的統計不會推算。</p>
    <div class="detail-grid detail-data-grid">
      <div><span class="detail-label">計分公式狀態</span><span class="detail-value">${escapeHTML(formulaStatus)}</span></div>
      <div><span class="detail-label">公式入學年度</span><span class="detail-value">${escapeHTML(model?.cycle ?? "未核實")}</span></div>
    </div>
    <div class="detail-divider"></div>
    <h3 class="requirements-title">課程個別要求</h3>
    ${requirementList}
    <div class="detail-divider"></div>
    <h3 class="requirements-title">計分方式及成績換算</h3>
    ${model?.formulaText
      ? `<p class="formula-text">${escapeHTML(model.formulaText)}</p>`
      : '<p class="requirements-caption">尚未取得可展示的官方課程公式。</p>'}
    ${gradeScale
      ? `<div class="conversion-details"><div><strong>甲類級別換算</strong><p>${escapeHTML(gradeScale)}</p></div>
        ${weightText || weightedSelectionText ? `<div><strong>科目加權</strong><p>${escapeHTML([weightText, weightedSelectionText].filter(Boolean).join(" · "))}${Number.isInteger(model?.maxWeightedElectives) ? `（最多加權 ${model.maxWeightedElectives} 科）` : ""}</p></div>` : ""}
        <div><strong>丙類語言換算</strong><p>${languageScales.length ? languageScales.map(escapeHTML).join("<br>") : "此公式不接受丙類語言成績。"}</p></div>
        ${model?.bonus ? `<div><strong>第六科加分</strong><p>以五科最高可得分 ${escapeHTML(model.bonus.baseMax)} 為基數；${escapeHTML(bonusScale)}${model.bonus.languagePercentages ? "；丙類按換算後分數套用相應百分比" : ""}</p></div>` : ""}
      </div>` : ""}
    ${formulaNotes.length
      ? `<ul class="programme-requirements">${formulaNotes.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>` : ""}
    ${model?.expectedScore
      ? `<p class="requirements-caption">院校官方計算器參考分數（${escapeHTML(model.expectedScoreCycle ?? model.cycle)}）：${escapeHTML(model.expectedScore)}</p>` : ""}
    ${asList(model?.categoryCNotes).length
      ? `<p class="requirements-caption">${asList(model.categoryCNotes).map(escapeHTML).join(" ")}</p>` : ""}
    ${requirements ? `
      <div class="detail-divider"></div>
      <h3 class="requirements-title">${escapeHTML(requirementsHeading)}</h3>
      <p class="requirements-caption">此為院校層面要求；個別課程或設有額外科目及成績要求。</p>
      <table class="requirements-table">
        <thead><tr><th>科目／要求</th><th>最低級別</th></tr></thead>
        <tbody>
          <tr class="requirement-group"><th colspan="2">核心科目</th></tr>
          ${requirementRows(requirements.core)}
          <tr class="requirement-group"><th colspan="2">選修科目</th></tr>
          ${requirementRows(requirements.electives)}
        </tbody>
      </table>` : ""}
    ${institution?.admissionNotes?.length
      ? `<ul class="programme-requirements">${institution.admissionNotes.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>` : ""}
    <p class="detail-unavailable">院校整體最低要求不等於課程個別要求。只有已核實並由計算器支援的公式才會計算；官方公式與收生統計可能屬不同年度。</p>
    <a class="official-link" href="${sourceUrl}" target="_blank" rel="noreferrer">查看 JUPAS 官方課程資料 ↗</a>
    ${institution?.profileUrl ? `<a class="official-link official-link-secondary" href="${escapeHTML(institution.profileUrl)}" target="_blank" rel="noreferrer">查看院校整體入學要求 ↗</a>` : ""}
    ${sourceLinks.map(([url, label]) => `<a class="official-link official-link-secondary" href="${escapeHTML(url)}" target="_blank" rel="noreferrer">${escapeHTML(label)} ↗</a>`).join("")}`;
  dialog.showModal();
}

function setResult(message, tone = "") {
  const result = $("#calc-result");
  result.className = `calc-result${tone ? ` ${tone}` : ""}`;
  $("#calc-result-message").textContent = message;
  result.querySelector(".result-icon").textContent = tone === "success" ? "✓" : tone === "error" ? "×" : "!";
  $("#score-comparison").hidden = true;
  $("#score-comparison").innerHTML = "";
  $("#result-details").hidden = true;
}

function showScoreComparison(programme, score) {
  const statistics = programme.scoreStatistics;
  const publishedQuartiles = [
    ["下四分位數", statistics?.lowerQuartile],
    ["中位數", statistics?.median],
    ["上四分位數", statistics?.upperQuartile],
  ].filter(([, value]) => Number.isFinite(value));
  const year = statistics?.year ? `${statistics.year} 收生資料` : "收生統計年度未有標示";
  const sourceLink = statistics?.sourceUrl
    ? `<a href="${escapeHTML(statistics.sourceUrl)}" target="_blank" rel="noreferrer">官方統計來源 ↗</a>`
    : "";
  const quartileCards = publishedQuartiles.length
    ? publishedQuartiles.map(([label, value]) => `
        <div class="comparison-stat">
          <span>${escapeHTML(label)}</span>
          <strong>${escapeHTML(value)}</strong>
        </div>`).join("")
    : '<p class="comparison-unavailable">此課程目前未有可用的官方四分位收生統計。</p>';
  const comparison = $("#score-comparison");
  comparison.innerHTML = `
    <div class="comparison-heading">
      <strong>歷年收生分數 · ${escapeHTML(year)}</strong>
      ${sourceLink}
    </div>
    <div class="comparison-grid">
      <div class="comparison-stat comparison-estimate">
        <span>你的估算分數</span>
        <strong>${score.toFixed(2)}</strong>
      </div>
      ${quartileCards}
    </div>
    <p class="comparison-note">估算分數與歷年收生統計可能屬不同年度，只供參考，並非錄取預測。</p>`;
  comparison.hidden = false;
  $("#result-details").hidden = false;
}

function calculate() {
  if (!state.selectedProgramme) {
    setResult("請先輸入有效的 JS 課程編號。", "error");
    return;
  }
  const grades = Object.fromEntries(
    [...$("#core-grade-inputs").querySelectorAll("[data-subject]")].map((select) => [select.dataset.subject, select.value]),
  );
  for (const row of $("#elective-grade-inputs").querySelectorAll(".elective-grade-row")) {
    const subject = row.querySelector("[data-elective-subject]").value;
    const grade = row.querySelector("[data-elective-grade]").value;
    if (!subject || !grade) continue;
    if (grades[subject]) {
      setResult(`「${row.querySelector("[data-elective-subject]").selectedOptions[0].textContent}」重複輸入，請只保留一項。`, "error");
      return;
    }
    grades[subject] = grade;
  }
  const language = $("#category-c-exam").value;
  const otherLanguage = $("#grade-other-language").value;
  if (language && otherLanguage) grades["Category C"] = { language, grade: otherLanguage };
  const categoryBSubjects = new Set();
  for (const [index, entry] of [...$("#category-b-row").querySelectorAll(".category-b-entry")].entries()) {
    const subject = entry.querySelector("[data-category-b-subject]").value;
    const grade = entry.querySelector("[data-category-b-grade]").value;
    if (!subject || !grade) continue;
    if (categoryBSubjects.has(subject)) {
      setResult(`「${subject}」應用學習科目重複輸入，請只保留一項。`, "error");
      return;
    }
    categoryBSubjects.add(subject);
    grades[index === 0 ? "Category B" : `Category B ${index + 1}`] = { subject, grade };
  }
  const result = calculateAdmissionScore(state.selectedProgramme, grades);
  if (!result.supported) {
    setResult(result.reason);
    return;
  }
  if (!result.eligibleForCalculation) {
    setResult(result.reason, "error");
    return;
  }
  const bonusText = result.bonus ? `，包括第六科加分 ${result.bonus.toFixed(2)}` : "";
  const historicText = /^2026/.test(result.cycle) ? `（${result.cycle} 歷史公式）` : "";
  const warningText = result.warning ? ` ${result.warning}` : "";
  setResult(`估算加權分數：${result.score.toFixed(2)}${bonusText}${historicText}。只按已核實的官方公式計算。${warningText}`, "success");
  showScoreComparison(state.selectedProgramme, result.score);
}

function attachEvents() {
  const themeToggle = $("#theme-toggle");
  const updateThemeToggle = () => {
    const isDark = document.documentElement.dataset.theme === "dark";
    const label = isDark ? "切換淺色模式" : "切換深色模式";
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.title = label;
    themeToggle.querySelector(".theme-toggle-label").textContent = isDark ? "淺色" : "深色";
  };
  updateThemeToggle();
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    $('meta[name="theme-color"]').content = nextTheme === "dark" ? "#151c17" : "#f6f7f3";
    updateThemeToggle();
    try {
      localStorage.setItem("jupas-theme", nextTheme);
    } catch (error) {
      console.warn("Unable to save the theme preference.", error);
    }
  });
  $("#result-details").addEventListener("click", () => {
    if (state.selectedProgramme) openProgrammeDialog(state.selectedProgramme);
  });
  $("#institution-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-institution]");
    if (!button) return;
    state.institution = button.dataset.institution;
    state.visibleCount = PAGE_SIZE;
    renderFilters();
    renderProgrammes();
  });
  $("#funding-filter").addEventListener("change", (event) => {
    state.funding = event.target.value;
    state.visibleCount = PAGE_SIZE;
    renderProgrammes();
  });
  $("#programme-search").addEventListener("input", (event) => {
    state.search = event.target.value;
    state.visibleCount = PAGE_SIZE;
    renderProgrammes();
  });
  $("#programme-list").addEventListener("click", (event) => {
    const card = event.target.closest("[data-code]");
    if (card) openProgrammeDialog(findProgramme(card.dataset.code));
  });
  $("#programme-list").addEventListener("keydown", (event) => {
    const card = event.target.closest("[data-code]");
    if (card && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openProgrammeDialog(findProgramme(card.dataset.code));
    }
  });
  $("#pagination-note").addEventListener("click", (event) => {
    if (event.target.id !== "load-more") return;
    state.visibleCount += PAGE_SIZE;
    renderProgrammes();
  });
  $("#find-code").addEventListener("click", () => showProgramme(findProgramme($("#calc-code").value)));
  $("#calc-code").addEventListener("keydown", (event) => {
    if (event.key === "Enter") showProgramme(findProgramme(event.currentTarget.value));
  });
  $("#calc-code").addEventListener("input", (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
    if (digits !== event.target.value) event.target.value = digits;
  });
  $("#category-c-exam").addEventListener("change", () => renderCategoryCGrades());
  $("#calculate-score").addEventListener("click", calculate);
  $("#clear-grades").addEventListener("click", () => {
    $("#core-grade-inputs, #elective-grade-inputs").querySelectorAll("select").forEach((select) => { select.value = ""; });
    $("#category-b-row").querySelectorAll("select").forEach((select) => { select.value = ""; });
    $("#category-b-row").querySelectorAll("[data-category-b-grade]").forEach((select) => { select.disabled = true; });
    $("#category-c-exam").value = "";
    $("#grade-other-language").value = "";
    $("#grade-other-language").disabled = true;
    setResult("成績已清除。");
  });
  $("#category-b-row").addEventListener("change", (event) => {
    if (event.target.matches("[data-category-b-subject]")) renderCategoryBGrades();
  });
  $(".dialog-close").addEventListener("click", () => $("#programme-dialog").close());
  $("#programme-dialog").addEventListener("click", (event) => {
    if (event.target === $("#programme-dialog")) $("#programme-dialog").close();
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      $("#programme-search").focus();
    }
  });
}

async function init() {
  renderGrades();
  renderCategoryBGrades();
  try {
    const response = await fetch(new URL("../data/programmes.json", import.meta.url));
    if (!response.ok) throw new Error(`Catalogue request failed: ${response.status}`);
    const data = await response.json();
    state.programmes = data.programmes;
    state.institutions = data.institutions;
    state.catalogueUpdated = data.catalogueUpdated;
    renderFilters();
    updateOverview();
    renderProgrammes();
    attachEvents();
  } catch (error) {
    console.error("Unable to load the JUPAS catalogue.", error);
    $("#result-count").textContent = "目錄載入失敗";
    $("#programme-list").innerHTML = '<div class="empty-state">暫時無法載入課程目錄，請重新整理頁面或稍後再試。</div>';
  }
}

init();
