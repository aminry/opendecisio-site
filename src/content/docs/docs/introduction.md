---
title: What is decisio?
description: Add fast, structured decisions to your backend. Send text and questions, get typed answers and a probability for every option, on your own hardware.
---

Use decisio when your application needs to choose a queue, check a condition or rate something on a scale.
You define the possible answers, and your code decides what happens with the result.

::figure{name="request-flow"}

## A decision your code can use

For a support ticket, ask which team should handle it and supply your team's queue names.
The answer gives the likeliest queue and a probability for every queue, so your application can route it or send it for review.
The same request can also ask whether the ticket is urgent and how severe its impact is.

| Your application needs to | Ask |
| --- | --- |
| Route, classify or choose a tool | A choice among named options |
| Check a condition or screen content | A yes or no question |
| Rate urgency, quality or impact | A score on your ordered rubric |

[Choose a question type](/docs/concepts/questions/) shows how each answer differs.

## Run it where your backend runs

| Where you want to run it | Start here |
| --- | --- |
| Linux with an NVIDIA GPU | [Cloud GPU](/docs/deploy/cloud-gpu/) or [Docker](/docs/deploy/docker/) |
| Apple silicon | [MLX on a Mac](/docs/deploy/mac/) |
| A laptop with Ollama | [Ollama setup and supported versions](/docs/deploy/mac/#on-a-laptop-with-ollama) |

A decisio server runs beside your application, with its model loaded on your hardware.
Your backend sends JSON over HTTP; it needs no particular application framework.

## Improve a recurring decision

When you ask the same question repeatedly, [teach a task](/docs/tasks/) from your labelled examples.
To automate only the answers that meet your error target, [certify the task](/docs/tasks/certify/) and handle the remaining answers in your review path.

## Good to know

- Run the server on a private network or behind an authenticated proxy, and call it from your backend.
- Pick a model that fits your hardware using [Requirements and limits](/docs/limits/).
- Ollama uses its own serving route and settings; use the decisio server to teach and certify tasks.
- For client contract tests without model-serving hardware, a [CPU development server](/docs/deploy/development/) is available.

## What next

- [Quickstart](/docs/): choose your hardware and ask your first question.
- [Build a request](/docs/build-request/): turn an application decision into a question and options.
- [Examples](/docs/use-cases/): see a complete recipe for your use case.
