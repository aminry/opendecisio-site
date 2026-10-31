---
title: Teach a task
description: Teach decisio a question you ask again and again, from your own labelled examples. The model does not change; the server learns what your labels mean.
---

<!-- Site-written: the first of the three Teach and trust guides, rewritten from decisio's docs/tasks.md at the pinned release, whose commands it shows (::upstream); what teaching did is EVAL_CARD.md section 7.2's, through src/lib/teach.mjs; the other facts are docs/tasks.md's (src/config/sourced.mjs checks them). -->

::covers{links="docs/tasks.md README.md#teach-it-your-question docs/tasks.md#what-a-task-is=1-check-that-it-is-a-task docs/tasks.md#why-register-one=what-it-does docs/tasks.md#what-you-need=2-gather-your-examples docs/tasks.md#walk-through=3-register docs/tasks.md#3-read-the-response=4-read-what-it-kept docs/tasks.md#5-list-export-reload-delete=6-keep-it-across-restarts docs/tasks.md#saved-to-disk---tasks-dir=6-keep-it-across-restarts docs/tasks.md#what-you-get=what-it-does docs/tasks.md#when-it-helps-and-when-it-does-not=what-it-does docs/tasks.md#what-it-costs=what-it-costs"}

Register the question once, with labelled examples, and every later request that asks it is answered with what the server learned.
With the example task from decisio's repository, one request teaches it:

::upstream{file="README.md" section="Teach it your question" block="1"}

::figure{name="teach-flow-teach"}

## 1. Check that it is a task

- A task is one question you ask again and again, with the same options in the same order every time: "Which support queue should handle this ticket?" over the same twelve queues.
- A question whose options change every time is a [dynamic task](/docs/tasks/dynamic/), when its instructions stay the same: which brand a product title names, each title with its own candidates.

## 2. Gather your examples

| You need | For |
| --- | --- |
| At least 10 labelled examples | a correction per option that removes a steady lean toward some options |
| A question with 10 or more options, and at least 2 examples of each; we recommend 10, which the measured gains used | the intent head, which learns what your labels mean in your data |
| Examples from your own traffic | the same kind of text, and the same mix of options, as the server will see |
| More examples, if you will certify | half of them are held back to set the threshold ([Certify answers](/docs/tasks/certify/)) |

Each example is one real input with the option you would want chosen, asked with the exact question and options you will use later.

## 3. Register

A task is one `POST /v1/tasks`: an `id`, and the examples, each an ordinary request with one question plus the answer you want.

::upstream{file="docs/tasks.md" section="1. Build the examples file" block="1"}

With a server running ([Get started](/docs/) starts one) and from the root of the clone, register the example's 120 tickets, from a CSV:

::upstream{file="docs/tasks.md" section="2. Register" block="1"}

Registering the same `id` again replaces the task.

## 4. Read what it kept

The answer has one record for each correction, `calibration` and `head`:

| Field | What it says |
| --- | --- |
| `applied` | `true` when later questions with this option list are answered with the correction |
| `reason` | why, in words: "cross-validated gain" when it was kept, because it helped on examples it was not fitted on, or what was missing |

The server keeps a correction only when it helps on your own examples, checked by scoring each fifth of them with a fit made on the other four.
When it declines one, the question is answered exactly as before:
- **Too few examples:** add more, up to 20 for the correction or 10 per option for the head, and register again. When the head is declined for this, `short_options` names the options that have too few, each with its count.
- **The plain answer is already as good:** common for a clear yes/no question.
- **Labels that disagree:** two people labelling the same kind of input differently look like noise, and the server declines.

## 5. Ask, and check that it applied

Ask the question exactly as registered:

::upstream{file="docs/tasks.md" section="4. Ask a question and see the task applied" block="1"}

The response header `x-decisio-tasks: ticket-routing` says the task answered it.
No header means the question matched no task: check that its question and options are exactly the ones you registered.

## 6. Keep it across restarts

Start the server with `--tasks-dir` and every task you teach is saved to disk before the server answers, and loaded again at the next start:

::upstream{file="docs/tasks.md" section="Saved to disk (--tasks-dir)" block="1"}

- Put the directory on a volume that outlives the server, and add `--require-tasks N`: a server that finds fewer than N usable tasks refuses to start, so a volume that failed to mount does not turn into untaught answers.
- A save that fails fails the request with 500, and the task is not registered.
- One directory belongs to one server. For several replicas, see [Operate](/docs/operating/#4-keep-tasks-across-restarts-and-replicas).

`/health` says where the server saves its tasks, and how many it loaded and applies:

::site-block{name="tasks-health"}

To move a task to another machine, export it and import it there, or start the server with `--tasks-file tasks.json`:

::upstream{file="docs/tasks.md" section="5. List, export, reload, delete" block="1"}

- A task applies only under the model and the [prompt layout](/docs/layout/) it was taught on; on another, the server does not apply it and says why.
- A Gemma server that loads tasks taught under the plain layout keeps serving plain and says so, so the tasks keep applying.
- Renaming, adding or reordering an option makes a new task: teach it again.
- To reproduce a task exactly, export and import it rather than registering it again.

## What it does

On the default model, Gemma 4 31B, teaching with 10 examples per intent:

::teach-gains

These compare the taught server with the untaught one on the same messages, which none of the examples were.

- **Good fit:** a long list of fine-grained options, where a model reading only the option names is weakest; a question your team already labels.
- **Not a good fit:** a clear yes/no question the model already answers well. The server declines the correction and says so, and the answers stay as they were.

## What it costs

- **Teaching:** every example is scored once, plus the fit, as in the times above.
- **Each later question:** a correction costs nothing extra. A question the intent head answers takes extra work on the server: :value{name="head-cost"}

::source{name="triage-demo"}

## What next

- [Certify answers](/docs/tasks/certify/): get answers the server stands behind, at the error rate you choose.
- [Watch for drift](/docs/tasks/drift/): know when traffic moves away from your examples.
- [Answer short tasks faster](/docs/tasks/fast-table/): an opt-in classifier on the host CPU in front of the model, for short command traffic.
- [The HTTP API](/docs/api/): the task routes, field by field.
