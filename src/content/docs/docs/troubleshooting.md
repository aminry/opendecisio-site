---
title: Troubleshooting
description: "What you see, why, and what to do: the failures the documentation describes, in one place."
---

<!-- Site-written. Every row is a statement of docs/api.md, docs/running.md, docs/tasks.md, docs/cli.md or docs/migrating.md at the pinned release (src/lib/figures/run-it.mjs checks each one still says it); what the documentation does not say is in docs/UPSTREAM_GAPS.md. -->

Most failures announce themselves with a status code or a line in the server's log.
This page collects the ones the documentation explains.

::figure{name="troubleshoot"}

## TL;DR

Start with what the server says about itself:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/health
curl -s http://127.0.0.1:8000/v1/tasks
# 200 when the engine is up, 503 when it has died, and 000 while nothing answers yet (the server is still starting)
# the registered tasks, whether tasks are applied, and the server's fingerprint
```

:::glossary

| Word | Meaning |
| --- | --- |
| 422 | the request is malformed or the prompt is too long; the `detail` says what |
| 400 | the engine cannot answer the request |
| 503 | the engine has died |
| fingerprint | the model and rendering a task is fitted under; a task is applied only by a server with the same one |

:::

## 1. Is it up?

A connection refused right after a start means the server is still starting: the first start downloads the checkpoint and warms the engine.
`/health` answers once it is ready (7 min 54 s for the 31B's first start, with its download, on the measured machine).
A 503 means the engine died; the server exits with code 70 and a restart policy brings a new one ([Health and monitoring](/docs/health/)).

## 2. Is it the request?

A 422 or a 400 comes with a `detail` that names what is wrong; read it first.
A prompt over 32,768 tokens is a 422 that says the rendered prompt is longer than the context, and a choice with more than 255 options is a 400.
The `model` field does not choose a model, and fields the server does not know are ignored, not rejected.

## 3. Is it the tasks?

No `x-decisio-tasks` header on a question you registered means it matched no task: ask it exactly as registered.
A server that prints `WARNING: tasks fitted under another model or rendering are not applied` at start was given tasks fitted under something else; register them again from their examples ([Teach it your question](/docs/tasks/)).

## 4. Is it the answer?

Answers can differ between runs on the Gemma bases, which do not repeat bit for bit, and between sessions on the 31B for near-tied options.
That is stated per base in [the evaluation card](/docs/evaluation-card/); it is not a fault.

## What next

- [Health and monitoring](/docs/health/): what `/health` and the headers report.
- [Flags and options](/docs/flags/): every flag, including the ones a start can refuse on.
- [The HTTP API](/docs/api/): every status and field.
