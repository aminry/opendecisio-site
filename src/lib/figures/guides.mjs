// The figures of the Guides: many questions about one text, latency, teaching it a question, using the probability,
// long documents and many options, and images. Each draws only what a record at the pinned release or the
// launch_facts.public.json states, and stops the build when a record stops saying it.
import { batchTotals, facts, need2, protoData, speedRatios } from '../launch.mjs';
import { readUpstream } from '../upstream.mjs';
import { esc, panel } from './core.mjs';

const must = (source, re, what) => {
	const m = re.exec(source);
	if (!m) throw new Error(`docs-figures: the pinned release no longer says ${what}`);
	return m;
};

const f1 = (n) => Number(n).toFixed(1);
const fmt = (n) => Number(n).toLocaleString('en-US');

// --- Many questions about one text ------------------------------------------------------------------------------------

function manyQuestions() {
	const fig = facts().figures;
	const m = fig.same_box_speed;
	const lat = fig.latency_on_read_document?.the_31b_alone;
	const sys = m.systems;
	need2(sys[0].system === 'decisio Gemma 4 31B' && sys[0].first_question_ms?.['3000'] && lat?.low_ms && lat?.high_ms, 'has no 31B first-question time or per-question range on a read document');
	const secs = (s) => s.cells50['3000'].seconds.value;
	const name = (s) => s.system.replace(/^decisio Gemma 4 /, 'Decisio ').replace(/ v\d.*$/, '');
	const low = Math.round(lat.low_ms);
	const high = Math.round(lat.high_ms);
	const max = Math.max(...sys.map(secs));
	const W = 440;
	const rows = sys.map((s, i) => {
		const y = 24 + i * 34;
		const w = Math.max(2, (secs(s) / max) * W);
		const decisio = /^decisio/.test(s.system);
		return `<text class="ft ft-s" x="8" y="${y + 14}">${esc(name(s))}</text><rect class="f-rail" x="150" y="${y}" width="${W}" height="18" rx="9"/><rect class="${decisio ? 'f-bar' : 'f-bar f-bar--grey'} f-grow fd-${i + 1}" x="150" y="${y}" width="${w.toFixed(1)}" height="18" rx="9"/><text class="ft ft-n f-pop fd-${i + 2}" x="${150 + W + 12}" y="${y + 14}">${esc(s.cells50['3000'].printed.replace(/ \(\d+\)$/, ''))}</text>`;
	}).join('');
	// The zoomed strip, 0 to 1.2 s: the 31B's measured totals only. One question on a new document (read included), and
	// fifty in one request (one read, then one batch: the 31B's default); no bar stands for one question in the batch.
	const Z = 520;
	const zx = (ms) => (ms / 1200) * Z;
	const b = batchTotals();
	const body = `<svg class="fig__svg" viewBox="0 0 760 330" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<text class="ft ft-k" x="8" y="12">50 questions about one 3,000-token document, to scale</text>
${rows}
<text class="ft ft-k" x="8" y="214">Decisio 31B's totals, to scale (0 to 1.2 s)</text>
<text class="ft ft-s" x="8" y="242">1 question</text>
<rect class="f-bar f-grow fd-6" x="150" y="228" width="${zx(b.one).toFixed(1)}" height="18" rx="9"/>
<text class="ft ft-n f-pop fd-6" x="${(150 + zx(b.one) + 10).toFixed(1)}" y="242">${b.one} ms, read included</text>
<text class="ft ft-d" x="150" y="288">one read, then the 50 questions in one batch</text>
<text class="ft ft-s" x="8" y="316">50 in one request</text>
<rect class="f-rail" x="150" y="302" width="${Z}" height="18" rx="9"/><rect class="f-bar f-grow fd-9" x="150" y="302" width="${zx(secs(sys[0]) * 1000).toFixed(1)}" height="18" rx="9"/><text class="ft ft-n f-pop fd-9" x="${(150 + zx(secs(sys[0]) * 1000) + 10).toFixed(1)}" y="316">${esc(sys[0].cells50['3000'].printed.replace(/ \(\d+\)$/, ''))}</text>
</svg>`;
	return panel({
		name: 'many-questions', label: 'Many questions, one text', title: 'Read the text once; ask as many questions as you like.',
		desc: `Fifty questions about one 3,000-token document take ${sys.map((s) => `${name(s)} ${s.cells50['3000'].printed.replace(/ \(\d+\)$/, '')}`).join(', ')}. On Decisio 31B one question takes ${b.one} ms, reading included, and fifty in one request take ${b.fifty}: it reads the document once and scores the questions together in one batch. A later, separate request on a document already read takes ${low} to ${high} ms from the cache (${b.followWhen}).`,
		body, live: 8, legend: (() => { const r = speedRatios(); const t = r.seconds['3000']; return `The two systems that read the document again for every question take about ${r.times} times as long at 3,000 tokens (${t.jeff.toFixed(1)} s and ${t.quyet.toFixed(1)} s against ${t.decisio.toFixed(2)} s, one box, ${r.date}). This compares time, not accuracy.`; })(),
		source: 'Source: figures.same_box_speed and figures.latency_on_read_document of launch_facts.public.json: one RTX PRO 6000 at 600 W, each system on its own server, medians of 5 or 10 synthetic support tickets.',
	});
}

