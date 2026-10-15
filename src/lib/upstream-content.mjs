// Reading pieces of the pinned decisio files from Astro pages: a section's
// paragraphs, tables and code blocks, rendered to HTML where they hold Markdown.
import { toHtml } from 'hast-util-to-html';
import { toHast } from 'mdast-util-to-hast';
import { toString } from 'mdast-util-to-string';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { pin, readUpstream } from './upstream.mjs';
import { rewriteLinks } from './upstream-links.mjs';
import { splitParagraph } from './sentences.mjs';
import { jevbenchCounts } from './text.mjs';
import { visit } from 'unist-util-visit';

const parser = unified().use(remarkParse).use(remarkGfm);
const trees = new Map();

export function tree(file) {
	if (!trees.has(file)) {
		const parsed = parser.parse(readUpstream(file));
		rewriteLinks(parsed.children, file);
		visit(parsed, 'text', (node) => {
			node.value = jevbenchCounts(node.value);
		});
		trees.set(file, parsed);
	}
	return trees.get(file);
}

/** The block nodes under `heading` in `file`, up to the next heading at its level or above. */
export function sectionNodes(file, heading) {
	const children = tree(file).children;
	const start = children.findIndex((n) => n.type === 'heading' && toString(n).trim() === heading);
	if (start === -1) throw new Error(`upstream: ${file} at ${pin.tag} has no heading "${heading}"`);
	const depth = children[start].depth;
	let end = children.findIndex((n, i) => i > start && n.type === 'heading' && n.depth <= depth);
	if (end === -1) end = children.length;
	return children.slice(start + 1, end);
}

function pick(file, heading, type, index) {
	const found = sectionNodes(file, heading).filter((n) => n.type === type);
	if (!found[index]) throw new Error(`upstream: ${file} "${heading}" has no ${type} #${index + 1} at ${pin.tag}`);
	return found[index];
}

/** Inline Markdown children rendered to HTML. */
export function inlineHtml(node) {
	return toHtml(toHast({ type: 'paragraph', children: node.children ?? [node] })).replace(/^<p>|<\/p>$/g, '');
}

/** A paragraph as HTML paragraphs of at most three sentences (src/lib/sentences.mjs), the words unchanged. */
export function inlineParts(node) {
	return splitParagraph(node).map((p) => inlineHtml(p));
}

export function paragraph(file, heading, index = 0) {
	return inlineHtml(pick(file, heading, 'paragraph', index));
}

export function paragraphText(file, heading, index = 0) {
	return toString(pick(file, heading, 'paragraph', index));
}

/** A table as { head, rows }, each cell as HTML. */
export function table(file, heading, index = 0) {
	const t = pick(file, heading, 'table', index);
	const [head, ...rows] = t.children.map((row) => row.children.map((cell) => inlineHtml(cell)));
	return { head, rows, align: t.align };
}

export function listItems(file, heading, index = 0) {
	const list = pick(file, heading, 'list', index);
	return list.children.map((item) => inlineHtml(item.children[0]));
}

/** A list's items, each as paragraphs of at most three sentences. */
export function listItemParts(file, heading, index = 0) {
	return pick(file, heading, 'list', index).children.map((item) => inlineParts(item.children[0]));
}

export function code(file, heading, index = 0) {
	return pick(file, heading, 'code', index).value;
}

/** The text of the first heading in `file` that matches `pattern`, or undefined. */
export function findHeading(file, pattern) {
	const h = tree(file).children.find((n) => n.type === 'heading' && pattern.test(toString(n)));
	return h ? toString(h).trim() : undefined;
}

/** A section's own blocks, before its first subheading, as tables and paragraphs. */
export function sectionBlocks(file, heading) {
	const nodes = sectionNodes(file, heading);
	const end = nodes.findIndex((n) => n.type === 'heading');
	return nodes.slice(0, end === -1 ? nodes.length : end).flatMap((n) => {
		if (n.type === 'paragraph') return [{ kind: 'p', html: inlineHtml(n) }];
		if (n.type === 'table') {
			const [head, ...rows] = n.children.map((r) => r.children.map((c) => inlineHtml(c)));
			return [{ kind: 'table', head, rows }];
		}
		return [];
	});
}

/** The paragraph under `heading` that starts with `start`, as HTML; undefined when `optional` and absent. */
export function paragraphStarting(file, heading, start, { optional = false } = {}) {
	const p = sectionNodes(file, heading).find((n) => n.type === 'paragraph' && toString(n).startsWith(start));
	if (!p) {
		if (optional) return undefined;
		throw new Error(`upstream: ${file} "${heading}" has no paragraph starting "${start}" at ${pin.tag}`);
	}
	return inlineHtml(p);
}
