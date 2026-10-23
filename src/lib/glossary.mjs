// The docs' glossary (docs/STYLE_GUIDE.md, "The glossary"): the few words that keep a meaning of their own here, in plain
// terms. The glossary page renders them, each with its own anchor, and a docs page links a word's first use in its prose
// to that anchor (linkFirstUses, run by src/lib/remark-upstream.mjs).
import GithubSlugger from 'github-slugger';
import { visitParents } from 'unist-util-visit-parents';

// word, what it means, and the forms a page may use (matched whole, in any case). `link: false` keeps a word too common
// to help a reader as a link on every page off the automatic links.
export const GLOSSARY = [
	{ word: 'text', means: "what you ask about, sent in the request's `state` field", link: false },
	{ word: 'question', means: 'what you ask about a text, with its options', forms: ['questions'] },
	{ word: 'option', means: 'one possible answer to a question', forms: ['options'] },
	{ word: 'probability', means: "the number decisio gives each option; a question's probabilities add up to 1", forms: ['probabilities'] },
	{ word: 'top probability', means: 'the probability of the likeliest option; certificates and thresholds use it' },
	{ word: 'yes/no question', means: 'a question with two options, yes and no, whose answer is the probability of yes; the wire format calls its type `noul`', forms: ['yes/no questions'] },
	{ word: 'task', means: 'a question you ask again and again, taught from your labelled examples', forms: ['tasks'] },
	{ word: 'intent head', means: 'a small layer a task can learn from your examples, for a question with many options; the model itself does not change', forms: ['intent heads'] },
	{ word: 'calibration error', means: 'the average gap between the probability an answer states and how often answers like it were right; lower is better' },
	{ word: 'error target', means: 'the share of certified answers you allow to be wrong', forms: ['error rate'] },
	{ word: 'certified answer', means: 'an answer decisio stands behind at your error target', forms: ['certified answers'] },
	{ word: 'threshold', means: 'the top probability at or above which answers are certified', forms: ['thresholds'] },
	{ word: 'drift', means: 'traffic moving away from the examples a task was certified on' },
	{ word: 'base', means: 'the model decisio serves; Gemma 4 31B by default', link: false },
	{ word: 'abstain', means: 'decisio declines to answer when no option is likely enough', forms: ['abstains', 'abstention'] },
	{ word: 'prompt layout', means: "how the server writes a request into the model's prompt: the header layout lists the request's questions before the text (the Gemma models' default), the plain layout writes the text, then the question", forms: ['header layout', 'plain layout'] },
	{ word: 'serving setup', means: 'the model, the engine, the GPU and the settings a certificate was made on' },
	{ word: 'CPU stand-in', means: 'a small model decisio serves on any machine for development, with every route of the real server; its answers are not the default model\'s' },
];

export const anchorOf = (word) => new GithubSlugger().slug(word);

/** The glossary's terms with their anchors, in order. */
export const glossaryTerms = () => GLOSSARY.map((g) => ({ ...g, anchor: anchorOf(g.word) }));

/**
 * Links the first use of each glossary word in a page's prose (paragraphs, list items and table cells; never a heading,
 * a link, code or a figure) to its anchor on the glossary page. Longer words are matched first, so "top probability"
 * wins over "probability" where both could start.
 */
export function linkFirstUses(tree) {
	const terms = glossaryTerms().filter((g) => g.link !== false)
		.flatMap((g) => [g.word, ...(g.forms ?? [])].map((f) => ({ form: f, anchor: g.anchor })))
		.sort((a, b) => b.form.length - a.form.length);
	const esc = (t) => t.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
	const re = terms.map((t) => ({ ...t, re: new RegExp(`(^|[^\\w/-])(${esc(t.form)})(?![\\w/-])`, 'i') }));
	// The text nodes of the page's prose, in document order, with their parents.
	const prose = [];
	visitParents(tree, 'text', (node, ancestors) => {
		if (ancestors.some((a) => ['heading', 'link', 'linkReference', 'inlineCode', 'code', 'html', 'leafDirective', 'containerDirective', 'textDirective'].includes(a.type))) return;
		if (!ancestors.some((a) => ['paragraph', 'listItem', 'tableCell'].includes(a.type))) return;
		prose.push({ node, parent: ancestors.at(-1) });
	});
	const done = new Set();
	for (const { node, parent } of prose) {
		let rest = node;
		const out = [];
		for (;;) {
			let best = null;
			for (const t of re) {
				if (done.has(t.anchor)) continue;
				const m = t.re.exec(rest.value);
				if (m && (!best || m.index + m[1].length < best.at)) best = { t, at: m.index + m[1].length, len: m[2].length };
			}
			if (!best) break;
			done.add(best.t.anchor);
			const before = rest.value.slice(0, best.at);
			if (before) out.push({ type: 'text', value: before });
			out.push({ type: 'link', url: `/docs/glossary/#${best.t.anchor}`, data: { hProperties: { className: ['gloss'] } }, children: [{ type: 'text', value: rest.value.slice(best.at, best.at + best.len) }] });
			rest = { type: 'text', value: rest.value.slice(best.at + best.len) };
		}
		if (!out.length) continue;
		if (rest.value) out.push(rest);
		const i = parent.children.indexOf(node);
		parent.children.splice(i, 1, ...out);
	}
}
