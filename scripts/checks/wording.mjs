// Wording the facts allow only in one place. "20 to 43 ms" is the per-question latency on a document already read for
// the three bases together (figures.latency_on_read_document); the 31B's own range is 31.7 to 43.3 ms. So a sentence
// that says "20 to 43 ms" must not name the 31B, and one that names the 31B must not say "20 to 43". And the home
// page never says fine-tune: teaching a task leaves the model's weights as they are.
//   node scripts/checks/wording.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []));
const problems = [];
for (const file of walk('dist')) {
	const route = `/${relative('dist', file).replace(/index\.html$/, '')}`;
	const doc = parse(readFileSync(file, 'utf8'), { blockTextElements: { script: false, style: false } });
	// Text and the descriptions and titles of SVG diagrams, by sentence.
	const text = [doc.structuredText, ...doc.querySelectorAll('svg title, svg desc, svg text').map((n) => n.text)].join('\n').replace(/\s+/g, ' ');
	for (const sentence of text.split(/(?<=[.!?])\s+/)) {
		if (/\b20 to 43\b/.test(sentence) && /\b31B\b/.test(sentence)) problems.push(`${route}: "${sentence.trim().slice(0, 140)}" says 20 to 43 beside the 31B; the 31B's own range is 31.7 to 43.3 ms (32 to 43)`);
	}
	// Teaching a task is not fine-tuning, and the home page never calls it that (decided 2026-10-15): the model's weights
	// never change. Other pages may name fine-tuned systems (another entry on the board), so the rule is the home page's.
	if (route === '/' && /fine[- ]?tun/i.test(text)) problems.push(`/: "${(text.match(/.{0,60}fine[- ]?tun.{0,60}/i) ?? [''])[0].trim()}": the home page does not say fine-tune; teaching a task leaves the model as it is`);
	// Who ranks above Decisio on the live board changes as rows arrive (2026-10-15: a third row now does), so no
	// page names the systems ranked above it; a sentence compares scores instead ("score higher than Decisio 31B").
	for (const sentence of text.split(/(?<=[.!?])\s+/)) {
		if (/\branked above (Decisio|decisio|ours)\b|\bsystems ranked above\b/.test(sentence)) problems.push(`${route}: "${sentence.trim().slice(0, 140)}" names who ranks above Decisio; compare the scores instead, in the facts' stable wording`);
	}
	// The diagram texts are separate lines, not sentences: a scene that names the 31B and gives the range in its own text.
	for (const svg of doc.querySelectorAll('svg')) {
		const t = svg.structuredText.replace(/\s+/g, ' ');
		if (/\b31B\b/.test(t) && /\b20 to 43\b/.test(t)) problems.push(`${route}: a diagram names the 31B and says 20 to 43`);
	}
}
if (problems.length) {
	console.error(`wording: ${problems.length} problems\n  ${[...new Set(problems)].join('\n  ')}`);
	process.exit(1);
}
console.log('wording: no "20 to 43" beside the 31B, no "fine-tune" on the home page, and no page names who ranks above Decisio');
