---
title: Serve the tuned 12B
description: Run the tuned Gemma 4 12B from its Hugging Face repository with one command, on a GPU, in FP8 or on a Mac, with honest probabilities or with committed yes/no answers.
---

<!-- Site-written: the Serve the tuned 12B guide. The repositories, revisions, served names and settings are the published repositories' and decisio's docs/running.md ("Flavors") at the pinned release; the accuracy figures are the announcement's held-out table. -->

The tuned 12B is Gemma 4 12B with a fine-tuned adapter merged into its weights, stored in bf16.
It is right more often than the untrained 12B on hard decisions with rules, exceptions and arithmetic, and about the same elsewhere ([the announcement](/news/tuned-12b/)).
Each repository holds the weights and their settings, so one flag serves it:

::site-block{name="tuned-start"}

## 1. Pick the repository

All three repositories hold the same weights; only their settings differ.

- **`tachara-ai/Decisio-12b-tuned-calibrated`**, revision `baa731aa`, gives honest probabilities: calibrated temperatures for every question type, yes/no included, the header layout, and no commit rule, thinking or read twice.
- **`tachara-ai/Decisio-12b-tuned-commit`**, revision `245e00dc`, commits yes/no answers: the same temperatures and layout with the commit rule, so no yes/no answer sits between 0.20 and 0.80. It changes no answer.
- **`tachara-ai/Decisio-12b-tuned-commit-think`**, revision `e36aeb24`, adds thinking on choice questions to the commit settings: a choice question whose likeliest option is under 0.3712 is read again after up to 256 tokens of reasoning, and a text longer than 45,000 tokens is cut to its start and answered without thinking.

## 2. Start it

- **It needs a GPU with room for about 24 GB of bf16 weights.** It was measured on one RTX PRO 6000.
- **`--base owner/name@revision`** takes the repository's weights and its settings; no other flag is needed. The first start downloads the weights.
- **A flag you give still applies,** and is recorded as an override, as on [a flavor](/docs/bases/#5-serve-a-flavor).

## 3. Know what thinking adds

On the commit-think repository, against the same model without thinking, on held-out questions:

- **Hard decisions with rules, exceptions and arithmetic** (525): +4.95 points (3.43 to 6.67), with 8.95% of questions thinking. The settings were chosen on these questions, so this figure is optimistic.
- **Decisions in natural, everyday wording** (939, not used to choose the settings): +0.75 points (0.21 to 1.38), with 2.56% thinking.
- **The mixed development set** (430): no question thinks.
- **Time:** the median stayed at 60 ms per decision, and the slowest of 2,044 took 4.71 s.

::source[Measured with decisio 0.33.0 on one RTX PRO 6000 Blackwell at 600 W, 2026-10-26, serving the tuned commit model with the commit-think settings given as flags, from cold starts, one request at a time, on questions screened against our training data.]

## 4. Or serve it in FP8

On a GPU with FP8 support, two more repositories hold the tuned 12B in FP8, 13.1 GB each, with the same two settings:

::site-block{name="tuned-fp8-start"}

- **`tachara-ai/Decisio-12b-tuned-fp8-calibrated`**, revision `d77c2790`, and **`tachara-ai/Decisio-12b-tuned-fp8-commit`**, revision `c41323f0`.
- **It is level with bf16 on the held-out sets,** within a quarter of a point, but gives a different likeliest answer on about 3 to 6 of every 100 questions ([the announcement](/news/tuned-12b/) has the figures).
- **It is quicker:** a median of 100.0 ms of server time per question, against 151.7 ms for bf16.
- **The server emulates bf16 rounding on FP8 by default,** which narrows the difference between two cold starts.

::source[The times: decisio 0.33.0 on one RTX PRO 6000 Blackwell at 600 W, 2026-10-25, 430 questions one request at a time, both with the diagnostic readout on, which adds time to each.]

## 5. Or serve it on a Mac

decisio 0.34.0 or later serves the tuned 12B on a Mac with Apple silicon from its MLX conversions, with the same two settings:

::site-block{name="tuned-mlx-start"}

- **8-bit** (`tachara-ai/Decisio-12b-tuned-mlx8-calibrated` and `-mlx8-commit`, 12.7 GB) gives the bf16 model's likeliest answer on 97.9% of held-out questions, at 69.8% accuracy against 69.9%. It peaks at 14.9 GB with an 8,000-token text and 18.6 GB at 32,000.
- **6-bit** (`-mlx-calibrated` and `-mlx-commit`, 9.7 GB) gives it on 95.5%, at 69.5% against 69.9%. It peaks at 12.0 GB at 8,000 tokens and 15.6 GB at 32,000.
- **Both fit a 32 GB Mac,** and a fresh start answered a sample of questions bit for bit as before.
- **Pin a revision** with `@`, as on a GPU: the full hash is on each repository's page.

::source[Measured on one Apple M5 Pro with 64 GB, decisio's MLX engine, on 1,894 held-out questions against the bf16 tuned model with the same settings.]

## 6. Check what it serves

`GET /v1/models` and `/health` report the served name, such as `Decisio-12b-tuned-calibrated`, `Decisio-12b-tuned-commit-think` or `Decisio-12b-tuned-fp8-commit`.

## 7. Teach and certify on it

Tasks and certificates are per model and per flavor: register and certify your tasks again on the tuned 12B, as on [Teach a task](/docs/tasks/).

## 8. Know what is not there yet

- **No Ollama version is planned.**
- **Its accuracy was measured in bf16** against the untrained 12B on held-out items; the figures and their limits are in [the announcement](/news/tuned-12b/).

## What next

- [Choosing a model](/docs/bases/): the untrained models and their flavors.
- [Teach a task](/docs/tasks/): fit your own task on the tuned 12B.
- [Requirements and limits](/docs/limits/#1-pick-your-machine): the machine it needs.
