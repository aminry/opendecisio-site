---
title: Quickstart
description: Start Decisio v3 on a GPU, a Mac or Ollama, send text and questions, then read a typed answer from your backend. Other models are one flag away.
---

<!-- The machine paths follow the pinned release. The first request shares the downloadable choice example; the optional recorded result retains its original source label. -->

::covers{links="README.md#quick-start=1-pick-your-machine docs/overview.md#install-and-run=1-pick-your-machine docs/overview.md#quickstart=1-pick-your-machine docs/running.md=1-pick-your-machine"}

Five steps: pick your machine, check the server, ask a question, read the answer and, if you want, choose another model.
Every command here starts Decisio v3, a Gemma 4 12B tuned for decisions, with calibrated probabilities.

::figure{name="first-question"}

## TL;DR

With a server running on `http://127.0.0.1:8000`, one `POST` asks which team should handle a ticket:

::site-block{name="question-choice"}

No server yet? Step 1 starts one on your machine.

## 1. Pick your machine

Choose where the model runs, then run its commands.
The first start downloads the model.

:::tabs

::tab{label="GPU"}

::site-block{name="tuned-start"}

On a smaller card in FP8, or with Docker, see [Serve Decisio v3](/docs/deploy/tuned-12b/) and [With Docker](/docs/deploy/docker/).

::tab{label="Mac"}

A Mac with Apple silicon and 32 GB or more; this 8-bit build is 12 GB.

::site-block{name="tuned-mlx-start"}

A 6-bit build is in [Serve Decisio v3](/docs/deploy/tuned-12b/#serve-it-on-a-mac), and the untrained models in [On a Mac](/docs/deploy/mac/).

::tab{label="Ollama"}

Mac, Linux or Windows with Ollama 0.40.4 or later; the 8-bit file is 12.7 GB.

::site-block{name="ollama-pull-tuned"}

It uses its own port, 11434, and its own request in step 3.

:::

[Requirements and limits](/docs/limits/) has the memory and card each machine needs.

<details>
<summary>Optional: a CPU server for client contract tests</summary>

If you only need to test request and response handling without serving hardware, use the small development model.
You need Python 3.12, [uv](https://docs.astral.sh/uv/) and `git`.

::site-block{name="stand-in-start"}

Its probabilities are for development and do not represent the models above.
[CPU development](/docs/deploy/development/) explains this path.

</details>

<span class="fp-anchor" id="2-start-a-server"></span>

## 2. Check that it is ready

A decisio server listens on `http://127.0.0.1:8000`.
It is ready when `/health` answers:

```bash
curl -s http://127.0.0.1:8000/health
```

On Ollama, `ollama list` shows the model once the pull has finished.

## 3. Ask your first question

The request in the TL;DR is one `POST` to `/v1/systemone`: the text goes in `state`, and each question has a name you choose, a `type` and `instructions`.
It asks which team should handle one ticket and supplies billing, access and bug as the possible answers.
[Download this request as JSON](/examples/questions/choice.json) for your own client.

On Ollama, send the same kind of question to its own route, with the listing named in `model`:

::site-block{name="ollama-request-tuned"}

## 4. Read the answer

Read `answers.category` in the response.
`choice` gives the selected queue, and `probabilities` gives a value for each supplied option.
The following fields are illustrative, with chosen probabilities rather than a measured result:

```json
{
  "type": "choice",
  "choice": "billing",
  "probabilities": {"billing": 0.8, "access": 0.05, "bug": 0.15}
}
```

Your running model will return its own probabilities.
Your backend maps the selected key to a queue or sends the ticket to review, using a policy you [evaluate on your task](/docs/concepts/probabilities/).

<details>
<summary>A recorded model result with three question types</summary>

This separate example asks about urgency, queue and impact on another support ticket.
It is a recorded Gemma 4 31B result, labelled with its release, hardware and date; it is not the output of the one-question request above.

::figure{name="first-decision"}

</details>

## 5. Choose another model

<span class="fp-anchor" id="choose-another-model"></span>

A server serves one model, the one it was started with.
To switch, stop it and start it again with another `--base`.
With no flag a decisio server serves Gemma 4 31B; the commands above name Decisio v3 so you start with it.

| Model | What it is | Choose it when | GPU | Mac | Ollama |
| --- | --- | --- | --- | --- | --- |
| **Decisio v3, calibrated**, recommended | Gemma 4 12B tuned for decisions | You use the probabilities themselves: thresholds, ranking, expected values | yes | yes | yes |
| Decisio v3, commit | The same weights, with yes/no answers committed | You act on yes/no answers directly | yes | yes | no |
| Gemma 4 12B | The untrained model | You want the model as Google published it | yes | yes | yes |
| Gemma 4 31B | The larger untrained model | You have the memory for a larger model | yes | yes | no |

[Serve Decisio v3](/docs/deploy/tuned-12b/) has its accuracy, its repositories for each machine and what the two flavors change.

### What to pass to `--base`

| Model | `--base` |
| --- | --- |
| Decisio v3, calibrated | `tachara-ai/Decisio-12b-tuned-v3-calibrated` |
| Decisio v3, commit | `tachara-ai/Decisio-12b-tuned-v3-commit` |
| Gemma 4 12B | `gemma-4-12b` |
| Gemma 4 31B | `gemma-4-31b` |

On a Mac, add `--backend mlx` and name an MLX build: `tachara-ai/Decisio-12b-tuned-v3-mlx8-calibrated` or `-mlx8-commit` for Decisio v3, and the untrained models as in [On a Mac](/docs/deploy/mac/).
On Ollama, `aminroudaki/decisio-v3` is Decisio v3 and `aminroudaki/decisio-gemma` the untrained 12B.
[Choosing a model](/docs/bases/) has every setting.

## Use a coding assistant

[Install the decisio skills](/docs/ai-skills/) to have Claude Code or Codex prepare your setup, request or backend integration.
Choose the workflow for your task and include your hardware or endpoint in the prompt.

## Good to know

- A request the server cannot read gets status 422, with a `detail` that names what is wrong.
- The `model` field does not choose a model: a server serves the one model it was started with.
- Tasks and certificates belong to one model and setting: teach and certify again after you switch.
- `--images on` is the picture switch for the Gemma models; [Ask about images](/docs/images/) shows a request. Decisio v3 was trained on text, and how well it reads pictures is not measured.
- The words used here are defined in the [glossary](/docs/glossary/).

## What next

- [Call it from your code](/docs/use-from/): typed questions from Python, JavaScript, TypeScript and frameworks.
- [Choose a question type](/docs/concepts/questions/): add a yes or no question or an ordered score.
- [Use the probabilities](/docs/concepts/probabilities/): decide when to route and when to review.
- [Choosing a model](/docs/bases/): every model, flavor and machine.
