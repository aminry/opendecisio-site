---
title: On a cloud GPU
description: Run decisio on one NVIDIA card, serve the default model on port 8000, pin what it serves, and keep it running under a supervisor.
---

<!-- Site-written: the deploy guide for one NVIDIA card. Its commands are decisio's at the pinned release (src/lib/site-blocks.mjs, and docs/running.md and docs/operating.md through ::upstream); its numbers are those files' and the README's (src/config/sourced.mjs checks them). -->

::covers{links="README.md#gpu-server README.md#on-a-gpu-with-pip docs/running.md#gpu-server docs/running.md#model-repositories=3-pin-what-you-serve docs/operating.md#systemd=5-keep-it-running docs/operating.md#kubernetes=5-keep-it-running"}

Install it from PyPI and start it: it serves the default model, Gemma 4 31B, on `http://127.0.0.1:8000`, ready once `/health` answers.

::site-block{name="gpu-pip"}

::figure{name="layout-gpu"}

## 1. Pick your card

| Model | Weights in memory | Measured on | Longest text, with no flag |
| --- | --- | --- | --- |
| Gemma 4 31B, the default | 30.6 GiB, FP8; about 31 GB to download | one 96 GB card; also starts and answers on one 80 GB H100 PCIe | the largest that fits, 32,768 to 98,304 tokens |
| Gemma 4 12B | 22.8 GiB, bf16 | one 96 GB card; served 65,536 tokens on the same H100 | 32,768 to 65,536 tokens |
| Gemma 4 12B in FP8 | 12.74 GiB, FP8 | one 32 GB RTX 5090, at its full context | 32,768 to 65,536 tokens |
| Qwen3.6-35B-A3B | 33.3 GiB, FP8; about 36 GB to download | one 96 GB card | 32,768 tokens |

Start another model with `--base gemma-4-12b`, `--base gemma-4-12b-fp8` or `--base qwen3.6-35b-a3b`.
[Choosing a model](/docs/bases/) compares them; [Requirements and limits](/docs/limits/) has every machine.

| Part | What you need |
| --- | --- |
| System | Linux, with one NVIDIA card |
| Driver | one that supports CUDA 13.0 |
| Python | 3.12 |
| Disk | room for the first download, in the Hugging Face cache |

## 2. Start the server

The first start downloads the weights and loads them onto the card.
The 31B was ready after 7 min 54 s with the download, and after 4 min 3 s with the weights already on disk.

::source[Measured on decisio 0.11.0 from PyPI, one RTX PRO 6000 Blackwell at 600 W, 2026-10-09.]

It is ready when `/health` answers 200, with the model and the longest text it serves:

::site-block{name="health-31b"}

::source{value="health-recorded"}

pip resolves its own versions around the engine.
For exactly the versions decisio was measured with, install from a clone of the release with its lock file:

::site-block{name="gpu-clone"}

## 3. Pin what you serve

Name the model repository at a commit, so a later change to it cannot change your answers:

::upstream{file="docs/running.md" section="Model repositories" block="1"}

- The server checks the repository's settings against its own and refuses to start on a difference, naming what differs.
- Pin `--max-model-len 32768` unless you need longer texts: `--max-model-len 32768` serves only what was measured, and the same value on every card keeps one certificate valid on all of them, since the length served is part of what it covers.
- After upgrading decisio, certify your tasks again ([Upgrade](/docs/upgrading/)).

## 4. Put it behind a proxy

- The server listens on `127.0.0.1:8000`; `--host` and `--port` change that.
- It has no authentication. Put a reverse proxy that authenticates the caller in front of it, and call it from your backend.

## 5. Keep it running

When its engine dies, the server answers 503 and exits with code 70, so a supervisor can start a new one.
With systemd, for a clone in `/opt/decisio` and a user `decisio`:

::upstream{file="docs/operating.md" section="systemd" block="1"}

On Kubernetes, one GPU, the weights on a volume, and `/health` as the startup and liveness probe:

::site-block{name="kubernetes"}

- Each probe reads `/health`: 200 once the engine is loaded, 503 from the moment it has died.
- Each replica is a separate server with its own registered tasks, which live in memory.

## What next

- [With Docker](/docs/deploy/docker/): the same server from the release image, with Compose.
- [Requirements and limits](/docs/limits/): every machine, the context length and what was measured on what.
- [Operate](/docs/operating/): health, monitoring and what to watch in production.
