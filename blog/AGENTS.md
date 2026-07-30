# Blog editorial rules

## Publication and author

- This is Skye Vernon’s independent publication. Credit published articles as
  `By Skye Vernon` unless Skye explicitly requests a different byline.
- The site’s working publication title may change. Do not invent a permanent
  title, logo, affiliation, employer relationship, or institutional backing.
- The author portrait is `assets/skye-vernon.png`. Use it only as Skye’s
  author image and keep descriptive alternative text.

## Editorial standard

- The publication is researched opinion and observational commentary, not a
  news organization or a neutral institutional outlet.
- Separate documented facts, Skye’s firsthand experience, and interpretation.
  Do not turn a lived observation into a citywide statistical claim.
- Link factual claims to primary, public sources whenever practical. For
  local civic writing, prefer City of Portland, PBOT, TriMet, ODOT, Metro,
  and original reports over articles summarizing them.
- Read and verify time-sensitive sources when drafting. Preserve uncertainty:
  say what the evidence does and does not establish.
- Keep Skye’s direct, specific voice. Do not smooth it into generic
  corporate, academic, or AI-sounding language. Preserve her emotional force:
  anger, frustration, humor, and sharp judgments are editorial substance, not
  defects to soften. Organize a heated argument without laundering it into a
  neutral-sounding take. AI may assist with research, structure, and editing;
  it is never the author or a ghostwriter.
- Treat corrections as visible updates with a date. Do not silently rewrite a
  consequential factual claim.

## Publishing workflow

- Draft and obtain Skye’s explicit approval before adding a new public
  article. Approval to research or outline is not approval to publish.
- Add the article under `articles/<lowercase-hyphenated-slug>/index.html`,
  then add its card at the top of `index.html`.
- Include a byline, publication date, short dek, and source links near the
  claims they support. Use the `author-byline` markup with Skye’s portrait
  beside her name, matching existing published articles. Update
  `PUBLISHING.md` if the workflow changes.
- Run `git diff --check`, verify internal `/blog/` links, commit, push `main`,
  wait for Railway, and verify the public page before reporting the work
  complete.
