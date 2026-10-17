// The teach-and-certify page (src/pages/demos/teach-and-certify.astro): its chips. The inbox moves each message to the
// lane its confidence earns at the target picked, eight messages at a time; the re-splits and the drift chart redraw
// from the records the page carries, with the same drawing code as the build (src/lib/tc-charts.mjs). A moved message
// slides to its new place (only transforms set through the CSSOM, as the CSP requires); under reduced motion it moves
// at once. Without scripts the page keeps its first view.
import { driftChart, pc, scatter } from '../lib/tc-charts.mjs';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends Element>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const n = (x: number) => x.toLocaleString('en-US');
const press = (buttons: HTMLButtonElement[], on: HTMLButtonElement) => buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === on)));

// --- The inbox ------------------------------------------------------------------------------------------------------------
const inbox = document.querySelector<HTMLElement>('[data-tc-inbox]');
if (inbox) {
	const { targets, batches } = JSON.parse(inbox.dataset.tcInbox!) as { targets: Record<string, { threshold: number | null; covered: number; errors: number; cal_certified: number }>; batches: number };
	const lanes = { auto: inbox.querySelector<HTMLOListElement>('[data-lane="auto"]')!, person: inbox.querySelector<HTMLOListElement>('[data-lane="person"]')! };
	const msgs = $$<HTMLLIElement>('.tc-msg', inbox).sort((a, b) => Number(a.dataset.i) - Number(b.dataset.i));
	const alphas = $$<HTMLButtonElement>('[data-alpha]', inbox);
	const next = inbox.querySelector<HTMLButtonElement>('[data-tc-next]')!;
	const total = (k: string) => inbox.querySelector<HTMLElement>(`[data-total="${k}"]`)!;
	const testN = Number(inbox.querySelector('dt')!.textContent!.replace(/\D/g, ''));
	let alpha = alphas.find((b) => b.getAttribute('aria-pressed') === 'true')!.dataset.alpha!;
	let batch = 0;

	const place = (animate: boolean) => {
		const t = targets[alpha];
		const before = new Map(msgs.map((m) => [m, m.getBoundingClientRect()]));
		for (const m of msgs) {
			const inBatch = Math.floor(Number(m.dataset.i) / 8) === batch;
			m.hidden = !inBatch;
			const lane = t.threshold !== null && Number(m.dataset.conf) >= t.threshold ? lanes.auto : lanes.person;
			lane.append(m);
		}
		// Most confident first in each lane, as a queue would show them.
		for (const lane of Object.values(lanes)) $$<HTMLLIElement>('.tc-msg', lane).sort((a, b) => Number(b.dataset.conf) - Number(a.dataset.conf)).forEach((m) => lane.append(m));
		for (const [k, lane] of Object.entries(lanes)) inbox.querySelector<HTMLElement>(`[data-lane-n="${k}"]`)!.textContent = String($$('.tc-msg:not([hidden])', lane).length);
		if (animate && !reduce) {
			for (const m of msgs) {
				if (m.hidden) continue;
				const a = before.get(m)!, b = m.getBoundingClientRect();
				if (!a.width) continue;
				const dx = a.left - b.left, dy = a.top - b.top;
				if (!dx && !dy) continue;
				m.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
			}
		}
		total('covered').textContent = n(t.covered);
		total('share').textContent = `${pc(t.covered / testN)} of the inbox`;
		total('errors').textContent = n(t.errors);
		total('rate').textContent = t.covered ? `${pc(t.errors / t.covered)} of them` : 'nothing was sent';
		total('threshold').textContent = t.threshold === null ? 'none' : t.threshold.toFixed(4);
		total('why').textContent = t.threshold === null ? 'no threshold keeps the held-out mistakes under the target' : 'certified at or above it';
	};
	alphas.forEach((b) => b.addEventListener('click', () => { alpha = b.dataset.alpha!; press(alphas, b); place(true); }));
	next.hidden = false;
	next.addEventListener('click', () => { batch = (batch + 1) % batches; place(false); });
	place(false);
}

// --- The re-splits --------------------------------------------------------------------------------------------------------
const rs = document.querySelector<HTMLElement>('[data-tc-resplit]');
if (rs) {
	const data = JSON.parse(rs.dataset.tcResplit!) as Record<string, { label: string; by: Record<string, [number, number | null][]> }>;
	const setups = $$<HTMLButtonElement>('[data-setup]', rs);
	const alphas = $$<HTMLButtonElement>('[data-alpha]', rs);
	let setup = setups[0].dataset.setup!;
	let alpha = alphas.find((b) => b.getAttribute('aria-pressed') === 'true')!.dataset.alpha!;
	const draw = () => {
		const s = scatter({ splits: data[setup].by[alpha], alpha: Number(alpha), label: data[setup].label });
		rs.querySelector('[data-tc-scatter]')!.innerHTML = s.svg;
		for (const k of ['held', 'over', 'nothing'] as const) rs.querySelector(`[data-count="${k}"]`)!.textContent = String(s[k]);
	};
	setups.forEach((b) => b.addEventListener('click', () => { setup = b.dataset.setup!; press(setups, b); draw(); }));
	alphas.forEach((b) => b.addEventListener('click', () => { alpha = b.dataset.alpha!; press(alphas, b); draw(); }));
}

// --- The drift replay -----------------------------------------------------------------------------------------------------
const dr = document.querySelector<HTMLElement>('[data-tc-drift]');
if (dr) {
	const data = JSON.parse(dr.dataset.tcDrift!) as Record<string, Parameters<typeof driftChart>[0] & { label: string; threshold: number; certified_share: number; wrong_before: number; wrong_after: number }>;
	const bases = $$<HTMLButtonElement>('[data-base]', dr);
	bases.forEach((b) => b.addEventListener('click', () => {
		press(bases, b);
		const x = data[b.dataset.base!];
		dr.querySelector('[data-tc-driftchart]')!.innerHTML = driftChart(x, x.label);
		dr.querySelector('[data-drift="threshold"]')!.textContent = x.threshold.toFixed(2);
		dr.querySelector('[data-drift="share"]')!.textContent = `${pc(x.certified_share)} of the stream certified`;
		dr.querySelector('[data-drift="before"]')!.textContent = n(x.wrong_before);
		dr.querySelector('[data-drift="after"]')!.textContent = n(x.wrong_after);
	}));
}
