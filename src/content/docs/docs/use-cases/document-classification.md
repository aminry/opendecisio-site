---
title: Document classification
description: File each incoming document by its type from your backend, and send only the ones decisio is unsure about to a person.
---

<!-- Site-written: a use-case recipe. The question, the routing script and the registration are src/lib/use-cases.mjs. It is labelled a recipe: decisio is measured on short texts, and no run on long documents is published. -->

The script asks for the document's type and files it only on a certified answer:

::figure{name="recipe-document-classification"}

## TL;DR

Save the [complete caller](/examples/recipes/document-classification.py) as `document-classification.py` and run it with Python 3.12 or later.
Set `DECISIO_BASE_URL` to your server, or leave the local default.
Until you register and certify this question, the caller sends answers to review.

::site-block{name="route-document-classification"}

## Is it a good fit?

:::fit
- A fixed set of document types, and past documents sorted into them.
- Documents whose text fits the server's length, or whose first pages decide the type.

* Documents whose type depends on images or layout more than on their text.
* Very long documents read whole: the first read grows with the length ([Scale](/docs/scale/#plan-for-the-first-read)).
:::

## 1. Write the question

One `choice` question, with a description for each type and an `other` type.
Send the document's text, or its first pages, as the text.

## 2. Teach it and certify it

Teach the question from past documents and certify it at your error target.

:value{name="floor-document-classification"}

Prepare `document-classification-labels.jsonl` with one JSON object per line, containing `state` and `answer`.
Use real inputs and labels chosen by a person; each answer is one of the question’s option keys.
The code below builds complete requests using the same question as the caller.

::site-block{name="teach-document-classification"}

Save the [registration script](/examples/recipes/document-classification-register.py) beside the labels file and run it with Python.
Registration replaces a task of the same id.
Check the returned certificate: a `null` threshold means no answer can be certified.

[Certify answers](/docs/tasks/certify/#2-teach-the-task-with-a-certificate) runs this call on a server, with its answer.

## 3. Route on the certificate

The caller acts only when `certified` is `true` and `certificate_kind` is `gold`, with a certificate id.
A learned table's `agreement` certificate measures agreement with the model, so it goes to review in this recipe.

- A certified answer files the document by its type.
- Everything else goes to a person.
- When a new kind of document arrives, certification is suspended until you certify again ([Watch for drift](/docs/tasks/drift/)).

## What it did

::proof{name="document-classification"}

<span class="fp-anchor" id="handle-unavailable-and-uncertain-answers"></span>
<span class="fp-anchor" id="good-to-know"></span>
## Limits

- An HTTP error, timeout or invalid response goes to the review path, like an uncertified answer ([Handle review and service failures](/docs/use-cases/#handle-review-and-service-failures)).
- Keep the question and options stable after registration, and certify again after changing the task or serving setup ([Keep a certificate valid](/docs/production/#keep-a-certificate-valid)).

## What next

- [Scale](/docs/scale/): long texts, and what the first read costs.
- [Requirements and limits](/docs/limits/): how long a text each model reads.
- [Use cases](/docs/use-cases/): the other recipes.
