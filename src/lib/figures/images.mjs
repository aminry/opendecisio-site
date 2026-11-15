// The figures of the Images guide: where an image stands and who reads it, what a Box answer is, and what the image budget
// buys. Each is a drawing of what decisio's docs say, with the numbers read from them at the pinned release: a release that
// changes a number or a sentence changes the drawing or fails the build. The pictures are two openly licensed photographs
// (public/media/images-guide, credited in credits.json and under each figure); no model ran, and the box is the teal pixels'
// bounding box, drawn to show the shape of an answer.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { siteRoot, readUpstream } from '../upstream.mjs';
import { esc, panel } from './core.mjs';

const MEDIA = join(siteRoot, 'public/media/images-guide');
const credits = JSON.parse(readFileSync(join(MEDIA, 'credits.json'), 'utf8'));
const used = new Set();
/** The URL of a photograph, after its bytes are checked against credits.json. */
const photo = (name) => {
	const sha = createHash('sha256').update(readFileSync(join(MEDIA, name))).digest('hex');
	if (credits.assets[name] !== sha) throw new Error(`images figures: ${name} is not the file credits.json records; run scripts/render-images-guide.py`);
	used.add(name);
	return `/media/images-guide/${name}`;
};
const credit = (key, label) => {
	const p = credits.photos[key];
	return `<a href="${p.page}">${esc(label)}</a> by ${esc(p.author)}, <a href="${p.licenceUrl}">${esc(p.licence)}</a>`;
};
const CREDITS = `Photographs: ${credit('parcel', 'Damaged fragile parcel delivered to doorstep')} and ${credit('mug', 'Bright turquoise mug sits on a wooden table')}, on Wikimedia Commons.`;

const api = () => readUpstream('docs/api.md');
const needs = (text, file, phrases) => {
	for (const p of phrases) if (!text.includes(p)) throw new Error(`images figures: ${file} no longer says "${p}"`);
};
const DEFS = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L9 5L1 9z" fill="currentColor"/></marker></defs>`;
const svg = (h, inner, id) => `<svg class="fig__svg" viewBox="0 0 720 ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${DEFS(id)}${inner}</svg>`;
/** A photograph in a rounded frame, filling it (the picture's centre when the frame's proportions differ). */
const pic = (id, name, x, y, w, h, r = 8, cls = 'ib-frame') => `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>
<image href="${photo(name)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})" decoding="async"/>
<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
const text = (cls, x, y, t, extra = '') => `<text class="${cls}" x="${x}" y="${y}"${extra}>${esc(t)}</text>`;

/** Where an image stands, and which questions read it: one prompt per question, the state's part shared (docs/api.md, "Images on Gemma 4"). */
function placement() {
	needs(api(), 'docs/api.md', [
		'An image in the state is part of what every question is asked about.',
		"An image in a question's `instructions` or `criteria` belongs to that question alone",
		'An image of a request that came as a list or as multipart parts, with no place of its own, opens the state.',
		'It sits in the shared prefix, which the server computes once and every question of the request',
	]);
	const body = svg(420, `
