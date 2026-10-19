// The teaching section's stage, drawn at build time in two layouts (wide and narrow), in its final state: the examples
// taught, the answer sharpened, the threshold drawn and every answer in its tray. src/scripts/teach.ts plays the story
// from the start using the positions written here; without scripts, or with reduced motion, the final state stays.
import { esc } from './figures/core.mjs';

// A few of BANKING77's own label names: the examples that stream in are labels being taught, not invented texts.
const LABELS = ['card_arrival', 'exchange_rate', 'lost_or_stolen_card', 'pending_card_payment', 'cash_withdrawal_charge', 'declined_transfer', 'card_linking', 'verify_my_identity', 'change_pin'];
// The schematic answer (no numbers): before teaching, spread over options; after, sharp on one.
const SPREAD = [0.30, 0.24, 0.2, 0.15, 0.11];
const SHARP = [0.86, 0.07, 0.04, 0.02, 0.01];

const LAYOUTS = {
	wide: { w: 1100, h: 470, chips: { x: 16, y: 54, dy: 30, n: 7 }, box: { x: 300, y: 40, w: 196, h: 150 }, dist: { x: 536, y: 52, w: 210, h: 120, label: 'An answer, before and after' }, acc: { x: 790, y: 70, w: 280 }, grid: { x: 300, y: 262, cols: 20, gap: 18, r: 6 }, trays: { x: 760, y: 252, w: 318, auto: 128, person: 64, cols: 24, gap: 12, r: 4 }, legend: { x: 16, y: 270, more: true } },
	narrow: { w: 400, h: 1166, chips: { x: 12, y: 40, dy: 26, n: 6 }, box: { x: 12, y: 200, w: 376, h: 92 }, dist: { x: 12, y: 340, w: 376, h: 92, label: 'An answer, before and after' }, acc: { x: 12, y: 500, w: 376 }, grid: { x: 29, y: 744, cols: 20, gap: 18, r: 6 }, trays: { x: 12, y: 956, w: 376, auto: 108, person: 52, cols: 30, gap: 12, r: 4 }, legend: { x: 12, y: 626, more: false } },
};

// A story with a few dozen answers (the inbox's sample) draws them larger, a dozen to a row.
const FEW = {
	wide: { grid: { x: 300, y: 262, cols: 12, gap: 30, r: 10 }, trays: { x: 760, y: 252, w: 318, auto: 84, person: 104, cols: 13, gap: 22, r: 7 }, h: 480 },
	narrow: { grid: { x: 35, y: 744, cols: 12, gap: 30, r: 10 }, trays: { x: 12, y: 900, w: 376, auto: 84, person: 104, cols: 15, gap: 22, r: 7 }, h: 1120 },
};

