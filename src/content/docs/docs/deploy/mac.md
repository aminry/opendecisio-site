---
title: On a Mac or a laptop
description: Run decisio on a Mac with Apple silicon from an MLX build, sized to your Mac's memory, or on any 16 GB laptop with Ollama.
---

<!-- Site-written: the deploy guide for a Mac and for Ollama. The commands are decisio's docs/running.md at the pinned release (src/lib/site-blocks.mjs, ::upstream); the request is the site's, run against Ollama (verification/ollama.json); the numbers are docs/running.md's (src/config/sourced.mjs checks them). -->

::covers{links="README.md#mac-with-mlx docs/running.md#mac-with-mlx docs/running.md#memory-on-a-mac=3-mind-the-memory README.md#ollama=on-a-laptop-with-ollama README.md#on-a-laptop-with-ollama=on-a-laptop-with-ollama docs/running.md#ollama=on-a-laptop-with-ollama"}

On a 64 GB Mac, install it and start the default model, Gemma 4 31B.

::site-block{name="mac-install"}

::site-block{name="mac-31b-6bit"}

::figure{name="mac-memory"}

## 1. Pick the build for your Mac

| Your Mac | Model and build | Memory: weights, then peak | Texts up to | One question on a new text |
| --- | --- | --- | --- | --- |
| 64 GB | Gemma 4 31B, 6-bit | 24.9 GB; 29.6, 31.1 and 33.7 GB at about 8k, 16k and 32k tokens | 16,383 tokens | not measured |
| 48 GB | Gemma 4 31B, 4-bit | 19.2 GB; 23.9, 25.3 and 28.0 GB, read on a 64 GB Mac | 16,383 tokens | 9.4 s at 3,000 tokens, on a busy Mac |
| 32 GB | Gemma 4 12B, 6-bit | 9.7 GB; 15.1 GB at 32,687 tokens | 32,768 tokens | 1,312 ms at 1,000 tokens |
| A 16 GB laptop | Gemma 4 12B on Ollama | a 7.7 GB download; 8.6 GB in Ollama, read on a 64 GB Mac | 8,192 tokens | not recorded |

Measured on one Apple M5 Pro with 64 GB; no smaller Mac was measured, and GB are 10⁹ bytes.
The Qwen base runs from its 6-bit build too; its 4-bit build is for Macs with more than 32 GB.

## 2. Start it

On a 64 GB Mac, the command above starts the 31B.
On a smaller Mac, start the build that fits it instead:

:::tabs

::tab{label="48 GB"}

`--revision v0.15.0` serves the build that was measured, whatever its repository holds later.

::site-block{name="mac-31b-4bit"}

::tab{label="32 GB"}

::site-block{name="mac-12b"}

:::

## 3. Mind the memory

- The server sets MLX's memory limits itself before it loads the model, and prints them in a start-up line that begins `MLX MEMORY`.
- When the model cannot fit, it refuses to start, with the numbers, instead of freezing the Mac:

::upstream{file="docs/running.md" section="Memory on a Mac" block="1"}

- Run one model server on a Mac at a time: two servers can each stay under their own limit and still add up to more than the Mac has.
- `/health` reports the memory under `memory`; watch `physical_footprint_bytes`, the figure Activity Monitor shows, not the resident size.

## 4. What a Mac does not serve

- Images in a question, adapters (`--adapter`), packed mode, or the intent head on a second engine (`--head-engine`).
- FP8 checkpoints: a Mac always names an MLX build with `--model`.
- Teaching a task works, slowly: on the 31B 4-bit, about an hour for 770 labelled examples (77 options) and about 2.6 hours for 1,500 (150 options).

## On a laptop, with Ollama

Ollama runs decisio's Gemma 4 12B listing on Mac, Linux or Windows, and its smallest tag fits a 16 GB laptop.
You need Ollama 0.35.1 or later.

::upstream{file="docs/running.md" section="Ollama" block="1"}

| Tag | Download | In Ollama |
| --- | --- | --- |
| `q4_k_m`, also `latest` | 7.7 GB | 8.6 GB, at the listing's 8,192-token context |
| `q8_0` | not given | 13.6 GB |

The Qwen listing's smallest tag is a 23 GB download, so it needs a machine with more memory.
Then ask it a question on Ollama's decision route, on port 11434, with the listing named in `model`:

::site-block{name="ollama-request-gemma"}

Ollama builds its own prompt and applies none of decisio's corrections to the probabilities, so they are not decisio's measured ones.
To teach and certify tasks, run a decisio server.

## What next

- [Get started](/docs/#3-ask-your-first-question): send your first question and read the answer.
- [Requirements and limits](/docs/limits/): every machine, the context length and what was measured on what.
- [Teach a task](/docs/tasks/): teach a question you ask again and again, and certify its answers.
