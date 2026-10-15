---
title: "decisio 0.11.1: the 12B no longer slows down when new documents arrive back to back"
summary: "Two server changes: the Gemma 4 12B now registers a document's boundary before the question, and every request records how long it waited for the engine."
date: 2026-10-14
tags: [release]
---

decisio 0.11.1 is out, with two changes in the server.

The first is for the Gemma 4 12B. To answer later questions about a document quickly, the server saves its reading of the document (it calls this registering the document), which costs about one extra read. On the 12B that extra read happened after the answer, so the next request had to wait behind it, even when it was about a different document.

We measured this on 0.10.0, on one RTX PRO 6000 at 600 W. The figures are server time, for one question on each of ten new documents sent back to back. The first request took 378 ms at 3,000 tokens and the median of the nine later ones 771 ms. At 6,000 tokens it was 812 ms and 1,613 ms.

The 12B now registers before the question, as the 31B does. With that setting, on 0.10.0, the same series reads 413 ms and 417 ms at 3,000 tokens, and 834 ms and 834 ms at 6,000. The registration costs 22 ms and 17 ms over not registering at all. `--register-boundary after` still works, and it makes a single first question on an idle server slightly faster.

The second change is a record. Each request now says how long it waited for the engine, whether behind a registration or behind another request: `timing.waited_ms` on `POST /v1/answer`, and `wait=` in the `x-decisio-stages` header of `POST /v1/systemone`. Under the new default the header `x-decisio-wait-behind: registration` rarely appears. The wait was real before. No field showed it.

The image is `ghcr.io/aminry/decisio:0.11.1`. The [release notes](https://github.com/aminry/decisio/releases/tag/v0.11.1) give its digest and the command that verifies it.
