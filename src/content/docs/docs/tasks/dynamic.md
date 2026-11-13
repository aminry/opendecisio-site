---
title: Teach a task whose options change
description: When your options change with every request, teach the question once and have decisio certify the answers it can, such as which brand a product title names.
---

<!-- Site-written: the Teach a task whose options change guide. Its facts are decisio's docs/tasks.md ("Tasks whose options change with every request"), docs/api.md and runs/2026-10-30_dynamic-options/summary.json at the pinned release (src/config/sourced.mjs checks them). -->

::covers{links="docs/tasks.md#tasks-whose-options-change-with-every-request"}

Your options change with every request: which brand a product title names, which of this request's tools to call.
Teach that question once as a dynamic task, and decisio certifies the answers it can, whatever options a request brings.

Each example carries its own options.
Prepare `dynamic-task.json` as a complete registration with `id` and `examples`, each example containing a full one-question `request` and its human-labelled `answer`.
Use the [task registration format](/docs/tasks/#3-register), keeping the instructions identical while varying candidate options.

Run this Python script beside the file; `DECISIO_BASE_URL` selects your endpoint:

::site-block{name="dynamic-register"}

::figure{name="dynamic-options"}

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

## 2. Register it

- **`"options": "dynamic"` and `"match": "instructions"`**, the only value, make one task of every later choice question with these instructions.
- **Each example's `answer` is one of its option keys,** or `null` for the request's none option: the key `none`, or the key you name in `"none_option"`.
- **The `certify` block is required:** a dynamic task is always certified, which needs 59 held-out examples at the defaults.

## 3. Read what it kept

- **`dynamic.applied` in the registration response** says whether the re-ranker was kept, and why. The server keeps it only when it improves held-out answers.
- **Every answer carries the usual `certified` fields:** an answer that reaches the threshold is certified, on the model's top probability or, where it was kept, the re-ranker's.
- **Later choice questions with these instructions** are answered through the task, whatever their options.

## 4. Good to know

- Use choice questions on text, with one order per request; score and image questions do not use this path.
- Keep the instructions exactly the same; every example and request can supply its own candidates.
- A fixed-option task matching the exact options takes precedence.
- Some tasks certify nothing at your target; check the returned threshold before connecting automatic actions.
- No request or option text is stored in the fitted correction.

## 5. Watch it

- **The monitor has no answer mix,** since the options differ. It watches the confidences as for any certified task.
- **It also watches `unseen_options`,** the share of requests none of whose options your examples contained, but only where options recur. `status.monitor.unseen_options.armed` says whether it is watched.
- **An alert on either suspends certification** while it lasts.

## What next

- [Certify answers](/docs/tasks/certify/): what a certificate promises.
- [Watch for drift](/docs/tasks/drift/): the traffic monitor and its alerts.
- [Teach a task](/docs/tasks/): a question with the same options every time.
