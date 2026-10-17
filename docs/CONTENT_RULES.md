# Content rules

These rules bind every page.
CI checks the ones a script can check; the review checks the rest.

## Numbers

- Every number comes from the pinned decisio release (README.md, EVAL_CARD.md, a docs page or a named run record) or from the launch facts, `src/data/launch/launch_facts.public.json`, and the page names its source.
  Every figure in the launch facts names the board's file or the record it comes from, with its revision, date and hash.
- Each number appears once per page.
  `scripts/checks/content.mjs` checks this on the site's own pages (home, benchmarks, demos); the docs pages render decisio's files as written and repeat a figure where those files do.
  Where a figure is meant to appear twice (a dated tile and the section it summarises), `scripts/checks/figures-allow.json` lists it with the reason.
- No rank and no relative comparison, on any page:
  - no ordinal rank ("second", "top 10", "fourth of N", "ranked above");
  - no "level with", "ahead of", "faster than" or "Jev-level".
  A page states measurements instead, each with its version and date, as the launch facts' `stable_claims` word them.
  Two dated forms are allowed: a speed ratio beside the two measured times and their date, and a comparison table of values and intervals with its date and no marks.
  `scripts/checks/claims.mjs` reads every built page for both.
- The Decision Index rows are "listed on the board", in the board's data file of a stated date; nothing on the site says the board validated them.
  decisio's own Decision Index 0.2.1 runs are labelled as our own runs.
- A claim's qualifiers stay beside it: the board's revision and date, the hardware it ran on (the 31B needs a 96 GB card or a 64 GB Mac, or a 48 GB Mac from its 4-bit conversion), and that intervals overlap where they do.
- Where JevBench's published questions are counted, the page says "on JevBench's 231 published questions".

## Jev and hosted models

- Benchmark figures for Jev come only from the public boards, labelled as such, with the board's name and the date read.
- In the demos, Jev's results appear as aggregates from the demos' run records, labelled "Jev 1.13 through its public API", with the date.
- Hosted chat models appear only as aggregates, with plain model IDs and dates.
- The scoreboard cards at the end of each Decisio clip stay as they were rendered.
- The site embeds no clip of Jev, claude-haiku-4.5 or gpt-6-luna; it links to the repository's demos page for them.
- No clip of Gemini anywhere, embedded or linked.
- No provider logos, and no sentence describing a relationship with any provider.

## Independence

- Near the top of the home page and in every footer: Decisio is an independent open-source project, not affiliated with or endorsed by TypeSafe, and Jev is TypeSafe's product name.
- The decisio repository's licence and copyright lines are not the site's to change.

## Figures and their sources

- Each figure has its source record named beside it, in small type.
- A chart of time reads as lower is better: it says so, and it does not use bars that grow with the value.
- Systems on a board chart or table are in alphabetical order, with Jev 1.13.0 last as the reference row; nothing is ordered or shaded by rank.
- Each base keeps its own colour wherever it appears.

## Writing

- No em dash anywhere; a plain hyphen or a rewording.
- No paragraph of more than three sentences on the docs pages and the site's own pages; `scripts/checks/docs-pattern.mjs` checks it.
- In Markdown sources, one sentence per line.
- The project name is read from `src/config/site.ts`; no page spells it out.

## What the site is

- The site is the home of the open-source project only: it offers no hosted service and sells nothing.
- It collects no personal data. Visits are counted by Cloudflare Web Analytics, which uses no cookies and no fingerprinting, and the site sets no cookies of its own; `/privacy/` says so.
