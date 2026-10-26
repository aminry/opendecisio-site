---
title: "A tuned Gemma 4 12B: right more often on hard, rule-heavy decisions"
summary: "Our tuned 12B is right about 7 points more often than the untrained 12B on held-out hard decisions and about 3 points more on everyday wording. Here is every way to run it."
date: 2026-10-25
tags: [release]
---

We tuned Gemma 4 12B for decisions: a fine-tuned adapter, merged into the model's weights and served by decisio.
It is right more often on hard decisions with rules, exceptions and arithmetic, and about the same elsewhere.

## What it is

The tuned 12B is Gemma 4 12B with our adapter merged into its weights, stored in bf16, and served by decisio with the header layout and its own calibrated temperatures.
It ships as two Hugging Face repositories with the same weights and different settings:

- **`Decisio-12b-tuned-calibrated`** gives honest probabilities: calibrated temperatures for every question type, yes/no included.
- **`Decisio-12b-tuned-commit`** commits yes/no answers: the same temperatures with the commit rule, so no yes/no answer sits between 0.20 and 0.80. It changes no answer.

## How much better it is

We compared the tuned 12B with the untrained 12B on the same held-out items, one at a time, both in the header layout.
A score is the share of items where the model's likeliest answer is the right one.

| Held-out set | Items | Untrained 12B | Tuned 12B | Difference, points (90% interval) |
| --- | ---: | ---: | ---: | --- |
| Hard decisions with rules, exceptions and arithmetic | 525 | 68.6% | 75.2% | +6.7 (+3.6 to +9.9) |
| Decisions in natural, everyday wording | 939 | 66.1% | 69.0% | +2.9 (+1.0 to +4.8) |
| A mixed development set | 430 | 66.3% | 66.5% | +0.2 (-2.8 to +3.3) |
| Yes/no questions from the mixed set, with a committed answer | 125 | 84.8% | 88.0% | +3.2 (0.0 to +6.4) |

::source[Measured in bf16, both models in the header layout, each difference paired by item with a 90% bootstrap interval (4,000 resamples); items screened against our training data by exact-match and phrase-overlap rules.]

- **The gain is largest on hard, rule-heavy decisions:** right about 7 more times in 100. On everyday wording it is about 3 points, and on the mixed set it is unchanged.
- **On yes/no questions it is no worse, and probably a little better:** the interval touches zero.
- **Against the untrained 12B in the plain layout, the gains are larger:** +8.4 points (+4.9 to +12.0) on hard decisions.
- **It changes a few answers the untrained model had right with high confidence,** about 1.6% of them in our monitoring; each difference above is the net effect.
- **Figures are for the bf16 weights.**
- **"Held-out" means screened against our own training data;** the items do not come from a third party's benchmark.

## Every way to run it

On a GPU with room for about 24 GB of bf16 weights, install decisio 0.33.0 or later and start the server from a repository: `python -m decisio.serve.vllm_engine --base tachara-ai/Decisio-12b-tuned-calibrated@baa731aa`, or `tachara-ai/Decisio-12b-tuned-commit@245e00dc` for committed yes/no answers.
The repository brings its weights and its settings, so no other flag is needed, and the first start downloads the weights.
[Serve the tuned 12B](/docs/deploy/tuned-12b/) has the whole setup.

## On a Mac

decisio 0.34.0 or later also serves the tuned 12B on a Mac with Apple silicon, from four more repositories: 8-bit and 6-bit conversions, each with the calibrated and the commit settings.

- **8-bit, the closer one** (`tachara-ai/Decisio-12b-tuned-mlx8-calibrated` and `-mlx8-commit`, 12.7 GB): the same likeliest answer as the bf16 model on 97.9% of the held-out questions, and 69.8% accuracy against 69.9% (-0.1 points, 90% interval -0.5 to +0.3). It peaks at 14.9 GB with an 8,000-token text and 18.6 GB at 32,000.
- **6-bit, the smaller one** (`-mlx-calibrated` and `-mlx-commit`, 9.7 GB): the same likeliest answer on 95.5%, and 69.5% against 69.9% (-0.4 points, -1.1 to +0.2). It peaks at 12.0 GB at 8,000 tokens and 15.6 GB at 32,000.
- **Both fit a 32 GB Mac.** Start one with `pip install "decisio[mlx]"`, then `python -m decisio.serve.vllm_engine --backend mlx --base tachara-ai/Decisio-12b-tuned-mlx8-calibrated`.

::source[Measured on one Mac, an Apple M5 Pro with 64 GB, with decisio's MLX engine, on the 1,894 held-out questions, against the bf16 tuned model served by decisio with the same settings.]

There is no Ollama version of the tuned 12B.

TODO(Amin): the FP8 repositories (Decisio-12b-tuned-fp8-calibrated and -fp8-commit) and their measured difference from bf16, once checked.

## Data and licence

Training data not disclosed. No Decision Index or JevBench evaluation items were used in training or checkpoint selection; the data was decontaminated against both boards' public test sets.
Training included the official training splits of some public benchmarks, used under their licences. No test or evaluation items of those benchmarks were used, and every training row was checked against both boards' public test sets.

The licence is the base model's, Apache License 2.0; Gemma 4 is Google's.
