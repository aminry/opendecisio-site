---
title: Quickstart
description: Start on a GPU, with MLX on Apple silicon, or with Ollama on a laptop. Send text and questions, then read a typed answer from your backend.
---

<!-- Site-written: the start page. The machine table follows decisio's README "Install and run" at the pinned release; the request and its answer are the first recorded decision, as decisio 0.17.0 answered it (src/lib/recorded.mjs); every command was run, as the record says. -->

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

The answer in step 4 is a recorded example from Gemma 4 31B, labelled with its serving setup.
Your running model's probabilities can differ.

## 3. Ask your first question

One `POST` to `/v1/systemone`: the text goes in `state`, and each question has a name you choose, a `type` and `instructions`.

::site-block{name="first-decision-request"}

- `noul` is a yes or no question; its answer is the probability of yes.
- `choice` picks among named options, up to 255; the options are its `criteria`.
- `score` picks a level on a scale, listed lowest first.

## 4. Read the answer

Each question comes back under its own name.
A choice gives its likeliest option and the probability of every option, so you see how sure it is as well as what it picked.

::figure{name="first-decision"}

Good to know:

- A request the server cannot read gets status 422, with a `detail` that names what is wrong.
- The `model` field does not choose a model: a server serves the one model it was started with.

## What next

- [Call it from your code](/docs/use-from/): the same request from Python, JavaScript and TypeScript, and the frameworks.
- [On a cloud GPU](/docs/deploy/cloud-gpu/): run the default model, Gemma 4 31B, on your own card.
- [Teach a task](/docs/tasks/): teach a question you ask again and again, and certify its answers.