export function scene(d, kind) {
	const c = d.certify;
	const n = c.answers.length;
	const L = n <= 60 ? { ...LAYOUTS[kind], ...FEW[kind] } : LAYOUTS[kind];
	const pct = (x) => `${(x * 100).toFixed(1)}%`;
	const gridPos = (i) => ({ x: L.grid.x + (i % L.grid.cols) * L.grid.gap, y: L.grid.y + Math.floor(i / L.grid.cols) * L.grid.gap });
	const T = L.trays;
	let a = 0;
	let p = 0;
	const trayPos = c.answers.map((ans) => {
		const k = ans.certified ? a++ : p++;
		const pad = Math.round(24 + T.r * 1.6);
		const y0 = ans.certified ? T.y + pad : T.y + T.auto + 26 + pad;
		return { x: T.x + 14 + (k % T.cols) * T.gap, y: y0 + Math.floor(k / T.cols) * T.gap };
	});
	// The threshold: a staircase after the k-th most confident answer.
	const stair = (k) => {
		const { x, y, cols, gap } = L.grid;
		const row = Math.floor(k / cols);
		const col = k % cols;
		const top = y - gap / 2 + row * gap;
		const xs = x - gap / 2;
		const xe = x - gap / 2 + cols * gap;
		const xc = x - gap / 2 + col * gap;
		return col === 0 ? `M${xs} ${top}H${xe}` : `M${xs} ${top + gap}H${xc}V${top}H${xe}`;
	};
	const chips = LABELS.slice(0, L.chips.n).map((l, i) => {
		const y = L.chips.y + i * L.chips.dy;
		return `<g class="tc-chip" data-i="${i}" transform="translate(0 0)"><rect x="${L.chips.x}" y="${y - 15}" width="${Math.min(250, 70 + l.length * 7.4)}" height="22" rx="11"/><text class="tc-t tc-mono" x="${L.chips.x + 12}" y="${y}"><tspan class="tc-dim">label</tspan> ${esc(l)}</text></g>`;
	}).join('');
	const B = L.box;
	const D = L.dist;
	const bw = D.w / SPREAD.length;
	const bars = SPREAD.map((s, i) => {
		const h0 = s * D.h;
		const h1 = SHARP[i] * D.h;
		return `<rect class="tc-opt${i === 0 ? ' tc-opt--top' : ''}" data-h0="${h0.toFixed(1)}" data-h1="${h1.toFixed(1)}" x="${(D.x + i * bw + 4).toFixed(1)}" y="${(D.y + D.h - h1).toFixed(1)}" width="${(bw - 8).toFixed(1)}" height="${h1.toFixed(1)}" rx="3"/>`;
	}).join('');
	const A = L.acc;
	const accW = (x) => Math.max(4, ((x - 0.5) / 0.5) * A.w);
	const dots = c.answers.map((ans, i) => {
		const g = gridPos(i);
		const t = trayPos[i];
		return `<circle class="tc-dot${ans.certified ? ' tc-dot--c' : ''}${ans.right ? '' : ' tc-dot--x'}" r="${T.r}" cx="${t.x}" cy="${t.y}" data-gx="${g.x}" data-gy="${g.y}" data-tx="${t.x}" data-ty="${t.y}" data-gr="${L.grid.r}" data-tr="${T.r}"/>`;
	}).join('');
	// Faint dots at the answers' ranks, so the grid still shows the ranking and the line once they have moved to the trays.
	const ghosts = c.answers.map((ans, i) => { const g = gridPos(i); return `<circle class="tc-ghost${ans.certified ? ' tc-ghost--c' : ''}" r="${L.grid.r - 2}" cx="${g.x}" cy="${g.y}"/>`; }).join('');
	const g0 = gridPos(0);
	const gEnd = gridPos(L.grid.cols * Math.ceil(n / L.grid.cols) - 1);
	return {
		svg: `<svg class="tc-svg tc-svg--${kind}" viewBox="0 0 ${L.w} ${L.h}" role="img" aria-labelledby="tc-title-${kind} tc-desc-${kind}" xmlns="http://www.w3.org/2000/svg" data-tc-grid="${esc(JSON.stringify({ x: L.grid.x, y: L.grid.y, cols: L.grid.cols, gap: L.grid.gap, certified: c.certified }))}">
<title id="tc-title-${kind}">Teaching a task, then certifying its answers</title>
<desc id="tc-desc-${kind}">Labelled examples of ${esc(d.learn.task)} go into Decisio; the answer sharpens and accuracy goes from ${pct(d.learn.before)} to ${pct(d.learn.after)} on the ${esc(d.learn.base)}. Then ${n} answers of ${esc(c.task.toLowerCase())}, on the ${esc(c.base)}, are ordered by confidence; a threshold line moves down until ${c.certified} are above it. Those are certified and go to automation, ${c.wrong} of them wrong; the other ${n - c.certified} go to a person.</desc>
<text class="tc-k" x="${L.chips.x}" y="${L.chips.y - 30}">1  Your labelled examples</text>
${chips}
<g class="tc-box"><rect class="tc-node tc-node--on" x="${B.x}" y="${B.y}" width="${B.w}" height="${B.h}" rx="16"/><text class="tc-t tc-b" x="${B.x + B.w / 2}" y="${(B.y + B.h * 0.32).toFixed(0)}" text-anchor="middle">Decisio</text><text class="tc-t tc-dim" x="${B.x + B.w / 2}" y="${(B.y + B.h * 0.5).toFixed(0)}" text-anchor="middle">learns your labels</text><text class="tc-t tc-mono tc-acc" x="${B.x + B.w / 2}" y="${(B.y + B.h * 0.76).toFixed(0)}" text-anchor="middle">model unchanged</text></g>
<text class="tc-k" x="${D.x}" y="${D.y - 18}">${esc(D.label)}</text>
<line class="tc-axis" x1="${D.x}" y1="${D.y + D.h}" x2="${D.x + D.w}" y2="${D.y + D.h}"/>${bars}
<text class="tc-k" x="${A.x}" y="${A.y - 30}">Accuracy, ${esc(d.learn.task)}</text>
<text class="tc-t tc-dim tc-small" x="${A.x}" y="${A.y - 8}">before</text><rect class="tc-rail" x="${A.x}" y="${A.y}" width="${A.w}" height="12" rx="6"/><rect class="tc-bar tc-bar--before" x="${A.x}" y="${A.y}" width="${accW(d.learn.before).toFixed(1)}" height="12" rx="6"/><text class="tc-t tc-mono tc-small" x="${A.x + A.w}" y="${A.y - 8}" text-anchor="end">${pct(d.learn.before)}</text>
<text class="tc-t tc-dim tc-small" x="${A.x}" y="${A.y + 42}">after teaching</text><rect class="tc-rail" x="${A.x}" y="${A.y + 50}" width="${A.w}" height="12" rx="6"/><rect class="tc-bar tc-bar--after" data-w0="${accW(d.learn.before).toFixed(1)}" data-w1="${accW(d.learn.after).toFixed(1)}" x="${A.x}" y="${A.y + 50}" width="${accW(d.learn.after).toFixed(1)}" height="12" rx="6"/><text class="tc-t tc-mono tc-small tc-accent" x="${A.x + A.w}" y="${A.y + 42}" text-anchor="end" data-count-to="${(d.learn.after * 100).toFixed(1)}" data-count-from="${(d.learn.before * 100).toFixed(1)}">${pct(d.learn.after)}</text>
<text class="tc-t tc-dim tc-small" x="${A.x}" y="${A.y + 90}">${d.learn.examples.toLocaleString('en-US')} examples${d.learn.perLabel ? ` (${d.learn.perLabel} per label)` : ''}${d.learn.seconds ? `, taught in ${d.learn.seconds} s` : ''}</text>
<path class="tc-flow" d="M${B.x - 14} ${B.y + B.h / 2}H${B.x}" />
<text class="tc-k" x="${L.legend.x}" y="${L.legend.y}">2  ${n} answers</text><text class="tc-t tc-dim tc-small" x="${L.legend.x}" y="${L.legend.y + 22}">most confident first</text>${L.legend.more ? `<text class="tc-t tc-dim tc-small" x="${L.legend.x}" y="${L.legend.y + 120}">${esc(c.task)},</text><text class="tc-t tc-dim tc-small" x="${L.legend.x}" y="${L.legend.y + 138}">${esc(c.base)}.</text>` : `<text class="tc-t tc-dim tc-small" x="${L.legend.x}" y="${L.legend.y + 70}">${esc(c.task)}, ${esc(c.base)}.</text>`}
${L.legend.more ? `<circle class="tc-dot tc-dot--c" r="6" cx="${L.legend.x + 6}" cy="${L.legend.y + 60}"/><text class="tc-t tc-small" x="${L.legend.x + 20}" y="${L.legend.y + 65}">a right answer</text><circle class="tc-dot tc-dot--c tc-dot--x" r="6" cx="${L.legend.x + 6}" cy="${L.legend.y + 86}"/><text class="tc-t tc-small" x="${L.legend.x + 20}" y="${L.legend.y + 91}">a wrong one</text>` : `<circle class="tc-dot tc-dot--c" r="5" cx="${L.legend.x + 5}" cy="${L.legend.y + 42}"/><text class="tc-t tc-small" x="${L.legend.x + 16}" y="${L.legend.y + 46}">right</text><circle class="tc-dot tc-dot--c tc-dot--x" r="5" cx="${L.legend.x + 70}" cy="${L.legend.y + 42}"/><text class="tc-t tc-small" x="${L.legend.x + 81}" y="${L.legend.y + 46}">wrong</text>`}
<rect class="tc-gridbg" x="${g0.x - L.grid.gap / 2}" y="${g0.y - L.grid.gap / 2}" width="${L.grid.cols * L.grid.gap}" height="${gEnd.y - g0.y + L.grid.gap}" rx="8"/>
<g class="tc-ghosts">${ghosts}</g>
<path class="tc-stair" d="${stair(c.certified)}"/>
<text class="tc-t tc-mono tc-small tc-accent tc-thr" x="${g0.x - L.grid.gap / 2}" y="${g0.y - L.grid.gap / 2 - 8}">threshold ${c.threshold.toFixed(3)}: ${c.certified} above it</text>
<g class="tc-trays"><rect class="tc-tray tc-tray--auto" x="${T.x}" y="${T.y}" width="${T.w}" height="${T.auto}" rx="12"/><text class="tc-k tc-k--auto" x="${T.x + 14}" y="${T.y + 20}">3  Certified: automated</text>
<rect class="tc-tray" x="${T.x}" y="${T.y + T.auto + 26}" width="${T.w}" height="${T.person}" rx="12"/><text class="tc-k" x="${T.x + 14}" y="${T.y + T.auto + 46}">Not certified: a person</text></g>
<g class="tc-stamp" transform="translate(${T.x + T.w - 108} ${T.y - 18}) rotate(-8)"><rect width="104" height="30" rx="6"/><text x="52" y="20" text-anchor="middle">CERTIFIED</text></g>
${dots}
</svg>`,
	};
}
