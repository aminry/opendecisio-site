// Every redirect of src/config/redirects.mjs lands on a page that is built (and on its anchor, where it names one),
// no moved page is still built at its old address, and no address is redirected twice or in a chain.
//   node scripts/checks/redirects.mjs
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'node-html-parser';
import { redirects } from '../../src/config/redirects.mjs';

const problems = [];
const pageFile = (path) => `dist${path.replace(/\/?$/, '/')}index.html`;
const froms = new Set();
for (const r of redirects) {
	if (!r.why) problems.push(`${r.from}: no reason given`);
	if (froms.has(r.from)) problems.push(`${r.from}: redirected twice`);
	froms.add(r.from);
	if (existsSync(pageFile(r.from))) problems.push(`${r.from}: still built at its old address`);
	const [path, anchor] = r.to.split('#');
	if (!existsSync(pageFile(path))) { problems.push(`${r.from} -> ${r.to}: the target is not built`); continue; }
	if (anchor && !parse(readFileSync(pageFile(path), 'utf8')).querySelector(`[id="${anchor}"]`)) problems.push(`${r.from} -> ${r.to}: no #${anchor} on the target`);
}
for (const r of redirects) if (froms.has(r.to.split('#')[0])) problems.push(`${r.from} -> ${r.to}: a chain (the target is itself redirected)`);
if (problems.length) { console.error(`redirects: ${problems.length} problems\n  ${problems.join('\n  ')}`); process.exit(1); }
console.log(`redirects: ${redirects.length} moved pages, each landing on a built page`);
