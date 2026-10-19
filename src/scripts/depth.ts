// Round 6's shared pointer light (technique adapted from shad0w's site.js, Apache-2.0; NOTICE): a spotlight under the
// pointer on every .tile, and figures whose dots travel run only while on screen. Under prefers-reduced-motion nothing
// moves. Only CSS custom properties are set (through the CSSOM), so the page's Content-Security-Policy, which allows no
// style attributes, holds.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends Element>(s: string) => [...document.querySelectorAll<T>(s)];

// Spotlight: the pointer's place in the tile.
document.addEventListener('pointermove', (e) => {
	const t = (e.target as Element).closest?.<HTMLElement>('.tile');
	if (!t) return;
	const r = t.getBoundingClientRect();
	t.style.setProperty('--mx', `${e.clientX - r.left}px`);
	t.style.setProperty('--my', `${e.clientY - r.top}px`);
}, { passive: true });

// Figures with travelling dots (SVG animateMotion): they run only while on screen, and never under reduced motion.
for (const svg of $$<SVGSVGElement>('svg')) {
	if (!svg.querySelector('animateMotion')) continue;
	svg.pauseAnimations();
	if (reduce) continue;
	new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations())), { threshold: 0.2 }).observe(svg);
}
