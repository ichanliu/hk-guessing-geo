import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const outputPath = resolve("data/admissions-overrides.json");
const hkuUrl = "https://admissions.hku.hk/api/hkdse/admission_standard";
const hkuGuideUrl = "https://admissions.hku.hk/sites/default/files/2026-09/HKU-JUPAS-Admissions-Information-2027.pdf";
const hkustFormulaUrl = "https://join.hkust.edu.hk/docs/ADMISSIONS%20REQUIREMENTS%20AND%20SCORE%20FORMULAE.pdf";
const hkustConversionUrl = "https://join.hkust.edu.hk/docs/JUPAS%20conversion%20of%20score.pdf";
const hkustStatisticsUrl = "https://join.hkust.edu.hk/docs/2026_HKUST_JUPAS_ADMISSIONS_SCORES.pdf";
const hkustBonusUrl = "https://publication.join.ust.hk/view/13965330/14-15/";
const cuhkCalculatorUrl = "https://admission.cuhk.edu.hk/application/jupas/programme-specific-requirements-and-score-calculator/";
const cuhkDataUrl = "https://admission.cuhk.edu.hk/wp-content/uploads/data.json";
const cuhkAdmissionGradesUrl = "https://admission.cuhk.edu.hk/wp-content/uploads/2026/10/Admission-Grades-2026.pdf";
const polyuCalculatorUrl = "https://www.polyu.edu.hk/study/ug/admissions/jupas/jupas-score-calculator";
const polyuStatisticsUrl = "https://www.polyu.edu.hk/saso/docdrive/jupas/admission_figures.pdf";
const lingnanFormulaUrl = "https://www.ln.edu.hk/admissions/ug/f/upload/629/3362/Admission%20Requirements_JUPAS%20(UG%20Website)%2026-27.pdf";
const hkmuCalculatorUrl = "https://admissions.hkmu.edu.hk/ug/jupas/";
const hkmuCalculatorScriptUrl = "https://admissions.hkmu.edu.hk/wp-content/litespeed/js/3cc6ae26f09834b910cf2b8c5353d65d.js?ver=1e1e9";
const cityuAdmissionsUrl = "https://www.cityu.edu.hk/admo/admissions/jupas";

const categoryAGradePoints = {
  "5**": 8.5, "5*": 7, "5": 5.5, "4": 4, "3": 3, "2": 2, "1": 1, "U": 0,
};
const hkustGradePoints = {
  "5**": 8.5, "5*": 7, "5": 5.5, "4": 4, "3": 3, "2": 2, "1": 0, "U": 0,
};
const hkustLanguagePoints = {
  French: { A2: 3, B1: 4, B2: 5.5, C1: 7, C2: 8.5 },
  German: { A2: 3, B1: 4, B2: 5.5, C1: 7, C2: 8.5 },
  Japanese: { N3: 3, N2: 5.5, N1: 8.5 },
  Korean: { "Level 3": 3, "Level 4": 4, "Level 5": 5.5, "Level 6": 8.5 },
  Spanish: { A2: 3, B1: 4, B2: 5.5, C1: 7, C2: 8.5 },
  Urdu: { E: 1, D: 2, C: 3, B: 3, "B+": 4, "B++": 5.5, A: 7, "A+": 7, "A++": 8.5 },
};
const hkuLanguagePoints = {
  French: { A2: 4, B1: 5.5, B2: 7, C1: 8.5, C2: 8.5 },
  German: { A2: 4, B1: 5.5, B2: 7, C1: 8.5, C2: 8.5 },
  Japanese: { N3: 4, N2: 7, N1: 8.5 },
  Korean: { "Level 3": 4, "Level 4": 5.5, "Level 5": 7, "Level 6": 8.5 },
  Spanish: { A2: 4, B1: 5.5, B2: 7, C1: 8.5, C2: 8.5 },
  Urdu: { E: 1, D: 2, C: 3, B: 4, "B+": 5.5, "B++": 7, A: 8.5, "A+": 8.5, "A++": 8.5 },
};
const lingnanGradePoints = {
  "5**": 7, "5*": 6, "5": 5, "4": 4, "3": 3, "2": 2, "1": 1, U: 0,
};
const lingnanLanguagePoints = {
  French: { A2: 4, B1: 5, B2: 6, C1: 7, C2: 7 },
  German: { A2: 4, B1: 5, B2: 6, C1: 7, C2: 7 },
  Japanese: { N1: 7, N2: 5, N3: 4 },
  Korean: { "Lv3": 4, "Lv4": 5, "Lv5": 6, "Lv6": 7 },
  Spanish: { A2: 4, B1: 5, B2: 6, C1: 7, C2: 7 },
  Urdu: { A: 7, "A+": 7, "A++": 7, B: 4, "B+": 5, "B++": 6 },
};
const lingnanWeights = {
  JS7101: { Chinese: 1.5, English: 1.5, "Literature in Chinese": 1.5, "Chinese History": 1.5 },
  JS7133: { Chinese: 2, English: 2, "Technology and Living": 1.5, "Visual Arts": 1.5 },
  JS7204: { Chinese: 1.5, English: 2, "Literature in Chinese": 1.5, "Literature in English": 1.5 },
  JS7503: { Chinese: 1.5, English: 2.5, "Literature in English": 1.5 },
  JS7606: { Chinese: 1.5, English: 2 },
  JS7709: { Chinese: 1.5, English: 2, "Chinese History": 1.2, History: 1.2 },
  JS7802: { Chinese: 1.5, English: 2, Mathematics: 1.5, "Ethics and Religious Studies": 1.5 },
  JS7905: { Chinese: 2, English: 2, ICT: 1.5, "Visual Arts": 1.5 },
  JS7211: { English: 2, Mathematics: 2, M1: 1.5, M2: 1.5, Economics: 1.5, "Business, Accounting and Financial Studies": 1.5, ICT: 1.5 },
  JS7212: { English: 2, Mathematics: 2, M1: 1.5, M2: 1.5, Economics: 1.5, "Business, Accounting and Financial Studies": 1.5, ICT: 1.5 },
  JS7213: { English: 2, Mathematics: 2, M1: 1.5, M2: 1.5, Economics: 1.5, "Business, Accounting and Financial Studies": 1.5, ICT: 1.5 },
  JS7214: { English: 2, Mathematics: 2, M1: 1.5, M2: 1.5, Economics: 1.5, "Business, Accounting and Financial Studies": 1.5, ICT: 1.5 },
  JS7215: { English: 2, Mathematics: 2, M1: 1.5, M2: 1.5, Economics: 1.5, "Business, Accounting and Financial Studies": 2, ICT: 1.5 },
  JS7216: { English: 2, Mathematics: 2, M1: 1.5, M2: 1.5, Economics: 1.5, "Business, Accounting and Financial Studies": 1.5, ICT: 1.5 },
  JS7301: { English: 2, Mathematics: 1.5, M1: 1.5, M2: 1.5, Economics: 1.5, "Business, Accounting and Financial Studies": 1.5, ICT: 1.5 },
  JS7302: { English: 2, Mathematics: 1.5, M1: 1.5, M2: 1.5, "Chinese History": 1.5, Geography: 1.5, History: 1.5 },
  JS7303: { English: 2, Mathematics: 1.5 },
  JS7304: { English: 2, Mathematics: 1.5 },
  JS7305: { English: 1.5, "Health Management and Social Care": 1.5 },
  JS7306: { English: 2, Mathematics: 1.5 },
  JS7307: { English: 2, Mathematics: 1.5, M1: 1.5, M2: 1.5, ICT: 1.5 },
  JS7123: {
    English: 2, Mathematics: 1.5, M1: 1.5, M2: 1.5, Economics: 1.25, Geography: 1.5,
    "Tourism and Hospitality Studies": 1.25, Biology: 1.25, Chemistry: 1.25, Physics: 1.25,
    "Business, Accounting and Financial Studies": 1.25, "Design and Applied Technology": 1.25,
    "Health Management and Social Care": 1.25, ICT: 1.25, "Technology and Living": 1.25,
  },
  JS7225: { English: 2, Mathematics: 2, M1: 2, M2: 2, Chemistry: 1.5, Physics: 1.5, ICT: 2 },
};
const lingnanSubjectAliases = {
  "Literature in Chinese": ["Literature in Chinese", "Chinese Literature"],
  "Business, Accounting and Financial Studies": [
    "Business, Accounting and Financial Studies",
    "Business, Accounting and Financial Studies (Accounting)",
    "Business, Accounting and Financial Studies (Business Management)",
  ],
  "Technology and Living": [
    "Technology and Living (Fashion, Clothing and Textiles)",
    "Technology and Living (Food Science and Technology)",
  ],
};
const hkmuGradePoints = {
  "5**": 7, "5*": 6, "5": 5, "4": 4, "3": 3, "2": 2, "1": 0, U: 0,
};
const hkmuCategoryBPoints = {
  Attained: 2,
  "Attained with Distinction": 3,
  "Attained with Distinction (I)": 3,
  "Attained with Distinction (II)": 4,
};
const hkmuLanguagePoints = {
  French: { A2: 3, B1: 4, B2: 5, C1: 6, C2: 7 },
  German: { A2: 3, B1: 4, B2: 5, C1: 6, C2: 7 },
  Japanese: { N1: 7, N2: 5, N3: 4 },
  Korean: { G3: 4, G4: 5, G5: 6, G6: 7 },
  Spanish: { A2: 3, B1: 4, B2: 5, C1: 6, C2: 7 },
  Urdu: { A: 7, "A+": 7, "A++": 7, B: 5, "B+": 5, "B++": 6, C: 4, D: 3, E: 2 },
};
const hkmuWeights = {
  JS9011: { Chinese: 2 },
  JS9013: { Chinese: 1.5, English: 1.5 },
  JS9016: { Chinese: 1.5, English: 1.5 },
  JS9520: { Chinese: 2 },
  JS9530: { English: 2 },
  JS9540: { English: 2 },
  JS9550: { Chinese: 2, "Literature in Chinese": 2, "Chinese Literature": 2 },
  JS9555: { Chinese: 2, English: 2 },
  JS9560: { Chinese: 2, "Literature in Chinese": 2, "Chinese Literature": 2 },
  JS9580: { "Child Care and Education": 2, "Child Care and Development": 2 },
};
const hkmuProgrammeCodes = [
  "JS9009", "JS9010", "JS9011", "JS9013", "JS9016", "JS9019", "JS9210", "JS9220",
  "JS9230", "JS9240", "JS9262", "JS9266", "JS9276", "JS9280", "JS9291", "JS9294",
  "JS9520", "JS9530", "JS9540", "JS9550", "JS9560", "JS9580", "JS9719", "JS9720",
  "JS9731", "JS9732", "JS9733", "JS9776",
];
const hkmuMutuallyExclusive = [
  ["M1", "M2"],
  ["Biology", "Combined Science: Biology + Chemistry", "Combined Science: Biology + Physics"],
  ["Chemistry", "Combined Science: Biology + Chemistry", "Combined Science: Physics + Chemistry"],
  ["Physics", "Combined Science: Biology + Physics", "Combined Science: Physics + Chemistry"],
  ["Combined Science: Biology + Chemistry", "Combined Science: Biology + Physics", "Combined Science: Physics + Chemistry"],
  [
    "Integrated Science", "Biology", "Chemistry", "Physics",
    "Combined Science: Biology + Chemistry", "Combined Science: Biology + Physics",
    "Combined Science: Physics + Chemistry",
  ],
  [
    "Business, Accounting and Financial Studies",
    "Business, Accounting and Financial Studies (Accounting)",
    "Business, Accounting and Financial Studies (Business Management)",
  ],
];
const hkmuInputExclusions = hkmuMutuallyExclusive.slice(1);

