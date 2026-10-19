---
title: Guardrails
description: Check each message against a policy, such as toxicity, in one yes-or-no question; block or allow what decisio can stand behind, and send the rest to a moderator.
---

<!-- Site-written: a use-case recipe. The question, the routing script and the registration are src/lib/use-cases.mjs; the measured result is the ToxicChat row of decisio's EVAL_CARD.md section 7.2, read by the same module. -->

This script asks one yes-or-no question and blocks or allows only on a certified answer:

::site-block{name="route-guardrails"}

Until the task is certified (step 2), every answer goes to a person, as on the stand-in.

:::fit
- A policy you can state as a yes-or-no question: is it toxic, is it off-topic, does it ask for a refund.
- Labelled messages, to certify from.

* A policy that needs the whole conversation when you send one message.
* A single gate in front of something dangerous: keep a person or a second check on what is not certified.
:::

## 1. Write the question

One `noul` question, which answers with the probability of yes.
Several policies are several questions in the same request, read once.

## 2. Teach it and certify it

A clear yes-or-no question the model already answers well often needs no teaching: the server declines a correction that does not help, and says so.
Certify it anyway, so each answer says whether it can act on its own.

:value{name="floor-guardrails"}

::site-block{name="teach-guardrails"}

[Certify answers](/docs/tasks/certify/#2-teach-the-task-with-a-certificate) runs this call on a server, with its answer.

## 3. Route on the certificate

- A certified yes blocks; a certified no allows.
- Everything else goes to a moderator.
- When the messages change, a new kind of abuse, a new language, certification is suspended until you certify again ([Watch for drift](/docs/tasks/drift/)).

## What it did

::proof{name="guardrails"}

## What next

- [Certify answers](/docs/tasks/certify/): the promise, and how to choose the error target.
- [Scale](/docs/scale/): many policy questions about one message, for the price of one read.
- [Use cases](/docs/use-cases/): the other recipes.
