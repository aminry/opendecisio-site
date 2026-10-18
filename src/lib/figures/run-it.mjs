// The figures of "Run it": the start-up times, the container's start, a Mac's memory, the Ollama sizes, the stand-in,
// the flag groups, the server's life, what /health reports, the upgrade path and the common symptoms. Each reads the
// numbers it draws from the pinned release's docs and stops the build when one no longer says them.
import { slugify } from '../upstream-map.mjs';
import { readUpstream } from '../upstream.mjs';
import { esc, panel } from './core.mjs';

const text = (file) => readUpstream(file);
const must = (source, re, what) => {
	const m = re.exec(source);
	if (!m) throw new Error(`docs-figures: the pinned release no longer says ${what}`);
	return m;
};
const secs = (min, s) => Number(min) * 60 + Number(s);
const clock = (n) => (n >= 60 ? `${Math.floor(n / 60)} min ${n % 60} s` : `${n} s`);

/** A horizontal bar chart in SVG: rows of { label, value, text, grey }, drawn to one scale. */
function bars(rows, { max, width = 380, left = 190, rowH = 34, delay = 1 } = {}) {
	const top = 6;
	const h = top + rows.length * rowH + 4;
	const body = rows.map((r, i) => {
		const y = top + i * rowH;
		const w = Math.max(2, (r.value / max) * width);
		return `<text class="ft ft-s" x="8" y="${y + 15}">${esc(r.label)}</text><rect class="f-rail" x="${left}" y="${y}" width="${width}" height="18" rx="9"/><rect class="f-bar${r.grey ? ' f-bar--grey' : ''} f-grow fd-${Math.min(10, delay + i)}" x="${left}" y="${y}" width="${w.toFixed(1)}" height="18" rx="9"/><text class="ft ft-n f-pop fd-${Math.min(10, delay + i + 1)}" x="${left + width + 10}" y="${y + 14}">${esc(r.text)}</text>`;
	}).join('');
	return `<svg class="fig__svg" viewBox="0 0 720 ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
}

/** Steps in a row: each { title, note }, the last one lit. */
function steps(list) {
	return `<ol class="fig__steps">${list.map((s, i) => `<li class="fig__step${i === list.length - 1 && !s.plain ? ' fig__step--on' : ''} f-pop fd-${Math.min(10, i * 2)}"><b>${esc(s.title)}</b><span>${s.note}</span></li>`).join('')}</ol>`;
}

// --- The GPU server's start ---------------------------------------------------------------------------------------

function gpuStart() {
	const readme = text('README.md');
	const m = must(readme, /`pip install "decisio\[serve\]"` took (\d+) s; the first start of the no-flag 31B was ready after (\d+) min (\d+) s, including the download of its weights, and a start with the weights already on disk after (\d+) min (\d+) s; the first start of `--base gemma-4-12b` after (\d+) min (\d+) s/, 'the pip path\'s measured times');
	const rows = [
		{ label: 'pip install "decisio[serve]"', value: Number(m[1]), text: clock(Number(m[1])), grey: true },
		{ label: '31B, first start (with download)', value: secs(m[2], m[3]), text: clock(secs(m[2], m[3])) },
		{ label: '31B, weights on disk', value: secs(m[4], m[5]), text: clock(secs(m[4], m[5])) },
		{ label: '12B, first start (with download)', value: secs(m[6], m[7]), text: clock(secs(m[6], m[7])) },
	];
	const run = text('docs/running.md');
	const sizes = must(run, /about (\d+) GB for the 31B's FP8 repository \((\d+) GB for Google's bf16 weights\) and about (\d+) GB for the Qwen base/, 'the checkpoints\' download sizes');
	return panel({
		name: 'gpu-start', label: 'The first start', title: 'Install, download, warm up: the first start is minutes, and the weights are most of it.',
		desc: `Measured on one RTX PRO 6000 at 600 W with decisio 0.11.0 from PyPI: ${rows.map((r) => `${r.label} ${r.text}`).join('; ')}.`,
		body: bars(rows, { max: 480, width: 320, left: 220 }), live: 6,
		legend: `The 31B's FP8 repository is about ${sizes[1]} GB to download (${sizes[2]} GB for Google's bf16 weights) and the Qwen base about ${sizes[3]} GB. These are one session's times, with the network that session had.`,
		source: 'Source: the README\'s "On a GPU, with pip" and docs/running.md at the pinned release (measured 2026-10-09; AMD EPYC 9534).',
	});
}

