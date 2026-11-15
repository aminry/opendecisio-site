---
title: Think when unsure
description: Get more of the unsure questions right by letting the model reason before it answers, with the extra time spent on those questions only.
---

<!-- Site-written: the Think when unsure guide. Its facts are decisio's docs/running.md ("Thinking when unsure"), docs/cli.md, docs/api.md and docs/tasks.md at the pinned release (src/config/sourced.mjs checks them); its commands are decisio's (src/lib/site-blocks.mjs). No accuracy or time figure for thinking is published yet, so the page gives none. -->

::covers{links="docs/running.md#thinking-when-unsure"}

The questions decisio is unsure of are the ones a single read most often gets wrong.
With thinking on, each of them is read again after the served model writes its reasoning, to get more of them right.
The extra time goes to those questions only: a sure question is still answered from one read, in milliseconds.

::figure{name="think-flow"}

It follows the procedure of [Chon](https://github.com/xoai/chon) (Apache-2.0).
No measurement of its accuracy or its time is published yet.

## TL;DR

Start the server with `--think`, then ask as before:

::site-block{name="think-start"}

::site-block{name="think-ask"}

<span class="fp-anchor" id="1-turn-it-on"></span>

## How do you turn it on?

- Thinking is off by default, on every base: a request is one read, as fast and as repeatable as before.
- `--no-think` turns it off, including when a tuned model's repository turns it on in its `defaults.think`.
- A request decides for itself with `"think": true` or `"think": false`; without the field, the server's setting applies.

<span class="fp-anchor" id="2-ask-with-it"></span>

## Which questions think?

- A question thinks when its top probability is under its type's threshold: 0.75 for a choice, 0.92 for yes/no, 0.70 for a score.
- `--think-factor` scales the three thresholds, 1 by default; a lower factor thinks on fewer questions.
- `--think-budget` caps the reasoning at 512 tokens per question by default, from 16 to 4,096. It is set on the server only.
- `--think-types choice,score` limits thinking to the named question types; without it, every type may think.
- All the unsure questions of a request go to the model in one call.

<span class="fp-anchor" id="3-read-what-it-did"></span>

## How do you read what it did?

- `thinking` in the response says how many questions thought, the reasoning tokens and the time, and for each question whether it thought, or why not.
- `usage.thinking_tokens` counts the reasoning tokens, and `usage.output_tokens` includes them.
- The headers `x-decisio-think-ms` and `x-decisio-think-tokens` carry the time and the tokens.
- A question whose reasoning comes back unusable is answered from its one read, marked `thinking: unavailable` with the reason; the request does not fail.

The server's setting, and how many questions have thought, are in `/health`:

::site-block{name="think-health"}

<span class="fp-anchor" id="4-give-thought-answers-their-own-temperature"></span>

## Can thought answers have their own temperature?

Prefer a tuned repository's supplied thought-answer temperatures when it provides them.
A type with no think temperature keeps the single-pass one, so a server without them answers as before.
Which questions think does not change: the unsure test still uses the single-pass temperature.

`/health` shows the selected temperatures under `systemone.think_temperatures`; a certificate made under other ones is suspended (`think_mode_changed`).
The [flags reference](/docs/flags/#temperatures-and-outputs) lists per-type overrides for deployments that fit their own settings.

<span class="fp-anchor" id="5-know-what-stays-at-one-read"></span>

## What stays at one read?

- A question with more than 16 options.
- A question a registered task answers: its correction and certificate were fitted on one read.
- Every question of a request with images, an abstention option or two orders.
- A question whose type is not in `--think-types`.
- Every question of a request whose text was cut to fit (`--over-limit truncate`): thinking on a text that long can take longer than a caller waits.

The response says why a question did not think.
Where it runs, how it shares the server and what it does to certificates are in [Set up for production](/docs/production/).

## What next

- [Set up for production](/docs/production/): thinking in production.
- [Server flags](/docs/flags/#every-flag): `--think`, `--think-factor`, `--think-budget` and the think temperatures in full.
- [The HTTP API](/docs/api/): the `think` field and the `thinking` answer.