const hkuStatistics = {
  JS6004: [31, 29, 27], JS6016: [32, 31, 29], JS6028: [34, 25, 25], JS6042: [31, 31, 29],
  JS6236: null, JS6054: [39, 37, 36], JS6133: null, JS6286: [38, 34, 32], JS6298: [47, 45, 44],
  JS6755: [38, 38, 37], JS6767: [42, 41, 40], JS6781: [38, 37, 36], JS6793: [37, 35, 35],
  JS6808: [48, 47, 45], JS6846: [35, 35, 35], JS6860: [49, 48, 48], JS6884: [52, 51, 50],
  JS6896: [55, 54, 53], JS6107: [47, 46, 44], JS6066: [38, 36, 35], JS6080: [35, 35, 35],
  JS6092: [29, 27, 27], JS6119: [47, 45, 45], JS6157: [35, 35, 34], JS6303: [41, 40, 38],
  JS6315: [31, 31, 31], JS6339: [32, 31, 29], JS6353: [32, 29, 28], JS6365: null,
  JS6377: [35, 35, 34], JS6937: [34, 34, 32], JS6987: [32, 32, 31], JS6078: [41, 38, 36],
  JS6406: [36, 35, 35], JS6250: [35, 31, 29], JS6418: [38, 37, 36], JS6456: [45, 45, 44],
  JS6468: [28, 28, 26], JS6482: [35, 34, 33], JS6494: [41, 41, 41], JS6626: [51, 50, 48],
  JS6949: [41, 39, 38], JS6688: [46, 43, 42], JS6858: [59, 56, 54], JS6901: [42, 41, 39],
  JS6705: [31, 31, 29], JS6717: [31, 29, 28], JS6731: [28, 27, 26], JS6743: null,
  JS6810: [39, 38, 36], JS6925: [32, 31, 29], JS6200: [37, 35, 35], JS6224: [34, 32, 31],
  JS6248: [35, 34, 34], JS6729: [38, 36, 36], JS6779: [37, 36, 36], JS6999: [34, 33, 32],
  JS6274: [39, 38, 37], JS6822: [36, 33, 31], JS6602: [55, 53, 52],
};

const hkustStatistics = {
  JS5101: [44.63, 38.44, 35.25], JS5102: [66.94, 37.50, 35.63], JS5103: [66.94, 36.75, 34.50],
  JS5118: [66.94, 45.00, 43.88], JS5181: [66.94, 40.13, 38.28], JS5212: [80.33, 49.30, 48.30],
  JS5220: [89.25, 49.00, 48.00], JS5230: [80.33, 46.80, 45.88], JS5240: [80.33, 55.65, 53.94],
  JS5250: [80.33, 50.64, 48.88], JS5260: [80.33, 45.00, 43.80], JS5270: [75.86, 49.53, 47.35],
  JS5282: [75.86, 54.24, 50.84], JS5411: [58.01, 30.99, 30.30], JS5412: [66.94, 36.00, 35.50],
  JS5711: [75.86, 36.00, 35.28], JS5812: [62.48, 33.53, 32.05], JS5901: [75.86, 59.59, 57.77],
  JS5811: [66.94, 39.28, 37.13], JS5813: [71.40, 47.05, 44.85], JS5814: [66.94, 47.25, 46.69],
  JS5822: [66.94, 41.25, 40.03], JS5300: [62.48, 37.00, 36.90], JS5311: [62.48, 38.23, 36.90],
  JS5312: [66.94, 44.16, 43.31], JS5313: [62.48, 53.23, 50.79], JS5314: [62.48, 38.23, 37.04],
  JS5315: [62.48, 35.05, 35.05], JS5316: [62.48, 35.50, 35.40], JS5317: [62.48, 35.05, 35.05],
  JS5318: [62.48, 37.23, 35.82], JS5331: [66.94, 47.25, 45.75], JS5332: [66.94, 58.50, 57.38],
};

const fixed = (label, subject, weight = 1) => ({
  label, count: 1, subjects: [subject], weight, weightedEligible: false,
});
const best = (label, count, subjects = null, weights = {}) => ({ label, count, subjects, weights });
const core = (label, subject, weight = 2) => fixed(label, subject, weight);
const hkuFormulaModel = (formula, weighting) => {
  const clean = formula.replace(/[¹²³⁴⁵⁶⁷⁸⁹#%^]/g, "")
    .replace(/\s+/g, " ").replace(/\b6\s+th\b/gi, "6th").replace(/\b7\s+th\b/gi, "7th").trim();
  const groups = [];
  const sourceWeights = weighting ?? {};
  const allWeighted = clean.includes("with Weighting");
  const parseSubjects = (text) => {
    const names = {
      Eng: "English", English: "English", Chin: "Chinese", Chinese: "Chinese",
      Math: "Mathematics", Mathematics: "Mathematics", "M1": "M1", "M2": "M2",
      Biology: "Biology", Chemistry: "Chemistry", Physics: "Physics", ICT: "ICT",
      "Information and Communication Technology": "ICT",
    };
    return text.split(/\s*(?:\/| or )\s*/i).map((name) => names[name.trim()]).filter(Boolean);
  };
  const parseTerm = (term) => {
    const value = term.trim();
    let match = value.match(/^(?:(\d+(?:\.\d+)?)\s*x\s*)?Best\s+of\s+(.+?)\s+with\s+Weighting/i);
    if (match) return best("指定科目最佳", 1, parseSubjects(match[2]), sourceWeights);
    match = value.match(/^(?:(\d+(?:\.\d+)?)\s*x\s*)?Best\s+(\d+)\s+from\s+(.+)/i);
    if (match) return best("指定科目最佳", Number(match[2]), parseSubjects(match[3]), match[1] ? Object.fromEntries(parseSubjects(match[3]).map((s) => [s, Number(match[1])])) : {});
    match = value.match(/^(?:(\d+(?:\.\d+)?)\s*x\s*)?Best\s+Sci\s+Subject/i);
    if (match) return best("最佳理科", 1, ["Biology", "Chemistry", "Physics"], match[1] ? Object.fromEntries(["Biology", "Chemistry", "Physics"].map((s) => [s, Number(match[1])])) : {});
    match = value.match(/^(?:(\d+(?:\.\d+)?)\s*x\s*)?Best\s+Remaining\s+Subject(?:\s+with\s+Weighting)?/i);
    if (match) return best("其餘最佳科目", 1, null, sourceWeights);
    match = value.match(/^(?:(\d+(?:\.\d+)?)\s*x\s*)?Best\s+(\d+)\s+Subjects?(?:\s+with\s+Weighting)?/i);
    if (match) return best(`最佳 ${match[2]} 科`, Number(match[2]), null, allWeighted || /with Weighting/i.test(value) ? sourceWeights : {});
    match = value.match(/^(?:(\d+(?:\.\d+)?)\s*x\s*)?Best\s+of\s+(.+)/i);
    if (match) return best("指定科目最佳", 1, parseSubjects(match[2]), match[1] ? Object.fromEntries(parseSubjects(match[2]).map((s) => [s, Number(match[1])])) : {});
    match = value.match(/^(?:(\d+(?:\.\d+)?)\s*x\s*)?(?:(\d+)\s*x\s*)?(.+)$/i);
    if (match) {
      const factor = Number(match[1] ?? match[2] ?? 1);
      const subjects = parseSubjects(match[3]);
      if (subjects.length === 1 && ["English", "Chinese", "Mathematics"].includes(subjects[0])) {
        return fixed(subjects[0], subjects[0], factor);
      }
      if (subjects.length && subjects.every((subject) => ["Mathematics", "M1", "M2"].includes(subject))) {
        return best("數學延伸科目", 1, subjects, Object.fromEntries(subjects.map((subject) => [subject, factor])));
      }
    }
    match = value.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+)(?:st|nd|rd|th)\s+Best\s+Subject/i);
    if (match) return { ...best(`${match[2]}th 最佳科`, 1), weight: Number(match[1]) };
    return null;
  };

  for (const term of clean.split(/\s*\+\s*/)) {
    const group = parseTerm(term);
    if (!group) return null;
    groups.push(group);
  }
  return groups;
};

