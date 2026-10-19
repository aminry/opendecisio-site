---
title: Get started
description: Run decisio and get your first answer in about five minutes. A text and questions go in; a probability for every option comes out, in one call.
---

<!-- Site-written: the start page. The machine table follows decisio's README "Install and run" at the pinned release; the request and its answer are the first recorded decision (launch_facts.public.json, figures.recorded_decisions); every command was run, as the record says. -->

Run decisio and get your first answer in about five minutes.
You send a text and questions about it, each with its options; decisio sends back a probability for every option, in one call.

::figure{name="request-flow"}

## 1. Pick your machine

| Your machine | Its guide |
| --- | --- |
| Linux with an NVIDIA card | [GPU server](/docs/quickstart/gpu-server/) |
| Linux with an NVIDIA card and Docker | [Docker](/docs/quickstart/docker/) |
| Mac with Apple silicon | [Mac](/docs/quickstart/mac-mlx/) |
| Mac, Linux or Windows with Ollama | [Ollama](/docs/quickstart/ollama/) |
| Any machine, for development | [CPU stand-in](/docs/quickstart/cpu-stand-in/) |

The memory and card each machine needs are on [Requirements and limits](/docs/limits/).
The steps below use the CPU stand-in, which runs on any machine.
On any other machine, start the server as its guide says and go on from step 3.

## 2. Start a server

You need Python 3.12, [uv](https://docs.astral.sh/uv/) and `git`.
The first start downloads a small model from Hugging Face.

```bash
git clone https://github.com/aminry/decisio
cd decisio
uv sync --extra dev --frozen
uv run python -m decisio.serve.vllm_engine --backend hf --model Qwen/Qwen3-0.6B-Base
```

The server listens on `http://127.0.0.1:8000`.
It is ready when `/health` answers:

```bash
curl -s http://127.0.0.1:8000/health
```

This small model is for development, so its probabilities are not the default model's.
The answer in step 4 is the default model's, Gemma 4 31B.

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

::site-block{name="first-decision-response"}

::recorded-label

Good to know:

- A request the server cannot read gets status 422, with a `detail` that names what is wrong.
- The `model` field does not choose a model: a server serves the one model it was started with.

## What next

- [Call it from your code](/docs/use-from/): the same request from Python, JavaScript and TypeScript, and the frameworks.
- [GPU server](/docs/quickstart/gpu-server/): run the default model, Gemma 4 31B, on your own card.
- [Teach it your question](/docs/tasks/): teach a question you ask again and again, and certify its answers.
