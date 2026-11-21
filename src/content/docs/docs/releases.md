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

## The latest release: 0.53.0

Released on 2026-11-21.
A task's registration now points at the labelled examples whose label looks wrong, so you can fix them before you rely on the task.

**0.53.0**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.53.0)

- **Label review:** the registration response of a choice or yes/no task carries `label_review`, the examples whose label looks wrong, from answers of the task fitted on the other examples, on Gemma 4 12B and Decisio v3 ([Check the flagged labels](/docs/tasks/#check-the-flagged-labels)). Labels are never changed, and nothing stored changes.
- **A server stopped by SIGTERM stops its engine processes too.**

## The earlier release summary: 0.52.0

Released on 2026-11-21.
A taught task's calibration now works on top of the temperature the server serves its question at, so its probabilities are as calibrated as an untaught question's.

**0.52.0**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.52.0)

- **Fixed:** a task that keeps calibration is fitted and served on top of the server's temperature; before, it was fitted at temperature 1 and its probabilities were overconfident.
- **Register those tasks again:** a calibration fitted at another temperature is not applied, so until a task is registered again with the same body its questions are answered as without the task, and not certified. `/health` lists them under `calibration_refit` ([Upgrade](/docs/upgrading/)).
- Tasks whose intent head is kept, and tasks whose calibration was declined, are unchanged.

The upgrade notes below say who is affected, and what to do.

## Upgrade notes

::upstream{file="docs/upgrading.md" depth="3"}

## The changelog

::upstream{file="CHANGELOG.md"}

## What next

- [Upgrade](/docs/upgrading/): the steps of every upgrade.
- [Choosing a model](/docs/bases/): which model is the default, and why.
- [Evaluate a task](/docs/evaluation-card/): check your application after an upgrade.
