// manualGoldenFixtures.js

const STATUS_ENUM = {
  PASS: 'PASS',
  DISPLAY_DIFFERENCE: 'DISPLAY_DIFFERENCE',
  POLICY_DIFFERENCE: 'POLICY_DIFFERENCE',
  CALCULATION_MISMATCH: 'CALCULATION_MISMATCH',
  REFERENCE_UNCERTAIN: 'REFERENCE_UNCERTAIN',
  PENDING_EXTERNAL_REFERENCE: 'PENDING_EXTERNAL_REFERENCE'
};

const INDEPENDENCE_STATUS = {
  CONFIRMED_INDEPENDENT: 'CONFIRMED_INDEPENDENT',
  INDEPENDENCE_UNCONFIRMED: 'INDEPENDENCE_UNCONFIRMED'
};

const fixtures = [
  {
    fixtureId: "CASE_A_MALE_FORWARD",
    description: "남성 / 순행 예상 사례",
    gender: "m",
    birthDate: "1990-03-15", 
    birthTime: "12:00",
    birthTimeUnknown: false,
    calendarType: "solar",
    timezone: "Asia/Seoul",
    engineResult: null,
    referenceA: null, 
    referenceB: null, 
    comparison: null
  },
  {
    fixtureId: "CASE_B_MALE_BACKWARD",
    description: "남성 / 역행 예상 사례",
    gender: "m",
    birthDate: "1989-03-15", 
    birthTime: "12:00",
    birthTimeUnknown: false,
    calendarType: "solar",
    timezone: "Asia/Seoul",
    engineResult: null,
    referenceA: null,
    referenceB: null,
    comparison: null
  },
  {
    fixtureId: "CASE_C_FEMALE_FORWARD",
    description: "여성 / 순행 예상 사례",
    gender: "f",
    birthDate: "1989-03-15",
    birthTime: "12:00",
    birthTimeUnknown: false,
    calendarType: "solar",
    timezone: "Asia/Seoul",
    engineResult: null,
    referenceA: null,
    referenceB: null,
    comparison: null
  },
  {
    fixtureId: "CASE_D_FEMALE_BACKWARD",
    description: "여성 / 역행 예상 사례",
    gender: "f",
    birthDate: "1990-03-15",
    birthTime: "12:00",
    birthTimeUnknown: false,
    calendarType: "solar",
    timezone: "Asia/Seoul",
    engineResult: null,
    referenceA: null,
    referenceB: null,
    comparison: null
  }
];

function generateEngineOutput(fixture, lunarEightChar) {
  const yearPillar = lunarEightChar.getYear();
  const monthPillar = lunarEightChar.getMonth();
  const dayPillar = lunarEightChar.getDay();
  const hourPillar = fixture.birthTimeUnknown ? null : lunarEightChar.getTime();
  
  const genderIndex = fixture.gender === 'm' ? 1 : 0;
  const yun = lunarEightChar.getYun(genderIndex);
  const yunDirection = yun.isForward() ? "순행" : "역행";
  const yunStartYear = yun.getStartYear();
  const yunStartMonth = yun.getStartMonth();
  const yunStartDay = yun.getStartDay();
  
  let yunStartSolarDate = 'NOT_AVAILABLE';
  if (typeof yun.getStartSolar === 'function') {
    const sd = yun.getStartSolar();
    if (sd) {
      yunStartSolarDate = sd.toYmdHms();
    }
  }
  
  const birthYear = parseInt(fixture.birthDate.substring(0, 4), 10);
  const dayuns = yun.getDaYun();
  const validDayuns = [];
  let firstValidDaYunRawStartAge = 0;
  let firstValidDaYunDisplayStartAge = 0;
  
  for (let i = 0; i < dayuns.length; i++) {
    if (dayuns[i].getGanZhi().length === 2) {
      const rawStartAge = dayuns[i].getStartAge();
      const displayStartAge = dayuns[i].getStartYear() - birthYear;
      
      if (validDayuns.length === 0) {
        firstValidDaYunRawStartAge = rawStartAge;
        firstValidDaYunDisplayStartAge = displayStartAge;
      }
      validDayuns.push({
        ganZhi: dayuns[i].getGanZhi(),
        startYear: dayuns[i].getStartYear(),
        endYear: dayuns[i].getEndYear(),
        rawStartAge,
        displayStartAge,
        endAge: dayuns[i].getEndAge()
      });
    }
    if (validDayuns.length === 3) break;
  }
  
  let annualPillars = [];
  for (let i = 0; i < dayuns.length; i++) {
    if (dayuns[i].getGanZhi().length === 2) {
      const lns = dayuns[i].getLiuNian();
      for(let j=0; j<3 && j<lns.length; j++) {
        annualPillars.push({ year: lns[j].getYear(), ganZhi: lns[j].getGanZhi() });
      }
      break;
    }
  }

  fixture.engineResult = {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    yunDirection,
    yunStartOffset: { years: yunStartYear, months: yunStartMonth, days: yunStartDay },
    yunStartSolarDate,
    firstValidDaYunRawStartAge,
    firstValidDaYunDisplayStartAge,
    daYun1: validDayuns[0] || null,
    daYun2: validDayuns[1] || null,
    daYun3: validDayuns[2] || null,
    annualPillars
  };
}

