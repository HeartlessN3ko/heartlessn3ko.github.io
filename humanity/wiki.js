(function () {
  "use strict";

  const root = document.documentElement;
  const themeButton = document.querySelector("[data-theme-button]");
  const storedTheme = localStorage.getItem("humanity-theme");
  if (storedTheme === "night" || storedTheme === "paper") {
    root.dataset.theme = storedTheme;
  }

  themeButton?.addEventListener("click", function () {
    const next = root.dataset.theme === "night" ? "paper" : "night";
    root.dataset.theme = next;
    localStorage.setItem("humanity-theme", next);
  });

  const sidebar = document.querySelector("[data-sidebar]");
  const menuButton = document.querySelector("[data-menu-button]");
  menuButton?.addEventListener("click", function () {
    const isOpen = sidebar?.classList.toggle("open") || false;
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", function (event) {
    if (!sidebar?.classList.contains("open")) return;
    if (sidebar.contains(event.target) || menuButton?.contains(event.target)) return;
    sidebar.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  });

  const articles = [
    "/humanity/architecture/",
    "/humanity/purpose-of-humanity/",
    "/humanity/human-continuum/",
    "/humanity/human-sovereignty/",
    "/humanity/human-experience/",
    "/humanity/human-spirit/",
  ];
  document.querySelector("[data-random]")?.addEventListener("click", function () {
    window.location.href = articles[Math.floor(Math.random() * articles.length)];
  });

  const searchInput = document.querySelector("[data-search]");
  const searchButton = document.querySelector("[data-search-button]");
  const resultsBox = document.querySelector("[data-search-results]");
  let searchIndex = [];

  async function ensureIndex() {
    if (searchIndex.length) return searchIndex;
    try {
      const response = await fetch("/humanity/search-index.json", { cache: "force-cache" });
      if (!response.ok) throw new Error("Search index unavailable");
      searchIndex = await response.json();
    } catch (error) {
      if (resultsBox) {
        resultsBox.innerHTML = '<div class="search-empty">Search is temporarily unavailable. Use the article list at left.</div>';
        resultsBox.hidden = false;
      }
    }
    return searchIndex;
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character];
    });
  }

  function excerpt(text, query) {
    const lower = text.toLowerCase();
    const position = Math.max(0, lower.indexOf(query.toLowerCase()));
    const start = Math.max(0, position - 55);
    const end = Math.min(text.length, position + query.length + 85);
    return (start ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
  }

  async function runSearch(navigateOnExact) {
    const query = searchInput?.value.trim() || "";
    if (!query) {
      if (resultsBox) resultsBox.hidden = true;
      return;
    }
    const index = await ensureIndex();
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = index
      .map(function (item) {
        const haystack = (item.title + " " + item.text).toLowerCase();
        const score = words.reduce(function (sum, word) {
          if (item.title.toLowerCase().includes(word)) return sum + 5;
          if (haystack.includes(word)) return sum + 1;
          return sum - 10;
        }, 0);
        return { item, score };
      })
      .filter(function (result) { return result.score >= words.length; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 6);

    if (navigateOnExact && matches.length === 1) {
      window.location.href = matches[0].item.url;
      return;
    }
    if (!resultsBox) return;
    if (!matches.length) {
      resultsBox.innerHTML = '<div class="search-empty">No article matched “' + escapeHtml(query) + '”. Try a broader concept.</div>';
    } else {
      resultsBox.innerHTML = matches.map(function (result) {
        return '<a href="' + result.item.url + '"><strong>' + escapeHtml(result.item.title) + '</strong><small>' + escapeHtml(excerpt(result.item.text, query)) + '</small></a>';
      }).join("");
    }
    resultsBox.hidden = false;
  }

  searchInput?.addEventListener("input", function () { runSearch(false); });
  searchInput?.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch(true);
    }
    if (event.key === "Escape" && resultsBox) resultsBox.hidden = true;
  });
  searchButton?.addEventListener("click", function () { runSearch(true); });

  document.querySelector("[data-copy-link]")?.addEventListener("click", async function (event) {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(window.location.href.split("#")[0]);
      button.textContent = "Link copied";
      setTimeout(function () { button.textContent = "Copy article link"; }, 1800);
    } catch (error) {
      button.textContent = "Copy unavailable";
      setTimeout(function () { button.textContent = "Copy article link"; }, 1800);
    }
  });

  const booksButton = document.querySelector("[data-toggle-books]");
  const booksList = document.querySelector("[data-book-list]");
  booksButton?.addEventListener("click", function () {
    const expanded = booksList?.classList.toggle("expanded") || false;
    booksButton.setAttribute("aria-expanded", String(expanded));
    booksButton.textContent = expanded ? "Show highlights" : "Show all 21 Books";
  });
})();
