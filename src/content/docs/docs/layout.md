---
title: Choose the prompt layout
description: The Gemma models list a request's questions before its text, which answered more accurately on most of what was measured; keep the plain layout for a series of questions about one text.
---

<!-- Site-written: the Choose the prompt layout guide. Its facts are decisio's docs/running.md ("The header layout"), docs/upgrading.md, docs/cli.md, docs/api.md and EVAL_CARD.md at the pinned release (src/config/sourced.mjs checks them). The 31B's figures are decisio's A/B on one RTX PRO 6000 and the 12B's its pre-registered A/B on one RTX 5090, as running.md states them. No board is named or linked; the public sample is described, not named. -->

::covers{links="docs/running.md#the-header-layout---layout docs/running.md#refitting-the-bases-temperatures-for-a-layout=4-know-what-is-kept-per-layout docs/running.md#a-header-over-the-context---header-limit=7-know-what-happens-when-the-header-does-not-fit docs/running.md#read-twice---read-twice-under-n---read-twice-max-questions-r=6-read-short-requests-twice docs/running.md#read-twice---read-twice-under-n---read-twice-max-questions-r-for-decision-index-runs=6-read-short-requests-twice"}

On the Gemma models the prompt lists every question of the request, then the text, then the question being answered.
The model reads the text knowing what will be asked, and the 31B answered more accurately that way on most of what was measured.
The Qwen model keeps the plain layout, the text then the question.

| Layout | The prompt | Served by default on | Choose it for |
| --- | --- | --- | --- |
| `header` | the request's questions, then the text, then the question | Gemma 4 31B, Gemma 4 12B and the 12B in FP8 | most traffic: one or many questions per text, each text asked about once |
| `plain` | the text, then the question | Qwen3.6-35B-A3B, and a server that holds something taught on plain | a series of different questions about one text, and tasks or adapters fitted on plain |

This reads the layout your server serves, and why:

::site-block{name="layout-health"}

The CPU stand-in serves the Qwen model, so it says `plain`; a Gemma server with nothing taught says `header`.

## 1. Know what the header changes

Answers change.
On the 31B, against the plain layout, on the same items:

| Set | Plain | Header | Header minus plain (95% interval) |
| --- | ---: | ---: | --- |
| A public multi-domain sample, 2,000 rows | 55.41 | 60.44 | +5.03 [2.87, 6.94] |
| H776, one question per request | 80.67 | 85.05 | +4.38 [2.32, 6.44] |
| hard390 | 52.31 | 59.74 | +7.44 [3.08, 11.79] |
| dev500 | 67.40 | 67.00 | -0.40 [-3.0, 2.2] |

::source[Measured by decisio on one RTX PRO 6000, the 31B in FP8 on load, on the commit that added the header layout, as decisio 0.26.0's docs/running.md states it. The multi-domain sample is scored by its own kit; H776, hard390 and dev500 are decisio's own proxy sets.]

- **On the 12B the gain was smaller.** It was +3.84 on the multi-domain sample, mostly in requests that ask many questions about one text, +3.60 on dev500 and +0.90 on H776, which is within noise. Weighting each of the sample's 41 families equally, it was +1.75 with an interval of [-0.77, 4.50], which crosses 0.
- **The header costs tokens.** Single questions read 3 to 10% more input tokens, counted in `usage.input_tokens`, and the 31B's median latency rose by 1 to 10%.
- **Many questions per request read it on every question.** On the multi-domain sample the 31B's mean latency was 542 ms against 303.

