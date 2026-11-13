---
title: Ask yes or no
description: Check a condition in text and read the probability of yes. Keep yes, no and review decisions explicit in your application.
---

Use a yes or no question to check one condition, such as whether a customer explicitly asks for a refund.
With a [decisio server running](/docs/), paste this request into a terminal:

::site-block{name="question-noul"}

[Download the request as JSON](/examples/questions/noul.json) to reuse it in your own client.
This example uses the decisio endpoint; [Ollama's guide](/docs/deploy/mac/#on-a-laptop-with-ollama) gives its port and required model name.

## Ask one clear question

`noul` is the API's name for a yes or no question.
Write the condition in `instructions`; the key `refund` names the answer your code will read.
This question asks about an explicit refund request, rather than assuming every payment problem needs a refund.

You can describe the two sides with optional `criteria` keys `true` and `false` when they need more explanation.
For unrelated conditions, such as a refund request and a security incident, add separate named questions.

## Read the probability of yes

Read `answers.refund.noul` from the JSON response.
These illustrative fields use a chosen value, rather than a measured model result:

```json
{"type": "noul", "noul": 0.1}
```

The probability of yes is 0.1, and the probability of no is `1 - 0.1`, or 0.9.
The answer is a number, not a Boolean.
A value near 0 means likely no, a value near 1 means likely yes, and a value near 0.5 gives little separation.

## Keep a review path

Your application chooses when to act on yes, when to act on no and when to ask for review.
For example, it could flag a refund request when the probability of yes is at least 0.9, mark no refund request when it is at most 0.1, and review the middle.
Those are illustrative policy lines to evaluate on your data, not error guarantees.

Check the HTTP status first, and send service failures to your application's fallback.
[Use the probabilities](/docs/concepts/probabilities/) shows how this policy differs from a certified task.

## Good to know

- Test the numeric value explicitly. In Python and JavaScript, a nonzero probability is truthy even when no is likelier.
- For a decision to act on no, use `1 - answer.noul` as the probability of that side.
- A [certified task](/docs/tasks/certify/) can support automation at an error target; a threshold chosen by hand does not certify an answer.

## What next

- [Choose an option](/docs/concepts/choice/): select among several named outcomes.
- [Rate on a scale](/docs/concepts/score/): express ordered impact or quality.
- [Use the probabilities](/docs/concepts/probabilities/): build an explicit review policy.
