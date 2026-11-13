---
title: Give recurring decisions a fast path
template: splash
tableOfContents: false
description: Let a small CPU classifier answer eligible requests before the model. Keep shared instructions in task context and send only the facts that change.
---

<!-- Site-written from the pinned task/context guides. The API spelling remains fast_table. -->

::covers{links="docs/tasks.md#a-fast-table-in-front-of-decisio-opt-in=2-register-the-task docs/tasks.md#a-fast-table-that-learns-from-traffic=5-start-without-human-labels"}

A **decision fast path** learns a recurring choice or yes/no task, then answers the requests it can certify on the server’s CPU.
The decisio model handles requests the classifier passes on.
The API calls this feature `fast_table`.

::figure{name="table-fallback"}

## Watch the walkthrough

One support ticket, a faster answer, and the model still available when needed.
Then see the same pattern handle a support inbox, a moderation queue and refund checks.

::figure{name="table-film"}

## Same pattern. Different decisions.

Your application still receives a typed answer.
The fast path changes which requests need a model read.

::figure{name="table-jobs"}

## Teach it. Check it. Let it answer.

Start with human-labelled examples or let model-answered traffic supply them.
A candidate learns the recurring decision, checks separate examples and becomes active only when it qualifies.

::figure{name="table-learning"}

<span class="fp-anchor" id="1-see-where-it-works-great"></span>
<span class="fp-anchor" id="1-separate-shared-rules-from-changing-facts"></span>

## Shared rules stay put. New facts keep flowing.

The task can use a long policy, rubric or catalogue.
Register that fixed material once as `context`, and send only the changing facts in each request's `state`.
The fast path encodes the state alone; the model reads the context together with the state.

::figure{name="table-context"}


Move genuinely shared material into context, and keep every changing fact the decision needs in state.
Changing the context changes the task and requires teaching and certification again.

## See what changes your time budget

The default static path uses token-vector lookups and a classifier.
Static embedding + classifier work costs about 0.05 ms for short texts; the model is skipped on the requests that qualify.
Use the calculator to explore an assumed fast-path share against a roughly 50 ms model budget.

::figure{name="table-budget"}

## Add it to your app

The file-based example below uses refund eligibility.
Replace the policy, examples and facts with your own task.

<span class="fp-anchor" id="3-ask-for-it"></span>

<span class="fp-anchor" id="2-register-the-task"></span>

### Register the task

