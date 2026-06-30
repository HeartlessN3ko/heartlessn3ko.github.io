function recordById(id) {
  return window.SRX_PUBLIC_ARCHIVE.records.find((record) => record.id === id);
}

function recordMedia(record) {
  if (!record.image) {
    return `<div class="record-media-empty"><span>IMAGE STATUS</span><strong>${record.imageStatus || "No public image on file"}</strong></div>`;
  }
  return `<figure class="record-media"><img src="${record.image.remote}" alt="${record.image.alt}"><figcaption>${record.image.alt}</figcaption></figure>`;
}

function initRecord() {
  const id = new URLSearchParams(window.location.search).get("id");
  const record = recordById(id);
  const mount = document.getElementById("record-view");
  if (!record) {
    document.title = "Record Not Found - SRX Public Archive";
    mount.innerHTML = '<div class="record-not-found"><h1>Record not found.</h1><p>The requested archive identifier does not exist in this public index.</p><a class="btn" href="../">Return to archive</a></div>';
    return;
  }
  document.title = `${record.title} - SRX Public Archive`;
  const facts = record.facts.map(([label, value]) => `<div class="archive-fact"><span>${label}</span><strong>${value}</strong></div>`).join("");
  const body = record.body.map((paragraph) => `<p>${paragraph}</p>`).join("");
  const notes = record.highlights.map((note) => `<li>${note}</li>`).join("");
  const related = record.related.map(recordById).filter(Boolean).map((item) => `<a href="?id=${encodeURIComponent(item.id)}">${item.title}</a>`).join("");
  mount.innerHTML = `<nav class="record-breadcrumb"><a href="../">Public Archive</a><span>/</span><span>${record.title}</span></nav>
    <header class="record-header"><div><span>${record.classification}</span><h1>${record.title}</h1><p>${record.subtitle}</p></div><div class="record-code">SRX-PA-${record.id.toUpperCase()}</div></header>
    <div class="record-layout"><div>${recordMedia(record)}</div><article class="record-copy"><p class="record-summary">${record.summary}</p><div class="archive-facts">${facts}</div>${body}<section><h2>Archive Notes</h2><ul>${notes}</ul></section></article></div>
    <section class="record-related"><h2>Related Records</h2><div>${related || "No related public records."}</div></section>`;
}

window.addEventListener("DOMContentLoaded", initRecord);
