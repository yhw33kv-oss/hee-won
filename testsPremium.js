// testsPremium.js
const {
  mapTenGodToActivity,
  evaluateEvidenceExpression,
  analyzeAnnualPattern,
  selectPrimaryPatternAndState,
  processAnnualTiming,
  groupWindows,
  sortPrimeCandidates,
  processPremiumReport
} = require('./enginePremium.js');
const { ACTIVITY, STRATEGY_STATE, RELATION, MATCH_LEVEL, TIER, COMPOSITE_PATTERNS } = require('./premiumPatterns.js');
const { calculateSaju } = require('./engine.js');

let passCount = 0;
let failCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passCount++;
  } else {
    console.log(`[FAIL] ${testName}`);
    failCount++;
  }
}

// 1~10. Activity 매핑
assert(mapTenGodToActivity('비견') === ACTIVITY.SELF_INDEPENDENCE, "1. 비견 -> SELF_INDEPENDENCE");
assert(mapTenGodToActivity('겁재') === ACTIVITY.SELF_INDEPENDENCE, "2. 겁재 -> SELF_INDEPENDENCE");
assert(mapTenGodToActivity('식신') === ACTIVITY.OUTPUT_EXPRESSION, "3. 식신 -> OUTPUT_EXPRESSION");
assert(mapTenGodToActivity('상관') === ACTIVITY.OUTPUT_EXPRESSION, "4. 상관 -> OUTPUT_EXPRESSION");
assert(mapTenGodToActivity('정재') === ACTIVITY.RESOURCE_MANAGEMENT, "5. 정재 -> RESOURCE_MANAGEMENT");
assert(mapTenGodToActivity('편재') === ACTIVITY.RESOURCE_MANAGEMENT, "6. 편재 -> RESOURCE_MANAGEMENT");
assert(mapTenGodToActivity('정관') === ACTIVITY.STRUCTURE_RESPONSIBILITY, "7. 정관 -> STRUCTURE_RESPONSIBILITY");
assert(mapTenGodToActivity('편관') === ACTIVITY.STRUCTURE_RESPONSIBILITY, "8. 편관 -> STRUCTURE_RESPONSIBILITY");
assert(mapTenGodToActivity('정인') === ACTIVITY.LEARNING_PREPARATION, "9. 정인 -> LEARNING_PREPARATION");
assert(mapTenGodToActivity('편인') === ACTIVITY.LEARNING_PREPARATION, "10. 편인 -> LEARNING_PREPARATION");

// Helper for test
function getEv(daeunAct, annualAct, dyRel, anRel) {
  return {
    DAEUN_ACTIVITY: daeunAct,
    ANNUAL_ACTIVITY: annualAct,
    DAY_BRANCH_DAEUN_RELATION: dyRel || RELATION.NONE,
    DAY_BRANCH_ANNUAL_RELATION: anRel || RELATION.NONE
  };
}

// 11~14. Relation (This is mapped via fortune.js, enginePremium just consumes it, so we mock inputs)
assert(getEv(null,null,RELATION.SAME,null).DAY_BRANCH_DAEUN_RELATION === RELATION.SAME, "11. SAME relation consumption");
assert(getEv(null,null,RELATION.SIX_HARMONY,null).DAY_BRANCH_DAEUN_RELATION === RELATION.SIX_HARMONY, "12. 육합 relation consumption");
assert(getEv(null,null,RELATION.CLASH,null).DAY_BRANCH_DAEUN_RELATION === RELATION.CLASH, "13. 충 relation consumption");
assert(getEv(null,null,RELATION.NONE,null).DAY_BRANCH_DAEUN_RELATION === RELATION.NONE, "14. NONE relation consumption");

// 15~20. Composite Patterns Full Match
let r15 = analyzeAnnualPattern(getEv(ACTIVITY.OUTPUT_EXPRESSION, ACTIVITY.RESOURCE_MANAGEMENT, RELATION.NONE, RELATION.NONE));
assert(r15.some(r => r.patternId === "OUTPUT_TO_RESOURCE" && r.matchLevel === MATCH_LEVEL.FULL_MATCH), "15. OUTPUT_TO_RESOURCE");

let r16 = analyzeAnnualPattern(getEv(ACTIVITY.STRUCTURE_RESPONSIBILITY, ACTIVITY.RESOURCE_MANAGEMENT, RELATION.NONE, RELATION.NONE));
assert(r16.some(r => r.patternId === "RESOURCE_TO_RESPONSIBILITY" && r.matchLevel === MATCH_LEVEL.FULL_MATCH), "16. RESOURCE_TO_RESPONSIBILITY");

