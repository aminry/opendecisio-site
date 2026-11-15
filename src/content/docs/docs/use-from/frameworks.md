---
title: Call it from a framework
description: Point LangChain, the Vercel AI SDK, n8n, TanStack AI or Pipecat at decisio and get a probability for every option. Each program below was checked against a running server.
---

<!-- Site-written: the former Use a framework section of Call it from your code. The frameworks' facts are src/data/integrations.json, and their programs are decisio's docs/integrations.md at the pinned release. -->

Pick your framework below, set its base URL, and run the program.
Each one asks two questions about one ticket and prints the answers.
For plain HTTP, see [Call it from your code](/docs/use-from/).

:::tabs

::tab{label="LangChain"}

::upstream{file="docs/integrations.md" section="LangChain"}

::tab{label="Vercel AI SDK"}

::upstream{file="docs/integrations.md" section="Vercel AI SDK"}

::tab{label="n8n"}

::upstream{file="docs/integrations.md" section="n8n"}

::tab{label="TanStack AI"}

::upstream{file="docs/integrations.md" section="TanStack AI"}

::tab{label="Pipecat"}

::upstream{file="docs/integrations.md" section="Pipecat"}

:::

## What was checked

Five frameworks that speak TypeSafe's format work with decisio once they point at the server.
Each was checked against a running server, and every check passed.

::integrations-table

- Every one needs an API key; any string works.
- Only the Vercel AI SDK wants `/v1` at the end of the base URL; the others add it themselves.
- Tasks and certified answers are decisio's own routes: none of these frameworks calls them, so call those routes directly.

## What next

- [Call it from your code](/docs/use-from/): the same request from curl, Python, JavaScript and TypeScript.
- [Teach a task](/docs/tasks/): the task and certificate routes these frameworks do not call.
- [The HTTP API](/docs/api/): every route, request field and response field.
