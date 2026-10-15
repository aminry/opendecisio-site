---
title: JavaScript and TypeScript
description: Call a server from Node with fetch, in JavaScript or TypeScript, with no package.
---

<!-- Site-written. The request and its recorded answer are the first record of decisio-examples' support-routing run (the launch facts (launch_facts.public.json)); the timeouts are from the integration records of decisio-examples at the commit the launch facts name. -->

A server is a JSON API, and `fetch` is built into Node 22, so JavaScript needs no package either.
The same script is shown in TypeScript, with the shape of an answer typed.

::figure{name="client-js"}

## TL;DR

With a server running ([Get started](/docs/) starts one), this sends the recorded support ticket and prints each question's likeliest option:

:::tabs

::tab{label="JavaScript"}

Save it as `ask.mjs` and run `node ask.mjs`.

::site-block{name="js-fetch"}

The comment lines show what the measured system answered (recorded; the stand-in prints other numbers).

::recorded-label{shows="printed"}

::tab{label="TypeScript"}

Save it as `ask.ts` and run `node --experimental-strip-types ask.ts`; section 2 says what it adds.

::site-block{name="ts-fetch"}

:::

:::glossary

| Word | Meaning |
| --- | --- |
| `noul` | a yes/no question; its answer is the probability of yes |
| `probabilities` | a probability for each option of a choice, or each level of a score; they add up to 1 |
| top-level `await` | `await` outside a function, which a `.mjs` file allows |

:::

## 1. With fetch

The script posts the body as JSON and reads `answers`, which holds one answer per question under the name you gave it.
Check `response.ok` before reading: a request the server cannot read is answered with 422, and one the engine cannot answer with 400, each with a `detail` in the body.

:::caution[Common mistake]
`fetch` has no timeout of its own: Node's applies its HTTP client's defaults, 300 seconds to the response headers.
Pass `signal: AbortSignal.timeout(ms)` if you want an earlier stop, and allow for the first request after a start, which warms the engine.
:::

## 2. In TypeScript

The TL;DR's second tab adds types for the parts of the answer the script reads, and nothing else.
Node 22 runs that file by stripping the types (`node --experimental-strip-types ask.ts`).

## 3. Where to run it

The server has no authentication: the `Authorization` header and any API key are accepted and ignored.
Call it from code you run, a backend or a script, with the server on `127.0.0.1` or behind a reverse proxy that authenticates.

## What next

- [Python](/docs/use-from/python/): the same call from Python.
- [Frameworks](/docs/use-from/frameworks/): the JavaScript integrations that were checked.
- [The HTTP API](/docs/api/): every route, request field and response field.
