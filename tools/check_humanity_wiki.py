#!/usr/bin/env python3
"""Deterministic integrity and accessibility checks for the Humanity reading edition."""

from __future__ import annotations

import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


REPO = Path(__file__).resolve().parents[1]
SITE = REPO / "humanity"

LAW_TEXTS = [
    "Seek truth, and change your understanding when better knowledge requires it.",
    "Protect life, and take it only when necessity leaves no better path.",
    "Use strength to protect yourself and others, never merely to dominate.",
    "Preserve every Human’s freedom to become what they might become.",
    "Maintain the bonds of Humanity through community, hospitality, care, and belonging.",
    "Honor the many ways Humans live, love, believe, create, and seek meaning.",
    "Do more good than harm, and repair what you damage whenever you are able.",
    "Preserve knowledge, share what you learn, and carry Humanity’s inheritance forward.",
    "Seek the Human experience through connection, purpose, creation, nature, knowledge, wonder, and play.",
    "Leave those who come after you more possibility than you inherited.",
    "Treat life and nature with respect: take what you need, protect what depends on you, and honor what sustains you.",
    "Use Humanity’s power as stewardship: protect what cannot protect itself, repair what can be repaired, and leave existence more capable of life because Humanity was here.",
]


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.links: list[str] = []
        self.heading_levels: list[int] = []
        self.image_alts: list[str | None] = []
        self.lang: str | None = None
        self.main_count = 0
        self.h1_count = 0
        self.has_skip_link = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "html":
            self.lang = values.get("lang")
        if values.get("id"):
            self.ids.append(values["id"] or "")
        if tag == "a" and values.get("href"):
            href = values["href"] or ""
            self.links.append(href)
            if "skip-link" in (values.get("class") or "").split() and href == "#content":
                self.has_skip_link = True
        if tag == "img":
            self.image_alts.append(values.get("alt"))
        if tag == "main":
            self.main_count += 1
        if tag == "h1":
            self.h1_count += 1
        if len(tag) == 2 and tag[0] == "h" and tag[1].isdigit():
            self.heading_levels.append(int(tag[1]))


def target_for(page: Path, href: str) -> tuple[Path, str] | None:
    parsed = urlsplit(href)
    if parsed.scheme or href.startswith(("mailto:", "tel:", "javascript:")):
        return None

    fragment = unquote(parsed.fragment)
    path = unquote(parsed.path)
    if not path:
        return page, fragment

    if path.startswith("/"):
        target = REPO / path.lstrip("/")
    else:
        target = page.parent / path

    if path.endswith("/") or target.is_dir():
        target = target / "index.html"
    return target.resolve(), fragment


def main() -> int:
    errors: list[str] = []
    pages = sorted(SITE.rglob("*.html"))
    parsed_pages: dict[Path, PageParser] = {}

    if not pages:
        errors.append("No Humanity HTML pages were found.")

    for page in pages:
        parser = PageParser()
        parser.feed(page.read_text(encoding="utf-8"))
        parsed_pages[page.resolve()] = parser

        duplicate_ids = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
        if duplicate_ids:
            errors.append(f"{page.relative_to(REPO)} has duplicate ids: {', '.join(duplicate_ids)}")
        if parser.lang != "en":
            errors.append(f"{page.relative_to(REPO)} must declare html lang=\"en\".")
        if parser.main_count != 1:
            errors.append(f"{page.relative_to(REPO)} has {parser.main_count} main landmarks; expected 1.")
        if parser.h1_count != 1:
            errors.append(f"{page.relative_to(REPO)} has {parser.h1_count} h1 elements; expected 1.")
        if not parser.has_skip_link:
            errors.append(f"{page.relative_to(REPO)} is missing the skip-to-content link.")
        if any(alt is None for alt in parser.image_alts):
            errors.append(f"{page.relative_to(REPO)} contains an image without an alt attribute.")
        for before, after in zip(parser.heading_levels, parser.heading_levels[1:]):
            if after > before + 1:
                errors.append(
                    f"{page.relative_to(REPO)} skips heading levels from h{before} to h{after}."
                )

    for page, parser in parsed_pages.items():
        for href in parser.links:
            resolved = target_for(page, href)
            if resolved is None:
                continue
            target, fragment = resolved
            if not target.exists():
                errors.append(f"{page.relative_to(REPO)} links to missing {href}.")
                continue
            if fragment and target.suffix.lower() == ".html":
                target_parser = parsed_pages.get(target)
                if target_parser is None:
                    target_parser = PageParser()
                    target_parser.feed(target.read_text(encoding="utf-8"))
                    parsed_pages[target] = target_parser
                if fragment not in target_parser.ids:
                    errors.append(
                        f"{page.relative_to(REPO)} links to missing fragment #{fragment} in "
                        f"{target.relative_to(REPO)}."
                    )

    laws_source = (SITE / "content" / "01-twelve-laws.md").read_text(encoding="utf-8")
    for law in LAW_TEXTS:
        if f"> {law}" not in laws_source:
            errors.append(f"The exact published Law changed or is missing: {law}")

    search_path = SITE / "search-index.json"
    try:
        search_records = json.loads(search_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"search-index.json is not valid JSON: {exc}")
    else:
        urls = {record.get("url") for record in search_records if isinstance(record, dict)}
        required_urls = {
            "/humanity/twelve-laws/",
            "/humanity/purpose-of-humanity/",
            "/humanity/human-continuum/",
            "/humanity/human-sovereignty/",
            "/humanity/human-experience/",
            "/humanity/human-spirit/",
        }
        missing = sorted(required_urls - urls)
        if missing:
            errors.append(f"Search index is missing: {', '.join(missing)}")

    if errors:
        print("Humanity wiki check failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Humanity wiki check passed: {len(pages)} pages, {len(LAW_TEXTS)} Laws protected.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
