// The docs' diagrams, drawn at build time as inline SVG from launch_facts.public.json and the README, so each number
// and name has one source: the request flow, the cache timeline, the routing threshold and the bases.
// Shown on a docs page with ::diagram{name="..."} (remark-upstream.mjs). Styled by classes in docs.css (both themes);
// each has a title and a description for screen readers.
import { batchTotals, facts } from './launch.mjs';
import { bases } from './home.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n0 = (n) => Number(n).toLocaleString('en-US');
const wrap = (id, title, desc, w, h, body) => `<figure class="dg-fig" tabindex="0" aria-label="${esc(title)} (scrolls sideways on a narrow screen)"><svg class="dg" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-t ${id}-d" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc><defs><marker id="${id}-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1L9 5L0 9Z" class="dg-head"/></marker></defs>${body}</svg></figure>`;
const box = (x, y, w, h, lines, cls = '') => `<rect class="dg-node ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>${lines.map((l, i) => `<text class="dg-text${i ? ' dg-dim' : ''}" x="${x + w / 2}" y="${y + h / 2 + (i - (lines.length - 1) / 2) * 20 + 5}" text-anchor="middle">${esc(l)}</text>`).join('')}`;
const arrow = (id, x1, y1, x2, y2) => `<path class="dg-arrow" pathLength="1" d="M${x1} ${y1}L${x2} ${y2}" marker-end="url(#${id}-a)"/>`;

function requestFlow() {
	const id = 'dg-flow';
	const body = [
		box(10, 70, 120, 80, ['Your app', 'any HTTP client']),
		arrow(id, 130, 110, 170, 110),
		box(170, 70, 150, 80, ['POST /v1/systemone', 'a state and questions']),
		arrow(id, 320, 110, 360, 110),
		box(360, 40, 160, 140, ['Decisio server', 'reads the state once', 'keeps it in the cache'], 'dg-accent'),
		arrow(id, 520, 110, 560, 110),
		box(560, 70, 150, 80, ['One batch on the 31B', 'no text generated']),
		`<path class="dg-arrow" pathLength="1" d="M635 150L635 200L70 200L70 156" marker-end="url(#${id}-a)"/>`,
		`<text class="dg-text dg-dim" x="350" y="224" text-anchor="middle">a probability for every option, in the response</text>`,
	].join('');
	return wrap(id, 'The request flow', 'Your app sends one request with a state and its questions to POST /v1/systemone. The server reads the state once and keeps it in the cache; on the default Gemma 4 31B it scores all the questions together in one batch (the 12B and Qwen bases answer them one at a time by default), with no generated text, and the response carries a probability for every option.', 720, 240, body);
}

function cacheTimeline() {
	const id = 'dg-cache';
	// Measured totals only, to scale: one question on a new document, fifty in one request (one read, then the questions
	// scored together in one batch, the 31B's default), and a separate later request on the same document, from the
	// cache, under its own session's conditions. No bar stands for one question inside the batch.
	const b = batchTotals();
	const k = 460 / b.fiftyMs;
	const w1 = b.one * k;
	const wf = Math.max(3, b.followHigh * k);
	const body = [
		`<text class="dg-text dg-dim" x="10" y="24">One document of 3,000 tokens, Decisio 31B, measured totals drawn to scale (one box, ${b.date})</text>`,
		`<rect class="dg-bar dg-read" x="10" y="44" width="${w1.toFixed(1)}" height="34" rx="6"/>`,
		`<text class="dg-text" x="${(10 + w1 + 10).toFixed(1)}" y="66">1 question: ${n0(b.one)} ms, read included</text>`,
		`<rect class="dg-bar dg-read" x="10" y="92" width="460" height="34" rx="6"/>`,
		`<text class="dg-text" x="480" y="106">50 questions: ${esc(b.fifty)}</text>`,
		`<text class="dg-text dg-dim" x="480" y="122">one read, one batch</text>`,
		`<rect class="dg-bar dg-cached" x="10" y="146" width="${wf.toFixed(1)}" height="20" rx="3"/>`,
		`<text class="dg-text dg-dim" x="${(10 + wf + 10).toFixed(1)}" y="161">a later request on the same document, from the cache: ${esc(b.follow)}</text>`,
		`<text class="dg-text dg-dim" x="${(10 + wf + 10).toFixed(1)}" y="179">(${esc(b.followWhen)})</text>`,
		`<path class="dg-arrow" pathLength="1" d="M10 198L710 198" marker-end="url(#${id}-a)"/>`,
		`<text class="dg-text dg-dim" x="710" y="220" text-anchor="end">time</text>`,
	].join('');
	return wrap(id, 'The cache timeline', `On one 3,000-token document, Decisio 31B answers one question in ${n0(b.one)} milliseconds, reading included, and fifty questions in one request in ${b.fifty}: it reads the document once and scores the questions together in one batch. A later, separate request on the same document starts from the cache and takes ${b.follow} (${b.followWhen}). The bars are to scale.`, 720, 230, body);
}

