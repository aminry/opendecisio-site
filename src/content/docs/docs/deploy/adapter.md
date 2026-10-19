---
title: Serve your own adapter
description: Load a LoRA adapter you trained on the base, give it its own temperatures, check that the server serves it, and know what it does to certificates.
---

<!-- Site-written: the Serve your own adapter guide. Its facts are decisio's docs/running.md ("LoRA adapters"), docs/cli.md and docs/api.md at the pinned release (src/config/sourced.mjs checks them); its commands are decisio's (src/lib/site-blocks.mjs). -->

::covers{links="docs/running.md#lora-adapters docs/running.md#an-adapters-own-temperatures=2-give-it-its-own-temperatures docs/running.md#a-choice-temperature-by-the-number-of-options=2-give-it-its-own-temperatures docs/running.md#identity-and-the-fingerprint=5-know-what-it-does-to-certificates"}

Serve a LoRA adapter you trained on the base, and ask each question with it or without it.
An adapter changes the scale of the model's readout, so it carries its own temperatures: one per question type, and for choice questions one per band of option count.
This writes decisio's example file and has decisio check it, on any machine:

::site-block{name="adapter-check"}

## 1. Load the adapter

Start the server with `--adapter name=path`, once per adapter, and the adapter's temperature file:

::site-block{name="adapter-start"}

- The adapter is a vLLM-format LoRA adapter, served unmerged, on the text route, in separate mode.
- A Mac does not serve adapters.
- A request uses the adapter only when it names it; every other request is answered by the base.

## 2. Give it its own temperatures

- Put the file beside the adapter's weights as `decisio_adapter.json`, or give it with `--adapter-temperatures name=file` when the adapter's folder is not yours to change.
- `temperatures` has one per type: `choice`, `noul` for yes/no, and `score`. A type the file does not list keeps the base's temperature.
- `choice_bands` is optional: keys `lo-hi`, within 2 to 255 and not overlapping. A choice question is served at its band's temperature; a count in no band is served at `temperatures.choice`, then at the base's.
- Yes/no and score questions are not banded.
- An adapter with no file is served at the base's temperatures, and the server says so when it starts.
- The file is checked before the engine is built, and an unusable one stops the start.

Fit the file from the adapter's readouts on labelled items, one row per item (`{"type": ..., "probs": [...], "gold": <index>}`):

::site-block{name="adapter-fit"}

Fit on items that are not a benchmark's: a temperature holds for the kind of items it was fitted on.

## 3. Ask with it

Name the adapter in the request's `adapter` field:

::site-block{name="adapter-ask"}

- The answer carries `"adapter"` and the `x-decisio-adapter` header when the adapter answered.
- An unknown name is answered 404, with the adapters that are loaded.

## 4. Check that it took

::site-block{name="adapter-health"}

`/health` shows each adapter's temperatures in `adapter_temperatures`, and the hash of its weights and configuration in `adapter_identity`.

## 5. Know what it does to certificates

A certificate covers one serving setup, and an adapter is part of it.
The setup a certificate is checked against holds each loaded adapter's name, weights hash and temperatures, so a different adapter, a retrained one or a changed temperature is a different setup: certify your tasks again on it.
A request that names an adapter is never certified, and a question that a registered task matches is refused with an adapter.

## What next

- [Server flags](/docs/flags/#every-flag): `--adapter` and `--adapter-temperatures` in full.
- [The HTTP API](/docs/api/): the `adapter` field and its errors.
- [Certify answers](/docs/tasks/certify/): certify a task again on the new setup.
