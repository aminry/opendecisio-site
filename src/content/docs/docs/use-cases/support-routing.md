---
title: Support routing
description: Send each support ticket to the right queue from your backend, and give a person only the tickets decisio cannot stand behind.
---

<!-- Site-written: a use-case recipe. The question, the routing script and the registration are src/lib/use-cases.mjs; the measured result is the teach-and-certify runs' support inbox and decisio's triage demo (docs/demos/README.md), read by the same module. -->

The model names the queue, and your code routes only on a certified answer:

::figure{name="recipe-support-routing"}

## TL;DR

Save the [complete caller](/examples/recipes/support-routing.py) as `support-routing.py` and run it with Python 3.12 or later.
Set `DECISIO_BASE_URL` to your server, or leave the local default.
Until you register and certify this question, the caller sends answers to review.

::site-block{name="route-support-routing"}

## Is it a good fit?

:::fit
- A fixed list of queues your team already routes to.
- Past tickets with the queue a person chose, to teach and certify from.
- A person or a queue for what is left over.

* Queues that change every week: each change makes a new task to teach.
* No labelled tickets to teach and certify from.
:::

## 1. Write the question

One `choice` question, with a description for each queue and an `other` queue, so a ticket that fits none of them is not forced into one.

## 2. Teach it and certify it

Teach the question from past tickets and ask for a certificate at your error target, here 5%.

:value{name="floor-support-routing"}

Prepare `support-routing-labels.jsonl` with one JSON object per line, containing `state` and `answer`.
Use real inputs and labels chosen by a person; each answer is one of the question’s option keys.
The code below builds complete requests using the same question as the caller.

::site-block{name="teach-support-routing"}

Save the [registration script](/examples/recipes/support-routing-register.py) beside the labels file and run it with Python.
Registration replaces a task of the same id.
Check the returned certificate: a `null` threshold means no answer can be certified.

[Certify answers](/docs/tasks/certify/#2-teach-the-task-with-a-certificate) runs this call on a server, with its answer.

## 3. Route on the certificate

The caller acts only when `certified` is `true` and `certificate_kind` is `gold`, with a certificate id.
A learned table's `agreement` certificate measures agreement with the model, so it goes to review in this recipe.

- A certified answer goes to its queue on its own.
- Everything else goes to a person, with decisio's suggestion beside it.
- When traffic moves away from the tickets you certified on, certification is suspended, so the shift goes to people instead of into the wrong queues ([Watch for drift](/docs/tasks/drift/)).

## What it did

::proof{name="support-routing"}

<span class="fp-anchor" id="handle-unavailable-and-uncertain-answers"></span>
<span class="fp-anchor" id="good-to-know"></span>
## Limits

- An HTTP error, timeout or invalid response goes to the review path, like an uncertified answer ([Handle review and service failures](/docs/use-cases/#handle-review-and-service-failures)).
- Keep the question and options stable after registration, and certify again after changing the task or serving setup ([Keep a certificate valid](/docs/production/#keep-a-certificate-valid)).

## What next

- [Certify answers](/docs/tasks/certify/): the promise, and the slider on this same inbox.
- [Certified answers on real tasks](/demos/teach-and-certify/): the inbox, message by message.
- [Use cases](/docs/use-cases/): the other recipes.
