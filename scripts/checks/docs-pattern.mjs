// The docs' page pattern, checked on the built pages: every page of the sidebar that is not marked `legacy` in
// src/config/docs-groups.mjs has a figure before its first section, a TL;DR section with a checked code block, a
// "What next" section with links, its reading time and date, and its foot's source and Markdown links; every
// figure that moves has its Pause button; and no page, legacy or not, has a paragraph of more than three sentences. The legacy pages are listed, so the list can only shrink.
// The same rule holds on the site's own pages other than home and the posts (benchmarks, demos, privacy, the 404),
// disclosures included.
//   node scripts/checks/docs-pattern.mjs
import { readFileSync } from 'node:fs';
import { parse } from 'node-html-parser';
import { docsGroups } from '../../src/config/docs-groups.mjs';
import { sentenceCount } from '../../src/lib/sentences.mjs';

const problems = [];
let legacy = 0;
let checked = 0;
for (const g of docsGroups) {
	for (const item of g.items) {
		// Every page, legacy or not: no wall of text, so no paragraph of more than three sentences (a figure's,
		// a table's and the glossary's text aside).
		{
			const page = parse(readFileSync(`dist/${item.slug}/index.html`, 'utf8')).querySelector('.sl-markdown-content');
			for (const p of page?.querySelectorAll('p') ?? []) {
				if (p.closest('figure') || p.closest('table') || p.closest('.glossary')) continue;
				const n = sentenceCount(p.text);
				if (n > 3) problems.push(`/${item.slug}/: a paragraph of ${n} sentences ("${p.text.trim().slice(0, 60)}...")`);
			}
		}
		if (item.legacy) { legacy += 1; continue; }
		checked += 1;
		const where = `/${item.slug}/`;
		const doc = parse(readFileSync(`dist/${item.slug}/index.html`, 'utf8'));
		const content = doc.querySelector('.sl-markdown-content');
		if (!content) { problems.push(`${where}: no content`); continue; }
		const kids = content.childNodes.filter((n) => n.tagName);
		const firstH2 = kids.findIndex((n) => n.tagName === 'H2' || n.classList?.contains('sl-heading-wrapper'));
		const figure = kids.findIndex((n) => n.tagName === 'FIGURE' && n.classList.contains('fig'));
		if (figure === -1) problems.push(`${where}: no figure`);
		else if (firstH2 !== -1 && figure > firstH2) problems.push(`${where}: the figure comes after the first section`);
		const sections = [];
		let current;
		for (const n of kids) {
			if (n.classList?.contains('sl-heading-wrapper') && n.classList.contains('level-h2')) sections.push((current = { title: n.text.replace(/\s+/g, ' ').trim().replace(/Section titled .*$/, '').trim(), nodes: [] }));
			else current?.nodes.push(n);
		}
		const tldr = sections.find((s) => /^TL;DR/.test(s.title));
		if (!tldr) problems.push(`${where}: no TL;DR section`);
		else if (!tldr.nodes.some((n) => n.querySelector?.('.expressive-code') || n.classList?.contains('expressive-code'))) problems.push(`${where}: the TL;DR has no code block`);
		const next = sections.find((s) => /^What next/.test(s.title));
		if (!next) problems.push(`${where}: no "What next" section`);
		else if (next.nodes.flatMap((n) => n.querySelectorAll?.('a') ?? []).length < 2) problems.push(`${where}: "What next" has fewer than two links`);
		const meta = doc.querySelector('.pt__meta')?.text ?? '';
		if (!/\d+ min read/.test(meta)) problems.push(`${where}: no reading time`);
		if (!/updated \d{4}-\d{2}-\d{2}/.test(meta)) problems.push(`${where}: no last-updated date`);
		const actions = doc.querySelector('.site-foot__actions')?.text ?? '';
		if (!/View as Markdown/.test(actions) || !/(Edit on GitHub|Suggest an edit)/.test(actions)) problems.push(`${where}: the foot lacks its source and Markdown links`);
		for (const f of doc.querySelectorAll('.fig[data-live]')) if (!f.querySelector('[data-fig-pause]')) problems.push(`${where}: a moving figure has no Pause button`);
	}
}
// The site's own pages: no wall of text there either (a table's or a figure's text aside).
const SITE_PAGES = { '/benchmarks/': 'dist/benchmarks/index.html', '/demos/': 'dist/demos/index.html', '/privacy/': 'dist/privacy/index.html', '/404': 'dist/404.html' };
for (const [where, file] of Object.entries(SITE_PAGES)) {
	const main = parse(readFileSync(file, 'utf8')).querySelector('main');
	if (!main) { problems.push(`${where}: no main`); continue; }
	for (const p of main.querySelectorAll('p')) {
		if (p.closest('figure') || p.closest('table')) continue;
		const n = sentenceCount(p.text);
		if (n > 3) problems.push(`${where}: a paragraph of ${n} sentences ("${p.text.trim().slice(0, 60)}...")`);
	}
}
if (problems.length) { console.error(`docs-pattern: ${problems.length} problems\n  ${problems.join('\n  ')}`); process.exit(1); }
console.log(`docs-pattern: ${checked} pages follow the pattern; ${legacy} not yet rewritten; no paragraph over three sentences there or on ${Object.keys(SITE_PAGES).length} site pages`);
