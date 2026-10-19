---
title: The HTTP API
description: Every route, request field and response field, in the System One wire format.
---

<!-- Site-written: the figure, the commands and the links. The reference below is decisio's docs/api.md at the pinned release. -->

The server answers questions on `POST /v1/systemone` and has a few more routes to register a task, set an abstention threshold and report what it is serving.
A malformed request is answered with status 422 and a `detail` naming what is wrong; a request the engine cannot answer, with 400.

::figure{name="routes"}

## TL;DR

With a server running ([Get started](/docs/) starts one), ask what it serves, check that it is up, then ask one choice question with bare option names:

```bash
curl -s http://127.0.0.1:8000/v1/models
curl -s http://127.0.0.1:8000/health
curl -s http://127.0.0.1:8000/v1/systemone \
  -H 'Content-Type: application/json' \
  -d '{"state": "My card keeps getting declined when I renew.", "questions": {"category": {"type": "choice", "instructions": "Which team should handle this ticket?", "criteria": {"billing": null, "access": null, "bug": null}}}}'
# the model's name, as System One lists it
# {"ok": true, ...}: the engine, the base, its checkpoint and revision, the temperatures and the prompt
# {"model": "...", "answers": {"category": {"type": "choice", "choice": "...", "confidence": ..., "probabilities": {...}}}, ...}
```

:::glossary

| Word | Meaning |
| --- | --- |
| `detail` | what a 422 or 400 says is wrong, in the body of the answer |
| `criteria` | a choice's options (keys, with a description or `null`), or a score's levels |
| `confidence` | System One's own figure: for a choice, the top probability rescaled from uniform |
| task | one recurring question registered from labelled examples (`POST /v1/tasks`) |

:::

## 1. Ask what it serves

`GET /v1/models` lists the served model's name, the base's own unless `--served-name` sets another.
`GET /health` says more: the engine, the base, its checkpoint and revision, the temperatures and the prompt.

## 2. Ask a question

The request fields and the answer's are in the reference below.
The `model` field is optional: a decisio server serves one base, chosen when it starts, and names it in the answer.

:::caution[Common mistake]
Fields the server does not know are ignored, not rejected, so a misspelled field has no effect.
Check a field your client relies on against the reference.
:::

## Reference

::upstream{file="docs/api.md"}

## What next

- [Read the answer](/docs/#4-read-the-answer): one request and its answer, line by line.
- [Teaching it a task](/docs/tasks/): register a question you ask again and again.
- [Operate](/docs/operating/): health, restarts and security.
