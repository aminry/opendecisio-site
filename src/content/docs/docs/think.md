---
title: Think when unsure
description: Have the server read an unsure question again after the model writes its reasoning, and spend the extra time only on those questions.
---

<!-- Site-written: the Think when unsure guide. Its facts are decisio's docs/running.md ("Thinking when unsure"), docs/cli.md, docs/api.md and docs/tasks.md at the pinned release (src/config/sourced.mjs checks them); its commands are decisio's (src/lib/site-blocks.mjs). No accuracy or time figure for thinking is published yet, so the page gives none. -->

::covers{links="docs/running.md#thinking-when-unsure"}

The questions decisio is unsure of are the ones a single read most often gets wrong.
With thinking on, each of them is read again after the served model writes its reasoning, to get more of them right.
The extra time goes to those questions only: a sure question is still answered from one read, in milliseconds.

::figure{name="think-flow"}

It follows the procedure of [Chon](https://github.com/xoai/chon) (Apache-2.0).
No measurement of its accuracy or its time is published yet.

## 1. Turn it on

Start the server with `--think`:

::site-block{name="think-start"}

- Thinking is off by default, on every base: a request is one read, as fast and as repeatable as before.
- `--no-think` turns it off, including when a tuned model's repository turns it on in its `defaults.think`.
- A request decides for itself with `"think": true` or `"think": false`; without the field, the server's setting applies.

## 2. Ask with it

::site-block{name="think-ask"}

- A question thinks when its top probability is under its type's threshold: 0.75 for a choice, 0.92 for yes/no, 0.70 for a score.
- `--think-factor` scales the three thresholds, 1 by default; a lower factor thinks on fewer questions.
- `--think-budget` caps the reasoning at 512 tokens per question by default, from 16 to 4,096. It is set on the server only.
- All the unsure questions of a request go to the model in one call.

## 3. Read what it did

- `thinking` in the response says how many questions thought, the reasoning tokens and the time, and for each question whether it thought, or why not.
- `usage.thinking_tokens` counts the reasoning tokens, and `usage.output_tokens` includes them.
- The headers `x-decisio-think-ms` and `x-decisio-think-tokens` carry the time and the tokens.
- A question whose reasoning comes back unusable is answered from its one read, marked `thinking: unavailable` with the reason; the request does not fail.

The server's setting, and how many questions have thought, are in `/health`:

::site-block{name="think-health"}

## 4. Know what stays at one read

- A question with more than 16 options.
- A question a registered task answers: its correction and certificate were fitted on one read.
- Every question of a request with images, an abstention option or two orders.

The response says why a question did not think.
Where it runs, how it shares the server and what it does to certificates are in [Requirements and limits](/docs/limits/#3-set-up-for-production).

## What next

- [Requirements and limits](/docs/limits/#3-set-up-for-production): thinking in production.
- [Server flags](/docs/flags/#every-flag): `--think`, `--think-factor` and `--think-budget` in full.
- [The HTTP API](/docs/api/): the `think` field and the `thinking` answer.
