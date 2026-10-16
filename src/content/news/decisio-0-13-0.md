---
title: "decisio 0.13.0: long documents, read whole"
summary: "0.13.0 can read documents of about 98,000 tokens on the Gemma 4 31B and 65,536 on the 12B, as an opt-in. It is off by default, and the first question is slow."
date: 2026-10-15
tags: [release]
---

decisio reads a document once and answers every question about it from that read.
The problem is that until now "a document" meant 32,768 tokens at most.
0.13.0 lets you raise that, as an opt-in.
That's a long contract, a full incident log, or a whole support thread, read once and asked as many questions as you like.

`--max-model-len` now goes up to a ceiling per base: 98,304 tokens on the Gemma 4 31B and 65,536 on the 12B.
The Qwen base stays at 32,768.
It is off by default.
Every record in the repository was measured at 32,768, and that is still what you get.
Ask for more than the ceiling and the server won't start, and it tells you why.

The first question about a long document is slow.
On the 31B, on one RTX PRO 6000 (600 W) with vLLM 0.31.0, on 2026-10-15, the first question about a document of about 84,000 tokens took 40.8 s.
The second took 0.40 s.
Attention grows faster than the document does, so a longer context is slower than a proportional guess.

The ceilings come from a check on 30 items, each asked about a long state and again about the same items short.
The 31B answered 23 right at about 84,000 tokens, against 25 short.
The 12B started at 131,072 but answered 19 right at 120,000 tokens, against 26 short, so it failed the check.
Its ceiling is 65,536.
It answered 23 right at 60,000 (26 short), and 65,536 itself was not checked.
This is a smoke test, not an accuracy measurement.

`--kv-cache-dtype fp8` holds twice the tokens in the KV cache, and the tradeoff is that it changes the numerics.
A certificate made under the model's own cache dtype is suspended under fp8, and the answers of a registered task can move.
If you serve fp8, register and certify again under it.
The 31B did not need it on a 96 GB card at 98,304, where vLLM 0.31.0 reported room for 141,865 tokens.
On vLLM 0.30.0 it may need it, or a larger memory share, beyond about 57,000 tokens, and a smaller card is not measured.

To try the 31B at its ceiling: `uv run python -m decisio.serve.vllm_engine --base gemma-4-31b --max-model-len 98304`.
Check your own documents before you rely on it.
The [docs page for 0.13.0](/docs/guides/long-and-wide/#2-the-context-length) has the memory figures and what is not measured.
