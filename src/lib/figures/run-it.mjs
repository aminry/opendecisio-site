// The figures and tables of running a server: the flag groups, what happens when the engine dies, and the troubleshooting
// symptoms (the deploy guides' figures are in deploy.mjs). Each reads what it draws from the pinned release's docs and
// stops the build when one no longer says it.
import { readUpstream } from '../upstream.mjs';
import { esc, panel } from './core.mjs';

const text = (file) => readUpstream(file);
const must = (source, re, what) => {
	const m = re.exec(source);
	if (!m) throw new Error(`docs-figures: the pinned release no longer says ${what}`);
	return m;
};

/** Steps in a row: each { title, note }, the last one lit. */
function steps(list) {
	return `<ol class="fig__steps">${list.map((s, i) => `<li class="fig__step${i === list.length - 1 && !s.plain ? ' fig__step--on' : ''} f-pop fd-${Math.min(10, i * 2)}"><b>${esc(s.title)}</b><span>${s.note}</span></li>`).join('')}</ol>`;
}

// --- Operating ---------------------------------------------------------------------------------------------------------

function serveLifecycle() {
	const run = text('docs/running.md');
	must(run, /the server ends itself and leaves the restart to whatever runs it/, 'that the server ends itself when its engine dies');
	const probe = must(run, /a forward pass over a one-token prompt, given (\d+) seconds/, "the probe's time")[1];
	const [, grace, more] = must(run, /after (\d+) seconds, once every request in flight has its answer \(waiting at most (\d+) seconds more\), the server stops its engine processes and exits with code 70/, 'the grace before the exit');
	const after = must(run, /The in-process arrangement therefore exits about (\d+) seconds after the failing request/, 'when the in-process arrangement exits')[1];
	const body = steps([
		{ title: 'Healthy', note: '<code>/health</code> answers 200; requests are served' },
		{ title: 'A request fails', note: `the server probes the engine, for ${probe} seconds or longer if the engine has been slow` },
		{ title: 'The engine is dead', note: 'every request, and <code>/health</code>, answers 503 with the reason' },
		{ title: 'Exit code 70', note: `${grace} seconds later, at most ${more} more for requests in flight: about ${after} seconds after the failing request` },
		{ title: 'Your supervisor', note: 'starts a new server, which loads the model again' },
	]);
	return panel({
		name: 'serve-lifecycle', label: 'When the engine dies', title: 'A dead engine does not serve again: the server says so, exits, and your supervisor starts a new one.',
		desc: `A server serves while /health answers 200. When a request fails, the server probes its engine for ${probe} seconds or longer. If the engine is dead, every request and /health answer 503 with the reason, and ${grace} seconds later, at most ${more} more for requests in flight, the server exits with code 70: about ${after} seconds after the failing request. Your supervisor then starts a new server.`,
		body, legend: 'An error caused by the request itself, such as a 422, does not probe the engine.',
		source: 'Source: docs/running.md "When the engine dies" at the pinned release.',
	});
}

// --- Troubleshoot ---------------------------------------------------------------------------------------------------

