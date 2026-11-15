---
title: How it works
description: Follow a text from your request to a typed answer, then decide what your application should do with it.
---

::covers{links="README.md#how-it-works"}

Send a text and your questions, then use the typed answers in your application.
The model judges the text; your code chooses the next action.

::figure{name="first-question"}

## The request flow

<span class="fp-anchor" id="1-the-request-flow"></span>

Put the text in `state`, and name each entry in `questions` so you can find its answer later.
A request shares a read of the text across its questions.
Ask related questions together when you already know them.

::diagram{name="request-flow"}

Use [plain layout](/docs/layout/) when you ask a series of different questions about the same text.
The default header layout on Gemma lists the questions before the text, so a different set of questions can require another read.

## One decision and its probabilities

<span class="fp-anchor" id="2-one-decision-and-its-probabilities"></span>

Each question returns probabilities over the answers you supplied.
A [choice](/docs/concepts/choice/) selects an option, a [yes/no question](/docs/concepts/noul/) returns the probability of yes, and a [score](/docs/concepts/score/) returns a weighted level on your scale.

::figure{name="one-pass"}

The figure shows a recorded request under the plain layout.
Treat probabilities as inputs to an application policy: act, request review, or ask a follow-up question.
A [manual threshold](/docs/concepts/probabilities/) is your policy; it does not create a certificate.

## Teach, then certify, then route

<span class="fp-anchor" id="3-teach-then-certify-then-route"></span>

Start with an ordinary request.
When you ask the same question repeatedly, [teach a task](/docs/tasks/) from examples labelled by people, then [certify it](/docs/tasks/certify/) at your error target.

::figure{name="teach-flow-all"}

Your application checks each answer's `certified` and `certificate_kind` fields before acting.
A gold certificate concerns correctness on traffic like your labelled examples; an agreement certificate concerns how often a learned table agrees with the model.
Send answers that do not meet your policy to review.

## Where it runs

<span class="fp-anchor" id="4-where-it-runs"></span>

Run a [GPU server](/docs/deploy/cloud-gpu/), [MLX on Apple silicon](/docs/deploy/mac/), or the supported [Ollama path](/docs/deploy/mac/#on-a-laptop-with-ollama).
Your backend sends HTTP requests to the running service.

::figure{name="layouts"}

## What repeats

Keep the model and serving settings stable when you need comparable answers.
Exact probabilities can move across batches, restarts or machines; [What was measured on what](/docs/measured/#repeatability) describes the measured behavior and the settings for repeated reads.

<span id="under-the-hood"></span>

## Good to know

- A default request selects among supplied answers; [thinking](/docs/think/) is an optional extra reasoning step.
- A certificate covers one task and serving setup; certify again after changing either.
- Your application needs a review path for uncertain answers and service failures, as the [recipes](/docs/use-cases/) show.

## What next

- [Write a decision request](/docs/build-request/): choose questions and options for your data.
- [Use probabilities](/docs/concepts/probabilities/): connect a result to application policy.
- [Teach a task](/docs/tasks/): improve a recurring question with your own labels.
