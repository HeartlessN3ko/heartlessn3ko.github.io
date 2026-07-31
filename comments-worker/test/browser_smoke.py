"""Visual smoke test for the article comment interface.

Run while the repository root is served at http://127.0.0.1:8765.
"""

import json

from playwright.sync_api import sync_playwright


SAMPLE_COMMENTS = {
    "comments": [
        {
            "id": "11111111-1111-4111-8111-111111111111",
            "parentId": None,
            "authorName": "Portland Reader",
            "body": "The distinction between posting and marketing is the part people keep skipping.",
            "isAuthor": False,
            "createdAt": "2026-07-30T18:00:00.000Z",
        },
        {
            "id": "22222222-2222-4222-8222-222222222222",
            "parentId": "11111111-1111-4111-8111-111111111111",
            "authorName": "Skye Vernon",
            "body": "Exactly. Uploading is one action. A release has a whole structure around it.",
            "isAuthor": True,
            "createdAt": "2026-07-30T18:30:00.000Z",
        },
    ]
}


def run() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for name, viewport in (
            ("desktop", {"width": 1440, "height": 1100}),
            ("mobile", {"width": 390, "height": 844}),
        ):
            page = browser.new_page(viewport=viewport)
            page.route(
                "https://comments.srxnexus.org/config",
                lambda route: route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps({"turnstileSiteKey": "test-key"}),
                ),
            )
            page.route(
                "https://comments.srxnexus.org/comments?*",
                lambda route: route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps(SAMPLE_COMMENTS),
                ),
            )
            page.route(
                "https://challenges.cloudflare.com/turnstile/v0/api.js?*",
                lambda route: route.fulfill(
                    status=200,
                    content_type="text/javascript",
                    body=(
                        "window.turnstile={render:()=>1,"
                        "getResponse:()=>'test-token',reset:()=>{}};"
                    ),
                ),
            )
            page.goto(
                "http://127.0.0.1:8765/blog/articles/"
                "ai-did-not-kill-artists-upload-and-pray-did/",
                wait_until="networkidle",
            )
            page.locator("#comments-heading").scroll_into_view_if_needed()
            page.wait_for_selector(".comment-item.is-author")
            assert page.locator(".comment-item").count() == 2
            assert page.locator(".comment-author-badge").text_content() == "Author"
            assert not page.evaluate(
                "document.documentElement.scrollWidth > "
                "document.documentElement.clientWidth"
            )
            page.screenshot(
                path=(
                    "C:/Users/ChaosDesigned/AppData/Local/Temp/"
                    f"life-of-skye-comments-{name}.png"
                )
            )
            page.close()
        browser.close()


if __name__ == "__main__":
    run()
    print(
        "Browser checks passed: desktop and mobile, nested reply, "
        "author badge, no horizontal overflow"
    )
