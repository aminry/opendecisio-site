---
title: With Docker
description: Run decisio in a container on a GPU host, from the release image pinned by digest, with the weights in a volume and a restart policy.
---

<!-- Site-written: the deploy guide for Docker. The images are the release's and its fast-table image's, by the digests its notes give (upstream.json, checked against the release in CI); the compose file is decisio's docs/operating.md, run from that image (src/lib/site-blocks.mjs); the facts are docs/running.md's "Docker" and "When the engine dies" (src/config/sourced.mjs checks them). -->

::covers{links="README.md#docker README.md#with-docker docs/running.md#docker docs/operating.md#docker-compose=2-run-it-with-compose docs/running.md#the-fast-table-image=5-run-fast-tables-with-no-hub-access"}

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
It is ready when `/health` answers 200, as [a healthy server's answer](/docs/deploy/cloud-gpu/#2-start-the-server) shows.

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

## 5. Run fast tables with no Hub access

Every release also publishes a fast-table image, `<version>-table`: the release image, unchanged, with the [fast table](/docs/tasks/fast-table/)'s add-on and both static students built in.
A fast table of kind `static`, base or multilingual, is then fitted and served with no Hub access, so it suits offline and locked-down hosts:

::site-block{name="docker-run-table"}

- **What it adds:** the `decisio[table]` extra (scikit-learn, and onnxruntime on the CPU), and potion-base-8M (31 MB) and potion-multilingual-128M (531 MB) at their pinned revisions, with their MIT model cards.
- **Its size:** 551 MB more than the release image, as Docker reports it (9,629 MB against 9,078 MB).
- **`HF_HUB_OFFLINE=1` is safe for the tables.** The model's weights still come from the volume or the Hub, as for the release image.
- **`DECISIO_STUDENTS_DIR`** points decisio at the students, `/opt/decisio/students` in the image, outside the Hugging Face cache on the volume, which would hide them. A student's file there is read first, checked against its pinned sha256, and fetched from the Hub only when it is missing.
- **Nothing else changes:** the user, the entry point, the health check and the flags are the release image's, and it has its own digest and attestations in the release notes.

The encoder student (`"kind": "encoder"`, bge-base, 436 MB) is not built in.
Build it into the image from a clone of the release, or fetch its files into the volume as [Answer short tasks faster](/docs/tasks/fast-table/#3-ask-for-it) shows:

::site-block{name="docker-build-table-encoder"}

## 6. Build the image yourself

To build from source instead, from a clone of the release:

::site-block{name="docker-build"}

This builds the image from decisio's own `Dockerfile` and `compose.yaml`, with no image digest to set.

## What next

- [On a cloud GPU](/docs/deploy/cloud-gpu/): the same server without a container, under systemd or Kubernetes.
- [Requirements and limits](/docs/limits/): every machine, the context length and what was measured on what.
- [Operate](/docs/operating/): health, monitoring and what to watch in production.
