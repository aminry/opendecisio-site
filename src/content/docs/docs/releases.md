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

## The latest release: 0.52.0

Released on 2026-11-21.
A taught task's calibration now works on top of the temperature the server serves its question at, so its probabilities are as calibrated as an untaught question's.

**0.52.0**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.52.0)

- **Fixed:** a task that keeps calibration is fitted and served on top of the server's temperature; before, it was fitted at temperature 1 and its probabilities were overconfident.
- **Register those tasks again:** a calibration fitted at another temperature is not applied, so until a task is registered again with the same body its questions are answered as without the task, and not certified. `/health` lists them under `calibration_refit` ([Upgrade](/docs/upgrading/)).
- Tasks whose intent head is kept, and tasks whose calibration was declined, are unchanged.

## The earlier release summary: 0.51.1 and 0.51.0

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

The upgrade notes below say who is affected, and what to do.

## Upgrade notes

::upstream{file="docs/upgrading.md" depth="3"}

## The changelog

::upstream{file="CHANGELOG.md"}

## What next

- [Upgrade](/docs/upgrading/): the steps of every upgrade.
- [Choosing a model](/docs/bases/): which model is the default, and why.
- [Evaluate a task](/docs/evaluation-card/): check your application after an upgrade.
