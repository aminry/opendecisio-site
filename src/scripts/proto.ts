// The home page's interactive pieces (scroll reveals and count-ups are reveal.ts's): the hero's live demo of recorded
// decisions, the install tabs, the "How it works" scenes, the 50-question race, the document-length and routing-threshold sliders, the
// JevBench grid and the reel's chapters. No library. Every number comes from the JSON on #proto (src/lib/launch.mjs
// protoData, from launch_facts.public.json, with the recorded decisions in figures.recorded_decisions); this file only moves between those values and formats
// them. Timing follows 120, 240 and 480 ms with cubic-bezier(.16, 1, .3, 1) for the outs. With prefers-reduced-motion
// nothing animates and each piece shows its final state. Without JavaScript the page keeps the static chart, table,
// example response and video it carries.
import { count } from './reveal.ts';

type Cell = { s: number; label: string } | null;
type Sys = { name: string; cls: string; limit: number; cells: Record<string, Cell> };
type Bar = { label: string; title?: string; p: number; top: boolean };
type Q = { name: string; type: string; ask: string; bars: Bar[]; result?: string };
type Item = { id: string; kind: string; record: number; of: number; state: string; questions: Q[]; serverMs: number };
const root = document.getElementById('proto');
const D = root ? JSON.parse(root.dataset.d ?? 'null') : null;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const OUT = 'cubic-bezier(.16,1,.3,1)';
const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const n0 = (n: number) => n.toLocaleString('en-US');
const pc = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;
const show = (el: Element | null | undefined) => el && ((el as HTMLElement).hidden = false);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const fill = (el: Element, ms: number, delay = 0) => el.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: reduce ? 0 : ms, delay: reduce ? 0 : delay, easing: OUT, fill: 'backwards' });

