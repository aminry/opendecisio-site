---
title: Issue triage
description: Label each new issue by its kind and its owning team, out of the box, apply the labels decisio can stand behind, and leave the rest for a maintainer.
---

<!-- Site-written: a use-case recipe. The question, the routing script and the registration are src/lib/use-cases.mjs; the measured result, and the numbers in the box, are the issue-triage run in launch_facts.public.json (teaching.issue_triage), read by the same module, with its reporting sentence and licence line as the facts give them. -->

Label every new issue as it arrives, and apply the labels decisio is sure of without waiting for a maintainer.
It sorts issues well untaught; this script asks for the issue's kind and applies the label only when the answer is certified:

::site-block{name="route-issue-triage"}

Until the task is certified (step 2), every answer goes to a person, as on the stand-in.

:::fit
- The kind of an issue: :value{name="triage-kind"} right untaught on real Kubernetes issues.
- The team that owns it: :value{name="triage-sig"} right untaught on the owning SIG.

* Priority: :value{name="triage-priority"} right, taught or not.
* Whether an issue needs more information from its reporter: a balanced accuracy of :value{name="triage-needs-info"}, and teaching lowers it slightly.
:::

## 1. Write the questions

One `choice` question per label family: one for the kind, one for the owning team.
Ask them in the same request, so the issue is read once ([Scale](/docs/scale/)).

## 2. Certify them

They work untaught, so there is little to teach; certify each question on labelled issues, so that each label says whether it can be applied on its own.

:value{name="floor-issue-triage"}

::site-block{name="teach-issue-triage"}

[Certify answers](/docs/tasks/certify/#2-teach-the-task-with-a-certificate) runs this call on a server, with its answer.

## 3. Route on the certificate

- A certified answer applies its label.
- Everything else waits for a maintainer, with decisio's suggestion beside it.
- If the issues change, a new component or a new kind of report, certification is suspended until you certify again ([Watch for drift](/docs/tasks/drift/)).

## What it did

::proof{name="issue-triage"}

## What next

- [Support routing](/docs/use-cases/support-routing/): the same recipe on a support inbox.
- [Certify answers](/docs/tasks/certify/): the promise, and how to choose the error target.
- [Use cases](/docs/use-cases/): the other recipes.
