---
title: "decisio can answer short, repetitive tasks from a table, where it measures a saving"
summary: "An opt-in per task keeps a small table only where it saves at least 25% on your own examples. It helps short texts with about 1,000 labels, and turns itself off elsewhere."
date: 2026-10-30
tags: [release]
---

decisio TODO(release) can answer a task's easiest requests from a small table, without reading them with the model.
It is an opt-in per task, and it decides for itself whether to stay.

## What it does

Ask for the table when you register a task.
The server times it on your own examples and keeps it only where it saves at least 25% end to end.
Every answer says which side gave it, `answered_by` `table` or `decisio`, and the certificate covers both.

## What it saves

On a 150-option set of assistant intents, the mean server time per request on the 31B went from 384 ms to 71 ms, with the table answering 92.3% of requests.
On spam it went from 62 ms to 32 ms.

::source[Measured with decisio 0.35.0 and vLLM 0.31.0 on one RTX PRO 6000 Blackwell at 600 W, 2026-10-30, the table on the host's CPU (AMD EPYC 9755, 4 threads), at 1,000 labelled examples, medians of two draws, 200 timed texts per set.]

## What it costs, and where it does not help

- **It passed on 4 of the 10 sets we tried.** Those were three sets of short assistant commands and spam; without the assistant commands it passed on 1 of 7.
- **On long texts it makes every request slower:** the mean time about doubled, which is why the server measures before it keeps a table.
- **It was measured at 1,000 labelled examples,** and does not fit tasks whose options change.

[Answer short tasks faster](/docs/tasks/fast-table/) has the whole setup.
