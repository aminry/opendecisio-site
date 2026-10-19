// The figures of "Teach and trust": the order the three guides follow (teach, certify, route, watched), the certify
// slider on the support inbox, and decisio's drift replay. The slider reads the teach-and-certify runs
// (src/lib/teach-certify.mjs, which checks them); the drift chart reads docs/tasks.md and the replay's summary at the
// pinned release. All three are still apart from the slider, which moves only when the reader moves it.
import { readUpstream } from '../upstream.mjs';
import { baseName, data as tcData, datasetName } from '../teach-certify.mjs';
import { esc, panel } from './core.mjs';

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const fmt = (n) => n.toLocaleString('en-US');

// --- Teach, certify, route ----------------------------------------------------------------------------------------------

const STEPS = [
	{ id: 'teach', title: '1. Teach', lines: ['your labelled examples', 'fit a correction to', 'your question'] },
	{ id: 'certify', title: '2. Certify', lines: ['examples held back', 'set a threshold with', 'an error target'] },
	{ id: 'route', title: '3. Route', lines: ['certified answers act', 'on their own; the rest', 'go to a person'] },
];

function teachFlow(on) {
	const box = (s, i) => {
		const x = 12 + i * 236;
		const lit = s.id === on || (on === 'drift' && s.id === 'route');
		return `<rect class="f-node${lit ? ' f-node--on' : ''}" x="${x}" y="12" width="208" height="104" rx="12"/>
<text class="ft ft-b" x="${x + 16}" y="40">${esc(s.title)}</text>
${s.lines.map((l, j) => `<text class="ft ft-s" x="${x + 16}" y="${64 + j * 18}">${esc(l)}</text>`).join('')}
${i < STEPS.length - 1 ? `<path class="f-line" d="M${x + 208} 64L${x + 236} 64" pathLength="1" marker-end="url(#tf)"/>` : ''}`;
	};
	const watch = `<rect class="f-node${on === 'drift' ? ' f-node--on' : ''}" x="248" y="136" width="444" height="50" rx="12"/>
<text class="ft ft-b" x="264" y="166">Watched</text>
<text class="ft ft-s" x="340" y="166">the server suspends certificates when traffic shifts</text>
<path class="f-frame" d="M480 116L480 136"/>`;
	const body = `<svg class="fig__svg" viewBox="0 0 720 196" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><marker id="tf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="f-head" d="M0 0L10 5L0 10z"/></marker></defs>${STEPS.map(box).join('')}${watch}</svg>`;
	const page = { teach: 'This page is the first step.', certify: 'This page is the second step.', drift: 'This page is the watch over the third.' }[on];
	return panel({
		name: `teach-flow-${on}`, label: 'Teach and trust', title: 'Teach the question, certify its answers, route on the certificate, and let the server watch.',
		desc: `Three steps and a watch. 1, teach: your labelled examples fit a correction to your question. 2, certify: examples held back set a threshold with an error target. 3, route: certified answers act on their own and the rest go to a person. The server watches the traffic and suspends certificates when it shifts. ${page}`,
		body, legend: page,
	});
}

// --- The certify slider -------------------------------------------------------------------------------------------------

/** The support inbox at each error target: the server's certificate on its test messages. */
export function inboxStops() {
	const d = tcData();
	const ib = d.inbox;
	const stops = Object.entries(ib.targets).map(([a, t]) => ({ alpha: Number(a), threshold: t.threshold, certified: t.covered, wrong: t.errors }));
	if (stops.length < 2) throw new Error('certify slider: the inbox has fewer than two error targets');
	return {
		stops, n: ib.test_n, teach: ib.teach_n, held: ib.cal_n, perLabel: ib.k, labels: ib.labels.length,
		base: baseName(ib.model), dataset: datasetName(ib.dataset), decisio: d.decisio, dates: d.dates,
	};
}