if (D) {
	// Chips in the hero are on screen at load: count them up once.
	$$('.chips .count').forEach(count);

	// Install tabs and copy.
	const inst = $('[data-install]');
	if (inst) {
		const cmd = $('[data-install-cmd]', inst)!;
		$$<HTMLButtonElement>('.install__tabs button', inst).forEach((b, _, all) => b.addEventListener('click', () => {
			all.forEach((o) => o.setAttribute('aria-selected', String(o === b)));
			cmd.textContent = b.dataset.cmd ?? '';
		}));
		const copy = $<HTMLButtonElement>('[data-copy]', inst);
		copy?.addEventListener('click', () => navigator.clipboard?.writeText(cmd.textContent ?? '').then(() => { copy.textContent = 'copied'; setTimeout(() => (copy.textContent = 'copy'), 1500); }));
	}

	// Live demo: recorded decisions, played as the flow they are. The text enters, the server reads it once, and then
	// every question is scored together in one batch (the Gemma 4 31B's default, --multi-question warm), so every bar
	// fills at once. One clock runs to the record's server time, the request's total; no per-question time is shown,
	// because the record has none. The probabilities and the server time are the record's.
	const demo = $('[data-demo]');
	if (demo) {
		const items: Item[] = D.demo.items;
		const pick = $('[data-demo-pick]', demo)!;
		const chips = $$<HTMLButtonElement>('button', pick);
		const qs = $('[data-demo-qs]', demo)!;
		const count$ = $('[data-demo-count]', demo)!;
		let cur = 0;
		let raf = 0;
		const play = (slow = 1) => {
			const it = items[cur];
			const n = it.questions.length;
			cancelAnimationFrame(raf);
			const T = it.serverMs * slow;
			const cards = $$('.dq', qs);
			demo.classList.remove('is-done');
			$$('.demo__spine, .dq__branch, .dq__fill', demo).forEach((e) => e.getAnimations().forEach((a) => a.cancel()));
			// The read draws the spine; then one step: every branch and every bar together. The split between the two is
			// only for the eye (the record has one time); the clock shows the total.
			const batch = T * 0.45;
			const drawX = (e: Element, d: number, delay: number) => e.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: reduce ? 0 : d, delay: reduce ? 0 : delay, easing: OUT, fill: 'backwards' });
			if (!reduce) $('.demo__spine', qs)?.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: batch * 0.9, delay: T * 0.05, easing: OUT, fill: 'backwards' });
			cards.forEach((c) => {
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
		const showItem = (i: number, autoplay = true) => {
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
			$$('.dq__fill', qs).forEach((f) => { f.style.width = `${f.dataset.w}%`; });
			if (autoplay) play(1);
		};
		chips.forEach((c, k) => c.addEventListener('click', () => showItem(k)));
		$$<HTMLButtonElement>('[data-demo-play]', demo).forEach((b) => b.addEventListener('click', () => play(Number(b.dataset.demoPlay))));
		// The first record is already in the page; the script attaches to it and plays it.
		play(1);
	}

	// How it works: three scenes, stepped by hand or left to play. A scene stays up long enough to finish (eight seconds at
	// least; the threshold scene walks the whole measured sweep once), and playing stops while the pointer or the keyboard is on it.
	const steps = $('[data-steps]');
	if (steps) {
		const tabs = $$<HTMLButtonElement>('.steps2__tab', steps);
		const panels = $$('.steps2__panel', steps);
		const DWELL = [8200, 8200, 9400];
		// A bar that stands for a measured time grows over that time (data-ms, from the facts), set through the CSSOM.
		$$<HTMLElement>('[data-ms]', steps).forEach((b) => b.style.setProperty('animation-duration', `${b.dataset.ms}ms`));
		let at = 0;
		let timer = 0;
		let sweepTimer = 0;
		let manual = false;
		let held = false;
		let live = false;
		const stop = () => { clearTimeout(timer); clearInterval(sweepTimer); };
		const go = (i: number) => {
			at = i;
			tabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
			panels.forEach((p, k) => {
				p.classList.toggle('on', k === i);
				// A scene's animation starts when it appears: replay it by taking the SVG out of the flow for a frame.
				if (k === i) { const s = $('svg', p); if (s) { s.style.display = 'none'; void s.getBoundingClientRect(); s.style.display = ''; } }
			});
			clearInterval(sweepTimer);
			if (i === 2) sweep();
			schedule();
		};
		function schedule() {
			clearTimeout(timer);
			if (reduce || manual || held || !live) return;
			timer = window.setTimeout(() => go((at + 1) % panels.length), DWELL[at]);
		}
		function sweep() {
			const R = D.routing;
			const svg = $('svg', panels[2])!;
			const kept = $('[data-sweep-kept]', svg)!;
			const esc = $('[data-sweep-esc]', svg)!;
			const at$ = $('[data-sweep-at]', svg)!;
			const out = $('[data-sweep-out]', svg)!;
			let k = 3;
			const draw = () => {
				const x = R.sweep[k];
				const keptW = ((R.questions - x.escalated) / R.questions) * 840;
				kept.setAttribute('width', keptW.toFixed(1));
				esc.setAttribute('x', (20 + keptW).toFixed(1));
				esc.setAttribute('width', (840 - keptW).toFixed(1));
				at$.textContent = String(x.at);
				out.textContent = `${n0(x.escalated)} of ${n0(R.questions)} questions escalated (${pc(x.share)}), ${pc(x.accuracy)} right on the rest`;
			};
			draw();
			if (reduce || held || !live) return;
			sweepTimer = window.setInterval(() => { k = (k + 1) % R.sweep.length; draw(); }, 1300);
		}
		tabs.forEach((t, i) => t.addEventListener('click', () => { manual = true; stop(); go(i); }));
		$('[data-steps-play]', steps)?.addEventListener('click', () => { manual = false; go(0); });
		const hold = (on: boolean) => { held = on; if (on) stop(); else { if (at === 2) sweep(); schedule(); } };
		steps.addEventListener('mouseenter', () => hold(true));
		steps.addEventListener('mouseleave', () => hold(false));
		steps.addEventListener('focusin', () => hold(true));
		steps.addEventListener('focusout', () => hold(false));
		steps.addEventListener('reveal', () => { live = true; go(0); });
		if (reduce) steps.classList.add('in');
		go(0);
	}

	// Race: 50 questions about one document, each system's bar runs for its recorded median.
	const race = $('[data-race]');
	if (race) {
		const systems: Sys[] = D.race.systems;
		let len = '3000';
		let speed = 8;
		let raf = 0;
		const rows = $('[data-race-rows]', race)!;
		const clock = $('[data-race-clock]', race)!;
		rows.innerHTML = systems.map((s) => `<div class="race__row race__${s.cls}"><span class="race__name">${s.name}</span><span class="race__track"><span class="race__bar"></span></span><span class="race__val"></span></div>`).join('');
		const els = $$('.race__row', rows).map((r) => ({ bar: $('.race__bar', r)!, val: $('.race__val', r)! }));
		const run = () => {
			cancelAnimationFrame(raf);
			const max = Math.max(...systems.map((s) => s.cells[len]?.s ?? 0));
			const t0 = performance.now();
			const done = new Set<number>();
			els.forEach((e, i) => {
				const c = systems[i].cells[len];
				e.val.textContent = '';
				e.bar.getAnimations().forEach((a) => a.cancel());
				if (!c) { e.bar.style.transform = 'scaleX(0)'; e.val.textContent = `not supported: over its ${n0(systems[i].limit)}-token limit`; return; }
				const k = c.s / max;
				e.bar.style.transform = `scaleX(${k})`;
				if (reduce) { e.val.textContent = c.label; return; }
				e.bar.animate([{ transform: 'scaleX(0)' }, { transform: `scaleX(${k})` }], { duration: (c.s / speed) * 1000, easing: 'linear', fill: 'backwards' });
			});
			const tick = (t: number) => {
				const real = ((t - t0) / 1000) * speed;
				clock.textContent = `${Math.min(real, max).toFixed(real < 10 ? 2 : 1)} s`;
				systems.forEach((s, i) => { const c = s.cells[len]; if (c && !done.has(i) && real >= c.s) { done.add(i); els[i].val.textContent = c.label; } });
				if (real < max) raf = requestAnimationFrame(tick);
			};
			if (reduce) clock.textContent = '';
			else raf = requestAnimationFrame(tick);
		};
		const pick = (attr: string, set: (v: string) => void) => $$<HTMLButtonElement>(`[data-race-${attr}]`, race).forEach((b, _, all) => b.addEventListener('click', () => {
			all.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
			set(b.dataset[attr === 'len' ? 'raceLen' : 'raceSpeed']!);
			run();
		}));
		pick('len', (v) => (len = v));
		pick('speed', (v) => (speed = Number(v)));
		$('[data-race-replay]', race)?.addEventListener('click', run);
		show(race);
		$('[data-race-fallback]')?.setAttribute('hidden', '');
		race.addEventListener('reveal', run);
		if (reduce) run();
	}

	// Document length: a bar for each system that grows with the document and stops at the system's own limit.
	const lenBox = $('[data-length]');
	if (lenBox) {
		const systems: Sys[] = D.race.systems;
		const MAX = 33000;
		const input = $<HTMLInputElement>('input[type=range]', lenBox)!;
		const out = $('[data-length-out]', lenBox)!;
		const list = $('[data-length-rows]', lenBox)!;
		list.innerHTML = systems.map((s) => `<li class="len__row race__${s.cls}"><span class="race__name">${s.name}</span><span class="len__track"><span class="len__bar"></span><span class="len__over"></span><i class="len__lim" title="limit"></i></span><span class="len__state"></span></li>`).join('');
		const rows = $$('.len__row', list).map((r) => ({ r, bar: $('.len__bar', r)!, over: $('.len__over', r)!, lim: $('.len__lim', r)!, state: $('.len__state', r)! }));
		systems.forEach((s, i) => { rows[i].lim.style.left = `${(Math.min(s.limit, MAX) / MAX) * 100}%`; });
		const draw = () => {
			const t = Number(input.value);
			out.textContent = `${n0(t)} tokens`;
			systems.forEach((s, i) => {
				const ok = t <= s.limit;
				const c = ok ? s.cells[String(t)] : null;
				const row = rows[i];
				row.bar.style.transform = `scaleX(${Math.min(t, s.limit) / MAX})`;
				row.over.style.left = `${(Math.min(s.limit, MAX) / MAX) * 100}%`;
				row.over.style.width = ok ? '0%' : `${((t - s.limit) / MAX) * 100}%`;
				row.state.textContent = ok ? (c ? `answers, 50 questions in ${c.label}` : `accepts it, limit ${n0(s.limit)}`) : `stops at its limit, ${n0(s.limit)}`;
				row.r.classList.toggle('is-out', !ok);
			});
		};
		input.addEventListener('input', draw);
		draw();
		show(lenBox);
	}

	// Routing threshold: the measured sweep from example 5, one stop per measured threshold.
	const route = $('[data-route]');
	if (route) {
		const R = D.routing;
		const input = $<HTMLInputElement>('input[type=range]', route)!;
		const bar = $('[data-route-kept]', route)!;
		const out = $('[data-route-out]', route)!;
		const draw = () => {
			const x = R.sweep[Number(input.value)];
			bar.style.transform = `scaleX(${1 - x.share})`;
			out.textContent = `Keep answers at or above ${x.at}: ${n0(x.escalated)} of ${n0(R.questions)} questions escalated (${pc(x.share)}); ${pc(x.accuracy)} right on the rest; ${x.caught} of ${R.wrong} wrong answers escalated; ${x.confident} confidently wrong and kept.`;
		};
		input.addEventListener('input', draw);
		draw();
		show(route);
	}

	// JevBench grid: in alphabetical order with Jev last, or sorted by a column the reader picks; each cell shaded by its
	// value in the column, the Decisio rows one band.
	const grid = $('[data-grid]');
	if (grid) {
		const G = D.grid;
		const sel = $<HTMLSelectElement>('[data-grid-sort]', grid.parentElement!)!;
		sel.innerHTML = `<option value="-1">System, A to Z</option>${G.columns.map((c: any, k: number) => `<option value="${k}">${c.name}, ${c.tagline}</option>`).join('')}`;
		const draw = () => {
			const by = Number(sel.value);
			const rows = G.rows.map((r: any, i: number) => ({ r, i })).sort((a: any, b: any) => (by < 0 ? 0 : b.r.cells[by].v - a.r.cells[by].v) || a.i - b.i);
			grid.innerHTML = `<table class="data-table data-table--stack grid__t"><caption class="sr-only">${G.title}</caption><thead><tr><th scope="col">System</th>${G.columns.map((c: any) => `<th scope="col">${c.name}<small>${c.tagline}</small></th>`).join('')}</tr></thead><tbody>${rows.map(({ r }: any) => `<tr class="${r.ours ? 'is-ours' : r.jev ? 'is-jev' : ''}"><th scope="row">${r.label}</th>${r.cells.map((c: any, k: number) => `<td class="sh sh${c.shade}" data-label="${G.columns[k].name}"><span>${c.p}</span></td>`).join('')}</tr>`).join('')}</tbody></table>`;
		};
		sel.addEventListener('change', draw);
		draw();
		show(grid);
		show(sel.closest('label'));
		$('[data-grid-fallback]')?.setAttribute('hidden', '');
	}

	// Reel chapters: seek the one video.
	const video = $<HTMLVideoElement>('.reel__video');
	$$<HTMLButtonElement>('[data-chapter]').forEach((b) => {
		show(b);
		b.addEventListener('click', () => { if (!video) return; video.currentTime = Number(b.dataset.chapter); video.play().catch(() => {}); });
	});

	// Reel: no native controls over the poster's caption until the reel is played.
	const reelVideo = $<HTMLVideoElement>('.reel__video');
	const playBtn = $<HTMLButtonElement>('.reel__play');
	if (reelVideo && playBtn) {
		reelVideo.controls = false;
		show(playBtn);
		const start = () => { reelVideo.controls = true; playBtn.hidden = true; reelVideo.play().catch(() => {}); };
		playBtn.addEventListener('click', start);
		reelVideo.addEventListener('click', () => { if (!reelVideo.controls) start(); });
		$$<HTMLButtonElement>('[data-chapter]').forEach((b) => b.addEventListener('click', () => { if (!reelVideo.controls) { reelVideo.controls = true; playBtn.hidden = true; } }));
	}

	// Get started: one tabbed code block.
	const tabs = $('[data-tabs]');
	if (tabs) {
		const btns = $$<HTMLButtonElement>('.gs__tabs [role=tab]', tabs);
		const panels = $$('.gs__panel', tabs);
		btns.forEach((b, i) => b.addEventListener('click', () => {
			btns.forEach((o, k) => o.setAttribute('aria-selected', String(k === i)));
			panels.forEach((p, k) => p.classList.toggle('on', k === i));
		}));
		// One copy button on each box: it copies that panel's commands, without the "$" prompt.
		$$<HTMLButtonElement>('[data-copy-panel]', tabs).forEach((copy) => {
			show(copy);
			copy.addEventListener('click', () => {
				const text = $$('.gc-line', copy.parentElement!).map((l) => l.dataset.cmd ?? l.textContent ?? '').join('\n');
				navigator.clipboard?.writeText(text).then(() => { copy.textContent = 'copied'; setTimeout(() => (copy.textContent = 'copy'), 1500); });
			});
		});
	}

	// The closing band's install line.
	const ctaCopy = $<HTMLButtonElement>('[data-copy-cta]');
	ctaCopy?.addEventListener('click', () => navigator.clipboard?.writeText($('[data-cta-cmd]')?.textContent ?? '').then(() => { ctaCopy.textContent = 'copied'; setTimeout(() => (ctaCopy.textContent = 'copy'), 1500); }));
}
