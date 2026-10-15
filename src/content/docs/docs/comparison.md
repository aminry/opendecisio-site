---
title: How it compares
description: "The three bases beside Jev and three open entries on the Decision Index: values and intervals as of 2026-10-05, with the source of each."
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The text is decisio's docs/comparison.md at the pinned release; the tables are on the Benchmarks page. -->

The comparison sets decisio's three bases beside Jev and three open-weights entries from the Decision Index's public board: values and intervals as of 2026-10-05.
It is a record of values with their dates and intervals, not a ranking.

::figure{name="compare-headline"}

## TL;DR

The numbers come from the public harnesses run against a server; what you can run here is the server they were run against:

```bash
curl -s http://127.0.0.1:8000/v1/models
```

:::glossary

| Word | Meaning |
| --- | --- |
| Decision Index | a public benchmark suite for decision models; decisio's runs here are self-run, and its rows are listed on the board's data file of 2026-10-14 ([the benchmarks page](/benchmarks/#decision-index)) |
| self-run | measured by us with the public harness, not by the board |

:::

:::caution[Common mistake]
Reading a mark as a ranking.
A difference counts only when it lies outside a 95% interval for the benchmark's size; otherwise the cell is level, and nothing here is a rank.
:::

## What the comparison says

::upstream{file="docs/comparison.md" part="intro"}

Every benchmark, by area, and the capabilities each side has, are on [Benchmarks](/benchmarks/#compares).

## What next

- [The evaluation card](/docs/evaluation-card/): what each of our numbers was measured on.
- [Limits](/docs/limits/): what the numbers do not say.
- [Benchmarks](/benchmarks/): the tables, with the record behind every figure.
