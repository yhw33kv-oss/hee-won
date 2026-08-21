const fs = require('fs');
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

// Mock DOM
global.document = {
  getElementById: (id) => {
    return {
      id,
      style: { display: '' },
      innerHTML: '',
      value: ''
    };
  },
  querySelector: (sel) => {
    return { checked: true, value: 'm' };
  }
};
global.window = {
  UndamjaePremiumEngine: {
    processPremiumReport
  }
};
global.Solar = Solar;

// We need to source app.js setupPremiumReport to test it.
const appJsCode = fs.readFileSync('app.js', 'utf8');
const setupPremiumReportCode = appJsCode.substring(appJsCode.indexOf('function setupPremiumReport()'));
eval(setupPremiumReportCode);

// Helper for UI testing
function renderUIForCase(birthDate, gender) {
  const r = calculateSaju({ name: 'Test', gender, birthDate, calendarType: 'solar', birthTime: '12:00', birthTimeUnknown: false, birthPlace: 'Seoul' });
  const [year, month, day] = birthDate.split('-').map(Number);
  const solar = Solar.fromYmdHms(year, month, day, 12, 0, 0);

  global.state = {
    user: {
      sajuResult: r.sajuResult,
      gender,
      normalizedBirthData: { year, month, day, hour: 12, minute: 0 }
    }
  };

  const containerMock = { id: 'premium-candidates-container', innerHTML: '' };
  global.document.getElementById = (id) => {
    if (id === 'premium-candidates-container') return containerMock;
    if (id === 'premium-no-data' || id === 'premium-has-data') return { style: {display:''} };
    return { value: '' };
  };

  setupPremiumReport();
  return { html: containerMock.innerHTML, report: processPremiumReport(r.sajuResult, solar.getLunar().getEightChar()) };
}

const { html: defaultHtml, report: defaultReport } = renderUIForCase('2000-01-01', 'm');

runTest("Premium Hero", () => assert(defaultHtml.includes('운담재 PREMIUM')));
runTest("Current Position", () => assert(defaultHtml.includes('현재 나는 어디에 있는가')));
runTest("Life Timeline", () => assert(defaultHtml.includes('내 인생 흐름 한눈에 보기')));
runTest("Nearest Key Period", () => assert(defaultHtml.includes('가장 가까운 핵심 시기')));
runTest("Opportunity", () => assert(defaultHtml.includes('기회 구간')));
runTest("Caution", () => assert(defaultHtml.includes('주의 구간')));
runTest("Prep Strategy", () => assert(defaultHtml.includes('준비 전략') || defaultHtml.includes('행동 전략 가이드')));
runTest("Action Strategy", () => assert(defaultHtml.includes('해야 할 일') && defaultHtml.includes('피해야 할 일')));
runTest("Category Analysis", () => assert(defaultHtml.includes('핵심 시기 분야별 해석')));
runTest("Decade Flow", () => assert(defaultHtml.includes('10년 단위 대운 흐름')));
runTest("Year Detail", () => assert(defaultHtml.includes('상세 분석 보기') || defaultHtml.includes('연도별 구조적 흐름') || defaultHtml.includes('억지로 전성기 후보로 생성하지 않습니다')));
runTest("Evidence", () => assert(defaultHtml.includes('판단 근거')));
runTest("Notice", () => assert(defaultHtml.includes('성공을 보장하는 시기가 아니라')));

runTest("zero candidate does not crash", () => {
  const { html } = renderUIForCase('1989-03-15', 'f');
  assert(html.length > 0);
});
runTest("zero candidate zero candidates", () => {
  const { html } = renderUIForCase('1989-03-15', 'f');
  assert(html.includes('주목할 전성기 후보'));
  assert(html.includes('전성기 후보 구간이 확인되지 않았습니다'));
});
runTest("no fake candidates", () => {
  const { html } = renderUIForCase('1989-03-15', 'f');
  assert(!html.includes('1위:'));
});

runTest("no undefined", () => assert(!defaultHtml.includes('undefined')));
runTest("no NaN", () => assert(!defaultHtml.includes('NaN')));
runTest("no null", () => assert(!defaultHtml.includes('null')));
runTest("no [object Object]", () => assert(!defaultHtml.includes('[object Object]')));
runTest("no raw enum", () => assert(!defaultHtml.includes('TIER_A') && !defaultHtml.includes('PREPARE') && !defaultHtml.includes('EXPAND')));
runTest("no prohibited claims", () => {
  const prohibited = ['100% 성공', '반드시 성공', '성공 확률', '최고의 운', '대박', '큰돈을 번다', '부자 확정', '승진 확정', '결혼 확정', '이혼 확정', '사고가 난다', '질병 발생'];
  prohibited.forEach(p => assert(!defaultHtml.includes(p)));
});

runTest("1 candidate renders exactly 1", () => {
  const oldProcess = window.UndamjaePremiumEngine.processPremiumReport;
  window.UndamjaePremiumEngine.processPremiumReport = (r, lc) => {
    const res = oldProcess(r, lc);
    res.primeCandidateWindows = [ { startYear: 2020, endYear: 2020, duration: 1, strategyState: 'PREPARE', years: [], primaryPatternIds: [] } ];
    return res;
  };
  const { html } = renderUIForCase('2000-01-01', 'm');
  assert(html.includes('1위:'));
  assert(!html.includes('2위:'));
  window.UndamjaePremiumEngine.processPremiumReport = oldProcess;
});

runTest("max 5 candidates", () => {
  const oldProcess = window.UndamjaePremiumEngine.processPremiumReport;
  window.UndamjaePremiumEngine.processPremiumReport = (r, lc) => {
    const res = oldProcess(r, lc);
    res.primeCandidateWindows = [1,2,3,4,5,6].map(i => ({ startYear: 2020+i, endYear: 2020+i, duration: 1, strategyState: 'PREPARE', years: [], primaryPatternIds: [] }));
    return res;
  };
  const { html } = renderUIForCase('2000-01-01', 'm');
  assert(html.includes('5위:'));
  assert(!html.includes('6위:'));
  window.UndamjaePremiumEngine.processPremiumReport = oldProcess;
});

console.log(`\nPremium UI Tests: ${passCount} Passed, ${failCount} Failed.`);
if (failCount > 0) process.exit(1);
