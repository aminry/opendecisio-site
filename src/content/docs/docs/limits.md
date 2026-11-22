---
title: Requirements and limits
description: What decisio needs to run each model, and how long a text and how many options it reads.
---

<!-- Site-written: the one page of requirements and limits. Every number is EVAL_CARD.md's, docs/running.md's, docs/api.md's or docs/tasks.md's at the pinned release (src/config/sourced.mjs checks them); the research detail behind them stays in the evaluation card. -->

::covers{links="docs/running.md#the-context-length=how-long-a-text-and-how-many-options docs/running.md#states-over-the-limit=how-long-a-text-and-how-many-options docs/tasks.md#a-task-under-a-layout=what-is-kept-for-each-prompt-layout docs/running.md#refitting-the-bases-temperatures-for-a-layout=what-is-kept-for-each-prompt-layout docs/running.md#a-header-over-the-context---header-limit=what-happens-when-the-header-does-not-fit"}

Find your machine below to see which model it runs and how long a text it reads.
Your own server says which model it serves and how long a text it accepts.

```bash
curl -s http://127.0.0.1:8000/health
```

| Field | What it says |
| --- | --- |
| `base`, `profile` | the model, its checkpoint and revision, and its settings |
| `max_model_len` | the longest prompt the server accepts, in tokens |
| `max_model_len_source` | why: for example, the largest length that fits this card |
| `max_model_len_ceiling` | the most the model allows |

<span id="1-pick-your-machine" aria-hidden="true"></span>

## Pick your machine

| Machine | Model and build | Memory it takes | Longest text | Measured |
| --- | --- | --- | --- | --- |
| NVIDIA, 96 GB | Gemma 4 31B, FP8, the default | 30.6 GiB of weights | up to 98,304 tokens, chosen at start | yes, an RTX PRO 6000 Blackwell |
| NVIDIA, 80 GB | Gemma 4 31B, FP8 | 30.6 GiB of weights; 33.85 GiB of cache at the default share | 98,304 tokens at the default share; 49,152 at 0.85 | it starts and answers, an H100 PCIe; the full measurements are the 96 GB card's |
| NVIDIA, 80 GB | Gemma 4 12B, bf16 | 22.8 GiB of weights; 43.28 GiB of cache at the default share | 65,536 tokens at the default share | yes, an H100 PCIe |
| NVIDIA, 96 GB | Gemma 4 12B, bf16 | 22.8 GiB of weights | up to 65,536 tokens | yes |
| NVIDIA, larger than 96 GB | Gemma 4 31B, bf16 | 57.91 GiB of weights | up to 65,536 tokens, chosen at start | no; on a 96 GB card it does not start at the default share |
| NVIDIA, 96 GB | Decisio v3, bf16 | 22 GB of weights | chosen at start | yes, an RTX PRO 6000 |
| NVIDIA with FP8 support | Decisio v3, FP8 | 12 GB of weights | chosen at start | yes, an RTX PRO 6000 |
| NVIDIA, 32 GB | Gemma 4 12B, bf16 | does not start on vLLM's defaults | 4,096 tokens, at 0.95 of the card | yes, an RTX 5090 |
| NVIDIA, 32 GB | Gemma 4 12B, FP8 | 12.74 GiB of weights | 65,536 tokens at the default share | yes, an RTX 5090 |
| NVIDIA, 96 GB | Qwen3.6-35B-A3B, FP8 | 33.3 GiB of weights | 32,768 tokens | yes |
| Mac, 64 GB | Gemma 4 31B, 6-bit MLX | 24.9 GB of weights; 33.7 GB at its peak | 16,383 tokens | yes, an Apple M5 Pro |
| Mac, 48 GB | Gemma 4 31B, 4-bit MLX | 19.2 GB of weights; 28.0 GB at its peak | 16,383 tokens | read on the 64 GB Mac |
| Mac, 32 GB | Decisio v3, 8-bit MLX | 12 GB of weights | not measured | its speed, on a 64 GB Apple M5 Pro |
| Mac, 32 GB | Decisio v3, 6-bit MLX | 9 GB of weights | not measured | no |
| Mac, 32 GB | Gemma 4 12B, 6-bit MLX | 9.7 GB of weights; 15.1 GB at its peak | 32,768 tokens | read on the 64 GB Mac |
| Any machine with Ollama | Gemma 4 12B on Ollama, `q4_k_m` | 11.1 GB in Ollama | 8,192 tokens | read on the 64 GB Mac; a 16 GB machine was not tried |
| Any machine with Ollama | Decisio v3 on Ollama, `q8_0` or `q4_k_m` | a 12.7 GB or 7.4 GB file | 8,192 tokens | no |
| Any machine | the CPU stand-in | a small model | 32,768 tokens | for development only |

| To run | You need |
| --- | --- |
| On a GPU | Linux, a driver that supports CUDA 13.0, Python 3.12 |
| With Docker | the NVIDIA Container Toolkit |
| On a Mac | Apple silicon |
| On a Mac, with pictures | the `mlx-images` extra |
| With Ollama | Ollama 0.40.4 or later for the Gemma listings; the Qwen listing needs 0.35.1 through 0.40.3 |

