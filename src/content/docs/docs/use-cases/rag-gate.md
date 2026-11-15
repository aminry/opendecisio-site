---
title: "RAG: answer or abstain"
description: Before a retrieval pipeline answers, check whether the passages it found answer the question; answer when decisio is sure, and say so when they do not.
---

<!-- Site-written: a use-case recipe. The question, the routing script and the registration are src/lib/use-cases.mjs; the measured result is the SciFact and BoolQ rows of decisio's EVAL_CARD.md section 7.2, read by the same module. -->

The script sends the question and the passage as one text and acts only on a certified answer:

::figure{name="recipe-rag-gate"}

## TL;DR

Save the [complete caller](/examples/recipes/rag-gate.py) as `rag-gate.py` and run it with Python 3.12 or later.
Set `DECISIO_BASE_URL` to your server, or leave the local default.
Until you register and certify this question, the caller sends answers to review.

::site-block{name="route-rag-gate"}

## Is it a good fit?

:::fit
- A retrieval step that returns passages, and questions your users ask again and again.
- Labelled pairs of a question and a passage, to certify from.

* Writing the answer itself: decisio reads and decides, it does not write.
* Questions that need reasoning across many documents at once.
:::

## 1. Write the question

One `choice` question about the text: does the passage answer the question, partly, or not.
Put the user's question and the passage in the text, as the script does.

## 2. Teach it and certify it

Teach the question from labelled pairs, and certify it at your error target.

:value{name="floor-rag-gate"}

Prepare `rag-gate-labels.jsonl` with one JSON object per line, containing `state` and `answer`.
Use real inputs and labels chosen by a person; each answer is one of the question’s option keys.
The code below builds complete requests using the same question as the caller.

::site-block{name="teach-rag-gate"}

Save the [registration script](/examples/recipes/rag-gate-register.py) beside the labels file and run it with Python.
Registration replaces a task of the same id.
Check the returned certificate: a `null` threshold means no answer can be certified.

[Certify answers](/docs/tasks/certify/#2-teach-the-task-with-a-certificate) runs this call on a server, with its answer.
To let the server decline on its own, add a "can't tell" option and an abstention threshold ([Certify answers](/docs/tasks/certify/#let-the-server-abstain)).

## 3. Route on the certificate

The caller acts only when `certified` is `true` and `certificate_kind` is `gold`, with a certificate id.
A learned table's `agreement` certificate measures agreement with the model, so it goes to review in this recipe.

- A certified `yes` answers from the passage; `partly` answers with the missing part stated; `no` says it is not in the documents.
- Everything else goes to a larger model or a person.
- When your documents or your users' questions change, certification is suspended until you certify again ([Watch for drift](/docs/tasks/drift/)).

## What it did

::proof{name="rag-gate"}

<span class="fp-anchor" id="handle-unavailable-and-uncertain-answers"></span>
<span class="fp-anchor" id="good-to-know"></span>
## Limits

- An HTTP error, timeout or invalid response goes to the review path, like an uncertified answer ([Handle review and service failures](/docs/use-cases/#handle-review-and-service-failures)).
- Keep the question and options stable after registration, and certify again after changing the task or serving setup ([Keep a certificate valid](/docs/production/#keep-a-certificate-valid)).

## What next

- [Certify answers](/docs/tasks/certify/): the promise, and abstention.
- [Scale](/docs/scale/): long passages, and many questions about one text.
- [Use cases](/docs/use-cases/): the other recipes.
