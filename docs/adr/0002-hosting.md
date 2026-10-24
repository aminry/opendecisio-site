# ADR 0002: Cloudflare Workers static assets for hosting

Status: accepted, 2026-10-05.

## Context

The site is public and its repository private.
The host must deploy from a private GitHub repository with access to that one repository only, build a preview for every PR, serve custom headers (a strict Content-Security-Policy, HSTS and the rest), and serve opendecisio.com with opendecisio.dev redirecting to it (opendecisio.ai waits, 2026-10-05).
The site is static: about 30 pages, 40 MB of demo clips, no server code.

Facts checked on 2026-10-05:
- opendecisio.com is registered at Squarespace Domains, on Squarespace's name servers, showing Squarespace's parking page; its only records are the parking A records, `www` to Squarespace, and `v=spf1 -all` (no mail).
- opendecisio.ai and opendecisio.dev are not registered: the .ai registry answers "Domain not found" and the .dev registry has no delegation.

## Decision

Cloudflare Workers with static assets, deployed by Workers Builds from the private repository through Cloudflare's GitHub app, installed on this repository only.

- **Headers**: a `_headers` file in the build output, served without running any Worker code, so the CSP and security headers are versioned with the site.
- **Previews**: Workers Builds builds every non-production branch and posts its preview URL on the PR.
- **Cost**: static asset requests are free and unlimited; the free plan has 3,000 build minutes a month, one build at a time, a 20-minute build limit, 20,000 files and 25 MiB per file (the largest clip is 4.2 MB).
- **Domains**: both zones on one free Cloudflare account; the .dev zone carries one redirect rule to `https://opendecisio.com` with the path kept. A later .ai zone is the same one rule.
- **CI minutes**: the host builds on Cloudflare's minutes, so GitHub Actions only runs the checks.

## Why not the alternatives

- **GitHub Pages**: serves no custom headers at all (a CSP only as a meta tag, no HSTS, no `frame-ancestors`), whatever the plan; it also serves private repositories only on Pro, Team or Enterprise.
  Out on headers alone.
- **Cloudflare Pages**: the same network and `_headers`, and still supported, but Cloudflare now puts new work into Workers static assets and recommends it for new projects.
- **Netlify**: good previews and headers, but its free plan is metered in credits per deploy and per GB, so a busy launch week or many PR previews can exhaust it.
- **Vercel**: its free Hobby plan is for non-commercial use only.

## Consequences

- opendecisio.com's name servers move from Squarespace to Cloudflare (the registration can stay at Squarespace).
  Nothing is lost: the zone has no mail and nothing else in use.
- opendecisio.dev must be registered first; Cloudflare Registrar sells it at cost. (.ai, when it comes, has a two-year minimum term, set by its registry.)
- A Worker name and the `wrangler.jsonc` file live in this repository; the Worker has no script, only assets.

## Addendum, 2026-10-15

The repository is now public.
It was recreated from the site's tree as a fresh repository with no history; the private one is archived.
Workers Builds deploys from the public repository through the same GitHub app, installed on this repository only.
