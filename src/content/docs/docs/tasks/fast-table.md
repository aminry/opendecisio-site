---
title: Answer short tasks faster
description: Answer short, repetitive command traffic from a small learned classifier on the server's CPU, before the model, kept only where it saves at least 25% on your own examples.
---

<!-- Site-written: the Answer short tasks faster guide. Its facts are decisio's docs/tasks.md ("A fast table in front of decisio") at the pinned release (src/config/sourced.mjs checks them). -->

::covers{links="docs/tasks.md#a-fast-table-in-front-of-decisio-opt-in"}

decisio's fast table (`fast_table`) is a small learned classifier, a sentence encoder and a linear layer fitted on your own examples, that runs on the server's CPU before the model and answers the short, repetitive requests it is sure of.
On CLINC150's assistant commands it answered 92.3% of requests, 3.1% of them wrong.

A request it answers takes 21.1 ms and one it hands to the model about 405 ms, so over 200 timed requests the mean on the 31B fell from 384 ms to 71 ms.
It is off unless a registration asks for it:

::site-block{name="fast-table-register"}

## 1. See where it works great

It works best on short, command-style texts with about a thousand labelled examples: an assistant's commands, spam, a fixed set of intents.

| Set | Classifier answers | Of those, wrong | Mean time per request on the 31B, decisio alone, then with the classifier, counting requests handed on to the model | Saving |
| --- | ---: | ---: | ---: | ---: |
| CLINC150, 150 intents | 92.3% | 3.1% | 384 ms, 71 ms | 82% |
| Snips, 7 intents | 100.0% | 2.1% | 62 ms, 24 ms | 62% |
| SMS spam | 99.8% | 1.4% | 62 ms, 32 ms | 49% |
| MASSIVE, 55 intents | 45.2% | 2.2% | 310 ms, 190 ms | 39% |

