---
title: Certify answers
description: Get answers the server stands behind. You choose the error rate; the server certifies only the answers sure enough to keep it, on traffic like your examples.
---

<!-- Site-written: the second Teach and trust guide, rewritten from decisio's docs/tasks.md ("Certified answers") at the pinned release; its worked example's request is decisio's (::upstream) and the certificate and answers are that example recorded on the pinned release on the 31B, as is example 5's line by hand (src/lib/recorded.mjs), with the manual threshold and abstention from the former Use the probability guide and docs/api.md. The slider is the teach-and-certify runs' support inbox (src/lib/figures/tasks.mjs); the facts are docs/tasks.md's (src/config/sourced.mjs checks them). -->

::covers{links="docs/tasks.md#certified-answers docs/tasks.md#what-certified-means=1-know-the-promise docs/tasks.md#a-worked-example=2-teach-the-task-with-a-certificate docs/tasks.md#how-many-examples-it-takes=4-have-enough-examples docs/tasks.md#where-it-stops=5-keep-it-valid docs/api.md#abstention=let-the-server-abstain"}

Add a `certify` block when you teach a task, and every answer says whether it is certified.
Pick how often a certified answer may be wrong; the server finds the threshold that keeps that promise:

::figure{name="certify-slider"}

## 1. Know the promise

With probability at least 90% by default, at most your error target of the certified answers are wrong, for traffic like your examples, on the serving setup the certificate was made on.

- It is a rate over many answers: one certified answer can still be wrong.
- It covers one task on one server, not other traffic or another task.
- It costs coverage: a stricter target certifies fewer answers, and too few examples certify none.

## 2. Teach the task with a certificate

Add `certify` to the registration, with your error target as `alpha`.
With a server running, from the root of the clone ([Teach a task](/docs/tasks/#3-register) has both), add it to the 120 labelled tickets decisio ships and register them:

```bash
uv run python -c 'import json; b = json.load(open("examples/tasks/examples.json")); b["certify"] = {"alpha": 0.05}; json.dump(b, open("certify.json", "w"))'
curl -s http://127.0.0.1:8000/v1/tasks -H 'Content-Type: application/json' -d @certify.json \
  | uv run python -c 'import json, sys; c = json.load(sys.stdin)["certificate"]; print(json.dumps({k: c.get(k) for k in ("alpha", "n", "threshold", "certified_n", "errors_at_threshold", "summary")}, indent=1))'
```

The server holds back half the examples, teaches on the rest, reads the held-back ones as it will serve them, and answers with the certificate.
The CPU stand-in is a small development model, so its certificate is its own.
On the default model, Gemma 4 31B, decisio's worked example, a three-queue ticket question at an error target of 15%, answered:

::site-block{name="certificate-response"}

Here, :value{name="certify-result"}.
:value{name="certify-recorded"}
If no threshold can keep the promise, `threshold` is `null` and the task works as before, with every answer marked not certified.

## 3. Read each answer

Every answer for the task now says whether it is certified, and why not when it is not:

::site-block{name="certificate-answers"}

Act on the certified answers on their own, and send the rest to a person or a larger model.

## 4. Have enough examples

The server refuses to certify below the fewest held-back examples at which anything could be certified, at the default 90%:

| Error target | Fewest held-back examples |
| ---: | ---: |
| 2% | 149 |
| 5% | 59 |
| 10% | 29 |
| 20% | 14 |

The server holds back half of what you send, so a 5% certificate needs at least 118 labelled examples.
That floor is for a task the model always gets right; yours needs more.
With 75 examples, four of five test tasks certified nothing at 5% or 10%.
Set `certify.min_examples` above the floor to refuse a certificate that thin.

## 5. Keep it valid

1. **Give the task an "other" option.** A message that fits none of the options gets a wrong answer, and that answer can be certified. The server warns when a choice task has no such option.
2. **Certify again when the setup changes.** A certificate covers one task on one serving setup: the decisio version, the model and its revision, the engine, the card, the quantisation, the cache type, the context length and the serving flags. When any of it changes, every answer of the task is `certified: false` with the reason `serving_stack_changed`. Certify again with `POST /v1/tasks/{id}/certify`, on new labelled examples.
3. **After upgrading decisio, certify your tasks again.**
4. **Expect a few answers near the threshold to change sides** between two fresh starts of the same server.

What is certified: choice and yes/no questions on text, asked in one order.
Score questions and requests with images carry no certificate.
A certified question is scored on its own, the way the certificate was made, so it does not share the read of the text with the other questions of its request.

## Pick a line by hand

Without a certificate, you can still keep the answers above a line you choose and escalate the rest.
Pick the line from the cost of an escalation against the cost of a wrong answer, measured on examples like yours.
On :value{name="example5-recorded"}:

::escalation-table

A line on the raw probability promises nothing for new traffic; a certificate does.
To keep answers above a line of your own:

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
```

## Let the server abstain

A question can carry a "can't tell" option, and the server can decline to answer when that option is likely enough:
1. Offer the option in the request, or start the server with `--abstain-option` to add one.
2. Register a threshold on it from labelled examples that include ones with no answer: `POST /v1/abstention/tasks`.
3. Read the answer: the server abstains when the option's probability is over the threshold, and otherwise answers the best of the other options.

Register the task first and its abstention threshold second, and register both again together.

## What next

- [Watch for drift](/docs/tasks/drift/): know when traffic moves away from the examples a certificate was made on.
- [Certified answers on real tasks](/demos/teach-and-certify/): the support inbox, a drift alarm and a coding-agent gatekeeper.
- [The HTTP API](/docs/api/): the certify block and every field of a certificate.
