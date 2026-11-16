---
title: Release notes
description: What changed in each release.
---

<!-- Site-written: the intro, the command, the summary of the latest releases and the links. The upgrade notes are decisio's docs/upgrading.md and the changelog its CHANGELOG.md, at the pinned release: the site's one page of version history. -->

Every change in every decisio release, newest first, and for the releases that change what a deployment serves, who is affected and what to do.
After upgrading, certify your tasks again ([Upgrade](/docs/upgrading/)).
To see which release a checkout has:

```bash
uv run python -c "from importlib.metadata import version; print(version('decisio'))"
```

::figure{name="release-timeline"}

## The latest releases: 0.48.0 and 0.47.0

Both were released on 2026-11-15, and together they bring pictures to decisio.
The [news post](/news/images-gpu-mac-ollama/) has the measured figures, and [Ask about images](/docs/images/) is the guide to using them.

**0.48.0**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.48.0)

- **Images on a Mac:** `--backend mlx --images on` with the extra `mlx-images`.
  A conversion made for text takes the base's vision add-on, and Box questions are not served on a Mac.
- **Ollama listings that read images:** `aminroudaki/decisio-gemma` and `aminroudaki/decisio-gemma-tuned`, with decisio's own prompt and temperatures, on Ollama 0.40.4 or later.
- **A tool for GGUF files** for llama.cpp's and Ollama's decision route, `python -m decisio.hub_gguf`.
- **Fixed:** the System One template is written without `\x` escapes, so that Ollama 0.40.4's llama.cpp loads it.

**0.47.0**, [on GitHub](https://github.com/aminry/decisio/releases/tag/v0.47.0)

- **Images on Gemma 4 12B and 31B**, served with vLLM and `--images on`: yes/no, choice and score questions about one or more pictures, which can stand in the state or in a question's own text.
- **Box questions:** find a described object in a picture and get its box with a confidence, or the whole image at confidence 0 when the model says it is absent.
- **The Qwen image route reads each image at its place**, as the Gemma bases do.
  The earlier layout stays as `--image-prompt legacy`, which is deprecated.
- **New image defaults:** the 12B reads images at a budget of 560 and the 31B at 280, with 1120 an opt-in on the 31B.
  Image answers on the 31B and on the Qwen route use temperatures fitted on images.
  Requests without images keep their temperatures.
- **Fixed:** a Gemma server started with `--images on` starts again, and the 31B starts with it as documented.
  A Box question whose reply says there is no box answers with the whole image at confidence 0.
  Gemma 4 31B takes image budget 1120, and a base without a vision encoder refuses a budget whose image block is longer than its window.
  Image uploads from client SDKs are accepted, and the image wire rules cover part content types, reference lengths, animated images and a 32 MiB request body.
  The `--image-model` engine loads at a pinned revision and is checked before any engine is built.
  Box questions are read under the plain layout on any server.

The upgrade notes below say who is affected, and what to do.

## Upgrade notes

::upstream{file="docs/upgrading.md" depth="3"}

## The changelog

::upstream{file="CHANGELOG.md"}

## What next

- [Upgrade](/docs/upgrading/): the steps of every upgrade.
- [Choosing a model](/docs/bases/): which model is the default, and why.
- [Evaluate a task](/docs/evaluation-card/): check your application after an upgrade.
