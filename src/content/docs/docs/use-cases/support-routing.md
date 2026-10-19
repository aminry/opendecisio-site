---
title: Support routing
description: Send each support ticket to the right queue, act on the routes decisio can stand behind, and send only the rest to a person.
---

<!-- Site-written: a use-case recipe. The question, the routing script and the registration are src/lib/use-cases.mjs; the measured result is the teach-and-certify runs' support inbox and decisio's triage demo (docs/demos/README.md), read by the same module. -->

This script asks for the queue and acts only on a certified answer:

::site-block{name="route-support-routing"}

Until the task is certified (step 2), every answer goes to a person, as on the stand-in.

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

::site-block{name="teach-support-routing"}

[Certify answers](/docs/tasks/certify/#2-teach-the-task-with-a-certificate) runs this call on a server, with its answer.

## 3. Route on the certificate

- A certified answer goes to its queue on its own.
- Everything else goes to a person, with decisio's suggestion beside it.
- When traffic moves away from the tickets you certified on, certification is suspended, so the shift goes to people instead of into the wrong queues ([Watch for drift](/docs/tasks/drift/)).

## What it did

::proof{name="support-routing"}

## What next

- [Certify answers](/docs/tasks/certify/): the promise, and the slider on this same inbox.
- [Certified answers on real tasks](/demos/teach-and-certify/): the inbox, message by message.
- [Use cases](/docs/use-cases/): the other recipes.
