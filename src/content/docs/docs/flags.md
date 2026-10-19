---
title: Flags and options
description: The behaviour flags, then every flag with its default per base.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The behaviour flags are the README's "Options" and the reference is decisio's docs/cli.md, at the pinned release. -->

The served defaults need no flags: every default is what was measured, base by base.
A flag is for the few times you want something else, and an explicit flag overrides the base's value.

::figure{name="flag-map"}

## TL;DR

The base is the one flag most deployments set; with none, the server serves Gemma 4 31B:

::upstream{file="README.md" section="Choosing a base" block="1"}

:::glossary

| Word | Meaning |
| --- | --- |
| base | the model the server serves, chosen with `--base`, which brings its checkpoint and every setting marked "the base's" |
| served default | the value a flag has when you give none, measured as one configuration per base |
| backend | `vllm` (the default), `mlx` for Apple silicon, `hf` for the CPU stand-in |

:::

:::caution[Common mistake]
`--multi-question warm`, `--pad-policy row` and `--register-boundary after` trade something for speed (an answer that depends on the batch, a little repeatability, throughput).
Each has its cost in the reference below; turn one on knowing it, and measure on your own questions.
:::

## The behaviour flags

::upstream{file="README.md" section="Options" covers="README.md#options"}

## Every flag

::upstream{file="docs/cli.md" depth="3"}

## What next

- [Scale](/docs/scale/#5-set-the-flags-that-move-server-time): which of these flags change server time, and by how much.
- [Choosing a base](/docs/bases/): what `--base` picks.
- [Operate](/docs/operating/): running a server with its flags.
