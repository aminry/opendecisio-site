// Facts the site writes in its own words, each beside the sentence of decisio's docs at the pinned release that it
// rests on: the page must still say it, and decisio's file must still hold the sentence. A release that changes the
// sentence fails scripts/checks/sourced.mjs, and the page is brought in step with it.
//   page: the built page; says: text on it; file: decisio's file; source: the text in that file
const migrating = 'docs/migrating.md';
const api = 'docs/api.md';
const running = 'docs/running.md';
const operating = 'docs/operating.md';
const readme = 'README.md';
const card = 'EVAL_CARD.md';
const upgrading = 'docs/upgrading.md';

// Facts of one page, as [says, file, source] rows.
const fromPage = (page, rows) => rows.map(([says, file, source]) => ({ page, says, file, source }));

export const sourced = [
	// Call it from your code
	{ page: '/docs/use-from/', says: 'pip install typesafe-sdk==0.7.2', file: migrating, source: "TypeSafe's Python SDK 0.7.2" },
	{ page: '/docs/use-from/', says: 'more than 255 options', file: api, source: 'up to 255 options (more is 422)' },
	{ page: '/docs/use-from/', says: 'is not sent as Content-Type: application/json', file: api, source: 'any other type, or none, is refused with 415' },
	{ page: '/docs/use-from/', says: 'the server sets no CORS headers', file: api, source: 'The server sets no CORS headers' },
	{ page: '/docs/use-from/', says: 'TypeSafeUnprocessableEntityError for a 422 and TypeSafeBadRequestError for a 400', file: migrating, source: '(`TypeSafeUnprocessableEntityError`, `TypeSafeBadRequestError`)' },
	{ page: '/docs/use-from/', says: 'gives up after 10 s by default', file: migrating, source: "The SDK's default timeout is 10 s." },
	{ page: '/docs/use-from/', says: "the SDK's retries on 429 never fire; it still retries 408 and 5xx", file: migrating, source: "the SDK's retries on 429 never fire; it still retries 408 and 5xx" },
	// Move from System One
	{ page: '/docs/migrating/', says: 'decisio-gemma-4-31b-it-letters', file: migrating, source: '`decisio-gemma-4-31b-it-letters` for the default base' },
	{ page: '/docs/migrating/', says: 'decisio-gemma-4-12b-it-letters', file: migrating, source: '`decisio-gemma-4-12b-it-letters`' },
	{ page: '/docs/migrating/', says: 'decisio-qwen3.6-35b-a3b-letters', file: migrating, source: '`decisio-qwen3.6-35b-a3b-letters`' },
	{ page: '/docs/migrating/', says: 'A request without model refused with 422', file: api, source: 'System One requires it and refuses a request without it with 422' },
	{ page: '/docs/migrating/', says: 'A field it does not know refused with 400', file: api, source: 'System One refuses a request with an unknown top-level field (400' },
	{ page: '/docs/migrating/', says: 'A score with more than 10 levels refused with 422', file: api, source: 'System One refuses more than 10 with 422' },
	{ page: '/docs/migrating/', says: 'box questions supported refused with 422', file: api, source: 'A request with `"type": "box"` is refused with 422.' },
	{ page: '/docs/migrating/', says: 'rounded to two decimals', file: api, source: 'System One rounds them to two decimals' },
	{ page: '/docs/migrating/', says: 'usage.output_tokens is 1 per question', file: api, source: '`usage.output_tokens` is 1 per question' },
	{ page: '/docs/migrating/', says: 'The SDK gives up after 10 s by default', file: migrating, source: "The SDK's default timeout is 10 s." },
	{ page: '/docs/migrating/', says: "The SDK's retries on 429 never fire; it still retries 408 and 5xx", file: migrating, source: "the SDK's retries on 429 never fire; it still retries 408 and 5xx" },
	// On a cloud GPU
	...fromPage('/docs/deploy/cloud-gpu/', [
		['30.6 GiB, FP8', readme, '30.6 GiB in memory'],
		['22.8 GiB, bf16', readme, 'bf16, 22.8 GiB in memory'],
		['33.3 GiB, FP8', readme, '33.3 GiB in memory'],
		['about 31 GB', running, "about 31 GB for the 31B's FP8 repository"],
		['about 36 GB', running, 'about 36 GB for the Qwen base'],
		['also starts and answers on one 80 GB H100 PCIe', running, 'The 31B (stored FP8) on one H100 PCIe 80 GB'],
		['served 65,536 tokens on the same H100', running, 'On the same 80 GB card the 12B served its ceiling of 65,536 at the default share'],
		['the largest that fits, 32,768 to 98,304 tokens', running, 'the largest that fits the card, 32,768 to 98,304'],
		['32,768 to 65,536 tokens', running, 'the largest that fits the card, 32,768 to 65,536'],
		['one that supports CUDA 13.0', running, 'a driver that supports CUDA 13.0'],
		['ready after 7 min 54 s with the download, and after 4 min 3 s with the weights already on disk', readme, 'ready after 7 min 54 s, including the download of its weights, and a start with the weights already on disk after 4 min 3 s'],
		['decisio 0.11.0 from PyPI, one RTX PRO 6000 Blackwell at 600 W, 2026-10-09', readme, 'Measured on 2026-10-09 on decisio 0.11.0 from PyPI, on one RTX PRO 6000 Blackwell at 600 W'],
		['refuses to start on a difference', running, 'refuses to start on a difference'],
		['--max-model-len 32768 serves only what was measured', running, 'to serve only what was measured, give `--max-model-len 32768`'],
		['answers 503 and exits with code 70', running, 'the server stops its engine processes and exits with code 70'],
		['200 once the engine is loaded, 503 from the moment it has died', operating, '`/health` answers 200 once the engine is loaded and 503'],
		['its own registered tasks, which live in memory', operating, 'each replica is a separate server with its own registered tasks, which live in memory'],
	]),
	// With Docker
	...fromPage('/docs/deploy/docker/', [
		['gemma-4-31b by default', running, '--base "${DECISIO_BASE:-gemma-4-31b}"'],
		['it brings the model its config.json declares', running, 'alone it brings the base its `config.json` declares'],
		['Arguments after the image name go to the server', running, 'arguments after the image name are passed to the server'],
		['They are never part of the image', running, 'it is never part of the image'],
		['The container runs as a non-root user, and the port is published on 127.0.0.1 only.', running, 'The container runs as a non-root user, and compose publishes the port on 127.0.0.1 only.'],
		['exits with an explanation when it cannot see one', running, 'exits with an explanation when the container cannot see one'],
		['Docker restarts a container when its process exits, not when its health check fails', running, 'Docker restarts a container when its process exits, not when its `HEALTHCHECK` reports it unhealthy'],
	]),
	// On a Mac or a laptop
	...fromPage('/docs/deploy/mac/', [
		['24.9 GB', running, '24.9 GB of weights in memory'],
		['29.6, 31.1 and 33.7 GB at about 8k, 16k and 32k tokens', running, 'It peaks at 29.6, 31.1 and 33.7 GB at about 8k, 16k and 32k tokens of state'],
		['16,383 tokens', running, 'documented for states up to 16,383 tokens'],
		['19.2 GB', running, '19.2 GB of weights'],
		['23.9, 25.3 and 28.0 GB, read on a 64 GB Mac', running, 'peaks at 23.9, 25.3 and 28.0 GB at about 8k, 16k and 32k tokens of state, under a 27 GiB MLX memory limit on a 64 GB Mac'],
		['9.4 s at 3,000 tokens, on a busy Mac', running, 'on a busy Mac under the 27 GiB limit: 9.4 s at 3,000 tokens'],
		['9.7 GB; 15.1 GB at 32,687 tokens', running, 'holds 9.7 GB of weights and peaks at 15.1 GB at 32,687 tokens of state'],
		['1,312 ms at 1,000 tokens', running, 'one question on a new 1,000-token state takes 1,312 ms'],
		['a 7.7 GB download; 8.6 GB in Ollama 8,192 tokens', running, "its `q4_k_m` tag (also `latest`) is a 7.7 GB download and takes 8.6 GB in Ollama at the listing's 8,192-token context"],
		['33.7 GB at about 8k, 16k and 32k tokens 16,383 tokens not measured', running, 'Server times are not measured.'],
		['Measured on one Apple M5 Pro with 64 GB; no smaller Mac was measured', running, 'Measured on one Apple M5 Pro with 64 GB; no smaller Mac was measured.'],
		['its 4-bit build is for Macs with more than 32 GB', running, 'The 4-bit conversion is for Macs with more than 32 GB of memory'],
		['about an hour for BANKING77 and about 2.6 hours for CLINC150', running, 'about an hour for a BANKING77 draw and about 2.6 hours for a CLINC150 draw'],
		['Images, packed mode, LoRA adapters and the second-engine head', running, 'It refuses the image route, packed mode, LoRA adapters and the second-engine head.'],
		['Ollama 0.35.1 or later', running, 'Requires Ollama 0.35.1 or later.'],
		['q8_0 not given 13.6 GB', running, 'its `q8_0` tag takes 13.6 GB'],
		['a 23 GB download', running, "The Qwen listing's smallest tag is a 23 GB download"],
		['Run one model server on a Mac at a time', running, 'Run one model server on a Mac at a time.'],
		['watch physical_footprint_bytes', running, '`physical_footprint_bytes`'],
		['--revision v0.15.0 serves the build that was measured', running, "`--revision v0.15.0` names the repository's tag of the build that was measured"],
	]),
	// For development (CPU)
	...fromPage('/docs/deploy/development/', [
		['ready 4 to 8 seconds after it starts', running, 'takes 4 to 8 seconds from start to `/health` answering'],
		['a first question in about 0.3 seconds on top (on Apple silicon, 2026-10-14)', running, 'measured on Apple silicon on 2026-10-14'],
		['a first question in about 0.3 seconds', running, 'a first question about 0.3 seconds on top'],
		['about 1.2 GB, once', running, 'about 1.2 GB, once'],
	]),
	// Requirements and limits
	...fromPage('/docs/limits/', [
		['30.6 GiB of weights', readme, '30.6 GiB in memory'],
		['22.8 GiB of weights', readme, 'bf16, 22.8 GiB in memory'],
		['33.3 GiB of weights', readme, '33.3 GiB in memory'],
		['33.85 GiB of cache at the default share', running, '| 0.90 (the default) | 33.85 GiB |'],
		['98,304 tokens at the default share; 49,152 at 0.85', running, '| 0.85 | 29.9 GiB | 53,696 | 49,152 |'],
		["does not start on vLLM's defaults", card, "The Gemma base does not fit a 32 GB card on vLLM's defaults."],
		['simulated on the 96 GB card', card, 'Simulated on the 96 GB card'],
		['24.9 GB of weights; 33.7 GB at its peak', running, 'It peaks at 29.6, 31.1 and 33.7 GB'],
		['19.2 GB of weights; 28.0 GB at its peak', running, 'peaks at 23.9, 25.3 and 28.0 GB'],
		['9.7 GB of weights; 15.1 GB at its peak', running, 'holds 9.7 GB of weights and peaks at 15.1 GB at 32,687 tokens of state'],
		['8.6 GB in Ollama 8,192 tokens', running, "takes 8.6 GB in Ollama at the listing's 8,192-token context"],
		['Ollama 0.35.1 or later', running, 'Requires Ollama 0.35.1 or later.'],
		['serves the largest multiple of 8,192 under it and under the ceiling', running, 'then serves the largest multiple of 8,192 not above that and not above the ceiling'],
		['If not even 32,768 fits, the server does not start, and says what length would fit', running, 'If even 32,768 does not fit, the start fails with a message that names the length that fits'],
		['The length stays at 32,768 with --image-model, --head-engine, --engine-process separate, on a Mac and on the CPU stand-in', running, 'The default stays 32,768 with `--image-model` (the image engine serves 32,768), a second engine (`--head-engine`), `--engine-process separate` (the fit is read from the engine\'s configuration in the server\'s own process), `--backend mlx` and `--backend hf`.'],
		['served 98,304 tokens at 0.90 and did not start at 0.70', running, '| 0.70 | 18.54 GiB | 22,064 | does not start |'],
		['up to 255 options per question; a request with more gets 422', api, 'up to 255 options (more is 422)'],
		['up to 2 images, PNG, JPEG or WebP, 20 MB each', card, 'up to 2 images per request (PNG, JPEG or WebP, up to 20 MB each)'],
		['3,370 ms at 16,000 tokens and 8,880 ms at 32,000 (one RTX PRO 6000 at 600 W, decisio 0.11.1)', running, '3,370 ms at 16,000 and 8,880 ms at 32,000 on the 31B'],
		['answered a check at 85,000 tokens, 23 of 30 right against 25 of 30 short', running, 'answered a check at a state of 85,000 tokens (23 of 30 items right against 25 of 30 for the same items short'],
		['98,304 against 32,768 changed 6 of 200 top answers', running, '**6 of 200 top answers changed**'],
		['a task certified before 0.16.0 gets no drift protection until it is certified again', upgrading, 'A task certified before 0.16.0 has no confidence statistic, so it gets no drift protection until it is certified again.'],
		['--kv-cache-dtype fp8 suspends a certificate made without it', running, "a certificate made under the model's own cache dtype is suspended under fp8"],
		['Two servers can add up to more memory than the Mac has', running, 'Two servers each stay under their own limit and can still add up to more than the machine has.'],
		['One card and one run per configuration.', card, 'One card per run and one run per configuration.'],
		["so that suite's calibration figures are in-sample", card, "so the suite's ECE figures are in-sample"],
		['scores the same within noise', card, 'the stored FP8 repository scores the same within noise'],
		['5 of 200 items, by at most 0.031, with no top answer changed', card, '(5 of 200 items, up to 0.031, no top answer changed'],
		['answers are not promised to repeat', card, 'Repeatability across sessions is not promised.'],
		['Latency with the intent head on a second engine', card, 'The second-engine head mode with the registered text-only class is unmeasured for latency.'],
		['no set has a text over 32,768 tokens', running, 'no suite here has a state over 32,768 tokens'],
		["The 31B's 6-bit Mac build on MMLU-Pro, and its server times", running, "The 6-bit conversion's MMLU-Pro was not measured."],
		['Ollama builds its own prompt and applies no calibration', running, 'Ollama builds its own prompt and applies no calibration'],
	]),
];
