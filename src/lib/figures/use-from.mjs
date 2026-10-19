// The figures and tables of "Call it from your code" and its neighbours: the routes, the one change that moves an
// existing client, and the five integrations that were checked against a server.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pin, readUpstream, siteRoot } from '../upstream.mjs';
import { esc, panel } from './core.mjs';

const SERVED = 'decisio-gemma-4-31b-it-letters';

/** The one change that moves a System One client: its address, and the name of the served model. */
function oneLineChange() {
	const body = `<div class="fig__diff"><p class="fig__diffhead">What changes in the client</p>
<pre class="fig__code" tabindex="0"><code><span class="d-del f-pop fd-0">- base_url = "https://&lt;the address it sent to before&gt;"</span><span class="d-add f-pop fd-2">+ base_url = "http://127.0.0.1:8000"</span><span class="d-del f-pop fd-3">- model    = "&lt;the name it used before&gt;"</span><span class="d-add f-pop fd-4">+ model    = "${SERVED}"</span></code></pre>
<div class="fig__cols fig__same"><div class="fig__col"><p class="fig__colhead">What stays</p><ul class="fig__tick"><li class="f-pop fd-5">The route, POST /v1/systemone</li><li class="f-pop fd-6">The request's fields</li><li class="f-pop fd-7">The answer's fields</li></ul></div>
<div class="fig__col"><p class="fig__colhead">What to know</p><ul class="fig__tick fig__tick--note"><li class="f-pop fd-5">The model field does not choose a model; the server serves one base</li><li class="f-pop fd-6">There is no authentication; any key is ignored</li><li class="f-pop fd-7">Unknown request fields are ignored, not rejected</li></ul></div></div></div>`;
	return panel({
		name: 'one-line-change', label: 'Moving a client', title: 'An existing client changes where it sends, and the model name; nothing else.',
		desc: `To move a System One client to a decisio server, change its base URL to the server's address and its model to the served name (${SERVED}). The route and the request and answer fields stay.`,
		body, legend: 'The served name is the one GET /v1/models lists for the default base.', source: 'Source: docs/migrating.md of the pinned release.',
	});
}

const vendored = () => JSON.parse(readFileSync(join(siteRoot, 'src/data/integrations.json'), 'utf8'));

/** decisio-examples' integration checks as CI last ran them on the CPU stand-in (scripts/verify-integrations.mjs), at the
 * pinned release: a record from another release, or with a check that did not pass, stops the build. */
export function integrationsRun() {
	const path = join(siteRoot, 'verification/integrations.json');
	const r = JSON.parse(readFileSync(path, 'utf8'));
	if (r.tag !== pin.tag || r.commit !== pin.commit) throw new Error(`docs-figures: verification/integrations.json records ${r.tag}, not the pinned ${pin.tag}; commit the integrations-log artifact of a CI run`);
	const data = vendored();
	if (r.examples?.commit !== data.source.commit) throw new Error('docs-figures: verification/integrations.json ran another decisio-examples commit than src/data/integrations.json names');
	for (const it of data.items) {
		const x = r.items?.[it.id];
		if (!x || x.passed !== x.total || x.total !== it.checks) throw new Error(`docs-figures: verification/integrations.json does not record ${it.name} passing its ${it.checks} checks`);
	}
	return r;
}

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
	const run = integrationsRun();
	const what = (it) => (/\s/.test(it.version) ? it.version : `${it.package} ${it.version}`);
	// Wrapped and labelled as src/lib/rehype-tables.mjs does a Markdown table, so it stacks the same way in a narrow column.
	const heads = ['Framework, as checked', 'Base URL', 'Timeout and retries'];
	const cells = (it) => [`<b>${esc(it.name)}</b><br><span class="integrations__ver">${esc(what(it))}; ${it.checks} of ${it.checks} checks passed</span>`, `<code>http://127.0.0.1:8000${it.v1 ? '/v1' : ''}</code>`, esc(it.timeout)];
	const rows = data.items.map((it) => `<tr>${cells(it).map((c, i) => `<td data-label="${heads[i]}">${c}</td>`).join('')}</tr>`).join('');
	return `<div class="table-wrap"><table class="integrations docs-table">
<thead><tr>${heads.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${rows}</tbody>
</table></div>
<p class="table-note">Checked on the CPU stand-in of decisio ${run.tag.replace(/^v/, '')} on ${run.date} (decisio-examples at <code>${run.examples.commit.slice(0, 7)}</code>), and against Gemma 4 31B on decisio ${checked[1]}, ${checked[2]}. The stand-in's answers are not the default model's: the checks test the paths, fields, parsing and errors. The programs below ran on the stand-in on ${programs[1]}.</p>`;
}
