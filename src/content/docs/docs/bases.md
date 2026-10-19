---
title: Choosing a base
description: The three models served behind the same routes, their provenance, and when to choose each.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The page below is the README's "Choosing a base" at the pinned release. -->

Three base models are served behind the same routes, wire format and features, one per server, chosen with `--base`.
With no flag the server serves Gemma 4 31B.

::figure{name="bases-compare"}

## TL;DR

::upstream{file="README.md" section="Choosing a base" block="1"}

:::glossary

| Word | Meaning |
| --- | --- |
| base | the model a server serves, with its checkpoint at a pinned revision and every setting measured as one configuration |
| FP8 | 8-bit floating point; the 31B's weights are stored in it, quantized once with the arithmetic vLLM uses on load |
| provenance | where a base's weights come from: each is an official checkpoint, frozen, with no training or fine-tuning by us |

:::

:::caution[Common mistake]
The 31B's numbers were measured in its own session, on another card of the same type, so they are not paired with the other two bases'.
Compare the three on the paired rows, and read the card before quoting a difference ([the evaluation card](/docs/evaluation-card/)).
:::

## The choice

::upstream{file="README.md" section="Choosing a base" covers="README.md#choosing-a-base"}

## What next

- [Pick your machine](/docs/#1-pick-your-machine): what each base needs to run.
- [Flags and options](/docs/flags/): `--base` and everything it sets.
- [The evaluation card](/docs/evaluation-card/): what was measured, on what, for each base.
