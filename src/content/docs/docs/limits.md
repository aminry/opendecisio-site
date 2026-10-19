---
title: Requirements and limits
description: What decisio needs to run each model, how long a text it reads, the setup steps that keep a certificate valid, and what was measured on what.
---

<!-- Site-written: the one page of requirements and limits. Every number is EVAL_CARD.md's, docs/running.md's, docs/api.md's or docs/tasks.md's at the pinned release (src/config/sourced.mjs checks them); the research detail behind them stays in the evaluation card. -->

::covers{links="docs/running.md#the-context-length=2-how-long-a-text-and-how-many-options"}

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

## 1. Pick your machine

| Machine | Model and build | Memory it takes | Longest text | Measured |
| --- | --- | --- | --- | --- |
| NVIDIA, 96 GB | Gemma 4 31B, FP8, the default | 30.6 GiB of weights | up to 98,304 tokens, chosen at start | yes, an RTX PRO 6000 Blackwell |
| NVIDIA, 80 GB | Gemma 4 31B, FP8 | 33.85 GiB of cache at the default share | 98,304 tokens at the default share; 49,152 at 0.85 | yes, an H100 PCIe |
| NVIDIA, 96 GB | Gemma 4 12B, bf16 | 22.8 GiB of weights | up to 65,536 tokens | yes |
| NVIDIA, 32 GB | Gemma 4 12B, bf16 | does not start on vLLM's defaults | none | simulated on the 96 GB card |
| NVIDIA, 96 GB | Qwen3.6-35B-A3B, FP8 | 33.3 GiB of weights | 32,768 tokens | yes |
| Mac, 64 GB | Gemma 4 31B, 6-bit MLX | 24.9 GB of weights; 33.7 GB at its peak | 16,383 tokens | yes, an Apple M5 Pro |
| Mac, 48 GB | Gemma 4 31B, 4-bit MLX | 19.2 GB of weights; 28.0 GB at its peak | 16,383 tokens | read on the 64 GB Mac |
| Mac, 32 GB | Gemma 4 12B, 6-bit MLX | 9.7 GB of weights; 15.1 GB at its peak | 32,768 tokens | read on the 64 GB Mac |
| Laptop, 16 GB | Gemma 4 12B on Ollama | 8.6 GB in Ollama | 8,192 tokens | read on the 64 GB Mac |
| Any machine | the CPU stand-in | a small model | 32,768 tokens | for development only |

| To run | You need |
| --- | --- |
| On a GPU | Linux, a driver that supports CUDA 13.0, Python 3.12 |
| With Docker | the NVIDIA Container Toolkit |
| On a Mac | Apple silicon |
| With Ollama | Ollama 0.35.1 or later |

The guides have the commands: [on a cloud GPU](/docs/deploy/cloud-gpu/), [with Docker](/docs/deploy/docker/), [on a Mac or a laptop](/docs/deploy/mac/) and [for development](/docs/deploy/development/).

## 2. How long a text, and how many options

| Model | Longest text, with no flag | Ceiling |
| --- | --- | --- |
| Gemma 4 31B | the largest that fits the card, 32,768 to 98,304 tokens | 98,304 |
| Gemma 4 12B | the largest that fits the card, 32,768 to 65,536 tokens | 65,536 |
| Qwen3.6-35B-A3B | 32,768 tokens | 32,768 |

- At start, the server asks the engine for the longest request that fits the card, and serves the largest multiple of 8,192 under it and under the ceiling.
- If not even 32,768 fits, the server does not start, and says what length would fit.
- The length stays at 32,768 with `--image-model`, `--head-engine`, `--engine-process separate`, on a Mac and on the CPU stand-in.
- How much a card gives depends on `--gpu-memory-utilization`: on the 80 GB H100 the 31B served 98,304 tokens at 0.90 and did not start at 0.70.

Each request holds:
- up to 255 options per question; a request with more gets 422;
- up to 2 images, PNG, JPEG or WebP, 20 MB each;
- a prompt up to the length above; a longer one gets 422.