const c = (subject, count, weights = {}) => best(subject, count, null, weights);
const science = ["Biology", "Chemistry", "Physics"];
const hkustCommon = (formulaText, groups, baseMax, {
  categoryC = false, maxWeightedElectives, requirements = [], alternatives, mutuallyExclusive = [],
} = {}) => ({
  verified: true,
  calculatorSupported: true,
  cycle: "2027/28",
  formulaText,
  gradePoints: hkustGradePoints,
  languagePoints: hkustLanguagePoints,
  categoryCLimit: categoryC ? 1 : 0,
  groups,
  alternatives,
  mutuallyExclusive,
  maxWeightedElectives,
  bonus: {
    kind: "sixthSubjectPercentage",
    baseMax,
    gradePercentages: { "5**": 0.05, "5*": 0.05 * 7 / 8.5, "5": 0.05 * 5.5 / 8.5, "4": 0.05 * 4 / 8.5, "3": 0.05 * 3 / 8.5 },
    languagePercentages: { 8.5: 0.05, 7: 0.05 * 7 / 8.5, 5.5: 0.05 * 5.5 / 8.5, 4: 0.05 * 4 / 8.5, 3: 0.05 * 3 / 8.5 },
  },
  sourceUrl: hkustFormulaUrl,
  conversionSourceUrl: hkustConversionUrl,
  bonusSourceUrl: hkustBonusUrl,
  requirements,
});

const hkustProgrammes = {};
const addHkust = (codes, formula, groups, baseMax, options) => {
  for (const code of codes) hkustProgrammes[code] = hkustCommon(formula, groups, baseMax, options);
};
const businessBase = () => [core("英文 x 2", "English"), core("數學 x 2", "Mathematics"), c("其餘最佳 3 科", 3)];
const businessAlternative = () => [
  core("英文 x 2", "English"), core("數學 x 2", "Mathematics"),
  best("加權指定選修", 1, ["Chemistry", "Economics", "Physics", "M1", "M2"], { Chemistry: 1.5, Economics: 1.5, Physics: 1.5, M1: 1.5, M2: 1.5 }),
  c("其餘最佳 2 科", 2),
];

addHkust(["JS5101"], "English + Math + Best 2 from Biology / Chemistry / Physics / M1 / M2 + Best 1 other subject", [
  fixed("英文", "English", 1), fixed("數學", "Mathematics", 1),
  best("理科／數學延伸科目", 2, [...science, "M1", "M2"]),
  c("其餘最佳科目", 1),
], 42.5);

const scienceA = [
  fixed("英文 x 1.5", "English", 1.5), fixed("數學", "Mathematics", 1),
  best("加權理科／數學延伸科目", 1, [...science, "M1", "M2"], { Physics: 2, M1: 2, M2: 2, Biology: 1.5, Chemistry: 1.5 }),
  best("其餘最佳 2 科", 2, null, { Biology: 1.5, Chemistry: 1.5, Physics: 2, M1: 2, M2: 2 }),
];
const scienceB = [
  fixed("英文 x 1.5", "English", 1.5), fixed("數學", "Mathematics", 1),
  best("加權理科／數學延伸科目", 1, [...science, "M1", "M2"], { Biology: 2, Chemistry: 2, Physics: 1.5, M1: 1.5, M2: 1.5 }),
  best("其餘最佳 2 科", 2, null, { Biology: 2, Chemistry: 2, Physics: 1.5, M1: 1.5, M2: 1.5 }),
];
addHkust(["JS5102", "JS5181"], "English x 1.5 + Math + Best from Biology / Chemistry / Physics / M1 / M2 + Best 2 other subjects", scienceA, 63.75, { maxWeightedElectives: 2 });
addHkust(["JS5103", "JS5118"], "English x 1.5 + Math + Best from Biology / Chemistry / Physics / M1 / M2 + Best 2 other subjects", scienceB, 63.75, {
  maxWeightedElectives: 2, categoryC: true,
  requirements: ["JS5103：生物、化學、物理、M1 或 M2 至少一科達指定級別；請按官方課程要求確認。"],
});

const engGroup = (weights, otherWeights = { M1: 2, M2: 2 }) => [
  core("英文 x 2", "English"), core("數學 x 2", "Mathematics"),
  best("指定加權科目", 1, ["Biology", "Chemistry", "Physics", "ICT"], weights),
  best("其餘最佳 2 科", 2, null, otherWeights),
];
addHkust(["JS5212"], "English x 2 + Math x 2 + Best from Biology / Chemistry / Physics / ICT + Best 2 other subjects", engGroup({ Physics: 2, ICT: 1.5, Biology: 1, Chemistry: 1 }), 76.5, {
  mutuallyExclusive: [["M1", "M2"]],
});
addHkust(["JS5220"], "English x 2 + Math x 2 + Best from Biology / Chemistry / Physics / ICT + Best 2 other subjects", engGroup({ Biology: 2, Chemistry: 2, Physics: 2, ICT: 1.5 }), 85);
addHkust(["JS5230"], "English x 2 + Math x 2 + Best from Biology / Chemistry / Physics / ICT + Best 2 other subjects", engGroup({ Chemistry: 2, Physics: 2, ICT: 1.5, Biology: 1 }), 76.5, {
  mutuallyExclusive: [["M1", "M2"]],
});
addHkust(["JS5240", "JS5250"], "English x 2 + Math x 2 + Best from Biology / Chemistry / Physics / ICT + Best 2 other subjects", engGroup({ Biology: 2, Chemistry: 2, Physics: 2, ICT: 1.5 }), 76.5, {
  categoryC: true,
  requirements: ["生物、化學、物理或資訊及通訊科技須符合官方特定科目要求。"],
  mutuallyExclusive: [["M1", "M2"]],
});
addHkust(["JS5260"], "English x 2 + Math x 2 + Best from Biology / Chemistry / Physics / ICT + Best 2 other subjects", engGroup({ Biology: 2, Chemistry: 2, Physics: 2, ICT: 1 }, { M1: 2, M2: 2 }), 76.5, {
  mutuallyExclusive: [["M1", "M2"]],
});
addHkust(["JS5270", "JS5282"], "English x 2 + Math x 2 + Best from Biology / Chemistry / Physics / ICT + Best 2 other subjects", engGroup({ Biology: 2, Chemistry: 2, Physics: 2, ICT: 1.5 }, { M1: 1.5, M2: 1.5 }), 72.25, {
  mutuallyExclusive: [["M1", "M2"]],
});

addHkust(["JS5300", "JS5311", "JS5313", "JS5314", "JS5315", "JS5316", "JS5317", "JS5318"],
  "English x 2 + Math x 2 + Best 3 other subjects", businessBase(), 59.5,
  { requirements: ["科大商學院課程沒有指定的特定選修科目。"] });
addHkust(["JS5312", "JS5331", "JS5332"],
  "English x 2 + Math x 2 + the better of Best 3 other subjects OR Best of Chemistry / Economics / Physics / M1 / M2 x 1.5 + Best 2 other subjects",
  [], 63.75, {
    alternatives: [businessBase(), businessAlternative()],
    requirements: ["商學院課程；特定科目及選科要求以官方課程頁為準。"],
  });
for (const code of ["JS5411"]) {
  addHkust([code], "English x 2 + Chinese x 1.5 + Best 3 other subjects", [
    core("英文 x 2", "English"), fixed("中文 x 1.5", "Chinese", 1.5), c("其餘最佳 3 科", 3),
  ], 55.25, { categoryC: true, requirements: ["Category C 科目達 Level 3 或以上可按官方規則作第二選修科考慮。"] });
}
addHkust(["JS5412"], "English x 2 + Math x 2 + Best 3 other subjects", [
  core("英文 x 2", "English"), core("數學 x 2", "Mathematics"),
  c("其餘最佳 3 科", 3, { M1: 1.5, M2: 1.5 }),
], 63.75, { categoryC: true, mutuallyExclusive: [["M1", "M2"]] });

addHkust(["JS5711"], "English x 2 + Math x 2 + Best from Biology / Chemistry / Physics / Design and Applied Technology / ICT + Best 2 other subjects", [
  core("英文 x 2", "English"), core("數學 x 2", "Mathematics"),
  best("指定加權科目", 1, [...science, "Design and Applied Technology", "ICT"], {
    Biology: 2, Chemistry: 2, Physics: 2, "Design and Applied Technology": 2, ICT: 1,
  }),
  c("其餘最佳 2 科", 2, { M1: 1.5, M2: 1.5 }),
], 72.25, {
  categoryC: true, requirements: ["生物、化學、物理、設計與應用科技或資訊及通訊科技須符合官方特定科目要求。"],
  mutuallyExclusive: [["M1", "M2"]],
});

const liberalStudiesFormula = (label = "最佳 3 其他科", weights = {}) => [
  core("英文 x 2", "English"), core("數學 x 2", "Mathematics"),
  c(label, 3, weights),
];
addHkust(["JS5712", "JS5812"], "English x 2 + Math x 2 + Best 3 other subjects", liberalStudiesFormula(), 59.5, { categoryC: true });
addHkust(["JS5901"], "English x 2 + Math x 2 + Best from Biology / Chemistry / Physics / ICT + Best 2 other subjects", engGroup({ Biology: 2, Chemistry: 2, Physics: 2, ICT: 1 }, { M1: 1.5, M2: 1.5 }), 72.25, {
  categoryC: true,
  requirements: ["生物、化學、物理或資訊及通訊科技須符合官方特定科目要求。"],
  mutuallyExclusive: [["M1", "M2"]],
});
addHkust(["JS5811"], "English x 2 + Math x 2 + Best of Biology / Chemistry x 1.5 + Best 2 other subjects", [
  core("英文 x 2", "English"), core("數學 x 2", "Mathematics"),
  best("生物／化學最佳科", 1, ["Biology", "Chemistry"], { Biology: 1.5, Chemistry: 1.5 }),
  c("其餘最佳 2 科", 2),
], 63.75, { categoryC: true, requirements: ["生物或化學須符合官方特定科目要求。"] });
addHkust(["JS5813"], "English x 2 + Math x 2 + Best from Biology / Chemistry / Physics / Economics / M1 / M2 + Best 2 other subjects", [
  core("英文 x 2", "English"), core("數學 x 2", "Mathematics"),
  best("指定加權科目", 1, ["Biology", "Chemistry", "Physics", "Economics", "M1", "M2"], {
    Biology: 1.5, Chemistry: 1.5, Physics: 1.5, Economics: 1.5, M1: 2, M2: 2,
  }),
  c("其餘最佳 2 科", 2),
], 68, { categoryC: true, requirements: ["生物、化學、物理、經濟、M1 或 M2 須符合官方特定科目要求。"] });
addHkust(["JS5814"], "English x 2 + Math x 2 + Best 3 other subjects", liberalStudiesFormula("最佳 3 其他科", { M1: 1.5, M2: 1.5 }), 63.75, {
  categoryC: true, mutuallyExclusive: [["M1", "M2"]],
});
addHkust(["JS5822"], "English x 2 + Math x 2 + the better of Best 3 other subjects OR Best of Chemistry / Economics / Physics / M1 / M2 x 1.5 + Best 2 other subjects",
  [], 63.75, { alternatives: [businessBase(), businessAlternative()], categoryC: true });

