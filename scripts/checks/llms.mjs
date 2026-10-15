// Checks dist/llms.txt and dist/llms-full.txt: every docs page of the sidebar is linked and present, no em dash, no unconverted markup.
import { existsSync, readFileSync } from 'node:fs';
import { docsGroups } from '../../src/config/docs-groups.mjs';
import { site } from '../../src/config/site.ts';

const index = readFileSync('dist/llms.txt', 'utf8');
const full = readFileSync('dist/llms-full.txt', 'utf8');
const problems = [];
if (!/^# /.test(index) || !/^> /m.test(index)) problems.push('llms.txt lacks its title and summary');
for (const g of docsGroups) {
	if (!index.includes(`## ${g.label}`)) problems.push(`llms.txt lacks the group ${g.label}`);
	for (const i of g.items) {
		if (!index.includes(`(${new URL(`/${i.slug}/`, site.url).href})`)) problems.push(`llms.txt does not link ${i.slug}`);
		if (!full.includes(`Source: ${new URL(`/${i.slug}/`, site.url).href}`)) problems.push(`llms-full.txt lacks ${i.slug}`);
		// The page as Markdown, which each page's foot links as "View as Markdown".
		const md = `dist/${i.slug}/index.md`;
		if (!existsSync(md)) problems.push(`${md} was not written`);
		else if (readFileSync(md, 'utf8').includes('—')) problems.push(`${md} contains an em dash`);
	}
}
for (const [name, text] of [['llms.txt', index], ['llms-full.txt', full]]) {
	if (text.includes('—')) problems.push(`${name} contains an em dash`);
	if (/<\/?(div|span|svg|button)\b/.test(text)) problems.push(`${name} has unconverted markup`);
}
if (problems.length) { console.error(`llms: ${problems.length} problems\n  ${problems.join('\n  ')}`); process.exit(1); }
console.log(`llms: llms.txt and llms-full.txt cover ${docsGroups.reduce((n, g) => n + g.items.length, 0)} pages (${Math.round(full.length / 1024)} KB of text)`);
