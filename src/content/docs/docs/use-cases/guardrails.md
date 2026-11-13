---
title: Guardrails
description: Check each message against a policy, such as toxicity, in one yes-or-no question; block or allow what decisio can stand behind, and send the rest to a moderator.
---

<!-- Site-written: a use-case recipe. The question, the routing script and the registration are src/lib/use-cases.mjs; the measured result is the ToxicChat row of decisio's EVAL_CARD.md section 7.2, read by the same module. -->

This script asks one yes-or-no question and blocks or allows only on a certified answer:

::figure{name="recipe-guardrails"}

Save the [complete caller](/examples/recipes/guardrails.py) as `guardrails.py` and run it with Python 3.12 or later.
Set `DECISIO_BASE_URL` to your server, or leave the local default.
Until you register and certify this question, the caller sends answers to review.

::site-block{name="route-guardrails"}



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

Prepare `guardrails-labels.jsonl` with one JSON object per line, containing `state` and `answer`.
Use real inputs and labels chosen by a person; each answer is a JSON boolean, `true` or `false`.
The code below builds complete requests using the same question as the caller.

::site-block{name="teach-guardrails"}

Save the [registration script](/examples/recipes/guardrails-register.py) beside the labels file and run it with Python.
Registration replaces a task of the same id.
Check the returned certificate: a `null` threshold means no answer can be certified.

[Certify answers](/docs/tasks/certify/#2-teach-the-task-with-a-certificate) runs this call on a server, with its answer.

## 3. Route on the certificate

The caller acts only when `certified` is `true` and `certificate_kind` is `gold`, with a certificate id.
A learned table's `agreement` certificate measures agreement with the model, so it goes to review in this recipe.


- A certified yes blocks; a certified no allows.
- Everything else goes to a moderator.
- When the messages change, a new kind of abuse, a new language, certification is suspended until you certify again ([Watch for drift](/docs/tasks/drift/)).

## Handle unavailable and uncertain answers

An HTTP error, timeout, invalid response or uncertified answer goes to the review path.
The caller uses a 15-second network timeout; set it to fit your application, and log failures where you call `route`.
It returns an action for your backend to perform.

## What it did

::proof{name="guardrails"}

## Good to know

Keep the question and options stable after registration.
Certify again after changing the task or serving setup, and check new traffic with labelled examples.
The caller prints an action; connect that action to your own queue, workflow or review interface.

## What next

- [Certify answers](/docs/tasks/certify/): the promise, and how to choose the error target.
- [Scale](/docs/scale/): many policy questions about one message, for the price of one read.
- [Use cases](/docs/use-cases/): the other recipes.
