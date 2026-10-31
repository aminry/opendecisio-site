---
title: "decisio 0.37.0 answers most short command traffic without the model: 384 ms to 71 ms on assistant commands"
summary: "An opt-in learned classifier on the server's CPU answered 92.3% of CLINC150's assistant commands, 3.1% of them wrong, and cut the mean time per request on the 31B from 384 ms to 71 ms."
date: 2026-10-31
tags: [release]
---

Most short, repetitive command traffic can be answered without the model.
decisio 0.37.0 can put a small learned classifier, a sentence encoder and a linear layer fitted on your examples, on the server's CPU before the model, and it keeps itself only where it pays.

## Where it works great

| Set | Classifier answers | Of those, wrong | Mean time per request on the 31B, decisio alone, then with the classifier, counting requests handed on to the model | Saving |
| --- | ---: | ---: | ---: | ---: |
| CLINC150, 150 intents | 92.3% | 3.1% | 384 ms, 71 ms | 82% |
| Snips, 7 intents | 100.0% | 2.1% | 62 ms, 24 ms | 62% |
| SMS spam | 99.8% | 1.4% | 62 ms, 32 ms | 49% |
| MASSIVE, 55 intents | 45.2% | 2.2% | 310 ms, 190 ms | 39% |

::source[Measured offline with the server's own code at 1,000 labels: decisio 0.35.0 and vLLM 0.31.0 on one RTX PRO 6000 Blackwell at 600 W, the classifier on four threads of a server CPU, 2026-10-30, medians of two draws of the labelled examples.]

On CLINC150 a request the classifier answers takes 21.1 ms, and one it hands to the model about 405 ms.
The 71 ms is the mean over 200 timed requests, 13% of them handed on; at the whole test set's share the same arithmetic gives about 51 to 58 ms.
The saving is largest where the model's own read is expensive, and the certificate covers the classifier and the model together.

::source[The per-request times are the classifier on an AMD EPYC 9755 with four threads and the model's mean on the same texts, as docs/tasks.md states them on decisio's main at 53912433, for its next release.]

## How to use it

Install `decisio[table]`, then register the task with `"fast_table": true` and a `certify` block.
The server times the classifier and the model on your own held-out examples, and keeps the classifier only if it saves at least 25% of the time per request; `fast_table_report` says what it did.
Every answer says which side gave it, `answered_by` `table` or `decisio`.
[Answer short tasks faster](/docs/tasks/fast-table/) has the whole setup, and how each replica decides for itself.

## When to use something else

The timing check drops the classifier where it does not pay: across the ten sets tried it passed on 4, and without the three assistant-command sets on 1 of 7.
Long texts are the clearest case, about twice as slow with the classifier, and asking for it there costs the registration, not the traffic.
It takes CPU too, roughly 35 to 45 requests a second through the classifier per replica, and it needs about 600 held-out examples or more at the defaults.
