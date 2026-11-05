---
title: Answer short tasks faster
description: Answer short, repetitive traffic from a small learned classifier on the server's CPU, before the model, kept only where it saves at least 25% on your own examples.
---

<!-- Site-written: the Answer short tasks faster guide. Its facts are decisio's docs/tasks.md ("A fast table in front of decisio") at the pinned release, and the bench's own description in src/decisio/bench/table_latency.py (src/config/sourced.mjs checks them). -->

::covers{links="docs/tasks.md#a-fast-table-in-front-of-decisio-opt-in"}

decisio's fast table (`fast_table`) is a small learned classifier on the server's CPU that answers the requests it is sure of before the model is asked.
It turns the text into an embedding, the table's student, and a linear layer fitted on your own examples picks the option.

The default student is a static embedding: on an Apple M5 Pro it takes 0.05 ms for a short text and 1.0 ms for a long one of about 1,400 tokens.
At that cost a request the classifier hands on to the model costs about what it would without a table.

On CLINC150's assistant commands, the classifier with the encoder student answered 92.3% of requests, 3.1% of them wrong, and the mean time per request on the 31B fell from 384 ms to 71 ms.
It is off unless a registration asks for it:

::site-block{name="fast-table-register"}

The registration tries it on your own examples and keeps it only where it saves at least 25% of the time per request and its answers certify.

## 1. See where it works great

It works best on short, command-style texts with about a thousand labelled examples, where decisio is reliable: an assistant's commands, spam, a fixed set of intents.
These results are the encoder student's, bge-base; the registration measures the student you choose on your own examples.

| Set | Classifier answers | Of those, wrong | Mean time per request on the 31B, decisio alone, then with the classifier, counting requests handed on to the model | Saving |
| --- | ---: | ---: | ---: | ---: |
| CLINC150, 150 intents | 92.3% | 3.1% | 384 ms, 71 ms | 82% |
| Snips, 7 intents | 100.0% | 2.1% | 62 ms, 24 ms | 62% |
| SMS spam | 99.8% | 1.4% | 62 ms, 32 ms | 49% |
| MASSIVE, 55 intents | 45.2% | 2.2% | 310 ms, 190 ms | 39% |

