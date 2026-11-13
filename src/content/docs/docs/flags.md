---
title: Server flags
description: Choose server settings by purpose, with release-aligned defaults and links to the relevant guides.
---

<!-- Site-written: the intro and the first table. The reference below is decisio's docs/cli.md at the pinned release; the first table's facts are that file's and docs/running.md's (src/config/sourced.mjs checks them). -->

::covers{links="docs/cli.md README.md#options docs/reference/flags.md=every-flag"}

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
| `--batch-invariant` | off by default; `on` keeps repeated 12B reads independent of the batch and prefix cache, at an added cost; certify again after a change ([Limits](/docs/limits/#3-set-up-for-production)) |
| `--served-name` | the name `GET /v1/models` lists, kept stable across a change of model |
| `--kv-cache-dtype` | `fp8` holds a longer text, but suspends a certificate made without it |
| `--engine-process` | matters only with a second engine (`--image-model`, `--head-engine`, `--one-engine`) |
| `--backend mlx` | serves on a Mac, from an MLX build |

The text length and the cache type are part of what a certificate covers: change either, and certify your tasks again.

<span id="every-flag-1"></span>
<span id="what-the-behaviour-flags-do"></span>

<span id="every-flag"></span>

## Configuration reference

Choose the group that matches the setting you need.
The tables are taken from the pinned server reference.

::upstream{file="docs/cli.md" section="Model and engine" heading="keep" depth="3"}

::upstream{file="docs/cli.md" section="The prompt" heading="keep" depth="3"}

::upstream{file="docs/cli.md" section="Temperatures and outputs" heading="keep" depth="3"}

::upstream{file="docs/cli.md" section="Several questions and padding" heading="keep" depth="3"}

::upstream{file="docs/cli.md" section="Tasks and abstention" heading="keep" depth="3"}

::upstream{file="docs/cli.md" section="Images" heading="keep" depth="3"}

::upstream{file="docs/cli.md" section="The Mac (--backend mlx)" heading="keep" depth="3"}

<span id="verification"></span>
<span id="several-questions-in-one-request---multi-question"></span>
<span id="row-padding---pad-policy-row"></span>
<span id="determinism"></span>
<span id="committed-yesno-answers---noul-commit"></span>
<span id="the-compact-layout---prompt-tail-compact"></span>

## Good to know

Use [Scale](/docs/scale/), [prompt layouts](/docs/layout/), [thinking](/docs/think/) and [certification](/docs/tasks/certify/) for worked guidance on behavior settings.
After a setting changes the serving setup, certify the affected tasks again.

## What next

- [Choosing a model](/docs/bases/): what `--base` picks.
- [Scale](/docs/scale/#5-set-the-flags-that-move-server-time): the flags that move server time, and what each costs.
- [Operate](/docs/operating/): running a server in production.
