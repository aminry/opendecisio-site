---
title: Make it fast
description: What costs time on a server, which settings change it, and how to measure your own.
---

<!-- Site-written. Every figure is a row of EVAL_CARD.md (sections 3, 6.1 and 7.1) or a statement of docs/running.md or docs/cli.md at the pinned release; each names its record there. -->

Almost all of a request's time is the model reading: the state the first time it sees it, then each question.
Where the state is read once and every question after it starts from that read, a request is fast; the settings below move the cost between the first read, each further question and throughput.

::figure{name="latency-chart"}

## TL;DR

With a server running ([Get started](/docs/) starts one), this script asks one question about a new text and then a different question about the same text, and prints the server's time for each:

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
# first question: the server's time, which includes reading the text
# a different question about the same text: the server's time, from the cache
```

:::glossary

| Word | Meaning |
| --- | --- |
| first read | the server reading a state it has not seen |
| from the cache | a question that starts from a state already read |
| boundary | the point in a state where the cache can resume; on the Gemma bases the server registers it so a later question starts from the cache |
| p50, p95 | the median and the 95th percentile of the requests' times |

:::

## 1. What costs time

- **The first read of a state** grows with its length: on the 31B, one question on a new state takes 80.7 ms at 300 tokens, 160.1 at 1,000 and 438.1 at 3,000; the Qwen base takes 49.9, 50.0 and 85.2 (the chart).
- **Each further question** on a state already read takes 31.7 ms on the 31B for a 1,000-token state, 20.2 on the Qwen base and 24.8 on the 12B; a different question on a 3,000-token state took 43.3 ms on the 31B, 23.5 on the Qwen base and 35.8 on the 12B.
- **Registering the boundary** on the Gemma bases adds to the first read, +21 to +34 ms on the 31B and +16 to +28 ms on the 12B for states of 300 to 3,000 tokens, and buys the cache for the next question.
- **A registered intent head** reads the model's hidden state as well as its letters: about 80 ms more per question (126.8 against 46.5 ms) in the default mode.
- **The host:** the card's power limit and the CPU. A Qwen question on a cached state took 39.4 ms on an AMD EPYC 7452, 18.5 ms on a Ryzen 9 9950X and 20.2 ms on a Threadripper 9960X, with the same card model. The figures here are from a card at 585 W (default 600 W), which held the clock back during most first reads on the Gemma bases, so a card at 600 W may read new states faster.

## 2. The settings that change it

| Setting | What it does | What it costs |
| --- | --- | --- |
| `--multi-question warm` (the 31B's default with the engine in the server's process) | scores a request's questions in one batch; four questions on a new 300-token state took 104.8 ms against 170.1 with `sequential` on the 31B | a batched answer can differ from the same question sent alone, by at most 0.0073 in a probability on the measured items |
| `--register-boundary` | when a single question on a new state registers its boundary: `before` (both Gemma bases' default), `after` the response, or `off` | `before` costs the first read +16 to +34 ms; `after` moves the cost to throughput, which fell to 0.61 of `before`'s at 32 clients on the 31B |
| `--pad-policy row` | prefills a single-question request in one engine step instead of two | a repeated identical request can move slightly on long prompts; not measured on the Gemma bases |
| `--head-engine` | answers registered-head questions from a second copy of the model | a second copy of the weights, and no `--image-model` |

The full list is [Flags and options](/docs/flags/); [Deploying and operating](/docs/operating/) has what `/health` reports about them.

## 3. Measure your own

Every response carries `x-decisio-server-ms`, the server's time, and `x-decisio-stages`, where the engine's time went (`prepare`, `warm`, `questions`, `readout`, `engine` and `wait`).
Quote a latency with the host's CPU and the card's power limit (`nvidia-smi -q -d POWER`) beside it.

:::caution[Common mistake]
Timing the first request after a start measures the engine warming up.
Send a few requests first, and time medians: the figures here are medians of 20.
:::

## What next

- [Many questions about one text](/docs/guides/many-questions/): one read, then every question.
- [Flags and options](/docs/flags/): every flag and its default per base.
- [Choosing a base](/docs/bases/): which base is faster on what.