// --- Latency ---------------------------------------------------------------------------------------------------------

/** The latency rows of the evaluation card (one RTX PRO 6000 at 585 W, decisio 0.8.1's served defaults), read from its tables. */
export function latencyRows() {
	const card = readUpstream('EVAL_CARD.md');
	const triples = [...card.matchAll(/(\d+\.\d+) ms (?:server time )?at 300 tokens, (\d+\.\d+) at 1,000, (\d+\.\d+) at 3,000/g)].map((m) => m.slice(1, 4).map(Number));
	const pairs = [...card.matchAll(/(\d+\.\d) ms against (\d+\.\d) ms for the first read/g)].map((m) => [Number(m[1]), Number(m[2])]);
	const cached = [...card.matchAll(/Latency, one question(?: per request)?, state from the cache[^|]*\| (\d+\.\d) ms server time/g)].map((m) => Number(m[1]));
	if (triples.length !== 6 || pairs.length !== 3 || cached.length !== 3) throw new Error(`docs-figures: EVAL_CARD.md no longer has its latency rows (${triples.length} triples, ${pairs.length} pairs, ${cached.length} cached)`);
	const bases = [
		{ id: 'qwen', name: 'Qwen3.6-35B-A3B', one: triples[0], four: triples[1], second: pairs[0], cached: cached[0] },
		{ id: 'g12', name: 'Gemma 4 12B', one: triples[2], four: triples[3], second: pairs[1], cached: cached[1] },
		{ id: 'g31', name: 'Gemma 4 31B', one: triples[4], four: triples[5], second: pairs[2], cached: cached[2] },
	];
	// Spot-check one value of each base against the README's own sentence, so a moved table does not shift the pairing.
	const readme = readUpstream('README.md');
	if (!readme.includes('80.7 ms') || !readme.includes('49.9') || !readme.includes('53.6 ms')) throw new Error('docs-figures: the README no longer carries the new-state latencies of the three bases');
	if (bases[2].one[0] !== 80.7 || bases[0].one[0] !== 49.9 || bases[1].one[0] !== 53.6) throw new Error('docs-figures: the latency rows no longer pair as Qwen, 12B, 31B');
	return bases;
}

