from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path


@dataclass(frozen=True)
class Passage:
    kind: str
    text: str


@dataclass(frozen=True)
class Article:
    slug: str
    title: str
    dek: str
    canonical_url: str
    published: str
    tags: list[str]
    passages: list[Passage]
    source_path: str

    def to_dict(self) -> dict:
        data = asdict(self)
        data["passages"] = [asdict(passage) for passage in self.passages]
        return data


class _ArticleHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.dek = ""
        self.canonical_url = ""
        self.published = ""
        self.tags: list[str] = []
        self.passages: list[Passage] = []
        self._capture: str | None = None
        self._capture_parts: list[str] = []
        self._content_depth = 0

    @staticmethod
    def _attrs(attrs: list[tuple[str, str | None]]) -> dict[str, str]:
        return {key: value or "" for key, value in attrs}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = self._attrs(attrs)
        classes = set(attributes.get("class", "").split())

        if tag == "link" and attributes.get("rel") == "canonical":
            self.canonical_url = attributes.get("href", "")
        if tag == "meta" and attributes.get("property") == "article:published_time":
            self.published = attributes.get("content", "")

        if "article-content" in classes:
            self._content_depth = 1
            return

        if self._content_depth:
            self._content_depth += 1
            if tag in {"p", "h2", "blockquote", "li"} and self._capture is None:
                self._capture = tag
                self._capture_parts = []
            return

        if tag == "h1" and not self.title:
            self._capture = "title"
            self._capture_parts = []
        elif tag == "p" and "dek" in classes:
            self._capture = "dek"
            self._capture_parts = []
        elif tag == "span" and "tag" in classes:
            self._capture = "tag"
            self._capture_parts = []

    def handle_endtag(self, tag: str) -> None:
        if self._content_depth:
            if self._capture == tag:
                text = _clean_text(" ".join(self._capture_parts))
                if text:
                    self.passages.append(Passage(kind=tag, text=text))
                self._capture = None
                self._capture_parts = []
            self._content_depth -= 1
            return

        expected = {"title": "h1", "dek": "p", "tag": "span"}
        if self._capture and expected.get(self._capture) == tag:
            text = _clean_text(" ".join(self._capture_parts))
            if self._capture == "title":
                self.title = text
            elif self._capture == "dek":
                self.dek = text
            elif self._capture == "tag" and text:
                self.tags.append(text)
            self._capture = None
            self._capture_parts = []

    def handle_data(self, data: str) -> None:
        if self._capture is not None:
            self._capture_parts.append(data)


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def load_article(article_file: Path, article_root: Path) -> Article:
    parser = _ArticleHTMLParser()
    parser.feed(article_file.read_text(encoding="utf-8"))
    slug = article_file.parent.name
    canonical = parser.canonical_url or f"https://srxnexus.org/blog/articles/{slug}/"
    return Article(
        slug=slug,
        title=parser.title,
        dek=parser.dek,
        canonical_url=canonical,
        published=parser.published,
        tags=list(dict.fromkeys(parser.tags)),
        passages=parser.passages,
        source_path=str(article_file.resolve()),
    )


def list_articles(article_root: Path) -> list[Article]:
    articles = []
    for article_file in sorted(article_root.glob("*/index.html")):
        article = load_article(article_file, article_root)
        if article.title and article.passages:
            articles.append(article)
    return sorted(articles, key=lambda item: item.published, reverse=True)


def find_passage(article: Article, contains: str) -> int:
    needle = contains.casefold()
    for index, passage in enumerate(article.passages):
        if needle in passage.text.casefold():
            return index
    raise ValueError(f"Could not locate source passage containing: {contains}")


def _first_sentence(text: str, max_words: int = 24) -> str:
    match = re.match(r".+?(?:[.!?](?:\s|$)|$)", text.strip())
    sentence = (match.group(0) if match else text).strip()
    words = sentence.split()
    if len(words) <= max_words:
        return sentence
    return " ".join(words[:max_words]).rstrip(",;:") + "…"


def _score_passage(text: str, needles: tuple[str, ...]) -> int:
    folded = text.casefold()
    return sum(3 if needle in folded else 0 for needle in needles) - abs(len(text.split()) - 35) // 15


def _best_passage(article: Article, needles: tuple[str, ...], excluded: set[int]) -> int | None:
    candidates = [
        (index, _score_passage(passage.text, needles))
        for index, passage in enumerate(article.passages)
        if passage.kind in {"p", "blockquote"} and index not in excluded
    ]
    if not candidates:
        return None
    index, score = max(candidates, key=lambda item: item[1])
    return index if score > 0 else None


def _segment(kind: str, narration: str, source_index: int, article: Article, highlight: str | None = None) -> dict:
    source = article.passages[source_index].text
    return {
        "kind": kind,
        "narration": narration,
        "source_index": source_index,
        "source_quote": source,
        "highlight": highlight or _first_sentence(source, 12).rstrip("…"),
    }


