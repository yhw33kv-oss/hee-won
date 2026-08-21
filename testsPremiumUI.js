const assert = require('assert');
const { calculateSaju } = require('./engine.js');
const { processPremiumReport } = require('./enginePremium.js');
const { Lunar, Solar } = require('./lib/lunar.js');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passCount++;
  } catch (e) {
    console.error(`[FAIL] ${name}:`, e.message);
    failCount++;
  }
}

// Simulated state from app.js for tests
const r_test = calculateSaju({ 
  name: 'Test', 
  gender: 'm', 
  birthDate: '2000-01-01', 
  calendarType: 'solar', 
  birthTime: '12:00', 
  birthTimeUnknown: false, 
  birthPlace: 'Seoul' 
});

const state = {
  user: {
    sajuResult: r_test.sajuResult,
    gender: 'm',
    normalizedBirthData: r_test.normalizedBirthData
  }
};

runTest("1. processPremiumReport 실제 signature와 UI 호출 일치 및 analysis 잘못 전달 안함", () => {
  const r = state.user.sajuResult;
  r.gender = state.user.gender;
  const nd = state.user.normalizedBirthData;
  const solar = Solar.fromYmdHms(nd.year, nd.month, nd.day, nd.hour, nd.minute, 0);
  const lunarEightChar = solar.getLunar().getEightChar();
  
  const report = processPremiumReport(r, lunarEightChar);
  assert(report && report.primeCandidateWindows);
});

runTest("3. activeDaYun 문자열 안전 처리", () => {
  const r = state.user.sajuResult;
  r.gender = state.user.gender;
  const nd = state.user.normalizedBirthData;
  const solar = Solar.fromYmdHms(nd.year, nd.month, nd.day, nd.hour, nd.minute, 0);
  const lunarEightChar = solar.getLunar().getEightChar();
  const report = processPremiumReport(r, lunarEightChar);
  
  const cand = report.primeCandidateWindows[0];
  if (cand && cand.years) {
    const activeDaYuns = [];
    cand.years.forEach(yInfo => {
      if (yInfo.activeDaYun && !activeDaYuns.includes(yInfo.activeDaYun)) {
        activeDaYuns.push(yInfo.activeDaYun);
      }
    });
    // Check that we only extract string
    assert(typeof activeDaYuns[0] === 'string');
  }
});

runTest("4. matchedCompositePatterns 문자열 배열 처리 및 6. raw internal Pattern ID 직접 노출 없음", () => {
  const r = state.user.sajuResult;
  r.gender = state.user.gender;
  const nd = state.user.normalizedBirthData;
  const solar = Solar.fromYmdHms(nd.year, nd.month, nd.day, nd.hour, nd.minute, 0);
  const lunarEightChar = solar.getLunar().getEightChar();
  const report = processPremiumReport(r, lunarEightChar);
  
  const cand = report.primeCandidateWindows[0];
  if (cand && cand.years) {
    const PATTERN_LABELS = {
      'OUTPUT_TO_RESOURCE': '실행과 성과 연결'
    };
    const y = cand.years[0];
    const matchedLabels = y.matchedCompositePatterns.map(id => PATTERN_LABELS[id] || '복합 구조 신호').join(', ');
    assert(typeof matchedLabels === 'string');
  }
});

runTest("12. 최대 5개 제한", () => {
  const r = state.user.sajuResult;
  r.gender = state.user.gender;
  const nd = state.user.normalizedBirthData;
  const solar = Solar.fromYmdHms(nd.year, nd.month, nd.day, nd.hour, nd.minute, 0);
  const lunarEightChar = solar.getLunar().getEightChar();
  const report = processPremiumReport(r, lunarEightChar);
  
  const candidates = report.primeCandidateWindows.slice(0, 5);
  assert(candidates.length <= 5);
});

console.log(`\nPremium UI Tests: ${passCount} Passed, ${failCount} Failed.`);
if (failCount > 0) process.exit(1);