::source[Measured offline with the server's own code at 1,000 labels: decisio 0.35.0 and vLLM 0.31.0 on one RTX PRO 6000 Blackwell at 600 W, the classifier with its torch encoder on four threads of a server CPU, 2026-10-30, medians of two draws of the labelled examples.]

What one request costs with the encoder, on the same CPU and card:

| Set | A request the classifier answers, mean | A request handed to the model |
| --- | ---: | ---: |
| CLINC150, 150 intents | 21.1 ms | 405 ms |
| Snips, 7 intents | 23.6 ms | 86 ms |
| SMS spam | 31.6 ms | 94 ms |
| MASSIVE, 55 intents | 20.5 ms | 330 ms |

::source[The per-request times are the classifier on an AMD EPYC 9755 with four threads, 200 timed texts per set, and the model's mean on the same texts, as decisio's docs/tasks.md states them, timed with the torch encoder of decisio 0.37.0.]

- **The classifier runs on every request** to find out whether it is sure, so every request pays its time, and a request it hands on pays the model's as well. With the encoder that is the 20 to 32 ms above; with a static student it is close to nothing.
- **The 71 ms is the mean over those 200 requests,** 26 of them, 13%, handed on. The whole test set handed on less, 7.7%, or 9.6% in the draw that was timed, and at that share the same arithmetic gives about 51 to 58 ms.
- **The saving is largest where the model's own read is expensive:** CLINC150 and MASSIVE use the intent head, at 190 to 380 ms.
- **The certificate covers both sides:** at most `alpha` of the certified answers are wrong, for traffic like your examples and on this serving stack.
- **It checks itself:** the registration times the classifier and the model on your own held-out examples, and keeps the classifier only if it saves at least 25% of the time per request.

## 2. Choose a student

`"fast_table": true` asks for the default student; an object chooses one.

| `fast_table` | Student | Table path, short text, then long text | Use it for |
| --- | --- | ---: | --- |
| `true`, or `{"kind": "static"}` | `minishlab/potion-base-8M`, a static embedding computed by decisio itself (the default) | 0.05 ms, 1.0 ms | most tasks: it costs so little that a table of it never makes a request slower |
| `{"kind": "static", "static_model": "multilingual"}` | `minishlab/potion-multilingual-128M` | 0.05 ms, 1.9 ms | traffic that is not English |
| `{"kind": "encoder"}` | `BAAI/bge-base-en-v1.5`, through ONNX Runtime | 6.3 ms, 85 ms | many-class English tasks where its larger share pays for its time on your host |
| `{"kind": "auto"}` | fits a static student and the encoder, and keeps the one that saves more on this host | both | when you do not know |

::source[The table path, the student and the classifier, p50 for one request on an Apple M5 Pro: a short text of a median 22 tokens and a long text of a median 1,416 tokens, as decisio's docs/tasks.md states them.]

- **On an x86 server CPU the static students cost about the same:** 0.04 to 0.06 ms for a short text and 1 to 4 ms at 1,400 tokens. bge-base at one thread costs about 25 ms for a short text and up to about 450 ms for a long one.
- **The static students read the whole text.** The encoder reads at most 512 tokens: the first 256 and the last 254 of a longer text.
- **`auto` keeps the student with the larger saving,** when that saving is at least 25% and its threshold holds. When the two savings are within 1 point it keeps the static one, and when neither qualifies there is no table. `static_model` picks the static student it tries.
- **`{"kind": "hashed"}` is reserved** and refused in this version.
- **All three students are MIT licensed,** and each one's files are pinned to a revision and checked against pinned sha256 hashes.

## 3. Ask for it

- **Install the `decisio[table]` extra** on every replica that will serve the task; the image does not carry it. Without it the registration is refused with 422.
- **The first use fetches the student** from the Hugging Face Hub at its pinned revision: 31 MB for the static base, 531 MB for the multilingual one and 436 MB for the encoder. A server with no route to the Hub needs them fetched first; its registration is refused, naming the command.
- **Add `fast_table` and a `certify` block,** with choice questions and at least 100 fit examples.
- **Hold out about 600 examples or more,** at the defaults, since the certificate holds each side to half the risk.

## 4. Read what it kept

- **`fast_table_report` in the response** has `kept`, the `reason` when it is false, the `guard` with both mean times, the classifier's share and the saving, and the thresholds.
- **`fast_table_report.kinds` lists every student tried,** with its table share, its error at the threshold and the upper bound, its expected saving and its mean table time, which one was kept and why.
- **`answered_by` on every answer** is `table` or `decisio`, with the usual `certified` fields.
- **`fast_table.features` in the task's record names the student exactly:** its kind, model, revision, the files' sha256 and how it reads a long text. The table is served only with that function.
- **A classifier that is not kept** leaves a task served and certified as it would be without one.

## 5. Measure it on your own host

The registration times the table path one request at a time.
To see what the table saves your callers under load, time a certified task end to end through your running server:

::site-block{name="fast-table-bench"}

- **The examples file** holds one `{"request": {...}, "answer": ...}` per line, as `POST /v1/tasks` takes them. The probe file holds requests of the same kind, not among the examples.
- **It registers the task twice,** with `"fast_table": true` (arm `table`), then without it (arm `model`), each timed on its own held-out requests and deleted.
- **Each line of its output is a cell:** an arm at a short or a padded long text, and at 1 or 16 requests in flight. It gives the wall time's p50 and p95, the server's time, the `task` stage, the share the table answered and the errors.
- **Compare the `table` arm's wall time with the `model` arm's in the same cell:** that difference is what the table saves your callers, under your load.

## 6. When to use something else

The timing check drops the classifier where it does not pay, so asking for it on the wrong task costs the registration, not the traffic.
Across the ten sets tried with the encoder, it passed the 25% check on 4; without the three assistant-command sets, on 1 of 7.

- **Long or hard tasks:** a table usually certifies nothing there. The registration then keeps no table, and the task is served exactly as without one.
- **Long texts with the encoder:** with the torch encoder the table path took 21 to 30 ms for a short text and 134 to 183 ms for 600 to 1,150 tokens. CFPB complaints went from 154 ms to 315 ms, and arXiv abstracts from 184 ms to 370 ms: dropped. A static student reads 1,400 tokens in 1.0 to 1.9 ms on an Apple M5 Pro, so its own time no longer makes a long text slower.
- **Noisy labels:** on Civil comments the encoder's classifier answered 69.8%, 3.7% of them wrong, but 65 ms became 74 ms: dropped.
- **Nothing certified:** SciCite, and the two sets whose options change per request, were dropped.
- **A plain read with the encoder:** on short texts the classifier needs to answer roughly 60 to 75% of requests to clear 25%. MASSIVE passes only because its read goes through the intent head; timed as a plain read it saves 21% on the 31B.
- **What it does not cover:** a yes/no or score question, an image request, an adapter, and a task whose options change per request. It serves choice questions on the text route, one order per request.
- **An option none of your examples carried:** the classifier cannot answer with it, so those requests go to decisio.
- **The saving is a mean over requests:** a request the classifier defers takes the classifier's time and then decisio's.
- **Your hosts decide your own figures,** which is why the registration measures them.

## 7. Operating notes

Each replica decides for itself, and `status.fast_table` on `GET /v1/tasks/{id}` says what it is doing:

- **`active`:** the classifier answers the requests it is sure of.
- **`timing`:** decisio answers everything, on another stack than the classifier was timed on, or because the classifier stopped paying under this replica's load. Every tenth request also times the classifier, and after 30 pairs that show the saving it is taken up again.
- **`suspended`:** the monitor's alarm fired here or on a replica sharing the task store.
- **`unavailable`:** this server cannot compute the student exactly as the record names it, so register the task again, or the `table` extra is not installed.

A table registered on an earlier release keeps its encoder and is served as before; register the task again to choose a student.
Upgrade every replica that shares a task store: one on an earlier release serves a new table through decisio and says to register the task again.

Size the CPU for it:

- **A static student is not what limits a replica's rate:** it costs a fraction of a millisecond.
- **The encoder runs as two sessions of four threads each:** at 16 requests in flight it sustained about 90 table requests a second on an Apple M5 Pro. Above its rate, requests queue, the median time rises, and the replica falls back to decisio.

Watch it like any certified task:

- **The monitor watches classifier and decisio answers together,** as for any certified task. Every 50th classifier answer is also read by decisio, which takes one more model read, and an alarm watches how often the two differ.
- **When an alarm fires, the classifier is suspended,** unless the task sets `suspend_on_alert` off. With `--task-store`, every other replica stops using it within the store's poll. With `--tasks-dir`, no store, or a read-only replica, the suspension holds only on the replica that saw the alarm.
- **Certify the task again to lift it:** the classifier's thresholds and timing are made again, and it is dropped if it no longer pays.
- **How far the certificate is proved:** the classifier's side has the procedure's proof, with probability at least 1 - `delta`/2. The model's side, on the requests the classifier defers, is supported by simulation and not proved: it broke its allowance in at most 1.3% of draws against the 5% allowed. The whole cascade broke its promise in about 2 to 3 of every 100 simulated draws, against the 10 allowed.
- **What is stored:** the student's feature function, the classifier (256 numbers per option for a static student, 768 for the encoder), the thresholds and the timing. No request text, embedding of a request or example is stored.

## What next

- [Teach a task](/docs/tasks/): register a task and read what it kept.
- [Certify answers](/docs/tasks/certify/): what a certificate promises.
- [Operate](/docs/operating/): replicas and a shared task store.
