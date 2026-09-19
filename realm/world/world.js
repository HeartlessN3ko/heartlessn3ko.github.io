const WORLD_STATUS_API = 'https://great-generals-game-services.up.railway.app/world-status';
const REFRESH_MS = 60000;

const dotEl = document.getElementById('world-live-dot');
const lineEl = document.getElementById('world-status-line');
const gridEl = document.getElementById('world-status-grid');
const kingdomsEl = document.getElementById('world-kingdoms');

function esc(value) {
  const node = document.createElement('span');
  node.textContent = String(value ?? '');
  return node.innerHTML;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function relativeTime(iso) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'unknown';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

function renderStatus(data) {
  gridEl.innerHTML = `
    <div><span>Total Population</span><strong>${formatNumber(data.total_population)}</strong></div>
    <div><span>Reporting Powers</span><strong>${formatNumber(data.kingdoms.length)}</strong></div>
    <div><span>Cycle</span><strong>${formatNumber(data.turn)}</strong></div>
    <div><span>Signal Age</span><strong>${esc(relativeTime(data.generated_at))}</strong></div>
  `;
  const sorted = data.kingdoms.slice().sort((a, b) => b.population - a.population);
  kingdomsEl.innerHTML = sorted.map(k => `
    <article class="world-kingdom-card">
      <span class="badge">${esc(k.provinces)} region${k.provinces === 1 ? '' : 's'}</span>
      <h3>${esc(k.kingdom_id)}</h3>
      <p>Population ${formatNumber(k.population)}</p>
    </article>
  `).join('');
}

async function refresh() {
  try {
    const response = await fetch(WORLD_STATUS_API, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.reason || `relay error ${response.status}`);
    renderStatus(data);
    dotEl.className = 'world-live-dot';
    lineEl.className = 'world-status-line';
    lineEl.textContent = `Live signal from campaign "${data.campaign}" — refreshed ${new Date().toLocaleTimeString()}.`;
  } catch (error) {
    dotEl.className = 'world-live-dot down';
    lineEl.className = 'world-status-line error';
    lineEl.textContent = `SRX Relay // signal lost — ${error.message}`;
  }
}

refresh();
setInterval(refresh, REFRESH_MS);
