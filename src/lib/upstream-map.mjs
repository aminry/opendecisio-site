// Which upstream file and section each site page includes, read from the
// ::upstream directives in the content collection, so links between included
// files resolve to site pages without a second list to keep in step.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { siteRoot, upstreamHas, readUpstream } from './upstream.mjs';

const contentRoot = join(siteRoot, 'src/content/docs');
const DIRECTIVE = /^:{2,3}upstream(?:-or)?\{([^}]*)\}\s*$/gm;
// ::covers{links="README.md#gpu-server docs/running.md=1-pick-your-machine"}: a site-written page that replaces those
// sections of decisio's docs, so links to them land here (at the anchor after "=", if one is given). It renders nothing.
const COVERS = /^::covers\{links="([^"]*)"\}\s*$/gm;
const ATTR = /(\w+)="([^"]*)"/g;
// decisio files the site's own pages (not the docs collection) replace whole: a link to any part of them lands there.
const SITE_PAGES = {
	'docs/comparison.md': { path: '/benchmarks/', anchor: 'compares' },
	'docs/demos/README.md': { path: '/demos/', anchor: '' },
};

export function slugify(text) {
	return new GithubSlugger().slug(text);
}

function walk(dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory() ? walk(join(dir, e.name)) : /\.mdx?$/.test(e.name) ? [join(dir, e.name)] : [],
	);
}

function routeOf(path) {
	const rel = relative(contentRoot, path).replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '');
	return `/${rel}${rel ? '/' : ''}`;
}

let memo;
export function inclusionMap() {
	if (memo) return memo;
	const byFile = new Map();
	const aliases = new Map();
	const cover = (alias, path) => {
		const [link, at = ''] = alias.split('=');
		const [file, anchor] = link.split('#');
		if (!aliases.has(file)) aliases.set(file, new Map());
		if (aliases.get(file).has(anchor ?? '')) throw new Error(`upstream-map: ${link} is covered by two pages`);
		aliases.get(file).set(anchor ?? '', { path, anchor: at });
	};
	for (const path of walk(contentRoot)) {
		for (const match of readFileSync(path, 'utf8').matchAll(COVERS)) {
			for (const alias of match[1].split(/\s+/).filter(Boolean)) cover(alias, routeOf(path));
		}
		for (const match of readFileSync(path, 'utf8').matchAll(DIRECTIVE)) {
			const attrs = Object.fromEntries([...match[1].matchAll(ATTR)].map((m) => [m[1], m[2]]));
			if (!attrs.file) continue;
			if (!byFile.has(attrs.file)) byFile.set(attrs.file, []);
			const entry = { section: attrs.section, keep: attrs.heading === 'keep', intro: attrs.part === 'intro', path: routeOf(path) };
			byFile.get(attrs.file).push(entry);
			// covers="README.md#gpu-server": links to that file and anchor land here too.
			for (const alias of (attrs.covers ?? '').split(/\s+/).filter(Boolean)) cover(alias, entry.path);
		}
	}
	// For each included file, the page and anchor every one of its headings lands on.
	const anchors = new Map();
	for (const [file, entries] of byFile) {
		if (!upstreamHas(file)) continue;
		const tree = unified().use(remarkParse).parse(readUpstream(file));
		const slugger = new GithubSlugger();
		const whole = entries.find((e) => !e.section);
		const pageSlugger = new Map();
		let current = null;
		const table = new Map();
		for (const node of tree.children) {
			if (node.type !== 'heading') continue;
			const text = toString(node).trim();
			const slug = slugger.slug(text);
			const entry = entries.find((e) => e.section === text);
			if (entry) {
				current = { entry, depth: node.depth };
				table.set(slug, { path: entry.path, anchor: entry.keep ? slug : '' });
				continue;
			}
			if (current && node.depth <= current.depth) current = null;
			const owner = current ? (current.entry.intro ? undefined : current.entry) : node.depth > 1 ? whole : undefined;
			if (!owner) continue;
			if (!pageSlugger.has(owner.path)) pageSlugger.set(owner.path, new GithubSlugger());
			table.set(slug, { path: owner.path, anchor: pageSlugger.get(owner.path).slug(text) });
		}
		anchors.set(file, { whole, table });
	}
	memo = {
		routeFor(file, anchor) {
			const alias = aliases.get(file)?.get(anchor ?? '');
			if (alias) return alias;
			const entry = anchors.get(file);
			if (!entry) return SITE_PAGES[file];
			if (anchor && entry.table.has(anchor)) return entry.table.get(anchor);
			if (entry.whole) return { path: entry.whole.path, anchor: anchor ?? '' };
			return undefined;
		},
	};
	return memo;
}
