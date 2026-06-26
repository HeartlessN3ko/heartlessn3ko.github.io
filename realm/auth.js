/* SRX CODEX — Auth & Supabase helpers
   Shared across all realm/ pages. */

const SUPABASE_URL = 'https://escdlctsclmpevktgcin.supabase.co';
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzY2RsY3RzY2xtcGV2a3RnY2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5ODg1MjEsImV4cCI6MjA4OTU2NDUyMX0.sO-HTPk8JHZQaibHG2UVdzXXtId_hqLwHtWJlD2uzVo';
const OAUTH_FN     = 'https://escdlctsclmpevktgcin.supabase.co/functions/v1/discord-oauth';
const BUCKET       = 'application-refs';

const REALM_AUTH_KEY = 'realm-discord-auth-v1';

// ── Identity ──────────────────────────────────────────────────────────────────

function getRealmAuth() {
  try { return JSON.parse(localStorage.getItem(REALM_AUTH_KEY) || 'null'); }
  catch { return null; }
}

function _saveRealmAuth(discordId, discordUsername) {
  const auth = { discordId, discordUsername, loggedInAt: new Date().toISOString() };
  localStorage.setItem(REALM_AUTH_KEY, JSON.stringify(auth));
  return auth;
}

function updateLoginLabels(auth) {
  if (!auth) auth = getRealmAuth();
  document.querySelectorAll('[data-discord-user]').forEach(el => {
    el.textContent = auth ? auth.discordUsername : 'Discord required';
  });
}

// Called by every page that needs a logged-in user.
// options.public = true → just show labels, don't gate.
function requireRealmLogin(options = {}) {
  // ── 1. Absorb OAuth callback params ─────────────────────────────────────────
  const params        = new URLSearchParams(location.search);
  const incomingId    = params.get('discord_id');
  const incomingUser  = params.get('discord_username');
  const incomingState = params.get('state') || '';
  const oauthError    = params.get('oauth_error');

  if (incomingId && incomingUser) {
    // Verify CSRF nonce if we stored one
    const storedNonce = sessionStorage.getItem('oauth_nonce');
    if (storedNonce && storedNonce !== incomingState) {
      _showAlert('OAuth state mismatch — possible CSRF. Please try again.', 'error');
    } else {
      const auth = _saveRealmAuth(incomingId, incomingUser);
      sessionStorage.removeItem('oauth_nonce');
      history.replaceState({}, '', location.pathname);
      updateLoginLabels(auth);
      return auth;
    }
  }

  if (oauthError) {
    history.replaceState({}, '', location.pathname);
    _showAlert('Discord sign-in failed: ' + oauthError.replace(/_/g, ' ') + '. Please try again.');
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
      <div class="kicker">Discord Required</div>
      <h2>Connect your account before proceeding.</h2>
      <p>Your application must be linked to your Discord so SRX Command can deliver the result by DM.</p>
      <div class="actions">
        <button class="btn" id="srx-oauth-btn">Connect Discord</button>
        <a class="btn ghost" href="../">Return Home</a>
      </div>
      <div class="status-box" id="srx-gate-status"></div>
    </div>`;
  document.body.appendChild(gate);
  document.body.classList.add('gated');
  gate.querySelector('#srx-oauth-btn').addEventListener('click', _startOAuth);
}

function _startOAuth() {
  const nonce = _randomNonce();
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

async function uploadRefImage(file, discordId) {
  const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const ts   = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${discordId}/${ts}_${rand}.${ext}`;

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type':  file.type || 'application/octet-stream',
    },
    body: file,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `upload HTTP ${res.status}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

// ── Supabase REST insert ──────────────────────────────────────────────────────

async function insertApplication(payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/character_applications`, {
    method:  'POST',
    headers: {
      'apikey':        ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) throw Object.assign(new Error('duplicate'), { code: 409 });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
}

// ── Legacy stubs (kept so lore/rules pages don't break) ──────────────────────

function markApplicationSubmitted() {}
function markLoreCompleted()        {}
function markRulesCompleted()       {}

function statusLabel(value) {
  return ({
    not_started:    'NOT STARTED',
    pending:        'SUBMITTED / PENDING',
    needs_revision: 'NEEDS REVISION',
    approved:       'APPROVED',
    rejected:       'REJECTED',
    imported:       'IMPORTED',
  })[value] || String(value || 'UNKNOWN').toUpperCase();
}
