---
title: Choosing a model
description: Which of the three models to serve, by your machine and what you need; one flag picks it, with every setting it was measured with.
---

<!-- Site-written: the Choosing a model reference. The start commands are the README's "Choosing a base" at the pinned release; the checkpoints, weights and reasons are the README's and docs/running.md's there (src/config/sourced.mjs checks them). The comparisons between the models are on Benchmarks. -->

::covers{links="README.md#choosing-a-base docs/running.md#flavors=5-serve-a-flavor docs/running.md#the-31b-in-bf16=6-the-31b-in-bf16 docs/running.md#the-12b-in-two-precisions=4-the-12b-in-fp8 docs/running.md#the-12b-in-two-precisions-bf16-and-fp8=4-the-12b-in-fp8"}

Pick the model by your machine and what you need: one flag, `--base`, serves it with every setting it was measured with.
With no flag the server serves Gemma 4 31B:

::upstream{file="README.md" section="Choosing a base" block="1"}

## 1. Pick by your machine

| Model | `--base` | Weights on an NVIDIA card | Runs on | Choose it for |
| --- | --- | --- | --- | --- |
| Gemma 4 31B, the default | `gemma-4-31b` | 30.6 GiB, FP8 | an NVIDIA card with 96 GB, or an 80 GB H100; a 64 GB Mac, or a 48 GB one from its 4-bit build | accuracy |
| Qwen3.6-35B-A3B | `qwen3.6-35b-a3b` | 33.3 GiB, FP8 | an NVIDIA card with 96 GB | speed on long new texts, and the same probabilities every time on one server |
| Gemma 4 12B | `gemma-4-12b` | 22.8 GiB, bf16 | an NVIDIA card with 96 GB; a 32 GB Mac; a 16 GB laptop with Ollama | smaller machines |
| Gemma 4 31B in bf16 | `gemma-4-31b-bf16` | 57.91 GiB, bf16 | an NVIDIA card larger than 96 GB | the 31B without quantization; not measured |
| Gemma 4 12B in FP8 | `gemma-4-12b-fp8` | 12.74 GiB, FP8 | an NVIDIA card with 32 GB, at its full 65,536 tokens; not a Mac | a 32 GB card, and a faster read than the 12B in bf16 |

[Requirements and limits](/docs/limits/) has each machine's memory and longest text; [Benchmarks](/benchmarks/) compares the three.

## 2. What `--base` sets

- The model's checkpoint, at a pinned revision, and every setting it was measured with as one configuration.
- The [prompt layout](/docs/layout/): the Gemma models list the request's questions before the text; Qwen reads the text, then the question.
- A flag you give explicitly overrides the model's value.
- A checkpoint named with `--model` and no `--base` brings the model its `config.json` declares.

## 3. Where the weights come from

| Model | Checkpoint |
| --- | --- |
| Gemma 4 31B | `tachara-ai/decisio-gemma-4-31b`: Google's `google/gemma-4-31B-it`, stored as FP8 |
| Qwen3.6-35B-A3B | `Qwen/Qwen3.6-35B-A3B-FP8`, from Alibaba's Qwen team |
| Gemma 4 12B | `google/gemma-4-12B-it`, from Google |
| Gemma 4 31B in bf16 | `google/gemma-4-31B-it`, from Google, as published |
| Gemma 4 12B in FP8 | `google/gemma-4-12B-it`, quantized to FP8 as it loads, or [`tachara-ai/decisio-gemma-4-12b-fp8`](https://huggingface.co/tachara-ai/decisio-gemma-4-12b-fp8), the same conversion stored |

Each is an official checkpoint at a pinned revision, with no training or fine-tuning by us.
The weights are under Apache-2.0: Alibaba's Qwen3.6-35B-A3B and Google's Gemma 4 12B and 31B, and the `tachara-ai/decisio-*` repositories redistribute them with their licence and provenance files.

## 4. The 12B in FP8

The Gemma 4 12B in FP8 is a second precision of the 12B, from the same checkpoint, for a smaller footprint.
On a 32 GB card it serves its full 65,536 tokens at the default share, where the 12B in bf16 starts only at 4,096 tokens, and it read one question in 0.64 times the bf16 12B's server time.

- **Its answers differ slightly.** On 200 questions its top answer was the bf16 12B's on 96%, the largest probability difference 0.438.
- **Tasks and certificates do not carry over.** It has its own served name, task fingerprint and serving stack: register and certify your tasks again on it.
- **Its temperatures are the bf16 12B's** until they are refitted on FP8 reads.
- **A Mac does not serve it**: on a Mac, serve the bf16 12B's MLX conversion.

::source[Measured on one RTX 5090, vLLM 0.31.0, both precisions at 4,096 tokens and 0.95 of the card for the answers and speed, 2026-10-21.]

## 5. Serve a flavor

A flavor is a named configuration of a Gemma model's weights for one job, started with `--flavor`:

- **`calibrated`** gives honest probabilities: calibrated temperatures for every question type, yes/no included, with no commit rule and no read twice.
- **`commit`** commits yes/no answers: the calibrated temperatures and the commit rule, so no yes/no answer sits between 0.20 and 0.80. It changes no answer.
- **`read-enhanced`** [reads short requests twice](/docs/layout/#6-read-short-requests-twice), under 2,000 tokens, for accuracy at more tokens.

How a flavor is served:

- **Every flavor uses the header layout**, and the server is named for it: `Decisio-31b-<flavor>`, `Decisio-12b-<flavor>` or `Decisio-12b-fp8-<flavor>`, in `GET /v1/models` and every response.
- **A flag you give wins** and is recorded as an override: at start, in `/health` under `systemone.flavor.overrides`, in the `x-decisio-flavor` header and in the serving-stack fingerprint.
- **On the 12B, every flavor starts.** The calibrated temperatures are yes/no 4.84 in bf16 and 4.72 in FP8 and score 7.85; choice stays at the model's 3.592. They were fitted on items that share no text with a public benchmark's test set.
- **On the 31B, `calibrated` and `commit` do not start yet:** its calibrated temperatures are not fitted. Its `read-enhanced` serves the model's own temperatures until they are.
- **`read-enhanced` says `pending`** wherever the flavor is reported: it has no question cap until its timing run.
- **Thinking is not a flavor:** [`--think`](/docs/think/) turns it on for any server.
- **Tasks and certificates are per flavor.** The Qwen model and the 31B in bf16 have no flavors, and a server without `--flavor` is what it was.
- **A tuned model can be a flavor of its own:** [the tuned 12B](/docs/deploy/tuned-12b/) ships as `Decisio-12b-tuned-calibrated` and `Decisio-12b-tuned-commit`.

## 6. The 31B in bf16

`--base gemma-4-31b-bf16` serves Google's 31B as published, in bf16, with no quantization.

- **Only the precision differs.** Its prompt, layout and temperatures are the 31B's; its served name and fingerprints are its own, so tasks and certificates made on the FP8 31B do not apply to it.
- **It needs room for 57.91 GiB of weights and a cache.** On one 96 GB card it does not start at the default share; on a larger card the server serves the longest text that fits, up to 65,536 tokens. Read `/health` for the length it chose.
- **Its accuracy, calibration and latency are not measured,** and the FP8 31B's records do not carry over to it.
- It runs on the vLLM server only, with no flavors.

## What next

- [Requirements and limits](/docs/limits/): what each model needs, and how long a text it reads.
- [Server flags](/docs/flags/): every flag, and its value for each model.
- [Benchmarks](/benchmarks/): how the three models compare, measured and dated.
