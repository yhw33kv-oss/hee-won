// HEE WON Saju Interpretation Engine (Deterministic Layer V1)

const DAY_MASTER_TEXTS = {
  '목': {
    summary: '성장과 유연성, 강한 추진력을 지닌 성향입니다.',
    desc: '끊임없이 성장하고자 하는 욕구가 있으며, 새로운 시작과 도전을 두려워하지 않는 경향이 있습니다. 목표를 향해 곧게 뻗어나가는 추진력이 강점입니다. 환경의 변화에 유연하게 대처할 수 있지만, 지나친 고집보다는 상황에 맞는 타협점을 찾는 것이 도움이 될 수 있습니다.'
  },
  '화': {
    summary: '열정과 밝은 에너지, 풍부한 표현력을 지닌 성향입니다.',
    desc: '주변을 밝히는 따뜻한 리더십과 열정을 지니고 있을 가능성이 높습니다. 자신을 드러내고 표현하는 데에 능숙하며, 긍정적인 에너지를 전파하는 데에 유리합니다. 때로는 감정의 기복이나 급한 성미가 나타날 수 있으므로, 여유를 가지고 결정을 내리는 것이 좋습니다.'
  },
  '토': {
    summary: '포용력과 안정감, 신뢰를 중시하는 성향입니다.',
    desc: '중재와 조화에 능하며, 묵묵히 자신의 자리를 지키는 안정감이 돋보입니다. 사람들에게 신뢰감을 주어 의지가 되는 경우가 많습니다. 환경을 감싸 안는 포용력이 크지만, 변화에 다소 보수적으로 대응할 수 있으니 때로는 유연한 태도가 필요합니다.'
  },
  '금': {
    summary: '결단력과 원칙, 구조화를 중요하게 생각하는 성향입니다.',
    desc: '맺고 끊음이 확실하며, 원칙과 규칙을 지키려는 성향이 뚜렷하게 나타날 수 있습니다. 상황을 논리적으로 분석하고 체계적으로 정리하는 데에 강점을 보입니다. 하지만 완벽을 추구하는 과정에서 스스로나 타인에게 엄격해질 수 있으므로 유연성을 기르는 것이 유리합니다.'
  },
  '수': {
    summary: '지혜와 수용성, 환경에 맞추는 유연함을 지닌 성향입니다.',
    desc: '흐르는 물처럼 상황에 맞게 자신을 변화시킬 수 있는 적응력이 뛰어납니다. 깊은 생각과 직관력, 통찰력을 발휘하기 쉽습니다. 수용성이 뛰어나 다양한 의견을 잘 받아들이지만, 때로는 자신의 주관이 흔들릴 수 있으니 명확한 중심을 잡는 것이 중요합니다.'
  }
};

