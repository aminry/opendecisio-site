---
title: Requirements and limits
description: What decisio needs to run each model, how long a text it reads, the setup steps that keep a certificate valid, and what was measured on what.
---

<!-- Site-written: the one page of requirements and limits. Every number is EVAL_CARD.md's, docs/running.md's, docs/api.md's or docs/tasks.md's at the pinned release (src/config/sourced.mjs checks them); the research detail behind them stays in the evaluation card. -->

::covers{links="docs/running.md#precision-casts---emulate-precision-casts=3-set-up-for-production docs/running.md#batch-invariance---batch-invariant=3-set-up-for-production docs/running.md#the-context-length=2-how-long-a-text-and-how-many-options docs/running.md#states-over-the-limit=2-how-long-a-text-and-how-many-options"}

Your own server says which model it serves and how long a text it accepts.

```bash
curl -s http://127.0.0.1:8000/health
```

| Field | What it says |
| --- | --- |
| `base`, `profile` | the model, its checkpoint and revision, and its settings |
| `max_model_len` | the longest prompt the server accepts, in tokens |
| `max_model_len_source` | why: for example, the largest length that fits this card |
| `max_model_len_ceiling` | the most the model allows |

## 1. Pick your machine

| Machine | Model and build | Memory it takes | Longest text | Measured |
| --- | --- | --- | --- | --- |
| NVIDIA, 96 GB | Gemma 4 31B, FP8, the default | 30.6 GiB of weights | up to 98,304 tokens, chosen at start | yes, an RTX PRO 6000 Blackwell |
| NVIDIA, 80 GB | Gemma 4 31B, FP8 | 30.6 GiB of weights; 33.85 GiB of cache at the default share | 98,304 tokens at the default share; 49,152 at 0.85 | it starts and answers, an H100 PCIe; the full measurements are the 96 GB card's |
| NVIDIA, 80 GB | Gemma 4 12B, bf16 | 22.8 GiB of weights; 43.28 GiB of cache at the default share | 65,536 tokens at the default share | yes, an H100 PCIe |
| NVIDIA, 96 GB | Gemma 4 12B, bf16 | 22.8 GiB of weights | up to 65,536 tokens | yes |
| NVIDIA, larger than 96 GB | Gemma 4 31B, bf16 | 57.91 GiB of weights | up to 65,536 tokens, chosen at start | no; on a 96 GB card it does not start at the default share |
| NVIDIA, 96 GB | the tuned Gemma 4 12B, bf16 | about 24 GB of weights | chosen at start | yes, an RTX PRO 6000 |
| NVIDIA, 32 GB | Gemma 4 12B, bf16 | does not start on vLLM's defaults | 4,096 tokens, at 0.95 of the card | yes, an RTX 5090 |
| NVIDIA, 32 GB | Gemma 4 12B, FP8 | 12.74 GiB of weights | 65,536 tokens at the default share | yes, an RTX 5090 |
| NVIDIA, 96 GB | Qwen3.6-35B-A3B, FP8 | 33.3 GiB of weights | 32,768 tokens | yes |
| Mac, 64 GB | Gemma 4 31B, 6-bit MLX | 24.9 GB of weights; 33.7 GB at its peak | 16,383 tokens | yes, an Apple M5 Pro |
| Mac, 48 GB | Gemma 4 31B, 4-bit MLX | 19.2 GB of weights; 28.0 GB at its peak | 16,383 tokens | read on the 64 GB Mac |
| Mac, 32 GB | Gemma 4 12B, 6-bit MLX | 9.7 GB of weights; 15.1 GB at its peak | 32,768 tokens | read on the 64 GB Mac |
| Laptop, 16 GB | Gemma 4 12B on Ollama (Ollama 0.40.3 or earlier) | 8.6 GB in Ollama | 8,192 tokens | read on the 64 GB Mac |
| Any machine | the CPU stand-in | a small model | 32,768 tokens | for development only |

| To run | You need |
| --- | --- |
| On a GPU | Linux, a driver that supports CUDA 13.0, Python 3.12 |
| With Docker | the NVIDIA Container Toolkit |
| On a Mac | Apple silicon |
| With Ollama | Ollama 0.35.1 through 0.40.3; later versions refuse these models on the decision route |

The guides have the commands: [on a cloud GPU](/docs/deploy/cloud-gpu/), [with Docker](/docs/deploy/docker/), [on a Mac or a laptop](/docs/deploy/mac/) and [for development](/docs/deploy/development/).

## 2. How long a text, and how many options

| Model | Longest text, with no flag | Ceiling |
| --- | --- | --- |
| Gemma 4 31B | the largest that fits the card, 32,768 to 98,304 tokens | 98,304 |
| Gemma 4 12B | the largest that fits the card, 32,768 to 65,536 tokens | 65,536 |
| Gemma 4 12B in FP8 | the largest that fits the card, 32,768 to 65,536 tokens | 65,536 |
| Qwen3.6-35B-A3B | 32,768 tokens | 32,768 |

