---
title: "decisio 0.37.0 can answer short, repetitive texts without the model, where that saves time"
summary: "An opt-in in decisio 0.37.0 answers short, repetitive texts from a small classifier on the CPU, kept only where it saves at least 25% on your own examples."
date: 2026-10-30
tags: [release]
---

For a task of short texts that arrive in volume, decisio 0.37.0 can put a small classifier on the host CPU in front of the model, and answer most requests without asking it.
It is off unless a registration asks for it.

## What it does

Install `decisio[table]`, then register the task with `"fast_table": true` and a `certify` block.
The server times the table and the model on your own held-out examples, and keeps the table only if it saves at least 25% of the time per request.
Every answer says which side gave it, `answered_by` `table` or `decisio`, and the certificate covers both.

## What it saves

| Set | Table answers | Of those, wrong | Mean time per request on the 31B, decisio alone, then with the table |
| --- | ---: | ---: | ---: |
| CLINC150, 150 intents | 92.3% | 3.1% | 384 ms, 71 ms |
| Snips, 7 intents | 100% | 2.1% | 62 ms, 24 ms |
| SMS spam | 99.8% | 1.4% | 62 ms, 32 ms |
| MASSIVE, 60 intents | 45.2% | 2.2% | 310 ms, 190 ms |

::source[Measured offline with the server's own code at 1,000 labels: decisio 0.35.0 and vLLM 0.31.0 on one RTX PRO 6000 Blackwell at 600 W, the table on four threads of a server CPU, 2026-10-30, medians of two draws of the labelled examples.]

## What it costs, and where it does not help

- **It passed on 4 of the 10 sets we tried.** Without the three assistant-command sets, it passed on 1 of 7.
- **On long texts it was about twice as slow,** because the encoder runs in front of every request, at 134 to 183 ms for 600 to 1,150 tokens. The registration drops the table there, so asking for it on the wrong task costs the registration, not the traffic.
- **It needs more examples:** at least 100 to fit, and about 600 or more held out at the defaults.
- **It takes CPU:** a replica sustains roughly 35 to 45 table requests a second. Above that it falls back to the model.

## On several replicas

Each replica decides for itself and reports it in `status.fast_table`.
A replica on another stack serves through the model until it has timed the table itself, a different encoder revision means registering again, and with a shared task store an alarm on one replica suspends the table on all of them.

[Answer short tasks faster](/docs/tasks/fast-table/) has the whole setup.
