# Site map

Every page, its route, and where its content comes from.
"Upstream" means the decisio repository at the tag pinned in `upstream.json` (v0.7.1 today); a section named after a file is included whole, by heading.
"Site" means prose written for the site, which never carries a number of its own.

## Pages

| Route | Page | Content |
| --- | --- | --- |
| `/` | Home | Site layout; every fact and number from upstream; the hero's lead claim, with its qualifiers beside it (level means the intervals overlap, the board ran v0.8.0, the 31B needs a 96 GB card or a 64 GB Mac), and the JevBench chart from `launch_facts.public.json`; a "Why Decisio" row of five lines under the hero (numbers from `head_to_head.jev` and the README's row on several questions in one request); "JevBench, axis by axis" (the board's four-axes chart, every number in a table that starts closed); no comparison table and no where-it-is-behind section, which are on /benchmarks; the demo reel; "How it works" (Amin's explainer picture, corrected copy, captioned as an illustration with example probabilities); the explainer card is the og:image; the laptop path (Ollama) right after the hero, its request site-written and run against the listing |
| `/benchmarks/` | Benchmarks | Upstream README "Benchmarks" and "Choosing a base" tables, EVAL_CARD section 5's limits and section 8's self-runs; a JevBench section from `launch_facts.public.json` (the board's rows, the claims that hold, the frozen-weights rows); "How Decisio compares" from docs/comparison.md, where Jev and the other entries appear, with the JevBench section's board rows (below) (the headline as a scores table and a table of facts per system, the capabilities as the questions a buyer asks, with a sources link per row, every benchmark by area; no closing paragraph on where Jev leads); "JevBench, axis by axis" inside the JevBench section; Jev's GPQA Diamond board field from EVAL_CARD 8.1 in its source line |
| `/articles/`, `/articles/<slug>/` | Articles | Markdown in `src/content/articles/` (docs/POSTS.md): longer pieces; a piece first published elsewhere points its canonical link at the original and stays out of the sitemap; `/articles/rss.xml` |
| `/news/`, `/news/<slug>/` | News | Markdown in `src/content/news/` from the template in `docs/templates/news-post.md`; `/news/rss.xml` |
| `/demos/` | Demos | Upstream docs/demos/README.md "Watch it play" and "Results", the Decisio clips from docs/demos/media at the tag; Jev and the hosted models as aggregates only |
| `/privacy/` | Privacy | Site: who runs the site (Tachara LLC), what Cloudflare Web Analytics counts, that no personal data is sold or shared, and that the site sets no cookies; linked from every footer |
| `/docs/` | Documentation start | Site: what Decisio is and where to begin, linking into each section |

## Documentation

| Route | Section | Content |
| --- | --- | --- |
| `/docs/use-from/` | Use it from | Site-written map of the ways in (the API, a client, the five integrations, a taught task), each claim on the page it links to |
| `/docs/how-it-works/` | How it works | Site-written text around four diagrams drawn at build time from launch_facts.public.json and the README (src/lib/diagrams.mjs): the request flow, the cache timeline, the routing threshold and the bases |
| `/docs/quickstart/` | Quickstart: choose your machine | Upstream README "Install and run" (the chooser table) |
| `/docs/quickstart/gpu-server/` | GPU server | Upstream docs/running.md "GPU server" |
| `/docs/quickstart/docker/` | Docker | Upstream docs/running.md "Docker" |
| `/docs/quickstart/mac-mlx/` | Mac with MLX | Upstream docs/running.md "Mac with MLX" |
| `/docs/quickstart/ollama/` | Ollama | Upstream docs/running.md "Ollama"; plus the site-written request (`src/lib/site-blocks.mjs`) |
| `/docs/quickstart/cpu-stand-in/` | CPU stand-in for development | Upstream docs/running.md "CPU stand-in for development" |
| `/docs/first-request/` | Your first request | Upstream README "Ask a question" |
| `/docs/bases/` | Choosing a base | Upstream README "Choosing a base", with each base's provenance |
| `/docs/api/` | Asking questions: the HTTP API | Upstream docs/api.md |
| `/docs/flags/` | Flags and options | Upstream README "Options", then docs/cli.md |
| `/docs/tasks/` | Teaching it a task | Upstream docs/tasks.md |
| `/docs/migrating/` | Migrating a System One client | Upstream docs/migrating.md when the pinned tag has it; until then a short site page built from docs/api.md's wire-format facts |
| `/docs/operating/` | Deploying and operating | Upstream docs/running.md "Checking a server" and "When the engine dies" (from the release after v0.7.1), docs/api.md "GET /health", SECURITY.md, and deploy/ when the tag has it |
| `/docs/upgrading/` | Upgrading | Upstream docs/upgrading.md, whole (what changes for a running deployment from one release to the next; from v0.10.0) |
| `/docs/evaluation-card/` | The evaluation card | Upstream EVAL_CARD.md, whole |
| `/docs/demos/` | Demos, judged decision by decision | Upstream docs/demos/README.md, under `docs/CONTENT_RULES.md` |
| `/docs/faq/` | Questions | Site-written questions; each answer a pointer or an upstream section (README "How it works", "Teach it your question", "Licence", "Contributing"; docs/cli.md "Determinism"; SECURITY.md) |
| `/docs/releases/` | Releases | Upstream CHANGELOG.md at the tag (generated by release-please, rendered as it is) |

## Every page

- Header: the project name, Docs, Benchmarks, Demos, GitHub, search, theme switch.
- Footer: "Decisio is an independent open-source project, not affiliated with or endorsed by TypeSafe. Jev is TypeSafe's product name.", the licence, the pinned decisio tag the docs were built from, GitHub, PyPI.
- `sitemap-index.xml`, `robots.txt`, a canonical URL, Open Graph and Twitter card tags with decisio's social preview image, and JSON-LD (`SoftwareSourceCode` on the home page, `TechArticle` on docs pages, `BreadcrumbList` everywhere below the home page).

## Docs groups

The sidebar, `llms.txt` and `llms-full.txt` share `src/config/docs-groups.mjs`: Start (Overview, Choose your machine, Your first request); Use it from (Ways in, the HTTP API, Migrating, Teaching it a task); Run it (the five quickstart paths, Flags and options, Deploying and operating, Upgrading); Understand (How it works, Choosing a base, the evaluation card, Demos, Questions, Releases).
Reference pages (the API, the flags) render from decisio's own docs folder with `::upstream`, so decisio's changes there reach the site on the next bump; each page's footer links its source file on GitHub.
`llms.txt` and `llms-full.txt` are written after the build by `scripts/llms.mjs` from the built pages and checked by `scripts/checks/llms.mjs`.