const say = (R, s) => (s.threshold === null
	? `At an error target of ${s.alpha * 100}%, nothing is certified: with ${fmt(R.held)} examples held back, no threshold can promise it. Every answer still comes back, marked not certified.`
	: `At an error target of ${s.alpha * 100}%, answers with a top probability of at least ${s.threshold.toFixed(3)} are certified: ${fmt(s.certified)} of ${fmt(R.n)} messages (${pct(s.certified / R.n)}), ${s.wrong} of them wrong (${pct(s.wrong / s.certified)}). The rest come back marked not certified.`);

function certifySlider() {
	const R = inboxStops();
	const start = R.stops.findIndex((s) => s.alpha === 0.05);
	const s0 = R.stops[start];
	const w = (s) => (640 * s.certified / R.n).toFixed(1);
	const bad = (s) => (640 * s.wrong / R.n).toFixed(1);
	const body = `<div class="th" data-cs data-d="${esc(JSON.stringify(R))}"><label class="th__l" for="cs-in">Error target: at most this share of certified answers wrong</label>
<input id="cs-in" class="th__in" type="range" min="0" max="${R.stops.length - 1}" step="1" value="${start}" aria-describedby="cs-out">
<div class="th__ticks" aria-hidden="true">${R.stops.map((s) => `<span>${s.alpha * 100}%</span>`).join('')}</div>
<svg class="th__svg" viewBox="0 0 640 56" aria-hidden="true"><rect class="f-rail" x="0" y="8" width="640" height="24" rx="6"/><rect class="th__kept" data-cs-ok x="0" y="8" width="${w(s0)}" height="24" rx="6"/><rect class="cs__bad" data-cs-bad x="${(w(s0) - bad(s0)).toFixed(1)}" y="8" width="${bad(s0)}" height="24"/><text class="ft ft-d" x="0" y="52">certified</text><text class="ft ft-d" x="640" y="52" text-anchor="end">not certified</text></svg>
<p id="cs-out" class="th__out" data-cs-out aria-live="polite">${esc(say(R, s0))}</p></div>`;
	return panel({
		name: 'certify-slider', label: 'Certifying answers', title: 'A stricter error target certifies fewer answers; the server picks the threshold that keeps its promise.',
		desc: `The support inbox, ${R.dataset} with ${R.labels} intents, taught with ${R.perLabel} examples per intent on ${R.base}. ${R.stops.map((s) => say(R, s)).join(' ')}`,
		body, interactive: true,
		legend: `Each stop is the server's own certificate, made on ${fmt(R.held)} held-back examples and checked on ${fmt(R.n)} test messages it never saw. The contrasting end of the certified bar is the answers that were wrong.`,
		source: `Source: the teach-and-certify runs, ${R.base} on its FP8 checkpoint, decisio ${R.decisio}, ${R.dates[0]} to ${R.dates[1]}.`,
	});
}

// --- The drift replay ---------------------------------------------------------------------------------------------------

/** decisio's replay: when each of the two signals alerted, and how many wrong certified answers came before. */
export function driftReplay() {
	const tasks = readUpstream('docs/tasks.md');
	const summary = readUpstream('runs/2026-10-17_drift-monitor/summary.md');
	const num = (s) => Number(s.replace(/,/g, ''));
	const m = /([\d,]+) messages, out-of-scope messages rising from message ([\d,]+) to (\d+)%/.exec(tasks);
	const a = /the confidence signal alerted at message ([\d,]+) after (\d+) wrong certified answers, where the answer mix alerted after message ([\d,]+) and (\d+)/.exec(tasks);
	const top = /rises from 0 at message ([\d,]+) to (\d+)% at message ([\d,]+)/.exec(summary);
	if (!m || !a || !top) throw new Error('drift replay: docs/tasks.md or the replay summary no longer states the stream and its alerts');
	if (num(top[1]) !== num(m[2]) || Number(top[2]) !== Number(m[3])) throw new Error('drift replay: docs/tasks.md and the replay summary describe different streams');
	return { messages: num(m[1]), start: num(m[2]), share: Number(m[3]) / 100, full: num(top[3]), confidence: { at: num(a[1]), wrong: Number(a[2]) }, mix: { at: num(a[3]), wrong: Number(a[4]) } };
}

