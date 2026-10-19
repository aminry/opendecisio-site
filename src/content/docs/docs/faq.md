---
title: Questions
description: Short answers to the questions newcomers ask, each resting on the documentation it links to.
---

Newcomers ask the same handful of things first.
Each answer below is a pointer or a section of the pinned decisio release, so it says what that release says.

::figure{name="faq-map"}

## TL;DR

With a server running ([Get started](/docs/) starts one), one yes/no question is the smallest request there is:

```bash
curl http://127.0.0.1:8000/v1/systemone \
  -H 'Content-Type: application/json' \
  -d '{"state": "I was charged twice for October. Please refund one.", "questions": {"urgent": {"type": "noul"}}}'
# {"model": "...", "answers": {"urgent": {"type": "noul", "noul": ...}}, "usage": {"input_tokens": ..., "output_tokens": ...}}
```

:::glossary

| Word | Meaning |
| --- | --- |
| state | the text the questions are about |
| base | the model a server serves, chosen with `--base` |
| System One | TypeSafe's wire format for typed questions, which a decisio server speaks |

:::

<!-- Site-written questions; every answer is either a pointer or a section of the pinned decisio release. -->

## What does it do?

::upstream{file="README.md" section="How it works"}

## Is it affiliated with TypeSafe?

No.
It is an independent open-source project, not affiliated with or endorsed by TypeSafe, and Jev is TypeSafe's product name.
It serves TypeSafe's published System One wire format, so a System One client can be pointed at it: see [Migrating a System One client](/docs/migrating/).

## Which base should I choose?

[Choosing a base](/docs/bases/) compares the three, with each base's provenance and what drives the choice.

## What hardware do I need?

::upstream{file="README.md" section="Install and run" part="intro"}

## Can it reason, or answer knowledge questions as a chat model does?

Each question is one forward pass with no text generated, so nothing is worked out step by step.
[How it compares](/benchmarks/#compares) shows what that costs on hard knowledge questions, and [the Pong demo](/demos/#pong) shows it in a game.

## Are the benchmark figures board scores?

No: they are self-runs with the public harnesses, not board scores.
[Benchmarks](/benchmarks/) names the record behind every figure, and the [evaluation card](/docs/evaluation-card/) says what was fitted on what.

## Does it learn from my requests?

::upstream{file="README.md" section="Teach it your question"}

## Do repeated requests return the same answer?

::upstream{file="docs/cli.md" section="Determinism"}

## Where does my data go?

The server runs where you start it and listens on `127.0.0.1:8000` unless `--host` and `--port` say otherwise.

::upstream{file="SECURITY.md" section="Deployment notes"}

## How do I report a security problem?

::upstream{file="SECURITY.md" section="Reporting a vulnerability"}

## What is the licence?

::upstream{file="README.md" section="Licence"}

## How can I contribute?

::upstream{file="README.md" section="Contributing"}

## What next

- [Get started](/docs/): start a server and ask a first question.
- [Troubleshoot](/docs/troubleshooting/): what you see, why, and what to do.
- [Limits](/docs/limits/): what the numbers do not say.
