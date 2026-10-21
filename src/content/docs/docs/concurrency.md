---
title: Batch concurrent requests
description: Score the requests waiting for the engine together in one call, for more throughput when many clients send at once, while certified answers keep their one-at-a-time path.
---

<!-- Site-written: the Batch concurrent requests guide. Its facts are decisio's docs/running.md ("Concurrency"), docs/cli.md, docs/api.md and docs/upgrading.md at the pinned release (src/config/sourced.mjs checks them). No throughput or drift figure for batching is published yet, so the page gives none. -->

::covers{links="docs/running.md#concurrency"}

When many clients send at once, a server in batched mode scores every request waiting for the engine together, in one call, so they share the model's forward passes.
That is more throughput under concurrent load, for the questions no certified task answers.
A request that arrives at an idle server is still scored at once, alone, so a single client waits no longer than before.

No measurement of its throughput is published yet.
This reads the mode your server runs; without a flag it is serial:

::site-block{name="concurrency-health"}

## 1. Turn it on

Start the server with `--concurrency batched`:

::site-block{name="concurrency-start"}

- Without the flag the server stays serial: one request at a time through the engine, and the same request gives the same answer whatever else arrives.
- `--batch-max-requests` caps one call at 16 requests by default, counted in requests, not questions. The oldest waiting request is always taken.
- One call holds the requests of one adapter, or of the base alone.

## 2. Know what stays one at a time

- A certified task's questions, and every task registration and certification read, take the serial path on a batched server too.
- A thinking request, an image request and a request a task's intent head answers take the engine alone.
- So certified answers are made and served on the reads a serial server would make.

## 3. Know what can move

An answer no certified task covers can differ slightly when it is scored beside other requests, because the engine's arithmetic follows the shape of the batch.
Keep serial where the same request must give the same bytes, such as two benchmark runs you compare request by request.

## 4. Read what it did

- `x-decisio-batch` says, when a request shared a call, with how many requests and questions: `requests=N; rows=M`. It is absent when the request was scored alone.
- `wait=` in `x-decisio-stages` is the time the request waited for its call.
- `/health` reports the mode under `concurrency`, and in batched mode the calls made and the requests each call held.
- A request that fails on its own, such as a text over the length, fails alone; the call's other requests are scored again without it.

Where it runs and what it does to certificates are in [Requirements and limits](/docs/limits/#3-set-up-for-production).

## What next

- [Scale](/docs/scale/): many questions about one text, and the first read.
- [Requirements and limits](/docs/limits/#3-set-up-for-production): batching in production.
- [Server flags](/docs/flags/#every-flag): `--concurrency` and `--batch-max-requests` in full.
