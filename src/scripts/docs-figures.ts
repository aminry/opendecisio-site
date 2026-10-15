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

// Using the probability: one stop for each measured threshold.
for (const th of $$('[data-th]')) {
	const R = JSON.parse(th.dataset.d ?? 'null');
	if (!R) continue;
	const input = th.querySelector<HTMLInputElement>('input[type=range]')!;
	const kept = th.querySelector<SVGRectElement>('[data-th-kept]')!;
	const out = th.querySelector<HTMLElement>('[data-th-out]')!;
	const draw = () => {
		const x = R.sweep[Number(input.value)];
		kept.setAttribute('width', String(640 * (1 - x.share)));
		out.textContent = `Keep answers at or above ${x.at}: ${x.escalated.toLocaleString('en-US')} of ${R.questions.toLocaleString('en-US')} questions escalated (${(x.share * 100).toFixed(1)}%); ${(x.accuracy * 100).toFixed(1)}% right on the rest; ${x.caught} of ${R.wrong} wrong answers escalated; ${x.confident} confidently wrong and kept.`;
	};
	input.addEventListener('input', draw);
	draw();
}
