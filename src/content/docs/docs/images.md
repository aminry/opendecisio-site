---
title: Ask about images
description: Ask yes/no, choice and score questions about pictures, and find an object in one with a Box question, on a Gemma 4 server started with images on.
---

<!-- Site-written: the Ask about images guide. Its facts are decisio's docs/api.md, docs/box.md, docs/running.md, docs/upgrading.md, docs/reference/flags.md and EVAL_CARD.md at the pinned release (src/config/sourced.mjs checks them). -->

::covers{links="docs/api.md#images=2-send-the-images"}

A picture goes in the request, and the answer is the one you already read for text.
This script sends one photo as a data URL and asks whether the parcel in it is damaged:

```python
import base64
import json
import urllib.request

with open("photo.jpg", "rb") as f:
    image = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()

body = {
    "state": "A photo of a delivered parcel.",
    "images": [image],
    "questions": {"damaged": {"type": "noul", "instructions": "Is the parcel visibly damaged?"}},
}
request = urllib.request.Request(
    "http://127.0.0.1:8000/v1/systemone",
    data=json.dumps(body).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(request) as response:
    print("damaged:", json.load(response)["answers"]["damaged"]["noul"])
```

It prints the probability that the parcel is damaged.
Choice and score questions work the same way, and a Box question finds where something is in the picture.

## Start a server for images

A Gemma 4 base started with `--images on` reads the pictures with the engine that reads its text.
There is no second engine and no second copy of the weights:

::site-block{name="images-start"}

- Gemma 4 12B, including Decisio v3 and the FP8 repositories, and Gemma 4 31B take `--images on`, on the vLLM server or on a Mac.
- `--images on` does not combine with `--image-model`, `--one-engine` or `--mode packed`.
- `--max-images` is the most images one request may carry, 16 unless set.

On a Mac, the same flag works with the MLX backend and the extra `mlx-images`:

::site-block{name="images-mac-start"}

- Google's bf16 checkpoint has the vision weights.
  An MLX conversion made for text drops them and takes the base's vision add-on, which `--vision-weights` names.
- Box questions are not served on a Mac.

On Ollama, the untrained Gemma listing `aminroudaki/decisio-gemma` reads images through Ollama's own `images` field, on Ollama 0.40.4 or later.
Ollama puts the images before the state and has no Box question.
[On a Mac or a laptop](/docs/deploy/mac/) has the commands.

The Qwen base serves images through a second engine instead, started with `--image-model`:

::site-block{name="images-qwen-start"}

- Its two engines' default shares of the card fit one card together, so no memory flag is needed.
- `--one-engine` loads only the image engine and serves text on it too, for a card that cannot hold both.
- With an image engine, the longest text stays at 32,768 tokens, and a request may carry up to 128 images.

## Send the images

An image goes where its reference stands, inside the state or inside a question, and not all at the start.
A photo in the state is read by every question of the request.

A photo in a question's `instructions` or `criteria` is read by that question alone.

::figure{name="image-placement"}

Four ways to send one:

| How | What it looks like |
| --- | --- |
| A data URL in `images` | the list; an image no text names opens the state, and `[image N]` in the text places the Nth |
| A `data:image/...` URI inside the state | the image stands where the URI stands |
| An `assets` placeholder | `{"type": "image", "format": "png", "data_base64": "..."}`, named in the text, as System One sends images |
| A `multipart/form-data` request | the JSON in `request`, each file in its own part |

- PNG, JPEG or WebP; an animated image is refused.
- Up to 20 MB and 20 megapixels each; a request body over 32 MiB is refused with 413.
- A multipart request needs an `X-Decisio-Client` header, any value, or it is refused with 415.
- TypeSafe's Python SDK sends images as it does to System One, with nothing added.

## Ask where something is

A Box question finds an object and answers with one box, as fractions of the image, with a confidence.
Say what to find in `instructions`, a short noun phrase:

