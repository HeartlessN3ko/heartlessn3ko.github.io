# Humanity wiki audit — 24 October 2026

## Delivery and authority

The existing public wiki, https://srxnexus.org/humanity/, returned HTTP 200 and was inspected in Chrome before changes. Caddy serves this path independently of the root site through the existing Railway production workflow. No DNS, security, account or hosting-plan changes were required.

The canonical register identifies Book II v0.6 (1 September 2026) as current. The preserved edition, current book and original website source were byte-identical: SHA-256 `ebedfabea670938eef9a266f2e660c591c81b8c3ae4ca29e155c8ebc4d6afa63`. Git converted line endings in the release checkout; normalized UTF-8 text is identical. The integrity gate now protects the entire normalized source hash as well as all twelve statements. No canonical wording changed.

Release based on remote main `e0c59502135651f3c24827e4f5eda1650b364c9d` in an isolated checkout. Original checkout is behind main, with unrelated modified root index.html and untracked data/. Those changes were not included or overwritten; newer root-site commits are preserved.

## Changes

- Editorial companion at `/humanity/history/`: 12 dated cases, interpretations, limitations, specific parallel readings, discussion questions and 23 source entries.
- Navigation across all wiki pages, twelve links from Book II, twelve searchable entries and sitemap integration.
- Canonical quotations derived from unchanged Book II. Editorial commentary explicitly distinguishes parallels from provenance, endorsement or historical proof. No invented quotations or Codex verse numbers.
- Fixed existing generator syntax error in the Sacred uncertainty definition.
- Closed mobile sidebar now hidden from keyboard/accessibility navigation.
- Guarded theme storage so blocked storage cannot disable all script behavior; preserved search network-error message instead of replacing it with no-results text.
- Versioned script/search URLs to refresh returning readers' cached index.

## Coverage

| Law | Case | Parallel reading |
|---|---|---|
| 1 | Snow's London cholera investigation, 1854–1855 | Mill, On Liberty II; Snow pp. 38–55 |
| 2 | Solferino, 1859; Dunant's appeal, 1862 | Dunant, Castiglione account and closing proposals; Bugnion's 2009 study |
| 3 | Danish Jewish rescue, autumn 1943 | Kant, Perpetual Peace, Third Definitive Article |
| 4 | Thirteenth Amendment, 1865 | Douglass, Narrative VI–VII |
| 5 | Hull-House, from 1889 | Addams, Twenty Years at Hull-House V–VII and XI |
| 6 | Virginia religious-freedom statute, 1786 | Locke, Letter Concerning Toleration, civil interests/care of souls and exclusions |
| 7 | South African TRC, 1995–1998 report cycle | Tutu's Volume I foreword; Volume V chapters 5 and 9 |
| 8 | Timbuktu manuscript evacuation, 2012; preservation, 2015 | Bacon, Advancement of Learning, end of I and opening of II |
| 9 | Federal Theatre Project, 1935–1939 | Dewey, Democracy and Education XV and XIX |
| 10 | Our Common Future, 1987 | Brundtland foreword; commission chapter 2, I–II |
| 11 | Dust Bowl/soil conservation, 1930s | Leopold, Land Ethic, Community Concept and Ecological Conscience |
| 12 | Montreal Protocol, 1987/1989 | Ostrom, Beyond Markets and States, pp. 652–653 |

All citation labels, URLs and source types are in `humanity/content/historical-context.json`. The renderer is `tools/humanity_history.py`; use the existing build script to regenerate the site.

## Verification and limits

- `python -B tools/build_humanity_wiki.py`: ten pages generated.
- `python -B tools/check_humanity_wiki.py`: ten pages pass; twelve Laws protected; internal links/fragments, headings, landmarks, image alternatives, citations and search coverage checked.
- `node --check humanity/wiki.js`: passed.
- Direct HTTP checks: 19 of 23 source URLs returned 200; UN catalogue returned 202; three institutional sources blocked/timed out in that client. Web-source retrieval separately established the pages. Automated access to each institution is not guaranteed. Replaced AEA's paid-access destination with a freely readable university copy of Ostrom's paper.
- Chrome local runtime: desktop and narrow page inspected; no horizontal overflow observed; mobile navigation expanded and Escape closed it; Solferino search returned Law 2 and Enter opened its anchor; no browser errors in that flow.
- Existing reduced-motion and print rules retained. Comprehensive assistive-technology testing and every storage/network/browser configuration were not performed. Source-level resilience fixes are not claimed as exhaustive runtime testing.
- Selection is introductory and weighted toward European/North American texts, alongside South African and Malian cases. It is not a representative survey of all cultures or an established genealogy of the Codex.

Post-deployment evidence is recorded separately after publication.
