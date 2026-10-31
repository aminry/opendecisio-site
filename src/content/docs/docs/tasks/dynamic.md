---
title: Teach a task whose options change
description: When your options change with every request, teach the question once and have decisio certify the answers it can, such as which brand a product title names.
---

<!-- Site-written: the Teach a task whose options change guide. DRAFT until decisio 0.37.0; its facts are decisio's docs/tasks.md ("Tasks whose options change with every request"), docs/api.md, docs/upgrading.md and runs/2026-10-30_dynamic-options/summary.json in the pull request that adds them, and are checked again at the release. -->

Your options change with every request: which brand a product title names, which of this request's tools to call.
Teach that question once as a dynamic task, and decisio certifies the answers it can, whatever options a request brings.
Each example carries its own options:

::site-block{name="dynamic-register"}

## 1. See where it works great

On questions where the right option can be read from the text, most answers are certified:

| Question | Model | Answers certified | Wrong among them | Accuracy |
| --- | --- | ---: | ---: | ---: |
| Which of this request's tools to call | Gemma 4 12B | 99.9% | 3.7% | 96.3% |
| Which of this request's tools to call | Gemma 4 31B | 99.7% | 3.7% | 96.1% |
| Which brand a product title names | Gemma 4 12B | 91.4% | 3.1% | 94.8% |
| Which brand a product title names | Gemma 4 31B | 94.6% | 3.1% | 95.2% |
| Which intent a message routes to | Gemma 4 12B | 84.5% | 3.4% | 92.2% |
| Which intent a message routes to | Gemma 4 31B | 80.0% | 2.9% | 91.0% |

::source[Measured offline with the server's own code, on Gemma 4 readouts taken with decisio 0.35.0 and vLLM 0.31.0 on one RTX PRO 6000 Blackwell at 600 W, 2026-10-30, at a 5% error target: the median over three draws of 200 labels, as decisio serves it, with the re-ranker kept where it helps; the pooled figures are the mean over five questions, these three, entity linking and product matching.]

- **A re-ranker lifts accuracy where it helps.** Pooled over five questions, accuracy went from 80.3% to 84.1% on the 12B and from 83.2% to 85.0% on the 31B, and it adds 3 to 10 points on hard matching.
- **It needs no extra model** and adds well under a millisecond.
- **200 labels are enough to start:** 1,000 added little accuracy.

## 2. Register it

- **`"options": "dynamic"` and `"match": "instructions"`**, the only value, make one task of every later choice question with these instructions.
- **Each example's `answer` is one of its option keys,** or `null` for the request's none option: the key `none`, or the key you name in `"none_option"`.
- **The `certify` block is required:** a dynamic task is always certified, which needs 59 held-out examples at the defaults.

## 3. Read what it kept

- **`dynamic.applied` in the registration response** says whether the re-ranker was kept, and why. It is kept only when its 5-fold cross-validation beats the model's own answers.
- **Every answer carries the usual `certified` fields:** an answer that reaches the threshold is certified, on the model's top probability or, where it was kept, the re-ranker's.
- **Later choice questions with these instructions** are answered through the task, whatever their options.

## 4. Good to know

- **Entity linking and product search matching certify nothing yet:** a 5% error target is out of reach. With the re-ranker, accuracy was 67.4% on the 12B and 72.5% on the 31B on entity linking, and 69.9% and 70.2% on product matching. So pooled over all five questions, 55.2% of answers are certified at 3.9% error on the 12B, and 54.9% at 3.2% on the 31B, against 53.3% and 54.4% at 3.3% with the model alone.
- **The re-ranker is kept only where it helps:** in 14 of 15 draws on the 12B and 10 of 15 on the 31B. It helps where the right option can be seen in the text, or has been the answer before.
- **Choice questions only, on the text route.** With the same options every time, [teach a fixed task](/docs/tasks/), which can also fit an intent head; a fixed task registered for exactly a request's options is matched first.
- **These are five question types and two model sizes:** your task may gain more or nothing, and its cross-validation says which.
- **What is stored:** the re-ranker's 13 weights and, for each option text in your examples, a hash and two counts. No request text or option text is stored.

## 5. Watch it

- **The monitor has no answer mix,** since the options differ. It watches the confidences as for any certified task.
- **It also watches `unseen_options`,** the share of requests none of whose options your examples contained, but only where options recur. `status.monitor.unseen_options.armed` says whether it is watched.
- **An alert on either suspends certification** while it lasts.

## What next

- [Certify answers](/docs/tasks/certify/): what a certificate promises.
- [Watch for drift](/docs/tasks/drift/): the traffic monitor and its alerts.
- [Teach a task](/docs/tasks/): a question with the same options every time.
