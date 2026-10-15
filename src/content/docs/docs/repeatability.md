---
title: Repeatability
description: "What repeats and what can move, by base: the same request, a first read against a cached one, a batch against a question alone, and another session."
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. Every statement is docs/cli.md's, the README's or EVAL_CARD.md's at the pinned release; the figure's build check fails if one is no longer there. -->

A model's answers move at the scale of any change of rounding: the batch a question rides in, where a long row is split, the card, the driver.
So what repeats is stated for a configuration and a request form, base by base.

::figure{name="repeatability"}

## TL;DR

With a server running ([Get started](/docs/) starts one), this script sends the same request five times and counts the distinct answers:

```python
import json
import urllib.request

body = json.dumps({
    "state": "I was charged twice for October. Both charges are 49.00 EUR, same day. Please refund one.",
    "questions": {"urgent": {"type": "noul", "instructions": "Does this ticket need a response within the hour?"}},
}).encode()


def ask():
    request = urllib.request.Request("http://127.0.0.1:8000/v1/systemone", data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request) as response:
        return json.dumps(json.load(response)["answers"], sort_keys=True)


print("distinct answers in 5 sends:", len({ask() for _ in range(5)}))
# distinct answers in 5 sends: 1
```

The README's three-question example, on the 31B under its served defaults, gave the same response in 30 of 30 repeats on one server.
On the 31B a request repeats exactly on a freshly started server.
Asked again on a server that has already answered it, a repeat can differ: 5 of 200 single-question requests did, by up to 0.031, with no top answer changed.

:::glossary

| Word | Meaning |
| --- | --- |
| bit for bit | the same number to the last digit |
| first read | the server reading a state it has not seen; a later read comes from the prefix cache |
| batched | several questions scored in one engine step instead of one engine call each |
| near-tied | two options whose probabilities are close, so a small move can change the choice |

:::

:::caution[Common mistake]
Comparing an answer with an earlier record from another session as if they were the same experiment.
On one day the served 31B profile, with identical prompts and profile, did not reproduce an earlier record: every readout differed, and near-tied items moved by up to 0.98, changing 28 top answers (1.7%); the engine arrangement and the driver had changed.
Pair a comparison within one session.
:::

## 1. Why answers move

The Gemma 4 12B base's final logits are bf16 after a soft cap, so near the top they lie on a grid of 0.0625 to 0.125, and a state read for the first time and the same state read from the prefix cache can land a step apart.
Questions scored in one batch are not the same forward pass as each scored alone: on the Qwen base the dependence was traced to vLLM 0.30.0's forward, whenever more than one sequence shares an engine step.
Every change of rounding moves the answers, which is why each claim holds for a fixed configuration and request form.

## 2. What the server does about it

::upstream{file="docs/cli.md" section="Determinism"}

## What next

- [Flags and options](/docs/flags/): `--multi-question`, `--register-boundary` and `--engine-process`, which decide what repeats.
- [What the probability means](/docs/probability/): temperatures and calibration.
- [The evaluation card](/docs/evaluation-card/): sections 6.5 and 7.5 have every measurement.
