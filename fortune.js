// HEE WON Today's Fortune Engine V1 (Deterministic)

const { BAZI_MAP, calculateTenGod } = typeof module !== 'undefined' ? require('./engineAnalysis.js') : window;
// Depending on environment, get Solar from window or require
let LunarLib;
if (typeof module !== 'undefined' && typeof window === 'undefined') {
  LunarLib = require('./lib/lunar.js').Solar;
} else {
  LunarLib = window.Solar;
}

const SIX_HARMONY = {
  '子': '丑', '丑': '子', '寅': '亥', '亥': '寅',
  '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰',
  '巳': '申', '申': '巳', '午': '未', '未': '午'
};

const CLASH = {
  '子': '午', '午': '子', '丑': '未', '未': '丑',
  '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳'
};

const BRANCH_RELATION_TEXTS = {
  'SAME': '비슷한 기운이 겹치는 날로, 본인의 성향이 강해질 수 있습니다.',
  'SIX_HARMONY': '협력과 조율에 관심을 둘 수 있는 날입니다.',
  'CLASH': '변화나 마찰 가능성을 고려하여 중요한 결정은 한 번 더 점검하는 것이 좋습니다.',
  'NONE': '일상적인 흐름 속에서 차분하게 자신의 일과를 소화하기 좋은 날입니다.'
};

const FORTUNE_KEYWORDS = {
  '비견': {
    flow: '자신의 주관이나 주체성이 강해질 수 있는 흐름입니다.',
    career: '독립적인 업무 추진이나 자신의 의견을 명확히 전달하기 좋은 시점입니다.',
    money: '자산 관리에 있어 외부의 조언보다 본인의 원칙을 재확인하는 경향이 있습니다.',
    rel: '동료나 주변 사람들과 평등한 관계에서 소통하기 유리합니다.',
    action: '자신감을 가지되 타인의 의견을 수용하는 여유를 가지는 것이 좋습니다.'
  },
  '겁재': {
    flow: '활동력과 경쟁 심리가 자극될 수 있는 흐름입니다.',
    career: '목표 달성을 위한 추진력이 강해지지만, 무리한 경쟁은 피하는 것이 좋습니다.',
    money: '지출 관리에 신경 쓰고, 충동적인 자원 분산을 경계할 필요가 있습니다.',
    rel: '주변과의 선의의 경쟁은 좋으나 불필요한 마찰을 조율하는 지혜가 요구됩니다.',
    action: '빠른 결정보다는 신중한 검토를 거치는 습관이 도움이 될 수 있습니다.'
  },
  '식신': {
    flow: '안정적인 환경 속에서 꾸준한 생산이나 표현 활동에 집중하기 좋은 흐름입니다.',
    career: '전문성을 살리거나 맡은 업무를 차분하게 진행하는 데에 유리합니다.',
    money: '성실함에 기반한 안정적인 재정 계획을 점검하기 좋습니다.',
    rel: '주변을 배려하고 자연스럽게 교류하며 원만한 관계를 맺기 쉽습니다.',
    action: '자신만의 페이스를 유지하며 꾸준히 한 걸음씩 나아가는 것을 권장합니다.'
  },
  '상관': {
    flow: '틀에서 벗어난 생각과 활발한 표현력이 돋보일 수 있는 흐름입니다.',
    career: '아이디어 제안이나 창의적인 업무에서 두각을 나타낼 가능성이 있습니다.',
    money: '새로운 정보나 재치 있는 접근으로 기회를 탐색해볼 수 있습니다.',
    rel: '직설적인 화법이나 기존 방식에 대한 비판적 의견이 오해를 낳지 않도록 주의가 필요합니다.',
    action: '유연한 태도로 소통하며 자신의 독창성을 적절히 조율하는 것이 유리합니다.'
  },
  '편재': {
    flow: '외부 활동이나 폭넓은 기회 탐색에 에너지가 향하기 쉬운 흐름입니다.',
    career: '다양한 인적 교류나 새로운 프로젝트를 모색하는 데에 강점이 있습니다.',
    money: '고정된 틀보다 유동성을 활용한 기회 포착에 관심이 갈 수 있으나 변동성 관리가 중요합니다.',
    rel: '활동 범위가 넓어지고 다양한 사람과 활기차게 소통할 수 있습니다.',
    action: '거시적인 흐름을 보되 지나친 확장보다는 실속을 챙기는 것을 잊지 마세요.'
  },
  '정재': {
    flow: '안정감과 계획성에 기반하여 상황을 통제하고 점검하기 좋은 흐름입니다.',
    career: '꼼꼼한 업무 처리와 체계적인 관리 역량을 발휘하기 유리한 시점입니다.',
    money: '수입과 지출의 균형을 맞추며 보수적으로 자산을 축적, 관리하는 데 적합합니다.',
    rel: '예측 가능하고 신뢰할 수 있는 관계에 집중하는 경향이 짙어집니다.',
    action: '세세한 부분까지 챙기는 꼼꼼함을 살리되 전체적인 숲을 보는 시야도 유지하세요.'
  },
  '편관': {
    flow: '책임감과 압박을 동력으로 삼아 신속하게 문제를 해결하려는 흐름입니다.',
    career: '어려운 과제나 권한이 필요한 업무에서 돌파구를 마련할 가능성이 있습니다.',
    money: '강한 목적의식으로 접근할 수 있으나 리스크를 철저히 검증하는 태도가 필요합니다.',
    rel: '원칙과 기준을 중요시하며, 때로는 타인에게도 높은 기준을 요구할 수 있습니다.',
    action: '과도한 스트레스를 혼자 안고 가기보다는 적절히 분배하고 휴식을 취하세요.'
  },
  '정관': {
    flow: '질서와 원칙을 중시하며 안정적인 테두리 안에서 책임감을 다하는 흐름입니다.',
    career: '조직의 규칙을 준수하고 체계적인 환경에서 신뢰를 쌓아가기 좋은 시점입니다.',
    money: '합리적인 소비와 안전한 자산 운용 방식을 선호하는 경향이 짙어집니다.',
    rel: '도리와 예의를 갖추며 상호 존중하는 원만한 교류를 지향합니다.',
    action: '원칙을 따르는 것은 좋으나 유연성을 잃지 않는 것도 중요합니다.'
  },
  '편인': {
    flow: '깊이 있는 사고와 직관력, 비정형적인 정보에 관심이 갈 수 있는 흐름입니다.',
    career: '분석, 기획, 혹은 특수한 전문성이 요구되는 분야에서 통찰력을 발휘하기 쉽습니다.',
    money: '자신만의 노하우나 정보망을 통해 재정에 접근하는 방식을 취할 수 있습니다.',
    rel: '정신적인 교감과 거리를 두는 태도를 병행하며 내면의 공감을 중시합니다.',
    action: '생각이 꼬리를 무는 것을 방지하고, 현실적인 실행으로 옮기는 연습이 도움이 됩니다.'
  },
  '정인': {
    flow: '지식 습득과 안정감, 수용적인 태도로 환경을 받아들이기 유리한 흐름입니다.',
    career: '문서 작업이나 학습, 타인을 돕고 수용하는 성격의 업무에서 편안함을 느낄 수 있습니다.',
    money: '안정적인 기반 위에서 지식을 자원화하거나 자격을 통해 자산을 관리하려는 성향입니다.',
    rel: '상대방을 이해하고 품어주며 온화하고 안정적인 관계를 이어가기 좋습니다.',
    action: '주변의 지원에 긍정적으로 반응하되 지나치게 의존하기보다 능동성을 유지해보세요.'
  }
};

