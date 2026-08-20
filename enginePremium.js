// enginePremium.js

const { ACTIVITY, STRATEGY_STATE, RELATION, MATCH_LEVEL, TIER, COMPOSITE_PATTERNS } = require('./premiumPatterns.js');
const { getBranchRelation } = require('./fortune.js');

function mapTenGodToActivity(tenGod) {
  if (["비견", "겁재"].includes(tenGod)) return ACTIVITY.SELF_INDEPENDENCE;
  if (["식신", "상관"].includes(tenGod)) return ACTIVITY.OUTPUT_EXPRESSION;
  if (["정재", "편재"].includes(tenGod)) return ACTIVITY.RESOURCE_MANAGEMENT;
  if (["정관", "편관"].includes(tenGod)) return ACTIVITY.STRUCTURE_RESPONSIBILITY;
  if (["정인", "편인"].includes(tenGod)) return ACTIVITY.LEARNING_PREPARATION;
  return null;
}

function mapActivityToStrategyCandidate(activity) {
  if (activity === ACTIVITY.LEARNING_PREPARATION) return STRATEGY_STATE.PREPARE;
  if (activity === ACTIVITY.OUTPUT_EXPRESSION) return STRATEGY_STATE.EXECUTE;
  if (activity === ACTIVITY.RESOURCE_MANAGEMENT) return STRATEGY_STATE.EXPAND;
  if (activity === ACTIVITY.STRUCTURE_RESPONSIBILITY) return STRATEGY_STATE.CONSOLIDATE;
  if (activity === ACTIVITY.SELF_INDEPENDENCE) return STRATEGY_STATE.REVIEW;
  return null;
}

function evaluateEvidenceExpression(expression, evidence) {
  if (!expression || !evidence) return false;
  
  if (expression.allOf) {
    return expression.allOf.every(cond => evaluateEvidenceExpression(cond, evidence));
  }
  
  if (expression.anyOf) {
    if (expression.anyOf.length === 0) return false;
    return expression.anyOf.some(cond => evaluateEvidenceExpression(cond, evidence));
  }

  // base condition: object with keys
  for (const key in expression) {
    if (evidence[key] !== expression[key]) {
      return false;
    }
  }
  return true;
}

function analyzeAnnualPattern(evidence) {
  if (!evidence) return [];
  const matchResults = [];

  for (const pattern of COMPOSITE_PATTERNS) {
    const isRequiredSatisfied = evaluateEvidenceExpression(pattern.requiredEvidence, evidence);
    const isConflictingSatisfied = evaluateEvidenceExpression(pattern.conflictingEvidence, evidence);
    const isSupportingSatisfied = evaluateEvidenceExpression(pattern.supportingEvidence, evidence);

    let matchLevel = MATCH_LEVEL.NO_MATCH;
    let tier = null;
    let partialSignals = [];

    if (isRequiredSatisfied) {
      if (isConflictingSatisfied) {
        matchLevel = MATCH_LEVEL.CONFLICTED_MATCH;
        tier = TIER.TIER_B;
      } else {
        matchLevel = MATCH_LEVEL.FULL_MATCH;
        tier = TIER.TIER_A;
      }
    } else if (pattern.partialAllowed) {
      // Check partial
      let partialMet = false;
      for (const rule of pattern.partialEvidenceRules) {
        if (evaluateEvidenceExpression(rule, evidence)) {
          partialMet = true;
          // Extract the key-value from rule to store in partialSignals
          const k = Object.keys(rule)[0];
          partialSignals.push(rule[k]);
        }
      }
      if (partialMet) {
        matchLevel = MATCH_LEVEL.PARTIAL_MATCH;
      }
    }

    if (matchLevel !== MATCH_LEVEL.NO_MATCH) {
      matchResults.push({
        patternId: pattern.patternId,
        matchLevel,
        tier,
        requiredSatisfied: isRequiredSatisfied,
        supportingEvidenceFound: isSupportingSatisfied,
        conflictingEvidenceFound: isConflictingSatisfied,
        partialSignals,
        allowedStrategyStates: pattern.allowedStrategyStates,
        defaultStrategyState: pattern.defaultStrategyState,
        focusAreas: pattern.focusAreas,
        domainTargets: pattern.domainTargets
      });
    }
  }

  return matchResults;
}