function dockerFlow() {
	const run = text('docs/running.md');
	const t = must(run, /healthy in (\d+) s including the checkpoint download and in (\d+) s from the cached volume/, 'the container\'s first start times');
	const rows = [{ label: 'first start, with download', value: Number(t[1]), text: clock(Number(t[1])) }, { label: 'from the cached volume', value: Number(t[2]), text: clock(Number(t[2])) }];
	const body = `${steps([
		{ title: 'uv build --wheel', note: 'the image installs this wheel' },
		{ title: 'docker compose up --build', note: 'needs the NVIDIA Container Toolkit and a GPU host' },
		{ title: '/health answers', note: 'once the first start has fetched the checkpoint into the <code>decisio-data</code> volume' },
	])}${bars(rows, { max: 700, width: 320, left: 220, delay: 3 })}`;
	return panel({
		name: 'docker-flow', label: 'In a container', title: 'Build the wheel, bring the container up, wait for /health.',
		desc: `Docker: build the wheel, run docker compose up --build, and /health answers once the checkpoint is fetched: ${rows.map((r) => `${r.label} ${r.text}`).join('; ')} (the Qwen base, the container's default then).`,
		body, live: 7, legend: 'Those starts were with the Qwen base, the container\'s default at the time; the container now serves the 31B, which needs a 96 GB card.',
		source: 'Source: docs/running.md at the pinned release (runs/2026-10-01_docker-first-gpu-start/).',
	});
}

// --- The Mac ------------------------------------------------------------------------------------------------------------

