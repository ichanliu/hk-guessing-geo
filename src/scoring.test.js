import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { calculateAdmissionScore } from "./scoring.js";

test("does not calculate an unverified programme formula", () => {
  const result = calculateAdmissionScore({ code: "JS0000", scoreModel: null }, {});
  assert.equal(result.supported, false);
  assert.match(result.reason, /尚未核實/);
});

test("calculates verified weighted components and best-N electives", () => {
  const programme = {
    scoreModel: {
      verified: true,
      gradePoints: { "5**": 8.5, "5*": 7, "5": 5.5, "4": 4 },
      subjectWeights: { English: 2 },
      components: [
        { label: "核心科", subjects: ["English", "Mathematics"], required: true },
        { label: "最佳選修", subjects: ["Biology", "Chemistry", "Physics"], bestN: 2, required: true },
      ],
    },
  };
  const result = calculateAdmissionScore(programme, {
    English: "5", Mathematics: "4", Biology: "5**", Chemistry: "5*", Physics: "4",
  });

  assert.equal(result.supported, true);
  assert.equal(result.eligibleForCalculation, true);
  assert.equal(result.score, 30.5);
  assert.equal(result.breakdown.length, 4);
});

test("requires enough grades for mandatory score components", () => {
  const programme = {
    scoreModel: {
      verified: true,
      gradePoints: { "5": 5 },
      components: [{ label: "核心科", subjects: ["English", "Mathematics"], required: true }],
    },
  };
  const result = calculateAdmissionScore(programme, { English: "5" });
  assert.equal(result.eligibleForCalculation, false);
});

test("supports a source-defined conversion for Category C language grades", () => {
  const programme = {
    scoreModel: {
      verified: true,
      gradePoints: { A: 4, "5*": 7 },
      components: [{ label: "語言及核心科", subjects: ["Other Language", "English"] }],
    },
  };
  const result = calculateAdmissionScore(programme, { "Other Language": "A", English: "5*" });
  assert.equal(result.score, 11);
});

test("applies Category C conversion only when the verified formula allows it", () => {
  const programme = {
    scoreModel: {
      verified: true,
      calculatorSupported: true,
      categoryCLimit: 1,
      gradePoints: { "5*": 7 },
      languagePoints: { French: { B2: 5.5 } },
      groups: [
        { label: "英語", count: 1, subjects: ["English"] },
        { label: "丙類", count: 1, subjects: ["Category C"] },
      ],
    },
  };
  const result = calculateAdmissionScore(programme, {
    English: "5*", "Category C": { language: "French", grade: "B2" },
  });
  assert.equal(result.score, 12.5);
});

test("applies the official sixth-subject bonus to the five-subject maximum", () => {
  const programme = {
    scoreModel: {
      verified: true,
      calculatorSupported: true,
      cycle: "2027/28",
      gradePoints: { "5**": 8.5 },
      groups: [
        { label: "英文", count: 1, subjects: ["English"] },
        { label: "數學", count: 1, subjects: ["Mathematics"] },
        { label: "最佳三科", count: 3, subjects: ["Biology", "Chemistry", "Physics", "Economics"] },
      ],
      bonus: {
        kind: "sixthSubjectPercentage",
        baseMax: 42.5,
        gradePercentages: { "5**": 0.05 },
      },
    },
  };
  const result = calculateAdmissionScore(programme, {
    English: "5**", Mathematics: "5**", Biology: "5**",
    Chemistry: "5**", Physics: "5**", Economics: "5**",
  });
  assert.equal(result.baseScore, 42.5);
  assert.equal(result.bonus, 2.13);
  assert.equal(result.score, 44.63);
});

test("adds 10% of the sixth subject's weighted score when it meets the minimum level", () => {
  const programme = {
    scoreModel: {
      verified: true,
      calculatorSupported: true,
      gradePoints: { "5**": 8.5, "3": 3, "2": 2 },
      subjectWeights: { English: 10, Biology: 7, Chemistry: 5 },
      groups: [{ label: "最佳兩科", count: 2 }],
      bonus: {
        kind: "sixthSubjectWeightedPercentage",
        minimumScore: 3,
        percentage: 0.1,
      },
    },
  };
  const result = calculateAdmissionScore(programme, {
    English: "5**", Biology: "3", Chemistry: "3",
  });
  assert.equal(result.baseScore, 106);
  assert.equal(result.bonus, 1.5);
  assert.equal(result.score, 107.5);
});

