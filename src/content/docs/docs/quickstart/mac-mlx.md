---
title: Mac with MLX
description: Run the server on Apple silicon from an MLX conversion of a base; the 12B on a 32 GB Mac, the 31B on a 64 GB one.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The section below is decisio's docs/running.md at the pinned release. -->

`--backend mlx` serves the text route on Apple silicon, with every feature of that route, from a conversion of a base's checkpoint.
A Mac always names its conversion with `--model`.

::figure{name="mlx-memory"}

## TL;DR

::upstream{file="docs/running.md" section="Mac with MLX" block="1"}

The block starts the three bases, one at a time: pick one of the last three lines.

:::glossary

| Word | Meaning |
| --- | --- |
| MLX | Apple's array framework for Apple silicon, which the backend runs on |
| conversion | a base's checkpoint converted to MLX, here at 6 bits (the Qwen base also at 4) |
| peak memory | the most memory the server used at that length of state |

:::

:::caution[Common mistake]
The 31B on a Mac is documented for states up to 16,383 tokens, and only on the 64 GB Mac that was measured.
At 32,687 tokens it runs, with memory pressure.
:::

## The details of each base

::upstream{file="docs/running.md" section="Mac with MLX"}

## What next

- [Choose your machine](/docs/quickstart/): the other paths.
- [Choosing a base](/docs/bases/): what each base is for.
- [Flags and options](/docs/flags/): the Mac's own flags, `--prefix-cache-mb` and `--tokenizer`.
