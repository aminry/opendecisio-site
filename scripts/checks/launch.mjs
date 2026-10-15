// The JevBench claims on the built site are the ones launch_facts.public.json allows:
// - the file has its schema and every claim carries a boolean "holds";
// - an element marked data-launch (the board's claim, the chart, the benchmarks section)
//   holds none of the words the file forbids, as whole words;
// - the board's claim on the home page and the benchmarks section's are the launch facts' stable claims, word for word (no rank and
//   no comparison in public, Amin, 2026-10-15; scripts/checks/claims.mjs reads every page for them);
// - the charts served from dist/launch/ are the pinned ones in the site's colours, nothing else changed.
//   node scripts/checks/launch.mjs
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { recolour, sameButColour } from '../charts.mjs';
import { manyQuestions } from '../../src/lib/launch.mjs';
import { parse } from 'node-html-parser';

const facts = JSON.parse(readFileSync('src/data/launch/launch_facts.public.json', 'utf8'));
const problems = [];
const bad = (m) => problems.push(m);
if (facts.schema !== 'launch_facts/1') bad(`launch_facts.public.json has schema ${facts.schema}`);
const claims = facts.claims;
for (const [name, c] of Object.entries(claims)) {
	if (name === 'forbidden_words') continue;
	// Not a claim: the facts' list of wordings that hold for the v1.6.1 file only, each with its own holds_on_v161 and holds_on_live.
	if (name === 'v161_scoped_statements') { for (const st of c.statements ?? []) if (typeof st.holds_on_v161 !== 'boolean') bad(`${name}: ${st.id} has no boolean holds_on_v161`); continue; }
	if (typeof c.holds !== 'boolean') bad(`claim ${name} has no boolean "holds"`);
}
const holds = (n) => claims[n]?.holds === true;
// The file's own list, and the site's (decided 2026-10-09): no margin or nearness to first, and open-weights, never open source, for the ranking.
const forbidden = [...claims.forbidden_words, 'nearly', 'almost', 'close to first', 'open source'];

