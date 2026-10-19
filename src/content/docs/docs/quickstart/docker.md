---
title: Docker
description: Run the server in a container on a GPU host.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The section below is decisio's docs/running.md at the pinned release. -->

The container is the GPU server with its dependencies pinned, started with Docker Compose.
It serves the default base, Gemma 4 31B, and needs the NVIDIA Container Toolkit and a GPU host.

::figure{name="docker-flow"}

## TL;DR

::upstream{file="docs/running.md" section="Docker" block="1"}

:::glossary

| Word | Meaning |
| --- | --- |
| wheel | the Python package the image installs, built by `uv build --wheel` |
| NVIDIA Container Toolkit | what lets a container see the card |
| volume | `decisio-data`, where the first start downloads the checkpoint, so it is never part of the image |

:::

:::caution[Common mistake]
Before 0.10.0 the container served the Qwen base; it now serves the 31B, which needs a 96 GB card.
To keep the Qwen base set `DECISIO_BASE=qwen3.6-35b-a3b` ([Upgrading](/docs/upgrading/)).
:::

## How the container starts

::upstream{file="docs/running.md" section="Docker" covers="README.md#docker"}

## What next

- [Deploying and operating](/docs/operating/): restart policies, tasks across restarts and security.
- [Upgrading](/docs/upgrading/): what changed in a release for a running deployment.
- [GPU server](/docs/quickstart/gpu-server/): the same server without the container.