function selectPrimaryPatternAndState(matchResults, evidence) {
  const compositeMatches = matchResults.filter(r => r.matchLevel === MATCH_LEVEL.FULL_MATCH || r.matchLevel === MATCH_LEVEL.CONFLICTED_MATCH);
  
  let primaryTier = null;
  let primaryPattern = null;
  let strategyState = null;
  let conflictExist = false;
  let allPartialSignals = [];

  matchResults.forEach(r => {
    if (r.partialSignals) {
      r.partialSignals.forEach(s => {
        if (!allPartialSignals.includes(s)) allPartialSignals.push(s);
      });
    }
  });

  if (compositeMatches.length > 0) {
    // Determine highest tier
    const hasTierA = compositeMatches.some(m => m.tier === TIER.TIER_A);
    const bestMatches = compositeMatches.filter(m => m.tier === (hasTierA ? TIER.TIER_A : TIER.TIER_B));
    
    // Check if we need to set conflictExist
    conflictExist = bestMatches.some(m => m.conflictingEvidenceFound);

    // PATTERN_PRIORITY
    const PATTERN_PRIORITY = [
      "OUTPUT_TO_RESOURCE",
      "RESOURCE_TO_RESPONSIBILITY",
      "LEARNING_TO_OUTPUT",
      "RESOURCE_PLUS_COOPERATION",
      "OUTPUT_PLUS_CHANGE",
      "RESPONSIBILITY_PLUS_CHANGE"
    ];

    bestMatches.sort((a, b) => PATTERN_PRIORITY.indexOf(a.patternId) - PATTERN_PRIORITY.indexOf(b.patternId));
    primaryPattern = bestMatches[0];
    primaryTier = primaryPattern.tier;

    // Strategy Selection
    const annualCandidate = mapActivityToStrategyCandidate(evidence.ANNUAL_ACTIVITY);
    
    // Check for MIXED conditions
    let mixed = false;
    
    // 1. Multiple top-tier patterns with DIFFERENT candidate strategies?
    if (bestMatches.length > 1) {
      // Find what strategy each would resolve to independently
      const resolveStrategy = (p) => {
        if (p.allowedStrategyStates.includes(annualCandidate)) return annualCandidate;
        return p.defaultStrategyState;
      };
      const strats = bestMatches.map(resolveStrategy);
      const uniqueStrats = [...new Set(strats)];
      if (uniqueStrats.length > 1) {
        mixed = true;
      }
    }
    
    if (mixed) {
      strategyState = STRATEGY_STATE.MIXED;
    } else {
      if (primaryPattern.allowedStrategyStates.includes(annualCandidate)) {
        strategyState = annualCandidate;
      } else {
        strategyState = primaryPattern.defaultStrategyState;
      }
    }
  } else {
    // Fallback logic
    if (evidence.DAEUN_ACTIVITY && evidence.DAEUN_ACTIVITY === evidence.ANNUAL_ACTIVITY) {
      primaryTier = TIER.TIER_C;
    } else if (evidence.ANNUAL_ACTIVITY) {
      primaryTier = TIER.TIER_D;
    }
    
    if (evidence.ANNUAL_ACTIVITY) {
      strategyState = mapActivityToStrategyCandidate(evidence.ANNUAL_ACTIVITY);
    } else if (evidence.DAY_BRANCH_ANNUAL_RELATION === RELATION.CLASH) {
      strategyState = STRATEGY_STATE.TRANSITION;
    } else {
      strategyState = STRATEGY_STATE.MIXED;
    }
  }

  return {
    primaryPattern,
    primaryTier,
    strategyState,
    conflictExist,
    partialSignals: allPartialSignals
  };
}

