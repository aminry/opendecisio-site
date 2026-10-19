// Every page that shows a recorded output (src/config/recorded-outputs.mjs) follows scripts/checks/recorded-rule.mjs: an
// output recorded before the pinned minor stays only if the page labels it with its release, card and date, and every
// release since was read and left what it shows unchanged. A page is found by the output's marker text (and its alsoShows
// text, when the marker is an input a page may send without showing the output). A retired recording, one recorded again
// since, may appear on no page at all.
//   node scripts/checks/recorded.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';
import { recordedOutputs, retired } from '../../src/config/recorded-outputs.mjs';
import { pin } from '../../src/lib/upstream.mjs';
import { judge } from './recorded-rule.mjs';

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name === 'index.html' ? [join(d, e.name)] : []));
const pages = walk('dist').map((f) => ({ route: `/${relative('dist', f).replace(/index\.html$/, '')}`, text: parse(readFileSync(f, 'utf8'), { blockTextElements: { script: false, style: false } }).querySelector('body')?.structuredText ?? '' }));
const problems = [];
const notes = [];
for (const o of recordedOutputs) {
	// A page shows the output when it has the marker and, if the output names one, what only the output shows.
	const also = o.alsoShows?.();
	const shown = pages.filter((p) => p.text.includes(o.marker) && (!also || p.text.includes(also)) && !/^\/(articles|news)\//.test(p.route));
	const r = judge({ name: o.name, version: o.version(), card: o.card(), date: o.date(), reviews: o.reviews }, pin.tag, shown);
	problems.push(...r.problems);
	notes.push(...r.notes, `${o.name}: on ${shown.length} pages (${shown.map((p) => p.route).join(', ')})`);
}
for (const r of retired) for (const p of pages) if (p.text.includes(r.marker) && !/^\/(articles|news)\//.test(p.route)) problems.push(`${p.route}: shows ${r.name}, which has been recorded again`);
if (problems.length) { console.error(`recorded: ${problems.length} problems\n  ${problems.join('\n  ')}`); process.exit(1); }
for (const n of notes) console.log(`recorded: ${n}`);
console.log(`recorded: ${recordedOutputs.length} recorded outputs; every page showing one is current, or labels its release, card and date and no release since changed what it shows`);