test("uses subject-specific official ApL score and weighting", () => {
  const programme = {
    scoreModel: {
      verified: true,
      calculatorSupported: true,
      gradePoints: { "5**": 8.5 },
      categoryBPoints: { "Attained with Distinction (II) (accepted as Level 4 at HKDSE)": 4 },
      subjectWeights: { "Medical Laboratory Science": 7 },
      groups: [{ label: "最佳一科", count: 1 }],
    },
  };
  const result = calculateAdmissionScore(programme, {
    "Category B": {
      subject: "Medical Laboratory Science",
      grade: "Attained with Distinction (II) (accepted as Level 4 at HKDSE)",
    },
  });
  assert.equal(result.score, 28);
});

test("matches all HKUST formula maxima with top grades", async () => {
  const { programmes } = JSON.parse(await readFile(new URL("../data/programmes.json", import.meta.url), "utf8"));
  const topGrades = {
    Chinese: "5**", English: "5**", Mathematics: "5**", CSD: "Attained",
    Biology: "5**", Chemistry: "5**", Physics: "5**", Economics: "5**", Geography: "5**",
    M1: "5**", M2: "5**", ICT: "5**", "Combined Science": "5**", "Integrated Science": "5**",
    "Design and Applied Technology": "5**",
    "Business, Accounting and Financial Studies (Business Management)": "5**",
    "Chinese History": "5**", "Literature in Chinese": "5**", "Literature in English": "5**",
    "Ethics and Religious Studies": "5**", "Health Management and Social Care": "5**",
    History: "5**", Music: "5**", "Physical Education": "5**",
    "Technology and Living (Fashion, Clothing and Textiles)": "5**",
    "Technology and Living (Food Science and Technology)": "5**",
    "Tourism and Hospitality Studies": "5**", "Visual Arts": "5**",
    "Category C": { language: "French", grade: "C2" },
  };
  const hkustProgrammes = programmes.filter((programme) => programme.institutionId === "hkust");
  assert.equal(hkustProgrammes.length, 34);
  for (const programme of hkustProgrammes) {
    const result = calculateAdmissionScore(programme, topGrades);
    assert.equal(result.eligibleForCalculation, true, programme.code);
    assert.equal(result.baseScore, programme.scoreModel.bonus.baseMax, programme.code);
  }
});

test("loads PolyU's official 2027 formula, conversion data, and weighted Best 5 model", async () => {
  const { programmes } = JSON.parse(await readFile(new URL("../data/programmes.json", import.meta.url), "utf8"));
  const polyu = programmes.find((programme) => programme.code === "JS3060");
  assert.ok(polyu?.scoreModel?.calculatorSupported);
  assert.equal(polyu.scoreModel.cycle, "2027/28");
  assert.match(polyu.scoreModel.formulaText, /Any Best 5 Subjects/);
  assert.equal(polyu.scoreModel.gradePoints["5**"], 8.5);
  assert.equal(polyu.scoreModel.categoryBPoints["Attained with Distinction (II) (accepted as Level 4 at HKDSE)"], 4);
  assert.equal(polyu.scoreModel.subjectWeights.English, 10);
  assert.equal(polyu.scoreModel.subjectWeights.Mathematics, 10);
  assert.equal(polyu.scoreStatistics.year, "2026/27");
  assert.equal(polyu.scoreStatistics.median, undefined);
  assert.ok(Number.isFinite(polyu.scoreStatistics.average));
  assert.ok(Number.isFinite(polyu.scoreStatistics.lowerQuartile));

  const input = {
    Chinese: "5**", English: "5**", Mathematics: "5**",
    Biology: "5**", Chemistry: "5**", Economics: "5**",
  };
  const result = calculateAdmissionScore(polyu, input);
  const expected = Object.entries(input)
    .map(([subject]) => polyu.scoreModel.subjectWeights[subject] * 8.5)
    .sort((left, right) => right - left)
    .slice(0, 5)
    .reduce((sum, score) => sum + score, 0);
  assert.equal(result.eligibleForCalculation, true);
  assert.equal(result.score, expected);
});

