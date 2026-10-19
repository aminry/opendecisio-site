// What a docs page shows about itself: its reading time, from the page as it is built (the upstream sections
// expanded, the code blocks counted by their lines), and the links that lead to its source.
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import remarkUpstream from './remark-upstream.mjs';
import { site } from '../config/site';
import { pin } from './upstream.mjs';

const memo = new Map();

/** Minutes to read a page: 200 words a minute for prose, and a code line counts as five words. */
export function readingMinutes(entry) {
	const key = entry.id;
	if (memo.has(key)) return memo.get(key);
	const processor = unified().use(remarkParse).use(remarkFrontmatter).use(remarkGfm).use(remarkDirective).use(remarkUpstream, { annotate: false });
	const tree = processor.runSync(processor.parse(entry.body ?? ''), { path: entry.filePath ?? entry.id });
	let words = 0;
	visit(tree, (node) => {
		if (node.type === 'code') words += node.value.split('\n').length * 5;
		else if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'tableCell') words += toString(node).split(/\s+/).filter(Boolean).length;
	});
	const minutes = Math.max(1, Math.round(words / 200));
	memo.set(key, minutes);
	return minutes;
}

/**
 * The page's source: its own file in the site's repository (where it is edited), and decisio's files it renders, at the
 * pinned release the page is built from.
 */
export function sourceLinks(entry) {
	const files = [...new Set([...(entry.body ?? '').matchAll(/::upstream(?:-or)?\{[^}]*file="([^"]+)"/g)].map((m) => m[1]))];
	const path = entry.filePath ?? `src/content/docs/${entry.id}.md`;
	return {
		edit: `${site.siteRepository}/edit/main/${path}`,
		files: files.map((f) => ({ file: f, href: `${site.repository}/blob/${pin.tag}/${f}` })),
	};
}
