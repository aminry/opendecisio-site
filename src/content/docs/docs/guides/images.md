---
title: Images
description: Send up to two images with a request; a second engine on the same card reads them, and the answers have the same shape.
---

<!-- Site-written. Every statement is the README's, docs/api.md's, docs/cli.md's or EVAL_CARD.md's at the pinned release; the image route was measured with the Qwen base only. -->

A request can carry images beside its text.
Image input is served by a second engine on the same card, so it needs a server started for it, and it was measured with the Qwen base only.

::figure{name="images"}

## TL;DR

On a GPU server started with `--image-model`, this script sends one image as a data URL with a question about it.
It is a shape to adapt, not a command to run: it needs that server and an image of yours.

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
# the probability of yes, as for a text-only request
```

:::glossary

| Word | Meaning |
| --- | --- |
| image engine | a second engine on the same card, started with `--image-model`, that serves the requests that carry images |
| data URL | an image written into the request as `data:image/...;base64,...` |
| route | which engine served the request; `x-decisio-route` is `image` for these |

:::

## 1. Start a server for images

`--image-model` names the full multimodal checkpoint and starts the second engine, with its share of the card (`--image-gpu-memory-utilization`, 0.5 by default; the measured shares were 0.49 beside the text engine at 0.47).
`--one-engine` loads only the image engine and serves text requests on it too, for a card that cannot hold both, and changes the text route's class.
A Mac's MLX backend refuses the image route.

## 2. Send the images

Up to 2 images per request, PNG, JPEG or WebP, up to 20 MB each, as data URLs in `images`, as `data:image/...` URIs anywhere inside the state, or as a `multipart/form-data` request whose `request` field holds the JSON body and whose `image`, `images` or `image[]` fields hold the files.
A multipart request must carry an `X-Decisio-Client` header (any value, for example `X-Decisio-Client: my-app`); without one it is refused with 415.
`x-decisio-route: text` or `image` chooses the route explicitly.

## 3. What was measured

On ImajevBench v2.0-lite, 254 labelled items, the Qwen base scored 0.717 on all items and 0.791 on the 230 answerable ones; with a "can't tell" option offered, 0.756 and 0.813, with 5 of the 24 unanswerable items right and 2 false abstentions; the median request took 166 ms.
The image route is not tempered, and it keeps the compact prompt layout.

:::caution[Common mistake]
The Gemma bases were not measured on the image route.
Use the Qwen base for images, and say so when you quote a figure.
:::

## What next

- [Flags and options](/docs/flags/): every flag of the image engine.
- [The HTTP API](/docs/api/): the images field and the multipart form.
- [Choosing a base](/docs/bases/): why the Qwen base is the one measured for images.
