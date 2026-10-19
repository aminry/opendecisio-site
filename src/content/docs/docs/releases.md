---
title: Release notes
description: What changed in each release.
---

<!-- Site-written: the intro, the command and the links. The changelog below is decisio's CHANGELOG.md at the pinned release. -->

Every change in every decisio release, newest first; [Upgrade notes](/docs/upgrade-notes/) has the ones that change what a deployment serves.
After upgrading, certify your tasks again ([Upgrade](/docs/upgrading/)).
To see which release a checkout has:

```bash
uv run python -c "from importlib.metadata import version; print(version('decisio'))"
```

::figure{name="release-timeline"}

## The changelog

::upstream{file="CHANGELOG.md"}

## What next

- [Upgrade notes](/docs/upgrade-notes/): what changes for a running deployment between releases.
- [Choosing a model](/docs/bases/): which model is the default, and why.
- [Evaluation card](/docs/evaluation-card/): what each release was measured on.
