// HEE WON Saju Calculation Engine Foundation
// Uses 6tail/lunar-javascript
let Lunar, Solar;
if (typeof require !== 'undefined') {
  const lunarLib = require('./lib/lunar.js');
  Lunar = lunarLib.Lunar;
  Solar = lunarLib.Solar;
} else {
  Lunar = window.Lunar;
  Solar = window.Solar;
}

// Policy Definitions
const TIME_POLICY = {
  STANDARD_TIME: 'STANDARD_TIME',
  TRUE_SOLAR_TIME_FUTURE: 'TRUE_SOLAR_TIME_FUTURE'
};

const DAY_BOUNDARY_POLICY = {
  ENGINE_DEFAULT_MIDNIGHT_DAY_CHANGE: 'ENGINE_DEFAULT_MIDNIGHT_DAY_CHANGE'
};

const HOUR_BRANCH_POLICY = {
  ENGINE_DEFAULT_ZI_STARTS_AT_23: 'ENGINE_DEFAULT_ZI_STARTS_AT_23'
};

/**
 * Normalizes birth data and calculates Saju
 * @param {Object} userInput - Data from UI
 * @returns {Object} { normalizedBirthData, sajuResult }
 */
function calculateSaju(userInput) {
  // Normalize date
  let year = parseInt(userInput.birthDate.substring(0, 4), 10);
  let month = parseInt(userInput.birthDate.substring(5, 7), 10);
  let day = parseInt(userInput.birthDate.substring(8, 10), 10);
  
  let hour = 0;
  let minute = 0;
  
  if (!userInput.birthTimeUnknown && userInput.birthTime) {
    hour = parseInt(userInput.birthTime.substring(0, 2), 10);
    minute = parseInt(userInput.birthTime.substring(3, 5), 10);
  }

  // Strict Date Validation
  const testDate = new Date(year, month - 1, day);
  if (testDate.getFullYear() !== year || testDate.getMonth() !== month - 1 || testDate.getDate() !== day) {
    throw new Error("Invalid date");
  }

  let solar;
  if (userInput.calendarType === 'lunar' || userInput.calendarType === 'lunar_leap') {
    const isLeap = userInput.calendarType === 'lunar_leap';
    const lunar = Lunar.fromYmd(year, month, day);
    // Note: lunar-javascript has Lunar.fromYmdHms, but if we just want to convert:
    // Wait, let's create Lunar with time if time is known
    const lunarWithTime = Lunar.fromYmdHms(year, month, day, hour, minute, 0);
    solar = lunarWithTime.getSolar();
    // In some lunar conversions, leap month handling requires exact matching.
    // However, Lunar.fromYmd doesn't take leap flag easily in this constructor.
    // Actually, we should check lunar-javascript docs. Usually it's Lunar.fromYmd(y, m (negative for leap), d).
    // In lunar-javascript, leap month is passed as negative month, e.g., -4 for leap 4th month.
    let adjustedMonth = isLeap ? -month : month;
    const properLunar = Lunar.fromYmdHms(year, adjustedMonth, day, hour, minute, 0);
    solar = properLunar.getSolar();
  } else {
    solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  }

  const normalizedBirthData = {
    solarDate: `${solar.getYear()}-${String(solar.getMonth()).padStart(2, '0')}-${String(solar.getDay()).padStart(2, '0')}`,
    lunarDate: userInput.calendarType.startsWith('lunar') 
      ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` 
      : `${solar.getLunar().getYear()}-${String(solar.getLunar().getMonth() > 0 ? solar.getLunar().getMonth() : -solar.getLunar().getMonth()).padStart(2, '0')}-${String(solar.getLunar().getDay()).padStart(2, '0')}`,
    isLeapMonth: userInput.calendarType === 'lunar_leap' || (solar.getLunar().getMonth() < 0),
    year: solar.getYear(),
    month: solar.getMonth(),
    day: solar.getDay(),
    hour: hour,
    minute: minute,
    timezone: "KST",
    timePolicy: TIME_POLICY.STANDARD_TIME,
    historicalTimeAdjustment: {
      applied: false,
      reason: "not implemented in v1"
    }
  };

  // Calculate BaZi
  const targetLunar = solar.getLunar();
  const bazi = targetLunar.getEightChar();
  
  let hourPillar = bazi.getTime();
  let hourPillarStatus = "CALCULATED";

  if (userInput.birthTimeUnknown) {
    hourPillar = null;
    hourPillarStatus = "UNKNOWN";
  }

  const sajuResult = {
    yearPillar: bazi.getYear(),
    monthPillar: bazi.getMonth(),
    dayPillar: bazi.getDay(),
    hourPillar: hourPillar,
    hourPillarStatus: hourPillarStatus,
    engine: {
      name: "lunar-javascript",
      version: "1.7.7",
      upstreamCommit: "4c45a59f79b856125516f31aefa8295035c16afd",
      license: "MIT"
    },
    calculationPolicy: {
      dayBoundaryPolicy: DAY_BOUNDARY_POLICY.ENGINE_DEFAULT_MIDNIGHT_DAY_CHANGE,
      hourBranchPolicy: HOUR_BRANCH_POLICY.ENGINE_DEFAULT_ZI_STARTS_AT_23,
      timePolicy: TIME_POLICY.STANDARD_TIME
    }
  };

  return { normalizedBirthData, sajuResult };
}

// Export for Node (Tests) and Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateSaju, TIME_POLICY, DAY_BOUNDARY_POLICY };
}
