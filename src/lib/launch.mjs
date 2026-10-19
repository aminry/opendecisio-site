// What the site says about JevBench, read from the launch facts (launch_facts.public.json)
// (src/data/launch/launch_facts.public.json: the part of the launch facts that the
// site reads, schema launch_facts/1). Every number and
// every claim on the home page's hero and board result and on the benchmarks page's
// JevBench section comes through here:
// - a claim is made only if its "holds" is true in the file, and only in the
//   words the file allows; the words the file forbids are refused;
// - a row is read by key, and the build stops if the file's shape or a row's
//   name is not what this module reads.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { replay, session } from './recorded.mjs';
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
	{ id: '31b', name: 'Decisio, Gemma 4 31B', match: /decisio v0\.8\.0 on gemma-4-31B/i, base: 'base-g31', ours: true },
	{ id: 'jev', name: 'Jev 1.13.0', match: /^Jev 1\.13\.0/ },
	{ id: 'quyet', name: 'Quyet-1.0-Large', match: /Quyet-1\.0-Large/ },
	{ id: 'deck31b', name: 'deck-31B', match: /^deck-31B/ },
	{ id: '12b_v080', name: 'Decisio, Gemma 4 12B, run of 2026-10-06', match: /decisio v0\.8\.0 on gemma-4-12B/i, base: 'base-g12', ours: true },
	{ id: '12b_v090', name: 'Decisio, Gemma 4 12B, run of 2026-10-07', match: /decisio v0\.9\.0 on gemma-4-12B/i, base: 'base-g12', ours: true },
];

const num = (x) => x.value;

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
		// The release each of our rows ran, as the board names it, for the source note (no release in the prose).
		releases: rows.filter((r) => r.ours).map((r) => ({ name: r.name, release: /decisio (v\d+\.\d+\.\d+)/.exec(r.display)?.[1] ?? need(false, `row ${r.id} names no decisio release`) })),
		overlaps: rows.filter((r) => r !== ours && overlaps(ours, r)).map((r) => r.name),
		clear: rows.filter((r) => r !== ours && !overlaps(ours, r)).map((r) => r.name),
	};
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


export const need2 = (cond, what) => {
	if (!cond) throw new Error(`launch: launch_facts.public.json ${what}; revisit src/lib/launch.mjs`);
};

/** Our rows as the site names them: the board's label without the release, which the source note gives
 * ("decisio v0.8.0, Gemma 4 31B (ours)" is "Decisio, Gemma 4 31B (ours)"; "Decisio 31B v0.8.0 (ours)" is "Decisio 31B (ours)"). */
export const ourLabel = (label) => label.replace(/^decisio v\d+\.\d+\.\d+, /i, 'Decisio, ').replace(/\s+v\d+\.\d+\.\d+\b/, '');

