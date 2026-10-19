// How every published code block is checked, in the order a newcomer meets
// them. scripts/verify-commands.mjs runs this plan from a fresh clone of the
// pinned release against the CPU stand-in and writes verification/commands.json.
//
// Each step names a block by its page and its position on the page, and the
// text the block starts with, so a release that moves or changes a block stops
// the run instead of checking the wrong one.
//
// mode:
//   run               run the block in the clone's root with bash -e
//   run-then-server   run every line but the last, then start the last as the server
//   verbatim          not runnable here; shown as taken from the repository's tested docs
//   shown             not run, and not from tested docs: why says what it needs, or that it was never run
//   output            a recorded response, not a command
//   example           a shape to fill in, not a command
//   same-as           the same text as another planned block
//   python            run the block with python, with the packages named in with
//   ollama            run against Ollama with the model named in model, by scripts/verify-ollama.mjs
//                     on a machine that has it (needs: the Ollama version the docs require)
//
// optional: the step applies only to a release whose page has this block.
//
// skip and ci: lines of a block that are not run here, because decisio's own CI
// ran them on the pinned commit; the check named by ci must have passed there.
// (A private repository's runner has too little memory for decisio's unit tests.)
//
// assert(stdout, ctx) throws when a run's output is not what the docs promise.

import { pin } from '../src/lib/upstream.mjs';

const json = (stdout) => JSON.parse(stdout);

// A pull reports its end on stderr, one "success" per model.
function pulled(_stdout, stderr) {
	const n = (stderr.match(/\bsuccess\b/g) ?? []).length;
	if (n !== 2) throw new Error(`the pulls ended in ${n} "success", not 2`);
}

// The README's support-ticket request answers all three of its questions.
function ticketAnswers(stdout) {
	const { answers } = json(stdout);
	if (answers?.urgent?.type !== 'noul' || typeof answers.urgent.noul !== 'number') throw new Error('no yes/no answer for "urgent"');
	if (!['billing', 'access', 'bug', 'other'].includes(answers?.category?.choice)) throw new Error('no choice for "category"');
	if (answers?.impact?.type !== 'score' || typeof answers.impact.score !== 'number') throw new Error('no score for "impact"');
}

// A client of the recorded support ticket prints one line for each of its three questions.
function printsThreeAnswers(stdout) {
	const lines = stdout.trim().split('\n').filter((l) => !l.startsWith('#'));
	const names = lines.map((l) => l.split(' ')[0]);
	if (!['urgent', 'queue', 'impact'].every((n) => names.includes(n))) throw new Error(`it printed ${JSON.stringify(names)}, not the three questions' answers`);
}

// The recorded support ticket's request (docs' first pages) is answered for all three of its questions.
function recordedAnswers(stdout) {
	const { answers } = json(stdout);
	if (answers?.urgent?.type !== 'noul' || typeof answers.urgent.noul !== 'number') throw new Error('no yes/no answer for "urgent"');
	if (!['billing', 'access', 'bug', 'feature', 'cancellation', 'other'].includes(answers?.queue?.choice)) throw new Error('no choice for "queue"');
	if (answers?.impact?.type !== 'score' || typeof answers.impact.score !== 'number') throw new Error('no score for "impact"');
}