const subjectCodes = {
  AENGL: "English", ACHIN: "Chinese", AMATH: "Mathematics", ACTSD: "CSD",
  AMTH1: "M1", AMTH2: "M2", ABIOL: "Biology", ACHEM: "Chemistry", APHYS: "Physics",
  ACSCI: "Combined Science", AISCI: "Integrated Science", AINCT: "ICT",
  ADATE: "Design and Applied Technology", AECON: "Economics", AGEOG: "Geography",
  ABAFS: "Business, Accounting and Financial Studies (Business Management)",
  ACHIH: "Chinese History", ACHLT: "Literature in Chinese", AENLT: "Literature in English",
  AERST: "Ethics and Religious Studies", AHIST: "History", AHMSC: "Health Management and Social Care",
  AMUSC: "Music", APHED: "Physical Education", ATHST: "Tourism and Hospitality Studies",
  ATLCT: "Technology and Living (Fashion, Clothing and Textiles)",
  ATLFS: "Technology and Living (Food Science and Technology)", AVIAR: "Visual Arts",
};

function decodeHtml(value) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hkuTables(html, className) {
  const table = html.match(new RegExp(`<table\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/table>`, "i"))?.[1];
  if (!table) return [];
  return [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(([, row]) =>
    [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(([, cell]) => decodeHtml(cell)));
}

function getHkuWeighting(html) {
  const rows = hkuTables(html, "table-style-2");
  const result = {};
  for (const [factor, subjects] of rows) {
    const parsedFactor = Number(factor.match(/[\d.]+/)?.[0]);
    if (!Number.isFinite(parsedFactor)) continue;
    const names = {
      "Chinese Language": "Chinese", "English Language": "English", Mathematics: "Mathematics",
      Biology: "Biology", Chemistry: "Chemistry", Physics: "Physics",
      "Mathematics Extended Part (Module 1 or 2)": "M1",
      "Information and Communication Technology": "ICT", ICT: "ICT",
    };
    for (const name of subjects.split(/\s*\/\s*/)) if (names[name]) result[names[name]] = parsedFactor;
    if (/Module 1 or 2/i.test(subjects)) result.M2 = parsedFactor;
  }
  return result;
}

function buildCuhkGroups(formula) {
  if (!formula) return null;
  const groups = [];
  for (const term of formula.split("+")) {
    const value = term.trim();
    const match = value.match(/^Best\((\d+)(?:,\[([^\]]+)\])?\)$/);
    if (match) {
      groups.push({
        label: match[2] ? "指定科目最佳" : `最佳 ${match[1]} 科`,
        count: Number(match[1]),
        subjects: match[2] ? match[2].split(",").map((key) => subjectCodes[key]).filter(Boolean) : null,
      });
    } else if (subjectCodes[value]) {
      groups.push({ label: subjectCodes[value], count: 1, subjects: [subjectCodes[value]] });
    } else {
      return null;
    }
  }
  return groups;
}

function cuhkWeights(value) {
  const subjectWeights = {};
  const weightedSelections = [];
  if (!value) return { subjectWeights, weightedSelections };
  for (const part of value.split(",")) {
    const group = part.match(/^Best\((\d+),\[([^\]]+)\]\):([\d.]+)$/);
    if (group) {
      weightedSelections.push({
        count: Number(group[1]),
        subjects: group[2].split(",").map((key) => subjectCodes[key]).filter(Boolean),
        weight: Number(group[3]),
      });
      continue;
    }
    const direct = part.match(/^([^:]+):([\d.]+)$/);
    if (direct && subjectCodes[direct[1]]) subjectWeights[subjectCodes[direct[1]]] = Number(direct[2]);
  }
  return { subjectWeights, weightedSelections };
}

function cuhkRequirements(record) {
  const requirements = [];
  const coreSubjects = { CHI: "中文", ENG: "英文", MATH: "數學" };
  for (const [key, level] of Object.entries(record.requirement ?? {})) {
    if (key === "ELECT") continue;
    if (coreSubjects[key] && level) requirements.push(`${coreSubjects[key]}最低第 ${level} 級`);
  }
  for (const elective of record.requirement?.ELECT ?? []) {
    const subject = elective.subject === "*" ? "選修科目" : subjectCodes[elective.subject] ?? elective.subject;
    requirements.push(`${subject}最低第 ${elective.score} 級`);
  }
  for (const value of [record.subject_1_text, record.subject_2_text, record.requirement_remarks, record.remarks]) {
    if (value && value !== "--" && value !== "*" && !requirements.includes(value)) requirements.push(value);
  }
  return requirements;
}

