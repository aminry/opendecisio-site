---
title: Watch for drift
description: Know when live traffic stops looking like the examples a task was certified on. The server watches without labels, and suspends certification when it moves.
---

<!-- Site-written: the third Teach and trust guide, rewritten from decisio's docs/tasks.md ("The monitor") and docs/api.md ("What to watch") at the pinned release; the chart is the card measurement the teach-and-certify page shows, under 0.14.0 and on the 0.16.0 release candidate (src/lib/figures/tasks.mjs, src/data/teach-certify/); the facts are docs/tasks.md's (src/config/sourced.mjs checks them). -->

::covers{links="docs/tasks.md#the-monitor"}

A certified task watches its own traffic with three checks that need no labels.
From decisio 0.16.0, certification is suspended while the confidence alarm is on, so a shift does not quietly fill your queue with wrong certified answers:

::figure{name="drift-replay"}

## 1. Know what it watches

| Check | What it sees | What it does |
| --- | --- | --- |
| The serving setup | any change to the setup the certificate was made on | suspends certification at once: `serving_stack_changed` |
| The confidences | how often an answer's top probability falls below the certification examples' 5th percentile | suspends certification while it alerts: `traffic_changed`, with `confidence` among its signals |
| The answer mix | how often each option was chosen in the last 500 answers, checked every 100 | reports `traffic_changed` with `answer_mix`; changes nothing |

- The confidence alert clears once the traffic is back to normal for about 300 answers.
- While certification is suspended, the answers themselves do not change: they come back marked `certified: false`, with the reason.
- The answer mix is weak on a task with many options, where a shift spread over them barely moves the mix. That is why only the confidence check suspends.

## 2. Read the status

`GET /v1/tasks/{id}` gives a task's `status`: `ok`, `suspended` with what changed, or `traffic_changed` with the signals that alerted.
`GET /v1/tasks` lists every task's status.

## 3. Alert on it

`GET /metrics` serves Prometheus text for certified tasks:

| Metric | What it counts |
| --- | --- |
| `decisio_task_state{task,state}` | each task's state |
| `decisio_task_confidence_statistic`, `_limit`, `_alerts_total` | the confidence check: where it stands, where it alerts, and how often it has |
| `decisio_task_mix_distance`, `decisio_task_mix_line` | the answer mix, and the line it alerts at |

It also counts each task's answers and certified answers.
The counters live in memory and start again when the server does.

## 4. Check it with labels

The checks cannot see a wrong answer, because they have no labels.
The only direct check that the promise holds on live traffic is to label a sample of it and certify again.

- **Give the task an "other" option.** A message that fits none of the options gets a wrong answer, and the checks only notice once enough of them arrive.
- **To report without suspending**, certify with `"suspend_on_alert": false` in the `certify` block.
- **A task certified before decisio 0.16.0** has no confidence check until it is certified again.

## What next

- [Certify answers](/docs/tasks/certify/): the promise these checks protect, and how to certify again.
- [Operate](/docs/operating/): health, the exit code and what else to watch in production.
- [Certified answers on real tasks](/demos/teach-and-certify/): a drift alarm on real traffic, run on the release it was measured on.