<g data-phase="2"><rect class="ib-chip" x="16" y="12" width="236" height="68" rx="10"/>
${pic('ibp-l', 'parcel-label.jpg', 28, 22, 72, 48, 6)}
${text('ft ft-code', 112, 42, 'images: [photo]')}${text('ft ft-d', 112, 62, 'sent as a list, no place')}
<path class="ib-link" d="M134 80V104" marker-end="url(#ibp-a)"/>${text('ft ft-d', 144, 98, 'opens the state')}</g>
<rect class="f-node" x="16" y="108" width="372" height="236" rx="12"/>
${text('ft ft-k', 32, 134, 'The state: read once, shared')}
${text('ft ft-s', 32, 162, "A customer's delivery photo:")}
<g data-phase="0">${pic('ibp-p', 'parcel.jpg', 32, 174, 186, 124, 8)}</g>
${text('ft ft-d', 234, 200, 'and the note:')}${text('ft ft-d', 234, 220, '"arrived this morning"')}
<g data-phase="0"><path class="ib-link" d="M388 226H416V150H438" marker-end="url(#ibp-a)"/><path class="ib-link" d="M416 226V300H438" marker-end="url(#ibp-a)"/>${text('ft ft-d', 32, 326, 'read by every question')}</g>
<rect class="f-node" x="440" y="108" width="264" height="82" rx="12"/>
${text('ft ft-k', 456, 134, 'Question 1')}${text('ft ft-s', 456, 158, 'Is the parcel visibly damaged?')}${text('ft ft-d', 456, 178, 'sees: the parcel photo')}
<rect class="f-node" x="440" y="226" width="264" height="118" rx="12"/>
${text('ft ft-k', 456, 252, 'Question 2')}${text('ft ft-s', 456, 276, 'Does this photo show a mug?')}
<g data-phase="1">${pic('ibp-m', 'mug.jpg', 456, 288, 84, 48, 6)}${text('ft ft-d', 552, 308, 'its own photo:')}${text('ft ft-d', 552, 326, 'only question 2 reads it')}
<path class="ib-link ib-link--no" d="M470 226V194"/>${text('ib-x', 470, 216, '✕')}${text('ft ft-d', 486, 214, 'not in question 1')}</g>
<g class="ib-notes">${text('ft ft-d', 16, 372, 'A photo in the state is read by every question of the request.', ' data-phase="0"')}
${text('ft ft-d', 16, 392, "A photo in a question's own text is read by that question alone.", ' data-phase="1"')}
${text('ft ft-d', 16, 412, 'A photo in the list with no place opens the state, so every question reads it.', ' data-phase="2"')}</g>`, 'ibp-a');
	return panel({
		name: 'image-placement', label: 'Images', title: 'A picture is read where its reference stands, and only by the questions that can see it.',
		desc: "A request has two questions. A photo in the state is read once and shared, so both questions read it. A photo in question 2's own text is read by question 2 alone and is not in question 1's prompt. A photo sent in a list with no place opens the state, so both questions read it.",
		body, interactive: false,
		legend: "The state's photos sit in the part of the prompt every question shares; a question's own photo sits in that question's part only.",
		source: `An illustration of docs/api.md, "Images on Gemma 4": no model ran. ${CREDITS}`,
	});
}

/** A Box answer: the box on the picture with its edges as fractions, the crop it gives, and an absent target (docs/box.md). */
function boxAnswer() {
	needs(readUpstream('docs/box.md'), 'docs/box.md', [
		'answers the whole image (`top` 0, `bottom` 1, `left` 0, `right` 1) at `confidence` 0.0',
		'multiply `left` and `right` by its width and `top` and `bottom` by its height to crop',
	]);
	const b = credits.mugBox;
	const P = { x: 22, y: 78, w: 252, h: 168 };
	const px = (f) => P.x + f * P.w;
	const py = (f) => P.y + f * P.h;
	const bx = { x: px(b.left), y: py(b.top), w: (b.right - b.left) * P.w, h: (b.bottom - b.top) * P.h };
	const R = { h: P.y + P.h + 14, v: P.x + P.w + 12 };
	const crop = { x: 384, y: 92, w: 132, h: Math.round(132 * ((b.bottom - b.top) * 800) / ((b.right - b.left) * 1200)) };
	const mugUrl = photo('mug.jpg');
	const body = svg(332, `
