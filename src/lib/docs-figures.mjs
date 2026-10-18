// The docs' animated and interactive figures, drawn at build time as inline SVG and HTML from launch_facts.public.json, the
// README and the recorded decisions, so each number and name has one source. A page shows one with
//   ::figure{name="request-flow"}
// (remark-docs.mjs). Every figure is a panel: a label and a one-sentence title, the drawing, a legend line and a source.
// It is at its final state in the page as written, so it reads the same without scripts and under reduced motion;
// src/scripts/docs-figures.ts starts the ones that move (never before they are on screen), adds a Pause button,
// and wires the ones that answer to hover or a slider. Styled by `.fig` in docs.css, both themes.
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
		return `<g class="fig-row">
<line class="f-line fd-${3 + i}" x1="396" y1="165" x2="452" y2="${y + 22}" pathLength="1"/>
<g class="f-pop fd-${5 + i}"><text class="ft ft-b" x="460" y="${y + 8}">${esc(q.name)}</text><text class="ft ft-d" x="${460 + q.name.length * 8.4 + 8}" y="${y + 8}">${esc(q.type)}</text>
<rect class="f-rail" x="460" y="${y + 20}" width="232" height="14" rx="7"/><rect class="f-bar f-grow fd-${6 + i}" x="460" y="${y + 20}" width="${Math.max(2, 232 * b.p).toFixed(1)}" height="14" rx="7"/>
<text class="ft" x="460" y="${y + 56}">${esc(barLabel(q))}</text><text class="ft ft-n" x="692" y="${y + 56}" text-anchor="end">${p2(b.p)}</text></g></g>`;
	}).join('');
	const text = wrapText(it.state, 22);
	const body = `<svg class="fig__svg" viewBox="0 0 720 330" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<rect class="f-node fd-0" x="8" y="96" width="196" height="138" rx="12"/>
<text class="ft ft-k" x="22" y="120">Your text</text>
${text.map((l, i) => `<text class="ft ft-s f-pop fd-1" x="22" y="${144 + i * 20}">${esc(l)}</text>`).join('')}
<path class="f-line fd-2" d="M204 165L262 165" pathLength="1"/>
<rect class="f-node f-node--on fd-2" x="262" y="118" width="134" height="94" rx="12"/>
<text class="ft ft-b" x="329" y="156" text-anchor="middle">Decisio</text>
<text class="ft ft-d" x="329" y="178" text-anchor="middle">reads it once</text>
<text class="ft ft-n f-pop fd-3" x="329" y="198" text-anchor="middle">${it.serverMs.toFixed(1)} ms</text>
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

// --- The annotated request and response ----------------------------------------------------------------------------

/** JSON as indented lines, each member in a span named by `tag(path)` (undefined: no span), so a hover can find its partner. */
function pretty(value, tag, path = [], depth = 0) {
	const pad = '  '.repeat(depth);
	const wrap = (p, inner) => {
		const k = tag(p);
		return k ? `<span class="j" data-k="${esc(k)}" tabindex="0">${inner}</span>` : inner;
	};
	if (value === null || typeof value !== 'object') return esc(JSON.stringify(value));
	const isArr = Array.isArray(value);
	const entries = isArr ? value.map((v, i) => [i, v]) : Object.entries(value);
	if (!entries.length) return isArr ? '[]' : '{}';
	const lines = entries.map(([k, v], i) => {
		const p = [...path, k];
		const comma = i < entries.length - 1 ? ',' : '';
		const head = isArr ? '' : `<span class="jk">${esc(JSON.stringify(k))}</span>: `;
		return `${pad}  ${wrap(p, `${head}${pretty(v, tag, p, depth + 1)}${comma}`)}`;
	});
	return `${isArr ? '[' : '{'}\n${lines.join('\n')}\n${pad}${isArr ? ']' : '}'}`;
}

/**
 * Your first decision: the request and the response side by side. Hovering or focusing a question, an option or the
 * text highlights its partner on the other side, and a line below says what it is.
 */
function firstDecision() {
	const r = recorded();
	const it = r.items[0];
	const req = recordedRequest();
	const res = recordedResponse();
	const qnames = Object.keys(req.questions);
	const reqTag = (p) => {
		if (p.length === 1 && p[0] === 'state') return 'state';
		if (p[0] !== 'questions') return undefined;
		if (p.length === 2) return `q:${p[1]}`;
		if (p.length === 4 && p[2] === 'criteria') return `o:${p[1]}:${p[3]}`;
		if (p.length === 3 && p[2] === 'type') return `t:${p[1]}`;
		return undefined;
	};
	const resTag = (p) => {
		if (p[0] !== 'answers') return undefined;
		if (p.length === 2) return `q:${p[1]}`;
		if (p.length === 3 && p[2] === 'type') return `t:${p[1]}`;
		if (p.length === 4 && p[2] === 'probabilities') return `o:${p[1]}:${p[3]}`;
		return undefined;
	};
	const notes = { '': 'Hover or focus a line: its partner on the other side lights up, and what it is appears here.' };
	notes.state = `The text the questions are about. It is read once; every question below reads it from that one read (${it.serverMs.toFixed(1)} ms on the server for the three).`;
	for (const q of it.questions) {
		const b = topBar(q);
		notes[`q:${q.name}`] = q.type === 'yes/no'
			? `"${q.name}": a yes/no question. The answer is one number, the probability of yes: ${p3(b.p)}.`
			: q.type === 'choice'
				? `"${q.name}": a choice among ${q.bars.length} named options. The answer names the likeliest, ${b.label}, and gives every option's probability; they add up to 1.`
				: `"${q.name}": a score on an ordered scale of ${q.bars.length} levels, lowest first. The answer is a probability for each level; level ${b.label} is the likeliest, at ${p3(b.p)}.`;
		notes[`t:${q.name}`] = q.type === 'yes/no' ? 'noul is the wire format\'s name for a yes/no question.' : `The question's type: ${q.type === 'choice' ? 'choice' : 'score'}.`;
		if (q.type !== 'yes/no') for (const o of q.bars) notes[`o:${q.name}:${o.label}`] = `${q.type === 'score' ? 'Level' : 'Option'} ${o.label}${q.type === 'choice' ? ` (${o.title})` : ` (${o.title})`}: probability ${p3(o.p)}.`;
	}
	const noteHtml = Object.entries(notes).map(([k, v]) => `<span data-note="${esc(k)}"${k === '' ? '' : ' hidden'}>${esc(v)}</span>`).join('');
	const body = `<div class="fig__cols"><div class="fig__col"><p class="fig__colhead">Request</p><pre class="fig__json" tabindex="-1"><code>${pretty(req, reqTag)}</code></pre></div>
<div class="fig__col"><p class="fig__colhead">Response (abridged)</p><pre class="fig__json" tabindex="-1"><code>${pretty(res, resTag)}</code></pre></div></div>`;
	return panel({
		name: 'first-decision', label: 'The request and its response', title: 'Every question gets its own answer, with a probability for every option.',
		desc: `The request, one support ticket with ${qnames.length} questions (${qnames.join(', ')}), beside the response. Hovering a question, an option or the text highlights its partner. ${qnames.map((n) => notes[`q:${n}`]).join(' ')}`,
		body, interactive: true, extra: '', legend: `<span class="fig__note" data-fig-note aria-live="polite">${noteHtml}</span>`, source: sourceLine(r, 'the response is abridged and its probabilities are rounded to three places'),
	});
}

