// The three scenes of the home page's "How it works": the request, the read-once cache and the threshold, as inline
// SVG drawn at build time from launch_facts.public.json, to scale where a time is drawn. They are static in the HTML; the
// stepper in src/scripts/proto.ts only switches the one on show, which starts its CSS animation (draw-in lines, bars
// that grow), and moves the threshold through the measured sweep. Each has a title and a description.
import { batchTotals, facts, recordedExamples } from './launch.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n0 = (n) => Number(n).toLocaleString('en-US');
const svg = (id, title, desc, h, body) => `<svg class="scene" viewBox="0 0 880 ${h}" role="img" aria-labelledby="${id}-t ${id}-d" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc><defs><marker id="${id}-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1L9 5L0 9Z" class="sc-head"/></marker></defs>${body}</svg>`;
const node = (x, y, w, h, l1, l2, cls = '') => `<rect class="sc-node ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/><text class="sc-t" x="${x + w / 2}" y="${y + h / 2 + (l2 ? -3 : 5)}" text-anchor="middle">${esc(l1)}</text>${l2 ? `<text class="sc-t sc-dim" x="${x + w / 2}" y="${y + h / 2 + 15}" text-anchor="middle">${esc(l2)}</text>` : ''}`;
const line = (id, d, delay) => `<path id="${id}-l${delay}" class="sc-line" pathLength="1" d="${d}" marker-end="url(#${id}-a)" data-d="${delay}"/>`;
// A dot that runs along a line once it has drawn in, over and over: a request travelling (paused off screen and under
// reduced motion, by src/scripts/depth.ts).
// Hidden until its run begins: before that, a moving dot sits at the drawing's top-left corner.
const dot = (id, k) => {
	const at = `${(1.3 + k * 0.35).toFixed(2)}s`;
	return `<circle class="sc-dot" r="4.5" visibility="hidden"><set attributeName="visibility" to="visible" begin="${at}" fill="freeze"/><animateMotion dur="1.4s" repeatCount="indefinite" begin="${at}"><mpath href="#${id}-l${k}"/></animateMotion></circle>`;
};

function request() {
	const id = 'sc-req';
	// The bars are a recorded answer: the first tool-decision record of decisio-examples (figures.recorded_decisions).
	const rec = recordedExamples().items.find((x) => x.id === '04-tool-decision#0');
	if (!rec) throw new Error('scenes: the request scene needs the first tool-decision record');
	const bars = rec.questions[0].bars;
	const body = [
		node(10, 74, 130, 76, 'Your app', 'a state, questions'),
		line(id, 'M140 112L184 112', 0),
		node(184, 74, 180, 76, 'POST /v1/systemone', 'one request'),
		line(id, 'M364 112L408 112', 1),
		node(408, 46, 160, 132, 'Decisio', 'one read, one batch', 'sc-hot'),
		line(id, 'M568 112L612 112', 2),
		`<text class="sc-t sc-dim" x="620" y="40">a probability for every option</text>`,
		dot(id, 0),
		dot(id, 1),
		dot(id, 2),
		...bars.map((b, i) => `<text class="sc-t sc-dim" x="620" y="${74 + i * 26 + 9}">${esc(b.label)}</text><rect class="sc-rail" x="700" y="${74 + i * 26}" width="140" height="11" rx="5"/><rect class="sc-grow" x="700" y="${74 + i * 26}" width="${Math.max(2, b.p * 140).toFixed(1)}" height="11" rx="5"/><text class="sc-t sc-dim" x="848" y="${74 + i * 26 + 9}" font-size="11">${b.p.toFixed(2)}</text>`),
	].join('');
	return svg(id, 'The request', 'Your app sends one request with a state and its questions. Decisio reads the state once and, on the default Gemma 4 31B, scores the questions together in one batch; the response is a probability for every option, and the bars are a recorded answer.', 220, body);
}

