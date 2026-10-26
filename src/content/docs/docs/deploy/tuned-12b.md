---
title: Serve the tuned 12B
description: Run the tuned Gemma 4 12B from its Hugging Face repository with one command, with honest probabilities or with committed yes/no answers.
---

<!-- Site-written: the Serve the tuned 12B guide. The repositories, revisions, served names and settings are the published repositories' and decisio's docs/running.md ("Flavors") at the pinned release; the accuracy figures are the announcement's held-out table. -->

The tuned 12B is Gemma 4 12B with a fine-tuned adapter merged into its weights, stored in bf16.
It is right more often than the untrained 12B on hard decisions with rules, exceptions and arithmetic, and about the same elsewhere ([the announcement](/news/tuned-12b/)).
Each repository holds the weights and their settings, so one flag serves it:

::site-block{name="tuned-start"}

## 1. Pick the repository

Both repositories hold the same weights; only their settings differ.

- **`tachara-ai/Decisio-12b-tuned-calibrated`**, revision `baa731aa`, gives honest probabilities: calibrated temperatures for every question type, yes/no included, the header layout, and no commit rule, thinking or read twice.
- **`tachara-ai/Decisio-12b-tuned-commit`**, revision `245e00dc`, commits yes/no answers: the same temperatures and layout with the commit rule, so no yes/no answer sits between 0.20 and 0.80. It changes no answer.

## 2. Start it

- **It needs a GPU with room for about 24 GB of bf16 weights.** It was measured on one RTX PRO 6000.
- **`--base owner/name@revision`** takes the repository's weights and its settings; no other flag is needed. The first start downloads the weights.
- **A flag you give still applies,** and is recorded as an override, as on [a flavor](/docs/bases/#5-serve-a-flavor).

## 3. Check what it serves

`GET /v1/models` and `/health` report the served name, `Decisio-12b-tuned-calibrated` or `Decisio-12b-tuned-commit`.

## 4. Teach and certify on it

Tasks and certificates are per model and per flavor: register and certify your tasks again on the tuned 12B, as on [Teach a task](/docs/tasks/).

## 5. Know what is not there yet

- **No Mac or FP8 version yet, and no Ollama version is planned.** The tuned 12B runs on an NVIDIA card in bf16.
- **Its accuracy was measured in bf16** against the untrained 12B on held-out items; the figures and their limits are in [the announcement](/news/tuned-12b/).

## What next

- [Choosing a model](/docs/bases/): the untrained models and their flavors.
- [Teach a task](/docs/tasks/): fit your own task on the tuned 12B.
- [Requirements and limits](/docs/limits/#1-pick-your-machine): the machine it needs.
