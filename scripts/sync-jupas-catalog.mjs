import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const baseUrl = "https://www.jupas.edu.hk/en";
const outputPath = resolve("data/programmes.json");
const universities = [
  { id: "cityuhk", short: "城大", name: "香港城市大學", english: "City University of Hong Kong" },
  { id: "hkbu", short: "浸大", name: "香港浸會大學", english: "Hong Kong Baptist University" },
  { id: "lingnanu", short: "嶺大", name: "嶺南大學", english: "Lingnan University" },
  { id: "cuhk", short: "中大", name: "香港中文大學", english: "The Chinese University of Hong Kong" },
  { id: "eduhk", short: "教大", name: "香港教育大學", english: "The Education University of Hong Kong" },
  { id: "polyu", short: "理大", name: "香港理工大學", english: "The Hong Kong Polytechnic University" },
  { id: "hkust", short: "科大", name: "香港科技大學", english: "The Hong Kong University of Science and Technology" },
  { id: "hku", short: "港大", name: "香港大學", english: "The University of Hong Kong" },
  { id: "hkmu", short: "都大", name: "香港都會大學", english: "Hong Kong Metropolitan University" },
];

async function fetchOfficialPage(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "JUPAS-Compass-catalogue-sync/1.0" },
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
      if (response.status < 500) break;
    } catch (error) {
      if (!(error instanceof TypeError) && error?.name !== "TimeoutError" && error?.name !== "AbortError") throw error;
      lastError = error;
    }
    if (attempt < 3) await new Promise((resolvePromise) => setTimeout(resolvePromise, attempt * 1_000));
  }
  throw new Error(`Could not fetch official JUPAS data from ${url}: ${lastError?.message ?? "unknown error"}`);
}

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
    .replace(/\s+/g, " ")
    .trim();
}

function textContent(value) {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, "")
      .replace(/<span[^>]*class=["'][^"']*\blabel\b[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, "")
      .replace(/<[^>]*>/g, " "),
  );
}

function parseRequirementTable(html, tableClass) {
  const table = html.match(new RegExp(`<table\\b[^>]*class=["'][^"']*\\b${tableClass}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/table>`, "i"))?.[1];
  if (!table) return [];
  return [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map(([, row]) => {
      const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(([, content]) => textContent(content));
      if (cells.length === 1 && /^(or|and)$/i.test(cells[0])) {
        return { operator: cells[0].toLocaleLowerCase() };
      }
      return cells.length >= 2 && cells[0] && cells[1]
        ? { subject: cells[0], level: cells[1] }
        : null;
    })
    .filter(Boolean);
}

async function loadInstitutionRequirements(university) {
  const profileUrl = `${baseUrl}/programmes-offered/${university.id}/`;
  const response = await fetchOfficialPage(profileUrl);
  const html = await response.text();
  return {
    ...university,
    profileUrl,
    generalRequirements: {
      core: parseRequirementTable(html, "dsereg_table-core"),
      electives: parseRequirementTable(html, "dsereg_table-elective"),
    },
  };
}

function parseProgrammes(html, university) {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const programmes = [];

  for (const [, row] of rows) {
    const code = row.match(/>(JS\d{4})<\/a>/i)?.[1]?.toUpperCase();
    if (!code) continue;

    const cells = [...row.matchAll(/<td\b[^>]*class=["']([^"']*)["'][^>]*>([\s\S]*?)<\/td>/gi)];
    const cell = (className) => cells.find(([, classes]) => classes.split(/\s+/).includes(className))?.[2] ?? "";
    const titleHtml = cell("c-ft");
    const titleZh = titleHtml.match(/<span[^>]*class=["'][^"']*\btname-cn\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1];
    const englishTitleHtml = titleZh
      ? titleHtml.replace(/<span[^>]*class=["'][^"']*\btname-cn\b[^"']*["'][^>]*>[\s\S]*?<\/span>/i, "")
      : titleHtml;
    const funding = textContent(cell("c-fc"));
    const shortName = textContent(cell("c-sn"));
    const sourcePath = row.match(/href=["']([^"']*JS\d{4})["']/i)?.[1];
    if (!titleHtml || !sourcePath) continue;

    programmes.push({
      code,
      institutionId: university.id,
      institutionShort: university.short,
      institutionName: university.name,
      institutionEnglish: university.english,
      fundingCategory: /self-financing/i.test(funding) ? "Self-financing" : "UGC-funded",
      shortName,
      title: textContent(englishTitleHtml),
      titleZh: titleZh ? textContent(titleZh) : "",
      sourceUrl: new URL(sourcePath, `${baseUrl}/`).href,
      scoreModel: null,
      scoreStatistics: null,
    });
  }

  return programmes;
}

const programmes = [];
const institutionData = [];
for (const university of universities) {
  const url = `${baseUrl}/programme/${university.id}/`;
  const response = await fetchOfficialPage(url);
  const entries = parseProgrammes(await response.text(), university);
  if (entries.length === 0) throw new Error(`No course rows found in official catalogue for ${university.name}.`);
  programmes.push(...entries);
  institutionData.push(await loadInstitutionRequirements(university));
  console.log(`${university.name}: ${entries.length} courses`);
}

const uniqueCodes = new Set(programmes.map(({ code }) => code));
if (uniqueCodes.size !== programmes.length) throw new Error("Duplicate JUPAS course codes found in the official catalogues.");

const data = {
  applicationCycle: "2026/27",
  entryYear: "2027/28",
  source: "JUPAS official programme catalogues",
  sourceUrl: `${baseUrl}/programmes-offered/`,
  catalogueUpdated: new Date().toISOString().slice(0, 10),
  institutions: institutionData,
  programmes,
};

const admissions = JSON.parse(await readFile(resolve("data/admissions-overrides.json"), "utf8"));
for (const institution of data.institutions) {
  institution.admissionNotes = admissions.institutionNotes[institution.id] ?? [];
}
for (const programme of data.programmes) {
  const override = admissions.programmes[programme.code];
  if (!override) continue;
  Object.assign(programme, override);
}
data.admissionsSnapshot = admissions.sourceSnapshot;
data.admissionsSources = admissions.sources;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`Wrote ${programmes.length} programmes to ${outputPath}`);
