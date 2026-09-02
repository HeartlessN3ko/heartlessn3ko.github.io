#!/usr/bin/env python3
"""Build the static Laws of Humanity public reading edition."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
SITE = REPO / "humanity"
CONTENT = SITE / "content"

ARTICLES = [
    ("architecture", "00-codex-architecture.md", "The Architecture of the Codex", "Codex structure"),
    ("twelve-laws", "01-twelve-laws.md", "The Twelve Laws of Humanity", "Book II"),
    ("purpose-of-humanity", "02-purpose-of-humanity.md", "The Purpose of Humanity", "Book placement pending"),
    ("human-continuum", "03-human-continuum.md", "The Human Continuum", "Book XV"),
    ("human-sovereignty", "04-human-sovereignty.md", "Human Sovereignty", "Book XVI"),
    ("human-experience", "05-human-experience.md", "The Human Experience", "Book XVII"),
    ("human-spirit", "06-human-spirit.md", "The Human Spirit", "Book XVIII"),
]

BOOKS = [
    ("I", "The Measure", "How Humanity decides what belongs in the Laws"),
    ("II", "The Twelve Laws", "The concise Laws"),
    ("III", "The Scripture of Truth", "Scripture of Law 1"),
    ("IV", "The Scripture of Life", "Scripture of Law 2"),
    ("V", "The Scripture of Strength", "Scripture of Law 3"),
    ("VI", "The Scripture of Sovereignty", "Scripture of Law 4"),
    ("VII", "The Scripture of the Human Bond", "Scripture of Law 5"),
    ("VIII", "The Scripture of Human Plurality", "Scripture of Law 6"),
    ("IX", "The Scripture of Impact and Repair", "Scripture of Law 7"),
    ("X", "The Scripture of Knowledge", "Scripture of Law 8"),
    ("XI", "The Scripture of Human Experience", "Scripture of Law 9"),
    ("XII", "The Scripture of Future Possibility", "Scripture of Law 10"),
    ("XIII", "The Scripture of Life and Nature", "Scripture of Law 11"),
    ("XIV", "The Scripture of Stewardship", "Scripture of Law 12"),
    ("XV", "The Human Continuum", "Humanity across generations"),
    ("XVI", "Human Sovereignty", "What Humanity protects"),
    ("XVII", "The Human Experience", "How Humans live and seek Humanity"),
    ("XVIII", "The Human Spirit", "Humanity's persistent spiritual inheritance"),
    ("XIX", "The Symbols", "The visual theology"),
    ("XX", "The Human Mandate", "Humanity's species-level purpose"),
    ("XXI", "The Verses of Humanity", "Concentrated scripture"),
]

BOOK_LINKS = {
    "II": "twelve-laws",
    "XV": "human-continuum",
    "XVI": "human-sovereignty",
    "XVII": "human-experience",
    "XVIII": "human-spirit",
}

INTERNAL_LINKS = {
    "Codex of Humanity": "architecture",
    "Architecture of the Codex": "architecture",
    "Codex architecture": "architecture",
    "Twelve Laws": "twelve-laws",
    "Laws of Humanity": "twelve-laws",
    "Purpose of Humanity": "purpose-of-humanity",
    "participate in Humanity": "purpose-of-humanity",
    "participation": "purpose-of-humanity",
    "Human Continuum": "human-continuum",
    "Continuum": "human-continuum",
    "Human Sovereignty": "human-sovereignty",
    "sovereignty": "human-sovereignty",
    "Open Destiny": "human-sovereignty",
    "Human Experience": "human-experience",
    "Seek Humanity": "human-experience",
    "Human Spirit": "human-spirit",
    "we do not know": "human-spirit",
    "spiritual truth": "human-spirit",
    "Human truth": "human-spirit",
    "scientific truth": "human-spirit",
}

EXTERNAL_LINKS = {
    "human rights": "https://en.wikipedia.org/wiki/Human_rights",
    "Universal Declaration of Human Rights": "https://en.wikipedia.org/wiki/Universal_Declaration_of_Human_Rights",
    "history": "https://en.wikipedia.org/wiki/History",
    "spoken language": "https://en.wikipedia.org/wiki/Origin_of_language",
    "writing": "https://en.wikipedia.org/wiki/Writing",
    "libraries": "https://en.wikipedia.org/wiki/Library",
    "Internet": "https://en.wikipedia.org/wiki/Internet",
    "photographs": "https://en.wikipedia.org/wiki/Photography",
    "art": "https://en.wikipedia.org/wiki/Art",
    "music": "https://en.wikipedia.org/wiki/Music",
    "philosophy": "https://en.wikipedia.org/wiki/Philosophy",
    "law": "https://en.wikipedia.org/wiki/Law",
    "technology": "https://en.wikipedia.org/wiki/Technology",
    "science": "https://en.wikipedia.org/wiki/Science",
    "religion": "https://en.wikipedia.org/wiki/Religion",
    "Christianity": "https://en.wikipedia.org/wiki/Christianity",
    "Islam": "https://en.wikipedia.org/wiki/Islam",
    "Judaism": "https://en.wikipedia.org/wiki/Judaism",
    "Hindu traditions": "https://en.wikipedia.org/wiki/Hinduism",
    "Buddhism": "https://en.wikipedia.org/wiki/Buddhism",
    "Taoism": "https://en.wikipedia.org/wiki/Taoism",
    "Zoroastrianism": "https://en.wikipedia.org/wiki/Zoroastrianism",
    "reincarnation": "https://en.wikipedia.org/wiki/Reincarnation",
    "soul": "https://en.wikipedia.org/wiki/Soul",
    "qi": "https://en.wikipedia.org/wiki/Qi",
    "ki": "https://en.wikipedia.org/wiki/Qi",
    "prana": "https://en.wikipedia.org/wiki/Prana",
    "ritual": "https://en.wikipedia.org/wiki/Ritual",
    "consent": "https://en.wikipedia.org/wiki/Consent",
    "bodily integrity": "https://en.wikipedia.org/wiki/Bodily_integrity",
    "freedom of religion": "https://en.wikipedia.org/wiki/Freedom_of_religion",
}

SECTION_MARKERS = {
    "purpose-of-humanity": {
        "Every Human is free to choose": "Individual purpose and shared inheritance",
        "Those contributions take countless forms": "Forms of participation",
        "This principle is also the foundation": "Society and reciprocity",
        "Participation also does not mean": "Life beyond productivity",
        "Participation therefore creates": "Responsibility for what we inherit",
        "Every generation receives": "Future generations and possibility",
        "The Laws therefore offer": "A direction, not purity",
    },
    "human-continuum": {
        "Every living Human exists": "Humanity across time",
        "Most of the Humans who built": "Legacy without fame",
        "The Continuum also contains failure": "Failure as inherited knowledge",
        "Inheritance is not obedience": "Examining the inheritance",
        "The Continuum is therefore not a museum": "A living continuum",
        "Technology is one of the ways": "Technology, art, and memory",
        "The Continuum also includes ancestry": "Ancestry",
        "The Continuum extends forward": "Future Humanity",
        "Every living Human occupies": "Our temporary place",
    },
    "human-sovereignty": {
        "This does not mean Humans exist": "Self-ownership and responsibility",
        "Humanity has repeatedly struggled": "Power and the boundary of harm",
        "There is no single correct way": "Human variation",
        "A Human body belongs": "Body and consent",
        "Sovereignty also protects the mind": "Belief and identity",
        "Relationships also exist": "Relationships and family",
        "Sovereignty also applies": "Communities and peoples",
        "The sovereignty of one": "Reciprocal restraint",
        "Human Sovereignty does not promise": "Open Destiny",
    },
    "human-experience": {
        "Survival is necessary": "Beyond survival",
        "Humans are deeply relational": "Connection and belonging",
        "Humans also create": "Creation and art",
        "Humans also play": "Play, pleasure, and competition",
        "We also seek nature": "Nature and technology",
        "Humanity seeks knowledge": "Knowledge and wonder",
        "Humans create rituals": "Ritual, grief, and endurance",
        "A society should therefore": "Access to Human life",
        "Seek Humanity.": "The practice of seeking Humanity",
    },
    "human-spirit": {
        "The Laws of Humanity distinguish": "Three kinds of truth",
        "The persistence of an experience": "The value of uncertainty",
        "The soul occupies": "Soul and reincarnation",
        "Humanity has also repeatedly": "Life energy across traditions",
        "Religion belongs": "Religion in the Human record",
        "Religious tradition therefore": "Examination and sovereignty",
        "Ritual is another enduring": "Ritual and sacredness",
        "Death brings": "Death, grief, and mystery",
        "The Codex therefore treats": "Wonder and inquiry",
    },
}

RELATED = {
    "architecture": [
        ("Book, chapter and verse", "The reference pattern adapted by the Codex.", "https://en.wikipedia.org/wiki/Chapters_and_verses_of_the_Bible"),
        ("Epic of Gilgamesh", "An ancient work carried across languages and generations.", "https://en.wikipedia.org/wiki/Epic_of_Gilgamesh"),
    ],
    "twelve-laws": [
        ("Golden Rule", "A widely recurring principle of reciprocal conduct.", "https://en.wikipedia.org/wiki/Golden_Rule"),
        ("Code of Hammurabi", "An early surviving written legal code.", "https://en.wikipedia.org/wiki/Code_of_Hammurabi"),
        ("Universal Declaration of Human Rights", "A modern international statement of Human rights and freedoms.", "https://en.wikipedia.org/wiki/Universal_Declaration_of_Human_Rights"),
    ],
    "purpose-of-humanity": [
        ("Humanism", "A family of philosophies centered on human agency and value.", "https://en.wikipedia.org/wiki/Humanism"),
        ("Civil society", "The institutions and associations between family and state.", "https://en.wikipedia.org/wiki/Civil_society"),
        ("Social contract", "A major tradition of thinking about reciprocal obligation.", "https://en.wikipedia.org/wiki/Social_contract"),
    ],
    "human-continuum": [
        ("Epic of Gilgamesh", "One of the earliest surviving works of literature.", "https://en.wikipedia.org/wiki/Epic_of_Gilgamesh"),
        ("Library of Alexandria", "A historical symbol of preserving accumulated knowledge.", "https://en.wikipedia.org/wiki/Library_of_Alexandria"),
        ("World Heritage Convention", "An international framework for preserving heritage.", "https://en.wikipedia.org/wiki/World_Heritage_Convention"),
    ],
    "human-sovereignty": [
        ("Universal Declaration of Human Rights", "The 1948 milestone document on universal rights.", "https://en.wikipedia.org/wiki/Universal_Declaration_of_Human_Rights"),
        ("Bodily integrity", "The principle of autonomy over one's own body.", "https://en.wikipedia.org/wiki/Bodily_integrity"),
        ("Freedom of thought", "The freedom to hold or change beliefs and convictions.", "https://en.wikipedia.org/wiki/Freedom_of_thought"),
    ],
    "human-experience": [
        ("Maslow's hierarchy of needs", "An influential, debated model of human needs.", "https://en.wikipedia.org/wiki/Maslow%27s_hierarchy_of_needs"),
        ("Homo ludens", "A work arguing that play is foundational to culture.", "https://en.wikipedia.org/wiki/Homo_Ludens"),
        ("Aesthetics", "The branch of philosophy concerned with beauty and art.", "https://en.wikipedia.org/wiki/Aesthetics"),
    ],
    "human-spirit": [
        ("The Varieties of Religious Experience", "William James's influential study of religious experience.", "https://en.wikipedia.org/wiki/The_Varieties_of_Religious_Experience"),
        ("Comparative religion", "The study of beliefs and practices across traditions.", "https://en.wikipedia.org/wiki/Comparative_religion"),
        ("Hard problem of consciousness", "A modern philosophical problem about subjective experience.", "https://en.wikipedia.org/wiki/Hard_problem_of_consciousness"),
    ],
}


def parse_frontmatter(source: str) -> tuple[dict[str, str], str]:
    meta: dict[str, str] = {}
    if not source.startswith("---\n"):
        return meta, source
    end = source.find("\n---\n", 4)
    if end == -1:
        return meta, source
    for line in source[4:end].splitlines():
        if ":" in line and not line.startswith(" "):
            key, value = line.split(":", 1)
            meta[key.strip()] = value.strip()
    return meta, source[end + 5 :]


def slugify(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return value or "section"


def human_date(value: str) -> str:
    months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ]
    match = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", value)
    if not match:
        return value
    year, month, day = (int(part) for part in match.groups())
    return f"{day} {months[month - 1]} {year}"


def apply_links(text: str, current_slug: str, linked: set[str]) -> str:
    candidates: list[tuple[str, str, bool]] = []
    for term, slug in INTERNAL_LINKS.items():
        if slug != current_slug:
            candidates.append((term, f"/humanity/{slug}/", False))
    for term, url in EXTERNAL_LINKS.items():
        candidates.append((term, url, True))
    candidates.sort(key=lambda item: len(item[0]), reverse=True)
    pattern = re.compile(
        r"(?<![\w])(" + "|".join(re.escape(term) for term, _, _ in candidates) + r")(?![\w])",
        re.IGNORECASE,
    )
    by_term = {term.lower(): (url, external) for term, url, external in candidates}
    output: list[str] = []
    cursor = 0
    for match in pattern.finditer(text):
        key = match.group(0).lower()
        if key in linked:
            continue
        output.append(html.escape(text[cursor : match.start()]))
        label = html.escape(match.group(0))
        url, external = by_term[key]
        attrs = ' class="external" target="_blank" rel="noopener noreferrer"' if external else ""
        output.append(f'<a href="{html.escape(url)}"{attrs}>{label}</a>')
        linked.add(key)
        cursor = match.end()
    output.append(html.escape(text[cursor:]))
    rendered = "".join(output)
    rendered = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", rendered)
    rendered = re.sub(r"(?<!\*)\*([^*]+?)\*(?!\*)", r"<em>\1</em>", rendered)
    return rendered


def markdown_blocks(markdown: str, slug: str) -> tuple[str, list[tuple[str, str]]]:
    lines = markdown.replace("\r\n", "\n").split("\n")
    blocks: list[tuple[str, object]] = []
    paragraph: list[str] = []
    linked: set[str] = set()

    def flush_paragraph() -> None:
        if paragraph:
            blocks.append(("p", " ".join(part.strip() for part in paragraph)))
            paragraph.clear()

    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        if not line.strip():
            flush_paragraph()
            i += 1
            continue
        if line.startswith("# "):
            flush_paragraph()
            blocks.append(("title", line[2:].strip()))
            i += 1
            continue
        if line.startswith("##"):
            flush_paragraph()
            level = 3 if line.startswith("### ") else 2
            label = line[level + 1 :].strip()
            blocks.append((f"h{level}", label))
            i += 1
            continue
        if line.startswith("> "):
            flush_paragraph()
            quote_lines = []
            while i < len(lines) and lines[i].startswith(">"):
                quote_lines.append(lines[i].lstrip("> ").strip())
                i += 1
            blocks.append(("quote", " ".join(quote_lines)))
            continue
        if re.match(r"^\d+\.\s+", line):
            flush_paragraph()
            items = []
            while i < len(lines) and re.match(r"^\d+\.\s+", lines[i]):
                items.append(re.sub(r"^\d+\.\s+", "", lines[i]).strip())
                i += 1
            blocks.append(("ol", items))
            continue
        if re.match(r"^-\s+", line):
            flush_paragraph()
            items = []
            while i < len(lines) and re.match(r"^-\s+", lines[i]):
                items.append(re.sub(r"^-\s+", "", lines[i]).strip())
                i += 1
            blocks.append(("ul", items))
            continue
        paragraph.append(line)
        i += 1
    flush_paragraph()

    toc: list[tuple[str, str]] = []
    output: list[str] = []
    seen_ids: dict[str, int] = {}
    markers = SECTION_MARKERS.get(slug, {})
    inserted_markers: set[str] = set()

    def heading(label: str, level: int = 2) -> None:
        section_id = slugify(label)
        count = seen_ids.get(section_id, 0)
        seen_ids[section_id] = count + 1
        if count:
            section_id = f"{section_id}-{count + 1}"
        toc.append((section_id, label))
        output.append(f'<h{level} id="{section_id}">{html.escape(label)}<a class="section-link" href="#{section_id}" aria-label="Link to {html.escape(label)}">§</a></h{level}>')

    for kind, value in blocks:
        if kind == "title":
            continue
        if kind == "p":
            paragraph_text = str(value)
            for start, label in markers.items():
                if paragraph_text.startswith(start) and label not in inserted_markers:
                    heading(label)
                    inserted_markers.add(label)
                    break
            output.append(f"<p>{apply_links(paragraph_text, slug, linked)}</p>")
        elif kind in ("h2", "h3"):
            heading(str(value), int(kind[1]))
        elif kind == "quote":
            output.append(f'<blockquote><p>{apply_links(str(value), slug, linked)}</p></blockquote>')
        elif kind in ("ol", "ul"):
            tag = kind
            items = "".join(f"<li>{apply_links(str(item), slug, linked)}</li>" for item in value)  # type: ignore[arg-type]
            output.append(f"<{tag}>{items}</{tag}>")
    return "\n".join(output), toc


def sidebar(current: str) -> str:
    def nav_link(label: str, href: str, key: str, extra_class: str = "") -> str:
        classes = [extra_class] if extra_class else []
        if key == current:
            classes.append("active")
        class_attr = f' class="{" ".join(classes)}"' if classes else ""
        current_attr = ' aria-current="page"' if key == current else ""
        return f'<a href="{href}"{class_attr}{current_attr}>{html.escape(label)}</a>'

    links = [
        '<div class="sidebar-label">Start here</div>',
        nav_link("Overview", "/humanity/", "home", "side-home"),
        nav_link("The Twelve Laws", "/humanity/twelve-laws/", "twelve-laws"),
        nav_link("The Purpose of Humanity", "/humanity/purpose-of-humanity/", "purpose-of-humanity"),
        nav_link("How the Codex is organized", "/humanity/architecture/", "architecture"),
        '<div class="sidebar-label secondary">Read the Books</div>',
        nav_link("The Human Continuum", "/humanity/human-continuum/", "human-continuum"),
        nav_link("Human Sovereignty", "/humanity/human-sovereignty/", "human-sovereignty"),
        nav_link("The Human Experience", "/humanity/human-experience/", "human-experience"),
        nav_link("The Human Spirit", "/humanity/human-spirit/", "human-spirit"),
        '<div class="sidebar-label secondary">Explore</div>',
        nav_link("Concept guide", "/humanity/concepts/", "concepts"),
        nav_link("All 21 Books", "/humanity/#book-register", "book-register"),
    ]
    return "\n".join(links)


def toc_html(items: list[tuple[str, str]]) -> str:
    if not items:
        return ""
    links = "".join(f'<li><a href="#{section_id}">{html.escape(label)}</a></li>' for section_id, label in items)
    return f'<nav class="contents" aria-label="Article contents"><div class="contents-title">Contents</div><ol>{links}</ol></nav>'


def related_html(slug: str) -> str:
    items = RELATED.get(slug, [])
    if not items:
        return ""
    rendered = "".join(
        f'<li><a class="external" href="{url}" target="_blank" rel="noopener noreferrer">{html.escape(title)}</a><span>{html.escape(summary)}</span></li>'
        for title, summary, url in items
    )
    return f'<section class="related"><h2>Related historical context</h2><p class="editorial-note">These reference links open Wikipedia for further reading.</p><ul>{rendered}</ul></section>'


def page_shell(*, title: str, description: str, current: str, body: str, page_type: str = "article") -> str:
    canonical_path = "" if current == "home" else f"{current}/"
    canonical = f"https://srxnexus.org/humanity/{canonical_path}"
    schema = {
        "@context": "https://schema.org",
        "@type": {"article": "Article", "index": "CollectionPage"}.get(page_type, "WebSite"),
        "name": title,
        "headline": title,
        "description": description,
        "url": canonical,
        "isPartOf": {"@type": "WebSite", "name": "The Codex of Humanity", "url": "https://srxnexus.org/humanity/"},
    }
    social_image_meta = '''
  <meta property="og:image" content="https://srxnexus.org/humanity/assets/og-codex.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://srxnexus.org/humanity/assets/og-codex.png">''' if page_type == "home" else ""
    return f'''<!doctype html>
<html lang="en" data-theme="paper">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(title)} — The Codex of Humanity</title>
  <meta name="description" content="{html.escape(description)}">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="{'article' if page_type == 'article' else 'website'}">
  <meta property="og:title" content="{html.escape(title)} — The Codex of Humanity">
  <meta property="og:description" content="{html.escape(description)}">
  <meta property="og:url" content="{canonical}">
{social_image_meta}
  <meta name="twitter:title" content="{html.escape(title)} — The Codex of Humanity">
  <meta name="twitter:description" content="{html.escape(description)}">
  <link rel="icon" href="/humanity/assets/codex-mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/humanity/styles.css">
  <script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
</head>
<body class="route-{html.escape(current)}">
  <a class="skip-link" href="#content">Skip to content</a>
  <header class="masthead">
    <button class="icon-button menu-button" type="button" aria-label="Open navigation" aria-expanded="false" data-menu-button>☰</button>
    <a class="wordmark" href="/humanity/" aria-label="The Codex of Humanity main page">
      <span class="wordmark-mark" aria-hidden="true">H</span>
      <span><strong>The Codex of Humanity</strong><small>A public reading edition of the Laws of Humanity</small></span>
    </a>
    <div class="search" role="search">
      <label class="sr-only" for="wiki-search">Search the Codex</label>
      <input id="wiki-search" type="search" placeholder="Search the Codex" autocomplete="off" data-search>
      <button type="button" data-search-button>Search</button>
      <div class="search-results" data-search-results hidden></div>
    </div>
    <div class="mast-tools">
      <button class="text-button" type="button" data-random>Random article</button>
      <button class="icon-button" type="button" aria-label="Toggle reading theme" title="Toggle reading theme" data-theme-button>◐</button>
    </div>
  </header>
  <div class="site-frame">
    <aside class="sidebar" aria-label="Codex navigation" data-sidebar>
      {sidebar(current)}
      <div class="sidebar-label secondary">About this edition</div>
      <p>Published wording is reproduced as written. Blue links are reading aids.</p>
      <p><a href="https://srxnexus.org/">Return to SRX Nexus</a></p>
    </aside>
    <main id="content" class="page page-{page_type}">{body}</main>
  </div>
  <footer class="site-footer">
    <p><strong>The Codex of Humanity</strong> · Public reading edition · Updated 1 September 2026</p>
    <p>Internal and external links are reading aids. External links provide context and are not endorsements.</p>
  </footer>
  <script src="/humanity/wiki.js" defer></script>
</body>
</html>'''


def article_page(slug: str, filename: str, display_title: str, placement: str, index: int) -> str:
    source = (CONTENT / filename).read_text(encoding="utf-8")
    meta, markdown = parse_frontmatter(source)
    article_body, toc = markdown_blocks(markdown, slug)
    description = re.sub(r"\s+", " ", re.sub(r"[#>*]", "", markdown)).strip()[:158].rsplit(" ", 1)[0] + "…"
    previous_link = ARTICLES[index - 1] if index > 0 else None
    next_link = ARTICLES[index + 1] if index + 1 < len(ARTICLES) else None
    prev_html = f'<a rel="prev" href="/humanity/{previous_link[0]}/"><span>Previous</span>{html.escape(previous_link[2])}</a>' if previous_link else '<span></span>'
    next_html = f'<a rel="next" href="/humanity/{next_link[0]}/"><span>Next</span>{html.escape(next_link[2])}</a>' if next_link else '<a href="/humanity/concepts/"><span>Next</span>Concept guide</a>'
    reader_placement = "Placement in review" if "pending" in placement.lower() else placement
    updated = human_date(meta.get("updated", "2026-09-01"))
    section_count = len(toc)
    infobox_content = f'''
      <div class="infobox-title">In the Codex</div>
      <dl>
        <div><dt>Book</dt><dd>{html.escape(reader_placement)}</dd></div>
        <div><dt>Sections</dt><dd>{section_count}</dd></div>
        <div><dt>Version</dt><dd>{html.escape(meta.get('version', '—'))}</dd></div>
        <div><dt>Updated</dt><dd>{html.escape(updated)}</dd></div>
      </dl>'''
    authority_note = '''
          <aside class="editorial-notice"><strong>Book II is now published.</strong> This architecture text preserves its original placeholders. Read the authoritative statements on <a href="/humanity/twelve-laws/">The Twelve Laws of Humanity</a>.</aside>''' if slug == "architecture" else ""
    body = f'''
      <div class="article-grid">
        <article class="article">
          <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/humanity/">Codex home</a><span aria-hidden="true">›</span><span>{html.escape(reader_placement)}</span></nav>
          <div class="eyebrow">{html.escape(reader_placement)}</div>
          <h1>{html.escape(display_title)}</h1>
          <p class="subtitle">Published text · Cross-links added for navigation and context</p>
          <div class="article-tools" aria-label="Article tools">
            <a href="#article-start">Jump to text</a>
            <button type="button" data-copy-link>Copy article link</button>
            <a href="/humanity/concepts/">Concept guide</a>
          </div>
          <aside class="infobox infobox-inline" aria-label="Book and section information">{infobox_content}</aside>
{authority_note}
          {toc_html(toc)}
          <div id="article-start" class="article-text">{article_body}</div>
          {related_html(slug)}
          <nav class="article-pagination" aria-label="Adjacent articles">{prev_html}{next_html}</nav>
        </article>
        <aside class="article-rail">
          <div class="infobox infobox-rail" aria-label="Book and section information">{infobox_content}</div>
          <nav class="on-this-page" aria-label="On this page">
            <div class="sidebar-label">On this page</div>
            <ol>{''.join(f'<li><a href="#{section_id}">{html.escape(label)}</a></li>' for section_id, label in toc)}</ol>
          </nav>
        </aside>
      </div>'''
    return page_shell(title=display_title, description=description, current=slug, body=body)


def home_page() -> str:
    article_cards = "".join(
        f'''<a class="portal-card" href="/humanity/{slug}/">
          <span class="portal-kicker">{html.escape('Placement in review' if 'pending' in placement.lower() else placement)}</span>
          <strong>{html.escape(title)}</strong>
          <span>{summary_for(slug)}</span>
        </a>'''
        for slug, _, title, placement in ARTICLES[1:]
    )
    books_rows = "".join(
        f'''<li class="{'available' if numeral in BOOK_LINKS else 'planned'}{' priority' if numeral in {'I', 'II', 'XV', 'XVI', 'XVII', 'XVIII'} else ''}">
          <span class="book-number">{numeral}</span>
          <span><strong>{f'<a href="/humanity/{BOOK_LINKS[numeral]}/">{html.escape(title)}</a>' if numeral in BOOK_LINKS else html.escape(title)}</strong><small>{html.escape(function)}</small></span>
          <span class="book-state">{'Read' if numeral in BOOK_LINKS else 'Planned'}</span>
        </li>'''
        for numeral, title, function in BOOKS
    )
    body = f'''
      <section class="main-page-heading">
        <div>
          <div class="eyebrow">Public reading edition</div>
          <h1>Welcome to the Codex of Humanity</h1>
          <p class="standfirst">A cross-linked home for the Laws of Humanity: what Humanity inherits, what it protects, how it lives, and what it still wonders about.</p>
          <div class="home-actions">
            <a class="primary-action" href="/humanity/twelve-laws/">Read the Twelve Laws</a>
            <a href="/humanity/purpose-of-humanity/">Understand the Purpose</a>
          </div>
        </div>
        <figure class="lead-figure">
          <img src="/humanity/assets/vitruvian-man.jpg" alt="Leonardo da Vinci's Vitruvian Man, showing a human figure within a circle and square">
          <figcaption><a class="external" href="https://commons.wikimedia.org/wiki/File:Uomo_Vitruviano.jpg" target="_blank" rel="noopener noreferrer">Vitruvian Man</a>, Leonardo da Vinci, c. 1490. Public domain.</figcaption>
        </figure>
      </section>
      <div class="home-columns">
        <section class="welcome-panel">
          <div class="panel-heading"><h2>Start here</h2><a href="/humanity/concepts/">Concept guide</a></div>
          <blockquote class="feature-quote"><p>“Receive the inheritance. Experience your life. Add what you can. Protect the whole. Pass it forward.”</p><cite>— The Purpose of Humanity</cite></blockquote>
          <p>The Codex is organized as Books, Chapters, and Verses. Six core texts and the structure of the Codex are available to read now. The remaining Books are shown as planned so readers can see where the work is going without mistaking an outline for a finished Book.</p>
        </section>
        <section class="edition-panel">
          <div class="panel-heading"><h2>About this edition</h2></div>
          <ul class="fact-list">
            <li><strong>6</strong><span>published core texts</span></li>
            <li><strong>1</strong><span>Codex structure</span></li>
            <li><strong>21</strong><span>Books in the architecture</span></li>
          </ul>
          <p><span class="link-sample internal-sample">Blue links</span> move through the Codex. Links marked <span class="external-mark">↗</span> open historical or cultural context on Wikipedia.</p>
        </section>
      </div>
      <section class="portal-section">
        <div class="panel-heading"><h2>Read the Codex</h2><a href="/humanity/architecture/">How the Codex works</a></div>
        <div class="portal-grid">{article_cards}</div>
      </section>
      <section id="book-register" class="book-register">
        <div class="panel-heading"><div><h2>The twenty-one Books</h2><p>Highlights appear first. “Read” marks Books with approved text; “Planned” marks architecture only.</p></div><button type="button" class="text-button" data-toggle-books aria-expanded="false">Show all 21 Books</button></div>
        <ol class="book-list" data-book-list>{books_rows}</ol>
      </section>'''
    return page_shell(
        title="Main Page",
        description="The Laws of Humanity in a public, cross-linked reading edition: Books, concepts, history, and the twenty-one-Book structure.",
        current="home",
        body=body,
        page_type="home",
    )


def summary_for(slug: str) -> str:
    return {
        "twelve-laws": "The twelve concise principles at the center of the Codex: truth, life, strength, freedom, community, plurality, repair, knowledge, experience, future possibility, nature, and stewardship.",
        "purpose-of-humanity": "Receive the inheritance, experience your life, add what you can, and pass it forward.",
        "human-continuum": "Humanity across generations: memory, knowledge, failure, legacy, and future possibility.",
        "human-sovereignty": "Meaningful authority over body, identity, belief, relationships, direction, and future.",
        "human-experience": "Connection, creation, play, nature, knowledge, ritual, grief, purpose, and wonder.",
        "human-spirit": "A disciplined home for mystery, belief, spiritual experience, and the sacred answer: we do not know.",
    }.get(slug, "The Books, Chapters, and Verses that give the Codex its structure.")


def concepts_page() -> str:
    concepts = [
        ("The Codex", "The organized body of Laws, Books, Chapters, and Verses", "architecture"),
        ("The Twelve Laws", "The concise principles at the center of the Codex", "twelve-laws"),
        ("Humanity Test", "A proposed measure for evaluating ideas and practices", "architecture"),
        ("Participation", "The shared purpose of Human life", "purpose-of-humanity"),
        ("Inheritance", "What Humanity receives across generations", "human-continuum"),
        ("Human Continuum", "Humanity understood across time", "human-continuum"),
        ("Legacy", "Becoming part of what Humanity remembers", "human-continuum"),
        ("Future generations", "Humans who will inherit today's consequences", "human-continuum"),
        ("Human Sovereignty", "Meaningful authority over one's own life", "human-sovereignty"),
        ("Consent", "What another Human may offer or withhold", "human-sovereignty"),
        ("Open Destiny", "The preserved ability to become", "human-sovereignty"),
        ("Human Experience", "The dimensions of life beyond survival", "human-experience"),
        ("Seek Humanity", "The practice of restoring access to Human life", "human-experience"),
        ("Scientific truth", "Claims investigated through evidence and revision", "human-spirit"),
        ("Human truth", "Persistent patterns of Human experience and meaning", "human-spirit"),
        ("Spiritual truth", "Enduring questions not yet settled by evidence", "human-spirit"),
        ("Sacred uncertainty", "The principle that “we do not know” has value", "human-spirit"),
    ]
    concepts.sort(key=lambda item: item[0].casefold())
    grouped: dict[str, list[tuple[str, str, str]]] = {}
    for concept in concepts:
        grouped.setdefault(concept[0][0].upper(), []).append(concept)
    alphabet = " ".join(f'<a href="#letter-{letter}">{letter}</a>' for letter in grouped)
    groups = "".join(
        f'''<section class="concept-group" id="letter-{letter}"><h2>{letter}</h2><ul class="concept-list">{
            ''.join(f'<li id="{slugify(term)}"><a href="/humanity/{slug}/">{html.escape(term)}</a><span>{html.escape(definition)}</span></li>' for term, definition, slug in entries)
        }</ul></section>'''
        for letter, entries in grouped.items()
    )
    body = f'''
      <article class="article concept-index">
        <div class="eyebrow">Navigation</div>
        <h1>Concept guide</h1>
        <p class="standfirst">A reader's map to recurring ideas in the Codex. Definitions below are concise navigation summaries; follow each link to read the full text.</p>
        <nav class="alphabet" aria-label="Available concept letters">{alphabet}</nav>
        {groups}
        <section class="related">
          <h2>External reference shelf</h2>
          <p class="editorial-note">Historical and cultural references below open Wikipedia and are not part of the Laws.</p>
          <ul>
            <li><a class="external" href="https://en.wikipedia.org/wiki/Universal_Declaration_of_Human_Rights" target="_blank" rel="noopener noreferrer">Universal Declaration of Human Rights</a><span>A landmark 1948 document in the history of universal rights.</span></li>
            <li><a class="external" href="https://en.wikipedia.org/wiki/Epic_of_Gilgamesh" target="_blank" rel="noopener noreferrer">Epic of Gilgamesh</a><span>An ancient work preserved through the Human Continuum.</span></li>
            <li><a class="external" href="https://en.wikipedia.org/wiki/The_Varieties_of_Religious_Experience" target="_blank" rel="noopener noreferrer">The Varieties of Religious Experience</a><span>A famous study of spiritual experience by William James.</span></li>
          </ul>
        </section>
      </article>'''
    return page_shell(
        title="Concept guide",
        description="An alphabetical reader's map to the central concepts in the Laws of Humanity.",
        current="concepts",
        body=body,
        page_type="index",
    )


def build() -> None:
    pages: list[tuple[Path, str]] = [(SITE / "index.html", home_page())]
    search_index = []
    for index, article in enumerate(ARTICLES):
        slug, filename, title, placement = article
        source = (CONTENT / filename).read_text(encoding="utf-8")
        _, markdown = parse_frontmatter(source)
        plain = re.sub(r"\s+", " ", re.sub(r"[#>*_`]", "", markdown)).strip()
        search_index.append({"title": title, "url": f"/humanity/{slug}/", "text": plain})
        pages.append((SITE / slug / "index.html", article_page(slug, filename, title, placement, index)))
    pages.append((SITE / "concepts" / "index.html", concepts_page()))
    for path, content in pages:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8", newline="\n")
    (SITE / "search-index.json").write_text(json.dumps(search_index, ensure_ascii=False), encoding="utf-8")
    print(f"Built {len(pages)} pages in {SITE}")


if __name__ == "__main__":
    build()
