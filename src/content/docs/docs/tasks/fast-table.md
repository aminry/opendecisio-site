---
title: Answer short tasks faster
description: An opt-in per task that answers short, repetitive texts from a small classifier on the host CPU, kept only where it measures a saving of at least 25% on your own examples.
---

<!-- Site-written: the Answer short tasks faster guide. DRAFT until decisio 0.37.0; its facts are decisio's docs/tasks.md ("A fast table in front of decisio"), docs/operating.md, docs/api.md and docs/upgrading.md in the pull request that adds them, and are checked again at the release. The count of sets that passed is the study's, on decisio 0.35.0. -->

For a task of short texts that arrive in volume, a small classifier on the host CPU can answer most requests without asking the model.
It is off unless the registration asks for it, and the registration keeps it only where it saves at least 25% of the time per request, timed on your own examples.
Install the `table` extra, then ask for it:

::site-block{name="fast-table-register"}

## 1. Check that it fits

- **It fits short, command-style texts with about a thousand labelled examples:** an assistant's commands, spam, a fixed set of intents.
- **It does not fit long texts.** The encoder runs in front of every request, at 21 to 30 ms for a short text and 134 to 183 ms for a text of 600 to 1,150 tokens, which is more than the model's own read.
- **It does not fit a task where nothing is certified, or a task whose options change.**
- **It passed on 4 of the 10 sets we tried.** Without the three assistant-command sets, it passed on 1 of 7.
- **It needs a `certify` block, choice questions and at least 100 fit examples,** and about 600 or more held-out examples at the defaults. Without the `decisio[table]` extra, on every replica, the registration is refused with 422.

Asking for it on the wrong task costs the registration, not the traffic.

## 2. Read what it kept

- **`fast_table_report` in the response** has `kept`, the `reason` when it is false, the `guard` with both mean times, the table's share and the saving, and the thresholds.
- **A table that is not kept** leaves a task served and certified as it would be without one.
- **Every answer says which side gave it:** `answered_by` is `table` or `decisio`.
- **The certificate covers both sides:** with probability at least 1 - `delta`, at most `alpha` of the certified answers are wrong, for traffic like your examples and on this serving stack.
- **No request text, embedding of a request or example is stored.**

## 3. Know what it saves

| Set | Table answers | Of those, wrong | Mean time per request on the 31B, decisio alone, then with the table |
| --- | ---: | ---: | ---: |
| CLINC150, 150 intents | 92.3% | 3.1% | 384 ms, 71 ms |
| Snips, 7 intents | 100% | 2.1% | 62 ms, 24 ms |
| SMS spam | 99.8% | 1.4% | 62 ms, 32 ms |
| MASSIVE, 60 intents | 45.2% | 2.2% | 310 ms, 190 ms |
| Civil comments, long with noisy labels | 69.8% | 3.7% | 65 ms, 74 ms: dropped |
| CFPB complaints and arXiv, long | 0% | none | about twice as slow: dropped |

::source[Measured offline with the server's own code at 1,000 labels: decisio 0.35.0 and vLLM 0.31.0 on one RTX PRO 6000 Blackwell at 600 W, the table on four threads of a server CPU, 2026-10-30, medians of two draws of the labelled examples.]

- **The saving is largest where the model's own read is expensive:** CLINC150 and MASSIVE use the intent head, at 190 to 380 ms.
- **With a plain read, the table needs to answer roughly 60 to 75% of requests** to clear 25%.
- **Your hosts decide your own figures,** which is why the registration measures them.

## 4. Run it on several replicas

Each replica decides for itself, and `status.fast_table` on `GET /v1/tasks/{id}` says what it is doing:

- **`active`:** the table answers the requests it is sure of.
- **`timing`:** decisio answers everything, on another stack than the table was timed on, or because the table stopped paying under this replica's load. Every tenth request also times the table, and after 30 pairs that show the saving it is taken up again.
- **`suspended`:** the monitor's alarm fired here or on a replica sharing the task store.
- **`unavailable`:** this server has another encoder revision than the table was fitted with, so register the task again, or the `table` extra is not installed.

Size the CPU for it: the encoder runs one text at a time, so a replica sustains roughly 35 to 45 table requests a second. Above that, requests queue, the median time rises, and the replica falls back to decisio.

## 5. Watch it

- **The monitor watches table and decisio answers together,** as for any certified task.
- **Every 50th table answer is also read by decisio,** which takes one more model read, and an alarm watches how often the two differ.
- **When an alarm fires, the table is suspended.** With `--task-store`, every other replica stops using it within the store's poll. With `--tasks-dir`, no store, or a read-only replica, the suspension holds only on the replica that saw the alarm.
- **Certify the task again to lift it:** the table's thresholds and timing are made again, and it is dropped if it no longer pays.

## What next

- [Teach a task](/docs/tasks/): register a task and read what it kept.
- [Certify answers](/docs/tasks/certify/): what a certificate promises.
- [Operate](/docs/operating/): replicas and a shared task store.
