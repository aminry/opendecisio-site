// Checks the built articles and news (dist/articles, dist/news) against docs/POSTS.md:
// - each post page has one h1, a canonical link to itself, and Article JSON-LD, and is in the sitemap;
// - a piece first published elsewhere (it has `canonical`) has no page: its card on the index links to the original, its
//   note on the card is plain text and links, and its feed item links to the original;
// - the feeds list every post, with absolute URLs;
// - the launch rules hold in a post: none of the facts file's forbidden words outside a quotation, and the wordings that hold
//   for the v1.6.1 file only say v1.6.1;
// - no em dash.
//   node scripts/checks/posts.mjs
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { site } from '../../src/config/site.ts';

const facts = JSON.parse(readFileSync('src/data/launch/launch_facts.public.json', 'utf8'));
const forbidden = [...facts.claims.forbidden_words, 'nearly', 'almost', 'close to first'];
const scoped = [/\b3rd on intelligence/i, /\bwithin 2 points of the highest on calibration/i, /\b9th on the board's cost axis/i, /\bfourth of 135/i];
const problems = [];
const bad = (m) => problems.push(m);
const front = (file) => Object.fromEntries([...readFileSync(file, 'utf8').matchAll(/^([a-zA-Z]+):\s*(.*)$/gm)].map((m) => [m[1], m[2].trim()]));
let count = 0;
const sitemap = existsSync('dist/sitemap-0.xml') ? readFileSync('dist/sitemap-0.xml', 'utf8') : '';

for (const kind of ['articles', 'news']) {
	const dir = `src/content/${kind}`;
	const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')) : [];
	const feed = existsSync(`dist/${kind}/rss.xml`) ? readFileSync(`dist/${kind}/rss.xml`, 'utf8') : '';
	if (!feed) bad(`/${kind}/rss.xml is missing`);
	if (!existsSync(`dist/${kind}/index.html`)) bad(`/${kind}/ is missing`);
	const index = existsSync(`dist/${kind}/index.html`) ? readFileSync(`dist/${kind}/index.html`, 'utf8') : '';
	for (const f of files) {
		const id = f.replace(/\.md$/, '');
		const fm = front(join(dir, f));
		const route = `/${kind}/${id}/`;
		const here = `${site.url}${route}`;
		const file = `dist/${kind}/${id}/index.html`;
		if (fm.canonical) {
			count++;
			if (existsSync(file)) bad(`${route}: a piece first published elsewhere has a page here; it should be a card that links out`);
			if (!index.includes(`href="${fm.canonical}"`)) bad(`/${kind}/: the card for ${id} does not link to ${fm.canonical}`);
			if (!feed.includes(`<link>${fm.canonical}</link>`)) bad(`/${kind}/rss.xml: lacks ${fm.canonical}`);
			const card = parse(index).querySelectorAll('.post-card').find((c) => c.querySelector('a')?.getAttribute('href') === fm.canonical);
			const text = (card?.text ?? '').replace(/\s+/g, ' ');
			if (/—/.test(text)) bad(`/${kind}/: the card for ${id} contains an em dash`);
			for (const w of forbidden) if (new RegExp(`(^|[^\\w])${w.replace(/[.*+?^${}()|[\]\\#]/g, '\\$&')}([^\\w]|$)`, 'i').test(text)) bad(`/${kind}/: the card for ${id} uses "${w}", which launch_facts.public.json forbids`);
			continue;
		}
		if (!existsSync(file)) { bad(`${route}: not built`); continue; }
		count++;
		const html = readFileSync(file, 'utf8');
		const doc = parse(html);
		if (doc.querySelectorAll('h1').length !== 1) bad(`${route}: needs exactly one h1`);
		const back = doc.querySelector('.post__head .kicker a');
		if (back?.getAttribute('href') !== `/${kind}/` || back.text.trim().toLowerCase() !== kind) bad(`${route}: its label links to ${back?.getAttribute('href')} (${back?.text.trim()}), not to /${kind}/`);
		if (!html.includes(`/${kind}/rss.xml`)) bad(`${route}: does not link its own feed`);
		const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
		if (canonical !== here) bad(`${route}: canonical is ${canonical}, expected ${here}`);
		if (!/"@type":"(News)?Article"/.test(html)) bad(`${route}: no Article JSON-LD`);
		if (sitemap && !sitemap.includes(`<loc>${here}</loc>`)) bad(`${route}: missing from the sitemap`);
		if (!feed.includes(`<link>${here}</link>`)) bad(`/${kind}/rss.xml: lacks ${here}`);
		if (html.includes('—')) bad(`${route}: contains an em dash`);
		// Launch rules in the body: a quotation (blockquote) is someone else's words, and code is not prose.
		const body = parse(doc.querySelector('.post__body')?.toString() ?? '');
		body.querySelectorAll('blockquote, pre, code').forEach((n) => n.remove());
		const text = body.structuredText.replace(/\s+/g, ' ');
		for (const w of forbidden) if (new RegExp(`(^|[^\\w])${w.replace(/[.*+?^${}()|[\]\\#]/g, '\\$&')}([^\\w]|$)`, 'i').test(text)) bad(`${route}: uses "${w}", which launch_facts.public.json forbids`);
		for (const re of scoped) for (const m of text.matchAll(new RegExp(re.source, 'gi'))) {
			const start = text.lastIndexOf('. ', m.index) + 1;
			const end = text.indexOf('. ', m.index);
			if (!/v1\.6\.1/.test(text.slice(start, end === -1 ? undefined : end))) bad(`${route}: "${m[0]}" holds for the v1.6.1 file only and is not in a sentence that says "v1.6.1"`);
		}
	}
}
if (problems.length) {
	console.error(`posts: ${problems.length} problems\n  ${problems.join('\n  ')}`);
	process.exit(1);
}
console.log(`posts: ${count} posts pass`);
