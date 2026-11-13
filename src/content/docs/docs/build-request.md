---
title: Build a request
description: Turn a backend decision into a text, a question and its possible answers. Read the result and keep the application action in your own code.
---

Ask a small question your application needs answered, such as which queue should handle a ticket.
With a server running, this checks the service and asks one choice question:

::site-block{name="question-choice"}

[Download this request as JSON](/examples/questions/choice.json) for your client.

## 1. Supply the text

Put the message, document or record you want evaluated in `state`.
Keep the question and your instructions separate from that text.
For example, the ticket describes the customer's payment problem; the question asks which team should handle it.

## 2. Name the question

Each key under `questions` is a name your code chooses, such as `category`.
Its answer comes back under the same key in `answers`.
Write one judgment per question, and add more named questions when you need separate judgments about the same text.

## 3. Choose the possible answers

For a choice question, `criteria` maps your option keys to descriptions, or to `null` when the names are enough.
Choose distinct keys that your code can use directly, and write descriptions when neighboring options need a clear boundary.
For example, distinguish a failed payment from a login failure rather than asking the model to invent a category.

[Choose a question type](/docs/concepts/questions/) compares a choice, a yes or no question and an ordered score.

## 4. Read the answer before acting

For this request, read `answers.category.choice` for the selected option and `answers.category.probabilities` for its distribution.
Your application maps that option to a queue or a review workflow.
When you need an error target for automated decisions, use a [certified task](/docs/tasks/certify/) and check the answer's `certified` field before acting automatically.

## Good to know

- A successful request returns answers under the names you supplied; check the HTTP status before reading them.
- A field called `model` does not switch the model loaded by a decisio server.
- A probability threshold you choose by hand is a routing rule, not a certificate.

## What next

- [Call from your code](/docs/use-from/): Python, JavaScript, TypeScript and frameworks.
- [Support routing](/docs/use-cases/support-routing/): a complete application recipe.
- [HTTP API](/docs/api/): exact fields, supported options and error responses.