function processAnnualTiming(userBazi, annualObj, dayBranch) {
  // Extract evidence
  const evidence = {
    DAEUN_ACTIVITY: mapTenGodToActivity(annualObj.daYunStemTenGod),
    ANNUAL_ACTIVITY: mapTenGodToActivity(annualObj.annualStemTenGod),
    DAY_BRANCH_DAEUN_RELATION: getBranchRelation(dayBranch, annualObj.activeDaYunBranch) || RELATION.NONE,
    DAY_BRANCH_ANNUAL_RELATION: getBranchRelation(dayBranch, annualObj.annualBranch) || RELATION.NONE
  };
  
  const matchResults = analyzeAnnualPattern(evidence);
  const selection = selectPrimaryPatternAndState(matchResults, evidence);
  
  return {
    year: annualObj.year,
    age: annualObj.age,
    activeDaYun: annualObj.activeDaYunGanZhi,
    evidence,
    patternMatches: matchResults,
    matchedCompositePatterns: matchResults.filter(r => r.tier === TIER.TIER_A || r.tier === TIER.TIER_B).map(r => r.patternId),
    partialSignals: selection.partialSignals,
    primaryPatternId: selection.primaryPattern ? selection.primaryPattern.patternId : null,
    primaryTier: selection.primaryTier,
    strategyState: selection.strategyState,
    conflictExist: selection.conflictExist,
    focusAreas: selection.primaryPattern ? selection.primaryPattern.focusAreas : [],
    domainTargets: selection.primaryPattern ? selection.primaryPattern.domainTargets : [],
    explainability: buildExplainability(selection.primaryPattern, evidence, selection.strategyState)
  };
}

function buildExplainability(primaryPattern, evidence, strategyState) {
  if (!primaryPattern) return "해당 연도의 단일 활동 신호에 따른 전략입니다.";
  return `해당 구간은 대운의 ${evidence.DAEUN_ACTIVITY} 환경과 세운의 ${evidence.ANNUAL_ACTIVITY} 환경이 결합하여 ${primaryPattern.patternId} 조건을 필수 만족하는 구조입니다. 이에 ${strategyState} 전략이 추천됩니다.`;
}

function groupWindows(annualResults) {
  const windows = [];
  let currentWindow = null;

  for (let i = 0; i < annualResults.length; i++) {
    const cur = annualResults[i];
    
    // Conditions to break window: 
    // 1. Different Strategy State
    // 2. MIXED state
    // 3. Different DaYun
    // 4. No shared pattern family (if composite exists)
    // 5. Gap in years (cur.year !== currentWindow.years[currentWindow.years.length - 1].year + 1)
    
    let shouldBreak = false;
    
    if (!currentWindow) {
      shouldBreak = false;
    } else {
      if (cur.strategyState !== currentWindow.strategyState) shouldBreak = true;
      if (cur.strategyState === STRATEGY_STATE.MIXED) shouldBreak = true;
      if (cur.activeDaYun !== currentWindow.activeDaYun) shouldBreak = true;
      if (cur.year !== currentWindow.years[currentWindow.years.length - 1].year + 1) shouldBreak = true;
      
      // Check shared family if we have primary patterns
      if (cur.primaryPatternId && currentWindow.primaryPatternIds.length > 0) {
        // Since all composites are "COMPOSITE" family, we just check if they are both composite.
        // If we had distinct families, we would check intersection. Here they all share "COMPOSITE".
      }
    }
    
    if (shouldBreak && currentWindow) {
      currentWindow.endYear = currentWindow.years[currentWindow.years.length - 1].year;
      currentWindow.duration = currentWindow.endYear - currentWindow.startYear + 1;
      windows.push(currentWindow);
      currentWindow = null;
    }
    
    if (!currentWindow) {
      currentWindow = {
        startYear: cur.year,
        endYear: cur.year,
        duration: 1,
        activeDaYun: cur.activeDaYun,
        strategyState: cur.strategyState,
        years: [],
        primaryPatternIds: [],
        bestTier: cur.primaryTier,
        conflictExist: cur.conflictExist
      };
    }
    
    currentWindow.years.push(cur);
    if (cur.primaryPatternId && !currentWindow.primaryPatternIds.includes(cur.primaryPatternId)) {
      currentWindow.primaryPatternIds.push(cur.primaryPatternId);
    }
    
    // Update best tier
    if (cur.primaryTier === TIER.TIER_A) currentWindow.bestTier = TIER.TIER_A;
    if (cur.primaryTier === TIER.TIER_B && currentWindow.bestTier !== TIER.TIER_A) currentWindow.bestTier = TIER.TIER_B;
    
    // Update conflict
    if (cur.conflictExist) currentWindow.conflictExist = true;
  }
  
  if (currentWindow) {
    currentWindow.endYear = currentWindow.years[currentWindow.years.length - 1].year;
    currentWindow.duration = currentWindow.endYear - currentWindow.startYear + 1;
    windows.push(currentWindow);
  }
  
  return windows;
}

