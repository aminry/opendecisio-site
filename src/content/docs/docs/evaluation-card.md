---
title: Evaluate your task
description: Check decisio on examples from your own application. Measure the answers you would act on, choose a review path, and check again when your traffic changes.
---

Try a real decision from your application before automating it.
Start with labelled inputs your team understands, check what the running server serves, and keep separate examples to judge the result.

```bash
curl -s http://127.0.0.1:8000/health
```

::covers{links="EVAL_CARD.md=1-choose-a-real-decision EVAL_CARD.md#starlight__on-this-page=starlight__on-this-page EVAL_CARD.md#the-card=the-card EVAL_CARD.md#1-the-system-measured=1-the-system-measured EVAL_CARD.md#2-capabilities=2-capabilities EVAL_CARD.md#3-numbers=3-numbers EVAL_CARD.md#4-what-was-fitted-on-what=4-what-was-fitted-on-what EVAL_CARD.md#5-limits=5-limits EVAL_CARD.md#6-the-gemma-base=6-the-gemma-base EVAL_CARD.md#61-the-system-measured=61-the-system-measured EVAL_CARD.md#62-numbers=62-numbers EVAL_CARD.md#63-gates=63-gates EVAL_CARD.md#64-what-was-fitted-on-what=64-what-was-fitted-on-what EVAL_CARD.md#65-reproducibility=65-reproducibility EVAL_CARD.md#66-limits=66-limits EVAL_CARD.md#7-the-gemma-4-31b-base=7-the-gemma-4-31b-base EVAL_CARD.md#71-the-system-measured=71-the-system-measured EVAL_CARD.md#72-numbers=72-numbers EVAL_CARD.md#73-gates-and-the-decision=73-gates-and-the-decision EVAL_CARD.md#74-what-was-fitted-on-what=74-what-was-fitted-on-what EVAL_CARD.md#75-limits=75-limits EVAL_CARD.md#8-the-decision-indexs-whole-suite-self-run=8-the-decision-indexs-whole-suite-self-run EVAL_CARD.md#81-where-jev-leads=81-where-jev-leads EVAL_CARD.md#9-jevbench-v161-what-the-compared-systems-cards-state=9-jevbench-v161-what-the-compared-systems-cards-state"}

<span id="starlight__on-this-page" aria-hidden="true"></span>
<span id="the-card" aria-hidden="true"></span>
<span id="1-the-system-measured" aria-hidden="true"></span>
<span id="2-capabilities" aria-hidden="true"></span>
<span id="3-numbers" aria-hidden="true"></span>
<span id="4-what-was-fitted-on-what" aria-hidden="true"></span>
<span id="5-limits" aria-hidden="true"></span>
<span id="6-the-gemma-base" aria-hidden="true"></span>
<span id="61-the-system-measured" aria-hidden="true"></span>
<span id="62-numbers" aria-hidden="true"></span>
<span id="63-gates" aria-hidden="true"></span>
<span id="64-what-was-fitted-on-what" aria-hidden="true"></span>
<span id="65-reproducibility" aria-hidden="true"></span>
<span id="66-limits" aria-hidden="true"></span>
<span id="7-the-gemma-4-31b-base" aria-hidden="true"></span>
<span id="71-the-system-measured" aria-hidden="true"></span>
<span id="72-numbers" aria-hidden="true"></span>
<span id="73-gates-and-the-decision" aria-hidden="true"></span>
<span id="74-what-was-fitted-on-what" aria-hidden="true"></span>
<span id="75-limits" aria-hidden="true"></span>
<span id="8-the-decision-indexs-whole-suite-self-run" aria-hidden="true"></span>
<span id="81-where-jev-leads" aria-hidden="true"></span>
<span id="9-jevbench-v161-what-the-compared-systems-cards-state" aria-hidden="true"></span>

## 1. Choose a real decision

Write one question and the answer your code needs, such as which queue handles a support ticket.
Define the options so a person can label examples consistently.
Include ambiguous messages and inputs that belong in review, alongside the straightforward ones.

## 2. Keep examples for checking

Split your labelled inputs before teaching the task.
Use one part to [teach and certify](/docs/tasks/) and keep another part untouched to check how the resulting application behaves.
Do not tune the question or the task against the examples you plan to report as your final check.

## 3. Measure the application outcome

| Check | What to record |
| --- | --- |
| Answer quality | The expected option and returned option for every input |
| Automation | Which answers your code would act on, and which it would send for review |
| Certified answers | How many are certified, and how many of those are wrong on your labelled check inputs |
| Service behavior | First-request and steady-state latency, errors and timeouts |
| Recovery | What your application does when the server is unavailable or an answer is not certified |

If you use a fast table that learns from traffic, check the certificate kind.
An agreement certificate measures agreement with the model; it does not measure correctness against your labels.

## 4. Decide what can run automatically

For an error target, [certify your task](/docs/tasks/certify/) and require both `certified: true` and `certificate_kind: "gold"` before acting automatically.
Give every other answer a deliberate path, such as a person, another workflow or a request for clarification.
Check that path as part of the application, including service errors.

## 5. Check again as the system changes

Watch the [drift monitor](/docs/tasks/drift/) and sample fresh traffic for human labels.
After changing your question, model or serving setup, or upgrading decisio, check the task again and certify it again where needed.
Keep the expected answers and your application checks with your project so the decision remains reviewable.

## Good to know

- A small development model can test the client contract; use your intended model and hardware to assess answer quality and latency.
- A single probability is not a promise that one answer is correct.
- A certificate applies to its task and serving setup, for traffic like the examples used to make it.

## What next

- [Teach a task](/docs/tasks/): register your labelled examples.
- [Certify answers](/docs/tasks/certify/): choose an error target and handle the verdict.
- [Support routing](/docs/use-cases/support-routing/): see the decision in an application.
