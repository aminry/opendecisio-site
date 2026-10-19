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

| Model | `--base` | Weights in memory | Runs on | Choose it for |
| --- | --- | --- | --- | --- |
| Gemma 4 31B, the default | `gemma-4-31b` | 30.6 GiB, FP8 | an NVIDIA card with 96 GB, or an 80 GB H100; a 64 GB Mac, or a 48 GB one from its 4-bit build | accuracy |
| Qwen3.6-35B-A3B | `qwen3.6-35b-a3b` | 33.3 GiB, FP8 | an NVIDIA card with 96 GB | speed on long new texts, and answers that repeat across sessions |
| Gemma 4 12B | `gemma-4-12b` | 22.8 GiB, bf16 | an NVIDIA card with 96 GB; a 32 GB Mac; a 16 GB laptop with Ollama | smaller machines |

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

Each is an official checkpoint at a pinned revision, with no training or fine-tuning by us.

## What next

- [Requirements and limits](/docs/limits/): what each model needs, and how long a text it reads.
- [Server flags](/docs/flags/): every flag, and its value for each model.
- [Benchmarks](/benchmarks/): how the three models compare, measured and dated.
