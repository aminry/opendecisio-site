// A remark plugin that replaces a leaf directive
//   ::upstream{file="docs/running.md" section="GPU server"}
// with that section of the decisio file at the pinned tag, parsed as Markdown,
// so the section's headings, tables and code blocks become part of the page.
//
// Attributes:
//   file     a path in the decisio repository (required)
//   section  a heading's text; without it, the whole file below its title
//   heading  "keep" to keep the section's own heading (dropped by default)
//   depth    the heading level the section's top level becomes (default 2)
//   part     "intro" for the text before the section's first subheading only
//   block    "2": only the section's second code block (1-based), for a TL;DR that shows the command alone
//
// Links into the decisio repository are rewritten to the site's page when the
// site includes the linked file (or the linked section of it), and to the file
// on GitHub at the pinned tag otherwise.
import { toString } from 'mdast-util-to-string';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { pin, readUpstream } from './upstream.mjs';
import { inclusionMap, slugify } from './upstream-map.mjs';
import { rewriteLinks } from './upstream-links.mjs';
import { commentsAbove, jevbenchCounts } from './text.mjs';
import { upstreamHas } from './upstream.mjs';
import { checkHtml, checkOf } from './checks.mjs';
import { siteBlock } from './site-blocks.mjs';
import { diagram } from './diagrams.mjs';
import { docsFigure, recordedLabel } from './docs-figures.mjs';
import { splitParagraph } from './sentences.mjs';
import { integrationsTable } from './figures/use-from.mjs';
import { taskGains } from './teach.mjs';
import { symptomTable } from './figures/run-it.mjs';

const parser = unified().use(remarkParse).use(remarkGfm);
const cache = new Map();

function parseFile(file) {
	if (!cache.has(file)) {
		const source = readUpstream(file);
		cache.set(file, parser.parse(source));
	}
	return structuredClone(cache.get(file));
}

function headingText(node) {
	return toString(node).trim();
}

/** The nodes of `section` in `tree`, from its heading to the next heading at its level or above. */
function sliceSection(tree, file, section) {
	const children = tree.children.filter((n) => n.type !== 'html' || !/^<!--[\s\S]*-->$/.test(n.value.trim()));
	if (!section) {
		const title = children.findIndex((n) => n.type === 'heading' && n.depth === 1);
		return { nodes: children.slice(title + 1), topDepth: 1 };
	}
	const start = children.findIndex((n) => n.type === 'heading' && headingText(n) === section);
	if (start === -1) {
		const known = children.filter((n) => n.type === 'heading').map(headingText);
		throw new Error(`upstream: ${file} at ${pin.tag} has no heading "${section}". Its headings: ${known.join(' | ')}`);
	}
	const depth = children[start].depth;
	let end = children.findIndex((n, i) => i > start && n.type === 'heading' && n.depth <= depth);
	if (end === -1) end = children.length;
	return { nodes: children.slice(start, end), topDepth: depth };
}

// Upstream fences carry no language; name the ones whose first word makes it plain.
const SHELL = /^(git|cd|uv|curl|docker|ollama|export|pip|python|npm)\b/;
function labelCode(nodes) {
	visit({ type: 'root', children: nodes }, 'code', (node) => {
		if (node.lang) return;
		const first = node.value.trimStart();
		if (SHELL.test(first)) node.lang = 'sh';
		else if (first.startsWith('{') || first.startsWith('[')) node.lang = 'json';
		else node.lang = 'text';
	});
}

function hasSection(file, section) {
	return parseFile(file).children.some((n) => n.type === 'heading' && headingText(n) === section);
}

function wording(nodes) {
	visit({ type: 'root', children: nodes }, 'text', (node) => {
		node.value = jevbenchCounts(node.value);
	});
}