function compareGoldenFixture(fixture) {
  if (!fixture.referenceA || !fixture.referenceB) {
    fixture.comparison = { finalStatus: STATUS_ENUM.PENDING_EXTERNAL_REFERENCE };
    return STATUS_ENUM.PENDING_EXTERNAL_REFERENCE;
  }

  if (fixture.referenceA.independenceStatus === INDEPENDENCE_STATUS.INDEPENDENCE_UNCONFIRMED ||
      fixture.referenceB.independenceStatus === INDEPENDENCE_STATUS.INDEPENDENCE_UNCONFIRMED) {
    fixture.comparison = { finalStatus: STATUS_ENUM.REFERENCE_UNCERTAIN };
    return STATUS_ENUM.REFERENCE_UNCERTAIN;
  }

  const res = fixture.engineResult;
  const refA = fixture.referenceA;
  const refB = fixture.referenceB;

  let status = STATUS_ENUM.PASS;

  if (res.yearPillar !== refA.yearPillar || res.yearPillar !== refB.yearPillar ||
      res.monthPillar !== refA.monthPillar || res.monthPillar !== refB.monthPillar ||
      res.dayPillar !== refA.dayPillar || res.dayPillar !== refB.dayPillar) {
    status = STATUS_ENUM.CALCULATION_MISMATCH;
  }

  if (!fixture.birthTimeUnknown) {
    if (res.hourPillar !== refA.hourPillar || res.hourPillar !== refB.hourPillar) {
      status = STATUS_ENUM.CALCULATION_MISMATCH;
    }
  }

  if (res.yunDirection !== refA.yunDirection || res.yunDirection !== refB.yunDirection) {
    status = STATUS_ENUM.CALCULATION_MISMATCH;
  }

  if (!res.daYun1 || !refA.daYun1 || !refB.daYun1 || res.daYun1.ganZhi !== refA.daYun1.ganZhi || res.daYun1.ganZhi !== refB.daYun1.ganZhi) {
    status = STATUS_ENUM.CALCULATION_MISMATCH;
  }
  
  fixture.comparison = {
    chartPillars: status === STATUS_ENUM.CALCULATION_MISMATCH ? 'MISMATCH' : 'MATCH',
    yunDirection: res.yunDirection === refA.yunDirection && res.yunDirection === refB.yunDirection ? 'MATCH' : 'MISMATCH',
    finalStatus: status
  };

  return status;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STATUS_ENUM,
    INDEPENDENCE_STATUS,
    fixtures,
    generateEngineOutput,
    compareGoldenFixture
  };
}
