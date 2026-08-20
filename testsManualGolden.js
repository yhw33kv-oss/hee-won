// testsManualGolden.js

const { fixtures, generateEngineOutput, STATUS_ENUM } = require('./manualGoldenFixtures.js');
const Lunar = require('./lib/lunar.js').Lunar;
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.log(`[FAIL] ${message}`);
    failCount++;
  }
}

for (const f of fixtures) {
  const d = new Date(f.birthDate + 'T' + f.birthTime + ':00');
  const lunarEightChar = Lunar.fromDate(d).getEightChar();
  generateEngineOutput(f, lunarEightChar);
  
  const expectedDirection = f.fixtureId.includes('FORWARD') ? '순행' : '역행';
  assert(f.engineResult.yunDirection === expectedDirection, `Fixture ID와 실제 방향 일치 (${f.fixtureId})`);
  
  assert(typeof f.engineResult.yearPillar === 'string', 'getYear() 정상');
  assert(f.engineResult.yunStartOffset && typeof f.engineResult.yunStartOffset.years === 'number', 'yunStartOffset 정상 구조');
  assert(f.engineResult.yunStartSolarDate !== 'NOT_AVAILABLE', 'getStartSolar() 정상 처리');
  
  assert(f.engineResult.daYun1 && f.engineResult.daYun2 && f.engineResult.daYun3, '첫 유효 DaYun 3개 정상');
  assert(typeof f.engineResult.daYun1.startYear === 'number' && typeof f.engineResult.daYun1.endYear === 'number', '각 DaYun start/end year 정상');
  
  // display/raw age logic testing
  assert(f.engineResult.daYun1.displayStartAge >= 0, 'display age가 음수가 되지 않음');
  assert(f.engineResult.daYun1.rawStartAge === f.engineResult.daYun1.displayStartAge + 1, 'displayStartAge와 rawStartAge 혼용 없음 (1살 차이)');
  
  if (f.fixtureId === 'CASE_A_MALE_FORWARD' || f.fixtureId === 'CASE_C_FEMALE_FORWARD') {
    assert(f.engineResult.daYun1.rawStartAge === 8, `${f.fixtureId} raw age = 8`);
    assert(f.engineResult.daYun1.displayStartAge === 7, `${f.fixtureId} display age = 7`);
    assert(f.engineResult.daYun2.displayStartAge === 17, `${f.fixtureId} DaYun2 display age = 17`);
    assert(f.engineResult.daYun3.displayStartAge === 27, `${f.fixtureId} DaYun3 display age = 27`);
  } else {
    assert(f.engineResult.daYun1.rawStartAge === 4, `${f.fixtureId} raw age = 4`);
    assert(f.engineResult.daYun1.displayStartAge === 3, `${f.fixtureId} display age = 3`);
    assert(f.engineResult.daYun2.displayStartAge === 13, `${f.fixtureId} DaYun2 display age = 13`);
    assert(f.engineResult.daYun3.displayStartAge === 23, `${f.fixtureId} DaYun3 display age = 23`);
  }
  
  assert(f.engineResult.annualPillars && f.engineResult.annualPillars.length >= 3, '세운 3개 정상');
}

const f1 = fixtures[0];
const d1 = new Date(f1.birthDate + 'T' + f1.birthTime + ':00');
const ec1 = Lunar.fromDate(d1).getEightChar();
generateEngineOutput(f1, ec1);
const res1 = JSON.stringify(f1.engineResult);
generateEngineOutput(f1, ec1);
const res2 = JSON.stringify(f1.engineResult);
assert(res1 === res2, '동일 입력 deterministic');
assert(f1.engineResult.firstValidDaYunRawStartAge === 8, 'rawStartAge 값 보존');
assert(f1.engineResult.firstValidDaYunDisplayStartAge === 7, 'displayStartAge 보존');

const { compareGoldenFixture } = require('./manualGoldenFixtures.js');
assert(compareGoldenFixture(f1) === STATUS_ENUM.PENDING_EXTERNAL_REFERENCE, 'external reference 비어 있으면 PENDING_EXTERNAL_REFERENCE');

console.log(`\nTests: ${passCount} Passed, ${failCount} Failed.`);
if (failCount > 0) process.exit(1);
