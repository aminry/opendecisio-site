---
title: Upgrade
description: Move a running deployment to a new decisio release in eight steps, without losing your tasks or serving uncertified answers as certified.
---

<!-- Site-written: the Upgrade guide, as steps. The per-release notes are Upgrade notes (decisio's docs/upgrading.md at the pinned release); the facts are docs/upgrading.md's, docs/tasks.md's and SECURITY.md's (src/config/sourced.mjs checks them). -->

Every upgrade is the same eight steps, whatever the release.
Before you start, export what you have taught:

```bash
curl -s 'http://127.0.0.1:8000/v1/tasks?full=1' > tasks.json
```

## 1. Read the notes for every release you skip

[Upgrade notes](/docs/upgrade-notes/) has, for each release that changes what a deployment serves, who is affected and what to do.
Read every entry between your release and the one you are moving to.

## 2. Pin what you serve

- Install the exact release: `pip install "decisio[serve]==<version>"`, or a clone at its tag.
- Name the model repository at a commit, `--base tachara-ai/decisio-gemma-4-31b@<commit>`, so the weights cannot change under you.
- Give `--max-model-len` the same value on every card.

## 3. Start the new release next to the old one

Keep the old server serving, start the new one on another machine, and read its `/health`: the model, its checkpoint and revision, and `max_model_len` with its source.
A server takes 0.90 of its card's memory by default, leaving no room for a second: on a single card, stop the old server and start the new one in its place, at a quiet time or behind a maintenance page.

## 4. Load your tasks into it

Start it with `--tasks-file tasks.json`, or import the export with `POST /v1/tasks/import`.
A task taught under another model or rendering is not applied, and the server says so at start: teach it again from its examples.

## 5. Certify your tasks again

The decisio version is part of the serving setup a certificate covers, so a certificate made on the old release is suspended on the new one.
Certify each certified task again on the new server, on labelled examples that share no input with the task's fit, such as the held-out examples it was certified on.
The call keeps the certificate's settings unless the body sets them, the fewest examples it needs included: 59 at the 5% error target the walk-through task was certified at.
decisio ships 48 held-out tickets for that task, below 59, so the body below asks for a 10% error target, which needs 29, and sets that floor with `min_examples`.
For your own tasks, keep the error target and send at least as many new examples as the certificate needed.
Build the body from the tickets and send it to the task's `certify` route:

```bash
uv run python examples/tasks/register.py --id ticket-routing --data examples/tasks/heldout.csv --dry-run --out heldout.json
uv run python -c 'import json; b = json.load(open("heldout.json")); json.dump({"examples": b["examples"], "alpha": 0.1, "min_examples": 29}, open("recertify.json", "w"))'
curl -s http://127.0.0.1:8000/v1/tasks/ticket-routing/certify -H 'Content-Type: application/json' -d @recertify.json \
  | uv run python -c 'import json, sys; r = json.load(sys.stdin); c = r.get("certificate", r); print(json.dumps({k: c.get(k) for k in ("alpha", "n", "threshold", "certified_n")}, indent=1))'
```

The fit is kept; the call answers with the new certificate.

## 6. Check that it took

```bash
curl -s http://127.0.0.1:8000/v1/tasks/ticket-routing
```

The task's `status` should read `ok` for every certified task, with no `suspended`.

## 7. Move the traffic

Point your proxy at the new server, and watch `/health` and the server time as the traffic arrives ([Operate](/docs/operating/#2-watch-it)).

## 8. Stop the old server

Only the latest release receives security fixes, so do not keep the old one running.

## What next

- [Upgrade notes](/docs/upgrade-notes/): what each release changes for a running deployment.
- [Release notes](/docs/releases/): every change in every release.
- [Certify answers](/docs/tasks/certify/): what a certificate covers, and how to certify again.
