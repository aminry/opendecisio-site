# ADR 0001: Astro with Starlight, docs built from a pinned decisio tag

Status: accepted, 2026-10-05.

## Context

opendecisio.com is a small public site: a home page, a benchmarks page, a demos page and a documentation section.
The documentation is the core, and it must not drift from the code it describes.
The decisio repository already holds tested Markdown (README.md, EVAL_CARD.md, docs/, docs/demos/), and its defaults can change from one release to the next.
The site's repository is private until launch, its host must serve custom headers, and CI must stay inside the free minutes of a private repository.

## Decision

1. **Astro 7 with Starlight 0.42** for the whole site, as the maintainer proposed.
   Starlight gives the documentation section its navigation, Pagefind search (built at build time, no service), light and dark themes, accessible defaults and MDX.
   The home, benchmarks and demos pages are plain Astro pages that share Starlight's tokens, so there is one design system and one build.
2. **No client-side framework.**
   Every page is static HTML and CSS.
   The only scripts are Starlight's own (theme switch, search, mobile menu) and one small module that plays a demo clip when it scrolls into view.
3. **The docs come from decisio at a pinned release tag, fetched at build time.**
   `upstream.json` names the repository, the tag and the commit the tag must resolve to.
   The build downloads that tag's source archive, refuses to continue if the commit differs, and reads its Markdown.
   Site pages pull whole sections of the upstream files by heading, so every command, code sample, table and number on a docs page is upstream text at that tag.
   The site writes its own prose only where the repository has no page (the FAQ, the section introductions, the switched-off hosted places), and every such page says so in its source.
   Links into upstream files are rewritten to the site's page when the site renders that file, and to the file on GitHub at the pinned tag otherwise.
4. **A scheduled workflow opens a PR when decisio releases.**
   It reads the latest release, and if its tag differs from `upstream.json` it opens a PR bumping the tag and commit; the PR's checks then build every page from the new tag, and the maintainer reviews the rendered preview.
5. **Commands are checked against the CPU stand-in.**
   A workflow, run on every tag bump and on demand, checks out decisio at the pinned tag, starts the CPU stand-in (`--backend hf`, Qwen3-0.6B-Base) and runs each published command and request that the stand-in can serve.
   A command that needs a GPU or a Mac is marked on the page as taken verbatim from the repository's tested docs, with the run record it names.
6. **The project name is one configuration value** (`src/config/site.ts`, `name`); every page, title, header and structured-data block reads it.

## Why not the alternatives

- **Docusaurus**: a React application on every page, larger bundles, and harder to reach Lighthouse 95 with no client framework.
- **MkDocs Material**: good docs, but its authors have moved to a successor project, and its marketing pages would be a second system in Python and Jinja.
- **VitePress or Nextra**: each brings a client framework (Vue, React) that no page needs.
- **Copying the docs into this repository**: drifts the day decisio changes a default; the pinned tag makes every change a reviewed PR instead.
- **A git submodule**: pins as well, but hides the pin in a gitlink, needs every checkout and host build to fetch submodules, and brings the whole history into each; one JSON file with a verified commit is simpler to review.

## Consequences

- A build needs network access to github.com (the archive); the archive is cached in CI by tag.
- Upstream headings are part of the site's interface: a renamed heading fails the build with the file and heading named, which is the intended signal on a tag bump.
- When an upstream page gains a section the site does not include, the build reports it, so nothing new is silently left out.

## Addendum, 2026-10-15

The repository is now public, so CI runs on GitHub's free minutes for public repositories.