/** An interactive chart of measured points only: three views, each a set of dots with its value, no line between them. */
function latencyChart() {
	const bases = latencyRows();
	const tokens = [300, 1000, 3000];
	const views = [
		{ id: 'one', label: 'One question, a new state', pts: (b) => b.one.map((ms, i) => ({ x: tokens[i], ms })), note: 'The server reads the state, then answers one question. The boundary is registered before the question on the Gemma bases. Points at the same length are spread sideways so none hides another; their height is the measurement.' },
		{ id: 'four', label: 'Four questions, a new state', pts: (b) => b.four.map((ms, i) => ({ x: tokens[i], ms })), note: 'One request with four questions about a state the server has not seen; the 31B scores them in one batch (--multi-question warm), the others one after another.' },
		{ id: 'second', label: 'A second question on a state already read', pts: (b) => [{ x: 3000, ms: b.second[0], first: b.second[1] }], note: 'A different question about a 3,000-token state, read from the cache; the first read is what the first question cost.' },
	];
	const L = 70, R = 700, T = 20, B = 250;
	const px = (t) => L + ((Math.log(t) - Math.log(250)) / (Math.log(4000) - Math.log(250))) * (R - L);
	const max = 480;
	const py = (ms) => B - (ms / max) * (B - T);
	const chart = views.map((v, vi) => {
		const dots = bases.flatMap((b, bi) => v.pts(b).map((p) => `<circle class="lc-dot lc-${b.id}" role="img" cx="${(px(p.x) + (bi - 1) * 16).toFixed(1)}" cy="${py(p.ms).toFixed(1)}" r="7" tabindex="0" data-tip="${esc(`${b.name}: ${f1(p.ms)} ms at ${fmt(p.x)} tokens${p.first ? ` (its first read: ${f1(p.first)} ms)` : ''}`)}" aria-label="${esc(`${b.name}, ${f1(p.ms)} milliseconds at ${fmt(p.x)} tokens`)}"/>`)).join('');
		const ticks = [0, 100, 200, 300, 400].map((ms) => `<line class="lc-grid" x1="${L}" x2="${R}" y1="${py(ms).toFixed(1)}" y2="${py(ms).toFixed(1)}"/><text class="ft ft-d" x="${L - 10}" y="${(py(ms) + 4).toFixed(1)}" text-anchor="end">${ms}</text>`).join('');
		const xt = tokens.map((t) => `<text class="ft ft-d" x="${px(t).toFixed(1)}" y="${B + 22}" text-anchor="middle">${fmt(t)}</text>`).join('');
		return `<div class="lc-view" data-view="${v.id}"${vi ? ' hidden' : ''}><svg class="fig__svg" viewBox="0 0 720 312" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="${esc(v.label)}">${ticks}${xt}<text class="ft ft-d" x="${(L + R) / 2}" y="${B + 44}" text-anchor="middle">tokens in the state</text><text class="ft ft-d" x="10" y="14">ms, server time</text>${dots}</svg><p class="lc-note">${esc(v.note)}</p></div>`;
	}).join('');
	const table = `<table class="lc-table"><caption>The numbers of the chart, in milliseconds of server time</caption><thead><tr><th scope="col">Base</th><th scope="col">One question, 300 / 1,000 / 3,000 tokens</th><th scope="col">Four questions, 300 / 1,000 / 3,000 tokens</th><th scope="col">A second question at 3,000 tokens (its first read)</th><th scope="col">One question, state from the cache</th></tr></thead><tbody>${bases.map((b) => `<tr><th scope="row">${esc(b.name)}</th><td>${b.one.map(f1).join(' / ')}</td><td>${b.four.map(f1).join(' / ')}</td><td>${f1(b.second[0])} (${f1(b.second[1])})</td><td>${f1(b.cached)}</td></tr>`).join('')}</tbody></table>`;
	const body = `<div class="lc"><div class="lc-tabs" role="tablist" aria-label="What is measured">${views.map((v, i) => `<button type="button" role="tab" class="lc-tab" data-view-tab="${v.id}" aria-selected="${i === 0}">${esc(v.label)}</button>`).join('')}</div><div class="lc-legend" aria-hidden="true">${bases.map((b) => `<span class="lc-key lc-${b.id}">${esc(b.name)}</span>`).join('')}</div>${chart}<p class="lc-tip" data-lc-tip aria-live="polite">Hover or focus a point for its value.</p></div>`;
	return panel({
		name: 'latency-chart', label: 'Latency', title: 'Each point is one measurement; nothing between them is estimated.',
		desc: `Measured server time by base. One question on a new state at 300, 1,000 and 3,000 tokens: ${bases.map((b) => `${b.name} ${b.one.map(f1).join(', ')} ms`).join('; ')}.`,
		body, interactive: true, extra: `<details class="more lc-more"><summary>The numbers</summary>${table}</details>`,
		legend: 'Server time on one RTX PRO 6000 at 585 W, an AMD Ryzen Threadripper 9960X host, decisio 0.8.1\'s served defaults with the engine in the server\'s process; medians of 20. A card at 600 W may read new states faster.',
		source: 'Source: the latency rows of EVAL_CARD.md sections 3, 6.1 and 7.1 at the pinned release (runs/2026-10-06_latency-585w/).',
	});
}

// --- Teaching it a question ---------------------------------------------------------------------------------------------

