---
title: With Docker
description: Run decisio in a container on a GPU host, from the release image pinned by digest, with the weights in a volume and a restart policy.
---

<!-- Site-written: the deploy guide for Docker. The image is the release's, by the digest its notes give (upstream.json, checked against the release in CI); the compose file is decisio's docs/operating.md, run from that image (src/lib/site-blocks.mjs); the facts are docs/running.md's "Docker" and "When the engine dies" (src/config/sourced.mjs checks them). -->

::covers{links="README.md#docker README.md#with-docker docs/running.md#docker docs/operating.md#docker-compose=2-run-it-with-compose"}

One command starts it from the release image; it is ready when `/health` answers.

::site-block{name="docker-run"}

::figure{name="layout-docker"}

## 1. What you need

- A Linux host with one NVIDIA card, sized as on [a cloud GPU](/docs/deploy/cloud-gpu/#1-pick-your-card).
- Docker with the NVIDIA Container Toolkit, so the container can see the card.

## 2. Run it with Compose

decisio's compose file, from the release image:

::site-block{name="docker-compose"}

Save it as `compose.yaml` and run `docker compose up -d`.

## 3. Choose what it serves

| Setting | What it does |
| --- | --- |
| `DECISIO_BASE` | the model: `gemma-4-31b` by default, or `gemma-4-12b`, `qwen3.6-35b-a3b`, or a decisio model repository |
| `DECISIO_MODEL` | a checkpoint instead; it brings the model its `config.json` declares |
| `DECISIO_HOST`, `DECISIO_PORT` | where the server listens inside the container |

Arguments after the image name go to the server, so every [server flag](/docs/flags/) works.

## 4. What to know

- The first start downloads the weights into the `decisio-data` volume at `/data`. They are never part of the image, and a restart does not download them again.
- The container runs as a non-root user, and the port is published on `127.0.0.1` only.
- It checks for an NVIDIA GPU first, and exits with an explanation when it cannot see one.
- When its engine dies, the server exits with code 70. Docker restarts a container when its process exits, not when its health check fails, so `restart: unless-stopped` brings it back.
- After upgrading the image, certify your tasks again ([Upgrade](/docs/upgrading/)).

## 5. Build the image yourself

To build from source instead, from a clone of the release:

::site-block{name="docker-build"}

This builds the image from decisio's own `Dockerfile` and `compose.yaml`, with no image digest to set.

## What next

- [On a cloud GPU](/docs/deploy/cloud-gpu/): the same server without a container, under systemd or Kubernetes.
- [Requirements and limits](/docs/limits/): every machine, the context length and what was measured on what.
- [Operate](/docs/operating/): health, monitoring and what to watch in production.
