---
title: System One clients
description: Point a System One client you already have at this server; what stays the same, and what to know.
---

<!-- Site-written: the figure, the headings and the links. The text is decisio's docs/migrating.md at the pinned release. -->

::upstream{file="docs/migrating.md" part="intro"}

::figure{name="one-line-change"}

## TL;DR

::upstream{file="docs/migrating.md" section="Point the client at the server"}

:::glossary

| Word | Meaning |
| --- | --- |
| System One | TypeSafe's wire format for typed questions about a state, which a decisio server speaks on `POST /v1/systemone` |
| served name | the model name `GET /v1/models` lists; `decisio-gemma-4-31b-it-letters` for the default base |
| base URL | the address a client sends its requests to |

:::

:::caution[Common mistake]
Leaving the client on the SDK's default model name works, because the `model` field does not choose the model, but the answer then echoes that name back.
Set the model to the served name, and read `GET /health` when you need to know what answered.
:::

## The differences that matter

::upstream{file="docs/migrating.md" section="The differences that matter"}

## What next

- [Frameworks](/docs/use-from/frameworks/): the integrations that were checked against a server.
- [The HTTP API](/docs/api/): every route, request field and response field.
- [Teaching it a task](/docs/tasks/): what a decisio server adds, learned from your own examples.
