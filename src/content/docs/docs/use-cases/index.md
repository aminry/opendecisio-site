---
title: Use cases
description: Six recipes for putting decisio in a product, each with the question, the code that routes on its certificate, and what it did when measured.
---

<!-- Site-written: the index of the use-case recipes (src/lib/use-cases.mjs has their questions, scripts and proofs). A recipe with no published run is labelled a recipe. -->

Each recipe is the same three steps: ask one question about the text, teach and certify it from your labelled examples, and act on the certified answers while a person takes the rest.
The routing code is the same in every recipe; this is support routing's:

::site-block{name="route-support-routing"}

| Use case | What decisio decides | Proof |
| --- | --- | --- |
| [Support routing](/docs/use-cases/support-routing/) | which queue a ticket goes to | measured |
| [Coding-agent gatekeeper](/docs/use-cases/gatekeeper/) | allow, ask or block a shell command, by your rules | measured |
| [Issue triage](/docs/use-cases/issue-triage/) | the kind of a new issue | recipe |
| [Guardrails](/docs/use-cases/guardrails/) | whether a message breaks a policy | measured for toxicity |
| [RAG: answer or abstain](/docs/use-cases/rag-gate/) | whether a retrieved passage answers the question | measured as accuracy |
| [Document classification](/docs/use-cases/document-classification/) | the type of an incoming document | recipe |

"Measured" means a published run of the same question; "recipe" means the steps and the code, with no published run yet.

## What next

- [Teach a task](/docs/tasks/): the teaching step every recipe uses.
- [Certify answers](/docs/tasks/certify/): the certificate every recipe routes on.
