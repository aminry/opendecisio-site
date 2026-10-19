---
title: How it works
description: Send a text and your questions; decisio reads the text once and gives a probability for every option, in one call, with no text generated.
---

<!-- Site-written: the one visual page of how decisio works, merging How it works, What the probability means and Repeatability. The diagrams are drawn at build time (src/lib/diagrams.mjs, src/lib/figures/); the request and its answer are the first recorded decision; the facts are decisio's README, docs/cli.md, docs/running.md, docs/tasks.md and EVAL_CARD.md at the pinned release (src/config/sourced.mjs checks them). -->

::covers{links="README.md#how-it-works"}

A support ticket and three questions about it:

::site-block{name="first-decision-request"}

::site-block{name="first-decision-response"}

::recorded-label

## 1. The request flow

::diagram{name="request-flow"}

- The text is read once per request, and every question is answered from that read.
- On the default model the questions are answered together; on the other two, one after another. Either way they pick the same options on every item measured.
- A later request about the same text starts from what was read, so it is quick.

## 2. One decision and its probabilities

::figure{name="one-pass"}

Each question becomes one prompt that ends where the answer goes, and decisio reads the model's probability for each option at that point.
The probabilities add up to 1, and three things shape them:

| What | Where it comes from |
| --- | --- |
| The model's own setting | fitted once per model; it never changes which option is likeliest |
| Your task's correction | learned from your labelled examples, and kept only when it helps |
| The certified threshold | set when you certify a task: answers at or above it are certified |

A task's correction makes the probabilities more honest: on six held-out tasks, 20 labelled examples each lowered the calibration error from 0.058 to 0.037 (the Qwen model, 900 test items, 2026-09-29).

## 3. Teach, then certify, then route

::figure{name="teach-flow-all"}

On the support inbox, :value{name="inbox-certified-5"} of the messages were answered on their own at a 5% error target (BANKING77, Gemma 4 31B, decisio 0.14.0; [Certify answers](/docs/tasks/certify/)).

- After upgrading decisio, certify your tasks again.
- A certificate covers one task on one serving setup. Certify again when you change either.

## 4. Where it runs

::figure{name="layouts"}

## What repeats

| Model | Asked again, on the same server | Many questions in one request | After a restart |
| --- | --- | --- | --- |
| Gemma 4 31B | exactly, on a freshly started server; on one that has already answered, 5 of 200 moved, by at most 0.031, with no top answer changed | the same choice on every item measured; probabilities within 0.0073 | not promised |
| Gemma 4 12B | a first read and a cached read can differ, by up to 0.113 | the same choice; probabilities within 0.035 | not promised |
| Qwen3.6-35B-A3B | the same probabilities every time | the same probabilities as each question on its own | an earlier record matched in most starts measured |

The top answer rarely moves: on the 12B, one choice of 60 changed between a first and a cached read. Exact numbers repeat only on one running server.

## Under the hood

- decisio runs on stock vLLM 0.31.0: a plugin registers its model classes, and no patch is needed.
- Every model is an official checkpoint, frozen: no training, no fine-tuning, no adapter unless you serve one with `--adapter`.
- A taught task's intent head reads the model's internal representation of the text at the answer position.
- On a Mac, the MLX engine answers each question on its own from one shared read of the text.

## What next

- [Teach a task](/docs/tasks/): teach decisio your question from labelled examples.
- [Certify answers](/docs/tasks/certify/): the promise behind a certified answer.
- [Choosing a model](/docs/bases/): which of the three models to serve.
