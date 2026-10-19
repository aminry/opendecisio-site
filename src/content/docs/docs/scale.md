---
title: Scale
description: Ask every question about a text for the price of one read, plan for long texts and long option lists, and set the few flags that move server time.
---

<!-- Site-written: the Scale guide, merging Many questions about one text, Make it fast and Long documents and many options. The time per text length is docs/running.md's table at the pinned release (::latency-table); the 50 questions are the launch facts' same_box_speed; the other facts are docs/running.md's, docs/api.md's, docs/cli.md's and the README's (src/config/sourced.mjs checks them). -->

::covers{links="docs/running.md#first-question-latency-by-state-length=2-plan-for-the-first-read docs/running.md#a-later-question-about-the-same-state---register-boundary=5-set-the-flags-that-move-server-time"}

Put every question about a text in one request: the server reads the text once and answers them all.
This script asks fifty questions about one ticket in a single request:

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
```

## 1. Ask many questions in one request

On one RTX PRO 6000 at 600 W, the 31B answered 50 questions about one 3,000-token text in 1.08 s (decisio v0.11.1, 2026-10-11).

| Model | How a request's questions are scored | Against each question on its own |
| --- | --- | --- |
| Gemma 4 31B | together, in one batch, with the engine in the server's process (the default) | the same choice on every item measured; probabilities within 0.0073 |
| Gemma 4 12B | one at a time, from the one read | the same choice; probabilities within 0.035 |
| Qwen3.6-35B-A3B | one at a time, from the one read | the same probabilities |

A second engine changes this: with `--head-engine` or `--image-model` the engine runs in its own process, so the 31B scores the questions one at a time and serves texts of up to 32,768 tokens.
A request has no cap on its questions, but the response grows with them: for thousands, send several requests about the same text, and the later ones read it from the cache.

## 2. Plan for the first read

The first question about a new text pays for reading it, and that grows with its length:

::latency-table

The server's time, median of 10 new texts per length, on one RTX PRO 6000 Blackwell at 600 W, decisio 0.11.1 on vLLM 0.30.0.
A later, different question about the same text is read from the cache: under 165 ms at every length, on every model.
On the Gemma models the server registers each text's boundary so that the later question finds it; that is on by default.

## 3. Plan for long texts

Each model's longest text is on [Requirements and limits](/docs/limits/#2-how-long-a-text-and-how-many-options); `/health` reports the length a server chose, as `max_model_len`.

1. **Give `--max-model-len` the same value on every card**, for the same answers everywhere; `--max-model-len 32768` serves only what was measured.
2. **Mind `--gpu-memory-utilization`.** It changes the length a card gives a lot: on an 80 GB H100, the 31B served 98,304 tokens at 0.90 and 49,152 at 0.85, and did not start at 0.70.
3. **Certify again after changing the length or the cache type.** Both are part of what a certificate covers.

A prompt longer than the length gets 422, and the server stays up.

## 4. Plan for long option lists

A choice can have up to 255 options; more gets 422.
On a long list of fine-grained options, [teach a task](/docs/tasks/): that is where teaching gains most.

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

## 5. Set the flags that move server time

| Flag | What it does | What it costs |
| --- | --- | --- |
| `--register-boundary before` | the Gemma models' default: registers a new text's boundary ahead of its first question | +21 to +34 ms on the 31B's first read, for texts of 300 to 3,000 tokens (one card at 585 W, decisio 0.8.1, 2026-10-06) |
| `--register-boundary after` | registers it after the answer instead | the cost moves to throughput: the 31B kept 0.61 and 0.74 of it at 32 and 64 clients in the same run, so keep `before` on the 31B under load |
| `--register-boundary off` | never registers | a later question re-reads the text; for traffic that asks one question per text |
| `--multi-question` | `warm`, the 31B's default, scores a request's questions in one batch; `sequential` scores them one at a time | see the table in step 1 |
| `--head-engine` | answers a taught task's head questions from a second engine | a second copy of the weights on the card, and no image engine |

Every flag is in [Server flags](/docs/flags/).

## 6. Measure your own

Every response carries `x-decisio-server-ms`, the server's time, and `x-decisio-stages`, where it went:

```python
import json
import urllib.request

state = "I was charged twice for October. Both charges are 49.00 EUR, same day. Please refund one."


def server_ms(question):
    request = urllib.request.Request(
        "http://127.0.0.1:8000/v1/systemone",
        data=json.dumps({"state": state, "questions": {"q": question}}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request) as response:
        return response.headers["x-decisio-server-ms"]


print("first question:", server_ms({"type": "noul", "instructions": "Does this ticket need a response within the hour?"}), "ms")
print("a different question about the same text:", server_ms({"type": "noul", "instructions": "Is the customer asking for money back?"}), "ms")
```

- Send a few requests first: the first after a start warms the model.
- Time medians, and quote them with the host's CPU and the card's power limit (`nvidia-smi -q -d POWER`): both change server time.

## What next

- [Operate](/docs/operating/): watch the server time and the queue in production.
- [Requirements and limits](/docs/limits/): every model's memory and longest text, and what was measured on what.
- [Choosing a base](/docs/bases/): which model is faster on what.
