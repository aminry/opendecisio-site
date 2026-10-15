// "Where Jev leads", as decisio's evaluation card (section 8.1) states it: the
// table of Jev's board values beside the bases' self-runs, the board field each
// Jev value is read from, and the card's own sentences for the page.
import { toString } from 'mdast-util-to-string';
import { findHeading, inlineHtml, sectionNodes } from './upstream-content.mjs';

const FILE = 'EVAL_CARD.md';

export function jevFromCard() {
	const heading = findHeading(FILE, /Where Jev leads/);
	if (!heading) return undefined;
	const nodes = sectionNodes(FILE, heading);
	const table = nodes.find((n) => n.type === 'table');
	const paragraphs = nodes.filter((n) => n.type === 'paragraph');
	const [intro, notes] = [paragraphs[0], paragraphs[1]];
	if (!table || !notes) throw new Error(`jev: EVAL_CARD "${heading}" no longer has its table and notes; revisit src/lib/jev.mjs`);

	// One sentence per line in the card; each line keeps its links and code.
	const text = toString(notes);
	const lines = inlineHtml(notes).split('\n');
	const line = (start) => {
		const i = text.split('\n').findIndex((l) => l.startsWith(start));
		if (i === -1) throw new Error(`jev: EVAL_CARD "${heading}" has no sentence starting "${start}"; revisit src/lib/jev.mjs`);
		return lines[i];
	};

	// The named field behind each Jev value, and GPQA Diamond's count.
	const field = text.match(/Each is the board's (\S+) \(GPQA Diamond id (\d+): ([\d.]+); MMLU-Pro id (\d+): [\d.]+\)/);
	const count = text.match(/its raw ([\d.]+) \((\d+) of (\d+)\)/);
	if (!field || !count) throw new Error(`jev: EVAL_CARD "${heading}" no longer names the board field in the expected words; revisit src/lib/jev.mjs`);
	const [, name, gpqaId, gpqaRaw, mmluId] = field;
	const fieldFor = {
		'GPQA Diamond': { field: name.replace('[id]', `['${gpqaId}']`), detail: `${gpqaRaw}, ${count[2]} of ${count[3]} scored` },
		'MMLU-Pro': { field: name.replace('[id]', `['${mmluId}']`) },
	};

	const [head, ...rows] = table.children.map((r) => r.children.map((c) => inlineHtml(c)));
	return {
		heading,
		intro: inlineHtml(intro),
		head,
		rows,
		fieldFor,
		quoted: line("Jev's values are quoted"),
		boardShows: line('The board file holds a second Jev value'),
	};
}