function sortPrimeCandidates(windows) {
  // Only TIER_A and TIER_B
  const candidates = windows.filter(w => w.bestTier === TIER.TIER_A || w.bestTier === TIER.TIER_B);
  
  const TIER_WEIGHT = {
    TIER_A: 1,
    TIER_B: 2,
    TIER_C: 3,
    TIER_D: 4
  };

  candidates.sort((a, b) => {
    // 1. bestTier ascending (TIER_A < TIER_B)
    if (TIER_WEIGHT[a.bestTier] !== TIER_WEIGHT[b.bestTier]) {
      return TIER_WEIGHT[a.bestTier] - TIER_WEIGHT[b.bestTier];
    }
    // 2. conflictExist false 우선
    if (a.conflictExist !== b.conflictExist) {
      return a.conflictExist ? 1 : -1;
    }
    // 3. duration 긴 순
    if (a.duration !== b.duration) {
      return b.duration - a.duration;
    }
    // 4. primaryPatternId deterministic order (using alphabetical for simplicity)
    const pA = a.primaryPatternIds.length > 0 ? a.primaryPatternIds[0] : "";
    const pB = b.primaryPatternIds.length > 0 ? b.primaryPatternIds[0] : "";
    if (pA !== pB) {
      return pA.localeCompare(pB);
    }
    // 5. startYear 오름차순
    return a.startYear - b.startYear;
  });
  
  return candidates.slice(0, 5);
}

function processPremiumReport(sajuResult, lunarEightChar) {
  const dayBranch = sajuResult.dayPillar[1];
  
  // Need to extract DaYun and LiuNian from lunarEightChar (which is bazi)
  const genderIndex = sajuResult.gender === 'm' ? 1 : 0;
  const yun = lunarEightChar.getYun(genderIndex);
  const dayuns = yun.getDaYun();
  
  const annualResults = [];
  
  // We'll calculate for a standard 80 year span (8 dayuns)
  for (let i = 0; i < 8 && i < dayuns.length; i++) {
    const dy = dayuns[i];
    const dyGanZhi = dy.getGanZhi();
    if (!dyGanZhi) continue;
    const dyStem = dyGanZhi[0];
    const dyBranch = dyGanZhi[1];
    const { calculateTenGod } = require('./engineAnalysis.js');
    const dyStemTenGod = calculateTenGod(sajuResult.dayMaster, dyStem);
    
    const liunians = dy.getLiuNian();
    
    for (let j = 0; j < liunians.length; j++) {
      const ln = liunians[j];
      const lnGanZhi = ln.getGanZhi();
      const lnStemTenGod = calculateTenGod(sajuResult.dayMaster, lnGanZhi[0]);
      
      const annualObj = {
        year: ln.getYear(),
        age: ln.getAge(),
        activeDaYunGanZhi: dyGanZhi,
        activeDaYunBranch: dyBranch,
        daYunStemTenGod: dyStemTenGod,
        annualBranch: lnGanZhi[1],
        annualStemTenGod: lnStemTenGod
      };
      
      const res = processAnnualTiming(sajuResult, annualObj, dayBranch);
      annualResults.push(res);
    }
  }
  
  const windows = groupWindows(annualResults);
  const primeCandidates = sortPrimeCandidates(windows);
  
  return {
    annualResults,
    windows,
    primeCandidateWindows: primeCandidates
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mapTenGodToActivity,
    mapActivityToStrategyCandidate,
    evaluateEvidenceExpression,
    analyzeAnnualPattern,
    selectPrimaryPatternAndState,
    processAnnualTiming,
    groupWindows,
    sortPrimeCandidates,
    processPremiumReport
  };
}
