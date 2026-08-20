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
    if (hash === '#fortune-input') setupFortuneInput();
    if (hash === '#settings') setupSettings();
  } else {
    // fallback
    document.getElementById('page-main').classList.add('active');
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
    date,
    calendar: calEl.value,
    time,
    timeUnknown,
    region
  };
  
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
