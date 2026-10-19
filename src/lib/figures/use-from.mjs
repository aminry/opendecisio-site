// The figures and tables of "Call it from your code" and its neighbours: the routes, the one change that moves an
// existing client, and the five integrations that were checked against a server.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readUpstream, siteRoot } from '../upstream.mjs';
import { slugify } from '../upstream-map.mjs';
import { esc, panel } from './core.mjs';

const SERVED = 'decisio-gemma-4-31b-it-letters';

/** The routes of the HTTP API, read from the table of docs/api.md at the pinned release, each linked to its section. */
function routes() {
	const api = readUpstream('docs/api.md');
	const table = /^\| Route \| What it does \|\n\| --- \| --- \|\n((?:\|.*\n)+)/m.exec(api)?.[1] ?? '';
	const rows = [...table.matchAll(/^\| (`[^|]+`) \| ([^|]+) \|$/gm)].map((m) => ({ routes: [...m[1].matchAll(/`([A-Z]+) ([^`]+)`/g)].map((r) => ({ method: r[1], path: r[2] })), what: m[2].trim() }));
	if (rows.length < 6) throw new Error('docs-figures: docs/api.md no longer has its table of routes');
	// The count is of routes, not of the table's rows: a row can hold several (GET and DELETE of one path).
	const count = rows.reduce((n, r) => n + r.routes.length, 0);
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
		name: 'routes', label: 'The routes', title: `${count} routes: one asks questions, the rest teach, list and report.`,
		desc: `The server's routes: ${rows.map((r) => `${r.routes.map((x) => `${x.method} ${x.path}`).join(', ')} ${r.what}`).join('; ')}.`,
		body, live: 5, interactive: true, legend: 'Each route links to its section of the reference below.', source: 'Source: the table of docs/api.md at the pinned release.',
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

export const useFromFigures = {
	routes,
	'one-line-change': oneLineChange,
};

/** The five integrations as one table: what was checked, how many checks passed, the base URL and the timeout, with the
 * dates of the checks (the README's "Works with") and of the programs (docs/integrations.md). */
export function integrationsTable() {
	const data = integrations();
	const readme = readUpstream('README.md');
	const checked = /checked against a running decisio server \(Gemma 4 31B, decisio (\d+\.\d+\.\d+), [^)]*?(\d{4}-\d{2}-\d{2})\)/.exec(readme);
	if (!checked) throw new Error('docs-figures: the README\'s Works with no longer says which release and date the integrations were checked on');
	const programs = /with the package versions named, on (\d{4}-\d{2}-\d{2})/.exec(readUpstream('docs/integrations.md'));
	if (!programs) throw new Error('docs-figures: docs/integrations.md no longer says when its programs ran');
	const what = (it) => (/\s/.test(it.version) ? it.version : `${it.package} ${it.version}`);
	// Wrapped and labelled as src/lib/rehype-tables.mjs does a Markdown table, so it stacks the same way in a narrow column.
	const heads = ['Framework, as checked', 'Base URL', 'Timeout and retries'];
	const cells = (it) => [`<b>${esc(it.name)}</b><br><span class="integrations__ver">${esc(what(it))}; ${it.checks} of ${it.checks} checks passed</span>`, `<code>http://127.0.0.1:8000${it.v1 ? '/v1' : ''}</code>`, esc(it.timeout)];
	const rows = data.items.map((it) => `<tr>${cells(it).map((c, i) => `<td data-label="${heads[i]}">${c}</td>`).join('')}</tr>`).join('');
	return `<div class="table-wrap"><table class="integrations docs-table">
<thead><tr>${heads.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${rows}</tbody>
</table></div>
<p class="table-note">Checked against Gemma 4 31B on decisio ${checked[1]}, ${checked[2]}. The programs below ran on decisio's CPU stand-in on ${programs[1]}.</p>`;
}