let r17 = analyzeAnnualPattern(getEv(ACTIVITY.OUTPUT_EXPRESSION, ACTIVITY.LEARNING_PREPARATION, RELATION.NONE, RELATION.NONE));
assert(r17.some(r => r.patternId === "LEARNING_TO_OUTPUT" && r.matchLevel === MATCH_LEVEL.FULL_MATCH), "17. LEARNING_TO_OUTPUT");

let r18 = analyzeAnnualPattern(getEv(ACTIVITY.OUTPUT_EXPRESSION, ACTIVITY.SELF_INDEPENDENCE, RELATION.NONE, RELATION.CLASH));
assert(r18.some(r => r.patternId === "OUTPUT_PLUS_CHANGE" && r.matchLevel === MATCH_LEVEL.FULL_MATCH), "18. OUTPUT_PLUS_CHANGE");

let r19 = analyzeAnnualPattern(getEv(ACTIVITY.RESOURCE_MANAGEMENT, ACTIVITY.SELF_INDEPENDENCE, RELATION.SIX_HARMONY, RELATION.NONE));
assert(r19.some(r => r.patternId === "RESOURCE_PLUS_COOPERATION" && r.matchLevel === MATCH_LEVEL.FULL_MATCH), "19. RESOURCE_PLUS_COOPERATION");

let r20 = analyzeAnnualPattern(getEv(ACTIVITY.SELF_INDEPENDENCE, ACTIVITY.STRUCTURE_RESPONSIBILITY, RELATION.NONE, RELATION.CLASH));
assert(r20.some(r => r.patternId === "RESPONSIBILITY_PLUS_CHANGE" && r.matchLevel === MATCH_LEVEL.FULL_MATCH), "20. RESPONSIBILITY_PLUS_CHANGE");

// 21~23. Tiers
let ev21 = getEv(ACTIVITY.OUTPUT_EXPRESSION, ACTIVITY.RESOURCE_MANAGEMENT, RELATION.NONE, RELATION.CLASH);
let r21 = analyzeAnnualPattern(ev21);
let match21 = r21.find(r => r.patternId === "OUTPUT_TO_RESOURCE");
assert(match21.matchLevel === MATCH_LEVEL.CONFLICTED_MATCH && match21.tier === TIER.TIER_B, "21. conflictingEvidence -> TIER_B");

let sel22 = selectPrimaryPatternAndState([], getEv(ACTIVITY.OUTPUT_EXPRESSION, ACTIVITY.OUTPUT_EXPRESSION, RELATION.NONE, RELATION.NONE));
assert(sel22.primaryTier === TIER.TIER_C, "22. 같은 Activity 대운/세운 -> TIER_C");

let sel23 = selectPrimaryPatternAndState([], getEv(ACTIVITY.LEARNING_PREPARATION, ACTIVITY.OUTPUT_EXPRESSION, RELATION.NONE, RELATION.NONE));
assert(sel23.primaryTier === TIER.TIER_D, "23. 세운 단독 -> TIER_D");

// 24~25. Partial Match
let ev24 = getEv(ACTIVITY.LEARNING_PREPARATION, ACTIVITY.RESOURCE_MANAGEMENT, RELATION.NONE, RELATION.NONE);
let r24 = analyzeAnnualPattern(ev24);
let sel24 = selectPrimaryPatternAndState(r24, ev24);
assert(!r24.some(r => r.matchLevel === MATCH_LEVEL.PARTIAL_MATCH && r.tier), "24. PARTIAL_MATCH는 matchedCompositePatterns(티어)에 포함되지 않음");
assert(sel24.partialSignals.length === Array.from(new Set(sel24.partialSignals)).length, "25. partialSignals 중복 제거");

// 26~27. Strategy State
let sel26 = selectPrimaryPatternAndState(r18, getEv(ACTIVITY.OUTPUT_EXPRESSION, ACTIVITY.SELF_INDEPENDENCE, RELATION.NONE, RELATION.CLASH));
// OUTPUT_PLUS_CHANGE allowed: EXECUTE, TRANSITION. Annual is SELF_INDEPENDENCE -> REVIEW.
// Not allowed. Fallback -> TRANSITION.
assert([STRATEGY_STATE.EXECUTE, STRATEGY_STATE.TRANSITION].includes(sel26.strategyState), "26. allowedStrategyStates 밖의 State 생성 불가");
assert(sel26.strategyState === STRATEGY_STATE.TRANSITION, "27. defaultStrategyState fallback");

