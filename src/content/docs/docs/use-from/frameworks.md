---
title: Frameworks
description: "LangChain, the Vercel AI SDK, n8n, TanStack AI and Pipecat, each checked against a running server: what to set, and what to know."
---

<!-- Site-written. The versions and check counts are the README's "Works with" table at the pinned release (the build compares them); the rest is each integration's README in decisio-examples at the commit the launch facts name (src/data/integrations.json). The integrations are written and maintained by others. -->

Five third-party integrations of TypeSafe's wire format were run against a decisio server (Gemma 4 31B, decisio 0.9.0, from a Mac through an SSH tunnel, 2026-10-08); every check passed.
They are plumbing checks: the client sends a request, the server answers, the client parses it.
They say nothing about accuracy, and each is written and maintained by someone else.

::figure{name="integrations"}

## TL;DR

Every integration needs the same three things, in its own spelling:

```text
base URL   http://127.0.0.1:8000          (the Vercel AI SDK's provider wants http://127.0.0.1:8000/v1)
API key    any string                     (every integration requires one; the server ignores it)
model      decisio-gemma-4-31b-it-letters (the name GET /v1/models lists; the server ignores it)
```

:::glossary

| Word | Meaning |
| --- | --- |
| integration | a package written and maintained by someone else that speaks System One |
| plumbing check | a run that sends requests and parses answers, to see that the pieces fit; it does not measure accuracy |
| abstention | a server run with `--abstain-option` can answer the best of the other options when its "can't tell" option is the likeliest; most of the integrations drop the two fields that say so (n8n with Simplify Output off, and Pipecat's client, pass them through), and that was emulated, not seen on a real abstaining server |

:::

:::caution[Common mistake]
Whether the base URL carries `/v1` is the one setting that differs: the Vercel AI SDK's provider wants it, and the other four append it themselves (adding it to TanStack AI's adapter posted to `/v1/v1/systemone` and failed with a 404).
:::

## 1. LangChain

::integration{id="langchain"}

## 2. Vercel AI SDK

::integration{id="ai-sdk"}

## 3. n8n

::integration{id="n8n"}

## 4. TanStack AI

::integration{id="tanstack"}

## 5. Pipecat

::integration{id="pipecat"}

## What next

- [System One clients](/docs/migrating/): the differences that matter once a client is pointed at the server.
- [Python](/docs/use-from/python/) and [JavaScript and TypeScript](/docs/use-from/javascript/): the same call without a framework.
- [The HTTP API](/docs/api/): every route, request field and response field.
