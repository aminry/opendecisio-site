// No reader is sent to GitHub for documentation (docs/STYLE_GUIDE.md, "Links"): a built page may link decisio's
// artifacts (a release, a source file, a run record, the licence, an issue) but not its Markdown documentation
// (docs/*.md, README.md, EVAL_CARD.md, SECURITY.md, CONTRIBUTING.md). The pages that still do when the rewrite began are
// in docs-links-baseline.json with their counts, which may only fall: a page above its count, or a page not listed
// with any such link, fails; a page below its count is reported so the baseline is lowered.
//   node scripts/checks/docs-links.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const DOC = /href="https:\/\/github\.com\/aminry\/decisio\/(?:blob|tree)\/[^/"]+\/((?:docs\/[^"#]*\.md)|README\.md|EVAL_CARD\.md|SECURITY\.md|CONTRIBUTING\.md)(?:#[^"]*)?"/g;
const baseline = JSON.parse(readFileSync('scripts/checks/docs-links-baseline.json', 'utf8')).pages;
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name === 'index.html' ? [join(d, e.name)] : []));
const problems = [];
const lower = [];
let total = 0;
for (const file of walk('dist')) {
	const route = `/${relative('dist', file).replace(/index\.html$/, '')}`;
	if (/^\/(articles|news)\//.test(route)) continue; // published posts stay as published
	// A page's footer says where the page comes from (its own source, decisio's files at the release, the contributing
	// guide): provenance, not documentation the reader is sent to, so only the page above it is read.
	const links = [...readFileSync(file, 'utf8').replace(/<footer[\s\S]*?<\/footer>/g, '').matchAll(DOC)].map((m) => m[1]);
	total += links.length;
	const allowed = baseline[route] ?? 0;
	if (links.length > allowed) problems.push(`${route}: ${links.length} links to decisio's docs on GitHub (${allowed} allowed): ${[...new Set(links)].slice(0, 4).join(', ')}`);
	else if (links.length < allowed) lower.push(`${route}: ${links.length} (baseline ${allowed})`);
}
for (const route of Object.keys(baseline)) if (!walk('dist').some((f) => `/${relative('dist', f).replace(/index\.html$/, '')}` === route)) lower.push(`${route}: no longer built (remove it from the baseline)`);
if (problems.length) { console.error(`docs-links: ${problems.length} pages send readers to GitHub for docs\n  ${problems.join('\n  ')}`); process.exit(1); }
if (lower.length) console.log(`docs-links: lower the baseline for ${lower.length} pages:\n  ${lower.join('\n  ')}`);
console.log(`docs-links: ${total} links to decisio's docs on GitHub, none above the baseline; the rewrite brings them on-site`);