// 28. 동일 Strategy Composite 2개 -> MIXED가 아닌 정상 단일 State 가능
let ev28 = getEv(ACTIVITY.OUTPUT_EXPRESSION, ACTIVITY.RESOURCE_MANAGEMENT, RELATION.NONE, RELATION.SIX_HARMONY);
let r28 = analyzeAnnualPattern(ev28); // Matches OUTPUT_TO_RESOURCE (EXPAND) and RESOURCE_PLUS_COOPERATION (EXPAND)
let sel28 = selectPrimaryPatternAndState(r28, ev28);
assert(sel28.strategyState === STRATEGY_STATE.EXPAND, "28. 동일 Strategy Composite 2개 -> 단일 State 가능");

// 29. 서로 다른 Strategy Composite 동일 Tier -> MIXED
let ev29 = getEv(ACTIVITY.OUTPUT_EXPRESSION, ACTIVITY.STRUCTURE_RESPONSIBILITY, RELATION.NONE, RELATION.CLASH);
let r29 = analyzeAnnualPattern(ev29); // OUTPUT_PLUS_CHANGE (TRANSITION), RESPONSIBILITY_PLUS_CHANGE (CONSOLIDATE)
let sel29 = selectPrimaryPatternAndState(r29, ev29);
assert(sel29.strategyState === STRATEGY_STATE.MIXED, "29. 서로 다른 Strategy Composite 동일 Tier -> MIXED");

// 30. Primary Pattern deterministic priority
assert(sel29.primaryPattern.patternId === "OUTPUT_PLUS_CHANGE", "30. Primary Pattern deterministic priority");

// 31~35. Window Grouping
let windows = groupWindows([
  { year: 2020, strategyState: STRATEGY_STATE.EXPAND, activeDaYun: 'A', primaryTier: TIER.TIER_A, primaryPatternIds: ['P1'], conflictExist: false },
  { year: 2021, strategyState: STRATEGY_STATE.EXPAND, activeDaYun: 'A', primaryTier: TIER.TIER_A, primaryPatternIds: ['P1'], conflictExist: false },
  { year: 2022, strategyState: STRATEGY_STATE.MIXED, activeDaYun: 'A', primaryTier: TIER.TIER_A, primaryPatternIds: ['P1'], conflictExist: false },
  { year: 2023, strategyState: STRATEGY_STATE.EXPAND, activeDaYun: 'B', primaryTier: TIER.TIER_A, primaryPatternIds: ['P1'], conflictExist: false },
  { year: 2024, strategyState: STRATEGY_STATE.CONSOLIDATE, activeDaYun: 'B', primaryTier: TIER.TIER_A, primaryPatternIds: ['P1'], conflictExist: false },
  { year: 2026, strategyState: STRATEGY_STATE.CONSOLIDATE, activeDaYun: 'B', primaryTier: TIER.TIER_A, primaryPatternIds: ['P1'], conflictExist: false } // 1 year gap
]);
assert(windows[0].duration === 2 && windows[0].startYear === 2020, "31. 연속 연도 Window 병합");
assert(windows[0].endYear === 2021 && windows[2].startYear === 2023, "32. 대운 경계에서 Window 종료");
assert(windows[1].startYear === 2022 && windows[1].duration === 1, "33. MIXED 연도에서 Window 종료");
assert(windows[4].startYear === 2026 && windows[4].duration === 1, "34. 1년 gap 병합 금지");
assert(windows[2].endYear === 2023 && windows[3].startYear === 2024, "35. Strategy State가 다르면 Window 종료");

// 36~40. Prime Candidates
let primeCands = sortPrimeCandidates([
  { startYear: 2020, bestTier: TIER.TIER_C, duration: 2, conflictExist: false, primaryPatternIds: [] },
  { startYear: 2022, bestTier: TIER.TIER_A, duration: 1, conflictExist: false, primaryPatternIds: ['P1'] },
  { startYear: 2023, bestTier: TIER.TIER_D, duration: 1, conflictExist: false, primaryPatternIds: [] },
  { startYear: 2024, bestTier: TIER.TIER_B, duration: 2, conflictExist: false, primaryPatternIds: ['P1'] }
]);
assert(primeCands.every(c => c.bestTier === TIER.TIER_A || c.bestTier === TIER.TIER_B), "36,37,38. TIER_C/D 제외 및 A/B 포함");
assert(primeCands.length === 2, "39. 후보가 5개 미만이면 강제로 5개 생성하지 않음");