def draft_segments(article: Article) -> tuple[list[dict], list[str]]:
    if article.slug == "how-i-would-fix-portland":
        return _portland_segments(article), []

    body_indices = [index for index, passage in enumerate(article.passages) if passage.kind == "p"]
    if not body_indices:
        return [], ["This article has no body paragraphs to quote."]

    used: set[int] = set()
    hook_index = body_indices[0]
    used.add(hook_index)
    topic_index = body_indices[min(2, len(body_indices) - 1)]
    used.add(topic_index)
    other_index = _best_passage(
        article,
        ("objection", "some people", "critics", "not saying", "budget", "limit", "concern", "argument against"),
        used,
    )
    if other_index is not None:
        used.add(other_index)
    side_index = _best_passage(article, ("i think", "i mean", "my argument", "should", "the point"), used)
    if side_index is None:
        side_index = body_indices[min(3, len(body_indices) - 1)]
    used.add(side_index)
    plan_index = _best_passage(article, ("should", "could", "need to", "the answer", "the plan", "make it"), used)
    if plan_index is None:
        plan_index = body_indices[-1]

    segments = [
        _segment("HOOK", _first_sentence(article.passages[hook_index].text, 20), hook_index, article),
        _segment("THE TOPIC", _first_sentence(article.dek or article.passages[topic_index].text, 24), topic_index, article),
    ]
    warnings: list[str] = []
    if other_index is None:
        segments.append(_segment("THE OTHER SIDE", "", topic_index, article, ""))
        warnings.append("I could not safely infer an opposing argument. Add it in your own words and attach the supporting passage.")
    else:
        segments.append(_segment("THE OTHER SIDE", _first_sentence(article.passages[other_index].text, 22), other_index, article))
    segments.extend(
        [
            _segment("MY SIDE", _first_sentence(article.passages[side_index].text, 23), side_index, article),
            _segment("MY PLAN + FULL ARTICLE", _first_sentence(article.passages[plan_index].text, 22), plan_index, article),
        ]
    )
    return segments, warnings


def _visual(segment_index: int, source_index: int, article: Article, highlight: str | None = None) -> dict:
    source = article.passages[source_index].text
    return {
        "segment_index": segment_index,
        "source_index": source_index,
        "source_quote": source,
        "highlight": highlight or _first_sentence(source, 14).rstrip("…"),
    }


def draft_visuals(article: Article, segments: list[dict]) -> list[dict]:
    """Build a faster cut list while keeping every shot tied to published text."""
    if article.slug == "how-i-would-fix-portland":
        return _portland_visuals(article)

    quote_indices = [
        index for index, passage in enumerate(article.passages)
        if passage.kind in {"p", "blockquote"}
    ]
    visuals: list[dict] = []
    used: set[int] = set()
    for segment_index, segment in enumerate(segments):
        primary = segment["source_index"]
        visuals.append(_visual(segment_index, primary, article, segment.get("highlight") or None))
        used.add(primary)
        secondary = next((index for index in quote_indices if index > primary and index not in used), None)
        if secondary is None:
            secondary = next((index for index in quote_indices if index not in used), primary)
        visuals.append(_visual(segment_index, secondary, article))
        used.add(secondary)
    return visuals


def _portland_visuals(article: Article) -> list[dict]:
    specs = [
        (0, "It has a prioritization problem", "It has a prioritization problem."),
        (1, "People come here for food", "food. They come here for weird little shops, queer culture, strip clubs, weed, art, bars, forests, hiking, camping"),
        (1, "There are empty buildings everywhere", "34.7% vacancy rate in the Central Business District"),
        (1, "There are small business districts", "getting around becomes such a pain in the ass that they stay home instead"),
        (2, "Portland Streetcar’s published Saturday service", "ends around 11:30 p.m."),
        (2, "Portland has late-night replacement buses", "10 routes , runs every 20 to 30 minutes, seven nights a week"),
        (2, "I am not saying a mayor can wave a hand", "real budget limits, agency limits, state rules, neighborhood conflicts"),
        (3, "Why are there so many spaces sitting empty", "night markets, small performance venues, cooperatives, low-cost studios, indoor winter event spaces, queer community hubs"),
        (3, "Tourism is not automatically soulless", "businesses have a better chance of surviving winter"),
        (4, "Then I would treat housing, transit, safety", "housing, transit, safety, tourism, nightlife, small business, nature, and public space as connected problems"),
        (4, "What it does not seem to have", "a city government willing to put those pieces together on purpose"),
    ]
    return [
        _visual(segment_index, find_passage(article, contains), article, highlight)
        for segment_index, contains, highlight in specs
    ]


def _portland_segments(article: Article) -> list[dict]:
    sources = [
        find_passage(article, "It has a prioritization problem"),
        find_passage(article, "And somehow the city acts like none of it connects"),
        find_passage(article, "I am not saying a mayor can wave a hand"),
        find_passage(article, "People talk about public transportation"),
        find_passage(article, "Then I would treat housing, transit, safety"),
    ]
    narrations = [
        "Portland does not have a lack-of-things-to-do problem. It has a prioritization problem.",
        "The city has food, nightlife, queer culture, local businesses, and nearby nature. But reaching them is needlessly difficult.",
        "The objection is real: a mayor cannot simply fix every building, bus route, or freeway bottleneck.",
        "My argument is that transportation, tourism, and small-business survival are connected. Making Portland easier to use keeps local places alive.",
        "Treat housing, transit, safety, tourism, nightlife, small business, nature, and public space as connected problems. Read the full plan at srxnexus dot org slash blog.",
    ]
    highlights = [
        "It has a prioritization problem.",
        "And somehow the city acts like none of it connects.",
        "real budget limits, agency limits, state rules, neighborhood conflicts",
        "public transportation like it is separate from business, nightlife, tourism, or public safety",
        "housing, transit, safety, tourism, nightlife, small business, nature, and public space as connected problems",
    ]
    kinds = ["HOOK", "THE TOPIC", "THE OTHER SIDE", "MY SIDE", "MY PLAN + FULL ARTICLE"]
    return [
        _segment(kind, narration, source, article, highlight)
        for kind, narration, source, highlight in zip(kinds, narrations, sources, highlights)
    ]
