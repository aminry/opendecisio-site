---
title: For development (CPU)
description: Build and test a client on any machine, with no GPU. The CPU stand-in serves every route of decisio from a small model.
---

<!-- Site-written: the deploy guide for the CPU stand-in. The commands are Get started's (src/lib/site-blocks.mjs); the facts are docs/running.md's "CPU stand-in for development" (src/config/sourced.mjs checks them). -->

::covers{links="README.md#cpu-stand-in-for-development docs/running.md#cpu-stand-in-for-development"}

Start it from a clone of the release, on any machine.

::site-block{name="stand-in-start"}

## 1. What you get

- Every route the real server has, so a client, a task registration and its tests run against it unchanged.
- Answers from `Qwen/Qwen3-0.6B-Base`, a small model for development; they are not decisio's measured answers.
- A server that is ready 4 to 8 seconds after it starts, once the model is downloaded, and answers a first question in about 0.3 seconds on top (on Apple silicon, 2026-10-14).

The first start downloads the model, about 1.2 GB, once.

## 2. Send it a request

The request from [Get started](/docs/#3-ask-your-first-question) works as it is; only the numbers in the answer differ.
[Call it from your code](/docs/use-from/) has the same request from Python, JavaScript and TypeScript.

## 3. Teach it a task

The walk-through of [Teach it your question](/docs/tasks/) runs on the stand-in, end to end: register a task, ask it, list it and remove it.
The site checks every one of its commands this way.

## What next

- [On a cloud GPU](/docs/deploy/cloud-gpu/): serve the default model, Gemma 4 31B, for real answers.
- [On a Mac or a laptop](/docs/deploy/mac/): run a real model on Apple silicon or with Ollama.
- [Call it from your code](/docs/use-from/): the same request from your language.
