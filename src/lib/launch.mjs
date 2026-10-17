// What the site says about JevBench, read from the launch facts (launch_facts.public.json)
// (src/data/launch/launch_facts.public.json: the part of the launch facts that the
// site reads, schema launch_facts/1). Every number and
// every claim on the home page's hero and chart and on the benchmarks page's
// JevBench section comes through here:
// - a claim is made only if its "holds" is true in the file, and only in the
//   words the file allows; the words the file forbids are refused;
// - a row is read by key, and the build stops if the file's shape or a row's
//   name is not what this module reads.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { guidanceFor } from './home.mjs';
import { readUpstream, siteRoot } from './upstream.mjs';

/** The public board's JevBench leaderboard. */
export const BOARD_URL = 'https://benchmarkheaven.com/jev-models';

let memo;
export function facts() {
	if (!memo) memo = JSON.parse(readFileSync(join(siteRoot, 'src/data/launch/launch_facts.public.json'), 'utf8'));
	if (memo.schema !== 'launch_facts/1') throw new Error(`launch: launch_facts.public.json has schema ${memo.schema}, not launch_facts/1; revisit src/lib/launch.mjs`);
	return memo;
}

const need = (cond, what) => {
	if (!cond) throw new Error(`launch: launch_facts.public.json ${what}; revisit src/lib/launch.mjs`);
};

// The rows the site draws, in the file's keys, with the short name the site gives each and its colour class.
const ROWS = [
	{ id: 'h2o', name: 'H2O-Lightning-4B', match: /H2O-Lightning-4B/ },
	{ id: '31b', name: 'decisio, Gemma 4 31B, v0.8.0', match: /decisio v0\.8\.0 on gemma-4-31B/i, base: 'base-g31', ours: true },
	{ id: 'jev', name: 'Jev 1.13.0', match: /^Jev 1\.13\.0/ },
	{ id: 'quyet', name: 'Quyet-1.0-Large', match: /Quyet-1\.0-Large/ },
	{ id: 'deck31b', name: 'deck-31B', match: /^deck-31B/ },
	{ id: '12b_v080', name: 'decisio, Gemma 4 12B, v0.8.0', match: /decisio v0\.8\.0 on gemma-4-12B/i, base: 'base-g12', ours: true },
	{ id: '12b_v090', name: 'decisio, Gemma 4 12B, v0.9.0', match: /decisio v0\.9\.0 on gemma-4-12B/i, base: 'base-g12', ours: true },
];

const num = (x) => x.value;

/** The sources' entry for the board's file, whatever the file calls it. */
export function boardSource() {
	const s = facts().sources;
	return s.jevbench_artifact ?? s['jevbench_v1.6.1'];
}

/**
 * A stable claim (launch_facts.public.json stable_claims): a dated measurement or a fact about Decisio that stands in for
 * a rank or a comparison (Amin, 2026-10-15: no ordinal rank and no relative comparison in public). Its text is used as
 * the file gives it; its values are there to format a number the same way.
 */
export function stable(id) {
	const c = (facts().stable_claims?.claims ?? []).find((x) => x.id === id);
	need(c?.text, `has no stable claim ${id} with a text`);
	return c;
}

// Rows in alphabetical order, as the board charts are drawn, with Jev 1.13.0 last as the reference row: no order by score
// (decided 2026-10-15).
const byName = (name, isRef) => (a, b) => (isRef(a) - isRef(b)) || name(a).localeCompare(name(b), 'en', { sensitivity: 'base' });

export function jevbench() {
	const f = facts();
	const board = f.board;
	need(num(board.revision), 'has no board revision');
	const rows = ROWS.map((r) => {
		const row = f.rows[r.id];
		need(row, `has no row ${r.id}`);
		need(r.match.test(num(row.display)), `row ${r.id} is no longer "${num(row.display)}" as the site names it`);
		return {
			...r,
			key: row.key,
			display: num(row.display),
			score: num(row.score_A),
			lo: num(row.ci95_A_low),
			hi: num(row.ci95_A_high),
			answered: num(row.answered_ok),
			of: num(row.rows),
			measured: num(row.last_measured_on),
			iOpen: num(row.intelligence.I_open),
			iSealed: num(row.intelligence.I_sealed),
		};
	}).sort(byName((r) => r.name, (r) => r.id === 'jev'));
	const claims = f.claims;
	const ours = rows.find((r) => r.id === '31b');
	const jev = rows.find((r) => r.id === 'jev');
	const overlaps = (a, b) => a.lo <= b.hi && b.lo <= a.hi;

	// The rows and what their intervals say; no rank is made from them (decided 2026-10-15).
	return {
		revision: num(board.revision),
		sha256: board.revision.sha256,
		rows,
		ours,
		jev,
		claims,
		forbidden: claims.forbidden_words,
		rules: f.rules,
		fileSha256: board.revision.sha256,
		overlaps: rows.filter((r) => r !== ours && overlaps(ours, r)).map((r) => r.name),
		clear: rows.filter((r) => r !== ours && !overlaps(ours, r)).map((r) => r.name),
	};
}