On the serving host, install the `decisio[table]` extra or use the [table container](/docs/deploy/docker/#5-run-fast-tables-with-no-hub-access).
Without the extra, registration returns 422.

The default `static` backend uses token-vector lookups and a classifier, with no neural network running on the CPU.
For short texts, the published embedding-plus-classifier cost is about 0.05 ms (50 µs); longer changing inputs cost more.

Prepare these files beside the script:

| File | Contents |
| --- | --- |
| `task.json` | A complete labelled registration: your task id, examples and certification settings, as [Teach a task](/docs/tasks/#3-register) shows |
| `context.txt` | The shared policy, unchanged across this task's requests |

For the refund example, each labelled request asks the same refund-eligibility question and contains only the changing order facts.
Use at least 100 fitting examples and about 600 or more held-out examples at the default targets.
With the default half held out, prepare about 1,200 representative labels to start; the certificate can still find no usable threshold.

Run this with `DECISIO_BASE_URL` set to your running server:

::site-block{name="fast-path-register"}

The script preserves your examples, labels and certificate settings.
It adds the shared context and enables the default fast path; an existing `fast_table` settings object is preserved.
Each example is read with the same context the task will use when serving.

<span class="fp-anchor" id="4-read-what-it-kept"></span>

<span class="fp-anchor" id="3-check-whether-a-fast-path-qualified"></span>

### Check whether a fast path qualified

Registration fits a candidate, checks its certificate and times the classifier and model on your host.
It keeps the classifier only if it clears `min_saving`, 10% by default.
If none qualifies, the task continues through decisio.

| Response field | What it tells you |
| --- | --- |
| `fast_table_report.kept` | Whether a classifier was kept |
| `fast_table_report.reason` | Why one was declined |
| `fast_table_report.guard` | Measured mean times, classifier share and saving |
| `fast_table_report.kinds` | Which students were tried and selected |

The saving includes the classifier's cost on every request and the model's cost on the requests passed on.
A retained table is a result for this task and host, not a promised speedup for other traffic.

<span class="fp-anchor" id="4-send-new-facts-then-read-the-answer"></span>

### Send new facts, then read the answer

Save the new order's facts as `state.json`.
For example, this is a complete illustrative input, not a training set:

```json
{
  "days_since_delivery": 12,
  "opened": false,
  "category": "home"
}
```

Use the same `task.json` and run:

::site-block{name="fast-path-ask"}

The call selects your task by id and reuses its exact question and any explicit layout setting.
The policy is already registered; the request sends only the new state.
A policy repeated at the start of the state is read twice and triggers `x-decisio-warning`.

| Answer field | How to use it |
| --- | --- |
| `answered_by` | `table` means the classifier answered; `decisio` means the model answered |
| `certified` | Whether this answer reaches its applicable certificate's threshold |
| `certificate_kind` | `gold` concerns human-labelled correctness; `agreement` concerns matching decisio |

For an action that requires correctness certification, check both `certified: true` and `certificate_kind: "gold"`.
A model fallback can still be uncertified; your backend chooses whether to use it as a suggestion or request human review.
The [support-routing recipe](/docs/use-cases/support-routing/) shows that application check.

<span class="fp-anchor" id="5-learn-from-your-traffic-with-no-labels"></span>

<span class="fp-anchor" id="5-start-without-human-labels"></span>

### Start without human labels

You can also let model-answered traffic supply the learning data.
Until a candidate qualifies, decisio answers every request.
A candidate becomes active only after certification and the host saving check pass.


For this route, replace `task.json` with a complete question registration such as this:

```json
{
  "id": "refund-policy-learn",
  "question": {
    "type": "noul",
    "instructions": "Is this return eligible for a refund under the policy?"
  },
  "fast_table": {"learn": true},
  "certify": {"alpha": 0.05}
}
```

Use your real refund policy in `context.txt`, then run the same registration and request scripts above.
For a question registration, the request script names its answer `decision`; labelled registrations retain the question keys from their examples.
No human labels are invented or added to the learning registration.

A learned table can copy the model's mistakes.
Its agreement certificate concerns matching the model, not correctness against human labels.
A labelled task can also learn; its certificate stays gold while it has enough held-out human labels.

The explore share sends some table-eligible requests to the model, 0.02 by default.
Spot checks also send some table answers to the model, so allow for those model reads when sizing the service.
Refits continue as traffic arrives; a failed candidate leaves the current serving path available.

## Run it reliably

<span class="fp-anchor" id="6-keep-the-changing-input-focused-and-sufficient"></span>

### Keep the changing input focused and sufficient

- Put only genuinely shared rules, definitions or catalogue text in `context`.
- Keep delivery age, item condition, new messages and other changing facts in `state`.
- Use a compact, consistent representation and leave out duplicated policy text or unrelated logs.
- If you select an excerpt or summary, preserve every fact needed for the question and evaluate that representation on held-out requests.

A different document on every request is changing input; do not hide it in a supposedly fixed context.
Shortening an input is not a substitute for checking the task's answers.
Changing the context changes the task and requires teaching and certification again.

<span class="fp-anchor" id="2-choose-a-student"></span>

<span class="fp-anchor" id="7-choose-another-student-when-needed"></span>

### Choose another student when needed

The student turns the changing state into features for the classifier.
Use `fast_table: true` for the default, or an object with a `kind`.

| Setting | Student | Use it when |
| --- | --- | --- |
| `static`, the default | potion-base-8M | Starting with a low-cost classifier |
| `static` with `static_model: multilingual` | potion-multilingual-128M | Your traffic uses several languages |
| `encoder` | bge-base-en-v1.5 | Its additional CPU cost pays on your task and host |
| `auto` | Tries static and encoder | You want registration to select the larger measured saving |

Static students read the whole text.
The encoder reads at most 512 tokens, from the start and end of a longer text.
This is a student-specific input rule, not a universal recommended state length.

The first use downloads the chosen student.
Use the [table image](/docs/deploy/docker/#5-run-fast-tables-with-no-hub-access) when the host cannot reach the Hub, or fetch the student files before registration.

<span class="fp-anchor" id="7-measure-it-on-your-own-host"></span>

<span class="fp-anchor" id="8-measure-the-paths-on-your-host"></span>

### Measure the paths on your host

Registration measures one request at a time.
Measure caller-visible latency under your expected load too, including requests passed on to the model:

::site-block{name="fast-table-bench"}

The examples file contains one complete `request` and human `answer` per line; probes contain requests outside that set.
The command registers temporary table and model tasks, compares them under load, then deletes them.
Compare the same text-length and concurrency cells, using wall-clock p50 and p95 as well as mean saving.

<span class="fp-anchor" id="9-operating-notes"></span>

<span class="fp-anchor" id="9-keep-it-running"></span>

### Keep it running

Inspect `GET /v1/tasks/{id}` and `status.fast_table` for this replica's live state:

| State | What answers | What to check |
| --- | --- | --- |
| `learning` | Decisio while learning data is collected | Whether a candidate has qualified yet |
| `active` | Classifier where eligible, otherwise decisio | Latency, certified share and drift |
| `timing` | Decisio while this replica checks the saving | CPU headroom and timing results |
| `suspended` | Decisio | The alert and whether certification needs updating |
| `unavailable` | Decisio | Installed extra, student files and registration |
| `off` on a learning task | Decisio | Whether this replica matches the learned version's serving setup and features |

With `--tasks-dir` or `--task-store`, learning rows survive restarts; without either they stay in memory.
The rows keep features and model answers, not request text.

To roll back, send a retained version number to `POST /v1/tasks/{id}/fast_table/rollback`.
The last five versions are kept.

<span class="fp-anchor" id="6-learn-across-replicas"></span>

### Share learning across replicas

Use one shared `--task-store` and one serving setup across the fleet.
One replica trains; each replica times a promoted table locally before serving it.
Drift suspension and rollbacks reach the other replicas through the store.

Keep clocks synchronized and monitor store reachability.
During an outage, replicas keep serving, pending rows have a memory limit, and no new version is promoted.
A read-only replica serves tables without logging rows or training.

<span class="fp-anchor" id="8-when-to-use-something-else"></span>

## Good to know

- This fast path supports choice and yes/no questions on the text route; scores, images, adapters and changing-option tasks do not use it.
- Long or difficult changing inputs can certify too little to save time, even with a well-organized context.
- An option absent from the fitting examples is passed to decisio.
- A deferred request pays both the CPU classifier cost and the model cost; test that path too.
- Set `fast_table.min_saving` from 0.01 to 0.90 if your deployment needs a different required mean saving.
- Install the extra and provide CPU headroom on every replica, and certify again after changing the context or serving setup.

## Video transcript

::figure{name="table-transcript"}

## What next

- [Teach a task](/docs/tasks/): prepare complete labelled examples.
- [Send a fixed text once](/docs/tasks/context/): register context and understand prefix-cache behavior.
- [Certify answers](/docs/tasks/certify/): choose the error target and read certificate fields.