<g data-phase="0"><rect class="ib-chip" x="${P.x}" y="16" width="${P.w}" height="34" rx="8"/>${text('ft ft-code', P.x + 14, 38, 'box: the turquoise mug')}
<path class="ib-link" d="M${P.x + P.w / 2} 50V${P.y - 4}" marker-end="url(#ibb-a)"/></g>
${pic('ibb-m', 'mug.jpg', P.x, P.y, P.w, P.h, 6)}
<g data-phase="1"><path class="ib-guide" d="M${px(b.left)} ${py(b.bottom)}V${R.h}M${px(b.right)} ${py(b.bottom)}V${R.h}M${px(b.right)} ${py(b.top)}H${R.v}M${px(b.right)} ${py(b.bottom)}H${R.v}"/>
<path class="ib-ruler" d="M${P.x} ${R.h}H${P.x + P.w}M${R.v} ${P.y}V${P.y + P.h}"/>
<path class="ib-tick" d="M${P.x} ${R.h - 4}v8M${P.x + P.w / 2} ${R.h - 4}v8M${P.x + P.w} ${R.h - 4}v8M${R.v - 4} ${P.y}h8M${R.v - 4} ${P.y + P.h / 2}h8M${R.v - 4} ${P.y + P.h}h8"/>
<rect class="ib-box" pathLength="1" x="${bx.x}" y="${bx.y}" width="${bx.w}" height="${bx.h}" rx="3"/>
<circle class="ib-dot" cx="${px(b.left)}" cy="${R.h}" r="4"/><circle class="ib-dot" cx="${px(b.right)}" cy="${R.h}" r="4"/><circle class="ib-dot" cx="${R.v}" cy="${py(b.top)}" r="4"/><circle class="ib-dot" cx="${R.v}" cy="${py(b.bottom)}" r="4"/>
${text('ft ft-code', px(b.left) - 4, R.h + 20, `left ${b.left}`, ' text-anchor="end"')}${text('ft ft-code', px(b.right) + 4, R.h + 20, `right ${b.right}`)}
${text('ft ft-code', R.v + 10, py(b.top) + 4, `top ${b.top}`)}${text('ft ft-code', R.v + 10, py(b.bottom) + 4, `bottom ${b.bottom}`)}
${text('ft ft-n', P.x, R.h + 42, 'confidence 0.93 (an example)')}</g>
<g data-phase="2"><path class="ib-link" d="M${px(b.right) + 2} ${py((b.top + b.bottom) / 2) - 10}Q${R.v + 70} ${P.y - 4} ${crop.x - 6} ${crop.y + crop.h / 2 - 10}" marker-end="url(#ibb-a)"/>
<svg class="ib-crop" x="${crop.x}" y="${crop.y}" width="${crop.w}" height="${crop.h}" viewBox="${b.left * 1200} ${b.top * 800} ${(b.right - b.left) * 1200} ${(b.bottom - b.top) * 800}"><image href="${mugUrl}" width="1200" height="800" decoding="async"/></svg>
<rect class="ib-frame" x="${crop.x}" y="${crop.y}" width="${crop.w}" height="${crop.h}" rx="4"/>
${text('ft ft-d', crop.x, crop.y + crop.h + 20, 'the crop: the edges')}${text('ft ft-d', crop.x, crop.y + crop.h + 38, 'times the image size')}</g>
<g data-phase="3"><rect class="ib-chip" x="540" y="16" width="164" height="34" rx="8"/>${text('ft ft-code', 552, 38, 'box: a red umbrella')}
<path class="ib-link" d="M622 50V${P.y - 4}" marker-end="url(#ibb-a)"/>
${pic('ibb-p', 'parcel.jpg', 540, P.y, 164, 109, 6)}
<svg class="ib-overlay" x="540" y="${P.y}" width="164" height="109" viewBox="0 0 164 109"><rect class="ib-box ib-box--whole" x="2" y="2" width="160" height="105" rx="4"/></svg>
${text('ft ft-code', 540, P.y + 109 + 22, 'the whole image')}${text('ft ft-n', 540, P.y + 109 + 44, 'confidence 0.0')}${text('ft ft-d', 540, P.y + 109 + 64, 'absent: pair with yes/no')}</g>`, 'ibb-a');
	return panel({
		name: 'image-box', label: 'Box questions', title: 'A Box question answers with one box and a confidence, or the whole image at confidence 0 when the target is absent.',
		desc: `A Box question for the turquoise mug answers with a box: top ${b.top}, bottom ${b.bottom}, left ${b.left}, right ${b.right}, as fractions of the photo, at an example confidence of 0.93. Multiplying the edges by the image size gives the crop. A Box question for a red umbrella that is not in the parcel photo answers with the whole image at confidence 0.`,
		body, interactive: false,
		legend: 'The edges are fractions of the image you sent. A Box always has a box, so read the confidence, or ask a yes/no question beside it.',
		source: `An illustration of docs/box.md: no model ran, and the box is the mug's outline measured on the photograph. ${CREDITS}`,
	});
}

