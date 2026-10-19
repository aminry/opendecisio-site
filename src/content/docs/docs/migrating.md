---
title: Move from System One
description: Point a System One client you already have at decisio by changing two settings, the base URL and the model name; what changes once it is there.
---

<!-- Site-written: a rewrite of decisio's docs/migrating.md at the pinned release, whose blocks it shows; its facts are that file's and docs/api.md's (src/config/sourced.mjs checks them). -->

The route, the request and the answer stay the same, so the rest of your code does not change.
With TypeSafe's SDK, set its environment variables and leave the code as it is:

::upstream{file="docs/migrating.md" section="Point the client at the server" block="2"}

::figure{name="one-line-change"}

## 1. Point the client at the server

Give the client the server's address and any key; the server ignores the key.
In code, with TypeSafe's Python SDK:

::upstream{file="docs/migrating.md" section="Point the client at the server" block="1"}

Any other client sends the same JSON to `http://127.0.0.1:8000/v1/systemone`.

## 2. Set the model to the served name

The `model` field does not choose a model: a server serves the one it was started with.
The answer echoes the name you sent, so set it to the served name to keep your logs right.
`GET /v1/models` lists it:

```bash
curl -s http://127.0.0.1:8000/v1/models
```

| Model | Served name |
| --- | --- |
| Gemma 4 31B, the default | `decisio-gemma-4-31b-it-letters` |
| Gemma 4 12B | `decisio-gemma-4-12b-it-letters` |
| Qwen3.6-35B-A3B | `decisio-qwen3.6-35b-a3b-letters` |

## 3. Check what answers

`GET /health` names the model the server runs, its checkpoint and its revision:

```bash
curl -s http://127.0.0.1:8000/health
```

## What changes

| What you send | System One | decisio |
| --- | --- | --- |
| A request without `model` | refused with 422 | answered, and the answer names the served model |
| A field it does not know | refused with 400 | accepted and ignored, so check that a field you rely on is in [the HTTP API](/docs/api/) |
| A score with more than 10 levels | refused with 422 | answered |
| `box` questions | supported | refused with 422 |
| Probabilities | rounded to two decimals | at full precision |

- **No authentication.** The server accepts any API key and ignores it: keep it on `127.0.0.1` or behind a proxy that authenticates.
- **No rate limit.** The SDK's retries on 429 never fire; it still retries 408 and 5xx.
- **Tokens.** `usage.input_tokens` is counted in the model's own tokenizer, so counts differ from another provider's; `usage.output_tokens` is 1 per question.
- **Errors keep their codes.** 422 for a request the server cannot read, 400 for one the model cannot answer, each with a `detail`.
- **Timeouts.** The SDK gives up after 10 s by default; raise its `timeout` for the first request after a server starts, which warms the model.

## What decisio adds

- [Teach a task](/docs/tasks/): teach a question you ask again and again from your own labelled examples, and certify its answers.
- [Health and monitoring](/docs/health/): `GET /health` and the `x-decisio-*` headers on every answer, which give the server's time and what answered.
- [How it works](/docs/how-it-works/): decisio reads every option's probability from the model in one pass, instead of generating text.

## What next

- [Call it from your code](/docs/use-from/): the same request from curl, Python, JavaScript and the frameworks.
- [Requirements and limits](/docs/limits/): the context, the options per question and what was measured on what.
- [The HTTP API](/docs/api/): every route, request field and response field.
