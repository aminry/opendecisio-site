---
title: Set up for production
description: The serving setup to keep for each certified task, the settings that make replicas agree, and what to certify again after a change.
---

<!-- Site-written: the production setup, split from the requirements page. Every setting is docs/running.md's at the pinned release. -->

::covers{links="docs/running.md#precision-casts---emulate-precision-casts=what-to-pin docs/running.md#batch-invariance---batch-invariant=what-to-pin docs/running.md#deterministic-compile---deterministic-compile=keep-a-certificate-valid"}

Pin the settings below, and your replicas answer the same way and each certificate stays valid.
They are a short list, and one change means certifying again.

## What to pin

Keep one serving setup for each certified task.
After an upgrade or a change to the model, engine, hardware, precision, cache type, prompt ceiling, layout or serving flags, certify the task again.

| Need | Set up and check |
| --- | --- |
| The same prompt ceiling across cards | Set `--max-model-len` explicitly and check `/health` |
| Repeated 12B reads independent of batch/cache | Consider `--batch-invariant on`, off by default; measure its added cost and certify again |
| Consistent 12B cold starts on replicas | Use the [certificate guidance](#keep-a-certificate-valid) for `--deterministic-compile`; leave it off on the 31B |
| Task persistence on one server | `--tasks-dir` on a persistent volume, with `--require-tasks` |
| Shared tasks across replicas | One `--task-store`, the same stack, synchronized clocks and per-replica monitoring |
| Private access | An authenticated proxy with rate and request-size limits; [Operate](/docs/operating/#5-secure-it) |

## Keep a certificate valid

<span class="fp-anchor" id="5-keep-it-valid"></span>

A certificate covers one task on one serving setup: the decisio version, the model and its revision, the engine, the card, the quantisation, the cache type, the context length, the [prompt layout](/docs/layout/) and the serving flags.
When any of it changes, every answer of the task is `certified: false` with the reason `serving_stack_changed`.
Certify again with `POST /v1/tasks/{id}/certify`, on new labelled examples.

1. **After upgrading decisio, certify your tasks again.**
2. **Expect a few answers near the threshold to change sides** between two fresh starts of the same server: judge the certificate by its rate over many answers, not by one.
3. **On the 12B with several replicas or fresh nodes, make cold starts agree** with `--deterministic-compile on`, then certify again: the setting is part of what a certificate covers. Leave it off on the 31B, whose cold starts already agreed in the same check and whose answers it changes.
4. **Expect a repeated request to differ slightly from its first read.** A request about a text the server has read before is computed on the blocks the prefix cache kept, which can move an answer near the threshold across it. On the 12B, `--batch-invariant on`, off by default, removes this: a request read from the cache gives the same bits as one read without it.

## Optional features

- Thinking requires the vLLM engine in the server process; a thinking request can hold up other requests.
- Batched concurrency requires vLLM or the development model in separate mode; MLX and packed mode reject it.
- A certificate made under another thinking or concurrency setting is suspended until you certify again.
- Tasks apply under their registered layout; another layout can produce `layout_mismatch`.
- Read-twice settings, flavors and a default adapter are also part of the serving setup.
- FP8 servers emulate bf16 rounding by default; changing that setting changes the setup too.

## Replicas

A shared-store write takes time to reach the other replicas; wait for the poll or read back from the writer.
If the store is unavailable, replicas keep serving their loaded records and task writes return 503.
The store must support conditional writes; check it before routing traffic, and collect task metrics from every replica.

On a Mac, run one model server at a time.
Choose its memory budget before starting another process that needs the same memory.

## What next

- [Certify answers](/docs/tasks/certify/): what a certificate covers, and how to keep it valid.
- [Operate](/docs/operating/): watch the server and secure it.
- [Requirements and limits](/docs/limits/): the machine and the longest text.