::figure{name="image-box"}

The request:

::site-block{name="images-box-request"}

The answer:

::site-block{name="images-box-answer"}

- Multiply `left` and `right` by the image's width and `top` and `bottom` by its height to crop.
- When the model says the target is absent, the answer is the whole image at `confidence` 0.
- `confidence` is the probability that the target is in the picture times how sure the model is of the edges.
  Use it to rank and compare, not as a probability of a correct box.
- To decide in code whether something is there, ask a yes/no question beside the Box and use the Box only where it says yes.
- Ask one thing per question: to find three mugs, ask for the left, the middle and the right one.

A Box question needs a Gemma server started with `--images on` on vLLM.
It is not served on a Mac or by the Ollama listings.

## Choose the image budget

`--image-budget` is the soft tokens one image may take: 70, 140, 280, 560 or 1120.
The picture is scaled to fill it, so a bigger budget gives small objects more tokens and costs more per image.

| Model | Default budget | What to know |
| --- | --- | --- |
| Gemma 4 12B | 560 | 1120 is refused at start: the 12B's window is 1,024 tokens, shorter than the block |
| Gemma 4 31B | 280 | 1120 is an opt-in; the 31B reads pictures through its own vision encoder |

::figure{name="image-budget"}

At 560 an image costs about 1.8 times the tokens of 280, and Box answers read better.
A small object in a large image is found better after you crop to its region and ask again, or at a higher budget.

A first read, with the image new to the server, was a median of this many milliseconds for one image, on one RTX PRO 6000 Blackwell at 600 W, with generated 512 by 512 pictures:

| Model and budget | One image (ms) | Four images (ms) | Sixteen images (ms) |
| --- | ---: | ---: | ---: |
| Gemma 4 12B, 280 | 85 | 202 | 727 |
| Gemma 4 12B, 560 | 117 | 353 | 1,379 |
| Gemma 4 31B, 280 | 143 | 372 | 1,426 |
| Gemma 4 31B, 1120 | 504 | 1,955 | 8,728 |

A second question on the same pictures reads them from the cache.
`/health` reports the budget in use and the budgets the base allows.

## Read the probabilities

Probabilities for a request with images are read at a temperature fitted for images.
Gemma 4 31B multiplies its text temperature by 1.376, fitted on images at budget 280.
Gemma 4 12B reads images at its text temperatures.

The Qwen route reads at 0.80, fitted on its layout.
An adapter keeps its own temperatures, and how well a tuned model reads pictures was measured for the previous tuned 12B only: Decisio v3 was trained on text, and its pictures are not measured.

## Limits

- **The 31B's text answers can shift with images on.**
  The 31B then serves text requests through its multimodal class too.
  On 100 BANKING77 questions the right answers moved from 73 to 69 at budget 280, beyond the spread between two images-off starts.
  A deployment that serves mostly text on the 31B can keep images off, or serve images from a separate server.
- **The 12B refuses budget 1120.**
- **No registered task applies to a request with images:** no certificate, no intent head, no fast table and no thinking when unsure.
- **Box needs a vLLM server.**
  It is not answered on a Mac, by the Ollama listings or on the `--image-model` route.
- **The Qwen route's figures were measured on its earlier layout.**
  `--image-prompt legacy` keeps that layout, is deprecated, and a later release removes it.
- **Generated scenes are easier than photographs.**
  Measure your own pictures before you rely on a figure.

## What next

- [Server flags](/docs/flags/): every flag of the image engines.
- [The HTTP API](/docs/api/): the images field, the multipart form and the System One `assets` field.
- [Requirements and limits](/docs/limits/): what was measured on what.
- [Release notes](/docs/releases/): what changed in each release.
- [Images on Gemma 4](https://github.com/aminry/decisio/blob/v0.47.0/docs/design/gemma-images.md): how a request's images reach the prompt, who sees them and where the cache ends, for anyone who wants the design.
