---
title: Issue triage
description: Label each new issue by its kind and its owning team, out of the box, apply the labels decisio can stand behind, and leave the rest for a maintainer.
---

<!-- Site-written: a use-case recipe. The question, the routing script and the registration are src/lib/use-cases.mjs; the measured result, and the numbers in the box, are the issue-triage run in launch_facts.public.json (teaching.issue_triage), read by the same module, with its reporting sentence and licence line as the facts give them. -->

It sorts issues well untaught; this script asks for the issue's kind and applies the label only when the answer is certified:

::figure{name="recipe-issue-triage"}

Save the [complete caller](/examples/recipes/issue-triage.py) as `issue-triage.py` and run it with Python 3.12 or later.
Set `DECISIO_BASE_URL` to your server, or leave the local default.
Until you register and certify this question, the caller sends answers to review.

::site-block{name="route-issue-triage"}



:::fit
- The kind of an issue: :value{name="triage-kind"} right untaught on real Kubernetes issues.
- The team that owns it: :value{name="triage-sig"} right untaught on the owning SIG.

* Priority: :value{name="triage-priority"} right, taught or not.
* Whether an issue needs more information from its reporter: a balanced accuracy of :value{name="triage-needs-info"}, and teaching lowers it slightly.
:::

::source{value="triage-run-note"}

## 1. Write the questions

One `choice` question per label family: one for the kind, one for the owning team.
Ask them in the same request, so the issue is read once ([Scale](/docs/scale/)).

## 2. Certify them

They work untaught, so there is little to teach; certify each question on labelled issues, so that each label says whether it can be applied on its own.

:value{name="floor-issue-triage"}

Prepare `issue-triage-labels.jsonl` with one JSON object per line, containing `state` and `answer`.
Use real inputs and labels chosen by a person; each answer is one of the question’s option keys.
The code below builds complete requests using the same question as the caller.

::site-block{name="teach-issue-triage"}

Save the [registration script](/examples/recipes/issue-triage-register.py) beside the labels file and run it with Python.
Registration replaces a task of the same id.
Check the returned certificate: a `null` threshold means no answer can be certified.

[Certify answers](/docs/tasks/certify/#2-teach-the-task-with-a-certificate) runs this call on a server, with its answer.

## 3. Route on the certificate

The caller acts only when `certified` is `true` and `certificate_kind` is `gold`, with a certificate id.
A learned table's `agreement` certificate measures agreement with the model, so it goes to review in this recipe.


- A certified answer applies its label.
- Everything else waits for a maintainer, with decisio's suggestion beside it.
- If the issues change, a new component or a new kind of report, certification is suspended until you certify again ([Watch for drift](/docs/tasks/drift/)).

## Handle unavailable and uncertain answers

An HTTP error, timeout, invalid response or uncertified answer goes to the review path.
The caller uses a 15-second network timeout; set it to fit your application, and log failures where you call `route`.
It returns an action for your backend to perform.

## What it did

::proof{name="issue-triage"}

## Good to know

Keep the question and options stable after registration.
Certify again after changing the task or serving setup, and check new traffic with labelled examples.
The caller prints an action; connect that action to your own queue, workflow or review interface.

## What next

- [Support routing](/docs/use-cases/support-routing/): the same recipe on a support inbox.
- [Certify answers](/docs/tasks/certify/): the promise, and how to choose the error target.
- [Use cases](/docs/use-cases/): the other recipes.