test("reproduces HKBU's official JS2110 2027 score example", async () => {
  const { programmes } = JSON.parse(await readFile(new URL("../data/programmes.json", import.meta.url), "utf8"));
  const hkbu = programmes.find((programme) => programme.code === "JS2110");
  assert.ok(hkbu?.scoreModel?.calculatorSupported);
  assert.equal(hkbu.scoreModel.cycle, "2027/28");
  assert.equal(hkbu.scoreModel.gradePoints["5**"], 7);
  assert.equal(hkbu.scoreModel.subjectWeights.English, 1.5);
  assert.equal(hkbu.scoreModel.categoryBPoints["Attained with Distinction II"], 4);

  const result = calculateAdmissionScore(hkbu, {
    Chinese: "5", English: "5", Mathematics: "5", CSD: "Attained",
    Biology: "5", Geography: "3",
  });
  assert.equal(result.eligibleForCalculation, true);
  assert.equal(result.score, 25.5);
});

test("reproduces HKBU's official JS2410 and JS2420 programme-specific weights", async () => {
  const { programmes } = JSON.parse(await readFile(new URL("../data/programmes.json", import.meta.url), "utf8"));
  const grades = {
    Chinese: "3", English: "3", Mathematics: "2", CSD: "Attained",
    Biology: "3", Chemistry: "3",
  };
  for (const [code, expected] of [["JS2410", 19.25], ["JS2420", 18.25]]) {
    const programme = programmes.find((item) => item.code === code);
    assert.ok(programme.scoreModel.subjectChoices.includes("Biology"), code);
    assert.equal(programme.scoreModel.subjectChoices.includes("BIOLOGY"), false, code);
    const result = calculateAdmissionScore(programme, grades);
    assert.equal(result.eligibleForCalculation, true, code);
    assert.equal(result.score, expected, code);
  }
});

test("reproduces HKBU's official JS2960 core and elective subject weights", async () => {
  const { programmes } = JSON.parse(await readFile(new URL("../data/programmes.json", import.meta.url), "utf8"));
  const programme = programmes.find((item) => item.code === "JS2960");
  assert.equal(programme.scoreModel.subjectWeights.English, 1.5);
  assert.equal(programme.scoreModel.subjectWeights.Mathematics, 1.2);
  assert.equal(programme.scoreModel.subjectWeights.M1, 1.1);
  const result = calculateAdmissionScore(programme, {
    Chinese: "3", English: "3", Mathematics: "2", CSD: "Attained",
    M1: "3", "Chinese History": "3",
  });
  assert.equal(result.score, 16.5);
});

test("loads EdUHK's 2027 five-subject model, category conversions, and programme weights", async () => {
  const { programmes } = JSON.parse(await readFile(new URL("../data/programmes.json", import.meta.url), "utf8"));
  const eduhk = programmes.filter((programme) => programme.institutionId === "eduhk");
  assert.equal(eduhk.length, 26);
  assert.ok(eduhk.every((programme) => programme.scoreModel?.calculatorSupported
    && programme.scoreModel.cycle === "2027/28"));

  const programme = eduhk.find((item) => item.code === "JS8001");
  assert.equal(programme.scoreModel.gradePoints["5**"], 7);
  assert.equal(programme.scoreModel.categoryBPoints["Attained with Distinction (II)"], 4);
  assert.equal(programme.scoreModel.categoryBPoints["Attained with Distinction"], 3);
  assert.equal(programme.scoreModel.categoryBPoints.Attained, 0);
  assert.equal(programme.scoreModel.subjectWeights.Music, 1.5);
  assert.equal(programme.scoreModel.subjectWeights["POPULAR MUSIC PRODUCTION"], 1.5);

  const result = calculateAdmissionScore(programme, {
    Chinese: "5**", English: "5**", Mathematics: "5**", Music: "5**",
    "Category B": { subject: "POPULAR MUSIC PRODUCTION", grade: "Attained with Distinction (II)" },
  });
  assert.equal(result.score, 37.5);
});

