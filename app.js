const state = {
  user: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  // Simple router based on hash
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
});

function loadUserData() {
  const saved = localStorage.getItem('heewon_user');
  if (saved) {
    try {
      state.user = JSON.parse(saved);
    } catch(e) {
      console.error(e);
    }
  }
}

function saveUserData(data) {
  state.user = data;
  localStorage.setItem('heewon_user', JSON.stringify(data));
}

function deleteUserData() {
  if (confirm('저장된 내 정보를 삭제하시겠습니까?')) {
    localStorage.removeItem('heewon_user');
    state.user = null;
    alert('삭제되었습니다.');
    window.location.hash = '#main';
  }
}

function handleRoute() {
  const hash = window.location.hash || '#main';

  if (hash === '#fortune-input') {
    setupFortuneInput();
    return;
  }

  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Clear message
  const msgEl = document.getElementById('message');
  if (msgEl) msgEl.innerText = '';

  // Show target page
  const targetId = 'page-' + hash.replace('#', '');
  const targetEl = document.getElementById(targetId);

  if (targetEl) {
    targetEl.classList.add('active');
    window.scrollTo(0, 0);

    // Page specific setup
    if (hash === '#saju-input') setupSajuInput();
    if (hash === '#saju-result') setupSajuResult();
    if (hash === '#fortune-input') setupFortuneInput();
    if (hash === '#fortune-result') setupFortuneResult();
    if (hash === '#premium-input') setupPremiumInput();
    if (hash === '#premium-report') setupPremiumReport();
    if (hash === '#settings') setupSettings();
  } else {
    // fallback
    const mainEl = document.getElementById('page-main');
    if (mainEl) mainEl.classList.add('active');
  }
}

function renderPillar(title, pillarStr, tenGodStr) {
  if (!pillarStr) {
    return `<div class="pillar-col">
      <div class="pillar-title">${title}</div>
      <div class="pillar-meta" style="color:#6846c7; font-weight:bold; margin-bottom: 5px;">${tenGodStr || '미상'}</div>
      <div class="pillar-unknown">시주<br>미상</div>
    </div>`;
  }
  const stem = pillarStr.charAt(0);
  const branch = pillarStr.charAt(1);
  const sMeta = BAZI_MAP.stems[stem] || { e: '', y: '' };
  const bMeta = BAZI_MAP.branches[branch] || { e: '', y: '' };

  return `<div class="pillar-col">
    <div class="pillar-title">${title}</div>
    <div class="pillar-meta" style="color:#6846c7; font-weight:bold; margin-bottom: 5px;">${tenGodStr}</div>
    <div class="pillar-char">${stem}</div>
    <div class="pillar-meta"><span>${sMeta.y} ${sMeta.e}</span></div>
    <div class="pillar-char" style="margin-top: 8px;">${branch}</div>
    <div class="pillar-meta"><span>${bMeta.y} ${bMeta.e}</span></div>
  </div>`;
}

