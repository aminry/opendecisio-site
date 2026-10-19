---
title: Troubleshoot
description: What you see, why it happens, and what to do, from a server that will not start to an answer that surprises you.
---

<!-- Site-written: the Troubleshoot guide. Every row is a statement of decisio's docs/troubleshooting.md, docs/api.md, docs/running.md, docs/tasks.md, docs/migrating.md or EVAL_CARD.md at the pinned release (src/lib/figures/run-it.mjs checks each one still says it). -->

::covers{links="docs/troubleshooting.md docs/troubleshooting.md#the-card-is-too-small=1-it-does-not-start docs/troubleshooting.md#the-driver-does-not-support-cuda-130=1-it-does-not-start docs/troubleshooting.md#port-8000-is-already-in-use=1-it-does-not-start docs/troubleshooting.md#the-checkpoint-download-fails-or-stops=1-it-does-not-start"}

Find what you see in the tables below, and what to do about it.
Start with what the server says about itself:

```bash
# 200 when the engine is up, 503 when it has died, and 000 while nothing answers yet (the server is still starting)
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/health
# the registered tasks, and whether the server applies them
curl -s http://127.0.0.1:8000/v1/tasks
```

## 1. It does not start

::symptoms{group="start"}

## 2. A request fails

Every error comes with a `detail` that names what is wrong: read it first.

::symptoms{group="request"}

## 3. A task does not apply

::symptoms{group="tasks"}

## 4. An answer surprises you

::symptoms{group="answers"}

## What next

- [Operate](/docs/operating/): what to watch, and what happens when the engine dies.
- [Requirements and limits](/docs/limits/): what each machine needs, and what repeats.
- [The HTTP API](/docs/api/): every status and field.
