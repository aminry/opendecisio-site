---
title: Teach it your question
description: Register a question you ask again and again from a few labelled examples; the server keeps each correction only if cross-validation shows it helps.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The guide below is decisio's docs/tasks.md at the pinned release. -->

A server can learn one recurring question from your own labelled examples, without training or changing the model.

::figure{name="teach-it"}

## TL;DR

With a server running ([Get started](/docs/) starts one, from a clone of decisio), register the example task, a synthetic ticket-routing question with 12 queues and 120 labelled tickets:

::upstream{file="README.md" section="Teach it your question" part="intro"}

:::glossary

| Word | Meaning |
| --- | --- |
| task | one question you ask again and again, with the same options every time |
| calibration | one correction per option that removes a steady bias toward some options and makes the probabilities honest |
| intent head | a small linear layer on the model's hidden state, for questions with 10 or more options, that learns what your labels mean in your data |
| cross-validation | the server splits your examples in five, scores each part with a fit made on the other four, and keeps the fit only if it helps |

:::

:::caution[Common mistake]
Registration is per server and in memory: a restart, or a second server behind a load balancer, does not see a task registered on another.
Export it with `GET /v1/tasks?full=1`, and start each server with `--tasks-file`.
:::

::upstream{file="docs/tasks.md"}

## What next

- [Use the probability](/docs/guides/probability/): where to set the line once the probabilities are honest.
- [Long documents and many options](/docs/guides/long-and-wide/): the heads, on lists of 77 and 150 options.
- [The HTTP API](/docs/api/): the task routes, field by field.
