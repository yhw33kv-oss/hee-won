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
    title: "HEE WON | 희원 도사",
    text: "🔮 희원 도사에서 내 사주와 운세를 확인해봐!",
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
  const date = document.getElementById('saju-date').value;
  const calEl = document.querySelector('input[name="saju-cal"]:checked');
  const time = document.getElementById('saju-time').value;
  const timeUnknown = document.getElementById('saju-time-unknown').checked;
  const region = document.getElementById('saju-region').value.trim();

  if (!name || !genderEl || !date || !calEl) {
    alert("이름, 성별, 생년월일, 양/음력은 필수 입력 항목입니다.");
    return;
  }

  const userData = {
    name,
    gender: genderEl.value,
    birthDate: date,
    calendarType: calEl.value,
    birthTime: time,
    birthTimeUnknown: timeUnknown,
    birthPlace: region,
    // legacy props for UI prepopulation
    date: date,
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
  navigate('#saju-result');
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