/** What an image costs at each budget: the 48 by 48 pixel blocks a square picture is read in, and the detail they keep (docs/api.md). */
function budget() {
	const t = api();
	const row = /\| 512 by 512 \| ([\d,]+) \| ([\d,]+) \| ([\d,]+) \| ([\d,]+) \| ([\d,]+) \|/.exec(t);
	if (!row) throw new Error('images figures: docs/api.md no longer has the 512 by 512 row of the image budget table');
	const tokens = row.slice(1).map((v) => Number(v.replace(/,/g, '')));
	const budgets = [70, 140, 280, 560, 1120];
	const sides = tokens.map((n) => Math.round(Math.sqrt(n)));
	sides.forEach((n, i) => { if (n * n !== tokens[i]) throw new Error(`images figures: ${tokens[i]} tokens at budget ${budgets[i]} are not a square of 48 pixel blocks`); });
	needs(t, 'docs/api.md', ['Gemma 4 12B (bf16, FP8 and any tuned repository on that base) reads images at 560 and Gemma 4 31B at 280', 'each side is cut down to a multiple of 48 pixels; each 48 by 48 block is one token']);
	needs(readUpstream('docs/running.md'), 'docs/running.md', ['1120 is not allowed on Gemma 4 12B']);
	const notes = ['', '', "the 31B's default", "the 12B's default", 'refused on the 12B'];
	const region = [0.395, 0.335, 0.575, 0.425];
	const tile = (bud, i) => {
		const x = 16 + i * 140;
		const n = sides[i];
		const step = 124 / n;
		const lines = Array.from({ length: n - 1 }, (_, k) => `M${((k + 1) * step).toFixed(2)} 0V124M0 ${((k + 1) * step).toFixed(2)}H124`).join('');
		const rx = x + 4 + region[0] * 124, ry = 24 + region[1] * 124, rw = (region[2] - region[0]) * 124, rh = (region[3] - region[1]) * 124;
		return `<g data-phase="${i}"><rect class="ib-tileframe" x="${x - 4}" y="12" width="132" height="338" rx="10"/>
${pic(`ibu-${i}`, 'parcel-square.jpg', x + 4, 24, 124, 124, 6)}
<svg x="${x + 4}" y="24" width="124" height="124" viewBox="0 0 124 124"><path class="ib-grid" d="${lines}"/></svg>
<rect class="ib-region" x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${rw.toFixed(1)}" height="${rh.toFixed(1)}"/>
<path class="ib-zoom" d="M${rx.toFixed(1)} ${(ry + rh).toFixed(1)}L${x + 4} 164M${(rx + rw).toFixed(1)} ${(ry + rh).toFixed(1)}L${x + 128} 164"/>
${pic(`ibd-${i}`, `budget-${bud}.jpg`, x + 4, 164, 124, 62, 4)}
${text('ft ft-d', x + 4, 244, 'the label\'s small print')}
${text('ft ft-k', x + 4, 272, `budget ${bud}`)}${text('ft ft-b', x + 4, 296, `${tokens[i].toLocaleString('en-US')} tokens`)}${text('ft ft-d', x + 4, 316, `${n} by ${n} blocks`)}${notes[i] ? text('ft ft-d ib-tag', x + 4, 336, notes[i]) : ''}</g>`;
	};
	const body = svg(362, budgets.map(tile).join('\n'), 'ibu-a');
	return panel({
		name: 'image-budget', label: 'Image budget', title: 'A bigger budget reads a picture in more tokens: finer detail for small things, and a slower first read.',
		desc: `One square picture of a parcel read at each budget: ${budgets.map((bud, i) => `${bud} is ${tokens[i].toLocaleString('en-US')} tokens, a ${sides[i]} by ${sides[i]} grid of 48 pixel blocks`).join('; ')}. The small print on the label gets sharper as the budget grows. The 12B reads at 560 by default, the 31B at 280, and the 12B refuses 1120.`,
		body, interactive: false,
		legend: 'The picture is scaled to fill the budget and cut to blocks of 48 by 48 pixels; each block is one token, and a begin and an end token wrap them.',
		source: `The token counts for a square picture are those of docs/api.md, "What an image costs"; add two to each for the begin and end tokens. The close-ups are the photograph scaled to what each budget reads. ${CREDITS}`,
	});
}

export const imageFigures = { 'image-placement': placement, 'image-box': boxAnswer, 'image-budget': budget };
