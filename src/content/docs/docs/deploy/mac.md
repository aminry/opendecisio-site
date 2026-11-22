---
title: On a Mac or a laptop
description: Run decisio on a Mac with Apple silicon from an MLX build, sized to your Mac's memory, with pictures if you want them, or on Ollama 0.40.4 or later with Decisio v3.
---

<!-- Site-written: the deploy guide for a Mac and for Ollama. The commands are decisio's docs/running.md at the pinned release (src/lib/site-blocks.mjs, ::upstream); the request is the site's, run against Ollama (verification/ollama.json); the numbers are docs/running.md's (src/config/sourced.mjs checks them). -->

::covers{links="README.md#mac-with-mlx docs/running.md#mac-with-mlx docs/running.md#images-on-a-mac=read-pictures-on-a-mac docs/running.md#memory-on-a-mac=mind-the-memory README.md#ollama=on-a-laptop-with-ollama README.md#on-a-laptop-with-ollama=on-a-laptop-with-ollama docs/running.md#ollama=on-a-laptop-with-ollama"}

Pick the build that fits your Mac's memory, then start it.
Decisio v3, the recommended model, runs on a 32 GB Mac ([Serve Decisio v3](/docs/deploy/tuned-12b/#serve-it-on-a-mac)); a 64 GB Mac also runs the default model, Gemma 4 31B, with two commands, and a Gemma build there reads pictures too.

::figure{name="mac-memory"}

## TL;DR

On a 64 GB Mac, install it and start the default model, Gemma 4 31B:

::site-block{name="mac-install"}

::site-block{name="mac-31b-6bit"}

<span class="fp-anchor" id="1-pick-the-build-for-your-mac"></span>

## Pick the build for your Mac

| Your Mac | Model and build | Memory: weights, then peak | Texts up to | One question on a new text |
| --- | --- | --- | --- | --- |
| 64 GB | Gemma 4 31B, 6-bit | 24.9 GB; 29.6, 31.1 and 33.7 GB at about 8k, 16k and 32k tokens | 16,383 tokens | not measured |
| 48 GB | Gemma 4 31B, 4-bit | 19.2 GB; 23.9, 25.3 and 28.0 GB, read on a 64 GB Mac | 16,383 tokens | 9.4 s at 3,000 tokens, on a busy Mac |
| 32 GB | Gemma 4 12B, 6-bit | 9.7 GB; 15.1 GB at 32,687 tokens | 32,768 tokens | 1,312 ms at 1,000 tokens |
| Any machine with Ollama 0.40.4 or later | Gemma 4 12B on Ollama, `q4_k_m` | 11.1 GB in Ollama, read on a 64 GB Mac; a 16 GB machine was not tried | 8,192 tokens | not recorded |

Measured on one Apple M5 Pro with 64 GB; no smaller Mac was measured, and GB are 10⁹ bytes.
The Qwen base runs from its 6-bit build too; its 4-bit build is for Macs with more than 32 GB.

<span class="fp-anchor" id="2-start-it"></span>

## Start the build that fits

On a 64 GB Mac, the TL;DR command starts the 31B.
On a smaller Mac, start the build that fits it instead:

:::tabs

::tab{label="48 GB"}

`--revision v0.15.0` serves the build that was measured, whatever its repository holds later.

::site-block{name="mac-31b-4bit"}

::tab{label="32 GB"}

::site-block{name="mac-12b"}

:::

<span class="fp-anchor" id="read-pictures-on-a-mac"></span>

## Read pictures on a Mac

A Gemma 4 base reads pictures on a Mac with the engine that reads its text, through the same request path as on a GPU.
Add the `mlx-images` extra and start with `--images on`:

::upstream{file="docs/running.md" section="Images on a Mac" block="1"}

- A conversion made for text has no vision weights, so the server takes them from the base's vision add-on: 100 MB for the 12B and 1.15 GB for the 31B, downloaded once and checked before every start.
- A request without pictures is answered as before.
- Box questions are not served on a Mac: the server answers 400, and `/health` reports `images.box` as false.

Measured through the Mac server on one Apple silicon Mac with 64 GB, at an image budget of 560, as the median of 10 requests with one picture and a short state; no other Mac has been tried:

| Build | One picture | Process memory (MLX's peak) |
| --- | --- | --- |
| 12B, Google's bf16 checkpoint | 1.0 s | 24.2 GB (23.0 GB) |
| the previous tuned 12B, 6-bit MLX conversion with the add-on | 1.1 s | 11.1 GB (9.9 GB) |
| 31B, 4-bit MLX build with the add-on | 3.4 s | 20.7 GB (20.3 GB) |

All three placed a square right in 8 of 8 questions, at budgets 280 and 560.
Against decisio on vLLM, on 60 held-out items, neither MLX build changed an answer, though their probabilities differ from vLLM's because they are quantized builds.

<span class="fp-anchor" id="3-mind-the-memory"></span>

## Mind the memory

- The server sets MLX's memory limits itself before it loads the model, and prints them in a start-up line that begins `MLX MEMORY`.
- When the model cannot fit, it refuses to start, with the numbers, instead of freezing the Mac:

::upstream{file="docs/running.md" section="Memory on a Mac" block="1"}

- Run one model server on a Mac at a time: two servers can each stay under their own limit and still add up to more than the Mac has.
- `/health` reports the memory under `memory`; watch `physical_footprint_bytes`, the figure Activity Monitor shows, not the resident size.

## On a laptop, with Ollama

Ollama runs Decisio v3 and the untrained Gemma 4 12B on Mac, Linux or Windows, each with its own temperatures.
It works on Ollama 0.40.4 or later.

::site-block{name="ollama-pull-v3"}

| Listing | Tag | Size |
| --- | --- | --- |
| `aminroudaki/decisio-v3`, Decisio v3 | `q8_0`, also `latest` | 12.7 GB file |
| `aminroudaki/decisio-v3` | `q4_k_m` | 7.4 GB file |
| `aminroudaki/decisio-gemma`, the untrained 12B | `q4_k_m`, also `latest` | 11.1 GB in Ollama |
| `aminroudaki/decisio-gemma` | `q8_0` | 15.9 GB in Ollama |

The untrained listing's memory is the runner's resident set at the listings' 8,192-token context, read on a 64 GB Mac while it answered text, a picture and a 6,600-token text; a 16 GB machine was not tried.
Then ask a question on Ollama's decision route, on port 11434, with the listing named in `model`; a picture goes in the request's `images` field, base64-encoded:

::site-block{name="ollama-request-gemma"}

Measured on the same Mac on 2026-11-15, the base's `q8_0` tag chose the same answer as decisio's own server (MLX, 8-bit) on 98.3% of 300 text questions, and its `q4_k_m` tag chose the same answer as decisio's 4-bit MLX build on 87.0%.

How Ollama differs from a decisio server:

- Each question's prompt lists only its own question when a request has several.
- Past 68 options the option letters are llama.cpp's codes, not decisio's.
- Pictures go before the text, not at their places in it; a picture is not limited to one question, and Ollama reads it near its own resolution.
- There is no Box question.
- The commit flavor, thinking, reading twice, tasks, abstention and the fast table need a decisio server.

The Qwen listing, `aminroudaki/decisio`, needs Ollama 0.35.1 through 0.40.3; on a current Ollama use the Gemma listings, or decisio's MLX server on a Mac.

<span class="fp-anchor" id="4-what-a-mac-does-not-serve"></span>

## What does a Mac not serve?

- Box questions, the Qwen base's second image engine (`--image-model`), adapters (`--adapter`), packed mode.
- FP8 checkpoints: a Mac always names an MLX build with `--model`.
- Teaching a task works, slowly: on the 31B 4-bit, about an hour for 770 labelled examples (77 options) and about 2.6 hours for 1,500 (150 options).

## What next

- [Get started](/docs/#3-ask-your-first-question): send your first question and read the answer.
- [Requirements and limits](/docs/limits/): every machine, the context length and what was measured on what.
- [Teach a task](/docs/tasks/): teach a question you ask again and again, and certify its answers.