const polyuSubjectAliases = {
  "Chinese Language": "Chinese",
  "English Language": "English",
  "Mathematics (Extended part - Algebra and Calculus)": "M2",
  "Mathematics (Extended part - Calculus and Statistics)": "M1",
  "Information and Communication Technology": "ICT",
};
const polyuLanguageNames = ["French", "German", "Japanese", "Korean", "Spanish", "Urdu"];
const polyuSubjectKey = (name) => polyuSubjectAliases[name] ?? name;
const polyuLanguageName = (name) => polyuLanguageNames.find((language) => name.startsWith(`${language}:`));
const polyuPoints = (rows = []) => Object.fromEntries(rows.map(({ level, value }) => [level, Number(value)]));
const hkbuCalculatorBase = "https://admissions.hkbu.edu.hk/content/ao/en/admissions/hkdse/jcr:content/root/layoutcontainer/layoutcontainer_455887786/layoutcontainer_1886/";
const hkbuProgrammeCodes = [
  "JS2020", "JS2025", "JS2610", "JS2620", "JS2660", "JS2940", "JS2960", "JS2110", "JS2120",
  "JS2910", "JS2410", "JS2420", "JS2310", "JS2370", "JS2030", "JS2050", "JS2330", "JS2340",
  "JS2810", "JS2920", "JS2930", "JS2510", "JS2950",
];
const hkbuSubjectAliases = {
  "BIOLOGY": "Biology",
  "CHEMISTRY": "Chemistry",
  "CHINESE LANGUAGE": "Chinese",
  "CHINESE HISTORY": "Chinese History",
  "CHINESE LITERATURE": "Literature in Chinese",
  "DESIGN AND APPLIED TECHNOLOGY": "Design and Applied Technology",
  "ECONOMICS": "Economics",
  "ETHICS AND RELIGIOUS STUDIES": "Ethics and Religious Studies",
  "ENGLISH LANGUAGE": "English",
  "GEOGRAPHY": "Geography",
  "HISTORY": "History",
  "HEALTH MANAGEMENT AND SOCIAL CARE": "Health Management and Social Care",
  "INTEGRATED SCIENCE": "Integrated Science",
  "LITERATURE IN ENGLISH": "Literature in English",
  "MATHEMATICS COMPULSORY PART": "Mathematics",
  "MATHEMATICS EXTENDED PART (CALCULUS AND STATISTICS)": "M1",
  "MATHEMATICS EXTENDED PART (ALGEBRA AND CALCULUS)": "M2",
  "MUSIC": "Music",
  "PHYSICAL EDUCATION": "Physical Education",
  "PHYSICS": "Physics",
  "INFORMATION AND COMMUNICATION TECHNOLOGY": "ICT",
  "COMBINED SCIENCE (BIOLOGY, CHEMISTRY)": "Combined Science: Biology + Chemistry",
  "COMBINED SCIENCE (BIOLOGY, PHYSICS)": "Combined Science: Biology + Physics",
  "COMBINED SCIENCE (CHEMISTRY, PHYSICS)": "Combined Science: Physics + Chemistry",
  "BUSINESS, ACCOUNTING AND FINANCIAL STUDIES": "Business, Accounting and Financial Studies",
  "BUSINESS, ACCOUNTING AND FINANCIAL STUDIES (ACCOUNTING)": "Business, Accounting and Financial Studies (Accounting)",
  "BUSINESS, ACCOUNTING AND FINANCIAL STUDIES (BUSINESS MANAGEMENT)": "Business, Accounting and Financial Studies (Business Management)",
  "LITERATURE IN CHINESE": "Literature in Chinese",
  "TOURISM AND HOSPITALITY STUDIES": "Tourism and Hospitality Studies",
  "TECHNOLOGY AND LIVING (FASHION, CLOTHING AND TEXTILES)": "Technology and Living (Fashion, Clothing and Textiles)",
  "TECHNOLOGY AND LIVING (FOOD SCIENCE AND TECHNOLOGY)": "Technology and Living (Food Science and Technology)",
  "VISUAL ARTS": "Visual Arts",
};
const hkbuSubjectKey = (name) => hkbuSubjectAliases[name] ?? name;
const hkbuWeights = {
  JS2110: { English: 1.5 },
  JS2120: { English: 1.5 },
  JS2610: { English: 2 },
  JS2660: { English: 2, "Health Management and Social Care": 1.5 },
  JS2940: { English: 2, Mathematics: 1.5, M1: 1.5, M2: 1.5, "Health Management and Social Care": 1.5 },
  JS2960: {
    English: 1.5, Mathematics: 1.2, M1: 1.1, M2: 1.1, "Chinese History": 1.1, "Literature in Chinese": 1.1,
    "Literature in English": 1.1, "Ethics and Religious Studies": 1.1, Geography: 1.1,
    History: 1.1, "Design and Applied Technology": 1.1, ICT: 1.1,
    "Technology and Living (Fashion, Clothing and Textiles)": 1.1,
  },
  JS2310: { Chinese: 1.25, English: 1.25 },
  JS2330: { Chinese: 1.25, English: 1.25 },
  JS2370: { English: 1.25, Mathematics: 1.1, "Visual Arts": 1.15 },
  JS2340: { English: 1.5, Music: 1.2, "Visual Arts": 1.2 },
  JS2410: { Chinese: 1.5, English: 1.5, Biology: 1.5, Chemistry: 1.25 },
  JS2420: { English: 1.5, Mathematics: 1.25, Biology: 1.25, Chemistry: 1.5 },
  JS2920: { Mathematics: 1.2 },
  JS2950: { English: 1.25 },
};
const eduhkApLByProgramme = {
  JS8001: ["POPULAR MUSIC PRODUCTION"],
  JS8002: ["INTERIOR DESIGN", "INTERIOR AND EXHIBITION DESIGN"],
  JS8006: ["CHILD CARE AND DEVELOPMENT", "CHILD CARE AND EDUCATION"],
  JS8007: ["ACCOUNTING FOR E-BUSINESS"],
  JS8008: ["AI IN BUSINESS", "COMPUTER GAME AND ANIMATION DESIGN"],
  JS8009: ["AI AND ROBOTICS", "COMPUTER FORENSIC TECHNOLOGY", "TECH BASICS"],
  JS8013: ["INNOVATION AND ENTREPRENEURSHIP", "CHILD CARE AND DEVELOPMENT", "CHILD CARE AND EDUCATION"],
  JS8685: ["POPULAR MUSIC PRODUCTION"],
  JS8686: ["INTERIOR DESIGN", "INTERIOR AND EXHIBITION DESIGN"],
  JS8507: ["CHILD CARE AND DEVELOPMENT", "CHILD CARE AND EDUCATION"],
  JS8687: [
    "POPULAR MUSIC PRODUCTION", "TAKING A CHANCE ON DANCE", "THE ESSENTIALS OF THEATRE ARTS",
    "DIGITAL BRAND COMMUNICATION", "DIGITAL MEDIA AND RADIO PRODUCTION",
    "FILM AND TRANSMEDIA", "FILM PRODUCTION", "CULTURAL AND CREATIVE PRODUCT DESIGN",
    "FASHION IMAGE DESIGN", "INTERIOR DESIGN", "INTERIOR AND EXHIBITION DESIGN",
    "COMPUTER GAME AND ANIMATION DESIGN", "DIGITAL COMIC DESIGN AND PRODUCTION",
    "DIGITAL ADVERTISING", "MULTIMEDIA STORYTELLING", "PR AND MULTIMEDIA COMMUNICATION",
  ],
  JS8714: [
    "COMPUTER GAME AND ANIMATION DESIGN", "DIGITAL COMIC DESIGN AND PRODUCTION", "AI IN BUSINESS",
    "DATA APPLICATION FOR BUSINESS", "INTRODUCTION TO FINTECH", "AI AND ROBOTICS",
    "COMPUTER FORENSIC TECHNOLOGY", "DIGITAL CONSTRUCTION",
    "ESPORTS TECHNOLOGY", "ESPORTS TECHNOLOGY AND MANAGEMENT", "TECH BASICS",
  ],
  JS8726: [
    "APPLIED PSYCHOLOGY", "SPORTS AND FITNESS COACHING", "EXERCISE AND FITNESS COACHING",
    "EXERCISE SCIENCE AND HEALTH FITNESS", "FOOD TECHNOLOGY AND NUTRITION",
    "MEDICAL LABORATORY SCIENCE", "PRACTICAL PSYCHOLOGY", "REHABILITATION CARE PRACTICE",
    "AI AND ROBOTICS", "ESPORTS TECHNOLOGY", "ESPORTS TECHNOLOGY AND MANAGEMENT",
  ],
};
const eduhkProgrammeDetails = {
  JS8001: { weights: { Music: 1.5 }, requirements: ["須通過音樂試演；DSE 音樂達 Level 4 可獲豁免。"] },
  JS8002: { weights: { "Visual Arts": 1.5 }, requirements: ["須通過實習測試；DSE 視覺藝術達 Level 4 可獲豁免。"] },
  JS8003: { weights: { Chinese: 1.5, English: 1.5, "Literature in Chinese": 1.5, ICT: 1.5 }, requirements: ["課程要求較高中文能力；DSE 中文要求不可替代。"] },
  JS8004: { weights: { English: 1.5, ICT: 1.5, "Literature in English": 1.5 }, requirements: ["課程要求較高英文能力；DSE 英文要求不可替代。"] },
  JS8005: { weights: { "Chinese History": 1.5, History: 1.5 }, requirements: ["課程要求較高中文能力；DSE 中文要求不可替代。"] },
  JS8006: { weights: {}, requirements: ["課程要求較高中文能力；DSE 中文要求不可替代。"] },
  JS8007: {
    weights: { Chinese: 1.5, English: 1.5 },
    requirements: ["指定選修一須為經濟或企業、會計與財務概論之一，並達 Level 3；選修二須達 Level 2。"],
    weightedSelections: [{
      count: 1,
      subjects: ["Business, Accounting and Financial Studies (Accounting)", "Business, Accounting and Financial Studies (Business Management)", "Economics", "Category B"],
      categoryBSubjects: eduhkApLByProgramme.JS8007,
      weight: 1.5,
    }],
  },
  JS8008: { weights: { Mathematics: 1.5, M1: 1.5, M2: 1.5, ICT: 1.5, Biology: 1.5, Chemistry: 1.5, Physics: 1.5, "Combined Science: Biology + Chemistry": 1.5, "Combined Science: Biology + Physics": 1.5, "Combined Science: Physics + Chemistry": 1.5, "Integrated Science": 1.5 }, requirements: ["指定選修一須為資訊及通訊科技、生物、化學或物理之一，並達 Level 3；選修二須達 Level 2。"] },
  JS8009: { weights: { Mathematics: 1.5, M1: 1.5, M2: 1.5, Physics: 1.5 }, requirements: ["數學須達 Level 3；資訊及通訊科技、生物、化學、物理或 M1/M2 須有一科達 Level 2；另一選修科須達 Level 2。"] },
  JS8010: { weights: { "Physical Education": 1.5 }, requirements: ["須通過筆試、體能測試及水試；優先考慮修讀 DSE 體育的申請人。"] },
  JS8011: { weights: { Biology: 1.5, Chemistry: 1.5, Physics: 1.2, Mathematics: 1.1, M1: 1.1, M2: 1.1, Geography: 1.1 }, requirements: ["生物、化學或物理須達 Level 3。"] },
  JS8012: { weights: { English: 1.5, Geography: 1.75 }, requirements: ["地理或旅遊與款待須達 Level 3。"] },
  JS8013: {
    weights: {},
    weightedSelections: [{
      count: 1,
      subjects: ["Chinese History", "Economics", "Geography", "History", "Category B"],
      categoryBSubjects: eduhkApLByProgramme.JS8013,
      weight: 1.5,
    }],
  },
  JS8651: { weights: {} },
  JS8663: { weights: { Chinese: 1.5, English: 1.5 } },
  JS8674: { weights: { Chinese: 1.5, "Literature in Chinese": 1.5, ICT: 1.5 }, requirements: ["課程要求較高中文能力；DSE 中文要求不可替代。中文文學達 Level 2 或以上者獲優先考慮。"] },
  JS8675: { weights: { English: 1.5, ICT: 1.5, "Literature in English": 1.5 }, requirements: ["英文學科要求不可替代；須通過試演，DSE 音樂達 Level 4 可獲豁免。"] },
  JS8685: { weights: { Music: 1.5 }, requirements: ["須通過音樂試演；DSE 音樂達 Level 4 可獲豁免。"] },
  JS8686: { weights: { "Visual Arts": 1.5 }, requirements: ["須通過實習測試；DSE 視覺藝術達 Level 4 可獲豁免。"] },
  JS8687: { weights: { Chinese: 1.5, English: 1.5, "Chinese History": 1.5, History: 1.5, "Design and Applied Technology": 1.5, "Visual Arts": 1.5 }, requirements: ["修讀歷史、中國歷史、視覺藝術或設計與應用科技者獲優先考慮。"] },
  JS8688: { weights: {} },
  JS8702: { weights: { Biology: 1.6, Chemistry: 1.6, Physics: 1.6, Mathematics: 1.4, M1: 1.4, M2: 1.4, Geography: 1.2 }, requirements: ["生物、化學、物理、地理、組合科學或綜合科學須有一科達 Level 2。"] },
  JS8714: { weights: { Mathematics: 1.5, M1: 1.5, M2: 1.5, Biology: 1.5, Chemistry: 1.5, Physics: 1.5, "Design and Applied Technology": 1.5, ICT: 1.5, "Combined Science: Biology + Chemistry": 1.5, "Combined Science: Biology + Physics": 1.5, "Combined Science: Physics + Chemistry": 1.5, "Integrated Science": 1.5 }, requirements: ["數學須達 Level 3；資訊及通訊科技、生物、化學、物理、組合科學、綜合科學或 M1/M2 須有一科達 Level 2；修讀超過一科列明選修者獲優先考慮。"] },
  JS8726: { weights: { Biology: 2, "Physical Education": 2, English: 1.5, Mathematics: 1.5, M1: 1.5, M2: 1.5, "Design and Applied Technology": 1.5, ICT: 1.5 } },
  JS8727: { weights: { Chinese: 1.5, English: 1.5 }, requirements: ["申請人須能流利使用粵語及英語溝通。"] },
  JS8507: { weights: { Chinese: 1.5, English: 1.5 }, requirements: ["中文及英文須達 Level 2，另三科須達 Level 2；公民與社會發展達標可代替三科之一的 Level 2 入學要求，但不計入分數。"] },
};
const eduhkCategoryC = {
  French: { C2: 7, C1: 6, B2: 5, B1: 4, A2: 3 },
  German: { C2: 7, C1: 6, B2: 5, B1: 4, A2: 3 },
  Spanish: { C2: 7, C1: 6, B2: 5, B1: 4, A2: 3 },
  Japanese: { N1: 7, N2: 5, N3: 4 },
  Korean: { "Level 6": 7, "Level 5": 6, "Level 4": 5, "Level 3": 4 },
  Urdu: { "A++": 7, "A+": 7, A: 7, "B++": 6, "B+": 5, B: 5, C: 4, D: 3, E: 2 },
};