function routingThreshold() {
	const id = 'dg-route';
	const r = facts().figures.routing_example5;
	const at = (k) => r.sweep.value.find((x) => x.keep_at === k);
	const rows = [at(0.8), at(0.9)];
	if (rows.some((x) => !x) || !r.questions?.value) throw new Error('diagrams: the routing diagram needs the 0.8 and 0.9 thresholds of example 5');
	const total = r.questions.value;
	const bars = rows.map((x, i) => {
		const y = 56 + i * 112;
		const keptW = Math.round(((total - x.escalated) / total) * 640 * 10) / 10;
		return `<text class="dg-text" x="10" y="${y - 10}">Keep answers at or above ${x.keep_at}</text><rect class="dg-bar dg-kept" x="10" y="${y}" width="${keptW}" height="28" rx="6"/><rect class="dg-bar dg-esc" x="${10 + keptW}" y="${y}" width="${640 - keptW}" height="28" rx="6"/><text class="dg-text dg-dim" x="10" y="${y + 56}">${n0(x.escalated)} of ${n0(total)} escalated (${(x.escalated_share * 100).toFixed(1)}%), ${(x.accuracy_kept * 100).toFixed(1)}% right on the rest</text>`;
	}).join('');
	const body = `${bars}<rect class="dg-bar dg-kept" x="10" y="266" width="22" height="12" rx="3"/><text class="dg-text dg-dim" x="38" y="277">kept</text><rect class="dg-bar dg-esc" x="86" y="266" width="22" height="12" rx="3"/><text class="dg-text dg-dim" x="114" y="277">sent to a person or a larger model</text>`;
	return wrap(id, 'The routing threshold', `Two bars of the ${n0(total)} questions of example 5, drawn to scale. At a threshold of 0.8, ${rows[0].escalated} are escalated; at 0.9, ${rows[1].escalated}. The rest are kept.`, 720, 292, body);
}

function basesDiagram() {
	const id = 'dg-bases';
	const rows = bases().map((b) => ({ flag: /<code>([^<]+)<\/code>/.exec(b.base)?.[1] ?? '', def: /\(default\)/.test(b.base) }));
	if (rows.length !== 3 || rows.some((r) => !r.flag)) throw new Error('diagrams: the bases diagram needs the three bases of the README table');
	const body = [
		...rows.map((r, i) => box(10, 20 + i * 76, 270, 60, [`--base ${r.flag.replace(/-it$/, '')}`, r.def ? 'the default' : ' '], `dg-base dg-b${i}`)),
		...rows.map((r, i) => arrow(id, 280, 50 + i * 76, 350, 126)),
		box(350, 60, 360, 130, ['One Decisio server', 'the same routes, calibration,', 'task registration and prefix cache'], 'dg-accent'),
	].join('');
	return wrap(id, 'The bases', `One flag, --base, chooses the model among ${rows.map((r) => r.flag.replace(/-it$/, '')).join(', ')}. Every base is served by the same Decisio server with the same routes, calibration, task registration and prefix cache.`, 720, 260, body);
}

export const diagrams = { 'request-flow': requestFlow, 'cache-timeline': cacheTimeline, 'routing-threshold': routingThreshold, bases: basesDiagram };
export const diagram = (name) => {
	if (!diagrams[name]) throw new Error(`diagrams: no diagram named ${name}`);
	return diagrams[name]();
};