const TEN_GODS_KEYWORDS = {
  '비견': {
    career: '독립적인 의사결정이 가능한 환경이나 자율성이 보장되는 업무에서 역량을 발휘하기 쉽습니다.',
    money: '동료나 파트너와의 협력을 통해 재정적 기회를 모색하는 경향이 나타날 수 있습니다.',
    rel: '대등한 관계를 선호하며, 독립성과 상호 존중을 중요하게 생각합니다.',
    cautions: '자신의 의견만 고집하기보다는 타인의 조언도 열린 마음으로 듣는 것이 도움이 됩니다.'
  },
  '겁재': {
    career: '경쟁적인 환경이나 강한 추진력이 필요한 분야에서 돋보일 가능성이 있습니다.',
    money: '자원이 분산되거나 변동성이 생길 수 있으므로, 체계적인 자산 관리 계획이 필요합니다.',
    rel: '선의의 경쟁을 통해 서로 발전할 수 있지만, 승부욕이 과열되는 것을 조절해야 합니다.',
    cautions: '지나친 경쟁심이나 성급한 결정보다는 한 번 더 검토하는 습관이 유리합니다.'
  },
  '식신': {
    career: '한 분야를 깊게 파고드는 전문성이나 꾸준한 생산 활동이 요구되는 직무에 적합할 수 있습니다.',
    money: '성실함과 전문성을 바탕으로 안정적이고 꾸준한 재물 흐름을 만들어가는 성향이 강합니다.',
    rel: '배려심이 깊고 타인에게 베푸는 것을 편안하게 느끼는 경향이 있습니다.',
    cautions: '한 가지 방식에만 고착되지 않고 다양한 관점을 수용해보는 것이 좋습니다.'
  },
  '상관': {
    career: '기존의 틀을 깨는 아이디어나 뛰어난 표현력을 발휘할 수 있는 창작, 기획 분야에 유리합니다.',
    money: '독창적인 접근과 재치로 새로운 수익 창출 기회를 포착하는 데에 강점을 보일 수 있습니다.',
    rel: '활발한 소통을 즐기지만, 직설적인 표현이 오해를 부를 수 있으니 소통 방식에 유의가 필요합니다.',
    cautions: '규칙이나 틀을 답답해할 수 있으나, 때로는 조직의 질서를 수용하는 태도가 도움이 됩니다.'
  },
  '편재': {
    career: '다양한 외부 활동이나 폭넓은 인적 네트워크, 기회 포착이 중요한 영역에서 활약하기 쉽습니다.',
    money: '고정된 수입보다는 유동적인 자원 활용과 거시적인 재정 목표를 추구하는 성향이 엿보입니다.',
    rel: '활동 범위가 넓고 다양한 사람들과 유연하게 교류하는 것을 선호합니다.',
    cautions: '변동성이 큰 선택이나 섣부른 확장에 주의하고 실속을 다지는 것이 중요합니다.'
  },
  '정재': {
    career: '안정적인 시스템 안에서 계획성과 꼼꼼함이 요구되는 관리, 행정 업무에 강점이 있습니다.',
    money: '수입과 지출을 체계적으로 통제하고 안정적인 관리를 통해 자산을 축적해가는 성향입니다.',
    rel: '안정감을 중시하며, 예측 가능하고 신뢰할 수 있는 관계를 선호하는 편입니다.',
    cautions: '너무 세세한 부분에 얽매여 큰 흐름이나 새로운 기회를 놓치지 않도록 주의해야 합니다.'
  },
  '편관': {
    career: '압박감이 크거나 신속한 해결책이 필요한 환경, 권한과 책임이 동반되는 직무에 어울릴 수 있습니다.',
    money: '강한 목적 의식을 가지고 과감한 선택을 할 수 있으나, 리스크 관리가 병행되어야 합니다.',
    rel: '책임감이 강하고 의리를 중시하지만, 때로는 타인에게도 높은 기준을 요구할 수 있습니다.',
    cautions: '스트레스나 압박을 혼자 감당하려 하지 말고 적절한 휴식과 에너지 안배가 필수입니다.'
  },
  '정관': {
    career: '체계적인 조직 내에서 책임감과 원칙을 준수하며 발전해 나가는 관리자 역할에 적합합니다.',
    money: '규칙적이고 합리적인 소비와 안전한 방식을 통한 자산 관리를 선호하는 경향이 있습니다.',
    rel: '질서와 도리를 중요하게 여기며, 상대방에 대한 예의와 존중을 바탕으로 교류합니다.',
    cautions: '정해진 원칙만 지나치게 고수하면 경직될 수 있으니 융통성을 발휘해 보세요.'
  },
  '편인': {
    career: '특수한 분야에서의 비정형적인 학습이나 직관력, 분석력이 요구되는 연구, 기획에 강점이 있습니다.',
    money: '일반적인 방법보다는 자신만의 노하우나 정보 분석을 바탕으로 재정에 접근할 수 있습니다.',
    rel: '심리적 거리를 적절히 조절하며, 깊은 내면적 공감과 정신적 교류를 중요하게 여깁니다.',
    cautions: '생각이 꼬리를 물면 결행이 늦어질 수 있으니, 적절한 시점에 실행에 옮기는 것이 좋습니다.'
  },
  '정인': {
    career: '지식 습득과 전달, 보편적인 수용성이 요구되는 교육, 기획, 문서 관련 업무에 유리할 수 있습니다.',
    money: '안정적인 기반을 바탕으로 지식이나 자격을 활용한 자산 축적 형태를 보일 가능성이 큽니다.',
    rel: '안정적이고 온화한 관계를 지향하며, 타인을 수용하고 이해하려는 포용력이 뛰어납니다.',
    cautions: '의존성이 커지거나 수동적인 태도를 취하기 쉬우므로 능동적인 판단이 필요할 수 있습니다.'
  }
};

