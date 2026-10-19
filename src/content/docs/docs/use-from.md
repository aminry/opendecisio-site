---
title: Call it from your code
description: Ask decisio from curl, Python, JavaScript or TypeScript, or the framework you already use. Every way sends the same JSON to one route.
---

<!-- Site-written: the merged Ways in, Python, JavaScript and Frameworks pages. The scripts send the first recorded decision, as decisio 0.17.0 answered it (src/lib/recorded.mjs); the facts about errors, timeouts and the SDK are decisio's docs/api.md and docs/migrating.md at the pinned release (src/config/sourced.mjs checks them); the frameworks' facts are src/data/integrations.json, and their programs are decisio's docs/integrations.md. -->

Call decisio from any language with one HTTP request, and get a probability for every option back.
Each script below sends the support ticket from [Get started](/docs/) and prints each question's likeliest option.

:::tabs

::tab{label="curl"}

::site-block{name="first-decision-request"}

::tab{label="Python"}

Python's standard library is all it needs.

::site-block{name="python-urllib"}

::tab{label="TypeSafe SDK"}

Install TypeSafe's SDK on its own: `pip install typesafe-sdk==0.7.2`, the version checked.
It needs a key; any string works.

::site-block{name="python-sdk"}

::tab{label="JavaScript"}

Save it as `ask.mjs` and run `node ask.mjs` (Node 22 or later; no package).

::site-block{name="js-fetch"}

::tab{label="TypeScript"}

Save it as `ask.ts` and run `node --experimental-strip-types ask.ts` (Node 22.6 or later; no package).

::site-block{name="ts-fetch"}

:::

In the Python, JavaScript and TypeScript tabs, the comment lines are what the default model answered.

::recorded-label{shows="printed"}

## Keep the server private

- The server has no authentication: it accepts the `Authorization` header and any API key, and ignores them.
- Run it on `127.0.0.1`, or behind a reverse proxy that authenticates the caller.
- Call it from your backend, not from a web page: the server sets no CORS headers, so a browser cannot call it.

## Handle errors

Every error comes back with a `detail` that names the problem.

| Status | What it means |
| --- | --- |
| 422 | the server cannot read the request: a missing field, more than 255 options, a text longer than the context |
| 400 | the model cannot answer this request |
| 415 | the body is not sent as `Content-Type: application/json` |

With the standard library, an error is an `HTTPError` whose body holds the `detail`:

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

- In JavaScript, check `response.ok` before reading the answer, as the script does.
- TypeSafe's SDK raises `TypeSafeUnprocessableEntityError` for a 422 and `TypeSafeBadRequestError` for a 400.

## Set a timeout

- The first request after a server starts warms the model and takes longer than the rest; allow for it.
- TypeSafe's SDK gives up after 10 s by default; raise its `timeout`.
- `fetch` has no timeout of its own; pass `signal: AbortSignal.timeout(ms)` to stop sooner.
- The server sets no rate limit, so the SDK's retries on 429 never fire; it still retries 408 and 5xx.

## Use a framework

Five frameworks that speak TypeSafe's format work with decisio once they point at the server.
Each was checked against a running server, and every check passed.

::integrations-table

- Every one needs an API key; any string works.
- Only the Vercel AI SDK wants `/v1` at the end of the base URL; the others add it themselves.
- Tasks and certified answers are decisio's own routes: none of these frameworks calls them, so call those routes directly.

Each program below asks two questions about one ticket and prints the answers.

:::tabs

::tab{label="LangChain"}

::upstream{file="docs/integrations.md" section="LangChain"}

::tab{label="Vercel AI SDK"}

::upstream{file="docs/integrations.md" section="Vercel AI SDK"}

::tab{label="n8n"}

::upstream{file="docs/integrations.md" section="n8n"}

::tab{label="TanStack AI"}

::upstream{file="docs/integrations.md" section="TanStack AI"}

::tab{label="Pipecat"}

::upstream{file="docs/integrations.md" section="Pipecat"}

:::

## What next

- [Move from System One](/docs/migrating/): point a client you already have at decisio, and what changes.
- [Teach a task](/docs/tasks/): teach a question you ask again and again, and certify its answers.
- [The HTTP API](/docs/api/): every route, request field and response field.
