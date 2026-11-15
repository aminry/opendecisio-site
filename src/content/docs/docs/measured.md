---
title: What was measured on what
description: The machines, versions and dates behind decisio's published memory, length and repeatability figures, and what was not tested.
---

<!-- Site-written: the evidence behind the requirements page. Every number is EVAL_CARD.md's or docs/running.md's at the pinned release (src/config/sourced.mjs checks them); the research detail behind them stays in the evaluation card. -->

Each figure on [Requirements and limits](/docs/limits/) was measured on the machines below, at the dates and versions shown.
Read a figure with its row, and do not expect it on your own workload.

## Setup

:::sources
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
| The 12B in FP8 against bf16, and on a 32 GB card | Gemma 4 12B, FP8 and bf16 | one RTX 5090, 32 GB | vLLM 0.31.0, 4,096 tokens, 0.95 of the card | 2026-10-21 |
| Batched throughput | Gemma 4 12B, FP8 | one RTX 5090, 32 GB | vLLM 0.31.0, 0.95 of the card, 4,096 tokens, requests about new 1,000-token states, 8 and 16 clients | 2026-10-21 |
| The header layout against the plain one | Gemma 4 31B, FP8 on load; Gemma 4 12B, FP8 | one RTX PRO 6000 Blackwell; one RTX 5090 | decisio's proxy sets and a public multi-domain sample | before decisio 0.26.0 |
:::

## How to read it

- One card and one run per configuration.
- Every figure above other than the layout comparison was measured on the plain layout, the text then the question; the Gemma models now serve the header layout by default.
- Each model's default settings were tuned on decisio's own 1,400-item suite, so its calibration errors on that suite are a best case.
- Latency depends on the host's CPU and the card's power limit, as well as the card.
- Most published figures of the 31B were measured on Google's weights converted to FP8 as they load; the stored FP8 checkpoint it serves scores the same within noise: 213 of JevBench's 231 published questions right with each, and 162 of 200 suite requests (vLLM 0.31.0).

## Repeatability

A request repeats exactly on a freshly started server.
Asked again on a server that has already answered it, it can move slightly: on the 31B, 5 of 200 items, by at most 0.031, with no top answer changed.
Across restarts and machines, answers are not promised to repeat.

On the 12B, `--batch-invariant on`, off by default, makes a repeated request give the same bits, from the prefix cache or not.

## Long texts

At long length, the 31B answered a check at 85,000 tokens, 23 of 30 right against 25 of 30 short; a 30-item check is a smoke test, not an accuracy measurement.

## What was not tested

- The image route on either Gemma model; a Mac does not serve images.
- A 48 GB or 32 GB Mac, or a 16 GB laptop, as machines: their figures are read on a 64 GB Mac.
- NVIDIA cards other than the RTX PRO 6000 Blackwell and the H100 PCIe, and, for the 12B, the RTX 5090.
- The 12B in FP8's accuracy and calibration: its answers were compared with the bf16 12B's on 200 questions only, and its temperatures are the bf16 12B's.
- Accuracy at long length on a full test set: no set has a text over 32,768 tokens.
- The 31B's 6-bit Mac build on MMLU-Pro, and its server times.
- Latency with the intent head on a second engine.
- Ollama's answers: Ollama builds its own prompt and applies no calibration.
- Fine-tuned adapters under the header layout. That is why an adapter that records no layout is served plain.
- Other engines. Only the vLLM engine was measured with the header; the HF and MLX engines build the same prompt.
- The Evaluation card. Its figures were measured on the plain layout.

## What next

- [Evaluate a task](/docs/evaluation-card/): test your own question before automatic actions.
- [Requirements and limits](/docs/limits/): the machines and lengths these figures support.
- [Upgrade](/docs/upgrading/): move to a new release, and certify your tasks again.
