---
title: "Decisio v3: a Gemma 4 12B tuned for decisions, with calibrated probabilities and exact arithmetic"
summary: "Decisio v3 answers 78.8% of 5,000 held-out questions right, with probabilities you can act on, on a GPU, a Mac or Ollama. decisio 0.51 adds dates and times to its exact arithmetic."
date: 2026-11-20
tags: [release]
---

Decisio v3 is the model decisio now recommends: a Gemma 4 12B tuned for typed decisions about a text.
It answers more questions right than the model it is built on, and its probabilities mean what they say, so a threshold you set holds.
It runs on one NVIDIA GPU, on a Mac with Apple silicon, or through Ollama.

## What it gets right

On 5,000 held-out questions of its training distribution, never trained on, each model at its own temperatures:

| Questions | Decisio v3 | Gemma 4 12B, untrained | The previous tuned 12B |
| --- | ---: | ---: | ---: |
| All | 78.8% | 67.7% | 71.6% |
| Choice | 79.8% | 68.9% | 71.7% |
| Yes/no | 89.8% | 83.0% | 84.7% |
| Score | 62.2% | 45.1% | 55.2% |

It gains on every question type, most on scores.
Its probabilities are calibrated: on average they are off by 2.3 points from how often it is right, and the untrained model's by 9.0.
These are readings on held-out questions of the training distribution, not scores on an independent benchmark ([Serve Decisio v3](/docs/deploy/tuned-12b/#how-accurate-is-it), from decisio's README).

## How fast it answers

One question about a typical text, one request at a time, takes a median of 60 ms on one RTX PRO 6000 in bf16, 44 ms in FP8, and 0.90 s on a Mac M5 Pro from the 8-bit MLX build.
Each answer is one forward pass per question, with no text generated.

## Exact arithmetic for bills and dates

Decisio v3's repositories turn on decisio's calculator by themselves.
For bills, invoices and payslips, the server computes the line values exactly and shows them to the model, and decisio 0.51 adds dates and times: a zoned time in UTC, the time between two of them, and a date some days or months on.
A small tagger reads wordings and layouts the rule reader has no rule for, behind gates that show nothing unless every value is certain ([Exact arithmetic](/docs/calculator/)).

## Pick a flavor and a machine

Every repository comes in two flavors with the same weights:

- **calibrated**, when you use the probabilities themselves: thresholds, ranking, expected values;
- **commit**, when you act on yes/no answers: a yes/no between 20% and 80% is reported as 20% or 80%, and the answer never changes.

| Machine | Decisio v3 | Size |
| --- | --- | ---: |
| NVIDIA GPU | `tachara-ai/Decisio-12b-tuned-v3-calibrated` | 22 GB |
| NVIDIA GPU, a smaller card | `tachara-ai/Decisio-12b-tuned-v3-fp8-calibrated` | 12 GB |
| Mac with Apple silicon | `tachara-ai/Decisio-12b-tuned-v3-mlx8-calibrated` | 12 GB |
| Mac with 32 GB | `tachara-ai/Decisio-12b-tuned-v3-mlx-calibrated` | 9 GB |
| Ollama | `aminroudaki/decisio-v3`, `q8_0` and `q4_k_m` | 12.7 / 7.4 GB |

On 1,000 held-out questions, the Ollama 8-bit file gives the full-precision model's likeliest answer on 97.2% and the 4-bit file on 93.6% ([the Ollama listing](https://ollama.com/aminroudaki/decisio-v3)).
Through Ollama the model answers on its own, without decisio's calculator.

## Start

- [Serve Decisio v3](/docs/deploy/tuned-12b/): every repository, the start commands and the figures.
- [Quickstart](/docs/): start it on a GPU, a Mac or Ollama and ask your first question.

## Good to know

- Decisio v3 needs decisio 0.51.1 or later; the [Quickstart](/docs/) installs it.
- Tasks and certificates belong to one model and flavor: teach and certify your tasks again on Decisio v3.
- Decisio v3 was trained on text; how well it reads pictures is not measured.
- The small base is `qwen3.5-4b`, not yet measured ([Choosing a model](/docs/bases/)).
