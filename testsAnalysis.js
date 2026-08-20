const { analyzeSaju, BAZI_MAP, calculateTenGod } = require('./engineAnalysis.js');
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

// 1. 천간 10개 음양 전수 검증
const expectedStemsYinYang = { '甲': '양', '乙': '음', '丙': '양', '丁': '음', '戊': '양', '己': '음', '庚': '양', '辛': '음', '壬': '양', '癸': '음' };
let stemsYYOk = true;
for (const s in expectedStemsYinYang) {
  if (BAZI_MAP.stems[s].y !== expectedStemsYinYang[s]) stemsYYOk = false;
}
assert(stemsYYOk, '천간 10개 음양 전수 검증');

// 2. 지지 12개 음양(전통 체 기준) 전수 검증
const expectedBranchesYinYang = { '子': '양', '丑': '음', '寅': '양', '卯': '음', '辰': '양', '巳': '음', '午': '양', '未': '음', '申': '양', '酉': '음', '戌': '양', '亥': '음' };
let branchesYYOk = true;
for (const b in expectedBranchesYinYang) {
  if (BAZI_MAP.branches[b].y !== expectedBranchesYinYang[b]) branchesYYOk = false;
}
assert(branchesYYOk, '지지 12개 음양 전수 검증');

// 3. 천간 10개 오행 전수 검증
const expectedStemsE = { '甲': '목', '乙': '목', '丙': '화', '丁': '화', '戊': '토', '己': '토', '庚': '금', '辛': '금', '壬': '수', '癸': '수' };
let stemsEOk = true;
for (const s in expectedStemsE) {
  if (BAZI_MAP.stems[s].e !== expectedStemsE[s]) stemsEOk = false;
}
assert(stemsEOk, '천간 10개 오행 전수 검증');

// 4. 지지 12개 오행 전수 검증
const expectedBranchesE = { '子': '수', '丑': '토', '寅': '목', '卯': '목', '辰': '토', '巳': '화', '午': '화', '未': '토', '申': '금', '酉': '금', '戌': '토', '亥': '수' };
let branchesEOk = true;
for (const b in expectedBranchesE) {
  if (BAZI_MAP.branches[b].e !== expectedBranchesE[b]) branchesEOk = false;
}
assert(branchesEOk, '지지 12개 오행 전수 검증');

// Ten Gods Rules (10 types explicitly tested)
assert(calculateTenGod('목', '양', '목', '양') === '비견', '비견 (동일오행/동일음양)');
assert(calculateTenGod('목', '양', '목', '음') === '겁재', '겁재 (동일오행/다른음양)');
assert(calculateTenGod('목', '양', '화', '양') === '식신', '식신 (생함/동일음양)');
assert(calculateTenGod('목', '양', '화', '음') === '상관', '상관 (생함/다른음양)');
assert(calculateTenGod('목', '양', '토', '양') === '편재', '편재 (극함/동일음양)');
assert(calculateTenGod('목', '양', '토', '음') === '정재', '정재 (극함/다른음양)');
assert(calculateTenGod('목', '양', '금', '양') === '편관', '편관 (극받음/동일음양)');
assert(calculateTenGod('목', '양', '금', '음') === '정관', '정관 (극받음/다른음양)');
assert(calculateTenGod('목', '양', '수', '양') === '편인', '편인 (생받음/동일음양)');
assert(calculateTenGod('목', '양', '수', '음') === '정인', '정인 (생받음/다른음양)');

// Integration Test
const mockUnknownTimeResult = calculateSaju({ name: 'Test', gender: 'm', birthDate: '2000-01-01', calendarType: 'solar', birthTime: '12:00', birthTimeUnknown: true, birthPlace: 'Seoul' });
const an1 = analyzeSaju(mockUnknownTimeResult.sajuResult);

assert(an1.stemTenGods.hour === '미상', '시간 미상 시 시주 제외');
const totalElementsAn1 = an1.fiveElementCount['목'] + an1.fiveElementCount['화'] + an1.fiveElementCount['토'] + an1.fiveElementCount['금'] + an1.fiveElementCount['수'];
assert(totalElementsAn1 === 6, '시간 미상 시 오행 합계 정상 (6개)');

const totalRawPct = an1.rawPercent['목'] + an1.rawPercent['화'] + an1.rawPercent['토'] + an1.rawPercent['금'] + an1.rawPercent['수'];
assert(Math.abs(totalRawPct - 100) < 0.000001, '오행 수학적 백분율 합계 허용오차 내 100%');
assert(typeof an1.displayPercent['목'] === 'string', '표시용 백분율 포맷팅 문자열 검증');

const mockKnownTimeResult = calculateSaju({ name: 'Test', gender: 'm', birthDate: '2000-01-01', calendarType: 'solar', birthTime: '23:00', birthTimeUnknown: false, birthPlace: 'Seoul' });
const an2 = analyzeSaju(mockKnownTimeResult.sajuResult);
const totalElementsAn2 = an2.fiveElementCount['목'] + an2.fiveElementCount['화'] + an2.fiveElementCount['토'] + an2.fiveElementCount['금'] + an2.fiveElementCount['수'];
assert(totalElementsAn2 === 8, '시간 있음 시 오행 합계 정상 (8개)');

console.log(`\nAnalysis Tests: ${passCount} Passed, ${failCount} Failed.`);
if (failCount > 0) process.exit(1);
