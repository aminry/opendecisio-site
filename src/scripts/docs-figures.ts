// Figures render their complete useful state first. Enhance them with explicit finite playback,
// field selection and illustrative controls; respect motion preferences and page visibility.
import './fast-path.ts';
import { weightedScore, manualAction } from '../lib/figure-math.mjs';
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

// Playback starts only on request, runs once, and holds whenever it cannot be seen.
const motion = matchMedia('(prefers-reduced-motion: reduce)');
for (const fig of $$('.fig[data-live]')) {
	const play = fig.querySelector<HTMLButtonElement>('[data-fig-play]')!;
	const pause = fig.querySelector<HTMLButtonElement>('[data-fig-pause]')!;
	const step = fig.querySelector<HTMLButtonElement>('[data-fig-step]')!;
	const all = fig.querySelector<HTMLButtonElement>('[data-fig-all]')!;
	const out = fig.querySelector<HTMLElement>('[data-fig-status]')!;
	const steps: string[] = JSON.parse(fig.dataset.figSteps ?? '[]');
	const duration = Number(fig.dataset.live) * 1000;
	let timer: number | undefined;
	let started = 0;
	let left = duration;
	let wanted = false;
	let held = false;
	let visible = false;
	let position = -1;
	fig.dataset.playback = 'idle';
	step.disabled = all.disabled = false;
	const stop = () => {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
			left = Math.max(0, left - (performance.now() - started));
		}
	};
	const buttons = () => {
		const running = wanted && !held && visible && !document.hidden && !motion.matches;
		play.disabled = motion.matches || running;
		pause.disabled = !running;
		play.textContent = wanted ? 'Resume' : fig.dataset.playback === 'finished' ? 'Replay' : 'Play';
	};
	const finish = (announce = true) => {
		stop();
		wanted = held = false;
		left = duration;
		position = -1;
		fig.classList.remove('is-run', 'is-paused');
		delete fig.dataset.step;
		for (const phase of $$('[data-phase]', fig)) phase.classList.remove('is-current');
		fig.dataset.playback = 'finished';
		if (announce) out.textContent = 'Complete diagram shown.';
		buttons();
	};
	const sync = () => {
		if (wanted && !held && visible && !document.hidden && !motion.matches) {
			fig.classList.remove('is-paused');
			if (timer === undefined) {
				started = performance.now();
				timer = window.setTimeout(() => finish(), left);
			}
			fig.dataset.playback = 'running';
		} else if (wanted) {
			stop();
			fig.classList.add('is-paused');
			fig.dataset.playback = 'paused';
		}
		buttons();
	};
	play.addEventListener('click', () => {
		if (motion.matches) return;
		if (!wanted) {
			finish(false);
			fig.classList.remove('is-run');
			void fig.offsetWidth;
			fig.classList.add('is-run');
			wanted = true;
		}
		held = false;
		out.textContent = 'Playing the request sequence once.';
		sync();
	});
	pause.addEventListener('click', () => {
		held = true;
		out.textContent = 'Paused. Resume to continue.';
		sync();
	});
	step.addEventListener('click', () => {
		const next = (position + 1) % steps.length;
		finish(false);
		position = next;
		fig.dataset.step = String(position);
		fig.dataset.playback = 'stepped';
		for (const phase of $$('[data-phase]', fig)) phase.classList.toggle('is-current', phase.dataset.phase === String(position));
		out.textContent = `${position + 1} of ${steps.length}. ${steps[position]}`;
	});
	all.addEventListener('click', () => finish());
	motion.addEventListener('change', () => { if (motion.matches) finish(); buttons(); });
	document.addEventListener('visibilitychange', sync);
	new IntersectionObserver((entries) => {
		visible = entries.some((entry) => entry.isIntersecting);
		sync();
	}, { threshold: 0.2 }).observe(fig);
	buttons();
}