::source[Measured offline with the server's own code at 1,000 labels: decisio 0.35.0 and vLLM 0.31.0 on one RTX PRO 6000 Blackwell at 600 W, the classifier with its torch encoder on four threads of a server CPU, 2026-10-30, medians of two draws of the labelled examples.]

What one request costs, on the same CPU and card:

| Set | A request the classifier answers, mean | A request handed to the model |
| --- | ---: | ---: |
| CLINC150, 150 intents | 21.1 ms | 405 ms |
| Snips, 7 intents | 23.6 ms | 86 ms |
| SMS spam | 31.6 ms | 94 ms |
| MASSIVE, 55 intents | 20.5 ms | 330 ms |

::source[The per-request times are the classifier on an AMD EPYC 9755 with four threads, 200 timed texts per set, and the model's mean on the same texts, as decisio's docs/tasks.md states them, timed with the torch encoder of decisio 0.37.0.]

- **These are the times of the earlier torch encoder.** decisio now runs the encoder through ONNX Runtime, with the same embeddings to about 1.5e-6. On one short text on an Apple M5 Pro at four threads, the whole classifier path took 4.6 ms against 11.6 ms; that was not measured on x86 server CPUs, and the registration times the encoder it will serve on your host.
- **The classifier runs on every request** to find out whether it is sure, so every request pays its time, and a request it hands on pays the model's as well.
- **The 71 ms is the mean over those 200 requests,** 26 of them, 13%, handed on. The whole test set handed on less, 7.7%, or 9.6% in the draw that was timed, and at that share the same arithmetic gives about 51 to 58 ms.
- **The saving is largest where the model's own read is expensive:** CLINC150 and MASSIVE use the intent head, at 190 to 380 ms.
- **The certificate covers both sides:** at most `alpha` of the certified answers are wrong, for traffic like your examples and on this serving stack.
- **It checks itself:** the registration times the classifier and the model on your own held-out examples, and keeps the classifier only if it saves at least 25% of the time per request.

## 2. Ask for it

- **Install the `decisio[table]` extra** on every replica that will serve the task; the image does not carry it. Without it the registration is refused with 422.
- **The first use fetches the encoder,** a 436 MB export and its tokenizer, from the Hugging Face Hub at a pinned revision, checked against a pinned hash. A server with no route to the Hub needs them fetched first: `hf download BAAI/bge-base-en-v1.5 onnx/model.onnx tokenizer.json --revision a5beb1e3e68b9ab74eb54cfd186867f64f240e1a`.
- **Add `"fast_table": true` and a `certify` block,** with choice questions and at least 100 fit examples.
- **Hold out about 600 examples or more,** at the defaults, since the certificate holds each side to half the risk.

## 3. Read what it kept

- **`fast_table_report` in the response** has `kept`, the `reason` when it is false, the `guard` with both mean times, the classifier's share and the saving, and the thresholds.
- **`answered_by` on every answer** is `table` or `decisio`, with the usual `certified` fields.
- **A classifier that is not kept** leaves a task served and certified as it would be without one.

## 4. When to use something else

The timing check drops the classifier where it does not pay, so asking for it on the wrong task costs the registration, not the traffic.
Across the ten sets tried, it passed the 25% check on 4; without the three assistant-command sets, on 1 of 7.

- **Long texts:** the encoder runs in front of every request: with the torch encoder, 21 to 30 ms for a short text and 134 to 183 ms for 600 to 1,150 tokens. CFPB complaints went from 154 ms to 315 ms, and arXiv abstracts from 184 ms to 370 ms: dropped.
- **Noisy labels:** on Civil comments the classifier answered 69.8%, 3.7% of them wrong, but 65 ms became 74 ms: dropped.
- **Nothing certified:** SciCite, and the two sets whose options change per request, were dropped.
- **A plain read:** on short texts the classifier needs to answer roughly 60 to 75% of requests to clear 25%. MASSIVE passes only because its read goes through the intent head; timed as a plain read it saves 21% on the 31B.
- **What it does not cover:** a yes/no or score question, an image request, an adapter, and a task whose options change per request. It serves choice questions on the text route, one order per request.
- **An option none of your examples carried:** the classifier cannot answer with it, so those requests go to decisio.
- **The saving is a mean over requests:** a request the classifier defers takes the classifier's time and then decisio's.
- **Your hosts decide your own figures,** which is why the registration measures them.

## 5. Operating notes

Each replica decides for itself, and `status.fast_table` on `GET /v1/tasks/{id}` says what it is doing:

- **`active`:** the classifier answers the requests it is sure of.
- **`timing`:** decisio answers everything, on another stack than the classifier was timed on, or because the classifier stopped paying under this replica's load. Every tenth request also times the classifier, and after 30 pairs that show the saving it is taken up again.
- **`suspended`:** the monitor's alarm fired here or on a replica sharing the task store.
- **`unavailable`:** this server has another encoder revision than the classifier was fitted with, so register the task again, or the `table` extra is not installed.

Size the CPU for it: the encoder runs one text at a time, so the rate a replica sustains is the reciprocal of its time: with the torch encoder, about 35 to 45 requests a second through the classifier. Above that, requests queue, the median time rises, and the replica falls back to decisio.

- **The monitor watches classifier and decisio answers together,** as for any certified task. Every 50th classifier answer is also read by decisio, which takes one more model read, and an alarm watches how often the two differ.
- **When an alarm fires, the classifier is suspended,** unless the task sets `suspend_on_alert` off. With `--task-store`, every other replica stops using it within the store's poll. With `--tasks-dir`, no store, or a read-only replica, the suspension holds only on the replica that saw the alarm.
- **Certify the task again to lift it:** the classifier's thresholds and timing are made again, and it is dropped if it no longer pays.
- **How far the certificate is proved:** the classifier's side has the procedure's proof, with probability at least 1 - `delta`/2. The model's side, on the requests the classifier defers, is supported by simulation and not proved: it broke its allowance in at most 1.3% of draws against the 5% allowed. The whole cascade broke its promise in about 2 to 3 of every 100 simulated draws, against the 10 allowed.
- **No request text, embedding of a request or example is stored.**

## What next

- [Teach a task](/docs/tasks/): register a task and read what it kept.
- [Certify answers](/docs/tasks/certify/): what a certificate promises.
- [Operate](/docs/operating/): replicas and a shared task store.
