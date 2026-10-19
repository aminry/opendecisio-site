---
title: Deploying and operating
description: Running a server under a restart policy, keeping tasks across restarts, and what to put in front of it.
---

<!-- Site-written: the figure, the TL;DR, the glossary and the links. The restart policies are docs/running.md's "When the engine dies", and the security notes are SECURITY.md, at the pinned release. -->

A decisio server is a model server, not a hardened public endpoint: run it on a private network, behind your own proxy, under something that restarts it.

::figure{name="serve-lifecycle"}

## TL;DR

Wait until a server you started is ready, then check what it serves:

```bash
until curl -sf http://127.0.0.1:8000/health > /dev/null; do sleep 5; done
curl -s http://127.0.0.1:8000/health
```

:::glossary

| Word | Meaning |
| --- | --- |
| restart policy | what brings the server back after it exits: Compose's `restart: unless-stopped`, systemd's `Restart=on-failure`, or Kubernetes' `restartPolicy: Always` |
| exit code 70 | what the server exits with when its engine has died |
| single-tenant | one server per trust boundary: its cache and registered tasks are shared by every caller |

:::

:::caution[Common mistake]
Docker restarts a container when its process exits, not when its `HEALTHCHECK` reports it unhealthy.
It is the server's exit that brings a new one up, so give the container a restart policy.
:::

## 1. Run it under a restart policy

An engine that has failed does not serve again, so the server ends itself and leaves the restart to whatever runs it: compose `restart: unless-stopped`, as `compose.yaml` has it; systemd `Restart=on-failure`; Kubernetes' default `restartPolicy: Always`, with a liveness probe on `/health`.
The new server loads the engine again, so requests sent until it is healthy are refused.
[Health and monitoring](/docs/health/) says exactly what happens from the moment the engine dies.

## 2. Keep tasks across restarts

Registered tasks live in the server's memory.
[Teach a task](/docs/tasks/#6-keep-it-across-restarts) shows how to export them and load them again at start.

## 3. Put a proxy in front

::upstream{file="SECURITY.md" section="Deployment notes"}

## What next

- [Health and monitoring](/docs/health/): what to watch, and what a dead engine looks like.
- [Troubleshooting](/docs/troubleshooting/): symptoms and what the documentation says to do.
- [Upgrading](/docs/upgrading/): what changes for a running deployment between releases.
