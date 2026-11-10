---
title: Answer short tasks faster
description: Answer short, repetitive traffic from a small learned classifier on the server's CPU, before the model, kept only where it saves enough time on your own examples, 10% by default.
---

<!-- Site-written: the Answer short tasks faster guide. Its facts are decisio's docs/tasks.md ("A fast table in front of decisio") at the pinned release, and the bench's own description in src/decisio/bench/table_latency.py (src/config/sourced.mjs checks them). -->

::covers{links="docs/tasks.md#a-fast-table-in-front-of-decisio-opt-in docs/tasks.md#a-fast-table-that-learns-from-traffic=5-learn-from-your-traffic-with-no-labels"}

decisio's fast table (`fast_table`) is a small learned classifier on the server's CPU that answers the requests it is sure of before the model is asked.
It turns the text into an embedding, the table's student, and a linear layer fitted on your own examples picks the option.
With no labelled examples, it learns from decisio's own answers to the task's traffic.

The default student is a static embedding: on an Apple M5 Pro it takes 0.05 ms for a short text and 1.0 ms for a long one of about 1,400 tokens.
At that cost a request the classifier hands on to the model costs about what it would without a table.

On CLINC150's assistant commands, the classifier with the encoder student answered 92.3% of requests, 3.1% of them wrong, and the mean time per request on the 31B fell from 384 ms to 71 ms.
It is off unless a registration asks for it:

::site-block{name="fast-table-register"}

The registration tries it on your own examples and keeps it only where it saves at least the task's bar, 10% of the time per request by default, and its answers certify.

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
- **It checks itself:** the registration times the classifier and the model on your own held-out examples, and keeps the classifier only if it saves at least the task's `min_saving`, 10% of the time per request by default.

## 2. Choose a student

`"fast_table": true` asks for the default student.
An object chooses one by its `kind`, for example `{"kind": "encoder"}`, and `{"kind": "static", "static_model": "multilingual"}` picks the multilingual static student.

| `kind` | Student | Table path, short text, then long text | Use it for |
| --- | --- | ---: | --- |
| `static`, the default | potion-base-8M, a static embedding computed by decisio itself | 0.05 ms, 1.0 ms | most tasks: it costs so little that a table of it never makes a request slower |
| `static`, with the multilingual model | potion-multilingual-128M | 0.05 ms, 1.9 ms | traffic that is not English |
| `encoder` | bge-base-en-v1.5, through ONNX Runtime | 6.3 ms, 85 ms | many-class English tasks where its larger share pays for its time on your host |
| `auto` | fits a static student and the encoder, and keeps the one that saves more on this host | both | when you do not know |

