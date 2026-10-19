---
title: "RAG: answer or abstain"
description: Before a retrieval pipeline answers, check whether the passages it found answer the question; answer when decisio is sure, and say so when they do not.
---

<!-- Site-written: a use-case recipe. The question, the routing script and the registration are src/lib/use-cases.mjs; the measured result is the SciFact and BoolQ rows of decisio's EVAL_CARD.md section 7.2, read by the same module. -->

Check that the retrieved passage answers the question before your pipeline answers from it, and say "not in the documents" when it does not.
This script sends the question and the passage as one text and acts only on a certified answer:

::site-block{name="route-rag-gate"}

Until the task is certified (step 2), every answer goes to a person, as on the stand-in.

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

::site-block{name="teach-rag-gate"}

[Certify answers](/docs/tasks/certify/#2-teach-the-task-with-a-certificate) runs this call on a server, with its answer.
To let the server decline on its own, add a "can't tell" option and an abstention threshold ([Certify answers](/docs/tasks/certify/#let-the-server-abstain)).

## 3. Route on the certificate

- A certified yes answers from the passage; a certified no says it is not in the documents.
- Everything else goes to a larger model or a person.
- When your documents or your users' questions change, certification is suspended until you certify again ([Watch for drift](/docs/tasks/drift/)).

## What it did

::proof{name="rag-gate"}

## What next

- [Certify answers](/docs/tasks/certify/): the promise, and abstention.
- [Scale](/docs/scale/): long passages, and many questions about one text.
- [Use cases](/docs/use-cases/): the other recipes.