function getBranchRelation(userBranch, todayBranch) {
  if (userBranch === todayBranch) return 'SAME';
  if (SIX_HARMONY[userBranch] === todayBranch) return 'SIX_HARMONY';
  if (CLASH[userBranch] === todayBranch) return 'CLASH';
  return 'NONE';
}

function getTodayPillars(dateObj) {
  const s = LunarLib.fromDate(dateObj);
  const l = s.getLunar();
  const b = l.getEightChar();
  
  return {
    yearPillar: b.getYear(),
    monthPillar: b.getMonth(),
    dayPillar: b.getDay(),
    dateStr: `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`
  };
}

function generateTodayFortune(sajuResult, targetDate = new Date()) {
  const todayData = getTodayPillars(targetDate);
  
  const userDayStem = sajuResult.dayPillar.charAt(0);
  const userDayBranch = sajuResult.dayPillar.charAt(1);
  const userDMeta = BAZI_MAP.stems[userDayStem];
  
  const todayDayStem = todayData.dayPillar.charAt(0);
  const todayDayBranch = todayData.dayPillar.charAt(1);
  
  const todayTenGod = calculateTenGod(userDMeta.e, userDMeta.y, BAZI_MAP.stems[todayDayStem].e, BAZI_MAP.stems[todayDayStem].y);
  const branchRelation = getBranchRelation(userDayBranch, todayDayBranch);

  const keyTexts = FORTUNE_KEYWORDS[todayTenGod];
  const relText = BRANCH_RELATION_TEXTS[branchRelation];

  // Compose sections
  const sections = {
    flow: keyTexts.flow + ' ' + relText,
    career: keyTexts.career,
    money: keyTexts.money,
    rel: keyTexts.rel,
    action: keyTexts.action
  };

  return {
    dateStr: todayData.dateStr,
    todayPillars: {
      yearPillar: todayData.yearPillar,
      monthPillar: todayData.monthPillar,
      dayPillar: todayData.dayPillar,
      dayStem: todayDayStem,
      dayBranch: todayDayBranch
    },
    todayTenGod,
    branchRelation,
    sections,
    evidence: {
      userDayMaster: userDayStem,
      userDayBranch: userDayBranch,
      todayDayStem: todayDayStem,
      todayDayBranch: todayDayBranch,
      todayTenGod: todayTenGod,
      branchRelation: branchRelation
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateTodayFortune, getBranchRelation, getTodayPillars };
}
