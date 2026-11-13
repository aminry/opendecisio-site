---
title: Quickstart
description: Start on a GPU, with MLX on Apple silicon, or with Ollama on a laptop. Send text and questions, then read a typed answer from your backend.
---

<!-- The machine paths follow the pinned release. The first request shares the downloadable choice example; the optional recorded result retains its original source label. -->

::covers{links="README.md#install-and-run=1-pick-your-machine README.md#quickstart=1-pick-your-machine docs/running.md=1-pick-your-machine"}

Four steps: pick your machine, start a server, ask a question and read the answer.

::figure{name="request-flow"}

## 1. Pick your machine

| Your machine | Its guide |
| --- | --- |
| Linux with an NVIDIA card | [On a cloud GPU](/docs/deploy/cloud-gpu/) |
| Linux with an NVIDIA card and Docker | [With Docker](/docs/deploy/docker/) |
| Mac with Apple silicon | [On a Mac](/docs/deploy/mac/) |
| Mac, Linux or Windows with Ollama 0.35.1 to 0.40.3 | [With Ollama](/docs/deploy/mac/#on-a-laptop-with-ollama) |

The memory and card each machine needs are on [Requirements and limits](/docs/limits/).
Choose the guide for your hardware, start the model server it describes, then continue below.
Ollama uses its own port and model names; its guide includes the request to send.

## 2. Start a server

Follow the [GPU](/docs/deploy/cloud-gpu/), [Docker](/docs/deploy/docker/) or [MLX](/docs/deploy/mac/) setup, including the hardware and software requirements.
The first start downloads the model and loads it into memory.

<details>
<summary>Optional: a CPU server for client contract tests</summary>

If you only need to test request and response handling without serving hardware, use the small development model.
You need Python 3.12, [uv](https://docs.astral.sh/uv/) and `git`.

::site-block{name="stand-in-start"}

Its probabilities are for development and do not represent the models above.
[CPU development](/docs/deploy/development/) explains this path.

</details>

A decisio server listens on `http://127.0.0.1:8000`.
It is ready when `/health` answers:

```bash
curl -s http://127.0.0.1:8000/health
```

## 3. Ask your first question

One `POST` to `/v1/systemone`: the text goes in `state`, and each question has a name you choose, a `type` and `instructions`.

::site-block{name="question-choice"}

This asks which team should handle one ticket and supplies billing, access and bug as the possible answers.
[Download this request as JSON](/examples/questions/choice.json) for your own client.

## 4. Read the answer

Read `answers.category` in the response.
`choice` gives the selected queue, and `probabilities` gives a value for each supplied option.
The following fields are illustrative, with chosen probabilities rather than a measured result:

```json
{
  "type": "choice",
  "choice": "billing",
  "probabilities": {"billing": 0.8, "access": 0.05, "bug": 0.15}
}
```

Your running model will return its own probabilities.
Your backend maps the selected key to a queue or sends the ticket to review, using a policy you [evaluate on your task](/docs/concepts/probabilities/).

<details>
<summary>A recorded model result with three question types</summary>

This separate example asks about urgency, queue and impact on another support ticket.
It is a recorded Gemma 4 31B result, labelled with its release, hardware and date; it is not the output of the one-question request above.

::figure{name="first-decision"}

</details>

## Good to know

- A request the server cannot read gets status 422, with a `detail` that names what is wrong.
- The `model` field does not choose a model: a server serves the one model it was started with.

## What next

- [Call it from your code](/docs/use-from/): typed questions from Python, JavaScript, TypeScript and frameworks.
- [Choose a question type](/docs/concepts/questions/): add a yes or no question or an ordered score.
- [Use the probabilities](/docs/concepts/probabilities/): decide when to route and when to review.
