---
title: Answer short tasks faster
description: An opt-in per task that answers from a small table where it measures a saving of at least 25% on your own examples, and turns itself off where it does not.
---

<!-- Site-written: the Answer short tasks faster guide. DRAFT until the decisio release that contains the fast table; its API names, behaviour and numbers are checked against that release's docs before merging. The figures are the study's, on decisio 0.35.0. -->

A task can answer its easiest requests from a small table, without reading them with the model, when that saves time on your traffic.
Ask for it when you register the task; at registration the server times the table on your own examples, and keeps it only where it saves at least 25% end to end.

::site-block{name="fast-table-register"}

## 1. Check that it fits

- **It fits short, repetitive texts with about 1,000 labelled examples:** assistant commands and spam, in our study.
- **It does not fit long texts:** the table runs in front of every request, so where it answers little it only adds time. On 600 to 1,150-token texts it took 134 to 183 ms a request.
- **It does not fit tasks whose options change,** where most requests have no option the table knows.
- **It passed on 4 of the 10 sets we tried.** Without the three assistant-command sets, it passed on 1 of 7.

## 2. Read what it kept

- **The registration response says whether the table was kept, and why,** as it does for a task's other corrections.
- **Where the saving is under 25%, there is no table,** and the task answers as before.
- **Every answer says which side gave it:** `answered_by` is `table` or `decisio`.
- **The certificate covers both sides:** the certified error rate holds across the answers of the table and of decisio.

## 3. Know what it saves

Mean server time per request, decisio alone against decisio behind the table, at 1,000 labelled examples:

| Set | Model | decisio alone | With the table | Answered by the table |
| --- | --- | ---: | ---: | ---: |
| Assistant intents, 150 options | Gemma 4 31B | 384 ms | 71 ms | 92.3% |
| Assistant intents, 150 options | Gemma 4 12B | 241 ms | 52 ms | 92.3% |
| Spam | Gemma 4 31B | 62 ms | 32 ms | 99.8% |
| Spam | Gemma 4 12B | 49 ms | 32 ms | 99.8% |

::source[Measured with decisio 0.35.0 and vLLM 0.31.0 on one RTX PRO 6000 Blackwell at 600 W, 2026-10-30, the table on the host's CPU (AMD EPYC 9755, 4 threads), medians of two draws, 200 timed texts per set.]

- **Most of the saving comes from skipping an expensive read:** the 150-option set uses the intent head, which costs more than a plain read.
- **Where a set's plain read is already short, a table needs to answer about 60 to 75% of requests** to clear the 25% bar.
- **On long texts the mean time about doubled,** which is why the server measures before it keeps a table.

## 4. Watch it

- **The monitor watches the table's certified share, and its agreement with decisio on a sample.**
- **When either moves too far, the table is suspended** and every request goes to decisio.
- **No request text is kept.** The table is fitted from the examples you register.

## What next

- [Teach a task](/docs/tasks/): register a task and read what it kept.
- [Certify answers](/docs/tasks/certify/): what a certificate promises.
- [Scale](/docs/scale/): the other flags that move server time.
