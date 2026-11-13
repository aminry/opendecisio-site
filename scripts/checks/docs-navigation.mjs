import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { docsGroups } from '../../src/config/docs-groups.mjs';
import { redirects } from '../../src/config/redirects.mjs';

/** Problems that make a published guide unreachable or give its link two owners. */
export function navigationProblems(groups, pages, moved) {
	const problems = [];
	const available = new Set(pages);
	const old = new Set(moved.map((r) => r.from.replace(/^\/|\/$/g, '')));
	const seen = new Set();
	for (const { slug } of groups.flatMap((g) => g.items)) {
		if (seen.has(slug)) problems.push(`${slug}: page appears more than once in navigation`);
		seen.add(slug);
		if (!available.has(slug)) problems.push(`${slug}: navigation points to a missing page`);
		if (old.has(slug)) problems.push(`${slug}: moved page is still in navigation`);
	}
	for (const page of available) if (!seen.has(page)) problems.push(`${page}: page is missing from navigation`);
	return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = 'src/content/docs';
	const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(dir, e.name)) : /\.mdx?$/.test(e.name) ? [join(dir, e.name)] : []);
	const pages = walk(root).map((f) => relative(root, f).replace(/\.mdx?$/, '').replace(/(^|\/)index$/, ''));
	const problems = navigationProblems(docsGroups, pages, redirects);
	if (problems.length) {
		console.error(problems.join('\n'));
		process.exit(1);
	}
	console.log(`docs-navigation: ${pages.length} pages, each discoverable exactly once`);
}
