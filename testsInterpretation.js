const { generateInterpretation } = require('./interpretation.js');
const { analyzeSaju } = require('./engineAnalysis.js');
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

function checkProhibited(text) {
  const prohibited = ["반드시", "100%", "무조건", "확실히 부자가", "이혼", "사망", "큰 병", "사고가 난다"];
  for (const p of prohibited) {
    if (text.includes(p)) return false;
  }
  return true;
}

const mockInput = { name: 'Test', gender: 'm', birthDate: '2000-01-01', calendarType: 'solar', birthTime: '12:00', birthTimeUnknown: false, birthPlace: 'Seoul' };
const calc = calculateSaju(mockInput).sajuResult;
const an = analyzeSaju(calc);
const interp = generateInterpretation(an, calc);

const allText = interp.summary + interp.dayMasterInterpretation + interp.elementBalanceInterpretation + interp.careerInterpretation + interp.moneyInterpretation + interp.relationshipInterpretation + interp.cautions;

assert(checkProhibited(allText), 'PROHIBITED_EXPRESSION_CHECK');
assert(interp.evidence.timeUnknown === false, '시간 포함 확인');

const interp2 = generateInterpretation(an, calc);
assert(JSON.stringify(interp) === JSON.stringify(interp2), '해석 결과 동일 입력 재현성 (Deterministic)');

// Manually test all day masters and ten gods for coverage
const testCases = [
  { name: '목 일간', mockAn: { dayMaster: '甲', fiveElementCount: {'목':2,'화':1,'토':1,'금':1,'수':1}, stemTenGods: {year:'비견', month:'미상', hour:'미상'} } },
  { name: '화 일간', mockAn: { dayMaster: '丙', fiveElementCount: {'목':1,'화':2,'토':1,'금':1,'수':1}, stemTenGods: {year:'겁재', month:'미상', hour:'미상'} } },
  { name: '토 일간', mockAn: { dayMaster: '戊', fiveElementCount: {'목':1,'화':1,'토':2,'금':1,'수':1}, stemTenGods: {year:'식신', month:'미상', hour:'미상'} } },
  { name: '금 일간', mockAn: { dayMaster: '庚', fiveElementCount: {'목':1,'화':1,'토':1,'금':2,'수':1}, stemTenGods: {year:'상관', month:'미상', hour:'미상'} } },
  { name: '수 일간', mockAn: { dayMaster: '壬', fiveElementCount: {'목':1,'화':1,'토':1,'금':1,'수':2}, stemTenGods: {year:'편재', month:'미상', hour:'미상'} } },
  { name: '비견 포함', mockAn: { dayMaster: '甲', fiveElementCount: {'목':1,'화':1,'토':1,'금':1,'수':1}, stemTenGods: {year:'비견', month:'미상', hour:'미상'} } },
  { name: '겁재 포함', mockAn: { dayMaster: '甲', fiveElementCount: {'목':1,'화':1,'토':1,'금':1,'수':1}, stemTenGods: {year:'겁재', month:'미상', hour:'미상'} } },
  { name: '식신 포함', mockAn: { dayMaster: '甲', fiveElementCount: {'목':1,'화':1,'토':1,'금':1,'수':1}, stemTenGods: {year:'식신', month:'미상', hour:'미상'} } },
  { name: '상관 포함', mockAn: { dayMaster: '甲', fiveElementCount: {'목':1,'화':1,'토':1,'금':1,'수':1}, stemTenGods: {year:'상관', month:'미상', hour:'미상'} } },
  { name: '편재 포함', mockAn: { dayMaster: '甲', fiveElementCount: {'목':1,'화':1,'토':1,'금':1,'수':1}, stemTenGods: {year:'편재', month:'미상', hour:'미상'} } },
  { name: '정재 포함', mockAn: { dayMaster: '甲', fiveElementCount: {'목':1,'화':1,'토':1,'금':1,'수':1}, stemTenGods: {year:'정재', month:'미상', hour:'미상'} } },
  { name: '편관 포함', mockAn: { dayMaster: '甲', fiveElementCount: {'목':1,'화':1,'토':1,'금':1,'수':1}, stemTenGods: {year:'편관', month:'미상', hour:'미상'} } },
  { name: '정관 포함', mockAn: { dayMaster: '甲', fiveElementCount: {'목':1,'화':1,'토':1,'금':1,'수':1}, stemTenGods: {year:'정관', month:'미상', hour:'미상'} } },
  { name: '편인 포함', mockAn: { dayMaster: '甲', fiveElementCount: {'목':1,'화':1,'토':1,'금':1,'수':1}, stemTenGods: {year:'편인', month:'미상', hour:'미상'} } },
  { name: '정인 포함', mockAn: { dayMaster: '甲', fiveElementCount: {'목':1,'화':1,'토':1,'금':1,'수':1}, stemTenGods: {year:'정인', month:'미상', hour:'미상'} } },
  { name: '오행 단독 우세', mockAn: { dayMaster: '甲', fiveElementCount: {'목':5,'화':1,'토':0,'금':0,'수':0}, stemTenGods: {} } },
  { name: '오행 우세 동률', mockAn: { dayMaster: '甲', fiveElementCount: {'목':3,'화':3,'토':0,'금':0,'수':0}, stemTenGods: {} } },
  { name: '오행 부족 동률', mockAn: { dayMaster: '甲', fiveElementCount: {'목':3,'화':2,'토':0,'금':0,'수':0}, stemTenGods: {} } },
  { name: '시간 미상', mockAn: { dayMaster: '甲', fiveElementCount: {'목':1,'화':1,'토':1,'금':1,'수':1}, stemTenGods: {hour: '미상'} } }
];

const mockSajuBase = { hourPillarStatus: 'CALCULATED' };

testCases.forEach(tc => {
  const tInterp = generateInterpretation(tc.mockAn, tc.name === '시간 미상' ? {hourPillarStatus: 'UNKNOWN'} : mockSajuBase);
  assert(tInterp.summary.length > 0, tc.name + ' 해석 완료');
  if (tc.name === '시간 미상') {
    assert(tInterp.evidence.timeUnknown === true, '시간 미상 플래그 확인');
  }
});

console.log(`\nInterpretation Tests: ${passCount} Passed, ${failCount} Failed.`);
if (failCount > 0) process.exit(1);
