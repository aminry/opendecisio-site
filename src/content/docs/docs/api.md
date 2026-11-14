---
title: HTTP API
description: The supported HTTP routes and fields for decisions, tasks, abstention, health and metrics.
---

<!-- Site-written: the intro, the commands and the links. The reference below is decisio's docs/api.md at the pinned release. -->

::covers{links="docs/api.md docs/api.md#where-this-route-differs-from-system-one=good-to-know"}

The server answers questions on `POST /v1/systemone`; its other routes teach and certify tasks, set abstention thresholds, and say what it serves.
With a server running, send one choice question:

::site-block{name="question-choice"}

- A request the server cannot read is answered with 422, and one the model cannot answer with 400, each with a `detail` naming the problem.
- The answer's `confidence` field is System One's own figure, the top probability rescaled; thresholds and certificates use the top probability itself, the largest of `probabilities`.

## Reference

| What you need | Route |
| --- | --- |
| Ask questions | [POST /v1/systemone](#post-v1systemone) |
| Find the served model | [GET /v1/models](#get-v1models) |
| Register, inspect or move tasks | [Task routes](#tasks) |
| Manage an abstain option | [Abstention routes](#abstention) |
| Check readiness and task metrics | [Health and metrics](#get-health) |

## POST /v1/systemone

Send JSON with `Content-Type: application/json`.
The `model` field labels the response; it does not switch the model running on the server.

### Request

::upstream{file="docs/api.md" section="Request" depth="4"}

### Response

::upstream{file="docs/api.md" section="Response" depth="4"}

## GET /v1/models

Returns `models`, a list of entries with `name`, `description` and `release_date`.
Use its served name in clients that require `model`.

## Tasks

Use [Teach a task](/docs/tasks/) for a complete registration and [Certify answers](/docs/tasks/certify/) to select an error target.

| Method and route | Request or result |
| --- | --- |
| `POST /v1/tasks` | Register or replace a task using the fields below |
| `GET /v1/tasks` | List task records and their status; `?full=1` includes the complete export |
| `GET /v1/tasks/{task_id}` | Inspect one task and its live status |
| `DELETE /v1/tasks/{task_id}` | Remove the task; 404 when it does not exist |
| `POST /v1/tasks/import` | Import an exported object with a `tasks` array |
| `POST /v1/tasks/{task_id}/certify` | Certify again with new `examples`; optionally set `alpha`, `delta`, `min_examples` and `suspend_on_alert` |
| `POST /v1/tasks/{task_id}/fast_table/rollback` | Select a retained learned-table version with a JSON `version` number |

### Registration fields

| Field | Use |
| --- | --- |
| `id` | The task name; registering the same id replaces it |
| `examples` | Labelled examples, each with a one-question `request` and its desired `answer` |
| `question` | The question for a table that learns from traffic, instead of labelled examples |
| `context` | A fixed string, object or array read before each changing state; see [fixed context](/docs/tasks/context/) |
| `layout` | `plain` or `header`, otherwise the server's layout; the task applies under that layout |
| `certify` | Certificate settings in the table below |
| `fast_table` | `true` for the default student, or the table settings below |
| `options` | `dynamic` for a [question whose options change](/docs/tasks/dynamic/) |
| `match` | `instructions` for a dynamic task |
| `none_option` | The dynamic question's none-of-these key, `none` by default |

### Certificate settings

Every key in `certify` is optional.

| Field | Use |
| --- | --- |
| `alpha` | Error target; default 0.05 |
| `delta` | Allowed chance the bound does not hold; default 0.1 |
| `min_examples` | Raise the minimum held-out count; the server derives its floor from the targets |
| `holdout` | Share of the registration examples held back, default 0.5 |
| `suspend_on_alert` | Suspend certification while the monitor alerts, default `true` |
| `examples` | Separate labelled certification examples, never used for fitting |

The returned `certificate` includes `threshold`, `alpha`, `delta`, `n`, `certified_share`, `split` and `summary`.
A `null` threshold certifies nothing.
Each decision says `certified`, `certificate`, `certificate_kind` and, when relevant, `certified_reason`; check these fields in your application.

### Fast-table settings

| Field | Use |
| --- | --- |
| `kind` | `static`, `encoder` or `auto` |
| `static_model` | Select the static model, such as `multilingual` |
| `min_saving` | Minimum mean saving, default 0.10, from 0.01 to 0.90 |
| `learn` | Learn from the model's traffic with `true` |
| `explore` | Share sent to the model even when the table can answer, default 0.02 |
| `max_rows` | Maximum retained learning rows, default 200,000 |

A response's `fast_table_report` says what was kept; each answer's `answered_by` is `table` or `decisio`.
A table learned from model answers has an `agreement` certificate; a certificate based on human labels is `gold`.
See [Add a decision fast path](/docs/tasks/fast-table/) for installation, learning, states and rollback.

### Task records and errors

A task record includes `format`, `id`, `key`, `type`, `options`, `fingerprint`, `calibration`, `head`, `certificate`, `context` and `status`.
The `calibration` and `head` results say `applied` and `reason`; a declined correction leaves the original model answer available.
The complete export includes the data needed to import the record.

With a shared store, `store_version` names the version served.
A concurrent write returns 409; read the current version before replacing it, using `x-decisio-replaces` when needed, or explicit `?replace=1` to replace it.
A read-only replica rejects writes with 409, an unreachable store with 503, and a failed persistent write with 500; these failures do not make the requested change.

## Abstention

An abstention threshold tells the server when to choose a designated can't-tell option.
It is separate from a certificate and its application review policy.

| Method and route | Request or result |
| --- | --- |
| `POST /v1/abstention/tasks` | Register `id`, `option`, `match`, `examples` and optional `layout` |
| `GET /v1/abstention/tasks` | List/export abstention tasks |
| `POST /v1/abstention/tasks/import` | Import the exported tasks |
| `DELETE /v1/abstention/tasks/{task_id}` | Remove an abstention task |

Use `option.key` for an option already in the request, or `option.append` for text the server adds.
Each example carries `request` and `answer`; `null` means unanswerable.

| `match` | Applies to |
| --- | --- |
| `option_set` | The same option keys and descriptions, in any order |
| `option_keys` | Exactly the same set of keys, with varying descriptions or instructions |
| `imajev_extension` | Clients using that abstention extension |

An exact option-set task takes precedence over an option-keys task.
The server abstains above the fitted threshold and otherwise chooses among the remaining options; reported probabilities stay unchanged.
Abstention tasks do not take a fixed `context`.

<span id="get-health"></span>

## GET /health

Use the HTTP status for readiness: 200 while serving, 503 once the engine is dead.
The body names what is running; it can gain fields between releases.

| Field | Use |
| --- | --- |
| `ok`, `engine` | Readiness and engine identity |
| `base`, `profile` | Model and serving settings |
| `max_model_len`, `max_model_len_source` | Prompt ceiling and why it was chosen |
| `systemone` | Layout, task and other decision-route settings |
| `image_engine` | Image engine when configured |
| `reason`, `exit_code` | Failure details when the engine is dead |

`GET /metrics` returns Prometheus text for certified tasks.
See [Operate](/docs/operating/) for supervision and latency headers, and [Watch for drift](/docs/tasks/drift/) for task metrics.

<span id="where-this-route-differs-from-system-one"></span>
<span id="what-one-request-can-hold"></span>
<span id="calling-the-server-from-a-browser"></span>
<span id="what-to-watch"></span>
<span id="post-v1answer"></span>

## Good to know

- Keep the server private and call it from your backend; it has no authentication or CORS configuration.
- Unknown request fields are ignored; confirm any field you depend on is documented here.
- A request that is too long returns 422; truncation and layout changes can leave answers uncertified.
- [Move from System One](/docs/migrating/#what-changes) explains supported wire differences.

## What next

- [Call it from your code](/docs/use-from/): the same request from Python, JavaScript and TypeScript.
- [Teach a task](/docs/tasks/): the task routes, in use.
- [Operate](/docs/operating/): health, restarts and security.