// What a reader sees, why, and what to do, by when it happens. Each row names the sentences of decisio's docs at the
// pinned release it rests on (needs), and the build stops when one of them is gone.
const ts = 'docs/troubleshooting.md';
export const symptoms = [
	{ group: 'start', sees: 'Connection refused right after the start', cause: 'The server is still starting: the first start downloads the weights and loads the model.', does: 'Wait until `GET /health` answers.', needs: [['docs/running.md', '`/health` answers once it is ready']] },
	{ group: 'start', sees: 'vLLM\'s `ValueError: To serve at least one request with the model\'s max seq len`, or decisio\'s "holds a context of N tokens, less than the 32,768"', cause: 'The card is too small for the model at that text length. The container warns first when the card has less than 90 GB.', does: 'Start a smaller model (`--base gemma-4-12b`), lower the length (`--max-model-len 16384`) or raise `--gpu-memory-utilization`; or run on a Mac.', needs: [[ts, 'ValueError: To serve at least one request with the model\'s max seq len'], [ts, 'less than the 32,768 every record was measured at'], [ts, 'when the card has less than 90 GB'], [ts, '`--max-model-len 16384`']] },
	{ group: 'start', sees: '`decisio: no NVIDIA GPU is visible to this container`, and exit code 1', cause: 'The container cannot see the card, or the driver does not support CUDA 13.0.', does: 'Update the driver (R580 or newer; `nvidia-smi` shows the CUDA version it supports), install the NVIDIA Container Toolkit, and start with `--gpus all`.', needs: [[ts, 'decisio: no NVIDIA GPU is visible to this container'], [ts, 'R580 or newer for CUDA 13.0']] },
	{ group: 'start', sees: 'uvicorn\'s `address already in use`, and exit code 1, after the model has loaded', cause: 'Something else holds port 8000; some GPU rental templates run a proxy on it.', does: 'Start on another port (`--port 8001`, or `DECISIO_PORT` in the container), or find the process: `ss -ltnp | grep :8000` on Linux, `lsof -nP -iTCP:8000 -sTCP:LISTEN` on a Mac.', needs: [[ts, 'address already in use'], [ts, 'Some GPU rental templates run a proxy on 8000'], [ts, '`ss -ltnp | grep :8000`']] },
	{ group: 'start', sees: '`OSError: We couldn\'t connect to \'https://huggingface.co\'`', cause: 'The download failed and the files are not in the cache.', does: 'Start again: finished files stay in the cache. Check the cache\'s disk (`~/.cache/huggingface/hub`, `$HF_HOME`, or `/data/hf` in the container). A mirror must serve the pinned revision. Set `HF_HUB_OFFLINE=1` only once the files are cached.', needs: [[ts, 'We couldn\'t connect to \'https://huggingface.co\''], [ts, 'Set `HF_HUB_OFFLINE=1` only once the files are in the cache']] },
	{ group: 'start', sees: 'The server will not start and mentions `VLLM_USE_DEEP_GEMM`', cause: 'The server refuses to start when it is set to anything other than 0.', does: 'Unset it, or pass `--allow-deep-gemm` if you mean it.', needs: [['docs/running.md', 'The server refuses to start when `VLLM_USE_DEEP_GEMM` is set']] },
	{ group: 'start', sees: 'The server refuses a model repository', cause: 'The repository\'s settings differ from the installed release\'s; the message names what differs and the release it was made for.', does: 'Use the repository revision made for your release, or install that release.', needs: [['docs/running.md', 'refuses to start on a difference']] },
	{ group: 'request', sees: '422 on a request', cause: 'The request is malformed, or the prompt is longer than the length the server serves (`/health` reports it); the `detail` names what is wrong.', does: 'Read the `detail`; shorten the text or the question and send it again. The server stays up.', needs: [['docs/api.md', 'A malformed request is answered with status 422'], ['docs/api.md', 'is longer than the context']] },
	{ group: 'request', sees: '422 on a choice', cause: 'It failed validation, for example with more than 255 options.', does: 'Fix what the `detail` names, such as cutting the options to 255 or fewer.', needs: [['docs/migrating.md', 'a request with more gets 422'], ['docs/migrating.md', 'A request that fails validation gets 422']] },
	{ group: 'request', sees: '415 on a request', cause: 'The body was not sent as `Content-Type: application/json`.', does: 'Send the header on every POST.', needs: [['docs/api.md', 'any other type, or none, is refused with 415']] },
	{ group: 'request', sees: '503 on every request, and `/health` answers 503', cause: 'The engine died; the server is about to exit with code 70.', does: 'Let your supervisor start a new server; read the reason in the body.', needs: [['docs/api.md', 'answers 503 with `{"ok": false, "engine": "dead"'], ['docs/running.md', 'exits with code 70']] },
	{ group: 'tasks', sees: '`WARNING: tasks fitted under another model or rendering are not applied` at the start', cause: 'The tasks were taught under another model, prompt or yes/no rendering.', does: 'Teach them again from their examples.', needs: [['docs/tasks.md', 'tasks fitted under another model or rendering are not applied']] },
	{ group: 'tasks', sees: 'No `x-decisio-tasks` header on a question you taught', cause: 'The question matched no task: its type, options or order differ from the registration.', does: 'Ask it exactly as registered; renaming, adding or reordering an option makes a different task.', needs: [['docs/tasks.md', 'No header means the question matched no task']] },
	{ group: 'tasks', sees: 'Every answer of a task says `certified: false`', cause: 'Nothing was certified (`nothing_certified`), the serving setup changed (`serving_stack_changed`), or traffic shifted (`traffic_changed`).', does: 'Read `certified_reason` and `GET /v1/tasks/{id}`; certify again on new labelled examples.', needs: [['docs/tasks.md', '`certified_reason: "nothing_certified"`'], ['docs/tasks.md', 'with the reason `serving_stack_changed`'], ['docs/tasks.md', 'with the reason `traffic_changed`']] },
	{ group: 'answers', sees: 'An answer differs from an earlier one', cause: 'A request repeats exactly on a freshly started server; asked again on one that has already answered it, it can move slightly, and across restarts it is not promised.', does: 'Compare answers from the same server and session before treating a difference as a fault.', needs: [['EVAL_CARD.md', 'A request repeats exactly on a freshly started server'], ['EVAL_CARD.md', 'Repeatability across sessions is not promised.']] },
	{ group: 'answers', sees: 'The first request after a start is slow', cause: 'It warms the model; a long text seen for the first time also takes longer on the larger models.', does: 'Send a few requests first, and raise a client\'s timeout for long texts.', needs: [['docs/migrating.md', 'the first request after a start warms the engine']] },
];

/** The symptoms of one group as a table: what you see, why, what to do. */
export function symptomTable(group) {
	const rows = symptoms.filter((s) => s.group === group);
	if (!rows.length) throw new Error(`symptoms: no group "${group}"`);
	for (const s of rows) for (const [file, needle] of s.needs) if (!text(file).includes(needle)) throw new Error(`symptoms: ${file} no longer says "${needle}"`);
	const md = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>');
	const heads = ['What you see', 'Why', 'What to do'];
	return `<div class="table-wrap"><table class="docs-table"><thead><tr>${heads.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((s) => `<tr>${[s.sees, s.cause, s.does].map((c, i) => `<td data-label="${heads[i]}">${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

export const runItFigures = {
	'serve-lifecycle': serveLifecycle,
};
