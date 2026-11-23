---
title: "decisio 0.55.0: certify answers from the traffic you serve"
summary: "A task can now collect labels from its own traffic, opt-in, and be certified from them. Nothing is logged unless the task opts in, and never the request's text."
date: 2026-11-23
tags: [release]
---

A certificate in decisio used to come only from examples you gathered before serving.
In 0.55.0 it can come from the requests the task really serves: the server asks you about a few of its answers, and the labels you give make the certificate.
Nothing is logged unless the task opts in.

## What it saves

decisio's task docs state the measured saving:

> In our tests on classification tasks where 30% of answers could be certified, drawing the certification labels from live traffic needed about a third as many labels as labelling at random at alpha 0.10, and under half as many at alpha 0.05. This is a measured saving, not a promise, and it applies to tasks whose most confident answers are almost always right.

The measurements are in decisio's [labels-needed run record](https://github.com/aminry/decisio/tree/v0.56.0/runs/2026-11-23_labels-needed).

## How it works

- **Opt in at registration** with a `labels` block. Nothing is logged per request unless the task opts in, and never the request's text or state.
- **The server picks what to ask,** by a draw that does not depend on the right answer, so the labels stand for the traffic. The queue of answers to label hides the served answer, so a labeller is not nudged to agree.
- **You post labels** by request id, or by a digest of the input if you kept the input but not the id.
- **The certificate from your examples serves until the first look,** and the certificate from traffic labels then replaces it. A label monitor suspends certification when the labelled error rises above your rate.
- **Erasure:** one request's logged answers and labels, or everything before a time, can be erased.

## Average error (FDR), opt-in

A task that takes labels can ask for marks on windows of its answers instead of a certificate.
It never certifies them, and its promise at alpha 0.05 reads: "On average over the labelled examples and over windows of answers like this one, at most 5% of the answers marked in a window are wrong. A particular window can have a higher share. Marks are given when the window closes."

## Start

- [Certify answers](/docs/tasks/certify/#certify-from-traffic-labels): opting in, labelling and what to expect.
- [The HTTP API](/docs/api/#tasks): the label routes.

## Good to know

- On the hard multilingual tasks we tested (60-option intent sets and paraphrase detection), certified coverage stayed small: the largest share at alpha 0.05 was 4%, with up to 2,000 labels.
- At alpha 0.01 and 0.005, none of those multilingual tasks reached a certificate with up to 2,000 labels, so we make no saving or coverage claim at those levels.
- A drawn answer not labelled by its due date counts as an error, so label what the server asks for, or raise the daily budget.
- A task with a fast table keeps its certificate from examples.
- 0.55.0 also changes how fast tables are chosen and judged, and gives Gemma 4 12B's score tasks a new calibration ([Release notes](/docs/releases/)).
