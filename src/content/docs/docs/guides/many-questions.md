---
title: Many questions about one text
description: Ask as many questions as you like about one text; it is read once and each question is answered from that read.
---

<!-- Site-written. The figure's numbers are the launch facts (launch_facts.public.json) (figures.same_box_speed and figures.latency_on_read_document); the behaviour is from the README, docs/api.md and docs/running.md of the pinned release. -->

Most decisions are several questions about the same text: is it urgent, which team, how bad.
Asking them one by one makes a model read the text each time; Decisio reads it once and answers every question from that read.

::figure{name="many-questions"}

## TL;DR

With a server running ([Get started](/docs/) starts one), this script sends one text with fifty yes/no questions in a single request and prints how many answers came back and the server's time:

```python
import json
import urllib.request

state = "I was charged twice for October. Both charges are 49.00 EUR, same day. Please refund one."
topics = ["a refund", "a duplicate charge", "a login problem", "a cancellation", "a late delivery",
          "a wrong invoice", "a price question", "a bug report", "a feature request", "a legal threat"]
templates = ["Does the ticket concern {}?", "Is {} the main issue?", "Would a person need to handle {}?",
             "Is {} mentioned at all?", "Is the customer upset about {}?"]
questions = {
    f"q{i:02d}": {"type": "noul", "instructions": template.format(topic)}
    for i, (template, topic) in enumerate((t, p) for t in templates for p in topics)
}

request = urllib.request.Request(
    "http://127.0.0.1:8000/v1/systemone",
    data=json.dumps({"state": state, "questions": questions}).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(request) as response:
    answers = json.load(response)["answers"]
    print("answers:", len(answers))
    print("server ms:", response.headers["x-decisio-server-ms"])
# answers: 50
# server ms: the server's time for the whole request
```

:::glossary

| Word | Meaning |
| --- | --- |
| state | the text the questions are about |
| first read | the server reading a state it has not seen; it takes time that grows with the text's length |
| prefix cache | where the server keeps what it read, so a later question about the same state starts from it |
| server time | `x-decisio-server-ms`, the time the server took, without the network |

:::

## 1. One request with many questions

The state is prefilled once per request.
On the default Gemma 4 31B the questions are then scored together in one batch (`--multi-question warm`); the Gemma 4 12B and Qwen bases answer them one at a time by default, each reading the state from the prefix cache, so each answer equals the question sent alone.

Against the same question sent alone, the Qwen base's probabilities are the same; on the Gemma bases the choice is the same and the probabilities agree to within 0.035 (12B) and 0.0073 (31B).
A request can carry as many questions as you have: the figure's measured case is fifty, on a 3,000-token document, in 1.08 s on the 31B.

## 2. Or one request for each question

A later, different question about a state read before, sent in its own request, reads the state from the prefix cache too: on the 31B that is 32 to 43 ms against 490 ms for the first read of a 3,000-token document.
On the Gemma bases this needs the state's boundary registered, which the server does by default; [Make it fast](/docs/guides/latency/) says how and what it costs.

:::caution[Common mistake]
Comparing the time of one question with the time of fifty is not a fair comparison: the first question pays for the read, and the next forty-nine in the same request share it.
Compare a request with fifty questions with fifty requests that each read the text again, which is what the two systems at the bottom of the figure do.
:::

## What next

- [Make it fast](/docs/guides/latency/): what costs time and which settings change it.
- [Long documents and many options](/docs/guides/long-and-wide/): the limits, and what happens near them.
- [How it works](/docs/how-it-works/): one prompt per question, one forward pass, no generated text.
