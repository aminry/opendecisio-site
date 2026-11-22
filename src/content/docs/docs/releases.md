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

## The latest release: 0.54.0

Released on 2026-11-22.
A taught task's intent head now reads its hidden state in the question's own request, with no extra request, on every base, and the second-engine head mode is gone.

**0.54.0**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.54.0)

- **Breaking:** `--head-engine` and `--head-gpu-memory-utilization` are removed, and a server started with them refuses to start. Drop the flags ([Upgrade](/docs/upgrading/)).
- **The intent head in the question's own request**, with the engine in the server's process: on Gemma 4 12B about 55 ms of client time per head question ([Teach a task](/docs/tasks/)).
- **Score questions get no intent head;** a score task gets calibration alone.
- **On Gemma 4 12B, from 50 labelled examples,** a task's calibration fits its temperature and bias together.
- **`--hf-device` and `--hf-dtype`** read a model through transformers on a card.

## The earlier release summary: 0.53.0

Released on 2026-11-21.
A task's registration now points at the labelled examples whose label looks wrong, so you can fix them before you rely on the task.

**0.53.0**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.53.0)

- **Label review:** the registration response of a choice or yes/no task carries `label_review`, the examples whose label looks wrong, from answers of the task fitted on the other examples, on Gemma 4 12B and Decisio v3 ([Check the flagged labels](/docs/tasks/#check-the-flagged-labels)). Labels are never changed, and nothing stored changes.
- **A server stopped by SIGTERM stops its engine processes too.**

The upgrade notes below say who is affected, and what to do.

## Upgrade notes

::upstream{file="docs/upgrading.md" depth="3"}

## The changelog

::upstream{file="CHANGELOG.md"}

## What next

- [Upgrade](/docs/upgrading/): the steps of every upgrade.
- [Choosing a model](/docs/bases/): which model is the default, and why.
- [Evaluate a task](/docs/evaluation-card/): check your application after an upgrade.
