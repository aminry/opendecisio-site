---
title: Troubleshoot
description: What you see, why it happens, and what to do, from a server that will not start to an answer that surprises you.
---

<!-- Site-written: the Troubleshoot guide. Every row is a statement of decisio's docs/troubleshooting.md, docs/api.md, docs/running.md, docs/tasks.md, docs/migrating.md or EVAL_CARD.md at the pinned release (src/lib/figures/run-it.mjs checks each one still says it). -->

::covers{links="docs/troubleshooting.md docs/troubleshooting.md#the-card-is-too-small=it-does-not-start docs/troubleshooting.md#the-driver-does-not-support-cuda-130=it-does-not-start docs/troubleshooting.md#port-8000-is-already-in-use=it-does-not-start docs/troubleshooting.md#the-checkpoint-download-fails-or-stops=it-does-not-start"}

Start with what the server says about itself:

```bash
# 200 when the engine is up, 503 when it has died, and 000 while nothing answers yet (the server is still starting)
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/health
# the registered tasks, and whether the server applies them
curl -s http://127.0.0.1:8000/v1/tasks
```

## It does not start

<span class="fp-anchor" id="1-it-does-not-start"></span>

::symptoms{group="start"}

## A request fails

<span class="fp-anchor" id="2-a-request-fails"></span>

Every error comes with a `detail` that names what is wrong: read it first.

::symptoms{group="request"}

## A task does not apply

<span class="fp-anchor" id="3-a-task-does-not-apply"></span>

::symptoms{group="tasks"}

## An answer surprises you

<span class="fp-anchor" id="4-an-answer-surprises-you"></span>

::symptoms{group="answers"}

## What next

- [Operate](/docs/operating/): what to watch, and what happens when the engine dies.
- [Requirements and limits](/docs/limits/): what each machine needs, and what repeats.
- [The HTTP API](/docs/api/): every status and field.
