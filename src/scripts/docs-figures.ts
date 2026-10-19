// The docs' figures (src/lib/docs-figures.mjs): starts the ones that move, once they are on screen and never under
// prefers-reduced-motion, gives each a Pause button, and wires the ones that answer to hover or focus. No library.
// A figure is at its final state in the page as written; this file only restarts its animation (the `is-run` class)
// and lights partners, so nothing here changes what a figure says.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

// Moving figures: play once through, hold at the end, play again; pause on a button or while off screen.
for (const fig of $$('.fig[data-live]')) {
	const pause = fig.querySelector<HTMLButtonElement>('[data-fig-pause]');
	if (reduce) continue;
	const total = Number(fig.dataset.live) * 1000 + 4000;
	let timer: number | undefined;
	let started = 0;
	let left = total;
	let visible = false;
	let held = false;
	const run = () => {
		fig.classList.remove('is-run');
		void fig.offsetWidth;
		fig.classList.add('is-run');
		started = performance.now();
		left = total;
		timer = window.setTimeout(run, left);
	};
	const stop = () => {
		if (timer === undefined) return;
		clearTimeout(timer);
		timer = undefined;
		left = Math.max(0, left - (performance.now() - started));
		fig.classList.add('is-paused');
	};
	const go = () => {
		fig.classList.remove('is-paused');
		if (!fig.classList.contains('is-run')) return run();
		started = performance.now();
		timer = window.setTimeout(run, left);
	};
	if (pause) {
		pause.hidden = false;
		pause.addEventListener('click', () => {
			held = !held;
			pause.textContent = held ? 'Play' : 'Pause';
			pause.setAttribute('aria-pressed', String(held));
			if (held) stop(); else if (visible) go();
		});
	}
	new IntersectionObserver((es) => es.forEach((e) => {
		visible = e.isIntersecting;
		if (visible && !held) go(); else if (!visible) stop();
	}), { threshold: 0.35 }).observe(fig);
}

// First decision: a line on one side lights its partner on the other, and a note says what it is.
for (const fig of $$('.fig--first-decision')) {
	const notes = $$('[data-note]', fig);
	const light = (key: string) => {
		for (const el of $$('[data-k]', fig)) el.classList.toggle('on', key !== '' && el.dataset.k === key);
		const shown = notes.some((n) => n.dataset.note === key) ? key : '';
		for (const n of notes) n.hidden = n.dataset.note !== shown;
	};
	const keyOf = (t: EventTarget | null) => (t as HTMLElement | null)?.closest<HTMLElement>('[data-k]')?.dataset.k ?? '';
	fig.addEventListener('mouseover', (e) => light(keyOf(e.target)));
	fig.addEventListener('mouseleave', () => light(''));
	fig.addEventListener('focusin', (e) => light(keyOf(e.target)));
	fig.addEventListener('focusout', () => light(''));
}

// Latency: three views of measured points; a tooltip line names the point under the pointer or the focus.
for (const fig of $$('.fig--latency-chart')) {
	const tabs = $$<HTMLButtonElement>('[data-view-tab]', fig);
	const views = $$('[data-view]', fig);
	const tip = fig.querySelector<HTMLElement>('[data-lc-tip]')!;
	const rest = tip.textContent ?? '';
	for (const t of tabs) t.addEventListener('click', () => {
		for (const o of tabs) o.setAttribute('aria-selected', String(o === t));
		for (const v of views) v.hidden = v.dataset.view !== t.dataset.viewTab;
		tip.textContent = rest;
	});
	const say = (e: Event) => { const d = (e.target as HTMLElement).closest<SVGElement>('[data-tip]'); tip.textContent = d?.dataset.tip ?? rest; };
	fig.addEventListener('mouseover', say);
	fig.addEventListener('focusin', say);
	fig.addEventListener('mouseleave', () => { tip.textContent = rest; });
}

// Certifying answers: one stop for each error target the server certified at.
for (const cs of $$('[data-cs]')) {
	const R = JSON.parse(cs.dataset.d ?? 'null');
	if (!R) continue;
	const input = cs.querySelector<HTMLInputElement>('input[type=range]')!;
	const ok = cs.querySelector<SVGRectElement>('[data-cs-ok]')!;
	const bad = cs.querySelector<SVGRectElement>('[data-cs-bad]')!;
	const out = cs.querySelector<HTMLElement>('[data-cs-out]')!;
	const fmt = (n: number) => n.toLocaleString('en-US');
	const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
	const draw = () => {
		const s = R.stops[Number(input.value)];
		const w = (640 * s.certified) / R.n;
		const b = (640 * s.wrong) / R.n;
		ok.setAttribute('width', String(w));
		bad.setAttribute('x', String(w - b));
		bad.setAttribute('width', String(b));
		out.textContent = s.threshold === null
			? `At an error target of ${s.alpha * 100}%, nothing is certified: with ${fmt(R.held)} examples held back, no threshold can promise it. Every answer still comes back, marked not certified.`
			: `At an error target of ${s.alpha * 100}%, answers with a top probability of at least ${s.threshold.toFixed(3)} are certified: ${fmt(s.certified)} of ${fmt(R.n)} messages (${pct(s.certified / R.n)}), ${s.wrong} of them wrong (${pct(s.wrong / s.certified)}). The rest come back marked not certified.`;
	};
	input.addEventListener('input', draw);
	draw();
}
