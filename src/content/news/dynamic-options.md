---
title: "decisio can now teach and certify questions whose options change"
summary: "decisio 0.37.0 can certify answers whatever options a request brings, such as which brand a product title names. About half the answers certified, at a 5% target, on five question types."
date: 2026-10-30
tags: [release]
---

Until now, a task needed the same options in every request.
Many real questions do not work that way: which brand a product title names, which of this request's tools to call.
decisio 0.37.0 can teach them, and certify the answers it can.

## What it does

Register the question with `"options": "dynamic"` and a `certify` block, with examples that each carry their own options.
Every such task gets a certificate on the model's own top probability, whatever options a request carries.
A small re-ranker is kept only where cross-validation on your examples shows a gain, with no extra model and well under a millisecond added.

## What it gives

Pooled over five recurring questions, with 200 labels used for the fit:

| | Gemma 4 12B | Gemma 4 31B |
| --- | ---: | ---: |
| The model alone: accuracy | 80.3% | 83.2% |
| The model alone: answers certified, and the error among them | 53.3%, 3.3% | 54.4%, 3.3% |
| With the re-ranker as shipped: accuracy | 84.1% | 85.0% |
| With the re-ranker as shipped: answers certified, and the error among them | 55.2%, 3.9% | 54.9%, 3.2% |

::source[Measured offline with the server's own code, on Gemma 4 readouts taken with decisio 0.35.0 and vLLM 0.31.0 on one RTX PRO 6000 Blackwell at 600 W, 2026-10-30: brand from a product title, entity linking, tool choice, product matching and intent routing, the mean over the five of the median over three draws of 200 labels, at a 5% error target.]

Brand detection, tool choice and intent routing are right on 91 to 96% of requests, and most of their answers are certified with no teaching at all.

## What it costs

- **Hard matching may certify nothing.** On linking a mention to an entity and matching a search to a product, where the model was right on 57 to 67% of requests, no answer met a 5% error target, though the re-ranker added 3 to 10 points of accuracy there.
- **The error among certified answers can rise,** as it did on the 12B, from 3.3% to 3.9%, inside the target.
- **A `certify` block is required,** with 59 held-out examples at the defaults, and it covers choice questions only.
- **These are five question types and two model sizes:** your task may gain more or nothing, and its cross-validation says which.

Your option texts are kept only as hashes and counts, and no request text is stored.
A monitor watches the share of requests whose options your examples never contained, where options recur, and an alert suspends certification.
[Teach a task whose options change](/docs/tasks/dynamic/) has the whole setup.
