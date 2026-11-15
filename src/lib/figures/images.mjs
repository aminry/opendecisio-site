// The figures of the Images guide: where an image stands and who reads it, what a Box answer is, and what the image budget
// buys. Each is a drawing of what decisio's docs say, with the numbers read from them at the pinned release: a release that
// changes a number or a sentence changes the drawing or fails the build. The pictures are drawn here, so no photograph is shown
// and no model ran.
import { readUpstream } from '../upstream.mjs';
import { esc, panel } from './core.mjs';

const api = () => readUpstream('docs/api.md');
const box = () => readUpstream('docs/box.md');
const needs = (text, file, phrases) => {
	for (const p of phrases) if (!text.includes(p)) throw new Error(`images figures: ${file} no longer says "${p}"`);
};
const DEFS = '<defs><marker id="fia" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L9 5L1 9z" fill="currentColor"/></marker></defs>';
const svg = (h, inner) => `<svg class="fig__svg" viewBox="0 0 720 ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${DEFS}${inner}</svg>`;

/** A small drawn photo: a table with a blue mug, a book and a plant, in a w by h frame (the mug sits where decisio's Box example puts it). */
const scene = (x, y, w, h, { mug = true } = {}) => `<svg class="ib-scene" x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 300 200">
<rect class="ib-bg" width="300" height="200"/><rect class="ib-table" y="150" width="300" height="50"/>
${mug ? '<rect class="ib-mug" x="93" y="24" width="90" height="92" rx="12"/><path class="ib-handle" d="M183 48h14a12 12 0 0 1 0 40h-14"/>' : '<path class="ib-cup" d="M96 70h70l-8 46h-54z"/>'}
<rect class="ib-book" x="215" y="118" width="70" height="32" rx="3"/>
<circle class="ib-leaf" cx="42" cy="96" r="26"/><rect class="ib-pot" x="26" y="120" width="32" height="30" rx="4"/>
</svg>`;

/** Where an image stands, and which questions read it (docs/api.md, "Images on Gemma 4"). */
function placement() {
	needs(api(), 'docs/api.md', [
		"An image in the state is part of what every question is asked about.",
		"An image in a question's `instructions` or `criteria` belongs to that question alone",
		'An image of a request that came as a list or as multipart parts, with no place of its own, opens the state.',
	]);
	const photo = (x, y, cls = '') => `<svg class="ib-photo ${cls}" x="${x}" y="${y}" width="64" height="44" viewBox="0 0 300 200"><rect class="ib-bg" width="300" height="200"/><rect class="ib-table" y="150" width="300" height="50"/><circle class="ib-sun" cx="220" cy="56" r="26"/><path class="ib-hill" d="M0 150L90 70L170 150z"/></svg>`;
	const body = svg(340, `
<rect class="f-node" x="16" y="16" width="340" height="250" rx="12"/>
<text class="ft ft-k" x="32" y="42">The state</text>
<g data-phase="2"><g class="ib-pin">${photo(32, 54)}</g><text class="ft ft-d" x="108" y="80">an image with no place opens the state</text></g>
<g data-phase="0"><text class="ft ft-s" x="32" y="126">The customer sent this photo:</text><g class="ib-pin">${photo(250, 100)}</g></g>
<text class="ft ft-s" x="32" y="176">and says the parcel arrived like this.</text>
<g data-phase="0"><path class="ib-link" d="M356 120L426 70" marker-end="url(#fia)"/><path class="ib-link" d="M356 150L426 210" marker-end="url(#fia)"/></g>
<g data-phase="2"><path class="ib-link ib-link--list" d="M356 82L426 52" marker-end="url(#fia)"/><path class="ib-link ib-link--list" d="M356 168L426 196" marker-end="url(#fia)"/></g>
<rect class="f-node" x="428" y="16" width="276" height="96" rx="12"/>
<text class="ft ft-k" x="444" y="42">Question 1</text><text class="ft ft-s" x="444" y="68">Is the parcel visibly damaged?</text><text class="ft ft-d" x="444" y="94">reads the state's images</text>
<rect class="f-node" x="428" y="146" width="276" height="120" rx="12"/>
<text class="ft ft-k" x="444" y="172">Question 2</text><text class="ft ft-s" x="444" y="196">Does the label match this photo?</text>
<g data-phase="1"><g class="ib-pin">${photo(444, 208)}</g><text class="ft ft-d" x="520" y="226">its own photo:</text><text class="ft ft-d" x="520" y="244">only this question reads it</text></g>
<g class="ib-notes"><text class="ft ft-d" x="16" y="296" data-phase="0">A photo in the state is read by every question of the request.</text>
<text class="ft ft-d" x="16" y="316" data-phase="1">A photo in a question's own text is read by that question alone.</text>
<text class="ft ft-d" x="16" y="336" data-phase="2">A photo in the list with no place opens the state, so every question reads it.</text></g>`);
	return panel({
		name: 'image-placement', label: 'Images', title: 'A picture is read where its reference stands, and only by the questions that can see it.',
		desc: 'Three cases. A photo in the state is read by every question. A photo in one question\'s own text is read by that question alone. A photo sent in a list with no place opens the state, so every question reads it.',
		body, interactive: false,
		legend: 'The state\'s photos sit in the part of the prompt every question shares; a question\'s own photo sits in that question\'s part only.',
		source: 'An illustration of docs/api.md, "Images on Gemma 4": no model ran and the pictures are drawn here.',
	});
}

