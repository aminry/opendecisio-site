---
title: Release notes
description: What changed in each release.
---

<!-- Site-written: the intro, the command and the links. The upgrade notes are decisio's docs/upgrading.md and the changelog its CHANGELOG.md, at the pinned release: the site's one page of version history (Amin, 2026-10-19). -->

Every change in every decisio release, newest first, and for the releases that change what a deployment serves, who is affected and what to do.
After upgrading, certify your tasks again ([Upgrade](/docs/upgrading/)).
To see which release a checkout has:

```bash
uv run python -c "from importlib.metadata import version; print(version('decisio'))"
```

::figure{name="release-timeline"}

## Upgrade notes

::upstream{file="docs/upgrading.md" depth="3"}

## The changelog

::upstream{file="CHANGELOG.md"}

## What next

- [Upgrade](/docs/upgrading/): the steps of every upgrade.
- [Choosing a model](/docs/bases/): which model is the default, and why.
- [Evaluation card](/docs/evaluation-card/): what each release was measured on.
