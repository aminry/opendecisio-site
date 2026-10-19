// The home page's interactive pieces: the hero's replay of recorded decisions, the Get started tabs and their copy
// buttons, and the threshold line. No library. Every number comes from the page itself (the demo's records on
// [data-demo], the measured stops on [data-cert]); this file only moves between those values and formats them. With
// prefers-reduced-motion nothing animates, and without JavaScript the page keeps the first record, the first tab
// and the 5% stop it was built with.
type Bar = { label: string; title?: string; p: number; top: boolean };
type Q = { name: string; type: string; ask: string; bars: Bar[]; result?: string };
type Item = { id: string; kind: string; record: number; of: number; state: string; questions: Q[]; serverMs: number };
type Stop = { alpha: number; covered: number; errors: number; n: number };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const OUT = 'cubic-bezier(.16,1,.3,1)';
const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const n0 = (n: number) => n.toLocaleString('en-US');
const pc = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const copied = (b: HTMLButtonElement) => { b.textContent = 'copied'; setTimeout(() => (b.textContent = 'copy'), 1500); };

// The replay: recorded decisions, played as the flow they are. The text enters, the server reads it once, and then
// every question is scored together in one batch (the Gemma 4 31B's default, --multi-question warm), so every bar fills
// at once. One clock runs to the record's server time, the request's total; no per-question time is shown, because the
// record has none. The probabilities and the server time are the record's.
const demo = $('[data-demo]');
if (demo) {
	const items: Item[] = JSON.parse(demo.dataset.items ?? '[]');
	const chips = $$<HTMLButtonElement>('[data-demo-pick] button', demo);
	const qs = $('[data-demo-qs]', demo)!;
	const count$ = $('[data-demo-count]', demo)!;
	let cur = 0;
	let raf = 0;
	const play = (slow = 1) => {
		const it = items[cur];
		const n = it.questions.length;
		cancelAnimationFrame(raf);
		const T = it.serverMs * slow;
		demo.classList.remove('is-done');
		$$('.demo__spine, .dq__branch, .dq__fill', demo).forEach((e) => e.getAnimations().forEach((a) => a.cancel()));
		// The read draws the spine; then one step: every branch and every bar together. The split between the two is
		// only for the eye (the record has one time); the clock shows the total.
		const batch = T * 0.45;
		const drawX = (e: Element, d: number, delay: number) => e.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: reduce ? 0 : d, delay: reduce ? 0 : delay, easing: OUT, fill: 'backwards' });
		if (!reduce) $('.demo__spine', qs)?.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: batch * 0.9, delay: T * 0.05, easing: OUT, fill: 'backwards' });
		$$('.dq', qs).forEach((c) => {
			drawX($('.dq__branch', c)!, T * 0.2, batch);
			$$('.dq__fill', c).forEach((f) => drawX(f, T * 0.5, batch + T * 0.05));
		});
		const label = (t: number) => {
			const ms = Math.min(it.serverMs, (t / T) * it.serverMs).toFixed(1);
			count$.textContent = t < batch ? `reading the text · ${ms} ms` : t < T ? `scoring ${n} questions in one batch · ${ms} ms` : `${n} answers in one batch · ${it.serverMs.toFixed(1)} ms server time`;
		};
		if (reduce) { label(T * 2); demo.classList.add('is-done'); return; }
		const t0 = performance.now();
		const tick = (now: number) => {
			const t = now - t0;
			label(Math.min(t, T * 1.2));
			if (t < T * 1.1) raf = requestAnimationFrame(tick);
			else { label(T * 2); demo.classList.add('is-done'); }
		};
		raf = requestAnimationFrame(tick);
	};
	const showItem = (i: number) => {
		cur = i;
		const it = items[i];
		chips.forEach((c, k) => c.setAttribute('aria-pressed', String(k === i)));
		$('[data-demo-kind]', demo)!.textContent = `Incoming ${it.kind.toLowerCase()} · record ${it.record} of ${n0(it.of)}`;
		$('[data-demo-state]', demo)!.textContent = it.state;
		const spine = $('.demo__spine', qs)!;
		qs.innerHTML = '';
		qs.append(spine);
		qs.insertAdjacentHTML('beforeend', it.questions.map((q) => {
			// A score keeps its scale order and shows every level; a choice shows the three likeliest options, then how many more there are.
			const sorted = q.type === 'score' ? [...q.bars] : [...q.bars].sort((x, y) => y.p - x.p);
			const more = q.type === 'score' ? [] : sorted.slice(3);
			const shown = q.type === 'score' ? sorted : sorted.slice(0, 3);
			return `<div class="dq"><span class="dq__branch" aria-hidden="true"></span><p class="dq__head"><b>${esc(q.name)}</b><span>${esc(q.type)}</span>${q.result ? `<span class="dq__res">${esc(q.result)}</span>` : ''}</p><p class="dq__ask">${esc(q.ask)}</p><ul class="dq__bars">${shown.map((b) => `<li class="dq__bar${b.top ? ' is-top' : ''}"><span title="${esc(b.title ?? '')}">${esc(b.label)}</span><span class="dq__rail"><span class="dq__fill" data-w="${Math.max(b.p * 100, 1)}"></span></span><span class="dq__p">${b.p.toFixed(2)}</span></li>`).join('')}${more.length ? `<li class="dq__more" title="${esc(more.map((b) => `${b.label} ${b.p.toFixed(2)}`).join(', '))}">+${more.length} more</li>` : ''}</ul></div>`;
		}).join(''));
		$$('.dq__fill', qs).forEach((f) => f.style.setProperty('width', `${f.dataset.w}%`));
		play(1);
	};
	chips.forEach((c, k) => c.addEventListener('click', () => showItem(k)));
	$$<HTMLButtonElement>('[data-demo-play]', demo).forEach((b) => b.addEventListener('click', () => play(Number(b.dataset.demoPlay))));
	// The first record is already in the page; the script attaches to it and plays it.
	play(1);
}

