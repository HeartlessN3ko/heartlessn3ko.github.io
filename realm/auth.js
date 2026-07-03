/* SRX CODEX — Auth & Supabase helpers
   Shared across all realm/ pages. */

const OAUTH_FN     = 'https://escdlctsclmpevktgcin.supabase.co/functions/v1/discord-oauth';
const CODEX_API    = 'https://escdlctsclmpevktgcin.supabase.co/functions/v1/codex-intake';

const REALM_AUTH_KEY = 'realm-discord-auth-v2';

// ── Identity ──────────────────────────────────────────────────────────────────

function getRealmAuth() {
  try {
    const auth = JSON.parse(localStorage.getItem(REALM_AUTH_KEY) || 'null');
    if (!auth || !auth.sessionToken || !auth.expiresAt || auth.expiresAt <= Date.now()) {
      localStorage.removeItem(REALM_AUTH_KEY);
      return null;
    }
    return auth;
  } catch {
    localStorage.removeItem(REALM_AUTH_KEY);
    return null;
  }
}

function _saveRealmAuth(sessionToken) {
  const payload = _decodeSessionPayload(sessionToken);
  if (!payload || payload.v !== 1 || !/^\d{15,20}$/.test(payload.sub || '') ||
      !payload.exp || payload.exp * 1000 <= Date.now()) {
    throw new Error('invalid identity seal');
  }
  const auth = {
    discordId: payload.sub,
    discordUsername: payload.name || 'External identity',
    sessionToken,
    expiresAt: payload.exp * 1000,
    loggedInAt: new Date().toISOString(),
  };
  localStorage.setItem(REALM_AUTH_KEY, JSON.stringify(auth));
  return auth;
}

function _decodeSessionPayload(token) {
  try {
    const part = String(token || '').split('.')[0];
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - part.length % 4) % 4);
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return null; }
}

function updateLoginLabels(auth) {
  if (!auth) auth = getRealmAuth();
  document.querySelectorAll('[data-discord-user]').forEach(el => {
    el.textContent = auth ? auth.discordUsername : 'identity unverified';
  });
}

// Called by every page that needs a logged-in user.
// options.public = true → just show labels, don't gate.
function requireRealmLogin(options = {}) {
  // ── 1. Absorb OAuth callback params ─────────────────────────────────────────
  const params        = new URLSearchParams(location.search);
  const fragment      = new URLSearchParams(location.hash.replace(/^#/, ''));
  const sessionToken  = fragment.get('session');
  const incomingState = fragment.get('state') || '';
  const oauthError    = params.get('oauth_error');

  if (sessionToken) {
    const storedNonce = sessionStorage.getItem('oauth_nonce');
    if (!storedNonce || storedNonce !== incomingState) {
      localStorage.removeItem(REALM_AUTH_KEY);
      sessionStorage.removeItem('oauth_nonce');
      history.replaceState({}, '', location.pathname);
      _showAlert('Identity-seal verification failed. Begin the anchoring sequence again.', 'error');
    } else {
      try {
        const auth = _saveRealmAuth(sessionToken);
        sessionStorage.removeItem('oauth_nonce');
        history.replaceState({}, '', location.pathname);
        updateLoginLabels(auth);
        return auth;
      } catch {
        localStorage.removeItem(REALM_AUTH_KEY);
        history.replaceState({}, '', location.pathname);
        _showAlert('The returning identity seal could not be verified. Re-establish the anchor.', 'error');
      }
    }
  }

  if (oauthError) {
    history.replaceState({}, '', location.pathname);
    _showAlert('External identity link failed: ' + oauthError.replace(/_/g, ' ') + '. Re-establish the anchor.');
  }

  // ── 2. Check existing session ────────────────────────────────────────────────
  const auth = getRealmAuth();
  updateLoginLabels(auth);

  if (options.public === true) return auth;

  if (!auth) {
    _showLoginGate();
    return null;
  }
  return auth;
}

function _showLoginGate() {
  const gate = document.createElement('div');
  gate.className = 'login-gate';
  gate.innerHTML = `
    <div class="login-panel">
      <div class="kicker">Identity Anchor Required</div>
      <h2>Establish continuity before proceeding.</h2>
      <p>SRX must bind this relay to a stable identity from your current reality. The anchor prevents duplicate records and keeps your transfer authorization reachable if the dimensional signal fails.</p>
      <div class="actions">
        <button class="btn" id="srx-oauth-btn">Establish Identity Anchor</button>
        <a class="btn ghost" href="../">Return to Transfer Notice</a>
      </div>
      <div class="status-box" id="srx-gate-status"></div>
    </div>`;
  document.body.appendChild(gate);
  document.body.classList.add('gated');
  gate.querySelector('#srx-oauth-btn').addEventListener('click', _startOAuth);
}

function _startOAuth() {
  localStorage.removeItem(REALM_AUTH_KEY);
  const nonce = _randomNonce() + (location.pathname.includes('/tactical/') ? '.tactical' : '');
  sessionStorage.setItem('oauth_nonce', nonce);
  location.href = `${OAUTH_FN}?action=login&state=${encodeURIComponent(nonce)}`;
}

function _randomNonce() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

function _showAlert(msg, type) {
  const box = document.getElementById('srx-alert');
  if (!box) return;
  box.textContent = msg;
  box.className   = 'status-box' + (type === 'error' ? ' error' : '');
  box.style.display = 'block';
}

// ── Storage upload ────────────────────────────────────────────────────────────

async function uploadRefImage(file) {
  const res = await _codexFetch('?action=upload', {
    method:  'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `visual record transfer rejected (${res.status})`);
  }
  return (await res.json()).url;
}

// ── Supabase REST insert ──────────────────────────────────────────────────────

async function insertApplication(payload) {
  const res = await _codexFetch('?action=submit', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ application: payload }),
  });
  if (res.status === 409) throw Object.assign(new Error('duplicate'), { code: 409 });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}

async function fetchApplicationStatus() {
  const res = await _codexFetch('?action=status', { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function _codexFetch(path, options = {}) {
  const auth = getRealmAuth();
  if (!auth) throw new Error('Identity anchor expired; establish it again');
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${auth.sessionToken}`);
  const res = await fetch(CODEX_API + path, { ...options, headers });
  if (res.status === 401) localStorage.removeItem(REALM_AUTH_KEY);
  return res;
}

// ── Legacy stubs (kept so lore/rules pages don't break) ──────────────────────

function markApplicationSubmitted() {}
function markLoreCompleted()        {}
function markRulesCompleted()       {}

function statusLabel(value) {
  return ({
    not_started:    'UNREGISTERED',
    pending:        'UNDER COMMAND REVIEW',
    needs_revision: 'CLARIFICATION REQUIRED',
    revision:       'CLARIFICATION REQUIRED',
    approved:       'TRANSFER AUTHORIZED',
    rejected:       'TRANSFER DECLINED',
    imported:       'RECORD RECOVERED',
  })[value] || String(value || 'UNKNOWN').toUpperCase();
}
