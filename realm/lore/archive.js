function recordUrl(id) {
  return `record/?id=${encodeURIComponent(id)}`;
}

function cardMedia(record) {
  if (!record.image) {
    return `<div class="archive-record-thumb archive-record-no-image"><span>${record.imageStatus || "No public image on file"}</span></div>`;
  }
  return `<img class="archive-record-thumb" src="${record.image.remote}" alt="${record.image.alt}">`;
}

function recordCard(record) {
  const category = window.SRX_PUBLIC_ARCHIVE.categories.find((item) => item.id === record.category);
  return `<a class="archive-record-card" href="${recordUrl(record.id)}">
    ${cardMedia(record)}
    <div class="archive-record-meta"><span>${category?.label || "Archive"}</span><span>${record.classification}</span></div>
    <h3>${record.title}</h3><p>${record.summary}</p>
    <span class="record-open-label">Open record</span>
  </a>`;
}

function featuredRecord(record, rank) {
  return `<a class="archive-featured-record ${rank}" href="${recordUrl(record.id)}">
    ${cardMedia(record)}
    <div class="archive-featured-copy">
      <span>${rank === "primary" ? "Featured Entry" : "Secondary Entry"} // ${record.classification}</span>
      <h2>${record.title}</h2>
      <p>${record.summary}</p>
      <strong>Open full record</strong>
    </div>
  </a>`;
}

function initArchiveHome() {
  const archive = window.SRX_PUBLIC_ARCHIVE;
  document.getElementById("archive-last-updated").textContent = archive.updated;
  document.getElementById("archive-current-era").textContent = archive.currentEra;
  document.getElementById("archive-record-count").textContent = archive.records.length;
  const arthas = archive.records.find((record) => record.id === "arthas-raiku");
  const realmMap = archive.records.find((record) => record.id === "the-realm");
  document.getElementById("archive-featured").innerHTML =
    featuredRecord(arthas, "primary") + featuredRecord(realmMap, "secondary");
  const directorySelect = document.getElementById("archive-directory-select");
  directorySelect.insertAdjacentHTML("beforeend", archive.directories.map((directory) => {
    const count = archive.records.filter((record) => record.directories.includes(directory.id)).length;
    return `<option value="${directory.href}">${directory.label} (${count})</option>`;
  }).join(""));
  directorySelect.addEventListener("change", () => {
    if (directorySelect.value) window.location.href = directorySelect.value;
  });

  const input = document.getElementById("archive-search");
  const results = document.getElementById("archive-search-results");
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      results.innerHTML = "";
      results.hidden = true;
      return;
    }
    const matches = archive.records.filter((record) => [record.title, record.subtitle, record.summary, ...(record.facts || []).flat()].join(" ").toLowerCase().includes(query));
    results.hidden = false;
    results.innerHTML = matches.length ? matches.map(recordCard).join("") : '<div class="archive-empty-state"><h3>No matching records</h3><p>Try a name, location, faction, or event.</p></div>';
  });
}

window.addEventListener("DOMContentLoaded", initArchiveHome);
