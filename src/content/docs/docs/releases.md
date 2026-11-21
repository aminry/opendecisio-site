---
title: Release notes
description: What changed in each release.
---

<!-- Site-written: the intro, the command, the summaries of the latest releases and the links. The upgrade notes are decisio's docs/upgrading.md and the changelog its CHANGELOG.md, at the pinned release: the site's one page of version history. -->

Every change in every decisio release, newest first, and for the releases that change what a deployment serves, who is affected and what to do.
After upgrading, certify your tasks again ([Upgrade](/docs/upgrading/)).
To see which release a checkout has:

```bash
uv run python -c "from importlib.metadata import version; print(version('decisio'))"
```

::figure{name="release-timeline"}

## The latest releases: 0.51.1 and 0.51.0

Released on 2026-11-20 and 2026-11-21.
They add a date and time block and a second reader to the calculator, which a tuned repository can turn on by itself, as Decisio v3 does.

**0.51.1**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.51.1)

- **Fixed:** a server shows the cascade reader's blocks again; in 0.51.0 every reading the tagger took failed, so only the rule reader's blocks and the date and time block appeared.
- **A failure the cascade turns into no block is logged** at warning level.

**0.51.0**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.51.0)

- **A date and time block, `time-v1`:** zoned times in UTC, the real time between two of them, and dates N days, months or years on, for a model trained with it ([Exact arithmetic](/docs/calculator/#which-dates-and-times-does-it-read)).
- **The cascade reader:** a role tagger behind precision gates shows a block for wordings and layouts the rule reader has no rule for ([how it reads](/docs/calculator/#how-does-the-cascade-reader-read-more)).
- **A tuned repository can turn the cascade reader on** with its tagger and thresholds, and a tagger that cannot be loaded no longer stops the start.
- **Two small bases,** `qwen3.5-4b` and `gemma-4-e4b`, on the vLLM server ([Choosing a model](/docs/bases/#the-small-bases)).

## The earlier release summary: 0.50.2 to 0.49.0

Released on 2026-11-17 and 2026-11-18.
They add a declared question list for the header layout and exact arithmetic support, both opt-in.

**0.50.2**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.50.2)

- **Fixed:** the calculator shows no block for counts with a multiplier or a number word, or for a unit factor across kinds of unit.

**0.50.1**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.50.1)

- **Fixed:** a defaults key this decisio does not know in a repository is ignored with a warning, not refused.

**0.50.0**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.50.0)

- **Exact arithmetic support:** a model trained with it reads exact line values for a state's arithmetic, in a fixed block after the state. It is opt-in per model ([Exact arithmetic](/docs/calculator/)).

**0.49.0**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.49.0)

- **`header_questions`:** a client declares the question list the header carries, so separate requests about one state share the header and the state is read once ([Choose the prompt layout](/docs/layout/#how-do-you-keep-the-header-for-a-series-of-questions)).
- **A note when the header layout reads a state again:** the response header `x-decisio-note` says so, and `/health` counts it.

The upgrade notes below say who is affected, and what to do.

## Upgrade notes

::upstream{file="docs/upgrading.md" depth="3"}

## The changelog

::upstream{file="CHANGELOG.md"}

## What next

- [Upgrade](/docs/upgrading/): the steps of every upgrade.
- [Choosing a model](/docs/bases/): which model is the default, and why.
- [Evaluate a task](/docs/evaluation-card/): check your application after an upgrade.
