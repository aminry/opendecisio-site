// Scroll reveals and count-ups, shared by the site's pages: an element marked [data-reveal] rises in once, when its
// top is inside the screen, and then receives a "reveal" event; a .count inside it counts up to data-to (data-dec
// decimals, data-final the text it ends on). Under prefers-reduced-motion everything is in place from the start and
// nothing counts. The CSS is home.css's (.js [data-reveal]).
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

/** Count a .count element up to its value, once. */
export function count(el: HTMLElement) {
	if (reduce) return;
	const to = Number(el.dataset.to);
	const dec = Number(el.dataset.dec ?? 0);
	const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
	const t0 = performance.now();
	const step = (t: number) => {
		const k = Math.min(1, (t - t0) / 900);
		el.textContent = k < 1 ? fmt(to * (1 - (1 - k) ** 3)) : (el.dataset.final ?? fmt(to));
		if (k < 1) requestAnimationFrame(step);
	};
	requestAnimationFrame(step);
}

const io = new IntersectionObserver((es) => es.forEach((e) => {
	if (!e.isIntersecting) return;
	const el = e.target as HTMLElement;
	io.unobserve(el);
	el.classList.add('in');
	$$('.count', el).forEach(count);
	el.dispatchEvent(new Event('reveal'));
}), { threshold: 0.01, rootMargin: '0px 0px -12% 0px' });
$$('[data-reveal]').forEach((el) => (reduce ? el.classList.add('in') : io.observe(el)));
