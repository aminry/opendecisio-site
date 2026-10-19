---
title: Evaluation card
description: What was measured, on what, and what was fitted on what, for each base.
---

<!-- Site-written: the intro, the section table and the links. The card below is decisio's EVAL_CARD.md at the pinned release. -->

What decisio was measured on, with which card and settings, and what each number was fitted on, so you can tell a measurement from a fit.
Your own server says which model, checkpoint and revision it serves, the configuration the card's numbers refer to:

```bash
curl -s http://127.0.0.1:8000/health
```

| Your question | Section |
| --- | --- |
| What was measured, on which card and settings? | [1. The system measured](#1-the-system-measured) |
| What can a server do? | [2. Capabilities](#2-capabilities) |
| How accurate and how well calibrated is the Qwen base? | [3. Numbers](#3-numbers) |
| Was a number measured, or fitted on the same items? | [4. What was fitted on what](#4-what-was-fitted-on-what) |
| What do the numbers not say? | [5. Limits](#5-limits) |
| The Gemma 4 12B model | [6. The Gemma base](#6-the-gemma-base) |
| The Gemma 4 31B model, the default | [7. The Gemma 4 31B base](#7-the-gemma-4-31b-base) |

## The card

::upstream{file="EVAL_CARD.md"}

## What next

- [Benchmarks](/benchmarks/): the measured results, compared and dated.
- [Requirements and limits](/docs/limits/): what was measured on what, in one table.
- [How it works](/docs/how-it-works/#what-repeats): what repeats, and what can move.
