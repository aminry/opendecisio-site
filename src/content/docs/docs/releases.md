---
title: Releases
description: What changed in each release.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The changelog below is decisio's CHANGELOG.md at the pinned release. -->

The changelog lists every change in every release; [Upgrade notes](/docs/upgrade-notes/) is the shorter list of the ones that change what a deployment serves.

::figure{name="release-timeline"}

## TL;DR

To see which release you have, ask the installed package, from the decisio checkout the server runs from:

```bash
uv run python -c "from importlib.metadata import version; print(version('decisio'))"
# the release number, such as 0.11.1
```

:::glossary

| Word | Meaning |
| --- | --- |
| release | a tagged version of decisio, with its images on `ghcr.io/aminry/decisio` and its changelog entry |
| changelog | `CHANGELOG.md`, every change in every release, newest first |
| pinned | the release these pages are built from, named in the footer |

:::

## The changelog

::upstream{file="CHANGELOG.md"}

## What next

- [Upgrade notes](/docs/upgrade-notes/): what changes for a running deployment between releases.
- [Choosing a base](/docs/bases/): what the default base is, and when it changed.
- [The evaluation card](/docs/evaluation-card/): what each release was measured on.