function drift() {
	const R = driftReplay();
	const x = (n) => 24 + (600 * n) / R.messages;
	const y = (s) => 186 - (s / R.share) * 100;
	// The first alert's label sits above the shaded area, right of its line; the second's inside the area, left of its
	// line, so the two never meet.
	const body = `<svg class="fig__svg" viewBox="0 0 720 222" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path class="f-area" d="M${x(0)} 186L${x(R.start).toFixed(1)} 186L${x(R.full).toFixed(1)} ${y(R.share).toFixed(1)}L${x(R.messages).toFixed(1)} ${y(R.share).toFixed(1)}L${x(R.messages).toFixed(1)} 186Z"/>
<path class="f-axis" d="M24 186L${x(R.messages)} 186"/>
<path class="f-mark f-mark--on" d="M${x(R.confidence.at).toFixed(1)} 20L${x(R.confidence.at).toFixed(1)} 186"/>
<text class="ft ft-b" x="${(x(R.confidence.at) + 8).toFixed(1)}" y="34">The confidence signal alerts</text>
<text class="ft ft-d" x="${(x(R.confidence.at) + 8).toFixed(1)}" y="52">message ${fmt(R.confidence.at)}, after ${R.confidence.wrong} wrong certified answers</text>
<path class="f-mark" d="M${x(R.mix.at).toFixed(1)} 20L${x(R.mix.at).toFixed(1)} 186"/>
<text class="ft ft-b" x="${(x(R.mix.at) - 8).toFixed(1)}" y="${(y(R.share) + 40).toFixed(1)}" text-anchor="end">The answer mix alerts</text>
<text class="ft ft-d" x="${(x(R.mix.at) - 8).toFixed(1)}" y="${(y(R.share) + 58).toFixed(1)}" text-anchor="end">message ${fmt(R.mix.at)}, after ${fmt(R.mix.wrong)} wrong</text>
<text class="ft ft-d" x="24" y="208">message 0</text><text class="ft ft-d" x="${x(R.messages)}" y="208" text-anchor="end">${fmt(R.messages)}</text>
<text class="ft ft-d" x="${(x(R.messages) + 8).toFixed(1)}" y="${(y(R.share) + 4).toFixed(1)}">${R.share * 100}%</text>
<text class="ft ft-d" x="${(x(R.messages) + 8).toFixed(1)}" y="190">0%</text>
</svg>`;
	return panel({
		name: 'drift-replay', label: 'Watching for drift', title: 'The confidence signal sees the shift early; the answer mix sees it late.',
		desc: `decisio's replay of ${fmt(R.messages)} messages to a certified task, with messages that fit none of its options rising from message ${fmt(R.start)} to ${R.share * 100}%. The confidence signal alerted at message ${fmt(R.confidence.at)}, after ${R.confidence.wrong} wrong certified answers; the answer mix alerted after message ${fmt(R.mix.at)}, after ${fmt(R.mix.wrong)}.`,
		body, legend: 'The shaded area is the share of messages the task has no option for, from 0% to its peak; each of them is a wrong answer. The confidence signal suspends certification by default; the answer mix only reports.',
		source: 'Source: docs/tasks.md and runs/2026-10-17_drift-monitor/ at the pinned release: an offline replay of recorded reads of the stored Gemma 4 31B, one task.',
	});
}

export const tasksFigures = {
	'teach-flow-teach': () => teachFlow('teach'),
	'teach-flow-certify': () => teachFlow('certify'),
	'teach-flow-drift': () => teachFlow('drift'),
	'certify-slider': certifySlider,
	'drift-replay': drift,
};
