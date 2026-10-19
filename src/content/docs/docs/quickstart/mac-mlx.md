---
title: Mac with MLX
description: Run the server on Apple silicon from an MLX conversion of a base; the 12B on a 32 GB Mac, the 31B on a 64 GB one, or on a 48 GB one from its 4-bit conversion.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The section below is decisio's docs/running.md at the pinned release. -->

`--backend mlx` serves the text route on Apple silicon, with every feature of that route, from a conversion of a base's checkpoint.
A Mac always names its conversion with `--model`.

::figure{name="mlx-memory"}

## TL;DR

::upstream{file="docs/running.md" section="Mac with MLX" block="1"}

The block starts the three bases, one at a time: pick one of the last four lines.
The last two both start the 31B, at 6 bits on a 64 GB Mac or at 4 bits on a 48 GB one.

:::glossary

| Word | Meaning |
| --- | --- |
| MLX | Apple's array framework for Apple silicon, which the backend runs on |
| conversion | a base's checkpoint converted to MLX, here at 6 bits (the Qwen base and the 31B also at 4) |
| peak memory | the most memory the server used at that length of state |

:::

:::caution[Common mistake]
The 31B on a Mac is documented for states up to 16,383 tokens, at 6 bits and at 4, and was measured only on a 64 GB Mac.
At 32,687 tokens the 6-bit conversion runs, with memory pressure.
The 4-bit conversion starts on a 48 GB Mac by decisio's memory planner, but no 48 GB Mac was measured.
:::

## The details of each base

::upstream{file="docs/running.md" section="Mac with MLX" covers="README.md#mac-with-mlx"}

## What next

- [Pick your machine](/docs/#1-pick-your-machine): the other paths.
- [Choosing a base](/docs/bases/): what each base is for.
- [Flags and options](/docs/flags/): the Mac's own flags, `--prefix-cache-mb` and `--tokenizer`.
