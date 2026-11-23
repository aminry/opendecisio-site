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

## The latest release: 0.56.0

Released on 2026-11-23.
A certificate from traffic labels is recomputed when you erase an answer from its cohort.

**0.56.0**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.56.0)

- **Traffic certificates:** The old certificate is withdrawn at once. An erased answer counts as wrong at confidence 1. Answers that age out under `ttl_days` are dropped, and the certificate is recomputed on the smaller cohort.
- **Label records:** Erase events keep a keyed digest of the request ID. Fit records identify the labels they used by keyed digest.
- **Average error (FDR):** Opt in to a signed HTTPS callback for each closed window's marks.
- **Images:** The image route accepts only PNG, JPEG and WebP.
- **Small base:** Gemma 4 E4B support is removed. Use `--base qwen3.5-4b` and register your tasks again for the new model.
- **Serving engine:** The serving image uses vLLM 0.31.0.

## The earlier release summary: 0.55.0

Released on 2026-11-23.
A task can now collect labels from its own traffic, opt-in, and be certified from them, so its accuracy is measured and its certificate checked on the requests it really serves.

**0.55.0**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.55.0)

- **Labels from traffic, opt-in at registration:** nothing is logged per request unless a task registers with a `labels` block. The server draws which answers to ask about, and you post labels by request id or by a digest of the input ([API](/docs/api/#tasks)).
- **Certification from traffic labels**, the default for a task that takes labels.
- **Average error (FDR):** an opt-in mode that marks windows of answers with an average-error promise and never certifies them.
- **Erasure and a label monitor:** erase one request's logged answers and labels, or everything before a time; the monitor reads the labels against the certificate.
- **Fast tables:** under `auto` the static student is kept unless the encoder saves more than 10 points more, and a certified live table is judged on whole-request time.
- **On Gemma 4 12B,** score tasks of 3 to 4 and of 10 or more levels get the evidence-averaged calibration, and two-option choice tasks get no label review.

The upgrade notes below say who is affected, and what to do.

## Upgrade notes

::upstream{file="docs/upgrading.md" depth="3"}

## The changelog

::upstream{file="CHANGELOG.md"}

## What next

- [Upgrade](/docs/upgrading/): the steps of every upgrade.
- [Choosing a model](/docs/bases/): which model is the default, and why.
- [Evaluate a task](/docs/evaluation-card/): check your application after an upgrade.