/** The triage demo's table at the pinned release: each base's accuracy on 400 held-out tickets, plain and after registering 200. */
export function triageRows() {
	const demos = readUpstream('docs/demos/README.md');
	const section = demos.slice(demos.indexOf('### Triage (400 held-out tickets over 20 queues)'));
	const rows = [...section.slice(0, section.indexOf('Registration was repeated')).matchAll(/^\| (Qwen3\.6-35B-A3B|Gemma 4 12B|Gemma 4 31B) \| (\d+\.\d)% \[[^\]]+\] \| (\d+\.\d)% \[[^\]]+\] \| ([+-]\d+\.\d) points \[([^\]]+)\]; (\d+)(?: answers?)? fixed, (\d+) broken \| /gm)];
	if (rows.length !== 3) throw new Error('docs-figures: docs/demos/README.md no longer has its triage table');
	const secs = /Registration was repeated on each base and took (\d+) s, (\d+) s and (\d+) s\./.exec(section);
	if (!secs) throw new Error('docs-figures: the triage section no longer says how long registration took');
	const kept = /On the Qwen base it kept both the intent head and the calibration; on the Gemma bases it kept the head only/.test(section);
	if (!kept) throw new Error('docs-figures: the triage section no longer says what each base kept');
	return rows.map((m, i) => ({ base: m[1], plain: Number(m[2]), registered: Number(m[3]), diff: m[4], interval: m[5], fixed: Number(m[6]), broken: Number(m[7]), seconds: Number(secs[i + 1]), kept: i === 0 ? 'the intent head and the calibration' : 'the intent head' }));
}

/** The 31B's intent heads against the plain readout on the same items, and the Qwen base's with their intervals. */
export function intentRows() {
	const card = readUpstream('EVAL_CARD.md');
	const m = must(card, /Intent heads from 10 labelled examples per intent \| BANKING77 (0\.\d+) \(plain readout (0\.\d+)\), CLINC150 (0\.\d+) \((0\.\d+)\), means of three draws; registration (\d+) s and (\d+) s/, 'the 31B\'s intent heads against its plain readout');
	const readme = readUpstream('README.md');
	const r = must(readme, /^\| Intent heads, BANKING77 \/ CLINC150 \| [^|]*\| [^|]*\| (0\.\d+) \/ (0\.\d+) \|$/m, 'the intent-head row of the README\'s Benchmarks table');
	if (r[1] !== m[1] || r[2] !== m[3]) throw new Error('docs-figures: the README\'s intent-head row and the evaluation card\'s disagree about the 31B');
	const tasks = readUpstream('docs/tasks.md');
	const q = [...tasks.matchAll(/\| (BANKING77|CLINC150) intent accuracy \((\d+) options\) \| (0\.\d+) \| \*\*(0\.\d+)\*\*; \+(\d+\.\d) points \[\+(\d+\.\d), \+(\d+\.\d+)\]/g)];
	if (q.length !== 2) throw new Error('docs-figures: docs/tasks.md no longer has its two intent rows');
	return {
		sets: [
			{ name: 'BANKING77', options: 77, plain: Number(m[2]), head: Number(m[1]), seconds: Number(m[5]) },
			{ name: 'CLINC150', options: 150, plain: Number(m[4]), head: Number(m[3]), seconds: Number(m[6]) },
		],
		qwen: q.map((x) => ({ name: x[1], plain: x[3], head: x[4], gain: x[5], lo: x[6], hi: x[7] })),
	};
}

