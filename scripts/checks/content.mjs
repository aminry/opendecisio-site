// Checks the built site (dist/) against docs/CONTENT_RULES.md, the rules a
// script can check. Exits non-zero with every violation listed.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';
import { forbiddenClip, hostedClip } from '../../src/config/media-policy.mjs';
import { readUpstream } from '../../src/lib/upstream.mjs';
import { figures as figuresIn } from '../../src/lib/figures.mjs';
import { analytics, independence, site } from '../../src/config/site.ts';

const dist = 'dist';
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []));
const pages = walk(dist);
const problems = [];
const report = (page, message) => problems.push(`${page}: ${message}`);

// The site's own pages, composed here rather than included from decisio:
// each figure on them appears once.
const composed = new Set(['/', '/benchmarks/', '/demos/', '/demos/teach-and-certify/']);
const allow = JSON.parse(readFileSync('scripts/checks/figures-allow.json', 'utf8')).allow;
const allowed = (route, figure) => allow.some((a) => a.page === route && a.figure === figure);
const DI_SCORES = /\b(48\.06|49\.43|57\.58)\b/;
// Once the pinned release's evaluation card records the self-runs, the scores may appear, stated as such.
const cardRecordsSelfRuns = /Decision Index's whole suite, self-run/.test(readUpstream('EVAL_CARD.md'));

