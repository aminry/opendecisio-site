// The teach-and-certify page's charts, as SVG strings: the share each setup automates, the three teaching draws, the
// 200 re-splits of one task at one target, and the drift replay of one base. Each is drawn twice, wide and narrow, so
// its labels keep their size: the page shows one or the other by the width of the screen (src/styles/teach-certify.css).
// Drawn at build time for the page's first view (src/pages/demos/teach-and-certify.astro) and again by its script
// (src/scripts/teach-certify.ts) when a chip changes the view, so both draw the same thing. Pure functions, no imports;
// only attributes and classes, as the CSP allows no style attribute.

export const pc = (x, d = 1) => `${(100 * x).toFixed(d)}%`;
const n = (x) => x.toLocaleString('en-US');
const r1 = (x) => Math.round(x * 10) / 10;
// A line break after each label, so a page's text reads the labels as words and not one run of digits.
const words = (svg) => svg.replace(/<\/text>/g, '</text>\n');
const svg = (cls, W, H, id, title, desc, body) => words(`<svg class="tc-svg ${cls}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${id}-t ${id}-d"><title id="${id}-t">${title}</title><desc id="${id}-d">${desc}</desc>${body}</svg>`);
/** Both layouts of one chart, one shown at a time. */
const pair = (draw) => `${draw(true)}${draw(false)}`;

/**
 * The share automated: for each setup, one bar per error target, the share of its test split the certificate covered,
 * labelled with how often those answers were wrong. `rows` are { label: [set, base], base, bars: [{ alpha, share, wrong }] },
 * share null where nothing was certified.
 */
export function sharesChart(rows) {
	const value = (b) => (b.share ? `${pc(b.share)}, ${pc(b.wrong)} wrong` : 'nothing certified');
	const desc = rows.map((r) => `${r.label.join(', ')}: ${r.bars.map((b) => `at ${pc(b.alpha, 0)}, ${b.share ? `${pc(b.share)} certified, ${pc(b.wrong)} of them wrong` : 'nothing certified'}`).join('; ')}`).join('. ');
	return pair((wide) => {
		const W = wide ? 960 : 320;
		const L = wide ? 230 : 44, R = wide ? 190 : 0;
		const x = (s) => r1(L + s * (W - L - R));
		const BAR = wide ? 18 : 10, STEP = wide ? 26 : 38, HEAD = wide ? 0 : 30, GAP = wide ? 30 : 26;
		let y = 6;
		const body = rows.map((row) => {
			const top = y + HEAD;
			const head = wide
				? `<text class="tc-row__l" x="0" y="${top + (row.bars.length * STEP) / 2 - 6}">${row.label[0]}</text><text class="tc-row__s" x="0" y="${top + (row.bars.length * STEP) / 2 + 13}">${row.label[1]}</text>`
				: `<text class="tc-row__l" x="0" y="${y + 16}">${row.label[0]}<tspan class="tc-row__s" dx="8">${row.label[1]}</tspan></text>`;
			const bars = row.bars.map((b, i) => {
				const by = top + i * STEP + (wide ? 0 : 18);
				const tag = `<text class="tc-tick" x="${L - 10}" y="${by + BAR - (wide ? 4 : 1)}" text-anchor="end">${pc(b.alpha, 0)}</text>`;
				const rail = `<rect class="tc-rail" x="${L}" y="${by}" width="${x(1) - L}" height="${BAR}" rx="3"/>`;
				const fill = b.share ? `<rect class="tc-bar ${row.base}" x="${L}" y="${by}" width="${r1(x(b.share) - L)}" height="${BAR}" rx="3"/>` : '';
				const label = wide
					? `<text class="tc-bar__l${b.share ? '' : ' tc-bar__l--none'}" x="${b.share ? x(1) + 12 : L + 10}" y="${by + BAR - 4}">${value(b)}</text>`
					: `<text class="tc-bar__l${b.share ? '' : ' tc-bar__l--none'}" x="${L}" y="${by - 5}">${value(b)}</text>`;
				return `${tag}${rail}${fill}${label}`;
			}).join('');
			y = top + row.bars.length * STEP + GAP - (wide ? STEP - BAR : 0);
			return `${head}${bars}`;
		}).join('');
		const H = y + 4;
		const axis = wide ? [0, 0.5, 1].map((s) => `<text class="tc-tick" x="${x(s)}" y="${H + 14}" text-anchor="middle">${pc(s, 0)}</text>`).join('') : '';
		return svg(`tc-svg--${wide ? 'wide' : 'narrow'}`, W, H + (wide ? 22 : 0), `tc-sh-${wide ? 'w' : 'n'}`, 'The share of each test split certified, by error target', `${desc}.`, `${body}${axis}`);
	});
}

