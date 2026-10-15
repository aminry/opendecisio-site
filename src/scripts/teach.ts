// The teaching section (src/components/home/TeachIt.astro): the story played once when it comes into view, pausable
// and replayable, and the "examples taught" slider. The stage is drawn in its final state at build time; this script
// sets every element from one timeline t (milliseconds), so pausing freezes it where it is. Under reduced motion the
// final state stays and nothing moves. Only attributes and custom properties are set, as the CSP requires.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends Element>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const span = (t: number, a: number, b: number) => ease((t - a) / (b - a));
const END = 15000;

const stage = document.querySelector<HTMLElement>('[data-teach]');
if (stage && !reduce) {
	const play = stage.querySelector<HTMLButtonElement>('[data-teach-play]')!;
	const acts = $$<HTMLElement>('[data-act]', stage);
	const counts = $$<HTMLElement>('[data-teach-count]', stage);
	const svgs = $$<SVGSVGElement>('.tc-svg', stage).map((svg) => {
		const grid = JSON.parse(svg.dataset.tcGrid!);
		const box = svg.querySelector<SVGRectElement>('.tc-node')!;
		const boxX = Number(box.getAttribute('x'));
		const chips = $$<SVGGElement>('.tc-chip', svg).map((g) => ({ g, x: Number(g.querySelector('rect')!.getAttribute('x')), w: Number(g.querySelector('rect')!.getAttribute('width')) }));
		const opts = $$<SVGRectElement>('.tc-opt', svg).map((r) => ({ r, h0: Number(r.dataset.h0), h1: Number(r.dataset.h1), base: Number(r.getAttribute('y')) + Number(r.getAttribute('height')) }));
		const after = svg.querySelector<SVGRectElement>('.tc-bar--after')!;
		const afterText = svg.querySelector<SVGTextElement>('[data-count-to]')!;
		const dots = $$<SVGCircleElement>('.tc-dot[data-gx]', svg).map((el) => ({ el, gx: +el.dataset.gx!, gy: +el.dataset.gy!, tx: +el.dataset.tx!, ty: +el.dataset.ty!, gr: +el.dataset.gr!, tr: +el.dataset.tr! }));
		const stair = svg.querySelector<SVGPathElement>('.tc-stair')!;
		// The ranking appears with act 2; the trays and the stamp just before act 3.
		const early = $$<SVGElement>('.tc-gridbg, .tc-ghosts, .tc-thr', svg);
		const late = $$<SVGElement>('.tc-trays, .tc-stamp', svg);
		const stairAt = (k: number) => {
			const row = Math.floor(k / grid.cols);
			const col = k % grid.cols;
			const top = grid.y - grid.gap / 2 + row * grid.gap;
			const xs = grid.x - grid.gap / 2;
			const xe = xs + grid.cols * grid.gap;
			const xc = xs + col * grid.gap;
			return col === 0 ? `M${xs} ${top}H${xe}` : `M${xs} ${top + grid.gap}H${xc}V${top}H${xe}`;
		};
		return { svg, grid, boxX, chips, opts, after, afterText, dots, stair, early, late, stairAt };
	});
	const op = (el: Element, o: number) => (el as SVGElement).style.setProperty('opacity', String(o));

	function render(t: number) {
		acts.forEach((a, i) => a.classList.toggle('on', i === (t < 6500 ? 0 : t < 11000 ? 1 : 2)));
		for (const s of svgs) {
			if (!s.svg.getBoundingClientRect().width) continue;
			// 1. The labelled examples come in one after another and go into Decisio; once taught they stay, dimmed.
			s.chips.forEach((c, i) => {
				const a = i * 350;
				const inn = span(t, a, a + 300);
				const fly = span(t, a + 800, a + 1500);
				const back = span(t, 6000, 6600);
				const dx = fly * (s.boxX - c.x - c.w * 0.4) - (1 - inn) * 40;
				c.g.setAttribute('transform', `translate(${dx.toFixed(1)} 0)`);
				op(c.g, t < a + 800 ? inn : back > 0 ? 0.55 * back : 1 - fly);
				if (back > 0) c.g.setAttribute('transform', 'translate(0 0)');
			});
			// The answer sharpens; accuracy grows from before to after.
			const sharp = span(t, 3400, 5600);
			s.opts.forEach((o) => {
				const h = o.h0 + (o.h1 - o.h0) * sharp;
				o.r.setAttribute('height', h.toFixed(1));
				o.r.setAttribute('y', (o.base - h).toFixed(1));
			});
			const w0 = Number(s.after.dataset.w0);
			const w1 = Number(s.after.dataset.w1);
			s.after.setAttribute('width', (w0 + (w1 - w0) * sharp).toFixed(1));
			const from = Number(s.afterText.dataset.countFrom);
			const to = Number(s.afterText.dataset.countTo);
			s.afterText.textContent = `${(from + (to - from) * sharp).toFixed(1)}%`;
			// 2. The answers appear, most confident first, and the line moves down until the certified ones are above it.
			const show = span(t, 6500, 7300);
			s.early.forEach((el) => op(el, show));
			s.late.forEach((el) => op(el, span(t, 10300, 11000)));
			const k = Math.round(span(t, 7300, 10300) * s.grid.certified);
			s.stair.setAttribute('d', s.stairAt(k));
			op(s.stair, show);
			// 3. Certified answers go to automation, the rest to a person.
			s.dots.forEach((d, i) => {
				const m = span(t, 11000 + i * 9, 11000 + i * 9 + 1100);
				d.el.setAttribute('cx', (d.gx + (d.tx - d.gx) * m).toFixed(1));
				d.el.setAttribute('cy', (d.gy + (d.ty - d.gy) * m).toFixed(1));
				d.el.setAttribute('r', (d.gr + (d.tr - d.gr) * m).toFixed(2));
				op(d.el, show);
				d.el.classList.toggle('tc-dot--lit', i < k);
			});
		}
		counts.forEach((c) => {
			const to = Number(c.dataset.teachCount);
			const from = Number(c.dataset.from);
			const k = c.closest('.teach__c--hot') ? span(t, 7300, 10300) : span(t, 3400, 5600);
			c.textContent = `${(from + (to - from) * k).toFixed(1)}%`;
		});
	}

	let t = 0;
	let last = 0;
	let running = false;
	let raf = 0;
	const frame = (now: number) => {
		t = Math.min(END, t + (now - last));
		last = now;
		render(t);
		if (t >= END) { running = false; stage.classList.remove('is-playing'); play.textContent = 'Replay'; return; }
		raf = requestAnimationFrame(frame);
	};
	const start = () => { running = true; stage.classList.add('is-playing'); play.textContent = 'Pause'; last = performance.now(); raf = requestAnimationFrame(frame); };
	const stop = () => { running = false; cancelAnimationFrame(raf); play.textContent = 'Play'; };
	play.hidden = false;
	play.addEventListener('click', () => {
		if (running) return stop();
		if (t >= END) t = 0;
		start();
	});
	// Play once, the first time the stage is well in view; never while the tab is hidden.
	const io = new IntersectionObserver((es) => es.forEach((e) => {
		if (!e.isIntersecting || t > 0 || running) return;
		io.disconnect();
		render(0);
		start();
	}), { threshold: 0.35 });
	io.observe(stage);
	document.addEventListener('visibilitychange', () => { if (document.hidden && running) stop(); });
}

