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
 * The page's source: for a page built from decisio's own files, those files on GitHub (where it is edited); for a page
 * the site writes itself, a new issue on decisio, since the site's repository is private.
 */
export function sourceLinks(entry) {
	const files = [...new Set([...(entry.body ?? '').matchAll(/::upstream(?:-or)?\{[^}]*file="([^"]+)"/g)].map((m) => m[1]))];
	const title = entry.data?.title ?? 'a docs page';
	return {
		files: files.map((f) => ({ file: f, href: `${site.repository}/edit/main/${f}` })),
		suggest: `${site.repository}/issues/new?title=${encodeURIComponent(`Docs: ${title}`)}`,
	};
}