// --- Choosing a machine ---------------------------------------------------------------------------------------------

/**
 * Choose your machine: what you have, and the path that fits it, from the README's install table. Each row is a link;
 * the path it leads to is drawn beside it and lights in turn.
 */
function chooseMachine() {
	const readme = readUpstream('README.md');
	const need = (re, what) => { if (!re.test(readme)) throw new Error(`docs-figures: the README no longer says ${what}`); };
	need(/a 96 GB card, as measured/, 'that the GPU path needs a 96 GB card, as measured');
	need(/Mac with Apple silicon/, 'a Mac with Apple silicon path');
	need(/8\.6 GB for the Gemma base's smallest tag, so a 16 GB laptop/, 'that the Gemma base\'s smallest Ollama tag is 8.6 GB, so a 16 GB laptop');
	need(/a small Hugging Face model on the CPU/, 'that the CPU stand-in uses a small Hugging Face model');
	const rows = [
		{ have: 'Linux, one NVIDIA card', mem: '96 GB, as measured', path: 'GPU server', href: '/docs/quickstart/gpu-server/', note: 'The default base, Gemma 4 31B.' },
		{ have: 'Linux, one NVIDIA card, Docker', mem: '96 GB, as measured', path: 'Docker', href: '/docs/quickstart/docker/', note: 'The same server in a container.' },
		{ have: 'A Mac with Apple silicon', mem: 'each base has its own, in the How-to guides', path: 'Mac with MLX', href: '/docs/quickstart/mac-mlx/', note: 'The bases run from their MLX conversions.' },
		{ have: 'A laptop with Ollama', mem: '8.6 GB for the Gemma base\'s smallest tag', path: 'Ollama', href: '/docs/quickstart/ollama/', note: 'A 16 GB laptop fits it; Ollama applies no calibration.' },
		{ have: 'Any machine, for development', mem: 'a small Hugging Face model on the CPU', path: 'CPU stand-in', href: '/docs/quickstart/cpu-stand-in/', note: 'Serves the routes; not the measured system.' },
	];
	const body = `<ul class="fig__paths">${rows.map((r, i) => `<li class="fig__path f-pop fd-${i}"><span class="fig__have"><b>${esc(r.have)}</b><span>${esc(r.mem)}</span></span><span class="fig__arrow" aria-hidden="true"></span><a class="fig__to" href="${r.href}"><b>${esc(r.path)}</b><span>${esc(r.note)}</span></a></li>`).join('')}</ul>`;
	return panel({
		name: 'choose-machine', label: 'Your machine', title: 'One server, five ways to run it; start from what you have.',
		desc: `What you have and the path that fits it: ${rows.map((r) => `${r.have} (${r.mem}) takes ${r.path}`).join('; ')}.`,
		body, live: 6, interactive: true, legend: 'The memory is what the README states for each path; the sizes of each base are in Choosing a base.', source: 'Source: the README\'s "Install and run" table.',
	});
}

import { guidesFigures } from './figures/guides.mjs';
import { runItFigures } from './figures/run-it.mjs';
import { understandFigures } from './figures/understand.mjs';
import { useFromFigures } from './figures/use-from.mjs';

export const figures = { 'request-flow': requestFlow, 'first-decision': firstDecision, 'choose-machine': chooseMachine, ...useFromFigures, ...guidesFigures, ...runItFigures, ...understandFigures };

export function docsFigure(name) {
	const f = figures[name];
	if (!f) throw new Error(`docs-figures: no figure named "${name}" (known: ${Object.keys(figures).join(', ')})`);
	return f();
}
