// The figures of "Use it from": the ways in, the routes, a client's round trip in Python and in JavaScript, the one
// change that moves an existing client, and the five integrations that were checked against a server.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readUpstream, siteRoot } from '../upstream.mjs';
import { slugify } from '../upstream-map.mjs';
import { barLabel, esc, p2, panel, recorded, sourceLine, topBar } from './core.mjs';

const SERVED = 'decisio-gemma-4-31b-it-letters';

/** The five ways in, each a link to its page; all of them send the same JSON to the same route. */
function waysIn() {
	const ways = [
		{ name: 'HTTP', note: 'curl, or any language that can POST JSON', href: '/docs/api/' },
		{ name: 'Python', note: 'the standard library, or TypeSafe\'s SDK', href: '/docs/use-from/python/' },
		{ name: 'JavaScript and TypeScript', note: 'Node\'s fetch, no package', href: '/docs/use-from/javascript/' },
		{ name: 'A System One client you already have', note: 'change the address it sends to', href: '/docs/migrating/' },
		{ name: 'A framework', note: 'LangChain, Vercel AI SDK, n8n, TanStack AI, Pipecat', href: '/docs/use-from/frameworks/' },
	];
	const body = `<div class="fig__ways"><ul class="fig__list">${ways.map((w, i) => `<li class="f-pop fd-${i}"><a href="${w.href}"><b>${esc(w.name)}</b><span>${esc(w.note)}</span></a></li>`).join('')}</ul>
<div class="fig__sink f-pop fd-5"><span class="fig__bracket" aria-hidden="true"></span><div class="fig__route"><b>POST /v1/systemone</b><span>the same JSON body from every one of them</span></div><div class="fig__server"><b>Decisio server</b><span>http://127.0.0.1:8000 unless --host and --port say otherwise</span></div></div></div>`;
	return panel({
		name: 'ways-in', label: 'Ways in', title: 'Five ways in, one route: every client sends the same JSON.',
		desc: `${ways.map((w) => `${w.name}: ${w.note}`).join('; ')}. All five send the same JSON body to POST /v1/systemone on the server.`,
		body, live: 5, interactive: true, legend: 'Each is a link to its page.', source: 'Source: docs/api.md and docs/migrating.md of the pinned release.',
	});
}