for (const [page, file] of [['/', 'dist/index.html'], ['/benchmarks/', 'dist/benchmarks/index.html']]) {
	const doc = parse(readFileSync(file, 'utf8'));
	for (const el of doc.querySelectorAll('[data-launch]')) {
		// A quotation from another card (data-quote) is theirs, in their words, and is not scanned.
		const copy = parse(el.toString());
		copy.querySelectorAll('[data-quote]').forEach((q) => q.remove());
		// "top answer" is the model's likeliest option (as in decisio's "no top answer changed"), not a rank: it is the one
		// use of "top" that is not a claim about the board, and is set aside before the words are scanned.
		const text = copy.structuredText.replace(/\s+/g, ' ').replace(/\btop answers?\b/gi, '');
		for (const w of forbidden) {
			if (new RegExp(`(^|[^\\w])${w.replace(/[.*+?^${}()|[\]\\#]/g, '\\$&')}([^\\w]|$)`, 'i').test(text)) bad(`${page}: a launch element uses "${w}", which launch_facts.public.json forbids`);
		}
	}
	const stableText = (id) => (facts.stable_claims?.claims ?? []).find((c) => c.id === id)?.text;
	if (page === '/') {
		// The board, behind "See the board": the composite as the stable claim states it.
		const lead = doc.querySelector('[data-launch="lead"]')?.structuredText.replace(/\s+/g, ' ').trim() ?? '';
		if (!lead.startsWith(stableText('composite_v161') ?? '\u0000')) bad(`/: the board's claim is not stable_claims.composite_v161 as the file states it: "${lead.slice(0, 120)}"`);
	}
	const listed = doc.querySelector('[data-claims]')?.structuredText.replace(/\s+/g, ' ') ?? '';
	if (page === '/benchmarks/') {
		for (const id of ['composite_v161', 'sealed_v161']) if (!listed.includes(stableText(id) ?? '\u0000')) bad(`/benchmarks/: the JevBench section does not list stable_claims.${id} as the file states it`);
	}
}
// "JevBench, axis by axis": the table's cells are the values figures.axes_table prints, row by row, and no others; it starts closed.
{
	const t = facts.figures.axes_table;
	for (const [page, file] of [['/', 'dist/index.html'], ['/benchmarks/', 'dist/benchmarks/index.html']]) {
		const doc = parse(readFileSync(file, 'utf8'));
		const table = doc.querySelector('[data-launch="axes"] table');
		if (!table) { bad(`${page}: no axis-by-axis table`); continue; }
		const wanted = new Map(t.rows.map((r) => [r.label, t.columns.map((c) => r.cells[c.id].printed)]));
		const seen = new Map();
		for (const tr of table.querySelectorAll('tbody tr')) seen.set(tr.querySelector('th')?.structuredText.trim(), [...tr.querySelectorAll('td')].map((td) => td.structuredText.trim()));
		for (const [label, values] of wanted) {
			if (JSON.stringify(seen.get(label)) !== JSON.stringify(values)) bad(`${page}: the axis table's ${label} row is ${JSON.stringify(seen.get(label))}, not the file's ${JSON.stringify(values)}`);
		}
		for (const label of seen.keys()) if (!wanted.has(label)) bad(`${page}: the axis table has a ${label} row that is not in the file`);
		if (doc.querySelector('[data-launch="axes"] details')?.hasAttribute('open')) bad(`${page}: the axis table starts open`);
		// The picture's alt text is the file's: the redrawn picture's (figures.axes_table.public, no rank order).
		const alt = t.public?.alt_text ?? t.alt_text;
		if (!doc.querySelector('[data-launch="jevbench-axes"] img')?.getAttribute('alt')?.startsWith(alt.slice(0, 60))) bad(`${page}: the axes picture's alt text is not the file's`);
	}
	// The hero's heading is the file's tagline, once the file's tagline is one Amin's rule allows (no "Jev-level": a
	// comparison); until the facts change it, the heading is the choice of 2026-10-15 and says no comparison.
	const h1 = parse(readFileSync('dist/index.html', 'utf8')).querySelector('h1')?.structuredText.replace(/\s+/g, ' ').trim();
	const tagline = String(claims.tagline?.allowed_text ?? '');
	if (/Jev-level/i.test(h1 ?? '')) bad(`/: the hero's heading "${h1}" makes a comparison ("Jev-level")`);
	if (claims.tagline?.holds && !/Jev-level/i.test(tagline) && h1 !== tagline.replace(/\.$/, '') && h1 !== tagline) bad(`/: the hero's heading "${h1}" is not claims.tagline`);
}
// "Many questions about one document": the page carries the file's four sentences (figures.same_box_speed), the chart
// for the page (linear on /, log on /benchmarks) with the file's alt text, and the chart files are the recorded ones.
{
	const m = facts.figures.same_box_speed;
	// The sentences the library makes from the file (the speed claim, its ratio and the first question).
	const sentences = manyQuestions('linear').sentences;
	const charts = { '/': ['linear', 'speed_50q_light.svg'], '/benchmarks/': ['log', 'grid_report/many_questions_light.svg'] };
	for (const [page, file] of [['/', 'dist/index.html'], ['/benchmarks/', 'dist/benchmarks/index.html']]) {
		const doc = parse(readFileSync(file, 'utf8'));
		const el = doc.querySelector('[data-launch="many-questions"]');
		if (!el) { bad(`${page}: no many-questions section`); continue; }
		const heading = el.querySelector('h2, h3')?.structuredText.trim();
		if (heading !== 'Many questions about one document') bad(`${page}: the many-questions heading is "${heading}"`);
		const head = [...el.querySelectorAll('p[data-fact]')].map((p) => p.structuredText.trim());
		if (JSON.stringify(head) !== JSON.stringify(sentences)) bad(`${page}: the many-questions sentences are not exactly the ones the file gives`);
		const [kind, key] = charts[page];
		if (el.getAttribute('data-chart') !== kind) bad(`${page}: the many-questions chart is ${el.getAttribute('data-chart')}, not ${kind}`);
		for (const img of el.querySelectorAll('img')) if (img.getAttribute('alt') !== m.charts[key].alt_text) bad(`${page}: a many-questions chart's alt text is not the file's`);
	}
	for (const [key, file] of [['speed_50q_light.svg', 'many-questions-linear.svg'], ['speed_50q_dark.svg', 'many-questions-linear-dark.svg'], ['grid_report/many_questions_light.svg', 'many-questions-log.svg'], ['grid_report/many_questions_dark.svg', 'many-questions-log-dark.svg']]) {
		const sha = createHash('sha256').update(readFileSync(`public/launch/${file}`)).digest('hex');
		if (sha !== m.charts[key].sha256) bad(`public/launch/${file} is not the chart the file records (${key})`);
	}
}
// The charts the pages show are the site's copies in dist/launch/: each is its pinned file in public/launch/ in the
// site's colours, with nothing but colour values changed (scripts/charts.mjs).
for (const f of readdirSync('public/launch').filter((x) => x.endsWith('.svg'))) {
	const src = readFileSync(`public/launch/${f}`, 'utf8');
	const served = readFileSync(`dist/launch/${f}`, 'utf8');
	const chart = f.replace(/(-dark)?\.svg$/, '');
	if (!sameButColour(src, served)) bad(`dist/launch/${f} differs from public/launch/${f} in more than its colours`);
	else if (served !== recolour(src, chart, f.endsWith('-dark.svg') ? 'dark' : 'light')) bad(`dist/launch/${f} is not public/launch/${f} in the site's colours; run the build`);
}
// The facts' v161_scoped_statements hold for the v1.6.1 file only: wherever one of them appears on a page, its sentence says "v1.6.1".
{
	const keys = {
		third_on_intelligence: /\b3rd on intelligence/i,
		within_2_points_on_calibration: /\bwithin 2 points of the highest on calibration/i,
		ninth_on_cost: /\b9th on the board's cost axis/i,
		fourth_of_135: /\bfourth of 135/i,
	};
	const statements = facts.claims.v161_scoped_statements?.statements ?? [];
	for (const st of statements) if (!keys[st.id]) bad(`v161_scoped_statements has ${st.id}, which scripts/checks/launch.mjs has no wording for; add it`);
	for (const [page, file] of [['/', 'dist/index.html'], ['/benchmarks/', 'dist/benchmarks/index.html']]) {
		const text = parse(readFileSync(file, 'utf8')).structuredText.replace(/\s+/g, ' ');
		for (const [id, re] of Object.entries(keys)) {
			for (const m of text.matchAll(new RegExp(re.source, 'gi'))) {
				// The sentence it is in says v1.6.1 (a sentence ends at a full stop and a space; "v1.6.1" has no space after its stops).
				const start = text.lastIndexOf('. ', m.index) + 1;
				const end = text.indexOf('. ', m.index);
				if (!/v1\.6\.1/.test(text.slice(start, end === -1 ? undefined : end))) bad(`${page}: "${m[0]}" (${id}) holds for the v1.6.1 file only and is not in a sentence that says "v1.6.1"`);
			}
		}
	}
	// The axis bullets are the stable claims for the file's axes and sealed set, each starting with its version.
	for (const [page, file] of [['/', 'dist/index.html'], ['/benchmarks/', 'dist/benchmarks/index.html']]) {
		const items = [...parse(readFileSync(file, 'utf8')).querySelectorAll('[data-launch="axes"] .axes__bullets li')].map((li) => li.structuredText.trim());
		for (const id of ['sealed_v161', 'axes_v161']) {
			const want = (facts.stable_claims?.claims ?? []).find((c) => c.id === id)?.text;
			if (!items.includes(want)) bad(`${page}: the axis section does not carry stable_claims.${id} as the file states it`);
		}
		for (const t of items) if (/\d/.test(t) && !t.startsWith('On JevBench v1.6.1, ')) bad(`${page}: an axis bullet with a figure does not start with "On JevBench v1.6.1,": ${t.slice(0, 60)}`);
	}
}
if (problems.length) {
	console.error(`launch: ${problems.length} problems\n  ${problems.join('\n  ')}`);
	process.exit(1);
}
console.log(`launch: the JevBench claims on / and /benchmarks/ are those launch_facts.public.json allows (${Object.entries(claims).filter(([n, c]) => n !== 'forbidden_words' && n !== 'v161_scoped_statements' && c.holds).length} of ${Object.keys(claims).length - 2} hold)`);