export const plan = [
	// Get started, on the stand-in, the path every machine can take: the recorded support ticket (src/lib/site-blocks.mjs).
	{
		page: '/docs/', n: 1, mode: 'run-then-server', expect: `git clone --branch ${pin.tag} https://github.com/${pin.repository}`,
		skip: [`git clone --branch ${pin.tag} https://github.com/${pin.repository}`, 'cd decisio'],
		note: 'the clone is the pinned release, as the check has it; the install and the server start',
	},
	{
		page: '/docs/', n: 2, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/health',
		assert(stdout) {
			if (json(stdout).ok !== true) throw new Error('/health did not answer ok');
		},
	},
	{
		page: '/docs/', n: 3, mode: 'run', expect: 'curl http://127.0.0.1:8000/v1/systemone',
		note: "the answers are the stand-in's, not the measured system's",
		assert: recordedAnswers,
	},
	{ page: '/docs/', n: 4, mode: 'output', expect: '{\n  "answers": {' },
	{
		page: '/docs/api/', n: 1, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/v1/models',
		assert(stdout) {
			if (!stdout.includes('"ok":true') && !stdout.includes('"ok": true')) throw new Error('/health did not answer ok');
			if (!stdout.includes('"category"')) throw new Error('the choice question was not answered');
		},
	},
	// Call it from your code, on the stand-in: the recorded support ticket sent from each language (src/lib/site-blocks.mjs),
	// then decisio's programs for the frameworks (docs/integrations.md), the Python ones run with the versions they name.
	{ page: '/docs/use-from/', n: 1, mode: 'same-as', expect: 'curl http://127.0.0.1:8000/v1/systemone', of: ['/docs/', 3] },
	{ page: '/docs/use-from/', n: 2, mode: 'python', expect: 'import json\nimport urllib.request', assert: printsThreeAnswers, note: "the answers are the stand-in's, not the measured system's" },
	{
		page: '/docs/use-from/', n: 3, mode: 'python', expect: 'from typesafe_sdk import TypeSafeClient', with: ['typesafe-sdk==0.7.2'],
		assert: printsThreeAnswers, note: "with TypeSafe's Python SDK 0.7.2, the version the page names",
	},
	{ page: '/docs/use-from/', n: 4, mode: 'node', expect: 'const body = {', assert: printsThreeAnswers, note: "the answers are the stand-in's, not the measured system's" },
	{ page: '/docs/use-from/', n: 5, mode: 'node', ts: true, expect: 'const body: {', assert: printsThreeAnswers, note: "the answers are the stand-in's, not the measured system's" },
	{
		page: '/docs/use-from/', n: 6, mode: 'python', expect: 'import json\nimport urllib.error',
		assert(stdout) {
			if (!/^422 True$/m.test(stdout)) throw new Error('a request with no questions was not answered with 422 and a detail');
		},
	},
	{
		page: '/docs/use-from/', n: 7, mode: 'python', expect: 'from langchain_typesafe import Choice, Noul, NoulCriteria, TypeSafeClassifier', with: ['langchain-typesafe==0.0.1a3'],
		note: 'with langchain-typesafe 0.0.1a3, the version the page names',
		assert(stdout) {
			if (!/^(billing|access) [0-9.e-]+$/m.test(stdout)) throw new Error('the LangChain program did not print a queue and a probability');
		},
	},
	{ page: '/docs/use-from/', n: 8, mode: 'verbatim', expect: 'import { experimental_decide as decide } from "ai";', needs: 'Node 22 with ai 7.0.131 and @ai-sdk/typesafe-ai 3.0.15' },
	{ page: '/docs/use-from/', n: 9, mode: 'verbatim', expect: '{\n  "name": "decisio: ask a question about a text",', needs: 'n8n 2.35.7' },
	{ page: '/docs/use-from/', n: 10, mode: 'verbatim', expect: 'import { boolean, choice, decide } from "@tanstack/ai";', needs: 'Node 22 with @tanstack/ai 0.65.1 and @tanstack/ai-typesafe 0.1.8' },
	{
		page: '/docs/use-from/', n: 11, mode: 'python', expect: 'import asyncio', with: ['pipecat-ai[jev]==1.12.0'],
		note: 'with pipecat-ai 1.12.0, the version the page names',
		assert(stdout) {
			if (!/choice='(billing|access)'/.test(stdout)) throw new Error('the Pipecat program did not print a choice');
		},
	},

	// Scale and Ask about images, on the stand-in.
	{
		page: '/docs/scale/', n: 1, mode: 'python', expect: 'import json\nimport urllib.request',
		assert(stdout) {
			if (!/^answers: 50$/m.test(stdout) || !/^server ms: \d/m.test(stdout)) throw new Error('the fifty questions were not all answered, or no server time came back');
		},
	},
	{
		page: '/docs/scale/', n: 2, mode: 'python', expect: 'import json\nimport urllib.request',
		assert(stdout) {
			if (!/^options answered: 120$/m.test(stdout)) throw new Error('a question with 120 options did not come back with 120 probabilities');
		},
	},
	{
		page: '/docs/scale/', n: 3, mode: 'python', expect: 'import json\nimport urllib.request',
		assert(stdout) {
			if (!/^first question: \d/m.test(stdout) || !/^a different question about the same text: \d/m.test(stdout)) throw new Error('no server time came back for both questions');
		},
	},
	{ page: '/docs/tasks/', n: 1, mode: 'same-as', expect: 'curl http://127.0.0.1:8000/v1/tasks', of: ['/docs/faq/', 2] },
	{ page: '/docs/images/', n: 1, mode: 'example', expect: 'import base64' },
	{ page: '/docs/images/', n: 2, mode: 'shown', expect: 'pip install "decisio[serve]', why: 'it needs Linux with one NVIDIA card, which this check does not have' },
	// Operate and Troubleshoot, on the stand-in.
	{
		page: '/docs/operating/', n: 1, mode: 'run', expect: 'until curl -sf http://127.0.0.1:8000/health',
		assert(stdout) {
			if (json(stdout).ok !== true) throw new Error('/health did not answer ok');
		},
	},
	{
		page: '/docs/operating/', n: 2, mode: 'run', expect: 'curl -s -D - -o /dev/null http://127.0.0.1:8000/v1/systemone',
		assert(stdout) {
			if (!/^x-decisio-server-ms:/im.test(stdout)) throw new Error('the server-time header is missing');
		},
	},
	{
		page: '/docs/troubleshooting/', n: 1, mode: 'run', expect: 'curl -s -o /dev/null -w',
		assert(stdout) {
			if (!/^200$/m.test(stdout)) throw new Error('/health did not answer 200');
		},
	},
	// Understand, on the stand-in.
	{
		page: '/docs/how-it-works/', n: 1, mode: 'run', expect: 'curl http://127.0.0.1:8000/v1/systemone',
		assert(stdout) {
			if (typeof json(stdout).answers?.urgent?.noul !== 'number') throw new Error('the one yes/no question was not answered with a probability');
		},
	},
	{ page: '/docs/faq/', n: 1, mode: 'same-as', expect: 'curl http://127.0.0.1:8000/v1/systemone', of: ['/docs/how-it-works/', 1] },
	{
		page: '/docs/probability/', n: 1, mode: 'python', expect: 'import json\nimport urllib.request',
		assert(stdout) {
			if (!/^likeliest: \S+$/m.test(stdout) || !/^sum of probabilities: 1(\.0)?$/m.test(stdout)) throw new Error('the probabilities of a choice did not add up to 1');
		},
	},
	{
		page: '/docs/repeatability/', n: 1, mode: 'python', expect: 'import json\nimport urllib.request',
		assert(stdout) {
			if (!/^distinct answers in 5 sends: 1$/m.test(stdout)) throw new Error('five identical requests did not get one answer');
		},
	},
	{ page: '/docs/evaluation-card/', n: 1, mode: 'same-as', expect: 'curl -s http://127.0.0.1:8000/health', of: ['/docs/', 2] },
	{
		page: '/docs/comparison/', n: 1, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/v1/models',
		assert(stdout) {
			json(stdout);
		},
	},
	{ page: '/docs/limits/', n: 1, mode: 'same-as', expect: 'curl -s http://127.0.0.1:8000/health', of: ['/docs/', 2] },
	{ page: '/docs/deploy/development/', n: 1, mode: 'same-as', expect: `git clone --branch ${pin.tag}`, of: ['/docs/', 1] },

	{
		page: '/docs/releases/', n: 1, mode: 'run', expect: 'uv run python -c "from importlib.metadata import version',
		assert(stdout) {
			if (stdout.trim() !== pin.tag.replace(/^v/, '')) throw new Error(`the installed release is ${stdout.trim()}, not ${pin.tag}`);
		},
	},

	// Teach a task, end to end on the stand-in that is already up.
	{ page: '/docs/tasks/', n: 2, mode: 'example', expect: '{\n  "id": "ticket-routing",' },
	{
		page: '/docs/tasks/', n: 3, mode: 'run', expect: 'uv run python examples/tasks/register.py',
		assert(stdout) {
			if (!/task 'ticket-routing'/.test(stdout)) throw new Error('register.py did not report the task');
		},
	},
	{
		page: '/docs/tasks/', n: 4, mode: 'run', expect: 'uv run python examples/tasks/ask.py',
		assert(stdout) {
			if (!/x-decisio-tasks: ticket-routing/.test(stdout)) throw new Error('the question did not match the registered task');
		},
	},
	{
		page: '/docs/tasks/', n: 5, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/v1/tasks',
		async assert(stdout, ctx) {
			const tasks = await (await fetch('http://127.0.0.1:8000/v1/tasks')).json();
			if (JSON.stringify(tasks).includes('"ticket-routing"')) throw new Error('the task is still registered after the delete');
			if (!ctx.fileHasContent('tasks.json')) throw new Error('the export wrote no tasks.json');
		},
	},
	// Certify answers: the request's shape, and the certificate and answers of a recorded run on a Mac
	// (runs/2026-10-14_certified-answers/results/mac_mlx/); the CPU stand-in cannot fit and certify 400 tickets here.
	// Then the threshold picked by hand, on the stand-in.
	{ page: '/docs/tasks/certify/', n: 1, mode: 'example', expect: 'POST /v1/tasks\n{"id": "ticket-queue",' },
	{ page: '/docs/tasks/certify/', n: 2, mode: 'output', expect: '{\n "certificate": {' },
	{ page: '/docs/tasks/certify/', n: 3, mode: 'output', expect: '[\n {\n  "ticket":' },
	{
		page: '/docs/tasks/certify/', n: 4, mode: 'python', expect: 'import json\nimport urllib.request',
		assert(stdout) {
			if (!/^(keep|escalate)/m.test(stdout)) throw new Error('the script reached no decision');
		},
	},

	{
		page: '/docs/faq/', n: 2, mode: 'run', expect: 'curl http://127.0.0.1:8000/v1/tasks',
		note: 'registers the walk-through task again',
		assert(stdout) {
			if (json(stdout).id !== 'ticket-routing') throw new Error('the registration did not answer with the task');
		},
	},
	// Upgrade, on the stand-in, with the walk-through task registered again just above.
	{
		page: '/docs/upgrading/', n: 1, mode: 'run', expect: "curl -s 'http://127.0.0.1:8000/v1/tasks?full=1' > tasks.json",
		assert(stdout, ctx) {
			if (!ctx.fileHasContent('tasks.json')) throw new Error('the export wrote no tasks.json');
		},
	},
	{ page: '/docs/upgrading/', n: 2, mode: 'example', expect: 'POST /v1/tasks/ticket-routing/certify' },
	{
		page: '/docs/upgrading/', n: 3, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/v1/tasks/ticket-routing',
		assert(stdout) {
			if (json(stdout).id !== 'ticket-routing') throw new Error('the task did not answer with itself');
		},
	},

	// Paths that need hardware this check does not have.
	// The deploy guides: decisio's commands at the pinned release, from a package, a clone or the release image.
	{ page: '/docs/deploy/cloud-gpu/', n: 1, mode: 'shown', expect: 'python3.12 -m venv .venv', why: "it needs Linux with one NVIDIA card, which this check does not have; decisio's README timed the same install, of decisio 0.11.0, on 2026-10-09" },
	{ page: '/docs/deploy/cloud-gpu/', n: 2, mode: 'shown', expect: `git clone --branch ${pin.tag}`, why: 'it needs Linux with one NVIDIA card, which this check does not have' },
	{ page: '/docs/deploy/cloud-gpu/', n: 3, mode: 'verbatim', expect: 'uv run python -m decisio.serve.vllm_engine --base tachara-ai/decisio-gemma-4-31b', needs: 'Linux with one NVIDIA card' },
	{ page: '/docs/deploy/cloud-gpu/', n: 4, mode: 'shown', expect: '# /etc/systemd/system/decisio.service', why: "decisio wrote it for its docs and has not run it; the options are systemd's documented ones" },
	{ page: '/docs/deploy/cloud-gpu/', n: 5, mode: 'shown', expect: 'apiVersion: apps/v1', why: "decisio wrote it for its docs, with the release image in place of its placeholder, and has not run it; the probes read /health as measured" },
	{ page: '/docs/deploy/docker/', n: 1, mode: 'shown', expect: 'docker run -d --gpus all', why: 'it needs a GPU host with the NVIDIA Container Toolkit, which this check does not have' },
	{
		page: '/docs/deploy/docker/', n: 2, mode: 'shown', expect: 'name: decisio', record: 'runs/2026-10-01_docker-first-gpu-start/',
		why: "decisio's compose.yaml, with the release image in place of its local build; the file brought the container up on a card on 2026-10-01",
	},
	{ page: '/docs/deploy/docker/', n: 3, mode: 'shown', expect: `git clone --branch ${pin.tag}`, why: 'it needs a GPU host with the NVIDIA Container Toolkit, which this check does not have' },
	{ page: '/docs/deploy/mac/', n: 1, mode: 'shown', expect: `git clone --branch ${pin.tag}`, why: 'it needs a Mac with Apple silicon, which this check does not have' },
	{ page: '/docs/deploy/mac/', n: 2, mode: 'verbatim', expect: 'uv run python -m decisio.serve.vllm_engine --backend mlx --base gemma-4-31b --model mlx-community/gemma-4-31b-it-6bit', needs: 'a Mac with Apple silicon', record: 'runs/2026-10-07_mlx-gemma-31b/' },
	{ page: '/docs/deploy/mac/', n: 3, mode: 'verbatim', expect: 'uv run python -m decisio.serve.vllm_engine --backend mlx --base gemma-4-31b --model tachara-ai/decisio-gemma-4-31b-mlx-4bit', needs: 'a Mac with Apple silicon', record: 'runs/2026-10-16_mlx-gemma-31b-4bit/' },
	{ page: '/docs/deploy/mac/', n: 4, mode: 'verbatim', expect: 'uv run python -m decisio.serve.vllm_engine --backend mlx --base gemma-4-12b', needs: 'a Mac with Apple silicon', record: 'runs/2026-10-05_mlx-gemma/' },
	{ page: '/docs/deploy/mac/', n: 5, mode: 'output', expect: 'decisio: the gemma-4-12b base needs about 16.6 GiB under MLX' },
	// The pull is decisio's; both Ollama blocks are run against Ollama by scripts/verify-ollama.mjs
	// (the request is site-written: src/lib/site-blocks.mjs).
	{ page: '/docs/deploy/mac/', n: 6, mode: 'ollama', expect: 'ollama pull aminroudaki/decisio-gemma', models: ['aminroudaki/decisio-gemma', 'aminroudaki/decisio'], needs: '0.35.1', assert: pulled },
	{ page: '/docs/deploy/mac/', n: 7, mode: 'ollama', expect: 'curl http://localhost:11434/v1/systemone', models: ['aminroudaki/decisio-gemma'], needs: '0.35.1', assert: ticketAnswers },
	{ page: '/docs/bases/', n: 1, mode: 'verbatim', expect: 'uv run python -m decisio.serve.vllm_engine                          # gemma-4-31b, the default', needs: 'an NVIDIA card', record: 'runs/2026-10-04_gemma-base/' },
	{ page: '/docs/bases/', n: 2, mode: 'same-as', expect: 'uv run python -m decisio.serve.vllm_engine                          # gemma-4-31b, the default', of: ['/docs/bases/', 1] },

	{ page: '/docs/upgrade-notes/', n: 1, mode: 'verbatim', expect: 'uv run python -m decisio.serve.vllm_engine --base qwen3.6-35b-a3b', needs: 'an NVIDIA card, and for the container the NVIDIA Container Toolkit' },

	// Shapes and recorded output.
	{ page: '/docs/api/', n: 2, mode: 'example', expect: '{"model": "decisio-gemma-4-31b-it-letters",' },
	{ page: '/docs/api/', n: 3, mode: 'example', expect: '{"id": "ticket-routing",' },
	{ page: '/docs/api/', n: 4, mode: 'example', expect: '{"id": "...",' },
	{ page: '/docs/flags/', n: 1, mode: 'same-as', expect: 'uv run python -m decisio.serve.vllm_engine                          # gemma-4-31b, the default', of: ['/docs/bases/', 1] },
	{ page: '/docs/flags/', n: 2, mode: 'example', expect: 'uv run python -m decisio.serve.vllm_engine [flags]' },
	// Move from System One: decisio's docs/migrating.md blocks, TypeSafe's SDK against the stand-in, then the two reads.
	{ page: '/docs/migrating/', n: 1, mode: 'run', expect: 'export TYPESAFE_BASE_URL=', note: 'sets the variables the SDK reads' },
	{
		page: '/docs/migrating/', n: 2, mode: 'python', expect: 'from typesafe_sdk import TypeSafeClient',
		with: ['typesafe-sdk==0.7.2'], note: "with TypeSafe's Python SDK 0.7.2, the version the page names",
	},
	{
		page: '/docs/migrating/', n: 3, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/v1/models',
		assert(stdout) {
			if (typeof json(stdout).models?.[0]?.name !== 'string') throw new Error('/v1/models did not list the served name');
		},
	},
	{ page: '/docs/migrating/', n: 4, mode: 'same-as', expect: 'curl -s http://127.0.0.1:8000/health', of: ['/docs/', 2] },

	// The home page repeats three of the blocks above.
	// The home page's pull block has each comment above its command; the commands are the docs page's, run again here.
	{ page: '/', n: 1, mode: 'ollama', expect: '# the Gemma 4 12B base, for 16 GB laptops', models: ['aminroudaki/decisio-gemma', 'aminroudaki/decisio'], needs: '0.35.1', assert: pulled },
	{ page: '/', n: 2, mode: 'same-as', expect: 'curl http://localhost:11434/v1/systemone', of: ['/docs/deploy/mac/', 7] },
	{ page: '/', n: 3, mode: 'verbatim', expect: 'git clone https://github.com/aminry/decisio', needs: 'Linux with one NVIDIA card' },
];
