// The benchmarks page's own pieces (src/pages/benchmarks.astro): its four dated tiles, the calibration error of each
// base, one line on each base read from the README's benchmark table, and the recorded demos' players, the comparison
// that left the demos page. Every number is read from its record here; a record that stops saying it stops the build.
import { BOARD_URL, refuse, stable } from './launch.mjs';
import { benchmarkRecords, benchmarks } from './home.mjs';
import { results } from './demos.mjs';
import { comparison } from './comparison.mjs';
import { baseOfName } from '../config/bases.mjs';
import { readUpstream } from './upstream.mjs';

const fail = (what) => { throw new Error(`bench-page: ${what}`); };
const plain = (html) => html.replace(/<[^>]+>/g, '').trim();
const COLUMNS = ['qwen', 'g12', 'g31'];

/** The README's benchmark table, each row by its measure, each cell by base; the head must be the three bases in this order. */
function baseTable() {
	const b = benchmarks();
	const head = b.head.slice(1).map(plain);
	if (!/^Qwen3\.6-35B-A3B$/.test(head[0]) || !/^Gemma 4 12B$/.test(head[1]) || !/^Gemma 4 31B/.test(head[2])) fail(`the README's benchmark table is no longer Qwen, 12B, 31B: ${head.join(', ')}`);
	const rows = new Map(b.accuracy.map((r) => [plain(r[0]), Object.fromEntries(COLUMNS.map((c, i) => [c, plain(r[i + 1])]))]));
	const row = (start) => [...rows.entries()].find(([k]) => k.startsWith(start))?.[1] ?? fail(`the README's benchmark table has no row "${start}"`);
	return { rows, row };
}

/** The three tiles at the top: the speed, a question on a text already read, and the calibration error. */
export function benchTiles() {
	const sp = stable('speed_same_box_2026_10_11');
	const s = Number(sp.values['decisio Gemma 4 31B']['3000'].value);
	const comp = stable('composite_v161');
	const read = /^(\d{4}-\d{2}-\d{2})/.exec(comp.date)?.[1] ?? fail('stable_claims.composite_v161 has no date');
	const [lo, hi] = comp.values.ours_interval.value;
	const cached = baseTable().row('1,000-token state, cached').g31;
	if (!/^\d+(\.\d+)? ms$/.test(cached)) fail(`the 31B's cached question is "${cached}", not a time in ms`);
	const cal = calibration().find((c) => c.base === 'g31');
	const tiles = [
		{ n: `${s.toFixed(2)} s`, text: 'for 50 questions about a 3,000-token document, Decisio 31B', date: `one box, ${sp.date}, plain layout`, href: '#many-questions' },
		{ n: cached, text: 'for one more question about a 1,000-token text already read, Gemma 4 31B on the plain layout', date: 'decisio 0.8.1, 585 W', href: '#bases' },
		{ n: cal.standard.toFixed(3), text: `calibration error of Gemma 4 31B on JevBench's standard tier, lower is better; ${cal.hard.toFixed(3)} on its hard tier`, date: tableConditions().label, href: '#confidence' },
	];
	tiles.forEach((t) => refuse(t.text));
	return { tiles, board: BOARD_URL };
}

/**
 * Where the README's benchmark table was measured: one RTX PRO 6000 Blackwell, vLLM 0.30.0 with decisio's plugin (the
 * evaluation card's "Engine" rows), on the dates of the records under its columns.
 */
