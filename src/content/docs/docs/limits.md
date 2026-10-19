---
title: Limits
description: "What the numbers do not say: the conditions, the hardware and the measurements that belong beside every figure."
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. Every limit is EVAL_CARD.md's, the README's or docs/running.md's at the pinned release. -->

A number without its conditions misleads.
These are the conditions that belong beside every figure on this site, and the limits of the system itself.

::figure{name="limits-map"}

## TL;DR

Two limits you can check yourself, with a server running ([Get started](/docs/) starts one): a request with no questions, and a choice with 256 options, which is one more than allowed:

```python
import json
import urllib.error
import urllib.request


def status(questions):
    request = urllib.request.Request(
        "http://127.0.0.1:8000/v1/systemone",
        data=json.dumps({"state": "A short text.", "questions": questions}).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        return urllib.request.urlopen(request).status
    except urllib.error.HTTPError as error:
        return error.code


print("no questions:", status({}))
print("256 options:", status({"q": {"type": "choice", "instructions": "Which?", "criteria": {f"option_{i:03d}": None for i in range(256)}}}))
# no questions: 422
# 256 options: 422
```

:::glossary

| Word | Meaning |
| --- | --- |
| context | what a prompt can hold: the state with one question; 32,768 tokens on the Qwen base, and on a Gemma base the largest length that fits the card, up to the base's ceiling |
| session | one run on one machine; every figure is from one card and one run per configuration |
| power limit | the card's enforced limit in watts; the latency figures are from 585 W, default 600 W |

:::

## 1. The limits of the measurements

::upstream{file="EVAL_CARD.md" section="5. Limits"}

## 2. The Gemma 4 12B base

::upstream{file="EVAL_CARD.md" section="6.6 Limits"}

## 3. The Gemma 4 31B base

::upstream{file="EVAL_CARD.md" section="7.5 Limits"}

## What next

- [Repeatability](/docs/repeatability/): what repeats and what can move.
- [The evaluation card](/docs/evaluation-card/): the sections these come from, with every measurement.
- [Pick your machine](/docs/#1-pick-your-machine): the hardware each path needs.
