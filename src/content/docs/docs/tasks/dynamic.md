---
title: Teach a task whose options change
description: Teach and certify a question whose options are different in every request, such as which brand a product title names, from a few hundred labelled examples.
---

<!-- Site-written: the Teach a task whose options change guide. DRAFT until decisio 0.37.0; its facts are decisio's docs/tasks.md ("Tasks whose options change with every request"), docs/api.md and docs/upgrading.md in the pull request that adds them, and are checked again at the release. -->

Some questions keep their wording while their options change with every request: which brand a product title names, which of this request's tools to call.
Register such a question as a dynamic task, and decisio certifies the answers it can, whatever options a request brings.
Each example carries its own options, and a `certify` block is required:

::site-block{name="dynamic-register"}

## 1. Check that it fits

- **It fits a recurring choice question** with the same instructions every time, where each request brings its own options.
- **It does not replace a fixed task:** with the same options every time, [teach a fixed task](/docs/tasks/), which can also fit an intent head. A fixed task registered for exactly a request's options is matched first.
- **Choice questions only, on the text route:** a yes/no or a score question is not a dynamic task.
- **Hard matching may certify nothing.** On linking a mention to an entity and matching a search to a product, where the model was right on 57 to 67% of requests, no answer met a 5% error target.

## 2. Register it

- **`"options": "dynamic"` and `"match": "instructions"`**, the only value, make one task of every later choice question with these instructions.
- **Each example's `answer` is one of its option keys,** or `null` for the request's none option: the key `none`, or the key you name in `"none_option"`.
- **The `certify` block is required:** a dynamic task is always certified, which needs 59 held-out examples at the defaults. Without one it does nothing.
- **What is stored:** the re-ranker's 13 weights and, for each option text in your examples, a hash and two counts. No request text or option text is stored.

## 3. Read what it kept

- **A certificate on the model's own top probability,** whatever the options. Every dynamic task gets it.
- **A re-ranker, where it helps.** It weighs 13 features of each option, such as how much of it occurs in the text and how often it was the answer in your examples. It is kept only when its 5-fold cross-validation beats the model's own answers, and the certificate is then made on its top probability. It needs no extra model and adds well under a millisecond.
- **`dynamic.applied` in the registration response** says whether it was kept, and why.

Pooled over five recurring questions, with 200 labels used for the fit:

| | Gemma 4 12B | Gemma 4 31B |
| --- | ---: | ---: |
| The model alone: accuracy | 80.3% | 83.2% |
| The model alone: answers certified, and the error among them | 53.3%, 3.3% | 54.4%, 3.3% |
| With the re-ranker as shipped: accuracy | 84.1% | 85.0% |
| With the re-ranker as shipped: answers certified, and the error among them | 55.2%, 3.9% | 54.9%, 3.2% |

::source[Measured offline with the server's own code, on Gemma 4 readouts taken with decisio 0.35.0 and vLLM 0.31.0 on one RTX PRO 6000 Blackwell at 600 W, 2026-10-30: brand from a product title, entity linking, tool choice, product matching and intent routing, the mean over the five of the median over three draws of 200 labels, at a 5% error target.]

## 4. Know where it helps

- **The certificate and the re-ranker help in different places.** Brand detection, tool choice and intent routing are right on 91 to 96% of requests, and most answers are certified with no teaching at all. On entity linking and product matching the re-ranker adds 3 to 10 points of accuracy, and nothing is certified.
- **It was kept in 14 of 15 draws on the 12B and 10 of 15 on the 31B.**
- **The error among certified answers can rise,** as it did on the 12B, from 3.3% to 3.9%, inside the 5% target.
- **1,000 labels added little accuracy over 200.**
- **It helps where the right option can be seen in the text, or has been the answer before.** Where neither is true, the server declines it.
- **These are five question types and two model sizes:** your task may gain more or nothing, and its cross-validation says which.

## 5. Watch it

- **The monitor has no answer mix,** since the options differ. It watches the confidences as for any certified task.
- **It also watches `unseen_options`,** the share of requests none of whose options your examples contained, but only where options recur. `status.monitor.unseen_options.armed` says whether it is watched: where options are new almost every time, a rise cannot be told from normal.
- **An alert on either suspends certification** while it lasts.

## What next

- [Certify answers](/docs/tasks/certify/): what a certificate promises.
- [Watch for drift](/docs/tasks/drift/): the traffic monitor and its alerts.
- [Teach a task](/docs/tasks/): a question with the same options every time.
