---
title: "decisio 0.24.0: the 12B on a 32 GB card, batched serving, and thinking that reasons"
summary: "0.24.0 adds the Gemma 4 12B in FP8 (full 65,536 tokens on a 32 GB card), faster opt-in batched serving, and a fix so think-when-unsure reasons."
date: 2026-10-22
tags: [release]
---

Two releases, three things you can use now.

## The 12B on a 32 GB card

decisio 0.24.0 serves the Gemma 4 12B in FP8 beside its bf16 build: `--base gemma-4-12b-fp8`, from Google's checkpoint quantized as it loads, or from the stored conversion, [`tachara-ai/decisio-gemma-4-12b-fp8`](https://huggingface.co/tachara-ai/decisio-gemma-4-12b-fp8).
On a 32 GB card it serves its full 65,536 tokens of context at the default share, where the 12B in bf16 starts only at 4,096.
It is also quicker: one question took 0.64 times the bf16 12B's server time (median 88.4 against 135.2 ms).
Its answers are close to the bf16 12B's, not the same: on 200 questions the likeliest answer matched on 96%, the largest probability difference 0.438.

It is a second option, not a replacement.
The bf16 12B stays the 12B's default, and every 12B record of decisio's is bf16 unless it says otherwise.
The FP8 12B has its own served name and serving fingerprint, so a task taught or certified on the bf16 12B has to be registered and certified again on it.
Its temperatures are the bf16 12B's until they are refitted on FP8 reads, and a Mac does not serve it.

Measured on one RTX 5090 with vLLM 0.31.0, on 2026-10-21; the answers and the time with both precisions at 4,096 tokens and 0.95 of the card.

## More requests a second under load, if you opt in

decisio 0.23.0 added `--concurrency batched`: the requests waiting for the engine are scored together in one call, so concurrent requests share the model's forward passes.
0.24.0 fixes what held it back, and on the 12B in FP8 it now answers 8.9 and 9.2 requests a second at 8 and 16 clients, against 7.2 one at a time, on requests about new texts of about 1,000 tokens.

Measured on one RTX 5090 with vLLM 0.31.0, on 2026-10-21, at 0.95 of the card and 4,096 tokens.

What does not change: the default stays serial, one request at a time.
A request that arrives at an idle server is answered at once, alone, exactly as on a serial server.
A certified task's questions, and every registration and certification, still go one at a time, so certified answers are made and served on the same reads.
Other answers can move slightly with the traffic they arrive with, and a certificate made on one mode is suspended on the other until you certify again.
Only the 12B in FP8 has been measured this way, and the gain depends on the card, the model and how often texts repeat: measure it on your own traffic.

0.23.0 also made the engine's queue first come, first served on every server: under load, a request waits for the requests that arrived before it, in order.

## Thinking when unsure now reasons

Think-when-unsure reads an unsure question again after the model writes its reasoning.
On a default server, the releases since it arrived did not write reasoning, and every thinking question ran to its token budget on text that was not reasoning.
0.24.0 fixes that: the reasoning is text now, usually shorter than the budget, so thinking answers change and are faster.
It has been checked on one RTX 5090; the release notes give the details.
If you serve with thinking on, upgrade, check your `--think-factor` against measured answers, and certify again the tasks you certify under thinking.
Thinking with decisio's default model class now needs the engine in the server's process, the default; `--engine-process separate` with `--think` is refused at start.

The docs have each of these in full: [Choosing a model](/docs/bases/#4-the-12b-in-fp8), [Batch concurrent requests](/docs/concurrency/), [Think when unsure](/docs/think/) and [Requirements and limits](/docs/limits/#3-set-up-for-production). [Release notes](/docs/releases/) has every change.
