// The figures of "Teach and trust": the order the three guides follow (teach, certify, route, watched), the certify
// slider on the support inbox, and the drift stream on the card. The slider and the drift chart read the
// teach-and-certify runs (src/lib/teach-certify.mjs, which checks them), the records the demo page shows too. All three are still apart from the slider, which moves only when the reader moves it.
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

/** The CLINC150 drift stream on the card, as the teach-and-certify page shows it: under decisio 0.14.0, where only
 * the answer mix alerted and certification stayed on, and on the 0.16.0 release candidate, where the confidence alarm
 * suspended it. Both from src/data/teach-certify/ (src/lib/teach-certify.mjs checks that the two compare one stream). */
export function driftStream() {
	const d = tcData();
	const g = d.drift.g31;
	const r = d.release016;
	if (!r?.released) throw new Error('drift chart: the 0.16.0 measurement is not marked released in teach_certify.json');
	return {
		messages: g.messages, start: g.start, full: g.top, share: g.top_share, old: d.decisio,
		mix: { at: g.first_alert_after, wrong: g.wrong_before },
		suspended: { at: r.clinc.first_suspended, wrong: r.clinc.wrong_before, version: r.version, on: r.measured_on, model: r.model },
		base: baseName('g31'), machine: d.models.g31.machine, dates: d.dates,
	};
}

function drift() {
	const R = driftStream();
	const x = (n) => 24 + (600 * n) / R.messages;
	const y = (s) => 186 - (s / R.share) * 100;
	// The suspension's label sits above the shaded area, right of its line; the old alert's inside the area, left of
	// its line, so the two never meet.
	const body = `<svg class="fig__svg" viewBox="0 0 720 222" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path class="f-area" d="M${x(0)} 186L${x(R.start).toFixed(1)} 186L${x(R.full).toFixed(1)} ${y(R.share).toFixed(1)}L${x(R.messages).toFixed(1)} ${y(R.share).toFixed(1)}L${x(R.messages).toFixed(1)} 186Z"/>
<path class="f-axis" d="M24 186L${x(R.messages)} 186"/>
<path class="f-mark f-mark--on" d="M${x(R.suspended.at).toFixed(1)} 20L${x(R.suspended.at).toFixed(1)} 186"/>
<text class="ft ft-b" x="${(x(R.suspended.at) + 8).toFixed(1)}" y="34">decisio ${R.suspended.version}: certification suspended</text>
<text class="ft ft-d" x="${(x(R.suspended.at) + 8).toFixed(1)}" y="52">message ${fmt(R.suspended.at)}, after ${R.suspended.wrong} wrong certified answers</text>
<path class="f-mark" d="M${x(R.mix.at).toFixed(1)} 20L${x(R.mix.at).toFixed(1)} 186"/>
<text class="ft ft-b" x="${(x(R.mix.at) - 8).toFixed(1)}" y="${(y(R.share) + 40).toFixed(1)}" text-anchor="end">decisio ${R.old}: only the answer mix alerts</text>
<text class="ft ft-d" x="${(x(R.mix.at) - 8).toFixed(1)}" y="${(y(R.share) + 58).toFixed(1)}" text-anchor="end">message ${fmt(R.mix.at)}, after ${fmt(R.mix.wrong)} wrong; still certifying</text>
<text class="ft ft-d" x="24" y="208">message 0</text><text class="ft ft-d" x="${x(R.messages)}" y="208" text-anchor="end">${fmt(R.messages)}</text>
<text class="ft ft-d" x="${(x(R.messages) + 8).toFixed(1)}" y="${(y(R.share) + 4).toFixed(1)}">${R.share * 100}%</text>
<text class="ft ft-d" x="${(x(R.messages) + 8).toFixed(1)}" y="190">0%</text>
</svg>`;
	return panel({
		name: 'drift-replay', label: 'Watching for drift', title: `From decisio ${R.suspended.version}, the alarm suspends certification early; before it, only the answer mix alerted, late.`,
		desc: `A certified CLINC150 task on ${R.base}, sent ${fmt(R.messages)} messages, with messages that fit none of its options rising from message ${fmt(R.start)} to ${R.share * 100}% at message ${fmt(R.full)}. On decisio ${R.suspended.version}, certification was first suspended at message ${fmt(R.suspended.at)}, after ${R.suspended.wrong} wrong certified answers. Under decisio ${R.old}, only the answer mix alerted, after message ${fmt(R.mix.at)}, by when ${fmt(R.mix.wrong)} wrong answers had been certified, and certification stayed on.`,
		body, legend: 'The shaded area is the share of messages the task has no option for, from 0% to its peak; each of them is a wrong answer. While certification is suspended, answers keep coming, none marked certified.',
		source: `Source: the teach-and-certify runs, ${R.suspended.model}: decisio ${R.old} on ${R.machine}, ${R.dates[0]}; and ${R.suspended.on}.`,
	});
}

export const tasksFigures = {
	'teach-flow-teach': () => teachFlow('teach'),
	'teach-flow-certify': () => teachFlow('certify'),
	'teach-flow-drift': () => teachFlow('drift'),
	'certify-slider': certifySlider,
	'drift-replay': drift,
};
