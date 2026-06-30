function directoryRecordUrl(id) {
  return `../record/?id=${encodeURIComponent(id)}`;
}

function directoryCard(record) {
  const category = window.SRX_PUBLIC_ARCHIVE.categories.find((item) => item.id === record.category);
  const media = record.image
    ? `<img class="archive-record-thumb" src="${record.image.remote}" alt="${record.image.alt}">`
    : `<div class="archive-record-thumb archive-record-no-image"><span>${record.imageStatus || "No public image on file"}</span></div>`;
  return `<a class="archive-record-card" href="${directoryRecordUrl(record.id)}">${media}
    <div class="archive-record-meta"><span>${category?.label || "Archive"}</span><span>${record.classification}</span></div>
    <h3>${record.title}</h3><p>${record.summary}</p><span class="record-open-label">Open record</span></a>`;
}

function initDirectory() {
  const directoryId = document.body.dataset.directory;
  const archive = window.SRX_PUBLIC_ARCHIVE;
  const directory = archive.directories.find((item) => item.id === directoryId);
  const records = archive.records.filter((record) => record.directories.includes(directoryId));
  document.getElementById("directory-title").textContent = directory.label;
  document.getElementById("directory-description").textContent = directory.description;
  document.getElementById("directory-count").textContent = String(records.length).padStart(2, "0");
  const grid = document.getElementById("directory-records");
  const input = document.getElementById("directory-search");
  const render = () => {
    const query = input.value.trim().toLowerCase();
    const visible = records.filter((record) => !query || [record.title, record.subtitle, record.summary, ...(record.facts || []).flat()].join(" ").toLowerCase().includes(query));
    grid.innerHTML = visible.length ? visible.map(directoryCard).join("") : '<div class="archive-empty-state"><h3>No matching records</h3><p>Clear the search to reopen this directory.</p></div>';
  };
  input.addEventListener("input", render);
  render();
}

window.addEventListener("DOMContentLoaded", initDirectory);
