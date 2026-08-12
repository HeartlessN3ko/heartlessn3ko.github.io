const state = { article: null, segments: [], voices: [], currentJob: null };
const purposes = [
  "The line that makes someone stop scrolling.",
  "What the argument is actually about.",
  "The strongest real objection—not a straw man.",
  "Where you land and why.",
  "What you would do, then where to read the full piece.",
];

const $ = (selector) => document.querySelector(selector);

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || `Request failed (${response.status})`);
  return payload;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function updateMeter() {
  const words = state.segments.reduce((total, segment) => total + segment.narration.trim().split(/\s+/).filter(Boolean).length, 0);
  $("#word-count").textContent = `${words} words`;
  $("#time-estimate").textContent = `roughly ${Math.round(words / 1.5)}–${Math.round(words / 1.25)} seconds in Voicebox`;
  validateExport();
}

function validateExport() {
  const validSegments = state.segments.length === 5 && state.segments.every((segment) => {
    const passage = state.article?.passages?.[segment.source_index];
    return segment.narration.trim() && segment.highlight.trim() && passage && passage.text.toLowerCase().includes(segment.highlight.trim().toLowerCase());
  });
  const words = state.segments.reduce((total, segment) => total + segment.narration.trim().split(/\s+/).filter(Boolean).length, 0);
  const hasVoice = Boolean($("#voice-select").value);
  $("#export-button").disabled = !(validSegments && words >= 60 && words <= 120 && hasVoice && $("#approved").checked && !state.currentJob);
}

function renderSegments() {
  const container = $("#segments");
  container.innerHTML = state.segments.map((segment, index) => {
    const options = state.article.passages.map((passage, passageIndex) => {
      const label = `${passage.kind.toUpperCase()} · ${passage.text.slice(0, 92)}${passage.text.length > 92 ? "…" : ""}`;
      return `<option value="${passageIndex}" ${passageIndex === segment.source_index ? "selected" : ""}>${escapeHtml(label)}</option>`;
    }).join("");
    return `<article class="segment" data-index="${index}">
      <div>
        <div class="segment-number">${index + 1}</div>
        <p class="segment-kind">${escapeHtml(segment.kind)}</p>
        <p class="segment-purpose">${escapeHtml(purposes[index])}</p>
      </div>
      <div class="segment-fields">
        <label>Narration<textarea data-field="narration">${escapeHtml(segment.narration)}</textarea></label>
        <label>Exact article passage<select data-field="source_index">${options}</select></label>
        <blockquote class="quote-preview">${escapeHtml(segment.source_quote)}</blockquote>
        <label>Words to highlight<input type="text" data-field="highlight" value="${escapeHtml(segment.highlight)}"></label>
      </div>
    </article>`;
  }).join("");

  container.querySelectorAll(".segment").forEach((card) => {
    const index = Number(card.dataset.index);
    card.querySelector('[data-field="narration"]').addEventListener("input", (event) => {
      state.segments[index].narration = event.target.value;
      updateMeter();
    });
    card.querySelector('[data-field="highlight"]').addEventListener("input", (event) => {
      state.segments[index].highlight = event.target.value;
      validateExport();
    });
    card.querySelector('[data-field="source_index"]').addEventListener("change", (event) => {
      const sourceIndex = Number(event.target.value);
      const source = state.article.passages[sourceIndex].text;
      state.segments[index].source_index = sourceIndex;
      state.segments[index].source_quote = source;
      state.segments[index].highlight = source.split(/(?<=[.!?])\s+/)[0].slice(0, 160);
      renderSegments();
      updateMeter();
    });
  });
  updateMeter();
}

async function loadArticle(slug) {
  const payload = await api(`/api/articles/${encodeURIComponent(slug)}`);
  state.article = payload.article;
  state.segments = payload.segments;
  $("#article-link").href = state.article.canonical_url;
  $("#approved").checked = false;
  const warning = $("#warning-box");
  if (payload.warnings.length) {
    warning.hidden = false;
    warning.innerHTML = `<strong>Needs your judgment:</strong> ${payload.warnings.map(escapeHtml).join(" ")}`;
  } else {
    warning.hidden = true;
  }
  renderSegments();
}

