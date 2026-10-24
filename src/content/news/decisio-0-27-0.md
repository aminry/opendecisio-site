---
title: "decisio 0.27.0: truncation fixed under the header layout, and opt-in flavors"
summary: "0.27.0 fixes --over-limit truncate under the header layout, and adds flavors, read twice for Decision Index runs and think temperatures, all off unless you ask for them."
date: 2026-10-24
tags: [release]
---

decisio 0.27.0 fixes a bug that came with the header layout in 0.26.0, and adds four options that are off unless you ask for them.
A server that uses none of them answers as 0.26.0 did.

## The fix: truncation under the header layout

In 0.26.0, a Gemma server with `--over-limit truncate` could refuse a request it should have answered.
The cut left room for the text but not for the list of questions the header layout adds, so a request whose list was longer than a small margin came out a few tokens over the context and got a 422.
In one test that was 27 of 60 long documents on the 12B, at a 65,536-token context.

The cut now counts the question list, so those requests are answered from a text shortened by the list's length.
The default, which refuses a text over the length, and the plain layout were not affected.

## Flavors

`--flavor` serves a named configuration of a Gemma model for one job: `calibrated`, `thinking-commit` for JevBench, or `read-enhanced` for the Decision Index.
The server is named for it, such as `Decisio-31b-read-enhanced`, and a flag you give still wins and is recorded as an override.

Not every flavor is finished, and each says so.
`calibrated` refuses to start until its temperatures are fitted.
`read-enhanced` runs without its question cap and with the model's own temperatures, and `thinking-commit` uses the default thinking settings, measured on our tuned models only; both are marked `pending` wherever the flavor is reported.

## Read twice, for Decision Index runs

`--read-twice-under N` writes each question's prompt twice when a request read once is at most N tokens.
On the 31B, N = 2,000 gained 1.8 points on a public sample of the Decision Index, with p80 latency about 866 ms, at about 1.5 times the tokens.
It added nothing on the 12B, and the extra tokens put a JevBench run over that board's cost cap, so it is never the default.

## Temperatures

A model's profile can now carry its own temperature per question type and by number of options; no model sets them yet, so every served temperature is unchanged.
A tuned model's repository can carry separate temperatures for answers that thought when unsure, because mixing two reads makes them sharper than one read.

## Install

```bash
docker run -d --gpus all --shm-size 8g -p 127.0.0.1:8000:8000 -v decisio-data:/data ghcr.io/aminry/decisio@sha256:f7126db4f1714b7ab3a07d5c91f350528ff7f6ba1e404434e73d764fcbd5e7cf
```

[Choosing a model](/docs/bases/#5-serve-a-flavor) has the flavors, [Choose the prompt layout](/docs/layout/#6-read-twice-for-decision-index-runs) has read twice, [Think when unsure](/docs/think/#4-give-thought-answers-their-own-temperature) has the think temperatures, and [Release notes](/docs/releases/) has every change.