function setupSajuResult() {
  const noDataEl = document.getElementById('saju-no-data');
  const hasDataEl = document.getElementById('saju-has-data');

  if (!state.user || !state.user.sajuResult) {
    noDataEl.style.display = 'block';
    hasDataEl.style.display = 'none';
    return;
  }

  noDataEl.style.display = 'none';
  hasDataEl.style.display = 'block';

  const u = state.user;
  const n = u.normalizedBirthData;
  const r = u.sajuResult;

  // Analysis Layer
  const analysis = typeof analyzeSaju === 'function' ? analyzeSaju(r) : null;
  u.sajuAnalysis = analysis;
  saveUserData(u); // Update local storage with analysis

  // Basic Info
  const calStr = u.calendarType === 'solar' ? '양력' : (u.calendarType === 'lunar_leap' ? '음력 윤달' : '음력');
  const timeStr = u.birthTimeUnknown ? '시간 미상' : u.birthTime;
  const regionStr = u.birthPlace || '미입력';

  let infoHtml = `<strong>${u.name}</strong> (${u.gender === 'm' ? '남성' : '여성'})<br>`;
  infoHtml += `${u.birthDate} (${calStr}) ${timeStr}<br>`;
  infoHtml += `출생지: ${regionStr}<br>`;
  infoHtml += `<span style="font-size:13px; color:#888;">계산 기준 양력: ${n.solarDate}</span>`;

  document.getElementById('saju-result-userinfo').innerHTML = infoHtml;

  // Pillars (Left to Right: 년, 월, 일, 시)
  let gridHtml = '';
  gridHtml += renderPillar('년주', r.yearPillar, analysis ? analysis.stemTenGods.year : '');
  gridHtml += renderPillar('월주', r.monthPillar, analysis ? analysis.stemTenGods.month : '');
  gridHtml += renderPillar('일주', r.dayPillar, analysis ? analysis.stemTenGods.day : '');

  if (r.hourPillarStatus === 'UNKNOWN' || !r.hourPillar) {
    gridHtml += renderPillar('시주', null, analysis ? analysis.stemTenGods.hour : '');
  } else {
    gridHtml += renderPillar('시주', r.hourPillar, analysis ? analysis.stemTenGods.hour : '');
  }

  document.getElementById('saju-pillars-grid').innerHTML = gridHtml;

  // Render Five Elements Distribution
  if (analysis) {
    const elOrder = ['목', '화', '토', '금', '수'];
    let distHtml = `<div style="display: flex; justify-content: space-around; margin-top: 10px;">`;
    elOrder.forEach(el => {
      distHtml += `<div style="text-align:center;">
        <div style="font-weight:bold; color:#444;">${el}</div>
        <div style="font-size:14px; color:#666;">${analysis.fiveElementCount[el]}개</div>
        <div style="font-size:12px; color:#999;">${analysis.displayPercent[el]}%</div>
      </div>`;
    });
    distHtml += `</div>`;

    // Inject it into index.html elements
    const distContainer = document.getElementById('saju-element-dist');
    if (distContainer) distContainer.innerHTML = distHtml;

    // Interpretation Layer
    if (typeof generateInterpretation === 'function') {
      const interp = generateInterpretation(analysis, r);
      document.getElementById('saju-interpretation-box').style.display = 'block';

      if (r.hourPillarStatus === 'UNKNOWN') {
        document.getElementById('time-unknown-warning').style.display = 'block';
      } else {
        document.getElementById('time-unknown-warning').style.display = 'none';
      }

      document.getElementById('interp-summary').innerText = interp.summary;
      document.getElementById('interp-daymaster').innerText = interp.dayMasterInterpretation;
      document.getElementById('interp-balance').innerText = interp.elementBalanceInterpretation;
      document.getElementById('interp-career').innerText = interp.careerInterpretation;
      document.getElementById('interp-money').innerText = interp.moneyInterpretation;
      document.getElementById('interp-rel').innerText = interp.relationshipInterpretation;
      document.getElementById('interp-cautions').innerText = interp.cautions;

      const evi = interp.evidence;
      document.getElementById('interp-evidence').innerHTML =
        `일간: ${evi.dayMaster}(${evi.dayMasterElement})<br>
        우세 오행: ${evi.dominantElements.join(', ')}<br>
        부족 오행: ${evi.weakElements.join(', ')}<br>
        천간 십성: ${evi.stemTenGods.join(', ') || '없음'}`;
    }
  }
}

function navigate(hash) {
  window.location.hash = hash;
}

function goBack() {
  window.history.back();
}

// Share API
async function shareSite() {
  const data = {
    title: "운담재",
    text: "🔮 운담재에서 내 사주와 운세를 확인해봐!",
    url: window.location.origin + window.location.pathname
  };

  if (navigator.share) {
    try {
      await navigator.share(data);
    } catch (e) {
      console.log('Share canceled or failed', e);
    }
  } else {
    copyLink();
  }
}

async function copyLink() {
  try {
    const url = window.location.origin + window.location.pathname;
    await navigator.clipboard.writeText(url);
    const msg = document.getElementById("message");
    if(msg) msg.innerText = "공유 링크를 복사했어요 💜";
    alert("공유 링크가 복사되었습니다.");
  } catch (e) {
    alert("주소창의 링크를 복사해주세요.");
  }
}

// --- Saju Logic ---
function setupSajuInput() {
  if (state.user) {
    document.getElementById('saju-name').value = state.user.name || '';
    if (state.user.gender) document.querySelector(`input[name="saju-gender"][value="${state.user.gender}"]`).checked = true;
    document.getElementById('saju-date').value = state.user.date || '';
    if (state.user.calendar) document.querySelector(`input[name="saju-cal"][value="${state.user.calendar}"]`).checked = true;
    document.getElementById('saju-time').value = state.user.time || '';
    document.getElementById('saju-time-unknown').checked = state.user.timeUnknown || false;
    document.getElementById('saju-region').value = state.user.region || '';
    toggleTimeInput('saju-time', 'saju-time-unknown');
  }
}

function toggleTimeInput(inputId, checkboxId) {
  const input = document.getElementById(inputId);
  const checkbox = document.getElementById(checkboxId);
  if (checkbox.checked) {
    input.disabled = true;
    input.value = '';
  } else {
    input.disabled = false;
  }
}

