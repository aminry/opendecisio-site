---
title: Serve the tuned 12B
description: Run the tuned Gemma 4 12B from its Hugging Face repository with one command, on a GPU, in FP8 or on a Mac, with honest probabilities or with committed yes/no answers, and with images on.
---

<!-- Site-written: the Serve the tuned 12B guide. The repositories, revisions, served names and settings are the published repositories' and decisio's docs/running.md ("Flavors") at the pinned release; the accuracy figures are the announcement's held-out table. -->

Run the tuned 12B when you want the smaller model with settings for rule-based decisions.
It is right more often than the untrained 12B on hard decisions with rules, exceptions and arithmetic, and about the same elsewhere ([the announcement](/news/tuned-12b/)).

Each repository holds its weights and settings, so one flag serves it.
On a GPU with room for about 24 GB of bf16 weights, this starts the calibrated one, with images on so you can send pictures with your text:

::site-block{name="tuned-start"}

`--images on` loads the picture path; leave it off for a text-only server.
[Ask about images](/docs/images/) shows the request.

<span class="fp-anchor" id="1-pick-the-repository"></span>

## Which repository do you pick?

All three repositories hold the same weights; only their settings differ.

- **`tachara-ai/Decisio-12b-tuned-calibrated`**, gives honest probabilities: calibrated temperatures for every question type, yes/no included, the header layout, and no commit rule, thinking or read twice.
- **`tachara-ai/Decisio-12b-tuned-commit`**, commits yes/no answers: the same temperatures and layout with the commit rule, so no yes/no answer sits between 0.20 and 0.80. It changes no answer.
- **`tachara-ai/Decisio-12b-tuned-commit-think`**, adds thinking on choice questions to the commit settings: a choice question whose likeliest option is under 0.3712 is read again after up to 256 tokens of reasoning, and a text longer than 45,000 tokens is cut to its start and answered without thinking.

What thinking adds, and what it costs, is in [What was measured on what](/docs/measured/#what-thinking-adds-to-the-tuned-12b).
A second tuned 12B, [v2](#the-tuned-12b-v2), has its own weights.

<span class="fp-anchor" id="2-start-it"></span>

## Start it

- **It needs a GPU with room for about 24 GB of bf16 weights.** It was measured on one RTX PRO 6000.
- **`--base owner/name@revision`** takes the repository's weights and its settings; no other flag is needed. The first start downloads the weights.
- **A flag you give still applies,** and is recorded as an override, as on [a flavor](/docs/bases/#serve-a-flavor).

<span class="fp-anchor" id="3-know-what-thinking-adds"></span>
<span class="fp-anchor" id="4-or-serve-it-in-fp8"></span>

## Serve it in FP8

On a GPU with FP8 support, two more repositories hold the tuned 12B in FP8, 13.1 GB each, with the same two settings:

::site-block{name="tuned-fp8-start"}

- **`tachara-ai/Decisio-12b-tuned-fp8-calibrated`**, and **`tachara-ai/Decisio-12b-tuned-fp8-commit`**.
- **The server emulates bf16 rounding on FP8 by default,** which narrows the difference between two cold starts.
- **It is level with bf16 and quicker,** with a different likeliest answer on a few questions in a hundred ([the figures](/docs/measured/#the-tuned-12b-in-fp8)).

<span class="fp-anchor" id="5-or-serve-it-on-a-mac"></span>

## Serve it on a Mac

decisio serves the tuned 12B on a Mac with Apple silicon from its MLX conversions, with the calibrated and commit settings:

::site-block{name="tuned-mlx-start"}

- **8-bit** is `tachara-ai/Decisio-12b-tuned-mlx8-calibrated` and `-mlx8-commit`, 12.7 GB.
- **6-bit** is `-mlx-calibrated` and `-mlx-commit`, 9.7 GB.
- **Both fit a 32 GB Mac;** [the measurements](/docs/measured/#the-tuned-12b-on-a-mac) have their accuracy and memory.
- **Pin a revision** with `@`, as on a GPU: the full hash is on each repository's page.

<span class="fp-anchor" id="the-tuned-12b-v2"></span>

## The tuned 12B v2

`tachara-ai/Decisio-12b-tuned-v2-commit` is a second tuned Gemma 4 12B, a new model with its own weights and temperatures, with the commit settings.
It is not an update of the repositories above, which remain decisio's default tuned 12B.
Its card gives no accuracy figures, and none are measured here, so compare it with the first on your own questions.

::site-block{name="tuned-v2-start"}

- **It is a bf16 GPU repository only:** there is no FP8, Mac or Ollama version yet.
- **It needs the decisio release the install above pins,** and the first start downloads its weights.

<span class="fp-anchor" id="6-check-what-it-serves"></span>

## Check what it serves

`GET /v1/models` and `/health` report the served name, such as `Decisio-12b-tuned-calibrated`, `Decisio-12b-tuned-commit-think`, `Decisio-12b-tuned-fp8-commit` or `Decisio-12b-tuned-v2-commit`.

<span class="fp-anchor" id="7-teach-and-certify-on-it"></span>

## Teach and certify on it

Tasks and certificates are per model and per flavor: register and certify your tasks again on the tuned 12B, as on [Teach a task](/docs/tasks/).

<span class="fp-anchor" id="8-know-what-is-not-there-yet"></span>
<span class="fp-anchor" id="8-good-to-know"></span>

## Good to know

- **Whether the tuned 12B reads pictures as well as the untrained 12B is not measured.** `--images on` serves them; the picture figures on [Ask about images](/docs/images/) are for the untrained models.
- **On Ollama it is its own listing**, `aminroudaki/decisio-gemma-tuned`, which answers questions but needs a decisio server for tasks and certificates ([the Mac and Ollama guide](/docs/deploy/mac/#on-a-laptop-with-ollama)).
- **Its accuracy was measured in bf16** against the untrained 12B on held-out items; the figures and their limits are in [the announcement](/news/tuned-12b/).

## What next

- [Choosing a model](/docs/bases/): the untrained models and their flavors.
- [Teach a task](/docs/tasks/): fit your own task on the tuned 12B.
- [Requirements and limits](/docs/limits/#1-pick-your-machine): the machine it needs.