- At start, the server asks the engine for the longest request that fits the card, and serves the largest multiple of 8,192 under it and under the ceiling.
- If not even 32,768 fits, the server does not start, and says what length would fit.
- The length stays at 32,768 with `--image-model`, `--head-engine`, `--engine-process separate`, on a Mac and on the CPU stand-in.
- How much a card gives depends on `--gpu-memory-utilization`: on the 80 GB H100 the 31B served 98,304 tokens at 0.90 and did not start at 0.70.

Each request holds:
- up to 255 options per question; a request with more gets 422;
- as many images as the context holds, up to the image engine's `--max-images` (128 unless set), PNG, JPEG or WebP, 20 MB each;
- a prompt up to the length above; a longer one gets 422.

To answer a text over the length instead, start the server with `--over-limit truncate`, or send `"over_limit": "truncate"` in one request.
The server keeps the start of the text and drops the rest, never a question, and the response says what was cut (`state_truncated`).

Under the header layout the list of the request's questions takes room too, so the text keeps what the longest prompt leaves.
Nothing cut is certified; a question over the length on its own, or a request with images, still gets 422.

A long text takes longer to read the first time: on the 31B, 3,370 ms at 16,000 tokens and 8,880 ms at 32,000.

::source[Measured on decisio 0.11.1, one RTX PRO 6000 at 600 W, 2026-10-14.]

At long length, the 31B answered a check at 85,000 tokens, 23 of 30 right against 25 of 30 short; a 30-item check is a smoke test, not an accuracy measurement.

## 3. Set up for production

1. **Give `--max-model-len` the same value on every card.** The length served is part of what a certificate covers. On an RTX PRO 6000, 98,304 against 32,768 changed 6 of 200 top answers.
2. **After upgrading decisio, certify your tasks again.** A certificate covers the release it was made on.
3. **A certificate covers one task on one serving setup.** The setup is the decisio version, the model and its revision, the engine, the card, the quantisation, the cache type, the context length and the serving flags. When any of it changes, the task's answers stop being certified until you certify again.
4. **Keep the cache type you certified on.** `--kv-cache-dtype fp8` suspends a certificate made without it.
5. **On a Mac, run one model server at a time.** Two servers can add up to more memory than the Mac has.
6. **Think when unsure on a card only, with the engine in the server's process.** It needs the vLLM engine and the default `--engine-process in`; the Mac build and `--engine-process separate` refuse `--think` at start.
7. **If you served with thinking on before upgrading, check its answers again.** Thinking now writes reasoning on a default server, so thinking answers change, and are usually faster: check your `--think-factor` against measured answers, and certify again the tasks you certify under thinking.
8. **Size a thinking server for its slowest request.** A thinking request holds the server for its whole call, so other requests wait behind it: use thinking where requests arrive one at a time, or run more servers.
9. **Certify with the think setting you serve with.** A certificate made with thinking off is suspended on a server that thinks (`think_mode_changed`), and the other way round, until you certify again.
10. **Batch concurrent requests on a card or the CPU stand-in.** `--concurrency batched` needs the vLLM engine or the stand-in in separate mode; the Mac build and `--mode packed` refuse it at start.
11. **Certify on the mode you serve with.** A certificate made on a serial server is suspended on a batching one (`concurrency_changed`), and the other way round, until you certify again.
12. **Batch concurrent requests for throughput, and measure on your traffic.** On one RTX 5090 the Gemma 4 12B in FP8 answered 8.9 and 9.2 requests a second batched, at 8 and 16 clients, against 7.2 one at a time, on requests about new states of about 1,000 tokens; a request that arrives alone is answered as on a serial server. The gain depends on the card, the base and how often states repeat.
13. **Expect requests in arrival order.** Under load a request waits for the requests that arrived before it, first come, first served, on every server.
14. **Run one stack across replicas that certify.** With a shared task store, a certificate is suspended on a replica whose engine, card or settings differ, so a fleet with certified answers runs the same stack everywhere.
15. **Watch each replica on its own.** The traffic monitors of a certified task are per replica, not shared: sum the `decisio_task_*` metrics across replicas.
16. **Expect a taught task on the other replicas within seconds, not at once.** They pick it up within the poll interval; a client that must read its own change asks the replica that made it.
17. **Check your object store at the first start.** The shared store was checked on RustFS and SeaweedFS, not on AWS S3, R2, MinIO, GCS or Azure; a replica refuses to start on a store that does not enforce conditional writes.
18. **Certify on the layout you serve.** A task registered, and a certificate made, under one [prompt layout](/docs/layout/) is not applied under the other; a server that loads tasks fitted under plain holds plain and says so.
19. **Keep the plain layout for a series of questions about one text.** Under the header layout, the Gemma models' default, a later request with other questions reads the text again; `--layout plain` reads it from the cache.
20. **Certify on the flavor and the read-twice setting you serve.** A task registered, or a certificate made, under one flavor or one `--read-twice-under` setting is not applied under another.
21. **Expect FP8 servers to emulate bf16 rounding.** By default an FP8 server keeps each bf16 rounding step in its compiled kernels (`--emulate-precision-casts`), so two cold starts agree more often, though not always. It is part of what a certificate covers, and `--emulate-precision-casts off` turns it off.
22. **Turn on batch-invariant kernels where answers must not depend on the batch.** `--batch-invariant on` computes each row with kernels whose result does not depend on what else is in the batch, at about 1.03 times a single read on FP8 and 1.6 times on bf16; on FP8 a long text split across engine steps can still differ. Its answers are not the other kernels' answers, and a certificate made without it is suspended.
23. **Certify with the default adapter you serve.** A certificate made under another `--default-adapter`, or none, is suspended.

