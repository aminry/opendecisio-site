---
title: Choose a question type
description: Choose among named options, ask a yes or no question, or rate text on a scale. Match the question to the value your code needs.
---

Start with the value your application needs to make its next decision.
The same text can answer several named questions in one request.

::figure{name="request-flow"}

## Match the question to the answer

| You need | Question type | Define | Read from the answer |
| --- | --- | --- | --- |
| A category or destination | `choice` | Named options in `criteria` | `choice` and `probabilities` |
| Whether a statement is true | `noul` | The yes or no question in `instructions` | `noul`, the probability of yes |
| A rating on an ordered scale | `score` | Level descriptions in `criteria`, lowest first | `score` and the level `probabilities` |

## Choose an option

[Choose an option](/docs/concepts/choice/) when your code already knows the possible answers.
For a ticket, those might be billing, access and bug; your code maps the selected key to the appropriate queue.
Descriptions help distinguish similar options.

## Ask yes or no

[Ask yes or no](/docs/concepts/noul/) with `noul` for a question such as whether a ticket asks for a refund.
The result is a probability of yes, rather than a Boolean your application must always act on.
Your code decides when to act or ask for review.

## Rate on a scale

[Rate on a scale](/docs/concepts/score/) when the levels have an order, such as no impact, one person blocked and a whole team blocked.
The score is the probability-weighted position on your scale, so it can fall between levels.
Read the level probabilities too when the distinction changes your action.

## Keep separate judgments separate

Ask which team, whether it is urgent and what impact it has as separate questions about the same text.
Your code can combine those typed answers into a routing policy that is easy to inspect and change.

## Good to know

- `noul` is the wire name for a yes or no question.
- A choice is for unordered alternatives; a score is for levels from low to high.
- For automated answers at an error target, [teach and certify your task](/docs/tasks/certify/).

## What next

- [Build a request](/docs/build-request/): write a complete choice request.
- [Call from your code](/docs/use-from/): send the request from your backend.
- [Use the probabilities](/docs/concepts/probabilities/): choose an application policy and a review path.
