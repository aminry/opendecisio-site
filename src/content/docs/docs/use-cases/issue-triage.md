---
title: Issue triage
description: Label each new issue with its kind and owning team as it arrives, and leave only the ones decisio is unsure about for a maintainer.
---

<!-- Site-written: a use-case recipe. The question, the routing script and the registration are src/lib/use-cases.mjs; the measured result is the issue-triage run in launch_facts.public.json (teaching.issue_triage), read by the same module, with its reporting sentence and licence line as the facts give them. -->

It sorts issues well untaught: the script asks for the issue's kind and applies the label only when the answer is certified:

::figure{name="recipe-issue-triage"}

## TL;DR

Save the [complete caller](/examples/recipes/issue-triage.py) as `issue-triage.py` and run it with Python 3.12 or later.
Set `DECISIO_BASE_URL` to your server, or leave the local default.
Until you register and certify this question, the caller sends answers to review.

::site-block{name="route-issue-triage"}

## Is it a good fit?

:::fit
- The kind of an issue, and the team that owns it: both work untaught.

* Priority: the measured run below is right about half the time, taught or not.
* Whether an issue needs more information from its reporter: teaching lowers it slightly.
:::

<span class="fp-anchor" id="1-write-the-questions"></span>
## 1. Write the question

One `choice` question per label family: one for the kind, one for the owning team.
Ask them in the same request, so the issue is read once ([Scale](/docs/scale/)).

<span class="fp-anchor" id="2-certify-them"></span>
## 2. Teach it and certify it

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

## What it did

::proof{name="issue-triage"}

<span class="fp-anchor" id="handle-unavailable-and-uncertain-answers"></span>
<span class="fp-anchor" id="good-to-know"></span>
## Limits

- An HTTP error, timeout or invalid response goes to the review path, like an uncertified answer ([Handle review and service failures](/docs/use-cases/#handle-review-and-service-failures)).
- Keep the question and options stable after registration, and certify again after changing the task or serving setup ([Keep a certificate valid](/docs/production/#keep-a-certificate-valid)).

## What next

- [Support routing](/docs/use-cases/support-routing/): the same recipe on a support inbox.
- [Certify answers](/docs/tasks/certify/): the promise, and how to choose the error target.
- [Use cases](/docs/use-cases/): the other recipes.
