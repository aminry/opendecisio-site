---
title: GPU server
description: Run the server on Linux with one NVIDIA card; the default base is Gemma 4 31B, which needs a 96 GB card.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The section below is decisio's docs/running.md at the pinned release. -->

One NVIDIA card, Linux and four commands start the measured system.
The first start downloads the checkpoint, so it takes minutes, not seconds.

::figure{name="gpu-start"}

## TL;DR

::upstream{file="docs/running.md" section="GPU server" block="1"}

The server listens on `http://127.0.0.1:8000`; `GET /health` answers once it is ready, and [Get started](/docs/) sends a first question to it.

:::glossary

| Word | Meaning |
| --- | --- |
| base | the model the server serves; with no flag, Gemma 4 31B |
| checkpoint | the model's weights, downloaded into the Hugging Face cache on the first start |
| FP8 | the 8-bit floating-point format the 31B's weights are stored in, 30.6 GiB in memory |
| uv | the Python package manager the commands use |

:::

:::caution[Common mistake]
The 31B is measured on, and needs, a 96 GB card.
On a smaller card pick another base with `--base`: [Choosing a base](/docs/bases/) says which fits what.
:::

## The requirements and the flags

::upstream{file="docs/running.md" section="GPU server"}

## What next

- [Choose your machine](/docs/quickstart/): the other four paths.
- [Flags and options](/docs/flags/): every flag and its default per base.
- [Health and monitoring](/docs/health/): what `/health` says once it is up.