The guides have the commands: [on a cloud GPU](/docs/deploy/cloud-gpu/), [with Docker](/docs/deploy/docker/), [on a Mac or a laptop](/docs/deploy/mac/) and [for development](/docs/deploy/development/).

<span id="2-how-long-a-text-and-how-many-options" aria-hidden="true"></span>

## How long a text, and how many options

| Model | Longest text, with no flag | Ceiling |
| --- | --- | --- |
| Gemma 4 31B | the largest that fits the card, 32,768 to 98,304 tokens | 98,304 |
| Gemma 4 12B | the largest that fits the card, 32,768 to 65,536 tokens | 65,536 |
| Gemma 4 12B in FP8 | the largest that fits the card, 32,768 to 65,536 tokens | 65,536 |
| Qwen3.6-35B-A3B | 32,768 tokens | 32,768 |

- At start, the server asks the engine for the longest request that fits the card, and serves the largest multiple of 8,192 under it and under the ceiling.
- If not even 32,768 fits, the server does not start, and says what length would fit.
- The length stays at 32,768 with `--image-model`, `--engine-process separate`, on a Mac and on the CPU stand-in.
- How much a card gives depends on `--gpu-memory-utilization`: on the 80 GB H100 the 31B served 98,304 tokens at 0.90 and did not start at 0.70.

Each request holds:
- up to 255 options per question; a request with more gets 422;
- as many images as the context holds, up to the image engine's `--max-images` (128 unless set), PNG, JPEG or WebP, 20 MB each;
- a prompt up to the length above; a longer one gets 422.

To answer a text over the length instead, start the server with `--over-limit truncate`, or send `"over_limit": "truncate"` in one request.
The server keeps the start of the text and drops the rest, never a question, and the response says what was cut (`state_truncated`).

Under the header layout the list of the request's questions takes room too, so the text keeps what the longest prompt leaves.
Nothing cut is certified; a question over the length on its own, or a request with images, still gets 422.

A long text takes longer to read the first time: on the 31B, 3,370 ms at 16,000 tokens and 8,880 ms at 32,000.

::source[Measured on decisio 0.11.1, one RTX PRO 6000 at 600 W, 2026-10-14.]

## What is kept for each prompt layout

The [prompt layout](/docs/layout/) is part of the serving setup, so these follow it:

- **Tasks and certificates.** A task is registered under one layout, with `"layout"` or the server's by default, and applies only to that layout's requests. [Certify answers](/docs/tasks/certify/#6-certify-under-the-layout-your-clients-send) has the rest.
- **Fast tables.** A fast table, labelled or learned, never answers a request of the other layout, and a task that learns from traffic logs none.
- **What answers.** An adapter, a tuned model, a temperatures file or a flavor fitted under one layout still answers a request of the other, as asked, and the response carries `layout_note`.
- **Batching.** With `--concurrency batched`, requests of the two layouts are never scored in one engine call.
- **A task's examples.** A task is fitted one question at a time, so a request with several questions reads a longer header than the task was fitted on.
- **Images and packed mode.** A request with images is read on the plain layout and refuses the `layout` field with a 422. `--mode packed` reads the plain layout only, and refuses `"layout": "header"` with a 422.
- **Temperatures.** The models' temperatures were fitted on the plain layout; `--temperatures-file` serves ones you refit, from your own labelled reads under the layout you serve.

## What happens when the header does not fit

A request with many questions and long instructions can make the header longer than the context.
Such a request is answered, not refused: the server lists as many of its questions as fit, in the request's order, and none when no line fits, which is the plain layout's prompt.

- **A request whose prompts fit is not touched.**
- **The response says what was listed:** `header_limited` in the body and the `x-decisio-layout` header, and `usage.input_tokens` counts the header that was read.
- **A certified task's answer in such a request is not certified** (`header_limited`).
- **What a shorter header costs the answers is not measured:** where an answer matters, compare it with `--layout plain`.
- **`--header-limit off`** refuses such a request with a 422 instead, and a number caps the header's tokens.

<span id="3-set-up-for-production" aria-hidden="true"></span>
<span id="4-what-was-measured-on-what" aria-hidden="true"></span>
<span id="5-repeatability" aria-hidden="true"></span>
<span id="6-what-was-not-tested" aria-hidden="true"></span>

## Limits

- A row marked "read on the 64 GB Mac" was not run on that machine.
- A figure is one card and one run, not a promise for your workload.
- What was not tested is listed on [What was measured on what](/docs/measured/#what-was-not-tested).

## What next

- [Set up for production](/docs/production/): one serving setup per certified task, and what to do after a change.
- [What was measured on what](/docs/measured/): the machines, versions and dates behind these figures.
- [Evaluate a task](/docs/evaluation-card/): check your own question and application policy.