// The slider: one stop for each measured amount of teaching; the bars, values and note follow it.
const box = document.querySelector<HTMLElement>('[data-teach-slider]');
if (box) {
	const stops = JSON.parse(box.dataset.d!) as { label: string; rows: { name: string; acc: number }[]; seconds: number | null; examples: number[] | null }[];
	const input = box.querySelector<HTMLInputElement>('input')!;
	const out = box.querySelector<HTMLOutputElement>('[data-teach-n]')!;
	const w = (acc: number) => `${Math.max(2, ((acc - 0.5) / 0.5) * 100).toFixed(1)}%`;
	const set = () => {
		const s = stops[Number(input.value)];
		out.textContent = s.label;
		s.rows.forEach((r, i) => {
			box.querySelector<HTMLElement>(`[data-fill="${i}"]`)?.style.setProperty('--w', w(r.acc));
			box.querySelector<HTMLElement>(`[data-ghost="${i}"]`)?.style.setProperty('--w', w(stops[0].rows[i].acc));
			const v = box.querySelector<HTMLElement>(`[data-val="${i}"]`);
			if (v) v.textContent = `${(r.acc * 100).toFixed(1)}%${s.examples ? `, ${s.examples[i].toLocaleString('en-US')} examples` : ''}`;
		});
	};
	input.addEventListener('input', set);
	set();
}
