---
title: "The tuned 12B can think on hard choice questions"
summary: "A third setting for the tuned 12B, commit-think, reads a few unsure choice questions again after a short reasoning step, and is right more often on hard decisions."
date: 2026-10-26
tags: [release]
---

The tuned 12B has a third setting, `commit-think`, on top of the calibrated and commit ones.
It keeps the commit settings and adds a short reasoning step on the choice questions it is least sure of.

## What it does

A choice question whose likeliest option is under 0.3712 is read again after the model writes up to 256 tokens of reasoning.
Every other question is answered in one read, so the median decision stays at 60 ms, and the slowest of 2,044 took 4.71 s.
A text longer than 45,000 tokens is cut to its start and answered without thinking.

## What it adds

Against the same model without thinking, on held-out questions:

| Held-out set | Items | Thinking on | Difference, points (90% interval) |
| --- | ---: | ---: | --- |
| Hard decisions with rules, exceptions and arithmetic | 525 | 8.95% | +4.95 (+3.43 to +6.67) |
| Decisions in natural, everyday wording | 939 | 2.56% | +0.75 (+0.21 to +1.38) |
| A mixed development set | 430 | none | no change |

::source[Measured with decisio 0.33.0 on one RTX PRO 6000 Blackwell at 600 W, 2026-10-26, serving the tuned commit model with the commit-think settings given as flags, from cold starts, one request at a time, on questions screened against our training data.]

- **The settings were chosen on the hard set,** so its gain is optimistic. The natural-wording set was not used to choose them.
- **Choice calibration is unchanged within noise.**

## Run it

On a GPU with room for about 24 GB of bf16 weights, with decisio 0.35.0 or later: `python -m decisio.serve.vllm_engine --base tachara-ai/Decisio-12b-tuned-commit-think@e36aeb24`.
[Serve the tuned 12B](/docs/deploy/tuned-12b/) has every way to run the tuned model.
