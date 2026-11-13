---
title: Use the probabilities
description: Read an answer's probabilities, choose a review policy and evaluate it on labelled examples. Distinguish a manual threshold from a certified answer.
---

Use the probabilities to decide when your application should act and when it should ask for review.
The recorded support-ticket example below shows a probability for each option:

::figure{name="first-decision"}

## Read the value for your question type

| Question type | Read | Meaning |
| --- | --- | --- |
| Choice | `answer.probabilities[answer.choice]` | Probability of the selected option |
| Yes or no | `answer.noul` | Probability of yes; use `1 - answer.noul` for no |
| Score | `answer.probabilities` | Distribution across the levels; `answer.score` is their weighted mean |

For a choice, the top probability is the largest value in its distribution.
For yes or no, the likelier side has probability `max(answer.noul, 1 - answer.noul)`.
For a score, read the distribution as well as the mean: a score of 1.7 is a position on the rubric, not a probability.

## Pick an application policy

For example, route a ticket when its selected queue has probability at least 0.9, and send the rest to review.
This is an illustrative threshold; pick a line using labelled examples from your own traffic and the cost of a wrong route.
A higher line accepts fewer answers, and its error rate needs to be measured.

| Result | Application action |
| --- | --- |
| Selected queue meets your policy | Route to that queue |
| Answer falls below your policy | Send to review |
| Request fails or times out | Use your service-failure fallback |

Keep the question, options and action policy together in a module your team can review.
A high probability for one answer does not guarantee that it is correct.

## Check the policy on labelled examples

Use examples that include ordinary cases, ambiguous cases and inputs outside the categories you intended.
Choose the question and policy on development examples, then measure on a separate held-out set.
Count wrong automated decisions and how many cases went to review; repeat when the question, model or traffic changes.

[Evaluate your task](/docs/evaluation-card/) gives a practical checklist.
For a complete implementation, follow [support routing](/docs/use-cases/support-routing/).

## Use certification when you need an error target

A threshold chosen by hand is a policy, not a certificate.
To automate at an error target, [teach and certify a task](/docs/tasks/certify/) using representative labelled examples.
Your code checks the returned `certified` field before using its certified-answer path; an answer without it does not qualify.

Certification applies to choice and yes/no tasks, not scores.
A gold certificate concerns errors against labelled answers; a learned table's agreement certificate concerns agreement with the model.
If your policy requires a gold certificate, check `certificate_kind` as well as `certified`.

## Good to know

- Choose thresholds from evaluation on your task, rather than assuming every question type or model needs the same line.
- Service errors and uncertain answers need separate fallback handling in your backend.
- Changing the question or serving setup means evaluating again; certify again when required by the task guide.

## What next

- [Call from your code](/docs/use-from/): send requests and handle HTTP errors and timeouts.
- [Certify answers](/docs/tasks/certify/): use an error target with labelled examples.
- [Watch for drift](/docs/tasks/drift/): monitor a task after you deploy it.
