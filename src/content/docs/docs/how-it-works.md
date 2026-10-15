---
title: How it works
description: A question becomes one prompt and is answered in one forward pass, read at one position; the state is read once and shared.
---

<!-- Site-written: the figure, the TL;DR, the glossary, the headings and the links, and the diagrams drawn at build time from launch_facts.public.json and the README (src/lib/diagrams.mjs). The mechanism is the README's "How it works" at the pinned release. -->

Most language-model APIs write text and make you parse it.
Decisio asks the model one question at a time and reads its answer straight off the model's output, so the answer is a probability for every option, and nothing is generated.

::figure{name="one-pass"}

## TL;DR

With a server running ([Get started](/docs/) starts one), one yes/no question is one prompt and one pass:

```bash
curl http://127.0.0.1:8000/v1/systemone \
  -H 'Content-Type: application/json' \
  -d '{"state": "I was charged twice for October. Please refund one.", "questions": {"urgent": {"type": "noul"}}}'
# {"model": "...", "answers": {"urgent": {"type": "noul", "noul": ...}}, "usage": {"input_tokens": ..., "output_tokens": ...}}
```

`usage.output_tokens` is one per question: the "token" is the letter that was read.

:::glossary

| Word | Meaning |
| --- | --- |
| forward pass | one run of the model over a prompt, which is all a question costs |
| readout | the model's distribution over the option letters at the answer's position |
| prefix cache | where the state's read is kept, so every question about it starts from there |
| hidden state | the model's internal representation at the answer position, which an intent head reads |

:::

## 1. The mechanism

::upstream{file="README.md" section="How it works"}

## 2. A request

One request carries a state, such as a support ticket, and the questions to ask about it.
On the default Gemma 4 31B the server scores all of a request's questions together in one batch and writes no text; the Gemma 4 12B and Qwen bases answer them one at a time by default.

::diagram{name="request-flow"}

## 3. The cache

The state is read once per request, and its questions are scored from that one read.
A later request about the same state starts from the cache, which is why asking many questions about one document is cheap.

::diagram{name="cache-timeline"}

## 4. The threshold

Every answer carries a probability for each option.
Keep the answers above a threshold you pick and send the rest to a person or a larger model.
The tradeoff is yours to set from your own labelled items: how well the number separates right from wrong depends on your questions.

::diagram{name="routing-threshold"}

## 5. The bases

One flag picks the model.
The routes and the calibration are the same for each.

::diagram{name="bases"}

## What next

- [Choosing a base](/docs/bases/): which model to serve, and why.
- [What the probability means](/docs/probability/): temperatures, calibration, and what was measured.
- [Many questions about one text](/docs/guides/many-questions/): one read, then every question.