/** The routes of the HTTP API, read from the table of docs/api.md at the pinned release, each linked to its section. */
function routes() {
	const api = readUpstream('docs/api.md');
	const table = /^\| Route \| What it does \|\n\| --- \| --- \|\n((?:\|.*\n)+)/m.exec(api)?.[1] ?? '';
	const rows = [...table.matchAll(/^\| (`[^|]+`) \| ([^|]+) \|$/gm)].map((m) => ({ routes: [...m[1].matchAll(/`([A-Z]+) ([^`]+)`/g)].map((r) => ({ method: r[1], path: r[2] })), what: m[2].trim() }));
	if (rows.length < 6) throw new Error('docs-figures: docs/api.md no longer has its table of routes');
	const heads = [...api.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
	const anchor = (first) => {
		const text = `${first.method} ${first.path}`;
		const h = heads.find((x) => x.replace(/`/g, '') === text) ?? heads.find((x) => x.replace(/`/g, '') === (/\/v1\/tasks/.test(text) ? 'Tasks' : /abstention/.test(text) ? 'Abstention' : '\u0000'));
		return h ? `#${slugify(h)}` : undefined;
	};
	const body = `<ul class="fig__routes">${rows.map((r, i) => {
		const a = anchor(r.routes[0]);
		const inner = `<span class="fig__verbs">${r.routes.map((x) => `<code><b>${esc(x.method)}</b> ${esc(x.path)}</code>`).join('')}</span><span class="fig__what">${esc(r.what)}</span>`;
		return `<li class="f-pop fd-${Math.min(i, 9)}">${a ? `<a href="${a}">${inner}</a>` : `<div>${inner}</div>`}</li>`;
	}).join('')}</ul>`;
	return panel({
		name: 'routes', label: 'The routes', title: `${rows.length} routes: one asks questions, the rest teach, list and report.`,
		desc: `The server's routes: ${rows.map((r) => `${r.routes.map((x) => `${x.method} ${x.path}`).join(', ')} ${r.what}`).join('; ')}.`,
		body, live: 5, interactive: true, legend: 'Each route links to its section of the reference below.', source: 'Source: the table of docs/api.md at the pinned release.',
	});
}

const wrap = (text, n) => {
	const lines = [];
	let line = '';
	for (const w of text.split(' ')) {
		if ((`${line} ${w}`).trim().length > n) { lines.push(line); line = w; } else line = `${line} ${w}`.trim();
	}
	return [...lines, line].filter(Boolean);
};

/** A client's round trip: three lines of code, the request, the answer and what it prints; the same shape in each language. */
function clientRoundTrip(lang) {
	const r = recorded();
	const it = r.items[0];
	const code = lang === 'python'
		? ['request = Request(url, data=body)', 'with urlopen(request) as r:', '    answers = json.load(r)["answers"]']
		: ['const r = await fetch(url, {', '  method: "POST", body });', 'const { answers } = await r.json();'];
	const printed = it.questions.map((q) => `${q.name} ${q.type === 'yes/no' ? p2(q.bars[0].p) : `${q.type === 'score' ? topBar(q).label : barLabel(q)} ${p2(topBar(q).p)}`}`);
	const text = wrap(it.state, 28);
	const body = `<svg class="fig__svg" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<rect class="f-node fd-0" x="8" y="20" width="290" height="124" rx="12"/>
<text class="ft ft-k" x="22" y="44">Your ${lang === 'python' ? 'Python' : 'JavaScript'}</text>
${code.map((l, i) => `<text class="ft ft-s ft-code f-pop fd-1" x="22" y="${70 + i * 24}">${esc(l)}</text>`).join('')}
<path class="f-line fd-2" d="M298 62L378 62" pathLength="1"/>
<text class="ft ft-d f-pop fd-2" x="338" y="52" text-anchor="middle">POST</text>
<rect class="f-node f-node--on fd-3" x="378" y="20" width="334" height="124" rx="12"/>
<text class="ft ft-k" x="392" y="44">Decisio, on 127.0.0.1:8000</text>
${text.slice(0, 3).map((l, i) => `<text class="ft ft-s f-pop fd-3" x="392" y="${70 + i * 20}">${esc(l)}${i === 2 && text.length > 3 ? '...' : ''}</text>`).join('')}
<text class="ft ft-n f-pop fd-4" x="392" y="134">${it.serverMs.toFixed(1)} ms</text>
<path class="f-line fd-5" d="M378 170L298 170" pathLength="1"/>
<text class="ft ft-d f-pop fd-5" x="338" y="190" text-anchor="middle">answers</text>
<rect class="f-node fd-6" x="8" y="156" width="290" height="124" rx="12"/>
<text class="ft ft-k" x="22" y="180">It prints</text>
${printed.map((l, i) => `<text class="ft ft-n f-pop fd-${6 + i}" x="22" y="${208 + i * 24}">${esc(l)}</text>`).join('')}
<text class="ft ft-d" x="392" y="230">An answer per question, by name:</text>
<text class="ft ft-s" x="392" y="254">noul (a probability) or</text>
<text class="ft ft-s" x="392" y="274">probabilities for each option</text>
</svg>`;
	return panel({
		name: `client-${lang}`, label: lang === 'python' ? 'A Python client' : 'A JavaScript client', title: 'One POST out, one JSON answer back; the rest is reading it.',
		desc: `A ${lang === 'python' ? 'Python' : 'JavaScript'} script posts the recorded support ticket to the server and prints the likeliest option of each question: ${printed.join('; ')}.`,
		body, live: 7, legend: 'The numbers are the recorded decision\'s; a server on another base answers with its own.', source: sourceLine(r),
	});
}

/** The one change that moves a System One client: its address, and the name of the served model. */
function oneLineChange() {
	const body = `<div class="fig__diff"><p class="fig__diffhead">What changes in the client</p>
<pre class="fig__code" tabindex="0"><code><span class="d-del f-pop fd-0">- base_url = "https://&lt;the address it sent to before&gt;"</span><span class="d-add f-pop fd-2">+ base_url = "http://127.0.0.1:8000"</span><span class="d-del f-pop fd-3">- model    = "&lt;the name it used before&gt;"</span><span class="d-add f-pop fd-4">+ model    = "${SERVED}"</span></code></pre>
<div class="fig__cols fig__same"><div class="fig__col"><p class="fig__colhead">What stays</p><ul class="fig__tick"><li class="f-pop fd-5">The route, POST /v1/systemone</li><li class="f-pop fd-6">The request's fields</li><li class="f-pop fd-7">The answer's fields</li></ul></div>
<div class="fig__col"><p class="fig__colhead">What to know</p><ul class="fig__tick fig__tick--note"><li class="f-pop fd-5">The model field does not choose a model; the server serves one base</li><li class="f-pop fd-6">There is no authentication; any key is ignored</li><li class="f-pop fd-7">Unknown request fields are ignored, not rejected</li></ul></div></div></div>`;
	return panel({
		name: 'one-line-change', label: 'Moving a client', title: 'An existing client changes where it sends, and the model name; nothing else.',
		desc: `To move a System One client to a decisio server, change its base URL to the server's address and its model to the served name (${SERVED}). The route and the request and answer fields stay.`,
		body, live: 5, legend: 'The served name is the one GET /v1/models lists for the default base.', source: 'Source: docs/migrating.md of the pinned release.',
	});
}

const vendored = () => JSON.parse(readFileSync(join(siteRoot, 'src/data/integrations.json'), 'utf8'));

/** The five integrations checked against a server: version, checks passed, and the one thing to set. Compared with the README's table. */
export function integrations() {
	const data = vendored();
	const readme = readUpstream('README.md');
	const table = readme.slice(readme.indexOf('## Works with'));
	for (const it of data.items) {
		const row = table.split('\n').find((l) => l.startsWith(`| ${it.readmeName} |`));
		const counts = row && /\| (\d+) of (\d+) \|$/.exec(row);
		if (!counts || Number(counts[1]) !== it.checks || Number(counts[2]) !== it.checks) throw new Error(`docs-figures: the README's Works with table no longer says ${it.name} passed ${it.checks} of ${it.checks}`);
		for (const part of it.version.split(', ')) if (!row.includes(part.replace(/^(\S+) (\S+)$/, '$2')) ) throw new Error(`docs-figures: the README's Works with row for ${it.name} no longer names ${part}`);
	}
	return data;
}

function integrationsFigure() {
	const data = integrations();
	const body = `<ul class="fig__cards">${data.items.map((it, i) => `<li class="fig__card f-pop fd-${i}"><b>${esc(it.name)}</b><span class="fig__ver">${esc(it.version)}</span><span class="fig__checks"><i class="fig__tickmark" aria-hidden="true"></i>${it.checks} of ${it.checks} checks passed</span><span class="fig__rule">${it.v1 ? 'base URL ends in <code>/v1</code>' : 'base URL has <b>no</b> <code>/v1</code>'}</span></li>`).join('')}</ul>`;
	return panel({
		name: 'integrations', label: 'Frameworks', title: 'Five integrations, each checked against a running server.',
		desc: `Five third-party integrations were checked against a decisio server: ${data.items.map((it) => `${it.name} (${it.version}), ${it.checks} of ${it.checks} checks passed, base URL ${it.v1 ? 'ends in /v1' : 'has no /v1'}`).join('; ')}.`,
		body, live: 5, legend: 'They are plumbing checks of the wire format, not of accuracy.', source: 'Source: the README\'s "Works with" table, and each integration\'s README in decisio-examples.',
	});
}

export const useFromFigures = {
	'ways-in': waysIn,
	routes,
	'client-python': () => clientRoundTrip('python'),
	'client-js': () => clientRoundTrip('js'),
	'one-line-change': oneLineChange,
	integrations: integrationsFigure,
};

/** One integration's section: what was checked, what to set (a list), its snippet as a code block, and what the check found. */
export function integrationParts(id) {
	const data = integrations();
	const it = data.items.find((x) => x.id === id);
	if (!it) throw new Error(`docs-figures: no integration "${id}"`);
	const file = data.source.files[id];
	const folder = `https://github.com/${data.source.repository}/tree/${data.source.commit}/${file.path.replace(/\/README\.md$/, '')}`;
	const before = `<p>${esc(it.language)}; <code>${esc(it.package)}</code>, ${esc(it.version)}: ${it.checks} of ${it.checks} checks passed against a running server (<a href="${folder}">the check and its record</a>). It uses ${esc(it.entry)}.</p>
<dl class="integ">
<dt>Base URL</dt><dd>${esc(it.baseUrl)}</dd>
<dt>API key</dt><dd>${esc(it.key)}</dd>
<dt>If the server answers 422</dt><dd>${esc(it.on422)}</dd>
<dt>Timeout and retries</dt><dd>${esc(it.timeout)}</dd>
</dl>`;
	const after = `<p>${esc(it.findings)}</p>`;
	return { before, snippet: it.snippet, after };
}
