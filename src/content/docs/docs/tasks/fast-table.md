---
title: Answer short tasks faster
description: Answer short, repetitive traffic from a small learned classifier on the server's CPU, before the model, kept only where it saves enough time on your own examples, 10% by default.
---

<!-- Site-written: the Answer short tasks faster guide. Its facts are decisio's docs/tasks.md ("A fast table in front of decisio") at the pinned release, and the bench's own description in src/decisio/bench/table_latency.py (src/config/sourced.mjs checks them). -->

::covers{links="docs/tasks.md#a-fast-table-in-front-of-decisio-opt-in docs/tasks.md#a-fast-table-that-learns-from-traffic=5-learn-from-your-traffic-with-no-labels"}

Add a fast table when short, recurring requests can often be answered before reaching the model.
The table runs on the server's CPU; decisio handles the requests it passes on.
Registration keeps a table only when its answers certify and it saves enough time on your own examples.

::figure{name="table-fallback"}

Install the `decisio[table]` extra on the serving host first, or use the [fast-table container](/docs/deploy/docker/#5-run-fast-tables-with-no-hub-access).
Prepare `task.json` as a complete labelled registration, as [Teach a task](/docs/tasks/#3-register) shows.
This adds the opt-in and asks for a certificate:

::site-block{name="fast-table-register"}

## 1. See where it works great

Start with short commands, spam checks or a fixed set of intents, with representative labels.
The registration times the table and model on your host, and keeps the table only if it clears `min_saving`, 10% by default.
If no table qualifies, the task continues through decisio.

## 2. Choose a student

A student is the small text encoder used by the table.
Use `fast_table: true` for the default, or an object with a `kind`.

| `kind` | Student | Choose it for |
| --- | --- | --- |
| `static`, the default | potion-base-8M | A low-cost first try on short, repetitive traffic |
| `static` with `static_model: multilingual` | potion-multilingual-128M | Traffic in several languages |
| `encoder` | bge-base-en-v1.5 | Many-class English tasks; measure its added CPU cost |
| `auto` | Tries static and encoder | Letting registration choose the larger saving on this host |

Static students read the whole text.
The encoder reads at most 512 tokens, from the start and end of a longer text.

## 3. Ask for it

- Install the extra on every replica serving the table; without it, registration returns 422.
- Use choice or yes/no questions, a `certify` block, at least 100 fitting examples and about 600 or more held-out examples at the default targets.
- With the default half held out, prepare about 1,200 representative labels to start; a certificate can still find no usable threshold.
- Set `fast_table.min_saving` from 0.01 to 0.90 to change the required mean saving.
- The first use downloads the chosen student; use the [table image](/docs/deploy/docker/#5-run-fast-tables-with-no-hub-access) when the serving host cannot reach the Hub.

## 4. Read what it kept

| Field | What to check |
| --- | --- |
| `fast_table_report.kept` | Whether a table was kept |
| `fast_table_report.reason` | Why a table was declined |
| `fast_table_report.guard` | The measured mean times, table share and saving |
| `fast_table_report.kinds` | Which students were tried and selected |
| `answered_by` on an answer | `table` or `decisio` |
| `status.fast_table` | What this replica is doing now |

Read `certified` and `certificate_kind` as well as the selected answer.
A table that is not kept leaves the model path available.

## 5. Learn from your traffic, with no labels

You can register a complete question with `fast_table.learn: true` and let model answers supply the learning data.
This support-routing example starts with no human labels:

::site-block{name="fast-table-learn"}

Until a table qualifies, decisio answers every request.
With `--tasks-dir` or `--task-store`, learning rows survive restarts; without either they stay in memory.
The rows keep features and model answers, not request text.

| Certificate kind | What it concerns |
| --- | --- |
| `gold` | Correctness against human-labelled examples |
| `agreement` | How often the table agrees with decisio |

A learned table can copy the model's mistakes.
An agreement certificate is insufficient for a policy that requires a gold correctness certificate.
A labelled task can also learn; its certificate stays gold while it has enough held-out human labels.

The `explore` share sends some table-eligible requests to the model, 0.02 by default.
Spot checks also send some table answers to the model, so allow for those slower requests when sizing the service.
Refits continue as traffic arrives; a version goes live only when it certifies and clears the saving requirement.

## 6. Learn across replicas

Use one shared `--task-store` and one serving setup across the fleet.
One replica trains; each replica times a promoted table locally before serving it.
A drift alarm or rollback reaches the other replicas through the store.

Keep clocks synchronized and monitor store reachability.
During an outage, replicas keep serving, pending rows have a memory limit, and no new version is promoted.
A read-only replica serves tables without logging rows or training.

## 7. Measure it on your own host

Registration measures one request at a time.
For caller-visible latency under load, use your own labelled examples and separate probe requests:

::site-block{name="fast-table-bench"}

The examples file contains one complete `request` and human `answer` per line; probes contain requests outside that set.
The command registers temporary table and model tasks, compares them under load, then deletes them.
Compare the `table` and `model` arms in the same text-length and concurrency cell, using wall-clock p50 and p95 as well as mean saving.

## 8. When to use something else

- Scores, images, adapters and changing-option tasks do not use this table path.
- Long or difficult tasks can certify too little to save time.
- An option absent from the fitting examples is passed to decisio.
- A deferred request pays both the CPU table cost and the model cost; test the slow path too.

## 9. Operating notes

| State | What answers | What to do |
| --- | --- | --- |
| `active` | The table where eligible, otherwise decisio | Watch latency, certified share and drift |
| `timing` | Decisio while the replica checks the table's saving | Allow CPU headroom and inspect the timing result |
| `suspended` | Decisio | Investigate the alert and certify again when appropriate |
| `unavailable` | Decisio | Check the installed extra and student files; register again if needed |

Inspect `GET /v1/tasks/{id}` for the live state and retained learning versions.
To roll back a learned table, send a retained version number to `POST /v1/tasks/{id}/fast_table/rollback`.
The last five versions are kept.

An encoder table needs CPU headroom on every replica.
Keep [drift alerts](/docs/tasks/drift/) connected to your review policy, and certify again after changing the serving setup.

## What next

- [Teach a task](/docs/tasks/): prepare the question and labelled registration.
- [Certify answers](/docs/tasks/certify/): choose the error target and read certification fields.
- [Operate](/docs/operating/): persistence, replicas and supervision.
