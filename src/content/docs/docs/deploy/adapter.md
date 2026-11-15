---
title: Serve your own adapter
description: Load a LoRA adapter you trained on the base, give it its own temperatures, check that the server serves it, and know what it does to certificates.
---

<!-- Site-written: the Serve your own adapter guide. Its facts are decisio's docs/running.md ("LoRA adapters"), docs/cli.md and docs/api.md at the pinned release (src/config/sourced.mjs checks them); its commands are decisio's (src/lib/site-blocks.mjs). -->

::covers{links="docs/running.md#a-default-adapter=answer-requests-that-name-no-adapter docs/running.md#lora-adapters docs/running.md#an-adapters-own-temperatures=give-it-its-own-temperatures docs/running.md#a-choice-temperature-by-the-number-of-options=give-it-its-own-temperatures docs/running.md#identity-and-the-fingerprint=what-does-an-adapter-do-to-certificates"}

Answer a question with your own fine-tuned adapter or with the base, on one server, by naming the adapter in the request.
You need a vLLM-format LoRA adapter trained on the base, its temperature file, and a GPU server.

Start the server with the adapter, then name it in the request:

::site-block{name="adapter-start"}

::site-block{name="adapter-ask"}

<span class="fp-anchor" id="1-load-the-adapter"></span>

## What does the start do?

Start the server with `--adapter name=path`, once per adapter, and the adapter's temperature file.

- The adapter is a vLLM-format LoRA adapter, served unmerged, on the text route, in separate mode.
- A Mac does not serve adapters.
- A request uses the adapter only when it names it; every other request is answered by the base.
- The server serves the [prompt layout](/docs/layout/) the adapter's file records, and plain when it records none: no adapter was measured under the header layout. Adapters that record different layouts cannot share a server.

<span class="fp-anchor" id="2-give-it-its-own-temperatures"></span>

## Give it its own temperatures

- Put the file beside the adapter's weights as `decisio_adapter.json`, or give it with `--adapter-temperatures name=file` when the adapter's folder is not yours to change.
- `temperatures` has one per type: `choice`, `noul` for yes/no, and `score`. A type the file does not list keeps the base's temperature.
- `choice_bands` is optional: keys `lo-hi`, within 2 to 255 and not overlapping. A choice question is served at its band's temperature; a count in no band is served at `temperatures.choice`, then at the base's.
- Yes/no and score questions are not banded.
- An adapter with no file is served at the base's temperatures, and the server says so when it starts.

The file is checked before the engine is built, and an unusable one stops the start.
This writes decisio's example file and has decisio check it, on any machine:

::site-block{name="adapter-check"}

<details>
<summary>Fit a temperature file when you need to create one</summary>

Use labelled readouts from the adapter under the layout you will serve:

::site-block{name="adapter-fit"}

Fit on items that are not a benchmark's: a temperature holds for the kind of items it was fitted on.
Fit on readouts taken under the layout you serve, and give `--layout` to the fit so the file records it.

</details>

<span class="fp-anchor" id="3-ask-with-it"></span>

## What comes back

The request above names the adapter in its `adapter` field.

- The answer carries `"adapter"` and the `x-decisio-adapter` header when the adapter answered.
- An unknown name is answered 404, with the adapters that are loaded.

<span class="fp-anchor" id="4-check-that-it-took"></span>

## Check that it took

::site-block{name="adapter-health"}

`/health` shows each adapter's temperatures in `adapter_temperatures`, and the hash of its weights and configuration in `adapter_identity`.

<span class="fp-anchor" id="6-answer-requests-that-name-no-adapter"></span>

## Answer requests that name no adapter

`--default-adapter NAME` makes a loaded adapter answer every request that names none, for a client that cannot send an `adapter` field.

- **A request with no `adapter` field** is answered by the default adapter at its own temperatures, and the response's `adapter` field says so.
- **A request that names another loaded adapter** gets that one, and `"adapter": "none"` gets the base model.
- **Tasks still read the base model:** ask a registered task's questions with `"adapter": "none"`.
- **The default is part of what a certificate covers:** `/health` shows it, and a certificate made under another default is suspended.

<span class="fp-anchor" id="5-know-what-it-does-to-certificates"></span>

## What does an adapter do to certificates?

Requests answered by an adapter are never certified.
A request combining an adapter with a question matched by a registered task is refused; use the base model for that task.

Loaded adapter settings are part of the serving setup recorded by a base task's certificate.
After loading, retraining or changing an adapter, certify affected base tasks again on the resulting setup.

## What next

- [Server flags](/docs/flags/#every-flag): `--adapter` and `--adapter-temperatures` in full.
- [The HTTP API](/docs/api/): the `adapter` field and its errors.
- [Certify answers](/docs/tasks/certify/): certify a task again on the new setup.