::source[The table path, the student and the classifier, p50 for one request on an Apple M5 Pro: a short text of a median 22 tokens and a long text of a median 1,416 tokens, as decisio's docs/tasks.md states them.]

- **On an x86 server CPU the static students cost about the same:** 0.04 to 0.06 ms for a short text and 1 to 4 ms at 1,400 tokens. bge-base at one thread costs about 25 ms for a short text and up to about 450 ms for a long one.
- **The static students read the whole text.** The encoder reads at most 512 tokens: the first 256 and the last 254 of a longer text.
- **`auto` keeps the student with the larger saving,** when that saving is at least the task's bar and its threshold holds. When the two savings are within 1 point it keeps the static one, and when neither qualifies there is no table. `static_model` picks the static student it tries.
- **`{"kind": "hashed"}` is reserved** and refused in this version.
- **All three students are MIT licensed,** and each one's files are pinned to a revision and checked against pinned sha256 hashes.

## 3. Ask for it

- **Install the `decisio[table]` extra** on every replica that will serve the task; the release image does not carry it, and the [fast-table image](/docs/deploy/docker/#5-run-fast-tables-with-no-hub-access) does. Without it the registration is refused with 422.
- **The first use fetches the student** from the Hugging Face Hub at its pinned revision: 31 MB for the static base, 531 MB for the multilingual one and 436 MB for the encoder. A server with no route to the Hub needs them fetched first; its registration is refused, naming the command.
- **Add `fast_table` and a `certify` block,** with choice or yes/no questions and at least 100 fit examples.
- **Set your own bar with `"fast_table": {"min_saving": x}`,** from 0.01 to 0.90; the default is 0.10. A table registered before decisio 0.46.0 keeps the 25% it was kept under, at run time and when certified again; register it again to take the new default.
- **A yes/no table reports its own P(yes),** calibrated by one temperature fitted on the fit examples, never on the certification examples, so the table's certificate holds as proved. The temperature changes neither the answer nor the order of its confidences.
- **Hold out about 600 examples or more,** at the defaults, since the certificate holds each side to half the risk.

**Servers without internet access.**
Run the [fast-table image](/docs/deploy/docker/#5-run-fast-tables-with-no-hub-access), `<version>-table`, which has both static students built in, so a static table needs no Hub access.
For the encoder, or a server not run from that image, fetch the students when you build the image or deploy, into the Hugging Face cache the server reads, at the revisions decisio pins:

```bash
# static, base (31 MB)
hf download minishlab/potion-base-8M model.safetensors tokenizer.json \
  --revision bf8b056651a2c21b8d2565580b8569da283cab23
# static, multilingual (531 MB)
hf download minishlab/potion-multilingual-128M model.safetensors tokenizer.json \
  --revision 73908c3438cf03b6a01bcb9611d62b23d0726f08
# encoder (436 MB)
hf download BAAI/bge-base-en-v1.5 onnx/model.onnx tokenizer.json \
  --revision a5beb1e3e68b9ab74eb54cfd186867f64f240e1a
```

Fetch only the students your tasks use, and install the `decisio[table]` extra in the same image.
The fast-table image can also be built with the encoder in it, with `WITH_ENCODER=1`.

## 4. Read what it kept

- **`fast_table_report` in the response** has `kept`, the `reason` when it is false, the `guard` with both mean times, the classifier's share and the saving, and the thresholds.
- **`fast_table_report.kinds` lists every student tried,** with its table share, its error at the threshold and the upper bound, its expected saving and its mean table time, which one was kept and why.
- **`answered_by` on every answer** is `table` or `decisio`, with the usual `certified` fields.
- **`fast_table.features` in the task's record names the student exactly:** its kind, model, revision, the files' sha256 and how it reads a long text. The table is served only with that function.
- **A classifier that is not kept** leaves a task served and certified as it would be without one.

## 5. Learn from your traffic, with no labels

A task with no labelled examples can still get a fast table: decisio's own answers to the task's requests are its training data.
Register the question with `"learn": true` in its `fast_table`:

::site-block{name="fast-table-learn"}

- **Decisio answers every request until a table certifies,** exactly as with no table.
- **Each request decisio reads is logged as one row:** the student's features, decisio's answer and its confidence. No request text is kept.
- **With `--tasks-dir`, the rows are files under `<tasks-dir>/learn/`** and survive a restart. With `--task-store` they are in the shared store; with neither, they are kept in memory and lost at restart. At most `max_rows`, 200,000 by default, are kept per task.
- **A background refit runs every 2,000 new rows or every hour,** once the task has 100 rows, one task at a time, at low priority.
- **A new version goes live only if its certificate holds** and it saves at least the task's bar, more than the live version. A refit that fails leaves the live version live.
- **The last 5 versions are kept,** and `POST /v1/tasks/{id}/fast_table/rollback` with `{"version": n}` serves one of them again.

What the certificate promises:

- **It is an agreement certificate:** at most `alpha`, 0.05 by default, of the table's answers differ from decisio's, with probability 1 - `delta`, 0.1 by default.
- **It is made on held-out rows drawn like the traffic,** the requests read before any table was live and the explored ones below, never on the hard requests the table passed on.
- **It bounds how often the table departs from decisio, not how often it is wrong.** The table learns decisio's answers, mistakes included, so a learned table is as right as decisio is, at best.
- **Every certified answer says which kind it has:** `certificate_kind` is `agreement` for a learned table and `gold` for one certified on labelled examples.
- **A labelled task can learn too:** `"learn": true` with `examples` adds them to every refit at twice a traffic row's weight, and its certificate stays gold while it has enough held-out examples.

What exploration costs:

- **A share `explore` of the requests the live table reads goes to decisio anyway,** 0.02 by default, so later certificates keep rows drawn like the traffic.
- **At the default, with a table answering 80% of requests, 1.6% of requests go back to the model,** at decisio's latency. `status.fast_table.explore.cost` gives the share for the live version.
- **Every 50th table answer is also a spot check,** 2% of them, and a spot-checked request waits for decisio's read too.
- **`"explore": 0` turns exploration off;** later certificates then rest on the rows logged before the first table.

How it handles drift:

- **Two guards suspend a live table** to decisio-only answers. One watches the share of the last 200 requests under the table's threshold, and fires when it rises more than 15 points above its share at certification. The other is a CUSUM on how often the table and decisio disagree, fed by the spot checks and the explored requests.
- **Logging and refits go on while it is suspended,** and the next version that certifies goes live.

## 6. Learn across replicas

On a shared store (`--task-store`), the replicas learn one table together, and a restart loses nothing.

- **Every replica logs its rows to the store,** from the store's poll thread, so a request never waits on the store.
- **One replica trains,** the holder of a lease in the store; when it stops, another takes the lease. The certificate names the replicas and how many rows each gave.
- **Each replica times a new version on its own requests** before its table answers there. Until then its status is `timing`, and decisio answers.
- **One replica's drift alarm suspends the table on every replica,** and a rollback on any replica reaches all of them.
- **A restarted replica, or a whole restarted fleet, serves the promoted versions** after its own timing; nothing is learned again.
- **Run one serving stack across the fleet** if every replica's rows should count: the trainer learns only from rows logged on its own stack.
- **Keep the replicas' clocks synchronised,** with NTP: each replica judges the lease's expiry on its own clock.
- **While the store is out of reach, serving goes on.** Rows wait in memory up to 256 MB per server and are then dropped and counted in `/health`, and no version is promoted.
- **A `--task-store-readonly` replica serves the versions and writes nothing:** it logs no rows and never trains, and its traffic is not in the certificate.

`GET /v1/tasks/{id}` reports the learning under `status.fast_table`: its state, rows, versions, coverage and saving, certificate, exploration, both guards and the last refit, and on a shared store this replica's part and the fleet's.

## 7. Measure it on your own host

The registration times the table path one request at a time.
To see what the table saves your callers under load, time a certified task end to end through your running server:

::site-block{name="fast-table-bench"}

- **The examples file** holds one `{"request": {...}, "answer": ...}` per line, as `POST /v1/tasks` takes them. The probe file holds requests of the same kind, not among the examples.
- **It registers the task twice,** with `"fast_table": true` (arm `table`), then without it (arm `model`), each timed on its own held-out requests and deleted.
- **Each line of its output is a cell:** an arm at a short or a padded long text, and at 1 or 16 requests in flight. It gives the wall time's p50 and p95, the server's time, the `task` stage, the share the table answered and the errors.
- **Compare the `table` arm's wall time with the `model` arm's in the same cell:** that difference is what the table saves your callers, under your load.
- **`--kinds static,encoder,auto` times a table arm for each student** instead, each registered on the same examples, and each cell names its kind; `static:multilingual` names the multilingual model.

## 8. When to use something else

The timing check drops the classifier where it does not pay, so asking for it on the wrong task costs the registration, not the traffic.
Across the ten sets tried with the encoder, it passed the 25% check on 4; without the three assistant-command sets, on 1 of 7.

- **Long or hard tasks:** a table usually certifies nothing there. The registration then keeps no table, and the task is served exactly as without one.
- **Long texts with the encoder:** with the torch encoder the table path took 21 to 30 ms for a short text and 134 to 183 ms for 600 to 1,150 tokens. CFPB complaints went from 154 ms to 315 ms, and arXiv abstracts from 184 ms to 370 ms: dropped. A static student reads 1,400 tokens in 1.0 to 1.9 ms on an Apple M5 Pro, so its own time does not make a long text slower.
- **Noisy labels:** on Civil comments the encoder's classifier answered 69.8%, 3.7% of them wrong, but 65 ms became 74 ms: dropped.
- **Nothing certified:** SciCite, and the two sets whose options change per request, were dropped.
- **A plain read with the encoder:** on short texts the classifier needs to answer roughly 60 to 75% of requests to clear 25%. MASSIVE passes only because its read goes through the intent head; timed as a plain read it saves 21% on the 31B.
- **What it does not cover:** a score question, an image request, an adapter, and a task whose options change per request. It serves choice and yes/no questions on the text route, one order per request.
- **An option none of your examples carried:** the classifier cannot answer with it, so those requests go to decisio.
- **The saving is a mean over requests:** a request the classifier defers takes the classifier's time and then decisio's.
- **A learned table copies decisio:** it learns decisio's answers, mistakes included, and its certificate bounds agreement, not accuracy. Where you have labels, a labelled table's certificate is gold.
- **Another serving stack does not serve a learned version** certified elsewhere: decisio's answers there are another teacher's.
- **Early traffic weighs more in a learned certificate** until `max_rows` drops it: before the first table every request is a held-out candidate, and afterwards only the explored share is.
- **Your hosts decide your own figures,** which is why the registration measures them.

## 9. Operating notes

Each replica decides for itself, and `status.fast_table` on `GET /v1/tasks/{id}` says what it is doing:

- **`active`:** the classifier answers the requests it is sure of.
- **`timing`:** decisio answers everything, on another stack than the classifier was timed on, or because the classifier stopped paying under this replica's load. Every tenth request also times the classifier, and after 30 pairs that show the saving it is taken up again.
- **`suspended`:** the monitor's alarm fired here or on a replica sharing the task store.
- **`unavailable`:** this server cannot compute the student exactly as the record names it, so register the task again, or the `table` extra is not installed.

A table registered on an earlier release keeps its encoder and is served as before; register the task again to choose a student.
Upgrade every replica that shares a task store: one on an earlier release serves a new table through decisio and says to register the task again.
It never serves a learned version or logs rows for one either, and its traffic counts once it is upgraded.

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
