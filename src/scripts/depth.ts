// Round 6's shared motion (techniques adapted from shad0w's site.js, Apache-2.0; NOTICE): a spotlight under the
// pointer on every .tile and a small tilt toward it on a .tilt tile, the rolling phrase of a .flip, and the slow drift
// of a [data-parallax] glow with the scroll. Under prefers-reduced-motion nothing moves: a flip keeps its last
// phrase, and the glow stays where it is. Only CSS custom properties are set (through the CSSOM), so the page's
// Content-Security-Policy, which allows no style attributes, holds.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends Element>(s: string) => [...document.querySelectorAll<T>(s)];

// Spotlight and tilt: the pointer's place in the tile, and a lean of at most 3 degrees toward it.
document.addEventListener('pointermove', (e) => {
	const t = (e.target as Element).closest?.<HTMLElement>('.tile');
	if (!t) return;
	const r = t.getBoundingClientRect();
	const x = e.clientX - r.left;
	const y = e.clientY - r.top;
	t.style.setProperty('--mx', `${x}px`);
	t.style.setProperty('--my', `${y}px`);
	if (!reduce && t.classList.contains('tilt')) {
		t.style.setProperty('--ry', `${((x / r.width) - 0.5) * 6}deg`);
		t.style.setProperty('--rx', `${(0.5 - (y / r.height)) * 6}deg`);
	}
}, { passive: true });
for (const t of $$<HTMLElement>('.tilt')) {
	t.addEventListener('pointerleave', () => {
		t.style.setProperty('--rx', '0deg');
		t.style.setProperty('--ry', '0deg');
	});
}

// Flip: the next phrase rolls in every 2.6 seconds, ending each round on the phrase the page was written with.
if (!reduce) {
	for (const flip of $$<HTMLElement>('[data-flip]')) {
		const words = flip.dataset.flip!.split('|');
		const w = flip.querySelector<HTMLElement>('.flip__w');
		if (!w || words.length < 2) continue;
		let k = words.length - 1;
		setInterval(() => {
			if (document.hidden) return;
			w.classList.remove('in');
			w.classList.add('out');
			setTimeout(() => {
				k = (k + 1) % words.length;
				w.textContent = words[k];
				w.classList.remove('out');
				w.classList.add('in');
			}, 240);
		}, 2600);
	}
}

// Parallax: a glow drifts down at a quarter of the scroll, at most 240px.
const glows = $$<HTMLElement>('[data-parallax]');
if (glows.length && !reduce) {
	let ticking = false;
	addEventListener('scroll', () => {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(() => {
			ticking = false;
			const py = `${Math.min(240, scrollY * 0.25)}px`;
			glows.forEach((g) => g.style.setProperty('--py', py));
		});
	}, { passive: true });
}

// Figures with travelling dots (SVG animateMotion): they run only while on screen, and never under reduced motion.
for (const svg of $$<SVGSVGElement>('svg')) {
	if (!svg.querySelector('animateMotion')) continue;
	svg.pauseAnimations();
	if (reduce) continue;
	new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations())), { threshold: 0.2 }).observe(svg);
}
