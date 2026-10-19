---
title: Ollama
description: Run the laptop build through Ollama; the Gemma listing fits a 16 GB laptop.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The section is decisio's docs/running.md at the pinned release; the requests below it are the site's, run by scripts/verify-ollama.mjs. -->

Ollama packages laptop versions of two bases for its decision route.
The Gemma listing is the one for a 16 GB laptop.

::figure{name="ollama-tags"}

## TL;DR

::upstream{file="docs/running.md" section="Ollama" block="1"}

Then [ask a question](#ask-a-question) of the listing you pulled.

:::glossary

| Word | Meaning |
| --- | --- |
| listing | a model page on Ollama's library, with its tags and sizes |
| tag | one build of a listing: `q4_k_m` (also `latest`) and `q8_0` for the Gemma listing |
| decision route | Ollama's route for typed questions, `/v1/systemone` |

:::

:::caution[Common mistake]
Ollama builds its own prompt and applies no calibration, so its numbers are the ones on its model pages, not the ones in this repository.
It needs Ollama 0.35.1 or later.
:::

## The listings

::upstream{file="docs/running.md" section="Ollama" covers="README.md#ollama"}

## Ask a question

<!-- Site-written: decisio's docs give the pulls only. The blocks are in src/lib/site-blocks.mjs, run by scripts/verify-ollama.mjs. -->

Send the support-ticket example from [Get started](/docs/#3-ask-your-first-question) to Ollama's decision route, naming the listing.
The Gemma listing, the one for 16 GB laptops:

::site-block{name="ollama-request-gemma"}

The Qwen listing, which needs a machine with more memory:

::site-block{name="ollama-request"}

## What next

- [Pick your machine](/docs/#1-pick-your-machine): the other paths.
- [Choosing a base](/docs/bases/): which base is which.
- [Mac with MLX](/docs/quickstart/mac-mlx/): the same laptop, served by decisio itself.
