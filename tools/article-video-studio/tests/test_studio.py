from __future__ import annotations

import tempfile
import unittest
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from studio.articles import draft_segments, list_articles
from studio.render import HEIGHT, WIDTH, render_scene


REPO_ROOT = Path(__file__).resolve().parents[3]
ARTICLE_ROOT = REPO_ROOT / "blog" / "articles"
PORTRAIT = REPO_ROOT / "blog" / "assets" / "skye-vernon.png"


class ArticleStudioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.articles = list_articles(ARTICLE_ROOT)

    def test_all_published_articles_are_discoverable(self) -> None:
        self.assertEqual(6, len(self.articles))
        for article in self.articles:
            self.assertTrue(article.title)
            self.assertTrue(article.canonical_url.startswith("https://srxnexus.org/blog/articles/"))
            self.assertGreater(len(article.passages), 5)

    def test_every_draft_has_five_source_faithful_beats(self) -> None:
        for article in self.articles:
            segments, _warnings = draft_segments(article)
            self.assertEqual(5, len(segments), article.slug)
            for segment in segments:
                passage = article.passages[segment["source_index"]]
                self.assertEqual(passage.text, segment["source_quote"])
                if segment["highlight"]:
                    self.assertIn(segment["highlight"].casefold(), passage.text.casefold())

    def test_portland_runtime_preset_covers_the_required_arc(self) -> None:
        article = next(item for item in self.articles if item.slug == "how-i-would-fix-portland")
        segments, warnings = draft_segments(article)
        self.assertEqual([], warnings)
        self.assertEqual(
            ["HOOK", "THE TOPIC", "THE OTHER SIDE", "MY SIDE", "MY PLAN + FULL ARTICLE"],
            [segment["kind"] for segment in segments],
        )
        self.assertEqual(91, sum(len(segment["narration"].split()) for segment in segments))
        self.assertIn("srxnexus dot org slash blog", segments[-1]["narration"].casefold())

    def test_scene_is_native_nine_by_sixteen(self) -> None:
        article = next(item for item in self.articles if item.slug == "how-i-would-fix-portland")
        segments, _ = draft_segments(article)
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "scene.png"
            render_scene(article.to_dict(), segments[0], 0, output, PORTRAIT)
            with Image.open(output) as image:
                self.assertEqual((WIDTH, HEIGHT), image.size)
                self.assertEqual((1080, 1920), image.size)


if __name__ == "__main__":
    unittest.main()
