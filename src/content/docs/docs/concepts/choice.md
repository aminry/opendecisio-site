---
title: Choose an option
description: Route or classify text using named options. Read the selected key and the probability of every alternative, then choose the action in your backend.
---

Use a choice question when your application knows the possible answers, such as the teams that can handle a support ticket.
With a [decisio server running](/docs/), paste this request into a terminal:

::site-block{name="question-choice"}

[Download the request as JSON](/examples/questions/choice.json) to reuse it in your own client.
This example uses the decisio endpoint; [Ollama's guide](/docs/deploy/mac/#on-a-laptop-with-ollama) gives its port and required model name.

## Give the options clear boundaries

The key `category` names this question and its answer.
The `criteria` object maps option keys to descriptions; the selected key is ready for your code to use.

| Option | What belongs here |
| --- | --- |
| `billing` | Invoices, payments and refunds |
| `access` | Login, passwords and permissions |
| `bug` | The product behaves wrongly |

Use descriptions to resolve overlap, such as a declined payment versus a sign-in failure.
When the keys explain themselves, their descriptions can be `null`.
If your inputs can fall outside the categories, add an option such as `other` and define when to use it.

## Read the answer

Read `answers.category.choice` and `answers.category.probabilities` from the JSON response.
For example, these are illustrative fields from one answer, with chosen probabilities rather than a measured model result:

```json
{
  "type": "choice",
  "choice": "billing",
  "probabilities": {"billing": 0.8, "access": 0.05, "bug": 0.15}
}
```

`choice` is the key with the largest probability.
The probabilities cover all supplied options and add up to 1, apart from rounding.
Here, billing has probability 0.8, while the two alternatives together have probability 0.2.

::figure{name="choice-distribution"}

<details>
<summary>Explore the request and answer fields</summary>

::figure{name="request-map-choice"}

</details>

## Map the key to an action

Your backend maps `billing` to its billing queue, `access` to its access queue and `bug` to its bug queue.
Keep a review path for cases your routing policy does not accept, and check the HTTP status before reading any answer.
[Use the probabilities](/docs/concepts/probabilities/) explains how to choose that policy and check it on labelled examples.

## Good to know

- A choice accepts up to 255 options; more returns status 422.
- Option order does not define a ranking. Use a [score](/docs/concepts/score/) for levels from low to high.
- Adding or changing options changes the question; evaluate the revised question before automating it.

## What next

- [Ask yes or no](/docs/concepts/noul/): check one condition in the same text.
- [Use the probabilities](/docs/concepts/probabilities/): decide when your code should route or review.
- [Support routing](/docs/use-cases/support-routing/): a complete application recipe.
