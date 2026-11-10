---
title: Send a fixed text once
description: Register a long, fixed text, such as a policy or a rubric, once as the task's context; on a Mac each request then reads only what changes, and on any engine requests get smaller.
---

<!-- Site-written: the Send a fixed text once guide. Its facts are decisio's docs/tasks.md ("Task context") and docs/api.md at the pinned release (src/config/sourced.mjs checks them). -->

::covers{links="docs/tasks.md#task-context docs/tasks.md#what-a-context-buys-on-each-engine=1-see-where-it-works-great"}

Every request of a task is often read against the same long text: a policy, a rubric, a catalogue, a set of definitions.
Register that text once as the task's context, and each request sends only the part that changes; the server puts the context in front of it.
On a Mac, a 1,176-token moderation policy sent as the context took 373 ms a read, against 1,946 ms when every request carried it:

::upstream{file="docs/tasks.md" section="Task context" block="1"}

## 1. See where it works great

| Engine | The policy at the start of every request | The policy as the task's context |
| --- | ---: | ---: |
| MLX, an Apple M5 Pro | 1,946 ms a read | 373 ms a read |
| vLLM, an RTX PRO 6000 | 61.4 ms p50 | 60.8 ms p50 |

::source[decisio's measurement with a 1,176-token moderation policy and short comments to judge, the tuned 12B, one question per request, requests one at a time: the MLX conversion on an Apple M5 Pro, the mean of 600 reads; the 12B in bf16 on vLLM 0.31.0 and one RTX PRO 6000, 40 requests, as decisio's docs/tasks.md states them.]

- **On a Mac each request computes only its changing part.** MLX's prefix cache finds only exactly the same prefix, so a policy at the start of every request is computed again each time; as the context it is a cache entry of its own, and each request computes only its changing part.
- **On vLLM the answers are the same, and the requests smaller.** vLLM's prefix cache already reuses a prefix every request repeats, so the two run at the same speed; the context is held from the task's first request.
- **A fast table learns from the part that changes,** since it encodes the state alone.

## 2. Register it

- **Add `"context"` to the registration:** a string, or an object or array read as compact JSON. Labelled, dynamic-option and learning registrations take it.
- **Send only the changing part as each example's state.** The server reads each example with the context, so the task is fitted, certified and timed on exactly what it serves.
- **Keep in the context only what is the same on every request.** What changes belongs in the state.

## 3. Ask with it

- **Send the state without the context.** A state that still starts with the context is read with it twice, and the response carries `x-decisio-warning`.
- **Name the task when several share a question.** The same question with another context is another task, kept beside the first; `"task": "<id>"` on `/v1/systemone` picks one.
- **One request, one context.** Questions whose tasks have different contexts go in separate requests.

## 4. Good to know

- **A context over the model's window is refused with 422 before any model work,** on every engine, and so is one that fits but not beside an example's state.
- **The context is part of the task's identity:** a certificate made under one context does not hold under another.
- **Status shows the context's sha256 and length, never its text;** the export holds the text.
- **Abstention tasks take no context.**
- **Upgrade every replica before registering a task with a context.** An earlier release refuses its record rather than serve the task without it.

## What next

- [Teach a task](/docs/tasks/): register a task and read what it kept.
- [Answer short tasks faster](/docs/tasks/fast-table/): a classifier on the server's CPU, before the model.
- [The HTTP API](/docs/api/): the task routes, field by field.