function submitSaju() {
  const name = document.getElementById('saju-name').value.trim();
  const genderEl = document.querySelector('input[name="saju-gender"]:checked');
  let rawDate = document.getElementById('saju-date').value.trim();
  const calEl = document.querySelector('input[name="saju-cal"]:checked');
  const time = document.getElementById('saju-time').value;
  const timeUnknown = document.getElementById('saju-time-unknown').checked;
  const region = document.getElementById('saju-region').value.trim();

  if (!name || !genderEl || !rawDate || !calEl) {
    alert("이름, 성별, 생년월일, 양/음력은 필수 입력 항목입니다.");
    return;
  }

  // Auto formatting
  rawDate = rawDate.replace(/[^0-9]/g, '');
  if (rawDate.length !== 8) {
    alert("생년월일을 1990-03-15 형식으로 입력해주세요.");
    return;
  }

  const y = parseInt(rawDate.substring(0, 4), 10);
  const m = parseInt(rawDate.substring(4, 6), 10);
  const d = parseInt(rawDate.substring(6, 8), 10);

  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) {
    alert("생년월일을 1990-03-15 형식으로 입력해주세요.");
    return;
  }

  const dateObj = new Date(y, m - 1, d);
  if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) {
    alert("생년월일을 1990-03-15 형식으로 입력해주세요.");
    return;
  }

  if (dateObj > new Date()) {
    alert("생년월일을 1990-03-15 형식으로 입력해주세요.");
    return;
  }

  const formattedDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  document.getElementById('saju-date').value = formattedDate;

  const userData = {
    name,
    gender: genderEl.value,
    birthDate: formattedDate,
    calendarType: calEl.value,
    birthTime: time,
    birthTimeUnknown: timeUnknown,
    birthPlace: region,
    // legacy props for UI prepopulation
    date: formattedDate,
    calendar: calEl.value,
    time: time
  };

  if (typeof calculateSaju === 'function') {
    try {
      const calcResult = calculateSaju(userData);
      userData.normalizedBirthData = calcResult.normalizedBirthData;
      userData.sajuResult = calcResult.sajuResult;
      console.log("Saju Calculated:", calcResult);
    } catch(e) {
      console.error("Saju Calculation Error:", e);
    }
  }

  saveUserData(userData);
  if (state.returnToPremium) {
    state.returnToPremium = false;
    navigate('#premium-report');
  } else {
    navigate('#saju-result');
  }
}

// --- Fortune Logic ---
function setupFortuneInput() {
  if (state.user && state.user.name && state.user.date) {
    // If user info exists, go directly to result
    navigate('#fortune-result');
  } else {
    // If no info, redirect to Saju input to gather basic info first
    alert("오늘의 운세를 보려면 기본 정보 입력이 필요합니다.");
    navigate('#saju-input');
  }
}

// --- Gunghap Logic ---
function submitGunghap() {
  const meName = document.getElementById('g-me-name').value.trim();
  const youName = document.getElementById('g-you-name').value.trim();

  if (!meName || !youName) {
    alert("본인과 상대방의 이름을 모두 입력해주세요.");
    return;
  }

  navigate('#gunghap-result');
}

// --- Consult Logic ---
function submitConsult() {
  const q = document.getElementById('consult-query').value.trim();
  if (!q) {
    alert("궁금한 내용을 입력해주세요.");
    return;
  }

  // Show result state
  document.getElementById('consult-form').style.display = 'none';
  document.getElementById('consult-result').style.display = 'block';
}

function resetConsult() {
  document.getElementById('consult-query').value = '';
  document.getElementById('consult-form').style.display = 'block';
  document.getElementById('consult-result').style.display = 'none';
}

// --- Settings Logic ---
function setupSettings() {
  const infoEl = document.getElementById('settings-info');
  if (state.user) {
    infoEl.innerHTML = `<p><strong>저장된 사용자:</strong> ${state.user.name}</p><p>내 정보가 기기에 안전하게 저장되어 있습니다.</p>`;
    document.getElementById('delete-info-btn').style.display = 'block';
  } else {
    infoEl.innerHTML = `<p>저장된 사용자 정보가 없습니다.</p>`;
    document.getElementById('delete-info-btn').style.display = 'none';
  }
}

function setupFortuneResult() {
  const noDataEl = document.getElementById('fortune-no-data');
  const hasDataEl = document.getElementById('fortune-has-data');

  if (!state.user || !state.user.sajuResult) {
    noDataEl.style.display = 'block';
    hasDataEl.style.display = 'none';
    document.getElementById('fortune-date-display').innerText = '';
    return;
  }

  noDataEl.style.display = 'none';
  hasDataEl.style.display = 'block';

  const r = state.user.sajuResult;
  let fortuneData = state.user.todayFortune;

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  if (!fortuneData || fortuneData.dateStr !== dateStr) {
    fortuneData = typeof generateTodayFortune === 'function' ? generateTodayFortune(r, today) : null;
    if(fortuneData) {
      state.user.todayFortune = fortuneData;
      saveUserData(state.user);
    }
  }

  if (fortuneData) {
    document.getElementById('fortune-date-display').innerText = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;
    document.getElementById('fortune-today-pillar').innerText = `${fortuneData.todayPillars.dayStem}${fortuneData.todayPillars.dayBranch}`;
    document.getElementById('fortune-tengod').innerText = fortuneData.todayTenGod;

    document.getElementById('fortune-flow').innerText = fortuneData.sections.flow;
    document.getElementById('fortune-career').innerText = fortuneData.sections.career;
    document.getElementById('fortune-money').innerText = fortuneData.sections.money;
    document.getElementById('fortune-rel').innerText = fortuneData.sections.rel;
    document.getElementById('fortune-action').innerText = fortuneData.sections.action;

    const evi = fortuneData.evidence;
    document.getElementById('fortune-evidence').innerHTML =
      `사용자 일간: ${evi.userDayMaster}<br>
      사용자 일지: ${evi.userDayBranch}<br>
      오늘 일간: ${evi.todayDayStem}<br>
      오늘 일지: ${evi.todayDayBranch}<br>
      오늘 십성: ${evi.todayTenGod}<br>
      일지 관계: ${evi.branchRelation}`;
  }
}

