// HEE WON Saju Analysis Engine (Deterministic Layer)

const BAZI_MAP = {
  stems: {
    '甲': { e: '목', y: '양' }, '乙': { e: '목', y: '음' },
    '丙': { e: '화', y: '양' }, '丁': { e: '화', y: '음' },
    '戊': { e: '토', y: '양' }, '己': { e: '토', y: '음' },
    '庚': { e: '금', y: '양' }, '辛': { e: '금', y: '음' },
    '壬': { e: '수', y: '양' }, '癸': { e: '수', y: '음' }
  },
  branches: {
    // y = 전통적 체(Body) 기준 (자=양, 해=음, 사=음, 오=양)
    // yUse = 명리학 십성 계산 용(Use) 기준 (자=음, 해=양, 사=양, 오=음)
    // 본기/중기/여기(hidden)는 가장 보편적인 지장간 데이터
    '子': { e: '수', y: '양', yUse: '음', hidden: ['壬', '癸'] },
    '丑': { e: '토', y: '음', yUse: '음', hidden: ['癸', '辛', '己'] },
    '寅': { e: '목', y: '양', yUse: '양', hidden: ['戊', '丙', '甲'] },
    '卯': { e: '목', y: '음', yUse: '음', hidden: ['甲', '乙'] },
    '辰': { e: '토', y: '양', yUse: '양', hidden: ['乙', '癸', '戊'] },
    '巳': { e: '화', y: '음', yUse: '양', hidden: ['戊', '庚', '丙'] },
    '午': { e: '화', y: '양', yUse: '음', hidden: ['丙', '己', '丁'] },
    '未': { e: '토', y: '음', yUse: '음', hidden: ['丁', '乙', '己'] },
    '申': { e: '금', y: '양', yUse: '양', hidden: ['戊', '壬', '庚'] },
    '酉': { e: '금', y: '음', yUse: '음', hidden: ['庚', '辛'] },
    '戌': { e: '토', y: '양', yUse: '양', hidden: ['辛', '丁', '戊'] },
    '亥': { e: '수', y: '음', yUse: '양', hidden: ['戊', '甲', '壬'] }
  }
};

const ELEMENT_IDX = { '목': 0, '화': 1, '토': 2, '금': 3, '수': 4 };

function calculateTenGod(dayMasterElement, dayMasterYinYang, targetElement, targetYinYang) {
  const dmIdx = ELEMENT_IDX[dayMasterElement];
  const tIdx = ELEMENT_IDX[targetElement];
  
  const diff = (tIdx - dmIdx + 5) % 5;
  const isSameYinYang = dayMasterYinYang === targetYinYang;
  
  if (diff === 0) return isSameYinYang ? '비견' : '겁재';
  if (diff === 1) return isSameYinYang ? '식신' : '상관';
  if (diff === 2) return isSameYinYang ? '편재' : '정재';
  if (diff === 3) return isSameYinYang ? '편관' : '정관';
  if (diff === 4) return isSameYinYang ? '편인' : '정인';
  
  return '';
}

function analyzeSaju(sajuResult) {
  const dayMasterChar = sajuResult.dayPillar.charAt(0);
  const dmMeta = BAZI_MAP.stems[dayMasterChar];
  
  const stemTenGods = {
    year: calculateTenGod(dmMeta.e, dmMeta.y, BAZI_MAP.stems[sajuResult.yearPillar.charAt(0)].e, BAZI_MAP.stems[sajuResult.yearPillar.charAt(0)].y),
    month: calculateTenGod(dmMeta.e, dmMeta.y, BAZI_MAP.stems[sajuResult.monthPillar.charAt(0)].e, BAZI_MAP.stems[sajuResult.monthPillar.charAt(0)].y),
    day: '본원',
    hour: sajuResult.hourPillar ? calculateTenGod(dmMeta.e, dmMeta.y, BAZI_MAP.stems[sajuResult.hourPillar.charAt(0)].e, BAZI_MAP.stems[sajuResult.hourPillar.charAt(0)].y) : '미상'
  };
  
  const fiveElementCount = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 };
  let totalVisible = 0;
  
  const pillars = [sajuResult.yearPillar, sajuResult.monthPillar, sajuResult.dayPillar];
  if (sajuResult.hourPillar) pillars.push(sajuResult.hourPillar);
  
  pillars.forEach(p => {
    const sE = BAZI_MAP.stems[p.charAt(0)].e;
    const bE = BAZI_MAP.branches[p.charAt(1)].e;
    fiveElementCount[sE]++;
    fiveElementCount[bE]++;
    totalVisible += 2;
  });
  
  const rawPercent = {
    '목': (fiveElementCount['목'] / totalVisible) * 100,
    '화': (fiveElementCount['화'] / totalVisible) * 100,
    '토': (fiveElementCount['토'] / totalVisible) * 100,
    '금': (fiveElementCount['금'] / totalVisible) * 100,
    '수': (fiveElementCount['수'] / totalVisible) * 100
  };

  const displayPercent = {
    '목': rawPercent['목'].toFixed(1),
    '화': rawPercent['화'].toFixed(1),
    '토': rawPercent['토'].toFixed(1),
    '금': rawPercent['금'].toFixed(1),
    '수': rawPercent['수'].toFixed(1)
  };
  
  return {
    dayMaster: dayMasterChar,
    stemTenGods,
    fiveElementCount,
    rawPercent,
    displayPercent,
    fiveElementPolicy: 'VISIBLE_EIGHT_CHAR_SIMPLE_COUNT',
    analysisVersion: '1.0'
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeSaju, BAZI_MAP, calculateTenGod };
}
