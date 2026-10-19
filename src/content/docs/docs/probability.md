---
title: What the probability means
description: How a probability is made, what the temperature and the calibration do to it, and what was measured.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The figures are the README's, docs/tasks.md's and EVAL_CARD.md's at the pinned release. -->

Each answer is a distribution over the options: the model's own, tempered by a fitted temperature, and for a registered task corrected by a calibration fitted on your examples.
The temperature never changes which option is likeliest; it changes how sure the number says it is.

::figure{name="calibration"}

## TL;DR

With a server running ([Get started](/docs/) starts one), this script asks a choice question and checks that the probabilities add up to 1:

```python
import json
import urllib.request

body = {
    "state": "My card keeps getting declined when I renew.",
    "questions": {
        "queue": {
            "type": "choice",
            "instructions": "Which team should handle this ticket?",
            "criteria": {"billing": "Invoices, payments, refunds", "access": "Login, passwords, permissions", "bug": "The product behaves wrongly"},
        }
    },
}
request = urllib.request.Request(
    "http://127.0.0.1:8000/v1/systemone",
    data=json.dumps(body).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(request) as response:
    answer = json.load(response)["answers"]["queue"]

print("likeliest:", answer["choice"])
print("sum of probabilities:", round(sum(answer["probabilities"].values()), 3))
# likeliest: the option with the highest probability
# sum of probabilities: 1.0
```

:::glossary

| Word | Meaning |
| --- | --- |
| temperature | a number the model's log-probabilities are divided by before they are turned back into probabilities; above 1 it softens them |
| calibration | making the probabilities match how often the answers are right |
| ECE | expected calibration error: how far the stated probability is from how often the answer is right, on average; lower is better |
| in-sample | measured on the same questions the number was fitted on |

:::

## 1. How a probability is made

A question becomes one prompt, and the answer is the model's distribution over the option letters at one position ([How it works](/docs/how-it-works/)).
That distribution is tempered: `softmax(log p / T)`, with a temperature `T` fitted for each base, by question type.
`T` above 1 softens the distribution, and a temperature never changes the likeliest option.

| Base | Choice questions | Yes/no and score |
| --- | --- | --- |
| Qwen3.6-35B-A3B | 1.370 | 1.506 |
| Gemma 4 12B | 3.592 | 3.592 |
| Gemma 4 31B | 4.672 | 5.252 |

## 2. What the temperatures were fitted on

At minimum log loss on each base's plain readouts, with the served prompt, of a private 1,400-item suite of eight tasks, each with 5-fold cross-validation; the Qwen and 31B temperatures on no JevBench item and on no result of a JevBench or Decision Index run.
The suite is the temperature's fit set, so its ECE figures are in-sample, and 650 of its items are also questions in the Decision Index's public pools.
The figure's ECE values are on JevBench's standard and hard tiers, which are not in the suite.

:::caution[Common mistake]
A probability is calibrated on the questions it was measured on.
For your own question, the plain probabilities can be off; registering a task fits a correction from your examples and keeps it only if cross-validation shows a gain ([Teach a task](/docs/tasks/)).
:::

## 3. Per-task calibration

On six other held-out tasks, registering from 20 labelled examples lowered the pooled ECE, and on a question the model already answers well it declines and leaves the answers unchanged.
The numbers and what each was measured on are in [Teach a task](/docs/tasks/#what-it-does).

## What next

- [Certify answers](/docs/tasks/certify/): set a threshold on it, with a promise.
- [Repeatability](/docs/repeatability/): what repeats, and what can move.
- [The evaluation card](/docs/evaluation-card/): section 4, what was fitted on what.
