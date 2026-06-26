const REALM_AUTH_KEY = 'realm-discord-auth-v1';
const REALM_STATUS_KEY = 'realm-application-status-v1';

function getRealmAuth() {
  try { return JSON.parse(localStorage.getItem(REALM_AUTH_KEY) || 'null'); }
  catch { return null; }
}

function setRealmAuth(username) {
  const auth = {
    discordUsername: username || 'Applicant#0000',
    discordId: `prototype-${Date.now()}`,
    loggedInAt: new Date().toISOString()
  };
  localStorage.setItem(REALM_AUTH_KEY, JSON.stringify(auth));
  return auth;
}

function getRealmStatus() {
  const defaults = {
    applicationStatus: 'not_started',
    submittedAt: null,
    reviewedAt: null,
    reviewerNotes: '',
    loreCompleted: false,
    rulesCompleted: false,
    inviteSent: false
  };
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(REALM_STATUS_KEY) || '{}') }; }
  catch { return defaults; }
}

function setRealmStatus(patch) {
  const next = { ...getRealmStatus(), ...patch };
  localStorage.setItem(REALM_STATUS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('realm-status-change', { detail: next }));
  return next;
}

function requireRealmLogin(options = {}) {
  const auth = getRealmAuth();
  const isPublic = options.public === true;
  updateLoginLabels(auth);
  if (auth || isPublic) return auth;

  const gate = document.createElement('div');
  gate.className = 'login-gate';
  gate.innerHTML = `
    <div class="login-panel">
      <div class="kicker">Discord Required</div>
      <h2>Identify before proceeding.</h2>
      <p>Character intake, rules acknowledgement, lore completion, and application status must attach to your Discord account. The production version will use Discord OAuth; this prototype stores a local test login.</p>
      <label for="prototypeDiscord">Discord username</label>
      <input id="prototypeDiscord" placeholder="username or display name" autocomplete="username">
      <div class="actions"><button class="btn" id="prototypeLogin" type="button">Connect Discord</button><a class="btn ghost" href="../">Return Home</a></div>
      <div class="status-box">SRX ORACLE // Real build: Supabase Auth with Discord provider, then writes discord_user_id to every application record.</div>
    </div>`;
  document.body.appendChild(gate);
  document.body.classList.add('gated');
  gate.querySelector('#prototypeLogin').addEventListener('click', () => {
    const username = gate.querySelector('#prototypeDiscord').value.trim();
    const nextAuth = setRealmAuth(username);
    document.body.classList.remove('gated');
    gate.remove();
    updateLoginLabels(nextAuth);
  });
  return null;
}

function updateLoginLabels(auth = getRealmAuth()) {
  document.querySelectorAll('[data-discord-user]').forEach((node) => {
    node.textContent = auth ? auth.discordUsername : 'Discord required';
  });
}

function markLoreCompleted() {
  return setRealmStatus({ loreCompleted: true });
}

function markRulesCompleted() {
  return setRealmStatus({ rulesCompleted: true });
}

function markApplicationSubmitted() {
  return setRealmStatus({ applicationStatus: 'pending', submittedAt: new Date().toISOString() });
}

function statusLabel(value) {
  return ({
    not_started: 'NOT STARTED',
    pending: 'SUBMITTED / PENDING',
    needs_revision: 'NEEDS REVISION',
    approved: 'APPROVED',
    rejected: 'REJECTED',
    imported: 'IMPORTED'
  })[value] || String(value || 'UNKNOWN').toUpperCase();
}
