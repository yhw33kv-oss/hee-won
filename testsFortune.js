const { generateTodayFortune, getBranchRelation, getTodayPillars } = require('./fortune.js');
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

// 1. 오늘 날짜 간지 생성
const pillars = getTodayPillars(new Date('2024-01-01'));
assert(pillars.yearPillar && pillars.monthPillar && pillars.dayPillar, '오늘 날짜 간지 생성');

// 2. 동일 날짜 재현성 (Deterministic)
const r = calculateSaju({ name: 'Test', gender: 'm', birthDate: '2000-01-01', calendarType: 'solar', birthTime: '12:00', birthTimeUnknown: false, birthPlace: 'Seoul' }).sajuResult;
const f1 = generateTodayFortune(r, new Date('2024-01-01'));
const f2 = generateTodayFortune(r, new Date('2024-01-01'));
assert(JSON.stringify(f1) === JSON.stringify(f2), '동일 날짜 재현성 (랜덤 사용 없음)');

// 3. 날짜 변경 시 결과 변경
const f3 = generateTodayFortune(r, new Date('2024-01-02'));
assert(JSON.stringify(f1) !== JSON.stringify(f3), '날짜 변경 시 결과 변경');

// 5. 일지 SAME
assert(getBranchRelation('子', '子') === 'SAME', '일지 SAME 검증');

// 6. 육합 6쌍 전수
const harmonyPairs = [['子','丑'], ['寅','亥'], ['卯','戌'], ['辰','酉'], ['巳','申'], ['午','未']];
let hPass = true;
harmonyPairs.forEach(pair => {
  if (getBranchRelation(pair[0], pair[1]) !== 'SIX_HARMONY') hPass = false;
  if (getBranchRelation(pair[1], pair[0]) !== 'SIX_HARMONY') hPass = false;
});
assert(hPass, '육합 6쌍 전수 검증');

// 7. 충 6쌍 전수
const clashPairs = [['子','午'], ['丑','未'], ['寅','申'], ['卯','酉'], ['辰','戌'], ['巳','亥']];
let cPass = true;
clashPairs.forEach(pair => {
  if (getBranchRelation(pair[0], pair[1]) !== 'CLASH') cPass = false;
  if (getBranchRelation(pair[1], pair[0]) !== 'CLASH') cPass = false;
});
assert(cPass, '충 6쌍 전수 검증');

// 8. NONE
assert(getBranchRelation('子', '寅') === 'NONE', 'NONE 관계 검증');

// 10. 출생시간 미상
const ru = calculateSaju({ name: 'Test', gender: 'm', birthDate: '2000-01-01', calendarType: 'solar', birthTime: '', birthTimeUnknown: true, birthPlace: 'Seoul' }).sajuResult;
const fu = generateTodayFortune(ru, new Date('2024-01-01'));
assert(fu.evidence.userDayMaster && fu.evidence.userDayBranch, '시간 미상 사주도 정상 계산됨');

// 11. 금지 표현 & 13. 점수 생성 없음
const prohibited = ["반드시", "100%", "무조건"];
let noProhibited = true;
const allTexts = fu.sections.flow + fu.sections.career + fu.sections.money + fu.sections.rel + fu.sections.action;
for (const p of prohibited) {
  if (allTexts.includes(p)) noProhibited = false;
}
if (/\d+점/.test(allTexts)) noProhibited = false;
assert(noProhibited, '금지 표현 및 근거 없는 숫자 점수 없음');

// 14. 근거 데이터 추적
assert(fu.evidence.todayTenGod && fu.evidence.branchRelation, '근거 데이터 추적 확인');

console.log(`\nToday's Fortune Tests: ${passCount} Passed, ${failCount} Failed.`);
if (failCount > 0) process.exit(1);
