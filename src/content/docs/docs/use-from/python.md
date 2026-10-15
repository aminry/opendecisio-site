---
title: Python
description: Call a server from Python with the standard library, or with TypeSafe's SDK.
---

<!-- Site-written. The request and its recorded answer are the first record of decisio-examples' support-routing run (the launch facts (launch_facts.public.json)); the SDK's name, version and errors are from docs/migrating.md of the pinned release. -->

A server is a JSON API, so Python needs nothing but its standard library.
TypeSafe's SDK, which speaks the same wire format, works too once it is pointed at the server.

::figure{name="client-python"}

## TL;DR

With a server running ([Get started](/docs/) starts one), this script sends the recorded support ticket and prints each question's likeliest option, with the standard library or with TypeSafe's SDK:

:::tabs

::tab{label="Standard library"}

::site-block{name="python-urllib"}

The comment lines show what the measured system answered (recorded; the stand-in prints other numbers).

::recorded-label{shows="printed"}

::tab{label="TypeSafe's SDK"}

The SDK installs on its own (`pip install typesafe-sdk`); section 2 says what it needs.

::site-block{name="python-sdk"}

:::

:::glossary

| Word | Meaning |
| --- | --- |
| `noul` | a yes/no question; its answer is the probability of yes |
| `probabilities` | a probability for each option of a choice, or each level of a score; they add up to 1 |
| the SDK | TypeSafe's Python SDK, published under the MIT licence; Decisio does not include it |

:::

## 1. With the standard library

The script posts the body with `urllib.request` and reads `answers`, which holds one answer per question under the name you gave it.
A choice's answer names its likeliest option (`choice`) and gives every option's probability; read the probabilities, not only the name, to see how sure it is.

## 2. With TypeSafe's SDK

The SDK is TypeSafe's and installs on its own (`pip install typesafe-sdk`); the block in the TL;DR's second tab was run with version 0.7.2, against a decisio server.
Give it the server's address, a key (it requires one; the server ignores it) and the served model's name, as that block does.

:::caution[Common mistake]
The SDK's default timeout is 10 s.
The first request after a start warms the engine, and a long state seen for the first time takes longer on the larger bases, so raise `timeout` for those.
:::

## 3. When the server says no

A request that fails validation gets 422 and one the engine cannot answer gets 400, each with a `detail` naming the problem.
With the standard library these are an `HTTPError` whose body holds the detail; the SDK raises its own types (`TypeSafeUnprocessableEntityError`, `TypeSafeBadRequestError`).
A server sets no rate limit, so the SDK's retries on 429 never fire; it still retries 408 and 5xx.

```python
import json
import urllib.error
import urllib.request

request = urllib.request.Request(
    "http://127.0.0.1:8000/v1/systemone",
    data=json.dumps({"state": "No questions asked.", "questions": {}}).encode(),
    headers={"Content-Type": "application/json"},
)
try:
    urllib.request.urlopen(request)
except urllib.error.HTTPError as error:
    print(error.code, "detail" in json.load(error))
# 422 True
```

## What next

- [JavaScript and TypeScript](/docs/use-from/javascript/): the same call from Node.
- [System One clients](/docs/migrating/): point a client you already have at the server.
- [The HTTP API](/docs/api/): every route, request field and response field.