/** A Box answer: the box drawn on the picture, the crop it gives, and an absent target (docs/box.md and docs/api.md). */
function boxAnswer() {
	needs(box(), 'docs/box.md', [
		'"box": {"top": 0.12, "bottom": 0.58, "left": 0.31, "right": 0.66}, "confidence": 0.93',
		'answers the whole image (`top` 0, `bottom` 1, `left` 0, `right` 1) at `confidence` 0.0',
		'multiply `left` and `right` by its width and `top` and `bottom` by its height to crop',
	]);
	// The box of the docs' example, as fractions of the 300 by 200 drawing: left .31, right .66, top .12, bottom .58.
	const bx = { x: 93, y: 24, w: 105, h: 92 };
	const body = svg(316, `
<g data-phase="0"><rect class="ib-chip" x="16" y="16" width="240" height="34" rx="8"/><text class="ft ft-code" x="30" y="38">box: the blue mug</text></g>
${scene(16, 64, 240, 160)}
<g data-phase="1"><svg class="ib-overlay" x="16" y="64" width="240" height="160" viewBox="0 0 300 200"><rect class="ib-box" pathLength="1" x="${bx.x}" y="${bx.y}" width="${bx.w}" height="${bx.h}" rx="4"/></svg>
<text class="ft ft-code" x="16" y="248">top 0.12, bottom 0.58</text><text class="ft ft-code" x="16" y="268">left 0.31, right 0.66</text><text class="ft ft-n" x="16" y="292">confidence 0.93</text></g>
<g data-phase="2"><path class="ib-link" d="M262 140L284 140" marker-end="url(#fia)"/>
<rect class="ib-cropframe" x="288" y="84" width="150" height="131" rx="4"/>
<svg class="ib-crop" x="288" y="84" width="150" height="131" viewBox="${bx.x} ${bx.y} ${bx.w} ${bx.h}"><rect class="ib-bg" x="0" y="0" width="300" height="200"/><rect class="ib-table" y="150" width="300" height="50"/><rect class="ib-mug" x="93" y="24" width="90" height="92" rx="12"/><path class="ib-handle" d="M183 48h14a12 12 0 0 1 0 40h-14"/></svg>
<text class="ft ft-d" x="288" y="238">the crop: the edges</text><text class="ft ft-d" x="288" y="256">times the image size</text></g>
<g data-phase="3"><rect class="ib-chip" x="464" y="16" width="240" height="34" rx="8"/><text class="ft ft-code" x="478" y="38">box: the red umbrella</text></g>
${scene(464, 64, 240, 160, { mug: false })}
<g data-phase="3"><svg class="ib-overlay" x="464" y="64" width="240" height="160" viewBox="0 0 300 200"><rect class="ib-box ib-box--whole" x="2" y="2" width="296" height="196" rx="4"/></svg>
<text class="ft ft-code" x="464" y="248">the whole image</text><text class="ft ft-n" x="464" y="272">confidence 0.0</text><text class="ft ft-d" x="464" y="296">absent: ask a yes/no question beside it</text></g>`);
	return panel({
		name: 'image-box', label: 'Box questions', title: 'A Box question answers with one box and a confidence, or the whole image at confidence 0 when the target is absent.',
		desc: 'A Box question for the blue mug answers with a box: top 0.12, bottom 0.58, left 0.31, right 0.66, at confidence 0.93. Multiplying the edges by the image size gives the crop. A Box question for a red umbrella that is not in the picture answers with the whole image at confidence 0.',
		body, interactive: false,
		legend: 'The edges are fractions of the image you sent. A Box always has a box, so read the confidence, or ask a yes/no question beside it.',
		source: 'An illustration of the example in docs/box.md: no model ran, the numbers are the docs\' example and the pictures are drawn here.',
	});
}