function teachIt() {
	const rows = triageRows();
	const { sets, qwen } = intentRows();
	const ix = (v) => ((v - 0.7) / 0.3) * 250;
	const lead = sets.map((x, i) => {
		const y = 138 + i * 62;
		return `<text class="ft ft-s" x="8" y="${y + 12}">${esc(x.name)}, ${x.options} options</text>
<rect class="f-rail" x="190" y="${y}" width="250" height="12" rx="6"/>
<rect class="f-bar f-bar--grey f-grow fd-6" x="190" y="${y}" width="${ix(x.plain).toFixed(1)}" height="12" rx="6"/>
<text class="ft ft-d ft-xs f-pop fd-7" x="${(190 + ix(x.plain) + 8).toFixed(1)}" y="${y + 10}">${x.plain.toFixed(3)}</text>
<rect class="f-rail" x="190" y="${y + 18}" width="250" height="12" rx="6"/>
<rect class="f-bar f-grow fd-${7 + i}" x="190" y="${y + 18}" width="${ix(x.head).toFixed(1)}" height="12" rx="6"/>
<text class="ft ft-n ft-xs f-pop fd-${8 + i}" x="${(190 + ix(x.head) + 8).toFixed(1)}" y="${y + 28}">${x.head.toFixed(3)}</text>`;
	}).join('');
	const small = rows.map((r, i) => {
		const y = 138 + i * 44;
		const w = (v) => ((v - 85) / 15) * 150;
		return `<text class="ft ft-s ft-xs" x="478" y="${y + 10}">${esc(r.base)}</text>
<rect class="f-rail" x="478" y="${y + 16}" width="150" height="8" rx="4"/><rect class="f-bar f-bar--grey f-grow fd-9" x="478" y="${y + 16}" width="${w(r.plain).toFixed(1)}" height="8" rx="4"/>
<rect class="f-bar f-grow fd-10" x="478" y="${y + 26}" width="${w(r.registered).toFixed(1)}" height="8" rx="4"/>
<text class="ft ft-d ft-xs f-pop fd-9" x="636" y="${y + 24}">${r.plain.toFixed(1)}</text><text class="ft ft-n ft-xs f-pop fd-10" x="636" y="${y + 36}">${r.registered.toFixed(1)}</text>`;
	}).join('');
	const body = `<svg class="fig__svg" viewBox="0 0 720 308" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<rect class="f-node fd-0" x="8" y="8" width="150" height="82" rx="12"/>
<text class="ft ft-k" x="22" y="30">Your examples</text>
<text class="ft ft-s f-pop fd-0" x="22" y="52">10 labelled per</text><text class="ft ft-s f-pop fd-0" x="22" y="72">intent</text>
<path class="f-line fd-1" d="M158 49L214 49" pathLength="1"/>
<rect class="f-node f-node--on fd-2" x="214" y="8" width="150" height="82" rx="12"/>
<text class="ft ft-k" x="228" y="30">The server fits</text>
<text class="ft ft-s f-pop fd-2" x="228" y="52">a calibration and</text><text class="ft ft-s f-pop fd-2" x="228" y="72">an intent head</text>
<path class="f-line fd-3" d="M364 49L420 49" pathLength="1"/>
<rect class="f-node fd-4" x="420" y="8" width="292" height="82" rx="12"/>
<text class="ft ft-k" x="434" y="30">Cross-validation decides</text>
<text class="ft ft-s f-pop fd-4" x="434" y="52">each is kept only if it helps;</text><text class="ft ft-n f-pop fd-5" x="434" y="72">the weights never change</text>
<text class="ft ft-k" x="8" y="122">Gemma 4 31B, accuracy on many-option intent sets</text>
${lead}
<text class="ft ft-d ft-xs" x="8" y="296">Grey: the plain readout on the same items. Blue: with the intent head, or after registering. Bars start at 0.70 (left) and 85 percent (right).</text>
<text class="ft ft-k" x="478" y="122">Plain answer already good</text>
${small}
</svg>`;
	return panel({
		name: 'teach-it', label: 'Teaching it a question', title: 'Examples go in; on a long list of intents the head lifts accuracy, and a correction stays only if cross-validation shows a gain.',
		desc: `Registering labelled examples on the Gemma 4 31B base: ${sets.map((x) => `${x.name} (${x.options} options) accuracy goes from ${x.plain.toFixed(3)} with the plain readout to ${x.head.toFixed(3)} with an intent head`).join('; ')}, means of three draws. Where the plain answer is already good, on triage over 20 queues, the lift is small: ${rows.map((r) => `${r.base} ${r.plain.toFixed(1)}% to ${r.registered.toFixed(1)}%`).join('; ')}.`,
		body, live: 10, legend: `Intent heads: means of three draws from 10 labelled examples per intent; registration took ${sets.map((x) => `${x.seconds} s`).join(' and ')}. On the Qwen base the heads added ${qwen.map((x) => `+${x.gain} points on ${x.name} [+${x.lo}, +${x.hi}]`).join(' and ')}, over six draws. Triage (right, in percent, 400 held-out tickets): ${rows.map((r) => `${r.diff} points on ${r.base}`).join(', ')}; registration took ${rows.map((r) => `${r.seconds} s`).join(', ')}.`,
		source: 'Source: the 31B\'s intent-head row of EVAL_CARD.md section 7.2 (also the README\'s Benchmarks table), the tasks table of docs/tasks.md, and the triage table of docs/demos/README.md at the pinned release. The 31B\'s three draws have no published interval.',
	});
}