::source[The 12B: decisio's pre-registered A/B on one RTX 5090, the 12B in FP8, decisio 0.25.0's readout, one request at a time, as decisio 0.26.0's docs/running.md states it.]

These are our proxies and a public sample, on one card per model: measure on your own traffic, and keep `plain` where the header does not help.

## 2. Keep plain for a series of questions about one text

Under the header, a text read for one set of questions is not reused for another.
Two requests about the same text with different questions share only what comes before their first difference, so the second reads the text again.
On the 31B a later question about a 3,000-token text costs 485 ms instead of 41, and at 16,000 tokens 3,370 ms instead of 94.

An agent, a game or a teaching loop that sends one text with a series of different questions wants the plain layout:

::site-block{name="layout-start"}

- **Asking every question in one request** reads the text once on either layout ([Scale](/docs/scale/)).
- **A workload that asks the same questions of many texts,** or one question per text, loses nothing under the header.
- **Every response says what its prompt cost**, in `x-decisio-prompt: layout=header; tokens=1523; cached=1440`: the mean prompt tokens the engine read per question, and the mean of them the cache served. A low `cached` under the header means a text was read again for a new set of questions.

## 3. Know what holds a server at plain

The server decides its layout once, at start, and never per request:

1. **`--layout plain` or `--layout header`**, when given, wins.
2. **A tuned model or an adapter** is served on the layout it records, and on plain when it records none.
3. **Otherwise the model's default:** header for the Gemma models, plain for Qwen.
4. **A header default is held at plain** while tasks fitted under plain apply to the server, from a directory, a shared store or a file.

So an upgrade changes nothing that was taught.
The start prints `LAYOUT plain (held at plain; this base's default is header): ...`, and `/health` gives the reason under `systemone.layout`.
To move a taught deployment to the header, export its tasks if you want the records, register them again under `--layout header`, and measure.

## 4. Know what is kept per layout

- **Tasks and certificates.** A task registered, and a certificate made, under one layout is not applied under the other.
- **A task's examples.** A task is fitted one question at a time, so a request with several questions reads a longer header than the task was fitted on.
- **Images.** A request with images is read on the plain layout.
- **Temperatures.** The models' temperatures were fitted on the plain layout; `--temperatures-file` serves ones you refit, from your own labelled reads under the layout you serve.

## 5. Know what was not measured

- **Fine-tuned adapters under the header.** That is why an adapter that records no layout is served plain.
- **A layout per request.** A request cannot choose its layout yet; one server serves one.
- **Other engines.** Only the vLLM engine was tested with the header; the HF and MLX engines build the same prompt.
- **The Evaluation card.** Its figures were measured on the plain layout.

## 6. Read short requests twice

`--read-twice-under N` writes each question's prompt twice when a request is short, the second copy after `Read the same input again before answering:`, for more accuracy at more tokens.
It is off by default.

- **Short** means at most N counted input tokens read once: the header, the text and each question's own text, as `usage.input_tokens` counts them.
- **`--read-twice-max-questions R`** reads a request with more than R questions once, because a doubled request costs more with every question. Set R from a timing run on your card: the largest question count whose doubled request stays under about 900 ms.
- **On the 31B with the header,** N = 2,000 gained 1.8 points on the public multi-domain sample, at about 1.5 times the tokens and an estimated p80 of about 866 ms; that threshold was checked on the sample itself. On our proxies it gained 3.24, the smallest threshold within 0.25 points of the best.
- **On the 12B in FP8** it added nothing within noise.
- **It costs tokens:** short requests read up to about twice the input tokens, and `usage.input_tokens` counts both copies, so it is off by default.
- **Tasks and certificates are per setting:** a task registered under one N and R is not applied under another.

::source[Measured by decisio on one RTX PRO 6000, the 31B with the header layout, as decisio 0.27.0's docs/running.md states it.]

## 7. Know what happens when the header does not fit

A request with many questions and long instructions can make the header longer than the context.
Such a request is answered, not refused: the server lists as many of its questions as fit, in the request's order, and none when no line fits, which is the plain layout's prompt.

- **A request whose prompts fit is not touched.**
- **The response says what was listed:** `header_limited` in the body and the `x-decisio-layout` header, and `usage.input_tokens` counts the header that was read.
- **A certified task's answer in such a request is not certified** (`header_limited`).
- **What a shorter header costs the answers is not measured:** where an answer matters, compare it with `--layout plain`.
- **`--header-limit off`** refuses such a request with a 422 instead, and a number caps the header's tokens.

## What next

- [Scale](/docs/scale/): every question about a text in one request, and the first read.
- [Teach a task](/docs/tasks/): tasks are fitted under the layout the server serves.
- [Server flags](/docs/flags/#every-flag): `--layout` and `--temperatures-file` in full.
- [Release notes](/docs/releases/): who an upgrade affects, and what to do.
