---
title: Ask about images
description: Send up to two images with a request and ask about them as you ask about text, on a server started with an image engine.
---

<!-- Site-written: the Ask about images guide. Its facts are decisio's docs/api.md, docs/cli.md, docs/running.md, docs/tasks.md and EVAL_CARD.md at the pinned release (src/config/sourced.mjs checks them). -->

::covers{links="docs/api.md#images=2-send-the-images"}

Ask about images as you ask about text: the same questions, the same answers, with up to two images in the request.
This script sends one photo as a data URL, to a server started for images:

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
    print(json.load(response)["answers"]["damaged"]["noul"])
```

## 1. Start a server for images

Use the Qwen base: the image route was measured with it only.
`--image-model` adds an image engine on the same card, for the requests that carry images:

::site-block{name="images-start"}

- The image engine takes its own share of the card: `--image-gpu-memory-utilization`, 0.5 by default.
- `--one-engine` loads only the image engine and serves text on it too, for a card that cannot hold both.
- With an image engine, the longest text stays at 32,768 tokens.
- A Mac does not serve images.

## 2. Send the images

| Limit | What it is |
| --- | --- |
| Images per request | up to 2; a third is refused with 422 |
| Formats | PNG, JPEG or WebP |
| Size | up to 20 MB and 20 megapixels each; a larger one is refused with 422 |
| How | data URLs in `images`, `data:image/...` URIs inside the text, or a `multipart/form-data` request |

- A multipart request needs an `X-Decisio-Client` header, any value; without one it is refused with 415.
- `x-decisio-route: image` or `text` chooses the route explicitly; the answer's `x-decisio-route` header says which served it.

## 3. Know what an image costs

The image is resized, keeping its proportions, and costs one token for every 32 by 32 pixels: between 64 and 16,384 tokens.
A 1,024 by 768 image costs 768 tokens, and a 1,920 by 1,080 one 2,040.
They count in `usage.input_tokens` and against the 32,768-token length.

## 4. Know what it does not do

- A request with images carries no certificate.
- A taught task's examples are text only; an abstention threshold's examples may carry images.

The image route's scores, on the Qwen base, are in [the evaluation card](/docs/evaluation-card/).

## What next

- [Server flags](/docs/flags/): every flag of the image engine.
- [The HTTP API](/docs/api/): the images field, the multipart form and the System One `assets` field.
- [Requirements and limits](/docs/limits/): what was measured on what.