function generateInterpretation(sajuAnalysis, sajuResult) {
  // 1. Day Master Interpretation
  const dmChar = sajuAnalysis.dayMaster;
  // BAZI_MAP from engineAnalysis context is expected if we merge, or we can just infer element.
  // We'll use the already counted element from the day master in sajuAnalysis... wait, sajuAnalysis doesn't explicitly store DM element.
  // We can easily map:
  const dmE = ['목','목','화','화','토','토','금','금','수','수'][['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'].indexOf(dmChar)];
  
  const dmTexts = DAY_MASTER_TEXTS[dmE] || { summary: '', desc: '' };
  
  // 2. Element Balance
  const counts = sajuAnalysis.fiveElementCount;
  let maxCount = -1;
  let minCount = 99;
  
  for (const el in counts) {
    if (counts[el] > maxCount) maxCount = counts[el];
    if (counts[el] < minCount) minCount = counts[el];
  }
  
  const dominantElements = [];
  const weakElements = [];
  
  for (const el in counts) {
    if (counts[el] === maxCount) dominantElements.push(el);
    if (counts[el] === minCount) weakElements.push(el);
  }
  
  let balanceText = `오행의 분포를 보면 ${dominantElements.join(', ')} 기운이 상대적으로 강한 편(과다 경향)이며, ${weakElements.join(', ')} 기운이 상대적으로 부족한 경향을 보입니다.`;
  balanceText += " 특정 오행이 많고 적음은 좋고 나쁨의 의미가 아니라, 개인의 성향과 에너지가 집중되는 방향을 나타냅니다.";

  // 3. Ten Gods (Stems)
  const tenGodsSet = new Set();
  if (sajuAnalysis.stemTenGods.year && sajuAnalysis.stemTenGods.year !== '미상') tenGodsSet.add(sajuAnalysis.stemTenGods.year);
  if (sajuAnalysis.stemTenGods.month && sajuAnalysis.stemTenGods.month !== '미상') tenGodsSet.add(sajuAnalysis.stemTenGods.month);
  if (sajuAnalysis.stemTenGods.hour && sajuAnalysis.stemTenGods.hour !== '미상') tenGodsSet.add(sajuAnalysis.stemTenGods.hour);

  const careerList = [];
  const moneyList = [];
  const relList = [];
  const cautionsList = [];
  
  tenGodsSet.forEach(god => {
    if (TEN_GODS_KEYWORDS[god]) {
      careerList.push(TEN_GODS_KEYWORDS[god].career);
      moneyList.push(TEN_GODS_KEYWORDS[god].money);
      relList.push(TEN_GODS_KEYWORDS[god].rel);
      cautionsList.push(TEN_GODS_KEYWORDS[god].cautions);
    }
  });

  // Base inference based on Element distributions
  if (careerList.length === 0) careerList.push("주어진 환경에서 묵묵히 자신의 역할을 찾아가는 안정적인 성향을 띠고 있습니다.");
  if (moneyList.length === 0) moneyList.push("수입과 지출의 균형을 맞추며 안정적인 관리를 지향하는 것이 좋습니다.");
  if (relList.length === 0) relList.push("타인과의 조화를 중시하며 원만한 관계를 맺어가는 편입니다.");
  if (cautionsList.length === 0) cautionsList.push("급격한 환경 변화보다는 점진적인 발전 방식을 택하는 것이 유리합니다.");

  // Remove duplicate points if any
  const uniqueCareer = [...new Set(careerList)];
  const uniqueMoney = [...new Set(moneyList)];
  const uniqueRel = [...new Set(relList)];
  const uniqueCautions = [...new Set(cautionsList)];

  const evidence = {
    dayMaster: dmChar,
    dayMasterElement: dmE,
    dominantElements,
    weakElements,
    stemTenGods: Array.from(tenGodsSet),
    timeUnknown: sajuResult.hourPillarStatus === 'UNKNOWN'
  };

  return {
    summary: dmTexts.summary,
    dayMasterInterpretation: dmTexts.desc,
    elementBalanceInterpretation: balanceText,
    careerInterpretation: uniqueCareer.map(s => "- " + s).join('\n'),
    moneyInterpretation: uniqueMoney.map(s => "- " + s).join('\n'),
    relationshipInterpretation: uniqueRel.map(s => "- " + s).join('\n'),
    cautions: uniqueCautions.map(s => "- " + s).join('\n'),
    evidence,
    interpretationVersion: "1.0"
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateInterpretation };
}