function mlxMemory() {
	const run = text('docs/running.md');
	const qwen4 = must(run, /weights take (\d+\.\d) GB and it peaks at (\d+\.\d), (\d+\.\d) and (\d+\.\d) GB at about 8k, 16k and 32k tokens/, 'the Qwen 4-bit memory');
	const qwen6 = must(run, /Peak memory at 32,761 tokens of state at 6 and 8 bits: (\d+\.\d) GB and (\d+\.\d) GB/, 'the Qwen 6- and 8-bit peaks');
	const g12 = must(run, /holds (\d+\.\d) GB of weights and peaks at (\d+\.\d) GB at 32,687 tokens of state, so it runs on a 32 GB Mac/, 'the 12B\'s memory');
	const g31 = must(run, /\(26\.1 GB to download, (\d+\.\d) GB of weights in memory\)[\s\S]*?It peaks at (\d+\.\d), (\d+\.\d) and (\d+\.\d) GB at about 8k, 16k and 32k tokens of state, against the Mac's GPU memory limit of (\d+\.\d) GB/, 'the 31B\'s memory');
	const g31q4 = must(run, /The 4-bit conversion `tachara-ai\/decisio-gemma-4-31b-mlx-4bit` \(group size 32, (\d+\.\d) GB of weights\) is for Macs with 48 GB of memory[\s\S]*?The 4-bit conversion peaks at (\d+\.\d), (\d+\.\d) and (\d+\.\d) GB at about 8k, 16k and 32k tokens of state, under a 27 GiB MLX memory limit on a 64 GB Mac/, 'the 31B\'s 4-bit memory');
	must(run, /A 48 GB Mac is the smallest it starts on by decisio's memory planner, which refuses 32 and 36 GB; no 48 GB Mac was measured\./, 'that no 48 GB Mac was measured');
	const rows = [
		{ label: 'Gemma 4 12B, 6-bit', value: Number(g12[2]), text: `${g12[2]} GB` },
		{ label: 'Qwen, 4-bit', value: Number(qwen4[4]), text: `${qwen4[4]} GB` },
		{ label: 'Qwen, 6-bit', value: Number(qwen6[1]), text: `${qwen6[1]} GB` },
		{ label: 'Gemma 4 31B, 4-bit', value: Number(g31q4[4]), text: `${g31q4[4]} GB` },
		{ label: 'Gemma 4 31B, 6-bit', value: Number(g31[4]), text: `${g31[4]} GB` },
		{ label: 'Qwen, 8-bit', value: Number(qwen6[2]), text: `${qwen6[2]} GB`, grey: true },
	];
	return panel({
		name: 'mlx-memory', label: 'A Mac\'s memory', title: 'Peak memory at about 32,000 tokens of state, by base and conversion.',
		desc: `Peak memory at about 32,000 tokens of state on a Mac: ${rows.map((r) => `${r.label} ${r.text}`).join('; ')}. The 31B was measured on a 64 GB Mac, whose GPU memory limit is ${g31[5]} GB.`,
		body: bars(rows, { max: 45, width: 330, left: 190 }), live: 6,
		legend: `The 12B's weights take ${g12[1]} GB, so it runs on a 32 GB Mac. The 31B's take ${g31[1]} GB at 6 bits and ${g31q4[1]} GB at 4, both documented for states up to 16,383 tokens and measured only on a 64 GB Mac (limit ${g31[5]} GB; the 4-bit under a 27 GiB limit); the 4-bit 31B is for a 48 GB Mac, a size not measured, and the 4-bit Qwen for Macs with more than 32 GB. GB are 1e9 bytes.`,
		source: 'Source: docs/running.md "Mac with MLX" at the pinned release (an Apple M5 Pro; runs/2026-10-02_mlx-backend, 2026-10-05_mlx-gemma, 2026-10-06_mlx-qwen-4bit-regate, 2026-10-07_mlx-gemma-31b, 2026-10-16_mlx-gemma-31b-4bit).',
	});
}

function ollamaTags() {
	const run = text('docs/running.md');
	const g = must(run, /its `q4_k_m` tag \(also `latest`\) is a (\d+\.\d) GB download and takes (\d+\.\d) GB in Ollama at the listing's 8,192-token context; its `q8_0` tag takes (\d+\.\d) GB/, 'the Gemma listing\'s sizes');
	const q = must(run, /The Qwen listing's smallest tag is a (\d+) GB download/, 'the Qwen listing\'s size');
	const rows = [
		{ label: 'Gemma q4_k_m, download', value: Number(g[1]), text: `${g[1]} GB` },
		{ label: 'Gemma q4_k_m, in Ollama', value: Number(g[2]), text: `${g[2]} GB` },
		{ label: 'Gemma q8_0, in Ollama', value: Number(g[3]), text: `${g[3]} GB` },
		{ label: 'Qwen, smallest, download', value: Number(q[1]), text: `${q[1]} GB`, grey: true },
	];
	return panel({
		name: 'ollama-tags', label: 'Ollama sizes', title: 'The Gemma listing fits a 16 GB laptop; the Qwen listing needs more.',
		desc: `Ollama listings: ${rows.map((r) => `${r.label} ${r.text}`).join('; ')}.`,
		body: bars(rows, { max: 25, width: 330, left: 210 }), live: 5,
		legend: 'Ollama builds its own prompt and applies no calibration, so its numbers are the ones on its model pages. It needs Ollama 0.35.1 or later.',
		source: 'Source: docs/running.md "Ollama" at the pinned release (Ollama 0.35.1 on an Apple M5 Pro; runs/2026-10-07_ollama-gemma-memory/).',
	});
}

function standIn() {
	const run = text('docs/running.md');
	must(run, /`--backend hf` serves every route from a small Hugging Face model on the CPU/, 'that the stand-in serves every route from a small model on the CPU');
	const body = steps([
		{ title: 'uv sync --extra dev --frozen', note: 'install with the development tools' },
		{ title: 'uv run pytest', note: 'the unit tests, on any machine' },
		{ title: '--backend hf', note: 'every route, from <code>Qwen/Qwen3-0.6B-Base</code> on the CPU' },
		{ title: 'for development', note: 'not the measured system; its answers are not for measurement' },
	]);
	return panel({
		name: 'stand-in', label: 'The stand-in', title: 'Every route, from a small model on the CPU, so you can build against the API anywhere.',
		desc: 'The CPU stand-in: install with the development tools, run the unit tests, start the server with --backend hf on Qwen/Qwen3-0.6B-Base. It serves every route, and it is for development, not measurement.',
		body, live: 5, legend: 'CI runs the stand-in on a pinned revision of the model, and the commands on these pages that it can serve are run against it.',
		source: 'Source: docs/running.md "CPU stand-in for development" at the pinned release.',
	});
}

// --- Flags -------------------------------------------------------------------------------------------------------------

function flagMap() {
	const cli = text('docs/cli.md');
	const start = cli.indexOf('## Every flag');
	const end = cli.indexOf('## What the behaviour flags do');
	if (start < 0 || end < 0) throw new Error('docs-figures: docs/cli.md no longer has its flag tables');
	const groups = [...cli.slice(start, end).split(/^### /m).slice(1)].map((g) => {
		const [title, ...rest] = g.split('\n');
		const flags = [...rest.join('\n').matchAll(/^\| (`--[^|]+`)(?: \||,)/gm)].flatMap((m) => [...m[1].matchAll(/`(--[a-z0-9-]+)/g)].map((x) => x[1]));
		return { title: title.trim().replace(/`/g, ''), flags: [...new Set(flags)], href: `#${slugify(title.trim())}` };
	});
	if (groups.length < 7 || groups.some((g) => !g.flags.length)) throw new Error('docs-figures: docs/cli.md\'s flag groups changed shape');
	const total = groups.reduce((n, g) => n + g.flags.length, 0);
	const body = `<ul class="fig__groups">${groups.map((g, i) => `<li class="f-pop fd-${Math.min(i, 10)}"><a href="${g.href}"><b>${esc(g.title)}</b><span class="fig__n">${g.flags.length} flags</span><span class="fig__chips">${g.flags.slice(0, 5).map((f) => `<code>${esc(f)}</code>`).join('')}${g.flags.length > 5 ? `<code>+${g.flags.length - 5}</code>` : ''}</span></a></li>`).join('')}</ul>`;
	return panel({
		name: 'flag-map', label: 'The flags', title: `${total} flags in ${groups.length} groups; the defaults are what was measured, so most need none.`,
		desc: `The server's flags by group: ${groups.map((g) => `${g.title}, ${g.flags.length}`).join('; ')}.`,
		body, live: 5, interactive: true, legend: 'Each group links to its table in the reference below; a flag given explicitly overrides the base\'s value.',
		source: 'Source: the tables of docs/cli.md at the pinned release.',
	});
}

// --- Operating ---------------------------------------------------------------------------------------------------------

function serveLifecycle() {
	const run = text('docs/running.md');
	must(run, /the server ends itself and leaves the restart to whatever runs it/, 'that the server ends itself when its engine dies');
	must(run, /exits with code 70/, 'exit code 70');
	const body = steps([
		{ title: 'Starting', note: 'downloads the checkpoint on the first start, then warms the engine' },
		{ title: 'Healthy', note: '<code>/health</code> answers 200; requests are served' },
		{ title: 'The engine dies', note: 'a failed forward pass or an exited engine process, confirmed before it is declared' },
		{ title: 'Every request gets 503', note: '<code>/health</code> answers 503 with the reason' },
		{ title: 'Exit code 70', note: 'about 2 seconds later, once the requests in flight have their answers' },
		{ title: 'Your restart policy', note: 'brings a new server, which loads the engine again' },
	]);
	return panel({
		name: 'serve-lifecycle', label: 'A server\'s life', title: 'A dead engine does not serve again: the server says so and exits, and something restarts it.',
		desc: 'A server starts, becomes healthy, and serves. If its engine dies, every request is answered with 503, /health answers 503 with the reason, and the server exits with code 70 for a restart policy to act on.',
		body, live: 8, legend: 'Run the server under a restart policy: Docker Compose `restart: unless-stopped`, systemd `Restart=on-failure`, or Kubernetes\' default `restartPolicy: Always` with a liveness probe on `/health`.',
		source: 'Source: docs/running.md "When the engine dies" at the pinned release (0.8.0 and later).',
	});
}

function healthMap() {
	const api = text('docs/api.md');
	const section = api.slice(api.indexOf('## `GET /health`'), api.indexOf('## `POST /v1/answer`'));
	const bullets = [...section.matchAll(/^- (.+)$/gm)].map((m) => m[1]);
	const names = ['The engine', 'The cache', 'The base', 'The prompt', 'The System One route', 'The other engines'];
	if (bullets.length !== names.length || !bullets[0].startsWith('`ok`') || !bullets[1].startsWith('`block_size`') || !bullets[2].startsWith('`base` and `profile`') || !bullets[3].startsWith('`prompt_format`') || !bullets[4].startsWith('`systemone`') || !bullets[5].startsWith('`head_engine`')) {
		throw new Error('docs-figures: docs/api.md\'s /health section no longer has its six bullets');
	}
	const plain = (t) => t.replace(/`/g, '');
	const hdr = [...api.matchAll(/^- `(x-decisio-[a-z-]+)`: (.+)$/gm)].map((m) => ({ name: m[1], what: plain(m[2]) }));
	if (hdr.length < 4) throw new Error('docs-figures: docs/api.md no longer lists its x-decisio response headers');
	const body = `<div class="fig__cols"><div class="fig__col"><p class="fig__colhead">GET /health</p><ul class="fig__list fig__list--tight">${bullets.map((b, i) => `<li class="f-pop fd-${i}"><div><b>${names[i]}</b><span>${esc(plain(b).slice(0, 150))}${plain(b).length > 150 ? '...' : ''}</span></div></li>`).join('')}</ul></div>
<div class="fig__col"><p class="fig__colhead">Response headers</p><ul class="fig__list fig__list--tight">${hdr.map((h, i) => `<li class="f-pop fd-${i + 2}"><div><b>${esc(h.name)}</b><span>${esc(h.what.slice(0, 150))}${h.what.length > 150 ? '...' : ''}</span></div></li>`).join('')}</ul></div></div>`;
	return panel({
		name: 'health-map', label: 'What to watch', title: '/health says what is being served; the headers say what each request cost.',
		desc: `/health reports ${names.join(', ').toLowerCase()}; each response carries ${hdr.map((h) => h.name).join(', ')}.`,
		body, live: 6, legend: 'Once the engine has died, /health answers 503 with the reason.', source: 'Source: docs/api.md "GET /health" and "Response headers" at the pinned release.',
	});
}

// --- Upgrading ---------------------------------------------------------------------------------------------------------

function upgradePath() {
	const up = text('docs/upgrading.md');
	const items = [...up.matchAll(/^## (\d+\.\d+\.\d+): (.+)$/gm)].map((m) => ({ version: m[1], title: m[2], href: `#${slugify(`${m[1]}: ${m[2]}`)}` }));
	if (items.length < 2) throw new Error('docs-figures: docs/upgrading.md no longer lists its releases');
	const body = `<ol class="fig__timeline">${items.map((it, i) => `<li class="f-pop fd-${i * 2}"><a href="${it.href}"><b>${esc(it.version)}</b><span>${esc(it.title)}</span></a></li>`).join('')}</ol>`;
	return panel({
		name: 'upgrade-path', label: 'Upgrading', title: `${items.length} releases changed what a running deployment serves; newest first.`,
		desc: `Releases that change what a deployment serves: ${items.map((it) => `${it.version}, ${it.title}`).join('; ')}.`,
		body, live: 4, interactive: true, legend: 'The changelog lists every change; this page is for the ones that change what a deployment serves.', source: 'Source: docs/upgrading.md at the pinned release.',
	});
}

// --- Troubleshooting ---------------------------------------------------------------------------------------------------

export const symptoms = [
	{ sees: 'Connection refused right after the start', cause: 'The server is still starting: the first start downloads the checkpoint and warms the engine.', does: 'Wait until `GET /health` answers.', needs: [['docs/running.md', '`/health` answers once it is ready']] },
	{ sees: '422 on a request', cause: 'The request is malformed, or the prompt is longer than the context the server serves (`/health` reports it); the `detail` names what is wrong.', does: 'Read the `detail`; shorten the state or the question and send it again. The server stays up.', needs: [['docs/api.md', 'A malformed request is answered with status 422'], ['docs/api.md', 'is longer than the context']] },
	{ sees: '422 on a request', cause: 'It failed validation, for example a choice with more than 255 options; the `detail` names the problem.', does: 'Fix what the `detail` names, such as cutting the options to 255 or fewer.', needs: [['docs/migrating.md', 'a request with more gets 422'], ['docs/migrating.md', 'A request that fails validation gets 422']] },
	{ sees: '503 on every request, and `/health` answers 503', cause: 'The engine died; the server is about to exit with code 70.', does: 'Let your restart policy bring a new server up; read the reason in the body.', needs: [['docs/api.md', 'answers 503 with `{"ok": false, "engine": "dead"'], ['docs/running.md', 'exits with code 70']] },
	{ sees: 'The server will not start and mentions `VLLM_USE_DEEP_GEMM`', cause: 'The server refuses to start when it is set to anything other than 0.', does: 'Unset it, or pass `--allow-deep-gemm` if you mean it.', needs: [['docs/running.md', 'The server refuses to start when `VLLM_USE_DEEP_GEMM` is set']] },
	{ sees: 'The server refuses a model repository', cause: 'The repository\'s `decision_config.json` differs from the installed profile; the message names the keys and the release it was made for.', does: 'Use the repository revision made for your release, or install that release.', needs: [['docs/running.md', 'refuses to start on a difference']] },
	{ sees: '`WARNING: tasks fitted under another model or rendering are not applied` at the start', cause: 'The tasks were fitted under another model, prompt or yes/no rendering.', does: 'Register them again from their examples, or start with `--prompt-tail compact --noul-rendering words` if they were fitted under the earlier layout.', needs: [['docs/tasks.md', 'tasks fitted under another model or rendering are not applied']] },
	{ sees: 'No `x-decisio-tasks` header on a question you registered', cause: 'The question matched no task: its type, options or order differ from the registration.', does: 'Ask it exactly as registered; renaming, adding or reordering an option makes a different task.', needs: [['docs/tasks.md', 'No header means the question matched no task']] },
	{ sees: 'Answers that differ between runs', cause: 'Repeatability is stated per base: the Qwen base repeats, the Gemma bases can move slightly and near-tied choices can change between sessions.', does: 'Read the determinism notes before treating a difference as a fault.', needs: [['docs/cli.md', 'The Gemma base does not repeat bit for bit']] },
	{ sees: 'The first request after a start is slow', cause: 'It warms the engine; a long state seen for the first time also takes longer on the larger bases.', does: 'Send a few requests first, and raise a client\'s timeout for long states.', needs: [['docs/migrating.md', 'the first request after a start warms the engine']] },
];

function troubleshoot() {
	for (const s of symptoms) for (const [file, needle] of s.needs) if (!text(file).includes(needle)) throw new Error(`docs-figures: ${file} no longer says "${needle}"`);
	const md = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>');
	const body = `<ul class="fig__trouble">${symptoms.map((s, i) => `<li class="f-pop fd-${Math.min(i, 10)}"><b>${md(s.sees)}</b><span>${md(s.cause)}</span><span class="fig__fix">${md(s.does)}</span></li>`).join('')}</ul>`;
	return panel({
		name: 'troubleshoot', label: 'Symptoms', title: 'What you see, why, and what to do: ten things the documentation says.',
		desc: `Symptoms and fixes: ${symptoms.map((s) => s.sees.replace(/`/g, '')).join('; ')}.`,
		body, live: 8, legend: 'Each row is a statement of decisio\'s own documentation; the sections below say more.', source: 'Source: docs/api.md, docs/running.md, docs/tasks.md, docs/cli.md and docs/migrating.md at the pinned release.',
	});
}

export const runItFigures = {
	'gpu-start': gpuStart,
	'docker-flow': dockerFlow,
	'mlx-memory': mlxMemory,
	'ollama-tags': ollamaTags,
	'stand-in': standIn,
	'flag-map': flagMap,
	'serve-lifecycle': serveLifecycle,
	'health-map': healthMap,
	'upgrade-path': upgradePath,
	troubleshoot,
};