/** What an image costs at each budget: the blocks of 48 by 48 pixels a 512 by 512 picture is read in (docs/api.md, "What an image costs"). */
function budget() {
	const text = api();
	const row = /\| 512 by 512 \| ([\d,]+) \| ([\d,]+) \| ([\d,]+) \| ([\d,]+) \| ([\d,]+) \|/.exec(text);
	if (!row) throw new Error('images figures: docs/api.md no longer has the 512 by 512 row of the image budget table');
	const tokens = row.slice(1).map((v) => Number(v.replace(/,/g, '')));
	const budgets = [70, 140, 280, 560, 1120];
	const sides = tokens.map((t) => Math.round(Math.sqrt(t)));
	sides.forEach((n, i) => { if (n * n !== tokens[i]) throw new Error(`images figures: ${tokens[i]} tokens at budget ${budgets[i]} are not a square of 48 pixel blocks`); });
	needs(text, 'docs/api.md', ['Gemma 4 12B (bf16, FP8 and any tuned repository on that base) reads images at 560 and Gemma 4 31B at 280']);
	needs(readUpstream('docs/running.md'), 'docs/running.md', ['1120 is not allowed on Gemma 4 12B']);
	const notes = ['', '', 'the 31B\'s default', 'the 12B\'s default', 'refused on the 12B'];
	const tile = (b, i) => {
		const x = 16 + i * 140;
		const n = sides[i];
		const step = 120 / n;
		const lines = Array.from({ length: n - 1 }, (_, k) => `M${((k + 1) * step).toFixed(2)} 0V120M0 ${((k + 1) * step).toFixed(2)}H120`).join('');
		return `<g data-phase="${i}"><rect class="ib-tileframe" x="${x - 4}" y="12" width="132" height="236" rx="10"/>
${scene(x, 20, 128, 128).replace('viewBox="0 0 300 200"', 'viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice"')}
<svg x="${x + 4}" y="24" width="120" height="120" viewBox="0 0 120 120"><path class="ib-grid" d="${lines}"/></svg>
<text class="ft ft-k" x="${x + 4}" y="176">budget ${b}</text>
<text class="ft ft-b" x="${x + 4}" y="202">${tokens[i].toLocaleString('en-US')} tokens</text>
<text class="ft ft-d" x="${x + 4}" y="222">${n} by ${n} blocks</text>${notes[i] ? `<text class="ft ft-d ib-tag" x="${x + 4}" y="240">${esc(notes[i])}</text>` : ''}</g>`;
	};
	const body = svg(264, budgets.map(tile).join('\n'));
	return panel({
		name: 'image-budget', label: 'Image budget', title: 'A bigger budget reads a picture in more tokens: more detail for small objects, and a slower first read.',
		desc: `One 512 by 512 picture read at each budget: ${budgets.map((b, i) => `${b} is ${tokens[i].toLocaleString('en-US')} tokens, a ${sides[i]} by ${sides[i]} grid of 48 pixel blocks`).join('; ')}. The 12B reads at 560 by default, the 31B at 280, and the 12B refuses 1120.`,
		body, interactive: false,
		legend: 'The picture is scaled to fill the budget and cut to blocks of 48 by 48 pixels; each block is one token, and a begin and an end token wrap them.',
		source: 'Source: the token counts for a 512 by 512 image in docs/api.md, "What an image costs", at the pinned release. Add two tokens to each count for the begin and end tokens.',
	});
}

export const imageFigures = { 'image-placement': placement, 'image-box': boxAnswer, 'image-budget': budget };
