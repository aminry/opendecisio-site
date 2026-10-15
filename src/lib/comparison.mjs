// "How Decisio compares", read from decisio's docs/comparison.md at the pinned
// tag: the headline table and its notes, the capabilities table and the
// per-benchmark tables by area. Undefined until a release carries the file.
import { toString } from 'mdast-util-to-string';
import { findHeading, inlineHtml, sectionNodes, tree } from './upstream-content.mjs';
import { upstreamHas } from './upstream.mjs';

const FILE = 'docs/comparison.md';

const tableOf = (node) => {
	const [head, ...rows] = node.children.map((r) => r.children.map((c) => inlineHtml(c)));
	return { head, rows };
};

function blocksUntilHeading(nodes) {
	const end = nodes.findIndex((n) => n.type === 'heading');
	return end === -1 ? nodes : nodes.slice(0, end);
}

const required = (heading, pattern) => {
	if (!heading) throw new Error(`comparison: ${FILE} has no heading matching ${pattern}; revisit src/lib/comparison.mjs`);
	return heading;
};

export function comparison() {
	if (!upstreamHas(FILE)) return undefined;
	const title = toString(tree(FILE).children.find((n) => n.type === 'heading' && n.depth === 1));
	const opening = blocksUntilHeading(sectionNodes(FILE, title)).filter((n) => n.type === 'paragraph');

	const headlineHeading = required(findHeading(FILE, /^\d+\.\s*Headline/), 'Headline');
	const headlineNodes = sectionNodes(FILE, headlineHeading);
	const headline = tableOf(headlineNodes.find((n) => n.type === 'table'));
	const notes = headlineNodes.filter((n) => n.type === 'paragraph').map((n) => inlineHtml(n));

	const capabilitiesHeading = required(findHeading(FILE, /^\d+\.\s*Capabilities/), 'Capabilities');
	const capNodes = sectionNodes(FILE, capabilitiesHeading);
	const capabilities = {
		intro: capNodes.filter((n) => n.type === 'paragraph').map((n) => inlineHtml(n)),
		...tableOf(capNodes.find((n) => n.type === 'table')),
	};

	const everyHeading = required(findHeading(FILE, /^\d+\.\s*Every index benchmark/), 'Every index benchmark');
	const everyNodes = sectionNodes(FILE, everyHeading);
	const everyIntro = blocksUntilHeading(everyNodes).filter((n) => n.type === 'paragraph').map((n) => inlineHtml(n));
	const groups = [];
	let current;
	for (const n of everyNodes) {
		if (n.type === 'heading') {
			current = { title: toString(n).trim(), intro: [], table: undefined };
			groups.push(current);
		} else if (current && n.type === 'table') current.table = tableOf(n);
		else if (current && n.type === 'paragraph') current.intro.push(inlineHtml(n));
	}

	// The opening's facts the site restates in its own words (the opening itself names the entries by their standing and
	// calls the Decision Index submission pending, where the board now lists the rows): where the board figures come from, and that
	// none comes from a call to TypeSafe's API.
	const openingText = opening.map((n) => toString(n)).join(' ');
	if (!/come only from the public boards/.test(openingText) || !/No figure here comes from any call of ours to TypeSafe's API/.test(openingText)) throw new Error('comparison: the opening no longer says where the board figures come from and that none comes from TypeSafe\'s API');
	// The site shows values and intervals with no marks (decided 2026-10-15), so the paragraph that defines the marks is
	// left out, and no cell is marked.
	return { headline, notes, capabilities, everyIntro, groups: groups.filter((g) => g.table) };
}

// A cell's mark, from the symbol the comparison writes after the value.
const MARKS = [
	{ symbol: '▲', key: 'ahead', label: 'ahead of Jev' },
	{ symbol: '=', key: 'level', label: 'level with Jev' },
	{ symbol: '▼', key: 'behind', label: 'behind Jev' },
];

/** A cell split into its value and its mark (or none). */
export function markOf(html) {
	const plain = html.replace(/<[^>]+>/g, '').trim();
	const mark = MARKS.find((m) => plain.endsWith(` ${m.symbol}`));
	if (!mark) return { value: html, mark: undefined };
	return { value: html.replace(new RegExp(`\\s*${mark.symbol}\\s*$`), ''), mark };
}

export { MARKS };
