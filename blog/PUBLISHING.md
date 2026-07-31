# Publishing a new article

Read `VOICE_GUIDE.md` before turning Skye's source text into a draft. Preserve
the original source and run the guide's final voice audit before publication.

1. Copy `articles/a-place-for-arguments-with-receipts/index.html` into a new
   lowercase, hyphenated folder under `articles/`.
2. Update the page title, description, date, byline, eyebrow, heading, dek,
   and article body. Keep factual claims linked to public sources where
   possible, and clearly label your analysis.
3. Add the article as the first card in `index.html` with its title, date,
   category, short description, and link.
4. If an existing article needs a material correction, add an update note in
   that article with the date and what changed. Do not silently rewrite a
   consequential claim.
5. Test the article locally, then commit and push it. The Railway service will
   deploy the repository automatically.

## Reader comments

Every URL under `articles/<slug>/` receives the first-party discussion section
from `site.js` and `comments.js`; article files do not need to duplicate that
markup. The browser sends comment requests to `https://comments.srxnexus.org`.

The backend lives in `comments-worker/` and uses Cloudflare Workers, D1, and
Turnstile. It stores display names and comment text, but never raw IP addresses
or email addresses. A daily one-way network fingerprint exists only for spam
limits and duplicate-report prevention.

Moderation is available at `https://comments.srxnexus.org/moderate`. The
moderation key is a Cloudflare Worker secret and must never be committed.
Author replies created there are published as `Skye Vernon` with an Author
badge.

## When the permanent title is chosen

Replace `Independent Research & Commentary` and the working description in the
three HTML pages. The Caddy routing and article URLs do not need to change.
