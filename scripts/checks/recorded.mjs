// No page shows a recorded output older than the pinned minor release without saying which release recorded it
// (src/config/recorded-outputs.mjs). A page is found by the output's marker text; it passes if the output is recorded at
// the pinned minor or later, or if its text says "decisio <version>". The pending pages of an output are let through
// while it is recorded again; a pending page that no longer needs it is reported so the list shrinks. A retired recording,
// one recorded again since, may appear on no page at all.
//   node scripts/checks/recorded.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';
import { recordedOutputs, retired } from '../../src/config/recorded-outputs.mjs';
import { pin } from '../../src/lib/upstream.mjs';

const minor = (v) => v.replace(/^v/, '').split('.').slice(0, 2).map(Number);
const older = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
const pinned = minor(pin.tag);
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name === 'index.html' ? [join(d, e.name)] : []));
const pages = walk('dist').map((f) => ({ route: `/${relative('dist', f).replace(/index\.html$/, '')}`, text: parse(readFileSync(f, 'utf8'), { blockTextElements: { script: false, style: false } }).querySelector('body')?.structuredText ?? '' }));
const problems = [];
const notes = [];
for (const o of recordedOutputs) {
	const v = o.version();
	const shown = pages.filter((p) => p.text.includes(o.marker) && !/^\/(articles|news)\//.test(p.route));
	const stale = older(minor(v), pinned);
	const pending = new Set(o.pending?.pages ?? []);
	for (const p of shown) {
		const labelled = new RegExp(`decisio\\s+v?${v.replace(/\./g, '\\.')}\\b`).test(p.text);
		if (!stale || labelled) { if (pending.has(p.route)) notes.push(`${o.name}: ${p.route} no longer needs to be pending`); continue; }
		if (pending.has(p.route)) continue;
		problems.push(`${p.route}: shows ${o.name}, recorded on decisio ${v}, older than the pinned ${pin.tag}, without saying so`);
	}
	if (!stale && pending.size) notes.push(`${o.name}: recorded at ${v}, so its pending list can go`);
	if (stale && pending.size) notes.push(`${o.name}: recorded on decisio ${v}; ${pending.size} pages pending (${o.pending.why})`);
}
for (const r of retired) for (const p of pages) if (p.text.includes(r.marker) && !/^\/(articles|news)\//.test(p.route)) problems.push(`${p.route}: shows ${r.name}, which has been recorded again`);
for (const o of recordedOutputs) notes.push(`${o.name}: decisio ${o.version()}`);
if (problems.length) { console.error(`recorded: ${problems.length} problems\n  ${problems.join('\n  ')}`); process.exit(1); }
for (const n of notes) console.log(`recorded: ${n}`);
console.log(`recorded: ${recordedOutputs.length} recorded outputs; every page showing one is current or says which release recorded it`);