function cache() {
	const id = 'sc-cache';
	// Measured totals only, to scale and grown over their own time (data-ms): one question on a new document, and fifty in
	// one request, one read and then one batch (the 31B's default); then a separate later request on the same document,
	// from the cache, under its own session's conditions. No bar stands for one question inside the batch.
	const b = batchTotals();
	const k = 600 / b.fiftyMs;
	const w1 = b.one * k;
	const wf = Math.max(3, b.followHigh * k);
	const body = [
		`<text class="sc-t sc-dim" x="10" y="22">One 3,000-token document, Decisio 31B, measured totals to scale (one box, ${b.date})</text>`,
		`<rect class="sc-bar sc-read" data-ms="${b.one}" x="10" y="40" width="${w1.toFixed(1)}" height="34" rx="6"/><text class="sc-t" x="${(10 + w1 + 12).toFixed(1)}" y="62">1 question: ${n0(b.one)} ms, read included</text>`,
		`<rect class="sc-bar sc-read" data-ms="${b.fiftyMs}" x="10" y="90" width="600" height="34" rx="6"/><text class="sc-t" x="${(10 + 600 + 12).toFixed(1)}" y="104">50 questions: ${esc(b.fifty)}</text><text class="sc-t sc-dim" x="${(10 + 600 + 12).toFixed(1)}" y="120">one read, one batch</text>`,
		`<rect class="sc-bar sc-cached" data-pop="0" x="10" y="146" width="${wf.toFixed(1)}" height="20" rx="3"/><text class="sc-t sc-dim" x="${(10 + wf + 12).toFixed(1)}" y="161">a later request on the same document, from the cache: ${esc(b.follow)} (${esc(b.followWhen)})</text>`,
		`<path class="sc-line" pathLength="1" d="M10 190L866 190" marker-end="url(#${id}-a)" data-d="0"/><text class="sc-t sc-dim" x="866" y="212" text-anchor="end">time</text>`,
	].join('');
	return svg(id, 'The cache', `On one 3,000-token document, Decisio 31B answers one question in ${n0(b.one)} milliseconds, reading included, and fifty questions in one request in ${b.fifty}: it reads the document once and scores the questions together in one batch. A later, separate request on the same document starts from the cache and takes ${b.follow} (${b.followWhen}). The bars are to scale.`, 220, body);
}

function threshold() {
	const id = 'sc-thr';
	const r = facts().figures.routing_example5;
	const at = r.sweep.value.find((x) => x.keep_at === 0.8);
	if (!at || !r.questions?.value) throw new Error('scenes: the threshold scene needs the 0.8 threshold of example 5');
	const total = r.questions.value;
	const keptW = ((total - at.escalated) / total) * 840;
	const body = [
		`<text class="sc-t sc-dim" x="20" y="24">Keep answers at or above</text><text class="sc-t sc-hot-t" x="190" y="24" data-sweep-at>${at.keep_at}</text>`,
		`<rect class="sc-bar sc-kept" data-sweep-kept x="20" y="48" width="${keptW.toFixed(1)}" height="44" rx="6"/><rect class="sc-bar sc-esc" data-sweep-esc x="${(20 + keptW).toFixed(1)}" y="48" width="${(840 - keptW).toFixed(1)}" height="44" rx="6"/>`,
		`<text class="sc-t" x="20" y="122" data-sweep-out>${n0(at.escalated)} of ${n0(total)} questions escalated</text>`,
		`<text class="sc-t sc-dim" x="20" y="148">The rest are kept. Drawn to scale.</text>`,
	].join('');
	return svg(id, 'The threshold', `A bar of the ${n0(total)} questions of example 5: the ones kept at or above the threshold, and the ones escalated to a person or a larger model. The threshold moves through the measured values.`, 160, body);
}

export const scenes = () => [
	{ id: 'request', label: 'The request', text: 'One request carries a state and its questions.', svg: request() },
	{ id: 'cache', label: 'The cache', text: 'The state is read once, and the questions are scored together in one batch. A later request on the same state starts from the cache.', svg: cache() },
	{ id: 'threshold', label: 'The threshold', text: 'Keep the answers above a threshold you pick. Send the rest to a person or a larger model.', svg: threshold() },
];
