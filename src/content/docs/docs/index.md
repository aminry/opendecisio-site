---
title: Get started
description: Send a typed question to a Decisio server and read the probability it gives for every option.
---

<!-- Site-written: the start page. Every fact on it is from the pinned decisio release (README.md, docs/api.md) or from the recorded decisions (launch_facts.public.json), and each command was run, as the line under it says. -->

Decisio is a server that answers typed questions about a piece of text.
You send the text and the questions; for each question it gives a probability for every option, from one forward pass and no generated text.
These pages are built from the decisio repository at the release named in the footer, so they describe exactly that release.

This page takes you from nothing to your first answer, on any machine, with the CPU stand-in: a small model that serves the same routes.
Its answers are for development, not the measured system's; [Choose your machine](/docs/quickstart/) has the paths that run the real bases.

::figure{name="request-flow"}

## TL;DR

:::steps

1. **In one terminal, start a server.**
   The first start downloads a small model from Hugging Face.

   ```bash
   git clone https://github.com/aminry/decisio
   cd decisio
   uv sync --extra dev --frozen
   uv run python -m decisio.serve.vllm_engine --backend hf --model Qwen/Qwen3-0.6B-Base
   ```

2. **In a second terminal, send one text with three questions about it.**

   ::site-block{name="first-decision-request"}

3. **Read the answer.**
   The measured system, Gemma 4 31B, answered that request like this:

   ::site-block{name="first-decision-response"}

   ::recorded-label

   The stand-in answers with the same fields and other numbers.

:::

:::glossary

| Word | Meaning |
| --- | --- |
| state | the text the questions are about |
| question | one thing to decide about the state, typed as yes/no (`noul`), a choice among named options, or a score on an ordered scale |
| probability | how likely the model finds an option; a question's probabilities add up to 1, and a yes/no gives the probability of yes |
| base | the model Decisio serves; one is chosen when the server starts |

:::

## 1. Start a server

You need [uv](https://docs.astral.sh/uv/) and `git`.
The commands above clone the repository, install it with its development tools and serve the routes from `Qwen/Qwen3-0.6B-Base` on the CPU.
The server listens on `http://127.0.0.1:8000`; the first start downloads the model, and `GET /health` answers once it is ready:

```bash
curl -s http://127.0.0.1:8000/health
```

:::caution[Common mistake]
"Connection refused" means the server is still starting.
Wait until `/health` answers, then send the request.
:::

## 2. Ask your question

The request is one `POST` to `/v1/systemone`, with the text as `state` and each question under a name you choose.

- Every question has a `type` and its `instructions`.
- A choice lists its options as `criteria`.
- A score lists its levels from lowest to highest.

[Your first decision](/docs/first-request/) takes the request and its answer apart line by line.

:::caution[Common mistake]
A request the server cannot read gets status 422 and a `detail` that names what is wrong; read it before changing anything else.
The `model` field does not choose a model: a server serves the one base it was started with.
:::

## 3. See where the time went

Every response carries headers.
Ask a single question, with the default instructions for its type, and print them:

```bash
curl -s -D - -o /dev/null http://127.0.0.1:8000/v1/systemone \
  -H 'Content-Type: application/json' \
  -d '{"state": "Both charges are 49.00 EUR, same day. Please refund one.", "questions": {"urgent": {"type": "noul"}}}' \
  | grep -i '^x-decisio'
# x-decisio-server-ms: the server's time for the request
# x-decisio-route: the route that served it (text or image)
# x-decisio-stages: where the engine's time went
```

The lines it prints are those headers with their values; the values depend on the machine.

## What next

- [Your first decision](/docs/first-request/): the request and its answer, line by line.
- [Choose your machine](/docs/quickstart/): the paths that run the real bases, with what each needs.
- [Choosing a base](/docs/bases/): the three models it serves, and when to choose each.
