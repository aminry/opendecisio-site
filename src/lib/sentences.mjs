// Sentences, for the docs' rule of no paragraph over three: one counter for the check (scripts/checks/docs-pattern.mjs)
// and for the split of decisio's own paragraphs (src/lib/remark-upstream.mjs), so the two agree on what a sentence is.
// A sentence ends at ".", "!" or "?" followed by a space and a capital, a digit, a quote, a bracket or code; an
// abbreviation such as "e.g." does not end one.
const END = /[.!?]["”)]?$/;
const ABBR = /\b(e\.g|i\.e|vs|etc|cf|approx|incl|no|fig)\.$/i;
const NEXT = /^["“(`A-Z0-9]/;

/**
 * The places in a text, as indexes, where a sentence ends and the next begins after the white space; `lead` and
 * `trail` are the text just before and just after it (a link or code beside it), for a sentence that ends or starts there.
 */
export function boundaries(text, lead = '', trail = '') {
	const out = [];
	for (const m of text.matchAll(/\s+/g)) {
		const before = lead + text.slice(0, m.index);
		const after = text.slice(m.index + m[0].length) + trail;
		if (END.test(before) && !ABBR.test(before) && NEXT.test(after)) out.push({ end: m.index, start: m.index + m[0].length });
	}
	return out;
}

/** How many sentences a text has. */
export const sentenceCount = (text) => {
	const t = text.replace(/\s+/g, ' ').trim();
	return t ? boundaries(t).length + 1 : 0;
};

/**
 * A Markdown paragraph (mdast) of more than three sentences as paragraphs of two or three, as even as they can be, cut
 * only where a sentence ends inside the paragraph's own text (never inside a link, emphasis or code). The words are
 * the same and in the same order.
 */
export function splitParagraph(p) {
	const plain = (n) => (n.type === 'text' || n.type === 'inlineCode' ? n.value : (n.children ?? []).map(plain).join(''));
	const units = [];
	p.children.forEach((c, i) => {
		if (c.type !== 'text') { units.push({ node: c }); return; }
		const lead = p.children.slice(0, i).map(plain).join('').slice(-3);
		const trail = p.children.slice(i + 1).map(plain).join('').slice(0, 3);
		let from = 0;
		for (const b of boundaries(c.value, lead, trail)) {
			units.push({ node: { type: 'text', value: c.value.slice(from, b.end) } }, { cut: true });
			from = b.start;
		}
		units.push({ node: { type: 'text', value: c.value.slice(from) } });
	});
	const n = units.filter((u) => u.cut).length + 1;
	if (n <= 3) return [p];
	const per = Math.ceil(n / Math.ceil(n / 3));
	const out = [];
	let cur = [];
	let count = 1;
	for (const u of units) {
		if (u.cut) {
			if (count === per) {
				out.push(cur);
				cur = [];
				count = 1;
			} else {
				cur.push({ type: 'text', value: ' ' });
				count += 1;
			}
			continue;
		}
		if (u.node.type !== 'text' || u.node.value) cur.push(u.node);
	}
	if (cur.length) out.push(cur);
	return out.map((children) => ({ type: 'paragraph', children }));
}
