---
title: "decisio 0.47.0 and 0.48.0: ask decision questions about pictures on a GPU, a Mac and Ollama"
summary: "decisio now answers yes/no, choice and score questions about images, and finds an object in a picture with a Box question, on a GPU, a Mac and Ollama. Measured figures, and what changes on upgrade."
date: 2026-11-15
tags: [release]
---

A parcel at the door, a listing photo, a screenshot of an error: pictures reach a backend with a decision attached.
Is the parcel damaged? Which team does this screenshot go to? Where in the photo is the price tag?
decisio 0.47.0 answers those on a GPU with the request you already send for text, and 0.48.0 brings the same to a Mac and to Ollama.

## What you can ask

- **Yes/no, choice and score questions about one or more images.**
  A picture can stand in the state or in a question's own text, where only that question reads it.
- **Box questions on a GPU.**
  Say what to find, such as "the turquoise mug", and the answer is one box, as fractions of the image, with a confidence.
  When the model says the target is absent, the answer is the whole image at confidence 0.
  To decide in code whether something is there, pair the Box with a yes/no question.
- **Gemma 4 12B and 31B on vLLM, with `--images on`.**
  One engine reads the text and the pictures, with no second copy of the weights.
- **A Mac.**
  `--backend mlx --images on` reads pictures on Apple silicon, and the tuned 12B's MLX conversion takes the base's vision add-on.
- **Ollama.**
  `aminroudaki/decisio-gemma` and `aminroudaki/decisio-gemma-tuned` read images on Ollama 0.40.4 or later.
- **The same wire as System One's images.**
  Image uploads from client SDKs are accepted, so TypeSafe's Python SDK sends images to decisio as it does to System One.

## Where it works

The GPU figures are on the reporting half of decisio's image eval set, on one RTX PRO 6000 Blackwell (96 GB) at 600 W with vLLM 0.31.0, run on 2026-11-14.
The set has 800 generated scenes, 600 photos from Open Images V7 (CC BY) and the 254 development items of ImajevBench v2.0-lite.
The 12B was read at its default budget of 560 and the 31B at its default of 280.

| Measure | Items | Gemma 4 12B | Gemma 4 31B |
| --- | ---: | ---: | ---: |
| Yes/no, generated scenes | 53 | 96.2% | 98.1% |
| Choice, generated scenes | 52 | 98.1% | 100% |
| Score, generated scenes | 55 | 98.2% | 100% |
| Yes/no, real photos | 76 | 92.1% | 89.5% |
| Choice, real photos | 83 | 78.3% | 73.5% |
| Box mean IoU, generated scenes | 175 | 0.925 | 0.886 |
| Box mean IoU, real photos | 151 | 0.828 | 0.828 |
| Boxes at IoU 0.5 or more, real photos | 151 | 86.8% | 86.8% |

An accuracy is the share of questions whose likeliest answer is right, and a Box counts only where the target is in the picture.
The generated scenes are easier than photographs, so read the real-photo rows for your own pictures.
A Box `confidence` is not calibrated in this run: use it to rank and compare, not as a probability.
On the 32 generated scenes without the target, a companion yes/no question tells absent from present better than the Box confidence does (AUROC 0.997 against 0.973, on the 12B at 560).

A new 512 by 512 picture is read in a median of 117 ms on the 12B at 560 (155 ms at the 95th percentile) and 143 ms on the 31B at 280 (145 ms), one request at a time.
A Box question on one image takes 914 ms on the 12B at 280 and 1,168 ms on the 31B.

On one Apple silicon Mac with 64 GB, through the Mac server, one picture and a short state at 560 take a median of 1.0 s on the 12B and 3.4 s on the 31B's 4-bit build, using 24.2 GB and 20.7 GB of memory.
On Ollama 0.40.16 on an Apple M5 Pro, every tag of the two listings chooses decisio's own image answer on 97% to 98% of 257 image questions.

## Start

Install it and start a Gemma server with images on:

```bash
pip install "decisio[serve]==0.55.0"
python -m decisio.serve.vllm_engine --base gemma-4-12b --images on
```

Then ask where something is, with the photo as an asset:

```json
{"state": "The photo: PHOTO",
 "questions": {"mug": {"type": "box", "instructions": "the turquoise mug"}},
 "assets": {"PHOTO": {"type": "image", "format": "png", "data_base64": "..."}}}
```

On a Mac, add the image extra and start the Mac server:

```bash
uv sync --extra mlx-images
uv run python -m decisio.serve.vllm_engine --backend mlx --base gemma-4-12b --model google/gemma-4-12B-it --images on
```

On Ollama, `ollama pull aminroudaki/decisio-gemma` and send the picture in Ollama's own `images` field.
A Mac and Ollama read pictures but answer no Box question, and Ollama puts the images before the state.
[On a Mac or a laptop](/docs/deploy/mac/) has the details.

## If you already run decisio

- **The 12B reads images at 560 by default.**
  An image costs about 1.8 times the tokens of 280, and Box answers read better.
  Pass `--image-budget 280` for the cheaper read, a median first read of 85 ms for one image.
- **The Qwen image route reads each image at its place.**
  Before, every image went to the start of the turn and every question read every image.
  On generated scenes the new layout is right 6.2 points more often than the old one (95% interval 2.9 to 10.1, 208 items).
  On ImajevBench lite the difference is 2.4 points and the interval includes zero (-1.6 to 6.5, 124 items).
  Answers can differ after the upgrade, and image probabilities are sharper because the route now reads at temperature 0.80 where it read at 1.0.
  `--image-prompt legacy` keeps the old layout for now.
  It is deprecated, every image response then carries `Deprecation` and `Warning` headers, and a later release removes it.
- **The 31B keeps 280 by default, with 1120 as an opt-in.**
  At 1120 a first read takes about 3.5 times as long as at 280 (a median of 504 ms) for a small Box gain.
  Its image probabilities now use a temperature fitted on images, so they are less sharp than before.
- **A text-heavy deployment on the 31B can keep images off.**
  With `--images on` the 31B serves its text requests through its multimodal class too.
  On 100 BANKING77 questions that moved the right answers from 73 to 69 at budget 280 and to 71 at 1120, beyond the spread between two images-off starts, which both got 73.
  A deployment that serves mostly text on the 31B can keep images off, or serve images from a separate server.
  On the 12B the changes are of the size of the spread between two starts of the same server.
- **The Gemma listings on Ollama need Ollama 0.40.4 or later.**
  The files that worked on Ollama 0.35.1 through 0.40.3 stay under the tags `q4_k_m-ollama0.40.3` and `q8_0-ollama0.40.3`, and the Qwen listing, `aminroudaki/decisio`, still needs 0.35.1 through 0.40.3.

After an upgrade, certify certified tasks again, as [Upgrade](/docs/upgrading/) says.
[Ask about images](/docs/images/) is the guide to sending pictures and reading the answers.
The measurements are in [section 10 of the evaluation card](https://github.com/aminry/decisio/blob/v0.48.0/EVAL_CARD.md), and the releases are [0.47.0](https://github.com/aminry/decisio/releases/tag/v0.47.0) and [0.48.0](https://github.com/aminry/decisio/releases/tag/v0.48.0) on GitHub.
