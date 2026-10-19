---
title: Issue triage
description: Label each new issue by kind, apply the labels decisio can stand behind, and leave only the unsure ones for a maintainer.
---

<!-- Site-written: a use-case recipe. The question, the routing script and the registration are src/lib/use-cases.mjs. It is labelled a recipe: no run of it on public issues is published yet. -->

Label every new issue as it arrives, and apply the labels decisio is sure of without waiting for a maintainer.
This script asks for the issue's kind and applies the label only when the answer is certified:

::site-block{name="route-issue-triage"}

:::fit
- Labels with a clear meaning, such as the kind of an issue or the area it touches.
- Past issues with the labels your maintainers gave them.

* Judgements that need context the issue does not carry, such as its priority against the rest of the backlog.
* Labels your maintainers apply inconsistently: the server declines to learn from labels that disagree.
:::

## 1. Write the question

One `choice` question per label family: one for the kind, another for the area.
Ask them in the same request, so the issue is read once ([Scale](/docs/scale/)).

## 2. Teach it and certify it

Teach each question from past issues and certify it at your error target:

::site-block{name="teach-issue-triage"}

[Teach a task](/docs/tasks/) and [Certify answers](/docs/tasks/certify/) have the steps and the fields.

## 3. Route on the certificate

- A certified answer applies its label.
- Everything else waits for a maintainer, with decisio's suggestion beside it.
- If the issues change, a new component, a new kind of report, certification is suspended until you certify again ([Watch for drift](/docs/tasks/drift/)).

## What it did

::proof{name="issue-triage"}

## What next

- [Support routing](/docs/use-cases/support-routing/): the same recipe, measured on a support inbox.
- [Teach a task](/docs/tasks/): what teaching gains on long lists of labels.
- [Use cases](/docs/use-cases/): the other recipes.
