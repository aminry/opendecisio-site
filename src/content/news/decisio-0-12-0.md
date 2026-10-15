---
title: "decisio 0.12.0: certified answers"
summary: "0.12.0 lets you certify which answers to act on, from your own labelled examples. It also refuses non-JSON POSTs and sets memory limits on a Mac."
date: 2026-10-14
tags: [release]
---

decisio gives you a probability for every answer. The problem is knowing which answers you can act on without a person checking. 0.12.0 settles that from your own labelled examples.

**Certified answers**

- Register a task with a few hundred labelled examples and a `certify` block. At the defaults the floor is 59 held-out examples, and with fewer the server refuses.
- The server holds half of them back and finds the confidence above which at most 5% of answers are wrong, with 90% confidence. Both numbers are yours to change.
- Every later answer comes back `certified: true` or `certified: false`. Automate the true ones. Send the rest to a person.

In the docs' example (the 12B on a Mac, 400 support tickets, at most 15% wrong), 169 of 200 held-out tickets were certified. 17 of those were wrong. That is about 10%, under the 15% asked for.

The tradeoff: a certificate holds for one task on one serving setup. Change the model, the engine or the version, and certification pauses until you certify again. That is deliberate. A promise that quietly outlives its setup is not a promise.

**Smaller changes**

- **Taught heads get a temperature.** A task's intent head now carries its own, fitted on its out-of-fold scores. Same answers, probabilities that fit your examples better.
- **Non-JSON requests are refused.** Any web page could make your browser POST to `localhost:8000` and spend engine time. The server now refuses anything that is not JSON before doing any work. Image uploads need one extra header.
- **Memory limits on a Mac.** One 12B server could grow to about 50 GB on a 64 GB Mac, and with a second server it froze ours twice. The server now caps itself, and a base that does not fit is refused, with the numbers. Run one model server per Mac.

**Upgrading**

`pip install -U decisio`, or the image `ghcr.io/aminry/decisio:0.12.0`. The [releases page](/docs/releases/) has the full notes.

If you automate decisions today with a threshold you picked by hand, register the task with `certify` and let your examples pick it.
