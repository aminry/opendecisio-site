---
title: Teach a task whose options change
description: Teach and certify a question whose options are different in every request, such as which brand a product title names, from a few hundred labelled examples.
---

<!-- Site-written: the Teach a task whose options change guide. DRAFT until the decisio release that contains options: dynamic; its API names and numbers are checked against that release's docs before merging. The figures are the study's, on decisio 0.35.0; re-check them against decisio's docs at the release. -->

Some questions keep their wording while their options change with every request: which brand a product title names, which of these tools fits a command, which of these products a listing is.
Register such a question as a dynamic task, and decisio certifies its answers whatever options a request brings.
Each example carries its own options:

::site-block{name="dynamic-register"}

## 1. Check that it fits

- **It fits** a question asked with the same instructions every time, where each request brings its own candidates.
- **It does not replace a fixed task:** with the same options every time, [teach a fixed task](/docs/tasks/), which can also fit an intent head.
- **Hard matching may certify nothing.** On entity linking and product matching, where the model was right on 57 to 68% of requests, no answer met a 5% error target.

## 2. Register it

- **`"options": "dynamic"` and `"match": "instructions"`** make one task of every request with these instructions, whatever its options.
- **Each example is an ordinary request plus its answer,** with the options that request had. Use `null` as the answer for "none of these", when the request offers that option.
- **About 200 examples are enough to start:** 1,000 added little in our study. Certifying needs at least 59 held-back examples, as for any certified task.
- **Only option texts from your own examples are kept,** as a table of hashes and counts; no request text is stored.

## 3. Read what it kept

Every dynamic task gets two things, and may get a third:

- **A certificate on the model's own answer,** which holds whatever options a request carries. On five kinds of task it certified 53.3% of answers on the 12B and 54.4% on the 31B, at 3.3% error.
- **A re-ranker,** kept only when cross-validation on your examples shows a gain. It weighs a few features of each option, such as how it overlaps the text and how often it was the answer. It added 3.7 points of accuracy on the 12B (84.0% against 80.3%) and 2.0 on the 31B (85.2% against 83.2%), in under a millisecond per request, with no extra model.
- **The registration response says which it kept,** as it does for a fixed task.

::source[Measured with decisio 0.35.0 and vLLM 0.31.0 on one RTX PRO 6000 Blackwell at 600 W, 2026-10-30, on five kinds of task at 200 labelled examples, median over draws, equal weight per kind. The accuracy gains are for the re-ranker without an encoder, from a check made after the study; the certified shares with the re-ranker are for the study's version with one.]

## 4. Know what it costs and where it helps

- **It helps most where the model is weakest:** the re-ranker added most on entity linking and product matching, while brand detection, choosing a tool and routing were already right on 91 to 96% of requests.
- **A more accurate model can certify less.** With the re-ranker on the 31B, routing was 1.1 points more accurate and certified 69.7% of answers against 80.0%.
- **No kind of task got worse in accuracy.**
- **The re-ranker's time is small beside the model's** read, a median of 48 to 72 ms on these tasks.

## 5. Watch it

- **The monitor also reports the share of requests whose options were never seen in your examples.** When that share moves, the re-ranker's sense of how often an option is the answer no longer means what it did.
- **An alert suspends certification,** as for any certified task: answers keep coming, marked `certified: false`.

## What next

- [Certify answers](/docs/tasks/certify/): what a certificate promises.
- [Watch for drift](/docs/tasks/drift/): the traffic monitor and its alerts.
- [Teach a task](/docs/tasks/): a question with the same options every time.
