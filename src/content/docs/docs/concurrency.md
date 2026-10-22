---
title: Batch concurrent requests
description: An opt-in mode that scores the requests waiting for the engine together in one call, for more requests a second when many clients send at once; a lone request is answered as before.
---

<!-- Site-written: the Batch concurrent requests guide. Its facts are decisio's docs/running.md ("Concurrency"), docs/cli.md, docs/api.md and docs/upgrading.md at the pinned release (src/config/sourced.mjs checks them). Its throughput is decisio's RTX 5090 run with the tokenizer fix, as running.md states it; no claim for the 31B or the bf16 12B, and none that batched answers equal serial ones beyond a lone request. -->

::covers{links="docs/running.md#concurrency"}

Batched mode is opt-in: it scores every request waiting for the engine together, in one call, so concurrent requests share the model's forward passes.
A request that arrives at an idle server is still scored at once, alone, and gets the serial answer bit for bit, so a single client sees no change.

Under concurrent load it answers more requests a second: the Gemma 4 12B in FP8 answered 8.9 and 9.2 requests a second at 8 and 16 clients, against 7.2 one at a time, on requests about new texts of about 1,000 tokens.
The gain depends on the card, the model and how often texts repeat, so measure it on your own traffic.

::source[Measured with decisio 0.24.0's tokenizer fix before its release, the Gemma 4 12B in FP8 on one RTX 5090 at 0.95 of the card, vLLM 0.31.0, 2026-10-21.]

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

- **Answers.** An answer no certified task covers can differ slightly when it is scored beside other requests, because the engine's arithmetic follows the shape of the batch. Keep serial where the same request must give the same bytes, such as two benchmark runs you compare request by request.
- **What was measured.** Only the 12B in FP8 has a published batched throughput figure; none is published for the 31B or the 12B in bf16.

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