// A short field chooser works with click, touch and ordinary keyboard buttons.
for (const fig of $$('.fig').filter((item) => item.querySelector('[data-field-select]'))) {
	const controls = $$<HTMLButtonElement>('[data-field-select]', fig);
	const out = fig.querySelector<HTMLElement>('[data-field-note]')!;
	for (const control of controls) {
		control.disabled = false;
		control.addEventListener('click', () => {
			const field = control.dataset.fieldSelect;
			for (const other of controls) other.setAttribute('aria-pressed', String(other === control));
			for (const line of $$('[data-field]', fig)) line.classList.toggle('on', line.dataset.field === field);
			out.textContent = fig.querySelector<HTMLElement>(`[data-field-explain="${field}"]`)?.textContent ?? '';
		});
	}
}

// Illustrative distributions and manual policies do not call a model or fit a certificate.
for (const fig of $$('.fig--score-distribution')) {
	const input = fig.querySelector<HTMLInputElement>('[data-score-input]')!;
	const presets = JSON.parse(fig.querySelector<HTMLElement>('[data-score]')!.dataset.presets!);
	const output = fig.querySelector<HTMLElement>('[data-score-out]')!;
	input.disabled = false;
	input.addEventListener('input', () => {
		const { name, probabilities: values } = presets[Number(input.value)];
		const mean = weightedScore(values);
		const top = Math.max(...values);
		const label = `Mean level ${mean.toFixed(2)}. The likeliest level is ${values.indexOf(top)}, with probability ${top.toFixed(2)}.`;
		output.textContent = label;
		input.setAttribute('aria-valuetext', `${name} distribution, mean level ${mean.toFixed(2)}`);
		fig.querySelector('[data-score-marker]')!.setAttribute('d', `M${20 + mean / (values.length - 1) * 560} 6l-7 12h14z`);
		for (const node of $$('[data-score-prob]', fig)) {
			const p = values[Number(node.dataset.scoreProb)];
			node.textContent = p.toFixed(2);
			node.parentElement!.querySelector('.f-bar')!.setAttribute('width', String(p * 100));
		}
		fig.querySelector('[data-score-arithmetic]')!.textContent = `${values.map((p: number, i: number) => `${i} × ${p.toFixed(2)}`).join(' + ')} = ${mean.toFixed(2)}`;
	});
}
for (const fig of $$('.fig--manual-threshold')) {
	const input = fig.querySelector<HTMLInputElement>('[data-threshold-input]')!;
	const cases = JSON.parse(fig.querySelector<HTMLElement>('[data-manual-policy]')!.dataset.cases!);
	input.disabled = false;
	input.addEventListener('input', () => {
		const line = Number(input.value);
		let accepted = 0;
		for (const [i, item] of cases.entries()) {
			const act = manualAction(item.probability, line) === 'act';
			if (act) accepted++;
			fig.querySelector(`[data-policy-result="${i}"]`)!.textContent = act ? 'Act' : 'Review';
		}
		input.setAttribute('aria-valuetext', line.toFixed(2));
		fig.querySelector('[data-threshold-value]')!.textContent = line.toFixed(2);
		fig.querySelector('[data-threshold-out]')!.textContent = `${accepted} act, ${cases.length - accepted} review at a manual threshold of ${line.toFixed(2)}.`;
		for (const marker of $$<SVGElement>('[data-threshold-line]', fig)) marker.setAttribute('d', `M${line * 100} 0V16`);
	});
}

// Inspect recorded drift events; the frame data contains only the measured stream's events.
for (const fig of $$('.fig--drift-replay')) {
	const frames = JSON.parse(fig.querySelector<HTMLElement>('[data-drift]')!.dataset.frames!);
	const controls = $$<HTMLButtonElement>('[data-drift-select]', fig);
	for (const control of controls) {
		control.disabled = false;
		control.addEventListener('click', () => {
			const frame = frames.find((item: { key: string }) => item.key === control.dataset.driftSelect);
			for (const other of controls) other.setAttribute('aria-pressed', String(other === control));
			for (const event of $$('[data-drift-event]', fig)) {
				if (event.dataset.driftEvent === frame.key) event.setAttribute('aria-current', 'step');
				else event.removeAttribute('aria-current');
			}
			fig.querySelector('[data-drift-cursor]')!.setAttribute('d', `M${frame.x} 20V186`);
			fig.querySelector('[data-drift-out]')!.textContent = frame.note;
		});
	}
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
	input.disabled = false;
	input.addEventListener('input', draw);
}
