---
title: Serve Decisio v3
description: Run Decisio v3, a Gemma 4 12B tuned for decisions, with one command on a GPU, in FP8 or on a Mac, or pull it on Ollama, with calibrated probabilities or committed yes/no answers.
---

<!-- Site-written: the Serve Decisio v3 guide, at the tuned 12B's old address. The repositories, sizes, accuracy, calibration and speed figures are decisio's README at the pinned release ("Why Decisio v3", "Pick a model", "Speed and memory"; src/config/sourced.mjs checks them); the start commands are the README's, with the install pinned to that release. -->

::covers{links="README.md#why-decisio-v3=how-accurate-is-it README.md#pick-a-model=which-repository-do-you-pick README.md#run-it=start-it README.md#speed-and-memory=how-fast-is-it"}

Decisio v3 answers more of your questions right, with probabilities you can act on: when it says 80%, it is right about 80% of the time.
Each repository holds its weights and settings, so one flag serves it, with exact arithmetic for bills, invoices, payslips and dates built in.

On a Linux machine with one NVIDIA GPU and Python 3.12, this starts the calibrated one:

::site-block{name="tuned-start"}

The first start downloads the model (22 GB) and the calculator's small tagger.

<span class="fp-anchor" id="1-pick-the-repository"></span>

## Which repository do you pick?

Every repository holds the same weights in one of two flavors, and every one has a `commit` twin:

| Flavor | Use it when |
| --- | --- |
| `calibrated` | you use the probabilities themselves: thresholds, ranking, expected values |
| `commit` | you act on yes/no answers: a yes/no between 20% and 80% is reported as 20% or 80%; the answer never changes |

| Format | Repository | Size | Runs on |
| --- | --- | --- | --- |
| bf16 | `tachara-ai/Decisio-12b-tuned-v3-calibrated` | 22 GB | an NVIDIA GPU |
| FP8 | `tachara-ai/Decisio-12b-tuned-v3-fp8-calibrated` | 12 GB | an NVIDIA GPU, for smaller cards |
| MLX 8-bit | `tachara-ai/Decisio-12b-tuned-v3-mlx8-calibrated` | 12 GB | a Mac with Apple silicon |
| MLX 6-bit | `tachara-ai/Decisio-12b-tuned-v3-mlx-calibrated` | 9 GB | a Mac with Apple silicon, 32 GB |
| Ollama | `aminroudaki/decisio-v3` (`q8_0`, `q4_k_m`) | 12.7 / 7.4 GB | any machine with Ollama |

For the `commit` flavor, end the repository's name in `-commit` instead of `-calibrated`.

## How accurate is it?

On 5,000 held-out questions, Decisio v3 gains on every question type, most on scores:

| Questions | Decisio v3 | Gemma 4 12B, untrained | The previous tuned 12B |
| --- | --- | --- | --- |
| All | 78.8% | 67.7% | 71.6% |
| Choice | 79.8% | 68.9% | 71.7% |
| Yes/no | 89.8% | 83.0% | 84.7% |
| Score | 62.2% | 45.1% | 55.2% |

Its probabilities are calibrated: on average they are off by 2.3 points from how often it is right, and the untrained model's by 9.0.

::source[Held-out questions of the training distribution, never trained on, each model at its own temperatures; they are not scores on an independent benchmark. decisio's README, Decisio v3 published 2026-11-20.]

<span class="fp-anchor" id="2-start-it"></span>

## Start it

- **`--base owner/name`** takes the repository's weights and its settings, the calculator included; no other flag is needed.
- **A flag you give still applies,** and is recorded as an override, as on [a flavor](/docs/bases/#serve-a-flavor).
- **Pin a revision** with `@`, as `--base tachara-ai/Decisio-12b-tuned-v3-calibrated@<revision>`: each repository's page lists its revisions.

<span class="fp-anchor" id="3-know-what-thinking-adds"></span>
<span class="fp-anchor" id="4-or-serve-it-in-fp8"></span>

## Serve it in FP8

On a smaller NVIDIA card, the FP8 repository holds the same model in 12 GB:

::site-block{name="tuned-fp8-start"}

<span class="fp-anchor" id="5-or-serve-it-on-a-mac"></span>

## Serve it on a Mac

decisio serves Decisio v3 on a Mac with Apple silicon from its MLX repositories:

::site-block{name="tuned-mlx-start"}

The 6-bit repository, `-v3-mlx-calibrated`, fits a 32 GB Mac.

## Pull it on Ollama

`ollama pull aminroudaki/decisio-v3` takes the 8-bit file, and the `q4_k_m` tag the 4-bit one.
Ollama answers the same `/v1/systemone` route with the model's own temperatures; the calculator comes only with decisio's own server.
[On a Mac or a laptop](/docs/deploy/mac/#on-a-laptop-with-ollama) has the request.

## How fast is it?

One question, median and 95th percentile:

| Setup | Weights | First start, with the download | One question |
| --- | --- | --- | --- |
| RTX PRO 6000, bf16 | 22 GB | 4 min 51 s | 60 / 144 ms |
| RTX PRO 6000, FP8 | 12 GB | 3 min 41 s | 44 / 97 ms |
| Mac M5 Pro (64 GB), MLX 8-bit | 12 GB | 2 min 51 s | 0.90 / 1.07 s |

::source[One request at a time over 500 held-out texts of mixed length (100 on the Mac), decisio 0.51.0 installed with pip, the published repositories, the calibrated flavor; decisio's README.]

<span class="fp-anchor" id="the-tuned-12b-v2"></span>
<span class="fp-anchor" id="6-check-what-it-serves"></span>

## Check what it serves

`GET /v1/models` and `/health` report the served name, such as `Decisio-12b-tuned-v3-calibrated`.

<span class="fp-anchor" id="7-teach-and-certify-on-it"></span>

## Teach and certify on it

Tasks and certificates are per model and per flavor: register and certify your tasks again on Decisio v3, as on [Teach a task](/docs/tasks/).

<span class="fp-anchor" id="8-know-what-is-not-there-yet"></span>
<span class="fp-anchor" id="8-good-to-know"></span>

## Good to know

- **Decisio v3 was trained on text;** it reads images through the base's image path, unmeasured.
- **The accuracy figures are on held-out questions of the training distribution;** your questions may differ, so check it on yours with [Evaluate your task](/docs/evaluation-card/).

## What next

- [Teach a task](/docs/tasks/): fit your own task on Decisio v3.
- [Exact arithmetic](/docs/calculator/): what the calculator adds to bills, invoices, payslips and dates.
- [Choosing a model](/docs/bases/): the untrained models and their flavors.
