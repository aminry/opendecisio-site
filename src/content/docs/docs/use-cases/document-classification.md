---
title: Document classification
description: Sort incoming documents by type, file the ones decisio can stand behind on their own, and send only the unsure ones to a person.
---

<!-- Site-written: a use-case recipe. The question, the routing script and the registration are src/lib/use-cases.mjs. It is labelled a recipe: decisio is measured on short texts, and no run on long documents is published. -->

This script asks for the document's type and files it only on a certified answer:

::site-block{name="route-document-classification"}

Until the task is certified (step 2), every answer goes to a person, as on the stand-in.

:::fit
- A fixed set of document types, and past documents sorted into them.
- Documents whose text fits the server's length, or whose first pages decide the type.

* Documents whose type depends on images or layout more than on their text.
* Very long documents read whole: the first read grows with the length ([Scale](/docs/scale/#2-plan-for-the-first-read)).
:::

## 1. Write the question

One `choice` question, with a description for each type and an `other` type.
Send the document's text, or its first pages, as the text.

## 2. Teach it and certify it

Teach the question from past documents and certify it at your error target.

:value{name="floor-document-classification"}

::site-block{name="teach-document-classification"}

[Certify answers](/docs/tasks/certify/#2-teach-the-task-with-a-certificate) runs this call on a server, with its answer.

## 3. Route on the certificate

- A certified answer files the document by its type.
- Everything else goes to a person.
- When a new kind of document arrives, certification is suspended until you certify again ([Watch for drift](/docs/tasks/drift/)).

## What it did

::proof{name="document-classification"}

## What next

- [Scale](/docs/scale/): long texts, and what the first read costs.
- [Requirements and limits](/docs/limits/): how long a text each model reads.
- [Use cases](/docs/use-cases/): the other recipes.