// --- Premium UI Logic ---
function togglePremiumEvidence(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = (el.style.display === 'none') ? 'block' : 'none';
  }
}

function setupPremiumReport() {
  const noDataEl = document.getElementById('premium-no-data');
  const hasDataEl = document.getElementById('premium-has-data');

  if (!state.user || !state.user.sajuResult) {
    if (noDataEl) noDataEl.style.display = 'block';
    if (hasDataEl) hasDataEl.style.display = 'none';
    return;
  }

  if (noDataEl) noDataEl.style.display = 'none';
  if (hasDataEl) hasDataEl.style.display = 'block';

  const container = document.getElementById('premium-candidates-container');
  if (!container) return;

  const r = state.user.sajuResult;

  const premiumEngine = window.UndamjaePremiumEngine;
  if (!premiumEngine || typeof premiumEngine.processPremiumReport !== 'function' || typeof Solar === 'undefined') {
    container.innerHTML = '<div class="result-box"><p>Premium 분석 엔진을 로드할 수 없습니다.</p></div>';
    return;
  }

  let report;
  try {
    r.gender = state.user.gender;
    const nd = state.user.normalizedBirthData;
    const solar = Solar.fromYmdHms(nd.year, nd.month, nd.day, nd.hour, nd.minute, 0);
    const lunarEightChar = solar.getLunar().getEightChar();
    report = premiumEngine.processPremiumReport(r, lunarEightChar);
  } catch (e) {
    console.error(e);
    container.innerHTML = '<div class="result-box"><p>분석 중 오류가 발생했습니다.</p></div>';
    return;
  }

  const STRATEGY_LABELS = {
    'PREPARE': '준비',
    'EXECUTE': '실행',
    'EXPAND': '확장',
    'CONSOLIDATE': '기반 강화',
    'TRANSITION': '전환',
    'REVIEW': '재정비',
    'MIXED': '복합 전환'
  };

  const PATTERN_LABELS = {
    'OUTPUT_TO_RESOURCE': '실행과 성과 연결',
    'RESOURCE_TO_RESPONSIBILITY': '자원과 책임의 확장',
    'LEARNING_TO_OUTPUT': '준비에서 실행으로',
    'OUTPUT_PLUS_CHANGE': '변화 속 실행',
    'RESOURCE_PLUS_COOPERATION': '협력과 자원 활용',
    'RESPONSIBILITY_PLUS_CHANGE': '책임과 환경 변화'
  };

  const PREPARE_DESC = '자원 확보, 관계 정비, 실행 계획 구체화';
  const EXECUTE_DESC = '계획의 실행과 실질적 결과물 도출';
  const EXPAND_DESC = '활동 범위 확대와 새로운 기회 포착';
  const CONSOLIDATE_DESC = '수익성 점검과 운영 시스템 안정화';
  const TRANSITION_DESC = '환경 변화 대응 및 대안 모색';
  const REVIEW_DESC = '비용 정리 및 우선순위 축소';
  const MIXED_DESC = '균형 잡힌 대응과 우선순위 선별';

  const getStrategyTemplates = (state) => {
    switch(state) {
      case 'PREPARE': return {
        desc: PREPARE_DESC,
        prep: '공부, 정보 수집, 계획 정리, 자원 확보',
        do: ['관련 분야의 지식과 정보 수집하기', '필요한 자금과 인맥을 미리 점검하기', '막연한 계획을 구체적인 로드맵으로 정리하기'],
        dont: ['설익은 계획의 성급한 실행', '검증 없는 자금 지출', '주변 환경을 무시한 독단적 결정']
      };
      case 'EXECUTE': return {
        desc: EXECUTE_DESC,
        prep: '실행 우선, 미루던 프로젝트 착수, 측정 가능한 목표 설정',
        do: ['미뤄두었던 주요 프로젝트 착수하기', '측정 가능한 단기 목표 설정하고 달성하기', '생각보다 행동을 우선시하기'],
        dont: ['과도한 완벽주의로 인한 실행 지연', '결과에 대한 두려움으로 회피하기', '지나친 외부 의견 의존']
      };
      case 'EXPAND': return {
        desc: EXPAND_DESC,
        prep: '확장 전 검증, 자금/시간 여력 확인, 인력/협력 관계 점검',
        do: ['검증된 사업이나 업무의 범위를 넓히기', '새로운 협력 관계와 네트워크 구축하기', '확장 전 감당 가능한 손실 한도 정해두기'],
        dont: ['검증 없는 과도한 확장', '본업을 소홀히 하는 무리한 다각화', '자원(시간/비용) 여력에 대한 맹신']
      };
      case 'CONSOLIDATE': return {
        desc: CONSOLIDATE_DESC,
        prep: '기존 성과 정리, 수익성 점검, 운영 시스템 강화',
        do: ['기존 성과를 객관적으로 정리하고 평가하기', '비용 누수 점검 및 재무 시스템 강화하기', '조직이나 개인의 핵심 역량을 단단하게 굳히기'],
        dont: ['무리한 새로운 투자나 급격한 변화', '단기 성과에 집착한 내부 시스템 방치', '무리한 속도전']
      };
      case 'TRANSITION': return {
        desc: TRANSITION_DESC,
        prep: '기존 방식 점검, 대안 준비, 단계적 전환',
        do: ['기존 방식의 한계를 점검하고 대안 준비하기', '급격한 단절보다 단계적인 전환 계획 세우기', '변화하는 환경의 핵심 요구 파악하기'],
        dont: ['과거 방식에 대한 무리한 고집', '대책 없는 퇴사나 급격한 사업 정리', '변화의 신호를 외면하기']
      };
      case 'REVIEW': return {
        desc: REVIEW_DESC,
        prep: '비용 정리, 우선순위 축소, 성과 재검토',
        do: ['불필요한 지출과 낭비 요인 과감히 줄이기', '가장 중요한 1~2개 목표로 우선순위 좁히기', '과거의 실패나 지연 원인 객관적으로 복기하기'],
        dont: ['성과 없는 일에 대한 미련과 집착', '손실을 만회하려는 무리한 베팅', '타인과의 지나친 성과 비교']
      };
      case 'MIXED': return {
        desc: MIXED_DESC,
        prep: '동시다발적 결정 금지, 핵심 1~2개만 선택, 상황 변화 모니터링',
        do: ['서로 다른 기회 중 가장 확실한 것 1~2개만 선택하기', '상황 변화를 예의주시하며 유연하게 대처하기', '결정하기 어려울 때는 행동을 잠시 보류하기'],
        dont: ['동시다발적이고 충동적인 결정', '조급함에 쫓긴 성급한 선택', '주변 상황을 무시한 강행']
      };
      default: return { desc: '', prep: '', do: [], dont: [] };
    }
  };

  const getCategoryAnalysis = (state) => {
    switch(state) {
      case 'PREPARE': return {
        career: "새로운 기술을 익히거나 자격증 등 실력을 쌓는 데 집중할 시기입니다.",
        wealth: "적극적인 투자보다는 종잣돈을 모으고 재무 계획을 세우는 것이 유리합니다.",
        relation: "넓은 인맥보다는 신뢰할 수 있는 소수의 멘토나 조력자를 확보하세요.",
        change: "큰 이동보다는 현재 자리에서 내실을 다지는 것이 좋습니다.",
        study: "학습 효율이 높아지는 시기입니다. 장기적인 목표를 위한 공부를 시작하세요."
      };
      case 'EXECUTE': return {
        career: "그동안 준비한 것을 행동으로 옮겨 실질적인 결과물을 만들어낼 시기입니다.",
        wealth: "계획했던 지출이나 투자를 실행에 옮겨도 좋습니다. 다만 예산을 철저히 지키세요.",
        relation: "목표 달성을 위해 필요한 사람들과 적극적으로 소통하고 협력하세요.",
        change: "실행을 위한 이동이나 부서 이동 등은 긍정적으로 작용할 수 있습니다.",
        study: "이론적인 공부보다 실무를 통해 경험을 쌓는 것이 더 큰 배움이 됩니다."
      };
      case 'EXPAND': return {
        career: "업무 영역을 넓히거나 새로운 프로젝트에 도전하기 좋은 시기입니다.",
        wealth: "자금 융통이 원활해지거나 투자 규모를 늘릴 기회가 생길 수 있습니다.",
        relation: "다양한 사람들과 교류하며 새로운 네트워크를 형성하는 데 유리합니다.",
        change: "더 넓은 무대로의 진출이나 활동 반경을 넓히는 이동에 적합합니다.",
        study: "자신의 전문 분야 외에 인접 분야로 지식을 확장해 보세요."
      };
      case 'CONSOLIDATE': return {
        career: "확장보다는 지금까지 이룬 성과를 안정시키고 시스템을 정비할 때입니다.",
        wealth: "수익 모델을 점검하고 불필요한 비용을 줄여 재무 건전성을 높이세요.",
        relation: "새로운 사람을 만나기보다 기존의 관계를 돈독히 하고 신뢰를 다지세요.",
        change: "잦은 이동은 피하고 안정적인 환경을 유지하는 것이 유리합니다.",
        study: "새로운 것을 배우기보다 알고 있는 지식을 체계적으로 정리하고 깊이를 더하세요."
      };
      case 'TRANSITION': return {
        career: "환경 변화에 맞춰 업무 방식이나 방향을 수정해야 할 수 있습니다.",
        wealth: "기존의 수익 구조에 변화가 생길 수 있으니 유연하게 대처할 준비가 필요합니다.",
        relation: "기존 관계의 재정립이 필요할 수 있으며, 새로운 환경의 사람들과 적응해야 합니다.",
        change: "이직, 이사 등 환경 자체가 크게 변하는 전환점이 될 수 있습니다.",
        study: "변화하는 환경에 필요한 새로운 패러다임이나 기술을 익히는 데 집중하세요."
      };
      case 'REVIEW': return {
        career: "성과가 나지 않는 프로젝트는 과감히 정리하고 우선순위를 재조정하세요.",
        wealth: "손실을 줄이고 리스크 관리에 집중해야 할 시기입니다.",
        relation: "불필요한 관계는 정리하고 에너지를 분산시키지 마세요.",
        change: "충동적인 이동은 피하고, 문제의 원인을 파악하는 데 집중하세요.",
        study: "과거의 실패나 실수를 복기하며 교훈을 얻는 것이 중요합니다."
      };
      case 'MIXED': return {
        career: "여러 기회와 위기가 혼재되어 있으니 상황을 객관적으로 판단해야 합니다.",
        wealth: "안정성과 수익성 사이에서 균형을 잡는 유연한 자금 관리가 필요합니다.",
        relation: "이해관계가 충돌할 수 있으니 중재와 조율에 신경 쓰세요.",
        change: "상황 변화에 따라 유연하게 대응하되, 성급한 결정은 보류하세요.",
        study: "다양한 가능성을 열어두고 폭넓게 탐색하며 상황을 주시하세요."
      };
      default: return null;
    }
  };

  const currentYear = new Date().getFullYear();
  let html = '';

  const windows = report.windows || [];
  let currentWindow = windows.find(w => currentYear >= w.startYear && currentYear <= w.endYear);
  let nextWindow = windows.find(w => w.startYear > currentYear);
  const candidates = (report.primeCandidateWindows || []).slice(0, 5);
  const futureCandidates = candidates.filter(c => c.startYear > currentYear);
  const uniqueStates = candidates.length > 0
    ? [...new Set(candidates.map(c => c.strategyState))]
    : (currentWindow ? [currentWindow.strategyState] : []);

  // Premium Hero
  html += '<div style="background: linear-gradient(135deg, #4a3b72 0%, #2a2145 100%); padding: 30px 20px; border-radius: 12px; margin-bottom: 25px; color: white; text-align: center;">';
  html += '<div style="font-size: 14px; color: #e1d5ff; font-weight: bold; margin-bottom: 10px;">💎 운담재 PREMIUM</div>';
  html += '<h2 style="margin: 0 0 15px 0; font-size: 22px;">나의 인생 타이밍 리포트</h2>';
  if (currentWindow) {
    html += '<div style="font-size: 15px; margin-bottom: 5px; color: #e1d5ff;">현재 핵심 흐름: <span style="font-weight:bold; color:#fff;">[' + STRATEGY_LABELS[currentWindow.strategyState] + ']</span></div>';
    html += '<div style="font-size: 15px; margin-bottom: 5px; color: #e1d5ff;">현재 위치: <span style="font-weight:bold; color:#fff;">' + currentYear + '년</span></div>';
  }
  if (nextWindow) {
    html += '<div style="font-size: 15px; margin-bottom: 5px; color: #e1d5ff;">다음 핵심 구간: <span style="font-weight:bold; color:#fff;">' + nextWindow.startYear + '년~</span></div>';
  }
  if (currentWindow) {
    html += '<div style="font-size: 15px; color: #e1d5ff;">현재 가장 중요한 전략: <span style="font-weight:bold; color:#fff;">' + STRATEGY_LABELS[currentWindow.strategyState] + '</span></div>';
  }
  html += '</div>';

  const renderCard = (title, content, bgColor = '#fafafa', borderColor = '#ddd') => {
    return `<div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #333;">${title}</h3>
      <div style="font-size: 14px; color: #555; line-height: 1.6;">${content}</div>
    </div>`;
  };

  // 1. 현재 나의 위치
  if (currentWindow) {
    const tpls = getStrategyTemplates(currentWindow.strategyState);
    const content = `<strong>${currentYear}년</strong>은 <strong>[${STRATEGY_LABELS[currentWindow.strategyState]}]</strong> 흐름 안에 있습니다.<br>${tpls.desc}`;
    html += renderCard('📍 현재 나의 위치', content);
  }

  // 2. 다음 핵심 시기
  if (nextWindow) {
    const tpls = getStrategyTemplates(nextWindow.strategyState);
    const content = `다가오는 <strong>${nextWindow.startYear}~${nextWindow.endYear}년</strong>은 <strong>[${STRATEGY_LABELS[nextWindow.strategyState]}]</strong> 흐름이 예상됩니다.<br>${tpls.desc}`;
    html += renderCard('🎯 다음 핵심 시기', content, '#f0ebf8', '#d0c3eb');
  }

  // 3. 전성기 후보
  if (candidates.length > 0) {
    let candContent = '';
    candidates.forEach((cand, idx) => {
      candContent += `<div style="margin-bottom: 8px;"><strong>${cand.startYear}~${cand.endYear}년:</strong> [${STRATEGY_LABELS[cand.strategyState]}] 흐름</div>`;
    });
    html += renderCard(candidates.length >= 5 ? '🌟 주목할 전성기 후보 TOP5' : '🌟 주목할 전성기 후보', candContent);
  } else {
    html += renderCard('🌟 주목할 전성기 후보', '강하게 집중된 전성기 후보 구간이 없습니다.<br>특정 시기보다 현재 흐름에 집중하세요.');
  }

  // 4. 기회 구간
  const oppWindows = windows.filter(w => ['EXPAND', 'EXECUTE', 'TRANSITION'].includes(w.strategyState)).slice(0, 5);
  if (oppWindows.length > 0) {
    let oppContent = '';
    oppWindows.forEach(w => {
      oppContent += `<div style="margin-bottom: 8px;"><span style="color:#28a745; margin-right:5px;">●</span><strong>${w.startYear}~${w.endYear}년:</strong> ${STRATEGY_LABELS[w.strategyState]} 기회</div>`;
    });
    html += renderCard('✅ 기회 구간', oppContent);
  } else {
    html += renderCard('✅ 기회 구간', '강하게 집중된 기회 후보 없음');
  }

  // 5. 주의 구간
  const cauWindows = windows.filter(w => w.strategyState === 'MIXED' || w.conflictExist || w.strategyState === 'REVIEW').slice(0, 5);
  if (cauWindows.length > 0) {
    let cauContent = '';
    cauWindows.forEach(w => {
      cauContent += `<div style="margin-bottom: 8px;"><span style="color:#d9534f; margin-right:5px;">■</span><strong>${w.startYear}~${w.endYear}년:</strong> ${STRATEGY_LABELS[w.strategyState]} (점검/주의)</div>`;
    });
    html += renderCard('⚠️ 주의 구간', cauContent);
  } else {
    html += renderCard('⚠️ 주의 구간', '강하게 충돌하는 주의 구간이 없습니다.');
  }

  // 6. 준비 전략
  if (currentWindow) {
    const tpls = getStrategyTemplates(currentWindow.strategyState);
    let prepContent = `<ul style="padding-left: 20px; margin:0;">`;
    prepContent += `<li>${tpls.prep}</li>`;
    prepContent += `</ul>`;
    html += renderCard('📝 지금 준비할 것', prepContent);
  }

  // 7. 행동 전략
  if (currentWindow) {
    const tpls = getStrategyTemplates(currentWindow.strategyState);
    let actContent = `<ul style="padding-left: 20px; margin:0;">`;
    tpls.do.forEach(d => actContent += `<li><span style="color:#28a745;">✓</span> ${d}</li>`);
    tpls.dont.forEach(d => actContent += `<li><span style="color:#d9534f;">△</span> ${d}</li>`);
    actContent += `</ul>`;
    html += renderCard('🏃 지금 행동할 것', actContent);
  }

  // 연도별 상세 데이터 (Accordion)
  html += `<div style="margin-top: 30px; text-align: center; display: flex; gap: 10px; flex-direction: column;">
    <button class="action-btn" style="background: #eee; color: #555; padding: 12px 20px; border-radius: 8px; border: none; font-size: 14px; font-weight: bold;" onclick="togglePremiumEvidence('year-detail-accordion')">연도별 상세 보기 ▾</button>
    <button class="action-btn" style="background: #fff; border: 1px solid #ddd; color: #777; padding: 10px 20px; border-radius: 8px; font-size: 13px;" onclick="navigate('#premium-input')">정보 다시 입력하기</button>
  </div>
  <div id="year-detail-accordion" style="display: none; margin-top: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #fafafa;">`;
  
  if (report.annualResults && report.annualResults.length > 0) {
    html += `<ul style="font-size: 13px; color: #555; padding-left: 20px; margin: 0; line-height: 1.8;">`;
    let curGroupStart = report.annualResults[0].year;
    let curGroupState = report.annualResults[0].strategyState;
    let curGroupEnd = curGroupStart;

    for (let i = 1; i < report.annualResults.length; i++) {
      let ann = report.annualResults[i];
      if (ann.strategyState === curGroupState) {
        curGroupEnd = ann.year;
      } else {
        html += `<li><strong>${curGroupStart}~${curGroupEnd}년:</strong> [${STRATEGY_LABELS[curGroupState]}]</li>`;
        curGroupStart = ann.year;
        curGroupEnd = ann.year;
        curGroupState = ann.strategyState;
      }
    }
    html += `<li><strong>${curGroupStart}~${curGroupEnd}년:</strong> [${STRATEGY_LABELS[curGroupState]}]</li>`;
    html += `</ul>`;
  } else {
    html += `<p style="font-size: 13px; color: #777;">연도별 데이터가 없습니다.</p>`;
  }
  
  html += `</div>`;

  container.innerHTML = html;
}


