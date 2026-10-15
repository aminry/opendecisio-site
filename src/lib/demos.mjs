// The demos page's content, read from docs/demos/README.md at the pinned tag:
// which Decisio clips exist per demo and base, and the results sections.
import { toString } from 'mdast-util-to-string';
import { servable } from '../config/media-policy.mjs';
import { splitParagraph } from './sentences.mjs';
import { inlineHtml, inlineParts, sectionNodes, table, tree } from './upstream-content.mjs';

const FILE = 'docs/demos/README.md';
const clipOf = (html) => html.match(/\/media\/upstream\/([^"]+)\.mp4/)?.[1];

/** The opening paragraphs, under the page's title, each as paragraphs of at most three sentences. */
export function intro() {
	const title = toString(tree(FILE).children.find((n) => n.type === 'heading' && n.depth === 1));
	const nodes = sectionNodes(FILE, title);
	const end = nodes.findIndex((n) => n.type === 'heading');
	return nodes.slice(0, end === -1 ? nodes.length : end).filter((n) => n.type === 'paragraph').map((n) => inlineParts(n));
}

/** A section's blocks for a disclosure: paragraphs (at most three sentences each), ordered or plain lists, tables. */
export function sectionParts(heading) {
	return sectionNodes(FILE, heading).flatMap((n) => {
		if (n.type === 'paragraph') return inlineParts(n).map((html) => ({ kind: 'p', html }));
		if (n.type === 'list') return [{ kind: n.ordered ? 'ol' : 'ul', items: n.children.map((i) => inlineHtml(i.children[0])) }];
		if (n.type === 'table') {
			const [head, ...rows] = n.children.map((r) => r.children.map((c) => inlineHtml(c)));
			return [{ kind: 'table', head, rows }];
		}
		return [];
	});
}

/** Each demo with the clip of every base, as the "Watch it play" tables list them. */
export function clipGroups() {
	const groups = [];
	for (const index of [0, 1]) {
		const t = table(FILE, 'Watch it play', index);
		for (const row of t.rows) {
			const seen = new Set();
			const clips = row.slice(1).flatMap((cell, i) => {
				const name = clipOf(cell);
				if (!name || seen.has(name) || !servable(name)) return [];
				seen.add(name);
				return [{ name, player: t.head[i + 1].replace(/<[^>]+>/g, '') }];
			});
			if (clips.length) groups.push({ demo: row[0], clips });
		}
	}
	return groups;
}

/** A paragraph of "Watch it play" by its opening words. */
export function watchNote(startsWith) {
	const p = sectionNodes(FILE, 'Watch it play').find((n) => n.type === 'paragraph' && toString(n).startsWith(startsWith));
	if (!p) throw new Error(`demos: no paragraph starting "${startsWith}" in Watch it play`);
	return inlineHtml(p);
}

/** The Results subsections: each heading with its tables, paragraphs and lists in order. */
export function results() {
	const nodes = sectionNodes(FILE, 'Results');
	const sections = [];
	let current = { heading: null, blocks: [] };
	for (const n of nodes) {
		if (n.type === 'heading') {
			if (current.heading || current.blocks.length) sections.push(current);
			current = { heading: toString(n), blocks: [] };
		} else if (n.type === 'table') {
			const [head, ...rows] = n.children.map((r) => r.children.map((c) => inlineHtml(c)));
			current.blocks.push({ kind: 'table', head, rows });
		} else if (n.type === 'paragraph') {
			current.blocks.push({ kind: 'p', html: inlineHtml(n), parts: inlineParts(n) });
		} else if (n.type === 'list') {
			current.blocks.push({ kind: 'list', items: n.children.map((i) => inlineHtml(i.children[0])) });
		}
	}
	sections.push(current);
	return sections;
}

// The four demos, as the page's cards: which "Watch it play" clips, which Results subsection, which rows of the
// error analysis and of the renderings tested, and which oracle row each one is. A heading or label that no longer
// matches stops the build, so a changed README cannot drop a demo's numbers silently.
const DEMOS = [
	{ key: 'pong', title: 'Pong', clips: /^Pong\b/, results: /^Pong\b/, errors: /^Pong\b/, judged: /^Pong$/, renderings: /^Pong$/, line: 'Every move is checked against a perfect paddle while the ball approaches.' },
	{ key: 'driving', title: 'Driving', clips: /^Driving\b/, results: /^Driving$/, errors: /^driving\b/, judged: /^driving$/, renderings: /^driving$/, line: 'Every drive-or-stop is checked against the demo\'s own rules driver on the same snapshot.' },
	{ key: 'browser', title: 'Browser agent', clips: /^Browser agent\b/, results: /^Browser agent\b/, errors: /^browser\b/, judged: /^browser agent$/, renderings: /^browser agent$/, line: 'Every step is checked against the actions a careful user could take on two fixture tasks.' },
	{ key: 'triage', title: 'Triage', clips: /^Triage\b/, results: /^Triage\b/, errors: null, judged: /^triage$/, renderings: null, line: 'Every ticket\'s queue is checked against its true queue, before and after teaching it 200 labelled tickets.' },
];
const plainText = (html) => html.replace(/<[^>]+>/g, '').trim();
const OURS = /Gemma 4 31B/;

/** A table's rows grouped by their first cell, a blank first cell continuing the group above. */
function groupsOf(t) {
	const out = [];
	for (const row of t.rows) {
		if (plainText(row[0])) out.push({ label: plainText(row[0]), rows: [row] });
		else out.at(-1)?.rows.push(row);
	}
	return out;
}

/** One cell of a table by its row (the 31B's) and the start of its column's header. */
function cell(t, header) {
	const i = t.head.findIndex((h) => plainText(h).toLowerCase().startsWith(header.toLowerCase()));
	const row = t.rows.find((r) => OURS.test(plainText(r[0])));
	if (i < 0 || !row) throw new Error(`demos: no "${header}" cell for the Gemma 4 31B row`);
	return plainText(row[i]);
}

/** The four demo cards: clips by scene and base, a dated line, three key numbers of the 31B, and the disclosures' content. */
export function demoCards() {
	const groups = clipGroups();
	const sections = results();
	const players = sections.find((s) => s.heading === 'The players')?.blocks.find((b) => b.kind === 'table');
	if (!players) throw new Error('demos: Results has no players table');
	const ourRow = players.rows.find((r) => /Gemma 4 31B/.test(plainText(r[0])));
	const date = ourRow && plainText(ourRow[2]);
	const version = ourRow && /decisio (v[\d.]+)/.exec(plainText(ourRow[1]))?.[1];
	if (!date || !version) throw new Error('demos: the players table no longer gives the 31B\'s date and decisio version');
	const errorsNodes = sectionNodes(FILE, "Decisio's errors");
	const errors = errorsNodes.find((n) => n.type === 'table');
	const errorTable = errors && { head: errors.children[0].children.map((c) => inlineHtml(c)), rows: errors.children.slice(1).map((r) => r.children.map((c) => inlineHtml(c))) };
	const errorNotes = errorsNodes.filter((n) => n.type === 'paragraph').flatMap((n) => splitParagraph(n).map((p) => inlineHtml(p)));
	const judged = table(FILE, 'How each decision is judged');
	const rendered = table(FILE, 'Renderings tested on held-out data');
	const renderNotes = sectionNodes(FILE, 'Renderings tested on held-out data').filter((n) => n.type === 'paragraph').flatMap((n) => splitParagraph(n).map((p) => inlineHtml(p)));

	return DEMOS.map((d) => {
		const scenes = groups.filter((g) => d.clips.test(plainText(g.demo)));
		if (!scenes.length) throw new Error(`demos: no clips for ${d.title}`);
		const res = sections.find((s) => s.heading && d.results.test(s.heading));
		if (!res) throw new Error(`demos: no Results subsection for ${d.title}`);
		const t = res.blocks.find((b) => b.kind === 'table');
		const errorRows = d.errors && errorTable ? groupsOf(errorTable).filter((g) => d.errors.test(g.label)) : [];
		if (d.errors && !errorRows.length) throw new Error(`demos: no error rows for ${d.title}`);
		const oracle = judged.rows.find((r) => d.judged.test(plainText(r[0])));
		if (!oracle) throw new Error(`demos: no oracle row for ${d.title}`);
		return {
			...d,
			date,
			version,
			scenes: scenes.map((g) => ({ caption: g.demo, label: sceneLabel(d.title, g.demo), clips: g.clips })),
			minis: minisOf(d.key, t, res),
			results: { heading: res.heading, blocks: res.blocks },
			errors: errorRows.length ? { head: errorTable.head, rows: errorRows.flatMap((g) => g.rows), notes: d.key === 'browser' ? errorNotes : [] } : null,
			oracle: { head: judged.head, row: oracle },
			renderings: d.renderings ? { head: rendered.head, rows: rendered.rows.filter((r) => d.renderings.test(plainText(r[0]))), notes: renderNotes.filter((h) => new RegExp(`^The ${d.key === 'browser' ? 'browser agent' : d.title}\\b`, 'i').test(plainText(h))) } : null,
		};
	});
}

// A scene's chip: the clip group's title less the demo's name and any bracket, with a capital.
function sceneLabel(title, demo) {
	const s = plainText(demo).replace(new RegExp(`^${title},\\s*`, 'i'), '').replace(/\s*\([^)]*\)/g, '').replace(/^the\s+/i, '');
	return s.charAt(0).toUpperCase() + s.slice(1);
}

// A cell such as "85% [82, 88]" or "97.2% [95.5, 98.8]": its value and its interval, if it has one.
const valued = (text) => {
	const m = /^([^[]+?)\s*(?:\[([^\]]+)\])?$/.exec(text.trim());
	return { v: m?.[1].trim() ?? text, ci: m?.[2] ? `95% interval ${m[2].replace(/,\s*/, ' to ')}` : null };
};
const both = (a, b) => (a === b ? a : null);

/** Three key numbers of the Gemma 4 31B in a demo, from its Results table (and the subsection's own sentences). */
function minisOf(key, t, res) {
	const text = res.blocks.filter((b) => b.kind === 'p').map((b) => plainText(b.html)).join(' ');
	const ms = (pair, what) => {
		const [p50, p95] = pair.split('/').map((x) => x.trim());
		return { n: `${p50} ms`, l: `${what}, median (95th percentile ${p95} ms)` };
	};
	if (key === 'pong') {
		const agree = valued(cell(t, 'agrees with the oracle'));
		const returns = valued(cell(t, 'returns per game'));
		return [
			{ n: agree.v, l: `agree with the perfect paddle while the ball approaches (${agree.ci})` },
			{ n: returns.v, l: `returns per game (${returns.ci})` },
			ms(cell(t, 'latency p50'), 'per decision'),
		];
	}
	if (key === 'driving') {
		const passed = both(cell(t, 'lockstep: drives passed'), cell(t, 'realtime: drives passed'));
		const [errs, answers] = cell(t, 'lockstep: motion errors').split('/').map((x) => x.trim());
		if (!passed) throw new Error('demos: the 31B passed different numbers of drives in lockstep and realtime; the tile says one');
		return [
			{ n: passed, l: 'drives passed, in lockstep and in realtime' },
			{ n: errs, l: `motion errors in ${answers} answers, lockstep` },
			ms(cell(t, 'latency p50'), 'per decision in lockstep'),
		];
	}
	if (key === 'browser') {
		const done = both(cell(t, 'travel completed'), cell(t, 'reading room completed'));
		const steps = /On the (\d+) labelled steps.*?(\d+) \((\d+)%\) for Gemma 4 31B/.exec(text);
		if (!done || !steps) throw new Error('demos: the browser agent\'s 31B runs or labelled steps are no longer stated as the tiles read them');
		return [
			{ n: done.replace('/', ' of '), l: 'runs completed on each task' },
			{ n: `${steps[3]}%`, l: `of ${steps[1]} labelled steps inside the acceptable set (${steps[2]})` },
			ms(cell(t, 'latency p50'), 'per decision'),
		];
	}
	const after = valued(cell(t, 'after registering'));
	const before = valued(cell(t, 'plain question'));
	const f1 = cell(t, 'macro-F1').split('/').map((x) => x.trim());
	const took = /took ([\d.]+) s, ([\d.]+) s and ([\d.]+) s/.exec(text);
	const i = t.rows.findIndex((r) => OURS.test(plainText(r[0])));
	if (!took || i < 0 || i > 2) throw new Error('demos: triage no longer states the registration times in the table\'s order');
	return [
		{ n: after.v, l: `right after teaching it 200 labelled tickets (${after.ci}); ${before.v} before` },
		{ n: f1[1], l: `macro-F1 after teaching; ${f1[0]} before` },
		{ n: `${took[i + 1]} s`, l: 'to teach it the 200 tickets' },
	];
}
