---
title: "decisio 0.15.0: the 31B on a 48 GB Mac"
summary: "0.15.0 adds an opt-in 4-bit build of the Gemma 4 31B for Macs with 48 GB or more. It costs 1.5 points of MMLU-Pro and is slow on long documents."
date: 2026-10-17
tags: [release]
---

The Gemma 4 31B is the base behind our board row.
Until now it ran on a Mac from a 6-bit build, on 64 GB, the only size we measured.
0.15.0 adds an opt-in 4-bit build, `tachara-ai/decisio-gemma-4-31b-mlx-4bit`, for Macs with 48 GB or more.
The 6-bit build stays the one for 64 GB Macs.

What it gives: its weights take 19.2 GB, against 24.9 GB for the 6-bit.
It peaks at 23.9, 25.3 and 28.0 GB at about 8k, 16k and 32k tokens of state.
Against the FP8 build served on vLLM, it passes the same gates on decisio's suite and its calibration: accuracy 0.7957 against 0.7993, expected calibration error 0.0550 against 0.0540.
The intent heads, over three draws, score 0.833 on BANKING77 (FP8: 0.844) and 0.967 on CLINC150 (FP8: 0.970).

What it costs, first: MMLU-Pro is 1.5 points lower, 0.6785 against 0.6939 (interval -2.0 to -1.1).
The loss is mostly in engineering, math, chemistry and physics, 2.9 to 3.6 points, and history is down 2.6.
We did not measure the 6-bit build on MMLU-Pro, so we cannot say how much of the loss is this build's and how much any Mac build's.

What it costs, second: time.
On an Apple M5 Pro with 64 GB, a busy Mac under a 27 GiB memory limit, the first question about a new 3,000-token document took 9.4 s (median of 5), 66 s at 16,000 tokens and 152 s at 32,000.
The prefix cache was off under that limit, so a later question took as long.
The documented limit on this build is 16,383 tokens, and registering a task is slow: about an hour for a BANKING77 draw and 2.6 hours for a CLINC150 draw.

The 48 GB is derived, not measured.
decisio's memory planner starts the 4-bit build on a 48 GB Mac and refuses 32 and 36 GB, from the measured 32k peak, the cache limit and 2 GiB of headroom.
Everything above was measured on the 64 GB Mac, and no 48 GB Mac was run.

To opt in, download the tag, then serve it: `uv run hf download tachara-ai/decisio-gemma-4-31b-mlx-4bit --revision v0.15.0 --local-dir decisio-gemma-4-31b-mlx-4bit` and then `uv run python -m decisio.serve.vllm_engine --backend mlx --base gemma-4-31b --model decisio-gemma-4-31b-mlx-4bit`.
The [docs](https://github.com/aminry/decisio/blob/main/docs/running.md#mac-with-mlx) have the memory table and what is not measured.
One smaller change: adapters published in either tensor-name layout now load.