export default function remarkUpstream(options = {}) {
	const { annotate = true } = options;
	return (tree, vfile) => {
		const map = inclusionMap();
		// :::upstream-or{file="..."} keeps its own (site-written) content only while the
		// pinned release lacks the file; once a release has it, the file replaces it.
		visit(tree, 'containerDirective', (node, index, parent) => {
			if (node.name !== 'upstream-or') return;
			const { file } = node.attributes ?? {};
			if (!file) throw new Error(`upstream: an upstream-or block in ${vfile.path} has no file`);
			const present = upstreamHas(file) && (!node.attributes.section || hasSection(file, node.attributes.section));
			const replacement = present ? [{ type: 'leafDirective', name: 'upstream', attributes: { ...node.attributes }, children: [] }] : node.children;
			parent.children.splice(index, 1, ...replacement);
			return index;
		});
		visit(tree, 'leafDirective', (node, index, parent) => {
			if (node.name !== 'upstream') return;
			const { file, section, heading, depth, part, block, omit } = node.attributes ?? {};
			if (!file) throw new Error(`upstream: a directive in ${vfile.path} has no file`);
			const { nodes, topDepth } = sliceSection(parseFile(file), file, section);
			const keep = heading === 'keep' && section;
			let body = keep ? nodes : section ? nodes.slice(1) : nodes;
			if (part === 'intro') {
				const sub = body.findIndex((n) => n.type === 'heading');
				if (sub !== -1) body = body.slice(0, sub);
			}
			// omit="First words": leave out decisio's paragraph that starts with them (one the site does not show the subject of).
			if (omit) {
				const at = body.findIndex((n) => n.type === 'paragraph' && toString(n).startsWith(omit));
				if (at === -1) throw new Error(`upstream: ${file} has no paragraph starting "${omit}" to leave out`);
				body = body.filter((_, i) => i !== at);
			}
			if (block) {
				const codes = [];
				visit({ type: 'root', children: body }, 'code', (c) => { codes.push(c); });
				const one = codes[Number(block) - 1];
				if (!one) throw new Error(`upstream: ${file}${section ? ` "${section}"` : ''} has no code block ${block} (it has ${codes.length})`);
				body = [one];
			}
			const target = Number(depth ?? 2);
			// The section's own heading sits at topDepth; its subheadings start one below.
			const shift = target - (keep ? topDepth : topDepth + 1);
			visit({ type: 'root', children: body }, 'heading', (h) => {
				h.depth = Math.min(6, Math.max(2, h.depth + shift));
			});
			rewriteLinks(body, file, map);
			labelCode(body);
			wording(body);
			// decisio's long paragraphs read as two or three short ones on the site: cut where its sentences end.
			visit({ type: 'root', children: body }, 'paragraph', (para, i, holder) => {
				const parts = splitParagraph(para);
				if (parts.length === 1 || !holder) return;
				holder.children.splice(i, 1, ...parts);
				return i + parts.length;
			});
			parent.children.splice(index, 1, ...body);
			return index + body.length;
		});
		// ::covers{links="..."}: read by src/lib/upstream-map.mjs; on the page it is nothing.
		visit(tree, 'leafDirective', (node, index, parent) => {
			if (node.name !== 'covers') return;
			parent.children.splice(index, 1);
			return index;
		});
		// ::diagram{name="..."}: a diagram drawn at build time from the facts and the README (diagrams.mjs).
		visit(tree, 'leafDirective', (node, index, parent) => {
			if (node.name !== 'diagram') return;
			parent.children.splice(index, 1, { type: 'html', value: diagram(node.attributes?.name) });
			return index + 1;
		});
		// ::figure{name="..."}: an animated or interactive figure drawn at build time (docs-figures.mjs).
		visit(tree, 'leafDirective', (node, index, parent) => {
			if (node.name !== 'figure') return;
			parent.children.splice(index, 1, { type: 'html', value: docsFigure(node.attributes?.name) });
			return index + 1;
		});
		// ::integrations-table: the checked integrations, one row each (src/data/integrations.json).
		visit(tree, 'leafDirective', (node, index, parent) => {
			if (node.name !== 'integrations-table') return;
			parent.children.splice(index, 1, { type: 'html', value: integrationsTable() });
			return index + 1;
		});
		// ::teach-gains: what teaching did on the default model, one row per intent set (src/lib/teach.mjs checks each
		// number against the release's evaluation card).
		visit(tree, 'leafDirective', (node, index, parent) => {
			if (node.name !== 'teach-gains') return;
			const heads = ['Intent set', 'Right, untaught', 'Right, taught', 'Measured on'];
			const rows = taskGains().map((g) => [`${g.name}, ${g.options} intents`, `${(g.plain * 100).toFixed(1)}%`, `<b>${(g.taught * 100).toFixed(1)}%</b>`, `${g.per} labelled examples per intent; ${g.items} test messages; mean of ${g.draws} draws; taught in ${g.seconds} s`]);
			const html = `<div class="table-wrap"><table class="docs-table"><thead><tr>${heads.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td data-label="${heads[i]}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
			parent.children.splice(index, 1, { type: 'html', value: html });
			return index + 1;
		});
		// ::latency-table: the first question's server time by text length, per model, as docs/running.md's table at the
		// pinned release gives it (a later question about the same text is a line of the page, from the same table).
		visit(tree, 'leafDirective', (node, index, parent) => {
			if (node.name !== 'latency-table') return;
			const run = readUpstream('docs/running.md');
			const m = /^\| State, tokens \| 31B first[^|]*\| 31B second \| 12B first[^|]*\| 12B second \| Qwen first \| Qwen second \|\n\| [-: |]+\|\n((?:\|.*\|\n)+)/m.exec(run);
			if (!m) throw new Error('latency-table: docs/running.md no longer has its first-question table');
			const ms = (v) => (/^[\d,.]+$/.test(v) ? `${v} ms` : v);
			const heads = ['Text, tokens', 'Gemma 4 31B', 'Gemma 4 12B', 'Qwen3.6-35B-A3B'];
			const rows = m[1].trim().split('\n').map((l) => l.split('|').slice(1, -1).map((c) => c.trim())).map((c) => [c[0], ms(c[1]), ms(c[3]), ms(c[5])]);
			const html = `<div class="table-wrap"><table class="docs-table"><thead><tr>${heads.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td data-label="${heads[i]}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
			parent.children.splice(index, 1, { type: 'html', value: html });
			return index + 1;
		});
		// ::symptoms{group="..."}: what you see, why and what to do, for one kind of trouble (src/lib/figures/run-it.mjs).
		visit(tree, 'leafDirective', (node, index, parent) => {
			if (node.name !== 'symptoms') return;
			parent.children.splice(index, 1, { type: 'html', value: symptomTable(node.attributes?.group) });
			return index + 1;
		});
		// ::recorded-label: the line that says which recorded decision, on which box, an answer on the page came from.
		visit(tree, 'leafDirective', (node, index, parent) => {
			if (node.name !== 'recorded-label') return;
			parent.children.splice(index, 1, { type: 'html', value: recordedLabel(node.attributes?.shows) });
			return index + 1;
		});
		// :::glossary: a short table of the terms a page uses, set apart from the text around it.
		visit(tree, 'containerDirective', (node) => {
			if (node.name !== 'glossary') return;
			node.data = { ...node.data, hName: 'div', hProperties: { className: ['glossary'] } };
		});
		// A numbered section ("## 2. Ask your question") is a step: its number is drawn in a circle. The heading's text is
		// unchanged (the number and its full stop stay in it, the stop read only by screen readers), so its anchor is too.
		visit(tree, 'heading', (h) => {
			if (h.depth !== 2 || h.children[0]?.type !== 'text') return;
			const m = /^(\d+)\.\s+/.exec(h.children[0].value);
			if (!m) return;
			const rest = h.children[0].value.slice(m[0].length);
			h.children.splice(0, 1,
				{ type: 'stepNumber', data: { hName: 'span', hProperties: { className: ['step-n'] } }, children: [{ type: 'text', value: m[1] }, { type: 'stepStop', data: { hName: 'span', hProperties: { className: ['sr-only'] } }, children: [{ type: 'text', value: '.' }] }] },
				{ type: 'text', value: ` ${rest}` });
		});
		// :::steps: a numbered list read as steps, each number in a circle and the steps joined by a line.
		visit(tree, 'containerDirective', (node) => {
			if (node.name !== 'steps') return;
			if (!node.children.some((c) => c.type === 'list' && c.ordered)) throw new Error(`steps: a :::steps block in ${vfile.path} has no numbered list`);
			node.data = { ...node.data, hName: 'div', hProperties: { className: ['steps'] } };
		});
		// :::tabs, with ::tab{label="..."} before each panel: the same thing done more than one way. The tab buttons are
		// written here, so nothing moves when the page's script wires them (src/scripts/docs-tabs.ts); without scripts the
		// buttons are hidden and every panel shows under its label.
		let tabsOnPage = 0;
		visit(tree, 'containerDirective', (node) => {
			if (node.name !== 'tabs') return;
			const id = `tabs-${++tabsOnPage}`;
			const panels = [];
			for (const c of node.children) {
				if (c.type === 'leafDirective' && c.name === 'tab') panels.push({ label: c.attributes?.label, children: [] });
				else if (!panels.length) throw new Error(`tabs: a :::tabs block in ${vfile.path} has content before its first ::tab`);
				else panels.at(-1).children.push(c);
			}
			if (panels.length < 2 || panels.some((t) => !t.label)) throw new Error(`tabs: a :::tabs block in ${vfile.path} needs two or more ::tab{label="..."}`);
			const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
			const list = `<div class="tabs__list" role="tablist">${panels.map((t, i) => `<button type="button" role="tab" id="${id}-t${i}" aria-controls="${id}-p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(t.label)}</button>`).join('')}</div>`;
			node.data = { ...node.data, hName: 'div', hProperties: { className: ['tabs'], dataTabs: '' } };
			node.children = [
				{ type: 'html', value: list },
				...panels.map((t, i) => ({
					type: 'containerDirective',
					name: 'tab-panel',
					data: { hName: 'section', hProperties: { className: ['tabs__panel'], id: `${id}-p${i}`, role: 'tabpanel', ariaLabelledby: `${id}-t${i}`, tabIndex: 0 } },
					children: [{ type: 'paragraph', data: { hName: 'p', hProperties: { className: ['tabs__label'] } }, children: [{ type: 'text', value: t.label }] }, ...t.children],
				})),
			];
		});
		// ::site-block{name="..."}: a block the site writes itself (site-blocks.mjs).
		visit(tree, 'leafDirective', (node, index, parent) => {
			if (node.name !== 'site-block') return;
			const { lang, text } = siteBlock(node.attributes?.name);
			parent.children.splice(index, 1, { type: 'code', lang, value: text });
			return index + 1;
		});
		// Every code block on the page says how it was checked.
		if (annotate) {
			visit(tree, 'code', (node, index, parent) => {
				const where = vfile.path?.replace(/^.*src\/content\/docs\//, '') ?? 'a page';
				const entry = checkOf(node.value, where);
				// The check is of the block as decisio has it; a shell or Python block is shown with each trailing
				// comment on its own line above its command, so no line wraps in the middle of a comment.
				const shown = /^(sh|bash|shell|python|py)$/.test(node.lang ?? '') ? commentsAbove(node.value) : node.value;
				const moved = shown !== node.value;
				node.value = shown;
				parent.children.splice(index + 1, 0, { type: 'html', value: checkHtml(entry, { moved }) });
				return index + 2;
			});
		}
		// Source comments (SPDX headers, notes on site-written blocks) are not shipped.
		visit(tree, 'html', (node, index, parent) => {
			if (/^<!--[\s\S]*-->$/.test(node.value.trim())) {
				parent.children.splice(index, 1);
				return index;
			}
		});
	};
}

export { slugify };
