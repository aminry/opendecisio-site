// The docs' animated and interactive figures, drawn at build time as inline SVG and HTML from launch_facts.public.json, the
// README and the recorded decisions, so each number and name has one source. A page shows one with
//   ::figure{name="request-flow"}
// (remark-docs.mjs). Every figure is a panel: a label and a one-sentence title, the drawing, a legend line and a source.
// It is at its final state in the page as written, so it reads the same without scripts and under reduced motion;
// src/scripts/docs-figures.ts provides explicit finite playback, keyboard field selection and sliders. Styled by `.fig` in docs.css, both themes.
import { readUpstream } from './upstream.mjs';

import { barLabel, esc, p2, p3, panel, recorded, recordedRequest, recordedResponse, sourceLine, topBar, wrapText } from './figures/core.mjs';

export { recordedLabel, recordedRequest, recordedResponse } from './figures/core.mjs';

/**
 * The request flow: the text goes in, the server reads it once, the questions fan out, and each answer's bar fills.
 * The first recorded decision of the launch facts, with its server time.
 */
function requestFlow() {
	const r = recorded();
	const it = r.items[0];
	const qs = it.questions;
	if (qs.length !== 3) throw new Error('docs-figures: the request flow expects the first recorded decision to have three questions');
	const rows = qs.map((q, i) => {
		const y = 38 + i * 98;
		const b = topBar(q);
		return `<g class="fig-row" data-phase="2">
<line class="f-line fd-${3 + i}" x1="396" y1="165" x2="452" y2="${y + 22}" pathLength="1"/>
<g class="f-pop fd-${5 + i}"><text class="ft ft-b" x="460" y="${y + 8}">${esc(q.name)}</text><text class="ft ft-d" x="${460 + q.name.length * 8.4 + 8}" y="${y + 8}">${esc(q.type)}</text>
<rect class="f-rail" x="460" y="${y + 20}" width="232" height="14" rx="7"/><rect class="f-bar f-grow fd-${6 + i}" x="460" y="${y + 20}" width="${Math.max(2, 232 * b.p).toFixed(1)}" height="14" rx="7"/>
<text class="ft" x="460" y="${y + 56}">${esc(barLabel(q))}</text><text class="ft ft-n" x="692" y="${y + 56}" text-anchor="end">${p2(b.p)}</text></g></g>`;
	}).join('');
	const text = wrapText(it.state, 22);
	const body = `<svg class="fig__svg" viewBox="0 0 720 330" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<g data-phase="0"><rect class="f-node fd-0" x="8" y="96" width="196" height="138" rx="12"/>
<text class="ft ft-k" x="22" y="120">Your text</text>
${text.map((l, i) => `<text class="ft ft-s f-pop fd-1" x="22" y="${144 + i * 20}">${esc(l)}</text>`).join('')}</g>
<path class="f-line fd-2" d="M204 165L262 165" pathLength="1"/>
<g data-phase="1"><rect class="f-node f-node--on fd-2" x="262" y="118" width="134" height="94" rx="12"/>
<text class="ft ft-b" x="329" y="156" text-anchor="middle">Decisio</text>
<text class="ft ft-d" x="329" y="178" text-anchor="middle">reads it once</text>
<text class="ft ft-n f-pop fd-3" x="329" y="198" text-anchor="middle">${it.serverMs.toFixed(1)} ms</text></g>
${rows}
</svg>`;
	return panel({
		name: 'request-flow', label: 'Request flow', title: 'The text is read once; every question is answered from that one read.',
		desc: `A support ticket goes into Decisio, which reads it once in ${it.serverMs.toFixed(1)} milliseconds. Three questions fan out of that read: ${qs.map((q) => `${q.name} (${q.type}) answers ${barLabel(q)} at ${p2(topBar(q).p)}`).join('; ')}.`,
		body, live: 7.5,
		legend: `One request, three questions, ${it.serverMs.toFixed(1)} ms on the server. Each bar is the likeliest option's probability.`,
		source: sourceLine(r),
	});
}

// The recorded answer retains its source; a small field chooser explains the wire format.
function firstDecision() {
	const r = recorded();
	return fieldMap({ name: 'first-decision', label: 'Recorded request and answer', request: recordedRequest(), response: recordedResponse(), source: sourceLine(r, 'the response is abridged and its probabilities are rounded to three places'), title: 'Every question gets its own typed answer.' });
}

import { guideFigures } from './figures/guides.mjs';
import { learningFigures, fieldMap } from './figures/learning.mjs';
import { runItFigures } from './figures/run-it.mjs';
import { understandFigures } from './figures/understand.mjs';
import { deployFigures } from './figures/deploy.mjs';
import { tasksFigures } from './figures/tasks.mjs';
import { useFromFigures } from './figures/use-from.mjs';
import { thinkFigures } from './figures/think.mjs';

export const figures = { 'request-flow': requestFlow, 'first-decision': firstDecision, ...learningFigures, ...guideFigures, ...useFromFigures, ...thinkFigures, ...runItFigures, ...understandFigures, ...deployFigures, ...tasksFigures };

export function docsFigure(name) {
	const f = figures[name];
	if (!f) throw new Error(`docs-figures: no figure named "${name}" (known: ${Object.keys(figures).join(', ')})`);
	return f();
}
