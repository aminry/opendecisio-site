// The figures of "Run it": the flag groups, the server's life, what /health reports, the upgrade path and the common
// symptoms (the deploy guides' figures are in deploy.mjs). Each reads the
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

/** Steps in a row: each { title, note }, the last one lit. */
function steps(list) {
	return `<ol class="fig__steps">${list.map((s, i) => `<li class="fig__step${i === list.length - 1 && !s.plain ? ' fig__step--on' : ''} f-pop fd-${Math.min(10, i * 2)}"><b>${esc(s.title)}</b><span>${s.note}</span></li>`).join('')}</ol>`;
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
	'flag-map': flagMap,
	'serve-lifecycle': serveLifecycle,
	'health-map': healthMap,
	'upgrade-path': upgradePath,
	troubleshoot,
};
