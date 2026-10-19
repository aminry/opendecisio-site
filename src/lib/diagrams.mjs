// The docs' diagram of the request flow, drawn at build time as inline SVG.
// Shown on a docs page with ::diagram{name="..."} (remark-upstream.mjs). Styled by classes in docs.css (both themes);
// each has a title and a description for screen readers.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const wrap = (id, title, desc, w, h, body) => `<figure class="dg-fig" tabindex="0" aria-label="${esc(title)} (scrolls sideways on a narrow screen)"><svg class="dg" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-t ${id}-d" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc><defs><marker id="${id}-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1L9 5L0 9Z" class="dg-head"/></marker></defs>${body}</svg></figure>`;
const box = (x, y, w, h, lines, cls = '') => `<rect class="dg-node ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>${lines.map((l, i) => `<text class="dg-text${i ? ' dg-dim' : ''}" x="${x + w / 2}" y="${y + h / 2 + (i - (lines.length - 1) / 2) * 20 + 5}" text-anchor="middle">${esc(l)}</text>`).join('')}`;
const arrow = (id, x1, y1, x2, y2) => `<path class="dg-arrow" pathLength="1" d="M${x1} ${y1}L${x2} ${y2}" marker-end="url(#${id}-a)"/>`;

function requestFlow() {
	const id = 'dg-flow';
	const body = [
		box(10, 70, 120, 80, ['Your app', 'any HTTP client']),
		arrow(id, 130, 110, 170, 110),
		box(170, 70, 150, 80, ['POST /v1/systemone', 'a text and questions']),
		arrow(id, 320, 110, 360, 110),
		box(360, 40, 160, 140, ['Decisio server', 'reads the text once', 'keeps what it read'], 'dg-accent'),
		arrow(id, 520, 110, 560, 110),
		box(560, 70, 150, 80, ['One batch on the 31B', 'no text generated']),
		`<path class="dg-arrow" pathLength="1" d="M635 150L635 200L70 200L70 156" marker-end="url(#${id}-a)"/>`,
		`<text class="dg-text dg-dim" x="350" y="224" text-anchor="middle">a probability for every option, in the response</text>`,
	].join('');
	return wrap(id, 'The request flow', 'Your app sends one request with a text and its questions to POST /v1/systemone. The server reads the text once and keeps what it read; on the default Gemma 4 31B it scores all the questions together in one batch (the 12B and Qwen bases answer them one at a time by default), with no generated text, and the response carries a probability for every option.', 720, 240, body);
}

export const diagrams = { 'request-flow': requestFlow };
export const diagram = (name) => {
	if (!diagrams[name]) throw new Error(`diagrams: no diagram named ${name}`);
	return diagrams[name]();
};