for (const file of pages) {
	const route = '/' + relative(dist, file).replace(/index\.html$/, '').replace(/\.html$/, '/');
	const html = readFileSync(file, 'utf8');
	const doc = parse(html);
	if (route === '/404/') continue;

	if (html.includes('\u2014')) report(route, 'contains an em dash');
	// A value rendered as text by mistake.
	// ("a NaN" and "NaN or infinity" are words in prose, as decisio's docs use them for a model output that is not a number.)
	const mainText = (doc.querySelector('main')?.textContent ?? '').replace(/\b[Aa] NaN\b|\bNaN or infinity\b/g, '');
	for (const junk of ['[object Object]', 'undefined', 'NaN']) {
		if (new RegExp(`(^|[^\\w])${junk.replace(/[[\]]/g, '\\$&')}([^\\w]|$)`).test(mainText)) report(route, `shows "${junk}" where a value belongs`);
	}

	const text = doc.querySelector('body')?.structuredText.replace(/\s+/g, ' ') ?? '';
	// A number as the page shows it is rounded: a value at full precision (a threshold of 0.9863366761679004) belongs in the
	// data, not in a label. Code blocks show values as decisio returns them and are not read.
	{
		const shown = parse(html, { blockTextElements: { script: false, style: false } });
		shown.querySelectorAll('pre, code, script, style').forEach((n) => n.remove());
		for (const m of (shown.querySelector('body')?.structuredText ?? '').matchAll(/(?<![\w.#-])\d+\.\d{5,}(?![\w-])/g)) report(route, `shows ${m[0]} unrounded; round it for display and keep the full value in the data`);
	}
	if (!text.includes(independence)) report(route, 'lacks the independence statement');
	if (/waitlist|api-access|sign up|\bour hosted|hosted demo/i.test(text)) report(route, 'offers a hosted service; the site is the home of the open-source project only');
	if (DI_SCORES.test(text) && !cardRecordsSelfRuns) report(route, 'shows a Decision Index composite score, which no release records yet');
	// The release's own Decision Index 0.2.1 runs are self-runs; the rows the board lists are another run, so a page
	// that shows the former says what they are.
	if (DI_SCORES.test(text) && cardRecordsSelfRuns && !/self-run|our own run/.test(text)) report(route, 'shows a Decision Index 0.2.1 score without saying it is our own run');

	// JevBench counts: "on JevBench's 231 published questions" (a Markdown page renders its apostrophe curly).
	for (const m of text.matchAll(/.{0,40}\b231\b.{0,40}/g)) {
		if (/JevBench/.test(m[0]) && !/JevBench['’]s 231 published questions/.test(m[0])) report(route, `JevBench count not in the required wording: "${m[0].trim()}"`);
	}

	// Media: no hosted player's clip embedded, no Gemini clip anywhere.
	for (const el of doc.querySelectorAll('video, source, img, a')) {
		for (const attr of ['src', 'data-src', 'poster', 'href']) {
			const v = el.getAttribute(attr);
			if (!v) continue;
			if (forbiddenClip.test(v) && /\.(mp4|gif|webm|webp)/.test(v)) report(route, `links or embeds a Gemini clip: ${v}`);
			if (el.tagName !== 'A' && hostedClip.test(v)) report(route, `embeds a hosted player's clip: ${v}`);
		}
	}

	// No third-party resources: everything loaded comes from the site, except the analytics beacon, which is the one script
	// named in src/config/site.ts (scripts/checks/analytics.mjs checks that it is one per page and allowed alone).
	for (const el of doc.querySelectorAll('script[src], link[href], img[src], video[src], video[data-src], source[src], iframe')) {
		const rel = el.getAttribute('rel') ?? '';
		if (el.tagName === 'LINK' && !/stylesheet|preload|modulepreload|icon|manifest/.test(rel)) continue;
		const v = el.getAttribute('src') ?? el.getAttribute('data-src') ?? el.getAttribute('href') ?? '';
		if (v === `${analytics.script}/beacon.min.js` && analytics.token) continue;
		if (/^(https?:)?\/\//.test(v) && !v.startsWith(site.url)) report(route, `loads a third-party resource: ${v}`);
	}

	// Every page: a canonical URL, a description, Open Graph.
	if (!doc.querySelector('link[rel="canonical"]')) report(route, 'has no canonical URL');
	if (!doc.querySelector('meta[name="description"]')) report(route, 'has no description');
	if (!doc.querySelector('meta[property="og:title"]')) report(route, 'has no Open Graph title');

	// Each figure once, on the site's own pages. SVG text (axis ticks) and code are not figures.
	// Cells of one table are distinct measurements, so equal values there are not repeats;
	// a figure in prose may not appear again in prose or in a table.
	if (composed.has(route)) {
		const main = parse(doc.querySelector('main')?.toString() ?? '');
		main.querySelectorAll('svg, pre, script, style, video').forEach((n) => n.remove());
		const figures = (t) => figuresIn(t);
		// A table's notes ([data-table-notes]) explain its cells, and its key cells shown as tiles ([data-table-keys]: a
		// demo card's numbers above its table, the benchmarks page's dated tiles above the boards' tables), so both count
		// as part of it.
		const inTables = new Set(main.querySelectorAll('td, th, [data-table-notes] p, [data-table-keys] li').flatMap((c) => figures(c.structuredText)));
		main.querySelectorAll('table, [data-table-notes], [data-table-keys]').forEach((n) => n.remove());
		// A block (a paragraph, a list item, a heading) may list equal values for different players;
		// across blocks, a figure appears once.
		const seen = new Map();
		// A block that holds other blocks (a step's list item around its notes) counts its own text only;
		// the blocks inside it count themselves.
		const BLOCKS = 'p, li, h1, h2, h3, figcaption, dd, dt';
		const ownText = (b) => {
			if (!b.querySelector(BLOCKS)) return b.structuredText;
			const copy = parse(b.toString()).firstChild;
			copy.querySelectorAll(BLOCKS).forEach((inner) => inner.remove());
			return copy.structuredText;
		};
		const blocks = main.querySelectorAll(BLOCKS).map((b) => ({ structuredText: ownText(b) }));
		for (const block of blocks) for (const f of new Set(figures(block.structuredText))) seen.set(f, (seen.get(f) ?? 0) + 1);
		for (const [figure, n] of seen) {
			if (allowed(route, figure)) continue;
			if (n > 1) report(route, `the figure ${figure} appears in ${n} places`);
			if (inTables.has(figure)) report(route, `the figure ${figure} appears in a table and again outside it`);
		}
	}
}

if (problems.length) {
	console.error(problems.map((p) => `content: ${p}`).join('\n'));
	console.error(`content: ${problems.length} problems on ${pages.length} pages`);
	process.exit(1);
}
console.log(`content: ${pages.length} pages pass`);
