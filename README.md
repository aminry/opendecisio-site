# opendecisio-site

The source of opendecisio.com, the website and documentation of [Decisio](https://github.com/aminry/decisio).

The documentation is built from the decisio repository at the release pinned in `upstream.json`, so it describes exactly that release.

## Working on it

Node 22 and `npm ci`, then:

| Command | What it does |
| --- | --- |
| `npm run dev` | fetches the pinned release and serves the site with live reload |
| `npm run build` | fetches the pinned release and builds `dist/` |
| `npm run preview` | serves `dist/` on `https://127.0.0.1:4321` as Cloudflare would: HTTPS, its `_headers`, compression, 404 page (the certificate is self-signed unless `TLS_CERT` and `TLS_KEY` name real ones) |
| `node scripts/checks/content.mjs` | checks `dist/` against `docs/CONTENT_RULES.md` |
| `node scripts/checks/contrast.mjs` | checks the colour tokens against WCAG 2.2 AA |
| `node scripts/checks/links.mjs [--external]` | every internal link and anchor resolves; with `--external`, every external link answers |
| `node scripts/checks/browser.mjs` | every page in Chromium, WebKit and Firefox, at phone, tablet and desktop, light and dark: WCAG 2.2 AA (axe), no CSP violation, failed request or console error, no layout shift, keyboard reach, sized media, search; screenshots in `.browser/` (`ENGINES=webkit` for one engine) |
| `node scripts/checks/lighthouse.mjs` | Lighthouse 95 or better in all four categories on the home, a docs, the benchmarks and the demos page |
| `node scripts/checks/claims.mjs` | no rank and no comparison on any built page |
| `node scripts/checks/internal.mjs [--dist]` | nothing internal in the tracked files (or, with `--dist`, in the built pages, decisio's rendered docs included): no private records, working groups, local paths, email addresses or tokens |
| `npm run media` | records the release's clips and makes their posters (needs ffmpeg) |
| `npm run verify` | runs every published command on the CPU stand-in from a fresh clone of the release (needs uv, git and a free port 8000) |
| `node scripts/verify-ollama.mjs` | runs the blocks that need Ollama against the Ollama on this machine, with the listings as published, and writes `verification/ollama.json` (needs Ollama at the version the docs require and the model pulled); `node scripts/checks/ollama-listing.mjs` then checks in CI that the listings have not changed |

`npm run verify` needs port 8000 free; where it is not, run it in the image in `verification/`:

```
docker build -t site-verify verification
docker run --rm -v "$PWD":/site -v site-verify-cache:/root/.cache -e VERIFY_WORK=/work site-verify node scripts/verify-commands.mjs
```

## Previewing on another device

The production headers send every request over HTTPS (`upgrade-insecure-requests`, HSTS), so a preview must be served over HTTPS too, or Safari, and every browser on a name other than `localhost`, loads the page without its styles, scripts and fonts.
On a machine in a Tailscale network, `tailscale cert <machine name>` issues a trusted certificate:

```
tailscale cert my-mac.example.ts.net
TLS_CERT=my-mac.example.ts.net.crt TLS_KEY=my-mac.example.ts.net.key HOST=0.0.0.0 node scripts/serve.mjs 8443
```

Then open `https://my-mac.example.ts.net:8443/` on any device in the network.

## How it fits together

- `upstream.json`: the decisio release, by tag and commit; `scripts/fetch-upstream.mjs` checks the tag still points at the commit and fetches it into `.upstream/`.
- `src/content/docs/`: the docs pages, mostly `::upstream{file section}` directives that pull whole sections of decisio's files (`src/lib/remark-upstream.mjs`).
- `verification/plan.mjs` and `verification/commands.json`: how each published code block was checked; the build stops on a block nobody has checked at the pinned release.
- `src/lib/site-blocks.mjs`: the few code blocks the site writes itself, where decisio's docs have none (the Ollama request), shown with `::site-block{name}` and checked like the rest (`verification/ollama.json` for the Ollama ones).
- `src/data/media.json` and `public/posters/`: the release's clips by sha256, and their posters.
- `.github/workflows/bump-decisio.yml`: opens a pull request when decisio releases.
- `scripts/headers.mjs`: writes `dist/_headers`, the Content-Security-Policy (the build's inline scripts and styles allowed by hash) and the security headers.
- `src/config/site.ts`: the project's name and addresses.

## Decisions and rules

- `docs/adr/`: the stack and the hosting.
- `docs/SITEMAP.md`: every page and where its content comes from.
- `docs/CONTENT_RULES.md`: the rules every page follows.
- `docs/BRANCH_RULES.md`: no stacked pull requests, and the ruleset that makes the CI jobs required on `main`.
- `docs/POSTS.md`: how to add an article or a news post.

## Licence and security

Apache-2.0 (`LICENSE`); `NOTICE` credits the site whose design techniques it adapts.
Report a security problem privately, as `SECURITY.md` says.
