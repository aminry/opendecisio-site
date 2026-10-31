---
title: "decisio 0.37.0 can certify answers when your options change with every request"
summary: "Teach a question once, even when each request brings its own options. Brand detection certified 91.4% and 94.6% of answers at 3.1% error, and tool choice over 99% at 3.7%."
date: 2026-10-30
tags: [release]
---

Your options change with every request: which brand a product title names, which of this request's tools to call.
Until now a task needed the same options every time; decisio 0.37.0 teaches such a question once and certifies the answers it can.

## Where it works great

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

A small re-ranker lifts accuracy where it helps, with no extra model and well under a millisecond added.
Pooled over five questions, accuracy went from 80.3% to 84.1% on the 12B and from 83.2% to 85.0% on the 31B, with 3 to 10 points on hard matching.

## How to use it

Register the question with `"options": "dynamic"`, `"match": "instructions"` and a `certify` block, with examples that each carry their own options.
The response's `dynamic.applied` says whether the re-ranker was kept, and every answer carries the usual `certified` fields.
[Teach a task whose options change](/docs/tasks/dynamic/) has the whole setup.

## Good to know

Entity linking and product search matching certify nothing yet, so pooled over all five questions 55.2% of answers are certified at 3.9% error on the 12B and 54.9% at 3.2% on the 31B.
The re-ranker is kept only where its cross-validation shows a gain, and it covers choice questions on the text route.
No request text or option text is stored, and a monitor suspends certification if confidences move, or if requests start bringing options your examples never contained.
