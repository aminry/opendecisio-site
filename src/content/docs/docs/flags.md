---
title: Server flags
description: The flags a production server sets first, then every flag with its value for each model, from decisio's own reference.
---

<!-- Site-written: the intro and the first table. The reference below is decisio's docs/cli.md at the pinned release; the first table's facts are that file's and docs/running.md's (src/config/sourced.mjs checks them). -->

::covers{links="README.md#options docs/reference/flags.md=every-flag"}

With no flag, the server serves Gemma 4 31B with the settings it was measured with; most deployments set only `--base`.
A flag you give overrides the model's value.
In the container, `DECISIO_BASE` and `DECISIO_PORT` do the same as `--base` and `--port`.

## Flags to set first

| Flag | Why |
| --- | --- |
| `--base` | picks the model, its checkpoint at a pinned revision, and its measured settings |
| `--model`, `--revision` | serve a specific checkpoint, at a revision you pin |
| `--host`, `--port` | the server listens on `127.0.0.1:8000`; put a proxy in front |
| `--max-model-len` | pins one text length; without it the Gemma models take what the card holds, so cards that differ serve different lengths |
| `--gpu-memory-utilization` | the model's share of the card; it changes how long a text the card holds, a lot |
| `--tasks-file` | loads exported tasks at start, so a restart keeps them |
| `--deterministic-compile` | off by default; turn it on on the 12B for certified tasks on several replicas or fresh nodes, so cold starts answer alike, and leave it off on the 31B ([Certify answers](/docs/tasks/certify/#5-keep-it-valid)) |
| `--served-name` | the name `GET /v1/models` lists, kept stable across a change of model |
| `--kv-cache-dtype` | `fp8` holds a longer text, but suspends a certificate made without it |
| `--engine-process` | matters only with a second engine (`--image-model`, `--head-engine`, `--one-engine`) |
| `--backend mlx` | serves on a Mac, from an MLX build |
| `--debug-readout` | leave it off in production |

The text length and the cache type are part of what a certificate covers: change either, and certify your tasks again.

## Every flag

::upstream{file="docs/cli.md" depth="3"}

## What next

- [Choosing a model](/docs/bases/): what `--base` picks.
- [Scale](/docs/scale/#5-set-the-flags-that-move-server-time): the flags that move server time, and what each costs.
- [Operate](/docs/operating/): running a server in production.