test("loads Lingnan's 2027-entry programme weights and Category C conversion", async () => {
  const { programmes } = JSON.parse(await readFile(new URL("../data/programmes.json", import.meta.url), "utf8"));
  const lingnan = programmes.filter((programme) => programme.institutionId === "lingnanu");
  assert.equal(lingnan.length, 23);
  assert.ok(lingnan.every((programme) => programme.scoreModel?.calculatorSupported
    && programme.scoreModel.cycle === "2027/28"));

  const programme = lingnan.find((item) => item.code === "JS7101");
  assert.equal(programme.scoreModel.gradePoints["5**"], 7);
  assert.equal(programme.scoreModel.subjectWeights.Chinese, 1.5);
  assert.equal(programme.scoreModel.subjectWeights["Literature in Chinese"], 1.5);
  assert.equal(programme.scoreModel.languagePoints.French.C2, 7);
  assert.deepEqual(programme.scoreModel.categoryBSubjects, undefined);
  const result = calculateAdmissionScore(programme, {
    Chinese: "5**", English: "5*", "Literature in Chinese": "5", "Chinese History": "4",
    Mathematics: "5**", "Category C": { language: "French", grade: "C2" },
  });
  assert.equal(result.eligibleForCalculation, true);
  assert.equal(result.score, 41);
  assert.ok(programme.scoreModel.formulaRemarks.some((note) => /不把乙類計入/.test(note)));
});

test("loads HKMU's 2027 five-subject formula, checks core/elective inputs, and applies programme weights", async () => {
  const { programmes } = JSON.parse(await readFile(new URL("../data/programmes.json", import.meta.url), "utf8"));
  const hkmu = programmes.filter((programme) => programme.institutionId === "hkmu");
  assert.equal(hkmu.length, 28);
  assert.ok(hkmu.every((programme) => programme.scoreModel?.calculatorSupported
    && programme.scoreModel.cycle === "2027/28"));

  const programme = hkmu.find((item) => item.code === "JS9011");
  assert.equal(programme.scoreModel.gradePoints["5**"], 7);
  assert.equal(programme.scoreModel.categoryBPoints["Attained with Distinction (II)"], 4);
  assert.equal(programme.scoreModel.languagePoints.Japanese.N2, 5);
  assert.equal(programme.scoreModel.subjectWeights.Chinese, 2);
  const result = calculateAdmissionScore(programme, {
    Chinese: "5**", English: "5*", Mathematics: "5", CSD: "Attained",
    Biology: "4", Economics: "3",
  });
  assert.equal(result.eligibleForCalculation, true);
  assert.equal(result.score, 32);

  const missingElective = calculateAdmissionScore(programme, {
    Chinese: "5**", English: "5*", Mathematics: "5", CSD: "Attained", Biology: "4",
  });
  assert.equal(missingElective.eligibleForCalculation, false);
  assert.match(missingElective.reason, /至少輸入 2 科選修/);
});

test("applies only the verified HKMU JS9580 Applied Learning weights and module/science rules", async () => {
  const { programmes } = JSON.parse(await readFile(new URL("../data/programmes.json", import.meta.url), "utf8"));
  const hkmu = programmes.find((programme) => programme.code === "JS9580");
  assert.deepEqual(hkmu.scoreModel.categoryBSubjects, ["Child Care and Education", "Child Care and Development"]);
  const result = calculateAdmissionScore(hkmu, {
    Chinese: "5**", English: "5*", Mathematics: "5", CSD: "Attained",
    "Category B": { subject: "Child Care and Education", grade: "Attained with Distinction (II)" },
    "Category B 2": { subject: "Child Care and Development", grade: "Attained with Distinction" },
  });
  assert.equal(result.eligibleForCalculation, true);
  assert.equal(result.score, 32);

  const bothModules = calculateAdmissionScore(hkmu, {
    Chinese: "5**", English: "5*", Mathematics: "5", CSD: "Attained",
    M1: "4", M2: "5", Biology: "3", Economics: "2",
  });
  assert.equal(bothModules.eligibleForCalculation, true);
  assert.equal(bothModules.score, 26);
  assert.equal(bothModules.breakdown.some((item) => item.subject === "M1"), false);
  assert.equal(bothModules.breakdown.some((item) => item.subject === "M2"), true);

  const conflict = calculateAdmissionScore(hkmu, {
    Chinese: "5**", English: "5*", Mathematics: "5", CSD: "Attained",
    Biology: "3", "Combined Science: Biology + Chemistry": "4", Economics: "2",
  });
  assert.equal(conflict.eligibleForCalculation, false);
  assert.match(conflict.reason, /Biology／Combined Science/);
});