function startPremiumOnboarding() {
  if (state.user && state.user.sajuResult) {
    navigate('#premium-report');
  } else {
    navigate('#premium-input');
  }
}


function setupPremiumInput() {
  if (state.user) {
    document.getElementById('premium-name').value = state.user.sajuResult.bazi.name || '';
    const g = document.querySelector('input[name="premium-gender"][value="' + state.user.gender + '"]');
    if (g) g.checked = true;
    
    // We don't have the original raw date string saved in state, but we can reconstruct it
    const bazi = state.user.sajuResult.bazi;
    if (bazi.solarDate) {
      const d = bazi.solarDate;
      const m = (d.getMonth()+1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      document.getElementById('premium-date').value = `${d.getFullYear()}-${m}-${day}`;
    }
  }
}

function submitPremium() {
  const name = document.getElementById('premium-name').value.trim();
  const genderEl = document.querySelector('input[name="premium-gender"]:checked');
  const dateRaw = document.getElementById('premium-date').value.trim();
  const calTypeEl = document.querySelector('input[name="premium-cal"]:checked');
  const time = document.getElementById('premium-time').value;
  const timeUnknown = document.getElementById('premium-time-unknown').checked;
  const place = document.getElementById('premium-place').value.trim();

  if (!name) return alert('이름을 입력해주세요.');
  if (!genderEl) return alert('성별을 선택해주세요.');
  if (!dateRaw) return alert('생년월일을 입력해주세요.');
  if (!calTypeEl) return alert('양력/음력을 선택해주세요.');
  if (!timeUnknown && !time) return alert('출생시간을 입력하시거나 모름을 체크해주세요.');

  let dateStr = dateRaw.replace(/[^0-9]/g, '');
  if (dateStr.length !== 8) return alert('생년월일은 YYYYMMDD 또는 YYYY-MM-DD 형식으로 8자리여야 합니다.');
  
  const y = parseInt(dateStr.substring(0, 4), 10);
  const m = parseInt(dateStr.substring(4, 6), 10);
  const d = parseInt(dateStr.substring(6, 8), 10);
  
  if (m < 1 || m > 12 || d < 1 || d > 31) return alert('유효하지 않은 날짜입니다.');
  
  const testDate = new Date(y, m - 1, d);
  if (testDate.getFullYear() !== y || testDate.getMonth() !== m - 1 || testDate.getDate() !== d) {
    return alert('유효하지 않은 날짜입니다. (예: 2월 29일 등 확인)');
  }
  
  const now = new Date();
  if (testDate > now) return alert('미래의 날짜는 입력할 수 없습니다.');

  const formattedDate = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  
  const params = {
    name,
    gender: genderEl.value,
    birthDate: formattedDate,
    calendarType: calTypeEl.value,
    birthTime: timeUnknown ? '12:00' : time,
    birthTimeUnknown: timeUnknown,
    birthPlace: place
  };

  try {
    const r = calculateSaju(params);
    state.user = {
      sajuResult: r.sajuResult,
      gender: params.gender,
      normalizedBirthData: r.normalizedBirthData
    };
    saveUserData(state.user);
    
    // Create premium report immediately
    const bazi = state.user.sajuResult.bazi;
    
    const bd = r.normalizedBirthData;
    const solar = Solar.fromYmdHms(bd.year, bd.month, bd.day, bd.hour, bd.minute, 0);
    const lunarStr = solar.getLunar().getEightChar();
    const report = window.UndamjaePremiumEngine.processPremiumReport(state.user.sajuResult, lunarStr);

    state.premiumReport = report;
    saveUserData(state.user);

    navigate('#premium-report');
  } catch(e) {
    alert('사주 계산 중 오류가 발생했습니다: ' + e.message);
  }
}
