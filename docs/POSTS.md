# Articles and news

How to add a post to the site.
Articles are longer pieces at `/articles/`; news posts are short announcements at `/news/`.
Each has an RSS feed (`/articles/rss.xml`, `/news/rss.xml`).

## Adding a post
1. Copy `docs/templates/news-post.md` or `docs/templates/article.md` to `src/content/news/<slug>.md` or `src/content/articles/<slug>.md`.
2. Fill in the front matter. The build rejects a title over 110 characters, a description or summary outside 40 to 200 characters, and a missing date; `tags` are optional and show on the card.
3. Write the body in Markdown: context first, then the point; short paragraphs; no em dashes.
4. Open a pull request from main. Cloudflare comments the preview link on it.

## A piece first published elsewhere
- A piece first published on this site is a post page: its canonical link points at its own page. When it is copied to Medium, import it with Medium's import tool, which sets Medium's canonical link to this page.
- A piece first published elsewhere (an existing Medium piece) sets `canonical` to the original's URL and `originalSite` to its name. It has **no page here**: on `/articles/` it is a card that links straight to the original (marked "on Medium"), and in the feed its item links there too. A dated note on the card, if it needs one (that figures have moved, say), is the body's paragraphs after the first, leaving out the one that links to the original; the first paragraph restates the card's summary and is not shown.
- Because it has no page, it is not in the sitemap and no page here competes with the original.

## Rules the build checks (`scripts/checks/posts.mjs`)
- One h1, a canonical link to itself, Article structured data, the post in the sitemap and in its feed, and its label linking to its own section; for a piece that links out, no page, a card that links to the original, and its feed item linking there.
- None of the launch facts' forbidden words outside a quotation, and any wording the facts mark as true of the v1.6.1 JevBench file only says "v1.6.1" in the same sentence.
- No rank and no comparison: `scripts/checks/claims.mjs` reads the posts as it reads every page; a post's body published before that rule is history, marked `data-history`, and is not read.
- No em dash anywhere on the page.
- Numbers come from the pinned release or `src/data/launch/launch_facts.public.json`, as everywhere on the site, in the wording of the facts' `stable_claims` where there is one.
- A code block must be a command the site has run against the pinned release (`verification/plan.mjs`); use prose for anything else.

The link check cannot verify a link to Medium (it answers 403 to automated requests), so it warns instead; open the original's URL yourself before merging.

## How they look
The index pages and the post pages use the home page's system (`src/styles/home.css`, `src/styles/posts.css`): Geist, glass cards with the same radii and offset shadow, accent labels, the same timings, both themes.
The newest post on an index is the larger card; each card is one link (its title); a post shows its date, author and reading time, and two more posts below it.
Motion is a card rising once on load and a lift on hover, and stops under `prefers-reduced-motion`.
With no posts, an index says so and points at the feed and the releases.
