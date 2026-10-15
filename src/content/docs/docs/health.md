---
title: Health and monitoring
description: What /health reports, what each response carries, and what a dead engine looks like.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The reference is docs/api.md and docs/running.md at the pinned release. -->

A server tells you what it is serving and what each request cost; nothing needs a separate agent.
Two things are worth watching: `/health`, and the headers of the responses.

::figure{name="health-map"}

## TL;DR

With a server running ([Get started](/docs/) starts one), check what it serves, then ask one question and print the headers that say what it cost:

```bash
curl -s http://127.0.0.1:8000/health; echo
curl -s -D - -o /dev/null http://127.0.0.1:8000/v1/systemone \
  -H 'Content-Type: application/json' \
  -d '{"state": "Both charges are 49.00 EUR, same day. Please refund one.", "questions": {"urgent": {"type": "noul"}}}' \
  | grep -i '^x-decisio'
# x-decisio-server-ms: the server's time for the request
# x-decisio-route: the route that served it (text or image)
# x-decisio-stages: where the engine's time went
```

:::glossary

| Word | Meaning |
| --- | --- |
| `/health` | one object a run record can quote: the engine, the base, its checkpoint and revision, the temperatures and the prompt |
| server time | `x-decisio-server-ms`, without the network |
| stages | `x-decisio-stages`: `prepare`, `warm`, `questions`, `readout`, `engine` and `wait`; `engine + wait` is the server time within a few ms |
| exit code 70 | what a server exits with after its engine has died |

:::

:::caution[Common mistake]
Check the status code of `/health`, not only that the connection opened: once the engine has died it answers 503.
:::

## 1. What /health says

::upstream{file="docs/api.md" section="GET /health" depth="3"}

## 2. What each response says

::upstream{file="docs/api.md" section="Response" depth="3"}

## 3. When the engine dies

::upstream{file="docs/running.md" section="When the engine dies"}

## What next

- [Deploying and operating](/docs/operating/): the restart policy that acts on exit code 70.
- [Troubleshooting](/docs/troubleshooting/): symptoms and what the documentation says to do.
- [Make it fast](/docs/guides/latency/): read `x-decisio-stages` to see where the time went.
