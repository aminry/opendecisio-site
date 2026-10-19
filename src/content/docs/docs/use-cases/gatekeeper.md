---
title: Coding-agent gatekeeper
description: Decide allow, ask or block for each shell command a coding agent proposes, by your team's own rules, and ask a person only when decisio is not sure.
---

<!-- Site-written: a use-case recipe. The rules and their actions are the teach-and-certify gatekeeper's policy; the question, the routing script and the registration are src/lib/use-cases.mjs; the measured result is that run, read by the same module. -->

decisio names the rule a command falls under; your policy maps the rule to an action, and only a certified answer acts on its own:

::site-block{name="route-gatekeeper"}

Until the task is certified (step 2), every answer goes to a person, as on the stand-in.

:::fit
- Written rules for what an agent may do, each with an action.
- Labelled commands for every rule, to teach and certify from.
- A catch-all rule that asks, for the commands no rule names.

* A policy that is not written down: decisio learns rules from examples, it does not invent them.
* Commands whose risk depends on things the text does not show, such as what a script does inside.
:::

## 1. Write the question

One `choice` question: which rule covers this command.
Keep the policy beside it, so the action is yours, not the model's, and changing an action needs no teaching.

## 2. Teach it and certify it

Teach the question from labelled commands and certify it at 5%.

:value{name="floor-gatekeeper"}

::site-block{name="teach-gatekeeper"}

[Certify answers](/docs/tasks/certify/#2-teach-the-task-with-a-certificate) runs this call on a server, with its answer.

## 3. Route on the certificate

- A certified answer takes the rule's action: allow, ask or block.
- Anything else asks a person.
- In the measured run, a kind of command that no rule named was never certified, so it went to a person ([Watch for drift](/docs/tasks/drift/)).

## What it did

::proof{name="gatekeeper"}

## What next

- [Certified answers on real tasks](/demos/teach-and-certify/): the gatekeeper's rules, its results and its drift test.
- [Certify answers](/docs/tasks/certify/): the promise, and how to choose the error target.
- [Use cases](/docs/use-cases/): the other recipes.
