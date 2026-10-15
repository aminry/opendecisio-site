---
title: CPU stand-in for development
description: Serve every route from a small model on the CPU, to build against the API anywhere.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The section below is decisio's docs/running.md at the pinned release. -->

The stand-in serves the same routes from a small model, so you can develop and test a client without a card.
It is not the measured system, and its answers are not for measurement.

::figure{name="stand-in"}

## TL;DR

::upstream{file="docs/running.md" section="CPU stand-in for development" block="1"}

The commands on these pages that the stand-in can serve are run against it.

:::glossary

| Word | Meaning |
| --- | --- |
| stand-in | `--backend hf`: every route, from `Qwen/Qwen3-0.6B-Base` on the CPU |
| unit tests | `uv run pytest`, which runs on any machine; the GPU tests need a card |

:::

## What it is, and is not

::upstream{file="docs/running.md" section="CPU stand-in for development"}

## What next

- [Get started](/docs/): send a first question to it.
- [Teach it your question](/docs/tasks/): the walk-through that runs on a laptop against the stand-in.
- [Choose your machine](/docs/quickstart/): the paths that run the real bases.
