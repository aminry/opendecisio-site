---
title: Use the probability
description: Set a threshold on the probability, keep the answers above it, and send the rest to a person or a larger model.
---

<!-- Site-written. The worked example is the launch facts (launch_facts.public.json) (figures.routing_example5, decisio-examples' example 5); the routes and the abstention option are from docs/api.md and docs/cli.md of the pinned release. -->

A probability is more useful than a label: it says how sure the answer is.
Keep the answers the server is sure about, and escalate the rest.

::figure{name="threshold"}

## TL;DR

With a server running ([Get started](/docs/) starts one), this script asks one choice question and escalates the answer when its likeliest option is below 0.8:

```python
import json
import urllib.request

THRESHOLD = 0.8

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

top = max(answer["probabilities"].values())
if top >= THRESHOLD:
    print("keep:", answer["choice"], round(top, 3))
else:
    print("escalate: the likeliest is", answer["choice"], "at", round(top, 3))
# keep: the likeliest option and its probability, when it reaches the threshold
# escalate: the likeliest option, and its probability, when it does not
```

:::glossary

| Word | Meaning |
| --- | --- |
| threshold | the probability an answer must reach to be kept |
| escalate | send an answer to a person or a larger model instead of acting on it |
| confidently wrong | a wrong answer above the threshold, which is kept; the one kind the threshold cannot catch |
| abstention | an opt-in threshold on a declared "can't tell" option (`POST /v1/abstention/tasks`) |

:::

## 1. Read the probabilities

A choice's answer gives the likeliest option, `choice`, and every option's probability; a yes/no gives the probability of yes, and a score gives a probability for each level.
`confidence` is System One's own figure: for a choice, the top probability rescaled from uniform.
The probabilities are tempered by fitted temperatures, which never change the likeliest option, and per-task calibration from your examples makes them more honest still ([Teach it your question](/docs/tasks/)).

## 2. Choose the line

The figure is a measured sweep of one question: each stop is a threshold that was run, with how many answers it escalated and how right the rest were.
A higher line escalates more and leaves the kept answers more accurate; the wrong answers it cannot catch are the confidently wrong ones.
Pick the line from the cost of an escalation against the cost of a wrong answer, on your own data.

:::caution[Common mistake]
Measure the threshold on questions like yours.
The sweep above is one set of 1,172 multiple-choice questions; another question, with other options, has another sweep, and `examples/tasks/evaluate.py` measures yours on held-out examples.
:::

## 3. Let the server abstain

A request can offer a "can't tell" option of its own, or a server started with `--abstain-option` can add one (untrained), and a threshold on that option's probability can be registered from labelled examples that include unanswerable ones (`POST /v1/abstention/tasks`).
The server then abstains when that option's probability exceeds the threshold and otherwise answers the best of the other options; the probabilities are reported unchanged, and the answer says whether it abstained.

## What next

- [Teach it your question](/docs/tasks/): make the probabilities honest for your question.
- [The evaluation card](/docs/evaluation-card/): the calibration that was measured, and on what.
- [The HTTP API](/docs/api/): the abstention route and its fields.