test("applies EdUHK's language conversion and supports two distinct ApL results", async () => {
  const { programmes } = JSON.parse(await readFile(new URL("../data/programmes.json", import.meta.url), "utf8"));
  const degree = programmes.find((item) => item.code === "JS8651");
  const languageResult = calculateAdmissionScore(degree, {
    Chinese: "5*", English: "5*", Mathematics: "5",
    "Category C": { language: "French", grade: "C2" },
    Geography: "4",
  });
  assert.equal(languageResult.score, 28);
  assert.equal(languageResult.breakdown.find((item) => item.subject === "Category C").score, 7);

  const diploma = programmes.find((item) => item.code === "JS8507");
  assert.deepEqual(diploma.programmeGeneralRequirements, {
    core: [
      { subject: "CHINESE LANGUAGE", level: "2" },
      { subject: "ENGLISH LANGUAGE", level: "2" },
    ],
    electives: [{ subject: "ANY 3 SUBJECTS", level: "2" }],
  });
  const appliedLearning = diploma.scoreModel.categoryBSubjects;
  const result = calculateAdmissionScore(diploma, {
    Chinese: "2", English: "2", Mathematics: "2",
    "Category B": { subject: appliedLearning.find((subject) => subject.toUpperCase() === "CHILD CARE AND DEVELOPMENT"), grade: "Attained with Distinction (II)" },
    "Category B 2": { subject: appliedLearning.find((subject) => subject.toUpperCase() === "CHILD CARE AND EDUCATION"), grade: "Attained with Distinction" },
  });
  assert.equal(result.eligibleForCalculation, true);
  assert.equal(result.breakdown.filter((item) => item.subject.startsWith("Category B")).length, 2);
  assert.equal(result.score, 18.5);
});

test("only applies EdUHK's Best-one weighting to listed Category B subjects", async () => {
  const { programmes } = JSON.parse(await readFile(new URL("../data/programmes.json", import.meta.url), "utf8"));
  const programme = programmes.find((item) => item.code === "JS8007");
  const result = calculateAdmissionScore(programme, {
    Chinese: "5**", English: "5**", Mathematics: "5**", Economics: "3", Biology: "2",
    "Category B": { subject: "UNLISTED APPLIED LEARNING SUBJECT", grade: "Attained with Distinction (II)" },
  });
  assert.equal(result.eligibleForCalculation, true);
  assert.equal(result.breakdown.find((item) => item.subject === "Economics").weight, 1.5);
  assert.equal(result.breakdown.find((item) => item.subject === "Category B").weight, 1);
});

test("M1 and M2 mutual-exclusion rules do not discard an unselected sixth-subject bonus candidate", () => {
  const programme = {
    scoreModel: {
      verified: true,
      calculatorSupported: true,
      gradePoints: { "5**": 8.5 },
      groups: [{ label: "最佳一科", count: 1, subjects: ["M1", "M2"] }],
      mutuallyExclusive: [["M1", "M2"]],
      bonus: {
        kind: "sixthSubjectPercentage",
        baseMax: 8.5,
        gradePercentages: { "5**": 0.05 },
      },
    },
  };
  const result = calculateAdmissionScore(programme, { M1: "5**", M2: "5**" });
  assert.equal(result.baseScore, 8.5);
  assert.equal(result.bonus, 0.43);
  assert.equal(result.score, 8.93);
});
