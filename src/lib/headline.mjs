// The comparison's headline table, split for the page so no table scrolls:
// - `numbers`: the Decision Index, its five areas and the two JevBench rows, for
//   our three bases, Jev and the single highest open entry, each cell a number
//   (or "not compared") with its footnote letters; every qualifying phrase is a
//   lettered note under the table;
// - `systems`: the same table turned on its side for the facts that are
//   sentences (latency, price or cost, context, what it is), one row per
//   system, with the same footnote letters.
import { baseOfName } from '../config/bases.mjs';
import { comparison, markOf } from './comparison.mjs';
import { readUpstream } from './upstream.mjs';

// The longest prompt each base serves at the pinned release, from docs/cli.md's --max-model-len row: the comparison's
// context row was measured on 2026-10-05, before the Gemma bases served what the card holds, and the site documents
// the pinned release only.
function servedLength() {
	const cli = readUpstream('docs/cli.md');
	const head = /^\| Flag \| `qwen3\.6-35b-a3b` \| `gemma-4-12b` \| `gemma-4-31b` \|/m.test(cli);
	const row = /^\| `--max-model-len` \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/m.exec(cli);
	if (!head || !row) throw new Error("headline: docs/cli.md no longer gives --max-model-len per base in its flags table");
	const say = (v) => {
		const t = v.trim().replace(/(\d)(\d{3})\b/g, '$1,$2');
		return /^[\d,]+$/.test(t) ? `${t} tokens per prompt` : `${t} tokens per prompt`.replace(/^the largest that fits the card, /, 'the largest the card holds, ');
	};
	return { 'qwen3.6-35b-a3b': say(row[1]), 'gemma-4-12b': say(row[2]), 'gemma-4-31b': say(row[3]) };
}

const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&#x26;/g, '&').replace(/&#x27;|&#39;/g, "'").trim();
const ours = (head) => baseOfName(plain(head).replace(/^decisio\s*·\s*/i, ''));
const isJev = (head) => /^Jev\b/.test(plain(head));
// The facts that are sentences, not scores; everything else in the headline is a number.
const SIDE = /^(Latency|Price or self-hosting cost|Context length|What it is)\b/;

/** A cell reduced to its quantity and its footnote letters. */
function quantity(html, extra) {
	const text = plain(html);
	const letters = [...text.matchAll(/\(([a-z])\)/g)].map((m) => m[1]);
	if (/not compared/.test(text)) return { text: 'not compared', letters };
	const n = text.match(/^\$?\d[\d,]*(?:\.\d+)?(?:\s?(?:ms|%))?(?: of [\d,]+)?/);
	if (n) return { text: n[0], letters };
	// A qualifier with no number ("not on JevBench's board") becomes its own note.
	return { text: 'not compared', letters: [extra(text)] };
}

export function headline() {
	const c = comparison();
	if (!c) return undefined;
	const { head, rows } = c.headline;
	const noteLetters = c.notes.map((n) => plain(n).match(/^\(([a-z])\)/)?.[1]).filter(Boolean);
	const added = [];
	const extra = (phrase) => {
		const sentence = phrase.charAt(0).toUpperCase() + phrase.slice(1) + '.';
		let found = added.find((a) => a.sentence === sentence);
		if (!found) {
			const last = [...noteLetters, ...added.map((a) => a.letter)].sort().pop() ?? '`';
			found = { letter: String.fromCharCode(last.charCodeAt(0) + 1), sentence };
			added.push(found);
		}
		return found.letter;
	};

	const numberRows = rows.filter((r) => !SIDE.test(plain(r[0])));
	const sideRows = rows.filter((r) => SIDE.test(plain(r[0])));
	const index = numberRows.find((r) => /^Decision Index/.test(plain(r[0])));
	if (!index || sideRows.length !== 4) throw new Error('headline: the comparison headline no longer has its index row and its four fact rows; revisit src/lib/headline.mjs');

	// Columns: ours, Jev, and of the other entries the one with the highest index.
	const cols = head.map((h, i) => ({ i, head: h, base: ours(h), jev: isJev(h) })).slice(1);
	const open = cols.filter((c) => !c.base && !c.jev);
	const best = open.reduce((a, b) => (parseFloat(plain(index[b.i])) > parseFloat(plain(index[a.i])) ? b : a));
	const keep = cols.filter((c) => c.base || c.jev || c === best);

	const numbers = {
		head: [head[0], ...keep.map((c) => c.head)],
		columns: keep.map((c) => ({ base: c.base, jev: c.jev, best: c === best })),
		rows: numberRows.map((r) => ({
			label: r[0],
			cells: keep.map((c) => {
				const { mark } = markOf(r[c.i]);
				return { ...quantity(markOf(r[c.i]).value, extra), mark };
			}),
		})),
	};

	const systems = {
		facts: sideRows.map((r) => r[0]),
		rows: cols.map((c) => ({
			name: c.head,
			base: c.base,
			cells: sideRows.map((r) => {
				const label = plain(r[0]);
				// Latency and price are quantities; context and what it is are sentences.
				if (/^(Latency|Price)/.test(label)) return { ...quantity(r[c.i], extra) };
				if (/^Context length/.test(label) && c.base) return { html: servedLength()[c.base] ?? r[c.i] };
				return { html: r[c.i] };
			}),
		})),
	};

	return { numbers, systems, notes: c.notes, added, best: best.head };
}
