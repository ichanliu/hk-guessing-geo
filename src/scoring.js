function scoreFor(model, subject, grade, grades) {
  if (subject === "Category C") {
    if (!model.categoryCLimit || !grade || typeof grade !== "object") return null;
    return model.languagePoints?.[grade.language ?? grade.exam]?.[grade.grade] ?? null;
  }
  if (subject === "Category B" || /^Category B \d+$/.test(subject)) {
    if (!grade || typeof grade !== "object") return null;
    return model.categoryBPoints?.[grade.grade] ?? null;
  }
  if (subject === "Other Language") {
    return model.languagePoints?.[grades.languageExam]?.[grade] ?? model.gradePoints?.[grade] ?? null;
  }
  return model.gradePoints?.[grade] ?? null;
}

function subjectWeight(model, item) {
  const subject = item.subject === "Category B" || /^Category B \d+$/.test(item.subject)
    ? item.grade?.subject
    : item.subject === "Category C"
      ? item.grade?.language ?? item.grade?.exam
      : item.subject;
  return model.subjectWeights?.[subject] ?? model.subjectWeights?.[item.subject] ?? 1;
}

function combinations(items, count) {
  if (count === 0) return [[]];
  if (items.length < count) return [];
  const result = [];
  const visit = (start, selected) => {
    if (selected.length === count) {
      result.push(selected);
      return;
    }
    for (let index = start; index <= items.length - (count - selected.length); index += 1) {
      visit(index + 1, [...selected, items[index]]);
    }
  };
  visit(0, []);
  return result;
}

function normalizeGroups(model) {
  if (Array.isArray(model.groups)) return model.groups;
  if (!Array.isArray(model.components)) return null;
  return model.components.map((component) => ({
    label: component.label,
    count: component.bestN ?? component.minimumCount ?? component.subjects.length,
    subjects: component.subjects,
    weights: model.subjectWeights,
    weight: component.weight,
    required: component.required,
  }));
}

function scorePlan(model, plan, grades) {
  const groups = normalizeGroups({ ...model, groups: plan });
  if (!groups) return null;
  const entries = Object.entries(grades)
    .map(([subject, grade]) => {
      const score = scoreFor(model, subject, grade, grades);
      return Number.isFinite(score) ? { subject, grade, score } : null;
    })
    .filter(Boolean);

  const subjectWeights = { ...model.subjectWeights };
  for (const selection of model.weightedSelections ?? []) {
    const candidates = entries
      .filter(({ subject, grade }) => selection.subjects.includes(subject)
        && (!/^Category B(?: \d+)?$/.test(subject)
          || !Array.isArray(selection.categoryBSubjects)
          || selection.categoryBSubjects.includes(grade?.subject)))
      .sort((left, right) => right.score - left.score)
      .slice(0, selection.count);
    for (const candidate of candidates) subjectWeights[candidate.subject] = selection.weight;
  }

  let bestResult = null;
  const used = new Set();
  const selected = [];

  const finish = () => {
    const weighted = selected.map((item) => ({
      ...item,
      factor: item.group.weights?.[item.subject] ?? subjectWeights[item.subject] ?? item.group.weight ?? subjectWeight(model, item),
      weightedEligible: item.group.weightedEligible !== false,
    }));
    const cap = model.maxWeightedElectives;
    const candidates = weighted
      .filter(({ factor, weightedEligible }) => factor > 1 && weightedEligible)
      .sort((left, right) =>
        (right.score * right.factor - right.score) - (left.score * left.factor - left.score));
    const weightedSubjects = new Set(
      Number.isInteger(cap) ? candidates.slice(0, cap).map(({ subject }) => subject) : candidates.map(({ subject }) => subject),
    );
    const scored = weighted.map((item) => {
      const factor = item.weightedEligible && item.factor > 1 && !weightedSubjects.has(item.subject)
        ? 1
        : item.factor;
      return { ...item, factor, weightedScore: item.score * factor };
    });
    const baseScore = scored.reduce((sum, item) => sum + item.weightedScore, 0);

    let bonus = 0;
    if (model.bonus?.kind === "sixthSubjectPercentage") {
      const sixth = entries
        .filter(({ subject }) => !used.has(subject))
        .sort((left, right) => right.score - left.score)[0];
      const fraction = sixth?.subject === "Category C"
        ? model.bonus.languagePercentages?.[sixth.score]
        : model.bonus.gradePercentages?.[sixth?.grade];
      if (sixth && Number.isFinite(fraction)) {
        bonus = model.bonus.baseMax * fraction;
      }
    } else if (model.bonus?.kind === "sixthSubjectWeightedPercentage") {
      const sixth = entries
        .filter(({ subject, score }) => !used.has(subject) && score >= (model.bonus.minimumScore ?? 0))
        .map((item) => ({ ...item, weightedScore: item.score * subjectWeight(model, item) }))
        .sort((left, right) => right.weightedScore - left.weightedScore)[0];
      if (sixth) bonus = sixth.weightedScore * model.bonus.percentage;
    }

    const score = baseScore + bonus;
    if (!bestResult || score > bestResult.score) {
      bestResult = {
        score,
        baseScore,
        bonus,
        breakdown: scored.map(({ label, subject, grade, score: raw, factor, weightedScore }) => ({
          label,
          subject,
          grade,
          score: raw,
          weight: factor,
          weightedScore,
        })),
      };
    }
  };

  const chooseGroup = (groupIndex) => {
    if (groupIndex === groups.length) {
      finish();
      return;
    }
    const group = groups[groupIndex];
    const available = entries.filter(({ subject }) => {
      if (used.has(subject)) return false;
      if ((model.mutuallyExclusive ?? []).some((pair) =>
        pair.includes(subject) && pair.some((other) => other !== subject && used.has(other)))) return false;
      return !Array.isArray(group.subjects) || group.subjects.includes(subject);
    });
    const count = group.count ?? 1;
    if (!Number.isInteger(count) || count < 0) return;
    const selections = combinations(available, count);
    if (!selections.length) {
      if (group.required === false) {
        chooseGroup(groupIndex + 1);
      }
      return;
    }
    for (const selection of selections) {
      const selectedSubjects = selection.map(({ subject }) => subject);
      if ((model.mutuallyExclusive ?? []).some((pair) => pair.filter((subject) => selectedSubjects.includes(subject)).length > 1)) {
        continue;
      }
      for (const item of selection) {
        used.add(item.subject);
        selected.push({ ...item, group });
      }
      chooseGroup(groupIndex + 1);
      for (const item of selection) {
        used.delete(item.subject);
        selected.pop();
      }
    }
  };

  chooseGroup(0);
  return bestResult;
}

