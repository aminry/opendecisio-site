---
title: Coding-agent gatekeeper
description: Decide allow, ask or block for each shell command a coding agent proposes, by your team's own rules, and ask a person only when decisio is not sure.
---

<!-- Site-written: a use-case recipe. The rules and their actions are the teach-and-certify gatekeeper's policy; the question, the routing script and the registration are src/lib/use-cases.mjs; the measured result is that run, read by the same module. -->

decisio names the rule a command falls under; your policy maps the rule to an action, and only a certified answer acts on its own:

::figure{name="recipe-gatekeeper"}

## TL;DR

Save the [complete caller](/examples/recipes/gatekeeper.py) as `gatekeeper.py` and run it with Python 3.12 or later.
Set `DECISIO_BASE_URL` to your server, or leave the local default.
Until you register and certify this question, the caller sends answers to review.

::site-block{name="route-gatekeeper"}

## Is it a good fit?

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

Prepare `gatekeeper-labels.jsonl` with one JSON object per line, containing `state` and `answer`.
Use real inputs and labels chosen by a person; each answer is one of the question’s option keys.
The code below builds complete requests using the same question as the caller.

::site-block{name="teach-gatekeeper"}

Save the [registration script](/examples/recipes/gatekeeper-register.py) beside the labels file and run it with Python.
Registration replaces a task of the same id.
Check the returned certificate: a `null` threshold means no answer can be certified.

[Certify answers](/docs/tasks/certify/#2-teach-the-task-with-a-certificate) runs this call on a server, with its answer.

## 3. Route on the certificate

The caller acts only when `certified` is `true` and `certificate_kind` is `gold`, with a certificate id.
A learned table's `agreement` certificate measures agreement with the model, so it goes to review in this recipe.

- A certified answer takes the rule's action: allow, ask or block.
- Anything else asks a person.
- In the measured run, a kind of command that no rule named was never certified, so it went to a person ([Watch for drift](/docs/tasks/drift/)).

## What it did

::proof{name="gatekeeper"}

<span class="fp-anchor" id="handle-unavailable-and-uncertain-answers"></span>
<span class="fp-anchor" id="good-to-know"></span>
## Limits

- An HTTP error, timeout or invalid response goes to the review path, like an uncertified answer ([Handle review and service failures](/docs/use-cases/#handle-review-and-service-failures)).
- Keep the question and options stable after registration, and certify again after changing the task or serving setup ([Keep a certificate valid](/docs/production/#keep-a-certificate-valid)).

## What next

- [Certify answers](/docs/tasks/certify/): the promise, and how to choose the error target.
- [Certified answers on real tasks](/demos/teach-and-certify/): the gatekeeper's rules, its results and its drift test.
- [Use cases](/docs/use-cases/): the other recipes.
