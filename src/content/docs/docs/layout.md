---
title: Choose the prompt layout
description: Choose whether a request's questions come before its text, as on the Gemma models, or after it, so a text stays cached across a series of questions.
---

<!-- Site-written: the Choose the prompt layout guide. Its facts are decisio's docs/running.md ("The header layout"), docs/upgrading.md, docs/cli.md, docs/api.md and EVAL_CARD.md at the pinned release (src/config/sourced.mjs checks them). The 31B's figures are decisio's A/B on one RTX PRO 6000 and the 12B's its pre-registered A/B on one RTX 5090, as running.md states them. No board is named or linked; the public sample is described, not named. -->

::covers{links="docs/running.md#a-question-list-for-the-header-header_questions=how-do-you-keep-the-header-for-a-series-of-questions docs/running.md#the-header-layout---layout docs/running.md#a-layout-per-request-layout=when-should-you-ask-for-plain docs/running.md#read-twice---read-twice-under-n---read-twice-max-questions-r=how-do-you-read-short-requests-twice docs/running.md#read-twice---read-twice-under-n---read-twice-max-questions-r-for-decision-index-runs=how-do-you-read-short-requests-twice"}

On the Gemma models the prompt lists every question of the request, then the text, then the question being answered.
The model reads the text knowing what will be asked, and the 31B answered more accurately that way on most of what was measured.
The Qwen model keeps the plain layout, the text then the question.

::figure{name="request-layout"}

Each request can choose its layout, so one server serves both kinds of client.

| Layout | The prompt | The server's default on | Choose it for |
| --- | --- | --- | --- |
| `header` | the request's questions, then the text, then the question | Gemma 4 31B, Gemma 4 12B and the 12B in FP8 | a request that brings all its questions at once, and each text asked about once |
| `plain` | the text, then the question | Qwen3.6-35B-A3B, and a Gemma server that holds tasks taught on plain | a series of different questions about one text, and tasks or adapters fitted on plain |

This reads the layout your server gives a request that names none, and why:

::site-block{name="layout-health"}

The CPU stand-in serves the Qwen model, so it says `plain`; a Gemma server with nothing taught says `header`.

<span class="fp-anchor" id="1-know-what-the-header-changes"></span>

## What does the header change?

Answers change.
On the 31B, against the plain layout, on the same items:

| Set | Plain | Header | Header minus plain (95% interval) |
| --- | ---: | ---: | --- |
| A public multi-domain sample, 2,000 rows | 55.41 | 60.44 | +5.03 [2.87, 6.94] |
| H776, one question per request | 80.67 | 85.05 | +4.38 [2.32, 6.44] |
| hard390 | 52.31 | 59.74 | +7.44 [3.08, 11.79] |
| dev500 | 67.40 | 67.00 | -0.40 [-3.0, 2.2] |

::source[Measured by decisio on one RTX PRO 6000, the 31B in FP8 on load, on the build documented at release, as decisio 0.26.0's docs/running.md states it. The multi-domain sample is scored by its own kit; H776, hard390 and dev500 are decisio's own proxy sets.]

- **On the 12B the gain was smaller.** It was +3.84 on the multi-domain sample, mostly in requests that ask many questions about one text, +3.60 on dev500 and +0.90 on H776, which is within noise. Weighting each of the sample's 41 families equally, it was +1.75 with an interval of [-0.77, 4.50], which crosses 0.
- **The header costs tokens.** Single questions read 3 to 10% more input tokens, counted in `usage.input_tokens`, and the 31B's median latency rose by 1 to 10%.
- **Many questions per request read it on every question.** On the multi-domain sample the 31B's mean latency was 542 ms against 303.

