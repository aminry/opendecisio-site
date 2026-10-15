---
title: The evaluation card
description: What was measured, on what, and what was fitted on what, for each base.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The card below is decisio's EVAL_CARD.md at the pinned release. -->

Every figure on these pages comes from a record named in this card, with its host, card and power limit.
The card also says what each number was fitted on, so you can tell a measurement from a fit.

::figure{name="eval-card-map"}

## TL;DR

A server says which base, checkpoint and revision it is serving, which is what the card's numbers refer to:

```bash
curl -s http://127.0.0.1:8000/health
```

:::glossary

| Word | Meaning |
| --- | --- |
| suite | a private 1,400-item set of eight tasks the temperatures were fitted on, so its figures are in-sample |
| Decision Index | the public benchmark suite; the figures here are our own runs, and decisio's rows listed on the board (its data file of 2026-10-14) are on [the benchmarks page](/benchmarks/#decision-index) |
| JevBench | the board whose published questions and axes the README compares on |
| gate | a check a base or conversion must pass before it is served |

:::

## The card

::upstream{file="EVAL_CARD.md"}

## What next

- [How it compares](/docs/comparison/): the three bases beside Jev and three open entries, with values and intervals.
- [Limits](/docs/limits/): what the numbers do not say.
- [Repeatability](/docs/repeatability/): what repeats, and what can move.
