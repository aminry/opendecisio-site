---
title: "decisio 0.26.0: the Gemma models read your questions first, and answers change"
summary: "0.26.0 lists a request's questions before its text on the Gemma models, which answered more accurately on the 31B; anything taught keeps the old layout, and --layout plain restores it."
date: 2026-10-23
tags: [release]
---

This is a breaking change: on the Gemma models, the same request can get a different answer after you upgrade.
decisio 0.26.0 serves the 31B, the 12B and the 12B in FP8 with a new prompt layout, the header layout.
The prompt now lists every question of the request, then the text, then the question, so the model reads your text knowing what will be asked.
The Qwen model is unchanged.

## What it does to answers

On the 31B, against the old layout on the same items, it scored 5.0 points higher on a public sample of the Decision Index, 4.4 higher on our H776 set and 7.4 higher on our hard390 set.
On our dev500 set it was 0.4 lower, within noise.
On the 12B the gain was smaller and sat mostly in requests that ask many questions about one text.

The cost is tokens: a single question reads 3 to 10% more input tokens, and `usage.input_tokens` counts them.

## What does not change on upgrade

A server that loads something taught on the old layout keeps serving the old layout, and says so when it starts and in `/health`.
That covers stored tasks, abstention tasks and adapters or tuned models that record no layout.
So a taught deployment answers as it did until you register its tasks again under the header.

To keep the old behaviour everywhere, start with `--layout plain`: it serves the old prompt token for token.

## Who wants the old layout

A client that sends one text with a series of different questions, such as an agent, a game or a teaching loop, should start the server with `--layout plain`.
Under the header, a text read for one set of questions is not reused for another, so each later question costs like a first one.
On the 31B a later question about a 3,000-token text takes 485 ms instead of 41.
Every response carries `x-decisio-prompt`, with the prompt tokens read and how many the cache served, so you can see it on your own traffic.

## Before you rely on it

- The gains were measured on our proxies and a public sample, on one card per model. Measure on your own traffic, and keep `--layout plain` where the header does not help.
- On the 12B, weighting each of the sample's 41 families equally, the gain was +1.75 points with an interval that crosses 0.
- Fine-tuned adapters were not measured under the header, which is why one that records no layout is served on the old layout.
- A request cannot choose its layout yet: one server serves one.

[Choose the prompt layout](/docs/layout/) has the measurements and what holds a server at the old layout, and [Release notes](/docs/releases/) has every change.
