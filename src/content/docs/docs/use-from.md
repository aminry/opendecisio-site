---
title: Ways in
description: Five ways to talk to a Decisio server; all of them send the same JSON to the same route.
---

<!-- Site-written: a map of the ways in. Every claim about a route or a client is from docs/api.md or docs/migrating.md of the pinned release, or on the page it links to. -->

A Decisio server speaks TypeSafe's System One wire format on `POST /v1/systemone`.
Anything that can send JSON can use it, and so can a client or framework that already speaks that format.
Pick the way that matches what you have.

::figure{name="ways-in"}

## TL;DR

With a server running ([Get started](/docs/) starts one), one yes/no question needs no options and no instructions:

```bash
curl http://127.0.0.1:8000/v1/systemone \
  -H 'Content-Type: application/json' \
  -d '{"state": "I was charged twice for October. Please refund one.", "questions": {"urgent": {"type": "noul"}}}'
# {"model": "...", "answers": {"urgent": {"type": "noul", "noul": ...}}, "usage": {"input_tokens": ..., "output_tokens": ...}}
```

:::glossary

| Word | Meaning |
| --- | --- |
| wire format | the shape of the request and the answer; Decisio implements TypeSafe's published System One format |
| route | an address on the server that does one thing; `POST /v1/systemone` asks questions |
| base URL | the address a client sends its requests to, here `http://127.0.0.1:8000` unless `--host` and `--port` say otherwise |

:::

## 1. Every way sends the same body

The body is a `state` and its `questions`, by name.
`GET /v1/models` names the model the server serves, and the answer carries the server's time in a header (`x-decisio-server-ms`).
[The HTTP API](/docs/api/) has every field.

## 2. Choose a way in

| If you have | Use | Page |
| --- | --- | --- |
| nothing yet, or any language | HTTP | [The HTTP API](/docs/api/) |
| a Python script | the standard library, or TypeSafe's SDK | [Python](/docs/use-from/python/) |
| a Node or browser app | `fetch`, no package | [JavaScript and TypeScript](/docs/use-from/javascript/) |
| a System One client already | change its address | [System One clients](/docs/migrating/) |
| LangChain, the Vercel AI SDK, n8n, TanStack AI or Pipecat | their TypeSafe integration, pointed here | [Frameworks](/docs/use-from/frameworks/) |

:::caution[Common mistake]
There is no authentication: the `Authorization` header and any API key are accepted and ignored.
Keep the server on `127.0.0.1`, or behind a reverse proxy that authenticates.
:::

## What next

- [The HTTP API](/docs/api/): every route, request field and response field.
- [Your first decision](/docs/first-request/): one request and its answer, line by line.
- [Teaching it a task](/docs/tasks/): register a question you ask again and again.