A long text takes longer to read the first time: on the 31B, 3,370 ms at 16,000 tokens and 8,880 ms at 32,000 (one RTX PRO 6000 at 600 W, decisio 0.11.1).
At long length, the 31B answered a check at 85,000 tokens, 23 of 30 right against 25 of 30 short; a 30-item check is a smoke test, not an accuracy measurement.

## 3. Set up for production

1. **Give `--max-model-len` the same value on every card.** The length served is part of what a certificate covers. On an RTX PRO 6000, 98,304 against 32,768 changed 6 of 200 top answers.
2. **After upgrading decisio, certify your tasks again.** For example, a task certified before 0.16.0 gets no drift protection until it is certified again.
3. **A certificate covers one task on one serving setup.** The setup is the decisio version, the model and its revision, the engine, the card, the quantisation, the cache type, the context length and the serving flags. When any of it changes, the task's answers stop being certified until you certify again.
4. **Keep the cache type you certified on.** `--kv-cache-dtype fp8` suspends a certificate made without it.
5. **On a Mac, run one model server at a time.** Two servers can add up to more memory than the Mac has.

## 4. What was measured on what

| What | Model | Machine | Conditions | Date |
| --- | --- | --- | --- | --- |
| Accuracy and calibration | Qwen3.6-35B-A3B, FP8 | one RTX PRO 6000 Blackwell, 96 GB | vLLM 0.30.0 | 2026-10-03 |
| Accuracy and calibration | Gemma 4 12B, bf16 | one RTX PRO 6000 Blackwell | vLLM 0.30.0 | 2026-10-04 |
| Accuracy and calibration | Gemma 4 31B, FP8 on load | one RTX PRO 6000 Blackwell | vLLM 0.30.0 | 2026-10-04 |
| Latency, one to four questions | all three | one RTX PRO 6000 at 585 W, AMD Ryzen Threadripper 9960X | decisio 0.8.1 | 2026-10-06 |
| Latency by text length | all three | one RTX PRO 6000 at 600 W, AMD EPYC 9534 | decisio 0.11.1, vLLM 0.30.0 | 2026-10-14 |
| Context length against the card's share | Gemma 4 31B, FP8; Gemma 4 12B | one H100 PCIe, 80 GB | vLLM 0.31.0 | 2026-10-15 |
| Mac memory | Gemma 4 31B and 12B, MLX builds | one Apple M5 Pro, 64 GB | MLX | 2026-10-05 to 2026-10-16 |
| Ollama memory | Gemma 4 12B, `q4_k_m` | one Apple M5 Pro | Ollama 0.35.1 | 2026-10-07 |

- One card and one run per configuration.
- The temperatures were fitted on decisio's own 1,400-item suite, so that suite's calibration figures are in-sample.
- Latency depends on the host's CPU and the card's power limit, as well as the card.
- Most published figures of the 31B were measured on Google's weights quantised on load; the stored FP8 repository it serves scores the same within noise.

[The evaluation card](/docs/evaluation-card/) has every measurement and its record.

## 5. Repeatability

A request repeats exactly on a freshly started server.
Asked again on a server that has already answered it, it can move slightly: on the 31B, 5 of 200 items, by at most 0.031, with no top answer changed.
Across restarts and machines, answers are not promised to repeat.

## 6. What was not tested

- The image route on either Gemma model; a Mac does not serve images.
- A 48 GB or 32 GB Mac, or a 16 GB laptop, as machines: their figures are read on a 64 GB Mac.
- NVIDIA cards other than the RTX PRO 6000 Blackwell and the H100 PCIe.
- Accuracy at long length on a full test set: no set has a text over 32,768 tokens.
- The 31B's 6-bit Mac build on MMLU-Pro, and its server times.
- Latency with the intent head on a second engine.
- Ollama's answers: Ollama builds its own prompt and applies no calibration.

## What next

- [The evaluation card](/docs/evaluation-card/): every measurement, with its record.
- [Certify answers](/docs/tasks/certify/): certify a task, and what its certificate covers.
- [Upgrade](/docs/upgrading/): move to a new release, and certify your tasks again.