export function tableConditions() {
	const card = readUpstream('EVAL_CARD.md');
	if ((card.match(/vLLM 0\.30\.0 with decisio's plugin/g) ?? []).length < 3) fail("the evaluation card no longer measures all three bases on vLLM 0.30.0 with decisio's plugin");
	const recs = Object.entries(benchmarkRecords()).filter(([k]) => k !== 'image').map(([, r]) => /^runs\/(\d{4}-\d{2}-\d{2})_/.exec(r)?.[1] ?? fail(`the record ${r} is not dated`));
	const dates = [...new Set(recs)].sort();
	return { engine: 'vLLM 0.30.0', card: 'one RTX PRO 6000', dates, label: `one RTX PRO 6000, vLLM 0.30.0, ${dates.join(' and ')}` };
}

/** Where one base's column of the table was measured: the card, the engine and its record's date. */
export function runOf(base) {
	const r = benchmarkRecords()[base] ?? fail(`no record for ${base}`);
	const date = /^runs\/(\d{4}-\d{2}-\d{2})_/.exec(r)?.[1] ?? fail(`the record ${r} is not dated`);
	tableConditions();
	return `one RTX PRO 6000, vLLM 0.30.0, ${date}`;
}

/** The calibration error (ECE) of each base on JevBench's standard and hard tiers, as the README states it. */
export function calibration() {
	const m = /^Calibration on JevBench, as ECE on the standard and hard tiers: ([\d.]+) and ([\d.]+) on the Qwen base, ([\d.]+) and ([\d.]+) on the Gemma 4 12B base, ([\d.]+) and ([\d.]+) on the Gemma 4 31B base\.$/m.exec(readUpstream('README.md'));
	if (!m) fail('the README no longer states each base\'s ECE on the standard and hard tiers');
	const v = m.slice(1).map(Number);
	return [
		{ base: 'qwen', name: 'Qwen3.6-35B-A3B', standard: v[0], hard: v[1] },
		{ base: 'g12', name: 'Gemma 4 12B', standard: v[2], hard: v[3] },
		{ base: 'g31', name: 'Gemma 4 31B', standard: v[4], hard: v[5] },
	];
}

/**
 * One line on each base, each statement checked against the README's table: the 31B the most accurate on every accuracy
 * row and the slowest to read a new text, Qwen the quickest to read one and the only base measured with images.
 */
export function baseLines() {
	const { rows, row } = baseTable();
	const nums = (cell) => cell.split('/').map((x) => Number(x.trim().replace(/[^\d.]/g, '')));
	for (const [measure, cells] of rows) {
		if (/^(Image input|New 300-token|1,000-token)/.test(measure)) continue;
		const [q, a, b] = COLUMNS.map((c) => nums(cells[c]));
		if (!b.every((x, i) => x >= q[i] && x >= a[i])) fail(`the 31B is no longer the highest on "${measure}"`);
	}
	const read = row('New 300-token state');
	const ms = (c) => Number(read[c].replace(' ms', ''));
	if (!(ms('g31') > ms('g12') && ms('g12') > ms('qwen'))) fail('the bases no longer read a new text in the order Qwen, 12B, 31B');
	const img = row('Image input');
	if (img.g12 !== 'n/m' || img.g31 !== 'n/m' || img.qwen === 'n/m') fail('image input is no longer measured on the Qwen base alone');
	return [
		{ base: 'g31', name: 'Gemma 4 31B, the default', text: 'at or above the other two on every accuracy measure in the table, and the slowest to read a new text. One NVIDIA card, measured on 96 GB and also run on an 80 GB H100, or a 64 GB Mac.' },
		{ base: 'g12', name: 'Gemma 4 12B', text: 'the smaller Gemma, for a 32 GB Mac, or a laptop with Ollama.' },
		{ base: 'qwen', name: 'Qwen3.6-35B-A3B', text: 'the quickest to read a new text, and the only one measured with images in the text.' },
	];
}

/** The README's notes under its benchmark table that a reader of the table needs: n/m, the intent heads, and the latency's conditions. */
export function tableNotes() {
	const text = readUpstream('README.md');
	const lines = ['n/m is not measured.', 'Intent heads use labelled examples, so they are not comparable with zero-shot systems.'];
	for (const l of lines) if (!text.includes(`\n${l}\n`)) fail(`the README no longer says "${l}" under its benchmark table`);
	const latency = /^Latency is server time on decisio 0\.8\.1's served defaults, at a 585 W power limit \(default 600 W\), so a card at 600 W may read new states faster/m.exec(text);
	if (!latency) fail("the README no longer gives the latency rows' conditions");
	return [...lines.map((text) => ({ text })), { text: "Latency is server time on decisio 0.8.1's served defaults, at a 585 W power limit (the default is 600 W).", source: true }];
}

/**
 * The recorded demos' players (decisio's docs/demos/README.md): the players table, with each system's model, date and
 * route, and each game's results for every player, dated. The demos page shows Decisio's own bases; the rest is here.
 */
export function demoPlayers() {
	const sections = results();
	const players = sections.find((s) => s.heading === 'The players')?.blocks.find((b) => b.kind === 'table') ?? fail('docs/demos/README.md has no players table');
	const dates = [...new Set(players.rows.map((r) => plain(r[2])))].sort();
	if (!dates.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))) fail('the players table no longer dates every row');
	const games = ['Browser agent', 'Driving', 'Pong'].map((name) => {
		const s = sections.find((x) => x.heading?.startsWith(name)) ?? fail(`docs/demos/README.md has no Results section for ${name}`);
		const t = s.blocks.find((b) => b.kind === 'table') ?? fail(`${name} has no results table`);
		return { name: s.heading, table: t };
	});
	// The table's model IDs and routes, less the padding flag, which says nothing to a reader.
	const rows = players.rows.map((r) => r.map((c) => c.replace(/ \(<code>--base [^<]*<\/code>\)/, '')));
	return { head: players.head, rows, games, dates };
}

/**
 * The Decision Index 0.2.1 value of each system in the comparison's headline (docs/comparison.md, as of 2026-10-05), in a
 * board chart's order: alphabetical, Jev last. decisio's values are our own runs; the 31B's must be the launch facts' stable
 * claim.
 */
export function indexValues() {
	const c = comparison() ?? fail('the pinned release has no docs/comparison.md');
	const row = c.headline.rows.find((r) => /Decision Index 0\.2\.1/.test(plain(r[0]))) ?? fail("the comparison's headline has no Decision Index row");
	const names = c.headline.head.slice(1).map((h) => plain(h).replace(/^decisio\s*·\s*/i, ''));
	const rows = row.slice(1).map((x, i) => {
		const value = Number(/(\d+\.\d+)/.exec(plain(x))?.[1]);
		if (!Number.isFinite(value)) fail(`the headline's ${names[i]} cell is not a number`);
		const base = baseOfName(names[i]);
		return { name: base ? `Decisio ${names[i]}` : names[i], base, jev: /^Jev\b/.test(names[i]), value };
	});
	const ours31 = rows.find((r) => /31B/.test(r.name) && r.base);
	if (!ours31 || !stable('decision_index_021').text.includes(`scored ${ours31.value.toFixed(2)}`)) fail("the comparison's Decision Index value for the 31B is not launch_facts.public.json's stable_claims.decision_index_021");
	return rows.sort((a, b) => (a.jev - b.jev) || a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
}