function hkbuScoreModel(programme, code) {
  const scoreGroups = Object.fromEntries(programme.level_groups.map((group) => [
    group.level_group,
    Object.fromEntries(group.levels.map(({ subj_grade_desc: grade, grade_pt: points }) => [grade, Number(points)])),
  ]));
  const subjectChoices = [...new Set(programme.subjects
    .filter(({ subj_cat: category, type }) => category === "A" && type === "E")
    .map(({ subj_desc: name }) => hkbuSubjectKey(name)))];
  const categoryBSubjects = [...new Set(programme.subjects
    .filter(({ subj_cat: category, type }) => category === "B" && type === "E")
    .map(({ subj_desc: name }) => name))];
  const languageGroup = { French: "FN_GM_SP", German: "FN_GM_SP", Spanish: "FN_GM_SP", Hindi: "HIN_URD", Urdu: "HIN_URD", Japanese: "JAPN", Korean: "KORE" };
  const categoryCLanguages = [...new Set(programme.subjects
    .filter(({ subj_cat: category, type }) => category === "C" && type === "E")
    .map(({ subj_desc: name }) => {
      const upper = name.toLocaleUpperCase();
      return Object.keys(languageGroup).find((language) => upper.includes(language.toLocaleUpperCase()));
    })
    .filter(Boolean))];
  const languagePoints = Object.fromEntries(categoryCLanguages.map((language) => [
    language,
    scoreGroups[languageGroup[language]] ?? {},
  ]));
  const subjectWeights = hkbuWeights[code] ?? {};
  const cleanHtml = (value) => decodeHtml(String(value ?? "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, " "));
  const requirements = [
    programme.min_req && cleanHtml(programme.min_req) !== "Click here"
      ? `課程最低要求（官方計分器）：${cleanHtml(programme.min_req)}`
      : "",
    programme.subj_req ? `指定科目要求（官方計分器）：${cleanHtml(programme.subj_req)}` : "",
    ["JS2410", "JS2420"].includes(code) ? "一科選修科目必須為生物或化學。" : "",
  ].filter(Boolean);

  return {
    scoreModel: {
      verified: true,
      calculatorSupported: true,
      cycle: "2027/28",
      formulaText: "最佳五科（不包括公民與社會發展）；特定甲類科目按課程加權。",
      groups: [best("最佳五科", 5)],
      gradePoints: scoreGroups["CAT-A"],
      categoryBPoints: scoreGroups["CAT-B"],
      categoryBSubjects,
      languagePoints,
      categoryCLimit: categoryCLanguages.length ? 1 : 0,
      subjectWeights,
      subjectChoices,
      mutuallyExclusive: [
        ["M1", "M2"],
        ["Biology", "Combined Science: Biology + Chemistry", "Combined Science: Biology + Physics"],
        ["Chemistry", "Combined Science: Biology + Chemistry", "Combined Science: Physics + Chemistry"],
        ["Physics", "Combined Science: Biology + Physics", "Combined Science: Physics + Chemistry"],
        ["Business, Accounting and Financial Studies", "Business, Accounting and Financial Studies (Accounting)", "Business, Accounting and Financial Studies (Business Management)"],
        ["Category B", "Category C"],
      ],
      sourceUrl: "https://admissions.hkbu.edu.hk/admissions/hkdse.html",
      formulaDataUrl: "https://admissions.hkbu.edu.hk/content/dam/ao-assets/document/news/JUPAS_GER_PER.pdf",
      formulaRemarks: ["計分採最佳五科，CSD 不計分；丙類語言按官方 2025 年起換算表。"],
    },
    programmeRequirements: requirements,
  };
}

function eduhkScoreModel(code, allCategoryBSubjects) {
  const details = eduhkProgrammeDetails[code];
  if (!details) throw new Error(`EdUHK has no verified 2027 programme details for ${code}.`);
  const categoryBSubjects = [...new Set([
    ...allCategoryBSubjects,
    ...Object.values(eduhkApLByProgramme).flatMap((subjects) =>
      subjects.flatMap((subject) => subject.split(/\s*\/\s*/))),
  ])].filter((subject) => !/APPLIED LEARNING CHINESE/i.test(subject));
  const categoryBNames = new Map(categoryBSubjects.map((subject) => [subject.toLocaleUpperCase(), subject]));
  const subjectWeights = { ...details.weights };
  for (const sourceSubject of eduhkApLByProgramme[code] ?? []) {
    for (const name of sourceSubject.split(/\s*\/\s*/)) {
      const subject = categoryBNames.get(name.toLocaleUpperCase()) ?? name;
      subjectWeights[subject] = 1.5;
    }
  }
  const weightedSelections = details.weightedSelections?.map((selection) => ({
    ...selection,
    categoryBSubjects: selection.categoryBSubjects.map((subject) =>
      categoryBNames.get(subject.toLocaleUpperCase()) ?? subject),
  }));
  const programmeGeneralRequirements = code === "JS8507" ? {
    core: [
      { subject: "CHINESE LANGUAGE", level: "2" },
      { subject: "ENGLISH LANGUAGE", level: "2" },
    ],
    electives: [{ subject: "ANY 3 SUBJECTS", level: "2" }],
  } : null;
  const categoryBPoints = {
    "Attained with Distinction (II)": 4,
    "Attained with Distinction": 3,
    "Attained with Distinction (I)": 3,
    Attained: 0,
  };
  return {
    scoreModel: {
      verified: true,
      calculatorSupported: true,
      cycle: "2027/28",
      formulaText: "最佳五科（包括核心科及選修科；不包括公民與社會發展）。",
      groups: [best("最佳五科", 5)],
      gradePoints: { "5**": 7, "5*": 6, "5": 5, "4": 4, "3": 3, "2": 2, "1": 1, U: 0 },
      categoryBPoints,
      categoryBSubjects,
      categoryBLimit: 2,
      languagePoints: eduhkCategoryC,
      categoryCLimit: 1,
      subjectWeights,
      weightedSelections,
      sourceUrl: "https://www.eduhk.hk/acadprog/downloads/EdUHK_Entrance%20Requirements%20and%20Admission%20Score%20Calculation.pdf",
      formulaDataUrl: "https://www.eduhk.hk/acadprog/downloads/EdUHK_ApL%20Recognition%20and%20Subject%20Weightings.pdf",
      conversionSourceUrl: "https://www.eduhk.hk/acadprog/downloads/EdUHK_Entrance%20Requirements%20and%20Admission%20Score%20Calculation.pdf",
      formulaRemarks: [
        "甲類換算：5**=7、5*=6、5=5、4=4、3=3、2=2、1=1；乙類「達標」=0、「達標並取得優異」=3、「達標並取得優異（II）」=4。",
        "學士課程最多一科乙類科目可用作滿足選修科入學要求；高級文憑最多兩科。此為入學資格限制，計算器不判斷整體資格。",
        "指定乙類加權名單包括適用於 2027 入學的科目；2028 考試年度起適用的新科目不納入本週期。",
      ],
      requirements: details.requirements ?? [],
    },
    programmeRequirements: details.requirements ?? [],
    ...(programmeGeneralRequirements ? { programmeGeneralRequirements } : {}),
  };
}

function polyuScoreModel(programme, source) {
  const code = programme["JUPAS Code"];
  const subjects = source.data[code];
  if (!Array.isArray(subjects)) throw new Error(`PolyU has no official subject-weight data for ${code}.`);
  const scoreSubjects = subjects.filter(({ "Subject Category": category }) =>
    category === "Category A: Core and Elective Subjects");
  const subjectWeights = Object.fromEntries(scoreSubjects.map(({ "Subject Name": name, "Subject Weighting": weight }) =>
    [polyuSubjectKey(name), Number(weight)]));
  const categoryBSubjects = [...new Set(subjects
    .filter(({ "Subject Category": category }) => category === "Category B: Applied Learning Subjects")
    .map(({ "Subject Name": name }) => name))];
  const categoryCLanguages = [...new Set(subjects
    .filter(({ "Subject Category": category }) => category === "Category C: Other Language Subjects")
    .map(({ "Subject Name": name }) => polyuLanguageName(name))
    .filter(Boolean))];
  for (const subject of subjects.filter(({ "Subject Category": category }) =>
    category === "Category B: Applied Learning Subjects")) {
    subjectWeights[subject["Subject Name"]] = Number(subject["Subject Weighting"]);
  }
  for (const language of categoryCLanguages) {
    const languageSubject = subjects.find(({ "Subject Category": category, "Subject Name": name }) =>
      category === "Category C: Other Language Subjects" && name.startsWith(`${language}:`));
    subjectWeights[language] = Number(languageSubject["Subject Weighting"]);
  }

  const mechanism = programme["Admission Score Calculation Mechanism"];
  const polyuFixed = (label, subject) => best(label, 1, [subject]);
  const groups = /Any Best 6 Subjects/i.test(mechanism)
    ? [best("最佳六科", 6)]
    : /Chinese\s*&\s*English Languages/i.test(mechanism)
      ? [polyuFixed("中文", "Chinese"), polyuFixed("英文", "English"), best("其餘最佳三科", 3)]
      : /4 Core\s*\+\s*Best 2 Elective/i.test(mechanism)
        ? [polyuFixed("中文", "Chinese"), polyuFixed("英文", "English"), polyuFixed("數學", "Mathematics"), best("最佳兩科選修", 2)]
        : /Any Best 5 Subjects/i.test(mechanism)
          ? [best("最佳五科", 5)]
          : null;
  const hasBonus = /additional bonus score for the 6th/i.test(mechanism);
  const htmlText = (value) => String(value ?? "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, " ")
    .split(/\n+/).map((line) => decodeHtml(line.replace(/^\s*[-•]\s*/, ""))).filter(Boolean);
  const intakeText = String(programme["Intake Score"] ?? "");
  const referredCode = intakeText.match(/\b(?:for|of)\s+(JS\d{4})\b/i)?.[1]?.toUpperCase();
  const sameProgrammeStatistics = !referredCode || referredCode === code;
  const average = intakeText.match(/\bAverage Score:\s*([\d.]+)/i)?.[1];
  const lowerQuartile = intakeText.match(/\bLower Quartile:\s*([\d.]+)/i)?.[1];
  const weightingPdf = intakeText.match(/\((https:\/\/[^)\s]+\.pdf)\)/i)?.[1];
  const requirements = [
    ...htmlText(programme["Preferred Subjects"]).map((subject) => `優先科目：${subject}`),
    ...htmlText(programme["Relevant Subjects"]).map((subject) => `相關應用學習科目：${subject}`),
    ...htmlText(programme.Remarks),
  ];
  const validations = source.validations.map((group) => group.map(polyuSubjectKey)).filter((group) => group.length > 1);
  const gradePoints = polyuPoints(source.scores.core_subject);
  const languagePoints = Object.fromEntries(categoryCLanguages.map((language) => {
    const scoreKey = Object.keys(source.scores).find((key) =>
      key.startsWith("other_language_subject_") && key.includes(language.toLocaleLowerCase()));
    return [language, polyuPoints(source.scores[scoreKey])];
  }).filter(([, points]) => Object.keys(points).length));
  const statistics = sameProgrammeStatistics && (average || lowerQuartile) ? {
    ...(average ? { average: Number(average) } : {}),
    ...(lowerQuartile ? { lowerQuartile: Number(lowerQuartile) } : {}),
    year: "2026/27",
    sourceUrl: polyuStatisticsUrl,
  } : null;
  const supported = Boolean(groups);

  return {
    scoreModel: {
      verified: true,
      calculatorSupported: supported,
      cycle: `${source.year}/${String(Number(source.year) + 1).slice(-2)}`,
      formulaText: mechanism,
      groups: groups ?? [],
      gradePoints,
      categoryBPoints: polyuPoints(source.scores.applied_learning_subject),
      categoryBSubjects,
      languagePoints,
      categoryCLimit: categoryCLanguages.length,
      subjectWeights,
      subjectChoices: [...new Set(scoreSubjects.map(({ "Subject Name": name }) => polyuSubjectKey(name)))],
      mutuallyExclusive: validations,
      bonus: hasBonus ? {
        kind: "sixthSubjectWeightedPercentage",
        minimumScore: 3,
        percentage: 0.1,
      } : null,
      sourceUrl: polyuCalculatorUrl,
      formulaDataUrl: weightingPdf,
      conversionSourceUrl: polyuCalculatorUrl,
      formulaRemarks: programme["Score Remarks"]
        ? [decodeHtml(programme["Score Remarks"].replace(/<[^>]*>/g, " "))]
        : [],
    },
    scoreStatistics: statistics,
    programmeRequirements: requirements,
  };
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "JUPAS-Compass-admissions-sync/1.0" }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Could not fetch official admissions data from ${url}: HTTP ${response.status}`);
  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "user-agent": "JUPAS-Compass-admissions-sync/1.0" }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Could not fetch official admissions data from ${url}: HTTP ${response.status}`);
  return response.json();
}