::source[The 12B: decisio's pre-registered A/B on one RTX 5090, the 12B in FP8, decisio 0.25.0's readout, one request at a time, as decisio 0.26.0's docs/running.md states it.]

These are our proxies and a public sample, on one card per model: measure on your own traffic, and keep `plain` where the header does not help.
What the figures were not measured on is on [What was measured on what](/docs/measured/#what-was-not-tested).

<span class="fp-anchor" id="2-ask-for-plain-for-a-series-of-questions-about-one-text"></span>

## When should you ask for plain?

Under the header, a text read for one set of questions is not reused for another.
Two requests about the same text with different questions share only what comes before their first difference, so the second reads the text again.
On the 31B a later question about a 3,000-token text costs 485 ms instead of 41, and at 16,000 tokens 3,370 ms instead of 94.

An agent, a game or a teaching loop that sends one text with a series of different questions asks for the plain layout on its requests:

```bash
curl -s http://127.0.0.1:8000/v1/systemone \
  -H 'Content-Type: application/json' \
  -d '{
  "state": "Both charges are 49.00 EUR, same day. Please refund one.",
  "questions": {"urgent": {"type": "noul"}},
  "layout": "plain"
}'
```

- **`"layout"` is `"plain"` or `"header"`,** on `/v1/systemone`. Absent or `null`, the request gets the server's layout; any other value is a 422.
- **The request is built token for token** as a server started with that `--layout` builds it, and `x-decisio-prompt` says which layout was read.
- **On the tuned 12B a later, different question about the same text took 177 to 185 ms under plain** and 434 to 436 ms under the header, which reads the text again. A repeated request took about 147 ms against about 391 ms for the first read, in either layout.
- **What plain gives up is the header's gain in the answers,** not their speed: the tables above.
- **The two layouts share no cached text.** A client that switches layouts about one text reads it again on each change.

::source[The tuned 12B's times: decisio 0.43.0's release notes, measured on one RTX PRO 5000. The 31B's: decisio's docs/running.md, "First-question latency by state length".]

To serve plain to every request that names none, start the server with `--layout plain`:

::site-block{name="layout-start"}

<span class="fp-anchor" id="a-question-list-for-the-header-header_questions"></span>

## How do you keep the header for a series of questions?

Under the header layout a separate request about an already-read state reads the whole state again, unless every request about the state declares the same list.
The header lists the request's own questions, so a client that asks one question at a time sends a different header each time.
On the 12B on a Mac, a follow-up about a state already read took 3,470 to 3,752 ms under the header layout and 195 ms under the plain one.

A client that knows the questions it will ask about a state sends them all, as `"header_questions": ["<instructions>", ...]`, on every request about that state, whichever of them the request asks.
The requests then share the header and the state, so the first one reads the state and the others read it from the cache.

- **Send the same list, in the same order, every time:** another list or another order is another header and a new read of the state.
- **Every question of the request must be in the list,** or the request is a 422.
- **Under the plain layout the field has no effect,** so a client may send it to servers of either layout.
- **A request that reads a state again says so** in the `x-decisio-note` response header, and `/health` counts the rereads under `systemone.header_layout`.
- **Its accuracy is not measured yet:** the header's gains above were measured with the header listing the questions the request asks, so measure on your own traffic before relying on the gain.

## When should you keep the header?

- **Asking every question in one request** reads the text once on either layout ([Scale](/docs/scale/)).
- **A workload that asks the same questions of many texts,** or one question per text, loses nothing under the header.
- **Every response says what its prompt cost**, in `x-decisio-prompt: layout=header; tokens=1523; cached=1440`: the mean prompt tokens the engine read per question, and the mean of them the cache served. A low `cached` under the header means a text was read again for a new set of questions.

<span class="fp-anchor" id="3-know-what-holds-a-server-at-plain"></span>

## What decides the server's default?

For a request that names no layout, the server decides the layout once, at start:

1. **`--layout plain` or `--layout header`**, when given, wins.
2. **A tuned model or an adapter** is served on the layout it records, and on plain when it records none.
3. **Otherwise the model's default:** header for the Gemma models, plain for Qwen.
4. **A header default is held at plain** while tasks fitted under plain apply to the server, from a directory, a shared store or a file.

So an upgrade changes nothing that was taught.
The start prints `LAYOUT plain (held at plain; this base's default is header): ...`, and `/health` gives the reason under `systemone.layout`.

Requests may ask for the header meanwhile, with `"layout": "header"`.
To make the header the default, export the tasks if you want the records, register them again with `"layout": "header"`, start with `--layout header`, and measure.
What each layout keeps, and what happens when a long header does not fit, are on [Requirements and limits](/docs/limits/#what-is-kept-for-each-prompt-layout).

<span class="fp-anchor" id="6-read-short-requests-twice"></span>

## How do you read short requests twice?

`--read-twice-under N` repeats a short request's input before answering.
It is off by default and costs more input tokens; measure whether it helps your own labelled task before enabling it.

Use `--read-twice-max-questions R` to keep requests with many questions at one read.
A changed read-twice setting changes the setup a task or certificate covers, so register and certify again under the setting you serve.

## Certify under the layout your clients send

<span class="fp-anchor" id="6-certify-under-the-layout-your-clients-send"></span>

A task is fitted under one layout and certifies only that layout's requests.
One server holds tasks of both layouts, each answering its own layout's requests.

- **Name the layout when you register,** with `"layout": "plain"` or `"layout": "header"`; without it, the task takes the server's. An example whose request names the other layout is refused with a 422.
- **A question of the task asked under the other layout** gets decisio's own read, with `certified: false` and `certified_reason: "layout_mismatch"`, and the traffic monitor does not count it.
- **To certify both kinds of client, register the question under each layout.** That makes two tasks, each serving its own layout's requests, and neither replaces the other; removing one leaves the other.
- **A certificate is checked against its own layout's serving setup,** so a header task certified on a header server stays certified for header requests on a plain server that is otherwise the same.
- **`POST /v1/tasks/{id}/certify` certifies again under the task's own layout,** and tasks of both layouts load from `--tasks-dir`, `--task-store`, `--tasks-file` and the import routes.

## What next

- [Scale](/docs/scale/): every question about a text in one request, and the first read.
- [Certify answers](/docs/tasks/certify/): the promise a certificate makes.
- [Teach a task](/docs/tasks/): tasks are fitted under a layout, the server's unless the registration names one.
- [Requirements and limits](/docs/limits/#what-is-kept-for-each-prompt-layout): what each layout keeps, and when the header does not fit.
- [Server flags](/docs/flags/#every-flag): `--layout` and `--temperatures-file` in full.