function populateVoices(payload) {
  state.voices = payload.voices || [];
  const select = $("#voice-select");
  const usable = state.voices.filter((voice) => voice.compatible);
  if (!payload.health?.reachable) {
    select.innerHTML = '<option value="">Voicebox is offline</option>';
    select.disabled = true;
    $("#voice-status").textContent = "Voicebox is installed but its local server is not running.";
    $("#start-voicebox").hidden = false;
    validateExport();
    return;
  }
  $("#start-voicebox").hidden = true;
  if (!usable.length) {
    select.innerHTML = '<option value="">No profile has a downloaded compatible model</option>';
    select.disabled = true;
    $("#voice-status").textContent = "Open Voicebox once and finish downloading a model for one of your profiles.";
  } else {
    select.innerHTML = usable.map((voice) => `<option value="${escapeHtml(voice.id)}">${escapeHtml(voice.name)} · ${escapeHtml(voice.engine)}</option>`).join("");
    const preferred = usable.find((voice) => /janine/i.test(voice.name)) || usable[0];
    select.value = preferred.id;
    select.disabled = false;
    $("#voice-status").textContent = `${usable.length} local profile${usable.length === 1 ? "" : "s"} ready. Voicebox is CPU-only, so rendering is deliberate rather than instant.`;
  }
  validateExport();
}

async function refreshVoicebox() {
  try { populateVoices(await api("/api/voicebox")); }
  catch (error) { $("#voice-status").textContent = error.message; }
}

async function startVoicebox() {
  const button = $("#start-voicebox");
  button.disabled = true;
  button.textContent = "Starting…";
  $("#voice-status").textContent = "Starting Voicebox and waiting for its local model service…";
  try { populateVoices(await api("/api/voicebox/start", { method: "POST" })); }
  catch (error) { $("#voice-status").textContent = error.message; }
  finally { button.disabled = false; button.textContent = "Start Voicebox"; }
}

async function createExport() {
  const selectedVoice = state.voices.find((voice) => voice.id === $("#voice-select").value);
  const body = {
    slug: state.article.slug,
    segments: state.segments,
    voice: { id: selectedVoice.id, name: selectedVoice.name, engine: selectedVoice.engine, model_size: selectedVoice.model_size },
    approved: $("#approved").checked,
  };
  state.currentJob = "starting";
  validateExport();
  $("#job-panel").hidden = false;
  $("#job-error").hidden = true;
  $("#downloads").hidden = true;
  try {
    const job = await api("/api/exports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    state.currentJob = job.id;
    pollJob(job.id);
  } catch (error) {
    state.currentJob = null;
    showFailure(error.message);
    validateExport();
  }
}

function showFailure(message) {
  $("#job-message").textContent = "Export stopped";
  $("#job-error").textContent = message;
  $("#job-error").hidden = false;
}

function renderDownloads(job) {
  const labels = { video: "Download MP4", cover: "Cover image", caption: "TikTok caption", subtitles: "Timed captions", project: "Project record", evidence: "Runtime evidence" };
  const container = $("#downloads");
  container.innerHTML = Object.entries(labels).filter(([key]) => job.downloads?.[key]).map(([key, label]) => `<a href="${job.downloads[key]}">${label}</a>`).join("");
  container.hidden = false;
  loadRecentExports();
}

async function loadRecentExports() {
  const exports = await api("/api/recent-exports");
  const panel = $("#recent-panel");
  const container = $("#recent-exports");
  if (!exports.length) {
    panel.hidden = true;
    return;
  }
  container.innerHTML = exports.map((item) => `<article class="recent-export">
    <div><strong>${escapeHtml(item.title || item.slug.replaceAll("-", " "))}</strong><span>Saved ${escapeHtml(item.created)} · local export</span></div>
    <a href="${item.downloads.video}">Download MP4</a>
  </article>`).join("");
  panel.hidden = false;
}

async function pollJob(jobId) {
  try {
    const job = await api(`/api/exports/${jobId}`);
    $("#job-message").textContent = job.message;
    $("#job-percent").textContent = `${job.progress}%`;
    $("#job-progress").style.width = `${job.progress}%`;
    if (job.state === "complete") {
      state.currentJob = null;
      renderDownloads(job);
      validateExport();
      return;
    }
    if (job.state === "failed") {
      state.currentJob = null;
      showFailure(job.error);
      validateExport();
      return;
    }
    setTimeout(() => pollJob(jobId), 1800);
  } catch (error) {
    state.currentJob = null;
    showFailure(error.message);
    validateExport();
  }
}

async function initialize() {
  const articles = await api("/api/articles");
  const select = $("#article-select");
  select.innerHTML = articles.map((article) => `<option value="${escapeHtml(article.slug)}">${escapeHtml(article.title)}</option>`).join("");
  select.addEventListener("change", () => loadArticle(select.value));
  $("#voice-select").addEventListener("change", validateExport);
  $("#approved").addEventListener("change", validateExport);
  $("#start-voicebox").addEventListener("click", startVoicebox);
  $("#export-button").addEventListener("click", createExport);
  await Promise.all([loadArticle(select.value), refreshVoicebox(), loadRecentExports()]);
}

initialize().catch((error) => {
  $("#warning-box").hidden = false;
  $("#warning-box").textContent = `Studio could not start: ${error.message}`;
});
