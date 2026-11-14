# Writing style guide

Fitted to Decisio's own rules in `docs/CONTENT_RULES.md`.
Audience: a backend developer who has ten minutes and wants a working result.

## Precedence

1. `docs/CONTENT_RULES.md` and the source gates win on numbers, sources, claims and repeated figures.
   A phrase pinned in `src/config/sourced.mjs` is never reworded to meet a length rule.
   A pinned list longer than seven items stays as it is, grouped under two short labels.
2. Then this guide.

When a pinned fact makes a page too long, move the whole fact to the page that should own it.
Update that fact's page key in `sourced.mjs`, the `::covers` aliases, the docs groups, `docs/SITEMAP.md` and every inbound link in the same change.

## Moving a section to another page

Do all of this in one change, and commit the new page before running the `docs-pattern` gate (a new page has no reading time or date until it is committed):

1. Choose the owning page by the reader's job: a fact about running in production goes to the production page, a fact about the request format goes to the layout page.
2. Move the pinned sentences verbatim and re-key their rows in `src/config/sourced.mjs` to the new page.
3. Move the `::covers` aliases: an alias maps only to a heading on its own page, so add it to the target page's `::covers` line and remove it from the old one.
4. Leave a hidden `fp-anchor` span with the old id just above a heading on the page that lost the content (a short pointer section is fine), so old links land somewhere sensible.
5. A new page also needs its slug, a row in `docs/SITEMAP.md`, an entry in `src/config/docs-groups.mjs`, a decision on any redirect, and `src/lib/upstream-map.mjs` links if decisio's own docs point at it.
6. Update every inbound link.

## What good docs do

- The first paragraph says what the thing does and what the page will do for you.
- A short "TL;DR" shows the whole idea in code before any explanation.
- Each section answers one question a reader would ask, and its heading is that question or a plain noun phrase.
- Terms are defined the first time they appear, in a small "word, meaning" table or one clause in parentheses.
- Tables compare, lists enumerate, prose explains, and none of them is used for the others' job.
- Caveats appear once, in a callout, where they matter.
- Evidence states what was tested, on what, and what was not tested.

## The ten rules

1. **Lead with the benefit, then the job.**
   The first two sentences say what you can do and why it matters.
   Do not open with background, history or a definition.
2. **Show the shortest working thing early.**
   Every how-to page has a TL;DR or "Quick start" block within the first screen.
3. **One page, one job.**
   If a page serves two readers (a first-timer and an operator), split it.
   Link instead of repeating.
4. **Keep sections small and named by the question.**
   "What happens to a request", "What comes back", "When not to use it".
   A section is at most about 200 words plus its code or table.
5. **Use plain words.**
   Prefer "use" to "utilize", "check" to "verify", "answer" to "inference result".
   Define a term once and use it the same way everywhere.
   A page that introduces three or more new terms may open with a small "Words you will see" table, except guide pages, which link the shared glossary instead (the `docs-pattern` gate rejects a glossary there).
6. **Short sentences, active voice, second person.**
   Aim for 20 words or fewer per sentence.
   Say "run this", not "this can be run".
7. **Put internals in a clearly marked place.**
   Beginner and how-to pages contain no verification internals, harness details or run provenance.
   Evidence, methods and limits go to their own pages and are linked in one line.
8. **Say what you measured, once.**
   A number appears with its dataset, version, date and hardware, next to it.
   Repeat a figure only where `docs/CONTENT_RULES.md` allows it.
   Never promise the number on the reader's workload.
9. **Limits come last and stay short.**
   One compact section at the end, at most five bullets.
   One callout at most where a limit changes a decision mid-page.
   A long list of what was not tested is evidence, not a limit: it belongs on an evidence page.
10. **End with the next step.**
    Every page ends with one or two links: what to do next.

## Page types and their skeletons

### How-to (default)

1. Title: a verb phrase ("Add a fast path to a recurring decision").
2. Lead: what you will have at the end, in two sentences.
3. TL;DR: the whole thing in one code block.
4. Words you will see (only if three or more new terms).
5. Steps: numbered, each begins with a verb, each has one code block and one sentence on what to expect.
6. What comes back: the result and how to read it.
7. Limits: at most five bullets.
8. Next.

### Concept