/** The ten open-weights systems the home chart draws, in alphabetical order, then Jev as a reference row. */
export function openRows() {
	const w = facts().figures?.open_weights_rows;
	need2(w && Array.isArray(w.rows), 'has no figures.open_weights_rows');
	return w.rows.map((r) => ({
		key: r.key,
		label: r.is_ours ? ourLabel(r.label) : r.label,
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
	const bullets = [stable('sealed_v161').text, 'The sealed set was never published.', stable('axes_v161').text];
	need2(stable('axes_v161').text.includes(printed(ours, 'intelligence')) && stable('sealed_v161').text.includes(printed(ours, 'sealed')), 'has stable claims whose values differ from the axes table\'s');
	bullets.forEach(refuse);
	return {
		// The redrawn picture's alt text (alphabetical, plain values), else the earlier one.
		alt: t.public?.alt_text ?? t.alt_text,
		columns: t.columns.map((c) => ({ id: c.id, name: c.name, tagline: c.tagline })),
		rows: t.rows.map((r) => ({ key: r.key, label: r.is_decisio ? ourLabel(r.label) : r.label, ours: r.is_decisio, jev: r === jev, cells: t.columns.map((c) => ({ text: printed(r, c.id) })) })).sort(byName((r) => r.label, (r) => r.jev)),
		bullets,
		note: t.no_intervals_note,
		versionNote: t.version_note,
	};
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

export const DI_BOARD = 'https://huggingface.co/spaces/multimodalart/jev-decision-index';

/**
 * The rows the Decision Index board lists for decisio, from the launch facts' stable claim decision_index_board_03: its sentence
 * as the file gives it, the rows' two figures (the public index and Decision Index 0.3), and the date of the board's
 * data file. Listed, not validated: the data file marks no row validated, and the submission PRs closed unmerged.
 */
export function decisionIndexBoard() {
	const c = stable('decision_index_board_03');
	const val = (x) => Number(x?.value ?? x);
	// The board names each row by its release and model ("decisio 0.6.0 (Gemma 4 31B)"); the site names it by its model and
	// gives the release in the source note.
	const rows = (c.values?.rows ?? []).map((r) => {
		const m = /^decisio (\d+\.\d+\.\d+) \((.+)\)$/.exec(r.name);
		need2(m, `has a decision_index_board_03 row "${r.name}" that is not "decisio <release> (<model>)"`);
		return { name: `Decisio, ${m[2]}`, release: m[1], boardName: r.name, pub: val(r.public_index), v03: val(r.edition_03) };
	});
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
	// "(the box row)" points at a row of the facts file, which the reader cannot see.
	const qualifiers = [`${conditions[0].toUpperCase()}${conditions.slice(1).replace(/ \(the box row\)/, '')}.`];
	// The log chart also carries the earlier box's five systems, as hollow rings: its alt text says so, and so does the caption.
	if (kind === 'log') {
		const rings = /Five systems were measured in one session[^.]*hollow rings\./.exec(charts.log.alt)?.[0];
		need2(rings, 'has a log chart whose alt text no longer says which systems are hollow rings');
		qualifiers.push(`This chart: ${rings[0].toLowerCase()}${rings.slice(1)}`);
	}
	qualifiers.forEach(refuse);
	// The box, as the site says it ("measured by us"), and the release decisio ran, in the README's own line.
	need2(/^measured by [^,]+ on one RTX PRO 6000, each system on its own published server, in one session$/.test(m.box.labelled), 'has a same_box_speed box label the site no longer reads');
	const box = m.box.labelled.replace(/^measured by [^ ]+( [A-Z][\w.]*)* on/, 'Measured by us on');
	const release = /^- (decisio v[\d.]+ on vLLM [\d.]+) \(the 31B and the 12B at their repositories' pins\)/m.exec(readUpstream('README.md'))?.[1];
	need2(release, 'is beside a README that no longer names the decisio release of the same-box session');
	return { sentences, qualifiers, chart: charts[kind], box, release: `The server was ${release}.` };
}

/**
 * The recorded decisions the home page's live demo and the docs play: the twelve records launch_facts.public.json's
 * figures.recorded_decisions selects (the first records of four decisio-examples runs, taken as they came), each sent again
 * to decisio 0.17.0 (src/lib/recorded.mjs), so every probability and server time shown is that release's. The build stops
 * if a replayed request is not the selected record's, a record is malformed, or its probabilities do not add up to one.
 */
export function recordedExamples() {
	const r = facts().figures?.recorded_decisions;
	need2(r?.source?.commit && r.source.files?.length && r.items?.length >= 12, 'has no figures.recorded_decisions with its source and at least twelve records');
	const again = replay();
	const s = session();
	const js = (x) => Math.floor(x + 0.5);
	const items = r.items.map((it) => {
		const now = again.get(it.id);
		need2(now, `has a recorded decision (${it.id}) the 0.17.0 replay did not send again`);
		const st = now.request.state;
		const state = typeof st === 'string' ? st : Object.entries(st).map(([k, v]) => `${k}: ${v}`).join('\n');
		need2(state === it.state, `has a recorded decision (${it.id}) whose text is not the replayed request's`);
		const questions = it.questions.map((q) => {
			const a = now.answers[q.name];
			need2(a, `has a question (${it.id}, ${q.name}) the replay did not answer`);
			if (q.type === 'yes/no') return { ...q, bars: [{ ...q.bars[0], p: a.noul, top: a.noul >= 0.5 }] };
			const bars = q.bars.map((b) => {
				const p = a.probabilities?.[b.label];
				need2(typeof p === 'number', `has an option (${it.id}, ${q.name}, ${b.label}) the replay gave no probability`);
				return { ...b, p, top: q.type === 'choice' ? b.label === a.choice : String(js(a.score)) === b.label };
			});
			// A score's answer is the expected level over its levels (the probabilities' weighted mean), not one level.
			return { ...q, bars, result: q.type === 'choice' ? a.choice : `expected level ${a.score.toFixed(1)}` };
		});
		for (const q of questions) {
			const total = q.bars.reduce((sum, b) => sum + b.p, 0);
			need2(q.type === 'yes/no' ? q.bars[0].p >= 0 && q.bars[0].p <= 1 : Math.abs(total - 1) < 1e-6, `has a replayed decision (${it.id}, ${q.name}) whose probabilities do not add up`);
		}
		refuse(it.state);
		return { ...it, questions, serverMs: now.serverMs };
	});
	const run = { date: s.date, decisio: s.decisio, decisio_version: s.decisio, vllm: s.vllm, base: s.base, card: s.card, powerW: s.powerW, power_limit_w: s.powerW };
	return { source: r.source, run, boxLabel: `Gemma 4 31B, decisio ${s.decisio}, RTX PRO 6000 at ${s.powerW} W`, items };
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
