const { Lunar, Solar } = require('./lib/lunar.js');
const { calculateSaju } = require('./engine.js');

// Helper to run a test
function runTest(name, userInput, expected) {
  const result = calculateSaju(userInput);
  const saju = result.sajuResult;
  const norm = result.normalizedBirthData;
  
  const passed = 
    saju.yearPillar === expected.yearPillar &&
    saju.monthPillar === expected.monthPillar &&
    saju.dayPillar === expected.dayPillar &&
    saju.hourPillar === expected.hourPillar;
    
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}`);
  if (!passed) {
    console.log(`  Expected: ${JSON.stringify(expected)}`);
    console.log(`  Got: ${JSON.stringify({yearPillar: saju.yearPillar, monthPillar: saju.monthPillar, dayPillar: saju.dayPillar, hourPillar: saju.hourPillar})}`);
  }
}

// 1. 일반 양력 출생
runTest('일반 양력 출생', {
  name: 'Test', gender: 'm', birthDate: '2023-05-15', calendarType: 'solar', birthTime: '14:30', birthTimeUnknown: false, birthPlace: 'Seoul'
}, { yearPillar: '癸卯', monthPillar: '丁巳', dayPillar: '癸酉', hourPillar: '己未' });

// 2. 일반 음력 출생 (2023 음력 3월 26일 = 양력 2023-05-15)
runTest('일반 음력 출생', {
  name: 'Test', gender: 'm', birthDate: '2023-03-26', calendarType: 'lunar', birthTime: '14:30', birthTimeUnknown: false, birthPlace: 'Seoul'
}, { yearPillar: '癸卯', monthPillar: '丁巳', dayPillar: '癸酉', hourPillar: '己未' });

// 3. 윤달 출생 (2023년 음력 2월은 윤달이 있음. 윤2월 1일 = 양력 2023-03-22)
// 양력 2023-03-22 = 癸卯년 乙卯월 己卯일
runTest('윤달 출생', {
  name: 'Test', gender: 'm', birthDate: '2023-02-01', calendarType: 'lunar_leap', birthTime: '10:00', birthTimeUnknown: false, birthPlace: 'Seoul'
}, { yearPillar: '癸卯', monthPillar: '乙卯', dayPillar: '己卯', hourPillar: '己巳' });

// 4. 입춘 직전/직후 (1998년 입춘: lunar.js 기준 2월 4일 08:56경)
runTest('입춘 직전', {
  name: 'Test', gender: 'm', birthDate: '1998-02-04', calendarType: 'solar', birthTime: '08:50', birthTimeUnknown: false, birthPlace: 'Seoul'
}, { yearPillar: '丁丑', monthPillar: '癸丑', dayPillar: '壬午', hourPillar: '甲辰' });

// 입춘 후
runTest('입춘 직후', {
  name: 'Test', gender: 'm', birthDate: '1998-02-04', calendarType: 'solar', birthTime: '09:00', birthTimeUnknown: false, birthPlace: 'Seoul'
}, { yearPillar: '戊寅', monthPillar: '甲寅', dayPillar: '壬午', hourPillar: '乙巳' });

// 5. 22:59 / 23:00 / 23:59 / 00:00 경계 (2000-01-01)
// 22:59 = 己卯 丙子 戊午 癸亥
runTest('22:59 경계', {
  name: 'Test', gender: 'm', birthDate: '2000-01-01', calendarType: 'solar', birthTime: '22:59', birthTimeUnknown: false, birthPlace: 'Seoul'
}, { yearPillar: '己卯', monthPillar: '丙子', dayPillar: '戊午', hourPillar: '癸亥' });

// 23:00 = 己卯 丙子 戊午 甲子 (야자시, 일주 유지, 시주 다음날 기준)
runTest('23:00 경계', {
  name: 'Test', gender: 'm', birthDate: '2000-01-01', calendarType: 'solar', birthTime: '23:00', birthTimeUnknown: false, birthPlace: 'Seoul'
}, { yearPillar: '己卯', monthPillar: '丙子', dayPillar: '戊午', hourPillar: '甲子' });

// 23:59 = 己卯 丙子 戊午 甲子
runTest('23:59 경계', {
  name: 'Test', gender: 'm', birthDate: '2000-01-01', calendarType: 'solar', birthTime: '23:59', birthTimeUnknown: false, birthPlace: 'Seoul'
}, { yearPillar: '己卯', monthPillar: '丙子', dayPillar: '戊午', hourPillar: '甲子' });

// 00:00 = 己卯 丙子 己未 甲子 (조자시, 일주 변경)
runTest('00:00 경계', {
  name: 'Test', gender: 'm', birthDate: '2000-01-02', calendarType: 'solar', birthTime: '00:00', birthTimeUnknown: false, birthPlace: 'Seoul'
}, { yearPillar: '己卯', monthPillar: '丙子', dayPillar: '己未', hourPillar: '甲子' });

// 6. 출생시간 미상
runTest('출생시간 미상', {
  name: 'Test', gender: 'm', birthDate: '2000-01-01', calendarType: 'solar', birthTime: '12:00', birthTimeUnknown: true, birthPlace: 'Seoul'
}, { yearPillar: '己卯', monthPillar: '丙子', dayPillar: '戊午', hourPillar: null });

// 7. leap year 2월 29일 (2024-02-29 12:00 = 甲辰 丙寅 癸亥 戊午)
runTest('윤년 2월 29일', {
  name: 'Test', gender: 'm', birthDate: '2024-02-29', calendarType: 'solar', birthTime: '12:00', birthTimeUnknown: false, birthPlace: 'Seoul'
}, { yearPillar: '甲辰', monthPillar: '丙寅', dayPillar: '癸亥', hourPillar: '戊午' });

// 8. 존재하지 않는 날짜 입력 거부
let invalidDatePassed = false;
try {
  calculateSaju({ name: 'Test', gender: 'm', birthDate: '2000-02-30', calendarType: 'solar', birthTime: '12:00', birthTimeUnknown: false, birthPlace: 'Seoul' });
} catch(e) {
  invalidDatePassed = true;
}
console.log(`[${invalidDatePassed ? 'PASS' : 'FAIL'}] 존재하지 않는 날짜 입력 거부`);
