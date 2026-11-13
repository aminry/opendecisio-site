---
title: Rate on a scale
description: Rate text against an ordered rubric. Understand the fractional score and read the distribution across levels before choosing an application action.
---

Use a score question to rate impact, urgency or quality against levels you define.
With a [decisio server running](/docs/), paste this request into a terminal:

::site-block{name="question-score"}

[Download the request as JSON](/examples/questions/score.json) to reuse it in your own client.
This example uses the decisio endpoint; [Ollama's guide](/docs/deploy/mac/#on-a-laptop-with-ollama) gives its port and required model name.

## Define a rubric from low to high

Unlike a choice's named options, a score's `criteria` is a list, ordered from lowest to highest.
The first level has index 0.

| Level | Description in this example |
| --- | --- |
| 0 | No function impaired |
| 1 | One user impaired, with a workaround |
| 2 | One user blocked from a core function |
| 3 | Many users blocked from a core function |

Describe observable differences between neighboring levels.
Here the question asks for reported facts, so a ticket should not imply a whole-team outage without evidence.

## Read the score and its levels

Read `answers.impact.score` and `answers.impact.probabilities` from the JSON response.
These illustrative fields use chosen probabilities, rather than a measured model result:

```json
{
  "type": "score",
  "score": 1.7,
  "legend": {
    "0": "No function impaired",
    "1": "One user impaired, with a workaround",
    "2": "One user blocked from a core function",
    "3": "Many users blocked from a core function"
  },
  "probabilities": {"0": 0.1, "1": 0.2, "2": 0.6, "3": 0.1}
}
```

`score` is the probability-weighted mean of the level indices: `0 × 0.1 + 1 × 0.2 + 2 × 0.6 + 3 × 0.1 = 1.7`.
It can be fractional, even though your rubric contains whole-number levels.
The probability keys are strings such as `"2"`, and `legend` maps each index back to its description.

::figure{name="score-distribution"}

<details>
<summary>Explore the request and answer fields</summary>

::figure{name="request-map-score"}

</details>

## Choose the action from your rubric

If your code needs the likeliest level, select the key with the largest value in `probabilities`; here that is level 2.
If it needs an average rating for sorting, use `score`.
Read the distribution before triggering an action: different mixtures of low and high levels can have the same mean.

Check the HTTP status before reading the answer, and keep a review or service-failure path in the application.
For a category without an order, use a [choice question](/docs/concepts/choice/).

## Good to know

- Keep the rubric stable when comparing scores over time; adding a level changes what the indices mean.
- Scores are not certified. Use [choice or yes/no tasks](/docs/tasks/certify/) when you need certified answers.
- The mean level is not a probability; use `probabilities` to inspect uncertainty over the levels.

## What next

- [Use the probabilities](/docs/concepts/probabilities/): turn uncertain answers into a review policy.
- [Build a request](/docs/build-request/): combine separate named questions about one text.
- [HTTP API](/docs/api/#post-v1systemone): exact request and answer fields.
