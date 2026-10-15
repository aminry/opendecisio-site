---
title: Your first decision
description: One request, three questions and the answer to each, taken apart line by line.
---

<!-- Site-written. The request and its answer are the first record of decisio-examples' support-routing run (the launch facts (launch_facts.public.json), figures.recorded_decisions); the fields are those of docs/api.md at the pinned release. -->

A decision is a text and typed questions about it.
You send them in one request; the server reads the text once and answers every question: a probability for every option.
This page takes one recorded decision apart; hover or focus a line of the figure to see its partner.

::figure{name="first-decision"}

## TL;DR

With a server running ([Get started](/docs/) starts one), send the request and read the answer:

::site-block{name="first-decision-request"}

::site-block{name="first-decision-response"}

::recorded-label

:::glossary

| Word | Meaning |
| --- | --- |
| `noul` | a yes/no question; its answer is the probability of yes |
| `choice` | a choice among named options (up to 255); the answer names the likeliest and gives every option's probability |
| `score` | a level on an ordered scale, lowest first; the answer is a probability for each level |
| `criteria` | what the options are: for a choice, option keys and their descriptions; for a score, the levels' descriptions |

:::

## 1. The text

`state` is the text the questions are about.
A prompt, the state with one question, can hold up to 32,768 tokens, and the server reads the state once for all the questions in the request.

## 2. The questions

Each question has a name you choose, which is also its key in the answer, a `type` and `instructions`.
The options of a choice are its `criteria`: a key for each, with a description the model reads.
Leave `instructions` out and a fixed default per type is used.

## 3. The answer

The response has one answer per question, under the same name.
A choice answers with its likeliest option and the probability of every option, so you can read how sure it is as well as what it picked.

:::caution[Common mistake]
The answer keys are always the request's own.
Rename an option in the request and the answer uses the new name; a registered task, though, is found by its options in order, so renaming one makes a different task.
:::

## 4. One question on its own

On the default Gemma 4 31B the questions in a request are scored together in one batch (`--multi-question warm`); the Gemma 4 12B and Qwen bases answer one question at a time by default, each as if it had been sent alone.
Against the same question sent alone, the Qwen base's probabilities are the same; on the Gemma bases the choice is the same and the probabilities agree to within 0.035 (12B) and 0.0073 (31B).
Ask only the queue:

::site-block{name="first-decision-one-question"}

## What next

- [Get started](/docs/): start a server on any machine.
- [Teaching it a task](/docs/tasks/): register a question you ask again and again.
- [The HTTP API](/docs/api/): every route, request field and response field.
