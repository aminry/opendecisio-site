// Every docs table fits its column and nothing in it is clipped. A table of three columns or more that does not fit
// scrolls sideways inside its own frame (a focusable region), and the page never does:
// the table sits in a container the stylesheet can query (div.table-wrap) and
// each value carries its column's heading, so below a container width the
// stylesheet can show one labelled block per row (src/styles/docs.css), the way
// the site's own tables do (.data-table--stack).
import { toString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';

const isElement = (n, name) => n.type === 'element' && n.tagName === name;

export default function rehypeTables() {
	return (tree) => {
		visit(tree, 'element', (node, index, parent) => {
			if (node.tagName !== 'table' || !parent || parent.properties?.className?.includes?.('table-wrap')) return;
			const head = node.children.find((c) => isElement(c, 'thead'));
			const labels = (head?.children.find((c) => isElement(c, 'tr'))?.children ?? []).filter((c) => c.type === 'element').map((th) => toString(th).trim());
			for (const body of node.children.filter((c) => isElement(c, 'tbody'))) {
				for (const row of body.children.filter((c) => isElement(c, 'tr'))) {
					row.children.filter((c) => c.type === 'element').forEach((cell, i) => {
						if (labels[i]) cell.properties = { ...cell.properties, dataLabel: labels[i] };
					});
				}
			}
			node.properties = { ...node.properties, className: [...(node.properties?.className ?? []), 'docs-table'] };
			parent.children[index] = { type: 'element', tagName: 'div', properties: { className: ['table-wrap'], ...(labels.length >= 3 ? { tabIndex: 0, role: 'region', ariaLabel: 'Table, scrolls sideways when it does not fit' } : {}) }, children: [node] };
		});
	};
}
