---
title: Glossary
description: The few words decisio's docs use, in plain terms.
---

<!-- Site-written. The glossary of docs/STYLE_GUIDE.md: pages link here on a word's first use instead of keeping their own. -->

Every word the docs use that has a meaning of its own here, in plain terms.

| Word | What it means |
| --- | --- |
| text | what you ask about, sent in the request's `state` field |
| question | what you ask about a text, with its options |
| option | one possible answer to a question |
| probability | the number decisio gives each option; a question's probabilities add up to 1 |
| top probability | the probability of the likeliest option; certificates and thresholds use it |
| task | a question you ask again and again, taught from your labelled examples |
| error target | the share of certified answers you allow to be wrong |
| certified answer | an answer decisio stands behind at your error target |
| threshold | the top probability at or above which answers are certified |
| drift | traffic moving away from the examples a task was certified on |
| base | the model decisio serves; Gemma 4 31B by default |
| abstain | decisio declines to answer when no option is likely enough |
| serving setup | the model, the engine, the GPU and the settings a certificate was made on |

## What next

- [Teach a task](/docs/tasks/): tasks, certified answers and drift, in practice.
- [The HTTP API](/docs/api/): every field of a request and an answer.
