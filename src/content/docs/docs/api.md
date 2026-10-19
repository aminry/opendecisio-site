---
title: HTTP API
description: Every route, request field and response field of a decisio server, in TypeSafe's System One wire format.
---

<!-- Site-written: the intro, the commands and the links. The reference below is decisio's docs/api.md at the pinned release. -->

The server answers questions on `POST /v1/systemone`; its other routes teach and certify tasks, set abstention thresholds, and say what it serves.
Ask what a server serves, check that it is up, then ask one question:

```bash
curl -s http://127.0.0.1:8000/v1/models
curl -s http://127.0.0.1:8000/health
curl -s http://127.0.0.1:8000/v1/systemone \
  -H 'Content-Type: application/json' \
  -d '{"state": "My card keeps getting declined when I renew.", "questions": {"category": {"type": "choice", "instructions": "Which team should handle this ticket?", "criteria": {"billing": null, "access": null, "bug": null}}}}'
```

- A request the server cannot read is answered with 422, and one the model cannot answer with 400, each with a `detail` naming the problem.
- The answer's `confidence` field is System One's own figure, the top probability rescaled; thresholds and certificates use the top probability itself, the largest of `probabilities`.

## Reference

::upstream{file="docs/api.md"}

## What next

- [Call it from your code](/docs/use-from/): the same request from Python, JavaScript and TypeScript.
- [Teach a task](/docs/tasks/): the task routes, in use.
- [Operate](/docs/operating/): health, restarts and security.
