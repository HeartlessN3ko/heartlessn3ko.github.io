"""Render editorial history without modifying the published Book sources."""
import html
import json
import re


def build_history(site, page_shell, toc_html):
    data = json.loads((site / "content" / "historical-context.json").read_text(encoding="utf-8"))
    canonical = (site / "content" / "01-twelve-laws.md").read_text(encoding="utf-8")
    laws = re.findall(r"## Law \d+\s+> ([^\n]+)", canonical)
    assert len(laws) == 12
    assert [e["law"] for e in data["entries"]] == list(range(1, 13))
    toc, sections, search = [], [], []
    for entry in data["entries"]:
        number = entry["law"]
        anchor = f"law-{number}"
        title = f"Law {number}: {entry['theme']}"
        toc.append((anchor, title))
        def prose(value):
            escaped = html.escape(value)
            def refs(match):
                ids = match.group(1).split("–")
                indexes = range(int(ids[0]), int(ids[-1]) + 1)
                return "[" + ", ".join(f'<a href="#source-{number}-{i}" aria-label="Law {number}, source {i}">{i}</a>' for i in indexes) + "]"
            return re.sub(r"\[(\d+(?:–\d+)?)\]", refs, escaped)
        sources = "".join(
            f'<li id="source-{number}-{i}"><a href="{html.escape(s["url"], quote=True)}">{html.escape(s["label"])}</a> — {html.escape(s["kind"])}</li>'
            for i, s in enumerate(entry["sources"], 1)
        )
        sections.append(f'''<section aria-labelledby="{anchor}">
<h2 id="{anchor}">{html.escape(title)} <a class="section-link" href="#{anchor}" aria-label="Link to Law {number}">#</a></h2>
<blockquote><p>{html.escape(laws[number - 1])}</p></blockquote>
<p><a href="/humanity/twelve-laws/#law-{number}">Read Law {number} in Book II v0.6</a></p>
<h3>{html.escape(entry['event'])}</h3><p>{prose(entry['context'])}</p>
<h3>What the comparison illustrates</h3><p>{prose(entry['illustrates'])}</p>
<h3>Limits and tensions</h3><p>{prose(entry['tension'])}</p>
<h3>Parallel reading</h3><p>{prose(entry['reading'])}</p>
<p><strong>Question for the reader:</strong> {html.escape(entry['question'])}</p>
<h3>Sources for Law {number}</h3><ol>{sources}</ol>
</section>''')
        search.append({"title": title + " — history and reading", "url": f"/humanity/history/#{anchor}", "text": " ".join(str(entry[k]) for k in ("event", "context", "illustrates", "tension", "reading"))})
    intro = '''<div class="eyebrow">Editorial companion · 24 October 2026</div>
<h1>History and parallel reading</h1>
<p class="standfirst">Twelve historical cases, specific works to read alongside them, and questions that keep the comparisons honest.</p>
<aside class="editorial-notice"><strong>How to use this page.</strong> The quoted Laws reproduce Book II v0.6 exactly. Everything else here is editorial commentary, not a new Book or revised canonical wording. These are intellectual parallels, not demonstrated sources of the Codex, endorsements by the named authors, or historical proof that the Laws are universally correct. No direct provenance is asserted.</aside>
<p>Each case distinguishes documented events from our interpretation. Sources include participant accounts, archival records, scholarly work and institutional histories; their perspective and limitations matter. Reading locators use chapters, sections or printed pages, not invented Codex verse numbers. The selection is an introductory set of cases, not a representative survey of all cultures or periods.</p>
<p>Bracketed citations lead to the source list within each Law. External links open in the same tab. All entries were reviewed on 24 October 2026; historical dates describe the event or publication, not a claim about present conditions. No historical quotation is reproduced beyond the canonical Laws.</p>'''
    body = '<article class="article">' + intro + toc_html(toc) + '<div class="article-text">' + "\n".join(sections) + '</div></article>'
    page = page_shell(title=data["title"], description="Historical examples, critical tensions, primary sources and parallel reading for all Twelve Laws of Humanity.", current="history", body=body)
    return page, search