/**
 * The teaching draw: for each base, the share certified by three draws of 10 examples per intent, at two targets, as
 * dots on one scale. `rows` are { label, base, alpha, shares: [d1, d2, d3] }.
 */
export function drawsChart(rows) {
	const range = (r) => { const lo = Math.min(...r.shares), hi = Math.max(...r.shares); return { lo, hi, text: lo === hi ? pc(lo) : `${pc(lo)} to ${pc(hi)}` }; };
	const desc = rows.map((r) => `${r.label} at ${pc(r.alpha, 0)}: ${r.shares.map((s) => pc(s)).join(', ')}`).join('; ');
	return pair((wide) => {
		const W = wide ? 960 : 320;
		const L = wide ? 230 : 44, R = wide ? 190 : 8;
		const RH = wide ? 40 : 52;
		const x = (s) => r1(L + s * (W - L - R));
		const body = rows.map((r, i) => {
			const { lo, hi, text } = range(r);
			const cy = 8 + i * RH + (wide ? RH / 2 : 34);
			const head = wide
				? `<text class="tc-row__l tc-row__l--sm" x="0" y="${cy + 5}">${r.label}</text><text class="tc-bar__l" x="${x(1) + 12}" y="${cy + 5}">${text}</text>`
				: `<text class="tc-row__l tc-row__l--sm" x="0" y="${cy - 16}">${r.label}<tspan class="tc-bar__l" dx="8">${text}</tspan></text>`;
			return `${head}<text class="tc-tick" x="${L - 10}" y="${cy + 4}" text-anchor="end">${pc(r.alpha, 0)}</text><line class="tc-rail-line" x1="${L}" x2="${x(1)}" y1="${cy}" y2="${cy}"/><line class="tc-span ${r.base}" x1="${x(lo)}" x2="${x(hi)}" y1="${cy}" y2="${cy}"/>${r.shares.map((s) => `<circle class="tc-draw ${r.base}" cx="${x(s)}" cy="${cy}" r="6.5"/>`).join('')}`;
		}).join('');
		const H = 8 + rows.length * RH + (wide ? 4 : 18);
		const axis = [0, 0.5, 1].map((s) => `<text class="tc-tick" x="${x(s)}" y="${H + 12}" text-anchor="middle">${pc(s, 0)}</text>`).join('');
		return svg(`tc-svg--${wide ? 'wide' : 'narrow'}`, W, H + 20, `tc-dw-${wide ? 'w' : 'n'}`, 'Three teaching draws, by error target', `${desc}.`, `${body}${axis}`);
	});
}

/** The errors axis's top and step: room above the highest realised error and above the target line. */
function errorAxis(alpha, top) {
	const step = alpha <= 0.02 ? 0.01 : 0.02;
	const max = Math.max(alpha * 2, top * 1.12);
	return { step, max: Math.ceil(max / step - 1e-9) * step };
}

/**
 * The 200 re-splits: each split that certified something as a dot (its certified share across, its realised error up),
 * a dot over the target line drawn hollow in ink; the splits that certified nothing are counted beside the plot.
 */
export function scatter({ splits, alpha, label }) {
	const pts = splits.filter(([s]) => s > 0);
	const over = pts.filter(([, e]) => e > alpha + 1e-12).length;
	const nothing = splits.length - pts.length;
	const held = splits.length - over;
	const desc = `${label}: ${n(splits.length)} re-splits at a ${pc(alpha, 0)} target. The promise held on ${held} of them; ${over} came in over the target; ${nothing} certified nothing.`;
	const { step, max } = errorAxis(alpha, Math.max(0, ...pts.map(([, e]) => e)));
	const draw = (wide) => {
		const W = wide ? 760 : 320, H = wide ? 320 : 280, L = wide ? 64 : 50, R = 14, T = 20, B = 46;
		const x = (s) => r1(L + s * (W - L - R));
		const y = (e) => r1(T + (1 - e / max) * (H - T - B));
		const yt = [];
		for (let v = 0; v <= max + 1e-9; v += step) yt.push(v);
		const grid = yt.map((v) => `<line class="tc-grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="tc-tick" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${pc(v, 0)}</text>`).join('');
		const xt = (wide ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1]).map((s) => `<text class="tc-tick" x="${x(s)}" y="${H - B + 18}" text-anchor="${s === 1 && !wide ? 'end' : 'middle'}">${pc(s, 0)}</text>`).join('');
		const dots = pts.map(([s, e]) => `<circle class="tc-pt${e > alpha + 1e-12 ? ' tc-pt--over' : ''}" cx="${x(s)}" cy="${y(e)}" r="${wide ? 4 : 3.4}"/>`).join('');
		const line = `<line class="tc-target" x1="${L}" x2="${W - R}" y1="${y(alpha)}" y2="${y(alpha)}"/><text class="tc-target__l" x="${L + 8}" y="${y(alpha) - 7}">target ${pc(alpha, 0)}</text>`;
		const axes = `<text class="tc-axis" x="${L + (W - L - R) / 2}" y="${H - 6}" text-anchor="middle">share of the split certified</text><text class="tc-axis" transform="translate(13 ${T + (H - T - B) / 2}) rotate(-90)" text-anchor="middle">wrong among the certified</text>`;
		return svg(`tc-svg--${wide ? 'wide' : 'narrow'}`, W, H, `tc-sc-${wide ? 'w' : 'n'}`, 'The 200 re-splits', desc, `${grid}${xt}${line}${dots}${axes}`);
	};
	return { svg: pair(draw), held, over, nothing };
}

