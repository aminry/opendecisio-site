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
//                     on a machine that has it (needs and upTo: the Ollama versions the docs give)
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

// What a JSON answer shows on its page: the fields a reader checks, in this order (a step with this show is `trimmed`).
const fields = (...keys) => (stdout) => {
	const o = json(stdout);
	const kept = keys.filter((k) => k in o);
	if (!kept.length) throw new Error(`the answer has none of ${keys.join(', ')}`);
	return JSON.stringify(Object.fromEntries(kept.map((k) => [k, o[k]])), null, 1);
};
// What a script printed, as it printed it.
const asPrinted = (stdout) => stdout;

// The directory the stand-in saves taught tasks to, from Teach a task's first step on: a path that persists, not /tmp,
// since the page is about tasks that survive a restart (relative to the clone, where the runner can write).
const TASKS_DIR = 'decisio-tasks';

export const plan = [
	// Get started, on the stand-in, the path every machine can take: the recorded support ticket (src/lib/site-blocks.mjs).
	{
		page: '/docs/', n: 1, mode: 'run-then-server', expect: `git clone --branch ${pin.tag} https://github.com/${pin.repository}`,
		skip: [`git clone --branch ${pin.tag} https://github.com/${pin.repository}`, 'cd decisio'],
		note: 'the clone is the pinned release, as the check has it; the install and the server start',
	},
	{
		page: '/docs/', n: 2, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/health', show: fields('ok', 'base', 'max_model_len', 'max_model_len_source', 'max_model_len_ceiling'), trimmed: true,
		assert(stdout) {
			if (json(stdout).ok !== true) throw new Error('/health did not answer ok');
		},
	},
	{
		page: '/docs/', n: 3, mode: 'run', expect: 'curl http://127.0.0.1:8000/v1/systemone',
		note: "the answers are the stand-in's, not the default model's",
		assert: recordedAnswers,
	},
	{
		page: '/docs/api/', n: 1, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/v1/models', show: (stdout) => stdout.replace(/\}\{/g, '}\n{'),
		assert(stdout) {
			if (!stdout.includes('"ok":true') && !stdout.includes('"ok": true')) throw new Error('/health did not answer ok');
			if (!stdout.includes('"category"')) throw new Error('the choice question was not answered');
		},
	},
	// Call it from your code, on the stand-in: the recorded support ticket sent from each language (src/lib/site-blocks.mjs),
	// then decisio's programs for the frameworks (docs/integrations.md), the Python ones run with the versions they name.
	{ page: '/docs/use-from/', n: 1, mode: 'same-as', expect: 'curl http://127.0.0.1:8000/v1/systemone', of: ['/docs/', 3] },
	{ page: '/docs/use-from/', n: 2, mode: 'python', expect: 'import json\nimport urllib.request', assert: printsThreeAnswers, note: "the answers are the stand-in's, not the default model's" },
	{
		page: '/docs/use-from/', n: 3, mode: 'python', expect: 'from typesafe_sdk import TypeSafeClient', with: ['typesafe-sdk==0.7.2'],
		assert: printsThreeAnswers, note: "with TypeSafe's Python SDK 0.7.2, the version the page names",
	},
	{ page: '/docs/use-from/', n: 4, mode: 'node', expect: 'const body = {', assert: printsThreeAnswers, note: "the answers are the stand-in's, not the default model's" },
	{ page: '/docs/use-from/', n: 5, mode: 'node', ts: true, expect: 'const body: {', assert: printsThreeAnswers, note: "the answers are the stand-in's, not the default model's" },
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
		page: '/docs/scale/', n: 1, mode: 'python', expect: 'import json\nimport urllib.request', show: asPrinted,
		assert(stdout) {
			if (!/^answers: 50$/m.test(stdout) || !/^server ms: \d/m.test(stdout)) throw new Error('the fifty questions were not all answered, or no server time came back');
		},
	},
	{
		page: '/docs/scale/', n: 2, mode: 'python', expect: 'import json\nimport urllib.request', show: asPrinted,
		assert(stdout) {
			if (!/^options answered: 120$/m.test(stdout)) throw new Error('a question with 120 options did not come back with 120 probabilities');
		},
	},
	{
		page: '/docs/scale/', n: 3, mode: 'python', expect: 'import json\nimport urllib.request', show: asPrinted,
		assert(stdout) {
			if (!/^first question: \d/m.test(stdout) || !/^a different question about the same text: \d/m.test(stdout)) throw new Error('no server time came back for both questions');
		},
	},
	{
		// From here on the stand-in saves its tasks, as Teach a task's step 6 starts a server.
		page: '/docs/tasks/', n: 1, mode: 'run', expect: 'curl http://127.0.0.1:8000/v1/tasks', trimmed: true,
		restart: `rm -rf ${TASKS_DIR} && uv run python -m decisio.serve.vllm_engine --backend hf --model Qwen/Qwen3-0.6B-Base --tasks-dir ${TASKS_DIR}`,
		show: (stdout) => { const t = json(stdout); return JSON.stringify({ id: t.id, n_examples: t.n_examples, calibration: { applied: t.calibration?.applied, reason: t.calibration?.reason }, head: { applied: t.head?.applied, reason: t.head?.reason } }, null, 1); },
		assert(stdout) {
			if (json(stdout).id !== 'ticket-routing') throw new Error('the registration did not answer with the task');
		},
	},
	{ page: '/docs/images/', n: 1, mode: 'example', expect: 'import base64' },
	{ page: '/docs/images/', n: 2, mode: 'shown', expect: 'pip install "decisio[serve]', why: 'it needs Linux with one NVIDIA card, which this check does not have' },
	// The use-case recipes, on the stand-in: each asks its question and routes on the certificate (src/lib/use-cases.mjs);
	// the stand-in certifies nothing, so every answer takes the person's branch, which the assertion accepts like the other.
	{
		page: '/docs/use-cases/support-routing/', n: 1, mode: 'python', expect: 'import json\nimport urllib.request', show: asPrinted,
		assert(stdout) {
			if (!stdout.trim()) throw new Error('the support-routing recipe printed no route');
		},
	},
	{ page: '/docs/use-cases/support-routing/', n: 2, mode: 'example', expect: 'POST /v1/tasks\n{"id": "support-routing",' },
	{
		page: '/docs/use-cases/gatekeeper/', n: 1, mode: 'python', expect: 'import json\nimport urllib.request', show: asPrinted,
		assert(stdout) {
			if (!stdout.trim()) throw new Error('the gatekeeper recipe printed no route');
		},
	},
	{ page: '/docs/use-cases/gatekeeper/', n: 2, mode: 'example', expect: 'POST /v1/tasks\n{"id": "gatekeeper",' },
	{
		page: '/docs/use-cases/issue-triage/', n: 1, mode: 'python', expect: 'import json\nimport urllib.request', show: asPrinted,
		assert(stdout) {
			if (!stdout.trim()) throw new Error('the issue-triage recipe printed no route');
		},
	},
	{ page: '/docs/use-cases/issue-triage/', n: 2, mode: 'example', expect: 'POST /v1/tasks\n{"id": "issue-triage",' },
	{
		page: '/docs/use-cases/guardrails/', n: 1, mode: 'python', expect: 'import json\nimport urllib.request', show: asPrinted,
		assert(stdout) {
			if (!stdout.trim()) throw new Error('the guardrails recipe printed no route');
		},
	},
	{ page: '/docs/use-cases/guardrails/', n: 2, mode: 'example', expect: 'POST /v1/tasks\n{"id": "guardrails",' },
	{
		page: '/docs/use-cases/rag-gate/', n: 1, mode: 'python', expect: 'import json\nimport urllib.request', show: asPrinted,
		assert(stdout) {
			if (!stdout.trim()) throw new Error('the rag-gate recipe printed no route');
		},
	},
	{ page: '/docs/use-cases/rag-gate/', n: 2, mode: 'example', expect: 'POST /v1/tasks\n{"id": "rag-gate",' },
	{
		page: '/docs/use-cases/document-classification/', n: 1, mode: 'python', expect: 'import json\nimport urllib.request', show: asPrinted,
		assert(stdout) {
			if (!stdout.trim()) throw new Error('the document-classification recipe printed no route');
		},
	},
	{ page: '/docs/use-cases/document-classification/', n: 2, mode: 'example', expect: 'POST /v1/tasks\n{"id": "document-classification",' },
	{ page: '/docs/use-cases/', n: 1, mode: 'same-as', expect: 'import json\nimport urllib.request', of: ['/docs/use-cases/support-routing/', 1] },
	// Operate and Troubleshoot, on the stand-in.
	{
		page: '/docs/operating/', n: 1, mode: 'run', expect: 'until curl -sf http://127.0.0.1:8000/health',
		assert(stdout) {
			if (json(stdout).ok !== true) throw new Error('/health did not answer ok');
		},
	},
	{
		page: '/docs/operating/', n: 2, mode: 'run', expect: 'curl -s -D - -o /dev/null http://127.0.0.1:8000/v1/systemone', show: (stdout) => stdout.split(/\r?\n/).filter((l) => /^(HTTP\/|x-decisio-)/i.test(l)).join('\n'), trimmed: true,
		assert(stdout) {
			if (!/^x-decisio-server-ms:/im.test(stdout)) throw new Error('the server-time header is missing');
		},
	},
	{
		page: '/docs/troubleshooting/', n: 1, mode: 'run', expect: '# 200 when the engine is up', show: asPrinted,
		assert(stdout) {
			if (!/^200$/m.test(stdout)) throw new Error('/health did not answer 200');
		},
	},
	// How it works, on the stand-in.
	{ page: '/docs/how-it-works/', n: 1, mode: 'same-as', expect: 'curl http://127.0.0.1:8000/v1/systemone', of: ['/docs/', 3] },
	{ page: '/docs/how-it-works/', n: 2, mode: 'output', expect: '{\n  "answers": {' },
	{ page: '/docs/evaluation-card/', n: 1, mode: 'same-as', expect: 'curl -s http://127.0.0.1:8000/health', of: ['/docs/', 2] },
	{ page: '/docs/limits/', n: 1, mode: 'same-as', expect: 'curl -s http://127.0.0.1:8000/health', of: ['/docs/', 2] },
	// Batch concurrent requests: the server's mode read from /health on the stand-in (serial, the default); the batched
	// start is decisio's command on a card.
	{
		page: '/docs/concurrency/', n: 1, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/health \\', show: asPrinted,
		assert(stdout) {
			if (json(stdout).mode !== 'serial') throw new Error('/health does not report the serial mode, the default');
		},
	},
	{ page: '/docs/concurrency/', n: 2, mode: 'shown', expect: 'pip install "decisio[serve]', why: 'it needs Linux with one NVIDIA card, which this check does not have' },
	// Serve the tuned 12B: decisio's command on a card, which this check does not have.
	{ page: '/docs/deploy/tuned-12b/', n: 1, mode: 'shown', expect: 'python3.12 -m venv .venv', why: 'it needs Linux with one NVIDIA card and about 24 GB of bf16 weights, which this check does not have' },
	{ page: '/docs/deploy/tuned-12b/', n: 2, mode: 'shown', expect: 'pip install "decisio[serve]', why: 'it needs Linux with an NVIDIA card that supports FP8, which this check does not have' },
	{ page: '/docs/deploy/tuned-12b/', n: 3, mode: 'shown', expect: 'pip install "decisio[mlx]', why: 'it needs a Mac with Apple silicon, which this check does not have' },
	// Teach a task whose options change: shown until the decisio release that has it, then run on the stand-in.
	{ page: '/docs/tasks/dynamic/', n: 1, mode: 'shown', expect: 'curl -s http://127.0.0.1:8000/v1/tasks', why: 'the pinned decisio release does not have dynamic tasks yet' },
	// Choose the prompt layout: the layout read from /health on the stand-in (the Qwen model's default, plain); the start
	// with --layout plain is decisio's command on a card.
	{
		page: '/docs/layout/', n: 1, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/health \\', show: asPrinted,
		assert(stdout) {
			const l = json(stdout);
			if (l.value !== 'plain' || l.default !== 'plain' || l.why !== 'the default of the base') throw new Error(`/health does not report the Qwen model's default layout, plain: ${stdout}`);
		},
	},
	{ page: '/docs/layout/', n: 2, mode: 'shown', expect: 'pip install "decisio[serve]', why: 'it needs Linux with one NVIDIA card, which this check does not have' },
	// Think when unsure: the server's think setting read from /health on the stand-in (thinking off, its default); the start
	// and a thinking request need the vLLM engine, which writes the reasoning.
	{ page: '/docs/think/', n: 1, mode: 'shown', expect: 'pip install "decisio[serve]', why: 'it needs Linux with one NVIDIA card, which this check does not have' },
	{ page: '/docs/think/', n: 2, mode: 'shown', expect: 'curl -s http://127.0.0.1:8000/v1/systemone', why: "it needs a server that thinks; the CPU stand-in cannot write reasoning, only the vLLM engine on a card can" },
	{
		page: '/docs/think/', n: 3, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/health \\', show: asPrinted,
		assert(stdout) {
			const t = json(stdout);
			if (t.default !== false || t.factor !== 1 || t.budget !== 512) throw new Error('/health does not show thinking off with factor 1 and budget 512');
		},
	},
	// Serve your own adapter: decisio's adapter file checked by decisio's own tool on the CPU (what it printed is shown); the
	// start, a question with the adapter and the /health read need a card, and the fit needs an adapter's readouts.
	{
		page: '/docs/deploy/adapter/', n: 1, mode: 'run', expect: "cat > decisio_adapter.json <<'EOF'", show: asPrinted,
		assert(stdout) {
			const f = json(stdout);
			if (!f.temperatures?.choice || !f.choice_bands?.['2-10']) throw new Error('the check did not print the temperatures and the choice bands');
		},
	},
	{ page: '/docs/deploy/adapter/', n: 2, mode: 'shown', expect: 'pip install "decisio[serve]', why: 'it needs Linux with one NVIDIA card and a LoRA adapter, which this check does not have' },
	{ page: '/docs/deploy/adapter/', n: 3, mode: 'shown', expect: 'python -m decisio.serve.adapter_temperatures fit --reads', why: "it needs your adapter's readouts on your labelled items" },
	{ page: '/docs/deploy/adapter/', n: 4, mode: 'shown', expect: 'curl -s http://127.0.0.1:8000/v1/systemone', why: 'it needs a server with an adapter loaded, on one NVIDIA card' },
	{ page: '/docs/deploy/adapter/', n: 5, mode: 'shown', expect: 'curl -s http://127.0.0.1:8000/health \\', why: 'it needs a server with an adapter loaded, on one NVIDIA card' },
	{ page: '/docs/deploy/development/', n: 1, mode: 'same-as', expect: `git clone --branch ${pin.tag}`, of: ['/docs/', 1] },
	{ page: '/docs/deploy/development/', n: 2, mode: 'same-as', expect: 'curl -s http://127.0.0.1:8000/health', of: ['/docs/', 2] },

	{
		page: '/docs/releases/', n: 1, mode: 'run', expect: 'uv run python -c "from importlib.metadata import version', show: asPrinted,
		assert(stdout) {
			if (stdout.trim() !== pin.tag.replace(/^v/, '')) throw new Error(`the installed release is ${stdout.trim()}, not ${pin.tag}`);
		},
	},

	// Teach a task, end to end on the stand-in that is already up.
	{ page: '/docs/tasks/', n: 2, mode: 'example', expect: '{\n  "id": "ticket-routing",' },
	{
		page: '/docs/tasks/', n: 3, mode: 'run', expect: 'uv run python examples/tasks/register.py', show: asPrinted,
		assert(stdout) {
			if (!/task 'ticket-routing'/.test(stdout)) throw new Error('register.py did not report the task');
		},
	},
	{
		page: '/docs/tasks/', n: 4, mode: 'run', expect: 'uv run python examples/tasks/ask.py', show: asPrinted,
		assert(stdout) {
			if (!/x-decisio-tasks: ticket-routing/.test(stdout)) throw new Error('the question did not match the registered task');
		},
	},
	// decisio's start with a task directory, which needs a card and a volume; then where this server saves its tasks.
	{ page: '/docs/tasks/', n: 5, mode: 'shown', expect: 'python -m decisio.serve.vllm_engine --tasks-dir', why: "it is the start of a server on a card, with a directory on a volume; its other flags are the reader's" },
	{
		page: '/docs/tasks/', n: 6, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/health \\', show: asPrinted,
		note: `on the stand-in started with --tasks-dir ${TASKS_DIR}, after the task above was registered`,
		assert(stdout) {
			const t = json(stdout);
			if (t.saved_to?.backend !== 'dir' || t.saved_to?.path !== TASKS_DIR || !(t.readout?.loaded >= 1)) throw new Error(`/health does not show the tasks saved to ${TASKS_DIR} with the task registered`);
		},
	},
	{
		page: '/docs/tasks/', n: 7, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/v1/tasks',
		async assert(stdout, ctx) {
			const tasks = await (await fetch('http://127.0.0.1:8000/v1/tasks')).json();
			if (JSON.stringify(tasks).includes('"ticket-routing"')) throw new Error('the task is still registered after the delete');
			if (!ctx.fileHasContent('tasks.json')) throw new Error('the export wrote no tasks.json');
		},
	},
	// Certify answers: the walk-through's 120 tickets registered with a certificate on the stand-in (what it printed is shown),
	// then the certificate and answers of decisio's worked example recorded on the 31B at the pinned release
	// (src/lib/recorded.mjs), then the threshold picked by hand, on the stand-in.
	{
		page: '/docs/tasks/certify/', n: 1, mode: 'run', expect: 'uv run python -c \'import json; b = json.load(open("examples/tasks/examples.json"))', show: asPrinted,
		assert(stdout) {
			const c = json(stdout);
			if (c.alpha !== 0.05 || typeof c.n !== 'number' || !('threshold' in c)) throw new Error('the registration did not answer with a certificate at 0.05');
		},
	},
	{ page: '/docs/tasks/certify/', n: 2, mode: 'output', expect: '{\n "certificate": {\n  "id": "ticket-queue#7151e6bd7fd1"' },
	{ page: '/docs/tasks/certify/', n: 3, mode: 'output', expect: '[\n {\n  "ticket":' },
	{
		page: '/docs/tasks/certify/', n: 4, mode: 'python', expect: 'import json\nimport urllib.request', show: asPrinted,
		assert(stdout) {
			if (!/^(keep|escalate)/m.test(stdout)) throw new Error('the script reached no decision');
		},
	},	// Watch for drift: the status and the metrics of the task Certify answers registered, on the stand-in.
	{
		page: '/docs/tasks/drift/', n: 1, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/v1/tasks/ticket-routing \\', show: asPrinted,
		assert(stdout) {
			if (typeof json(stdout).state !== 'string') throw new Error('the task answered with no state');
		},
	},
	{
		page: '/docs/tasks/drift/', n: 2, mode: 'run', expect: "curl -s http://127.0.0.1:8000/metrics | grep '^decisio_task_'", show: (stdout) => stdout.trim().split('\n').slice(0, 14).join('\n'), trimmed: true,
		assert(stdout) {
			if (!/^decisio_task_state\{/m.test(stdout)) throw new Error('/metrics has no decisio_task_state line for the certified task');
		},
	},


	// Upgrade, on the stand-in, on the walk-through task Certify answers registered with a certificate.
	{
		page: '/docs/upgrading/', n: 1, mode: 'run', expect: "curl -s 'http://127.0.0.1:8000/v1/tasks?full=1' > tasks.json",
		assert(stdout, ctx) {
			if (!ctx.fileHasContent('tasks.json')) throw new Error('the export wrote no tasks.json');
		},
	},
	{
		page: '/docs/upgrading/', n: 2, mode: 'run', expect: 'uv run python examples/tasks/register.py --id ticket-routing --data examples/tasks/heldout.csv', show: asPrinted,
		assert(stdout) {
			const c = json(stdout.slice(stdout.indexOf('{')));
			if (c.alpha !== 0.1 || typeof c.n !== 'number') throw new Error('the certify route did not answer with a certificate at 0.1');
		},
	},
	{
		page: '/docs/upgrading/', n: 3, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/v1/tasks/ticket-routing', trimmed: true,
		show: (stdout) => { const o = json(stdout); return JSON.stringify({ id: o.id, status: { state: o.status?.state, text: o.status?.text } }, null, 1); },
		assert(stdout) {
			if (json(stdout).id !== 'ticket-routing') throw new Error('the task did not answer with itself');
		},
	},

	// Paths that need hardware this check does not have.
	// The deploy guides: decisio's commands at the pinned release, from a package, a clone or the release image.
	{ page: '/docs/deploy/cloud-gpu/', n: 1, mode: 'shown', expect: 'python3.12 -m venv .venv', why: "it needs Linux with one NVIDIA card, which this check does not have; decisio's README timed the same install, of decisio 0.11.0, on 2026-10-09" },
	{ page: '/docs/deploy/cloud-gpu/', n: 2, mode: 'output', expect: '{\n "ok": true,\n "base": "gemma-4-31b"' },
	{ page: '/docs/deploy/cloud-gpu/', n: 3, mode: 'shown', expect: `git clone --branch ${pin.tag}`, why: 'it needs Linux with one NVIDIA card, which this check does not have' },
	{ page: '/docs/deploy/cloud-gpu/', n: 4, mode: 'verbatim', expect: 'uv run python -m decisio.serve.vllm_engine --base tachara-ai/decisio-gemma-4-31b', needs: 'Linux with one NVIDIA card' },
	{ page: '/docs/deploy/cloud-gpu/', n: 5, mode: 'shown', expect: '# /etc/systemd/system/decisio.service', why: "decisio wrote it for its docs and has not run it; the options are systemd's documented ones" },
	{ page: '/docs/deploy/cloud-gpu/', n: 6, mode: 'shown', expect: 'apiVersion: apps/v1', why: "decisio wrote it for its docs, with the release image in place of its placeholder, and has not run it; the probes read /health as measured" },
	{ page: '/docs/deploy/docker/', n: 1, mode: 'shown', expect: 'docker run -d --gpus all', why: 'it needs a GPU host with the NVIDIA Container Toolkit, which this check does not have' },
	{
		page: '/docs/deploy/docker/', n: 2, mode: 'shown', expect: 'name: decisio', record: 'runs/2026-10-01_docker-first-gpu-start/',
		why: "decisio's compose.yaml, with the release image in place of its local build; not run at this release (an image built from decisio's main came up with the file on a card on 2026-10-01)",
	},
	{ page: '/docs/deploy/docker/', n: 3, mode: 'shown', expect: `git clone --branch ${pin.tag}`, why: 'it needs a GPU host with the NVIDIA Container Toolkit, which this check does not have' },
	{ page: '/docs/deploy/mac/', n: 1, mode: 'shown', expect: `git clone --branch ${pin.tag}`, why: 'it needs a Mac with Apple silicon, which this check does not have' },
	{ page: '/docs/deploy/mac/', n: 2, mode: 'verbatim', expect: 'uv run python -m decisio.serve.vllm_engine --backend mlx --base gemma-4-31b --model mlx-community/gemma-4-31b-it-6bit', needs: 'a Mac with Apple silicon', record: 'runs/2026-10-07_mlx-gemma-31b/' },
	{ page: '/docs/deploy/mac/', n: 3, mode: 'verbatim', expect: 'uv run python -m decisio.serve.vllm_engine --backend mlx --base gemma-4-31b --model tachara-ai/decisio-gemma-4-31b-mlx-4bit', needs: 'a Mac with Apple silicon', record: 'runs/2026-10-16_mlx-gemma-31b-4bit/' },
	{ page: '/docs/deploy/mac/', n: 4, mode: 'verbatim', expect: 'uv run python -m decisio.serve.vllm_engine --backend mlx --base gemma-4-12b', needs: 'a Mac with Apple silicon', record: 'runs/2026-10-05_mlx-gemma/' },
	{ page: '/docs/deploy/mac/', n: 5, mode: 'output', expect: 'decisio: the gemma-4-12b base needs about 16.6 GiB under MLX' },
	// The pull is decisio's; both Ollama blocks are run against Ollama by scripts/verify-ollama.mjs
	// (the request is site-written: src/lib/site-blocks.mjs).
	{ page: '/docs/deploy/mac/', n: 6, mode: 'ollama', expect: 'ollama pull aminroudaki/decisio-gemma', models: ['aminroudaki/decisio-gemma', 'aminroudaki/decisio'], needs: '0.35.1', upTo: '0.40.3', assert: pulled },
	{ page: '/docs/deploy/mac/', n: 7, mode: 'ollama', expect: 'curl http://localhost:11434/v1/systemone', models: ['aminroudaki/decisio-gemma'], needs: '0.35.1', upTo: '0.40.3', assert: ticketAnswers },
	{ page: '/docs/bases/', n: 1, mode: 'verbatim', expect: 'uv run python -m decisio.serve.vllm_engine                          # gemma-4-31b, the default', needs: 'an NVIDIA card', record: 'runs/2026-10-04_gemma-base/' },

	{ page: '/docs/releases/', n: 2, mode: 'verbatim', expect: 'uv run python -m decisio.serve.vllm_engine --base qwen3.6-35b-a3b', needs: 'an NVIDIA card, and for the container the NVIDIA Container Toolkit' },

	// Shapes and recorded output.
	{ page: '/docs/api/', n: 2, mode: 'example', expect: '{"model": "decisio-gemma-4-31b-it-letters",' },
	{ page: '/docs/api/', n: 3, mode: 'example', expect: '{"id": "ticket-routing",' },
	{ page: '/docs/api/', n: 4, mode: 'example', expect: '{"id": "...",' },
	{ page: '/docs/flags/', n: 1, mode: 'example', expect: 'uv run python -m decisio.serve.vllm_engine [flags]' },
	// Move from System One: decisio's docs/migrating.md blocks, TypeSafe's SDK against the stand-in, then the two reads.
	{ page: '/docs/migrating/', n: 1, mode: 'run', expect: 'export TYPESAFE_BASE_URL=', note: 'sets the variables the SDK reads' },
	{
		page: '/docs/migrating/', n: 2, mode: 'python', expect: 'from typesafe_sdk import TypeSafeClient',
		with: ['typesafe-sdk==0.7.2'], note: "with TypeSafe's Python SDK 0.7.2, the version the page names", show: asPrinted,
		assert(stdout) {
			if (!/^(billing|access|bug) [\d.]+$/m.test(stdout)) throw new Error('the SDK script did not print a label and its confidence');
		},
	},
	{
		page: '/docs/migrating/', n: 3, mode: 'run', expect: 'curl -s http://127.0.0.1:8000/v1/models', show: (stdout) => JSON.stringify(json(stdout), null, 1),
		assert(stdout) {
			if (typeof json(stdout).models?.[0]?.name !== 'string') throw new Error('/v1/models did not list the served name');
		},
	},
	{ page: '/docs/migrating/', n: 4, mode: 'same-as', expect: 'curl -s http://127.0.0.1:8000/health', of: ['/docs/', 2] },

	// The home page's Get started: each tab's block is a deploy guide's own, and the request and its answer are Get started's.
	{ page: '/', n: 1, mode: 'same-as', expect: 'python3.12 -m venv .venv', of: ['/docs/deploy/cloud-gpu/', 1] },
	{ page: '/', n: 2, mode: 'same-as', expect: 'docker run -d --gpus all', of: ['/docs/deploy/docker/', 1] },
	{ page: '/', n: 3, mode: 'shown', expect: `git clone --branch ${pin.tag}`, why: "it needs a Mac with Apple silicon, which this check does not have; its lines are the Mac guide's install and its start of the default model" },
	{ page: '/', n: 4, mode: 'same-as', expect: 'ollama pull aminroudaki/decisio-gemma', of: ['/docs/deploy/mac/', 6] },
	{ page: '/', n: 5, mode: 'same-as', expect: 'curl http://localhost:11434/v1/systemone', of: ['/docs/deploy/mac/', 7] },
	{ page: '/', n: 6, mode: 'same-as', expect: 'curl http://127.0.0.1:8000/v1/systemone', of: ['/docs/', 3] },
	{ page: '/', n: 7, mode: 'same-as', expect: '{\n  "answers": {', of: ['/docs/how-it-works/', 2] },
];