// --- Using the probability ----------------------------------------------------------------------------------------------

function threshold() {
	const R = protoData().routing;
	const body = `<div class="th" data-th data-d="${esc(JSON.stringify(R))}"><label class="th__l" for="th-in">Keep answers at or above</label>
<input id="th-in" class="th__in" type="range" min="0" max="${R.sweep.length - 1}" step="1" value="3" aria-describedby="th-out">
<div class="th__ticks" aria-hidden="true">${R.sweep.map((x) => `<span>${x.at}</span>`).join('')}</div>
<svg class="th__svg" viewBox="0 0 640 56" aria-hidden="true"><rect class="f-rail" x="0" y="8" width="640" height="24" rx="6"/><text class="ft ft-d" x="0" y="52">kept</text><text class="ft ft-d" x="640" y="52" text-anchor="end">escalated</text><rect class="th__kept" data-th-kept x="0" y="8" width="${(640 * (1 - R.sweep[3].share)).toFixed(1)}" height="24" rx="6"/></svg>
<p id="th-out" class="th__out" data-th-out aria-live="polite">Keep answers at or above ${R.sweep[3].at}: ${fmt(R.sweep[3].escalated)} of ${fmt(R.questions)} questions escalated (${(R.sweep[3].share * 100).toFixed(1)}%); ${(R.sweep[3].accuracy * 100).toFixed(1)}% right on the rest; ${R.sweep[3].caught} of ${R.wrong} wrong answers escalated; ${R.sweep[3].confident} confidently wrong and kept.</p></div>`;
	return panel({
		name: 'threshold', label: 'Using the probability', title: 'Set the line; the answers under it go to a person or a larger model.',
		desc: `A worked example of ${fmt(R.questions)} questions: at each of six thresholds from ${R.sweep[0].at} to ${R.sweep.at(-1).at}, how many answers are escalated and how accurate the rest are. ${R.sweep.map((x) => `At ${x.at}, ${x.escalated} escalated, ${(x.accuracy * 100).toFixed(1)}% right on the rest`).join('; ')}.`,
		body, interactive: true, legend: 'Each stop is a measured threshold, not an interpolation.',
		source: `Source: figures.routing_example5 of launch_facts.public.json: ${esc(R.what)}.`,
	});
}

// --- Long documents and many options ------------------------------------------------------------------------------------