## 4. What was measured on what

:::sources
| What | Model | Machine | Conditions | Date |
| --- | --- | --- | --- | --- |
| Accuracy and calibration | Qwen3.6-35B-A3B, FP8 | one RTX PRO 6000 Blackwell, 96 GB | vLLM 0.30.0 | 2026-10-03 |
| Accuracy and calibration | Gemma 4 12B, bf16 | one RTX PRO 6000 Blackwell | vLLM 0.30.0 | 2026-10-04 |
| Accuracy and calibration | Gemma 4 31B, FP8 on load | one RTX PRO 6000 Blackwell | vLLM 0.30.0 | 2026-10-04 |
| Latency, one to four questions | all three | one RTX PRO 6000 at 585 W, AMD Ryzen Threadripper 9960X | decisio 0.8.1 | 2026-10-06 |
| Latency by text length | all three | one RTX PRO 6000 at 600 W, AMD EPYC 9534 | decisio 0.11.1, vLLM 0.30.0 | 2026-10-14 |
| Context length against the card's share | Gemma 4 31B, FP8; Gemma 4 12B | one H100 PCIe, 80 GB | vLLM 0.31.0 | 2026-10-15 |
| Mac memory | Gemma 4 31B and 12B, MLX builds | one Apple M5 Pro, 64 GB | MLX | 2026-10-05 to 2026-10-16 |
| Ollama memory | Gemma 4 12B, `q4_k_m` | one Apple M5 Pro | Ollama 0.35.1 | 2026-10-07 |
| The 12B in FP8 against bf16, and on a 32 GB card | Gemma 4 12B, FP8 and bf16 | one RTX 5090, 32 GB | vLLM 0.31.0, 4,096 tokens, 0.95 of the card | 2026-10-21 |
| Batched throughput | Gemma 4 12B, FP8 | one RTX 5090, 32 GB | vLLM 0.31.0, 0.95 of the card, 4,096 tokens, requests about new 1,000-token states, 8 and 16 clients | 2026-10-21 |
| The header layout against the plain one | Gemma 4 31B, FP8 on load; Gemma 4 12B, FP8 | one RTX PRO 6000 Blackwell; one RTX 5090 | decisio's proxy sets and a public multi-domain sample | before decisio 0.26.0 |
:::

- One card and one run per configuration.
- Every figure above other than the layout comparison was measured on the plain layout, the text then the question; the Gemma models now serve the header layout by default.
- Each model's default settings were tuned on decisio's own 1,400-item suite, so its calibration errors on that suite are a best case.
- Latency depends on the host's CPU and the card's power limit, as well as the card.
- Most published figures of the 31B were measured on Google's weights converted to FP8 as they load; the stored FP8 checkpoint it serves scores the same within noise: 213 of JevBench's 231 published questions right with each, and 162 of 200 suite requests (vLLM 0.31.0).

[The evaluation card](/docs/evaluation-card/) has every measurement and its record.

## 5. Repeatability

A request repeats exactly on a freshly started server.
Asked again on a server that has already answered it, it can move slightly: on the 31B, 5 of 200 items, by at most 0.031, with no top answer changed.
Across restarts and machines, answers are not promised to repeat.

## 6. What was not tested

- The image route on either Gemma model; a Mac does not serve images.
- A 48 GB or 32 GB Mac, or a 16 GB laptop, as machines: their figures are read on a 64 GB Mac.
- NVIDIA cards other than the RTX PRO 6000 Blackwell and the H100 PCIe, and, for the 12B, the RTX 5090.
- The 12B in FP8's accuracy and calibration: its answers were compared with the bf16 12B's on 200 questions only, and its temperatures are the bf16 12B's.
- Accuracy at long length on a full test set: no set has a text over 32,768 tokens.
- The 31B's 6-bit Mac build on MMLU-Pro, and its server times.
- Latency with the intent head on a second engine.
- Ollama's answers: Ollama builds its own prompt and applies no calibration.
- Fine-tuned adapters under the header layout, which is why one that records no layout is served plain.
- The header layout on the HF and MLX engines, which build the same prompt; only the vLLM engine was tested with it.
- A layout chosen per request: one server serves one layout.

## What next

- [The evaluation card](/docs/evaluation-card/): every measurement, with its record.
- [Certify answers](/docs/tasks/certify/): certify a task, and what its certificate covers.
- [Upgrade](/docs/upgrading/): move to a new release, and certify your tasks again.