// Get started: the tabs, and one copy button on each box, which copies the block as published.
const tabs = $('[data-tabs]');
if (tabs) {
	const btns = $$<HTMLButtonElement>('.gs__tabs [role=tab]', tabs);
	const panels = $$('.gs__panel', tabs);
	btns.forEach((b, i) => b.addEventListener('click', () => {
		btns.forEach((o, k) => o.setAttribute('aria-selected', String(k === i)));
		panels.forEach((p, k) => p.classList.toggle('on', k === i));
	}));
}
for (const copy of $$<HTMLButtonElement>('[data-copy-box]')) {
	copy.hidden = false;
	copy.addEventListener('click', () => navigator.clipboard?.writeText(copy.parentElement!.dataset.copyText ?? '').then(() => copied(copy)));
}

// The threshold line: each measured stop sets the bar and the three values; nothing between the stops is drawn.
const cert = $('[data-cert]');
if (cert) {
	const stops: Stop[] = JSON.parse(cert.dataset.cert!);
	const bar = $('[data-cert-bar]', cert)!;
	const out = (k: string) => $(`[data-cert="${k}"]`, cert)!;
	const btns = $$<HTMLButtonElement>('[data-alpha]', cert);
	const set = (s: Stop) => {
		btns.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.alpha) === s.alpha)));
		bar.style.setProperty('width', `${((100 * s.covered) / s.n).toFixed(2)}%`);
		out('share').textContent = pc(s.covered / s.n);
		out('covered').textContent = `${n0(s.covered)} of ${n0(s.n)} messages`;
		out('wrong').textContent = s.covered ? pc(s.errors / s.covered) : 'none';
		out('errors').textContent = s.covered ? `${n0(s.errors)} messages` : 'nothing certified';
		out('person').textContent = n0(s.n - s.covered);
	};
	btns.forEach((b) => b.addEventListener('click', () => set(stops.find((s) => s.alpha === Number(b.dataset.alpha))!)));
}
