---
title: Long documents and many options
description: Prompts as long as the context the server serves, 32,768 tokens or more on a Gemma base, and questions with up to 255 options; what each costs, and where a registered head helps.
---

<!-- Site-written. The first-question times are the launch facts (launch_facts.public.json) (figures.same_box_speed); the limits are docs/api.md and docs/migrating.md; the head's gains are docs/tasks.md, at the pinned release. -->

Two limits matter when a question grows: how long the text is, and how many options the answer has.
Both are generous, and both have a cost worth knowing before you plan around them.

::figure{name="long-and-wide"}

## TL;DR

With a server running ([Get started](/docs/) starts one), this script asks one choice question with 120 options and prints how many options came back:

```python
import json
import urllib.request

options = {f"option_{i:03d}": f"The ticket belongs to category {i}" for i in range(120)}
body = {
    "state": "I was charged twice for October. Both charges are 49.00 EUR, same day. Please refund one.",
    "questions": {"category": {"type": "choice", "instructions": "Which category does this ticket belong to?", "criteria": options}},
}
request = urllib.request.Request(
    "http://127.0.0.1:8000/v1/systemone",
    data=json.dumps(body).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(request) as response:
    answer = json.load(response)["answers"]["category"]
print("options answered:", len(answer["probabilities"]))
# options answered: 120
```

:::glossary

| Word | Meaning |
| --- | --- |
| context | what a prompt can hold: the state with one question; 32,768 tokens on the Qwen base, and on a Gemma base the largest length that fits the card, up to the base's ceiling |
| option | one answer a choice question can give; up to 255 in a question |
| head | a registered correction on the model's hidden state, kept only for questions with 10 or more options |

:::

## 1. Long documents

A prompt, the state with one question, holds the context the server serves: 32,768 tokens on the Qwen base, and on a Gemma base the largest length that fits the card, up to its ceiling (`/health` reports it). One longer is answered with 422 and a `detail` that says the rendered prompt is longer than the context, and the server stays up.

The first question about a document pays for reading it, and that grows with the length: on the 31B, 175 ms at 1,000 tokens, 490 at 3,000, 1,018 at 6,000 and 8,655 at 32,000.
A later request about it reads it from the cache.

## 2. The context length

::upstream{file="docs/running.md" section="The context length"}

## 3. Many options

A choice can have up to 255 options; a request with more gets 400.
A long list of fine-grained labels is where a generalist's reading of the label names is weakest, and where a registered head helps most: on the two intent sets of 77 and 150 options, heads from 10 examples per intent added 7 to 11 points of accuracy.
A head is only fitted for lists of 10 or more options, and the list must be fixed: options that change per input cannot be registered.

:::caution[Common mistake]
Reordering, adding or renaming an option makes a different task, which needs its own registration.
A head is also bound to the option order it was fitted on.
:::

## What next

- [Teach a task](/docs/tasks/): register the question and its options.
- [Make it fast](/docs/guides/latency/): the first read of a long state, and what changes it.
- [Many questions about one text](/docs/guides/many-questions/): ask more of the text you have read.
