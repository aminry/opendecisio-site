---
title: Choosing a model
description: Which of the three models to serve, by your machine and what you need; one flag picks it, with every setting it was measured with.
---

<!-- Site-written: the Choosing a model reference. The start commands are the README's "Choosing a base" at the pinned release; the checkpoints, weights and reasons are the README's and docs/running.md's there (src/config/sourced.mjs checks them). The comparisons between the models are on Benchmarks. -->

::covers{links="README.md#choosing-a-base"}

Pick the model by your machine and what you need: one flag, `--base`, serves it with every setting it was measured with.
With no flag the server serves Gemma 4 31B:

::upstream{file="README.md" section="Choosing a base" block="1"}

## 1. Pick by your machine

| Model | `--base` | Weights on an NVIDIA card | Runs on | Choose it for |
| --- | --- | --- | --- | --- |
| Gemma 4 31B, the default | `gemma-4-31b` | 30.6 GiB, FP8 | an NVIDIA card with 96 GB, or an 80 GB H100; a 64 GB Mac, or a 48 GB one from its 4-bit build | accuracy |
| Qwen3.6-35B-A3B | `qwen3.6-35b-a3b` | 33.3 GiB, FP8 | an NVIDIA card with 96 GB | speed on long new texts, and the same probabilities every time on one server |
| Gemma 4 12B | `gemma-4-12b` | 22.8 GiB, bf16 | an NVIDIA card with 96 GB; a 32 GB Mac; a 16 GB laptop with Ollama | smaller machines |
| Gemma 4 12B in FP8 | `gemma-4-12b-fp8` | 12.74 GiB, FP8 | an NVIDIA card with 32 GB, at its full 65,536 tokens; not a Mac | a 32 GB card, and a faster read than the 12B in bf16 |

[Requirements and limits](/docs/limits/) has each machine's memory and longest text; [Benchmarks](/benchmarks/) compares the three.

## 2. What `--base` sets

- The model's checkpoint, at a pinned revision, and every setting it was measured with as one configuration.
- A flag you give explicitly overrides the model's value.
- A checkpoint named with `--model` and no `--base` brings the model its `config.json` declares.

## 3. Where the weights come from

| Model | Checkpoint |
| --- | --- |
| Gemma 4 31B | `tachara-ai/decisio-gemma-4-31b`: Google's `google/gemma-4-31B-it`, stored as FP8 |
| Qwen3.6-35B-A3B | `Qwen/Qwen3.6-35B-A3B-FP8`, from Alibaba's Qwen team |
| Gemma 4 12B | `google/gemma-4-12B-it`, from Google |
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

## What next

- [Requirements and limits](/docs/limits/): what each model needs, and how long a text it reads.
- [Server flags](/docs/flags/): every flag, and its value for each model.
- [Benchmarks](/benchmarks/): how the three models compare, measured and dated.
