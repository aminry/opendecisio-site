---
title: "decisio 0.25.0: taught tasks survive restarts, and replicas share them"
summary: "0.25.0 saves taught tasks to disk so a restart keeps them, and shares them between replicas through object storage, so a task taught once reaches every server."
date: 2026-10-22
tags: [release]
---

Until now, a task you taught lived in one server's memory: a restart lost it, and a second replica never had it.
decisio 0.25.0 keeps it.

## A restart keeps what you taught

Start the server with `--tasks-dir` and every task is saved to that directory before the server answers, and loaded at the next start.
A save is all or nothing: a crash leaves the old version or the new one, and a save that fails fails the request, so nothing is registered that was not saved.
Add `--require-tasks N` and a server that finds fewer than N usable tasks refuses to start, so a volume that failed to mount stops the server instead of leaving it answering untaught.

## Replicas share one set of tasks

Start every replica with `--task-store` pointing at object storage, such as `s3://bucket/prefix`.
A task taught on any replica reaches the others within seconds (5 by default), as the same fitted record, so every replica serves the same numbers.
If two people teach the same task at once, the second gets a 409 instead of overwriting the first.
`--task-store-readonly` keeps teaching on one replica, and if the store goes away the replicas keep serving what they have while teaching waits.

## Before you rely on it

- The shared store was checked against RustFS and SeaweedFS. It has not been run on AWS S3, R2, MinIO, GCS or Azure; a replica refuses to start on a store that does not enforce conditional writes, which is the check that tells you whether yours works.
- Each replica keeps its own traffic monitors: sum their metrics across replicas.
- A certificate holds on one serving setup, so a fleet with certified answers runs the same engine, card and settings on every replica.
- One directory belongs to one server; replicas share through the store, not through one mounted directory.

One more change: an abstention threshold now applies only on the served name it was fitted for. One fitted under another name is kept and not applied, so register it again under the name you serve.

[Teach a task](/docs/tasks/#6-keep-it-across-restarts) and [Operate](/docs/operating/#4-keep-tasks-across-restarts-and-replicas) have the details, and [Release notes](/docs/releases/) has every change.