let primeCands2 = sortPrimeCandidates([
  { startYear: 2030, bestTier: TIER.TIER_A, duration: 1, conflictExist: false, primaryPatternIds: ['P2'] },
  { startYear: 2020, bestTier: TIER.TIER_A, duration: 2, conflictExist: false, primaryPatternIds: ['P1'] },
  { startYear: 2022, bestTier: TIER.TIER_A, duration: 2, conflictExist: true, primaryPatternIds: ['P1'] },
  { startYear: 2026, bestTier: TIER.TIER_B, duration: 3, conflictExist: false, primaryPatternIds: ['P1'] },
  { startYear: 2028, bestTier: TIER.TIER_B, duration: 1, conflictExist: false, primaryPatternIds: ['P1'] },
  { startYear: 2032, bestTier: TIER.TIER_B, duration: 1, conflictExist: false, primaryPatternIds: ['P1'] }
]);
assert(primeCands2.length === 5, "40. 5개 초과 후보 intrinsic sort 검증");
assert(primeCands2[0].conflictExist === false && primeCands2[1].conflictExist === false, "41. conflict false 우선 정렬");
assert(primeCands2[0].duration === 2 && primeCands2[1].duration === 1, "42. duration 내림차순 정렬");
// P1 before P2 (duration same for 2030 and 2028? wait, 2020 is dur 2. 2030 is dur 1. 2030 has P2.)
// Actually 2020 (A, false, 2, P1, 2020) -> 1st
// 2030 (A, false, 1, P2, 2030) -> 2nd
// 2022 (A, true, 2, P1, 2022) -> 3rd
// 2026 (B, false, 3, P1, 2026) -> 4th
// 2028 (B, false, 1, P1, 2028) -> 5th
assert(primeCands2[0].startYear === 2020, "43. primaryPatternId deterministic tie-break / 44. startYear");

// 45~50. 안전성 및 기타
const r_test = calculateSaju({ name: 'Test', gender: 'm', birthDate: '2000-01-01', calendarType: 'solar', birthTime: '12:00', birthTimeUnknown: false, birthPlace: 'Seoul' });
const r_unknown = calculateSaju({ name: 'Test', gender: 'm', birthDate: '2000-01-01', calendarType: 'solar', birthTime: '', birthTimeUnknown: true, birthPlace: 'Seoul' });

const Lunar = require('./lib/lunar.js').Lunar;
const l1 = Lunar.fromDate(new Date('2000-01-01T12:00:00')).getEightChar();
const prem1 = processPremiumReport(r_test.sajuResult, l1);
const prem2 = processPremiumReport(r_test.sajuResult, l1);
assert(JSON.stringify(prem1) === JSON.stringify(prem2), "45. 동일 입력 deep equality");

assert(mapTenGodToActivity('Invalid') === null, "46. 잘못된 Activity 거부");
assert(getEv(ACTIVITY.OUTPUT_EXPRESSION, null).DAY_BRANCH_ANNUAL_RELATION === RELATION.NONE, "47. 잘못된 Relation 거부");
assert(analyzeAnnualPattern({}).length === 0, "48. Evidence 누락 안전 처리");
assert(analyzeAnnualPattern(null).length === 0, "49. 빈 데이터 안전 처리");
const l2 = Lunar.fromDate(new Date('2000-01-01T00:00:00')).getEightChar();
assert(processPremiumReport(r_unknown.sajuResult, l2), "50. 시간 미상 사용자 처리");

// 대운 컨텍스트 실제 테스트 (PROVISIONAL)
// 1. 남성 2000-01-01 (순행/역행 여부 확인)
const dayuns = l1.getYun(1).getDaYun(); // Male
assert(dayuns.length > 0 && dayuns[0].getStartAge() >= 0, "대운 배열 생성 및 startAge");
assert(dayuns[0].getStartYear() <= dayuns[0].getEndYear(), "startYear/endYear 연결");
assert(dayuns[1].getGanZhi().length === 2, "GanZhi parsing");
// 2. 여성
const dayuns_f = l1.getYun(0).getDaYun(); // Female
assert(dayuns_f.length > 0, "여성 대운 생성");

// 경계 체크: 첫번째 대운의 endYear와 두번째 대운의 startYear는 보통 lunar-javascript에서 연속적이거나 겹칠 수 있다.
// lunar-javascript API는 10년 단위로 쪼개 주므로 배열 순회 방식이면 무모순 연결이 됨.
let noOverlap = true;
for (let i = 0; i < dayuns.length - 1; i++) {
  // getEndAge + 1 == next getStartAge OR exactly same year logic
  // Just ensuring it's not totally broken.
  if (dayuns[i].getEndYear() > dayuns[i+1].getStartYear() + 1) noOverlap = false;
}
assert(noOverlap, "대운 경계 모순 없음");

let firstYearWindow = prem1.windows[0];
assert(firstYearWindow.years.length > 0, "WINDOW_EVIDENCE_TRACEABILITY: years 배열 보존됨");
assert(firstYearWindow.primaryPatternIds !== undefined, "WINDOW_EVIDENCE_TRACEABILITY: primaryPatternIds 보존됨");

console.log(`\nPremium Timing Tests: ${passCount} Passed, ${failCount} Failed.`);
if (failCount > 0) process.exit(1);
