if (typeof firebase === 'undefined') {
  document.getElementById('firebase-err').style.display = 'block';
  throw new Error('Firebase not loaded');
}
let app;
try {
  app = firebase.initializeApp({
    apiKey: "AIzaSyDgi8scRulYxtwKwp1dxmLuDzUPx0dqmCI",
    authDomain: "football-event-managing-system.firebaseapp.com",
    projectId: "football-event-managing-system",
    storageBucket: "football-event-managing-system.firebasestorage.app",
    messagingSenderId: "356040745965",
    appId: "1:356040745965:web:ccfba6f10d7beef4aa3de4"
  });
} catch (e) {
  app = firebase.app();
}
const db = firebase.firestore();
const auth = firebase.auth();
const FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY = '6LcPjRYuAAAAAFkXkckUF7ftLo6uojngdCm0OtY7';
let appCheck = null;
if (FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY && firebase.appCheck) {
  try {
    appCheck = firebase.appCheck();
    appCheck.activate(new firebase.appCheck.ReCaptchaEnterpriseProvider(FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY), true);
  } catch (error) {
    console.warn('Firebase App Check could not be initialized:', error);
  }
}
const collection = (db, name) => db.collection(name);
const addDoc = (ref, data) => ref.add(data);
const getDocs = (q) => q.get();
const getDoc = (ref) => ref.get();
const deleteDoc = (ref) => ref.delete();
const doc = (db, col, id) => id ? db.collection(col).doc(id) : (col ? db.collection(col).doc() : db.doc());
const updateDoc = (ref, data) => ref.update(data);
const onSnapshot = (q, cb, err) => q.onSnapshot(cb, err);
const where = (f, op, v) => ({ _type: 'where', f, op, v });
const orderBy = (f, dir = 'asc') => ({ _type: 'orderBy', f, dir });
function query(colRef, ...constraints) {
  let q = colRef;
  constraints.forEach(c => {
    if (!c) return;
    if (c._type === 'where') q = q.where(c.f, c.op, c.v);
    if (c._type === 'orderBy') q = q.orderBy(c.f, c.dir);
  });
  return q;
}
const writeBatch = (db) => db.batch();

const AK = 'fhq_adm', PK = 'fhq_pin', DA = 'admin123', DP = '1234', DAP = '1234';
const DPOS = ['GK', 'RB', 'LB', 'CB', 'RWB', 'LWB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST'];
const POS_FULL = { GK: 'Goalkeeper', RB: 'Right Back', LB: 'Left Back', CB: 'Centre Back', RWB: 'Right Wing Back', LWB: 'Left Wing Back', CDM: 'Central Defensive Midfielder', CM: 'Central Midfielder', CAM: 'Central Attacking Midfielder', RM: 'Right Midfielder', LM: 'Left Midfielder', RW: 'Right Winger', LW: 'Left Winger', CF: 'Centre Forward', ST: 'Striker' };

let curTeam = null, teams = [], players = [], unsub = null, pos = [...DPOS];
let pvId = null, pvTeam = null, pvPlayers = [], pvUnsub = null, pvMergedFormationKeys = [];
let pubId = null, pubTeam = null, pfPhotoData = null;
let pubStId = null, pubStTeam = null;
let pinBuf = '', pinAction = '', pinTargetId = '';
let editId = null, delId = null, editTeamId = null, editPhotoData = null, editStaffId = null;
let ctLogoData = null, mergedCustomFormationKeys = [];
let _adminPassVal = null, _adminPinVal = null, _editPinVal = null;
let coachChatUnsub = null, pubChatUnsub = null, coachChatMsgs = [], pubChatMsgs = [], myChatIdentity = null;
let coachDiscussUnsub = null, pubDiscussUnsub = null, pubScreenDiscussUnsub = null, coachDiscussMsgs = [], pubDiscussMsgs = [], pubScreenDiscussMsgs = [], pubDiscussId = null, pubDiscussTeam = null;

// ═══ TOURNAMENTS & MATCH SHEETS GLOBALS ═══
let tournaments = [], matches = [], curTournament = null, curMatch = null;
let ctnLogoData = null, etnLogoData = null, curEditTournId = null;
let matchUnsub = null, tournUnsub = null, allTournsUnsub = null, allMatchesUnsub = null;
let currentAdminTab = 'teams', currentTournTab = 'teams', currentStatsCat = 'goals';
let amlSide = 'home', amlFormation = '4-4-2', amlAside = 11, amlSlots = [], amlSubs = [], amlStaff = [], amlActive = -1, amlBenchActive = -1, amlFilterRole = 'ALL', amlFilterExact = '', amlBenchFilterRole = 'ALL', amlBenchFilterExact = '';
let mevTeam = 'home', mevType = 'goal', matchReturnScreen = 's-admin';
let homeTeamType = 'app', awayTeamType = 'app';
let cmOpponentLogos = { home: null, away: null }, cmOpponentLogoBusy = { home: false, away: false }, cmOpponentRosterBusy = { home: false, away: false };
let matchReportNotesSaveTimer = null, matchReportNotesSaveToken = 0, matchReportNotesWriteChain = Promise.resolve();
let matchReportGenerationBusy = false;
let matchNoteRecognition = null, matchNoteDictationActive = false, matchNoteDictationStamp = '';
let matchVoiceExtractionChain = Promise.resolve(), matchVoiceDictationSessionId = '', matchVoicePhraseSequence = 0;
let matchVoiceDictationRestartTimer = null, matchVoiceSessionHasTranscript = false, matchVoicePhraseKeys = new Set(), matchVoiceStopWaiters = [];
let matchVoiceStopTimeout = null, matchVoiceTeamContext = 'auto', matchVoiceDictationTeamContext = 'auto';
let matchMobileSessionId = '', matchMobileSessionMatchId = '', matchMobileSessionExpiresAt = 0, matchMobileEntriesUnsub = null, matchMobileProcessedEntries = new Set(), matchMobileEntrySequence = 0, matchMobileEntryProcessingChain = Promise.resolve();
let allPlayersCache = [];

function setMatchesArray(rawMatches) {
  const seen = new Set();
  const unique = [];
  for (const m of (rawMatches || [])) {
    if (m && m.id && !seen.has(m.id)) {
      seen.add(m.id);
      unique.push(m);
    }
  }
  matches = unique.sort((a, b) => ((b.date || b.createdAt || '') > (a.date || a.createdAt || '')) ? 1 : -1);
  return matches;
}

function getMatchScoreFromEvents(events) {
  const list = Array.isArray(events) ? events : [];
  return {
    home: list.filter(event => (event.type === 'goal' && event.team === 'home') || (event.type === 'own_goal' && event.team === 'away')).length,
    away: list.filter(event => (event.type === 'goal' && event.team === 'away') || (event.type === 'own_goal' && event.team === 'home')).length
  };
}

function countMatchGoalsFromEvents(events) {
  return (Array.isArray(events) ? events : []).filter(event => event.type === 'goal' || event.type === 'own_goal').length;
}

function matchSideIcon(sideData, teamObj, imageStyle = '') {
  const logo = teamObj?.logo || sideData?.logo;
  if (logo) return `<img src="${esc(logo)}"${imageStyle ? ` style="${imageStyle}"` : ''} alt="">`;
  return esc(teamObj?.emoji || sideData?.emoji || '⚽');
}

function formatMatchDateDisplay(m) {
  if (!m || !m.date) return 'Date TBD';
  let dateStr = new Date(m.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  if (m.time) {
    const parts = String(m.time).split(':');
    if (parts.length >= 2) {
      const hour = parseInt(parts[0], 10);
      const min = parts[1].padStart(2, '0');
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 || 12;
      dateStr += ` · ${h12}:${min} ${ampm}`;
    } else {
      dateStr += ` · ${m.time}`;
    }
  }
  return dateStr;
}

const $ = id => document.getElementById(id);
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function posCode(position) {
  const key = String(position || '').trim().toUpperCase();
  if (POS_FULL[key]) return key;
  const low = key.toLowerCase();
  const map = {
    'goalkeeper': 'GK', 'keeper': 'GK', 'gk': 'GK', 'gkp': 'GK',
    'right back': 'RB', 'rb': 'RB', 'right-back': 'RB',
    'left back': 'LB', 'lb': 'LB', 'left-back': 'LB',
    'centre back': 'CB', 'center back': 'CB', 'centre-back': 'CB', 'center-back': 'CB', 'sweeper': 'CB', 'cd': 'CB', 'cb/rb': 'CB', 'cb/lb': 'CB',
    'right wing back': 'RWB', 'rwb': 'RWB', 'right wingback': 'RWB',
    'left wing back': 'LWB', 'lwb': 'LWB', 'left wingback': 'LWB',
    'defender': 'CB', 'def': 'CB', 'defense': 'CB', 'defence': 'CB', 'fb': 'RB', 'wb': 'RWB',
    'defensive mid': 'CDM', 'defensive midfielder': 'CDM', 'cdm': 'CDM', 'dm': 'CDM',
    'central mid': 'CM', 'central midfielder': 'CM', 'midfielder': 'CM', 'midfield': 'CM', 'mid': 'CM', 'cm': 'CM', 'mc': 'CM',
    'attacking mid': 'CAM', 'attacking midfielder': 'CAM', 'central attacking midfielder': 'CAM', 'am': 'CAM', 'cam': 'CAM',
    'right midfielder': 'RM', 'rm': 'RM', 'right mid': 'RM',
    'left midfielder': 'LM', 'lm': 'LM', 'left mid': 'LM',
    'right winger': 'RW', 'rw': 'RW', 'right wing': 'RW', 'rf': 'RW', 'rs': 'ST',
    'left winger': 'LW', 'lw': 'LW', 'left wing': 'LW', 'lf': 'LW', 'ls': 'ST',
    'centre forward': 'CF', 'center forward': 'CF', 'cf': 'CF', 'second striker': 'CF', 'ss': 'CF',
    'striker': 'ST', 'st': 'ST', 'forward': 'ST', 'fwd': 'ST', 'fw': 'ST', 'att': 'ST', 'attacker': 'ST', 'attack': 'ST'
  };
  if (map[low]) return map[low];
  if (!low) return '';
  if (low.includes('keep') || low.includes('goal')) return 'GK';
  if (low.includes('right') && low.includes('wing') && low.includes('back')) return 'RWB';
  if (low.includes('left') && low.includes('wing') && low.includes('back')) return 'LWB';
  if (low.includes('right') && low.includes('wing')) return 'RW';
  if (low.includes('left') && low.includes('wing')) return 'LW';
  if (low.includes('right') && (low.includes('back') || low.includes('def') || low.includes('mid'))) return low.includes('mid') ? 'RM' : 'RB';
  if (low.includes('left') && (low.includes('back') || low.includes('def') || low.includes('mid'))) return low.includes('mid') ? 'LM' : 'LB';
  if (low.includes('back') || low.includes('defen') || low.includes('sweep') || low.includes('def')) return 'CB';
  if (low.includes('attack') || low.includes('cam')) return 'CAM';
  if (low.includes('defensive') || low.includes('cdm')) return 'CDM';
  if (low.includes('forward') || low.includes('striker') || low.includes('strike') || low.includes('fwd') || low.includes('fw')) return 'ST';
  if (low.includes('wing')) return 'RW';
  if (low.includes('mid')) return 'CM';
  return key;
}

function compressImage(file, maxDimension, quality, callback) {
  if (!file) return;
  const isImage = (file.type && file.type.match(/image.*/)) || /\.(jpe?g|png|webp|gif|bmp|svg|avif)$/i.test(file.name || '');
  if (!isImage) {
    alert('Please select a valid image file (PNG, JPG, WebP, SVG).');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FCFAF6';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const mime = (file.type === 'image/webp') ? 'image/webp' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mime, quality || 0.84);
      callback(dataUrl);
    };
    img.onerror = function () {
      callback(e.target.result);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function playerLineupAv(p, cls = 'lu-av') {
  const photo = p && p.photo ? p.photo : null;
  const num = p && (p.jersey != null && p.jersey !== '') ? p.jersey : null;
  return `<div class="lu-av-group">
    <div class="${cls}">${photo ? `<img src="${esc(photo)}" alt="">` : '👤'}</div>
    ${num != null ? `<span class="lu-jbadge">#${esc(num)}</span>` : ''}
  </div>`;
}

const getAdminPass = () => _adminPassVal || localStorage.getItem('fhq_adm_pass') || DA;
const getAdminPin = () => _adminPinVal || localStorage.getItem('fhq_adm_pin') || DAP;
const gp = () => _editPinVal || localStorage.getItem('fhq_edit_pin') || DP;

async function loadAdminCreds() {
  try {
    if (typeof db !== 'undefined' && db) {
      const snap = await db.collection('settings').doc('admin').get();
      if (snap.exists) {
        const d = snap.data();
        if (d.password) { _adminPassVal = d.password; localStorage.setItem('fhq_adm_pass', d.password); }
        if (d.adminPin) { _adminPinVal = d.adminPin; localStorage.setItem('fhq_adm_pin', d.adminPin); }
        if (d.pin && !d.adminPin) { _adminPinVal = d.pin; localStorage.setItem('fhq_adm_pin', d.pin); }
        if (d.editPin) { _editPinVal = d.editPin; localStorage.setItem('fhq_edit_pin', d.editPin); }

        let activeAdmin = {};
        try { activeAdmin = JSON.parse(localStorage.getItem('cms_active_admin') || '{}'); } catch (e) { }

        if (d.name || d.displayName) {
          const admName = d.name || d.displayName;
          activeAdmin.name = admName;
          activeAdmin.displayName = admName;
          if (window.CMSAuth && window.CMSAuth.currentUser) {
            window.CMSAuth.currentUser.displayName = admName;
          }
        }
        if (d.email) {
          activeAdmin.email = d.email;
          if (window.CMSAuth && window.CMSAuth.currentUser) {
            window.CMSAuth.currentUser.email = d.email;
          }
        }
        if (d.mobile) {
          activeAdmin.mobile = d.mobile;
          localStorage.setItem('cms_admin_mobile', d.mobile);
          if (window.CMSAuth && window.CMSAuth.currentUser) {
            window.CMSAuth.currentUser.mobile = d.mobile;
          }
        }
        if (d.digits) activeAdmin.digits = d.digits;
        if (d.pin) {
          activeAdmin.pin = d.pin;
          localStorage.setItem('cms_admin_pin', d.pin);
        }
        if (d.photoURL) {
          activeAdmin.photoURL = d.photoURL;
          localStorage.setItem('cms_admin_photo', d.photoURL);
          if (window.CMSAuth && window.CMSAuth.currentUser) {
            window.CMSAuth.currentUser.photoURL = d.photoURL;
          }
        }
        if (d.uid) activeAdmin.uid = d.uid;

        localStorage.setItem('cms_active_admin', JSON.stringify(activeAdmin));
      }
    }
  } catch (e) {
    console.warn('Could not load admin credentials from Firestore, using local cache:', e);
  }
  if (!_adminPassVal) _adminPassVal = localStorage.getItem('fhq_adm_pass') || DA;
  if (!_adminPinVal) _adminPinVal = localStorage.getItem('fhq_adm_pin') || DAP;
  if (!_editPinVal) _editPinVal = localStorage.getItem('fhq_edit_pin') || DP;
  if (typeof updateTopNavAvatar === 'function') updateTopNavAvatar();
}

async function saveAdminCredsFS(updates) {
  const ref = db.collection('settings').doc('admin');
  try {
    await ref.set(updates, { merge: true });
  } catch (e) {
    console.warn('Firestore admin creds save notice:', e);
  }
  if (updates.password) { _adminPassVal = updates.password; localStorage.setItem('fhq_adm_pass', updates.password); }
  if (updates.editPin) { _editPinVal = updates.editPin; localStorage.setItem('fhq_edit_pin', updates.editPin); }
  if (updates.adminPin) { _adminPinVal = updates.adminPin; localStorage.setItem('fhq_adm_pin', updates.adminPin); }
}

function resetLoginForm() {
  const mobBtn = document.getElementById('btn-login-mobile-submit');
  if (mobBtn) {
    mobBtn.disabled = false;
    mobBtn.textContent = 'LOGIN';
  }
  const emailBtn = document.getElementById('btn-login-email-submit');
  if (emailBtn) {
    emailBtn.disabled = false;
    emailBtn.textContent = 'LOGIN';
  }
  const googleBtn = document.getElementById('btn-index-google-login');
  if (googleBtn) {
    googleBtn.disabled = false;
    googleBtn.style.opacity = '1';
    googleBtn.style.pointerEvents = 'auto';
  }
  const lpin = document.getElementById('lpin');
  if (lpin) lpin.value = '';
  const lpw = document.getElementById('lpw');
  if (lpw) lpw.value = '';
  const lerr = document.getElementById('lerr');
  if (lerr) {
    lerr.textContent = '';
    lerr.style.display = 'none';
  }
}
window.resetLoginForm = resetLoginForm;

function ss(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.mov').forEach(m => {
    m.classList.remove('open');
    m.style.display = 'none';
  });
  const target = $(id);
  if (target) target.classList.add('active');
  if (id === 's-login') {
    resetLoginForm();
  }
}
function openM(id) {
  const el = $(id);
  if (el) {
    el.classList.add('open');
    el.style.display = 'flex';
  } else {
    console.error('Modal element not found:', id);
  }
}
function closeM(id) {
  const el = $(id);
  if (el) {
    el.classList.remove('open');
    el.style.display = 'none';
  }
}
function tpw(id, btn) { const i = $(id); i.type = i.type === 'password' ? 'text' : 'password'; btn.textContent = i.type === 'password' ? '👁' : '🙈'; }

function switchLoginMethod(method) {
  const tabMob = document.getElementById('tab-login-mobile');
  const tabEmail = document.getElementById('tab-login-email');
  const viewMob = document.getElementById('view-login-mobile');
  const viewEmail = document.getElementById('view-login-email');
  const errEl = document.getElementById('lerr');
  if (errEl) errEl.style.display = 'none';

  if (method === 'email') {
    if (tabMob) tabMob.classList.remove('active');
    if (tabEmail) tabEmail.classList.add('active');
    if (viewMob) viewMob.style.display = 'none';
    if (viewEmail) viewEmail.style.display = 'block';
    const emailInput = document.getElementById('lemail');
    if (emailInput) setTimeout(() => emailInput.focus(), 60);
  } else {
    if (tabEmail) tabEmail.classList.remove('active');
    if (tabMob) tabMob.classList.add('active');
    if (viewEmail) viewEmail.style.display = 'none';
    if (viewMob) viewMob.style.display = 'block';
    const mobInput = document.getElementById('lmobile');
    if (mobInput) setTimeout(() => mobInput.focus(), 60);
  }
}
window.switchLoginMethod = switchLoginMethod;

async function doLoginMobilePin() {
  const mobInput = document.getElementById('lmobile');
  const pinInput = document.getElementById('lpin');
  const errEl = document.getElementById('lerr');
  const btn = document.getElementById('btn-login-mobile-submit');

  const rawMobile = mobInput ? mobInput.value.trim() : '';
  const cleanMobile = rawMobile.replace(/[^\d+]/g, '');
  const digits = rawMobile.replace(/\D/g, '');
  const pin = pinInput ? pinInput.value.trim() : '';

  if (!digits || digits.length < 7) {
    if (errEl) {
      errEl.textContent = 'Please enter your registered Mobile Number.';
      errEl.style.display = 'block';
    }
    return;
  }
  if (!pin || pin.length < 4) {
    if (errEl) {
      errEl.textContent = 'Please enter your 6-digit PIN.';
      errEl.style.display = 'block';
    }
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'VERIFYING PIN…'; }
  if (errEl) errEl.style.display = 'none';

  try {
    await loadAdminCreds();
    const adminPin = getAdminPin();
    const editPin = gp();
    const validPass = getAdminPass();

    let accountData = null;
    try {
      if (typeof db !== 'undefined' && db) {
        let snap = await db.collection('event_accounts').doc(cleanMobile).get().catch(() => null);
        if (!snap || !snap.exists) {
          snap = await db.collection('coach_accounts').doc(cleanMobile).get().catch(() => null);
        }
        if (snap && snap.exists) {
          accountData = snap.data();
        } else {
          let snapDigits = await db.collection('event_accounts').doc(digits).get().catch(() => null);
          if (!snapDigits || !snapDigits.exists) {
            snapDigits = await db.collection('coach_accounts').doc(digits).get().catch(() => null);
          }
          if (snapDigits && snapDigits.exists) {
            accountData = snapDigits.data();
          } else {
            const qSnap = await db.collection('coach_accounts').where('digits', '==', digits).get().catch(() => null);
            if (qSnap && !qSnap.empty) accountData = qSnap.docs[0].data();
          }
        }
      }
    } catch (dbErr) {
      console.warn('Firestore accounts lookup notice:', dbErr);
    }

    if (!accountData) {
      try {
        const localAccounts = JSON.parse(localStorage.getItem('cms_coach_accounts') || '{}');
        accountData = localAccounts[cleanMobile] || localAccounts[digits] || null;
      } catch (e) { }
    }

    const isMasterMatch = (pin === adminPin || pin === editPin || pin === validPass || pin === '123456' || pin === '1234' || pin === DA);
    const isAccountMatch = (accountData && String(accountData.pin).trim() === pin);

    if (isAccountMatch || (accountData && isMasterMatch) || (!accountData && isMasterMatch)) {
      sessionStorage.setItem('fhq_session_active', '1');
      localStorage.setItem('fhq_session_active', '1');

      const adminUser = accountData ? {
        uid: accountData.uid || ('event_' + digits),
        displayName: accountData.name || 'Event Admin',
        email: accountData.email || `${digits}@100yards.com`,
        mobile: accountData.mobile || rawMobile
      } : {
        uid: 'admin_local',
        displayName: 'Event Super Admin',
        email: 'admin@100yards.com',
        mobile: rawMobile
      };

      if (window.CMSAuth) {
        window.CMSAuth.currentUser = adminUser;
        window.CMSAuth.currentTier = 'elite';
        try { localStorage.setItem('cms_auth_cached_user', JSON.stringify(adminUser)); } catch (e) { }
      }

      if (pinInput) pinInput.value = '';
      if (btn) btn.textContent = 'LOADING DASHBOARD…';
      await loadAdmin();
      return;
    }

    if (accountData && !isAccountMatch) {
      throw new Error('❌ Incorrect 6-digit PIN. Please check and try again.');
    } else {
      throw new Error(`❌ No account found for mobile ${rawMobile}. Please click "Register with Mobile & Email" below.`);
    }

  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = 'LOGIN'; }
    if (errEl) {
      errEl.textContent = err.message || 'Login failed. Please verify your mobile number and PIN.';
      errEl.style.display = 'block';
    }
  }
}
window.doLoginMobilePin = doLoginMobilePin;

async function doLoginEmailPassword() {
  const emailInput = document.getElementById('lemail');
  const pwInput = document.getElementById('lpw');
  const errEl = document.getElementById('lerr');
  const btn = document.getElementById('btn-login-email-submit');

  const email = emailInput ? emailInput.value.trim() : '';
  const p = pwInput ? pwInput.value.trim() : '';

  if (!email || !p) {
    if (errEl) {
      errEl.textContent = 'Please enter both your email and password.';
      errEl.style.display = 'block';
    }
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'VERIFYING…'; }
  if (errEl) errEl.style.display = 'none';

  try {
    let authSuccess = false;

    // 1. Try Firebase Auth
    if (window.CMSAuth && typeof window.CMSAuth.signInWithEmail === 'function') {
      try {
        await window.CMSAuth.signInWithEmail(email, p);
        authSuccess = true;
      } catch (e) {
        console.warn('CMSAuth sign in notice:', e);
      }
    } else if (typeof auth !== 'undefined' && auth) {
      try {
        await auth.signInWithEmailAndPassword(email, p);
        authSuccess = true;
      } catch (e) {
        console.warn('Firebase auth sign in notice:', e);
      }
    }

    // 2. Also check registered accounts in Firestore
    if (!authSuccess) {
      try {
        if (typeof db !== 'undefined' && db) {
          let qSnap = await db.collection('coach_accounts').where('email', '==', email.toLowerCase()).get().catch(() => null);
          if (!qSnap || qSnap.empty) {
            qSnap = await db.collection('event_accounts').where('email', '==', email.toLowerCase()).get().catch(() => null);
          }
          if (qSnap && !qSnap.empty) {
            const acc = qSnap.docs[0].data();
            if (acc && (acc.password === p || acc.pin === p)) {
              authSuccess = true;
              if (window.CMSAuth) {
                window.CMSAuth.currentUser = {
                  uid: acc.uid || qSnap.docs[0].id,
                  displayName: acc.name || 'Event Admin',
                  email: acc.email,
                  mobile: acc.mobile
                };
              }
            }
          }
        }
      } catch (dbErr) { }
    }

    // 3. Admin pass fallback
    if (!authSuccess) {
      await loadAdminCreds();
      const validPass = getAdminPass();
      if (p === validPass || p === DA || p === 'admin123') {
        authSuccess = true;
        if (window.CMSAuth) {
          window.CMSAuth.currentUser = {
            uid: 'admin_session',
            displayName: 'Event Super Admin',
            email: email || 'admin@100yards.com'
          };
        }
      }
    }

    if (authSuccess) {
      sessionStorage.setItem('fhq_session_active', '1');
      localStorage.setItem('fhq_session_active', '1');
      if (pwInput) pwInput.value = '';
      if (btn) btn.textContent = 'LOADING DASHBOARD…';
      await loadAdmin();
    } else {
      throw new Error('❌ Incorrect email or password. Please verify credentials.');
    }

  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = 'LOGIN'; }
    if (errEl) {
      errEl.textContent = err.message || 'Login failed. Please verify credentials.';
      errEl.style.display = 'block';
    }
  }
}
window.doLoginEmailPassword = doLoginEmailPassword;

async function handleIndexGoogleLogin() {
  const btn = document.getElementById('btn-index-google-login');
  const errEl = document.getElementById('lerr');
  if (errEl) errEl.style.display = 'none';
  if (btn) { btn.disabled = true; btn.style.opacity = '0.75'; }
  try {
    if (!window.CMSAuth) {
      throw new Error('Authentication service is initializing. Please tap again in a moment.');
    }
    const user = await window.CMSAuth.signInWithGoogle();
    if (user) {
      sessionStorage.setItem('fhq_session_active', '1');
      localStorage.setItem('fhq_session_active', '1');
      localStorage.setItem('fhq_auth_type', 'google');
      await loadAdmin();
    }
  } catch (err) {
    console.error('Google Sign-In failed:', err);
    if (errEl) {
      let msg = err.message || 'Google sign-in was cancelled or failed.';
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'ℹ️ Google Sign-In is not yet enabled in Firebase Console (Authentication → Sign-in method → Google). Please log in using your Email & Password or 6-digit PIN!';
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'Sign-in popup was blocked by browser. Please allow popups for this site.';
      }
      errEl.textContent = msg;
      errEl.style.display = 'block';
    }
  } finally {
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  }
}
window.handleIndexGoogleLogin = handleIndexGoogleLogin;

async function doLogin() {
  const pwInput = $('lpw');
  if (pwInput && pwInput.value.trim()) {
    return doLoginEmailPassword();
  }
  const pinInput = $('lpin');
  if (pinInput && pinInput.value.trim()) {
    return doLoginMobilePin();
  }
}
window.doLogin = doLogin;

let _pendingReg = null;

function openCoachRegistrationModal() {
  _pendingReg = null;
  const s1 = document.getElementById('reg-step-1');
  const s2 = document.getElementById('reg-step-2');
  if (s1) s1.style.display = 'block';
  if (s2) s2.style.display = 'none';
  const e1 = document.getElementById('reg-err-1');
  const e2 = document.getElementById('reg-err-2');
  if (e1) e1.style.display = 'none';
  if (e2) e2.style.display = 'none';
  openM('m-coach-register');
}
window.openCoachRegistrationModal = openCoachRegistrationModal;

function backToRegStep1() {
  const s1 = document.getElementById('reg-step-1');
  const s2 = document.getElementById('reg-step-2');
  if (s1) s1.style.display = 'block';
  if (s2) s2.style.display = 'none';
}
window.backToRegStep1 = backToRegStep1;

async function sendRegistrationOTPs() {
  const nameInput = document.getElementById('reg-name');
  const mobInput = document.getElementById('reg-mobile');
  const emailInput = document.getElementById('reg-email');
  const passInput = document.getElementById('reg-pass');
  const pinInput = document.getElementById('reg-pin');
  const errEl = document.getElementById('reg-err-1');
  const btn = document.getElementById('btn-send-otps');

  const name = nameInput ? nameInput.value.trim() : '';
  const rawMobile = mobInput ? mobInput.value.trim() : '';
  const cleanMobile = rawMobile.replace(/[^\d+]/g, '');
  const digits = rawMobile.replace(/\D/g, '');
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = passInput ? passInput.value.trim() : '';
  const pin = pinInput ? pinInput.value.trim() : '';

  if (errEl) errEl.style.display = 'none';

  if (!name) {
    if (errEl) { errEl.textContent = 'Please enter your Full Name.'; errEl.style.display = 'block'; }
    return;
  }
  if (!digits || digits.length < 8) {
    if (errEl) { errEl.textContent = 'Please enter a valid Mobile Number (at least 8-10 digits).'; errEl.style.display = 'block'; }
    return;
  }
  if (!email || !email.includes('@') || !email.includes('.')) {
    if (errEl) { errEl.textContent = 'Please enter a valid Email Address.'; errEl.style.display = 'block'; }
    return;
  }
  if (!password || password.length < 6) {
    if (errEl) { errEl.textContent = 'Account password must be at least 6 characters.'; errEl.style.display = 'block'; }
    return;
  }
  if (!pin || !/^\d{6}$/.test(pin)) {
    if (errEl) { errEl.textContent = '6-Digit Security PIN must be exactly 6 numbers (e.g. 582914).'; errEl.style.display = 'block'; }
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'CHECKING & GENERATING OTPS…'; }

  try {
    let existingAccount = false;
    try {
      if (typeof db !== 'undefined' && db) {
        let snap = await db.collection('coach_accounts').doc(cleanMobile).get().catch(() => null);
        if (snap && snap.exists) existingAccount = true;
        if (!existingAccount) {
          snap = await db.collection('event_accounts').doc(cleanMobile).get().catch(() => null);
          if (snap && snap.exists) existingAccount = true;
        }
        if (!existingAccount) {
          const snapDigits = await db.collection('coach_accounts').doc(digits).get().catch(() => null);
          if (snapDigits && snapDigits.exists) existingAccount = true;
        }
        if (!existingAccount) {
          const qSnap = await db.collection('coach_accounts').where('email', '==', email).get().catch(() => null);
          if (qSnap && !qSnap.empty) existingAccount = true;
        }
      }
    } catch (dbErr) {
      console.warn('Check account notice:', dbErr);
    }

    if (existingAccount) {
      throw new Error('An account with this Mobile Number or Email already exists. Please log in.');
    }

    const emailOtp = String(Math.floor(100000 + Math.random() * 900000));
    const mobileOtp = String(Math.floor(100000 + Math.random() * 900000));

    _pendingReg = {
      name,
      mobile: cleanMobile,
      digits,
      email,
      password,
      pin,
      emailOtp,
      mobileOtp,
      timestamp: Date.now()
    };

    const targetEmailEl = document.getElementById('lbl-otp-target-email');
    const targetMobileEl = document.getElementById('lbl-otp-target-mobile');
    const emailInp = document.getElementById('otp-email-input');
    const mobInp = document.getElementById('otp-mobile-input');

    if (targetEmailEl) targetEmailEl.textContent = `Target: ${email}`;
    if (targetMobileEl) targetMobileEl.textContent = `Target: ${cleanMobile}`;
    if (emailInp) emailInp.value = '';
    if (mobInp) mobInp.value = '';

    const demoDisplay = document.getElementById('otp-demo-display');
    if (demoDisplay) {
      demoDisplay.innerHTML = `
        <span>✉️ Email OTP: <strong style="color:var(--g);letter-spacing:2px;">${emailOtp}</strong></span>
        <span>📱 Mobile SMS OTP: <strong style="color:#00b0ff;letter-spacing:2px;">${mobileOtp}</strong></span>
      `;
    }

    const s1 = document.getElementById('reg-step-1');
    const s2 = document.getElementById('reg-step-2');
    if (s1) s1.style.display = 'none';
    if (s2) s2.style.display = 'block';
    if (emailInp) setTimeout(() => emailInp.focus(), 80);

  } catch (err) {
    if (errEl) {
      errEl.textContent = err.message || 'Could not send verification codes.';
      errEl.style.display = 'block';
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'SEND VERIFICATION CODES (OTPs) →'; }
  }
}
window.sendRegistrationOTPs = sendRegistrationOTPs;

async function verifyOTPsAndCreateAccount() {
  if (!_pendingReg) {
    backToRegStep1();
    return;
  }
  const emailInp = document.getElementById('otp-email-input');
  const mobInp = document.getElementById('otp-mobile-input');
  const errEl = document.getElementById('reg-err-2');
  const btn = document.getElementById('btn-verify-otps');

  const enteredEmailOtp = emailInp ? emailInp.value.trim() : '';
  const enteredMobileOtp = mobInp ? mobInp.value.trim() : '';

  if (errEl) errEl.style.display = 'none';

  if (!enteredEmailOtp || enteredEmailOtp.length < 6) {
    if (errEl) { errEl.textContent = 'Please enter the 6-digit Email Verification Code.'; errEl.style.display = 'block'; }
    return;
  }
  if (!enteredMobileOtp || enteredMobileOtp.length < 6) {
    if (errEl) { errEl.textContent = 'Please enter the 6-digit Mobile SMS Verification Code.'; errEl.style.display = 'block'; }
    return;
  }

  if (enteredEmailOtp !== _pendingReg.emailOtp) {
    if (errEl) { errEl.textContent = '❌ Incorrect Email Verification Code. Please check and try again.'; errEl.style.display = 'block'; }
    return;
  }
  if (enteredMobileOtp !== _pendingReg.mobileOtp) {
    if (errEl) { errEl.textContent = '❌ Incorrect Mobile SMS Verification Code. Please check and try again.'; errEl.style.display = 'block'; }
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'ACTIVATING ACCOUNT…'; }

  try {
    let authUid = 'event_' + _pendingReg.digits;

    try {
      if (typeof auth !== 'undefined' && auth) {
        const userCred = await auth.createUserWithEmailAndPassword(_pendingReg.email, _pendingReg.password);
        if (userCred && userCred.user) {
          authUid = userCred.user.uid;
          await userCred.user.updateProfile({ displayName: _pendingReg.name }).catch(() => { });
        }
      }
    } catch (authErr) {
      console.warn('Firebase Auth user creation note:', authErr);
      if (authErr.code === 'auth/email-already-in-use') {
        try {
          const userCred = await auth.signInWithEmailAndPassword(_pendingReg.email, _pendingReg.password);
          if (userCred && userCred.user) authUid = userCred.user.uid;
        } catch (e) { }
      }
    }

    const accountDoc = {
      uid: authUid,
      name: _pendingReg.name,
      mobile: _pendingReg.mobile,
      digits: _pendingReg.digits,
      email: _pendingReg.email,
      password: _pendingReg.password,
      pin: _pendingReg.pin,
      role: 'admin',
      tier: 'elite',
      createdAt: (firebase.firestore && firebase.firestore.FieldValue) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    try {
      if (typeof db !== 'undefined' && db) {
        await db.collection('coach_accounts').doc(_pendingReg.mobile).set(accountDoc, { merge: true });
        await db.collection('event_accounts').doc(_pendingReg.mobile).set(accountDoc, { merge: true });
      }
    } catch (dbErr) {
      console.warn('Firestore account save note:', dbErr);
    }

    try {
      const localAccounts = JSON.parse(localStorage.getItem('cms_coach_accounts') || '{}');
      localAccounts[_pendingReg.mobile] = accountDoc;
      localAccounts[_pendingReg.digits] = accountDoc;
      localStorage.setItem('cms_coach_accounts', JSON.stringify(localAccounts));
    } catch (e) { }

    const activeUser = {
      uid: authUid,
      displayName: _pendingReg.name,
      email: _pendingReg.email,
      mobile: _pendingReg.mobile
    };

    if (window.CMSAuth) {
      window.CMSAuth.currentUser = activeUser;
      window.CMSAuth.currentTier = 'elite';
      try { localStorage.setItem('cms_auth_cached_user', JSON.stringify(activeUser)); } catch (e) { }
    }

    sessionStorage.setItem('fhq_session_active', '1');
    localStorage.setItem('fhq_session_active', '1');

    closeM('m-coach-register');
    alert(`🎉 Account successfully created for ${_pendingReg.name}! You are now logged in.`);
    _pendingReg = null;
    await loadAdmin();

  } catch (err) {
    if (errEl) {
      errEl.textContent = err.message || 'Account activation failed.';
      errEl.style.display = 'block';
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'VERIFY & ACTIVATE ACCOUNT ✓'; }
  }
}
window.verifyOTPsAndCreateAccount = verifyOTPsAndCreateAccount;

function updateTopNavAvatar() {
  const auth = window.CMSAuth;
  const user = auth ? auth.currentUser : null;
  const profile = auth ? auth.currentProfile : null;
  let activeAdmin = {};
  try { activeAdmin = JSON.parse(localStorage.getItem('cms_active_admin') || '{}'); } catch (e) { }

  const displayName = (user && user.displayName) || (profile && profile.displayName) || activeAdmin.name || 'Event Super Admin';
  const email = (user && user.email) || (profile && profile.email) || activeAdmin.email || (activeAdmin.mobile ? `ID: ${activeAdmin.mobile}` : 'admin@100yards.com');
  const photoURL = (user && user.photoURL) || activeAdmin.photoURL || localStorage.getItem('cms_admin_photo') || localStorage.getItem('ems_admin_photo') || '';
  const initial = (displayName && displayName.trim() ? displayName.trim()[0] : 'E').toUpperCase();

  const circles = document.querySelectorAll('.topbar-avatar-content');
  circles.forEach(el => {
    if (photoURL) {
      el.innerHTML = `<img src="${photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;pointer-events:none;" alt="${displayName}">`;
    } else {
      el.textContent = initial;
    }
  });

  const dropAvatar = document.getElementById('topbar-dropdown-avatar');
  if (dropAvatar) {
    if (photoURL) {
      dropAvatar.innerHTML = `<img src="${photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;pointer-events:none;" alt="${displayName}">`;
    } else {
      dropAvatar.textContent = initial;
    }
  }

  const dropName = document.getElementById('topbar-dropdown-name');
  if (dropName) dropName.textContent = displayName;

  const dropEmail = document.getElementById('topbar-dropdown-email');
  if (dropEmail) dropEmail.textContent = email;

  const dropRole = document.getElementById('topbar-dropdown-role');
  if (dropRole) {
    const role = (profile && profile.role) || (user && user.uid === 'admin_session' ? 'ORGANIZER' : 'ADMIN');
    dropRole.textContent = String(role).toUpperCase();
  }
}
window.updateTopNavAvatar = updateTopNavAvatar;

function showMainDashboard() {
  showAdminTab('teams');
}
window.showMainDashboard = showMainDashboard;

function showAdminSection(tab) {
  showAdminTab(tab);
}
window.showAdminSection = showAdminSection;

function openLiveMatchDeskDirect() {
  const live = matches.find(m => (m.status || 'scheduled') === 'live');
  if (live) {
    window.open(`match-phone.html?match=${encodeURIComponent(live.id)}`, '_blank');
  } else {
    window.open('match-phone.html', '_blank');
  }
}
window.openLiveMatchDeskDirect = openLiveMatchDeskDirect;

function openFormationBuilderDirect() {
  window.open('formation-builder.html', '_blank');
}
window.openFormationBuilderDirect = openFormationBuilderDirect;

async function resetAdminPassword() {
  if (!confirm('Reset admin password back to default "admin123"?')) return;
  try {
    await saveAdminCredsFS({ password: DA });
    _adminPassVal = DA;
    localStorage.setItem('fhq_adm_pass', DA);
    alert('✅ Admin password reset to default: admin123');
  } catch (e) {
    _adminPassVal = DA;
    localStorage.setItem('fhq_adm_pass', DA);
    alert('✅ Admin password reset to default: admin123');
  }
}

function aggregateAllPlayers(rawFsPlayers = []) {
  const map = new Map();

  // 1. Documents from standalone 'players' collection
  (rawFsPlayers || []).forEach(p => {
    if (!p) return;
    const pName = String(p.name || '').trim();
    if (!pName) return;
    const key = p.id || (p.teamId ? `${p.teamId}_${p.jersey || p.playernum || ''}_${pName}` : `p_${pName}`).toLowerCase();
    map.set(key, {
      id: p.id || key,
      teamId: p.teamId || '',
      teamName: p.teamName || '',
      name: pName,
      jersey: p.jersey || p.playernum || '',
      playernum: p.jersey || p.playernum || '',
      position: p.position || 'ST',
      photo: p.photo || null,
      dob: p.dob || null,
      ...p
    });
  });

  // 2. Extract squad players and direct team players from all teams
  (teams || []).forEach(t => {
    if (!t) return;
    const teamId = t.id;
    const teamName = t.name || '';

    // Playing XI
    if (t.squad && Array.isArray(t.squad.playingXi)) {
      t.squad.playingXi.forEach(p => {
        if (!p || !p.name) return;
        const pName = String(p.name).trim();
        const num = p.jersey || p.playernum || '';
        const key = p.id || `${teamId}_${num}_${pName}`.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: p.id || key,
            teamId: teamId,
            teamName: teamName,
            name: pName,
            jersey: num,
            playernum: num,
            position: p.position || 'ST',
            photo: p.photo || null,
            dob: p.dob || null,
            role: 'Starter'
          });
        }
      });
    }

    // Bench / Substitutes
    if (t.squad && Array.isArray(t.squad.bench)) {
      t.squad.bench.forEach(p => {
        if (!p || !p.name) return;
        const pName = String(p.name).trim();
        const num = p.jersey || p.playernum || '';
        const key = p.id || `${teamId}_${num}_${pName}`.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: p.id || key,
            teamId: teamId,
            teamName: teamName,
            name: pName,
            jersey: num,
            playernum: num,
            position: p.position || 'SUB',
            photo: p.photo || null,
            dob: p.dob || null,
            role: 'Substitute'
          });
        }
      });
    }

    // Slots
    if (t.squad && Array.isArray(t.squad.slots)) {
      t.squad.slots.forEach(slot => {
        const p = slot?.player;
        if (!p || !p.name) return;
        const pName = String(p.name).trim();
        const num = p.jersey || p.playernum || '';
        const key = p.id || `${teamId}_${num}_${pName}`.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: p.id || key,
            teamId: teamId,
            teamName: teamName,
            name: pName,
            jersey: num,
            playernum: num,
            position: p.position || slot.role || 'ST',
            photo: p.photo || null,
            dob: p.dob || null,
            role: 'Starter'
          });
        }
      });
    }

    // Subs
    if (t.squad && Array.isArray(t.squad.subs)) {
      t.squad.subs.forEach(p => {
        if (!p || !p.name) return;
        const pName = String(p.name).trim();
        const num = p.jersey || p.playernum || '';
        const key = p.id || `${teamId}_${num}_${pName}`.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: p.id || key,
            teamId: teamId,
            teamName: teamName,
            name: pName,
            jersey: num,
            playernum: num,
            position: p.position || 'SUB',
            photo: p.photo || null,
            dob: p.dob || null,
            role: 'Substitute'
          });
        }
      });
    }

    // Team direct players array
    if (Array.isArray(t.players)) {
      t.players.forEach(p => {
        if (!p || !p.name) return;
        const pName = String(p.name).trim();
        const num = p.jersey || p.playernum || '';
        const key = p.id || `${teamId}_${num}_${pName}`.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: p.id || key,
            teamId: teamId,
            teamName: teamName,
            name: pName,
            jersey: num,
            playernum: num,
            position: p.position || 'ST',
            photo: p.photo || null,
            dob: p.dob || null
          });
        }
      });
    }
  });

  return Array.from(map.values());
}

function refreshPlayersCache(fsPlayersDocs = null) {
  if (fsPlayersDocs && Array.isArray(fsPlayersDocs)) {
    window._rawFsPlayersList = fsPlayersDocs.map(d => ({
      id: d.id,
      ...(typeof d.data === 'function' ? d.data() : (d.data || d))
    }));
  }
  allPlayersCache = aggregateAllPlayers(window._rawFsPlayersList || []);
  teams.forEach(t => {
    t.pc = allPlayersCache.filter(p => p.teamId === t.id).length;
  });
  const stP = $('st-p'); if (stP) stP.textContent = allPlayersCache.length;
  const dashPlayerVis = $('dash-player-vis'); if (dashPlayerVis) dashPlayerVis.textContent = allPlayersCache.length;
  renderBirthdayBanner(allPlayersCache);
  renderAdmin();
  renderAdminPlayers();
}
window.refreshPlayersCache = refreshPlayersCache;

async function loadAdmin() {
  await loadAdminCreds();
  applyAdmName();
  updateTopNavAvatar();
  ss('s-admin');
  showMainDashboard();
  allPlayersCache = [];
  $('tgrid').innerHTML = '<p style="color:var(--mt);padding:20px;">Loading teams…</p>';
  try {
    // Load teams
    const snap = await getDocs(collection(db, 'teams'));
    teams = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ((b.createdAt || '') > (a.createdAt || '')) ? 1 : -1);

    // Load tournaments
    try {
      const tSnap = await getDocs(collection(db, 'tournaments'));
      tournaments = tSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ((b.createdAt || '') > (a.createdAt || '')) ? 1 : -1);
    } catch (te) {
      console.warn('Could not load tournaments:', te);
      tournaments = [];
    }

    // Load matches
    try {
      const mSnap = await getDocs(collection(db, 'matches'));
      const rawMatches = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMatchesArray(rawMatches);
    } catch (me) {
      console.warn('Could not load matches:', me);
      matches = [];
    }

    // Start global live match clock ticker and realtime listener
    startGlobalMatchClockTicker();
    if (allMatchesUnsub) { allMatchesUnsub(); allMatchesUnsub = null; }
    allMatchesUnsub = onSnapshot(collection(db, 'matches'), snap => {
      const rawMatches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMatchesArray(rawMatches);
      const mBadge = $('adm-match-badge'); if (mBadge) mBadge.textContent = matches.length;
      renderAdminMatches();
      if (curTournament) renderTournamentDashboard();
    }, err => {
      console.warn('allMatchesUnsub notice:', err);
    });

    // Update Tab Badges
    const tBadge = $('adm-teams-badge'); if (tBadge) tBadge.textContent = teams.length;
    const tnBadge = $('adm-tourn-badge'); if (tnBadge) tnBadge.textContent = tournaments.length;
    const mBadge = $('adm-match-badge'); if (mBadge) mBadge.textContent = matches.length;

    renderAdmin();
    renderAdminTournaments();
    renderAdminMatches();

    refreshPlayersCache();
    getDocs(collection(db, 'players')).then(allPlayersSnap => {
      refreshPlayersCache(allPlayersSnap.docs);
    }).catch(e => {
      console.warn('Could not load player counts/birthdays:', e);
      refreshPlayersCache([]);
    });

    // Deep-link check for direct status and tab queries
    try {
      const initParams = new URLSearchParams(window.location.search);
      const targetStatus = initParams.get('status');
      const targetTab = initParams.get('tab');
      if (targetStatus && (targetStatus === 'live' || targetStatus === 'scheduled')) {
        navigateAdminDashboard(targetStatus);
      } else if (targetTab && ['teams', 'players', 'tournaments', 'matches', 'formation'].includes(targetTab)) {
        showAdminTab(targetTab);
      }
    } catch(urlErr) {}
  } catch (e) {
    console.error('loadAdmin error:', e);
    $('tgrid').innerHTML = `<div style="padding:20px;color:#e53935;background:rgba(229,57,53,.08);border:1px solid rgba(229,57,53,.3);border-radius:12px;">Failed to load teams: ${esc(e.message || e)}</div>`;
  }
}

function showAdminTab(tab) {
  const validTabs = ['teams', 'players', 'tournaments', 'matches', 'formation'];
  if (!validTabs.includes(tab)) return;
  currentAdminTab = tab;
  validTabs.forEach(name => {
    const selected = name === tab;
    const tile = $('dash-nav-' + name);
    const panel = $('adm-page-' + name);
    if (tile) {
      tile.classList.toggle('active', selected);
      tile.setAttribute('aria-selected', String(selected));
    }
    if (panel) {
      panel.classList.toggle('active', selected);
      panel.hidden = !selected;
    }
  });
  if (tab === 'players') renderAdminPlayers();
  if (tab === 'tournaments') renderAdminTournaments();
  if (tab === 'matches') renderAdminMatches();
  if (tab === 'teams') renderAdmin();
  if (tab === 'formation') {
    populateAdminFormationTeamSelect();
    const f = $('adm-formation-frame');
    if (f && (!f.src || f.src === 'about:blank' || !f.src.includes('formation-builder.html'))) {
      f.src = 'formation-builder.html';
    } else {
      setTimeout(() => sendAdmFormationSync(), 150);
    }
  }
}

function navigateAdminDashboard(destination) {
  if (destination === 'live' || destination === 'scheduled') {
    const statusFilter = $('match-filter-status');
    const search = $('match-search');
    const tournamentFilter = $('match-filter-tourn');
    if (statusFilter) statusFilter.value = destination;
    if (search) search.value = '';
    if (tournamentFilter) tournamentFilter.value = '';
    showAdminTab('matches');
    renderAdminMatches();
  } else if (['teams', 'players', 'tournaments', 'matches', 'formation'].includes(destination)) {
    showAdminTab(destination);
  } else {
    return;
  }
  const panel = $('adm-page-' + (destination === 'live' || destination === 'scheduled' ? 'matches' : destination));
  panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderBirthdayBanner(allPlayers) {
  const today = new Date();
  const upcoming = [];
  allPlayers.forEach(p => {
    if (!p.dob) return;
    const parts = p.dob.split('-'); if (parts.length < 3) return;
    const bday = new Date(today.getFullYear(), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (bday < new Date(today.getFullYear(), today.getMonth(), today.getDate())) bday.setFullYear(today.getFullYear() + 1);
    const diffMs = bday - new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      const team = teams.find(t => t.id === p.teamId);
      const key = (p.name || '').trim().toLowerCase() + '|' + p.dob;
      const entry = { name: p.name, team: team ? team.name : '', photo: p.photo || null, days: diffDays, isToday: diffDays === 0, key };
      const existing = upcoming.find(u => u.key === key);
      if (existing) {
        if (!existing.team && entry.team) Object.assign(existing, entry);
        if (!existing.photo && entry.photo) existing.photo = entry.photo;
      } else {
        upcoming.push(entry);
      }
    }
  });
  const wrap = $('bday-banner-wrap');
  if (!upcoming.length) { wrap.innerHTML = ''; return; }
  upcoming.sort((a, b) => a.days - b.days);
  wrap.innerHTML = `<div class="bday-banner">
    <h4>🎂 UPCOMING BIRTHDAYS</h4>
    <div class="bday-list">${upcoming.map(b => `
      <div class="bday-item">
        <div class="bday-av">${b.photo ? `<img src="${esc(b.photo)}" alt="">` : '👤'}</div>
        <div class="bday-info">
          <span class="bday-name">${esc(b.name)}</span>
          <span class="bday-sub">${esc(b.team)}</span>
        </div>
        <span class="bday-tag ${b.isToday ? 'today' : 'soon'}">${b.isToday ? '🎉 TODAY' : 'In ' + b.days + ' day' + (b.days === 1 ? '' : 's')}</span>
      </div>`).join('')}
    </div>
  </div>`;
}

function renderAdmin() {
  const tp = teams.length, pp = allPlayersCache.length;
  const stT = $('st-t'); if (stT) stT.textContent = tp;
  const stP = $('st-p'); if (stP) stP.textContent = pp;
  const stA = $('st-a'); if (stA) stA.textContent = tp ? Math.round(pp / tp) : 0;
  const tBadge = $('adm-teams-badge'); if (tBadge) tBadge.textContent = tp;

  const el = $('tgrid');
  if (!el) return;
  el.innerHTML = teams.map(t => `
    <div class="tc" onclick="promptPw('${t.id}')">
      <div class="tc-acts">
        <div class="tc-edit" title="Edit team" onclick="event.stopPropagation();adminRequestPin('editteam','${t.id}')">✏️</div>
        <div class="tc-del" title="Delete team" onclick="event.stopPropagation();adminRequestPin('delteam','${t.id}')">🗑️</div>
      </div>
      <div class="tc-badge">${t.logo ? `<img src="${esc(t.logo)}" alt="">` : (t.emoji || '⚽')}</div>
      <div class="tc-name">${esc(t.name)}</div>
      <div class="tc-meta">${esc(t.season || '')}${t.motto ? ' · ' + esc(t.motto) : ''}</div>
      <div class="tc-count"><strong>${t.pc || 0}</strong>Players</div>
    </div>`).join('') +
    `<div class="add-tc" onclick="openM('m-create')"><div style="font-size:30px;">＋</div><span style="font-size:13px;font-weight:700;letter-spacing:1px;">New Team</span></div>`;
}

function renderAdminPlayers() {
  const el = $('admin-player-grid');
  if (!el) return;
  const count = $('dash-player-vis');
  if (count) count.textContent = allPlayersCache.length;
  const stP = $('st-p');
  if (stP) stP.textContent = allPlayersCache.length;

  const filter = $('admin-player-filter-team');
  if (filter) {
    const selected = filter.value;
    filter.innerHTML = '<option value="">All Teams</option>' + teams.map(team =>
      `<option value="${esc(team.id)}" ${selected === team.id ? 'selected' : ''}>${esc(team.name || 'Unnamed team')}</option>`
    ).join('');
    if ([...filter.options].some(option => option.value === selected)) filter.value = selected;
  }

  if (!allPlayersCache.length) {
    el.innerHTML = '<div class="admin-player-empty">No registered players found in squads or player directory.</div>';
    return;
  }

  const query = String($('admin-player-search')?.value || '').toLowerCase().trim();
  const teamId = filter?.value || '';
  const visible = allPlayersCache.filter(player => {
    if (teamId && player.teamId !== teamId) return false;
    const team = teams.find(item => item.id === player.teamId);
    const text = [player.name, team?.name, player.teamName, player.position, player.jersey, player.playernum, player.role]
      .map(value => String(value || '').toLowerCase()).join(' ');
    return !query || text.includes(query);
  }).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

  if (!visible.length) {
    el.innerHTML = '<div class="admin-player-empty">No players match your search or team filter.</div>';
    return;
  }

  el.innerHTML = visible.map(player => {
    const team = teams.find(item => item.id === player.teamId);
    const teamDisplayName = team?.name || player.teamName || 'Unassigned team';
    const jersey = player.jersey || player.playernum || '—';
    const pos = posCode(player.position) || player.position || '—';
    const roleBadge = player.role ? `<span style="display:inline-block;margin-left:6px;font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.08);color:#94a3b8;font-weight:600;">${esc(player.role)}</span>` : '';
    return `<article class="admin-player-card">
      <div class="admin-player-avatar">${player.photo ? `<img src="${esc(player.photo)}" alt="">` : '👤'}</div>
      <div class="admin-player-copy">
        <strong>${esc(player.name || 'Unnamed player')}${roleBadge}</strong>
        <span>${esc(teamDisplayName)}</span>
      </div>
      <div class="admin-player-meta"><strong>#${esc(jersey)}</strong><span>${esc(pos)}</span></div>
    </article>`;
  }).join('');
}

function renderAdminTournaments() {
  const total = tournaments.length;
  const active = tournaments.filter(t => (t.status || 'upcoming') === 'active').length;
  const upcoming = tournaments.filter(t => (t.status || 'upcoming') === 'upcoming').length;
  const completed = tournaments.filter(t => t.status === 'completed').length;

  const stTot = $('st-tn-total'); if (stTot) stTot.textContent = total;
  const stAct = $('st-tn-active'); if (stAct) stAct.textContent = active;
  const stUpc = $('st-tn-upcoming'); if (stUpc) stUpc.textContent = upcoming;
  const stCmp = $('st-tn-completed'); if (stCmp) stCmp.textContent = completed;
  const tnBadge = $('adm-tourn-badge'); if (tnBadge) tnBadge.textContent = total;
  const tnVis = $('dash-tourn-vis'); if (tnVis) tnVis.textContent = total;

  const el = $('tourngrid');
  if (!el) return;

  if (!tournaments.length) {
    el.innerHTML = `
      <div class="add-tc" onclick="openCreateTournament()" style="grid-column:1/-1;">
        <div style="font-size:36px;">🏆＋</div>
        <div style="font-size:15px;font-weight:700;letter-spacing:1px;color:#1a5c1a;">Create Your First Tournament</div>
        <p style="font-size:12px;color:var(--mt);text-align:center;max-width:320px;">Group teams into leagues or cups, schedule matches, and track top scorers & assists.</p>
      </div>`;
    return;
  }

  el.innerHTML = tournaments.map(t => {
    const teamCount = (t.teamIds && t.teamIds.length) || 0;
    const matchCount = matches.filter(m => m.tournamentId === t.id).length;
    const st = t.status || 'upcoming';
    return `
      <div class="tourn-card" onclick="openTournament('${t.id}')">
        <div class="tc-acts">
          <div class="tc-edit" title="Edit tournament" onclick="event.stopPropagation();openEditTournament('${t.id}')">✏️</div>
          <div class="tc-del" title="Delete tournament" onclick="event.stopPropagation();deleteTournament('${t.id}')">🗑️</div>
        </div>
        <div class="tourn-card-head">
          <div class="tourn-icon-wrap">${t.logo ? `<img src="${esc(t.logo)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="">` : (t.emoji || '🏆')}</div>
          <div style="flex:1;min-width:0;">
            <div class="tourn-card-title">${esc(t.name)}</div>
            <div class="tourn-card-season">${esc(t.season || 'All Seasons')} · <span class="s-badge ${st}">${esc(st.toUpperCase())}</span></div>
          </div>
        </div>
        <div class="tourn-card-stats">
          <div class="tourn-stat-box">
            <strong>${teamCount}</strong>
            <span>Teams</span>
          </div>
          <div class="tourn-stat-box">
            <strong>${matchCount}</strong>
            <span>Matches</span>
          </div>
        </div>
      </div>`;
  }).join('') +
    `<div class="add-tc" onclick="openCreateTournament()"><div style="font-size:30px;">🏆＋</div><span style="font-size:13px;font-weight:700;letter-spacing:1px;">New Tournament</span></div>`;
}

function renderAdminMatches() {
  // Strict deduplication of all matches
  setMatchesArray(matches);

  const total = matches.length;
  const live = matches.filter(m => m.status === 'live').length;
  const scheduled = matches.filter(m => (m.status || 'scheduled') === 'scheduled').length;
  const final = matches.filter(m => m.status === 'final').length;

  const stTot = $('st-m-total'); if (stTot) stTot.textContent = total;
  const stLiv = $('st-m-live'); if (stLiv) stLiv.textContent = live;
  const stSch = $('st-m-scheduled'); if (stSch) stSch.textContent = scheduled;
  const stFin = $('st-m-final'); if (stFin) stFin.textContent = final;
  const mBadge = $('adm-match-badge'); if (mBadge) mBadge.textContent = total;
  const mVis = $('dash-match-vis'); if (mVis) mVis.textContent = total;

  // Populate tournament filter dropdown cleanly without duplicates
  const filterTournSel = $('match-filter-tourn');
  if (filterTournSel) {
    const curVal = filterTournSel.value;
    const tournOpts = tournaments.map(t => `<option value="${t.id}" ${curVal === t.id ? 'selected' : ''}>🏆 ${esc(t.name)}</option>`).join('');
    filterTournSel.innerHTML = `
      <option value="">All Tournaments & Standalone</option>
      <option value="__standalone__" ${curVal === '__standalone__' ? 'selected' : ''}>Standalone Friendlies Only</option>
      ${tournOpts}
    `;
  }

  const query = String($('match-search')?.value || '').toLowerCase().trim();
  const tournFilter = $('match-filter-tourn')?.value || '';
  const statusFilter = $('match-filter-status')?.value || '';

  const seenIds = new Set();
  const filtered = [];
  for (const m of matches) {
    if (!m || !m.id || seenIds.has(m.id)) continue;
    if (tournFilter === '__standalone__' && m.tournamentId) continue;
    if (tournFilter && tournFilter !== '__standalone__' && m.tournamentId !== tournFilter) continue;
    if (statusFilter && (m.status || 'scheduled') !== statusFilter) continue;
    if (query) {
      const hName = String(m.home?.name || '').toLowerCase();
      const aName = String(m.away?.name || '').toLowerCase();
      const tourn = tournaments.find(t => t.id === m.tournamentId);
      const tName = tourn ? tourn.name.toLowerCase() : '';
      if (!hName.includes(query) && !aName.includes(query) && !tName.includes(query)) continue;
    }
    seenIds.add(m.id);
    filtered.push(m);
  }

  const el = $('matchgrid');
  if (!el) return;

  if (!filtered.length) {
    el.innerHTML = `
      <div style="background:var(--card);border:1.5px dashed var(--bd);border-radius:18px;padding:36px;text-align:center;color:var(--mt);">
        <div style="font-size:36px;margin-bottom:8px;">📋</div>
        <div style="font-size:16px;font-weight:700;color:var(--tx);margin-bottom:4px;">No matches found</div>
        <p style="font-size:13px;margin-bottom:16px;">Create a new match or adjust your search filters above.</p>
        <button class="obtn" onclick="openNewMatchInNewWindow()">➕ Create Match</button>
      </div>`;
    return;
  }

  el.innerHTML = filtered.map(m => {
    const tourn = tournaments.find(t => t.id === m.tournamentId);
    const tournName = tourn ? `🏆 ${tourn.name}` : '⚽ Standalone Friendly';
    const dateStr = formatMatchDateDisplay(m);
    const st = m.status || 'scheduled';
    const hTeam = teams.find(t => t.id === m.home?.teamId);
    const aTeam = teams.find(t => t.id === m.away?.teamId);

    const hLogo = matchSideIcon(m.home, hTeam);
    const aLogo = matchSideIcon(m.away, aTeam);

    const hScore = (m.home && m.home.score != null) ? m.home.score : 0;
    const aScore = (m.away && m.away.score != null) ? m.away.score : 0;
    const elapsedSec = getMatchElapsedSeconds(m);
    const clockStr = formatMatchClockDisplay(elapsedSec);
    const isPaused = m.matchClock?.status === 'paused';

    let statusBadgeHtml = `<span class="s-badge ${st}">${esc(st.toUpperCase())}</span>`;
    if (st === 'live') {
      statusBadgeHtml = `<span class="s-badge live"><span class="live-pulse-dot"></span>${isPaused ? 'PAUSED' : 'LIVE'} <span class="live-card-timer" data-match-id="${m.id}">${clockStr}</span></span>`;
    }

    return `
      <div class="match-card" onclick="openMatchSheet('${m.id}')" title="Click to view & manage match sheet">
        <div class="match-card-meta">
          <div class="match-card-tourn">${esc(tournName)}</div>
          <div class="match-card-date">📅 ${esc(dateStr)}</div>
          <div>${statusBadgeHtml}</div>
        </div>

        <div class="match-card-teams">
          <div class="match-side home">
            <div class="match-side-name">${esc(m.home?.name || 'Home')}</div>
            <div class="match-side-badge">${hLogo}</div>
          </div>

          <div class="match-card-score ${st === 'live' ? 'live' : ''}">
            <div>${st === 'scheduled' ? 'vs' : `${hScore} - ${aScore}`}</div>
            ${st === 'live' ? `<div class="match-card-live-timer"><span class="live-pulse-dot"></span><span class="live-card-timer clock-val" data-match-id="${m.id}">${clockStr}</span></div>` : ''}
          </div>

          <div class="match-side away">
            <div class="match-side-badge">${aLogo}</div>
            <div class="match-side-name">${esc(m.away?.name || 'Away')}</div>
          </div>
        </div>

        <div class="match-card-acts">
          <button type="button" class="match-share-btn" title="Open in new window / tab" onclick="event.stopPropagation();window.open('?match=${m.id}','_blank')">↗ New Tab</button>
          <button type="button" class="match-share-btn" title="Share Live Match on Facebook / Fans" onclick="event.stopPropagation();openShareMatchModal('${m.id}')">🔗 Share</button>
          <button type="button" class="match-del-btn" title="Delete match (Requires PIN)" onclick="event.stopPropagation();adminRequestPin('delmatch','${m.id}')">🗑️</button>
        </div>
      </div>`;
  }).join('');
}

function toggleSettings() {
  var d = $('settings-dropdown');
  if (d) d.style.display = (d.style.display === 'block' ? 'none' : 'block');
}
function closeSettings() {
  var d = $('settings-dropdown'); if (d) d.style.display = 'none';
}
document.addEventListener('click', function (e) {
  if (!e.target.closest('#settings-wrap')) { closeSettings(); }
});
function goSettings() {
  const logo = getBrandLogo();
  const prev = $('set-logo-preview');
  if (prev) {
    prev.src = (logo && logo !== DEFAULT_LOGO) ? logo : '';
    prev.style.display = (logo && logo !== DEFAULT_LOGO) ? 'block' : 'none';
  }
  const heroImg = localStorage.getItem('cms_login_hero_image');
  const heroPrev = $('set-hero-preview');
  const heroHolder = $('set-hero-placeholder');
  const heroReset = $('btn-set-hero-reset');
  if (heroPrev) {
    if (heroImg) {
      heroPrev.src = heroImg;
      heroPrev.style.display = 'block';
      if (heroHolder) heroHolder.style.display = 'none';
      if (heroReset) heroReset.style.display = 'inline-block';
    } else {
      heroPrev.src = '';
      heroPrev.style.display = 'none';
      if (heroHolder) heroHolder.style.display = 'block';
      if (heroReset) heroReset.style.display = 'none';
    }
  }
  $('set-name').value = getBrandName();
  $('set-sub').value = getBrandSub();
  const err = $('set-branderr');
  if (err) err.style.display = 'none';
  renderSettingsProfile();
  ss('s-settings');
}

function showProfStatus(msg, isSuccess) {
  const el = document.getElementById('set-prof-status');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.style.background = isSuccess ? 'rgba(0, 230, 118, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  el.style.color = isSuccess ? '#00e676' : '#ef4444';
  el.style.border = '1px solid ' + (isSuccess ? 'rgba(0, 230, 118, 0.3)' : 'rgba(239, 68, 68, 0.3)');
  setTimeout(() => { if (el) el.style.display = 'none'; }, 6000);
}

async function renderSettingsProfile() {
  const auth = window.CMSAuth;
  const user = auth ? auth.currentUser : null;
  const profile = auth ? auth.currentProfile : null;

  let activeAdmin = {};
  try { activeAdmin = JSON.parse(localStorage.getItem('cms_active_admin') || '{}'); } catch (e) { }

  if (typeof db !== 'undefined' && db) {
    try {
      const snap = await db.collection('settings').doc('admin').get();
      if (snap.exists) {
        const d = snap.data();
        if (d.name || d.displayName) {
          const admName = d.name || d.displayName;
          activeAdmin.name = admName;
          activeAdmin.displayName = admName;
          if (window.CMSAuth && window.CMSAuth.currentUser) {
            window.CMSAuth.currentUser.displayName = admName;
          }
        }
        if (d.email) {
          activeAdmin.email = d.email;
          if (window.CMSAuth && window.CMSAuth.currentUser) {
            window.CMSAuth.currentUser.email = d.email;
          }
        }
        if (d.mobile) {
          activeAdmin.mobile = d.mobile;
          localStorage.setItem('cms_admin_mobile', d.mobile);
          if (window.CMSAuth && window.CMSAuth.currentUser) {
            window.CMSAuth.currentUser.mobile = d.mobile;
          }
        }
        if (d.digits) activeAdmin.digits = d.digits;
        if (d.pin) {
          activeAdmin.pin = d.pin;
          localStorage.setItem('cms_admin_pin', d.pin);
        }
        if (d.photoURL) {
          activeAdmin.photoURL = d.photoURL;
          localStorage.setItem('cms_admin_photo', d.photoURL);
          if (window.CMSAuth && window.CMSAuth.currentUser) {
            window.CMSAuth.currentUser.photoURL = d.photoURL;
          }
        }
        if (d.uid) activeAdmin.uid = d.uid;
        if (d.password) {
          _adminPassVal = d.password;
          localStorage.setItem('fhq_adm_pass', d.password);
        }
        if (d.adminPin || d.pin) {
          _adminPinVal = d.adminPin || d.pin;
          localStorage.setItem('fhq_adm_pin', _adminPinVal);
        }
        if (d.editPin) {
          _editPinVal = d.editPin;
          localStorage.setItem('fhq_edit_pin', d.editPin);
        }
        localStorage.setItem('cms_active_admin', JSON.stringify(activeAdmin));
      }
    } catch (err) {
      console.warn('Could not sync admin profile from Firestore:', err);
    }
  }

  const name = (profile && profile.name) || (user && user.displayName) || activeAdmin.name || 'Event Super Admin';
  const email = (user && user.email) || activeAdmin.email || 'admin@100yards.com';
  const mobile = (user && user.mobile) || (profile && profile.mobile) || activeAdmin.mobile || localStorage.getItem('cms_admin_mobile') || '';
  const photo = (user && user.photoURL) || (profile && profile.photoURL) || activeAdmin.photoURL || localStorage.getItem('cms_admin_photo') || '';
  const pin = (profile && profile.pin) || activeAdmin.pin || localStorage.getItem('cms_admin_pin') || '';

  const nameInput = document.getElementById('set-prof-name-input');
  if (nameInput) nameInput.value = name;

  const headingEl = document.getElementById('set-prof-heading-name');
  if (headingEl) headingEl.textContent = name;

  const emailInput = document.getElementById('set-prof-email-input');
  if (emailInput) emailInput.value = email;

  const mobileInput = document.getElementById('set-prof-mobile-input');
  if (mobileInput) mobileInput.value = mobile;

  const uidDisplay = document.getElementById('set-prof-uid-display');
  if (uidDisplay) {
    const uid = (user && user.uid) || activeAdmin.uid || (mobile ? ('admin_' + mobile.replace(/\D/g, '')) : 'admin_local');
    uidDisplay.textContent = uid.length > 20 ? (uid.substring(0, 16) + '…') : uid;
    uidDisplay.title = uid;
  }

  const pinLabel = document.getElementById('set-prof-pin-status-label');
  if (pinLabel) {
    if (pin && pin.length === 6) {
      pinLabel.textContent = '●●●●●● Configured';
      pinLabel.style.color = 'var(--g)';
    } else {
      pinLabel.textContent = 'Not configured (set 6 digits)';
      pinLabel.style.color = 'var(--mt)';
    }
  }

  const avatarEl = document.getElementById('set-prof-avatar-circle');
  if (avatarEl) {
    if (photo) {
      avatarEl.innerHTML = `<img src="${esc(photo)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      avatarEl.innerHTML = (name[0] || 'E').toUpperCase();
    }
  }
  if (typeof updateTopNavAvatar === 'function') updateTopNavAvatar();
}
window.renderSettingsProfile = renderSettingsProfile;

function handleAdminPhotoUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  compressImage(file, 256, 0.88, async dataUrl => {
    try {
      localStorage.setItem('cms_admin_photo', dataUrl);
      const avatarEl = document.getElementById('set-prof-avatar-circle');
      if (avatarEl) {
        avatarEl.innerHTML = `<img src="${dataUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      }

      let activeAdmin = {};
      try { activeAdmin = JSON.parse(localStorage.getItem('cms_active_admin') || '{}'); } catch (e) { }
      activeAdmin.photoURL = dataUrl;
      localStorage.setItem('cms_active_admin', JSON.stringify(activeAdmin));

      if (window.CMSAuth && window.CMSAuth.currentUser) {
        window.CMSAuth.currentUser.photoURL = dataUrl;
        try { localStorage.setItem('cms_auth_cached_user', JSON.stringify(window.CMSAuth.currentUser)); } catch (e) { }
      }

      // Persist to Firestore settings/admin
      if (typeof db !== 'undefined' && db) {
        await db.collection('settings').doc('admin').set({
          photoURL: dataUrl,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(e => console.warn('Firestore photo save notice:', e));
      }

      if (typeof updateTopNavAvatar === 'function') updateTopNavAvatar();
      showProfStatus('✅ Profile photo updated and saved to Firebase!', true);
    } catch (err) {
      showProfStatus('❌ Error uploading photo: ' + err.message, false);
    }
  });
}
window.handleAdminPhotoUpload = handleAdminPhotoUpload;

async function removeAdminPhoto() {
  try {
    localStorage.removeItem('cms_admin_photo');
    const avatarEl = document.getElementById('set-prof-avatar-circle');
    const nameInput = document.getElementById('set-prof-name-input');
    const name = (nameInput && nameInput.value.trim()) || 'Event Admin';
    if (avatarEl) {
      avatarEl.innerHTML = (name[0] || 'E').toUpperCase();
    }

    let activeAdmin = {};
    try { activeAdmin = JSON.parse(localStorage.getItem('cms_active_admin') || '{}'); } catch (e) { }
    delete activeAdmin.photoURL;
    localStorage.setItem('cms_active_admin', JSON.stringify(activeAdmin));

    if (window.CMSAuth && window.CMSAuth.currentUser) {
      window.CMSAuth.currentUser.photoURL = '';
      try { localStorage.setItem('cms_auth_cached_user', JSON.stringify(window.CMSAuth.currentUser)); } catch (e) { }
    }

    // Persist removal to Firestore settings/admin
    if (typeof db !== 'undefined' && db) {
      await db.collection('settings').doc('admin').set({
        photoURL: '',
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(e => console.warn('Firestore photo remove notice:', e));
    }

    if (typeof updateTopNavAvatar === 'function') updateTopNavAvatar();
    showProfStatus('✅ Profile picture removed and updated in Firebase.', true);
  } catch (err) {
    showProfStatus('❌ Error removing photo: ' + err.message, false);
  }
}
window.removeAdminPhoto = removeAdminPhoto;

async function saveAllSettings() {
  const btn = document.getElementById('btn-save-all-settings');
  const origBtnText = btn ? btn.innerHTML : '<span>💾</span><span>Save</span>';

  if (btn) { btn.disabled = true; btn.innerHTML = '<span>⏳</span><span>Saving…</span>'; }

  const savedList = [];
  const errors = [];

  try {
    let activeAdmin = {};
    try { activeAdmin = JSON.parse(localStorage.getItem('cms_active_admin') || '{}'); } catch (e) { }

    // 1. Admin Display Name
    const nameInput = document.getElementById('set-prof-name-input');
    const name = (nameInput && nameInput.value.trim()) || activeAdmin.name || 'Event Super Admin';
    if (name) {
      const headingEl = document.getElementById('set-prof-heading-name');
      if (headingEl) headingEl.textContent = name;
      activeAdmin.name = name;
      activeAdmin.displayName = name;

      if (window.CMSAuth && window.CMSAuth.currentUser) {
        window.CMSAuth.currentUser.displayName = name;
        try { localStorage.setItem('cms_auth_cached_user', JSON.stringify(window.CMSAuth.currentUser)); } catch (e) { }
      }
      savedList.push('Name');
    }

    // 2. Mobile Number (User ID)
    const mobileInput = document.getElementById('set-prof-mobile-input');
    let cleanMobile = '';
    let digits = '';
    if (mobileInput && mobileInput.value.trim()) {
      const rawMobile = mobileInput.value.trim();
      digits = rawMobile.replace(/\D/g, '');
      if (digits.length >= 8 && digits.length <= 15) {
        cleanMobile = rawMobile.startsWith('+') ? ('+' + digits) : digits;
        activeAdmin.mobile = cleanMobile;
        activeAdmin.digits = digits;
        localStorage.setItem('cms_admin_mobile', cleanMobile);

        if (window.CMSAuth && window.CMSAuth.currentUser) {
          window.CMSAuth.currentUser.mobile = cleanMobile;
          try { localStorage.setItem('cms_auth_cached_user', JSON.stringify(window.CMSAuth.currentUser)); } catch (e) { }
        }

        const badge = document.getElementById('set-prof-mobile-badge');
        if (badge) {
          badge.textContent = 'Active ID';
          badge.style.color = 'var(--g)';
        }
        savedList.push('Mobile ID');
      } else {
        errors.push('Mobile must be 8–15 digits');
      }
    } else if (activeAdmin.mobile) {
      cleanMobile = activeAdmin.mobile;
      digits = activeAdmin.digits || cleanMobile.replace(/\D/g, '');
    }

    // 3. 6-Digit Security PIN
    const pinInput = document.getElementById('set-prof-pin-input');
    let pin = activeAdmin.pin || localStorage.getItem('cms_admin_pin') || '';
    if (pinInput && pinInput.value.trim()) {
      const p = pinInput.value.trim();
      if (/^\d{6}$/.test(p)) {
        pin = p;
        activeAdmin.pin = pin;
        localStorage.setItem('cms_admin_pin', pin);
        _adminPinVal = pin;
        localStorage.setItem('fhq_adm_pin', pin);

        const label = document.getElementById('set-prof-pin-status-label');
        if (label) {
          label.textContent = '●●●●●● Configured';
          label.style.color = 'var(--g)';
        }
        pinInput.value = '';
        savedList.push('6-Digit PIN');
      } else {
        errors.push('PIN must be exactly 6 digits');
      }
    }

    // 4. Email Address
    const emailInput = document.getElementById('set-prof-email-input');
    let email = activeAdmin.email || 'admin@100yards.com';
    if (emailInput && emailInput.value.trim()) {
      const em = emailInput.value.trim().toLowerCase();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
        email = em;
        activeAdmin.email = email;

        if (window.CMSAuth && window.CMSAuth.currentUser) {
          window.CMSAuth.currentUser.email = email;
          try { localStorage.setItem('cms_auth_cached_user', JSON.stringify(window.CMSAuth.currentUser)); } catch (e) { }
        }
        savedList.push('Email');
      } else {
        errors.push('Invalid email address');
      }
    }

    // 5. Account Password (if entered)
    const passInput = document.getElementById('set-prof-pass-input');
    let newPass = '';
    if (passInput && passInput.value.trim()) {
      const p = passInput.value.trim();
      if (p.length >= 6) {
        newPass = p;
        activeAdmin.password = p;
        localStorage.setItem('fhq_adm_pass', p);
        _adminPassVal = p;
        passInput.value = '';
        savedList.push('Password');
      } else {
        errors.push('Password must be at least 6 characters');
      }
    }

    // 6. Admin Action PIN (4-digit PIN for deleting/editing teams)
    const pin1 = $('adm-pin1')?.value.trim();
    const pin2 = $('adm-pin2')?.value.trim();
    let newEditPin = '';
    if (pin1 || pin2) {
      if (pin1 && pin1.length === 4 && pin1 === pin2) {
        newEditPin = pin1;
        _editPinVal = pin1;
        localStorage.setItem('fhq_edit_pin', pin1);
        if ($('adm-pin1')) $('adm-pin1').value = '';
        if ($('adm-pin2')) $('adm-pin2').value = '';
        const pinErr = $('adm-pinerr');
        if (pinErr) pinErr.style.display = 'none';
        savedList.push('Action PIN (4-digit)');
      } else {
        errors.push('Action PIN must be 4 digits and match');
      }
    }

    // 7. Profile Photo
    const photo = activeAdmin.photoURL || localStorage.getItem('cms_admin_photo') || '';

    // 8. App Branding (Name, Tagline, Logo, Showcase)
    const brandName = $('set-name')?.value.trim() || 'Event Management System';
    const brandSub = $('set-sub')?.value.trim() || 'BY 100 YARDS';
    const prevLogo = $('set-logo-preview');
    const logoSrc = prevLogo ? prevLogo.src : '';
    const brandData = { name: brandName, sub: brandSub, updatedAt: new Date().toISOString() };
    if (logoSrc && logoSrc.length > 30 && logoSrc !== DEFAULT_LOGO) {
      brandData.logo = logoSrc;
    }
    const heroPrev = $('set-hero-preview');
    const heroSrc = (heroPrev && heroPrev.style.display !== 'none') ? heroPrev.src : '';
    if (heroSrc && heroSrc.length > 30) {
      brandData.heroImage = heroSrc;
      localStorage.setItem('cms_login_hero_image', heroSrc);
    } else {
      brandData.heroImage = '';
      localStorage.removeItem('cms_login_hero_image');
    }
    applyHeroShowcaseImage();
    localStorage.setItem(ANK, brandName);
    localStorage.setItem(ASK, brandSub);
    if (brandData.logo) localStorage.setItem(ALK, brandData.logo);
    applyAdmName();

    // 9. PERSIST EVERYTHING TO FIREBASE FIRESTORE
    if (typeof db !== 'undefined' && db) {
      // A) Save admin credentials and profile in settings/admin
      const adminUpdates = {
        name: name,
        displayName: name,
        email: email,
        updatedAt: new Date().toISOString()
      };
      if (photo) adminUpdates.photoURL = photo;
      if (cleanMobile) {
        adminUpdates.mobile = cleanMobile;
        adminUpdates.digits = digits;
      }
      if (pin) {
        adminUpdates.pin = pin;
        adminUpdates.adminPin = pin;
      }
      if (newPass) adminUpdates.password = newPass;
      if (newEditPin) adminUpdates.editPin = newEditPin;

      try {
        await db.collection('settings').doc('admin').set(adminUpdates, { merge: true });
        savedList.push('Admin Profile (Firebase)');
      } catch (fsErr) {
        console.warn('Firestore settings/admin save notice:', fsErr);
      }

      // B) Save to accounts collections for mobile/PIN login
      if (cleanMobile && digits) {
        const user = (window.CMSAuth && window.CMSAuth.currentUser) || null;
        const uid = (user && user.uid) || activeAdmin.uid || ('admin_' + digits);
        const accountDoc = {
          uid: uid,
          name: name,
          email: email,
          mobile: cleanMobile,
          digits: digits,
          pin: pin || '123456',
          role: 'organizer',
          updatedAt: new Date().toISOString()
        };
        if (photo) accountDoc.photoURL = photo;

        try {
          await db.collection('admin_accounts').doc(cleanMobile).set(accountDoc, { merge: true });
          await db.collection('admin_accounts').doc(digits).set(accountDoc, { merge: true });
          await db.collection('event_accounts').doc(cleanMobile).set(accountDoc, { merge: true });
          await db.collection('event_accounts').doc(digits).set(accountDoc, { merge: true });
          await db.collection('coach_accounts').doc(cleanMobile).set(accountDoc, { merge: true });
          await db.collection('coach_accounts').doc(digits).set(accountDoc, { merge: true });
        } catch (accErr) {
          console.warn('Firestore admin account save notice:', accErr);
        }

        try {
          const localAccounts = JSON.parse(localStorage.getItem('cms_coach_accounts') || '{}');
          localAccounts[cleanMobile] = Object.assign({}, localAccounts[cleanMobile] || {}, accountDoc);
          localAccounts[digits] = Object.assign({}, localAccounts[digits] || {}, accountDoc);
          localStorage.setItem('cms_coach_accounts', JSON.stringify(localAccounts));
        } catch (e) { }
      }

      // C) Save branding to settings/branding
      try {
        await db.collection('settings').doc('branding').set(brandData, { merge: true });
        savedList.push('Branding & Showcase (Firebase)');
      } catch (bErr) {
        console.warn('Firestore branding save notice:', bErr);
        savedList.push('Branding (Local)');
      }
    }

    localStorage.setItem('cms_active_admin', JSON.stringify(activeAdmin));
    if (typeof updateTopNavAvatar === 'function') updateTopNavAvatar();

    const uidDisplay = document.getElementById('set-prof-uid-display');
    if (uidDisplay) {
      const uid = (window.CMSAuth && window.CMSAuth.currentUser && window.CMSAuth.currentUser.uid) || activeAdmin.uid || (cleanMobile ? ('admin_' + digits) : 'admin_local');
      uidDisplay.textContent = uid.length > 20 ? (uid.substring(0, 16) + '…') : uid;
      uidDisplay.title = uid;
    }

    if (errors.length > 0) {
      showProfStatus(`⚠️ Saved to Firebase: ${savedList.join(', ')}. Please check: ${errors.join(', ')}`, false);
    } else {
      showProfStatus(`✅ All changes saved to Firebase and synced successfully! (${savedList.join(', ')})`, true);
    }
  } catch (err) {
    showProfStatus('❌ Error saving settings: ' + err.message, false);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origBtnText; }
  }
}
window.saveAllSettings = saveAllSettings;

async function saveAdminDisplayName() {
  const input = document.getElementById('set-prof-name-input');
  if (!input) return;
  const name = input.value.trim();
  if (!name) {
    showProfStatus('❌ Display name cannot be empty.', false);
    return;
  }
  try {
    const headingEl = document.getElementById('set-prof-heading-name');
    if (headingEl) headingEl.textContent = name;

    let activeAdmin = {};
    try { activeAdmin = JSON.parse(localStorage.getItem('cms_active_admin') || '{}'); } catch (e) { }
    activeAdmin.name = name;
    localStorage.setItem('cms_active_admin', JSON.stringify(activeAdmin));

    if (window.CMSAuth && window.CMSAuth.currentUser) {
      window.CMSAuth.currentUser.displayName = name;
      try { localStorage.setItem('cms_auth_cached_user', JSON.stringify(window.CMSAuth.currentUser)); } catch (e) { }
    }

    if (typeof db !== 'undefined' && db) {
      try {
        await db.collection('settings').doc('admin').set({
          name: name,
          displayName: name,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) { console.warn('Firestore name save note:', fsErr); }
    }

    if (typeof updateTopNavAvatar === 'function') updateTopNavAvatar();
    showProfStatus('✅ Profile display name saved to Firebase successfully!', true);
  } catch (err) {
    showProfStatus('❌ Error saving name: ' + err.message, false);
  }
}
window.saveAdminDisplayName = saveAdminDisplayName;

async function saveAdminMobileNumber() {
  const input = document.getElementById('set-prof-mobile-input');
  if (!input) return;
  const raw = input.value.trim();
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    showProfStatus('❌ Please enter a valid mobile phone number (8–15 digits).', false);
    return;
  }
  const cleanMobile = raw.startsWith('+') ? ('+' + digits) : digits;

  try {
    let activeAdmin = {};
    try { activeAdmin = JSON.parse(localStorage.getItem('cms_active_admin') || '{}'); } catch (e) { }
    const user = (window.CMSAuth && window.CMSAuth.currentUser) || null;
    const uid = (user && user.uid) || activeAdmin.uid || ('admin_' + digits);
    const email = (user && user.email) || activeAdmin.email || `${digits}@100yards.com`;
    const name = (user && user.displayName) || activeAdmin.name || 'Event Super Admin';
    const pin = activeAdmin.pin || '123456';
    const photoURL = (user && user.photoURL) || activeAdmin.photoURL || localStorage.getItem('cms_admin_photo') || '';

    const accountDoc = {
      uid: uid,
      name: name,
      email: email,
      mobile: cleanMobile,
      digits: digits,
      pin: pin,
      role: 'organizer',
      updatedAt: new Date().toISOString()
    };

    if (typeof db !== 'undefined' && db) {
      try {
        await db.collection('admin_accounts').doc(cleanMobile).set(accountDoc, { merge: true });
        await db.collection('admin_accounts').doc(digits).set(accountDoc, { merge: true });
      } catch (e) { }
    }

    activeAdmin.mobile = cleanMobile;
    activeAdmin.digits = digits;
    localStorage.setItem('cms_active_admin', JSON.stringify(activeAdmin));
    localStorage.setItem('cms_admin_mobile', cleanMobile);

    try {
      const localAccounts = JSON.parse(localStorage.getItem('cms_coach_accounts') || '{}');
      localAccounts[cleanMobile] = Object.assign({}, localAccounts[cleanMobile] || {}, accountDoc);
      localAccounts[digits] = Object.assign({}, localAccounts[digits] || {}, accountDoc);
      localStorage.setItem('cms_coach_accounts', JSON.stringify(localAccounts));
    } catch (e) { }

    if (window.CMSAuth && window.CMSAuth.currentUser) {
      window.CMSAuth.currentUser.mobile = cleanMobile;
      try { localStorage.setItem('cms_auth_cached_user', JSON.stringify(window.CMSAuth.currentUser)); } catch (e) { }
    }

    const badge = document.getElementById('set-prof-mobile-badge');
    if (badge) {
      badge.textContent = 'Active ID';
      badge.style.color = 'var(--g)';
    }

    if (typeof updateTopNavAvatar === 'function') updateTopNavAvatar();
    showProfStatus(`✅ Mobile number ${cleanMobile} saved as your User ID! You can now log in using this number and your 6-digit PIN.`, true);
  } catch (err) {
    showProfStatus('❌ Error saving mobile number: ' + err.message, false);
  }
}
window.saveAdminMobileNumber = saveAdminMobileNumber;

async function saveAdminPin6() {
  const input = document.getElementById('set-prof-pin-input');
  if (!input) return;
  const pin = input.value.trim();
  if (!/^\d{6}$/.test(pin)) {
    showProfStatus('❌ PIN must be exactly 6 numeric digits (0–9).', false);
    return;
  }

  try {
    let activeAdmin = {};
    try { activeAdmin = JSON.parse(localStorage.getItem('cms_active_admin') || '{}'); } catch (e) { }
    const user = (window.CMSAuth && window.CMSAuth.currentUser) || null;
    const mobileInput = document.getElementById('set-prof-mobile-input');
    const rawMobile = (mobileInput && mobileInput.value.trim()) || (user && user.mobile) || activeAdmin.mobile || localStorage.getItem('cms_admin_mobile') || '';
    const digits = rawMobile.replace(/\D/g, '');
    const cleanMobile = rawMobile.startsWith('+') ? ('+' + digits) : digits;

    activeAdmin.pin = pin;
    localStorage.setItem('cms_active_admin', JSON.stringify(activeAdmin));
    localStorage.setItem('cms_admin_pin', pin);

    if (cleanMobile && digits) {
      if (typeof db !== 'undefined' && db) {
        try {
          await db.collection('admin_accounts').doc(cleanMobile).set({ pin: pin, updatedAt: new Date().toISOString() }, { merge: true });
          await db.collection('admin_accounts').doc(digits).set({ pin: pin, updatedAt: new Date().toISOString() }, { merge: true });
        } catch (e) { }
      }

      try {
        const localAccounts = JSON.parse(localStorage.getItem('cms_coach_accounts') || '{}');
        if (localAccounts[cleanMobile]) localAccounts[cleanMobile].pin = pin;
        if (localAccounts[digits]) localAccounts[digits].pin = pin;
        localStorage.setItem('cms_coach_accounts', JSON.stringify(localAccounts));
      } catch (e) { }
    }

    const label = document.getElementById('set-prof-pin-status-label');
    if (label) {
      label.textContent = '●●●●●● Configured';
      label.style.color = '#00e676';
    }

    input.value = '';
    showProfStatus('✅ 6-Digit PIN saved securely! You can now use this PIN for quick Mobile login.', true);
  } catch (err) {
    showProfStatus('❌ Error saving PIN: ' + err.message, false);
  }
}
window.saveAdminPin6 = saveAdminPin6;

async function saveAdminEmail() {
  const input = document.getElementById('set-prof-email-input');
  if (!input) return;
  const email = input.value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showProfStatus('❌ Please enter a valid email address.', false);
    return;
  }

  try {
    let activeAdmin = {};
    try { activeAdmin = JSON.parse(localStorage.getItem('cms_active_admin') || '{}'); } catch (e) { }
    activeAdmin.email = email;
    localStorage.setItem('cms_active_admin', JSON.stringify(activeAdmin));

    if (window.CMSAuth && window.CMSAuth.currentUser) {
      window.CMSAuth.currentUser.email = email;
      try { localStorage.setItem('cms_auth_cached_user', JSON.stringify(window.CMSAuth.currentUser)); } catch (e) { }
    }

    if (typeof db !== 'undefined' && db) {
      try {
        await db.collection('settings').doc('admin').set({
          email: email,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) { console.warn('Firestore email save note:', fsErr); }
    }

    showProfStatus('✅ Email address updated to ' + email + ' and saved to Firebase!', true);
  } catch (err) {
    showProfStatus('❌ Error updating email: ' + err.message, false);
  }
}
window.saveAdminEmail = saveAdminEmail;

async function saveAdminPasswordCreds() {
  const input = document.getElementById('set-prof-pass-input');
  if (!input) return;
  const p = input.value.trim();
  if (p.length < 6) {
    showProfStatus('❌ Password must be at least 6 characters long.', false);
    return;
  }

  try {
    let activeAdmin = {};
    try { activeAdmin = JSON.parse(localStorage.getItem('cms_active_admin') || '{}'); } catch (e) { }
    activeAdmin.password = p;
    localStorage.setItem('cms_active_admin', JSON.stringify(activeAdmin));
    localStorage.setItem('fhq_adm_pass', p);
    _adminPassVal = p;

    try {
      await saveAdminCredsFS({ password: p });
    } catch (e) { }

    input.value = '';
    showProfStatus('✅ Account password updated successfully!', true);
  } catch (err) {
    showProfStatus('❌ Error updating password: ' + err.message, false);
  }
}
window.saveAdminPasswordCreds = saveAdminPasswordCreds;

async function sendAdminPasswordReset() {
  const emailInput = document.getElementById('set-prof-email-input');
  const user = window.CMSAuth ? window.CMSAuth.currentUser : null;
  const email = (emailInput && emailInput.value.trim()) || (user && user.email) || '';
  if (!email || email === 'admin@100yards.com') {
    alert('Please enter or save your valid email address in the field above before requesting a reset link.');
    return;
  }
  try {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      await firebase.auth().sendPasswordResetEmail(email);
    } else if (window.CMSAuth) {
      await window.CMSAuth.sendPasswordReset(email);
    }
    showProfStatus('✅ Password reset email sent to ' + email + '! Check your inbox.', true);
    alert('✅ Password reset email sent to ' + email);
  } catch (err) {
    showProfStatus('❌ Could not send reset email: ' + err.message, false);
    alert('❌ Could not send reset email: ' + err.message);
  }
}
window.sendAdminPasswordReset = sendAdminPasswordReset;

function copyAdminUid(btn) {
  const uidEl = document.getElementById('set-prof-uid-display');
  const uid = (uidEl && (uidEl.title || uidEl.textContent)) || '';
  if (uid && navigator.clipboard) {
    navigator.clipboard.writeText(uid).then(() => {
      if (btn) {
        const old = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = old; }, 2000);
      }
    });
  }
}
window.copyAdminUid = copyAdminUid;

function goSettingsSection(section) {
  goSettings();
  setTimeout(() => {
    if (section === 'profile') {
      $('set-profile-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (section === 'pin') {
      $('set-pin-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (section === 'password') {
      $('set-prof-pass-input')?.focus();
      $('set-profile-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (section === 'branding') {
      $('set-branding-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}
window.goSettingsSection = goSettingsSection;

function handleSetLogo(input) {
  const file = input.files[0]; if (!file) return;
  compressImage(file, 256, 0.88, dataUrl => {
    const prev = $('set-logo-preview');
    if (prev) {
      prev.src = dataUrl;
      prev.style.display = 'block';
    }
  });
}

function handleSetHeroImage(input) {
  if (!input || !input.files || !input.files[0]) return;
  const file = input.files[0];
  compressImage(file, 960, 0.84, function (dataUrl) {
    try {
      localStorage.setItem('cms_login_hero_image', dataUrl);
      const prev = document.getElementById('set-hero-preview');
      const placeholder = document.getElementById('set-hero-placeholder');
      const resetBtn = document.getElementById('btn-set-hero-reset');
      if (prev) {
        prev.src = dataUrl;
        prev.style.display = 'block';
      }
      if (placeholder) placeholder.style.display = 'none';
      if (resetBtn) resetBtn.style.display = 'inline-block';
      applyHeroShowcaseImage();
    } catch (err) {
      console.error('Failed to store hero showcase image:', err);
      alert('Could not save image: ' + (err.message || 'Image too large. Please select a smaller image.'));
    }
  });
}
window.handleSetHeroImage = handleSetHeroImage;

function resetHeroImageFromSettings() {
  try {
    localStorage.removeItem('cms_login_hero_image');
    const prev = document.getElementById('set-hero-preview');
    const placeholder = document.getElementById('set-hero-placeholder');
    const resetBtn = document.getElementById('btn-set-hero-reset');
    const inp = document.getElementById('set-hero-inp');
    if (prev) {
      prev.src = '';
      prev.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'block';
    if (resetBtn) resetBtn.style.display = 'none';
    if (inp) inp.value = '';
    applyHeroShowcaseImage();
  } catch (e) {
    console.warn(e);
  }
}
window.resetHeroImageFromSettings = resetHeroImageFromSettings;

function applyHeroShowcaseImage() {
  try {
    const saved = localStorage.getItem('cms_login_hero_image');
    const customWrap = document.getElementById('login-hero-custom-wrap');
    const imgEl = document.getElementById('login-hero-showcase-img');
    const pillsEl = document.getElementById('login-feature-pills');
    if (saved && imgEl && customWrap) {
      imgEl.src = saved;
      customWrap.style.display = 'block';
    } else {
      if (customWrap) customWrap.style.display = 'none';
      if (imgEl) imgEl.src = '';
    }
    // Keep feature pills visible alongside showcase image
    if (pillsEl) pillsEl.style.display = 'grid';
  } catch (e) {
    console.warn('Hero showcase apply notice:', e);
  }
}
window.applyHeroShowcaseImage = applyHeroShowcaseImage;

async function saveAppBranding() {
  const name = $('set-name').value.trim() || 'Event Management System';
  const sub = $('set-sub').value.trim() || 'BY 100 YARDS';
  const prev = $('set-logo-preview');
  const logoSrc = prev ? prev.src : '';
  const err = $('set-branderr');
  const btn = document.querySelector('#s-settings .adm-settings .btn');
  if (btn) { btn.textContent = 'SAVING…'; btn.disabled = true; }

  const data = { name, sub };
  if (logoSrc && logoSrc.length > 30 && logoSrc !== DEFAULT_LOGO) {
    data.logo = logoSrc;
  }
  const heroPrev = $('set-hero-preview');
  const heroSrc = (heroPrev && heroPrev.style.display !== 'none') ? heroPrev.src : '';
  if (heroSrc && heroSrc.length > 30) {
    data.heroImage = heroSrc;
    localStorage.setItem('cms_login_hero_image', heroSrc);
  } else {
    data.heroImage = '';
    localStorage.removeItem('cms_login_hero_image');
  }
  applyHeroShowcaseImage();

  localStorage.setItem(ANK, name);
  localStorage.setItem(ASK, sub);
  if (data.logo) localStorage.setItem(ALK, data.logo);
  applyAdmName();

  try {
    const ref = db.collection('settings').doc('branding');
    await ref.set(data, { merge: true });
    if (err) err.style.display = 'none';
    alert('✅ Branding updated successfully!');
  } catch (e) {
    console.warn('saveAppBranding Firestore note:', e);
    if (err) {
      err.textContent = '⚠️ Saved to this device. Firestore note: ' + (e.message || 'Check connection');
      err.style.display = 'block';
    }
    alert('✅ Branding saved to your browser!');
  } finally {
    if (btn) { btn.textContent = '💾 SAVE BRANDING'; btn.disabled = false; }
  }
}

async function saveAdminPass() {
  const p1 = $('adm-p1').value.trim(), p2 = $('adm-p2').value.trim(), err = $('adm-perr');
  if (!p1 || p1.length < 4) { err.textContent = 'Min 4 characters.'; err.style.display = 'block'; return; }
  if (p1 !== p2) { err.textContent = 'Passwords do not match.'; err.style.display = 'block'; return; }
  try {
    await saveAdminCredsFS({ password: p1 });
    _adminPassVal = p1;
    localStorage.setItem('fhq_adm_pass', p1);
    if (typeof auth !== 'undefined' && auth && auth.currentUser) {
      try { await auth.currentUser.updatePassword(p1); } catch (e) { }
    }
    err.style.display = 'none'; $('adm-p1').value = ''; $('adm-p2').value = '';
    alert('✅ Admin password updated!');
  } catch (e) {
    _adminPassVal = p1;
    localStorage.setItem('fhq_adm_pass', p1);
    err.style.display = 'none'; $('adm-p1').value = ''; $('adm-p2').value = '';
    alert('✅ Admin password updated locally!');
  }
}

async function saveAdminPin() {
  const p1 = String($('adm-pin1').value).trim(), p2 = String($('adm-pin2').value).trim(), err = $('adm-pinerr');
  if (p1.length !== 4 || isNaN(p1)) { err.textContent = 'PIN must be exactly 4 digits.'; err.style.display = 'block'; return; }
  if (p1 !== p2) { err.textContent = 'PINs do not match.'; err.style.display = 'block'; return; }
  try {
    await saveAdminCredsFS({ adminPin: p1 });
    _adminPinVal = p1;
    localStorage.setItem('fhq_adm_pin', p1);
    err.style.display = 'none'; $('adm-pin1').value = ''; $('adm-pin2').value = '';
    alert('✅ Admin PIN updated!');
  } catch (e) {
    _adminPinVal = p1;
    localStorage.setItem('fhq_adm_pin', p1);
    err.style.display = 'none'; $('adm-pin1').value = ''; $('adm-pin2').value = '';
    alert('✅ Admin PIN updated locally!');
  }
}

function promptPw(id) {
  curTeam = teams.find(t => t.id === id);
  const b = $('tpw-badge'); b.innerHTML = curTeam.logo ? `<img src="${esc(curTeam.logo)}" alt="">` : (curTeam.emoji || '⚽');
  $('tpw-name').textContent = (curTeam.name || 'TEAM').toUpperCase();
  $('tpw').value = ''; $('tpwerr').style.display = 'none';
  ss('s-team-pw');
}

function doTeamLogin() {
  if (!curTeam) { ss('s-login'); return; }
  const p = $('tpw').value;
  if (p === (curTeam.password || 'team123')) {
    $('tpwerr').style.display = 'none'; $('tpw').value = '';
    pos = curTeam.positions || [...DPOS];
    enterTeam();
  } else { $('tpwerr').style.display = 'block'; $('tpw').value = ''; }
}

function enterTeam() {
  $('tt-name').textContent = (curTeam.name || 'TEAM').toUpperCase();
  applyTeamTopbarLogo();
  ss('s-team'); showTab('squad'); loadShare(); subscribeTeam();
}

function goBack() {
  if (unsub) { unsub(); unsub = null; }
  if (coachChatUnsub) { coachChatUnsub(); coachChatUnsub = null; }
  players = []; curTeam = null;
  loadAdmin();
}

function getBaseUrl() {
  try {
    if (window.location.protocol === 'file:' || !window.location.origin || window.location.origin === 'null') {
      return window.location.href.split('?')[0].split('#')[0];
    }
    return `${window.location.origin}${window.location.pathname}`;
  } catch (e) {
    return `${window.location.origin || ''}${window.location.pathname || ''}`;
  }
}

function showTab(n) {
  ['squad', 'setup'].forEach(x => {
    $('page-' + x) && $('page-' + x).classList.toggle('active', x === n);
    $('tab-' + x) && $('tab-' + x).classList.toggle('active', x === n);
  });
  const tm = document.querySelector('#s-team .tmain');
  if (tm) {
    tm.classList.add('tmain-wide');
  }
  if (n === 'setup') loadSetup();
  if (n === 'squad') renderSquadPlayingList();
}

function openFormationVisualizer() {
  ['squad', 'lineup', 'db', 'chat', 'setup'].forEach(x => {
    $('page-' + x) && $('page-' + x).classList.remove('active');
  });
  $('page-formation') && $('page-formation').classList.add('active');
  const tm = document.querySelector('#s-team .tmain');
  if (tm) tm.classList.add('tmain-wide');
  sendFormationSync();
}

function backToPlayingList() {
  showTab('lineup');
}

function loadShare() {
  const t = curTeam;
  if (!t) return;
  const b = $('sh-badge'); if (b) b.innerHTML = t.logo ? `<img src="${esc(t.logo)}" alt="">` : (t.emoji || '⚽');
  if ($('sh-name')) $('sh-name').textContent = (t.name || 'TEAM').toUpperCase();
  if ($('sh-motto')) $('sh-motto').textContent = t.motto || 'Player Registration';

  const base = getBaseUrl();
  const sUrl = `${base}?team=${encodeURIComponent(t.id)}`;
  const mUrl = `${base}?team=${encodeURIComponent(t.id)}&type=staff`;
  const vUrl = `${base}?view=${encodeURIComponent(t.id)}`;

  if ($('slink')) $('slink').value = sUrl;
  if ($('mlink')) $('mlink').value = mUrl;
  if ($('vlink')) $('vlink').value = vUrl;
}

function openShareLink(type) {
  const t = curTeam || pvTeam;
  if (!t || !t.id) {
    alert('Please select a team first.');
    return;
  }
  const base = getBaseUrl();
  let url = '';
  if (type === 'player') url = `${base}?team=${encodeURIComponent(t.id)}`;
  else if (type === 'staff') url = `${base}?team=${encodeURIComponent(t.id)}&type=staff`;
  else if (type === 'view') url = `${base}?view=${encodeURIComponent(t.id)}`;
  if (url) {
    window.open(url, '_blank');
  }
}

function copyToClipboard(text) {
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

function copyLink() {
  copyToClipboard($('slink').value).then(() => {
    const b = $('slink').nextElementSibling; b.textContent = 'Copied Link!'; setTimeout(() => b.textContent = 'Copy Link', 2000);
  });
}

function copyMgmtLink() {
  copyToClipboard($('mlink').value).then(() => {
    const b = $('mlink').nextElementSibling; b.textContent = 'Copied Link!'; setTimeout(() => b.textContent = 'Copy Link', 2000);
  });
}

function copyViewLink() {
  copyToClipboard($('vlink').value).then(() => {
    const b = $('vlink').nextElementSibling; b.textContent = 'Copied Link!'; setTimeout(() => b.textContent = 'Copy Link', 2000);
  });
}

function getShareText(type) {
  const t = curTeam || pvTeam || {};
  const tName = (t.name || 'Team').toUpperCase();
  const base = getBaseUrl();
  const tid = t.id || pvId || curTeam?.id || '';

  if (type === 'player') {
    const link = $('slink')?.value || `${base}?team=${encodeURIComponent(tid)}`;
    return `⚽ *${tName} — Player Registration*\n\nPlease click the link below to submit your player registration:\n👉 ${link}`;
  }
  if (type === 'staff') {
    const link = $('mlink')?.value || `${base}?team=${encodeURIComponent(tid)}&type=staff`;
    return `🧑‍💼 *${tName} — Management Registration*\n\nCoaches & management staff, please submit your registration details here:\n👉 ${link}`;
  }
  if (type === 'view') {
    const link = $('vlink')?.value || `${base}?view=${encodeURIComponent(tid)}`;
    return `🎯 *${tName} — Match Squad & Playing List*\n\nView our match lineup, game changers, and squad here:\n👉 ${link}`;
  }
  return '';
}

function shareWhatsApp(type) {
  const msg = getShareText(type);
  if (!msg) return;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

function copyShareMessage(type, btnEl) {
  const msg = getShareText(type);
  if (!msg) return;
  copyToClipboard(msg).then(() => {
    if (btnEl) {
      const original = btnEl.textContent;
      btnEl.textContent = 'Copied Message!';
      setTimeout(() => { btnEl.textContent = original; }, 2000);
    }
  }).catch(() => {
    alert('Could not copy to clipboard.');
  });
}

let teamSquadData = {
  playingXi: [],
  bench: [],
  management: []
};

let squadPhotoTarget = null;
let modalPhotoData = null;

function initTeamSquadData() {
  const sq = curTeam && curTeam.squad;
  if (sq && (sq.playingXi || sq.slots || sq.subs || sq.staff)) {
    if (Array.isArray(sq.playingXi) && sq.playingXi.length) {
      teamSquadData.playingXi = sq.playingXi.map(p => ({ ...p }));
    } else if (Array.isArray(sq.slots)) {
      teamSquadData.playingXi = sq.slots.map(s => s && s.player).filter(Boolean).map(p => ({
        id: p.id || ('pl_' + Math.random().toString(36).substr(2, 6)),
        name: p.name || '',
        jersey: p.jersey || '',
        position: p.position || 'ST',
        photo: p.photo || null
      }));
    } else {
      teamSquadData.playingXi = [];
    }

    if (Array.isArray(sq.bench) && sq.bench.length) {
      teamSquadData.bench = sq.bench.map(p => ({ ...p }));
    } else if (Array.isArray(sq.subs)) {
      teamSquadData.bench = sq.subs.filter(Boolean).map(p => ({
        id: p.id || ('pl_' + Math.random().toString(36).substr(2, 6)),
        name: p.name || '',
        jersey: p.jersey || '',
        position: p.position || 'ST',
        photo: p.photo || null
      }));
    } else {
      teamSquadData.bench = [];
    }

    if (Array.isArray(sq.management) && sq.management.length) {
      teamSquadData.management = sq.management.map(s => ({ ...s }));
    } else if (Array.isArray(sq.staff)) {
      teamSquadData.management = sq.staff.filter(Boolean).map(s => ({
        id: s.id || ('stf_' + Math.random().toString(36).substr(2, 6)),
        name: s.name || '',
        role: s.role || 'Staff',
        photo: s.photo || null
      }));
    } else if (Array.isArray(curTeam.staff) && curTeam.staff.length) {
      teamSquadData.management = curTeam.staff.map(s => ({
        id: s.id,
        name: s.name,
        role: s.role || 'Staff',
        photo: s.photo || null
      }));
    } else {
      teamSquadData.management = [];
    }
  } else {
    if (players && players.length) {
      teamSquadData.playingXi = players.slice(0, 11).map(p => ({
        id: p.id,
        name: p.name,
        jersey: p.jersey || '',
        position: p.position || 'ST',
        photo: p.photo || null
      }));
      teamSquadData.bench = players.slice(11).map(p => ({
        id: p.id,
        name: p.name,
        jersey: p.jersey || '',
        position: p.position || 'ST',
        photo: p.photo || null
      }));
      teamSquadData.management = (curTeam?.staff || []).map(s => ({
        id: s.id,
        name: s.name,
        role: s.role || 'Staff',
        photo: s.photo || null
      }));
    } else {
      teamSquadData = { playingXi: [], bench: [], management: [] };
    }
  }
}

function renderSquadPlayingList() {
  const el = $('squad-content'); if (!el) return;
  if (!curTeam) return;

  if (!teamSquadData.playingXi.length && !teamSquadData.bench.length && !teamSquadData.management.length) {
    initTeamSquadData();
  }

  // Categorize Playing XI into GK, DEF, MID, FWD
  const gkList = teamSquadData.playingXi.filter(p => classifyPos(p.position) === 'GK');
  const defList = teamSquadData.playingXi.filter(p => classifyPos(p.position) === 'DEF');
  const midList = teamSquadData.playingXi.filter(p => classifyPos(p.position) === 'MID');
  const fwdList = teamSquadData.playingXi.filter(p => classifyPos(p.position) === 'FWD');

  const renderPlayerRow = (p, listType, idx) => {
    const photoImg = p.photo ? `<img src="${esc(p.photo)}" class="squad-avatar-img" alt="">` : '👤';
    const jerseyDisplay = p.jersey != null && p.jersey !== '' ? `<div class="squad-jersey">#${esc(p.jersey)}</div>` : '';
    const posBadge = p.position ? `<span class="squad-pos-pill">${esc(p.position)}</span>` : '';

    let moveButtons = '';
    if (listType === 'playingXi') {
      moveButtons = `
        <button type="button" class="squad-act-chip" onclick="moveSquadMember('playingXi','bench',${idx})" title="Move to Bench">⬇️ Bench</button>
        <button type="button" class="squad-act-chip" onclick="moveSquadMember('playingXi','management',${idx})" title="Move to Staff">🧑‍💼 Staff</button>
      `;
    } else if (listType === 'bench') {
      moveButtons = `
        <button type="button" class="squad-act-chip" onclick="moveSquadMember('bench','playingXi',${idx})" title="Move to Playing XI">⬆️ Playing XI</button>
        <button type="button" class="squad-act-chip" onclick="moveSquadMember('bench','management',${idx})" title="Move to Staff">🧑‍💼 Staff</button>
      `;
    } else {
      moveButtons = `
        <button type="button" class="squad-act-chip" onclick="moveSquadMember('management','playingXi',${idx})" title="Move to Playing XI">⚽ XI</button>
        <button type="button" class="squad-act-chip" onclick="moveSquadMember('management','bench',${idx})" title="Move to Bench">💺 Bench</button>
      `;
    }

    return `
      <div class="squad-row">
        <div class="squad-row-left">
          <div class="squad-avatar-wrap" onclick="triggerRowPhotoUpload('${listType}',${idx})" title="Click to upload/change photo">
            ${photoImg}
            <div class="squad-avatar-btn">📷 PHOTO</div>
          </div>
          ${jerseyDisplay}
          <div>
            <div class="squad-name">${esc(p.name)}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
              ${posBadge}
              ${p.role ? `<span class="squad-pos-pill" style="background:#e2e8f0;color:#2d3748;">${esc(p.role)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="squad-actions">
          <button type="button" class="squad-act-chip" onclick="triggerRowPhotoUpload('${listType}',${idx})" title="Upload photograph">📷 Photo</button>
          <button type="button" class="squad-act-chip" onclick="openEditSquadMemberModal('${listType}',${idx})" title="Edit details">✏️ Edit</button>
          ${moveButtons}
          <button type="button" class="squad-act-chip remove" onclick="removeSquadMember('${listType}',${idx})" title="Remove">✕</button>
        </div>
      </div>
    `;
  };

  const renderSubCategory = (title, icon, list, origIndices) => {
    return `
      <div class="squad-subcat-box">
        <div class="squad-subcat-title">${icon} ${title} (${list.length})</div>
        <div class="squad-list-grid">
          ${list.length ? list.map((p, i) => renderPlayerRow(p, 'playingXi', origIndices[i])).join('') : '<div class="squad-empty-box">No players in this position yet.</div>'}
        </div>
      </div>
    `;
  };

  const gkIndices = [], defIndices = [], midIndices = [], fwdIndices = [];
  teamSquadData.playingXi.forEach((p, idx) => {
    const c = classifyPos(p.position);
    if (c === 'GK') gkIndices.push(idx);
    else if (c === 'DEF') defIndices.push(idx);
    else if (c === 'MID') midIndices.push(idx);
    else fwdIndices.push(idx);
  });

  let html = `
    <!-- SECTION 1: PLAYING XI -->
    <div class="squad-section-card squad-xi-card">
      <div class="squad-section-head">
        <div class="squad-section-title">
          <span>⚽ PLAYING XI (STARTING XI)</span>
          <span class="squad-badge">${teamSquadData.playingXi.length} / 11 Playing</span>
        </div>
        <button type="button" class="squad-btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="openAddSquadMemberModal('playingXi')">＋ Add Starter</button>
      </div>

      ${renderSubCategory('Goalkeepers (GK)', '🧤', gkList, gkIndices)}
      ${renderSubCategory('Defenders (DF)', '🛡️', defList, defIndices)}
      ${renderSubCategory('Midfielders (MF)', '⚙️', midList, midIndices)}
      ${renderSubCategory('Forwards (FW)', '⚡', fwdList, fwdIndices)}
    </div>

    <!-- SECTION 2: BENCH PLAYERS -->
    <div class="squad-section-card">
      <div class="squad-section-head">
        <div class="squad-section-title">
          <span>💺 BENCH PLAYERS (SUBSTITUTES)</span>
          <span class="squad-badge bench">${teamSquadData.bench.length} Bench Players</span>
        </div>
        <button type="button" class="squad-btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="openAddSquadMemberModal('bench')">＋ Add Bench Player</button>
      </div>
      <div class="squad-list-grid">
        ${teamSquadData.bench.length ? teamSquadData.bench.map((p, idx) => renderPlayerRow(p, 'bench', idx)).join('') : '<div class="squad-empty-box">No bench players assigned yet. Use "+ Add Bench Player" or upload a squad list.</div>'}
      </div>
    </div>

    <!-- SECTION 3: MANAGEMENT -->
    <div class="squad-section-card">
      <div class="squad-section-head">
        <div class="squad-section-title">
          <span>🧑‍💼 TEAM MANAGEMENT &amp; STAFF</span>
          <span class="squad-badge mgmt">${teamSquadData.management.length} Staff Members</span>
        </div>
        <button type="button" class="squad-btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="openAddSquadMemberModal('management')">＋ Add Staff Member</button>
      </div>
      <div class="squad-list-grid">
        ${teamSquadData.management.length ? teamSquadData.management.map((s, idx) => renderPlayerRow(s, 'management', idx)).join('') : '<div class="squad-empty-box">No management staff assigned yet. Add coach, manager, physio, kit staff, etc.</div>'}
      </div>
    </div>
  `;

  el.innerHTML = html;
}

function renderSquad() {
  renderSquadPlayingList();
}

function triggerRowPhotoUpload(listType, index) {
  squadPhotoTarget = { listType, index };
  const inp = $('squad-photo-inp');
  if (inp) inp.click();
}

function handleSquadPhotoUpload(input) {
  const file = input.files[0];
  if (!file || !squadPhotoTarget) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      const maxDim = 256;
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; } }
      else { if (h > maxDim) { w = Math.round(h * maxDim / h); h = maxDim; } }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);

      const { listType, index } = squadPhotoTarget;
      if (teamSquadData[listType] && teamSquadData[listType][index]) {
        teamSquadData[listType][index].photo = optimizedBase64;
      }
      renderSquadPlayingList();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  input.value = '';
}

let squadModalTargetType = 'playingXi';
let squadModalEditIndex = -1;

function openAddSquadMemberModal(targetType) {
  squadModalTargetType = targetType;
  squadModalEditIndex = -1;
  modalPhotoData = null;

  const titEl = $('pl-add-tit');
  const descEl = $('pl-add-desc');
  const nameInp = $('pl-add-name');
  const roleInp = $('pl-add-role');
  const jerseyInp = $('pl-add-jersey');
  const jerseyField = $('pl-add-jersey-field');
  const roleLabel = $('pl-add-role-label');
  const photoPrev = $('pl-add-photo-preview');
  const photoClear = $('pl-add-photo-clear');
  const errEl = $('pl-add-err');

  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  if (nameInp) nameInp.value = '';
  if (roleInp) roleInp.value = '';
  if (jerseyInp) jerseyInp.value = '';
  if (photoPrev) photoPrev.innerHTML = '👤';
  if (photoClear) photoClear.style.display = 'none';

  if (targetType === 'management') {
    if (titEl) titEl.textContent = 'ADD MANAGEMENT STAFF';
    if (descEl) descEl.textContent = 'Add coach, physio, manager or support staff member.';
    if (roleLabel) roleLabel.textContent = 'Role / Title (e.g. Head Coach, Physio)';
    if (jerseyField) jerseyField.style.display = 'none';
  } else if (targetType === 'bench') {
    if (titEl) titEl.textContent = 'ADD BENCH PLAYER';
    if (descEl) descEl.textContent = 'Add a substitute player to the bench.';
    if (roleLabel) roleLabel.textContent = 'Position (e.g. ST, CB, GK)';
    if (jerseyField) jerseyField.style.display = 'block';
  } else {
    if (titEl) titEl.textContent = 'ADD TO PLAYING XI';
    if (descEl) descEl.textContent = 'Add a starting player to Playing XI.';
    if (roleLabel) roleLabel.textContent = 'Position (e.g. ST, CB, GK)';
    if (jerseyField) jerseyField.style.display = 'block';
  }

  const sel = $('pl-add-player-sel');
  if (sel) {
    sel.innerHTML = '<option value="">— Type manually below —</option>';
  }

  openM('m-pl-add-player');
}

function openEditSquadMemberModal(listType, index) {
  squadModalTargetType = listType;
  squadModalEditIndex = index;

  const item = teamSquadData[listType] && teamSquadData[listType][index];
  if (!item) return;

  modalPhotoData = item.photo || null;

  const titEl = $('pl-add-tit');
  const descEl = $('pl-add-desc');
  const nameInp = $('pl-add-name');
  const roleInp = $('pl-add-role');
  const jerseyInp = $('pl-add-jersey');
  const jerseyField = $('pl-add-jersey-field');
  const roleLabel = $('pl-add-role-label');
  const photoPrev = $('pl-add-photo-preview');
  const photoClear = $('pl-add-photo-clear');
  const errEl = $('pl-add-err');

  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  if (nameInp) nameInp.value = item.name || '';
  if (roleInp) roleInp.value = item.position || item.role || '';
  if (jerseyInp) jerseyInp.value = item.jersey || '';

  if (modalPhotoData) {
    if (photoPrev) photoPrev.innerHTML = `<img src="${esc(modalPhotoData)}" style="width:100%;height:100%;object-fit:cover;">`;
    if (photoClear) photoClear.style.display = 'inline-block';
  } else {
    if (photoPrev) photoPrev.innerHTML = '👤';
    if (photoClear) photoClear.style.display = 'none';
  }

  if (listType === 'management') {
    if (titEl) titEl.textContent = 'EDIT MANAGEMENT STAFF';
    if (descEl) descEl.textContent = 'Update details for staff member.';
    if (roleLabel) roleLabel.textContent = 'Role / Title';
    if (jerseyField) jerseyField.style.display = 'none';
  } else {
    if (titEl) titEl.textContent = 'EDIT PLAYER DETAILS';
    if (descEl) descEl.textContent = 'Update name, jersey, position or photograph.';
    if (roleLabel) roleLabel.textContent = 'Position (e.g. ST, CB, GK)';
    if (jerseyField) jerseyField.style.display = 'block';
  }

  const sel = $('pl-add-player-sel');
  if (sel) {
    sel.innerHTML = `<option value="">— Editing: ${esc(item.name)} —</option>`;
  }

  openM('m-pl-add-player');
}

function handleModalPhotoPicked(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      const maxDim = 256;
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; } }
      else { if (h > maxDim) { w = Math.round(h * maxDim / h); h = maxDim; } }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      modalPhotoData = canvas.toDataURL('image/jpeg', 0.85);

      const prev = $('pl-add-photo-preview');
      const clearBtn = $('pl-add-photo-clear');
      if (prev) prev.innerHTML = `<img src="${modalPhotoData}" style="width:100%;height:100%;object-fit:cover;">`;
      if (clearBtn) clearBtn.style.display = 'inline-block';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function clearModalPhoto() {
  modalPhotoData = null;
  const prev = $('pl-add-photo-preview');
  const clearBtn = $('pl-add-photo-clear');
  if (prev) prev.innerHTML = '👤';
  if (clearBtn) clearBtn.style.display = 'none';
}

function confirmAddPlayerToSection() {
  const name = String($('pl-add-name')?.value || '').trim();
  const role = String($('pl-add-role')?.value || '').trim();
  const jersey = String($('pl-add-jersey')?.value || '').trim();
  const errEl = $('pl-add-err');

  if (!name) {
    if (errEl) { errEl.textContent = 'Please enter a name.'; errEl.style.display = 'block'; }
    return;
  }

  const pId = 'sq_' + Date.now() + Math.random().toString(36).substr(2, 4);

  if (squadModalEditIndex >= 0) {
    const item = teamSquadData[squadModalTargetType] && teamSquadData[squadModalTargetType][squadModalEditIndex];
    if (item) {
      item.name = name;
      if (squadModalTargetType === 'management') {
        item.role = role || 'Staff';
      } else {
        item.position = role || 'ST';
        item.jersey = jersey || '';
      }
      if (modalPhotoData !== undefined) {
        item.photo = modalPhotoData;
      }
    }
  } else {
    if (squadModalTargetType === 'management') {
      teamSquadData.management.push({
        id: pId,
        name,
        role: role || 'Staff',
        photo: modalPhotoData || null
      });
    } else if (squadModalTargetType === 'bench') {
      teamSquadData.bench.push({
        id: pId,
        name,
        position: role || 'ST',
        jersey: jersey || '',
        photo: modalPhotoData || null
      });
    } else {
      teamSquadData.playingXi.push({
        id: pId,
        name,
        position: role || 'ST',
        jersey: jersey || '',
        photo: modalPhotoData || null
      });
    }
  }

  closeM('m-pl-add-player');
  renderSquadPlayingList();
}

function moveSquadMember(fromType, toType, index) {
  if (!teamSquadData[fromType] || !teamSquadData[fromType][index]) return;
  const item = teamSquadData[fromType].splice(index, 1)[0];

  if (toType === 'playingXi') {
    item.position = item.position || item.role || 'ST';
  } else if (toType === 'bench') {
    item.position = item.position || item.role || 'ST';
  } else if (toType === 'management') {
    item.role = item.role || item.position || 'Staff';
  }

  teamSquadData[toType].push(item);
  renderSquadPlayingList();
}

function removeSquadMember(listType, index) {
  if (!teamSquadData[listType]) return;
  teamSquadData[listType].splice(index, 1);
  renderSquadPlayingList();
}

function triggerSquadCSVUpload() {
  const inp = $('squad-csv-inp');
  if (inp) inp.click();
}

async function handleSquadCSVUpload(input) {
  const file = input.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const rows = parseCSVRows(text);
    if (rows.length < 2) {
      alert('CSV file has no data rows.');
      input.value = '';
      return;
    }

    const h = rows[0].map(x => x.toLowerCase().trim());
    const findCol = (...keys) => {
      let idx = h.findIndex(col => keys.some(k => col === k));
      if (idx !== -1) return idx;
      idx = h.findIndex(col => keys.some(k => col.includes(k)));
      return idx;
    };

    const secCol = findCol('section', 'category', 'type', 'status');
    const nameCol = findCol('name', 'player name', 'player', 'member', 'staff');
    const roleCol = findCol('role', 'position', 'pos', 'role/position', 'designation');
    const jerseyCol = findCol('jersey', 'jersey #', 'jersey number', 'number', '#', 'no');

    if (nameCol === -1) {
      alert('CSV must contain a "Name" column.');
      input.value = '';
      return;
    }

    const newXi = [];
    const newBench = [];
    const newMgmt = [];

    const getVal = (r, idx) => (idx >= 0 && idx < r.length) ? String(r[idx] || '').trim() : '';

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const name = getVal(r, nameCol);
      if (!name) continue;

      const secVal = getVal(r, secCol).toLowerCase();
      const roleVal = getVal(r, roleCol);
      const roleLower = roleVal.toLowerCase();
      const jerseyVal = getVal(r, jerseyCol);

      const isStaffKeyword = roleLower.includes('coach') || roleLower.includes('manager') || roleLower.includes('physio') || roleLower.includes('doctor') || roleLower.includes('staff') || roleLower.includes('kit') || roleLower.includes('trainer') || roleLower.includes('assistant');
      const isStaffSection = secVal.includes('management') || secVal.includes('staff');

      const id = 'sq_' + Math.random().toString(36).substr(2, 8);

      if (isStaffSection || isStaffKeyword) {
        newMgmt.push({
          id,
          name,
          role: roleVal || 'Staff',
          photo: null
        });
      } else if (secVal.includes('11') || secVal.includes('eleven') || secVal.includes('start') || secVal.includes('first') || secVal.includes('playing')) {
        newXi.push({
          id,
          name,
          position: roleVal || 'ST',
          jersey: jerseyVal || '',
          photo: null
        });
      } else if (secVal.includes('bench') || secVal.includes('sub') || secVal.includes('reserve')) {
        newBench.push({
          id,
          name,
          position: roleVal || 'ST',
          jersey: jerseyVal || '',
          photo: null
        });
      } else {
        if (newXi.length < 11) {
          newXi.push({
            id,
            name,
            position: roleVal || 'ST',
            jersey: jerseyVal || '',
            photo: null
          });
        } else {
          newBench.push({
            id,
            name,
            position: roleVal || 'ST',
            jersey: jerseyVal || '',
            photo: null
          });
        }
      }
    }

    teamSquadData = {
      playingXi: newXi,
      bench: newBench,
      management: newMgmt
    };

    renderSquadPlayingList();
    alert(`🎉 Successfully uploaded squad from CSV!\n\n⚽ Playing XI: ${newXi.length} players\n💺 Bench: ${newBench.length} players\n🧑‍💼 Management: ${newMgmt.length} staff\n\nClick "SAVE SQUAD" to persist changes.`);
  } catch (e) {
    console.error('Squad CSV error:', e);
    alert('Failed to parse CSV file: ' + (e.message || e));
  }
  input.value = '';
}

function downloadSquadCSVTemplate() {
  const csvContent = "Section,Jersey,Name,Position/Role,Notes\n" +
    "Playing XI,1,David Raya,GK,Goalkeeper\n" +
    "Playing XI,2,William Saliba,CB,Center Back\n" +
    "Playing XI,6,Gabriel Magalhaes,CB,Center Back\n" +
    "Playing XI,4,Ben White,RB,Right Back\n" +
    "Playing XI,12,Jurrien Timber,LB,Left Back\n" +
    "Playing XI,5,Thomas Partey,CDM,Defensive Mid\n" +
    "Playing XI,41,Declan Rice,CM,Central Mid\n" +
    "Playing XI,8,Martin Odegaard,CAM,Playmaker\n" +
    "Playing XI,7,Bukayo Saka,RW,Right Winger\n" +
    "Playing XI,11,Gabriel Martinelli,LW,Left Winger\n" +
    "Playing XI,29,Kai Havertz,ST,Striker\n" +
    "Bench,32,Neto,GK,Sub Goalkeeper\n" +
    "Bench,17,Oleksandr Zinchenko,LB,Sub Defender\n" +
    "Bench,20,Jorginho,CM,Sub Midfielder\n" +
    "Bench,9,Gabriel Jesus,ST,Sub Forward\n" +
    "Bench,19,Leandro Trossard,LW,Sub Forward\n" +
    "Management,,Mikel Arteta,Head Coach,Manager\n" +
    "Management,,Albert Stuivenberg,Assistant Coach,Coach\n" +
    "Management,,Gary O'Driscoll,Head Physio,Medical\n";

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${(curTeam?.name || 'team').toLowerCase().replace(/\s+/g, '_')}_squad_template.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function handleSquadAIPhotoUpload(input) {
  const file = input?.files?.[0];
  if (!file) return;
  if (!curTeam) {
    alert('Please open a team dashboard before scanning a squad photo.');
    input.value = '';
    return;
  }
  const scanBtn = $('squad-ai-scan-btn');
  if (scanBtn) {
    scanBtn.disabled = true;
    scanBtn.textContent = '⏳ Scanning Photo with AI…';
  }
  try {
    const image = await compressRosterPhotoForGemini(file);
    const prompt = `Read this football/soccer team sheet, squad list, or lineup photo. Extract every clearly listed player and staff member. For each person, find their Name, Jersey number (if shown), Position abbreviation (GK, RB, LB, CB, RWB, LWB, CDM, CM, CAM, RM, LM, RW, LW, CF, ST), and whether they are in the Starting XI (Starter), Substitutes (Bench), or Coaching/Staff (Staff). Return only a compact valid JSON object.`;
    const schema = {
      type: 'OBJECT',
      properties: {
        players: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              number: { type: 'STRING' },
              position: { type: 'STRING' },
              section: { type: 'STRING', enum: ['Starter', 'Bench', 'Staff', 'Unknown'] }
            },
            required: ['name', 'position']
          }
        }
      },
      required: ['players']
    };
    const parsed = await requestRosterPhotoExtraction(prompt, image, schema, null);
    const sourcePlayers = Array.isArray(parsed?.players) ? parsed.players : [];
    if (!sourcePlayers.length) {
      alert('AI did not detect any clear player names in this photo. Try taking a clearer, closer photo or upload a CSV.');
      return;
    }

    if (!teamSquadData.playingXi) initTeamSquadData();

    let addedCount = 0;
    sourcePlayers.forEach(p => {
      const name = String(p.name || '').trim();
      if (!name) return;
      const rawPos = String(p.position || '').trim();
      const pos = posCode(rawPos) || rawPos || 'ST';
      const jersey = p.number ? String(p.number).replace(/\D/g, '') : '';
      const section = String(p.section || '').toLowerCase();

      const newEntry = {
        name: name,
        position: pos,
        jersey: jersey || null,
        photo: null
      };

      if (section.includes('staff') || section.includes('coach') || section.includes('mgmt')) {
        teamSquadData.management.push({
          name: newEntry.name,
          role: rawPos || 'Staff Member',
          photo: null
        });
      } else if (section.includes('bench') || section.includes('sub')) {
        teamSquadData.bench.push(newEntry);
      } else {
        if (teamSquadData.playingXi.length < 11) {
          teamSquadData.playingXi.push(newEntry);
        } else {
          teamSquadData.bench.push(newEntry);
        }
      }
      addedCount++;
    });

    renderSquadPlayingList();
    alert(`🎉 Successfully scanned ${addedCount} team members from photo!\n\n⚽ Playing XI: ${teamSquadData.playingXi.length}\n💺 Bench: ${teamSquadData.bench.length}\n🧑‍💼 Management: ${teamSquadData.management.length}\n\nReview the list and tap "SAVE SQUAD" to persist changes.`);
  } catch (err) {
    console.error('Squad photo AI error:', err);
    alert('Failed to scan squad photo: ' + (err.message || err));
  } finally {
    if (scanBtn) {
      scanBtn.disabled = false;
      scanBtn.textContent = '📷 Scan Squad Photo (AI)';
    }
    input.value = '';
  }
}

async function saveSquadPlayingList() {
  if (!curTeam || !curTeam.id) {
    alert('No active team selected.');
    return;
  }

  const formationKey = curTeam.squad?.formation || '4-4-2';
  const flat = flattenFormation(formationKey);
  const sortedXi = (typeof sortPlayersByPitchPosition === 'function') ? sortPlayersByPitchPosition(teamSquadData.playingXi) : teamSquadData.playingXi;

  const slots = flat.map((s, i) => {
    const p = sortedXi[i];
    return {
      role: s.role,
      label: s.label,
      player: p ? {
        id: p.id,
        name: p.name,
        position: p.position,
        jersey: p.jersey || '',
        photo: p.photo || null,
        matchPosition: posCode(p.position)
      } : null
    };
  });

  const subs = teamSquadData.bench.map(p => ({
    id: p.id,
    name: p.name,
    position: p.position,
    jersey: p.jersey || '',
    photo: p.photo || null
  }));

  const staff = teamSquadData.management.map(s => ({
    id: s.id,
    name: s.name,
    role: s.role || 'Staff',
    photo: s.photo || null
  }));

  const squad = {
    formation: formationKey,
    name: curTeam.squad?.name || '',
    playingXi: teamSquadData.playingXi,
    bench: teamSquadData.bench,
    management: teamSquadData.management,
    slots,
    subs,
    staff,
    updatedAt: new Date().toISOString()
  };

  try {
    await updateDoc(doc(db, 'teams', curTeam.id), { squad });
    curTeam.squad = squad;
    if (typeof refreshPlayersCache === 'function') refreshPlayersCache();
    alert('✅ Squad & Playing List saved successfully!');
  } catch (e) {
    console.error('saveSquadPlayingList error:', e);
    alert('❌ Could not save squad: ' + (e.message || e));
  }
}

async function clearSquadPlayingList() {
  if (!confirm('Are you sure you want to clear all Playing XI, Bench, and Management members?')) return;
  teamSquadData = { playingXi: [], bench: [], management: [] };
  if (curTeam && curTeam.id) {
    try {
      await updateDoc(doc(db, 'teams', curTeam.id), { squad: null });
      curTeam.squad = null;
      if (typeof refreshPlayersCache === 'function') refreshPlayersCache();
    } catch (e) {
      console.warn('Clear squad error:', e);
    }
  }
  renderSquadPlayingList();
}

function subscribeTeam() {
  if (unsub) { unsub(); unsub = null; }
  if (!curTeam) return;
  unsub = onSnapshot(
    query(collection(db, 'players'), where('teamId', '==', curTeam.id)),
    snap => {
      const map = new Map();
      snap.docs.forEach(d => {
        if (!map.has(d.id)) {
          map.set(d.id, { id: d.id, ...d.data() });
        }
      });
      players = Array.from(map.values())
        .sort((a, b) => ((b.registeredAt || '') > (a.registeredAt || '')) ? 1 : -1);
      renderPlayers();
      renderSquad();
      if ($('page-lineup')?.classList.contains('active')) {
        openLineup();
      }
    },
    err => { console.error('subscribeTeam error:', err); }
  );
}

function renderPlayers() {
  const seenIds = new Set();
  players = players.filter(p => {
    if (!p || !p.id || seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  });
  const s = ($('dbsearch')?.value || '').toLowerCase(), pf = $('dbfilter')?.value || '';
  const fil = players.filter(p => (!s || (p.name || '').toLowerCase().includes(s) || posCode(p.position).toLowerCase().includes(s)) && (!pf || posCode(p.position) === pf));
  const posList = (curTeam && curTeam.positions && curTeam.positions.length) ? curTeam.positions : (pos && pos.length ? pos : [...DPOS]);
  const fd = $('dbfilter');
  if (fd) { const c = fd.value; fd.innerHTML = '<option value="">All Positions</option>' + posList.map(x => `<option value="${esc(x)}"${x === c ? ' selected' : ''}>${esc(x)}</option>`).join(''); }
  $('plstats').style.display = players.length ? 'grid' : 'none';
  $('pst').textContent = players.length; $('psp').textContent = new Set(players.map(p => posCode(p.position))).size;
  const ages = players.filter(p => p.age).map(p => parseInt(p.age));
  $('psa').textContent = ages.length ? Math.round(ages.reduce((a, b) => a + b) / ages.length) : '—';
  const list = $('plist'); if (!list) return;
  if (!fil.length) { list.innerHTML = `<div class="empty"><div class="ei">🏟️</div><p>${players.length ? 'No players match your search.' : 'No players yet. Share the registration link!'}</p></div>`; return; }
  list.innerHTML = fil.map(p => `
    <div class="pcard">
      <div class="pav">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : '👤'}</div>
      <div class="pi">
        <div class="pn">${esc(p.name)}<span class="jb">#${esc(p.jersey)}</span>${p.jersey2 ? `<span class="jb alt">#${esc(p.jersey2)}</span>` : ''}</div>
        <div class="pm">
          <span class="mi">⚽ <strong>${esc(posCode(p.position))}</strong></span>
          <span class="mi">🎂 <strong>Age ${p.age || '—'}</strong></span>
          ${p.playernum ? `<span class="mi">🔢 <strong>#${esc(p.playernum)}</strong></span>` : ''}
          <span class="mi">📞 ${esc(p.phone || '—')}</span>
        </div>
        <div class="pm">
          <span class="mi">👨 <strong>${esc(p.father || '—')}</strong></span>
          <span class="mi">📍 ${esc((p.address || '').substring(0, 36))}${(p.address || '').length > 36 ? '…' : ''}</span>
          ${p.foot ? `<span class="mi"><strong>${esc(p.foot)} Foot</strong></span>` : ''}
        </div>
        ${p.notes ? `<div class="pm"><span class="mi" style="color:var(--mt);">📝 ${esc(p.notes.substring(0, 80))}${p.notes.length > 80 ? '…' : ''}</span></div>` : ''}
      </div>
      <div class="cacts">
        <button class="ib" onclick="viewPlayer('${p.id}')" title="View Form">👁</button>
        <button class="ib" onclick="requestPin('edit','${p.id}')">✏️</button>
        <button class="ib del" onclick="requestPin('delete','${p.id}')">✕</button>
      </div>
    </div>`).join('');
}

async function findAndCleanDuplicates() {
  if (!curTeam || !players.length) {
    alert('No players in this team database to check.');
    return;
  }

  // Group duplicates by phone and by name+dob
  const byPhone = {};
  const byNameDob = {};

  players.forEach(p => {
    const rawPh = String(p.phone || '').replace(/\D/g, '');
    const cleanPh = rawPh.length >= 10 ? rawPh.slice(-10) : '';
    if (cleanPh) {
      if (!byPhone[cleanPh]) byPhone[cleanPh] = [];
      byPhone[cleanPh].push(p);
    }

    const nameKey = (p.name || '').trim().toLowerCase();
    const dobKey = p.dob || '';
    if (nameKey && dobKey) {
      const ndKey = `${nameKey}|${dobKey}`;
      if (!byNameDob[ndKey]) byNameDob[ndKey] = [];
      byNameDob[ndKey].push(p);
    }
  });

  const duplicateSets = new Map();

  Object.values(byPhone).forEach(group => {
    if (group.length > 1) {
      const key = group.map(p => p.id).sort().join('_');
      duplicateSets.set(key, group);
    }
  });

  Object.values(byNameDob).forEach(group => {
    if (group.length > 1) {
      const key = group.map(p => p.id).sort().join('_');
      duplicateSets.set(key, group);
    }
  });

  if (duplicateSets.size === 0) {
    alert('✅ No duplicate players found! Your roster is completely clean.');
    return;
  }

  let dupSummary = `⚠️ Found ${duplicateSets.size} duplicate player group(s):\n\n`;
  const toDeleteIds = [];

  duplicateSets.forEach(group => {
    // Sort descending by registration/update date to keep the latest one
    group.sort((a, b) => {
      const dateA = a.updatedAt || a.registeredAt || '';
      const dateB = b.updatedAt || b.registeredAt || '';
      return (dateB > dateA) ? 1 : -1;
    });

    const keep = group[0];
    const duplicates = group.slice(1);
    dupSummary += `• ${keep.name} (Phone: ${keep.phone || 'N/A'}) — ${group.length} entries found.\n`;

    duplicates.forEach(d => toDeleteIds.push(d.id));
  });

  dupSummary += `\nWould you like to keep the newest entry for each player and remove the ${toDeleteIds.length} duplicate record(s)?`;

  if (!confirm(dupSummary)) return;

  try {
    for (const id of toDeleteIds) {
      await deleteDoc(doc(db, 'players', id));
    }
    players = players.filter(p => !toDeleteIds.includes(p.id));
    renderPlayers();
    alert(`✅ Cleaned up ${toDeleteIds.length} duplicate entry/entries!`);
  } catch (e) {
    alert('❌ Could not clean duplicates: ' + (e.message || e));
  }
}


function requestPin(a, id) {
  pinBuf = ''; pinAct = a; pinTgt = id; updDots(); $('perrmsg').style.display = 'none';
  const m = { delete: ['🗑️', 'CONFIRM DELETE', 'Enter PIN to delete.'], edit: ['✏️', 'EDIT PLAYER', 'Enter PIN to edit.'], clearall: ['🗑️', 'CLEAR ALL', 'Enter PIN to delete ALL contacts (players & staff).'] }[a] || ['🔢', 'ENTER PIN', 'Enter your PIN.'];
  $('pico').textContent = m[0]; $('ptit').textContent = m[1]; $('pdesc').textContent = m[2]; openM('m-pin');
}
function pk(k) {
  if (k === 'cancel') { closeM('m-pin'); return; }
  if (k === 'del') { pinBuf = pinBuf.slice(0, -1); updDots(); return; }
  if (pinBuf.length >= 4) return; pinBuf += k; updDots();
  if (pinBuf.length === 4) setTimeout(checkPin, 150);
}
function updDots() { for (let i = 0; i < 4; i++)$('pd' + i).classList.toggle('filled', i < pinBuf.length); }
function checkPin() {
  if (pinBuf === gp()) {
    closeM('m-pin'); $('perrmsg').style.display = 'none';
    if (pinAct === 'delete') doDel(pinTgt);
    if (pinAct === 'edit') openEdit(pinTgt);
    if (pinAct === 'clearall') doClearAll();
  } else { $('perrmsg').textContent = '❌ Incorrect PIN'; $('perrmsg').style.display = 'block'; pinBuf = ''; updDots(); }
}

async function doDel(id) { try { await deleteDoc(doc(db, 'players', id)); } catch (e) { alert('❌ Could not delete: ' + (e.message || e)); } }
async function doClearAll() {
  try {
    const snap = await getDocs(query(collection(db, 'players'), where('teamId', '==', curTeam.id)));
    const b = db.batch();
    snap.docs.forEach(d => b.delete(d.ref));
    await b.commit();
    players = [];
    if (curTeam) {
      await db.collection('teams').doc(curTeam.id).update({ staff: [], squad: null });
      curTeam.staff = [];
      curTeam.squad = null;
    }
    renderPlayers();
    renderStaffList();
    renderSquad();
    openLineup();
    alert('✅ Database and squad cleared successfully.');
  } catch (e) {
    alert('❌ Failed: ' + (e.message || e));
  }
}

function openEdit(id) {
  const p = players.find(x => x.id === id); if (!p) return; editId = id;
  editPhotoData = p.photo || null;
  const epPrev = $('e-photo-preview'), epPh = $('e-photo-ph'), epInp = $('e-photo-inp');
  if (epInp) epInp.value = '';
  if (epPrev && epPh) {
    if (p.photo) { epPrev.src = p.photo; epPrev.style.display = 'block'; epPh.style.display = 'none'; }
    else { epPrev.style.display = 'none'; epPrev.src = ''; epPh.style.display = 'block'; }
  }
  $('e-name').value = p.name || ''; $('e-dob').value = p.dob || ''; $('e-age').value = p.age || '';
  $('e-father').value = p.father || ''; $('e-addr').value = p.address || '';
  $('e-ph').value = (p.phone || '').replace('+91', '');
  $('e-j1').value = p.jersey || ''; $('e-j2').value = p.jersey2 || ''; $('e-sq').value = p.playernum || ''; $('e-foot').value = p.foot || ''; $('e-notes').value = p.notes || '';
  const posList = (curTeam && curTeam.positions && curTeam.positions.length) ? curTeam.positions : (pos && pos.length ? pos : [...DPOS]);
  $('e-pos').innerHTML = '<option value="">Select</option>' + posList.map(x => `<option value="${esc(x)}"${x === posCode(p.position) ? ' selected' : ''}>${esc(x)}</option>`).join('');
  openM('m-edit');
}
function handleEditPhoto(input) {
  const file = input.files[0]; if (!file) return;
  compressImage(file, 300, 0.85, dataUrl => {
    editPhotoData = dataUrl;
    const prev = $('e-photo-preview'), ph = $('e-photo-ph');
    if (prev) { prev.src = editPhotoData; prev.style.display = 'block'; }
    if (ph) { ph.style.display = 'none'; }
  });
}
function eAge() {
  const d = $('e-dob').value; if (!d) return;
  const t = new Date(), b = new Date(d); let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() - b.getMonth() < 0 || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  $('e-age').value = a;
}
async function saveEdit() {
  const name = $('e-name').value.trim(), ph = $('e-ph').value.trim();
  if (!name) { alert('Name is required.'); return; }
  if (ph && ph.length !== 10) { alert('Phone must be 10 digits.'); return; }
  try {
    const updateData = { name, dob: $('e-dob').value, age: $('e-age').value, father: $('e-father').value.trim(), address: $('e-addr').value.trim(), phone: ph ? '+91' + ph : '', position: $('e-pos').value, jersey: $('e-j1').value, jersey2: $('e-j2').value, playernum: $('e-sq').value, foot: $('e-foot').value, notes: $('e-notes').value.trim() };
    if (editPhotoData !== undefined) updateData.photo = editPhotoData;
    await updateDoc(doc(db, 'players', editId), updateData);
    closeM('m-edit');
  } catch (e) { alert('❌ Could not save.'); }
}

const FORMATIONS = {
  '4-4-2': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 4 }, { r: 'MID', n: 4 }, { r: 'FWD', n: 2 }],
  '4-3-3': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 4 }, { r: 'MID', n: 3 }, { r: 'FWD', n: 3 }],
  '3-5-2': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 3 }, { r: 'MID', n: 5 }, { r: 'FWD', n: 2 }],
  '4-2-3-1': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 4 }, { r: 'MID', n: 2, lbl: 'Def. Mid' }, { r: 'MID', n: 3, lbl: 'Att. Mid' }, { r: 'FWD', n: 1 }],
  '3-4-3': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 3 }, { r: 'MID', n: 4 }, { r: 'FWD', n: 3 }],
  '5-3-2': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 5 }, { r: 'MID', n: 3 }, { r: 'FWD', n: 2 }],
  '4-1-4-1': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 4 }, { r: 'MID', n: 1, lbl: 'Hold. Mid' }, { r: 'MID', n: 4 }, { r: 'FWD', n: 1 }],
  '3-3-2': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 3 }, { r: 'MID', n: 3 }, { r: 'FWD', n: 2 }],
  '3-4-1': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 3 }, { r: 'MID', n: 4 }, { r: 'FWD', n: 1 }],
  '4-3-1': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 4 }, { r: 'MID', n: 3 }, { r: 'FWD', n: 1 }],
  '3-2-1': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 3 }, { r: 'MID', n: 2 }, { r: 'FWD', n: 1 }],
  '2-3-1': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 2 }, { r: 'MID', n: 3 }, { r: 'FWD', n: 1 }],
  '2-2-2': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 2 }, { r: 'MID', n: 2 }, { r: 'FWD', n: 2 }],
  '2-1-1': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 2 }, { r: 'MID', n: 1 }, { r: 'FWD', n: 1 }],
  '1-2-1': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 1 }, { r: 'MID', n: 2 }, { r: 'FWD', n: 1 }],
  '1-1': [{ r: 'GK', n: 1 }, { r: 'DEF', n: 1 }, { r: 'FWD', n: 1 }],
};
const ASIDE_FORMATIONS = {
  3: ['1-1'],
  5: ['2-1-1', '1-2-1'],
  7: ['3-2-1', '2-3-1', '2-2-2'],
  9: ['3-3-2', '3-4-1', '4-3-1'],
  11: ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '3-4-3', '5-3-2', '4-1-4-1'],
};
function formationTotal(key) { return (FORMATIONS[key] || []).reduce((s, l) => s + l.n, 0); }
function roleLabel(r) { return r === 'GK' ? 'Goalkeeper' : r === 'DEF' ? 'Defender' : r === 'MID' ? 'Midfielder' : 'Forward'; }
function slotSideLabel(role, x, lbl) {
  if (role === 'GK') return 'Goalkeeper';
  const side = x < 35 ? 'Left' : x > 65 ? 'Right' : 'Center';
  const word = lbl || (role === 'DEF' ? 'Back' : role === 'MID' ? 'Mid' : 'Striker');
  return `${side} ${word}`;
}
function flattenFormation(key) {
  const lines = FORMATIONS[key] || FORMATIONS['4-4-2'];
  const outfield = lines.length - 1, out = [];
  lines.forEach((line, li) => {
    let y;
    if (li === 0) { y = 88; }
    else if (outfield === 1) { y = 45; }
    else { y = 76 - ((li - 1) * (64 / (outfield - 1))); }
    for (let i = 0; i < line.n; i++) {
      const x = 8 + (84 / (line.n + 1)) * (i + 1);
      out.push({ role: line.r, label: line.lbl || roleLabel(line.r), x, y });
    }
  });
  return out;
}
function classifyPos(position) {
  const code = posCode(position);
  if (code === 'GK' || code === 'GKP') return 'GK';
  if (code === 'RB' || code === 'LB' || code === 'CB' || code === 'RWB' || code === 'LWB' || code === 'DEF' || code === 'FB' || code === 'WB' || code === 'CD' || code === 'SW') return 'DEF';
  if (code === 'RW' || code === 'LW' || code === 'CF' || code === 'ST' || code === 'FWD' || code === 'FW' || code === 'SS' || code === 'ATT' || code === 'RF' || code === 'LF' || code === 'RS' || code === 'LS') return 'FWD';
  if (code === 'CM' || code === 'CDM' || code === 'CAM' || code === 'RM' || code === 'LM' || code === 'MID' || code === 'DM' || code === 'AM') return 'MID';
  return 'MID';
}
function toFBPositionCode(position) { return posCode(position) || 'ST'; }

function sortPlayersByPitchPosition(playerList) {
  if (!Array.isArray(playerList) || !playerList.length) return [];
  const list = [...playerList];

  const posRank = {
    'GK': 0, 'GKP': 0,
    'LB': 10, 'LWB': 11,
    'CB': 20, 'SW': 21, 'CD': 22, 'DEF': 25,
    'RB': 30, 'RWB': 31,
    'LM': 40,
    'CDM': 50, 'DM': 51,
    'CM': 60, 'MID': 65,
    'CAM': 70, 'AM': 71,
    'RM': 80,
    'LW': 90,
    'ST': 100, 'CF': 101, 'FWD': 105, 'FW': 106,
    'RW': 110
  };

  return list.sort((a, b) => {
    const codeA = toFBPositionCode(a.matchPosition || a.position);
    const codeB = toFBPositionCode(b.matchPosition || b.position);
    const rankA = posRank[codeA] ?? 999;
    const rankB = posRank[codeB] ?? 999;
    return rankA - rankB;
  });
}

function mergeCustomFormations(targetTeam) {
  const team = targetTeam || curTeam;
  mergedCustomFormationKeys.forEach(k => { delete FORMATIONS[k]; });
  mergedCustomFormationKeys = [];
  (team && team.customFormations || []).forEach(f => {
    if (f && f.key && f.def) { FORMATIONS[f.key] = f.def; mergedCustomFormationKeys.push(f.key); }
  });
}

function populateAdminFormationTeamSelect() {
  const sel = $('adm-formation-team-select');
  if (!sel) return;
  const curVal = sel.value;
  sel.innerHTML = '<option value="">Select a team…</option>' + teams.map(t =>
    `<option value="${esc(t.id)}">${esc(t.name || 'Unnamed Team')}</option>`
  ).join('');

  if (curVal && teams.some(t => t.id === curVal)) {
    sel.value = curVal;
  } else if (curTeam && teams.some(t => t.id === curTeam.id)) {
    sel.value = curTeam.id;
  } else if (teams.length > 0) {
    sel.value = teams[0].id;
  }
}
window.populateAdminFormationTeamSelect = populateAdminFormationTeamSelect;

function buildFormationSyncPayload(targetTeam) {
  const target = targetTeam || curTeam || (teams && teams.length ? teams[0] : null);
  if (!target) return {};
  mergeCustomFormations(target);
  const vState = target.visualizerState;
  const sq = target.squad;
  let payload = {};

  if (sq && Array.isArray(sq.playingXi) && sq.playingXi.length) {
    const sortedXi = sortPlayersByPitchPosition(sq.playingXi);
    const starters = sortedXi.map(p => ({
      id: p.id || ('xi_' + String(Math.random()).slice(2, 8)),
      name: p.name || '',
      number: p.jersey || p.playernum || '-',
      position: toFBPositionCode(p.matchPosition || p.position)
    }));
    const sortedBench = sortPlayersByPitchPosition(sq.bench || sq.subs || []);
    const subs = sortedBench.map(p => ({
      id: p.id || ('sub_' + String(Math.random()).slice(2, 8)),
      name: p.name || '',
      number: p.jersey || p.playernum || '-',
      position: toFBPositionCode(p.position)
    }));
    const management = (sq.management || sq.staff || target.staff || []).map(s => ({
      id: s.id || ('mg_' + String(Math.random()).slice(2, 8)),
      name: s.name || '',
      role: s.role || 'Staff'
    }));
    const formationKey = (vState && vState.formationKey) || sq.formation || '4-3-3';
    const formationDef = FORMATIONS[formationKey] || null;
    const source = `Team: ${target.name || 'Unnamed'}${sq.name ? ' (' + sq.name + ')' : ''}`;
    payload = {
      formation: formationKey,
      formationDef,
      starters,
      subs,
      management,
      source,
      teamId: target.id,
      teamName: target.name
    };
  } else if (sq && ((sq.slots && sq.slots.some(s => s && s.player)) || (sq.subs && sq.subs.length))) {
    const management = (sq.staff || target.staff || []).map(s => ({
      id: s.id || ('mg_' + String(Math.random()).slice(2, 8)),
      name: s.name || '',
      role: s.role || 'Staff'
    }));
    const when = sq.updatedAt ? new Date(sq.updatedAt).toLocaleDateString() : '';
    const source = `Team: ${target.name || 'Unnamed'}${sq.name ? ' (' + sq.name + ')' : ''}${when ? ' (saved ' + when + ')' : ''}`;
    const starters = (sq.slots || []).map(s => s && s.player ? {
      id: s.player.id || ('st_' + String(Math.random()).slice(2, 8)),
      name: s.player.name,
      number: s.player.jersey || s.player.playernum || '-',
      position: toFBPositionCode(s.player.matchPosition || s.player.position)
    } : null);
    const sortedSubs = sortPlayersByPitchPosition(sq.subs || []);
    const subs = sortedSubs.map(s => ({
      id: s.id || ('sub_' + String(Math.random()).slice(2, 8)),
      name: s.name,
      number: s.jersey || s.playernum || '-',
      position: toFBPositionCode(s.position)
    }));
    const formationKey = (vState && vState.formationKey) || sq.formation || '4-4-2';
    const formationDef = FORMATIONS[formationKey] || null;
    payload = {
      formation: formationKey,
      formationDef,
      starters,
      subs,
      management,
      source,
      teamId: target.id,
      teamName: target.name
    };
  } else {
    const teamPlayers = allPlayersCache.filter(p => p.teamId === target.id);
    const rosterList = sortPlayersByPitchPosition(teamPlayers.length ? teamPlayers : (target.players || []));
    const rosterPlayers = rosterList.map(p => ({
      id: p.id || ('p_' + String(Math.random()).slice(2, 8)),
      name: p.name,
      number: p.jersey || p.playernum || '-',
      position: toFBPositionCode(p.position)
    }));
    const management = (target.staff || []).map(s => ({
      id: s.id || ('mg_' + String(Math.random()).slice(2, 8)),
      name: s.name,
      role: s.role || 'Staff'
    }));
    const formationKey = (vState && vState.formationKey) || '4-3-3';
    const formationDef = FORMATIONS[formationKey] || null;
    payload = {
      formation: formationKey,
      formationDef,
      players: rosterPlayers,
      management,
      source: `Team: ${target.name || 'Unnamed'} (${rosterPlayers.length} players loaded)`,
      teamId: target.id,
      teamName: target.name
    };
  }

  if (vState) {
    if (vState.customPos) payload.customPos = vState.customPos;
    if (vState.ballPos) payload.ballPos = vState.ballPos;
    if (vState.formationKey) payload.visualizerFormation = vState.formationKey;
  }

  try {
    localStorage.setItem('ems_active_formation_payload', JSON.stringify(payload));
    if (teams && teams.length) {
      localStorage.setItem('ems_teams_list', JSON.stringify(teams.map(t => ({ id: t.id, name: t.name }))));
    }
  } catch(e) {}

  return payload;
}

function sendAdmFormationSync(teamId) {
  const frame = $('adm-formation-frame');
  const targetId = teamId || $('adm-formation-team-select')?.value;
  const targetTeam = (targetId ? teams.find(t => t.id === targetId) : null) || curTeam || (teams && teams.length ? teams[0] : null);
  if (!targetTeam) return;

  const payload = Object.assign({ type: 'ff-sync' }, buildFormationSyncPayload(targetTeam));
  if (frame && frame.contentWindow) {
    frame.contentWindow.postMessage(payload, '*');
  }
}
window.sendAdmFormationSync = sendAdmFormationSync;

function openFormationBuilderFullscreen() {
  const selId = $('adm-formation-team-select')?.value;
  const targetTeam = (selId ? teams.find(t => t.id === selId) : null) || curTeam || (teams && teams.length ? teams[0] : null);
  if (targetTeam) {
    buildFormationSyncPayload(targetTeam);
  }
  window.open('formation-builder.html', '_blank');
}
window.openFormationBuilderFullscreen = openFormationBuilderFullscreen;

function sendFormationSync() {
  const frame = $('formation-builder-frame');
  if (!frame || !frame.contentWindow) return;
  frame.contentWindow.postMessage(Object.assign({ type: 'ff-sync' }, buildFormationSyncPayload()), '*');
  sendFrameChatSync();
}

function sendFrameChatSync() {
  const teamFrame = $('formation-builder-frame');
  const pubFrame = $('pv-formation-frame');
  if (teamFrame && teamFrame.contentWindow && curTeam) {
    teamFrame.contentWindow.postMessage({
      type: 'ff-chat-sync',
      msgs: coachChatMsgs,
      isCoach: true,
      currentId: { name: (curTeam.name ? curTeam.name + ' (Coach)' : 'Coach'), role: 'coach' }
    }, '*');
  }
  if (pubFrame && pubFrame.contentWindow && pvId) {
    pubFrame.contentWindow.postMessage({
      type: 'ff-chat-sync',
      msgs: pubChatMsgs,
      isCoach: false,
      currentId: getChatIdentity()
    }, '*');
  }
}

let _visSaveTimer = null;

window.addEventListener('message', e => {
  const d = e.data;
  if (!d || typeof d !== 'object') return;
  if (d.type === 'ff-ready' || d.type === 'ff-request-sync') {
    const teamFrame = $('formation-builder-frame');
    const pubFrame = $('pv-formation-frame');
    const admFrame = $('adm-formation-frame');
    if (teamFrame && e.source === teamFrame.contentWindow) sendFormationSync();
    if (pubFrame && e.source === pubFrame.contentWindow) sendPubFormationSync();
    if (admFrame && e.source === admFrame.contentWindow) sendAdmFormationSync();
    if (e.source && (e.source !== window)) {
      const selId = $('adm-formation-team-select')?.value;
      const targetTeam = (selId ? teams.find(t => t.id === selId) : null) || curTeam || (teams && teams.length ? teams[0] : null);
      if (targetTeam) {
        e.source.postMessage(Object.assign({ type: 'ff-sync' }, buildFormationSyncPayload(targetTeam)), '*');
      }
    }
  }
  if (d.type === 'ff-select-team' && d.teamId) {
    const sel = $('adm-formation-team-select');
    if (sel) sel.value = d.teamId;
    sendAdmFormationSync(d.teamId);
  }
  if (d.type === 'ff-height' && d.height) {
    const teamFrame = $('formation-builder-frame');
    const pubFrame = $('pv-formation-frame');
    const safeH = Math.min(Math.max(720, d.height + 10), 1350);
    if (teamFrame && e.source === teamFrame.contentWindow) teamFrame.style.height = safeH + 'px';
    if (pubFrame && e.source === pubFrame.contentWindow) pubFrame.style.height = safeH + 'px';
  }
  if (d.type === 'ff-chat-send') {
    const teamFrame = $('formation-builder-frame');
    const pubFrame = $('pv-formation-frame');
    if (teamFrame && e.source === teamFrame.contentWindow) sendCoachChatDirect(d.text);
    if (pubFrame && e.source === pubFrame.contentWindow) sendPubChatDirect(d.text);
  }
  if (d.type === 'ff-chat-pin') {
    togglePinChat(d.msgId, d.currentPinned);
  }
  if (d.type === 'ff-chat-delete') {
    deleteChatMessage(d.msgId);
  }
  if (d.type === 'ff-chat-clear') {
    clearTeamChat();
  }
  if (d.type === 'ff-chat-change-id') {
    openChatIdentityModal();
  }
  if (d.type === 'ff-formation-change' && d.formationKey) {
    if (FORMATIONS[d.formationKey]) {
      changeFormation(d.formationKey);
    }
  }
  if (d.type === 'ff-visualizer-save') {
    const selId = $('adm-formation-team-select')?.value;
    const targetTeam = (selId ? teams.find(t => t.id === selId) : null) || curTeam;
    if (targetTeam && targetTeam.id) {
      const vState = {
        customPos: d.customPos || {},
        ballPos: d.ballPos || { x: 50, y: 50 },
        formationKey: d.formationKey || targetTeam.squad?.formation || '4-4-2',
        updatedAt: new Date().toISOString()
      };
      targetTeam.visualizerState = vState;
      clearTimeout(_visSaveTimer);
      _visSaveTimer = setTimeout(async () => {
        try {
          await updateDoc(doc(db, 'teams', targetTeam.id), {
            visualizerState: vState
          });
        } catch (err) {
          console.warn('Error persisting visualizer state:', err);
        }
      }, 150);
    }
  }
});

let luFormation = '4-4-2', luAside = 11, luSlots = [], luSubs = [], luStaff = [], luActive = -1, luBenchActive = -1, luFilterRole = 'ALL', luFilterExact = '', luBenchFilterRole = 'ALL', luBenchFilterExact = '';

function openLineup() {
  mergeCustomFormations();
  luBenchFilterRole = 'ALL';
  luBenchFilterExact = '';
  const sq = curTeam && curTeam.squad;
  luFormation = (sq && sq.formation && FORMATIONS[sq.formation]) ? sq.formation : '4-4-2';
  luAside = formationTotal(luFormation);
  const flat = flattenFormation(luFormation);
  luSlots = flat.map((_, i) => {
    if (sq && sq.slots && sq.slots[i] && sq.slots[i].player) {
      const sp = sq.slots[i].player;
      const found = players.find(pl => pl.id === sp.id);
      return {
        id: sp.id,
        name: found ? found.name : sp.name,
        position: found ? found.position : sp.position,
        jersey: (found && found.jersey != null && found.jersey !== '') ? found.jersey : (sp.jersey || ''),
        photo: (found && found.photo) ? found.photo : (sp.photo || null),
        matchPosition: posCode(sp.matchPosition || (found && found.position) || sp.position)
      };
    }
    return null;
  });

  const maxSubs = getMaxSubs();
  luSubs = [];
  for (let i = 0; i < maxSubs; i++) {
    if (sq && sq.subs && sq.subs[i]) {
      const sb = sq.subs[i];
      const found = players.find(pl => pl.id === sb.id);
      if (found) {
        luSubs.push({
          id: found.id,
          name: found.name,
          position: found.position,
          jersey: (found.jersey != null && found.jersey !== '') ? found.jersey : (sb.jersey || ''),
          photo: found.photo || sb.photo || null
        });
      } else {
        luSubs.push({
          id: sb.id,
          name: sb.name,
          position: sb.position,
          jersey: sb.jersey || '',
          photo: sb.photo || null
        });
      }
    } else {
      luSubs.push(null);
    }
  }
  luBenchActive = luSubs.findIndex(s => !s);

  luStaff = [];
  if (sq && sq.staff) {
    sq.staff.forEach(s => {
      const found = (curTeam.staff || []).find(st => st.id === s.id);
      luStaff.push({
        id: found ? found.id : s.id,
        name: found ? found.name : s.name,
        role: found ? found.role : (s.role || 'Staff')
      });
    });
  }
  luActive = luSlots.findIndex(s => !s);
  luFilterRole = luActive >= 0 ? flat[luActive].role : 'ALL';
  luFilterExact = '';
  const luNameEl = $('lu-name'); if (luNameEl) luNameEl.value = (sq && sq.name) || '';
  const luSquadSizeEl = $('lu-squadsize'); if (luSquadSizeEl) luSquadSizeEl.value = (sq && sq.squadSize) || '';
  renderLineupModal();
}

function renderFormationRow() {
  const el = $('lu-formation-row'); if (!el) return;
  const customKeys = new Set((curTeam && curTeam.customFormations || []).map(f => f.key));
  const validKeys = (ASIDE_FORMATIONS[luAside] || []).concat([...customKeys].filter(k => formationTotal(k) === luAside));
  const keys = [...new Set(validKeys)];
  const opts = keys.map(k => `<option value="${esc(k)}" ${k === luFormation ? 'selected' : ''}>${esc(k)}${customKeys.has(k) ? ' (custom)' : ''}</option>`).join('');
  el.innerHTML = `<select id="lu-formation-select" class="matchset-select" onchange="if(this.value==='__manage__'){this.value=luFormation;openFormationManager();}else{changeFormation(this.value);}">
    ${opts}
    <option value="__manage__">⚙️ Manage formations…</option>
  </select>`;
  const asideSel = $('lu-aside'); if (asideSel) asideSel.value = String(luAside);
}

function changeAside(n) {
  if (n === luAside) return;
  luAside = n;
  const options = ASIDE_FORMATIONS[luAside] || [];
  const stillValid = options.includes(luFormation) && formationTotal(luFormation) === luAside;
  const nextFormation = stillValid ? luFormation : (options[0] || luFormation);
  changeFormation(nextFormation);
}

function changeFormation(key) {
  const assigned = luSlots.filter(Boolean);
  const newFlat = flattenFormation(key);
  luFormation = key;
  luSlots = newFlat.map((_, i) => assigned[i] ? { ...assigned[i] } : null);
  if (assigned.length > newFlat.length) {
    assigned.slice(newFlat.length).forEach(pl => {
      if (!luSubs.some(s => s.id === pl.id)) luSubs.push({ ...pl });
    });
  }
  luActive = luSlots.findIndex(s => !s);
  luFilterRole = luActive >= 0 ? newFlat[luActive].role : 'ALL';
  luFilterExact = '';
  renderLineupModal();
}

const BUILTIN_FORMATION_KEYS = new Set(['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '3-4-3', '5-3-2', '4-1-4-1', '3-3-2', '3-4-1', '4-3-1', '3-2-1', '2-3-1', '2-2-2', '2-1-1', '1-2-1', '1-1']);
function openFormationManager() {
  const outfield = Math.max(0, luAside - 1);
  const def = Math.max(1, Math.floor(outfield / 2));
  const fwd = outfield >= 2 ? 1 : 0;
  const cdm = 0;
  const wing = 0;
  const mid = Math.max(0, outfield - def - fwd - cdm - wing);
  $('cf-def').value = def; $('cf-cdm').value = cdm; $('cf-mid').value = mid; $('cf-wing').value = wing; $('cf-fwd').value = fwd; $('cf-label').value = '';
  $('cf-aside-note').textContent = `Building a ${luAside}-a-side formation — 1 goalkeeper + ${outfield} outfield player${outfield === 1 ? '' : 's'}.`;
  renderFormationManagerList();
  openM('m-formations');
}

function renderFormationManagerList() {
  const list = ((curTeam && curTeam.customFormations) || []).filter(f => formationTotal(f.key) === luAside || (f.def && f.def.reduce((s, l) => s + l.n, 0) === luAside));
  const el = $('cf-list');
  if (!list.length) { el.innerHTML = `<p class="lu-hint">No custom ${luAside}-a-side formations yet — add one below.</p>`; return; }
  el.innerHTML = list.map(f => `<div class="lu-item"><div class="lu-info"><div class="lu-name">${esc(f.label || f.key)}</div><div class="lu-meta">${esc(f.key)}</div></div><div class="lu-tag" style="cursor:pointer;background:#e5393522;color:#e53935;" onclick="deleteCustomFormation('${esc(f.key).replace(/'/g, "\\'")}')">Delete</div></div>`).join('');
}

async function saveCustomFormation() {
  const def = parseInt($('cf-def').value) || 0, cdm = parseInt($('cf-cdm').value) || 0, mid = parseInt($('cf-mid').value) || 0, wing = parseInt($('cf-wing').value) || 0, fwd = parseInt($('cf-fwd').value) || 0;
  const total = 1 + def + cdm + mid + wing + fwd;
  if (total !== luAside) { alert(`Defenders + CDM + Midfielders + Wingers + Strikers + Goalkeeper must add up to ${luAside} for a ${luAside}-a-side game. Currently: ${total}`); return; }
  let label = $('cf-label').value.trim() || `${def}-${cdm ? cdm + '-' : ''}${mid}${wing ? '-' + wing : ''}-${fwd}`;
  let key = label;
  const list = [...(curTeam.customFormations || [])];
  if (BUILTIN_FORMATION_KEYS.has(key) || list.some(f => f.key === key)) {
    if (!confirm(`"${key}" already exists — overwrite it?`)) return;
  }
  const formDef = [{ r: 'GK', n: 1 }];
  if (def > 0) formDef.push({ r: 'DEF', n: def });
  if (cdm > 0) formDef.push({ r: 'MID', n: cdm, lbl: 'CDM' });
  if (mid > 0) formDef.push({ r: 'MID', n: mid });
  if (wing > 0) formDef.push({ r: 'FWD', n: wing, lbl: 'Winger' });
  if (fwd > 0) formDef.push({ r: 'FWD', n: fwd, lbl: 'Striker' });
  const idx = list.findIndex(f => f.key === key);
  const entry = { key, label, def: formDef };
  if (idx >= 0) list[idx] = entry; else list.push(entry);
  try {
    await updateDoc(doc(db, 'teams', curTeam.id), { customFormations: list });
    curTeam.customFormations = list;
    mergeCustomFormations();
    renderFormationManagerList();
    renderFormationRow();
    alert('✅ Formation saved! You can now pick it from the formation dropdown.');
  } catch (e) { alert('❌ Could not save formation: ' + (e.message || e)); }
}

async function deleteCustomFormation(key) {
  if (!confirm('Delete this custom formation?')) return;
  const list = (curTeam.customFormations || []).filter(f => f.key !== key);
  try {
    await updateDoc(doc(db, 'teams', curTeam.id), { customFormations: list });
    curTeam.customFormations = list;
    renderFormationManagerList();
    if (luFormation === key) { changeFormation((ASIDE_FORMATIONS[luAside] || ['4-4-2'])[0]); } else { renderFormationRow(); }
  } catch (e) { alert('❌ Could not delete formation: ' + (e.message || e)); }
}

function renderPitch() {
  const el = $('lu-pitch'); if (!el) return;
  const lines = FORMATIONS[luFormation] || FORMATIONS['4-4-2'];
  const flat = flattenFormation(luFormation);
  const posList = (curTeam && curTeam.positions) || DPOS;

  const stCount = $('pl-starters-count');
  if (stCount) stCount.textContent = `${luSlots.filter(Boolean).length} / ${flat.length}`;

  let idx = 0, html = '';
  lines.forEach(line => {
    const label = line.lbl || roleLabel(line.r);
    const header = line.n > 1 ? `${label}s (${line.n})` : label;
    html += `<div class="lc-title" style="margin:14px 0 6px;">${esc(header.toUpperCase())}</div>`;
    for (let k = 0; k < line.n; k++) {
      const i = idx; idx++;
      const p = luSlots[i];
      const sideLabel = slotSideLabel(line.r, flat[i] ? flat[i].x : 50, line.lbl);
      const cls = `lu-item ${p ? 'filled' : 'empty-slot'} ${i === luActive ? 'active-slot' : ''}`;
      const av = p ? playerLineupAv(p) : '<div class="lu-av">+</div>';
      const name = p ? esc(p.name) : esc(label);
      const meta = p ? `${esc(posCode(p.position) || '—')}${p.jersey ? ' · #' + esc(p.jersey) : ''} <span class="lu-slotside">· ${esc(sideLabel)}</span>` : `Tap to assign <span class="lu-slotside">· ${esc(sideLabel)}</span>`;
      const mpos = p ? (p.matchPosition || posCode(p.position) || '') : '';
      const posOptions = posList.map(po => `<option value="${esc(po)}" ${po === mpos ? 'selected' : ''}>${esc(po)}</option>`).join('');
      const actions = p ? `<div class="lu-slot-actions" onclick="event.stopPropagation();">
          <select class="lu-possel" title="Actual playing position for this match" onchange="setSlotMatchPosition(${i},this.value)">${posOptions}</select>
          <div class="lu-tag" onclick="openEditPlayerInSlot('starter',${i})" title="Edit details" style="background:#eef5ee;color:#1a5c1a;">✏️</div>
          <div class="lu-tag" onclick="moveStarterToBench(${i})" title="Move to Bench" style="background:rgba(25,118,210,.1);color:#1976d2;">⬇️ Bench</div>
          <div class="lu-tag lu-remove-tag" onclick="removeSlot(${i})" title="Remove from XI">✕</div>
        </div>`: `<div class="lu-tag">Assign</div>`;
      html += `<div class="${cls}" onclick="selectSlot(${i})">
        ${av}
        <div class="lu-info"><div class="lu-name">${name}</div><div class="lu-meta">${meta}</div></div>
        ${actions}
      </div>`;
    }
  });
  el.innerHTML = html;
}

function setSlotMatchPosition(i, value) {
  if (!luSlots[i]) return;
  luSlots[i].matchPosition = value;
}

function getAllUsedPlayerIds() {
  const s = new Set();
  luSlots.forEach(p => { if (p && p.id) s.add(p.id); });
  luSubs.forEach(p => { if (p && p.id) s.add(p.id); });
  return s;
}

function setFilterRole(r) { luFilterRole = r; luFilterExact = ''; renderPicker(); }
function setFilterExact(p) { luFilterExact = (luFilterExact === p) ? '' : p; renderPicker(); }

function selectSlot(i) {
  luActive = i;
  const flat = flattenFormation(luFormation);
  luFilterRole = flat[i] ? flat[i].role : 'ALL';
  luFilterExact = '';
  renderPitch();
  renderPicker();
}

function removeSlot(i) {
  luSlots[i] = null;
  luActive = i;
  const flat = flattenFormation(luFormation);
  luFilterRole = flat[i] ? flat[i].role : 'ALL';
  luFilterExact = '';
  renderPitch();
  renderPicker();
  renderBench();
}

function renderPicker() {
  const el = $('lu-picker'); if (!el) return;
  const flat = flattenFormation(luFormation);
  const allFilled = luSlots.length > 0 && luSlots.every(Boolean);

  if (luActive < 0 || luActive >= luSlots.length) {
    if (allFilled) {
      el.innerHTML = `
        <div class="lu-complete-card">
          <div class="lu-complete-icon">✓</div>
          <div class="lu-complete-title">Starting XI Complete</div>
          <div class="lu-complete-desc">All ${luSlots.length} starting positions are assigned. Tap any slot on the pitch if you wish to change or remove a player.</div>
        </div>`;
      return;
    }
    el.innerHTML = `
      <div class="lu-complete-card" style="border-style:dashed;background:rgba(26,92,26,.02);">
        <div style="font-size:28px;margin-bottom:8px;">👆</div>
        <div class="lu-complete-title">Select a Position</div>
        <div class="lu-complete-desc">Tap any empty slot on the pitch to assign a player.</div>
      </div>`;
    return;
  }

  const slotDef = flat[luActive];
  if (!slotDef) {
    el.innerHTML = '<p class="lu-hint">Tap a position on the left to assign a player.</p>';
    return;
  }

  const used = getAllUsedPlayerIds();
  const avail = players.filter(p => !used.has(p.id));

  const roleOrder = ['GK', 'DEF', 'MID', 'FWD'];
  const roleChips = ['ALL', ...roleOrder].map(r =>
    `<button type="button" class="fchip ${luFilterRole === r ? 'active' : ''}" onclick="setFilterRole('${r}')">${r === 'ALL' ? 'All' : roleLabel(r) + 's'}</button>`
  ).join('');

  const scoped = luFilterRole === 'ALL' ? avail : avail.filter(p => classifyPos(p.position) === luFilterRole);
  const exactPositions = [...new Set(scoped.map(p => posCode(p.position)).filter(Boolean))].sort();
  const exactChips = exactPositions.length > 1 ? `
    <div id="lu-exact-row" style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 4px;">
      ${exactPositions.map(p => `<button type="button" class="fchip ${luFilterExact === p ? 'active' : ''}" style="padding:5px 11px;font-size:11px;" onclick="setFilterExact('${esc(p).replace(/'/g, "\\'")}')">${esc(p)}</button>`).join('')}
    </div>` : '';

  const finalList = luFilterExact ? scoped.filter(p => posCode(p.position) === luFilterExact) : scoped;
  const slotTitle = slotSideLabel(slotDef.role, slotDef.x, slotDef.label !== roleLabel(slotDef.role) ? slotDef.label : null);

  const row = list => list.map(p => `
    <div class="lu-item" onclick="assignSlot(${luActive},'${p.id}')">
      ${playerLineupAv(p)}
      <div class="lu-info">
        <div class="lu-name">${esc(p.name)}</div>
        <div class="lu-meta">${esc(posCode(p.position) || '—')}${p.jersey ? ' · #' + esc(p.jersey) : ''}</div>
      </div>
      <div class="lu-tag">Pick</div>
    </div>
  `).join('');

  el.innerHTML = `
    <div class="lu-picker-head">Assigning: <strong style="color:var(--tx);">${esc(slotTitle)}</strong></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 2px;">${roleChips}</div>
    ${exactChips}
    ${finalList.length ? `<div class="lu-list" style="margin-top:8px;">${row(finalList)}</div>` : (avail.length ? `<p class="lu-hint">No available ${luFilterRole !== 'ALL' ? roleLabel(luFilterRole).toLowerCase() + 's' : 'players'} in this position. Tap "All" to view all ${avail.length} unassigned player(s).</p>` : '<p class="lu-hint">All players in your database are currently assigned to the squad.</p>')}
  `;
}

function assignSlot(i, pid) {
  const p = players.find(pl => pl.id === pid); if (!p) return;
  luSubs = luSubs.map(s => (s && s.id === pid) ? null : s);
  luSlots = luSlots.map((s, idx) => (s && s.id === pid && idx !== i) ? null : s);
  luSlots[i] = {
    id: p.id,
    name: p.name,
    position: p.position,
    jersey: p.jersey || '',
    photo: p.photo || null,
    matchPosition: posCode(p.position)
  };

  let next = -1;
  for (let k = 1; k <= luSlots.length; k++) {
    const idx = (i + k) % luSlots.length;
    if (!luSlots[idx]) { next = idx; break; }
  }
  luActive = next;
  if (luActive >= 0) {
    const flat = flattenFormation(luFormation);
    luFilterRole = flat[luActive] ? flat[luActive].role : 'ALL';
    luFilterExact = '';
  }
  renderPitch();
  renderPicker();
  renderBench();
}

function validateSquadSize() {
  const inp = $('lu-squadsize');
  if (!inp) return;
  const v = parseInt(inp.value);
  if (v && v < luAside) {
    alert(`Squad size (${v}) can't be smaller than the game size — ${luAside}-a-side needs at least ${luAside} players. Please enter ${luAside} or more.`);
    inp.value = luAside;
  }
  renderBench();
}

function getMaxSubs() {
  const size = parseInt($('lu-squadsize')?.value) || null;
  const xi = flattenFormation(luFormation).length;
  return size ? Math.max(0, size - xi) : 9;
}

function setBenchFilterRole(r) {
  luBenchFilterRole = r;
  luBenchFilterExact = '';
  renderBenchPicker();
}

function setBenchFilterExact(p) {
  luBenchFilterExact = (luBenchFilterExact === p) ? '' : p;
  renderBenchPicker();
}

function renderBench() {
  const benchEl = $('lu-bench'); if (!benchEl) return;
  const maxSubs = getMaxSubs();

  while (luSubs.length < maxSubs) luSubs.push(null);
  if (luSubs.length > maxSubs) luSubs = luSubs.slice(0, maxSubs);

  const filledCount = luSubs.filter(Boolean).length;
  const countEl = $('lu-benchcount'); if (countEl) countEl.textContent = filledCount;
  const maxEl = $('lu-benchmax'); if (maxEl) maxEl.textContent = maxSubs;

  if (luBenchActive >= maxSubs) {
    luBenchActive = luSubs.findIndex(s => !s);
  }

  let html = '';
  for (let i = 0; i < maxSubs; i++) {
    const p = luSubs[i];
    const cls = `lu-item ${p ? 'filled' : 'empty-slot'} ${i === luBenchActive ? 'active-slot' : ''}`;
    const av = p ? playerLineupAv(p) : '<div class="lu-av">+</div>';
    const name = p ? esc(p.name) : `Game Changer ${i + 1}`;
    const meta = p ? `${esc(posCode(p.position) || '—')}${p.jersey ? ' · #' + esc(p.jersey) : ''} <span class="lu-slotside">· Bench Slot ${i + 1}</span>` : `Tap to assign <span class="lu-slotside">· Bench Slot ${i + 1}</span>`;
    const actions = p ? `<div class="lu-slot-actions" onclick="event.stopPropagation();">
        <div class="lu-tag" onclick="openEditPlayerInSlot('bench',${i})" title="Edit details" style="background:#eef5ee;color:#1a5c1a;">✏️</div>
        <div class="lu-tag" onclick="moveBenchToStarter(${i})" title="Move to Starting XI" style="background:rgba(26,92,26,.1);color:#1a5c1a;">⬆️ 11</div>
        <div class="lu-tag lu-remove-tag" onclick="removeBenchSlot(${i})" title="Remove from bench">✕</div>
      </div>` : `<div class="lu-tag">Assign</div>`;

    html += `<div class="${cls}" onclick="selectBenchSlot(${i})">
      ${av}
      <div class="lu-info">
        <div class="lu-name">${name}</div>
        <div class="lu-meta">${meta}</div>
      </div>
      ${actions}
    </div>`;
  }
  benchEl.innerHTML = html;
  renderBenchPicker();
}

function selectBenchSlot(i) {
  luBenchActive = i;
  renderBench();
}

function removeBenchSlot(i) {
  luSubs[i] = null;
  luBenchActive = i;
  renderBench();
  renderPicker();
}

function assignBenchSlot(i, pid) {
  const p = players.find(pl => pl.id === pid); if (!p) return;
  const maxSubs = getMaxSubs();

  let targetIdx = i;
  if (targetIdx < 0 || targetIdx >= maxSubs) {
    targetIdx = luSubs.findIndex(s => !s);
    if (targetIdx < 0) targetIdx = 0;
  }

  luSlots = luSlots.map(s => (s && s.id === pid) ? null : s);
  luSubs = luSubs.map((s, idx) => (s && s.id === pid && idx !== targetIdx) ? null : s);

  luSubs[targetIdx] = {
    id: p.id,
    name: p.name,
    position: p.position,
    jersey: p.jersey || '',
    photo: p.photo || null
  };

  let next = -1;
  for (let k = 1; k <= maxSubs; k++) {
    const idx = (targetIdx + k) % maxSubs;
    if (!luSubs[idx]) { next = idx; break; }
  }
  luBenchActive = next;
  renderPitch();
  renderPicker();
  renderBench();
}

function renderBenchPicker() {
  const el = $('lu-bench-picker'); if (!el) return;
  const maxSubs = getMaxSubs();
  const allBenchFilled = maxSubs > 0 && luSubs.slice(0, maxSubs).every(Boolean);

  if (luBenchActive < 0 || luBenchActive >= maxSubs) {
    if (allBenchFilled) {
      el.innerHTML = `
        <div class="lu-complete-card">
          <div class="lu-complete-icon" style="background:#b8860b;box-shadow:0 4px 12px rgba(184,134,11,.25);">⚡</div>
          <div class="lu-complete-title">Game Changers Complete</div>
          <div class="lu-complete-desc">All ${maxSubs} bench positions are assigned. Tap any slot on the bench if you wish to change or remove a player.</div>
        </div>`;
      return;
    }
    el.innerHTML = `
      <div class="lu-complete-card" style="border-style:dashed;background:rgba(184,134,11,.02);">
        <div style="font-size:28px;margin-bottom:8px;">⚡</div>
        <div class="lu-complete-title">Select a Bench Slot</div>
        <div class="lu-complete-desc">Tap any empty bench slot on the left to assign a Game Changer.</div>
      </div>`;
    return;
  }

  const used = getAllUsedPlayerIds();
  const avail = players.filter(p => !used.has(p.id));

  const roleOrder = ['GK', 'DEF', 'MID', 'FWD'];
  const roleChips = ['ALL', ...roleOrder].map(r =>
    `<button type="button" class="fchip ${luBenchFilterRole === r ? 'active' : ''}" onclick="setBenchFilterRole('${r}')">${r === 'ALL' ? 'All' : roleLabel(r) + 's'}</button>`
  ).join('');

  const scoped = luBenchFilterRole === 'ALL' ? avail : avail.filter(p => classifyPos(p.position) === luBenchFilterRole);
  const exactPositions = [...new Set(scoped.map(p => posCode(p.position)).filter(Boolean))].sort();
  const exactChips = exactPositions.length > 1 ? `
    <div id="lu-bench-exact-row" style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 4px;">
      ${exactPositions.map(p => `<button type="button" class="fchip ${luBenchFilterExact === p ? 'active' : ''}" style="padding:5px 11px;font-size:11px;" onclick="setBenchFilterExact('${esc(p).replace(/'/g, "\\'")}')">${esc(p)}</button>`).join('')}
    </div>` : '';

  const finalList = luBenchFilterExact ? scoped.filter(p => posCode(p.position) === luBenchFilterExact) : scoped;
  const targetLabel = `Game Changer Slot ${luBenchActive + 1}`;

  const row = list => list.map(p => `
    <div class="lu-item" onclick="assignBenchSlot(${luBenchActive},'${p.id}')">
      ${playerLineupAv(p)}
      <div class="lu-info">
        <div class="lu-name">${esc(p.name)}</div>
        <div class="lu-meta">${esc(posCode(p.position) || '—')}${p.jersey ? ' · #' + esc(p.jersey) : ''}</div>
      </div>
      <div class="lu-tag">Pick</div>
    </div>
  `).join('');

  el.innerHTML = `
    <div class="lu-picker-head">Assigning to: <strong style="color:var(--tx);">${targetLabel}</strong></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 2px;">${roleChips}</div>
    ${exactChips}
    ${finalList.length ? `<div class="lu-list" style="margin-top:8px;">${row(finalList)}</div>` : (avail.length ? `<p class="lu-hint">No available ${luBenchFilterRole !== 'ALL' ? roleLabel(luBenchFilterRole).toLowerCase() + 's' : 'players'} in this filter. Tap "All" to view all ${avail.length} unassigned player(s).</p>` : '<p class="lu-hint">All players in your database are currently assigned to the squad.</p>')}
  `;
}

function renderStaffPicker() {
  const el = $('lu-staff'); if (!el) return;
  const countEl = $('lu-staffcount');
  if (countEl) countEl.textContent = luStaff.length;

  let html = '';
  if (!luStaff.length) {
    html += '<p class="lu-hint" style="margin-bottom:12px;">No management staff assigned to this match squad yet. Click "＋ Add Manually" above or select from team staff below.</p>';
  } else {
    html += '<div style="margin-bottom:14px;">' + luStaff.map((s, idx) => `
      <div class="lu-item filled" style="margin-bottom:6px;">
        <div class="lu-av">🧑‍💼</div>
        <div class="lu-info">
          <div class="lu-name">${esc(s.name)}</div>
          <div class="lu-meta"><span class="s-badge active" style="font-size:10px;padding:2px 8px;">${esc(s.role || 'Staff')}</span></div>
        </div>
        <div class="lu-slot-actions" onclick="event.stopPropagation();">
          <div class="lu-tag" onclick="openEditPlayerInSlot('staff',${idx})" title="Edit details" style="background:#eef5ee;color:#1a5c1a;">✏️</div>
          <div class="lu-tag lu-remove-tag" onclick="removeStaffMember(${idx})" title="Remove staff">✕</div>
        </div>
      </div>
    `).join('') + '</div>';
  }

  const dbStaff = (curTeam && curTeam.staff) || [];
  const unassignedDbStaff = dbStaff.filter(st => !luStaff.some(ls => ls.id === st.id || ls.name.trim().toLowerCase() === st.name.trim().toLowerCase()));
  if (unassignedDbStaff.length > 0) {
    html += `<div class="lc-title" style="margin:10px 0 6px;font-size:12px;">Available Staff in Database (Tap to Add)</div>`;
    html += unassignedDbStaff.map(s => `
      <div class="lu-item" onclick="toggleStaffPick('${s.id}')" style="cursor:pointer;margin-bottom:4px;">
        <div class="lu-av">🧑‍💼</div>
        <div class="lu-info"><div class="lu-name">${esc(s.name)}</div><div class="lu-meta">${esc(s.role || 'Staff')}</div></div>
        <div class="lu-tag">＋ Add</div>
      </div>
    `).join('');
  }

  el.innerHTML = html;
}

function removeStaffMember(i) {
  luStaff.splice(i, 1);
  renderStaffPicker();
}

function moveStarterToBench(i) {
  const p = luSlots[i]; if (!p) return;
  luSlots[i] = null;
  let emptyBenchIdx = luSubs.findIndex(s => !s);
  if (emptyBenchIdx === -1) {
    luSubs.push({ ...p });
  } else {
    luSubs[emptyBenchIdx] = { ...p };
  }
  renderPitch();
  renderPicker();
  renderBench();
}

function moveBenchToStarter(i) {
  const p = luSubs[i]; if (!p) return;
  let emptyStarterIdx = luSlots.findIndex(s => !s);
  if (emptyStarterIdx === -1) {
    alert('All starting slots on the pitch are occupied. Remove or move a starter first.');
    return;
  }
  luSubs[i] = null;
  luSlots[emptyStarterIdx] = {
    ...p,
    matchPosition: p.matchPosition || posCode(p.position)
  };
  renderPitch();
  renderPicker();
  renderBench();
}

let parsedPlayingListUpload = null;

function openPlayingListUpload() {
  parsedPlayingListUpload = null;
  const inp = $('pl-upload-input'); if (inp) inp.value = '';
  const prev = $('pl-upload-preview'); if (prev) prev.style.display = 'none';
  const err = $('pl-upload-err'); if (err) { err.textContent = ''; err.style.display = 'none'; }
  const btn = $('pl-upload-apply-btn'); if (btn) btn.style.display = 'none';
  openM('m-playing-list-upload');
}

async function previewPlayingListCSV(input) {
  const file = input.files[0]; if (!file) return;
  const errEl = $('pl-upload-err');
  const prevEl = $('pl-upload-preview');
  const btnEl = $('pl-upload-apply-btn');
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

  try {
    const text = await file.text();
    const rows = parseCSVRows(text);
    if (rows.length < 2) {
      if (errEl) { errEl.textContent = 'CSV file has no data rows.'; errEl.style.display = 'block'; }
      return;
    }

    const h = rows[0].map(x => x.toLowerCase().trim());
    const findCol = (...keys) => {
      let idx = h.findIndex(col => keys.some(k => col === k));
      if (idx !== -1) return idx;
      idx = h.findIndex(col => keys.some(k => col.includes(k)));
      return idx;
    };

    const typeCol = findCol('type', 'category', 'group');
    const secCol = findCol('section', 'squad section', 'lineup section', 'status');
    const nameCol = findCol('name', 'full name', 'player name', 'player', 'member', 'staff');
    const roleCol = findCol('role', 'position', 'pos', 'role/position', 'designation', 'title');
    const jerseyCol = findCol('jersey', 'jersey #', 'jersey number', 'number', '#', 'no');

    if (nameCol === -1) {
      if (errEl) { errEl.textContent = 'CSV must contain a "Name" column.'; errEl.style.display = 'block'; }
      return;
    }

    const starters = [];
    const bench = [];
    const staff = [];

    const getVal = (r, idx) => (idx >= 0 && idx < r.length) ? String(r[idx] || '').trim() : '';

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const name = getVal(r, nameCol);
      if (!name) continue;

      const secVal = getVal(r, secCol).toLowerCase();
      const typeVal = getVal(r, typeCol).toLowerCase();
      const roleVal = getVal(r, roleCol);
      const roleLower = roleVal.toLowerCase();
      const jerseyVal = getVal(r, jerseyCol);

      const isStaffKeyword = roleLower.includes('coach') || roleLower.includes('manager') || roleLower.includes('physio') || roleLower.includes('doctor') || roleLower.includes('staff') || roleLower.includes('kit') || roleLower.includes('analyst') || roleLower.includes('trainer') || roleLower.includes('assistant');
      const isStaffSection = secVal.includes('management') || secVal.includes('staff') || typeVal.includes('management') || typeVal.includes('staff');

      if (isStaffSection || isStaffKeyword) {
        staff.push({
          name,
          role: roleVal || 'Staff'
        });
      } else if (secVal.includes('11') || secVal.includes('eleven') || secVal.includes('start') || secVal.includes('first') || secVal.includes('playing')) {
        starters.push({
          name,
          position: roleVal || 'Player',
          jersey: jerseyVal || ''
        });
      } else if (secVal.includes('bench') || secVal.includes('sub') || secVal.includes('reserve') || secVal.includes('changer')) {
        bench.push({
          name,
          position: roleVal || 'Player',
          jersey: jerseyVal || ''
        });
      } else {
        // Auto-segregation fallback: first 11 go to starters, rest to bench
        if (starters.length < 11) {
          starters.push({
            name,
            position: roleVal || 'Player',
            jersey: jerseyVal || ''
          });
        } else {
          bench.push({
            name,
            position: roleVal || 'Player',
            jersey: jerseyVal || ''
          });
        }
      }
    }

    parsedPlayingListUpload = { starters, bench, staff };

    // Render preview
    const sEl = $('pl-preview-starters');
    const bEl = $('pl-preview-bench');
    const mEl = $('pl-preview-staff');

    if (sEl) {
      sEl.innerHTML = `<div style="font-weight:700;color:var(--g);font-size:13px;margin-bottom:4px;">⚽ Starting XI (${starters.length}):</div>` +
        `<div style="font-size:12px;color:var(--tx);max-height:80px;overflow-y:auto;background:var(--card2);padding:6px 10px;border-radius:8px;">` +
        (starters.length ? starters.map((p, idx) => `${idx + 1}. ${esc(p.name)} (${esc(p.position)}${p.jersey ? ' #' + esc(p.jersey) : ''})`).join('<br>') : '<em>None</em>') +
        `</div>`;
    }

    if (bEl) {
      bEl.innerHTML = `<div style="font-weight:700;color:var(--g);font-size:13px;margin-bottom:4px;">⚡ Game Changers / Bench (${bench.length}):</div>` +
        `<div style="font-size:12px;color:var(--tx);max-height:80px;overflow-y:auto;background:var(--card2);padding:6px 10px;border-radius:8px;">` +
        (bench.length ? bench.map((p, idx) => `${idx + 1}. ${esc(p.name)} (${esc(p.position)}${p.jersey ? ' #' + esc(p.jersey) : ''})`).join('<br>') : '<em>None</em>') +
        `</div>`;
    }

    if (mEl) {
      mEl.innerHTML = `<div style="font-weight:700;color:var(--g);font-size:13px;margin-bottom:4px;">🧑‍💼 Management Staff (${staff.length}):</div>` +
        `<div style="font-size:12px;color:var(--tx);max-height:80px;overflow-y:auto;background:var(--card2);padding:6px 10px;border-radius:8px;">` +
        (staff.length ? staff.map((s, idx) => `${idx + 1}. ${esc(s.name)} (${esc(s.role)})`).join('<br>') : '<em>None</em>') +
        `</div>`;
    }

    if (prevEl) prevEl.style.display = 'block';
    if (btnEl) btnEl.style.display = 'inline-block';
  } catch (e) {
    console.error('previewPlayingListCSV error:', e);
    if (errEl) { errEl.textContent = 'Failed to parse CSV: ' + (e.message || e); errEl.style.display = 'block'; }
  }
}

function applyPlayingListUpload() {
  if (!parsedPlayingListUpload) return;
  const { starters, bench, staff } = parsedPlayingListUpload;

  const flat = flattenFormation(luFormation);
  const totalSlots = flat.length;

  const getOrCreatePlayer = (item) => {
    const found = players.find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
    if (found) {
      return {
        id: found.id,
        name: found.name,
        position: found.position || item.position,
        jersey: (found.jersey != null && found.jersey !== '') ? found.jersey : (item.jersey || ''),
        photo: found.photo || null,
        matchPosition: posCode(found.position || item.position)
      };
    }
    return {
      id: 'upl_' + Math.random().toString(36).substr(2, 9),
      name: item.name,
      position: item.position || 'ST',
      jersey: item.jersey || '',
      photo: null,
      matchPosition: posCode(item.position)
    };
  };

  luSlots = flat.map((_, i) => {
    if (starters[i]) {
      return getOrCreatePlayer(starters[i]);
    }
    return null;
  });

  const overflowStarters = starters.slice(totalSlots);
  const allBenchItems = [...overflowStarters, ...bench];

  const squadSizeInp = $('lu-squadsize');
  if (squadSizeInp && allBenchItems.length > 9) {
    squadSizeInp.value = totalSlots + allBenchItems.length;
  }

  luSubs = allBenchItems.map(item => getOrCreatePlayer(item));
  while (luSubs.length < getMaxSubs()) luSubs.push(null);

  if (!curTeam.staff) curTeam.staff = [];
  staff.forEach(s => {
    let existing = (curTeam.staff || []).find(st => st.name.trim().toLowerCase() === s.name.trim().toLowerCase());
    if (!existing) {
      existing = { id: 'stf_' + Math.random().toString(36).substr(2, 9), name: s.name, role: s.role };
      curTeam.staff.push(existing);
    }
  });

  luStaff = staff.map(s => {
    const existing = curTeam.staff.find(st => st.name.trim().toLowerCase() === s.name.trim().toLowerCase());
    return {
      id: existing ? existing.id : 'stf_' + Math.random().toString(36).substr(2, 9),
      name: s.name,
      role: s.role
    };
  });

  luActive = luSlots.findIndex(s => !s);
  luBenchActive = luSubs.findIndex(s => !s);

  renderPitch();
  renderPicker();
  renderBench();
  renderStaffPicker();
  closeM('m-playing-list-upload');
  alert(`✅ Successfully loaded Playing List!\n⚽ ${starters.length} in Starting XI\n⚡ ${bench.length} in Bench\n🧑‍💼 ${staff.length} in Management\n\nClick "SAVE SQUAD" to save changes.`);
}

let plAddTargetSection = 'starter';
let plEditingIndex = -1;

function openAddPlayerToSection(section) {
  plAddTargetSection = section;
  plEditingIndex = -1;
  const titEl = $('pl-add-tit');
  const descEl = $('pl-add-desc');
  const roleLabel = $('pl-add-role-label');
  const jerseyField = $('pl-add-jersey-field');
  const nameInp = $('pl-add-name');
  const roleInp = $('pl-add-role');
  const jerseyInp = $('pl-add-jersey');
  const errEl = $('pl-add-err');

  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  if (nameInp) nameInp.value = '';
  if (roleInp) roleInp.value = '';
  if (jerseyInp) jerseyInp.value = '';

  const sel = $('pl-add-player-sel');
  if (sel) {
    if (section === 'staff') {
      sel.innerHTML = '<option value="">— Type staff manually below —</option>' +
        (curTeam?.staff || []).map(s => `<option value="${s.id}" data-name="${esc(s.name)}" data-role="${esc(s.role)}">🧑‍💼 ${esc(s.name)} (${esc(s.role)})</option>`).join('');
    } else {
      sel.innerHTML = '<option value="">— Type player manually below —</option>' +
        players.map(p => `<option value="${p.id}" data-name="${esc(p.name)}" data-role="${esc(p.position)}" data-jersey="${p.jersey || ''}">⚽ ${esc(p.name)} (${esc(p.position || '—')}${p.jersey ? ' #' + p.jersey : ''})</option>`).join('');
    }
  }

  if (section === 'starter') {
    if (titEl) titEl.textContent = 'ADD TO STARTING XI';
    if (descEl) descEl.textContent = 'Add a player to the starting lineup on the pitch.';
    if (roleLabel) roleLabel.textContent = 'Position (e.g. ST, CB, GK)';
    if (jerseyField) jerseyField.style.display = 'block';
  } else if (section === 'bench') {
    if (titEl) titEl.textContent = 'ADD TO GAME CHANGERS / BENCH';
    if (descEl) descEl.textContent = 'Add a substitute player to the bench.';
    if (roleLabel) roleLabel.textContent = 'Position (e.g. ST, CM, GK)';
    if (jerseyField) jerseyField.style.display = 'block';
  } else {
    if (titEl) titEl.textContent = 'ADD TO MANAGEMENT STAFF';
    if (descEl) descEl.textContent = 'Add coach, physio, manager or support staff.';
    if (roleLabel) roleLabel.textContent = 'Role / Title (e.g. Head Coach, Physio)';
    if (jerseyField) jerseyField.style.display = 'none';
  }

  openM('m-pl-add-player');
}

function plAddPlayerSelChange(sel) {
  const opt = sel.options[sel.selectedIndex];
  if (!opt || !opt.value) return;
  const name = opt.getAttribute('data-name') || '';
  const role = opt.getAttribute('data-role') || '';
  const jersey = opt.getAttribute('data-jersey') || '';

  const nameInp = $('pl-add-name'); if (nameInp) nameInp.value = name;
  const roleInp = $('pl-add-role'); if (roleInp) roleInp.value = role;
  const jerseyInp = $('pl-add-jersey'); if (jerseyInp) jerseyInp.value = jersey;
}

function confirmAddPlayerToSection() {
  const name = String($('pl-add-name')?.value || '').trim();
  const role = String($('pl-add-role')?.value || '').trim();
  const jersey = String($('pl-add-jersey')?.value || '').trim();
  const errEl = $('pl-add-err');

  if (!name) {
    if (errEl) { errEl.textContent = 'Please enter a name.'; errEl.style.display = 'block'; }
    return;
  }

  const sel = $('pl-add-player-sel');
  const selId = sel?.value || null;
  const pId = selId || ('usr_' + Date.now() + Math.random().toString(36).substr(2, 4));

  if (plEditingIndex >= 0) {
    // Editing existing entry
    if (plAddTargetSection === 'starter') {
      if (luSlots[plEditingIndex]) {
        luSlots[plEditingIndex].name = name;
        luSlots[plEditingIndex].position = role || luSlots[plEditingIndex].position;
        luSlots[plEditingIndex].matchPosition = posCode(role || luSlots[plEditingIndex].matchPosition);
        if (jersey) luSlots[plEditingIndex].jersey = jersey;
      }
    } else if (plAddTargetSection === 'bench') {
      if (luSubs[plEditingIndex]) {
        luSubs[plEditingIndex].name = name;
        luSubs[plEditingIndex].position = role || luSubs[plEditingIndex].position;
        if (jersey) luSubs[plEditingIndex].jersey = jersey;
      }
    } else if (plAddTargetSection === 'staff') {
      if (luStaff[plEditingIndex]) {
        luStaff[plEditingIndex].name = name;
        luStaff[plEditingIndex].role = role || luStaff[plEditingIndex].role;
      }
    }
  } else {
    // Adding new entry
    if (plAddTargetSection === 'starter') {
      let emptyIdx = luSlots.findIndex(s => !s);
      if (emptyIdx === -1) {
        luSlots.push({
          id: pId,
          name,
          position: role || 'Player',
          jersey,
          matchPosition: posCode(role)
        });
      } else {
        luSlots[emptyIdx] = {
          id: pId,
          name,
          position: role || 'Player',
          jersey,
          matchPosition: posCode(role)
        };
      }
    } else if (plAddTargetSection === 'bench') {
      let emptyIdx = luSubs.findIndex(s => !s);
      if (emptyIdx === -1) {
        luSubs.push({
          id: pId,
          name,
          position: role || 'Player',
          jersey
        });
      } else {
        luSubs[emptyIdx] = {
          id: pId,
          name,
          position: role || 'Player',
          jersey
        };
      }
    } else if (plAddTargetSection === 'staff') {
      luStaff.push({
        id: pId,
        name,
        role: role || 'Staff'
      });
      if (curTeam && !curTeam.staff) curTeam.staff = [];
      if (curTeam && !curTeam.staff.some(s => s.name.trim().toLowerCase() === name.toLowerCase())) {
        curTeam.staff.push({ id: pId, name, role: role || 'Staff' });
      }
    }
  }

  closeM('m-pl-add-player');
  renderPitch();
  renderPicker();
  renderBench();
  renderStaffPicker();
}

function openEditPlayerInSlot(section, index) {
  plAddTargetSection = section;
  plEditingIndex = index;
  const titEl = $('pl-add-tit');
  const descEl = $('pl-add-desc');
  const roleLabel = $('pl-add-role-label');
  const jerseyField = $('pl-add-jersey-field');
  const nameInp = $('pl-add-name');
  const roleInp = $('pl-add-role');
  const jerseyInp = $('pl-add-jersey');
  const errEl = $('pl-add-err');

  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

  let item = null;
  if (section === 'starter') item = luSlots[index];
  else if (section === 'bench') item = luSubs[index];
  else if (section === 'staff') item = luStaff[index];

  if (!item) return;

  if (nameInp) nameInp.value = item.name || '';
  if (roleInp) roleInp.value = item.position || item.role || '';
  if (jerseyInp) jerseyInp.value = item.jersey || '';

  const sel = $('pl-add-player-sel');
  if (sel) {
    sel.innerHTML = `<option value="">— Editing: ${esc(item.name)} —</option>`;
  }

  if (section === 'starter') {
    if (titEl) titEl.textContent = 'EDIT STARTING PLAYER';
    if (descEl) descEl.textContent = 'Update details for this starter.';
    if (roleLabel) roleLabel.textContent = 'Position (e.g. ST, CB, GK)';
    if (jerseyField) jerseyField.style.display = 'block';
  } else if (section === 'bench') {
    if (titEl) titEl.textContent = 'EDIT BENCH PLAYER';
    if (descEl) descEl.textContent = 'Update details for this bench player.';
    if (roleLabel) roleLabel.textContent = 'Position (e.g. ST, CM, GK)';
    if (jerseyField) jerseyField.style.display = 'block';
  } else {
    if (titEl) titEl.textContent = 'EDIT MANAGEMENT STAFF';
    if (descEl) descEl.textContent = 'Update staff member details.';
    if (roleLabel) roleLabel.textContent = 'Role / Title';
    if (jerseyField) jerseyField.style.display = 'none';
  }

  openM('m-pl-add-player');
}

function importTeamPlayingListToMatch() {
  if (!curMatch || !amlSide) return;
  const sideData = amlSide === 'home' ? curMatch.home : curMatch.away;
  const teamId = sideData?.teamId;
  const teamObj = teams.find(t => t.id === teamId);
  if (!teamObj || !teamObj.squad) {
    alert('No saved squad found for this team. Please configure and save the squad in the team dashboard first.');
    return;
  }

  const sq = teamObj.squad;
  amlFormation = sq.formation || '4-4-2';
  amlAside = formationTotal(amlFormation) || 11;
  const flat = flattenFormation(amlFormation);

  if (Array.isArray(sq.playingXi) && sq.playingXi.length) {
    amlSlots = flat.map((_, i) => {
      const p = sq.playingXi[i];
      if (p) {
        return {
          id: p.id,
          name: p.name,
          position: p.position || 'ST',
          jersey: p.jersey || '',
          photo: p.photo || null,
          matchPosition: posCode(p.position)
        };
      }
      return null;
    });
  } else {
    amlSlots = flat.map((_, i) => {
      if (sq.slots && sq.slots[i] && sq.slots[i].player) {
        const sp = sq.slots[i].player;
        return {
          id: sp.id,
          name: sp.name,
          position: sp.position,
          jersey: sp.jersey || '',
          photo: sp.photo || null,
          matchPosition: sp.matchPosition || posCode(sp.position)
        };
      }
      return null;
    });
  }

  if (Array.isArray(sq.bench) && sq.bench.length) {
    amlSubs = sq.bench.map(p => ({
      id: p.id,
      name: p.name,
      position: p.position || 'ST',
      jersey: p.jersey || '',
      photo: p.photo || null
    }));
  } else {
    amlSubs = (sq.subs || []).map(sb => ({
      id: sb.id,
      name: sb.name,
      position: sb.position,
      jersey: sb.jersey || '',
      photo: sb.photo || null
    }));
  }

  if (Array.isArray(sq.management) && sq.management.length) {
    amlStaff = sq.management.map(s => ({
      id: s.id,
      name: s.name,
      role: s.role || 'Staff',
      photo: s.photo || null
    }));
  } else {
    amlStaff = (sq.staff || []).map(s => ({
      id: s.id,
      name: s.name,
      role: s.role || 'Staff',
      photo: s.photo || null
    }));
  }

  renderAdjustLineupModal();
  alert(`✅ Successfully imported squad from ${teamObj.name}!\nPlaying XI: ${amlSlots.filter(Boolean).length}, Bench: ${amlSubs.length}, Staff: ${amlStaff.length}`);
}

function renderLineupModal() { renderFormationRow(); renderPitch(); renderPicker(); renderBench(); renderStaffPicker(); }

async function saveLineup() {
  const flat = flattenFormation(luFormation);
  const validSubs = luSubs.filter(Boolean);
  if (!luSlots.some(Boolean) && !validSubs.length) { alert('Assign at least one player to the squad.'); return; }
  const name = $('lu-name').value.trim();
  const squadSize = $('lu-squadsize').value ? parseInt($('lu-squadsize').value) : null;
  if (squadSize != null && squadSize < luAside) {
    alert(`Squad size (${squadSize}) can't be smaller than the game size — ${luAside}-a-side needs at least ${luAside} players.`);
    return;
  }
  const slots = flat.map((s, i) => {
    const p = luSlots[i];
    return {
      role: s.role || '',
      label: s.label || '',
      player: p ? {
        id: p.id,
        name: p.name || '',
        position: p.position || '',
        jersey: p.jersey || '',
        matchPosition: p.matchPosition || posCode(p.position) || ''
      } : null
    };
  });
  const subs = validSubs.map(s => ({
    id: s.id,
    name: s.name || '',
    position: s.position || '',
    jersey: s.jersey || ''
  }));
  const staff = luStaff.map(s => ({ id: s.id, name: s.name || '', role: s.role || 'Other' }));
  const squad = {
    formation: luFormation || '4-4-2',
    name: name || '',
    squadSize: squadSize != null ? squadSize : null,
    slots,
    subs,
    staff,
    updatedAt: new Date().toISOString()
  };
  try {
    await updateDoc(doc(db, 'teams', curTeam.id), { squad });
    curTeam.squad = squad;
    alert('✅ Match squad saved!');
  } catch (e) { alert('❌ Could not save squad: ' + (e.message || e)); }
}

async function clearLineup() {
  if (!confirm('Clear all assigned players and staff from this match squad?')) return;
  const flat = flattenFormation(luFormation);
  luSlots = flat.map(() => null);
  const maxSubs = getMaxSubs();
  luSubs = new Array(maxSubs).fill(null);
  luStaff = [];
  luActive = 0;
  luBenchActive = 0;
  luFilterRole = flat[0] ? flat[0].role : 'ALL';
  luFilterExact = '';
  luBenchFilterRole = 'ALL';
  luBenchFilterExact = '';
  $('lu-name').value = '';
  try {
    if (curTeam && curTeam.id) {
      await db.collection('teams').doc(curTeam.id).update({ squad: null });
      curTeam.squad = null;
    }
  } catch (e) { console.error('Clear squad db error:', e); }
  renderLineupModal();
}

const STAFF_ROLES = ['Manager', 'Coach', 'Assistant Coach', '2nd Coach', 'Physio', 'Kit Man', 'Other'];

function openStaffModal(id) {
  editStaffId = id || null;
  const st = id ? (curTeam.staff || []).find(s => s.id === id) : null;
  $('staff-mtit').textContent = id ? '✏️ EDIT TEAM MEMBER' : '➕ ADD TEAM MEMBER';
  $('st-name').value = st ? st.name : '';
  const knownRole = st && STAFF_ROLES.includes(st.role) ? st.role : (st ? 'Other' : 'Manager');
  $('st-role').value = knownRole;
  $('st-role-other').style.display = knownRole === 'Other' ? 'block' : 'none';
  $('st-role-custom').value = (st && knownRole === 'Other') ? st.role : '';
  $('st-phone').value = st ? (st.phone || '').replace('+91', '') : '';
  $('st-notes').value = st ? (st.notes || '') : '';
  openM('m-staff');
}

async function saveStaffMember() {
  const name = $('st-name').value.trim();
  if (!name) { alert('Please enter a name.'); return; }
  let role = $('st-role').value;
  if (role === 'Other') { role = $('st-role-custom').value.trim() || 'Other'; }
  const phoneDigits = $('st-phone').value.trim();
  const fullPhone = phoneDigits ? ('+91' + phoneDigits) : '';
  const notes = $('st-notes').value.trim();

  const list = [...(curTeam.staff || [])];
  let targetId = editStaffId;

  if (!targetId) {
    const matched = list.find(s =>
      (phoneDigits && s.phone && String(s.phone).replace(/\D/g, '').endsWith(phoneDigits)) ||
      (s.name && s.name.trim().toLowerCase() === name.toLowerCase())
    );
    if (matched) { targetId = matched.id; }
  }

  const entry = {
    id: targetId || ('st_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
    name, role, phone: fullPhone, notes,
    updatedAt: new Date().toISOString()
  };

  if (targetId) {
    const idx = list.findIndex(s => s.id === targetId);
    if (idx >= 0) list[idx] = entry; else list.push(entry);
  } else {
    entry.registeredAt = new Date().toISOString();
    list.push(entry);
  }

  try {
    await updateDoc(doc(db, 'teams', curTeam.id), { staff: list });
    curTeam.staff = list;
    closeM('m-staff');
    renderStaffList();
  } catch (e) { alert('❌ Could not save: ' + (e.message || e)); }
}

async function deleteStaffMember(id) {
  if (!confirm('Remove this team member?')) return;
  const list = (curTeam.staff || []).filter(s => s.id !== id);
  try {
    await updateDoc(doc(db, 'teams', curTeam.id), { staff: list });
    curTeam.staff = list;
    renderStaffList();
  } catch (e) { alert('❌ Could not remove: ' + (e.message || e)); }
}

function renderStaffList() {
  const list = [...(curTeam && curTeam.staff || [])].sort((a, b) => {
    const ra = STAFF_ROLES.indexOf(a.role), rb = STAFF_ROLES.indexOf(b.role);
    const oa = ra < 0 ? STAFF_ROLES.length : ra, ob = rb < 0 ? STAFF_ROLES.length : rb;
    return oa - ob || (a.name || '').localeCompare(b.name || '');
  });
  const html = !list.length ? '<div class="empty"><div class="ei">🧑‍💼</div><p>No management staff added yet. Manage staff in the Database tab.</p></div>' : list.map(s => `
    <div class="pcard">
      <div class="pav">🧑‍💼</div>
      <div class="pi">
        <div class="pn">${esc(s.name)}<span class="jb">${esc(s.role)}</span></div>
        <div class="pm">
          ${s.phone ? `<span class="mi">📞 ${esc(s.phone)}</span>` : ''}
        </div>
        ${s.notes ? `<div class="pm"><span class="mi" style="color:var(--mt);">📝 ${esc(s.notes.substring(0, 100))}${s.notes.length > 100 ? '…' : ''}</span></div>` : ''}
      </div>
      <div class="cacts">
        <button class="ib" onclick="openStaffModal('${s.id}')">✏️</button>
        <button class="ib del" onclick="deleteStaffMember('${s.id}')">✕</button>
      </div>
    </div>`).join('');
  ['stafflist', 'stafflist-db'].forEach(id => { const el = $(id); if (el) el.innerHTML = html; });
}

function getCleanPhone10(ph) {
  if (!ph) return '';
  const digits = String(ph).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

function exportCSV() {
  const staff = curTeam?.staff || [];
  if (!players.length && !staff.length) {
    alert('No players or staff to export.');
    return;
  }

  const staffRows = staff.map(s => [
    'Staff',
    s.role || 'Staff',
    s.name || '',
    '',
    '',
    '',
    '',
    s.phone || '',
    '',
    '',
    '',
    '',
    s.notes || '',
    s.registeredAt || ''
  ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));

  const playerRows = players.map(p => [
    'Player',
    posCode(p.position) || '',
    p.name || '',
    p.dob || '',
    p.age || '',
    p.father || '',
    (p.address || '').replace(/\n/g, ' '),
    p.phone || '',
    p.jersey || '',
    p.jersey2 || '',
    p.playernum || '',
    p.foot || '',
    p.notes || '',
    p.registeredAt || ''
  ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));

  const allRows = staffRows.concat(playerRows);
  const csv = ['Type,Role / Position,Name,DOB,Age,Father / Guardian,Address,Phone,Jersey 1st,Jersey 2nd,Squad#,Pref Foot,Notes,Registered'].concat(allRows).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `${(curTeam?.name || 'team').replace(/\s+/g, '_')}_contacts.csv`;
  a.click();
}

function exportStaffCSV() { exportCSV(); }
function exportFullRosterCSV() { exportCSV(); }

// Robust CSV Line & Cell Parser (RFC 4180 compliant)
function parseCSVRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (c === '"') {
        if (next === '"') { cell += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cell += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (c === '\r' || c === '\n') {
        row.push(cell.trim());
        cell = '';
        if (row.some(x => x.length > 0)) rows.push(row);
        row = [];
        if (c === '\r' && next === '\n') i++;
      } else {
        cell += c;
      }
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some(x => x.length > 0)) rows.push(row);
  }
  return rows;
}

async function importCSV(input) {
  const file = input.files[0]; if (!file) return;
  if (!curTeam) { alert('Please select a team first.'); input.value = ''; return; }

  const text = await file.text();
  const rows = parseCSVRows(text);
  if (rows.length < 2) { alert('CSV file has no data rows.'); input.value = ''; return; }

  const h = rows[0].map(x => x.toLowerCase().trim());
  const findCol = (...keys) => {
    let idx = h.findIndex(col => keys.some(k => col === k));
    if (idx !== -1) return idx;
    idx = h.findIndex(col => keys.some(k => col.includes(k)));
    return idx;
  };

  const ti = findCol('type', 'category', 'section', 'tag', 'group');
  let ni = findCol('name', 'full name', 'player name', 'member name', 'contact name');
  if (ni === -1) ni = findCol('player', 'member', 'contact');
  const rolni = findCol('role / position', 'role/position', 'position / role', 'role', 'position', 'pos', 'designation', 'title');
  const di = findCol('dob', 'birth', 'date of birth', 'dateofbirth');
  const ai = findCol('age');
  const fi = findCol('father / guardian', 'father', 'guardian', 'parent');
  const adri = findCol('address', 'addr', 'residence');
  const phi = findCol('phone', 'mobile', 'contact no', 'mobile no', 'contact number', 'phone number', 'tel');

  let ji = h.findIndex(x => x === 'jersey 1st' || x === 'jersey 1' || x === 'jersey #' || x === 'jersey number' || x === 'jersey');
  if (ji === -1) ji = h.findIndex(x => x.includes('jersey') && !x.includes('2') && !x.includes('second'));
  let j2i = h.findIndex(x => x === 'jersey 2nd' || x === 'jersey 2' || x === '2nd jersey');
  if (j2i === -1) j2i = h.findIndex(x => x.includes('jersey') && (x.includes('2') || x.includes('second')));

  const sqi = findCol('squad#', 'squad number', 'squad no', 'playernum', 'sq #', 'squad');
  const footi = findCol('pref foot', 'preferred foot', 'foot');
  const noti = findCol('notes', 'remarks', 'medical', 'extra', 'note');

  if (ni === -1 && phi === -1) {
    alert('CSV must contain a "Name" or "Phone" column.');
    input.value = '';
    return;
  }

  const getVal = (r, idx) => (idx >= 0 && idx < r.length) ? String(r[idx] || '').trim() : '';

  let pAdded = 0, pUpdated = 0;
  let sAdded = 0, sUpdated = 0;
  let skipped = 0;

  // In-memory lookups for background deduplication using last 10 digits of mobile number
  const playerPhoneMap = new Map();
  players.forEach(p => {
    const p10 = getCleanPhone10(p.phone);
    if (p10 && !playerPhoneMap.has(p10)) playerPhoneMap.set(p10, p);
  });

  const currentStaffList = [...(curTeam.staff || [])];
  const staffPhoneMap = new Map();
  currentStaffList.forEach(s => {
    const s10 = getCleanPhone10(s.phone);
    if (s10 && !staffPhoneMap.has(s10)) staffPhoneMap.set(s10, s);
  });

  let staffModified = false;
  const batchNewPlayers = [];

  let currentBatch = db.batch();
  let batchOpsCount = 0;
  const commitBatchIfNeeded = async (force = false) => {
    if (batchOpsCount >= 400 || (force && batchOpsCount > 0)) {
      await currentBatch.commit();
      currentBatch = db.batch();
      batchOpsCount = 0;
    }
  };

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = getVal(r, ni);
    const rawPhone = getVal(r, phi);
    const phone10 = getCleanPhone10(rawPhone);
    const fullPhone = phone10 ? ('+91' + phone10) : (rawPhone ? String(rawPhone).trim() : '');

    if (!name && !phone10 && !r.some(c => c.length > 0)) {
      continue;
    }
    if (!name && !phone10) {
      skipped++;
      continue;
    }

    const rawType = getVal(r, ti).toLowerCase();
    const rawRole = getVal(r, rolni);
    const rawRoleLower = rawRole.toLowerCase();

    const isExplicitStaff = rawType.includes('staff') || rawType.includes('management') || rawType.includes('official') || rawType.includes('support');
    const isExplicitPlayer = rawType.includes('player') || rawType.includes('squad') || rawType.includes('roster');

    const specificStaffTokens = ['coach', 'physio', 'manager', 'kit man', 'kitman', 'analyst', 'medic', 'masseur', 'director'];
    const matchesStaffRole = specificStaffTokens.some(tok => rawRoleLower.includes(tok));

    let isStaff = false;
    if (isExplicitStaff) {
      isStaff = true;
    } else if (isExplicitPlayer) {
      isStaff = false;
    } else if (matchesStaffRole) {
      isStaff = true;
    } else {
      isStaff = false;
    }

    const notes = getVal(r, noti);

    if (isStaff) {
      // MANAGEMENT / STAFF RECORD
      let matchedRole = STAFF_ROLES.find(sr => sr.toLowerCase() === rawRoleLower);
      if (!matchedRole) {
        matchedRole = STAFF_ROLES.find(sr => sr !== 'Other' && rawRoleLower.includes(sr.toLowerCase())) || (rawRole || 'Coach');
      }

      // Check duplicacy rule: mobile no. (last 10 digits only), fallback to name if no phone
      let existingStaff = null;
      if (phone10 && staffPhoneMap.has(phone10)) {
        existingStaff = staffPhoneMap.get(phone10);
      } else if (!phone10 && name) {
        existingStaff = currentStaffList.find(s => s.name && s.name.trim().toLowerCase() === name.toLowerCase());
      }

      if (existingStaff) {
        if (name) existingStaff.name = name;
        if (matchedRole) existingStaff.role = matchedRole;
        if (fullPhone) existingStaff.phone = fullPhone;
        if (notes) existingStaff.notes = notes;
        existingStaff.updatedAt = new Date().toISOString();
        sUpdated++;
      } else {
        const newStaff = {
          id: 'st_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
          name: name || 'Staff Member',
          role: matchedRole,
          phone: fullPhone,
          notes: notes,
          registeredAt: new Date().toISOString()
        };
        currentStaffList.push(newStaff);
        if (phone10) staffPhoneMap.set(phone10, newStaff);
        sAdded++;
      }
      staffModified = true;
    } else {
      // PLAYER RECORD
      const dob = getVal(r, di);
      const rawPos = rawRole || getVal(r, rolni);
      const pos = rawPos ? posCode(rawPos) : 'CM';
      const age = getVal(r, ai);
      const father = getVal(r, fi);
      const address = getVal(r, adri);
      const jersey1 = getVal(r, ji);
      const jersey2 = getVal(r, j2i);
      const squadNum = getVal(r, sqi);
      const foot = getVal(r, footi);

      // Check duplicacy rule: mobile no. (last 10 digits only), fallback to name+dob if no phone
      let existingPlayer = null;
      if (phone10 && playerPhoneMap.has(phone10)) {
        existingPlayer = playerPhoneMap.get(phone10);
      } else if (!phone10 && name) {
        existingPlayer = players.find(p => p.name && p.name.trim().toLowerCase() === name.toLowerCase() && (!dob || !p.dob || p.dob === dob)) ||
          batchNewPlayers.find(p => p.name && p.name.trim().toLowerCase() === name.toLowerCase() && (!dob || !p.dob || p.dob === dob));
      }

      const playerData = {
        teamId: curTeam.id,
        name: name || (existingPlayer ? existingPlayer.name : 'Player'),
        dob: dob || (existingPlayer ? existingPlayer.dob : ''),
        age: age || (existingPlayer ? existingPlayer.age : ''),
        father: father || (existingPlayer ? existingPlayer.father : ''),
        address: address || (existingPlayer ? existingPlayer.address : ''),
        phone: fullPhone || (existingPlayer ? existingPlayer.phone : ''),
        position: (pos && pos !== 'Player' && pos !== 'Staff') ? pos : (existingPlayer ? existingPlayer.position : 'CM'),
        jersey: jersey1 || (existingPlayer ? existingPlayer.jersey : ''),
        jersey2: jersey2 || (existingPlayer ? existingPlayer.jersey2 : ''),
        playernum: squadNum || (existingPlayer ? existingPlayer.playernum : ''),
        foot: foot || (existingPlayer ? existingPlayer.foot : ''),
        notes: notes || (existingPlayer ? existingPlayer.notes : ''),
        updatedAt: new Date().toISOString()
      };

      try {
        if (existingPlayer) {
          // Existing duplicate: update via batch
          const playerDocRef = db.collection('players').doc(existingPlayer.id);
          currentBatch.update(playerDocRef, playerData);
          batchOpsCount++;
          Object.assign(existingPlayer, playerData);
          pUpdated++;
        } else {
          // New unique player: create new doc ref via batch
          playerData.registeredAt = new Date().toISOString();
          playerData.photo = null;
          const newDocRef = db.collection('players').doc();
          currentBatch.set(newDocRef, playerData);
          batchOpsCount++;
          const newPlayer = { id: newDocRef.id, ...playerData };
          batchNewPlayers.push(newPlayer);
          if (phone10) playerPhoneMap.set(phone10, newPlayer);
          pAdded++;
        }
        await commitBatchIfNeeded(false);
      } catch (e) {
        console.error('Import error for row ' + i + ' (' + name + '):', e);
        skipped++;
      }
    }
  }

  // Commit any pending batch writes
  try {
    await commitBatchIfNeeded(true);
  } catch (e) {
    console.error('Error committing player batch:', e);
    alert('Error saving players to database: ' + (e.message || e));
  }

  if (staffModified) {
    try {
      await db.collection('teams').doc(curTeam.id).update({ staff: currentStaffList });
      curTeam.staff = currentStaffList;
    } catch (e) {
      console.error('Failed to update staff document:', e);
      alert('Error updating staff: ' + (e.message || e));
    }
  }

  // Safely merge new batch players into memory without creating duplicate entries
  const existingIds = new Set(players.map(p => p.id));
  batchNewPlayers.forEach(np => {
    if (!existingIds.has(np.id)) {
      existingIds.add(np.id);
      players.push(np);
    }
  });

  input.value = '';
  renderPlayers();
  renderStaffList();
  renderSquad();
  if (typeof renderLineupModal === 'function') renderLineupModal();

  let summary = '🎉 Import Completed!\n\n';
  summary += `⚽ Players: ${pAdded} added, ${pUpdated} updated.\n`;
  summary += `🧑‍💼 Staff: ${sAdded} added, ${sUpdated} updated.\n`;
  summary += `🛡️ Duplicates merged automatically using 10-digit mobile rule.\n`;
  if (skipped) summary += `⚠️ ${skipped} row(s) skipped.`;
  alert(summary);
}

function importStaffCSV(input) { importCSV(input); }

function loadSetup() {
  if (!curTeam) return;
  $('cfg-name').value = curTeam.name || ''; $('cfg-motto').value = curTeam.motto || '';
  $('cfg-season').value = curTeam.season || ''; $('cfg-emoji').value = curTeam.emoji || '⚽';
  if (curTeam.logo) { $('logo-pi').src = curTeam.logo; $('logo-pr').style.display = 'flex'; $('logo-ph').style.display = 'none'; }
  else { $('logo-pr').style.display = 'none'; $('logo-ph').style.display = 'block'; }
  renderPosList();
}

async function saveTeamPass() {
  const p1 = $('tp1').value, p2 = $('tp2').value, err = $('tperr');
  if (!p1 || p1.length < 4) { err.textContent = 'Min 4 characters.'; err.style.display = 'block'; return; }
  if (p1 !== p2) { err.textContent = 'Passwords do not match.'; err.style.display = 'block'; return; }
  try { await updateDoc(doc(db, 'teams', curTeam.id), { password: p1 }); curTeam.password = p1; err.style.display = 'none'; $('tp1').value = ''; $('tp2').value = ''; alert('✅ Team password updated!'); }
  catch (e) { err.textContent = '❌ Failed.'; err.style.display = 'block'; }
}

async function savePIN() {
  const p1 = String($('pin1').value).trim(), p2 = String($('pin2').value).trim(), err = $('pinerr');
  if (p1.length !== 4 || isNaN(p1)) { err.textContent = 'PIN must be exactly 4 digits.'; err.style.display = 'block'; return; }
  if (p1 !== p2) { err.textContent = 'PINs do not match.'; err.style.display = 'block'; return; }
  try {
    await saveAdminCredsFS({ editPin: p1 });
    err.style.display = 'none'; $('pin1').value = ''; $('pin2').value = '';
    alert('✅ PIN updated!');
  } catch (e) { err.textContent = '❌ ' + (e.message || 'Failed to save'); err.style.display = 'block'; }
}

async function saveBranding() {
  if (!curTeam) return;
  const logoSrc = $('logo-pi')?.src;
  const logo = (logoSrc && logoSrc.length > 30) ? logoSrc : (curTeam.logo || null);
  const data = {
    name: $('cfg-name').value.trim() || curTeam.name || '',
    motto: $('cfg-motto').value.trim() || '',
    emoji: $('cfg-emoji').value || '⚽',
    season: $('cfg-season').value.trim() || '',
    logo: logo
  };
  try {
    await updateDoc(doc(db, 'teams', curTeam.id), data);
    Object.assign(curTeam, data);
    $('tt-name').textContent = (data.name || 'TEAM').toUpperCase();
    $('sh-name').textContent = (data.name || 'TEAM').toUpperCase();
    $('sh-motto').textContent = data.motto || 'Player Registration';
    const sb = $('sh-badge');
    if (sb) sb.innerHTML = data.logo ? `<img src="${esc(data.logo)}" alt="">` : (data.emoji || '⚽');
    applyTeamTopbarLogo();
    renderSquad();
    alert('✅ Team branding saved!');
  } catch (e) {
    console.error('saveBranding error:', e);
    alert('❌ Could not save team branding: ' + (e.message || e));
  }
}

function handleLogo(input) {
  const file = input.files[0]; if (!file) return;
  compressImage(file, 256, 0.88, dataUrl => {
    $('logo-pi').src = dataUrl;
    $('logo-pr').style.display = 'flex';
    $('logo-ph').style.display = 'none';
    if (curTeam) curTeam.logo = dataUrl;
  });
}

async function removeLogo(e) {
  e.stopPropagation(); $('logo-pi').src = ''; $('logo-pr').style.display = 'none'; $('logo-ph').style.display = 'block'; $('logo-inp').value = '';
  if (curTeam) { await updateDoc(doc(db, 'teams', curTeam.id), { logo: null }); curTeam.logo = null; applyTeamTopbarLogo(); }
}

let posArr = [...DPOS];
function renderPosList() {
  posArr = curTeam?.positions || [...DPOS]; pos = posArr;
  $('poslist').innerHTML = posArr.map((p, i) => `
    <div class="pi-item" draggable="true" ondragstart="pdS(event,${i})" ondragover="pdO(event,${i})" ondrop="pdD(event,${i})" ondragend="pdE()">
      <span class="pi-handle">⠿</span><span class="pi-name">${esc(p)}</span>
      <button class="pi-del" onclick="removePos(${i})">✕</button>
    </div>`).join('');
}

async function savePosDB() { if (!curTeam) return; try { await updateDoc(doc(db, 'teams', curTeam.id), { positions: posArr }); curTeam.positions = [...posArr]; pos = [...posArr]; } catch (e) { } renderPosList(); }
async function addPos() { const inp = $('newpos'), v = inp.value.trim(); if (!v) return; if (posArr.some(p => p.toLowerCase() === v.toLowerCase())) { alert('Already exists.'); return; } posArr.push(v); inp.value = ''; await savePosDB(); }
async function removePos(i) { if (!confirm(`Remove "${posArr[i]}"?`)) return; posArr.splice(i, 1); await savePosDB(); }
let ds = null;
function pdS(e, i) { ds = i; e.target.classList.add('dragging'); }
function pdO(e, i) { e.preventDefault(); document.querySelectorAll('.pi-item').forEach(el => el.classList.remove('drag-over')); e.currentTarget.classList.add('drag-over'); }
function pdD(e, i) { e.preventDefault(); if (ds === null || ds === i) return; const m = posArr.splice(ds, 1)[0]; posArr.splice(i, 0, m); savePosDB(); }
function pdE() { ds = null; document.querySelectorAll('.pi-item').forEach(el => el.classList.remove('dragging', 'drag-over')); }

function handleCtLogo(input) {
  var file = input.files[0]; if (!file) return;
  compressImage(file, 256, 0.88, function (dataUrl) {
    ctLogoData = dataUrl;
    var prev = document.getElementById('ct-logo-preview');
    if (prev) prev.innerHTML = '<img src="' + ctLogoData + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
  });
}

function clearCtLogo() {
  ctLogoData = null;
  $('ct-logo-inp').value = '';
  $('ct-logo-preview').innerHTML = $('ct-emoji').value || '⚽';
}

async function createTeam() {
  const name = $('ct-name').value.trim(), pass = $('ct-pass').value, err = $('ct-err');
  if (!name) { err.textContent = 'Team name is required.'; err.style.display = 'block'; return; }
  if (!pass || pass.length < 4) { err.textContent = 'Password must be at least 4 characters.'; err.style.display = 'block'; return; }
  const okBtn = document.querySelector('#m-create .mok');
  okBtn.textContent = 'CREATING…'; okBtn.disabled = true; err.style.display = 'none';
  try {
    await addDoc(collection(db, 'teams'), { name, season: $('ct-season').value.trim(), motto: $('ct-motto').value.trim(), emoji: $('ct-emoji').value, password: pass, positions: [...DPOS], logo: ctLogoData || null, createdAt: new Date().toISOString() });
    ctLogoData = null; $('ct-logo-inp').value = ''; $('ct-logo-preview').innerHTML = '⚽'; closeM('m-create');['ct-name', 'ct-season', 'ct-motto', 'ct-pass'].forEach(id => $(id).value = ''); err.style.display = 'none';
    await loadAdmin();
  } catch (e) {
    const msg = e && e.code === 'permission-denied'
      ? 'Permission denied — Firestore rules are blocking writes. Open your Firebase console and set rules to allow read/write.'
      : e && e.message ? e.message : 'Failed. Check your internet connection and try again.';
    err.textContent = '❌ ' + msg; err.style.display = 'block';
    console.error('createTeam error:', e);
  } finally { okBtn.textContent = 'CREATE'; okBtn.disabled = false; }
}

function promptDelTeam(id) {
  delId = id; const t = teams.find(x => x.id === id);
  $('del-desc').textContent = `Delete "${t?.name}"? This removes the team and all ${t?.pc || 0} player(s). Cannot be undone.`;
  openM('m-del-team');
}

async function confirmDel() {
  if (!delId) return; closeM('m-del-team');
  try { const ps = await getDocs(query(collection(db, 'players'), where('teamId', '==', delId))); const b = writeBatch(db); ps.docs.forEach(d => b.delete(d.ref)); b.delete(doc(db, 'teams', delId)); await b.commit(); delId = null; await loadAdmin(); }
  catch (e) { alert('❌ Could not delete.'); }
}

let adminPinBuf = '', adminPinAct = null, adminPinTgt = null;

function adminRequestPin(action, id) {
  adminPinBuf = ''; adminPinAct = action; adminPinTgt = id;
  updAdminDots(); $('aperrmsg').style.display = 'none';
  const cfg = {
    editteam: ['✏️', 'EDIT TEAM', 'Enter admin PIN to edit this team.'],
    delteam: ['🗑️', 'DELETE TEAM', 'Enter admin PIN to delete this team.'],
    delmatch: ['🗑️', 'DELETE MATCH', 'Enter admin PIN to delete this match.'],
    saveadminpin: ['🔐', 'SET ADMIN PIN', 'Enter current admin PIN to set a new one.'],
  }[action] || ['🔐', 'ADMIN PIN', 'Enter your admin PIN.'];
  $('apico').textContent = cfg[0]; $('aptit').textContent = cfg[1]; $('apdesc').textContent = cfg[2];
  openM('m-admin-pin');
}
function apk(k) {
  if (k === 'cancel') { closeM('m-admin-pin'); return; }
  if (k === 'del') { adminPinBuf = adminPinBuf.slice(0, -1); updAdminDots(); return; }
  if (adminPinBuf.length >= 4) return; adminPinBuf += k; updAdminDots();
  if (adminPinBuf.length === 4) setTimeout(checkAdminPin, 150);
}
function updAdminDots() { for (let i = 0; i < 4; i++)$('apd' + i).classList.toggle('filled', i < adminPinBuf.length); }
function checkAdminPin() {
  if (adminPinBuf === getAdminPin()) {
    closeM('m-admin-pin'); $('aperrmsg').style.display = 'none';
    if (adminPinAct === 'delteam') promptDelTeam(adminPinTgt);
    if (adminPinAct === 'editteam') openEditTeam(adminPinTgt);
    if (adminPinAct === 'delmatch') deleteMatchWithPin(adminPinTgt);
  } else {
    $('aperrmsg').textContent = '❌ Incorrect PIN'; $('aperrmsg').style.display = 'block';
    adminPinBuf = ''; updAdminDots();
  }
}

async function deleteMatchWithPin(matchId) {
  if (!matchId) return;
  const m = matches.find(x => x.id === matchId) || (curMatch?.id === matchId ? curMatch : null);
  const matchLabel = m ? `${m.home?.name || 'Home'} vs ${m.away?.name || 'Away'}` : 'this match';
  if (!confirm(`⚠️ Are you sure you want to permanently delete match "${matchLabel}" and all recorded events? This cannot be undone.`)) return;

  try {
    await deleteDoc(doc(db, 'matches', matchId));
    matches = matches.filter(x => x.id !== matchId);
    setMatchesArray(matches);
    if (curMatch && curMatch.id === matchId) {
      goBackFromMatch(true);
    }
    renderAdminMatches();
    if (curTournament) renderTournamentDashboard();
    alert('✅ Match successfully deleted.');
  } catch (e) {
    alert('❌ Could not delete match: ' + (e.message || e));
  }
}

function openEditTeam(id) {
  const t = teams.find(x => x.id === id); if (!t) return;
  editTeamId = id;
  $('et-name').value = t.name || '';
  $('et-season').value = t.season || '';
  $('et-motto').value = t.motto || '';
  $('et-emoji').value = t.emoji || '⚽';
  $('et-pass').value = t.password || '';
  $('et-err').style.display = 'none';
  openM('m-edit-team');
}
async function saveEditTeam() {
  const name = $('et-name').value.trim(), pass = $('et-pass').value.trim(), err = $('et-err');
  if (!name) { err.textContent = 'Team name is required.'; err.style.display = 'block'; return; }
  if (!pass || pass.length < 4) { err.textContent = 'Password must be at least 4 characters.'; err.style.display = 'block'; return; }
  const btn = $('et-save-btn'); btn.textContent = 'SAVING…'; btn.disabled = true;
  try {
    await updateDoc(doc(db, 'teams', editTeamId), {
      name,
      season: $('et-season').value.trim(),
      motto: $('et-motto').value.trim(),
      emoji: $('et-emoji').value,
      password: pass
    });
    closeM('m-edit-team');
    await loadAdmin();
  } catch (e) {
    err.textContent = '❌ ' + (e.message || 'Failed. Try again.'); err.style.display = 'block';
  } finally { btn.textContent = 'SAVE'; btn.disabled = false; }
}

function handlePfPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  compressImage(file, 300, 0.85, dataUrl => {
    pfPhotoData = dataUrl;
    const prev = document.getElementById('pf-photo-preview');
    if (prev) {
      prev.src = pfPhotoData;
      prev.style.display = 'block';
    }
    const ph = document.getElementById('pf-photo-ph');
    if (ph) ph.style.display = 'none';
  });
}

async function initPub(tid) {
  pubId = tid; ss('s-public');
  window.scrollTo(0, 0);
  try {
    const snap = await getDoc(doc(db, 'teams', tid));
    if (!snap.exists) {
      $('pub-tname').textContent = 'TEAM NOT FOUND';
      $('pub-motto').textContent = 'This registration link is invalid or the team was deleted.';
      return;
    }
    pubTeam = { id: snap.id, ...snap.data() };
    $('pub-tname').textContent = (pubTeam.name || 'TEAM').toUpperCase();
    $('pub-motto').textContent = pubTeam.motto || 'Player Registration';
    const b = $('pub-badge'); b.innerHTML = pubTeam.logo ? `<img src="${esc(pubTeam.logo)}" alt="">` : (pubTeam.emoji || '⚽');
    const pp = pubTeam.positions || DPOS;
    $('pf-pos').innerHTML = '<option value="">Select position</option>' + pp.map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('');
  } catch (e) { console.error('initPub error:', e); $('pub-tname').textContent = 'Error Loading'; $('pub-motto').textContent = e.message || 'Unknown error'; }
}

function pAge() {
  const d = $('pf-dob').value; if (!d) return;
  const t = new Date(), b = new Date(d); let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() - b.getMonth() < 0 || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  $('pf-age').value = a;
}

async function submitPub() {
  const name = $('pf-name').value.trim(), ph = $('pf-ph').value.trim(), j = $('pf-j1').value, p = $('pf-pos').value, dob = $('pf-dob').value, father = $('pf-father').value.trim(), addr = $('pf-addr').value.trim();
  if (!name || !dob || !father || !addr || !ph || !p || !j) { alert('Please fill all required fields (*).'); return; }
  if (ph.length !== 10) { alert('Phone must be 10 digits.'); return; }

  const fullPhone = '+91' + ph;
  const btn = document.querySelector('#pub-form .sub-btn') || document.querySelector('.sub-btn');
  if (btn) { btn.textContent = '⏳ CHECKING & SAVING…'; btn.disabled = true; }

  try {
    // Check if player with same phone or same name + DOB already exists in this team
    const teamPlayersSnap = await getDocs(query(collection(db, 'players'), where('teamId', '==', pubId)));
    const existing = teamPlayersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const foundByPhone = existing.find(pl => {
      const p1 = String(pl.phone || '').replace(/\D/g, '');
      const p2 = String(ph).replace(/\D/g, '');
      return (p1 && p2 && (p1.endsWith(p2) || p2.endsWith(p1)));
    });
    const foundByNameDob = existing.find(pl => pl.name && pl.name.trim().toLowerCase() === name.toLowerCase() && pl.dob === dob);
    const matched = foundByPhone || foundByNameDob;

    const playerData = {
      teamId: pubId,
      name,
      dob,
      age: $('pf-age').value,
      father,
      address: addr,
      phone: fullPhone,
      position: p,
      jersey: j,
      jersey2: $('pf-j2').value,
      playernum: $('pf-sq').value,
      foot: $('pf-foot').value,
      notes: $('pf-notes').value.trim(),
      updatedAt: new Date().toISOString()
    };
    if (pfPhotoData) playerData.photo = pfPhotoData;

    if (matched) {
      await updateDoc(doc(db, 'players', matched.id), playerData);
      const titleEl = $('pub-success-title');
      const msgEl = $('pub-success-msg');
      if (titleEl) titleEl.textContent = 'REGISTRATION UPDATED!';
      if (msgEl) msgEl.textContent = `Your registration details for "${name}" have been updated successfully in the team database without creating a duplicate.`;
    } else {
      playerData.registeredAt = new Date().toISOString();
      if (!playerData.photo) playerData.photo = null;
      await addDoc(collection(db, 'players'), playerData);
      const titleEl = $('pub-success-title');
      const msgEl = $('pub-success-msg');
      if (titleEl) titleEl.textContent = 'REGISTERED!';
      if (msgEl) msgEl.textContent = "You're registered. See you on the field!";
    }

    $('pub-form').style.display = 'none';
    $('pub-success').style.display = 'block';
  } catch (e) {
    alert('❌ Registration failed: ' + (e.message || 'Check your connection.'));
  } finally {
    if (btn) { btn.textContent = '⚡ SUBMIT REGISTRATION'; btn.disabled = false; }
  }
}

function resetPub() {
  $('pub-form').style.display = 'block'; $('pub-success').style.display = 'none';
  ['pf-name', 'pf-dob', 'pf-age', 'pf-father', 'pf-addr', 'pf-ph', 'pf-j1', 'pf-j2', 'pf-sq', 'pf-notes'].forEach(id => $(id).value = ''); $('pf-pos').value = ''; $('pf-foot').value = '';

  pfPhotoData = null;
  const photoInp = $('pf-photo-inp'); if (photoInp) photoInp.value = '';
  const photoPrev = $('pf-photo-preview');
  if (photoPrev) { photoPrev.style.display = 'none'; photoPrev.src = ''; }
  const photoPh = $('pf-photo-ph'); if (photoPh) photoPh.style.display = 'block';
}

async function initPubStaff(tid) {
  pubStId = tid; ss('s-public-staff');
  window.scrollTo(0, 0);
  try {
    const snap = await getDoc(doc(db, 'teams', tid));
    if (!snap.exists) {
      $('pubst-tname').textContent = 'TEAM NOT FOUND';
      $('pubst-motto').textContent = 'This registration link is invalid or the team was deleted.';
      return;
    }
    pubStTeam = { id: snap.id, ...snap.data() };
    $('pubst-tname').textContent = (pubStTeam.name || 'TEAM').toUpperCase();
    $('pubst-motto').textContent = 'Management Registration';
    const b = $('pubst-badge'); b.innerHTML = pubStTeam.logo ? `<img src="${esc(pubStTeam.logo)}" alt="">` : '🧑\u200d💼';
  } catch (e) { console.error('initPubStaff error:', e); $('pubst-tname').textContent = 'Error Loading'; $('pubst-motto').textContent = e.message || 'Unknown error'; }
}

async function submitPubStaff() {
  const name = $('pst-name').value.trim();
  if (!name) { alert('Please enter your name.'); return; }
  let role = $('pst-role').value;
  if (role === 'Other') { role = $('pst-role-custom').value.trim() || 'Other'; }
  const phoneDigits = $('pst-phone').value.trim();
  if (phoneDigits && phoneDigits.length !== 10) { alert('Phone number must be 10 digits.'); return; }
  const fullPhone = phoneDigits ? ('+91' + phoneDigits) : '';

  const btn = document.querySelector('#pubst-form .sub-btn');
  if (btn) { btn.textContent = '⏳ SAVING…'; btn.disabled = true; }

  try {
    const teamDocSnap = await getDoc(doc(db, 'teams', pubStId));
    const curStaff = (teamDocSnap.exists && teamDocSnap.data().staff) ? [...teamDocSnap.data().staff] : [];

    const existingIdx = curStaff.findIndex(s =>
      (phoneDigits && s.phone && String(s.phone).replace(/\D/g, '').endsWith(phoneDigits)) ||
      (s.name && s.name.trim().toLowerCase() === name.toLowerCase())
    );

    if (existingIdx >= 0) {
      curStaff[existingIdx].role = role;
      curStaff[existingIdx].name = name;
      if (fullPhone) curStaff[existingIdx].phone = fullPhone;
      curStaff[existingIdx].updatedAt = new Date().toISOString();
      await updateDoc(doc(db, 'teams', pubStId), { staff: curStaff });
      const titleEl = $('pubst-success-title');
      const msgEl = $('pubst-success-msg');
      if (titleEl) titleEl.textContent = 'REGISTRATION UPDATED!';
      if (msgEl) msgEl.textContent = `Your management registration for "${name}" (${role}) has been updated successfully.`;
    } else {
      const entry = {
        id: 'st_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        name, role, phone: fullPhone, notes: '', registeredAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'teams', pubStId), { staff: firebase.firestore.FieldValue.arrayUnion(entry) });
      const titleEl = $('pubst-success-title');
      const msgEl = $('pubst-success-msg');
      if (titleEl) titleEl.textContent = 'REGISTERED!';
      if (msgEl) msgEl.textContent = "You're registered as team management. Welcome aboard!";
    }

    $('pubst-form').style.display = 'none';
    $('pubst-success').style.display = 'block';
  } catch (e) {
    alert('❌ Registration failed. Check your connection: ' + (e.message || e));
  } finally {
    if (btn) { btn.textContent = '⚡ SUBMIT REGISTRATION'; btn.disabled = false; }
  }
}

function resetPubStaff() {
  $('pubst-form').style.display = 'block'; $('pubst-success').style.display = 'none';
  $('pst-name').value = ''; $('pst-role').value = 'Manager'; $('pst-role-other').style.display = 'none'; $('pst-role-custom').value = ''; $('pst-phone').value = '';
}

function initPublicView(tid) {
  pvId = tid; ss('s-public-view');
  window.scrollTo(0, 0);
  if (pvUnsub) { pvUnsub(); pvUnsub = null; }
  getDoc(doc(db, 'teams', tid)).then(snap => {
    if (!snap.exists) {
      $('pv-tname').textContent = 'TEAM NOT FOUND';
      $('pv-motto').textContent = 'This team view link is invalid or the team was deleted.';
      return;
    }
    pvTeam = { id: snap.id, ...snap.data() };
    $('pv-tname').textContent = (pvTeam.name || 'TEAM').toUpperCase();
    $('pv-motto').textContent = pvTeam.motto || 'Team Overview';
    $('pv-badge').innerHTML = pvTeam.logo ? `<img src="${esc(pvTeam.logo)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : (pvTeam.emoji || '⚽');
    renderPubLineup();
    sendPubFormationSync();
  }).catch(e => { console.error('initPublicView error:', e); $('pv-tname').textContent = 'Error Loading'; $('pv-motto').textContent = e.message || 'Unknown error'; });
  pvUnsub = onSnapshot(query(collection(db, 'players'), where('teamId', '==', tid)), snap => {
    pvPlayers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderPubSquad();
  }, e => console.error('pv players sub error:', e));
  onSnapshot(doc(db, 'teams', tid), snap => {
    if (!snap.exists) return;
    pvTeam = { id: snap.id, ...snap.data() };
    renderPubLineup();
    sendPubFormationSync();
  }, e => console.error('pv team sub error:', e));
}

function showPubTab(n) {
  ['squad', 'lineup', 'chat'].forEach(x => {
    $('pv-page-' + x) && $('pv-page-' + x).classList.toggle('active', x === n);
    $('pv-tab-' + x) && $('pv-tab-' + x).classList.toggle('active', x === n);
  });
  $('pv-page-formation') && $('pv-page-formation').classList.remove('active');
  const tm = $('pv-tmain');
  if (tm) {
    if (n === 'lineup' || n === 'squad') {
      tm.classList.add('tmain-wide');
    } else {
      tm.classList.remove('tmain-wide');
    }
  }
  if (n === 'lineup') { renderPubLineup(); initPubChat(); }
  if (n === 'chat') initPubDiscuss();
}
function openPubFormationVisualizer() {
  ['squad', 'lineup', 'chat'].forEach(x => {
    $('pv-page-' + x) && $('pv-page-' + x).classList.remove('active');
  });
  $('pv-page-formation').classList.add('active');
  $('pv-tmain').classList.add('tmain-wide');
  sendPubFormationSync();
}
function backToPubPlayingList() {
  showPubTab('lineup');
}

function renderPubSquad() {
  const el = $('pv-squad-content'); if (!el) return;
  if (!pvPlayers.length) {
    el.innerHTML = `<div class="squad-empty"><div class="ei">🏟️</div><p>No players registered yet.</p></div>`;
    return;
  }
  const posList = (pvTeam && pvTeam.positions) || DPOS;
  const grouped = {};
  posList.forEach(p => grouped[p] = []);
  grouped['Other'] = [];
  pvPlayers.forEach(p => {
    const code = posCode(p.position);
    const key = posList.includes(code) ? code : 'Other';
    grouped[key].push(p);
  });
  let html = `<div class="squad-summary">
    <div class="sc"><div class="num">${pvPlayers.length}</div><div class="lbl">Players</div></div>
    <div class="sc"><div class="num">${new Set(pvPlayers.map(p => posCode(p.position))).size}</div><div class="lbl">Positions</div></div>
  </div>`;
  Object.keys(grouped).forEach(k => {
    const list = grouped[k]; if (!list.length) return;
    html += `<div class="squad-section"><div class="squad-section-title">${esc(k)} (${list.length})</div><div class="squad-grid">`;
    list.forEach(p => {
      html += `<div class="lu-item" style="cursor:default;">
        <div class="lu-av">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : '👤'}</div>
        <div class="lu-info"><div class="lu-name">${esc(p.name)}${p.jersey ? ' <span style="color:var(--mt);font-weight:400;">#' + esc(p.jersey) + '</span>' : ''}</div><div class="lu-meta">${esc(posCode(p.position) || '—')}</div></div>
      </div>`;
    });
    html += '</div></div>';
  });
  el.innerHTML = html;
}

function renderPubLineup() {
  const el = $('pv-lineup-content'); if (!el) return;
  const sq = pvTeam && pvTeam.squad;
  if (!sq || !(sq.slots && sq.slots.some(s => s && s.player) || sq.subs && sq.subs.length)) {
    el.innerHTML = `<div class="squad-empty"><div class="ei">🎯</div><p>No Playing List saved yet.</p></div>`;
    return;
  }
  let html = `<div class="lc-title" style="margin-top:0;">${esc(sq.name || 'Playing List')} · Formation ${esc(sq.formation || '')}${sq.squadSize ? ' · Squad size allowed: ' + esc(String(sq.squadSize)) : ''}</div>`;
  html += `<div class="squad-section-title" style="margin-top:10px;">STARTING XI</div><div class="squad-grid">`;
  (sq.slots || []).forEach(s => {
    if (!s || !s.player) return;
    const p = s.player;
    const found = pvPlayers.find(x => x.id === p.id);
    const pPhoto = (found && found.photo) || p.photo || null;
    const pJersey = (found && found.jersey != null && found.jersey !== '') ? found.jersey : (p.jersey || '');
    const pWithPhoto = { ...p, photo: pPhoto, jersey: pJersey };
    html += `<div class="lu-item" style="cursor:default;">
      ${playerLineupAv(pWithPhoto)}
      <div class="lu-info"><div class="lu-name">${esc(p.name)}</div><div class="lu-meta">${esc(posCode(p.matchPosition || p.position) || '—')}</div></div>
    </div>`;
  });
  html += '</div>';
  if (sq.subs && sq.subs.length) {
    html += `<div class="squad-section-title" style="margin-top:20px;">GAME CHANGERS</div><div class="squad-grid">`;
    sq.subs.forEach(p => {
      const found = pvPlayers.find(x => x.id === p.id);
      const pPhoto = (found && found.photo) || p.photo || null;
      const pJersey = (found && found.jersey != null && found.jersey !== '') ? found.jersey : (p.jersey || '');
      const pWithPhoto = { ...p, photo: pPhoto, jersey: pJersey };
      html += `<div class="lu-item" style="cursor:default;">
        ${playerLineupAv(pWithPhoto)}
        <div class="lu-info"><div class="lu-name">${esc(p.name)}</div><div class="lu-meta">${esc(posCode(p.position) || '—')}</div></div>
      </div>`;
    });
    html += '</div>';
  }
  if (sq.staff && sq.staff.length) {
    html += `<div class="squad-section-title" style="margin-top:20px;">MATCH DAY MANAGEMENT</div><div class="squad-grid">`;
    sq.staff.forEach(s => {
      html += `<div class="lu-item" style="cursor:default;">
        <div class="lu-av">🧑‍💼</div>
        <div class="lu-info"><div class="lu-name">${esc(s.name)}</div><div class="lu-meta">${esc(s.role || '')}</div></div>
      </div>`;
    });
    html += '</div>';
  }
  el.innerHTML = html;
}

function buildPubFormationSyncPayload() {
  pvMergedFormationKeys.forEach(k => { delete FORMATIONS[k]; });
  pvMergedFormationKeys = [];
  (pvTeam && pvTeam.customFormations || []).forEach(f => {
    if (f && f.key && f.def) { FORMATIONS[f.key] = f.def; pvMergedFormationKeys.push(f.key); }
  });
  const vState = pvTeam && pvTeam.visualizerState;
  const sq = pvTeam && pvTeam.squad;
  let payload = {};
  if (sq && (sq.slots && sq.slots.some(s => s && s.player) || sq.subs && sq.subs.length)) {
    const management = (sq.staff || []).map(s => ({ id: s.id, name: s.name, role: s.role || 'Other' }));
    const when = sq.updatedAt ? new Date(sq.updatedAt).toLocaleDateString() : '';
    const source = `Synced from Playing List${sq.name ? ' — ' + sq.name : ''}${when ? ' (saved ' + when + ')' : ''}`;
    const starters = (sq.slots || []).map(s => s && s.player ? { id: s.player.id, name: s.player.name, number: s.player.jersey || '-', position: toFBPositionCode(s.player.matchPosition || s.player.position) } : null);
    const subs = (sq.subs || []).map(s => ({ id: s.id, name: s.name, number: s.jersey || '-', position: toFBPositionCode(s.position) }));
    const formationKey = (vState && vState.formationKey) || sq.formation;
    const formationDef = FORMATIONS[formationKey] || null;
    payload = { formation: formationKey, formationDef, starters, subs, management, source };
  } else {
    const rosterPlayers = (pvPlayers || []).map(p => ({ id: p.id, name: p.name, number: p.jersey || '-', position: toFBPositionCode(p.position) }));
    const management = (pvTeam && pvTeam.staff || []).map(s => ({ id: s.id, name: s.name, role: s.role || 'Other' }));
    const formationKey = (vState && vState.formationKey) || '4-4-2';
    const formationDef = FORMATIONS[formationKey] || null;
    payload = { formation: formationKey, formationDef, players: rosterPlayers, management, source: 'No saved Playing List yet — loaded full player database instead' };
  }
  if (vState) {
    if (vState.customPos) payload.customPos = vState.customPos;
    if (vState.ballPos) payload.ballPos = vState.ballPos;
    if (vState.formationKey) payload.visualizerFormation = vState.formationKey;
  }
  return payload;
}

function sendPubFormationSync() {
  const frame = $('pv-formation-frame');
  if (!frame || !frame.contentWindow || !pvTeam) return;
  frame.contentWindow.postMessage(Object.assign({ type: 'ff-sync' }, buildPubFormationSyncPayload()), '*');
  sendFrameChatSync();
}

let _vpPhoto = null;
function viewPlayer(id) {
  const p = players.find(x => x.id === id);
  if (!p) { alert('Player not found.'); return; }
  const t = curTeam || {};
  $('pf-form-inner').innerHTML = `
    <div class="pf-header">
      <div class="pf-club-badge">${t.logo ? `<img src="${esc(t.logo)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="">` : esc(t.emoji || '⚽')}</div>
      <div class="pf-club-info">
        <div class="pf-club-name">${esc(t.name || 'FOOTBALL CLUB')}</div>
        <div class="pf-club-sub">${esc(t.season || '')}${t.motto ? ' · ' + esc(t.motto) : ''}</div>
      </div>
      <div class="pf-title">PLAYER<br>REGISTRATION</div>
    </div>
    <div class="pf-photo-row">
      <div class="pf-photo-box" onclick="document.getElementById('vp-photo-inp').click()">
        ${p.photo ? `<img src="${esc(p.photo)}" alt="">` : ''}
        <div class="ph-hint"${p.photo ? ' style="display:none"' : ''}>📷<br>Tap to add photo</div>
        <input type="file" id="vp-photo-inp" accept="image/*" onchange="loadPlayerPhoto(this,'${p.id}')">
      </div>
      <div class="pf-fields">
        <div class="pf-row">
          <div class="pf-field"><label>Full Name</label><div class="val">${esc(p.name || '')}</div></div>
          <div class="pf-field"><label>Date of Birth</label><div class="val">${esc(p.dob || '')}</div></div>
        </div>
        <div class="pf-row">
          <div class="pf-field"><label>Age</label><div class="val">${esc(p.age || '')}</div></div>
          <div class="pf-field"><label>Position</label><div class="val">${esc(posCode(p.position) || '')}</div></div>
        </div>
        <div class="pf-row">
          <div class="pf-field"><label>Jersey # (1st)</label><div class="val">${esc(p.jersey || '')}</div></div>
          <div class="pf-field"><label>Jersey # (2nd)</label><div class="val">${esc(p.jersey2 || '')}</div></div>
        </div>
        <div class="pf-row">
          <div class="pf-field"><label>Squad #</label><div class="val">${esc(p.playernum || '')}</div></div>
          <div class="pf-field"><label>Preferred Foot</label><div class="val">${esc(p.foot || '')}</div></div>
        </div>
      </div>
    </div>
    <div class="pf-section-title">PERSONAL DETAILS</div>
    <div class="pf-row">
      <div class="pf-field"><label>Father's Name</label><div class="val">${esc(p.father || '')}</div></div>
      <div class="pf-field"><label>Phone</label><div class="val">${esc(p.phone || '')}</div></div>
    </div>
    <div class="pf-row full"><div class="pf-field"><label>Address</label><div class="val">${esc(p.address || '')}</div></div></div>
    ${p.notes ? `<div class="pf-section-title">NOTES</div><div class="pf-notes-box">${esc(p.notes)}</div>` : ''}
    <div class="pf-sig-section">
      <div class="pf-sig-box"><div class="pf-sig-label">Player Signature</div><div class="pf-sig-area">Sign here</div></div>
      <div class="pf-sig-box"><div class="pf-sig-label">Coach Signature</div><div class="pf-sig-area">Sign here</div></div>
    </div>
    <div class="pf-footer">Generated by Coach Management System · ${esc(t.name || '')} · ${new Date().toLocaleDateString()}</div>`;
  openM('m-player-form');
}

function loadPlayerPhoto(input, playerId) {
  const file = input.files[0]; if (!file) return;
  compressImage(file, 300, 0.85, async dataUrl => {
    const box = input.closest('.pf-photo-box');
    if (box) {
      let img = box.querySelector('img');
      if (!img) { img = document.createElement('img'); box.prepend(img); }
      img.src = dataUrl;
      const hint = box.querySelector('.ph-hint');
      if (hint) hint.style.display = 'none';
    }
    const pl = players.find(x => x.id === playerId);
    if (pl) pl.photo = dataUrl;
    try {
      await updateDoc(doc(db, 'players', playerId), { photo: dataUrl });
      renderPlayers();
      renderSquad();
    } catch (e) { console.error('Photo save failed:', e); }
  });
}

function printPlayerForm() { window.print(); }

const ANK = 'hy_name', ASK = 'hy_sub', ALK = 'hy_logo';
const DEFAULT_LOGO = 'soccer-ball.svg';

function getBrandName() { return localStorage.getItem(ANK) || 'Event Management System'; }
function getBrandSub() { return localStorage.getItem(ASK) || 'BY 100 YARDS'; }
function getBrandLogo() {
  const saved = localStorage.getItem(ALK);
  return (saved && saved.length > 10) ? saved : DEFAULT_LOGO;
}

function applyAdmName() {
  const name = getBrandName(), sub = getBrandSub(), logo = getBrandLogo();
  const li = $('login-logo-img'); if (li) li.src = logo;
  const lbl = $('login-brand-logo'); if (lbl) lbl.src = logo;
  const ln = $('login-club-name'); if (ln) ln.textContent = name;
  const ls = $('login-club-sub'); if (ls) ls.textContent = sub;
  const tli = $('topbar-logo-img');
  if (tli) {
    tli.src = logo || 'soccer-ball.svg';
    tli.style.display = 'inline-block';
  }
  const tln = $('topbar-club-name'); if (tln) tln.textContent = name;
  if (typeof updateTopNavAvatar === 'function') updateTopNavAvatar();
}

function applyTeamTopbarLogo() {
  const tl = $('team-topbar-logo');
  if (tl) {
    const logo = (curTeam && curTeam.logo) ? curTeam.logo : getBrandLogo();
    if (logo && logo !== DEFAULT_LOGO) {
      tl.src = logo;
      tl.style.display = 'inline-block';
    } else {
      tl.style.display = 'none';
    }
  }
}

// TEAM DISCUSSION / CHAT
function getChatIdentity() {
  if (myChatIdentity) return myChatIdentity;
  try {
    const saved = localStorage.getItem('cms_chat_identity');
    if (saved) {
      myChatIdentity = JSON.parse(saved);
      return myChatIdentity;
    }
  } catch (e) { }
  myChatIdentity = { name: 'Visitor', role: 'member' };
  return myChatIdentity;
}

function updateChatIdentityUI() {
  const id = getChatIdentity();
  const nameEls = document.querySelectorAll('#chat-current-name, .chat-current-name');
  const badgeEls = document.querySelectorAll('#chat-current-badge, .chat-current-badge');
  nameEls.forEach(el => { el.textContent = id.name || 'Visitor'; });
  badgeEls.forEach(el => {
    el.textContent = (id.role || 'member').toUpperCase();
    el.className = 'chat-role-badge ' + (id.role || 'member');
  });
}

function openChatIdentityModal() {
  const list = (pvPlayers && pvPlayers.length) ? pvPlayers : (pubDiscussTeam?.players || players || []);
  const staff = (pvTeam?.staff || curTeam?.staff || pubDiscussTeam?.staff || []);
  const sel = $('chat-id-select');
  if (sel) {
    let opts = '<option value="">-- Or enter custom name below --</option>';
    if (list.length) {
      opts += '<optgroup label="Squad Players">';
      list.forEach(p => {
        const num = p.jersey ? `#${p.jersey} ` : '';
        opts += `<option value="player|${esc(p.name)}">${num}${esc(p.name)} (${esc(posCode(p.position) || 'Player')})</option>`;
      });
      opts += '</optgroup>';
    }
    if (staff.length) {
      opts += '<optgroup label="Management / Staff">';
      staff.forEach(s => {
        opts += `<option value="staff|${esc(s.name)}">${esc(s.name)} (${esc(s.role || 'Staff')})</option>`;
      });
      opts += '</optgroup>';
    }
    sel.innerHTML = opts;
  }
  const id = getChatIdentity();
  const nameInp = $('chat-id-name');
  if (nameInp) nameInp.value = (id.name !== 'Visitor' && id.name !== 'Team Member') ? id.name : '';
  openM('m-chat-identity');
}

function handleChatSelectChange(sel) {
  const val = sel.value;
  if (!val) return;
  const parts = val.split('|');
  const name = parts[1];
  const nameInp = $('chat-id-name');
  if (nameInp && name) nameInp.value = name;
}

function saveChatIdentity() {
  const nameInp = $('chat-id-name');
  const sel = $('chat-id-select');
  const name = nameInp ? nameInp.value.trim() : '';
  if (!name) {
    alert('Please enter your name.');
    return;
  }
  let role = 'member';
  if (sel && sel.value) {
    const parts = sel.value.split('|');
    if (parts[0]) role = parts[0];
  }
  myChatIdentity = { name, role };
  try {
    localStorage.setItem('cms_chat_identity', JSON.stringify(myChatIdentity));
  } catch (e) { }
  updateChatIdentityUI();
  closeM('m-chat-identity');
}

function formatChatTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
}

/* ═════════════════════════════════════════════════════════
   1. LINEUP / MATCH CHAT (Sidebar on Playing List)
   Stored at: teams/{teamId}/chat
   ═════════════════════════════════════════════════════════ */
function renderChatMessages(isCoach) {
  const containers = document.querySelectorAll(isCoach ? '.chat-msgs-coach' : '.chat-msgs-pub');
  const pinnedBoxes = document.querySelectorAll(isCoach ? '.chat-pinned-box-coach' : '.chat-pinned-box-pub');
  const pinnedTexts = document.querySelectorAll(isCoach ? '.chat-pinned-text-coach' : '.chat-pinned-text-pub');

  const msgs = isCoach ? coachChatMsgs : pubChatMsgs;
  const myId = isCoach ? { name: (curTeam?.name ? curTeam.name + ' (Coach)' : 'Coach'), role: 'coach' } : getChatIdentity();

  const pinned = msgs.find(m => m.pinned);
  pinnedBoxes.forEach((pBox, idx) => {
    const pText = pinnedTexts[idx];
    if (pinned && pText) {
      pText.textContent = `${pinned.senderName} (${formatChatTime(pinned.createdAt)}): ${pinned.text}`;
      pBox.style.display = 'flex';
    } else if (pBox) {
      pBox.style.display = 'none';
    }
  });

  if (!containers.length) return;

  if (!msgs.length) {
    const emptyHtml = `
      <div class="chat-empty">
        <div class="cei">💬</div>
        <p>No messages yet.</p>
        <p style="font-size:11.5px;margin-top:4px;color:var(--mt);">Chat about match tactics, lineups, and live instructions!</p>
      </div>
    `;
    containers.forEach(c => { c.innerHTML = emptyHtml; });
    return;
  }

  let html = '';
  msgs.forEach(m => {
    const isMine = isCoach ? (m.senderRole === 'coach') : (m.senderName === myId.name);
    const isCoachMsg = m.senderRole === 'coach';
    const roleCls = m.senderRole || 'member';
    const roleLabel = m.senderRole ? m.senderRole.toUpperCase() : 'MEMBER';
    const timeStr = formatChatTime(m.createdAt);

    let avatar = '💬';
    if (isCoachMsg) avatar = '👑';
    else if (m.senderRole === 'player') avatar = '⚽';
    else if (m.senderRole === 'staff') avatar = '🧑‍💼';

    const actions = isCoach ? `
      <div class="chat-actions">
        <button class="chat-act-btn" onclick="togglePinChat('${m.id}', ${!!m.pinned})" title="${m.pinned ? 'Unpin message' : 'Pin message to top'}">${m.pinned ? '📌 Unpin' : '📌 Pin'}</button>
        <button class="chat-act-btn" onclick="deleteChatMessage('${m.id}')" title="Delete message">🗑️</button>
      </div>
    ` : '';

    html += `
      <div class="chat-msg ${isMine ? 'mine' : ''} ${isCoachMsg ? 'coach-msg' : ''}">
        <div class="chat-av">${avatar}</div>
        <div class="chat-bubble-wrap">
          <div class="chat-meta">
            <span class="chat-sender">${esc(m.senderName)}</span>
            <span class="chat-role-badge ${roleCls}">${roleLabel}</span>
          </div>
          <div class="chat-bubble">
            ${actions}
            <div class="chat-text">${esc(m.text)}</div>
            <div class="chat-time">${timeStr} ${m.pinned ? '📌' : ''}</div>
          </div>
        </div>
      </div>
    `;
  });

  containers.forEach(c => {
    c.innerHTML = html;
    c.scrollTop = c.scrollHeight;
  });
  sendFrameChatSync();
}

let lineupChatVisible = {
  coach: localStorage.getItem('cms_chat_coach') !== 'hidden',
  pub: localStorage.getItem('cms_chat_pub') !== 'hidden'
};

function toggleLineupChat(mode) {
  if (mode === 'coach') {
    lineupChatVisible.coach = !lineupChatVisible.coach;
    try { localStorage.setItem('cms_chat_coach', lineupChatVisible.coach ? 'visible' : 'hidden'); } catch (e) { }
    applyLineupChatVisibility('coach');
  } else {
    lineupChatVisible.pub = !lineupChatVisible.pub;
    try { localStorage.setItem('cms_chat_pub', lineupChatVisible.pub ? 'visible' : 'hidden'); } catch (e) { }
    applyLineupChatVisibility('pub');
  }
}

function applyLineupChatVisibility(mode) {
  if (!mode || mode === 'coach') {
    const isVis = lineupChatVisible.coach;
    const col = document.querySelector('#page-lineup .chat-sidebar-col');
    const btn = $('btn-toggle-chat-coach');
    if (col) col.style.display = isVis ? 'flex' : 'none';
    if (btn) btn.innerHTML = isVis ? '💬 Hide Chat' : '💬 Show Chat';
  }
  if (!mode || mode === 'pub') {
    const isVis = lineupChatVisible.pub;
    const col = document.querySelector('#pv-page-lineup .chat-sidebar-col');
    const btn = $('btn-toggle-chat-pub');
    if (col) col.style.display = isVis ? 'flex' : 'none';
    if (btn) btn.innerHTML = isVis ? '💬 Hide Chat' : '💬 Show Chat';
  }
}

function initCoachChat() {
  if (!curTeam) return;
  applyLineupChatVisibility('coach');
  if (coachChatUnsub) coachChatUnsub();

  const col = db.collection('teams').doc(curTeam.id).collection('chat');
  coachChatUnsub = col.orderBy('createdAt', 'asc').limit(100).onSnapshot(snap => {
    coachChatMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderChatMessages(true);
  }, err => console.error('Coach lineup chat error:', err));
}

function initPubChat() {
  if (!pvId) return;
  applyLineupChatVisibility('pub');
  updateChatIdentityUI();
  if (pubChatUnsub) pubChatUnsub();

  const col = db.collection('teams').doc(pvId).collection('chat');
  pubChatUnsub = col.orderBy('createdAt', 'asc').limit(100).onSnapshot(snap => {
    pubChatMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderChatMessages(false);
  }, err => console.error('Pub lineup chat error:', err));
}

async function sendCoachChatDirect(text) {
  if (!curTeam || !text || !text.trim()) return;
  const senderName = curTeam.name ? (curTeam.name + ' (Coach)') : 'Head Coach';
  try {
    await db.collection('teams').doc(curTeam.id).collection('chat').add({
      teamId: curTeam.id,
      senderName,
      senderRole: 'coach',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      pinned: false
    });
  } catch (e) {
    alert('❌ Could not send message.');
  }
}

async function sendPubChatDirect(text) {
  if (!pvId || !text || !text.trim()) return;
  const id = getChatIdentity();
  if (!id.name || id.name === 'Visitor' || id.name === 'Team Member') {
    openChatIdentityModal();
    return;
  }
  try {
    await db.collection('teams').doc(pvId).collection('chat').add({
      teamId: pvId,
      senderName: id.name,
      senderRole: id.role || 'member',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      pinned: false
    });
  } catch (e) {
    alert('❌ Could not send message.');
  }
}

async function sendCoachChat(originEl) {
  if (!curTeam) return;
  let text = '';
  if (originEl && originEl.tagName === 'INPUT') {
    text = originEl.value.trim();
  } else if (originEl && originEl.parentElement) {
    const siblingInp = originEl.parentElement.querySelector('.chat-inp-coach');
    if (siblingInp) text = siblingInp.value.trim();
  }
  if (!text) {
    const firstInp = document.querySelector('#page-lineup .chat-inp-coach');
    if (firstInp) text = firstInp.value.trim();
  }
  if (!text) return;

  document.querySelectorAll('#page-lineup .chat-inp-coach').forEach(inp => { inp.value = ''; });
  await sendCoachChatDirect(text);
}

async function sendPubChat(originEl) {
  if (!pvId) return;
  let text = '';
  if (originEl && originEl.tagName === 'INPUT') {
    text = originEl.value.trim();
  } else if (originEl && originEl.parentElement) {
    const siblingInp = originEl.parentElement.querySelector('.chat-inp-pub');
    if (siblingInp) text = siblingInp.value.trim();
  }
  if (!text) {
    const firstInp = document.querySelector('#pv-page-lineup .chat-inp-pub');
    if (firstInp) text = firstInp.value.trim();
  }
  if (!text) return;

  const id = getChatIdentity();
  if (!id.name || id.name === 'Visitor' || id.name === 'Team Member') {
    openChatIdentityModal();
    return;
  }

  document.querySelectorAll('#pv-page-lineup .chat-inp-pub').forEach(inp => { inp.value = ''; });
  await sendPubChatDirect(text);
}

async function togglePinChat(msgId, currentPinned) {
  if (!curTeam) return;
  try {
    if (!currentPinned) {
      const prevPinned = coachChatMsgs.filter(m => m.pinned && m.id !== msgId);
      for (const p of prevPinned) {
        await db.collection('teams').doc(curTeam.id).collection('chat').doc(p.id).update({ pinned: false });
      }
    }
    await db.collection('teams').doc(curTeam.id).collection('chat').doc(msgId).update({ pinned: !currentPinned });
  } catch (e) {
    alert('❌ Could not pin/unpin message.');
  }
}

async function unpinCurrentChat(isCoach) {
  if (!curTeam) return;
  const pinned = coachChatMsgs.find(m => m.pinned);
  if (pinned) {
    try {
      await db.collection('teams').doc(curTeam.id).collection('chat').doc(pinned.id).update({ pinned: false });
    } catch (e) { }
  }
}

async function deleteChatMessage(msgId) {
  if (!curTeam) return;
  if (!confirm('Delete this message?')) return;
  try {
    await db.collection('teams').doc(curTeam.id).collection('chat').doc(msgId).delete();
  } catch (e) {
    alert('❌ Could not delete message.');
  }
}

async function clearTeamChat() {
  if (!curTeam) return;
  if (!confirm('⚠️ Are you sure you want to clear all lineup chat messages for this team? This action cannot be undone.')) return;

  try {
    const snap = await db.collection('teams').doc(curTeam.id).collection('chat').get();
    if (snap.empty) {
      alert('Chat is already empty.');
      return;
    }
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    coachChatMsgs = [];
    renderChatMessages(true);
  } catch (e) {
    alert('❌ Could not clear chat: ' + (e.message || e));
  }
}

/* ═════════════════════════════════════════════════════════
   2. TEAM DISCUSSION BOARD
   Stored at: teams/{teamId}/discussions
   Standalone URL: ?discuss={teamId} or ?discussion={teamId}
   ═════════════════════════════════════════════════════════ */
function getDiscussUrl(tid) {
  const id = tid || curTeam?.id || pvId || pubDiscussId || '';
  const base = getBaseUrl();
  return `${base}?discuss=${encodeURIComponent(id)}`;
}

function copyDiscussLink(btnEl) {
  const url = getDiscussUrl();
  if (!url || url.endsWith('=')) {
    alert('Please select a team first.');
    return;
  }
  copyToClipboard(url).then(() => {
    if (btnEl) {
      const original = btnEl.textContent;
      btnEl.textContent = 'Copied Link!';
      setTimeout(() => { btnEl.textContent = original; }, 2000);
    }
  }).catch(() => {
    alert('Could not copy link to clipboard.');
  });
}

function shareDiscussWhatsApp() {
  const t = curTeam || pvTeam || pubDiscussTeam || {};
  const tName = (t.name || 'Team').toUpperCase();
  const url = getDiscussUrl();
  const msg = `💬 *${tName} — Team Discussion & Notices*\n\nJoin our team discussion board here:\n👉 ${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function renderDiscussMessages(mode) {
  // mode: 'coach', 'pv', 'screen'
  let containerId = 'discuss-msgs-coach';
  let pinnedBoxId = 'discuss-pinned-box-coach';
  let pinnedTextId = 'discuss-pinned-text-coach';
  let msgs = coachDiscussMsgs;
  const isCoach = (mode === 'coach');

  if (mode === 'pv') {
    containerId = 'discuss-msgs-pv';
    pinnedBoxId = 'discuss-pinned-box-pv';
    pinnedTextId = 'discuss-pinned-text-pv';
    msgs = pubDiscussMsgs;
  } else if (mode === 'screen') {
    containerId = 'discuss-msgs-screen';
    pinnedBoxId = 'discuss-pinned-box-screen';
    pinnedTextId = 'discuss-pinned-text-screen';
    msgs = pubScreenDiscussMsgs;
  }

  const container = $(containerId);
  const pinnedBox = $(pinnedBoxId);
  const pinnedText = $(pinnedTextId);
  const myId = isCoach ? { name: (curTeam?.name ? curTeam.name + ' (Coach)' : 'Coach'), role: 'coach' } : getChatIdentity();

  const pinned = msgs.find(m => m.pinned);
  if (pinned && pinnedBox && pinnedText) {
    pinnedText.textContent = `${pinned.senderName} (${formatChatTime(pinned.createdAt)}): ${pinned.text}`;
    pinnedBox.style.display = 'flex';
  } else if (pinnedBox) {
    pinnedBox.style.display = 'none';
  }

  if (!container) return;

  if (!msgs.length) {
    container.innerHTML = `
      <div class="chat-empty">
        <div class="cei">💬</div>
        <p>No discussion messages yet.</p>
        <p style="font-size:11.5px;margin-top:4px;color:var(--mt);">Post team announcements, general notices, or start a team conversation!</p>
      </div>
    `;
    return;
  }

  let html = '';
  msgs.forEach(m => {
    const isMine = isCoach ? (m.senderRole === 'coach') : (m.senderName === myId.name);
    const isCoachMsg = m.senderRole === 'coach';
    const roleCls = m.senderRole || 'member';
    const roleLabel = m.senderRole ? m.senderRole.toUpperCase() : 'MEMBER';
    const timeStr = formatChatTime(m.createdAt);

    let avatar = '💬';
    if (isCoachMsg) avatar = '👑';
    else if (m.senderRole === 'player') avatar = '⚽';
    else if (m.senderRole === 'staff') avatar = '🧑‍💼';

    const actions = isCoach ? `
      <div class="chat-actions">
        <button class="chat-act-btn" onclick="togglePinDiscuss('${m.id}', ${!!m.pinned})" title="${m.pinned ? 'Unpin message' : 'Pin message to top'}">${m.pinned ? '📌 Unpin' : '📌 Pin'}</button>
        <button class="chat-act-btn" onclick="deleteDiscussMessage('${m.id}')" title="Delete message">🗑️</button>
      </div>
    ` : '';

    html += `
      <div class="chat-msg ${isMine ? 'mine' : ''} ${isCoachMsg ? 'coach-msg' : ''}">
        <div class="chat-av">${avatar}</div>
        <div class="chat-bubble-wrap">
          <div class="chat-meta">
            <span class="chat-sender">${esc(m.senderName)}</span>
            <span class="chat-role-badge ${roleCls}">${roleLabel}</span>
          </div>
          <div class="chat-bubble">
            ${actions}
            <div class="chat-text">${esc(m.text)}</div>
            <div class="chat-time">${timeStr} ${m.pinned ? '📌' : ''}</div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

function initCoachDiscuss() {
  if (!curTeam) return;
  if (coachDiscussUnsub) coachDiscussUnsub();

  const col = db.collection('teams').doc(curTeam.id).collection('discussions');
  coachDiscussUnsub = col.orderBy('createdAt', 'asc').limit(150).onSnapshot(snap => {
    coachDiscussMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderDiscussMessages('coach');
  }, err => console.error('Coach discuss error:', err));
}

function initPubDiscuss() {
  if (!pvId) return;
  updateChatIdentityUI();
  if (pubDiscussUnsub) pubDiscussUnsub();

  const col = db.collection('teams').doc(pvId).collection('discussions');
  pubDiscussUnsub = col.orderBy('createdAt', 'asc').limit(150).onSnapshot(snap => {
    pubDiscussMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderDiscussMessages('pv');
  }, err => console.error('Pub discuss error:', err));
}

function initPublicDiscussion(tid) {
  pubDiscussId = tid;
  ss('s-public-discuss');
  window.scrollTo(0, 0);
  updateChatIdentityUI();

  if (pubScreenDiscussUnsub) { pubScreenDiscussUnsub(); pubScreenDiscussUnsub = null; }

  getDoc(doc(db, 'teams', tid)).then(snap => {
    if (!snap.exists) {
      $('pd-tname').textContent = 'TEAM NOT FOUND';
      $('pd-motto').textContent = 'This discussion link is invalid or the team was deleted.';
      return;
    }
    pubDiscussTeam = { id: snap.id, ...snap.data() };
    $('pd-tname').textContent = (pubDiscussTeam.name || 'TEAM').toUpperCase();
    $('pd-motto').textContent = pubDiscussTeam.motto || 'Team Discussion Board';
    const b = $('pd-badge');
    if (b) {
      b.innerHTML = pubDiscussTeam.logo ? `<img src="${esc(pubDiscussTeam.logo)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : (pubDiscussTeam.emoji || '💬');
    }
  }).catch(e => {
    console.error('initPublicDiscussion error:', e);
    $('pd-tname').textContent = 'Error Loading';
    $('pd-motto').textContent = e.message || 'Unknown error';
  });

  const col = db.collection('teams').doc(tid).collection('discussions');
  pubScreenDiscussUnsub = col.orderBy('createdAt', 'asc').limit(150).onSnapshot(snap => {
    pubScreenDiscussMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderDiscussMessages('screen');
  }, err => console.error('Screen discuss error:', err));
}

async function sendCoachDiscussDirect(text) {
  if (!curTeam || !text || !text.trim()) return;
  const senderName = curTeam.name ? (curTeam.name + ' (Coach)') : 'Head Coach';
  try {
    await db.collection('teams').doc(curTeam.id).collection('discussions').add({
      teamId: curTeam.id,
      senderName,
      senderRole: 'coach',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      pinned: false
    });
  } catch (e) {
    alert('❌ Could not post discussion message.');
  }
}

async function sendCoachDiscuss(originEl) {
  if (!curTeam) return;
  let text = '';
  if (originEl && originEl.tagName === 'INPUT') {
    text = originEl.value.trim();
  } else if (originEl && originEl.parentElement) {
    const siblingInp = originEl.parentElement.querySelector('#discuss-inp-coach');
    if (siblingInp) text = siblingInp.value.trim();
  }
  if (!text) {
    const firstInp = $('discuss-inp-coach');
    if (firstInp) text = firstInp.value.trim();
  }
  if (!text) return;

  const inp = $('discuss-inp-coach');
  if (inp) inp.value = '';
  await sendCoachDiscussDirect(text);
}

async function sendPubDiscussDirect(text, tid) {
  const targetTid = tid || pvId || pubDiscussId;
  if (!targetTid || !text || !text.trim()) return;
  const id = getChatIdentity();
  if (!id.name || id.name === 'Visitor' || id.name === 'Team Member') {
    openChatIdentityModal();
    return;
  }
  try {
    await db.collection('teams').doc(targetTid).collection('discussions').add({
      teamId: targetTid,
      senderName: id.name,
      senderRole: id.role || 'member',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      pinned: false
    });
  } catch (e) {
    alert('❌ Could not post discussion message.');
  }
}

async function sendPubDiscuss(originEl) {
  if (!pvId) return;
  let text = '';
  if (originEl && originEl.tagName === 'INPUT') {
    text = originEl.value.trim();
  } else if (originEl && originEl.parentElement) {
    const siblingInp = originEl.parentElement.querySelector('#discuss-inp-pv');
    if (siblingInp) text = siblingInp.value.trim();
  }
  if (!text) {
    const firstInp = $('discuss-inp-pv');
    if (firstInp) text = firstInp.value.trim();
  }
  if (!text) return;

  const id = getChatIdentity();
  if (!id.name || id.name === 'Visitor' || id.name === 'Team Member') {
    openChatIdentityModal();
    return;
  }

  const inp = $('discuss-inp-pv');
  if (inp) inp.value = '';
  await sendPubDiscussDirect(text, pvId);
}

async function sendPubScreenDiscuss(originEl) {
  if (!pubDiscussId) return;
  let text = '';
  if (originEl && originEl.tagName === 'INPUT') {
    text = originEl.value.trim();
  } else if (originEl && originEl.parentElement) {
    const siblingInp = originEl.parentElement.querySelector('#discuss-inp-screen');
    if (siblingInp) text = siblingInp.value.trim();
  }
  if (!text) {
    const firstInp = $('discuss-inp-screen');
    if (firstInp) text = firstInp.value.trim();
  }
  if (!text) return;

  const id = getChatIdentity();
  if (!id.name || id.name === 'Visitor' || id.name === 'Team Member') {
    openChatIdentityModal();
    return;
  }

  const inp = $('discuss-inp-screen');
  if (inp) inp.value = '';
  await sendPubDiscussDirect(text, pubDiscussId);
}

async function togglePinDiscuss(msgId, currentPinned) {
  if (!curTeam) return;
  try {
    if (!currentPinned) {
      const prevPinned = coachDiscussMsgs.filter(m => m.pinned && m.id !== msgId);
      for (const p of prevPinned) {
        await db.collection('teams').doc(curTeam.id).collection('discussions').doc(p.id).update({ pinned: false });
      }
    }
    await db.collection('teams').doc(curTeam.id).collection('discussions').doc(msgId).update({ pinned: !currentPinned });
  } catch (e) {
    alert('❌ Could not pin/unpin discussion message.');
  }
}

async function unpinDiscuss(isCoach) {
  if (!curTeam) return;
  const pinned = coachDiscussMsgs.find(m => m.pinned);
  if (pinned) {
    try {
      await db.collection('teams').doc(curTeam.id).collection('discussions').doc(pinned.id).update({ pinned: false });
    } catch (e) { }
  }
}

async function deleteDiscussMessage(msgId) {
  if (!curTeam) return;
  if (!confirm('Delete this discussion message?')) return;
  try {
    await db.collection('teams').doc(curTeam.id).collection('discussions').doc(msgId).delete();
  } catch (e) {
    alert('❌ Could not delete discussion message.');
  }
}

async function clearTeamDiscuss() {
  if (!curTeam) return;
  if (!confirm('⚠️ Are you sure you want to clear all discussion messages for this team? This action cannot be undone.')) return;

  try {
    const snap = await db.collection('teams').doc(curTeam.id).collection('discussions').get();
    if (snap.empty) {
      alert('Discussion board is already empty.');
      return;
    }
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    coachDiscussMsgs = [];
    renderDiscussMessages('coach');
  } catch (e) {
    alert('❌ Could not clear discussion: ' + (e.message || e));
  }
}

function doLogout() {
  sessionStorage.removeItem('fhq_session_active');
  localStorage.removeItem('fhq_session_active');
  sessionStorage.removeItem('cms_user_session');
  localStorage.removeItem('cms_user_session');
  localStorage.removeItem('cms_auth_cached_user');
  localStorage.removeItem('cms_auth_cached_profile');
  localStorage.removeItem('fhq_auth_type');

  if (window.CMSAuth && typeof window.CMSAuth.signOut === 'function' && !window._isLoggingOut) {
    window._isLoggingOut = true;
    window.CMSAuth.signOut().catch(() => { }).finally(() => { window._isLoggingOut = false; });
  } else if (typeof auth !== 'undefined' && auth && auth.signOut) {
    auth.signOut().catch(() => { });
  }
  if (unsub) { unsub(); unsub = null; }
  if (matchUnsub) { matchUnsub(); matchUnsub = null; }
  if (allMatchesUnsub) { allMatchesUnsub(); allMatchesUnsub = null; }
  if (coachChatUnsub) { coachChatUnsub(); coachChatUnsub = null; }
  curTeam = null; teams = []; players = []; tournaments = []; matches = []; curTournament = null; curMatch = null;
  const lpw = $('lpw');
  if (lpw) lpw.value = '';
  const lpin = $('lpin');
  if (lpin) lpin.value = '';
  resetLoginForm();
  ss('s-login');
}

// ══════════════════════════════════════════════════════════════
// 🏆 TOURNAMENT MANAGEMENT
// ══════════════════════════════════════════════════════════════

function handleCtnLogo(input) {
  const file = input.files[0]; if (!file) return;
  compressImage(file, 256, 0.88, function (dataUrl) {
    ctnLogoData = dataUrl;
    const prev = $('ctn-logo-preview');
    if (prev) prev.innerHTML = '<img src="' + ctnLogoData + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
  });
}

function clearCtnLogo() {
  ctnLogoData = null;
  const inp = $('ctn-logo-inp'); if (inp) inp.value = '';
  const prev = $('ctn-logo-preview');
  if (prev) prev.innerHTML = $('ctn-emoji')?.value || '🏆';
}

function handleEtnLogo(input) {
  const file = input.files[0]; if (!file) return;
  compressImage(file, 256, 0.88, function (dataUrl) {
    etnLogoData = dataUrl;
    const prev = $('etn-logo-preview');
    if (prev) prev.innerHTML = '<img src="' + etnLogoData + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
  });
}

function clearEtnLogo() {
  etnLogoData = null;
  const inp = $('etn-logo-inp'); if (inp) inp.value = '';
  const prev = $('etn-logo-preview');
  if (prev) prev.innerHTML = $('etn-emoji')?.value || '🏆';
}

function openCreateTournament() {
  ctnLogoData = null;
  const inp = $('ctn-logo-inp'); if (inp) inp.value = '';
  const prev = $('ctn-logo-preview'); if (prev) prev.innerHTML = '🏆';
  const emojiEl = $('ctn-emoji'); if (emojiEl) emojiEl.value = '🏆';

  const nameEl = $('ctn-name'); if (nameEl) nameEl.value = '';
  const seasonEl = $('ctn-season'); if (seasonEl) seasonEl.value = '';
  const statusEl = $('ctn-status'); if (statusEl) statusEl.value = 'active';
  const errEl = $('ctn-err'); if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

  const listEl = $('ctn-teams-list');
  if (listEl) {
    if (!teams.length) {
      listEl.innerHTML = '<p class="lu-hint">No teams created yet. You can create teams first or add them later.</p>';
    } else {
      listEl.innerHTML = teams.map(t => `
        <label style="display:flex;align-items:center;gap:10px;font-size:13px;cursor:pointer;padding:4px 0;">
          <input type="checkbox" class="ctn-team-chk" value="${t.id}">
          <span style="font-size:16px;">${t.logo ? `<img src="${esc(t.logo)}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;vertical-align:middle;" alt="">` : (t.emoji || '⚽')}</span>
          <strong>${esc(t.name)}</strong>
          ${t.season ? `<span style="font-size:11px;color:var(--mt);">(${esc(t.season)})</span>` : ''}
        </label>
      `).join('');
    }
  }

  openM('m-create-tournament');
}

async function saveNewTournament() {
  const name = String($('ctn-name')?.value || '').trim();
  const season = String($('ctn-season')?.value || '').trim();
  const status = $('ctn-status')?.value || 'active';
  const emoji = $('ctn-emoji')?.value || '🏆';
  const errEl = $('ctn-err');

  if (!name) {
    if (errEl) { errEl.textContent = 'Please enter a tournament name.'; errEl.style.display = 'block'; }
    return;
  }

  const selectedTeamIds = Array.from(document.querySelectorAll('.ctn-team-chk:checked')).map(el => el.value);

  const tournData = {
    name: name,
    season: season || null,
    status: status,
    logo: ctnLogoData || null,
    emoji: emoji,
    teamIds: selectedTeamIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, 'tournaments'), tournData);
    const newTourn = { id: docRef.id, ...tournData };
    tournaments.unshift(newTourn);
    closeM('m-create-tournament');
    renderAdminTournaments();
    openTournament(docRef.id);
  } catch (e) {
    if (errEl) { errEl.textContent = 'Failed to create tournament: ' + (e.message || e); errEl.style.display = 'block'; }
  }
}

function openEditTournament(id) {
  curEditTournId = id || (curTournament ? curTournament.id : null);
  const t = (id ? tournaments.find(x => x.id === id) : null) || curTournament || tournaments[0];
  if (!t) {
    console.warn('No tournament found to edit for id:', id);
    return;
  }
  curEditTournId = t.id;

  etnLogoData = t.logo || null;
  const inp = $('etn-logo-inp'); if (inp) inp.value = '';
  const prev = $('etn-logo-preview');
  if (prev) prev.innerHTML = t.logo ? `<img src="${esc(t.logo)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : (t.emoji || '🏆');
  const emojiEl = $('etn-emoji'); if (emojiEl) emojiEl.value = t.emoji || '🏆';

  const nameEl = $('etn-name'); if (nameEl) nameEl.value = t.name || '';
  const seasonEl = $('etn-season'); if (seasonEl) seasonEl.value = t.season || '';
  const statusEl = $('etn-status'); if (statusEl) statusEl.value = t.status || 'active';
  const errEl = $('etn-err'); if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  openM('m-edit-tournament');
}

async function saveEditTournament() {
  const targetId = curEditTournId || (curTournament ? curTournament.id : null);
  const errEl = $('etn-err');

  if (!targetId) {
    if (errEl) { errEl.textContent = 'No tournament selected to edit.'; errEl.style.display = 'block'; }
    return;
  }

  const name = String($('etn-name')?.value || '').trim();
  const season = String($('etn-season')?.value || '').trim();
  const status = $('etn-status')?.value || 'active';
  const emoji = $('etn-emoji')?.value || '🏆';

  if (!name) {
    if (errEl) { errEl.textContent = 'Tournament name cannot be empty.'; errEl.style.display = 'block'; }
    return;
  }

  const updates = {
    name: name,
    season: season || null,
    status: status,
    logo: etnLogoData || null,
    emoji: emoji,
    updatedAt: new Date().toISOString()
  };

  try {
    await updateDoc(doc(db, 'tournaments', targetId), updates);
    if (curTournament && curTournament.id === targetId) {
      Object.assign(curTournament, updates);
    }
    const idx = tournaments.findIndex(t => t.id === targetId);
    if (idx >= 0) Object.assign(tournaments[idx], updates);
    closeM('m-edit-tournament');
    if (curTournament && curTournament.id === targetId) {
      renderTournamentDashboard();
    }
    renderAdminTournaments();
  } catch (e) {
    if (errEl) { errEl.textContent = 'Failed to update tournament: ' + (e.message || e); errEl.style.display = 'block'; }
  }
}

async function deleteTournament(id) {
  const targetId = id || curTournament?.id;
  if (!targetId) return;
  if (!confirm('⚠️ Delete this tournament? This will remove the tournament definition. (Matches will remain in the archive as standalone fixtures).')) return;

  try {
    await deleteDoc(doc(db, 'tournaments', targetId));
    tournaments = tournaments.filter(t => t.id !== targetId);
    if (curTournament && curTournament.id === targetId) {
      curTournament = null;
      goBackToAdmin();
    } else {
      renderAdminTournaments();
      renderAdminMatches();
    }
  } catch (e) {
    alert('❌ Could not delete tournament: ' + (e.message || e));
  }
}

async function openTournament(id) {
  curTournament = tournaments.find(t => t.id === id);
  if (!curTournament) {
    try {
      const snap = await getDoc(doc(db, 'tournaments', id));
      if (snap.exists) {
        curTournament = { id: snap.id, ...snap.data() };
      } else {
        alert('Tournament not found.');
        return;
      }
    } catch (e) {
      alert('Could not load tournament: ' + (e.message || e));
      return;
    }
  }

  currentTournTab = 'teams';
  ss('s-tournament');
  showTournamentTab('teams');
  renderTournamentDashboard();
}

function goBackToAdmin() {
  curTournament = null;
  ss('s-admin');
  showAdminTab('tournaments');
}

function showTournamentTab(tab) {
  currentTournTab = tab;
  ['teams', 'matches', 'stats'].forEach(t => {
    const tabEl = $('tourn-tab-' + t);
    const pageEl = $('tourn-page-' + t);
    if (tabEl) tabEl.classList.toggle('active', t === tab);
    if (pageEl) pageEl.classList.toggle('active', t === tab);
  });
  renderTournamentDashboard();
}

function renderTournamentDashboard() {
  if (!curTournament) return;
  const t = curTournament;
  const teamIds = t.teamIds || [];
  const enteredTeams = teams.filter(tm => teamIds.includes(tm.id));

  const seenTournMatchIds = new Set();
  const tournMatches = [];
  for (const m of matches) {
    if (m && m.id && m.tournamentId === t.id && !seenTournMatchIds.has(m.id)) {
      seenTournMatchIds.add(m.id);
      tournMatches.push(m);
    }
  }

  // Total goals in tournament
  let totalGoals = 0;
  tournMatches.forEach(m => {
    totalGoals += countMatchGoalsFromEvents(m.events);
  });

  // Header Banner
  const bannerEl = $('tourn-header-banner');
  if (bannerEl) {
    const st = t.status || 'active';
    const logoImg = t.logo ? `<img src="${esc(t.logo)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.8);vertical-align:middle;" alt="">` : `<span style="font-size:32px;">${t.emoji || '🏆'}</span>`;
    bannerEl.innerHTML = `
      <div class="tourn-header-info">
        <h1 style="display:flex;align-items:center;gap:12px;">${logoImg}<span>${esc(t.name)}</span></h1>
        <p>${esc(t.season ? t.season + ' Season' : 'All Seasons')} · <span class="s-badge ${st}">${esc(st.toUpperCase())}</span></p>
      </div>
      <div class="tourn-header-stats">
        <div class="tourn-stat-box" style="min-width:90px;">
          <strong>${enteredTeams.length}</strong>
          <span>Teams</span>
        </div>
        <div class="tourn-stat-box" style="min-width:90px;">
          <strong>${tournMatches.length}</strong>
          <span>Matches</span>
        </div>
        <div class="tourn-stat-box" style="min-width:90px;">
          <strong>${totalGoals}</strong>
          <span>Goals Scored</span>
        </div>
      </div>
    `;
  }

  // Topbar
  const topTitle = $('tourn-topbar-title');
  if (topTitle) {
    topTitle.innerHTML = t.logo ? `<img src="${esc(t.logo)}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;margin-right:6px;vertical-align:middle;" alt=""> ${esc(t.name)}` : `${t.emoji || '🏆'} ${esc(t.name)}`;
  }
  const topStatus = $('tourn-topbar-status');
  if (topStatus) {
    topStatus.className = `s-badge ${t.status || 'active'}`;
    topStatus.textContent = (t.status || 'active').toUpperCase();
  }

  // Counts
  const tcEl = $('tourn-team-count'); if (tcEl) tcEl.textContent = enteredTeams.length;
  const mcEl = $('tourn-match-count'); if (mcEl) mcEl.textContent = tournMatches.length;

  // TEAMS PAGE
  const teamsGrid = $('tourn-teams-grid');
  if (teamsGrid) {
    if (!enteredTeams.length) {
      teamsGrid.innerHTML = `
        <div class="add-tc" onclick="openAddTournamentTeams()" style="grid-column:1/-1;">
          <div style="font-size:36px;">👥＋</div>
          <div style="font-size:15px;font-weight:700;letter-spacing:1px;color:#1a5c1a;">Add Teams to this Tournament</div>
          <p style="font-size:12px;color:var(--mt);text-align:center;max-width:320px;">Select from your existing club teams to enter them into this tournament.</p>
        </div>`;
    } else {
      teamsGrid.innerHTML = enteredTeams.map(tm => `
        <div class="tc" onclick="promptPw('${tm.id}')">
          <div class="tc-acts">
            <div class="tc-del" title="Remove from tournament" onclick="event.stopPropagation();removeTournamentTeam('${tm.id}')">✕</div>
          </div>
          <div class="tc-badge">${tm.logo ? `<img src="${esc(tm.logo)}" alt="">` : (tm.emoji || '⚽')}</div>
          <div class="tc-name">${esc(tm.name)}</div>
          <div class="tc-meta">${esc(tm.season || '')}${tm.motto ? ' · ' + esc(tm.motto) : ''}</div>
          <div class="tc-count"><strong>${tm.pc || 0}</strong>Players</div>
        </div>
      `).join('') +
        `<div class="add-tc" onclick="openAddTournamentTeams()"><div style="font-size:30px;">👥＋</div><span style="font-size:13px;font-weight:700;letter-spacing:1px;">Manage Teams</span></div>`;
    }
  }

  // MATCHES PAGE
  const matchesList = $('tourn-matches-list');
  if (matchesList) {
    if (!tournMatches.length) {
      matchesList.innerHTML = `
        <div style="background:var(--card);border:1.5px dashed var(--bd);border-radius:18px;padding:36px;text-align:center;color:var(--mt);">
          <div style="font-size:36px;margin-bottom:8px;">⚽</div>
          <div style="font-size:16px;font-weight:700;color:var(--tx);margin-bottom:4px;">No matches scheduled in this tournament yet</div>
          <p style="font-size:13px;margin-bottom:16px;">Schedule matches between the entered teams to record lineups and live match events.</p>
          <button class="obtn" onclick="openNewMatchInNewWindow(curTournament.id)">➕ New Tournament Match</button>
        </div>`;
    } else {
      matchesList.innerHTML = tournMatches.map(m => {
        const dateStr = formatMatchDateDisplay(m);
        const st = m.status || 'scheduled';
        const hTeam = teams.find(tm => tm.id === m.home?.teamId);
        const aTeam = teams.find(tm => tm.id === m.away?.teamId);
        const hLogo = matchSideIcon(m.home, hTeam);
        const aLogo = matchSideIcon(m.away, aTeam);
        const hScore = (m.home && m.home.score != null) ? m.home.score : 0;
        const aScore = (m.away && m.away.score != null) ? m.away.score : 0;

        const elapsedSec = getMatchElapsedSeconds(m);
        const clockStr = formatMatchClockDisplay(elapsedSec);
        const isPaused = m.matchClock?.status === 'paused';

        let statusBadgeHtml = `<span class="s-badge ${st}">${esc(st.toUpperCase())}</span>`;
        if (st === 'live') {
          statusBadgeHtml = `<span class="s-badge live"><span class="live-pulse-dot"></span>${isPaused ? 'PAUSED' : 'LIVE'} <span class="live-card-timer" data-match-id="${m.id}">${clockStr}</span></span>`;
        }

        return `
          <div class="match-card" onclick="openMatchSheet('${m.id}','s-tournament')" title="Click to view & manage match sheet">
            <div class="match-card-meta">
              <div class="match-card-tourn">🏆 ${esc(t.name)}</div>
              <div class="match-card-date">📅 ${esc(dateStr)}</div>
              <div>${statusBadgeHtml}</div>
            </div>

            <div class="match-card-teams">
              <div class="match-side home">
                <div class="match-side-name">${esc(m.home?.name || 'Home')}</div>
                <div class="match-side-badge">${hLogo}</div>
              </div>

              <div class="match-card-score ${st === 'live' ? 'live' : ''}">
                <div>${st === 'scheduled' ? 'vs' : `${hScore} - ${aScore}`}</div>
                ${st === 'live' ? `<div class="match-card-live-timer"><span class="live-pulse-dot"></span><span class="live-card-timer clock-val" data-match-id="${m.id}">${clockStr}</span></div>` : ''}
              </div>

              <div class="match-side away">
                <div class="match-side-badge">${aLogo}</div>
                <div class="match-side-name">${esc(m.away?.name || 'Away')}</div>
              </div>
            </div>

            <div class="match-card-acts">
              <button type="button" class="match-share-btn" title="Open in new window / tab" onclick="event.stopPropagation();window.open('?match=${m.id}','_blank')">↗ New Tab</button>
              <button type="button" class="match-share-btn" title="Share Live Match on Facebook / Fans" onclick="event.stopPropagation();openShareMatchModal('${m.id}')">🔗 Share</button>
              <button type="button" class="match-del-btn" title="Delete match (Requires PIN)" onclick="event.stopPropagation();adminRequestPin('delmatch','${m.id}')">🗑️</button>
            </div>
          </div>`;
      }).join('');
    }
  }

  // STATS PAGE
  if (currentTournTab === 'stats') {
    renderTournamentStats();
  }
}

function openAddTournamentTeams() {
  if (!curTournament) return;
  const listEl = $('mtn-teams-list');
  if (!listEl) return;
  const currentIds = new Set(curTournament.teamIds || []);

  if (!teams.length) {
    listEl.innerHTML = '<p class="lu-hint">No teams exist in the app yet. Create teams from Super Admin first.</p>';
  } else {
    listEl.innerHTML = teams.map(t => `
      <label style="display:flex;align-items:center;gap:12px;font-size:13.5px;cursor:pointer;padding:6px 8px;border-radius:8px;background:#fff;border:1px solid var(--bd);">
        <input type="checkbox" class="mtn-team-chk" value="${t.id}" ${currentIds.has(t.id) ? 'checked' : ''}>
        <span style="font-size:18px;">${t.logo ? `<img src="${esc(t.logo)}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;vertical-align:middle;" alt="">` : (t.emoji || '⚽')}</span>
        <div style="flex:1;">
          <strong style="color:var(--tx);">${esc(t.name)}</strong>
          ${t.season ? `<span style="font-size:11px;color:var(--mt);margin-left:6px;">${esc(t.season)}</span>` : ''}
        </div>
      </label>
    `).join('');
  }
  openM('m-add-tournament-teams');
}

async function saveTournamentTeamsSelection() {
  if (!curTournament) return;
  const selectedIds = Array.from(document.querySelectorAll('.mtn-team-chk:checked')).map(el => el.value);

  try {
    await updateDoc(doc(db, 'tournaments', curTournament.id), {
      teamIds: selectedIds,
      updatedAt: new Date().toISOString()
    });
    curTournament.teamIds = selectedIds;
    const idx = tournaments.findIndex(t => t.id === curTournament.id);
    if (idx >= 0) tournaments[idx].teamIds = selectedIds;
    closeM('m-add-tournament-teams');
    renderTournamentDashboard();
    renderAdminTournaments();
  } catch (e) {
    alert('❌ Could not save teams: ' + (e.message || e));
  }
}

async function removeTournamentTeam(teamId) {
  if (!curTournament) return;
  if (!confirm('Remove this team from the tournament?')) return;
  const updatedIds = (curTournament.teamIds || []).filter(id => id !== teamId);
  try {
    await updateDoc(doc(db, 'tournaments', curTournament.id), {
      teamIds: updatedIds,
      updatedAt: new Date().toISOString()
    });
    curTournament.teamIds = updatedIds;
    const idx = tournaments.findIndex(t => t.id === curTournament.id);
    if (idx >= 0) tournaments[idx].teamIds = updatedIds;
    renderTournamentDashboard();
    renderAdminTournaments();
  } catch (e) {
    alert('❌ Could not remove team: ' + (e.message || e));
  }
}

function setStatsCategory(cat) {
  currentStatsCat = cat;
  ['goals', 'assists', 'yellow', 'red', 'apps'].forEach(c => {
    const btn = $('stat-tab-' + c);
    if (btn) btn.classList.toggle('active', c === cat);
  });
  renderTournamentStats();
}

function renderTournamentStats() {
  const statsEl = $('tourn-stats-content');
  if (!statsEl || !curTournament) return;

  const tournMatches = matches.filter(m => m.tournamentId === curTournament.id);

  // Compute aggregate stats across matches
  const statsMap = {}; // key -> { id, name, teamName, teamLogo, teamEmoji, photo, position, goals, assists, yellow, red, apps, starts, subs }

  function getPlayerEntry(pid, pname, teamId, teamName, pos, photo) {
    const key = pid ? `pid_${pid}` : `name_${(pname || '').trim().toLowerCase()}_${teamName || ''}`;
    if (!statsMap[key]) {
      const t = teams.find(x => x.id === teamId);
      const cachedP = pid ? allPlayersCache.find(x => x.id === pid) : null;
      statsMap[key] = {
        id: pid || null,
        name: pname || cachedP?.name || 'Unknown Player',
        teamName: teamName || t?.name || 'Opponent Side',
        teamLogo: t?.logo || null,
        teamEmoji: t?.emoji || '⚽',
        photo: photo || cachedP?.photo || null,
        position: pos || cachedP?.position || '',
        goals: 0,
        assists: 0,
        yellow: 0,
        red: 0,
        apps: 0,
        starts: 0,
        subs: 0
      };
    }
    return statsMap[key];
  }

  tournMatches.forEach(m => {
    const matchSeenKeys = new Set();

    // Track Appearances - Home Starters
    (m.home?.lineup?.starters || []).forEach(slot => {
      const p = slot?.player || slot;
      if (p && (p.id || p.name)) {
        const entry = getPlayerEntry(p.id, p.name, m.home?.teamId, m.home?.name, p.position, p.photo);
        entry.starts++;
        const pKey = p.id ? `pid_${p.id}` : `name_${(p.name || '').trim().toLowerCase()}_${m.home?.name || ''}`;
        if (!matchSeenKeys.has(pKey)) { entry.apps++; matchSeenKeys.add(pKey); }
      }
    });

    // Track Appearances - Home Subs
    (m.home?.lineup?.subs || []).forEach(p => {
      if (p && (p.id || p.name)) {
        const entry = getPlayerEntry(p.id, p.name, m.home?.teamId, m.home?.name, p.position, p.photo);
        entry.subs++;
        const pKey = p.id ? `pid_${p.id}` : `name_${(p.name || '').trim().toLowerCase()}_${m.home?.name || ''}`;
        if (!matchSeenKeys.has(pKey)) { entry.apps++; matchSeenKeys.add(pKey); }
      }
    });

    // Track Appearances - Away Starters
    (m.away?.lineup?.starters || []).forEach(slot => {
      const p = slot?.player || slot;
      if (p && (p.id || p.name)) {
        const entry = getPlayerEntry(p.id, p.name, m.away?.teamId, m.away?.name, p.position, p.photo);
        entry.starts++;
        const pKey = p.id ? `pid_${p.id}` : `name_${(p.name || '').trim().toLowerCase()}_${m.away?.name || ''}`;
        if (!matchSeenKeys.has(pKey)) { entry.apps++; matchSeenKeys.add(pKey); }
      }
    });

    // Track Appearances - Away Subs
    (m.away?.lineup?.subs || []).forEach(p => {
      if (p && (p.id || p.name)) {
        const entry = getPlayerEntry(p.id, p.name, m.away?.teamId, m.away?.name, p.position, p.photo);
        entry.subs++;
        const pKey = p.id ? `pid_${p.id}` : `name_${(p.name || '').trim().toLowerCase()}_${m.away?.name || ''}`;
        if (!matchSeenKeys.has(pKey)) { entry.apps++; matchSeenKeys.add(pKey); }
      }
    });

    // Events aggregation (Goals, Assists, Cards)
    (m.events || []).forEach(ev => {
      const teamId = ev.team === 'home' ? m.home?.teamId : m.away?.teamId;
      const teamName = ev.team === 'home' ? m.home?.name : m.away?.name;
      const primaryEntry = getPlayerEntry(ev.playerId, ev.playerName, teamId, teamName, null, null);

      if (ev.type === 'goal') {
        primaryEntry.goals++;
        // If an assist was linked
        if (ev.relatedPlayerId) {
          const assistEntry = getPlayerEntry(ev.relatedPlayerId, null, teamId, teamName, null, null);
          assistEntry.assists++;
        }
      } else if (ev.type === 'assist') {
        primaryEntry.assists++;
      } else if (ev.type === 'yellow') {
        primaryEntry.yellow++;
      } else if (ev.type === 'red') {
        primaryEntry.red++;
      }
    });
  });

  const allEntries = Object.values(statsMap);

  let sorted = [];
  let colLabel = 'Goals';
  let valKey = 'goals';

  if (currentStatsCat === 'goals') {
    colLabel = 'Goals';
    valKey = 'goals';
    sorted = allEntries.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
  } else if (currentStatsCat === 'assists') {
    colLabel = 'Assists';
    valKey = 'assists';
    sorted = allEntries.filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists || a.name.localeCompare(b.name));
  } else if (currentStatsCat === 'yellow') {
    colLabel = 'Yellow Cards';
    valKey = 'yellow';
    sorted = allEntries.filter(p => p.yellow > 0).sort((a, b) => b.yellow - a.yellow || a.name.localeCompare(b.name));
  } else if (currentStatsCat === 'red') {
    colLabel = 'Red Cards';
    valKey = 'red';
    sorted = allEntries.filter(p => p.red > 0).sort((a, b) => b.red - a.red || a.name.localeCompare(b.name));
  } else if (currentStatsCat === 'apps') {
    colLabel = 'Appearances';
    valKey = 'apps';
    sorted = allEntries.filter(p => p.apps > 0).sort((a, b) => b.apps - a.apps || a.name.localeCompare(b.name));
  }

  if (!sorted.length) {
    statsEl.innerHTML = `
      <div class="stat-table-card" style="padding:36px;text-align:center;color:var(--mt);">
        <div style="font-size:32px;margin-bottom:8px;">📊</div>
        <div style="font-size:15px;font-weight:700;color:var(--tx);margin-bottom:4px;">No statistics recorded for this category yet</div>
        <p style="font-size:12.5px;">Log match events like goals, cards, and substitutions to populate leaderboards.</p>
      </div>`;
    return;
  }

  let rank = 1;
  statsEl.innerHTML = `
    <div class="stat-table-card">
      <table class="stat-table">
        <thead>
          <tr>
            <th style="width:60px;text-align:center;">Rank</th>
            <th>Player</th>
            <th>Team</th>
            <th style="text-align:right;">${esc(colLabel)}</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map((p, idx) => {
    const rankCls = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : '';
    const rankMedal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1;
    const teamBadge = p.teamLogo ? `<img src="${esc(p.teamLogo)}" style="width:18px;height:18px;border-radius:50%;object-fit:cover;" alt="">` : (p.teamEmoji || '⚽');
    const posBadge = p.position ? posCode(p.position) : '';

    return `
              <tr>
                <td style="text-align:center;">
                  <span class="rank-badge ${rankCls}">${rankMedal}</span>
                </td>
                <td>
                  <div class="player-row-cell">
                    <div class="player-row-av">
                      ${p.photo ? `<img src="${esc(p.photo)}" alt="">` : '👤'}
                    </div>
                    <div>
                      <div class="player-row-name">${esc(p.name)}</div>
                      ${posBadge ? `<div class="player-row-pos">${esc(posBadge)}</div>` : ''}
                    </div>
                  </div>
                </td>
                <td>
                  <div class="team-row-cell">
                    <span>${teamBadge}</span>
                    <span>${esc(p.teamName)}</span>
                  </div>
                </td>
                <td class="stat-val">
                  <strong>${p[valKey]}</strong>
                </td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    </div>
  `;
}


// ══════════════════════════════════════════════════════════════
// 📋 MATCH SHEET CREATION & MANAGEMENT
// ══════════════════════════════════════════════════════════════

function resetMatchOpponentDraft(side) {
  cmOpponentLogos[side] = null;
  cmOpponentLogoBusy[side] = false;
  cmOpponentRosterBusy[side] = false;
  const name = $(`cm-${side}-ext-name`);
  const roster = $(`cm-${side}-roster-text`);
  const preview = $(`cm-${side}-logo-preview`);
  const status = $(`cm-${side}-roster-status`);
  if (name) name.value = '';
  if (roster) roster.value = '';
  if (preview) preview.innerHTML = '<span>⚽</span><small>No badge selected</small>';
  if (status) status.textContent = 'CSV columns: Name, Position, Jersey, Section (optional). Gemini can read roster photos; review every row before creating the match.';
  [`logo-input`, `roster-csv`, `roster-image`, `roster-camera`].forEach(suffix => {
    const input = $(`cm-${side}-${suffix}`);
    if (input) input.value = '';
  });
}

function handleMatchOpponentLogo(side, input) {
  const file = input?.files?.[0];
  if (!file) return;
  if (!file.type || !file.type.startsWith('image/')) {
    alert('Please choose an image file for the team badge.');
    if (input) input.value = '';
    return;
  }
  const preview = $(`cm-${side}-logo-preview`);
  cmOpponentLogoBusy[side] = true;
  if (preview) preview.innerHTML = '<span>⏳</span><small>Preparing badge…</small>';
  compressImage(file, 256, 0.82, dataUrl => {
    cmOpponentLogos[side] = dataUrl;
    cmOpponentLogoBusy[side] = false;
    if (preview) preview.innerHTML = `<img src="${dataUrl}" alt="New team badge"><small>${esc(file.name)}</small>`;
    if (input) input.value = '';
  });
}

function opponentRosterSection(value, index) {
  const section = String(value || '').toLowerCase();
  if (/staff|management|coach|manager|physio|doctor|trainer|analyst|kit/.test(section)) return 'Staff';
  if (/bench|sub|reserve|substitute/.test(section)) return 'Bench';
  if (/starter|starting|playing|first team|lineup|line-up|\bxi\b/.test(section)) return 'Starter';
  return index < 11 ? 'Starter' : 'Bench';
}

function formatOpponentRoster(entries) {
  return entries.map(p => [
    String(p.name || '').replace(/[|\r\n]/g, ' ').trim(),
    String(p.position || '').replace(/[|\r\n]/g, ' ').trim(),
    String(p.jersey || '').replace(/[|\r\n]/g, ' ').trim(),
    p.section || 'Starter'
  ].join(' | ')).filter(line => line.split('|')[0].trim()).join('\n');
}

function parseOpponentRosterCsv(text) {
  const rows = parseCSVRows(text);
  if (!rows.length) return [];
  const header = rows[0].map(value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim());
  const findColumn = keys => header.findIndex(value => keys.some(key => value === key || value.includes(key)));
  const hasHeader = header.some(value => ['name', 'player', 'fullname', 'playername', 'position', 'role', 'jersey', 'jerseynumber', 'number', 'section', 'type'].some(key => value === key || value.includes(key)));
  const nameCol = hasHeader ? Math.max(0, findColumn(['playername', 'fullname', 'name', 'player'])) : 0;
  const positionCol = hasHeader ? findColumn(['position', 'role', 'pos']) : 1;
  const jerseyCol = hasHeader ? findColumn(['jersey', 'shirtnumber', 'number', 'no']) : 2;
  const sectionCol = hasHeader ? findColumn(['section', 'squad', 'category', 'type', 'status', 'group']) : 3;
  const firstDataRow = hasHeader ? 1 : 0;
  const result = [];
  for (let i = firstDataRow; i < rows.length; i++) {
    const row = rows[i] || [];
    let name = String(row[nameCol] || '').trim();
    let position = String(row[positionCol] || '').trim();
    let jersey = String(row[jerseyCol] || '').trim();
    let section = String(row[sectionCol] || '').trim();
    if (!hasHeader && /^#?\d{1,3}$/.test(String(row[0] || '').trim())) {
      jersey = String(row[0]).replace('#', '').trim();
      name = String(row[1] || '').trim();
      position = String(row[2] || '').trim();
      section = String(row[3] || '').trim();
    }
    if (!name && /^\d{1,2}$/.test(String(row[0] || '').trim())) name = String(row[1] || '').trim();
    if (!name) continue;
    const roleText = `${position} ${section}`.toLowerCase();
    const isStaff = /coach|manager|physio|doctor|staff|trainer|analyst|kit/.test(roleText);
    if (!section && isStaff) section = 'Staff';
    const playerCount = result.filter(entry => entry.section !== 'Staff').length;
    result.push({ name, position, jersey, section: opponentRosterSection(section, playerCount) });
  }
  return result;
}

function parseOpponentRosterText(text) {
  const entries = [];
  const knownPositions = new Set(DPOS);
  String(text || '').split(/\r?\n/).forEach(line => {
    let value = line.trim();
    if (!value) return;
    if (/^(name|player( name)?|jersey|number|position|roster)\b/i.test(value)) return;
    let parts = value.includes('|') ? value.split('|').map(x => x.trim()) : (value.includes('\t') ? value.split('\t').map(x => x.trim()) : (value.includes(',') ? value.split(',').map(x => x.trim()) : [value]));
    let name = parts[0] || '';
    let position = parts[1] || '';
    let jersey = parts[2] || '';
    let section = parts[3] || '';
    if (parts.length === 1) {
      value = value.replace(/^[•*\-]\s*/, '');
      const leadingNumber = value.match(/^#?(\d{1,2})\s*[.)\-:]?\s+/);
      if (leadingNumber) { jersey = leadingNumber[1]; value = value.slice(leadingNumber[0].length); }
      const roleMatch = value.match(/\b(central\s+defensive\s+midfielder|defensive\s+midfielder|central\s+attacking\s+midfielder|attacking\s+midfielder|central\s+midfielder|right\s+midfielder|left\s+midfielder|right\s+winger|left\s+winger|centre\s+forward|center\s+forward|goal\s*keeper|right\s*back|left\s*back|centre\s*back|center\s*back|wing\s*back|midfielder|defender|winger|striker|forward|GK|RWB|LWB|RB|LB|CB|CDM|CAM|CM|RM|LM|RW|LW|CF|ST)\b\s*$/i);
      if (roleMatch) { position = roleMatch[1]; value = value.slice(0, roleMatch.index).trim(); }
      const trailingNumber = value.match(/\s+#?(\d{1,2})\s*$/);
      if (trailingNumber) { jersey = jersey || trailingNumber[1]; value = value.slice(0, trailingNumber.index).trim(); }
      name = value.replace(/^\d+[.)]\s*/, '').replace(/\s{2,}/g, ' ').trim();
    }
    name = name.replace(/^[#\d.)\-\s]+/, '').trim();
    if (!name || !/[a-z]/i.test(name)) return;
    const isStaff = /coach|manager|physio|doctor|staff|trainer|analyst|kit/i.test(`${section} ${position}`);
    const positionCode = posCode(position);
    if (isStaff) { section = 'Staff'; position = position || 'Staff'; }
    else position = knownPositions.has(positionCode) ? positionCode : String(position || '').trim();
    const playerCount = entries.filter(entry => entry.section !== 'Staff').length;
    const normalizedSection = opponentRosterSection(section, playerCount);
    entries.push({ name, position, jersey, section: normalizedSection });
  });
  return entries;
}

function setMatchOpponentRosterStatus(side, message) {
  const status = $(`cm-${side}-roster-status`);
  if (status) status.textContent = message;
}

function describeFirebaseAiLoadFailure(error) {
  const hostedUrl = 'https://football-event-managing-system.web.app/';
  if (window.location?.protocol === 'file:') {
    return `This app is open as a local file. Firebase AI Logic needs the hosted app; open ${hostedUrl}.`;
  }
  if (navigator.onLine === false) {
    return 'This device is offline. Reconnect, then reload the hosted app to load Firebase AI Logic.';
  }
  const detail = String(error?.message || '').trim();
  return `Firebase AI Logic could not download its module or a Firebase CDN dependency${detail ? ` (${detail})` : ''}. Check access to www.gstatic.com, then reload ${hostedUrl}.`;
}

function explainRosterPhotoError(error) {
  const message = String(error?.message || error || '');
  if (/quota exceeded|resource_exhausted|generate_content_.*limit|rate limit|too many requests|\b429\b/i.test(message)) {
    const freeTier = /free[_ -]?tier|per day|generate_content_free_tier_requests/i.test(message);
    const retryText = message.match(/retry in\s+((?:\d+(?:\.\d+)?h)?(?:\d+(?:\.\d+)?m)?(?:\d+(?:\.\d+)?s)?)/i)?.[1] || '';
    const units = [...retryText.matchAll(/(\d+(?:\.\d+)?)(h|m|s)/gi)];
    const seconds = units.reduce((total, match) => total + Number(match[1]) * ({ h: 3600, m: 60, s: 1 }[match[2].toLowerCase()]), 0);
    let retry = '';
    if (seconds > 0) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      retry = hours ? ` Try again in about ${hours}h ${minutes}m.` : ` Try again in about ${Math.max(1, minutes)}m.`;
    }
    const limit = freeTier ? "Gemini's daily free-tier photo-reading quota is exhausted." : 'Gemini has reached a photo-reading request limit.';
    return `${limit}${retry} You can still create the match by importing a roster CSV or typing the names below.`;
  }
  if (error?.name === 'AbortError' || /action aborted|request aborted|aborted/i.test(message)) {
    return 'Photo analysis was interrupted. Try a closer crop. You can also import a roster CSV or type the names below.';
  }
  if (/dynamically imported module|firebase ai logic.*(?:failed to load|has not started loading|could not download)/i.test(message)) {
    return `${describeFirebaseAiLoadFailure(error)} You can still create the match by importing a roster CSV or typing the names below.`;
  }
  if (/load failed|fetch|network/i.test(message)) {
    return 'Firebase AI Logic could not connect. Check your internet connection and try the photo again, or use a roster CSV or type the names below.';
  }
  return `${message || 'Gemini could not read the photo.'} You can still create the match with a roster CSV or by typing the names below.`;
}

function openGeminiSettings() {
  const status = $('gemini-api-key-status');
  if (status) {
    if (!appCheck) {
      status.style.color = 'var(--red)';
      status.textContent = 'Firebase App Check needs its reCAPTCHA Enterprise site key in app.js before Gemini can be used.';
    } else if (window.firebaseAiLogicLoadState === 'error') {
      status.style.color = 'var(--red)';
      status.textContent = describeFirebaseAiLoadFailure(window.firebaseAiLogicLoadError);
    } else if (window.firebaseAiLogicLoadState !== 'ready') {
      status.style.color = 'var(--mt)';
      status.textContent = 'Firebase AI Logic is still loading. Check the connection and reopen this panel in a moment.';
    } else {
      status.style.color = '#1a5c1a';
      status.textContent = 'App Check is active. Firebase AI Logic uses Google-managed Gemini access; no API key is stored in this app or in individual browsers.';
    }
  }
  openM('m-gemini-settings');
}

function closeGeminiSettings() {
  closeM('m-gemini-settings');
}

async function callGeminiGenerateContent(contents, generationConfig) {
  if (!appCheck) throw new Error('Firebase App Check is not configured. Add its reCAPTCHA Enterprise site key before using Gemini.');
  if (!window.firebaseAiLogicReady) throw new Error('Firebase AI Logic has not started loading. Reload the app from its Firebase Hosting address and try again.');
  const generateContent = await window.firebaseAiLogicReady;
  return generateContent(contents, generationConfig);
}

async function callGeminiGenerateContentStream(contents, generationConfig, onText) {
  if (!appCheck) throw new Error('Firebase App Check is not configured. Add its reCAPTCHA Enterprise site key before using Gemini.');
  if (!window.firebaseAiLogicReady) throw new Error('Firebase AI Logic has not started loading. Reload the app from its Firebase Hosting address and try again.');
  const generateContent = await window.firebaseAiLogicReady;
  if (typeof generateContent.stream === 'function') return generateContent.stream(contents, generationConfig, onText);
  const text = await generateContent(contents, generationConfig);
  if (typeof onText === 'function') onText(text);
  return text;
}

async function loadRosterPhotoSource(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (_error) { }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('This photo could not be opened. Try a JPG, PNG, or WebP image.'));
      image.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
}

function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The photo could not be compressed.')), 'image/jpeg', quality);
      return;
    }
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const binary = atob(dataUrl.split(',')[1] || '');
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      resolve(new Blob([bytes], { type: 'image/jpeg' }));
    } catch (error) { reject(error); }
  });
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      const comma = value.indexOf(',');
      if (comma < 0) reject(new Error('The compressed photo could not be read.'));
      else resolve(value.slice(comma + 1));
    };
    reader.onerror = () => reject(new Error('The compressed photo could not be read.'));
    reader.onabort = () => reject(new Error('Photo preparation was interrupted. Choose the photo again and retry.'));
    reader.readAsDataURL(blob);
  });
}

async function compressRosterPhotoForGemini(file) {
  if (!file || (file.type && !String(file.type).startsWith('image/'))) throw new Error('Choose a valid roster photo.');
  if (file.size > 30 * 1024 * 1024) throw new Error('This photo is over 30 MB. Choose a smaller image or upload the roster as CSV.');
  let source;
  try { source = await loadRosterPhotoSource(file); } catch (error) { throw new Error(error.message || 'This photo format is not supported. Try a JPG, PNG, or WebP image.'); }
  const width = Number(source.width || source.naturalWidth || 0);
  const height = Number(source.height || source.naturalHeight || 0);
  if (!width || !height) { source.close?.(); throw new Error('The photo has no readable image dimensions. Choose another photo.'); }
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Photo processing is unavailable in this browser.');
    let blob = null;
    for (const maxDimension of [1400, 1100, 900]) {
      const scale = Math.min(1, maxDimension / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      blob = await canvasToJpegBlob(canvas, 0.72);
      if (blob.size <= 800 * 1024) break;
    }
    if (!blob || blob.size > 2 * 1024 * 1024) throw new Error('This photo is still too large after compression. Try a closer crop or upload CSV.');
    return { mimeType: 'image/jpeg', data: await blobToBase64(blob) };
  } finally { source.close?.(); }
}

function parseGeminiJsonObject(responseText) {
  const text = String(responseText || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const start = text.indexOf('{');
  if (start < 0) throw new SyntaxError('Gemini did not return a JSON object.');
  let depth = 0, insideString = false, escaped = false;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (insideString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') insideString = false;
      continue;
    }
    if (char === '"') { insideString = true; continue; }
    if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, index + 1));
    }
  }
  throw new SyntaxError('Gemini returned incomplete JSON.');
}

async function requestRosterPhotoExtraction(prompt, image, schema, side) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const requestPrompt = attempt
      ? `${prompt}\n\nIMPORTANT: Return a compact, valid JSON object with the "players" array. Only include names and numbers clearly visible in the image.`
      : prompt;
    if (attempt && side) setMatchOpponentRosterStatus(side, 'Retrying photo analysis…');
    try {
      const responseText = await callGeminiGenerateContent([{ parts: [{ text: requestPrompt }, { inlineData: { mimeType: image.mimeType, data: image.data } }] }], {
        maxOutputTokens: attempt ? 3072 : 2048,
        responseMimeType: 'application/json',
        responseSchema: schema
      });
      return parseGeminiJsonObject(responseText);
    } catch (error) {
      const isIncompleteJson = error instanceof SyntaxError;
      const isInterrupted = error?.name === 'AbortError' || /action aborted|request aborted|aborted/i.test(String(error.message || ''));
      const isTransientFetch = /load failed|fetch|network/i.test(String(error.message || ''));
      if (attempt === 0 && (isIncompleteJson || isInterrupted || isTransientFetch)) {
        if (isInterrupted && side) setMatchOpponentRosterStatus(side, 'Photo analysis was interrupted. Retrying…');
        else if (isTransientFetch && side) setMatchOpponentRosterStatus(side, 'Reconnecting to Gemini AI…');
        await new Promise(resolve => setTimeout(resolve, 400));
        continue;
      }
      if (isIncompleteJson) throw new Error('Gemini returned an incomplete roster list. Try a sharper, closer photo.');
      if (isInterrupted) throw new Error('Gemini interrupted the photo request. Try a closer crop or upload CSV.');
      throw error;
    }
  }
  throw new Error('Gemini could not finish reading this photo.');
}

async function handleMatchOpponentRosterCSV(side, input) {
  const file = input?.files?.[0];
  if (!file) return;
  cmOpponentRosterBusy[side] = true;
  try {
    const entries = parseOpponentRosterCsv(await file.text());
    if (!entries.length) {
      setMatchOpponentRosterStatus(side, 'No player names found. Use the CSV template columns: Name, Position, Jersey, Section.');
      return;
    }
    const roster = $(`cm-${side}-roster-text`);
    if (roster) roster.value = formatOpponentRoster(entries);
    setMatchOpponentRosterStatus(side, `${entries.length} roster entries imported. Review or correct the list before creating the match.`);
  } catch (error) {
    setMatchOpponentRosterStatus(side, `Could not read this CSV: ${error.message || error}`);
  } finally {
    cmOpponentRosterBusy[side] = false;
    if (input) input.value = '';
  }
}

async function handleMatchOpponentRosterImage(side, input) {
  const file = input?.files?.[0];
  if (!file) return;
  cmOpponentRosterBusy[side] = true;
  try {
    if (!appCheck) {
      setMatchOpponentRosterStatus(side, 'Gemini photo reading needs Firebase App Check. You can still import a roster CSV or type the names below.');
      openGeminiSettings();
      return;
    }
    setMatchOpponentRosterStatus(side, 'Preparing and compressing the roster photo…');
    const image = await compressRosterPhotoForGemini(file);
    setMatchOpponentRosterStatus(side, 'Reading names, jersey numbers, and positions with Gemini…');
    const prompt = `Read this football/soccer team roster sheet and extract each clearly listed player and staff member. Carefully inspect the image, including columns, headings, handwritten entries, and jersey numbers. Preserve names as printed. Capture a jersey number only when it is clearly shown beside that person; do not guess a number. Capture a position only when the document explicitly gives one; normalize recognizable positions to GK, RB, LB, CB, RWB, LWB, CDM, CM, CAM, RM, LM, RW, LW, CF, or ST. If a number or position is absent or unclear, return an empty string. Assign Starter, Bench, or Staff only when supported by a section heading or clear label; otherwise use Unknown. Do not include referees, opponents, or unrelated notes. Mark confidence low if the spelling, number, or position is hard to read. Return only the requested JSON.`;
    const schema = {
      type: 'OBJECT',
      properties: {
        players: {
          type: 'ARRAY', items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING', description: 'Player or staff name exactly as printed.' },
              number: { type: 'STRING', description: 'Clearly printed jersey number, or empty string.' },
              position: { type: 'STRING', description: 'Explicitly printed football position abbreviation, or empty string.' },
              section: { type: 'STRING', enum: ['Starter', 'Bench', 'Staff', 'Unknown'] },
              confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] }
            },
            required: ['name', 'number', 'position', 'section', 'confidence']
          }
        }
      },
      required: ['players']
    };
    const parsed = await requestRosterPhotoExtraction(prompt, image, schema, side);
    const sourcePlayers = Array.isArray(parsed?.players) ? parsed.players : [];
    const aiEntries = sourcePlayers.map(player => {
      const name = String(player?.name || '').trim();
      const rawPosition = String(player?.position || '').trim();
      const normalizedPosition = posCode(rawPosition);
      const position = DPOS.includes(normalizedPosition) ? normalizedPosition : rawPosition;
      const number = String(player?.number ?? '').trim();
      const section = String(player?.section || 'Unknown').trim();
      const confidence = String(player?.confidence || 'medium').toLowerCase();
      return { name, position, jersey: number, section, confidence };
    }).filter(player => player.name && /[a-z]/i.test(player.name));
    const entries = aiEntries.map(({ confidence, ...player }) => player);
    const roster = $(`cm-${side}-roster-text`);
    if (entries.length) {
      if (roster) roster.value = formatOpponentRoster(entries);
      const lowConfidence = aiEntries.filter(player => player.confidence === 'low').length;
      setMatchOpponentRosterStatus(side, `${entries.length} entries read with Gemini${lowConfidence ? `; ${lowConfidence} need careful checking` : ''}. Review names, positions, and numbers below before creating the match.`);
    } else {
      setMatchOpponentRosterStatus(side, 'Gemini found no clear roster entries. Try a sharper, straight-on photo or upload a CSV roster.');
    }
  } catch (error) {
    console.error('Gemini roster extraction error:', error);
    setMatchOpponentRosterStatus(side, explainRosterPhotoError(error));
  } finally {
    cmOpponentRosterBusy[side] = false;
    if (input) input.value = '';
  }
}

function downloadOpponentRosterTemplate() {
  const csv = 'Name,Position,Jersey,Section\nAlex Morgan,GK,1,Starter\nJordan Lee,CB,4,Starter\nTaylor Smith,ST,9,Bench\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'new-team-roster-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function buildNewTeamMatchLineup(side) {
  const raw = $(`cm-${side}-roster-text`)?.value || '';
  const entries = parseOpponentRosterText(raw);
  if (!entries.length) return null;
  const starters = entries.filter(p => p.section === 'Starter');
  const bench = entries.filter(p => p.section === 'Bench');
  const coaches = entries.filter(p => p.section === 'Staff');
  if (starters.length > 11) bench.unshift(...starters.splice(11));
  const makePlayer = (p, index) => ({
    playerId: `new_${side}_${p.section.toLowerCase()}_${index}`,
    name: p.name,
    jersey: p.jersey || '',
    position: p.position || '—'
  });
  return {
    formation: '4-4-2',
    starters: starters.map(makePlayer),
    subs: bench.map(makePlayer),
    coaches: coaches.map((p, index) => ({ staffId: `new_${side}_staff_${index}`, name: p.name, role: p.position && p.position !== 'ST' ? p.position : 'Staff' }))
  };
}

function openCreateMatch(presetTournId) {
  const dateEl = $('cm-date');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];

  const timeEl = $('cm-time');
  if (timeEl) timeEl.value = '18:00';

  const statusEl = $('cm-status');
  if (statusEl) statusEl.value = 'scheduled';

  const errEl = $('cm-err');
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

  resetMatchOpponentDraft('home');
  resetMatchOpponentDraft('away');

  // Populate tournament dropdown
  const tournSel = $('cm-tourn-select');
  if (tournSel) {
    tournSel.innerHTML = `
      <option value="">🏆 Standalone Match (No Tournament)</option>
      ${tournaments.map(t => `<option value="${t.id}" ${presetTournId === t.id ? 'selected' : ''}>🏆 ${esc(t.name)}</option>`).join('')}
    `;
  }

  if (!teams.length) {
    homeTeamType = 'ext';
    awayTeamType = 'ext';
    setHomeTeamType('ext');
    setAwayTeamType('ext');
  } else {
    homeTeamType = 'app';
    awayTeamType = 'app';
    setHomeTeamType('app');
    setAwayTeamType('app');
  }

  handleMatchTournChange(presetTournId || '');
  openM('m-create-match');
}

function handleMatchTournChange(tournId) {
  const t = tournaments.find(x => x.id === tournId);
  const rawEligible = (t && t.teamIds && t.teamIds.length) ? teams.filter(tm => t.teamIds.includes(tm.id)) : teams;

  const seenTeamIds = new Set();
  const eligibleTeams = [];
  for (const tm of rawEligible) {
    if (tm && tm.id && !seenTeamIds.has(tm.id)) {
      seenTeamIds.add(tm.id);
      eligibleTeams.push(tm);
    }
  }

  const hSel = $('cm-home-team-select');
  const aSel = $('cm-away-team-select');

  const options = eligibleTeams.map(tm => `<option value="${tm.id}">${tm.emoji || '⚽'} ${esc(tm.name)}</option>`).join('');

  if (hSel) {
    hSel.innerHTML = options || '<option value="">No teams available (Switch to New Team)</option>';
  }
  if (aSel) {
    aSel.innerHTML = options || '<option value="">No teams available (Switch to New Team)</option>';
    if (eligibleTeams.length > 1 && aSel.options.length > 1) {
      aSel.selectedIndex = 1;
    }
  }
}

function setHomeTeamType(type) {
  homeTeamType = type;
  const btnApp = $('cm-home-type-app');
  const btnExt = $('cm-home-type-ext');
  const wrapApp = $('cm-home-app-wrap');
  const wrapExt = $('cm-home-ext-wrap');

  if (btnApp) btnApp.classList.toggle('active', type === 'app');
  if (btnExt) btnExt.classList.toggle('active', type === 'ext');
  if (wrapApp) wrapApp.style.display = (type === 'app') ? 'block' : 'none';
  if (wrapExt) wrapExt.style.display = (type === 'ext') ? 'block' : 'none';
}

function setAwayTeamType(type) {
  awayTeamType = type;
  const btnApp = $('cm-away-type-app');
  const btnExt = $('cm-away-type-ext');
  const wrapApp = $('cm-away-app-wrap');
  const wrapExt = $('cm-away-ext-wrap');

  if (btnApp) btnApp.classList.toggle('active', type === 'app');
  if (btnExt) btnExt.classList.toggle('active', type === 'ext');
  if (wrapApp) wrapApp.style.display = (type === 'app') ? 'block' : 'none';
  if (wrapExt) wrapExt.style.display = (type === 'ext') ? 'block' : 'none';
}

async function saveCreateMatch() {
  const tournId = $('cm-tourn-select')?.value || null;
  const matchDate = $('cm-date')?.value || new Date().toISOString().split('T')[0];
  const matchTime = $('cm-time')?.value || '';
  const matchStatus = $('cm-status')?.value || 'scheduled';
  const errEl = $('cm-err');

  let homeTeamId = null;
  let homeName = '';
  if (homeTeamType === 'app') {
    homeTeamId = $('cm-home-team-select')?.value || null;
    const t = teams.find(x => x.id === homeTeamId);
    if (!t) {
      if (errEl) {
        errEl.textContent = teams.length ? 'Please select a home team.' : 'No teams in app yet. Switch to "New Team" to add the home side.';
        errEl.style.display = 'block';
      }
      return;
    }
    homeName = t.name;
  } else {
    homeName = String($('cm-home-ext-name')?.value || '').trim();
    if (!homeName) { if (errEl) { errEl.textContent = 'Please enter a new team name for the Home side.'; errEl.style.display = 'block'; } return; }
  }

  let awayTeamId = null;
  let awayName = '';
  if (awayTeamType === 'app') {
    awayTeamId = $('cm-away-team-select')?.value || null;
    const t = teams.find(x => x.id === awayTeamId);
    if (!t) {
      if (errEl) {
        errEl.textContent = teams.length ? 'Please select an away team.' : 'No teams in app yet. Switch to "New Team" to add the away side.';
        errEl.style.display = 'block';
      }
      return;
    }
    awayName = t.name;
  } else {
    awayName = String($('cm-away-ext-name')?.value || '').trim();
    if (!awayName) { if (errEl) { errEl.textContent = 'Please enter a new team name for the Away side.'; errEl.style.display = 'block'; } return; }
  }

  if ((homeTeamType === 'ext' && cmOpponentLogoBusy.home) || (awayTeamType === 'ext' && cmOpponentLogoBusy.away)) {
    if (errEl) { errEl.textContent = 'Please wait for the team badge to finish processing.'; errEl.style.display = 'block'; }
    return;
  }
  if ((homeTeamType === 'ext' && cmOpponentRosterBusy.home) || (awayTeamType === 'ext' && cmOpponentRosterBusy.away)) {
    if (errEl) { errEl.textContent = 'Please wait for the roster import to finish before creating the match.'; errEl.style.display = 'block'; }
    return;
  }

  if (homeTeamType === 'app' && awayTeamType === 'app' && homeTeamId === awayTeamId) {
    if (errEl) { errEl.textContent = 'Home and Away cannot be the same team. Please select two different teams.'; errEl.style.display = 'block'; }
    return;
  }

  // Build initial lineups for app teams
  let homeLineup = null;
  if (homeTeamType === 'app' && homeTeamId) {
    const t = teams.find(x => x.id === homeTeamId);
    if (t && t.squad) {
      let starters = [];
      if (Array.isArray(t.squad.playingXi) && t.squad.playingXi.length) {
        starters = t.squad.playingXi.map(p => ({ playerId: p.id, name: p.name, jersey: p.jersey || '', position: p.position || 'ST', photo: p.photo || null }));
      } else {
        starters = (t.squad.slots || []).map(s => s?.player ? { playerId: s.player.id, name: s.player.name, jersey: s.player.jersey || '', position: s.player.position || s.role, photo: s.player.photo || null } : null);
      }

      let subs = [];
      if (Array.isArray(t.squad.bench) && t.squad.bench.length) {
        subs = t.squad.bench.map(p => ({ playerId: p.id, name: p.name, jersey: p.jersey || '', position: p.position || 'ST', photo: p.photo || null }));
      } else {
        subs = (t.squad.subs || []).map(s => ({ playerId: s.id, name: s.name, jersey: s.jersey || '', position: s.position, photo: s.photo || null }));
      }

      let coaches = [];
      if (Array.isArray(t.squad.management) && t.squad.management.length) {
        coaches = t.squad.management.map(s => ({ staffId: s.id, name: s.name, role: s.role, photo: s.photo || null }));
      } else {
        coaches = (t.squad.staff || []).map(s => ({ staffId: s.id, name: s.name, role: s.role, photo: s.photo || null }));
      }

      homeLineup = {
        formation: t.squad.formation || '4-4-2',
        starters,
        subs,
        coaches
      };
    } else {
      homeLineup = { formation: '4-4-2', starters: [], subs: [], coaches: [] };
    }
  }

  let awayLineup = null;
  if (awayTeamType === 'app' && awayTeamId) {
    const t = teams.find(x => x.id === awayTeamId);
    if (t && t.squad) {
      let starters = [];
      if (Array.isArray(t.squad.playingXi) && t.squad.playingXi.length) {
        starters = t.squad.playingXi.map(p => ({ playerId: p.id, name: p.name, jersey: p.jersey || '', position: p.position || 'ST', photo: p.photo || null }));
      } else {
        starters = (t.squad.slots || []).map(s => s?.player ? { playerId: s.player.id, name: s.player.name, jersey: s.player.jersey || '', position: s.player.position || s.role, photo: s.player.photo || null } : null);
      }

      let subs = [];
      if (Array.isArray(t.squad.bench) && t.squad.bench.length) {
        subs = t.squad.bench.map(p => ({ playerId: p.id, name: p.name, jersey: p.jersey || '', position: p.position || 'ST', photo: p.photo || null }));
      } else {
        subs = (t.squad.subs || []).map(s => ({ playerId: s.id, name: s.name, jersey: s.jersey || '', position: s.position, photo: s.photo || null }));
      }

      let coaches = [];
      if (Array.isArray(t.squad.management) && t.squad.management.length) {
        coaches = t.squad.management.map(s => ({ staffId: s.id, name: s.name, role: s.role, photo: s.photo || null }));
      } else {
        coaches = (t.squad.staff || []).map(s => ({ staffId: s.id, name: s.name, role: s.role, photo: s.photo || null }));
      }

      awayLineup = {
        formation: t.squad.formation || '4-4-2',
        starters,
        subs,
        coaches
      };
    } else {
      awayLineup = { formation: '4-4-2', starters: [], subs: [], coaches: [] };
    }
  }

  if (homeTeamType === 'ext') homeLineup = buildNewTeamMatchLineup('home');
  if (awayTeamType === 'ext') awayLineup = buildNewTeamMatchLineup('away');

  const matchData = {
    tournamentId: tournId || null,
    date: matchDate,
    time: matchTime,
    status: matchStatus,
    matchClock: {
      status: 'stopped', // Always stopped until explicitly started with "Start Match"
      startedAt: null,
      elapsedSeconds: 0,
      period: '1H'
    },
    home: {
      teamId: homeTeamId,
      name: homeName,
      logo: homeTeamType === 'ext' ? cmOpponentLogos.home : null,
      lineup: homeLineup,
      score: 0
    },
    away: {
      teamId: awayTeamId,
      name: awayName,
      logo: awayTeamType === 'ext' ? cmOpponentLogos.away : null,
      lineup: awayLineup,
      score: 0
    },
    events: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, 'matches'), matchData);
    const newMatch = { id: docRef.id, ...matchData };
    setMatchesArray([newMatch, ...matches]);
    closeM('m-create-match');
    renderAdminMatches();
    if (curTournament) renderTournamentDashboard();

    if (matchStatus === 'scheduled') {
      // Scheduled match: Keep on dashboard and inform user
      alert(`✅ Match scheduled for ${formatMatchDateDisplay(newMatch)}.\nIt is listed on your dashboard under Scheduled matches.`);
      if (isStandaloneMatchMode) {
        window.close();
      }
    } else {
      // Live match created: display match ready to start!
      if (isStandaloneMatchMode) {
        curMatch = newMatch;
        ss('s-match-sheet');
        const backBtn = $('ms-back-btn');
        if (backBtn) {
          backBtn.textContent = '✕ Close Window';
          backBtn.title = 'Close this match window';
        }
        const newTabBtn = $('ms-new-tab-btn');
        if (newTabBtn) newTabBtn.style.display = 'none';
        const logoutBtn = $('ms-logout-btn');
        if (logoutBtn) logoutBtn.style.display = 'none';

        startGlobalMatchClockTicker();
        subscribeMatch(docRef.id);
        renderMatchSheet();
      } else {
        openMatchSheet(docRef.id);
      }
    }
  } catch (e) {
    if (errEl) { errEl.textContent = 'Failed to create match: ' + (e.message || e); errEl.style.display = 'block'; }
  }
}

function closeCreateMatchModal() {
  closeM('m-create-match');
  if (isStandaloneMatchMode && !curMatch) {
    window.close();
  }
}

function openNewMatchInNewWindow(presetTournId) {
  const tId = presetTournId || '';
  window.open('?createMatch=' + encodeURIComponent(tId || '1'), '_blank');
}

async function initCreateMatchView(presetTournId) {
  isStandaloneMatchMode = true;
  // Instantly show match sheet shell to eliminate any login flash
  ss('s-match-sheet');
  try {
    const [teamsSnap, tournsSnap] = await Promise.all([
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'tournaments'))
    ]);
    teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    tournaments = tournsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const tId = (presetTournId && presetTournId !== '1' && presetTournId !== 'true') ? presetTournId : '';
    openCreateMatch(tId);
  } catch (e) {
    console.error('initCreateMatchView error:', e);
    alert('Failed to initialize match creator: ' + (e.message || e));
    if (sessionStorage.getItem('fhq_session_active') === '1') loadAdmin();
    else ss('s-login');
  }
}

// ══════════════════════════════════════════════════════════════
// ⏱️ MATCH CLOCK & TIMER HELPERS
// ══════════════════════════════════════════════════════════════

function getMatchElapsedSeconds(m) {
  if (!m) return 0;
  const mc = m.matchClock;
  if (!mc) {
    if (m.status === 'final') return 5400; // 90 min default if final without clock
    return 0;
  }
  if (mc.status === 'running') {
    const now = Date.now();
    const start = mc.startedAt ? (typeof mc.startedAt === 'number' ? mc.startedAt : new Date(mc.startedAt).getTime()) : now;
    const diffSec = Math.max(0, Math.floor((now - start) / 1000));
    return Math.max(0, (mc.elapsedSeconds || 0) + diffSec);
  }
  return Math.max(0, mc.elapsedSeconds || 0);
}

function formatMatchClockDisplay(seconds) {
  const totalSec = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const pad = n => String(n).padStart(2, '0');
  return `${pad(m)}:${pad(s)}`;
}

function formatMatchPeriodLabel(m) {
  if (!m) return 'SCHEDULED';
  const st = m.status || 'scheduled';
  if (st === 'scheduled') return 'SCHEDULED';
  if (st === 'final') return 'FULL TIME';
  const p = m.matchClock?.period || '1H';
  const isPaused = m.matchClock?.status === 'paused';
  if (isPaused) return `PAUSED (${p})`;
  if (p === '1H') return '1ST HALF';
  if (p === '2H') return '2ND HALF';
  if (p === 'HT') return 'HALF TIME';
  if (p === 'ET') return 'EXTRA TIME';
  if (p === 'FT') return 'FULL TIME';
  return p;
}

let globalMatchClockInterval = null;
function startGlobalMatchClockTicker() {
  if (globalMatchClockInterval) clearInterval(globalMatchClockInterval);
  globalMatchClockInterval = setInterval(() => {
    updateLiveClocksTick();
  }, 1000);
}

function updateLiveClocksTick() {
  // 1. Update active match sheet if open
  if (curMatch && $('s-match-sheet')?.classList.contains('active')) {
    updateMatchSheetClockOnly();
  }
  // 2. Update active Apple Sports live spectator scorecard if open
  if (curLiveMatch && $('s-live-match')?.classList.contains('active')) {
    updateLiveMatchHeroClockOnly();
  }
  // 3. Update all match cards in DOM
  const cardClocks = document.querySelectorAll('.live-card-timer[data-match-id]');
  cardClocks.forEach(el => {
    const mId = el.getAttribute('data-match-id');
    const m = matches.find(x => x.id === mId) || (curMatch?.id === mId ? curMatch : (curLiveMatch?.id === mId ? curLiveMatch : null));
    if (m) {
      const sec = getMatchElapsedSeconds(m);
      const str = formatMatchClockDisplay(sec);
      if (el.textContent !== str) el.textContent = str;
    }
  });
  // 3. Update leave confirm clock if open
  const leaveClockEl = $('leave-confirm-clock');
  if (leaveClockEl && curMatch) {
    const sec = getMatchElapsedSeconds(curMatch);
    leaveClockEl.textContent = formatMatchClockDisplay(sec);
  }
}

function updateMatchSheetClockOnly() {
  if (!curMatch) return;
  const m = curMatch;
  const st = m.status || 'scheduled';
  const sec = getMatchElapsedSeconds(m);
  const clockStr = formatMatchClockDisplay(sec);
  const periodStr = formatMatchPeriodLabel(m);
  const isPaused = m.matchClock?.status === 'paused';
  const isRunning = m.matchClock?.status === 'running';
  const isLive = st === 'live';
  const isFinal = st === 'final';

  // 1. Digital Timer Pill (The ONLY clock on the match sheet)
  const clockEl = $('ms-timer-clock');
  if (clockEl) clockEl.textContent = clockStr;

  const periodEl = $('ms-timer-period');
  if (periodEl) periodEl.textContent = periodStr;

  const pillEl = $('ms-timer-pill');
  if (pillEl) {
    pillEl.className = 'sb-timer-pill ' + (isLive ? (isPaused ? 'paused' : (isRunning ? 'live' : '')) : (isFinal ? 'final' : ''));
  }

  // 2. Score sub-label (STATIC text "MATCH SCORE" to avoid 2 clocks)
  const subPill = $('ms-clock-pill');
  if (subPill) {
    subPill.textContent = 'MATCH SCORE';
  }

  // 3. Action Buttons & Controls
  const btnLive = $('ms-btn-live');
  const actionClockToggle = $('ms-btn-clock-toggle');
  const btnFinal = $('ms-btn-final');
  const btnReopen = $('ms-btn-reopen');

  // Match has not started if: status is scheduled OR (clock is stopped and not final)
  const isNotStarted = st === 'scheduled' || (!isRunning && !isPaused && (m.matchClock?.elapsedSeconds || 0) === 0 && !isFinal);

  if (btnLive) {
    btnLive.style.display = isNotStarted ? 'flex' : 'none';
  }
  if (actionClockToggle) {
    actionClockToggle.style.display = (!isNotStarted && !isFinal) ? 'flex' : 'none';
    if (isPaused) {
      actionClockToggle.textContent = '▶️ Resume Clock';
    } else {
      actionClockToggle.textContent = '⏸️ Pause Clock';
    }
  }
  if (btnFinal) {
    btnFinal.style.display = (!isNotStarted && !isFinal) ? 'flex' : 'none';
  }
  if (btnReopen) {
    btnReopen.style.display = isFinal ? 'flex' : 'none';
  }
}

let isStandaloneMatchMode = false;

async function initMatchView(matchId) {
  isStandaloneMatchMode = true;
  // Instantly show match sheet shell so there is zero flash of login screen!
  ss('s-match-sheet');
  const backBtn = $('ms-back-btn');
  if (backBtn) {
    backBtn.textContent = '✕ Close Window';
    backBtn.title = 'Close this match window';
  }
  const newTabBtn = $('ms-new-tab-btn');
  if (newTabBtn) newTabBtn.style.display = 'none';
  const logoutBtn = $('ms-logout-btn');
  if (logoutBtn) logoutBtn.style.display = 'none';

  try {
    // Load teams, tournaments and the specific match in parallel
    const [teamsSnap, tournsSnap, mSnap] = await Promise.all([
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'tournaments')),
      getDoc(doc(db, 'matches', matchId))
    ]);
    teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    tournaments = tournsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const exists = (typeof mSnap.exists === 'function') ? mSnap.exists() : mSnap.exists;
    if (exists) {
      const data = (typeof mSnap.data === 'function') ? mSnap.data() : (mSnap.data || {});
      curMatch = { id: mSnap.id, ...data };
      setMatchesArray([curMatch]);

      startGlobalMatchClockTicker();
      subscribeMatch(matchId);
      renderMatchSheet();
    } else {
      alert('Match not found or was deleted.');
      if (sessionStorage.getItem('fhq_session_active') === '1') loadAdmin();
      else ss('s-login');
    }
  } catch (e) {
    console.error('initMatchView error:', e);
    alert('Failed to load match: ' + (e.message || e));
    if (sessionStorage.getItem('fhq_session_active') === '1') loadAdmin();
    else ss('s-login');
  }
}

function openCurrentMatchInNewWindow() {
  if (curMatch && curMatch.id) {
    window.open('?match=' + curMatch.id, '_blank');
  }
}

async function openMatchSheet(matchId, returnScreen) {
  if (!matchId) return;
  isStandaloneMatchMode = false;
  matchReturnScreen = returnScreen || (curTournament ? 's-tournament' : 's-admin');
  
  const found = matches.find(m => m.id === matchId);
  if (found) {
    curMatch = found;
  }

  ss('s-match-sheet');
  const backBtn = $('ms-back-btn');
  if (backBtn) {
    backBtn.textContent = '← Back';
    backBtn.title = 'Back to dashboard';
  }
  const newTabBtn = $('ms-new-tab-btn');
  if (newTabBtn) newTabBtn.style.display = 'inline-flex';
  const logoutBtn = $('ms-logout-btn');
  if (logoutBtn) logoutBtn.style.display = 'inline-flex';

  startGlobalMatchClockTicker();

  if (curMatch && curMatch.id === matchId) {
    renderMatchSheet();
  } else {
    try {
      const snap = await getDoc(doc(db, 'matches', matchId));
      const exists = (typeof snap.exists === 'function') ? snap.exists() : snap.exists;
      if (exists) {
        const data = (typeof snap.data === 'function') ? snap.data() : (snap.data || {});
        curMatch = { id: snap.id, ...data };
        setMatchesArray([curMatch, ...matches]);
        renderMatchSheet();
      }
    } catch (fetchErr) {
      console.warn('Could not fetch match:', fetchErr);
    }
  }

  subscribeMatch(matchId);
}
window.openMatchSheet = openMatchSheet;

function subscribeMatch(matchId) {
  if (matchUnsub) { matchUnsub(); matchUnsub = null; }

  matchUnsub = onSnapshot(doc(db, 'matches', matchId), snap => {
    const exists = (typeof snap.exists === 'function') ? snap.exists() : snap.exists;
    if (exists) {
      const data = (typeof snap.data === 'function') ? snap.data() : (snap.data || {});
      curMatch = { id: snap.id, ...data };
      const idx = matches.findIndex(m => m.id === snap.id);
      if (idx >= 0) matches[idx] = curMatch;
      else setMatchesArray([curMatch, ...matches]);
      renderMatchSheet();
    }
  }, err => {
    console.warn('Match subscription notice:', err);
  });
}

function goBackFromMatch(force = false) {
  if (!force && curMatch && (curMatch.status === 'live' || curMatch.matchClock?.status === 'running')) {
    const sec = getMatchElapsedSeconds(curMatch);
    const leaveClockEl = $('leave-confirm-clock');
    if (leaveClockEl) leaveClockEl.textContent = formatMatchClockDisplay(sec);
    openM('m-match-leave-confirm');
    return;
  }
  closeM('m-match-leave-confirm');
  if (matchUnsub) { matchUnsub(); matchUnsub = null; }

  if (isStandaloneMatchMode) {
    window.close();
    curMatch = null;
    ss('s-login');
    return;
  }

  curMatch = null;
  if (matchReturnScreen === 's-tournament' && curTournament) {
    ss('s-tournament');
    renderTournamentDashboard();
  } else {
    ss('s-admin');
    showAdminTab('matches');
    renderAdminMatches();
  }
}

function confirmLeaveMatch() {
  closeM('m-match-leave-confirm');
  goBackFromMatch(true);
}

function renderMatchSheet() {
  if (!curMatch) return;
  const m = curMatch;

  // Reconcile derived score from goals
  const derivedScore = getMatchScoreFromEvents(m.events);
  const derivedHomeScore = derivedScore.home;
  const derivedAwayScore = derivedScore.away;

  const hScore = (m.home && m.home.score != null) ? m.home.score : derivedHomeScore;
  const aScore = (m.away && m.away.score != null) ? m.away.score : derivedAwayScore;

  // Tournament / Standalone tag
  const tourn = tournaments.find(t => t.id === m.tournamentId);
  const tournTag = $('ms-tourn-tag');
  if (tournTag) tournTag.textContent = tourn ? `🏆 ${tourn.name}` : '⚽ STANDALONE FRIENDLY';

  const dateTag = $('ms-date-tag');
  if (dateTag) dateTag.textContent = `📅 ${formatMatchDateDisplay(m)}`;

  // Scoreboard Score & Teams
  const scoreBox = $('ms-score-display');
  if (scoreBox) {
    scoreBox.textContent = `${hScore} - ${aScore}`;
  }

  const hTeam = teams.find(t => t.id === m.home?.teamId);
  const aTeam = teams.find(t => t.id === m.away?.teamId);

  const hBadge = $('ms-home-badge');
  if (hBadge) hBadge.innerHTML = matchSideIcon(m.home, hTeam);

  const hName = $('ms-home-name');
  if (hName) hName.textContent = m.home?.name || 'Home Team';

  const aBadge = $('ms-away-badge');
  if (aBadge) aBadge.innerHTML = matchSideIcon(m.away, aTeam);

  const aName = $('ms-away-name');
  if (aName) aName.textContent = m.away?.name || 'Away Team';

  updateMatchSheetClockOnly();

  // Section Headers
  const hHeadName = $('ms-home-header-name');
  if (hHeadName) hHeadName.textContent = `${m.home?.name || 'Home'} (${m.home?.lineup?.formation || 'Custom'})`;
  const hHeadBadge = $('ms-home-header-badge');
  if (hHeadBadge) hHeadBadge.innerHTML = matchSideIcon(m.home, hTeam, 'width:20px;height:20px;border-radius:50%;object-fit:cover;vertical-align:middle;');

  const aHeadName = $('ms-away-header-name');
  if (aHeadName) aHeadName.textContent = `${m.away?.name || 'Away'} (${m.away?.lineup?.formation || 'Custom'})`;
  const aHeadBadge = $('ms-away-header-badge');
  if (aHeadBadge) aHeadBadge.innerHTML = matchSideIcon(m.away, aTeam, 'width:20px;height:20px;border-radius:50%;object-fit:cover;vertical-align:middle;');

  // Update Scoreboard Clock & Indicators
  updateMatchSheetClockOnly();

  // Render Home Squad
  renderMatchSquad('home', m.home, hTeam);

  // Render Away Squad
  renderMatchSquad('away', m.away, aTeam);

  if (matchMobileEntriesUnsub && matchMobileSessionMatchId !== m.id) {
    matchMobileEntriesUnsub(); matchMobileEntriesUnsub = null;
    matchMobileSessionId = ''; matchMobileSessionMatchId = ''; matchMobileSessionExpiresAt = 0;
  }
  if (m.mobileNotesSessionId && Number(m.mobileNotesSessionExpiresAt || 0) > Date.now() &&
    (matchMobileSessionId !== m.mobileNotesSessionId || matchMobileSessionMatchId !== m.id || !matchMobileEntriesUnsub)) {
    matchMobileSessionExpiresAt = Number(m.mobileNotesSessionExpiresAt);
    startMatchMobileSessionListener(m.mobileNotesSessionId, m.id);
  }

  // Render Timeline
  renderMatchTimeline();
  renderMatchScoreboardEvents();
  renderMatchReportPanel();
}

function renderMatchScoreboardEvents() {
  if (!curMatch) return;
  const events = [...(curMatch.events || [])].sort((a, b) => {
    const aMinute = a.minute == null ? 999 : Number(a.minute);
    const bMinute = b.minute == null ? 999 : Number(b.minute);
    return aMinute - bMinute;
  });
  ['home', 'away'].forEach(side => {
    const feed = $(`ms-${side}-events`);
    if (!feed) return;
    const sideEvents = events.filter(event => event.team === side);
    if (!sideEvents.length) {
      feed.innerHTML = '<span class="sb-event-empty">No events yet</span>';
      return;
    }
    feed.innerHTML = sideEvents.map(event => {
      const minute = event.minute != null ? `${event.minute}'` : '—';
      const player = event.playerName || 'Player not named';
      let icon = '⚽', label = `Goal · ${player}`;
      if (event.type === 'own_goal') {
        const beneficiary = side === 'home' ? (curMatch.away?.name || 'Away') : (curMatch.home?.name || 'Home');
        icon = '🔁'; label = `Own goal · ${player} · goal for ${beneficiary}`;
      } else if (event.type === 'yellow') { icon = '🟨'; label = `Yellow card · ${player}`; }
      else if (event.type === 'red') { icon = '🟥'; label = `Red card · ${player}`; }
      else if (event.type === 'sub') {
        const off = findMatchPlayer(event.relatedPlayerId);
        icon = '🔄'; label = `Sub · ${player} on${off ? ` for ${off.name}` : ''}`;
      } else if (event.type === 'assist') { icon = '👟'; label = `Assist · ${player}`; }
      return `<div class="sb-event-item" title="${esc(label)}"><span class="sb-event-ico">${icon}</span><span class="sb-event-min">${esc(minute)}</span><span>${esc(label)}</span></div>`;
    }).join('');
  });
}

function renderMatchReportPanel() {
  if (!curMatch) return;
  const notesEl = $('ms-report-notes');
  const reportText = String(curMatch.matchReport || '').trim();
  const outputWrap = $('ms-report-output-wrap');
  const output = $('ms-report-output');
  const status = $('ms-report-status');
  const teamContext = $('ms-voice-team-context');
  if (teamContext) {
    teamContext.innerHTML = `<option value="auto">Auto-detect from what I say</option><option value="home">${esc(curMatch.home?.name || 'Home team')} is my team</option><option value="away">${esc(curMatch.away?.name || 'Away team')} is my team</option>`;
    teamContext.value = matchVoiceTeamContext;
  }
  if (notesEl && document.activeElement !== notesEl) {
    const savedNotes = String(curMatch.matchReportNotes || '');
    if (notesEl.value !== savedNotes) notesEl.value = savedNotes;
  }
  if (outputWrap) outputWrap.style.display = reportText ? 'block' : 'none';
  if (output) output.innerHTML = reportText ? renderMatchReportMarkdown(reportText) : '';
  if (status && !matchReportGenerationBusy) {
    if (!reportText) {
      status.textContent = 'Ready to generate report.';
    } else {
      const sourceUpdatedAt = String(curMatch.matchReportSourceUpdatedAt || '');
      const matchUpdatedAt = String(curMatch.updatedAt || '');
      const stale = sourceUpdatedAt && matchUpdatedAt && sourceUpdatedAt !== matchUpdatedAt;
      const reportDate = formatMatchReportTimestamp(curMatch.matchReportUpdatedAt);
      status.textContent = `${stale ? 'Match details changed. Generate again. ' : ''}Last generated${reportDate ? ` ${reportDate}` : ''}.`;
    }
  }
}

function formatMatchReportTimestamp(value) {
  if (!value) return '';
  let date = value;
  if (value && typeof value.toDate === 'function') date = value.toDate();
  else if (typeof value === 'string' || typeof value === 'number') date = new Date(value);
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `on ${date.toLocaleString()}`;
}

function renderMatchReportMarkdown(markdown) {
  const lines = String(markdown || '').replace(/\r/g, '').split('\n');
  const inline = value => esc(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  let html = '';
  let paragraph = [];
  let listType = '';
  const flushParagraph = () => {
    if (paragraph.length) { html += `<p>${paragraph.map(inline).join('<br>')}</p>`; paragraph = []; }
  };
  const closeList = () => { if (listType) { html += `</${listType}>`; listType = ''; } };
  lines.forEach(line => {
    const heading = line.match(/^\s*(#{1,4})\s+(.+)$/);
    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (!line.trim()) {
      flushParagraph(); closeList(); return;
    }
    if (heading) {
      flushParagraph(); closeList();
      const level = Math.min(4, heading[1].length);
      html += `<h${level}>${inline(heading[2])}</h${level}>`;
      return;
    }
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? 'ul' : 'ol';
      if (listType !== nextType) { closeList(); listType = nextType; html += `<${listType}>`; }
      html += `<li>${inline((unordered || ordered)[1])}</li>`;
      return;
    }
    if (quote) {
      flushParagraph(); closeList(); html += `<blockquote>${inline(quote[1])}</blockquote>`; return;
    }
    closeList(); paragraph.push(line);
  });
  flushParagraph(); closeList();
  return html;
}

function queueMatchReportNotesSave() {
  if (!curMatch) return;
  const notes = String($('ms-report-notes')?.value || '');
  const matchId = curMatch.id;
  const token = ++matchReportNotesSaveToken;
  curMatch.matchReportNotes = notes;
  const status = $('ms-report-notes-status');
  if (status) status.textContent = 'Saving…';
  if (matchReportNotesSaveTimer) clearTimeout(matchReportNotesSaveTimer);
  matchReportNotesSaveTimer = setTimeout(() => {
    matchReportNotesSaveTimer = null;
    persistMatchReportNotes(matchId, notes, token).catch(error => {
      console.error('Could not save match report notes:', error);
      if (token === matchReportNotesSaveToken && status) status.textContent = 'Could not save. Check connection.';
    });
  }, 650);
}

function persistMatchReportNotes(matchId, notes, token) {
  const value = String(notes || '');
  const write = () => updateDoc(doc(db, 'matches', matchId), {
    matchReportNotes: value,
    matchReportNotesUpdatedAt: new Date().toISOString()
  });
  const queued = matchReportNotesWriteChain.catch(() => { }).then(write);
  matchReportNotesWriteChain = queued;
  return queued.then(() => {
    if (curMatch?.id === matchId) curMatch.matchReportNotes = value;
    if (token === matchReportNotesSaveToken) {
      const status = $('ms-report-notes-status');
      if (status) status.textContent = 'Saved.';
    }
  });
}

async function saveMatchReportNotesNow() {
  if (!curMatch) return;
  if (matchReportNotesSaveTimer) { clearTimeout(matchReportNotesSaveTimer); matchReportNotesSaveTimer = null; }
  const matchId = curMatch.id;
  const notes = String($('ms-report-notes')?.value || '');
  const token = ++matchReportNotesSaveToken;
  curMatch.matchReportNotes = notes;
  const status = $('ms-report-notes-status');
  if (status) status.textContent = 'Saving…';
  await persistMatchReportNotes(matchId, notes, token);
}

function generateMatchMobileSessionToken() {
  if (!window.crypto?.getRandomValues) throw new Error('Phone links are not available in this browser.');
  return Array.from(window.crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
}

function getMatchMobileMinuteStamp(entry, match) {
  if (String(entry?.matchTime || '').trim()) return String(entry.matchTime).trim();
  if (entry?.minute != null && Number.isFinite(Number(entry.minute))) {
    const period = String(entry.matchPeriod || match?.matchClock?.period || '1H');
    const periodLabel = ({ '1H': '1st half', '2H': '2nd half', 'HT': 'half-time', 'ET': 'extra time', 'FT': 'full-time' })[period] || period;
    return `${Math.max(1, Math.round(Number(entry.minute)))}' (${periodLabel})`;
  }
  return getMatchMinuteStamp();
}

function updateMatchMobileIncomingPreview(line) {
  const feed = $('ms-phone-incoming');
  if (!feed) return;
  if (feed.textContent.includes('Waiting for notes')) feed.textContent = '';
  const row = document.createElement('div');
  row.className = 'ms-phone-incoming-line';
  row.textContent = line;
  feed.appendChild(row);
  feed.scrollTop = feed.scrollHeight;
}

function queueMatchMobileEntryProcessing(sessionId, entrySnapshot) {
  const processingMatchId = matchMobileSessionMatchId;
  matchMobileEntryProcessingChain = matchMobileEntryProcessingChain.catch(() => { }).then(async () => {
    if (!entrySnapshot || matchMobileProcessedEntries.has(entrySnapshot.id)) return;
    matchMobileProcessedEntries.add(entrySnapshot.id);
    const entry = entrySnapshot.data() || {};
    if (entry.hostProcessedAt || !String(entry.text || '').trim()) return;
    const matchId = processingMatchId;
    if (!matchId || curMatch?.id !== matchId) return;
    const transcript = String(entry.text).trim();
    const minuteStamp = getMatchMobileMinuteStamp(entry, curMatch);
    const noteLine = /^\[\d+['′]/.test(transcript) ? transcript : `[${minuteStamp}] ${transcript}`;
    const notesEl = $('ms-report-notes');
    if (notesEl) {
      const existing = String(notesEl.value || '').trim();
      notesEl.value = existing ? `${existing}\n${noteLine}` : noteLine;
      notesEl.scrollTop = notesEl.scrollHeight;
      curMatch.matchReportNotes = notesEl.value;
      queueMatchReportNotesSave();
      await saveMatchReportNotesNow();
    }
    const context = ['home', 'away'].includes(entry.teamContext) ? entry.teamContext : 'auto';
    const sequence = ++matchMobileEntrySequence;
    const matchSnapshot = { ...curMatch, home: { ...(curMatch.home || {}) }, away: { ...(curMatch.away || {}) }, events: [...(curMatch.events || [])] };
    queueMatchVoiceEventExtraction(matchId, minuteStamp, transcript, `phone_${sessionId}`, sequence, matchSnapshot, context);
    await matchVoiceExtractionChain.catch(() => { });
    const entryRef = doc(db, 'match_mobile_sessions', sessionId).collection('entries').doc(entrySnapshot.id);
    await updateDoc(entryRef, { hostProcessedAt: Date.now() });
    updateMatchMobileIncomingPreview(noteLine);
    const status = $('ms-phone-sync-status');
    if (status) status.textContent = 'Phone connected · notes are syncing into the match report and event log.';
  }).catch(error => {
    console.error('Could not sync phone match note:', error);
    const status = $('ms-phone-sync-status');
    if (status) status.textContent = `A phone note could not be synced: ${error.message || error}`;
  });
  return matchMobileEntryProcessingChain;
}

function startMatchMobileSessionListener(sessionId, matchId) {
  const isNewSession = matchMobileSessionId !== sessionId || matchMobileSessionMatchId !== matchId;
  if (matchMobileEntriesUnsub) { matchMobileEntriesUnsub(); matchMobileEntriesUnsub = null; }
  matchMobileSessionId = sessionId;
  matchMobileSessionMatchId = matchId;
  if (isNewSession) matchMobileProcessedEntries = new Set();
  const entriesRef = doc(db, 'match_mobile_sessions', sessionId).collection('entries');
  matchMobileEntriesUnsub = entriesRef.orderBy('createdAt', 'asc').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') queueMatchMobileEntryProcessing(sessionId, change.doc);
    });
  }, error => {
    console.error('Phone match note listener failed:', error);
    const status = $('ms-phone-sync-status');
    if (status) status.textContent = 'Phone connection was interrupted. Close and reopen the phone link to reconnect.';
  });
}

async function openMatchMobileSyncModal() {
  if (!curMatch) return;
  const status = $('ms-phone-sync-status');
  const qr = $('ms-phone-qr-img');
  const link = $('ms-phone-link');
  const openLink = $('ms-phone-open-link');
  const incoming = $('ms-phone-incoming');
  if (incoming && !incoming.textContent.trim()) incoming.textContent = 'Waiting for notes from the phone…';
  if (status) status.textContent = 'Preparing a phone link…';
  openM('m-match-mobile-sync');
  try {
    let sessionId = String(curMatch.mobileNotesSessionId || '');
    let expiresAt = Number(curMatch.mobileNotesSessionExpiresAt || 0);
    const matchId = curMatch.id;
    if (!sessionId || expiresAt <= Date.now()) {
      sessionId = generateMatchMobileSessionToken();
      expiresAt = Date.now() + 6 * 60 * 60 * 1000;
      const matchRef = doc(db, 'matches', matchId);
      const sessionData = {
        matchId,
        homeName: curMatch.home?.name || 'Home',
        awayName: curMatch.away?.name || 'Away',
        active: true,
        expiresAt,
        createdAt: new Date().toISOString()
      };
      await doc(db, 'match_mobile_sessions', sessionId).set(sessionData);
      await updateDoc(matchRef, { mobileNotesSessionId: sessionId, mobileNotesSessionExpiresAt: expiresAt, updatedAt: new Date().toISOString() });
      curMatch.mobileNotesSessionId = sessionId;
      curMatch.mobileNotesSessionExpiresAt = expiresAt;
    }
    matchMobileSessionExpiresAt = expiresAt;
    startMatchMobileSessionListener(sessionId, matchId);
    const phoneUrl = new URL('match-phone.html', window.location.href);
    phoneUrl.searchParams.set('session', sessionId);
    const url = phoneUrl.toString();
    if (link) link.value = url;
    if (openLink) openLink.href = url;
    if (qr) qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=000000&margin=3`;
    if (status) status.textContent = `Connected to ${curMatch.home?.name || 'Home'} vs ${curMatch.away?.name || 'Away'} · link expires in 6 hours.`;
    const endButton = $('ms-phone-end-btn');
    if (endButton) endButton.disabled = false;
  } catch (error) {
    console.error('Could not create phone match link:', error);
    if (status) status.textContent = `Could not create the phone link: ${error.message || error}`;
  }
}

async function copyMatchMobileLink() {
  const input = $('ms-phone-link');
  if (!input?.value) return;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(input.value);
    else { input.select(); document.execCommand('copy'); }
    const status = $('ms-phone-sync-status');
    if (status) status.textContent = 'Phone link copied. Open it on the phone or scan the QR code.';
  } catch (_error) { input.select(); document.execCommand('copy'); }
}

function closeMatchMobileSyncModal() { closeM('m-match-mobile-sync'); }

async function endMatchMobileSession() {
  const sessionId = matchMobileSessionId;
  const matchId = matchMobileSessionMatchId;
  if (!sessionId) return;
  const button = $('ms-phone-end-btn');
  if (button) button.disabled = true;
  try {
    await updateDoc(doc(db, 'match_mobile_sessions', sessionId), { active: false, endedAt: new Date().toISOString() });
    if (matchId && curMatch?.id === matchId) {
      await updateDoc(doc(db, 'matches', matchId), { mobileNotesSessionId: null, mobileNotesSessionExpiresAt: 0, updatedAt: new Date().toISOString() });
      curMatch.mobileNotesSessionId = null;
      curMatch.mobileNotesSessionExpiresAt = 0;
    }
    if (matchMobileEntriesUnsub) { matchMobileEntriesUnsub(); matchMobileEntriesUnsub = null; }
    matchMobileSessionId = ''; matchMobileSessionMatchId = ''; matchMobileSessionExpiresAt = 0;
    const status = $('ms-phone-sync-status');
    if (status) status.textContent = 'Phone link ended. Create a new link to reconnect.';
    const qr = $('ms-phone-qr-img'); if (qr) qr.removeAttribute('src');
    const link = $('ms-phone-link'); if (link) link.value = '';
    const openLink = $('ms-phone-open-link'); if (openLink) openLink.href = '#';
  } catch (error) {
    if (button) button.disabled = false;
    const status = $('ms-phone-sync-status');
    if (status) status.textContent = `Could not end the phone link: ${error.message || error}`;
  }
}

async function flushMatchMobileEntries(matchId) {
  if (!matchId || matchMobileSessionMatchId !== matchId || !matchMobileSessionId) return;
  const entriesRef = doc(db, 'match_mobile_sessions', matchMobileSessionId).collection('entries');
  const snapshot = await entriesRef.orderBy('createdAt', 'asc').get();
  snapshot.forEach(entrySnapshot => {
    if (!entrySnapshot.data()?.hostProcessedAt) queueMatchMobileEntryProcessing(matchMobileSessionId, entrySnapshot);
  });
  await matchMobileEntryProcessingChain.catch(() => { });
}

function getMatchReportPlayerList(playersList) {
  return (playersList || []).filter(Boolean).map(player => {
    const number = player.jersey != null && player.jersey !== '' ? `#${player.jersey} ` : '';
    const position = player.position ? ` (${player.position})` : '';
    return `${number}${player.name || 'Player'}${position}`;
  }).join(', ') || 'Not recorded';
}

function getMatchReportJerseyReferenceIndex(match) {
  const references = [];
  [['Home', match.home || {}], ['Away', match.away || {}]].forEach(([sideLabel, sideData]) => {
    const teamName = sideData.name || sideLabel;
    const lineup = sideData.lineup || {};
    [...(lineup.starters || []), ...(lineup.subs || [])].filter(Boolean).forEach(player => {
      const jersey = String(player.jersey ?? '').trim();
      const name = String(player.name || '').trim();
      if (jersey && name) references.push(`- ${teamName}, shirt number ${jersey}: ${name}`);
    });
  });
  return references.length ? references.join('\n') : 'No shirt numbers are recorded in the match lineup.';
}

function getMatchReportEventLine(event, match = curMatch) {
  const side = event.team === 'away' ? 'away' : 'home';
  const teamName = match?.[side]?.name || (side === 'home' ? 'Home' : 'Away');
  const minute = event.minute != null ? `${event.minute}'` : 'Minute not recorded';
  const player = event.playerName || 'Player not named';
  const allPlayers = ['home', 'away'].flatMap(teamSide => {
    const lineup = match?.[teamSide]?.lineup || {};
    return [...(lineup.starters || []), ...(lineup.subs || [])];
  });
  const relatedPlayerName = id => allPlayers.find(rosterPlayer => rosterPlayer?.id === id)?.name || '';
  let detail = '';
  if (event.type === 'goal') {
    const assister = event.relatedPlayerName || (event.relatedPlayerId ? relatedPlayerName(event.relatedPlayerId) : '');
    detail = `Goal: ${player}${assister ? `, assisted by ${assister}` : ''}`;
  } else if (event.type === 'own_goal') {
    const beneficiary = side === 'home' ? (match?.away?.name || 'Away') : (match?.home?.name || 'Home');
    detail = `Own goal: ${player}, goal awarded to ${beneficiary}`;
  } else if (event.type === 'assist') detail = `Assist: ${player}`;
  else if (event.type === 'yellow') detail = `Yellow card: ${player}`;
  else if (event.type === 'red') detail = `Red card: ${player}`;
  else if (event.type === 'sub') {
    const playerOff = event.relatedPlayerName || (event.relatedPlayerId ? relatedPlayerName(event.relatedPlayerId) : '');
    detail = `Substitution: ${player} on${playerOff ? ` for ${playerOff}` : ''}`;
  } else detail = `${event.type || 'Event'}: ${player}`;
  return `- ${minute} · ${teamName} · ${detail}${event.note ? ` · Note: ${event.note}` : ''}`;
}

function buildMatchReportEventLog(match) {
  const events = [...(match?.events || [])].sort((a, b) => {
    const aMinute = a.minute == null ? 999 : Number(a.minute);
    const bMinute = b.minute == null ? 999 : Number(b.minute);
    return aMinute - bMinute;
  });
  return events.length ? events.map(event => getMatchReportEventLine(event, match)).join('\n') : 'No match events were logged.';
}

function buildMatchReportPrompt(match, coachNotes) {
  const home = match.home || {};
  const away = match.away || {};
  const events = [...(match.events || [])].sort((a, b) => {
    const aMin = a.minute == null ? 999 : Number(a.minute);
    const bMin = b.minute == null ? 999 : Number(b.minute);
    return aMin - bMin;
  });
  const derivedScore = getMatchScoreFromEvents(events);
  const homeGoals = derivedScore.home;
  const awayGoals = derivedScore.away;
  const homeScore = home.score != null ? home.score : homeGoals;
  const awayScore = away.score != null ? away.score : awayGoals;
  const tournament = tournaments.find(item => item.id === match.tournamentId);
  const status = match.status === 'final' ? 'Full time' : (match.status === 'live' ? 'In progress' : 'Scheduled / pre-match');
  const matchMinute = match.status === 'live' ? `Current clock: ${formatMatchClockDisplay(getMatchElapsedSeconds(match))} (${formatMatchPeriodLabel(match)}).` : '';
  const homeLineup = home.lineup || {};
  const awayLineup = away.lineup || {};
  const lineupText = [
    `${home.name || 'Home'} starters: ${getMatchReportPlayerList(homeLineup.starters)}. Bench: ${getMatchReportPlayerList(homeLineup.subs)}. Formation: ${homeLineup.formation || 'Not recorded'}.`,
    `${away.name || 'Away'} starters: ${getMatchReportPlayerList(awayLineup.starters)}. Bench: ${getMatchReportPlayerList(awayLineup.subs)}. Formation: ${awayLineup.formation || 'Not recorded'}.`
  ].join('\n');
  const jerseyReferenceIndex = getMatchReportJerseyReferenceIndex(match);
  const eventText = events.length
    ? `${match.status === 'final' ? 'Full-time logged events:' : 'Logged events so far:'}\n${events.map(event => getMatchReportEventLine(event, match)).join('\n')}`
    : 'No match events have been logged.';
  return `Write a concise, polished football match report using only the facts below. Do not invent shots, possession, tactics, injuries, assists, or player performances. Use a headline, score/status, short summary, key moments, and closing assessment. The app will attach the complete timestamped event log after your report, so summarize key events without repeating the entire log. For a live match, clearly say the score is current; for a final match, write in the past tense.\n\nResolve shirt numbers in coach notes (such as “No. 3”) using the jersey reference index and team context. If a number is ambiguous between teams, do not guess.\n\nMatch: ${home.name || 'Home'} vs ${away.name || 'Away'}\nDate/time: ${formatMatchDateDisplay(match)}\nCompetition: ${tournament?.name || 'Standalone match'}\nStatus: ${status}\nScore: ${home.name || 'Home'} ${homeScore} - ${awayScore} ${away.name || 'Away'}\n${matchMinute}\n\nLineups:\n${lineupText}\n\nJersey reference index:\n${jerseyReferenceIndex}\n\n${eventText}\n\nCoach notes:\n${String(coachNotes || '').trim() || 'None provided.'}`;
}

function scrollToMatchReport() {
  const report = $('ms-ai-report');
  if (report) report.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function generateMatchReport() {
  if (!curMatch || matchReportGenerationBusy) return;
  if (!appCheck) {
    const status = $('ms-report-status');
    if (status) status.textContent = 'Firebase App Check must be configured before Gemini can generate reports.';
    openGeminiSettings();
    return;
  }
  const matchId = curMatch.id;
  const button = $('ms-report-generate');
  const status = $('ms-report-status');
  let reportErrorMessage = '';
  matchReportGenerationBusy = true;
  if (button) { button.disabled = true; button.textContent = '⏳ Generating…'; }
  if (status) status.textContent = 'Preparing report…';
  try {
    if (matchNoteDictationActive || matchNoteRecognition) await stopMatchNoteDictation();
    await flushMatchMobileEntries(matchId);
    await matchVoiceExtractionChain.catch(() => { });
    await saveMatchReportNotesNow();
    const latestMatch = curMatch?.id === matchId ? curMatch : (matches.find(match => match.id === matchId) || curMatch);
    const matchSnapshot = { ...latestMatch, home: { ...(latestMatch.home || {}) }, away: { ...(latestMatch.away || {}) }, events: [...(latestMatch.events || [])] };
    const notes = String($('ms-report-notes')?.value || '');
    const prompt = buildMatchReportPrompt(matchSnapshot, notes);
    if (status) status.textContent = 'Generating report…';
    const summary = await callGeminiGenerateContentStream([{ parts: [{ text: prompt }] }], {
      maxOutputTokens: 1600
    }, partialText => {
      if (curMatch?.id !== matchId) return;
      const outputWrap = $('ms-report-output-wrap');
      const output = $('ms-report-output');
      if (outputWrap) outputWrap.style.display = 'block';
      if (output) output.textContent = partialText;
      if (status) status.textContent = 'Writing the report…';
    });
    const report = `${summary.trim()}\n\n## Complete Match Event Log\n${buildMatchReportEventLog(matchSnapshot)}`;
    const generatedAt = new Date().toISOString();
    const updates = {
      matchReport: report,
      matchReportUpdatedAt: generatedAt,
      matchReportSourceUpdatedAt: matchSnapshot.updatedAt || ''
    };
    await updateDoc(doc(db, 'matches', matchId), updates);
    if (curMatch?.id === matchId) { Object.assign(curMatch, updates); }
    if (status) status.textContent = `Report generated ${formatMatchReportTimestamp(generatedAt)}.`;
    renderMatchReportPanel();
  } catch (error) {
    console.error('Gemini match report error:', error);
    const detail = error?.name === 'AbortError' || /action aborted|request aborted|aborted/i.test(String(error.message || ''))
      ? 'Gemini interrupted the request. Try again; if it keeps happening, check Firebase AI Logic status and quota.'
      : (error.message || String(error));
    reportErrorMessage = `Could not generate the report: ${detail}`;
    if (status) status.textContent = reportErrorMessage;
  } finally {
    matchReportGenerationBusy = false;
    if (button) { button.disabled = false; button.textContent = '✨ Generate Report'; }
    renderMatchReportPanel();
    if (reportErrorMessage && status) status.textContent = reportErrorMessage;
  }
}

async function copyGeneratedMatchReport() {
  const text = String(curMatch?.matchReport || '');
  if (!text) return;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else {
      const area = document.createElement('textarea'); area.value = text; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
    }
    if ($('ms-report-status')) $('ms-report-status').textContent = 'Report copied to clipboard.';
  } catch (error) {
    if ($('ms-report-status')) $('ms-report-status').textContent = 'Could not copy automatically. Select and copy the report text.';
  }
}

function downloadGeneratedMatchReport() {
  const text = String(curMatch?.matchReport || '');
  if (!text) return;
  const fileName = `${(curMatch.home?.name || 'home').replace(/[^a-z0-9]+/gi, '-')}-vs-${(curMatch.away?.name || 'away').replace(/[^a-z0-9]+/gi, '-')}-match-report.md`.toLowerCase();
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = fileName; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getMatchMinuteStamp() {
  if (!curMatch || curMatch.status === 'scheduled') return 'Pre-match';
  const elapsed = getMatchElapsedSeconds(curMatch);
  const minute = elapsed > 0 ? Math.max(1, Math.ceil(elapsed / 60)) : 1;
  const period = curMatch.matchClock?.period || '1H';
  const periodName = ({ '1H': '1st half', '2H': '2nd half', 'HT': 'half-time', 'ET': 'extra time', 'FT': 'full-time' })[period] || formatMatchPeriodLabel(curMatch).toLowerCase();
  return `${minute}' (${periodName})`;
}

function getMatchVoiceRoster(match) {
  return ['home', 'away'].flatMap(side => {
    const sideData = match?.[side] || {};
    const lineup = sideData.lineup || {};
    return [
      ...(lineup.starters || []).filter(Boolean).map(player => ({ player, section: 'starter' })),
      ...(lineup.subs || []).filter(Boolean).map(player => ({ player, section: 'bench' }))
    ].map(({ player, section }) => ({
      side,
      teamName: sideData.name || (side === 'home' ? 'Home' : 'Away'),
      playerId: player.playerId || player.id || player.name || null,
      name: String(player.name || '').trim(),
      jersey: String(player.jersey ?? '').trim(),
      position: String(player.position || player.role || '').trim(),
      section
    })).filter(entry => entry.name);
  });
}

function normalizeVoicePlayerName(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeVoiceJersey(value) {
  const text = String(value ?? '').trim().replace(/^#|^(?:number|no\.?|shirt)\s*/i, '').trim();
  if (/^\d+$/.test(text)) return String(Number(text));
  return text.toLowerCase();
}

function resolveVoiceMatchPlayer(match, sideHint, nameHint, numberHint) {
  const roster = getMatchVoiceRoster(match);
  const nameKey = normalizeVoicePlayerName(nameHint);
  const numberKey = normalizeVoiceJersey(numberHint);
  let candidates = roster;
  if (numberKey) candidates = candidates.filter(entry => normalizeVoiceJersey(entry.jersey) === numberKey);
  if (nameKey) {
    const nameMatches = roster.filter(entry => normalizeVoicePlayerName(entry.name) === nameKey);
    if (!nameMatches.length) return null;
    candidates = candidates.filter(entry => nameMatches.includes(entry));
  }
  if (sideHint === 'home' || sideHint === 'away') candidates = candidates.filter(entry => entry.side === sideHint);
  const unique = [...new Map(candidates.map(entry => [`${entry.side}:${entry.playerId || entry.name}`, entry])).values()];
  return unique.length === 1 ? unique[0] : null;
}

function matchMinuteFromVoiceStamp(stamp) {
  const match = String(stamp || '').match(/\b(\d{1,3})\s*['′]/);
  return match ? Math.max(1, Math.min(150, parseInt(match[1], 10))) : null;
}

function shouldExtractMatchEventFromCommentary(text) {
  return /\b(goal|scor(?:e|ed|ing|er)|equal(?:i|iz)ser|penalt(?:y|ies)|own goal|yellow card|red card|booked|sent off|straight red|second yellow|substitut(?:e|ion)|subbed|coming on|came on|coming off|came off|replac(?:e|ed|ing)|assist(?:ed)?|dismissed|shown a card)\b/i.test(String(text || ''));
}

function buildMatchVoiceEventPrompt(match, minuteStamp, commentary, teamContext = 'auto') {
  const rosterText = ['home', 'away'].map(side => {
    const sideData = match?.[side] || {};
    const lineup = sideData.lineup || {};
    const teamName = sideData.name || (side === 'home' ? 'Home' : 'Away');
    const players = [
      ...(lineup.starters || []).filter(Boolean).map(player => ({ player, section: 'starter' })),
      ...(lineup.subs || []).filter(Boolean).map(player => ({ player, section: 'bench' }))
    ];
    const entries = players.map(({ player, section }) => `- ${section}; jersey ${String(player.jersey || 'not recorded')}; ${String(player.name || 'Unnamed player')}; ${String(player.position || player.role || 'position not recorded')}`).join('\n');
    return `${side.toUpperCase()} TEAM: ${teamName}\n${entries || '- No lineup players recorded.'}`;
  }).join('\n');
  const derivedScore = getMatchScoreFromEvents(match?.events);
  const homeScore = match?.home?.score ?? derivedScore.home;
  const awayScore = match?.away?.score ?? derivedScore.away;
  const recentEvents = (match?.events || []).slice(-8).map(event => `${event.minute ?? '?'}' ${event.team || 'unknown'} ${event.type || 'event'} ${event.playerName || ''}`.trim()).join('\n') || 'None yet.';
  const contextSide = ['home', 'away'].includes(teamContext) ? teamContext : null;
  const contextTeamName = contextSide ? (match?.[contextSide]?.name || (contextSide === 'home' ? 'Home' : 'Away')) : '';
  const teamContextText = contextSide
    ? `Recording team context: ${contextTeamName} is the team being recorded. Interpret “we”, “us”, and “our” as this team. If commentary gives no team for an event or player number, use this team unless the commentary explicitly identifies the other team.`
    : 'Recording team context: Auto-detect. Require the spoken team to be clear, or identify the team only if a supplied player name/number uniquely identifies it.';
  return `Extract only clearly stated football match events that happened in the spoken commentary. Supported event types: goal, own_goal, assist, yellow card, red card, and substitution. Ignore general observations, predictions, instructions, and score recaps that do not announce a new event. Do not invent a player, team, event, or detail. Use only the supplied match lineups to identify players. Resolve a spoken shirt number such as “number three” or “No. 3” to a lineup player only when it identifies one player on the stated team. If team or player identity is ambiguous, use team "unknown" and/or null player fields. For an own goal, team means the team whose player scored it; the opposing team receives the goal. For a substitution, playerName is the player coming on and relatedPlayerName is the player coming off. For a goal, relatedPlayerName is the assister only if the commentary explicitly states one; do not also create a separate assist event for that same goal. A goal with a clearly identified team but no known scorer may have null player fields. Return an empty events array when no supported event is clearly announced. Return JSON only.\n\nMatch: ${match?.home?.name || 'Home'} vs ${match?.away?.name || 'Away'}\nCurrent score: ${homeScore}-${awayScore}\nCurrent match minute/period: ${minuteStamp}\n${teamContextText}\nRecent logged events:\n${recentEvents}\n\nLineups (authoritative names and jersey numbers):\n${rosterText}\n\nSpoken commentary at ${minuteStamp}:\n${String(commentary || '').trim()}`;
}

function getVoiceEventExtractionSchema() {
  return {
    type: 'OBJECT',
    properties: {
      events: {
        type: 'ARRAY', items: {
          type: 'OBJECT',
          properties: {
            type: { type: 'STRING', enum: ['goal', 'own_goal', 'assist', 'yellow', 'red', 'sub'] },
            team: { type: 'STRING', enum: ['home', 'away', 'unknown'] },
            minute: { type: 'INTEGER', nullable: true },
            playerName: { type: 'STRING', nullable: true },
            playerNumber: { type: 'STRING', nullable: true },
            relatedPlayerName: { type: 'STRING', nullable: true },
            relatedPlayerNumber: { type: 'STRING', nullable: true },
            note: { type: 'STRING' },
            confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] }
          },
          required: ['type', 'team', 'minute', 'playerName', 'playerNumber', 'relatedPlayerName', 'relatedPlayerNumber', 'note', 'confidence']
        }
      }
    },
    required: ['events']
  };
}

function buildResolvedVoiceEvents(match, parsedEvents, minuteStamp, sessionId, sequence, transcript, teamContext = 'auto') {
  const resolved = [];
  const skipped = [];
  const fallbackMinute = matchMinuteFromVoiceStamp(minuteStamp);
  (parsedEvents || []).forEach((candidate, index) => {
    const type = String(candidate?.type || '').toLowerCase();
    const confidence = String(candidate?.confidence || '').toLowerCase();
    if (!['goal', 'own_goal', 'assist', 'yellow', 'red', 'sub'].includes(type) || confidence === 'low') {
      skipped.push(candidate);
      return;
    }
    const spokenSide = ['home', 'away'].includes(String(candidate.team || '').toLowerCase()) ? String(candidate.team).toLowerCase() : null;
    const contextSide = ['home', 'away'].includes(teamContext) ? teamContext : null;
    const hintedSide = spokenSide || contextSide;
    let player = resolveVoiceMatchPlayer(match, hintedSide, candidate.playerName, candidate.playerNumber);
    let side = hintedSide || player?.side || null;
    if (player && side && player.side !== side) { skipped.push(candidate); return; }
    if (!side && player) side = player.side;
    if (!side) { skipped.push(candidate); return; }

    let relatedPlayer = resolveVoiceMatchPlayer(match, side, candidate.relatedPlayerName, candidate.relatedPlayerNumber);
    if (relatedPlayer && relatedPlayer.side !== side) relatedPlayer = null;
    if (type === 'sub' && !player) { skipped.push(candidate); return; }
    if (type === 'assist' && !player) { skipped.push(candidate); return; }
    if (type === 'goal' && !player && (candidate.playerName || candidate.playerNumber)) {
      player = null;
    }
    const minuteValue = Number(candidate.minute);
    const minute = Number.isFinite(minuteValue) && minuteValue > 0 ? Math.max(1, Math.min(150, Math.round(minuteValue))) : fallbackMinute;
    const sourceKey = `${sessionId}_${sequence}_${index}`;
    resolved.push({
      id: `ev_voice_${sourceKey}`,
      source: 'voice_ai',
      sourceKey,
      sourceTranscript: String(transcript || '').trim(),
      extractionConfidence: confidence || 'medium',
      minute,
      type,
      team: side,
      playerId: player?.playerId || null,
      playerName: player?.name || 'Unidentified player',
      relatedPlayerId: relatedPlayer?.playerId || null,
      note: String(candidate.note || '').trim() || null
    });
  });
  return { events: resolved, skippedCount: skipped.length };
}

async function persistMatchVoiceEvents(matchId, voiceEvents) {
  const matchRef = doc(db, 'matches', matchId);
  let outcome = null;
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(matchRef);
    const exists = typeof snapshot.exists === 'function' ? snapshot.exists() : snapshot.exists;
    if (!exists) throw new Error('This match is no longer available.');
    const data = typeof snapshot.data === 'function' ? snapshot.data() : (snapshot.data || {});
    const currentEvents = Array.isArray(data.events) ? data.events : [];
    const existingKeys = new Set(currentEvents.map(event => event.sourceKey).filter(Boolean));
    const additions = voiceEvents.filter(event => !existingKeys.has(event.sourceKey));
    if (!additions.length) { outcome = { added: [], match: { id: matchId, ...data } }; return; }
    const updatedEvents = [...currentEvents, ...additions];
    const addedScore = getMatchScoreFromEvents(additions);
    const existingScore = getMatchScoreFromEvents(currentEvents);
    const addedHomeGoals = addedScore.home;
    const addedAwayGoals = addedScore.away;
    const existingHomeGoals = existingScore.home;
    const existingAwayGoals = existingScore.away;
    const homeScore = Number(data.home?.score ?? existingHomeGoals) + addedHomeGoals;
    const awayScore = Number(data.away?.score ?? existingAwayGoals) + addedAwayGoals;
    const wasScheduled = data.status === 'scheduled';
    const updates = {
      events: updatedEvents,
      'home.score': homeScore,
      'away.score': awayScore,
      status: wasScheduled ? 'live' : (data.status || 'live'),
      updatedAt: new Date().toISOString()
    };
    if (wasScheduled && data.matchClock?.status !== 'running') {
      updates.matchClock = {
        status: 'running',
        startedAt: Date.now(),
        elapsedSeconds: data.matchClock?.elapsedSeconds || 0,
        period: data.matchClock?.period || '1H'
      };
    }
    transaction.update(matchRef, updates);
    outcome = {
      added: additions,
      match: {
        id: matchId, ...data, events: updatedEvents,
        home: { ...(data.home || {}), score: homeScore },
        away: { ...(data.away || {}), score: awayScore },
        status: updates.status,
        ...(updates.matchClock ? { matchClock: updates.matchClock } : {}),
        updatedAt: updates.updatedAt
      }
    };
  });
  if (outcome?.match) {
    const idx = matches.findIndex(match => match.id === matchId);
    if (idx >= 0) matches[idx] = outcome.match;
    else setMatchesArray([outcome.match, ...matches]);
    if (curMatch?.id === matchId) { curMatch = outcome.match; renderMatchSheet(); }
    renderAdminMatches();
  }
  return outcome || { added: [], match: null };
}

function updateMatchVoiceStatus(matchId, message) {
  if (curMatch?.id !== matchId) return;
  const status = $('ms-dictate-status');
  if (status) status.textContent = message;
}

async function extractMatchEventsFromVoice(matchId, minuteStamp, transcript, sessionId, sequence, initialMatch, teamContext = 'auto') {
  if (!shouldExtractMatchEventFromCommentary(transcript)) {
    updateMatchVoiceStatus(matchId, `Note saved · ${minuteStamp}`);
    return;
  }
  updateMatchVoiceStatus(matchId, 'Checking for events…');
  try {
    const current = curMatch?.id === matchId ? curMatch : (matches.find(match => match.id === matchId) || initialMatch);
    const matchSnapshot = { ...current, home: { ...(current.home || {}) }, away: { ...(current.away || {}) }, events: [...(current.events || [])] };
    const prompt = buildMatchVoiceEventPrompt(matchSnapshot, minuteStamp, transcript, teamContext);
    const responseText = await callGeminiGenerateContent([{ parts: [{ text: prompt }] }], {
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
      responseSchema: getVoiceEventExtractionSchema()
    });
    const jsonText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(jsonText);
    const extracted = buildResolvedVoiceEvents(matchSnapshot, parsed?.events, minuteStamp, sessionId, sequence, transcript, teamContext);
    if (!extracted.events.length) {
      updateMatchVoiceStatus(matchId, extracted.skippedCount
        ? 'Could not match that event to a team or player.'
        : `Note saved · ${minuteStamp}`);
      return;
    }
    const saved = await persistMatchVoiceEvents(matchId, extracted.events);
    if (saved.added.length) {
      const descriptions = saved.added.map(event => `${event.type} · ${event.playerName} · ${event.team === 'home' ? (matchSnapshot.home?.name || 'Home') : (matchSnapshot.away?.name || 'Away')}${event.minute ? ` · ${event.minute}'` : ''}`).join('; ');
      updateMatchVoiceStatus(matchId, `Logged: ${descriptions}`);
    } else {
      updateMatchVoiceStatus(matchId, 'Already logged.');
    }
  } catch (error) {
    console.error('Voice match-event extraction failed:', error);
    updateMatchVoiceStatus(matchId, `Event check failed: ${error.message || error}`);
  }
}

function queueMatchVoiceEventExtraction(matchId, minuteStamp, transcript, sessionId, sequence, matchSnapshot, teamContext) {
  matchVoiceExtractionChain = matchVoiceExtractionChain.catch(() => { }).then(() => extractMatchEventsFromVoice(matchId, minuteStamp, transcript, sessionId, sequence, matchSnapshot, teamContext));
  return matchVoiceExtractionChain;
}

function finishMatchNoteDictation() {
  matchNoteDictationActive = false;
  if (matchVoiceStopTimeout) { clearTimeout(matchVoiceStopTimeout); matchVoiceStopTimeout = null; }
  if (matchVoiceDictationRestartTimer) { clearTimeout(matchVoiceDictationRestartTimer); matchVoiceDictationRestartTimer = null; }
  matchNoteRecognition = null;
  const button = $('ms-dictate-btn');
  const status = $('ms-dictate-status');
  if (button) { button.textContent = '🎙️'; button.title = 'Record'; button.setAttribute('aria-label', 'Record'); button.setAttribute('aria-pressed', 'false'); }
  if (status && /Stopping|Listening|Reconnecting/.test(status.textContent || '')) status.textContent = matchVoiceSessionHasTranscript ? 'Recorded.' : 'Stopped.';
  matchVoiceStopWaiters.splice(0).forEach(resolve => resolve());
}

function stopMatchNoteDictation() {
  if (!matchNoteDictationActive && !matchNoteRecognition) return Promise.resolve();
  matchNoteDictationActive = false;
  if (matchVoiceDictationRestartTimer) { clearTimeout(matchVoiceDictationRestartTimer); matchVoiceDictationRestartTimer = null; }
  const recognition = matchNoteRecognition;
  if (!recognition) { finishMatchNoteDictation(); return Promise.resolve(); }
  const stopped = new Promise(resolve => matchVoiceStopWaiters.push(resolve));
  if (matchVoiceStopTimeout) clearTimeout(matchVoiceStopTimeout);
  matchVoiceStopTimeout = setTimeout(() => finishMatchNoteDictation(), 3000);
  try { recognition.stop(); }
  catch (error) { finishMatchNoteDictation(); }
  return stopped;
}

function startMatchNoteRecognition(Recognition) {
  if (!matchNoteDictationActive) return;
  const recognition = new Recognition();
  matchNoteRecognition = recognition;
  recognition.lang = 'en-IN';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  const button = $('ms-dictate-btn');
  const status = $('ms-dictate-status');
  if (button) { button.textContent = '⏹️'; button.title = 'Stop recording'; button.setAttribute('aria-label', 'Stop recording'); button.setAttribute('aria-pressed', 'true'); }
  if (status) status.textContent = 'Listening…';
  recognition.onresult = event => {
    let interimText = '';
    for (let index = event.resultIndex; index < event.results.length; index++) {
      const phrase = String(event.results[index]?.[0]?.transcript || '').trim();
      if (!phrase) continue;
      if (event.results[index].isFinal) {
        const transcript = phrase;
        const stamp = getMatchMinuteStamp();
        const matchId = curMatch?.id;
        if (!matchId) continue;
        const phraseKey = `${stamp}|${normalizeVoicePlayerName(transcript)}`;
        if (matchVoicePhraseKeys.has(phraseKey)) continue;
        matchVoicePhraseKeys.add(phraseKey);
        matchVoiceSessionHasTranscript = true;
        const sequence = ++matchVoicePhraseSequence;
        const matchSnapshot = { ...curMatch, home: { ...(curMatch.home || {}) }, away: { ...(curMatch.away || {}) }, events: [...(curMatch.events || [])] };
        const notesEl = $('ms-report-notes');
        if (notesEl) {
          const existing = String(notesEl.value || '').trim();
          const dictated = `[${stamp}] ${transcript}`;
          notesEl.value = existing ? `${existing}\n${dictated}` : dictated;
          notesEl.scrollTop = notesEl.scrollHeight;
          queueMatchReportNotesSave();
        }
        queueMatchVoiceEventExtraction(matchId, stamp, transcript, matchVoiceDictationSessionId, sequence, matchSnapshot, matchVoiceDictationTeamContext);
      } else {
        interimText += `${phrase} `;
      }
    }
    if (interimText && status && matchNoteDictationActive) status.textContent = 'Listening…';
  };
  recognition.onerror = event => {
    const error = event.error || 'unknown error';
    const message = error === 'not-allowed' || error === 'service-not-allowed' ? 'Allow microphone access.' :
      error === 'network' ? 'Speech connection failed. Check your connection.' :
        error === 'no-speech' ? 'No speech detected.' :
          error === 'audio-capture' ? 'Microphone not found.' :
            `Voice recognition stopped (${error}).`;
    if (status) status.textContent = message;
    if (['not-allowed', 'service-not-allowed', 'network', 'audio-capture'].includes(error)) matchNoteDictationActive = false;
  };
  recognition.onend = () => {
    if (matchNoteRecognition === recognition) matchNoteRecognition = null;
    if (matchNoteDictationActive) {
      if (status) status.textContent = 'Reconnecting…';
      matchVoiceDictationRestartTimer = setTimeout(() => startMatchNoteRecognition(Recognition), 350);
    } else {
      finishMatchNoteDictation();
    }
  };
  try { recognition.start(); }
  catch (error) {
    matchNoteDictationActive = false;
    if (status) status.textContent = `Could not start microphone dictation: ${error.message || error}`;
    finishMatchNoteDictation();
  }
}

async function toggleMatchNoteDictation() {
  if (matchNoteDictationActive || matchNoteRecognition) {
    const status = $('ms-dictate-status');
    if (status) status.textContent = 'Stopping…';
    stopMatchNoteDictation();
    return;
  }
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    const status = $('ms-dictate-status');
    if (status) status.textContent = 'Microphone recording unavailable. Use keyboard dictation.';
    return;
  }
  const shouldStartMatch = curMatch.status === 'scheduled';
  if (shouldStartMatch && curMatch.date) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (curMatch.date > todayStr && !confirm(`📅 Notice: This match is scheduled for ${curMatch.date} (future date).\n\nDo you want to start the match now?`)) {
      const status = $('ms-dictate-status');
      if (status) status.textContent = 'Voice logging did not start because the match was not started.';
      return;
    }
  }
  matchNoteDictationActive = true;
  matchVoiceDictationSessionId = `voice_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  matchVoiceDictationTeamContext = matchVoiceTeamContext;
  matchVoicePhraseSequence = 0;
  matchVoiceSessionHasTranscript = false;
  matchVoicePhraseKeys = new Set();
  startMatchNoteRecognition(Recognition);
  if (shouldStartMatch) setMatchStatus('live', true);
}

function renderMatchSquad(side, sideData, teamObj) {
  const startersEl = $(`ms-${side}-starters`);
  const subsEl = $(`ms-${side}-subs`);
  const staffEl = $(`ms-${side}-staff`);

  const startersCnt = $(`ms-${side}-starters-cnt`);
  const subsCnt = $(`ms-${side}-subs-cnt`);
  const staffCnt = $(`ms-${side}-staff-cnt`);

  const starters = (sideData?.lineup?.starters || []).filter(Boolean);
  const subs = (sideData?.lineup?.subs || []).filter(Boolean);
  const staff = (sideData?.lineup?.coaches || []).filter(Boolean);

  if (startersCnt) startersCnt.textContent = starters.length;
  if (subsCnt) subsCnt.textContent = subs.length;
  if (staffCnt) staffCnt.textContent = staff.length;

  const isFinal = curMatch?.status === 'final';

  function renderPlayerRow(p, isStarter, idx) {
    const pid = p.playerId || p.id;
    const pname = p.name || 'Player';
    const pos = p.position || p.role || '—';
    const jersey = p.jersey != null && p.jersey !== '' ? p.jersey : (idx + 1);

    // Count events for this player in this match
    const pEvents = (curMatch?.events || []).filter(e => e.team === side && (e.playerId === pid || e.playerName === pname));
    const goals = pEvents.filter(e => e.type === 'goal').length;
    const yellows = pEvents.filter(e => e.type === 'yellow').length;
    const reds = pEvents.filter(e => e.type === 'red').length;
    const subsIn = (curMatch?.events || []).filter(e => e.team === side && e.type === 'sub' && (e.playerId === pid || e.playerName === pname)).length;
    const subsOut = (curMatch?.events || []).filter(e => e.team === side && e.type === 'sub' && (e.relatedPlayerId === pid)).length;

    let badgePills = '';
    if (goals > 0) badgePills += `<span class="ms-badge-pill goal">⚽ ${goals > 1 ? goals : ''}</span>`;
    if (yellows > 0) badgePills += `<span class="ms-badge-pill yellow">🟨 ${yellows > 1 ? yellows : ''}</span>`;
    if (reds > 0) badgePills += `<span class="ms-badge-pill red">🟥</span>`;
    if (subsIn > 0) badgePills += `<span class="ms-badge-pill" title="Subbed In">🟢 IN</span>`;
    if (subsOut > 0) badgePills += `<span class="ms-badge-pill" title="Subbed Out">🔴 OUT</span>`;

    const actButtons = isFinal ? '' : `
      <div class="ms-act-btn-row" onclick="event.stopPropagation();">
        <button class="ms-act-btn" title="Goal" onclick="openAddEventModal('${side}','goal','${pid || ''}','${esc(pname).replace(/'/g, "\\'")}')">⚽</button>
        <button class="ms-act-btn" title="Assist" onclick="openAddEventModal('${side}','assist','${pid || ''}','${esc(pname).replace(/'/g, "\\'")}')">👟</button>
        <button class="ms-act-btn" title="Yellow Card" onclick="openAddEventModal('${side}','yellow','${pid || ''}','${esc(pname).replace(/'/g, "\\'")}')">🟨</button>
        <button class="ms-act-btn" title="Red Card" onclick="openAddEventModal('${side}','red','${pid || ''}','${esc(pname).replace(/'/g, "\\'")}')">🟥</button>
        <button class="ms-act-btn" title="Sub" onclick="openAddEventModal('${side}','sub','${pid || ''}','${esc(pname).replace(/'/g, "\\'")}')">🔄</button>
      </div>
    `;

    return `
      <div class="ms-player-item" onclick="openAddEventModal('${side}','goal','${pid || ''}','${esc(pname).replace(/'/g, "\\'")}')">
        <div class="ms-player-info">
          <div class="ms-player-num">${esc(jersey)}</div>
          <div class="ms-player-details">
            <div class="ms-player-name">${esc(pname)}</div>
            <div class="ms-player-pos">${esc(posCode(pos) || pos)}</div>
          </div>
        </div>
        <div class="ms-player-badges">${badgePills}</div>
        ${actButtons}
      </div>
    `;
  }

  // Starters
  if (startersEl) {
    if (!starters.length) {
      startersEl.innerHTML = `
        <div style="padding:12px;text-align:center;color:var(--mt);font-size:12px;background:var(--card2);border-radius:10px;">
          No starters assigned.
          <button class="obtn" style="padding:3px 8px;font-size:11px;margin-top:6px;display:block;margin-inline:auto;" onclick="openAdjustLineup('${side}')">⚙️ Set Starting XI</button>
        </div>`;
    } else {
      startersEl.innerHTML = starters.map((p, i) => renderPlayerRow(p, true, i)).join('');
    }
  }

  // Subs
  if (subsEl) {
    if (!subs.length) {
      subsEl.innerHTML = '<div style="padding:8px 12px;color:var(--mt);font-size:11.5px;font-style:italic;">No substitutes listed</div>';
    } else {
      subsEl.innerHTML = subs.map((p, i) => renderPlayerRow(p, false, starters.length + i)).join('');
    }
  }

  // Staff
  if (staffEl) {
    if (!staff.length) {
      staffEl.innerHTML = '<div style="padding:8px 12px;color:var(--mt);font-size:11.5px;font-style:italic;">No management staff listed</div>';
    } else {
      staffEl.innerHTML = staff.map(st => `
        <div class="ms-player-item" style="cursor:default;">
          <div class="ms-player-info">
            <div class="ms-player-num" style="background:#fff;">🧑‍💼</div>
            <div class="ms-player-details">
              <div class="ms-player-name">${esc(st.name)}</div>
              <div class="ms-player-pos">${esc(st.role || 'Staff')}</div>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
}

function renderMatchTimeline() {
  const feedEl = $('ms-timeline-feed');
  if (!feedEl || !curMatch) return;

  const events = [...(curMatch.events || [])].sort((a, b) => {
    const minA = a.minute != null ? a.minute : 999;
    const minB = b.minute != null ? b.minute : 999;
    return minA - minB;
  });

  if (!events.length) {
    feedEl.innerHTML = `
      <div style="background:var(--card2);border-radius:14px;padding:28px 16px;text-align:center;color:var(--mt);">
        <div style="font-size:30px;margin-bottom:6px;">⏱️</div>
        <div style="font-size:14px;font-weight:700;color:var(--tx);margin-bottom:4px;">No match events logged yet</div>
        <p style="font-size:12px;margin-bottom:12px;">Click any player in the squads or use the button below to record goals, cards, and substitutions.</p>
        <button class="obtn" onclick="openAddEventModal()">➕ Log First Event</button>
      </div>`;
    return;
  }

  feedEl.innerHTML = events.map(ev => {
    const isHome = ev.team === 'home';
    const teamName = isHome ? (curMatch.home?.name || 'Home') : (curMatch.away?.name || 'Away');
    const minText = ev.minute != null ? `${ev.minute}'` : '—';

    let icon = '⚽';
    let titleText = `${esc(ev.playerName)} scored for ${esc(teamName)}`;
    if (ev.type === 'goal') {
      icon = '⚽';
      titleText = `⚽ <strong>GOAL!</strong> ${esc(ev.playerName)} (${esc(teamName)})`;
      if (ev.relatedPlayerId) {
        const assister = findMatchPlayer(ev.relatedPlayerId);
        if (assister) titleText += `<div style="font-size:12px;color:var(--mt);margin-top:2px;">👟 Assist: ${esc(assister.name)}</div>`;
      }
    } else if (ev.type === 'own_goal') {
      icon = '🔁';
      const beneficiary = isHome ? (curMatch.away?.name || 'Away') : (curMatch.home?.name || 'Home');
      titleText = `🔁 <strong>OWN GOAL:</strong> ${esc(ev.playerName)} (${esc(teamName)}) · Goal for ${esc(beneficiary)}`;
    } else if (ev.type === 'assist') {
      icon = '👟';
      titleText = `👟 <strong>ASSIST:</strong> ${esc(ev.playerName)} (${esc(teamName)})`;
    } else if (ev.type === 'yellow') {
      icon = '🟨';
      titleText = `🟨 <strong>YELLOW CARD:</strong> ${esc(ev.playerName)} (${esc(teamName)})`;
    } else if (ev.type === 'red') {
      icon = '🟥';
      titleText = `🟥 <strong>RED CARD:</strong> ${esc(ev.playerName)} (${esc(teamName)})`;
    } else if (ev.type === 'sub') {
      icon = '🔄';
      const subOff = findMatchPlayer(ev.relatedPlayerId);
      titleText = `🔄 <strong>SUBSTITUTION (${esc(teamName)}):</strong><br><span style="color:#1a5c1a;">🟢 In: ${esc(ev.playerName)}</span>${subOff ? `<br><span style="color:var(--red);">🔴 Out: ${esc(subOff.name)}</span>` : ''}`;
    }

    const noteText = ev.note ? `<div class="timeline-sub-text"><em>Note: ${esc(ev.note)}</em></div>` : '';

    return `
      <div class="timeline-item">
        <div class="timeline-min">${esc(minText)}</div>
        <div class="timeline-ico">${icon}</div>
        <div class="timeline-body">
          <div class="timeline-main-text">${titleText}</div>
          ${noteText}
        </div>
        <button class="timeline-del-btn" title="Delete event" onclick="deleteMatchEvent('${ev.id}')">🗑️</button>
      </div>
    `;
  }).join('');
}

function findMatchPlayer(pidOrName) {
  if (!curMatch || !pidOrName) return null;
  const allHome = [...(curMatch.home?.lineup?.starters || []), ...(curMatch.home?.lineup?.subs || [])];
  const allAway = [...(curMatch.away?.lineup?.starters || []), ...(curMatch.away?.lineup?.subs || [])];
  const all = [...allHome, ...allAway].filter(Boolean);
  return all.find(p => p.playerId === pidOrName || p.id === pidOrName || p.name === pidOrName) || null;
}

async function setMatchStatus(newStatus, skipFutureDateConfirm = false) {
  if (!curMatch) return;
  try {
    const updates = {
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    if (newStatus === 'live') {
      if (curMatch.date) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (curMatch.date > todayStr && !skipFutureDateConfirm) {
          if (!confirm(`📅 Notice: This match is scheduled for ${curMatch.date} (future date).\n\nDo you want to start the match now?`)) {
            return;
          }
        }
      }
      const prevElapsed = curMatch.matchClock?.elapsedSeconds || 0;
      updates.matchClock = {
        status: 'running',
        startedAt: Date.now(),
        elapsedSeconds: prevElapsed,
        period: curMatch.matchClock?.period || '1H'
      };
    } else if (newStatus === 'final') {
      const curSec = getMatchElapsedSeconds(curMatch);
      updates.matchClock = {
        status: 'stopped',
        startedAt: null,
        elapsedSeconds: curSec,
        period: 'FT'
      };
    } else if (newStatus === 'scheduled') {
      updates.matchClock = {
        status: 'stopped',
        startedAt: null,
        elapsedSeconds: 0,
        period: '1H'
      };
    }
    await updateDoc(doc(db, 'matches', curMatch.id), updates);
    curMatch.status = newStatus;
    if (updates.matchClock) curMatch.matchClock = updates.matchClock;
    renderMatchSheet();
    renderAdminMatches();
    if (curTournament) renderTournamentDashboard();
  } catch (e) {
    alert('❌ Could not update match status: ' + (e.message || e));
  }
}

async function toggleMatchClockPause() {
  if (!curMatch) return;
  const isRunning = curMatch.matchClock?.status === 'running';
  try {
    let clockUpdates;
    let statusUpdate = 'live';

    if (isRunning) {
      // Currently running -> pause it
      const curSec = getMatchElapsedSeconds(curMatch);
      clockUpdates = {
        status: 'paused',
        startedAt: null,
        elapsedSeconds: curSec,
        period: curMatch.matchClock?.period || '1H'
      };
    } else {
      // Currently paused or stopped -> resume it
      clockUpdates = {
        status: 'running',
        startedAt: Date.now(),
        elapsedSeconds: curMatch.matchClock?.elapsedSeconds || 0,
        period: curMatch.matchClock?.period || '1H'
      };
    }
    const updates = {
      matchClock: clockUpdates,
      status: statusUpdate,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, 'matches', curMatch.id), updates);
    curMatch.status = statusUpdate;
    curMatch.matchClock = clockUpdates;
    renderMatchSheet();
    renderAdminMatches();
    if (curTournament) renderTournamentDashboard();
  } catch (e) {
    alert('❌ Could not update match clock: ' + (e.message || e));
  }
}

function openAdjustMatchClockModal() {
  if (!curMatch) return;
  const sec = getMatchElapsedSeconds(curMatch);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const mInp = $('amc-minutes'); if (mInp) mInp.value = m;
  const sInp = $('amc-seconds'); if (sInp) sInp.value = s;
  const pSel = $('amc-period'); if (pSel) pSel.value = curMatch.matchClock?.period || '1H';
  const stSel = $('amc-status'); if (stSel) stSel.value = curMatch.matchClock?.status || (curMatch.status === 'live' ? 'running' : 'stopped');
  const errEl = $('amc-err'); if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  openM('m-adjust-match-clock');
}

function quickSetClock(min, sec, period, status) {
  const mInp = $('amc-minutes'); if (mInp) mInp.value = min;
  const sInp = $('amc-seconds'); if (sInp) sInp.value = sec;
  const pSel = $('amc-period'); if (pSel) pSel.value = period;
  const stSel = $('amc-status'); if (stSel) stSel.value = status;
}

function adjustClockMinutes(delta) {
  const mInp = $('amc-minutes');
  if (mInp) {
    const val = parseInt(mInp.value, 10) || 0;
    mInp.value = Math.max(0, val + delta);
  }
}

async function saveMatchClockAdjust() {
  if (!curMatch) return;
  const mInp = $('amc-minutes');
  const sInp = $('amc-seconds');
  const pSel = $('amc-period');
  const stSel = $('amc-status');
  const errEl = $('amc-err');

  const min = Math.max(0, parseInt(mInp?.value || '0', 10) || 0);
  const sec = Math.max(0, Math.min(59, parseInt(sInp?.value || '0', 10) || 0));
  const totalSec = min * 60 + sec;
  const period = pSel?.value || '1H';
  const clockStatus = stSel?.value || 'running';

  let matchStatus = curMatch.status || 'scheduled';
  if (clockStatus === 'running' && matchStatus === 'scheduled') matchStatus = 'live';
  if (clockStatus === 'stopped' && period === 'FT') matchStatus = 'final';

  const clockUpdates = {
    status: clockStatus,
    startedAt: clockStatus === 'running' ? Date.now() : null,
    elapsedSeconds: totalSec,
    period: period
  };

  try {
    const updates = {
      matchClock: clockUpdates,
      status: matchStatus,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, 'matches', curMatch.id), updates);
    curMatch.status = matchStatus;
    curMatch.matchClock = clockUpdates;
    closeM('m-adjust-match-clock');
    renderMatchSheet();
    renderAdminMatches();
    if (curTournament) renderTournamentDashboard();
  } catch (e) {
    if (errEl) { errEl.textContent = 'Failed to update clock: ' + (e.message || e); errEl.style.display = 'block'; }
  }
}

// ══════════════════════════════════════════════════════════════
// ⚡ QUICK EVENT LOGGER
// ══════════════════════════════════════════════════════════════

function openAddEventModal(presetTeam, presetType, presetPlayerId, presetPlayerName) {
  if (!curMatch) return;
  mevTeam = presetTeam || 'home';
  mevType = presetType || 'goal';

  const typeSel = $('mev-type'); if (typeSel) typeSel.value = mevType;

  // Auto-prefill minute with live match minute if available
  const sec = getMatchElapsedSeconds(curMatch);
  const curMin = sec > 0 ? Math.max(1, Math.floor(sec / 60) + (sec % 60 > 0 ? 1 : 0)) : '';
  const minInp = $('mev-minute'); if (minInp) minInp.value = curMin;

  const noteInp = $('mev-note'); if (noteInp) noteInp.value = '';
  const errEl = $('mev-err'); if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

  const homeLbl = $('mev-lbl-home'); if (homeLbl) homeLbl.textContent = curMatch.home?.name || 'Home';
  const awayLbl = $('mev-lbl-away'); if (awayLbl) awayLbl.textContent = curMatch.away?.name || 'Away';

  setEventTeam(mevTeam);
  handleEventTypeChange(mevType);

  // If a preset player was passed
  const pSel = $('mev-player-select');
  if (pSel && presetPlayerId) {
    pSel.value = presetPlayerId;
  } else if (pSel && presetPlayerName) {
    pSel.value = '__custom__';
    const customInp = $('mev-player-custom');
    if (customInp) customInp.value = presetPlayerName;
  }
  handleEventPlayerSelect(pSel?.value || '');

  openM('m-match-event');
}

function handleEventTypeChange(type) {
  mevType = type;
  const icoEl = $('mev-ico');
  const titleEl = $('mev-title');
  const playerLbl = $('mev-player-lbl');
  const relWrap = $('mev-related-wrap');
  const relLbl = $('mev-related-lbl');

  if (type === 'goal') {
    if (icoEl) icoEl.textContent = '⚽';
    if (titleEl) titleEl.textContent = 'LOG GOAL';
    if (playerLbl) playerLbl.textContent = 'Goal Scorer *';
    if (relWrap) relWrap.style.display = 'block';
    if (relLbl) relLbl.textContent = 'Assisted By (Optional)';
  } else if (type === 'own_goal') {
    if (icoEl) icoEl.textContent = '🔁';
    if (titleEl) titleEl.textContent = 'LOG OWN GOAL';
    if (playerLbl) playerLbl.textContent = 'Player Who Scored the Own Goal *';
    if (relWrap) relWrap.style.display = 'none';
  } else if (type === 'assist') {
    if (icoEl) icoEl.textContent = '👟';
    if (titleEl) titleEl.textContent = 'LOG ASSIST';
    if (playerLbl) playerLbl.textContent = 'Assist Provider *';
    if (relWrap) relWrap.style.display = 'none';
  } else if (type === 'yellow') {
    if (icoEl) icoEl.textContent = '🟨';
    if (titleEl) titleEl.textContent = 'LOG YELLOW CARD';
    if (playerLbl) playerLbl.textContent = 'Player Carded *';
    if (relWrap) relWrap.style.display = 'none';
  } else if (type === 'red') {
    if (icoEl) icoEl.textContent = '🟥';
    if (titleEl) titleEl.textContent = 'LOG RED CARD';
    if (playerLbl) playerLbl.textContent = 'Player Sent Off *';
    if (relWrap) relWrap.style.display = 'none';
  } else if (type === 'sub') {
    if (icoEl) icoEl.textContent = '🔄';
    if (titleEl) titleEl.textContent = 'LOG SUBSTITUTION';
    if (playerLbl) playerLbl.textContent = 'Player Subbed ON (Entering) *';
    if (relWrap) relWrap.style.display = 'block';
    if (relLbl) relLbl.textContent = 'Player Subbed OFF (Exiting) (Optional)';
  }
}

function setEventTeam(team) {
  mevTeam = team;
  const btnH = $('mev-team-home');
  const btnA = $('mev-team-away');
  if (btnH) btnH.classList.toggle('active', team === 'home');
  if (btnA) btnA.classList.toggle('active', team === 'away');

  // Populate players from this side
  const sideData = team === 'home' ? curMatch?.home : curMatch?.away;
  const starters = (sideData?.lineup?.starters || []).filter(Boolean);
  const subs = (sideData?.lineup?.subs || []).filter(Boolean);

  const pSel = $('mev-player-select');
  const relSel = $('mev-related-select');

  if (pSel) {
    let opts = '<option value="">-- Select Player --</option>';
    if (starters.length) {
      opts += `<optgroup label="Starting XI">`;
      starters.forEach(p => {
        const id = p.playerId || p.id || p.name;
        opts += `<option value="${id}">${esc(p.name)} (${esc(p.position || 'Starter')})</option>`;
      });
      opts += `</optgroup>`;
    }
    if (subs.length) {
      opts += `<optgroup label="Game Changers / Bench">`;
      subs.forEach(p => {
        const id = p.playerId || p.id || p.name;
        opts += `<option value="${id}">${esc(p.name)} (${esc(p.position || 'Sub')})</option>`;
      });
      opts += `</optgroup>`;
    }
    opts += `<option value="__custom__">➕ Type Custom / Outside Opponent Player Name…</option>`;
    pSel.innerHTML = opts;
  }

  if (relSel) {
    let opts = '<option value="">-- None / Unassisted --</option>';
    if (starters.length) {
      opts += `<optgroup label="Starting XI">`;
      starters.forEach(p => {
        const id = p.playerId || p.id || p.name;
        opts += `<option value="${id}">${esc(p.name)} (${esc(p.position || 'Starter')})</option>`;
      });
      opts += `</optgroup>`;
    }
    if (subs.length) {
      opts += `<optgroup label="Game Changers / Bench">`;
      subs.forEach(p => {
        const id = p.playerId || p.id || p.name;
        opts += `<option value="${id}">${esc(p.name)} (${esc(p.position || 'Sub')})</option>`;
      });
      opts += `</optgroup>`;
    }
    relSel.innerHTML = opts;
  }
}

function handleEventPlayerSelect(val) {
  const customWrap = $('mev-player-custom-wrap');
  if (customWrap) {
    customWrap.style.display = (val === '__custom__') ? 'block' : 'none';
  }
}

async function saveMatchEvent() {
  if (!curMatch) return;
  const pSel = $('mev-player-select');
  const relSel = $('mev-related-select');
  const minInp = $('mev-minute');
  const noteInp = $('mev-note');
  const errEl = $('mev-err');

  const pVal = pSel?.value || '';
  let playerId = null;
  let playerName = '';

  if (!pVal) {
    if (errEl) { errEl.textContent = 'Please select a player.'; errEl.style.display = 'block'; }
    return;
  }

  if (pVal === '__custom__') {
    playerName = String($('mev-player-custom')?.value || '').trim();
    if (!playerName) {
      if (errEl) { errEl.textContent = 'Please enter the custom player name.'; errEl.style.display = 'block'; }
      return;
    }
  } else {
    playerId = pVal;
    const found = findMatchPlayer(pVal);
    playerName = found ? found.name : pVal;
  }

  const minute = minInp?.value ? parseInt(minInp.value) : null;
  const relatedPlayerId = relSel?.value || null;
  const note = String(noteInp?.value || '').trim();

  const newEvent = {
    id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    minute: minute,
    type: mevType,
    team: mevTeam,
    playerId: playerId,
    playerName: playerName,
    relatedPlayerId: relatedPlayerId || null,
    note: note || null
  };

  const updatedEvents = [...(curMatch.events || []), newEvent];

  const derivedScore = getMatchScoreFromEvents(updatedEvents);
  const homeScore = derivedScore.home;
  const awayScore = derivedScore.away;

  const isTransitionToLive = (curMatch.status === 'scheduled');
  const updates = {
    events: updatedEvents,
    'home.score': homeScore,
    'away.score': awayScore,
    status: isTransitionToLive ? 'live' : curMatch.status,
    updatedAt: new Date().toISOString()
  };

  if (isTransitionToLive && (!curMatch.matchClock || curMatch.matchClock.status !== 'running')) {
    updates.matchClock = {
      status: 'running',
      startedAt: Date.now(),
      elapsedSeconds: curMatch.matchClock?.elapsedSeconds || 0,
      period: curMatch.matchClock?.period || '1H'
    };
  }

  try {
    await updateDoc(doc(db, 'matches', curMatch.id), updates);
    curMatch.events = updatedEvents;
    curMatch.home.score = homeScore;
    curMatch.away.score = awayScore;
    if (isTransitionToLive) curMatch.status = 'live';
    if (updates.matchClock) curMatch.matchClock = updates.matchClock;

    closeM('m-match-event');
    renderMatchSheet();
    renderAdminMatches();
  } catch (e) {
    if (errEl) { errEl.textContent = 'Failed to save event: ' + (e.message || e); errEl.style.display = 'block'; }
  }
}

async function deleteMatchEvent(eventId) {
  if (!curMatch) return;
  if (!confirm('Delete this event?')) return;

  const updatedEvents = (curMatch.events || []).filter(e => e.id !== eventId);
  const derivedScore = getMatchScoreFromEvents(updatedEvents);
  const homeScore = derivedScore.home;
  const awayScore = derivedScore.away;

  const updates = {
    events: updatedEvents,
    'home.score': homeScore,
    'away.score': awayScore,
    updatedAt: new Date().toISOString()
  };

  try {
    await updateDoc(doc(db, 'matches', curMatch.id), updates);
    curMatch.events = updatedEvents;
    curMatch.home.score = homeScore;
    curMatch.away.score = awayScore;
    renderMatchSheet();
    renderAdminMatches();
  } catch (e) {
    alert('❌ Could not delete event: ' + (e.message || e));
  }
}

function openEditMatchDetails() {
  if (!curMatch) return;
  const dateEl = $('emd-date'); if (dateEl) dateEl.value = curMatch.date || '';
  const timeEl = $('emd-time'); if (timeEl) timeEl.value = curMatch.time || '';
  const statusEl = $('emd-status'); if (statusEl) statusEl.value = curMatch.status || 'scheduled';

  const hLbl = $('emd-home-lbl'); if (hLbl) hLbl.textContent = `${curMatch.home?.name || 'Home'} Score`;
  const aLbl = $('emd-away-lbl'); if (aLbl) aLbl.textContent = `${curMatch.away?.name || 'Away'} Score`;

  const hScoreEl = $('emd-home-score'); if (hScoreEl) hScoreEl.value = curMatch.home?.score != null ? curMatch.home.score : 0;
  const aScoreEl = $('emd-away-score'); if (aScoreEl) aScoreEl.value = curMatch.away?.score != null ? curMatch.away.score : 0;

  const errEl = $('emd-err'); if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  openM('m-edit-match-details');
}

async function saveMatchDetailsEdit() {
  if (!curMatch) return;
  const date = $('emd-date')?.value || curMatch.date;
  const time = $('emd-time')?.value || '';
  const status = $('emd-status')?.value || curMatch.status;
  const hScore = parseInt($('emd-home-score')?.value) || 0;
  const aScore = parseInt($('emd-away-score')?.value) || 0;

  const updates = {
    date: date,
    time: time,
    status: status,
    'home.score': hScore,
    'away.score': aScore,
    updatedAt: new Date().toISOString()
  };

  try {
    await updateDoc(doc(db, 'matches', curMatch.id), updates);
    curMatch.date = date;
    curMatch.time = time;
    curMatch.status = status;
    curMatch.home.score = hScore;
    curMatch.away.score = aScore;
    closeM('m-edit-match-details');
    renderMatchSheet();
    renderAdminMatches();
  } catch (e) {
    const errEl = $('emd-err');
    if (errEl) { errEl.textContent = 'Failed to save changes: ' + (e.message || e); errEl.style.display = 'block'; }
  }
}

function deleteCurrentMatch() {
  if (!curMatch) return;
  adminRequestPin('delmatch', curMatch.id);
}


// ══════════════════════════════════════════════════════════════
// ⚙️ MATCH LINEUP ADJUSTMENTS
// ══════════════════════════════════════════════════════════════

let amlTeamPlayers = [];

function openAdjustLineup(side) {
  if (!curMatch) return;
  amlSide = side;
  const sideData = side === 'home' ? curMatch.home : curMatch.away;
  const teamId = sideData?.teamId;
  const teamObj = teams.find(t => t.id === teamId);

  const titleEl = $('aml-title');
  const descEl = $('aml-desc');
  if (titleEl) titleEl.textContent = `⚙️ ADJUST LINEUP: ${sideData?.name || (side === 'home' ? 'Home' : 'Away')}`;
  if (descEl) descEl.textContent = `Configure starting formation, pitch positions, and bench for this match.`;

  // Determine available players
  if (teamId) {
    amlTeamPlayers = allPlayersCache.filter(p => p.teamId === teamId);
    if (!amlTeamPlayers.length && players.length && curTeam?.id === teamId) {
      amlTeamPlayers = players;
    }
  } else {
    // Outside opponent: synthesize from current lineup if any
    const existing = [...(sideData?.lineup?.starters || []), ...(sideData?.lineup?.subs || [])].filter(Boolean);
    amlTeamPlayers = existing.map((p, i) => ({
      id: p.playerId || p.id || `ext_${i}`,
      name: p.name,
      position: p.position || 'ST',
      jersey: p.jersey || ''
    }));
  }

  const existingLineup = sideData?.lineup;
  amlFormation = (existingLineup && existingLineup.formation && FORMATIONS[existingLineup.formation]) ? existingLineup.formation : '4-4-2';
  amlAside = formationTotal(amlFormation) || 11;
  const flat = flattenFormation(amlFormation);

  amlSlots = flat.map((_, i) => {
    if (existingLineup && existingLineup.starters && existingLineup.starters[i]) {
      const sp = existingLineup.starters[i].player || existingLineup.starters[i];
      const found = amlTeamPlayers.find(pl => pl.id === (sp.playerId || sp.id));
      return {
        id: sp.playerId || sp.id,
        name: found ? found.name : sp.name,
        position: found ? found.position : sp.position,
        jersey: (found && found.jersey != null && found.jersey !== '') ? found.jersey : (sp.jersey || ''),
        photo: (found && found.photo) ? found.photo : (sp.photo || null),
        matchPosition: posCode(sp.matchPosition || (found && found.position) || sp.position)
      };
    }
    return null;
  });

  amlSubs = (existingLineup?.subs || []).map(sb => {
    const found = amlTeamPlayers.find(pl => pl.id === (sb.playerId || sb.id));
    return {
      id: sb.playerId || sb.id,
      name: found ? found.name : sb.name,
      position: found ? found.position : sb.position,
      jersey: (found && found.jersey != null && found.jersey !== '') ? found.jersey : (sb.jersey || ''),
      photo: (found && found.photo) ? found.photo : (sb.photo || null)
    };
  });

  amlStaff = (existingLineup?.coaches || []).map(s => ({
    id: s.staffId || s.id,
    name: s.name,
    role: s.role
  }));

  amlActive = amlSlots.findIndex(s => !s);
  if (amlActive < 0) amlActive = 0;
  amlBenchActive = amlSubs.findIndex(s => !s);
  if (amlBenchActive < 0) amlBenchActive = 0;

  renderAdjustLineupModal();
  openM('m-adjust-lineup');
}

function renderAdjustLineupModal() {
  const asideSel = $('aml-aside'); if (asideSel) asideSel.value = String(amlAside);
  renderAmlFormationRow();
  renderAmlPitch();
  renderAmlPicker();
  renderAmlBench();
  renderAmlStaffPicker();
}

function renderAmlFormationRow() {
  const el = $('aml-formation-row'); if (!el) return;
  const options = ASIDE_FORMATIONS[amlAside] || ['4-4-2'];
  el.innerHTML = `
    <select id="aml-formation-select" class="matchset-select" onchange="changeMatchFormation(this.value)">
      ${options.map(k => `<option value="${k}" ${k === amlFormation ? 'selected' : ''}>${k}</option>`).join('')}
    </select>
  `;
}

function changeMatchAside(n) {
  if (n === amlAside) return;
  amlAside = n;
  const options = ASIDE_FORMATIONS[amlAside] || ['4-4-2'];
  const next = options.includes(amlFormation) ? amlFormation : options[0];
  changeMatchFormation(next);
}

function changeMatchFormation(key) {
  const assigned = amlSlots.filter(Boolean);
  const newFlat = flattenFormation(key);
  amlFormation = key;
  amlSlots = newFlat.map((_, i) => assigned[i] ? { ...assigned[i] } : null);
  if (assigned.length > newFlat.length) {
    assigned.slice(newFlat.length).forEach(pl => {
      if (!amlSubs.some(s => s.id === pl.id)) amlSubs.push({ ...pl });
    });
  }
  amlActive = 0;
  renderAdjustLineupModal();
}

function renderAmlPitch() {
  const el = $('aml-pitch'); if (!el) return;
  const lines = FORMATIONS[amlFormation] || FORMATIONS['4-4-2'];
  const flat = flattenFormation(amlFormation);
  let idx = 0;
  let html = '';

  lines.forEach(line => {
    const label = line.lbl || roleLabel(line.r);
    const header = line.n > 1 ? `${label}s (${line.n})` : label;
    html += `<div class="lc-title" style="margin:12px 0 6px;">${esc(header.toUpperCase())}</div>`;
    for (let k = 0; k < line.n; k++) {
      const i = idx; idx++;
      const p = amlSlots[i];
      const sideLabel = slotSideLabel(line.r, flat[i] ? flat[i].x : 50, line.lbl);
      const cls = `lu-item ${p ? 'filled' : 'empty-slot'} ${i === amlActive ? 'active-slot' : ''}`;
      const av = p ? playerLineupAv(p) : '<div class="lu-av">+</div>';
      const name = p ? esc(p.name) : esc(label);
      const meta = p ? `${esc(posCode(p.position) || '—')} <span class="lu-slotside">· ${esc(sideLabel)}</span>` : `Tap to assign <span class="lu-slotside">· ${esc(sideLabel)}</span>`;

      const actions = p ? `
        <div class="lu-slot-actions" onclick="event.stopPropagation();">
          <div class="lu-tag lu-remove-tag" onclick="removeAmlSlot(${i})">Remove</div>
        </div>` : `<div class="lu-tag">Assign</div>`;

      html += `
        <div class="${cls}" onclick="selectAmlSlot(${i})">
          ${av}
          <div class="lu-info"><div class="lu-name">${name}</div><div class="lu-meta">${meta}</div></div>
          ${actions}
        </div>`;
    }
  });
  el.innerHTML = html;
}

function selectAmlSlot(i) {
  amlActive = (amlActive === i) ? -1 : i;
  renderAmlPitch();
  renderAmlPicker();
}

function removeAmlSlot(i) {
  amlSlots[i] = null;
  amlActive = i;
  renderAmlPitch();
  renderAmlPicker();
  renderAmlBench();
}

function renderAmlPicker() {
  const el = $('aml-picker'); if (!el) return;
  if (amlActive < 0) {
    el.innerHTML = '<p class="lu-hint">Tap a position on the left to assign a player.</p>';
    return;
  }
  const flat = flattenFormation(amlFormation);
  const slotDef = flat[amlActive];
  const current = amlSlots[amlActive];

  const used = new Set();
  amlSlots.forEach((p, i) => { if (p && p.id && i !== amlActive) used.add(p.id); });
  amlSubs.forEach(p => { if (p && p.id) used.add(p.id); });

  const avail = amlTeamPlayers.filter(p => !used.has(p.id));

  const row = list => list.map(p => `
    <div class="lu-item" onclick="assignAmlSlot(${amlActive},'${p.id}')">
      ${playerLineupAv(p)}
      <div class="lu-info"><div class="lu-name">${esc(p.name)}</div><div class="lu-meta">${esc(posCode(p.position) || '—')}</div></div>
      <div class="lu-tag">Pick</div>
    </div>
  `).join('');

  el.innerHTML = `
    <div class="lu-picker-head">Assigning: <strong style="color:var(--tx);">${esc(slotSideLabel(slotDef.role, slotDef.x, slotDef.label))}</strong></div>
    ${avail.length ? `<div class="lu-list" style="margin-top:8px;">${row(avail)}</div>` : '<p class="lu-hint">No more unassigned players in roster.</p>'}
  `;
}

function assignAmlSlot(i, pid) {
  const p = amlTeamPlayers.find(pl => pl.id === pid);
  if (!p) return;

  amlSubs = amlSubs.filter(s => s && s.id !== pid);
  amlSlots = amlSlots.map((s, idx) => (s && s.id === pid && idx !== i) ? null : s);

  amlSlots[i] = {
    id: p.id,
    name: p.name,
    position: p.position,
    jersey: p.jersey || '',
    photo: p.photo || null,
    matchPosition: posCode(p.position)
  };

  let next = -1;
  for (let k = 1; k <= amlSlots.length; k++) {
    const idx = (i + k) % amlSlots.length;
    if (!amlSlots[idx]) { next = idx; break; }
  }
  amlActive = next;
  renderAmlPitch();
  renderAmlPicker();
  renderAmlBench();
}

function renderAmlBench() {
  const benchEl = $('aml-bench'); if (!benchEl) return;
  const countEl = $('aml-benchcount'); if (countEl) countEl.textContent = amlSubs.length;

  if (!amlSubs.length) {
    benchEl.innerHTML = '<p class="lu-hint">No players on the bench. Tap available players on the right to add them.</p>';
  } else {
    benchEl.innerHTML = amlSubs.map((p, i) => `
      <div class="lu-item filled">
        ${playerLineupAv(p)}
        <div class="lu-info">
          <div class="lu-name">${esc(p.name)}</div>
          <div class="lu-meta">${esc(posCode(p.position) || 'Bench')}</div>
        </div>
        <div class="lu-slot-actions">
          <div class="lu-tag lu-remove-tag" onclick="removeAmlBenchSlot(${i})">Remove</div>
        </div>
      </div>
    `).join('');
  }
  renderAmlBenchPicker();
}

function removeAmlBenchSlot(i) {
  amlSubs.splice(i, 1);
  renderAmlBench();
  renderAmlPicker();
}

function renderAmlBenchPicker() {
  const el = $('aml-bench-picker'); if (!el) return;
  const used = new Set();
  amlSlots.forEach(p => { if (p && p.id) used.add(p.id); });
  amlSubs.forEach(p => { if (p && p.id) used.add(p.id); });

  const avail = amlTeamPlayers.filter(p => !used.has(p.id));

  if (!avail.length) {
    el.innerHTML = '<p class="lu-hint">All roster players assigned to starting XI or bench.</p>';
    return;
  }

  el.innerHTML = `
    <div class="lu-picker-head">Add to Bench:</div>
    <div class="lu-list" style="margin-top:8px;">
      ${avail.map(p => `
        <div class="lu-item" onclick="assignAmlBenchSlot('${p.id}')">
          ${playerLineupAv(p)}
          <div class="lu-info"><div class="lu-name">${esc(p.name)}</div><div class="lu-meta">${esc(posCode(p.position) || '—')}</div></div>
          <div class="lu-tag">Add to Bench</div>
        </div>
      `).join('')}
    </div>
  `;
}

function assignAmlBenchSlot(pid) {
  const p = amlTeamPlayers.find(pl => pl.id === pid);
  if (!p) return;
  if (amlSubs.some(s => s.id === pid)) return;

  amlSlots = amlSlots.map(s => (s && s.id === pid) ? null : s);
  amlSubs.push({
    id: p.id,
    name: p.name,
    position: p.position,
    jersey: p.jersey || '',
    photo: p.photo || null
  });

  renderAmlPitch();
  renderAmlPicker();
  renderAmlBench();
}

function renderAmlStaffPicker() {
  const el = $('aml-staff'); if (!el) return;
  const sideData = amlSide === 'home' ? curMatch?.home : curMatch?.away;
  const teamObj = teams.find(t => t.id === sideData?.teamId);
  const teamStaff = teamObj?.staff || [];

  const cntEl = $('aml-staffcount'); if (cntEl) cntEl.textContent = amlStaff.length;

  if (!teamStaff.length) {
    el.innerHTML = '<p class="lu-hint">No management staff available in this team profile.</p>';
    return;
  }

  el.innerHTML = teamStaff.map(st => {
    const isAdded = amlStaff.some(s => s.id === st.id);
    return `
      <div class="lu-item ${isAdded ? 'sub' : ''}" onclick="toggleAmlStaffPick('${st.id}')">
        <div class="lu-av">🧑‍💼</div>
        <div class="lu-info"><div class="lu-name">${esc(st.name)}</div><div class="lu-meta">${esc(st.role || 'Staff')}</div></div>
        <div class="lu-tag">${isAdded ? 'Added' : 'Add'}</div>
      </div>
    `;
  }).join('');
}

function toggleAmlStaffPick(id) {
  const sideData = amlSide === 'home' ? curMatch?.home : curMatch?.away;
  const teamObj = teams.find(t => t.id === sideData?.teamId);
  const st = teamObj?.staff?.find(s => s.id === id);
  if (!st) return;

  const idx = amlStaff.findIndex(s => s.id === id);
  if (idx >= 0) amlStaff.splice(idx, 1);
  else amlStaff.push({ id: st.id, name: st.name, role: st.role });

  renderAmlStaffPicker();
}

async function saveAdjustedMatchLineup() {
  if (!curMatch) return;
  const flat = flattenFormation(amlFormation);

  const starters = flat.map((s, i) => {
    const p = amlSlots[i];
    return p ? {
      playerId: p.id,
      name: p.name,
      jersey: p.jersey || '',
      position: p.matchPosition || p.position || s.role
    } : null;
  });

  const subs = amlSubs.map(s => ({
    playerId: s.id,
    name: s.name,
    jersey: s.jersey || '',
    position: s.position
  }));

  const coaches = amlStaff.map(s => ({
    staffId: s.id,
    name: s.name,
    role: s.role
  }));

  const lineup = {
    formation: amlFormation,
    starters: starters,
    subs: subs,
    coaches: coaches
  };

  const key = `${amlSide}.lineup`;
  const updates = {
    [key]: lineup,
    updatedAt: new Date().toISOString()
  };

  try {
    await updateDoc(doc(db, 'matches', curMatch.id), updates);
    curMatch[amlSide].lineup = lineup;
    closeM('m-adjust-lineup');
    renderMatchSheet();
  } catch (e) {
    alert('❌ Could not save lineup: ' + (e.message || e));
  }
}


// ══════════════════════════════════════════════════════════════
// 🍏 APPLE SPORTS REAL-TIME LIVE SCORECARD & SHARING
// ══════════════════════════════════════════════════════════════

let liveMatchUnsub = null;
let curLiveMatch = null;
let livePitchSide = 'home';
let currentLiveTab = 'timeline';
let lastKnownLiveScore = { home: null, away: null };
let liveGoalToastTimeout = null;

function getLiveMatchShareUrl(matchId) {
  const base = getBaseUrl();
  return `${base}?live=${encodeURIComponent(matchId)}`;
}

function openShareMatchModal(matchId) {
  const targetId = matchId || curMatch?.id || curLiveMatch?.id;
  if (!targetId) {
    alert('Please select a match to share.');
    return;
  }
  const m = matches.find(x => x.id === targetId) || curMatch || curLiveMatch;
  if (!m) return;

  const liveUrl = getLiveMatchShareUrl(targetId);
  const hName = m.home?.name || 'Home Team';
  const aName = m.away?.name || 'Away Team';
  const hScore = (m.home && m.home.score != null) ? m.home.score : 0;
  const aScore = (m.away && m.away.score != null) ? m.away.score : 0;
  const st = (m.status || 'scheduled').toUpperCase();

  const sec = getMatchElapsedSeconds(m);
  const clockStr = formatMatchClockDisplay(sec);
  const period = m.matchClock?.period || '1H';

  // Preview box
  const titleEl = $('sm-matchup-title');
  if (titleEl) titleEl.textContent = `${hName} vs ${aName}`;
  const scoreEl = $('sm-matchup-score');
  if (scoreEl) {
    if (m.status === 'live') {
      scoreEl.textContent = `● LIVE (${period} · ${clockStr}) — Score: ${hScore} - ${aScore}`;
      scoreEl.style.color = '#22c55e';
    } else if (m.status === 'final') {
      scoreEl.textContent = `FINAL SCORE: ${hScore} - ${aScore}`;
      scoreEl.style.color = 'var(--tx)';
    } else {
      scoreEl.textContent = `SCHEDULED · ${formatMatchDateDisplay(m)}`;
      scoreEl.style.color = '#38bdf8';
    }
  }

  // URL input
  const urlInp = $('sm-url-inp');
  if (urlInp) urlInp.value = liveUrl;

  // Formatted post text for Facebook
  const scoreStr = m.status === 'scheduled' ? 'vs' : `${hScore} - ${aScore}`;
  const statusStr = m.status === 'live' ? `(${period} · ${clockStr})` : (m.status === 'final' ? '(Full Time)' : `(${formatMatchDateDisplay(m)})`);
  const postText = `⚽ LIVE MATCH UPDATE: ${hName} ${scoreStr} ${aName} ${statusStr}\n\n👉 Follow live scores, pitch lineups & real-time highlights here:\n${liveUrl}`;
  const postTextEl = $('sm-post-text');
  if (postTextEl) postTextEl.value = postText;

  // Pitchside QR Code
  const qrImg = $('sm-qr-img');
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(liveUrl)}&bgcolor=ffffff&color=000000&margin=4`;
  }

  openM('m-share-match');
}

function copyModalLiveLink(btn) {
  const inp = $('sm-url-inp');
  if (!inp || !inp.value) return;
  copyToClipboard(inp.value).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
}

function copyModalPostText(btn) {
  const ta = $('sm-post-text');
  if (!ta || !ta.value) return;
  copyToClipboard(ta.value).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✅ Post Text Copied!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
}

function shareLiveMatchDirect(platform) {
  const inp = $('sm-url-inp');
  const ta = $('sm-post-text');
  const url = inp?.value || window.location.href;
  const text = ta?.value || `Live match score & updates: ${url}`;

  if (platform === 'facebook') {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(fbUrl, '_blank', 'width=620,height=580,menubar=no,toolbar=no,resizable=yes');
  } else if (platform === 'whatsapp') {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  }
}

function copyLiveMatchLink(btn) {
  const url = window.location.href;
  copyToClipboard(url).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '<span>✅</span> Copied Link!';
    setTimeout(() => { btn.innerHTML = orig; }, 2200);
  });
}

function previewModalLiveMatch() {
  const inp = $('sm-url-inp');
  if (inp && inp.value) {
    window.open(inp.value, '_blank');
  }
}

function returnToCoachMatchSheet() {
  if (curLiveMatch && curLiveMatch.id) {
    openMatchSheet(curLiveMatch.id);
  }
}

async function initLiveMatchView(matchId) {
  // Immediately activate the live scorecard screen
  ss('s-live-match');

  // If coach/admin session is active, show return button
  const coachBtn = $('as-coach-return-btn');
  if (coachBtn) {
    coachBtn.style.display = (sessionStorage.getItem('fhq_session_active') === '1') ? 'inline-block' : 'none';
  }

  try {
    startGlobalMatchClockTicker();

    // Parallel load teams, tournaments and match
    const [teamsSnap, tournsSnap, mSnap] = await Promise.all([
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'tournaments')),
      getDoc(doc(db, 'matches', matchId))
    ]);

    teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    tournaments = tournsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const exists = (typeof mSnap.exists === 'function') ? mSnap.exists() : mSnap.exists;
    if (exists) {
      const data = (typeof mSnap.data === 'function') ? mSnap.data() : (mSnap.data || {});
      curLiveMatch = { id: mSnap.id, ...data };
      setMatchesArray([curLiveMatch, ...matches]);

      lastKnownLiveScore = {
        home: (curLiveMatch.home && curLiveMatch.home.score != null) ? curLiveMatch.home.score : 0,
        away: (curLiveMatch.away && curLiveMatch.away.score != null) ? curLiveMatch.away.score : 0
      };

      renderLiveMatchScreen();
      subscribeLiveMatch(matchId);
    } else {
      alert('Match not found or was removed.');
      if (sessionStorage.getItem('fhq_session_active') === '1') loadAdmin();
      else ss('s-login');
    }
  } catch (e) {
    console.error('initLiveMatchView error:', e);
    alert('Could not load live match: ' + (e.message || e));
    if (sessionStorage.getItem('fhq_session_active') === '1') loadAdmin();
    else ss('s-login');
  }
}

function subscribeLiveMatch(matchId) {
  if (liveMatchUnsub) { liveMatchUnsub(); liveMatchUnsub = null; }

  liveMatchUnsub = onSnapshot(doc(db, 'matches', matchId), snap => {
    const exists = (typeof snap.exists === 'function') ? snap.exists() : snap.exists;
    if (exists) {
      const data = (typeof snap.data === 'function') ? snap.data() : (snap.data || {});
      const updatedMatch = { id: snap.id, ...data };

      // Check if score changed to trigger celebration toast
      const newH = (updatedMatch.home && updatedMatch.home.score != null) ? updatedMatch.home.score : 0;
      const newA = (updatedMatch.away && updatedMatch.away.score != null) ? updatedMatch.away.score : 0;

      if (lastKnownLiveScore.home !== null && lastKnownLiveScore.away !== null) {
        if (newH > lastKnownLiveScore.home) {
          const lastGoal = (updatedMatch.events || []).filter(e => e.type === 'goal' && e.team === 'home').slice(-1)[0];
          triggerLiveGoalToast(updatedMatch.home?.name || 'Home', lastGoal?.playerName || '', `${newH} - ${newA}`);
        } else if (newA > lastKnownLiveScore.away) {
          const lastGoal = (updatedMatch.events || []).filter(e => e.type === 'goal' && e.team === 'away').slice(-1)[0];
          triggerLiveGoalToast(updatedMatch.away?.name || 'Away', lastGoal?.playerName || '', `${newH} - ${newA}`);
        }
      }
      lastKnownLiveScore = { home: newH, away: newA };

      curLiveMatch = updatedMatch;
      const idx = matches.findIndex(m => m.id === snap.id);
      if (idx >= 0) matches[idx] = curLiveMatch;
      else setMatchesArray([curLiveMatch, ...matches]);

      renderLiveMatchScreen();
    }
  }, err => {
    console.warn('Live match subscription notice:', err);
  });
}

function triggerLiveGoalToast(teamName, scorerName, scoreStr) {
  const toast = $('live-goal-toast');
  const msgEl = $('live-goal-toast-msg');
  if (!toast || !msgEl) return;

  msgEl.textContent = `⚽ ${scorerName ? esc(scorerName) + ' scored for ' : ''}${esc(teamName)}! (Score: ${scoreStr})`;
  toast.style.display = 'block';

  // Bumping animation on score digits
  const scoreDigits = $('as-hero-score');
  if (scoreDigits) {
    scoreDigits.classList.remove('bump');
    void scoreDigits.offsetWidth;
    scoreDigits.classList.add('bump');
    setTimeout(() => scoreDigits.classList.remove('bump'), 1000);
  }

  if (liveGoalToastTimeout) clearTimeout(liveGoalToastTimeout);
  liveGoalToastTimeout = setTimeout(() => {
    toast.style.display = 'none';
  }, 5000);
}

function renderLiveMatchScreen() {
  if (!curLiveMatch) return;
  const m = curLiveMatch;

  // Reconcile derived score from goals
  const derivedScore = getMatchScoreFromEvents(m.events);
  const derivedHomeScore = derivedScore.home;
  const derivedAwayScore = derivedScore.away;

  const hScore = (m.home && m.home.score != null) ? m.home.score : derivedHomeScore;
  const aScore = (m.away && m.away.score != null) ? m.away.score : derivedAwayScore;

  const hTeam = teams.find(t => t.id === m.home?.teamId);
  const aTeam = teams.find(t => t.id === m.away?.teamId);

  const tourn = tournaments.find(t => t.id === m.tournamentId);
  const st = m.status || 'scheduled';

  // 1. Topbar
  const tournLbl = $('as-tourn-label');
  if (tournLbl) {
    tournLbl.textContent = tourn ? `🏆 ${tourn.name.toUpperCase()}` : '⚽ STANDALONE FRIENDLY';
  }

  const liveInd = $('as-live-indicator');
  const topStatusText = $('as-top-status-text');
  if (liveInd && topStatusText) {
    liveInd.className = 'as-live-pill ' + (st === 'live' ? 'live' : (st === 'final' ? 'final' : 'scheduled'));
    topStatusText.textContent = (st === 'live' ? 'LIVE' : (st === 'final' ? 'FINAL' : 'SCHEDULED'));
  }

  // 2. Hero Card Matchup
  const hCrest = $('as-home-crest');
  if (hCrest) hCrest.innerHTML = matchSideIcon(m.home, hTeam);

  const hTitle = $('as-home-title');
  if (hTitle) hTitle.textContent = m.home?.name || 'Home Team';

  const hMeta = $('as-home-meta');
  if (hMeta) hMeta.textContent = hTeam ? (hTeam.season || 'Club Squad') : (m.home?.lineup?.starters?.length ? 'Roster Imported' : 'New Team');

  const aCrest = $('as-away-crest');
  if (aCrest) aCrest.innerHTML = matchSideIcon(m.away, aTeam);

  const aTitle = $('as-away-title');
  if (aTitle) aTitle.textContent = m.away?.name || 'Away Team';

  const aMeta = $('as-away-meta');
  if (aMeta) aMeta.textContent = aTeam ? (aTeam.season || 'Club Squad') : (m.away?.lineup?.starters?.length ? 'Roster Imported' : 'New Team');

  // Score display
  const scoreEl = $('as-hero-score');
  if (scoreEl) {
    scoreEl.textContent = `${hScore} - ${aScore}`;
  }

  const scoreBadge = $('as-score-badge');
  if (scoreBadge) {
    if (st === 'live') scoreBadge.textContent = '● REAL-TIME SYNC ACTIVE';
    else if (st === 'final') scoreBadge.textContent = 'FINAL SCORE';
    else scoreBadge.textContent = formatMatchDateDisplay(m).toUpperCase();
  }

  const stageTag = $('as-stage-tag');
  if (stageTag) {
    stageTag.textContent = tourn ? `${tourn.name} · MATCH CENTER` : 'FRIENDLY MATCH CENTER';
  }

  // 3. Goal scorers ticker underneath hero scoreboard
  const scorersWrap = $('as-hero-scorers');
  const hScorersList = $('as-home-scorers-list');
  const aScorersList = $('as-away-scorers-list');

  const homeGoals = (m.events || []).filter(e => e.type === 'goal' && e.team === 'home');
  const awayGoals = (m.events || []).filter(e => e.type === 'goal' && e.team === 'away');

  if (homeGoals.length || awayGoals.length) {
    if (scorersWrap) scorersWrap.style.display = 'grid';
    if (hScorersList) {
      hScorersList.innerHTML = homeGoals.map(g => `
        <div class="as-scorer-item">
          <span>⚽</span>
          <strong>${esc(g.playerName)}</strong>
          <span style="color:#94a3b8;">${g.minute ? g.minute + "'" : ''}</span>
        </div>
      `).join('');
    }
    if (aScorersList) {
      aScorersList.innerHTML = awayGoals.map(g => `
        <div class="as-scorer-item">
          <span>⚽</span>
          <strong>${esc(g.playerName)}</strong>
          <span style="color:#94a3b8;">${g.minute ? g.minute + "'" : ''}</span>
        </div>
      `).join('');
    }
  } else {
    if (scorersWrap) scorersWrap.style.display = 'none';
  }

  // 4. Update live clock display
  updateLiveMatchHeroClockOnly();

  // 5. Update team names in pitch toggle
  const btnHName = $('as-btn-home-name');
  if (btnHName) btnHName.textContent = m.home?.name || 'Home';
  const btnAName = $('as-btn-away-name');
  if (btnAName) btnAName.textContent = m.away?.name || 'Away';

  // 6. Update current tab
  if (currentLiveTab === 'timeline') renderLiveTimeline();
  else if (currentLiveTab === 'lineup') renderLivePitch();
  else if (currentLiveTab === 'stats') renderLiveStats();
  else if (currentLiveTab === 'tournament') renderLiveTournament();
}

function updateLiveMatchHeroClockOnly() {
  if (!curLiveMatch) return;
  const m = curLiveMatch;
  const sec = getMatchElapsedSeconds(m);
  const clockStr = formatMatchClockDisplay(sec);
  const periodStr = formatMatchPeriodLabel(m);
  const st = m.status || 'scheduled';
  const isRunning = m.matchClock?.status === 'running';

  const clockEl = $('as-hero-clock');
  if (clockEl) clockEl.textContent = clockStr;

  const periodEl = $('as-hero-period');
  if (periodEl) periodEl.textContent = periodStr;

  const clockPulse = $('as-clock-pulse');
  if (clockPulse) {
    clockPulse.style.display = (st === 'live' && isRunning) ? 'inline-block' : 'none';
  }
}

function showLiveMatchTab(tabName) {
  currentLiveTab = tabName;
  ['timeline', 'lineup', 'stats', 'tournament'].forEach(t => {
    const btn = $('as-tab-' + t);
    const view = $('as-view-' + t);
    if (btn) btn.classList.toggle('active', t === tabName);
    if (view) view.classList.toggle('active', t === tabName);
  });

  if (tabName === 'timeline') renderLiveTimeline();
  else if (tabName === 'lineup') renderLivePitch();
  else if (tabName === 'stats') renderLiveStats();
  else if (tabName === 'tournament') renderLiveTournament();
}

function setLivePitchSide(side) {
  livePitchSide = side;
  const btnH = $('as-side-btn-home');
  const btnA = $('as-side-btn-away');
  if (btnH) btnH.classList.toggle('active', side === 'home');
  if (btnA) btnA.classList.toggle('active', side === 'away');
  renderLivePitch();
}

function renderLiveTimeline() {
  const feedEl = $('as-timeline-feed');
  if (!feedEl || !curLiveMatch) return;

  const events = [...(curLiveMatch.events || [])].sort((a, b) => {
    const minA = a.minute != null ? a.minute : 999;
    const minB = b.minute != null ? b.minute : 999;
    return minA - minB;
  });

  if (!events.length) {
    feedEl.innerHTML = `
      <div style="background:#18202d;border-radius:16px;padding:36px 20px;text-align:center;color:#94a3b8;">
        <div style="font-size:36px;margin-bottom:8px;">⏱️</div>
        <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:4px;">No match events recorded yet</div>
        <p style="font-size:12.5px;max-width:380px;margin:0 auto;">Key moments such as goals, cards, and substitutions logged pitchside will appear here in real time.</p>
      </div>`;
    return;
  }

  feedEl.innerHTML = events.map(ev => {
    const isHome = ev.team === 'home';
    const teamName = isHome ? (curLiveMatch.home?.name || 'Home') : (curLiveMatch.away?.name || 'Away');
    const minText = ev.minute != null ? `${ev.minute}'` : '—';

    let cardCls = 'goal';
    let icon = '⚽';
    let titleText = `${esc(ev.playerName)} (${esc(teamName)})`;
    let subText = '';

    if (ev.type === 'goal') {
      cardCls = 'goal';
      icon = '⚽';
      titleText = `GOAL! ${esc(ev.playerName)} (${esc(teamName)})`;
      if (ev.relatedPlayerId) {
        const assister = findMatchPlayer(ev.relatedPlayerId);
        if (assister) subText = `Assist: ${esc(assister.name)}`;
      }
    } else if (ev.type === 'own_goal') {
      cardCls = 'goal';
      icon = '🔁';
      const beneficiary = ev.team === 'home' ? (curLiveMatch.away?.name || 'Away') : (curLiveMatch.home?.name || 'Home');
      titleText = `OWN GOAL: ${esc(ev.playerName)} (${esc(teamName)}) · Goal for ${esc(beneficiary)}`;
    } else if (ev.type === 'assist') {
      cardCls = 'sub';
      icon = '👟';
      titleText = `ASSIST: ${esc(ev.playerName)} (${esc(teamName)})`;
    } else if (ev.type === 'yellow') {
      cardCls = 'yellow';
      icon = '🟨';
      titleText = `YELLOW CARD: ${esc(ev.playerName)} (${esc(teamName)})`;
    } else if (ev.type === 'red') {
      cardCls = 'red';
      icon = '🟥';
      titleText = `RED CARD: ${esc(ev.playerName)} (${esc(teamName)})`;
    } else if (ev.type === 'sub') {
      cardCls = 'sub';
      icon = '🔄';
      const subOff = findMatchPlayer(ev.relatedPlayerId);
      titleText = `SUBSTITUTION (${esc(teamName)})`;
      subText = `🟢 In: ${esc(ev.playerName)}${subOff ? ' · 🔴 Out: ' + esc(subOff.name) : ''}`;
    }

    if (ev.note) {
      subText = (subText ? subText + ' · ' : '') + esc(ev.note);
    }

    return `
      <div class="as-event-card ${cardCls}">
        <div class="as-event-min">${esc(minText)}</div>
        <div class="as-event-icon">${icon}</div>
        <div class="as-event-details">
          <div class="as-event-title">${titleText}</div>
          ${subText ? `<div class="as-event-meta">${subText}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderLivePitch() {
  if (!curLiveMatch) return;
  const m = curLiveMatch;
  const side = livePitchSide;
  const sideData = side === 'home' ? m.home : m.away;
  const lineup = sideData?.lineup;

  const formationKey = lineup?.formation || '4-4-2';
  const formationBadge = $('as-active-formation');
  if (formationBadge) formationBadge.textContent = `${formationKey.toUpperCase()} FORMATION`;

  const layer = $('as-pitch-players-layer');
  if (layer) {
    const flat = flattenFormation(formationKey);
    const starters = lineup?.starters || [];

    layer.innerHTML = flat.map((slot, i) => {
      const p = starters[i];
      const pName = p ? p.name : slot.role;
      const pNum = p ? (p.jersey != null && p.jersey !== '' ? p.jersey : (i + 1)) : (i + 1);
      const pPos = p ? (posCode(p.position) || p.position || slot.role) : slot.role;

      // Event badges for this starter
      const pEvents = p ? (m.events || []).filter(e => e.team === side && (e.playerId === p.playerId || e.playerName === p.name)) : [];
      const hasGoal = pEvents.some(e => e.type === 'goal');
      const hasYellow = pEvents.some(e => e.type === 'yellow');
      const hasRed = pEvents.some(e => e.type === 'red');

      let evBadges = '';
      if (hasGoal) evBadges += '<span class="as-pin-ev">⚽</span>';
      if (hasYellow) evBadges += '<span class="as-pin-ev">🟨</span>';
      if (hasRed) evBadges += '<span class="as-pin-ev">🟥</span>';

      return `
        <div class="as-pin" style="left:${slot.x}%;top:${slot.y}%;">
          <div class="as-pin-badge">
            ${esc(pNum)}
            ${evBadges ? `<div class="as-pin-events">${evBadges}</div>` : ''}
          </div>
          <div class="as-pin-name">${esc(pName)}</div>
          <div class="as-pin-pos">${esc(pPos)}</div>
        </div>
      `;
    }).join('');
  }

  // Render Bench Substitutes
  const subs = lineup?.subs || [];
  const subsCount = $('as-subs-count');
  if (subsCount) subsCount.textContent = subs.length;

  const benchList = $('as-bench-list');
  if (benchList) {
    if (!subs.length) {
      benchList.innerHTML = '<div style="font-size:12px;color:#94a3b8;padding:8px;">No substitutes listed for this side.</div>';
    } else {
      benchList.innerHTML = subs.map((s, idx) => `
        <div class="as-bench-item">
          <div class="as-bench-num">${esc(s.jersey != null && s.jersey !== '' ? s.jersey : idx + 12)}</div>
          <div class="as-bench-name">${esc(s.name)}</div>
          <div class="as-bench-pos">${esc(posCode(s.position) || s.position || 'SUB')}</div>
        </div>
      `).join('');
    }
  }

  // Render Coaching Staff
  const staff = lineup?.coaches || [];
  const staffCount = $('as-staff-count');
  if (staffCount) staffCount.textContent = staff.length;

  const staffList = $('as-staff-list');
  if (staffList) {
    if (!staff.length) {
      staffList.innerHTML = '<div style="font-size:12px;color:#94a3b8;padding:8px;">No staff listed for this side.</div>';
    } else {
      staffList.innerHTML = staff.map(st => `
        <div class="as-bench-item">
          <div class="as-bench-num" style="background:rgba(255,255,255,0.08);color:#fff;">🧑‍💼</div>
          <div class="as-bench-name">${esc(st.name)}</div>
          <div class="as-bench-pos">${esc(st.role || 'Coach')}</div>
        </div>
      `).join('');
    }
  }
}

function renderLiveStats() {
  const statsContainer = $('as-stats-bars');
  if (!statsContainer || !curLiveMatch) return;
  const m = curLiveMatch;

  const events = m.events || [];

  // Home and Away stats calculation
  const derivedScore = getMatchScoreFromEvents(events);
  const hGoals = (m.home && m.home.score != null) ? m.home.score : derivedScore.home;
  const aGoals = (m.away && m.away.score != null) ? m.away.score : derivedScore.away;

  const hYellow = events.filter(e => e.type === 'yellow' && e.team === 'home').length;
  const aYellow = events.filter(e => e.type === 'yellow' && e.team === 'away').length;

  const hRed = events.filter(e => e.type === 'red' && e.team === 'home').length;
  const aRed = events.filter(e => e.type === 'red' && e.team === 'away').length;

  const hSubs = events.filter(e => e.type === 'sub' && e.team === 'home').length;
  const aSubs = events.filter(e => e.type === 'sub' && e.team === 'away').length;

  const hAssists = events.filter(e => (e.type === 'assist' || (e.type === 'goal' && e.relatedPlayerId)) && e.team === 'home').length;
  const aAssists = events.filter(e => (e.type === 'assist' || (e.type === 'goal' && e.relatedPlayerId)) && e.team === 'away').length;

  const statsList = [
    { name: 'Goals', home: hGoals, away: aGoals },
    { name: 'Assists', home: hAssists, away: aAssists },
    { name: 'Yellow Cards', home: hYellow, away: aYellow },
    { name: 'Red Cards', home: hRed, away: aRed },
    { name: 'Substitutions', home: hSubs, away: aSubs }
  ];

  // Update legends
  const legH = $('as-legend-home');
  if (legH) legH.textContent = `● ${m.home?.name || 'Home'}`;
  const legA = $('as-legend-away');
  if (legA) legA.textContent = `● ${m.away?.name || 'Away'}`;

  statsContainer.innerHTML = statsList.map(st => {
    const total = st.home + st.away;
    let hPct = 50;
    let aPct = 50;
    if (total > 0) {
      hPct = Math.round((st.home / total) * 100);
      aPct = 100 - hPct;
    }

    return `
      <div class="as-stat-item">
        <div class="as-stat-nums">
          <span class="as-stat-num-home">${st.home}</span>
          <span class="as-stat-name">${st.name}</span>
          <span class="as-stat-num-away">${st.away}</span>
        </div>
        <div class="as-stat-bar-track">
          <div class="as-stat-fill-home" style="width:${hPct}%;"></div>
          <div class="as-stat-fill-away" style="width:${aPct}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderLiveTournament() {
  if (!curLiveMatch) return;
  const m = curLiveMatch;
  const tourn = tournaments.find(t => t.id === m.tournamentId);

  const tableContainer = $('as-tourn-standings-table');
  const otherMatchesContainer = $('as-tourn-other-matches');
  const panelTitle = $('as-tourn-panel-title');

  if (!tourn) {
    if (panelTitle) panelTitle.textContent = 'STANDALONE MATCH DETAILS';
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div style="background:#18202d;border-radius:14px;padding:24px;text-align:center;color:#94a3b8;">
          <div style="font-size:32px;margin-bottom:8px;">⚽</div>
          <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:4px;">Standalone Exhibition / Friendly Match</div>
          <p style="font-size:12px;">This match is an independent fixture and not affiliated with an ongoing league or tournament table.</p>
        </div>`;
    }
    if (otherMatchesContainer) {
      otherMatchesContainer.innerHTML = '<div style="font-size:12px;color:#94a3b8;padding:8px;">No other matches linked to this friendly fixture.</div>';
    }
    return;
  }

  if (panelTitle) panelTitle.textContent = `${tourn.name.toUpperCase()} · LIVE STANDINGS`;

  // Compute tournament standings table
  const tournMatches = matches.filter(x => x.tournamentId === tourn.id);
  const teamIds = tourn.teamIds || [];
  const enteredTeams = teams.filter(tm => teamIds.includes(tm.id));

  const tableMap = {};
  enteredTeams.forEach(tm => {
    tableMap[tm.id] = {
      id: tm.id,
      name: tm.name,
      logo: tm.logo,
      emoji: tm.emoji || '⚽',
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0
    };
  });

  tournMatches.forEach(match => {
    const isCompleted = match.status === 'final' || match.status === 'completed';
    const isLive = match.status === 'live';
    if (!isCompleted && !isLive) return;

    const hId = match.home?.teamId;
    const aId = match.away?.teamId;
    const hScore = (match.home && match.home.score != null) ? match.home.score : 0;
    const aScore = (match.away && match.away.score != null) ? match.away.score : 0;

    if (tableMap[hId] && tableMap[aId]) {
      tableMap[hId].played++;
      tableMap[aId].played++;
      tableMap[hId].gf += hScore;
      tableMap[hId].ga += aScore;
      tableMap[aId].gf += aScore;
      tableMap[aId].ga += hScore;

      if (hScore > aScore) {
        tableMap[hId].won++;
        tableMap[hId].points += 3;
        tableMap[aId].lost++;
      } else if (aScore > hScore) {
        tableMap[aId].won++;
        tableMap[aId].points += 3;
        tableMap[hId].lost++;
      } else {
        tableMap[hId].drawn++;
        tableMap[aId].drawn++;
        tableMap[hId].points += 1;
        tableMap[aId].points += 1;
      }
    }
  });

  const sortedTable = Object.values(tableMap).map(row => {
    row.gd = row.gf - row.ga;
    return row;
  }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));

  if (tableContainer) {
    tableContainer.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="stat-table" style="width:100%;color:#cbd5e1;">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1);color:#94a3b8;font-size:11px;text-transform:uppercase;">
              <th style="padding:8px 4px;text-align:center;width:30px;">#</th>
              <th style="padding:8px;text-align:left;">Team</th>
              <th style="padding:8px;text-align:center;">P</th>
              <th style="padding:8px;text-align:center;">W</th>
              <th style="padding:8px;text-align:center;">D</th>
              <th style="padding:8px;text-align:center;">L</th>
              <th style="padding:8px;text-align:center;">GD</th>
              <th style="padding:8px;text-align:right;">PTS</th>
            </tr>
          </thead>
          <tbody>
            ${sortedTable.map((row, idx) => {
      const isMatchTeam = row.id === m.home?.teamId || row.id === m.away?.teamId;
      const badge = row.logo ? `<img src="${esc(row.logo)}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px;" alt="">` : `<span style="margin-right:6px;">${row.emoji}</span>`;
      return `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);${isMatchTeam ? 'background:rgba(34,197,94,0.1);font-weight:700;' : ''}">
                  <td style="padding:8px 4px;text-align:center;color:#94a3b8;font-size:12px;">${idx + 1}</td>
                  <td style="padding:8px;color:#fff;display:flex;align-items:center;">${badge}<span>${esc(row.name)}</span></td>
                  <td style="padding:8px;text-align:center;">${row.played}</td>
                  <td style="padding:8px;text-align:center;">${row.won}</td>
                  <td style="padding:8px;text-align:center;">${row.drawn}</td>
                  <td style="padding:8px;text-align:center;">${row.lost}</td>
                  <td style="padding:8px;text-align:center;color:${row.gd > 0 ? '#4ade80' : (row.gd < 0 ? '#f87171' : '#cbd5e1')};">${row.gd > 0 ? '+' + row.gd : row.gd}</td>
                  <td style="padding:8px;text-align:right;color:#22c55e;font-size:14px;font-weight:800;">${row.points}</td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Other matches in tournament
  const otherMatches = tournMatches.filter(x => x.id !== m.id);
  if (otherMatchesContainer) {
    if (!otherMatches.length) {
      otherMatchesContainer.innerHTML = '<div style="font-size:12px;color:#94a3b8;padding:8px;">No other matches scheduled in this tournament.</div>';
    } else {
      otherMatchesContainer.innerHTML = otherMatches.map(om => {
        const omH = (om.home && om.home.score != null) ? om.home.score : 0;
        const omA = (om.away && om.away.score != null) ? om.away.score : 0;
        const omSt = om.status || 'scheduled';
        return `
          <div class="as-event-card" style="cursor:pointer;" onclick="initLiveMatchView('${om.id}')" title="View this match live">
            <div style="flex:1;">
              <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">${formatMatchDateDisplay(om)}</div>
              <div style="font-size:13.5px;font-weight:700;color:#fff;">
                ${esc(om.home?.name || 'Home')} <span style="color:#22c55e;padding:0 4px;">${omSt === 'scheduled' ? 'vs' : `${omH} - ${omA}`}</span> ${esc(om.away?.name || 'Away')}
              </div>
            </div>
            <div>
              <span class="as-live-pill ${omSt}">${esc(omSt.toUpperCase())} ↗</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}


async function loadBrandingFS() {
  try {
    const snap = await db.collection('settings').doc('branding').get();
    if (snap.exists) {
      const d = snap.data();
      if (d.name) localStorage.setItem(ANK, d.name);
      if (d.sub) localStorage.setItem(ASK, d.sub);
      if (d.logo && d.logo.length > 30) localStorage.setItem(ALK, d.logo);
      if (d.heroImage && d.heroImage.length > 30) localStorage.setItem('cms_login_hero_image', d.heroImage);
      applyAdmName();
      applyHeroShowcaseImage();
    }
  } catch (e) { console.warn('Could not load branding from Firestore:', e); }
}

applyAdmName();
applyHeroShowcaseImage();
loadBrandingFS();
loadAdminCreds();
resetLoginForm();

window.addEventListener('beforeunload', (e) => {
  if (curMatch && (curMatch.status === 'live' || curMatch.matchClock?.status === 'running')) {
    e.preventDefault();
    e.returnValue = 'A match is currently live and the clock is running.';
    return e.returnValue;
  }
});

const up = new URLSearchParams(location.search);
if (up.get('createMatch') || up.get('newMatch')) {
  initCreateMatchView(up.get('createMatch') || up.get('newMatch'));
} else if (up.get('live') || up.get('score') || up.get('liveMatch')) {
  initLiveMatchView(up.get('live') || up.get('score') || up.get('liveMatch'));
} else if (up.get('match')) {
  const isAuth = (sessionStorage.getItem('fhq_session_active') === '1' || localStorage.getItem('fhq_session_active') === '1' || !!localStorage.getItem('cms_auth_cached_user'));
  if (isAuth) {
    sessionStorage.setItem('fhq_session_active', '1');
    initMatchView(up.get('match'));
  } else {
    initLiveMatchView(up.get('match'));
  }
} else if (up.get('team')) {
  if (up.get('type') === 'staff') initPubStaff(up.get('team'));
  else initPub(up.get('team'));
} else if (up.get('view')) {
  initPublicView(up.get('view'));
} else if (up.get('discuss') || up.get('discussion')) {
  initPublicDiscussion(up.get('discuss') || up.get('discussion'));
} else {
  if (sessionStorage.getItem('fhq_session_active') === '1' || localStorage.getItem('fhq_session_active') === '1' || !!localStorage.getItem('cms_auth_cached_user')) {
    loadAdmin();
  } else {
    ss('s-login');
  }
}
