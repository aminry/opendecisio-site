# Site map

The documentation sidebar, breadcrumbs and text indexes share `src/config/docs-groups.mjs`.
Every documentation source page must be in that navigation exactly once; `scripts/checks/docs-navigation.mjs` checks for missing, duplicate and moved pages.
The current release is read from `upstream.json`.

## Documentation pages

| `/docs/` | Quickstart |
| `/docs/api/` | HTTP API |
| `/docs/bases/` | Choosing a model |
| `/docs/build-request/` | Build a request |
| `/docs/concepts/questions/` | Choose a question type |
| `/docs/concurrency/` | Batch concurrent requests |
| `/docs/deploy/adapter/` | Serve your own adapter |
| `/docs/deploy/cloud-gpu/` | On a cloud GPU |
| `/docs/deploy/development/` | For development (CPU) |
| `/docs/deploy/docker/` | With Docker |
| `/docs/deploy/mac/` | On a Mac or a laptop |
| `/docs/deploy/tuned-12b/` | Serve the tuned 12B |
| `/docs/evaluation-card/` | Evaluate your task |
| `/docs/flags/` | Server flags |
| `/docs/glossary/` | Glossary |
| `/docs/how-it-works/` | How it works |
| `/docs/images/` | Ask about images |
| `/docs/introduction/` | What is decisio? |
| `/docs/layout/` | Choose the prompt layout |
| `/docs/limits/` | Requirements and limits |
| `/docs/migrating/` | Move from System One |
| `/docs/operating/` | Operate |
| `/docs/releases/` | Release notes |
| `/docs/scale/` | Scale |
| `/docs/tasks/` | Teach a task |
| `/docs/tasks/certify/` | Certify answers |
| `/docs/tasks/context/` | Send a fixed text once |
| `/docs/tasks/drift/` | Watch for drift |
| `/docs/tasks/dynamic/` | Teach a task whose options change |
| `/docs/tasks/fast-table/` | Answer short tasks faster |
| `/docs/think/` | Think when unsure |
| `/docs/troubleshooting/` | Troubleshoot |
| `/docs/upgrading/` | Upgrade |
| `/docs/use-cases/` | Use cases |
| `/docs/use-cases/document-classification/` | Document classification |
| `/docs/use-cases/gatekeeper/` | Coding-agent gatekeeper |
| `/docs/use-cases/guardrails/` | Guardrails |
| `/docs/use-cases/issue-triage/` | Issue triage |
| `/docs/use-cases/rag-gate/` | "RAG: answer or abstain" |
| `/docs/use-cases/support-routing/` | Support routing |
| `/docs/use-from/` | Call it from your code |

## Other pages

| Route | Purpose |
| --- | --- |
| `/` | What you can build, how to start, and links to documentation |
| `/benchmarks/` | Dated measurements and their sources |
| `/demos/` | Recorded examples and links to application recipes |
| `/demos/teach-and-certify/` | Interactive teaching, certification and drift demonstration |
| `/articles/` | Links to historical articles at their original canonical publications |
| `/news/` and `/news/<slug>/` | Dated releases, results and announcements |
| `/privacy/` | Operator, analytics and browser storage |
| `/404/` | Navigation back from a missing page |

`src/config/redirects.mjs` holds the permanent redirects; `scripts/checks/redirects.mjs` verifies their targets and prevents chains.
Old fragment identifiers remain in rewritten pages so published deep links still resolve.

## Discovery and feeds

- `llms.txt`, `llms-full.txt` and each documentation page's `index.md` are generated from the built pages in sidebar order.
- `sitemap-index.xml`, its sitemap and `robots.txt` describe canonical routes.
- `articles/rss.xml` and `news/rss.xml` publish the two feeds.
- Historical articles keep their original canonical destinations.