const [hkuResponse, cuhkRecords, polyuHtml] = await Promise.all([
  fetchJson(hkuUrl),
  fetchJson(cuhkDataUrl),
  fetchText(polyuCalculatorUrl),
]);
const hkbuRecords = await Promise.all(hkbuProgrammeCodes.map(async (code) => ({
  code,
  data: await fetchJson(`${hkbuCalculatorBase}jupasscorecalculator.scorecalculatorprogramme.json?code=${code}`),
})));
const overrides = {};
const add = (code, value) => { overrides[code] = { ...(overrides[code] ?? {}), ...value }; };

const polyuSettings = polyuHtml.match(/<script\b(?=[^>]*data-drupal-selector=["']drupal-settings-json["'])[^>]*>([\s\S]*?)<\/script>/i)?.[1];
if (!polyuSettings) throw new Error("Could not find PolyU's official calculator data in its page.");
const polyuSource = JSON.parse(polyuSettings).jupas_calculator;
if (!polyuSource?.year || !Array.isArray(polyuSource.data?.ADMISSIONS) || !Array.isArray(polyuSource.validations)) {
  throw new Error("PolyU's official calculator data has an unexpected structure.");
}
for (const programme of polyuSource.data.ADMISSIONS) {
  const code = programme["JUPAS Code"];
  if (!/^JS\d{4}$/.test(code ?? "")) throw new Error("PolyU's official calculator returned a programme without a JUPAS code.");
  add(code, polyuScoreModel(programme, polyuSource));
}
if (hkbuRecords.some(({ data }) => !Array.isArray(data.subjects) || !Array.isArray(data.level_groups))) {
  throw new Error("HKBU's official calculator data has an unexpected structure.");
}
for (const { code, data } of hkbuRecords) add(code, hkbuScoreModel(data, code));
const eduhkCategoryBSubjects = [...new Set(hkbuRecords.flatMap(({ data }) =>
  data.subjects.filter(({ subj_cat: category, type }) => category === "B" && type === "E")
    .map(({ subj_desc: name }) => name)))];
for (const code of Object.keys(eduhkProgrammeDetails)) {
  add(code, eduhkScoreModel(code, eduhkCategoryBSubjects));
}

const hkuProgrammes = Object.values(hkuResponse.data.programme).flatMap((faculty) => Object.values(faculty));
for (const record of hkuProgrammes) {
  const code = `JS${record.programme_code}`;
  if (!/^JS\d{4}$/.test(code)) continue;
  const html = record.accordionHTML ?? "";
  const formulaCell = html.match(/<td class=["'][^"']*section-HKDSE-Scoring-Formula[^"']*["'][^>]*>([\s\S]*?)<\/td>/i)?.[1];
  const formulaText = formulaCell ? decodeHtml(formulaCell) : "";
  const weighting = getHkuWeighting(record.field_hkuad_dse_subject_w ?? "");
  const groups = formulaText ? hkuFormulaModel(formulaText, weighting) : null;
  const requirements = [];
  const minimumRows = hkuTables(html, "section-Minimum-Level-Requirement");
  if (minimumRows.length >= 2) {
    const labels = minimumRows[1];
    const levels = minimumRows[2] ?? [];
    for (let index = 0; index < labels.length; index += 1) {
      if (levels[index] && levels[index] !== "—") requirements.push(`${labels[index]}: ${levels[index]}`);
    }
  }
  for (const row of hkuTables(html, "section-Other-Requirements").slice(1)) {
    if (row[0] && row[0] !== "—") requirements.push(row[0]);
  }
  const stats = hkuStatistics[code];
  add(code, {
    scoreModel: formulaText ? {
      verified: true,
      calculatorSupported: Boolean(groups),
      cycle: "2027/28",
      formulaText,
      groups: groups ?? [],
      gradePoints: categoryAGradePoints,
      languagePoints: hkuLanguagePoints,
      categoryCLimit: /category C/i.test(html) ? 1 : 0,
      sourceUrl: hkuGuideUrl,
      formulaDataUrl: hkuUrl,
      subjectWeights: weighting,
    } : null,
    scoreStatistics: stats ? {
      upperQuartile: stats[0],
      median: stats[1],
      lowerQuartile: stats[2],
      year: 2026,
      entryYear: 2026,
      sourceUrl: hkuGuideUrl,
    } : { year: 2026, entryYear: 2026, sourceUrl: hkuGuideUrl },
    programmeRequirements: requirements,
  });
}

for (const [code, model] of Object.entries(hkustProgrammes)) {
  const stats = hkustStatistics[code];
  add(code, {
    scoreModel: { ...model },
    scoreStatistics: stats ? {
      highestAttainable: stats[0],
      median: stats[1],
      lowerQuartile: stats[2],
      year: 2026,
      entryYear: 2026,
      sourceUrl: hkustStatisticsUrl,
    } : { year: 2026, entryYear: 2026, sourceUrl: hkustStatisticsUrl },
  });
}

for (const record of cuhkRecords) {
  const groups = buildCuhkGroups(record.formula);
  const weights = cuhkWeights(record.weight);
  const statistics = [record.uq, record.m, record.lq].map((value) =>
    value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value)) ? Number(value) : null);
  const points = ["JS4501", "JS4502"].includes(record.code)
    ? { "5**": 7, "5*": 6, "5": 5, "4": 4, "3": 3, "2": 2, "1": 1, U: 0 }
    : categoryAGradePoints;
  const supported = Boolean(groups) && !["JS4501", "JS4502", "JS4601"].includes(record.code);
  add(record.code, {
    scoreModel: {
      verified: true,
      calculatorSupported: supported,
      cycle: "2026 entry",
      formulaText: `${record.principle}: ${record.formula || "官方頁未列出公式"}`,
      groups: groups ?? [],
      gradePoints: points,
      subjectWeights: weights.subjectWeights,
      weightedSelections: weights.weightedSelections,
      mutuallyExclusive: [
        ["M1", "M2"],
        ["Combined Science", "Integrated Science"],
        ["Technology and Living (Fashion, Clothing and Textiles)", "Technology and Living (Food Science and Technology)"],
      ],
      sourceUrl: cuhkCalculatorUrl,
      formulaDataUrl: cuhkDataUrl,
      expectedScore: record.static_data_1 || null,
      expectedScoreCycle: "2026 entry",
      formulaRemarks: record.formula_remarks === "--" ? "" : record.formula_remarks,
      weightingRemarks: record.weight_remarks || "",
      scoreRemark: record.score_remark || "",
    },
    scoreStatistics: {
      upperQuartile: statistics[0],
      median: statistics[1],
      lowerQuartile: statistics[2],
      year: 2025,
      entryYear: 2026,
      sourceUrl: cuhkAdmissionGradesUrl,
    },
    programmeRequirements: cuhkRequirements(record),
  });
}

for (const [code, weights] of Object.entries(lingnanWeights)) {
  const subjectWeights = Object.fromEntries(Object.entries(weights).flatMap(([subject, weight]) =>
    (lingnanSubjectAliases[subject] ?? [subject]).map((alias) => [alias, weight])));
  add(code, {
    scoreModel: {
      verified: true,
      calculatorSupported: true,
      cycle: "2027/28",
      formulaText: "最佳五科（課程指定甲類科目按官方權重；丙類語言按官方換算表計分）。",
      groups: [best("最佳五科", 5)],
      gradePoints: lingnanGradePoints,
      languagePoints: lingnanLanguagePoints,
      categoryCLimit: 1,
      subjectWeights,
      mutuallyExclusive: [[
        "Business, Accounting and Financial Studies",
        "Business, Accounting and Financial Studies (Accounting)",
        "Business, Accounting and Financial Studies (Business Management)",
      ]],
      sourceUrl: lingnanFormulaUrl,
      conversionSourceUrl: lingnanFormulaUrl,
      formulaRemarks: [
        "此 PDF 內文標示為 2027 Entry；甲類科目權重、甲類換算及丙類語言換算均按該文件整理。",
        "乙類應用學習可按課程作選修、額外分數或甄別用途；文件未列出乙類成績換算分數，因此本計算器不把乙類計入。各課程乙類認可科目及權重請查官方 PDF 第 13–17 頁。",
        "文件的替代中文資格換算及彈性收生安排不在本計算器內；彈性安排段落標示 2026/27，未視作 2027/28 課程要求。",
      ],
    },
  });
}

for (const code of hkmuProgrammeCodes) {
  const categoryBSubjects = code === "JS9580"
    ? ["Child Care and Education", "Child Care and Development"]
    : [];
  add(code, {
    scoreModel: {
      verified: true,
      calculatorSupported: true,
      cycle: "2027/28",
      formulaText: "所有核心科目及選修科目的換算分數按課程指定權重排列，取最佳五科；應用學習最多計兩科。",
      groups: [best("最佳五科", 5)],
      gradePoints: hkmuGradePoints,
      categoryBPoints: hkmuCategoryBPoints,
      categoryBSubjects,
      categoryBLimit: 2,
      languagePoints: hkmuLanguagePoints,
      categoryCLimit: 1,
      subjectWeights: hkmuWeights[code] ?? {},
      mutuallyExclusive: hkmuMutuallyExclusive,
      rejectConflictingInputs: true,
      inputExclusions: hkmuInputExclusions,
      requiredInputSubjects: ["English", "Chinese", "Mathematics", "CSD"],
      minimumElectiveInputs: 2,
      sourceUrl: hkmuCalculatorUrl,
      formulaDataUrl: hkmuCalculatorScriptUrl,
      conversionSourceUrl: hkmuCalculatorScriptUrl,
      formulaRemarks: [
        "官方計分器採最佳五科，並要求輸入中文、英文、數學、公民與社會發展／舊通識核心結果及至少兩科選修；公民與社會發展的「達標」本身不作數值計分。",
        "已接入官方 JavaScript 公布的甲類及丙類換算、課程權重，以及 JS9580 明列的兩項加權應用學習科目。其他課程的乙類可選科目清單依動態資料提供，本版未能逐課核實，故不計入乙類成績。",
        "丙類語言目前可輸入一科；若同時修讀多科其他語言，請以官方計分器確認完整計法。",
        "按官方規則，M1/M2 只取較佳一科；組合科學與相應單科、綜合科學與理科，以及企業、會計與財務概論不同分支不可重複計入。",
      ],
    },
  });
}

const result = {
  sourceSnapshot: "2026-11-06",
  sources: [
    { institutionId: "hku", label: "HKU 2027 admissions formulae and 2026 score quartiles", url: hkuGuideUrl, dataUrl: hkuUrl },
    { institutionId: "hkbu", label: "HKBU 2027 programme requirements, score conversion and weights", url: "https://admissions.hkbu.edu.hk/content/dam/ao-assets/document/news/JUPAS_GER_PER.pdf", calculatorUrl: "https://admissions.hkbu.edu.hk/admissions/hkdse.html" },
    { institutionId: "eduhk", label: "EdUHK 2027 entrance requirements, score calculation and subject weightings", url: "https://www.eduhk.hk/acadprog/downloads/EdUHK_Entrance%20Requirements%20and%20Admission%20Score%20Calculation.pdf", aplUrl: "https://www.eduhk.hk/acadprog/downloads/EdUHK_ApL%20Recognition%20and%20Subject%20Weightings.pdf" },
    { institutionId: "polyu", label: "PolyU official JUPAS calculator and 2027 entry score formulas", url: polyuCalculatorUrl, statisticsUrl: polyuStatisticsUrl },
    { institutionId: "hkust", label: "HKUST 2027 score formulae and conversion", url: hkustFormulaUrl, conversionUrl: hkustConversionUrl },
    { institutionId: "hkust", label: "HKUST 2026 JUPAS admissions scores", url: hkustStatisticsUrl },
    { institutionId: "cuhk", label: "CUHK official 2026-entry score calculator", url: cuhkCalculatorUrl, dataUrl: cuhkDataUrl },
    { institutionId: "cuhk", label: "CUHK 2026-entry admission grades (2025 admissions)", url: cuhkAdmissionGradesUrl },
    { institutionId: "cityuhk", label: "CityU JUPAS admissions information", url: cityuAdmissionsUrl },
    { institutionId: "lingnanu", label: "Lingnan JUPAS admission requirements and 2027-entry score conversion and weighting tables", url: lingnanFormulaUrl },
    { institutionId: "hkmu", label: "HKMU JUPAS score calculator and programme requirements", url: hkmuCalculatorUrl, scriptUrl: hkmuCalculatorScriptUrl },
  ],
  institutionNotes: {
    cityuhk: [
      "暫未能從可查閱的城大官方資料核實 2027/28 個別課程計分公式，因此不提供分數估算；院校整體最低要求及官方課程目錄仍可查看。",
    ],
    hku: [
      "2027/28 scoring formulae are from HKU's 2027 JUPAS guide; 2026 quartiles are historical admission references.",
      "HKU Category A conversion: 5**=8.5, 5*=7, 5=5.5, 4=4, 3=3, 2=2, 1=1; other grades=0.",
    ],
    hkust: [
      "2027/28 formulae use Category A subjects, including M1/M2; specified programmes additionally accept Category C or Applied Learning results.",
      "This calculator accepts Category A and supported Category C results, but does not calculate Applied Learning (Category B) scores.",
      "The general minimum is 332A33, with four core subjects plus two electives, or one elective plus M1/M2.",
      "The 2026 score publication provides highest attainable score, median and lower quartile, but no upper quartile.",
      "The 6th-subject bonus is calculated as up to 5% of the formula's highest attainable 5-subject score; published conversion percentages are rounded.",
    ],
    hkbu: [
      "2027/28 計分公式為最佳五科（CSD 不計分）；課程指定甲類科目權重來自 2027 入學官方要求 PDF。",
      "甲、乙及丙類成績換算及課程接受科目清單由浸大官方計分器資料提供；課程資格要求須另行核對官方 PDF。",
    ],
    eduhk: [
      "2027 入學計分採最佳五科並排除公民與社會發展；乙類分數、丙類語言換算及課程權重取自教大官方 PDF。",
      "乙類輸入由課程計分器可選科目清單提供並補入教大指定加權科目；課程資格和乙類科目數量限制仍須按官方要求核對。",
      "教大 2027 入學資料標示有效至 2026 年 9 月並可能更新；指定新乙類科目依文件註明的考試年度生效。",
    ],
    polyu: [
      "理大 2027/28 入學公式、科目權重、甲／乙／丙類換算及禁計相似科目組，取自官方計分器頁面的即時資料。",
      "2026/27 官方參考統計提供平均分及下四分位數；該頁未提供中位數或上四分位數，未公布數值不作推算。",
      "有第六科加分的課程，按第六科加權分數的 10% 計算，且第六科須達 Level 3 或以上。",
    ],
    cuhk: [
      "CUHK's official calculator currently covers 2026 entry only. The university says its 2027-entry calculator will be released between March and April 2027.",
      "The calculator excludes Category C, Category B, alternative Chinese qualifications, extra-subject bonus and repeat-sitting penalties.",
      "Formulae and expected scores are historical 2026-entry references; quartiles are 2025 admission results.",
    ],
    lingnanu: [
      "嶺大官方 PDF 檔名含 26-27，但內文的計分及科目權重章節明確標示 2027 Entry，故此處以 2027/28 入學週期整理。",
      "甲類換算為 5**=7、5*=6、5=5、4=4、3=3、2=2、1=1；丙類換算依各語言官方表列。公民與社會發展不計入入學分數。",
      "乙類應用學習在不同課程可作選修、額外分數或甄別用途；由於文件未列出可供本計算器使用的乙類級別分數換算，暫不計入估算。",
      "官方 PDF 的替代中文資格表及彈性收生安排尚未接入；彈性安排段落指明 2026/27，需另向院校確認是否適用於 2027 入學。",
    ],
    hkmu: [
      "2027/28 課程公式、成績換算及所列加權科目取自都大官方 JUPAS 計分器頁面及其 JavaScript。",
      "此計算器支援已核實的甲類和丙類資料；只對 JS9580 接入官方程式明列的兩項加權乙類科目。其他課程的乙類選科名單未能從動態資料端點核實，故不計入。",
      "官方計分器要求核心科目結果及至少兩科選修；本計算器會檢查這些輸入並限制官方列明不可同時計算的科目。",
      "未整合都大歷屆分數統計：官方 2026 統計名單與本年度 JUPAS 課程代碼未能安全對應，故不作推算或移植。",
    ],
  },
  programmes: overrides,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(`Wrote official admissions data for ${Object.keys(overrides).length} programmes to ${outputPath}`);