function cap(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

// Words the site refuses beside the file's own list (decided 2026-10-09): H2O's interval overlaps ours, so
// nothing may suggest a margin or nearness to first, and the ranking is of open-weights systems, never "open source".
const EXTRA_FORBIDDEN = ['nearly', 'almost', 'close to first', 'open source'];

/** Stop on any of the words the file forbids, and the site's own, as whole words. */
export function refuse(text) {
	const f = facts();
	for (const w of [...f.claims.forbidden_words, ...EXTRA_FORBIDDEN]) {
		if (new RegExp(`(^|[^\\w])${w.replace(/[.*+?^${}()|[\]\\#]/g, '\\$&')}([^\\w]|$)`, 'i').test(text)) throw new Error(`launch: "${text}" uses "${w}", which the launch rules forbid`);
	}
	return text;
}

export const fixed = (n, d = 2) => n.toFixed(d);

const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;

/**
 * The routing record of example 5 (session A), as the launch facts (launch_facts.public.json) carries it:
 * the rows of its table and the words of its caption, every number from the file.
 */
export function routing() {
	const r = facts().figures?.routing_example5;
	need(r && r.record && r.thresholds && r.questions, 'has no figures.routing_example5');
	const n = num(r.questions);
	const t = (k) => {
		const x = r.thresholds[k];
		need(x, `has no routing threshold ${k}`);
		return {
			threshold: x.threshold,
			escalated: num(x.escalated),
			share: num(x.escalated_share),
			accuracy: num(x.accuracy_on_the_rest),
			lo: num(x.accuracy_on_the_rest_ci95_low),
			hi: num(x.accuracy_on_the_rest_ci95_high),
			confident: num(x.confidently_wrong),
			wrongEscalated: num(x.wrong_answers_escalated),
			wrong: num(x.wrong_answers_total),
		};
	};
	const wrong = num(r.wrong_answers_total);
	const rows = [
		{ rule: 'No escalation', escalated: '0', share: '0.0%', accuracy: pct(num(r.accuracy_all)), interval: null, confident: `${wrong}`, caught: `0 of ${wrong}` },
		...['0.8', '0.9'].map((k) => {
			const x = t(k);
			return { rule: `Keep at ${x.threshold} or more`, escalated: `${x.escalated}`, share: pct(x.share), accuracy: pct(x.accuracy), interval: `${pct(x.lo)} to ${pct(x.hi)}`, confident: `${x.confident}`, caught: `${x.wrongEscalated} of ${x.wrong}` };
		}),
	];
	const rec = r.record;
	// One caption, in the record's facts: the data set and its caveat, the release, the base, the card and the date.
	const split = rec.what.match(/ARC-Challenge test split/)?.[0];
	const base = rec.what.match(/Gemma 4 31B/)?.[0];
	need(split && base, 'has a routing record that is no longer of ARC-Challenge on Gemma 4 31B');
	const caption = `${split}, a public benchmark the model may have seen; decisio ${rec.decisio_version} on ${base}, one ${rec.card.replace(/ Workstation Edition$/, '')} at ${rec.power_limit_w} W, recorded ${rec.date}.`;
	refuse(caption);
	return { questions: n, rows, caption, captionText: `Example 5, Escalate only when unsure: ${caption}`, note: r.note, sweep: r.sweep };
}

export const need2 = (cond, what) => {
	if (!cond) throw new Error(`launch: launch_facts.public.json ${what}; revisit src/lib/launch.mjs`);
};

/** The ten open-weights systems the home chart draws, in alphabetical order, then Jev as a reference row. */
export function openRows() {
	const w = facts().figures?.open_weights_rows;
	need2(w && Array.isArray(w.rows), 'has no figures.open_weights_rows');
	return w.rows.map((r) => ({
		key: r.key,
		label: r.label,
		ours: r.is_ours,
		jev: r.is_jev,
		score: r.score_A.value,
		lo: r.ci95_A_low.value,
		hi: r.ci95_A_high.value,
		base: r.is_ours ? (/12B/.test(r.label) ? 'base-g12' : 'base-g31') : undefined,
	})).sort(byName((r) => r.label, (r) => r.jev));
}

/**
 * "JevBench, axis by axis", from launch_facts.public.json's figures.axes_table : the picture's alt text, every
 * printed value (the table behind the chart, in alphabetical order), and the bullets, the launch facts' stable claims checked
 * against the table's values.
 */
export function axesFigure() {
	const f = facts();
	const t = f.figures?.axes_table;
	need2(t && t.rows && t.columns && t.alt_text, 'has no figures.axes_table');
	const h = f.head_to_head;
	need2(h.jev.composite_intervals_overlap && h.h2o.composite_intervals_overlap && h.quyet.composite_intervals_overlap, 'has composite intervals that do not all overlap, which the page says they do');
	const ours = t.rows.find((r) => r.is_decisio_31b);
	const jev = t.rows.find((r) => /^Jev 1\.13\.0/.test(r.label));
	need2(ours && jev, 'has an axes_table without decisio 31B or Jev 1.13.0');
	const printed = (r, c) => r.cells[c].printed;
	// The measured values, as the launch facts' stable claims state them; no rank (decided 2026-10-15).
	const bullets = [stable('sealed_v161').text, 'The sealed set was never published.', stable('axes_v161').text, 'On your own hardware you pay for the card, not per token.'];
	need2(stable('axes_v161').text.includes(printed(ours, 'intelligence')) && stable('sealed_v161').text.includes(printed(ours, 'sealed')), 'has stable claims whose values differ from the axes table\'s');
	bullets.forEach(refuse);
	return {
		// The redrawn picture's alt text (alphabetical, plain values), else the earlier one.
		alt: t.public?.alt_text ?? t.alt_text,
		columns: t.columns.map((c) => ({ id: c.id, name: c.name, tagline: c.tagline })),
		rows: t.rows.map((r) => ({ key: r.key, label: r.label, ours: r.is_decisio, jev: r === jev, cells: t.columns.map((c) => ({ text: printed(r, c.id) })) })).sort(byName((r) => r.label, (r) => r.jev)),
		bullets,
		note: t.no_intervals_note,
		versionNote: t.version_note,
	};
}

/**
 * The five "Why Decisio" lines, from the decisio README's block (decisio's why_decisio.py) but for the third, each made only
 * if launch_facts.public.json says it: the Jev comparisons are head_to_head.jev's own wording, the card quote is the card's.
 */
export function whyDecisio() {
	const f = facts();
	const h = f.head_to_head;
	const jr = h.jev.rows;
	// The README's measured line for the default base: its row on several questions in one request.
	const row = readUpstream('README.md').split('\n').find((l) => l.startsWith('| Several questions in one request |'));
	const base31 = row?.split('|').slice(1, -1)[3] ?? '';
	const [, within] = /the same choice as one engine call per question on every item measured, probabilities within ([0-9.]+)/.exec(base31) ?? [];
	need2(within, 'has a README row on several questions in one request that no longer gives the default base\'s measured agreement');
	const [, tokens] = /([\d,]+) tokens/.exec(h.ours.stated_longest_state.quote) ?? [];
	const [, options] = /(\d+) options/.exec(h.ours.stated_option_limit.quote) ?? [];
	need2(tokens && options, 'has no prompt length or option limit in the card statements');
	const items = [
		{ title: 'Intelligence, JevBench v1.6.1', text: `Decisio 31B scored ${jr.intelligence.printed_ours} and Jev 1.13.0 ${jr.intelligence.printed_theirs}.` },
		{ title: 'The sealed questions', text: `${stable('sealed_v161').text} The sealed set was never published.` },
		{ title: 'Many questions, one read', text: `Every question in a request is scored from one read of your text: the same choice as one question at a time on every item measured, probabilities within ${within}.` },
		{ title: 'Long prompts, many options', text: `Prompts up to ${tokens} tokens and ${options} options per question.` },
		{ title: 'Your hardware, no per-token bill', text: 'It runs on your own GPU, Mac or laptop; the cost is the card, not a bill per token.' },
	];
	items.forEach((i) => { refuse(i.title); refuse(i.text); });
	return items;
}

/**
 * "Many questions about one document": the same-box speed measurement of 2026-10-11, from
 * launch_facts.public.json's figures.same_box_speed, the primary speed figures. The home page shows the linear chart
 * of the 50-question medians, /benchmarks the log detail chart (1, 10 and 50 questions, this session's five
 * systems as dots, the earlier box's five as hollow rings); each chart is the unchanged chart file, checked
 * by sha256 against the file, with the file's alt text. The sentences are the file's, in the file's words: each
 * must hold and say the numbers the file's own data gives. The figures.many_questions grid (2026-10-09, other
 * clocks) is history and is not quoted.
 */
const SAME_BOX = {
	linear: { name: 'many-questions-linear', light: 'speed_50q_light.svg', dark: 'speed_50q_dark.svg' },
	log: { name: 'many-questions-log', light: 'grid_report/many_questions_light.svg', dark: 'grid_report/many_questions_dark.svg' },
};

/**
 * Jeff's and Quyet's multiples of Decisio 31B's time at 3,000 and 6,000 tokens, said as "about N times" (the two within 4
 * percent of N), with the seconds they are made of and the session's date, from the speed claim's own values.
 */
export function speedRatios() {
	const m = facts().figures.same_box_speed;
	const r = m.ratios_to_decisio_31b;
	const about = (k) => {
		const vs = ['Jeff-1.0-Large', 'Quyet-1.0-Large'].map((sys) => r[sys][k].value);
		const n = Math.round(vs.reduce((a, b) => a + b, 0) / vs.length);
		need2(vs.every((x) => Math.abs(x / n - 1) <= 0.04), `has ratios at ${k} tokens that are not both about ${n} times`);
		return n;
	};
	const sp = stable('speed_same_box_2026_10_11');
	const sec = (sys, k) => Number(sp.values[sys][k].value ?? sp.values[sys][k]);
	const seconds = Object.fromEntries(['3000', '6000'].map((k) => [k, { decisio: sec('decisio Gemma 4 31B', k), jeff: sec('Jeff-1.0-Large', k), quyet: sec('Quyet-1.0-Large', k) }]));
	return { times: about('3000'), times6000: about('6000'), seconds, date: sp.date };
}

/**
 * The Gemma 4 31B's measured totals for questions about one 3,000-token document, for the figures that draw how a
 * request's questions are answered: one question on a new document (read included), and fifty in one request (one
 * read, then the questions scored together in one batch, the 31B's default `--multi-question warm`), from the same-box
 * session; and, separately, the range of a later request on a document already read, from the cache, with its own
 * session's conditions. No time per question is given, because none was measured in the batch.
 */
export function batchTotals() {
	const f = facts().figures;
	const sys = f.same_box_speed.systems[0];
	const one = sys.first_question_ms?.['3000'];
	const fifty = sys.cells50?.['3000']?.seconds?.value;
	const alone = f.latency_on_read_document?.the_31b_alone;
	need2(/31B/.test(sys.system) && one && fifty && alone?.low_ms && alone?.high_ms, 'has no 31B totals at 3,000 tokens or per-question range on a read document');
	const sp = stable('speed_same_box_2026_10_11');
	return {
		one,
		fiftyMs: Math.round(fifty * 1000),
		fifty: `${fifty.toFixed(2)} s`,
		follow: `${Math.round(alone.low_ms)} to ${Math.round(alone.high_ms)} ms`,
		followHigh: alone.high_ms,
		date: sp.date,
		followWhen: (() => {
			const c = f.latency_on_read_document?.conditions ?? '';
			const w = /(\d+) W/.exec(c)?.[1];
			const v = /decisio (\d+\.\d+\.\d+)/.exec(c)?.[1];
			need2(w && v, 'has no card power or decisio version in latency_on_read_document.conditions');
			return `decisio ${v}, one RTX PRO 6000 at ${w} W`;
		})(),
	};
}

export const DI_BOARD = 'https://huggingface.co/spaces/multimodalart/jev-decision-index';

/**
 * The rows the Decision Index board lists for decisio, from the launch facts' stable claim decision_index_board_03: its sentence
 * as the file gives it, the rows' two figures (the public index and Decision Index 0.3), and the date of the board's
 * data file. Listed, not validated: the data file marks no row validated, and the submission PRs closed unmerged.
 */
export function decisionIndexBoard() {
	const c = stable('decision_index_board_03');
	const val = (x) => Number(x?.value ?? x);
	const rows = (c.values?.rows ?? []).map((r) => ({ name: r.name, pub: val(r.public_index), v03: val(r.edition_03) }));
	const ours = rows.find((r) => /Gemma 4 31B/.test(r.name));
	const date = /^\d{4}-\d{2}-\d{2}/.exec(c.date ?? '')?.[0];
	need2(ours && date && c.values?.label, 'has a decision_index_board_03 claim without the 31B row, its date or the board\'s version');
	for (const r of rows) need2(c.text.includes(r.pub.toFixed(2)) && c.text.includes(r.v03.toFixed(2)), `has a decision_index_board_03 text whose figures differ from its row ${r.name}`);
	need2(/listed on the Decision Index board/.test(c.text) && !/validat/i.test(c.text), 'has a decision_index_board_03 text that no longer says the rows are listed, or says validated');
	refuse(c.text);
	// The submissions, as pull requests on GitHub, each closed without merging; the maintainer took the rows in.
	const prs = Object.entries(c.submission?.pull_requests ?? {}).map(([name, p]) => {
		const [repo, n] = name.split('#');
		need2(p.state === 'closed' && p.merged_on_github === false, `has a submission ${name} that is not closed unmerged, as the page says`);
		return { name, url: `https://github.com/${repo}/pull/${n}` };
	});
	return { text: c.text, date, version: c.values.label, link: c.link ?? DI_BOARD, prs, rows, ours };
}

/**
 * The benchmarks page's four tiles, each a measured value with its date and source, from the launch facts' stable claims: the
 * JevBench composite and the sealed questions (the home page's proof cards, beside Jev 1.13.0's), the Decision Index
 * board's row, and the same-box time for 50 questions. No rank.
 */
export function benchStats() {
	const p = proofCards();
	const di = decisionIndexBoard();
	const sp = speedRatios();
	const s = sp.seconds['3000'];
	const sec = (x) => `${x.toFixed(x < 10 ? 2 : 1)} s`;
	const board = "JevBench's file, October 2026";
	const tiles = [
		{ ...p.cards[0], date: board, href: BOARD_URL },
		{ ...p.cards[2], date: board, href: BOARD_URL },
		{ n: di.ours.pub, dec: 2, final: di.ours.pub.toFixed(2), suffix: '', text: `public index of decisio 0.6.0 (Gemma 4 31B), listed on the Decision Index board; ${di.ours.v03.toFixed(2)} on the edition 0.3 index`, date: `${di.version}, data file of ${di.date}`, href: di.link },
		{ n: s.decisio, dec: 2, final: s.decisio.toFixed(2), suffix: ' s', text: `for 50 questions about a 3,000-token document on Decisio 31B; Jeff-1.0-Large ${sec(s.jeff)}, Quyet-1.0-Large ${sec(s.quyet)}`, date: `one box, ${sp.date}`, href: '#many-questions' },
	];
	tiles.forEach((t) => refuse(t.text));
	return tiles;
}

export function manyQuestions(kind) {
	const m = facts().figures?.same_box_speed;
	need2(m && m.allowed_sentences && m.charts && m.ratios_to_decisio_31b, 'has no figures.same_box_speed');
	// Three sentences: the measured times, as the launch facts' stable claim states them with their box and date; the ratio beside
	// them (Amin, 2026-10-15: the speed ratio stays, beside its two measured times and its date); and the first question.
	const ids = ['first_question_3000'];
	const first = m.allowed_sentences.find((x) => x.id === ids[0]);
	need2(first && first.holds === true && first.text, 'has no same_box_speed sentence first_question_3000 that holds');
	const { times, times6000 } = speedRatios();
	const sentences = [`${stable('speed_same_box_2026_10_11').text} That is about ${times} times (3,000 tokens) and ${times6000} times (6,000 tokens) as long for Jeff-1.0-Large and Quyet-1.0-Large as for Decisio 31B.`, first.text];
	sentences.forEach(refuse);
	// The comparison's "about 44 times" and "66 times" must still be what the ratios say, within the file's 4 percent.
	const r = m.ratios_to_decisio_31b;
	for (const sys of ['Jeff-1.0-Large', 'Quyet-1.0-Large']) {
		need2(Math.abs(r[sys]['3000'].value / 44 - 1) <= 0.04 && Math.abs(r[sys]['6000'].value / 66 - 1) <= 0.04, `has a ratio for ${sys} that is no longer about 44 and 66 times`);
	}
	const sha = (file) => createHash('sha256').update(readFileSync(join(siteRoot, 'public/launch', file))).digest('hex');
	const charts = Object.fromEntries(Object.entries(SAME_BOX).map(([k, c]) => {
		const out = {};
		for (const theme of ['light', 'dark']) {
			const rec = m.charts[c[theme]];
			need2(rec && rec.alt_text, `has no same_box_speed chart ${c[theme]} with alt text`);
			const file = `${c.name}${theme === 'dark' ? '-dark' : ''}.svg`;
			need2(sha(file) === rec.sha256, `has a same_box_speed chart ${c[theme]} whose sha256 is not the file of public/launch/${file}`);
			out[theme] = rec;
		}
		need2(out.light.alt_text === out.dark.alt_text, `has light and dark ${k} charts with different alt text`);
		return [k, { name: c.name, alt: out.light.alt_text }];
	}));
	need2(kind in charts, `asks for the chart ${kind}, which is not linear or log`);
	// What the sentences rest on, in the file's own words, kept beside them.
	const conditions = m.allowed_sentences.find((x) => x.id === 'decisio_50_questions_seconds')?.conditions;
	need2(conditions, 'has no conditions for the same_box_speed sentences');
	const qualifiers = [`${conditions[0].toUpperCase()}${conditions.slice(1)}.`];
	// The log chart also carries the earlier box's five systems, as hollow rings: its alt text says so, and so does the caption.
	if (kind === 'log') {
		const rings = /Five systems were measured in one session[^.]*hollow rings\./.exec(charts.log.alt)?.[0];
		need2(rings, 'has a log chart whose alt text no longer says which systems are hollow rings');
		qualifiers.push(`This chart: ${rings[0].toLowerCase()}${rings.slice(1)}`);
	}
	qualifiers.forEach(refuse);
	return { sentences, qualifiers, chart: charts[kind], box: m.box.labelled.split(' on ')[0].replace(/^./, (c) => c.toUpperCase()) };
}

/**
 * The recorded decisions the home page's live demo plays, from launch_facts.public.json's figures.recorded_decisions (from
 * decisio-examples' runs of 2026-10-08): the first records of four runs, taken as they came, each with its request's
 * text, every question's recorded probabilities and the server time the record kept. The build stops if a record is
 * malformed or its probabilities do not add up to one.
 */
export function recordedExamples() {
	const r = facts().figures?.recorded_decisions;
	need2(r?.source?.commit && r.source.files?.length && r.run?.decisio_version && r.box_label?.value && r.items?.length >= 12, 'has no figures.recorded_decisions with its source, run, box label and at least twelve records');
	for (const f of r.source.files) need2(/^[0-9a-f]{64}$/.test(f.sha256 ?? ''), `has a recorded run (${f.path ?? f.file}) without its sha256`);
	for (const it of r.items) {
		need2(it.state && it.serverMs > 0 && it.questions?.length, `has a recorded decision (${it.id}) without its text, time or questions`);
		for (const q of it.questions) {
			const total = q.bars.reduce((s, b) => s + b.p, 0);
			need2(q.type === 'yes/no' ? q.bars.length === 1 && q.bars[0].p >= 0 && q.bars[0].p <= 1 : Math.abs(total - 1) < 1e-6, `has a recorded decision (${it.id}, ${q.name}) whose probabilities do not add up`);
		}
		refuse(it.state);
	}
	return { source: r.source, run: { ...r.run, decisio: r.run.decisio_version, powerW: r.run.power_limit_w }, boxLabel: r.box_label.value, items: r.items };
}

const short = (n) => n.replace(/ v\d.*$/, '').replace(/^decisio Gemma 4 /, 'Decisio ');
const noCount = (printed) => printed.replace(/ \(\d+\)$/, '');

/**
 * The numbers the home page's interactive pieces draw, all from launch_facts.public.json and nothing else: the race and the
 * document-length slider (figures.same_box_speed), the routing-threshold slider (figures.routing_example5's sweep),
 * the JevBench grid (figures.axes_table) and the hero's replay (the per-question latency on a document already read).
 * The page puts this in a JSON block; the scripts only move between these values and format them, and scripts/checks/launch.mjs
 * compares the block with the file.
 */
export function protoData() {
	const f = facts();
	const m = f.figures?.same_box_speed;
	const r = f.figures?.routing_example5;
	const t = f.figures?.axes_table;
	const lat = f.figures?.latency_on_read_document;
	need2(m && r && t && lat, 'has no same_box_speed, routing_example5, axes_table or latency_on_read_document');
	const lengths = ['3000', '6000', '32000'];
	const systems = m.systems.map((s) => ({
		name: short(s.system),
		cls: s.class,
		limit: s.limit_tokens.value,
		limitText: s.limit_text,
		cells: Object.fromEntries(lengths.map((k) => {
			const c = s.cells50[k];
			need2(c, `has no ${k}-token cell for ${s.system}`);
			return [k, c.seconds && typeof c.seconds.value === 'number' ? { s: c.seconds.value, label: noCount(c.printed) } : null];
		})),
	}));
	const sweep = r.sweep.value.filter((x) => x.keep_at <= 0.95).map((x) => ({ at: x.keep_at, escalated: x.escalated, share: x.escalated_share, accuracy: x.accuracy_kept, caught: x.errors_escalated, confident: x.confidently_wrong }));
	need2(sweep.length === 6 && r.questions.value && r.wrong_answers_total.value, 'has a routing sweep that is not the six thresholds 0.5 to 0.95');
	const hero = lat.the_31b_alone;
	need2(typeof hero?.high_ms === 'number', 'has no 31B latency on a document already read');
	const ratio = speedRatios();
	const first = systems[0].cells['3000'];
	need2(first && systems[0].name === 'Decisio 31B', 'has a first system that is not Decisio 31B with a 3,000-token cell');
	return {
		race: { systems, lengths, box: m.box.labelled, questions: 50 },
		hero: {
			msPerQuestion: hero.high_ms,
			wording: lat.wording,
			stats: {
				seconds: noCount(m.systems[0].cells50['3000'].printed),
				single: singleQuestion().ms,
				longTokens: 32000,
				// The race cards: the multiples the facts' sentence gives, and the 32,000-token time.
				times: ratio.times,
				times6000: ratio.times6000,
				// Beside each multiple, the times it is made of and the date (the speed claim's values).
				seconds3000: ratio.seconds['3000'],
				seconds6000: ratio.seconds['6000'],
				date: ratio.date,
				long: noCount(m.systems[0].cells50['32000'].printed),
			},
		},
		demo: (() => { const d = recordedExamples(); return { run: d.run, boxLabel: d.boxLabel, source: { repository: d.source.repository, commit: d.source.commit }, items: d.items }; })(),
		routing: { questions: r.questions.value, wrong: r.wrong_answers_total.value, sweep, what: r.record.what },
		grid: gridData(t),
	};
}

/** The home page's sortable grid: each cell its printed value and a shade from 0 to 10 by its value in the column. */
function gridData(t) {
	const val = (x, c) => Number(String(x.cells[c].printed).replace(/[^\d.-]/g, ''));
	const range = Object.fromEntries(t.columns.map((c) => { const vs = t.rows.map((x) => val(x, c.id)); return [c.id, [Math.min(...vs), Math.max(...vs)]]; }));
	const shade = (x, c) => { const [lo, hi] = range[c]; return hi > lo ? Math.round(((val(x, c) - lo) / (hi - lo)) * 10) : 5; };
	return {
		title: t.title.replace(/the ten highest open-weights systems/i, 'ten open-weights systems'),
		columns: t.columns.map((c) => ({ id: c.id, name: c.name, tagline: c.tagline })),
		rows: t.rows.map((x) => ({ label: x.label, ours: x.is_decisio, jev: /^Jev /.test(x.label), cells: t.columns.map((c) => ({ p: x.cells[c.id].printed, v: val(x, c.id), shade: shade(x, c.id) })) })).sort(byName((x) => x.label, (x) => x.jev)),
	};
}

/**
 * The three big cards after the hero, each a measured value beside Jev 1.13.0's: the composite with its interval, the
 * intelligence axis and the sealed-set score, from the launch facts' stable claims. Each label carries the board's revision,
 * since these hold for that file.
 */
export function proofCards() {
	const f = facts();
	const j = jevbench();
	const rev = j.revision;
	// Three measured values on the board's file, each beside Jev 1.13.0's, and the composite's sentence under them: no rank.
	const comp = stable('composite_v161');
	const ax = stable('axes_v161').values.intelligence;
	const sealed = stable('sealed_v161').values.sealed;
	const v = (x) => Number(x.value ?? x);
	const two = (x) => v(x).toFixed(2);
	const one = (x) => v(x).toFixed(1);
	const iv = (lo, hi) => `${lo.toFixed(2)} to ${hi.toFixed(2)}`;
	const cv = comp.values;
	need2(cv?.ours && cv?.theirs && cv?.ours_interval && cv?.theirs_interval, 'has no composite values in stable_claims.composite_v161');
	const cards = [
		{ n: v(cv.ours), dec: 2, final: two(cv.ours), suffix: '', text: `JevBench ${rev} composite (95% interval ${iv(...cv.ours_interval.value)}); Jev 1.13.0 ${two(cv.theirs)} (${iv(...cv.theirs_interval.value)})` },
		{ n: v(ax.ours), dec: 1, final: one(ax.ours), suffix: '', text: `intelligence on JevBench ${rev}; Jev 1.13.0 ${one(ax.theirs)}` },
		{ n: v(sealed.ours), dec: 1, final: one(sealed.ours), suffix: '', text: `on the sealed questions, never published, on JevBench ${rev}; Jev 1.13.0 ${one(sealed.theirs)}` },
	];
	cards.forEach((c) => refuse(c.text));
	const line = comp.text;
	refuse(line);
	return { cards, line, claimText: comp.text, revision: rev, sha: j.fileSha256 ?? j.sha256, url: boardSource().url, live: f.stable_claims.rule ? 'https://benchmarkheaven.com/jev-models' : boardSource().url };
}

/**
 * "Honest limits": one line each, every number and name from the facts or the README the page already draws on.
 */
export function limits() {
	const f = facts();
	const m = f.figures.same_box_speed;
	const j = jevbench();
	const docs = m.documents_per_cell;
	const nums = /(\d+) for decisio and H2O[^;]*; (\d+) for/.exec(docs ?? '');
	need2(m.box?.card && m.box?.enforced_power_limit_w?.value && nums, 'has no box card, power limit or documents-per-cell for the limits');
	const recorded = recordedExamples().run;
	// What the default base needs, in the README's words: the 96 GB card, the 64 GB Mac it runs on, and the 48 GB Mac
	// its 4-bit conversion is for, a size derived from the 64 GB measurement.
	const g31 = guidanceFor('gemma-4-31b');
	const need = [...g31.rest, ...g31.sub].find((l) => /96 GB card/.test(l));
	need2(need && /64 GB Mac/.test(need), 'has a README that no longer says the default base needs a 96 GB card or runs on a 64 GB Mac');
	need2(/from its 4-bit conversion `tachara-ai\/decisio-gemma-4-31b-mlx-4bit` on a 48 GB Mac \(derived from the 64 GB measurement\)/.test(readUpstream('README.md')), 'has a README that no longer says the default base\'s 4-bit conversion is for a 48 GB Mac, derived from the 64 GB measurement');
	const live = (f.claims.v161_scoped_statements?.statements ?? []).some((s) => s.holds_on_live === false);
	const items = [
		{ title: 'One box, one session', text: `Every race figure is from ${m.box.card.replace('NVIDIA ', '')}, each system on its own server.` },
		{ title: 'One question', text: `The one-question figure in the hero is ${singleQuestion().conditions}.` },
		{ title: 'Time, not accuracy', text: 'The race compares how long fifty questions take, on synthetic support tickets.' },
		{ title: 'Replayed, not live', text: `The race replays medians of ${nums[2]} or ${nums[1]} documents, and the demo replays decisions recorded on decisio ${recorded.decisio}.` },
		...(live ? [{ title: 'A snapshot of the board', text: `The values are for JevBench ${j.revision}; the live board has moved since.` }] : []),
		{ title: 'Hardware', text: 'Gemma 4 31B needs a 96 GB card or a 64 GB Mac; its 4-bit conversion is for a 48 GB Mac, a size not measured.' },
	];
	items.forEach((i) => { refuse(i.title); refuse(i.text); });
	return items;
}

/**
 * One question about a new 300-token text on Gemma 4 31B, server time: figures.latency_on_new_state_300 . The
 * hero says its wording ("81 ms for one question about a new 300-token text"); its conditions (server time, decisio 0.8.1's
 * served defaults, one RTX PRO 6000 at 585 W, a card at 600 W may read new states faster) go in the limits.
 */
export function singleQuestion() {
	const l = facts().figures?.latency_on_new_state_300;
	const ms = Number(/^(\d+) ms for one question about a new 300-token text/.exec(l?.wording ?? '')?.[1]);
	need2(l?.wording_holds === true && ms && l.by_base?.['Gemma 4 31B']?.ms_rounded === ms, 'has no figures.latency_on_new_state_300 whose wording holds and equals the 31B\'s rounded server time');
	need2(/585 W/.test(l.conditions) && /decisio 0\.8\.1/.test(l.conditions) && /600 W may read new states faster/.test(l.conditions), 'has conditions for the 300-token latency that no longer name 585 W, decisio 0.8.1 and the 600 W caveat');
	return { ms, wording: l.wording, conditions: `server time, on decisio 0.8.1's served defaults and one RTX PRO 6000 at 585 W, so a card at 600 W may read new states faster` };
}