export function calculateAdmissionScore(programme, grades) {
  const model = programme?.scoreModel;
  if (!model?.verified || model.calculatorSupported === false || !model.gradePoints) {
    return {
      supported: false,
      reason: model?.formulaText
        ? "已找到官方計分方式，但此公式尚未完整接入計算器，暫不估算。"
        : "此課程的官方加權公式尚未核實，暫不能計算。",
    };
  }

  const missingInputs = (model.requiredInputSubjects ?? []).filter((subject) => {
    const grade = grades[subject];
    return typeof grade === "object" ? !grade?.grade : !grade;
  });
  if (missingInputs.length) {
    return {
      supported: true,
      eligibleForCalculation: false,
      reason: `請先輸入以下必需科目成績：${missingInputs.join("、")}。`,
    };
  }
  if (Number.isInteger(model.minimumElectiveInputs)) {
    const coreSubjects = new Set(model.requiredInputSubjects ?? []);
    const electiveCount = Object.entries(grades).filter(([subject, grade]) =>
      !coreSubjects.has(subject) && (typeof grade === "object" ? Boolean(grade?.grade) : Boolean(grade))).length;
    if (electiveCount < model.minimumElectiveInputs) {
      return {
        supported: true,
        eligibleForCalculation: false,
        reason: `官方公式要求至少輸入 ${model.minimumElectiveInputs} 科選修科目。`,
      };
    }
  }
  if (model.rejectConflictingInputs) {
    const submittedSubjects = new Set(Object.entries(grades).flatMap(([subject, grade]) => {
      if (!grade) return [];
      if (/^Category B(?: \d+)?$/.test(subject) && typeof grade === "object" && grade.subject) {
        return [grade.subject];
      }
      return [subject];
    }));
    const conflict = (model.inputExclusions ?? model.mutuallyExclusive ?? [])
      .find((group) => group.filter((subject) => submittedSubjects.has(subject)).length > 1);
    if (conflict) {
      return {
        supported: true,
        eligibleForCalculation: false,
        reason: `以下科目不可同時計算：${conflict.join("／")}。`,
      };
    }
  }

  const plans = model.alternatives ?? [normalizeGroups(model)];
  if (plans.some((plan) => !plan)) {
    return {
      supported: false,
      reason: "此課程的公式格式暫未能安全計算。",
    };
  }
  const results = plans
    .map((plan) => scorePlan(model, plan, grades))
    .filter(Boolean);
  if (!results.length) {
    return {
      supported: true,
      eligibleForCalculation: false,
      reason: `請輸入足夠成績以符合公式「${model.formulaText}」。`,
    };
  }
  const result = results.reduce((best, current) => current.score > best.score ? current : best);
  const ignoredCategoryC = Boolean(grades["Category C"]) && !model.categoryCLimit;
  return {
    supported: true,
    eligibleForCalculation: true,
    score: Math.round(result.score * 100) / 100,
    baseScore: Math.round(result.baseScore * 100) / 100,
    bonus: Math.round(result.bonus * 100) / 100,
    breakdown: result.breakdown,
    cycle: model.cycle,
    formulaText: model.formulaText,
    warning: ignoredCategoryC ? "此課程的官方計分公式不包括你輸入的丙類語言成績。" : "",
  };
}