/**
 * The drift replay: wrong certified answers per 100 messages as bars, off-topic messages per 100 as a line over them,
 * the monitor's state at each reading as a strip under the axis, and the first alert as a marker.
 */
export function driftChart({ series, messages, first_alert_after, start, top }, label) {
	const desc = `${label}: off-topic messages rise from none at message ${n(start)} to 30 in every 100 at message ${n(top)}. The monitor's first alert came after message ${n(first_alert_after)}.`;
	const ymax = Math.ceil(Math.max(...series.map((s) => Math.max(100 * s.oos, s.wrong))) / 10) * 10;
	return pair((wide) => {
		const W = wide ? 960 : 320, H = wide ? 340 : 300, L = wide ? 44 : 34, R = wide ? 16 : 10, T = 34, B = wide ? 84 : 90;
		const x = (m) => r1(L + (m / messages) * (W - L - R));
		const y = (v) => r1(T + (1 - v / ymax) * (H - T - B));
		const base = y(0);
		const yt = [];
		for (let v = 0; v <= ymax; v += wide ? 10 : 20) yt.push(v);
		const grid = yt.map((v) => `<line class="tc-grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="tc-tick" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('');
		const bw = r1(((W - L - R) / messages) * 100 * 0.7);
		const bars = series.map((s) => `<rect class="tc-wrong" x="${r1(x(s.after - 50) - bw / 2)}" y="${y(s.wrong)}" width="${bw}" height="${r1(base - y(s.wrong))}"/>`).join('');
		const oos = `<path class="tc-oos" d="${series.map((s, i) => `${i ? 'L' : 'M'}${x(s.after - 50)} ${y(100 * s.oos)}`).join('')}"/>`;
		const xt = [0, start, top, messages].map((m, i, a) => `<text class="tc-tick" x="${x(m)}" y="${base + 17}" text-anchor="${i === 0 ? 'start' : i === a.length - 1 ? 'end' : 'middle'}">${n(m)}</text>`).join('');
		const sy = base + 34;
		const strip = series.map((s, i) => { const x0 = x(i ? series[i - 1].after : 0); return `<rect class="tc-state tc-state--${s.state === 'ok' ? 'ok' : 'alert'}" x="${x0}" y="${sy}" width="${r1(x(s.after) - x0)}" height="9"/>`; }).join('');
		const legend = `<text class="tc-strip__l" x="${L}" y="${sy + 26}">the monitor at each reading: <tspan class="tc-key-ok">ok</tspan> or <tspan class="tc-key-alert">alert</tspan></text>`;
		const ax = x(first_alert_after);
		const right = ax > W * 0.6;
		const marker = `<line class="tc-alert" x1="${ax}" x2="${ax}" y1="${T - 18}" y2="${base}"/><text class="tc-alert__l" x="${right ? ax - 6 : ax + 6}" y="${T - 20 + 12}" text-anchor="${right ? 'end' : 'start'}">${wide ? 'first alert, after message' : 'first alert after'} ${n(first_alert_after)}</text>`;
		return svg(`tc-svg--${wide ? 'wide' : 'narrow'}`, W, H, `tc-dr-${wide ? 'w' : 'n'}`, 'The drift replay', desc, `${grid}${bars}${oos}${xt}${strip}${legend}${marker}`);
	});
}
