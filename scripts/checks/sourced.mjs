// Every fact the site writes in its own words about decisio still stands (src/config/sourced.mjs): the page says it,
// and decisio's file at the pinned release still holds the sentence it rests on. Text is compared with its white
// space collapsed and plain quotes, every tag read as a space, so a table row reads as its cells in order.
//   node scripts/checks/sourced.mjs
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { sourced } from '../../src/config/sourced.mjs';
import { pin, readUpstream } from '../../src/lib/upstream.mjs';

const flat = (t) => t.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, ' ').trim();
// A page's main text, each tag a space; its entities decoded by the parser's text of the result.
// A space a tag left before a comma or a stop, or inside brackets, is dropped, so "`--a`, `--b`" reads "--a, --b".
const mainText = (html) => parse(parse(html, { blockTextElements: { script: false, style: false } }).querySelector('main')?.innerHTML.replace(/<[^>]+>/g, ' ') ?? '').text
	.replace(/\s+([,.;:)])/g, '$1').replace(/\(\s+/g, '(');
const pages = new Map();
const pageText = (route) => {
	if (!pages.has(route)) {
		const file = join('dist', route, 'index.html');
		pages.set(route, existsSync(file) ? flat(mainText(readFileSync(file, 'utf8'))) : null);
	}
	return pages.get(route);
};
const problems = [];
for (const f of sourced) {
	const text = pageText(f.page);
	if (text === null) problems.push(`${f.page}: not built`);
	else if (!text.includes(flat(f.says))) problems.push(`${f.page}: no longer says "${f.says}"; drop it from src/config/sourced.mjs or say it again`);
	if (!flat(readUpstream(f.file)).includes(flat(f.source))) problems.push(`${f.page}: says "${f.says}", but ${f.file} at ${pin.tag} no longer says "${f.source}"`);
}
if (problems.length) { console.error(`sourced: ${problems.length} problems\n  ${problems.join('\n  ')}`); process.exit(1); }
console.log(`sourced: ${sourced.length} facts on ${new Set(sourced.map((f) => f.page)).size} pages, each still in decisio's docs at ${pin.tag}`);
