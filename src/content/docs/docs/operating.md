---
title: Operate
description: Keep a decisio server up, know at a glance when it is not, and secure what sits in front of it.
---

<!-- Site-written: the Operate guide, merging Deploying and operating with Health and monitoring. Its facts are decisio's docs/running.md ("When the engine dies"), docs/api.md ("What to watch", the response headers), docs/operating.md and SECURITY.md at the pinned release (src/config/sourced.mjs checks them). -->

::covers{links="docs/operating.md docs/running.md#when-the-engine-dies=know-what-happens-when-the-engine-dies docs/running.md#checking-a-server=watch-it docs/api.md#what-to-watch=watch-it SECURITY.md#deployment-notes=secure-it SECURITY.md#cross-site-requests-from-a-web-page=secure-it SECURITY.md#reporting-a-vulnerability=secure-it SECURITY.md=secure-it"}

Wait until a server is ready, then read what it serves:

```bash
until curl -sf http://127.0.0.1:8000/health > /dev/null; do sleep 5; done
curl -s http://127.0.0.1:8000/health
```

::figure{name="serve-lifecycle"}

## Run it under a supervisor

<span class="fp-anchor" id="1-run-it-under-a-supervisor"></span>

When its engine dies, the server exits with code 70 and leaves the restart to whatever runs it.

| Supervisor | Setting | The full file |
| --- | --- | --- |
| Docker Compose | `restart: unless-stopped` | [With Docker](/docs/deploy/docker/#2-run-it-with-compose) |
| systemd | `Restart=on-failure`, `TimeoutStartSec=infinity` | [On a cloud GPU](/docs/deploy/cloud-gpu/#5-keep-it-running) |
| Kubernetes | `restartPolicy: Always`, a liveness probe on `/health` | [On a cloud GPU](/docs/deploy/cloud-gpu/#5-keep-it-running) |

- **Give the first start time.** It downloads the weights: allow 45 minutes, as the image's own health check does.
- **Keep the weights on a volume**, so a restart does not download them again.
- **Requests sent while the new server loads are refused**, so retry them in your client.

## Watch it

<span class="fp-anchor" id="2-watch-it"></span>

| Watch | Where | What a bad value means |
| --- | --- | --- |
| The status of `/health` | `GET /health` | anything but 200: alert; 503 means the engine has died |
| The exit code | your supervisor | 70: the engine died and the server ended itself |
| Server time | the `x-decisio-server-ms` header | the server's time for the request, without the network |
| Queueing | `wait` in the `x-decisio-stages` header | a growing `wait` is requests queueing behind the one engine |
| What answered | the `x-decisio-tasks` and `x-decisio-adapter` headers | which taught task answered, and the adapter if the server serves one (`--adapter`) |
| Certified tasks | `GET /metrics` | see [Watch for drift](/docs/tasks/drift/) |

Ask one question and print what it cost:

```bash
curl -s -D - -o /dev/null http://127.0.0.1:8000/v1/systemone \
  -H 'Content-Type: application/json' \
  -d '{"state": "Both charges are 49.00 EUR, same day. Please refund one.", "questions": {"urgent": {"type": "noul"}}}' \
  | grep -i '^x-decisio'
```

- The server runs one engine; concurrent requests queue behind it and are answered in turn, first come, first served, with no queue limit. [Batch concurrent requests](/docs/concurrency/) scores the waiting ones together instead.
- There are no engine metrics and no structured log: take latency and queueing from the headers, in your client or your proxy's log.
- After a deploy, read `/health` for the model, its checkpoint and revision, and `max_model_len` with its source.

## Respond to failures

| What you see | Application or operator action |
| --- | --- |
| Readiness is not 200 | Stop sending new work to that replica; let its supervisor recover it |
| A request times out or returns 5xx | Use the review/fallback path, then retry only as your application policy allows |
| Requests return 422 | Fix the input or prompt length before sending them again |
| A task is not certified | Keep its suggestion for review; inspect the task status and reason |
| Store writes fail | Keep serving loaded records; restore the store before teaching again |

The [recipe callers](/docs/use-cases/) demonstrate timeout and review behavior.

## Know what happens when the engine dies

<span class="fp-anchor" id="3-know-what-happens-when-the-engine-dies"></span>

The figure above is the sequence: the server checks the engine, answers 503, finishes what is in flight, exits with code 70 about 7 seconds after the failing request, and your supervisor starts it again.
Once the engine is dead, every request, and `/health`, answers at once with the reason:
`{"ok": false, "engine": "dead", "reason": "...", "exit_code": 70}`

- A death between requests turns `/health` to 503 within a second, before any request arrives.
- An error caused by the request itself, such as a 422, is answered and does not touch the engine.

## Keep tasks across restarts and replicas

<span class="fp-anchor" id="4-keep-tasks-across-restarts-and-replicas"></span>

Tasks survive a restart with `--tasks-dir`, and replicas share them with `--task-store`.
[Set up for production](/docs/production/#keep-tasks-across-restarts-and-replicas) has the settings.

## Secure it

<span class="fp-anchor" id="5-secure-it"></span>

1. **Keep it on a private network, behind your proxy.** The server listens on `127.0.0.1` by default; do not expose it to the internet.
2. **Put authentication, rate limits and request-size limits in the proxy.** The server has none.
3. **Restrict the routes that change it** to trusted callers: `POST /v1/tasks`, `POST /v1/tasks/import`, `DELETE /v1/tasks/{id}` and the abstention routes.
4. **Do not configure CORS on the proxy** for this server: it would let a web page's browser send requests to it.
5. **Run one server per trust boundary**, one for each group of callers that trust each other: its cache and its tasks are shared by every caller.
6. **Leave `--debug-readout` off.** It exposes the model's raw readouts.
7. **Keep to the latest release:** it is the one that receives security fixes.

Report a vulnerability through [the repository's private vulnerability reporting](https://github.com/aminry/decisio/security/advisories/new), not a public issue: an acknowledgement comes within 5 working days, an assessment within 15.

## What next

- [Scale](/docs/scale/): many questions, long texts and the settings that move server time.
- [Upgrade](/docs/upgrading/): move to a new release without losing your certificates.
- [Troubleshoot](/docs/troubleshooting/): what you see, why, and what to do.