function longAndWide() {
	const fig = facts().figures;
	const m = fig.same_box_speed.systems[0];
	const first = m.first_question_ms;
	need2(first?.['1000'] && first['3000'] && first['6000'] && first['32000'], 'has no first-question times for the 31B at 1,000, 3,000, 6,000 and 32,000 tokens');
	const tasks = readUpstream('docs/tasks.md');
	const intent = [...tasks.matchAll(/\| (BANKING77|CLINC150) intent accuracy \((\d+) options\) \| (0\.\d+) \| \*\*(0\.\d+)\*\*; \+(\d+\.\d) points \[\+(\d+\.\d), \+(\d+\.\d+)\]/g)];
	if (intent.length !== 2) throw new Error('docs-figures: docs/tasks.md no longer has its two intent rows');
	const pts = [1000, 3000, 6000, 32000];
	const max = first['32000'];
	const bars = pts.map((t, i) => {
		const y = 30 + i * 40;
		const w = Math.max(2, (first[String(t)] / max) * 250);
		return `<text class="ft ft-s" x="8" y="${y + 14}">${fmt(t)} tokens</text><rect class="f-rail" x="100" y="${y}" width="250" height="18" rx="9"/><rect class="f-bar f-grow fd-${i + 1}" x="100" y="${y}" width="${w.toFixed(1)}" height="18" rx="9"/><text class="ft ft-n f-pop fd-${i + 2}" x="358" y="${y + 14}">${fmt(first[String(t)])} ms</text>`;
	}).join('');
	const opts = intent.map((m2, i) => {
		const y = 30 + i * 70;
		const w = (v) => ((Number(v) - 0.6) / 0.4) * 230;
		return `<text class="ft ft-s" x="470" y="${y + 12}">${esc(m2[1])}, ${m2[2]} options</text><rect class="f-rail" x="470" y="${y + 20}" width="230" height="10" rx="5"/><rect class="f-bar f-bar--grey f-grow fd-3" x="470" y="${y + 20}" width="${w(m2[3]).toFixed(1)}" height="10" rx="5"/><rect class="f-bar f-grow fd-${4 + i}" x="470" y="${y + 33}" width="${w(m2[4]).toFixed(1)}" height="10" rx="5"/><text class="ft ft-d f-pop fd-4" x="${(470 + w(m2[3]) + 6).toFixed(1)}" y="${y + 30}">${m2[3]}</text><text class="ft ft-n f-pop fd-5" x="${(470 + w(m2[4]) + 6).toFixed(1)}" y="${y + 43}">${m2[4]}</text>`;
	}).join('');
	const body = `<svg class="fig__svg" viewBox="0 0 720 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<text class="ft ft-k" x="8" y="14">First question, by document length</text>${bars}
<text class="ft ft-k" x="470" y="14">Accuracy on many options</text>${opts}
<text class="ft ft-d" x="470" y="${30 + 2 * 70 + 6}">grey: plain · blue: with a registered head</text>
</svg>`;
	return panel({
		name: 'long-and-wide', label: 'Long documents, many options', title: '32,768 tokens by default, more as an opt-in, and up to 255 options; a head helps most when the list is long.',
		desc: `On the 31B the first question about a document takes ${pts.map((t) => `${first[String(t)]} ms at ${fmt(t)} tokens`).join(', ')}. With a registered intent head, accuracy on ${intent.map((m2) => `${m2[1]} (${m2[2]} options) goes from ${m2[3]} to ${m2[4]}`).join(' and ')}.`,
		body, live: 6, legend: 'A prompt, the state with one question, holds 32,768 tokens by default (the Gemma bases can be started with more), and a question can have up to 255 options.',
		source: 'Source: figures.same_box_speed of launch_facts.public.json (one RTX PRO 6000 at 600 W) and the tasks table of docs/tasks.md at the pinned release (Qwen3.6-35B-A3B, 10 labelled examples per intent, mean of six draws).',
	});
}

// --- Images --------------------------------------------------------------------------------------------------------------

function images() {
	const readme = readUpstream('README.md');
	const m = /Image input, ImajevBench \| (0\.\d+) \|/.exec(readme);
	if (!m || !/Image input \| photos in the state, served by a second engine on the same card \(`--image-model`\)/.test(readme)) throw new Error('docs-figures: the README no longer says how image input is served or what ImajevBench scored');
	const body = `<div class="fig__flow" data-images><div class="fig__step f-pop fd-0"><b>A request with images</b><span>a state, questions, and up to 2 images: PNG, JPEG or WebP, 20 MB each</span></div><span class="fig__to" aria-hidden="true"></span><div class="fig__step f-pop fd-2"><b>The image engine</b><span>a second engine on the same card, started with <code>--image-model</code></span></div><span class="fig__to" aria-hidden="true"></span><div class="fig__step fig__step--on f-pop fd-4"><b>The same answers</b><span>a probability for every option, on the same route</span></div></div>`;
	return panel({
		name: 'images', label: 'Image input', title: 'Images ride in the request; a second engine on the same card reads them.',
		desc: `A request carries up to 2 images (PNG, JPEG or WebP, up to 20 MB each) beside its state and questions. A second engine on the same card, started with --image-model, serves it, and the answers have the same shape. ImajevBench scored ${m[1]} on the Qwen base.`,
		body, live: 5, legend: `ImajevBench v2.0-lite, the 230 answerable items, on the Qwen base: ${m[1]}. It was measured with the Qwen base only.`,
		source: 'Source: the README and docs/api.md at the pinned release.',
	});
}

export const guidesFigures = {
	'many-questions': manyQuestions,
	'latency-chart': latencyChart,
	'teach-it': teachIt,
	threshold,
	'long-and-wide': longAndWide,
	images,
};