1. Title: a noun phrase or question ("How certification works").
2. Lead: the idea in two sentences, no jargon.
3. A figure that shows it.
4. Three to five short sections, each answering one question.
   Commands, if any, go in a "How do you read it" section after the figure.
   One reference table per section is fine.
5. When it applies and when it does not.
6. Next.

### Reference

1. Title: the thing named exactly as in the API.
2. One sentence on what it is.
3. A table of parameters, fields or commands, with defaults.
4. One minimal example per variant.
5. Errors, as a table of "what you see, why, what to do".

### Evidence

1. Title states the finding, or is a plain noun phrase when the page is a ledger of many measurements.
2. Setup in a compact table (dataset, model, hardware, version, date).
3. Results, a chart or table.
4. What this does not show.

## Length budget

| Page type | Target | Hard ceiling |
| --- | --- | --- |
| How-to | 500 to 900 words | 1,200 |
| Concept | 400 to 800 words | 1,000 |
| Reference | as needed, but tabular | n/a |
| Evidence | 400 to 800 words | 1,200 |

Over the ceiling, split the page or move detail into a linked page.
Words are prose words: paragraphs, list items and headings.
Code, tables, source notes, comments and `::` lines are not counted.

## Which type is a page?

Classify by the reader's main job, not by its sidebar group.
A page whose reader mostly runs steps is a how-to, even under a concept group.
A settings checklist is a reference page: its first-screen artifact may be a table instead of a code block.

## Page frame rules

- The page description is the lead and is shown under the title.
  The first paragraph of the body must not repeat it.
- A first section named `TL;DR` holds at most two code blocks.
  On a guide page the opening example or figure counts as the TL;DR (the `docs-pattern` gate wants a code block or figure before the first heading).
  On a page that opens with a figure, the TL;DR comes right after it.
- A concept page may put a short table or command between the figure and its first section.
- A callout is written `:::caution[Heads up]`, `:::note` or `:::tip`.
- A renamed or moved heading keeps its old anchor: add a hidden `fp-anchor` span with the old id, as `docs/evaluation-card` does.
  Prefer plain headings (questions or nouns) to numbered headings, but never break a link to a numbered one.
  Number only steps a reader performs in order; a section added to a numbered page follows the headings around it.
- Reading time and the updated date come from git: a new page shows them only after it is committed.
- Do not add commands or request examples to a reference page unless they have a verification source: every command in the docs is run in CI.
- A security prerequisite that decides whether a command can run goes beside the command; otherwise it is the last limit.

## Formatting rules

- Sentence case for every heading.
- One full sentence per source line in Markdown.
  Consecutive lines render as one paragraph, so insert a blank line after at most three sentences (a gate fails longer paragraphs).
- Plain hyphen, never an em dash.
- Code identifiers, commands, files and field names go in backticks, and only those.
- Bold for the first use of a defined term, never for emphasis.
- No exclamation marks, no "simply", "just", "easily", "powerful", "seamless", "robust".
- No "we" for the project's internals ("we verify..."); say what the system does.
- Numbers use digits, with units and a space (`50 ms`), and a thin consistent style for ranges (`56-79 ms`).
- Link text names the destination ("Teach a task"), never "click here".
- Alt text and captions say what the figure shows, not "diagram".

## Before and after

Before:
> The default static backend uses token-vector lookups and a classifier, with no neural network running on the CPU, so for short texts the published embedding-plus-classifier cost is about 0.05 ms (50 us), while longer changing inputs cost more.

After:
> The fast path runs on the CPU in about 0.05 ms for a short text.
> Longer text takes more.
> The figure is one component, not the full request.
> See [Measurements](#measurements).

Before:
> It is important to note that certification labels must be kept separate from those used for fitting.

After:
> Keep certification labels separate from the labels you teach with.

## Review checklist

- [ ] The first two sentences say what the reader can do.
- [ ] A working example is visible without scrolling.
- [ ] Every new term is defined once and used consistently.
- [ ] No section exceeds about 200 words of prose.
- [ ] No verification internals on a beginner page.
- [ ] Every number carries dataset, version, date and conditions, and is sourced.
- [ ] Limits are last and short.
- [ ] The page ends with a next step.
- [ ] Within the length budget for its type.
- [ ] No banned words, no em dashes.
