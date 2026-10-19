# Site map

Every page, its route, and where its content comes from.
"Upstream" means the decisio repository at the tag pinned in `upstream.json` (v0.7.1 today); a section named after a file is included whole, by heading.
"Site" means prose written for the site, which never carries a number of its own.

## Pages

| Route | Page | Content |
| --- | --- | --- |
| `/` | Home | Site layout; every fact and number from upstream; the hero's lead claim, with its qualifiers beside it (level means the intervals overlap, the board ran v0.8.0, the 31B needs a 96 GB card or a 64 GB Mac, or a 48 GB Mac from its 4-bit conversion), and the JevBench chart from `launch_facts.public.json`; a "Why Decisio" row of five lines under the hero (numbers from `head_to_head.jev` and the README's row on several questions in one request); "JevBench, axis by axis" (the board's four-axes chart, every number in a table that starts closed); no comparison table and no where-it-is-behind section, which are on /benchmarks; the demo reel; "How it works" (Amin's explainer picture, corrected copy, captioned as an illustration with example probabilities); the explainer card is the og:image; the laptop path (Ollama) right after the hero, its request site-written and run against the listing |
| `/benchmarks/` | Benchmarks | Upstream README "Benchmarks" and "Choosing a base" tables, EVAL_CARD section 5's limits and section 8's self-runs; a JevBench section from `launch_facts.public.json` (the board's rows, the claims that hold, the frozen-weights rows); "How Decisio compares" from docs/comparison.md, where Jev and the other entries appear, with the JevBench section's board rows (below) (the headline as a scores table and a table of facts per system, the capabilities as the questions a buyer asks, with a sources link per row, every benchmark by area; no closing paragraph on where Jev leads); "JevBench, axis by axis" inside the JevBench section; Jev's GPQA Diamond board field from EVAL_CARD 8.1 in its source line |
| `/articles/`, `/articles/<slug>/` | Articles | Markdown in `src/content/articles/` (docs/POSTS.md): longer pieces; a piece first published elsewhere points its canonical link at the original and stays out of the sitemap; `/articles/rss.xml` |
| `/news/`, `/news/<slug>/` | News | Markdown in `src/content/news/` from the template in `docs/templates/news-post.md`; `/news/rss.xml` |
| `/demos/` | Demos | A featured card for /demos/teach-and-certify/ (one measured number from its data), then upstream docs/demos/README.md "Watch it play" and "Results", the Decisio clips from docs/demos/media at the tag; Jev and the hosted models as aggregates only |
| `/demos/teach-and-certify/` | Teach and certify, linked from /demos/ | src/data/teach-certify/teach_certify.json: the teach-and-certify runs on decisio 0.14.0 (two intent sets, two bases), checked by src/lib/teach-certify.mjs; the inbox, the share automated, the 200 re-splits, the drift replay with its fix, and the coding-agent gatekeeper |
| `/privacy/` | Privacy | Site: who runs the site (Tachara LLC), what Cloudflare Web Analytics counts, that no personal data is sold or shared, and that the site sets no cookies; linked from every footer |
| `/docs/` | Get started | Site-written: the machine table, the CPU stand-in from a clone of the pinned release, the first recorded decision and its answer; `/docs/quickstart/` and `/docs/first-request/` redirect to its sections |

## Documentation

| Route | Section | Content |
| --- | --- | --- |
| `/docs/use-from/` | Call it from your code | Site-written: the recorded request from curl, Python, TypeSafe's SDK, JavaScript and TypeScript (`src/lib/site-blocks.mjs`), errors and timeouts (`src/config/sourced.mjs`), the integrations table (`src/data/integrations.json`) and decisio's programs from docs/integrations.md; the Python, JavaScript and Frameworks pages redirect here |
| `/docs/how-it-works/` | How it works | Site-written text around four diagrams drawn at build time from launch_facts.public.json and the README (src/lib/diagrams.mjs): the request flow, the cache timeline, the routing threshold and the bases |
| `/docs/use-cases/` and six recipes | Use cases | Site-written recipes (support routing, coding-agent gatekeeper, issue triage, guardrails, RAG: answer or abstain, document classification): each one's question, routing script and registration from `src/lib/use-cases.mjs`, and its measured result read from the teach-and-certify runs, EVAL_CARD.md and docs/demos/README.md; issue triage and document classification are labelled recipes |
| `/docs/deploy/cloud-gpu/` | On a cloud GPU | Site-written: the pinned pip install and clone, decisio's model-repository pin, systemd unit (docs/operating.md) and Kubernetes Deployment with the release image (`src/lib/site-blocks.mjs`); numbers in `src/config/sourced.mjs`; `/docs/quickstart/gpu-server/` redirects here |
| `/docs/deploy/docker/` | With Docker | Site-written: the release image by digest (`upstream.json`), decisio's compose file run from it, the settings and the build from a clone; `/docs/quickstart/docker/` redirects here |
| `/docs/deploy/mac/` | On a Mac or a laptop | Site-written: the MLX builds per Mac size, the memory planner, and Ollama with the site-written request; `/docs/quickstart/mac-mlx/` and `/docs/quickstart/ollama/` redirect here |
| `/docs/deploy/development/` | For development (CPU) | Site-written: the CPU stand-in, with Get started's commands; `/docs/quickstart/cpu-stand-in/` redirects here |
| `/docs/bases/` | Choosing a base | Upstream README "Choosing a base", with each base's provenance |
| `/docs/api/` | Asking questions: the HTTP API | Upstream docs/api.md |
| `/docs/flags/` | Flags and options | Upstream README "Options", then docs/cli.md |
| `/docs/tasks/` | Teach a task | Site-written steps around docs/tasks.md's walk-through blocks; what teaching did on the 31B from EVAL_CARD.md section 7.2 (`src/lib/teach.mjs`) |
| `/docs/tasks/certify/` | Certify answers | Site-written: the certify slider on the support inbox (`src/data/teach-certify/`), docs/tasks.md's worked example, the floor table, the setup steps, the threshold picked by hand and abstention; `/docs/guides/probability/` redirects here |
| `/docs/tasks/drift/` | Watch for drift | Site-written: the three checks, the status and the metrics, from docs/tasks.md "The monitor"; the drift replay chart from runs/2026-10-17_drift-monitor/ |
| `/docs/migrating/` | Move from System One | Site-written steps around docs/migrating.md's two blocks; the differences from docs/api.md "Where this route differs from System One" (`src/config/sourced.mjs`) |
| `/docs/operating/` | Operate | Site-written: the supervisor table, what to watch, what happens when the engine dies (the server-life figure, timings from docs/running.md), tasks across restarts, and the security steps from SECURITY.md; `/docs/health/` redirects here |
| `/docs/upgrading/` | Upgrade | Site-written: the eight steps of every upgrade, with the export, the re-certify call and the check |
| `/docs/upgrade-notes/` | Upgrade notes | Upstream docs/upgrading.md, whole |
| `/docs/scale/` | Scale | Site-written: many questions in one request, the first read by text length (docs/running.md's table, `::latency-table`), long texts, long option lists, the flags that move server time; the three guides it merges redirect here |
| `/docs/troubleshooting/` | Troubleshoot | Site-written tables of symptoms by situation, each row guarded by the sentence of decisio's docs it rests on (`src/lib/figures/run-it.mjs`) |
| `/docs/images/` | Ask about images | Site-written: the image server's start, the limits table, what an image costs, what it does not do; `/docs/guides/images/` redirects here |
| `/docs/limits/` | Requirements and limits | Site-written: the machines, the context length, the production setup steps, what was measured on what, repeatability and what was not tested; every number in `src/config/sourced.mjs` |
| `/docs/evaluation-card/` | The evaluation card | Upstream EVAL_CARD.md, whole |
| `/docs/demos/` | Demos, judged decision by decision | Upstream docs/demos/README.md, under `docs/CONTENT_RULES.md` |
| `/docs/faq/` | Questions | Site-written questions; each answer a pointer or an upstream section (README "How it works", "Teach it your question", "Licence", "Contributing"; docs/cli.md "Determinism"; SECURITY.md) |
| `/docs/glossary/` | Glossary | Site-written: the style guide's glossary, linked from pages on a word's first use |
| `/docs/releases/` | Releases | Upstream CHANGELOG.md at the tag (generated by release-please, rendered as it is) |

## Every page

- Header: the project name, Docs, Benchmarks, Demos, GitHub, search, theme switch.
- Footer: "Decisio is an independent open-source project, not affiliated with or endorsed by TypeSafe. Jev is TypeSafe's product name.", the licence, the pinned decisio tag the docs were built from, GitHub, PyPI.
- `sitemap-index.xml`, `robots.txt`, a canonical URL, Open Graph and Twitter card tags with decisio's social preview image, and JSON-LD (`SoftwareSourceCode` on the home page, `TechArticle` on docs pages, `BreadcrumbList` everywhere below the home page).

## Docs groups

The sidebar, `llms.txt` and `llms-full.txt` share `src/config/docs-groups.mjs`, grouped as the docs rewrite's structure has them: Get started (Get started, Call it from your code, Move from System One); Use cases (the index and six recipes); How-to guides (the four deploy guides, Teach a task, Certify answers, Watch for drift, Scale, Operate, Upgrade, Troubleshoot, Ask about images); Reference (HTTP API, Flags, Bases, Requirements and limits, Glossary, Releases, Upgrade notes, the evaluation card, How Decisio compares, Questions); How it works (How it works, What the probability means, Repeatability, Demos).
Reference pages (the API, the flags) render from decisio's own docs folder with `::upstream`, so decisio's changes there reach the site on the next bump; each page's footer links its source file on GitHub.
`llms.txt` and `llms-full.txt` are written after the build by `scripts/llms.mjs` from the built pages and checked by `scripts/checks/llms.mjs`.
