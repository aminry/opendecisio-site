---
title: "decisio can now teach and certify questions whose options change"
summary: "A dynamic task can certify answers whatever options a request brings, such as which brand a product title names. About half the answers certified, at 3.3% error, in our study."
date: 2026-10-30
tags: [release]
---

Until now, a task needed the same options in every request.
Many real questions do not work that way: which brand a product title names, which of these tools fits a command, which queue a message belongs in.
decisio TODO(release) can teach them, and certify the answers it can.

## What it does

Register the question with `"options": "dynamic"` and `"match": "instructions"`, with examples that each carry their own options.
Every such task gets a certificate on the model's own answer, which holds whatever options a request carries; on brand detection, choosing a tool and routing it covered 79 to 97% of answers.
A small re-ranker is added only where cross-validation on your examples shows a gain.

## What it gives

On five kinds of task at 200 labelled examples, the certificate alone covered 53.3% of answers on the 12B and 54.4% on the 31B, at 3.3% error.
The re-ranker added 3.7 points of accuracy on the 12B and 2.0 on the 31B, in under a millisecond per request, with no extra model.

::source[Measured with decisio 0.35.0 and vLLM 0.31.0 on one RTX PRO 6000 Blackwell at 600 W, 2026-10-30, median over draws, equal weight per kind of task. The accuracy gains are for the re-ranker without an encoder, from a check made after the study; the certified shares with the re-ranker are for the study's version with one.]

## What it costs

- **Hard matching may certify nothing.** On linking a mention to an entity and matching a search query to a product, where the model was right on 57 to 68% of requests, no answer met a 5% error target, though the re-ranker raised accuracy most there.
- **More accuracy can mean a smaller certified share.** With the re-ranker on the 31B, routing was 1.1 points more accurate and certified 69.7% of answers against 80.0%.
- **Your option texts are kept as hashes and counts** from your own examples; no request text is stored.

A monitor reports the share of requests whose options were never seen in your examples, and an alert suspends certification.
[Teach a task whose options change](/docs/tasks/dynamic/) has the whole setup.
