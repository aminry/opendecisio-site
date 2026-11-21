---
title: Exact arithmetic
description: Let decisio compute the line values of a bill, payslip or claim, and the facts of dates and times, exactly and show them to the model, so it checks the numbers instead of computing them.
---

<!-- Site-written: the Exact arithmetic guide. Its facts are decisio's docs/calculator.md, docs/running.md ("Exact arithmetic support") and docs/api.md at the pinned release (src/config/sourced.mjs checks them); the block below is decisio's own. No accuracy figure is published for it. -->

::covers{links="docs/calculator.md docs/calculator.md#what-the-response-says=what-does-the-response-say docs/running.md#exact-arithmetic-support---calculator docs/calculator.md#dates-and-times-time-v1=which-dates-and-times-does-it-read docs/calculator.md#the-cascade-reader=how-does-the-cascade-reader-read-more docs/calculator.md#from-the-models-repository=how-is-the-cascade-reader-turned-on"}

A decision often depends on numbers in the text: is this invoice's total right, does this payslip match its rules, is this claim within the limit.
A model reading in one pass is good at checking values it can see and poor at computing exact totals from many lines.
decisio's calculator computes the line values exactly and shows them to the model in a fixed block after the state, so the model checks the values instead of computing them, in the same single read.

This is the block the model sees after the state:

::upstream{file="docs/calculator.md" section="What the model sees" block="1"}

The block never states the final figure, a verdict, or whether a claim is right: the decision stays the model's.

## Which models use it?

<span class="fp-anchor" id="turning-it-on"></span>

It is opt-in per model: the server shows the block only to a model trained with it.

- **The model records it.** A tuned repository records the block format its model was trained with in `decision_config.json`, as `defaults.calculator: "calc-v1"`. A base and any model that records nothing never see the block.
- **Decisio v3 records it,** so the server adds the exact values for bills, invoices, payslips and dates with no flag. Its first start also downloads the calculator's small tagger.

## How do you turn it on or off?

- **The server:** `--calculator auto` (the default) shows the block when the model records it; `--calculator off` never does. The start prints `CALCULATOR calc-v1 (the repository's defaults)` when it is on.
- **A request:** `"calculator": false` reads the state without the block, and then no registered task applies to that request. `"calculator": true` asks for it; on a model that records no format the request is answered without the block, with `x-decisio-warning` saying so.
- **The amounts:** `"calculator_input"` sends the amounts instead of having them read from the text (below).

## What does it read?

The calculator reads structure, not item names: lines such as `Label: 4 items at $12.50 each`, a table of items, or a JSON object's fields, plus the rule sentences that combine them.

- **Items:** a quantity at a price; durations at an hourly rate; lengths at a rate; a quantity converted with a factor the text states; per-day charges and day credits over a date range; fees and credits.
- **Rules:** a percentage added to or taken off one named item before tax; the tax rule; when a credit comes off; a definition of the figure asked about.
- **One currency, one record, English (v1).**

## When does it show nothing?

**All or nothing.** Every line with a number has to be understood.
If anything is uncertain, such as a sentence with a number or a rule word that matches no rule kind, an amount nothing places, two currencies or two records, there is no block at all and the response says why.

A missing block is the safe failure; a wrong number is the one failure the calculator is built never to make.

Counts that carry a multiplier or a number word (`2 dozen eggs at $3.00 each`, `2 packs of six`), and a unit factor that joins two kinds of unit (`1 lb = 0.4536 m`), give no block too.

## Which dates and times does it read?

A second block, `time-v1`, writes the facts a model would otherwise work out from dates and clock times.
It suits rotas, travel logs, shipment and incident timelines, warranty and notice periods.
The block holds facts, never an answer, and is written only where every value is certain.

::upstream{file="docs/calculator.md" section="Dates and times: time-v1" block="1"}

- **Four kinds of line:** a dated zoned time in UTC, the real time between two dated zoned times, a date plus N days, weeks, months or years, and a month end that does not exist.
- **Zones:** an abbreviation with one meaning (CEST, EDT, JST), a UTC offset, or a major city ("Chicago time"), with that zone's clock changes on the stated date.
- **Two readings give no line:** an abbreviation with several meanings (CST, IST), a city time without its date, or a date without a year when the text names several years.
- **A model records it** as `time-v1`, or `calc-v1+time-v1` for both blocks.

## How does the cascade reader read more?

The cascade reader may show a block for wordings and layouts the rule reader has no rule for.
A small role tagger marks the role of each number in the text, and the same code renders the block, so its format does not change.

- **Precision gates:** every number marked, every value from the text and units that agree; then the rule reader gives the same block (`rules_agree`), the text's own figures are reproduced (`stated_figures`), or every tagger decision clears its threshold (`threshold`).
- **Never less than the rule reader:** where the tagger gives no block, the rule reader's block stands (`rules_only`); where the two give different blocks, there is no block.
- **A tagger failure is no block,** never a failed request.

## How is the cascade reader turned on?

- **By the model's repository:** a tuned model can turn the cascade reader on by itself, with its tagger pinned by commit and its thresholds written in the repository. Decisio v3 does, so `--base` alone serves it.
- **By flag:** `--calculator-reader cascade` with `--calculator-tagger`. A reader flag beats the repository, and `--calculator-reader rules` turns it off.
- **Where it runs:** on the serving card on vLLM with CUDA, and on the CPU on a Mac, where it adds tens of milliseconds to each request whose state it reads.
- **If the tagger cannot be loaded,** the server still starts, reads with the rule reader, and says why in its start line and in `/health`.

## How do you send the amounts yourself?

A client that already holds structured amounts can send them, and gets the same block with no reading of the text:

::upstream{file="docs/calculator.md" section="Sending the amounts: calculator_input" block="1"}

- **Item kinds:** `count`, `days`, `time`, `length`, `convert` (with the stated factor) and `daycredit`.
- **Numbers** are JSON integers or decimal strings; a JSON float is refused, since it is not exact. Unknown fields are refused, and labels must be unique.
- **Validation is strict and all or nothing:** an invalid or inconsistent field is a 422 naming its path, on any server.

## What does the response say?

- **`x-decisio-calculator`:** `shown; lines=9; version=calc-v1`, or `none; reason=<reason>`, for example `unparsed-rule`, `ambiguous-label`, `off-by-request`, `not-trained` or `over-limit`. With the cascade reader it names the path of a shown block: `shown; lines=9; version=calc-v1; path=threshold`.
- **`usage.input_tokens`** counts the block.
- **`/health`** reports `systemone.calculator` when the server shows the block: its version and how many requests it read, showed a block for or took amounts for. No state text is logged.

## What does it not cover?

- **A request never fails because of it:** a block that would push the row over the engine's prompt ceiling is left out (`none; reason=over-limit`).
- **Not with images or `--mode packed`,** and not on other runtimes: an Ollama listing does not run decisio's server.
- **Tasks and certificates** carry the format when the block is on, so a task registered or a certificate made on reads with the block applies only where the block is shown. A certificate made with one reader is suspended under the other: certify again after you switch.

## What next

- [Server flags](/docs/flags/): `--calculator` in full.
- [The HTTP API](/docs/api/): the `calculator` and `calculator_input` fields and the response headers.
- [Serve Decisio v3](/docs/deploy/tuned-12b/): the repositories that record the calculator.
