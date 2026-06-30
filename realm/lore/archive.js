const archiveState = {
  activeCategory: "all",
  selectedId: "the-realm",
  query: "",
};

function archiveCategoryById(categoryId) {
  return window.SRX_PUBLIC_ARCHIVE.categories.find((item) => item.id === categoryId);
}

function archiveRecordById(recordId) {
  return window.SRX_PUBLIC_ARCHIVE.records.find((item) => item.id === recordId);
}

function archiveRecordsForView() {
  const query = archiveState.query.trim().toLowerCase();
  return window.SRX_PUBLIC_ARCHIVE.records.filter((record) => {
    if (archiveState.activeCategory !== "all" && record.category !== archiveState.activeCategory) {
      return false;
    }
    if (!query) {
      return true;
    }
    const haystack = [
      record.title,
      record.subtitle,
      record.summary,
      ...(record.highlights || []),
      ...(record.facts || []).flat(),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

function setArchiveImage(img, asset) {
  img.src = asset.local;
  img.alt = asset.alt;
  img.onerror = function onArchiveImageError() {
    if (img.dataset.fallbackTried === "1") {
      img.classList.add("archive-image-missing");
      return;
    }
    img.dataset.fallbackTried = "1";
    img.src = asset.remote;
  };
}

function renderArchiveCategories() {
  const wrap = document.getElementById("archive-category-list");
  wrap.innerHTML = "";

  const makeButton = (id, label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "archive-category-button" +
      (archiveState.activeCategory === id ? " active" : "");
    button.setAttribute("aria-pressed", archiveState.activeCategory === id ? "true" : "false");
    button.textContent = label;
    button.addEventListener("click", () => {
      archiveState.activeCategory = id;
      archiveState.selectedId = archiveRecordsForView()[0]?.id || archiveState.selectedId;
      renderArchive();
    });
    wrap.appendChild(button);
  };

  makeButton("all", "All Records");
  window.SRX_PUBLIC_ARCHIVE.categories.forEach((category) => makeButton(category.id, category.label));
}

function renderArchiveCards(records) {
  const grid = document.getElementById("archive-record-grid");
  grid.innerHTML = "";

  if (!records.length) {
    const empty = document.createElement("div");
    empty.className = "archive-empty-state";
    empty.innerHTML =
      "<h3>No matching records</h3>" +
      "<p>Adjust the query or choose another archive branch.</p>";
    grid.appendChild(empty);
    return;
  }

  records.forEach((record) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "archive-record-card" +
      (archiveState.selectedId === record.id ? " active" : "");
    card.setAttribute("aria-pressed", archiveState.selectedId === record.id ? "true" : "false");
    card.addEventListener("click", () => {
      archiveState.selectedId = record.id;
      renderArchive();
    });

    const thumb = document.createElement("img");
    thumb.className = "archive-record-thumb";
    setArchiveImage(thumb, record.image);

    const category = archiveCategoryById(record.category);

    card.innerHTML =
      '<div class="archive-record-meta">' +
      `<span>${category ? category.label : "Archive"}</span>` +
      `<span>${record.classification}</span>` +
      "</div>" +
      `<h3>${record.title}</h3>` +
      `<p>${record.summary}</p>`;
    card.prepend(thumb);
    grid.appendChild(card);
  });
}

function renderArchiveDetail(record) {
  const pane = document.getElementById("archive-detail");
  if (!record) {
    pane.innerHTML =
      '<div class="archive-detail-empty">' +
      '<span class="archive-panel-label">Record Detail</span>' +
      "<h2>No record selected</h2>" +
      "<p>Choose another archive branch or clear the current search to reopen a record.</p>" +
      "</div>";
    return;
  }
  const facts = record.facts
    .map(([label, value]) => (
      `<div class="archive-fact"><span>${label}</span><strong>${value}</strong></div>`
    ))
    .join("");
  const highlights = (record.highlights || [])
    .map((item) => `<li>${item}</li>`)
    .join("");
  const paragraphs = (record.body || [])
    .map((item) => `<p>${item}</p>`)
    .join("");
  const related = (record.related || [])
    .map((id) => {
      const relatedRecord = archiveRecordById(id);
      if (!relatedRecord) {
        return "";
      }
      return `<button type="button" class="archive-related-button" data-related="${id}">${relatedRecord.title}</button>`;
    })
    .join("");

  pane.innerHTML =
    '<div class="archive-detail-frame">' +
    `<img id="archive-detail-image" class="archive-detail-image" alt="${record.image.alt}">` +
    '<div class="archive-detail-overlay"></div>' +
    `<div class="archive-detail-kicker">${record.classification}</div>` +
    `<h2>${record.title}</h2>` +
    `<p class="archive-detail-sub">${record.subtitle}</p>` +
    "</div>" +
    `<p class="archive-detail-summary">${record.summary}</p>` +
    `<div class="archive-facts">${facts}</div>` +
    `<div class="archive-copy">${paragraphs}</div>` +
    '<div class="archive-detail-section">' +
    "<h3>Known Notes</h3>" +
    `<ul class="archive-detail-list">${highlights}</ul>` +
    "</div>" +
    '<div class="archive-detail-section">' +
    "<h3>Source Record</h3>" +
    `<p class="archive-source">${record.source}</p>` +
    "</div>" +
    '<div class="archive-detail-section">' +
    "<h3>Related Records</h3>" +
    `<div class="archive-related-list">${related || '<span class="archive-source">No related records listed.</span>'}</div>` +
    "</div>";

  const detailImage = document.getElementById("archive-detail-image");
  setArchiveImage(detailImage, record.image);

  pane.querySelectorAll(".archive-related-button").forEach((button) => {
    button.addEventListener("click", () => {
      archiveState.selectedId = button.dataset.related;
      const selected = archiveRecordById(archiveState.selectedId);
      if (selected) {
        archiveState.activeCategory = selected.category;
      }
      renderArchive();
    });
  });
}

function renderArchiveHero(records) {
  const activeCategory = archiveCategoryById(archiveState.activeCategory);
  document.getElementById("archive-active-label").textContent =
    archiveState.activeCategory === "all"
      ? "All Records"
      : activeCategory.label;
  document.getElementById("archive-active-description").textContent =
    archiveState.activeCategory === "all"
      ? "A combined public archive view across all currently loaded records."
      : activeCategory.description;
  document.getElementById("archive-record-count").textContent = String(records.length).padStart(2, "0");
}

function renderArchive() {
  const records = archiveRecordsForView();
  if (!records.find((item) => item.id === archiveState.selectedId)) {
    archiveState.selectedId = records[0]?.id || window.SRX_PUBLIC_ARCHIVE.records[0].id;
  }
  renderArchiveCategories();
  renderArchiveHero(records);
  renderArchiveCards(records);
  renderArchiveDetail(records.length ? archiveRecordById(archiveState.selectedId) : null);
}

function initPublicArchive() {
  document.getElementById("archive-search").addEventListener("input", (event) => {
    archiveState.query = event.target.value;
    renderArchive();
  });

  document.getElementById("archive-last-updated").textContent =
    window.SRX_PUBLIC_ARCHIVE.updated;
  document.getElementById("archive-current-era").textContent =
    window.SRX_PUBLIC_ARCHIVE.currentEra;

  renderArchive();
}

window.addEventListener("DOMContentLoaded", initPublicArchive);
