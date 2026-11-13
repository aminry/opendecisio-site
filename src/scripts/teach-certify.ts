import { selectResult } from '../lib/certified-walkthrough.mjs';
import { scatter } from '../lib/tc-charts.mjs';
const $$ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) => [...root.querySelectorAll<T>(selector)];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const n = (x: number) => x.toLocaleString('en-US');
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const players: Array<{ finish: (announce?: boolean) => void }> = [];
let routeMotion: Animation | undefined;

// The teaching sequence loops automatically while visible. Labels never disappear.
for (const panel of $$<HTMLElement>('[data-loop]')) {
  const phases = $$<HTMLElement>('[data-phase]', panel);
  const pause = panel.querySelector<HTMLInputElement>('[data-loop-pause]')!;
  let position = 0, visible = false, timer: number | undefined, remaining = 2400, started = 0;
  const stop = () => {
    if (timer === undefined) return;
    clearTimeout(timer); timer = undefined;
    remaining = Math.max(0, remaining - (performance.now() - started));
  };
  const sync = () => {
    const running = visible && !document.hidden && !motion.matches && !pause.checked;
    if (!running) stop();
    panel.dataset.playback = motion.matches ? 'static' : running ? 'running' : 'paused';
    phases.forEach((phase, i) => phase.classList.toggle('is-current', !motion.matches && i === position));
    if (motion.matches) delete panel.dataset.position; else panel.dataset.position = String(position);
    if (running && timer === undefined) {
      started = performance.now();
      timer = window.setTimeout(() => {
        timer = undefined; remaining = 2400; position = (position + 1) % phases.length; sync();
      }, remaining);
    }
  };
  pause.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); sync(); }).observe(panel);
  sync();
}

// A finite sequence keeps its remaining time when paused. It never starts on scroll.
for (const panel of $$<HTMLElement>('[data-player]:not([data-loop])')) {
  const phases = $$<HTMLElement>('[data-phase]', panel);
  const play = panel.querySelector<HTMLButtonElement>('[data-play]')!;
  const pause = panel.querySelector<HTMLButtonElement>('[data-pause]')!;
  const output = panel.querySelector<HTMLElement>('[data-player-status]')!;
  let position = -1, timer: number | undefined, remaining = 2400, started = 0;
  let wanted = false, held = false, visible = false;
  const stop = () => { if (timer !== undefined) { clearTimeout(timer); timer = undefined; remaining = Math.max(0, remaining - (performance.now() - started)); } };
  const buttons = () => {
    const running = wanted && !held && visible && !document.hidden && !motion.matches;
    play.disabled = motion.matches || running;
    pause.disabled = !running;
    play.textContent = wanted ? running ? 'Playing' : 'Resume' : panel.dataset.playback === 'finished' ? 'Replay' : 'Play';
  };
  const highlight = () => {
    phases.forEach((phase, i) => { phase.classList.toggle('is-current', i === position); if (i === position) phase.setAttribute('aria-current', 'step'); else phase.removeAttribute('aria-current'); });
    if (position < 0) delete panel.dataset.position; else panel.dataset.position = String(position);
  };
  const finish = (announce = true) => {
    stop(); wanted = held = false; remaining = 2400; position = -1;
    panel.dataset.playback = 'finished'; highlight(); buttons();
    if (announce) output.textContent = 'Complete diagram shown. All steps remain available.';
  };
  const sync = () => {
    const running = wanted && !held && visible && !document.hidden && !motion.matches;
    if (running) {
      panel.dataset.playback = 'running';
      if (timer === undefined) {
        started = performance.now();
        timer = window.setTimeout(() => {
          timer = undefined; remaining = 2400; position++;
          if (position >= phases.length) finish(); else { highlight(); output.textContent = `${position + 1} of ${phases.length}. ${phases[position].querySelector('h3,strong')!.textContent}`; sync(); }
        }, remaining);
      }
    } else if (wanted) { stop(); panel.dataset.playback = 'paused'; }
    buttons();
  };
  play.addEventListener('click', () => {
    if (motion.matches) return;
    if (!wanted) { position = 0; remaining = 2400; highlight(); wanted = true; }
    held = false; output.textContent = `Playing ${phases.length} steps once.`; sync();
  });
  pause.addEventListener('click', () => { held = true; sync(); output.textContent = 'Paused. Resume to continue.'; });
  panel.querySelector('[data-step]')!.addEventListener('click', () => {
    const next = (position + 1) % phases.length; finish(false); position = next; highlight(); panel.dataset.playback = 'stepped';
    output.textContent = `${position + 1} of ${phases.length}. ${phases[position].querySelector('h3,strong')!.textContent}`; buttons();
  });
  panel.querySelector('[data-all]')!.addEventListener('click', () => finish());
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); sync(); }, { threshold: 0 }).observe(panel);
  motion.addEventListener('change', () => { if (motion.matches) finish(); buttons(); });
  players.push({ finish }); buttons();
}

// All labels, eligibility and whole-test totals are a view of the same immutable recording.
const root = document.querySelector<HTMLElement>('[data-ca]');
if (root) {
  const record = JSON.parse(root.dataset.record!);
  let alpha = '0.05', caseId = 'clear';
  const text = (selector: string, value: string) => $$(selector, root).forEach(el => { el.textContent = value; });
  const render = (animate = false) => {
    routeMotion?.cancel();
    const r = selectResult(record, alpha, caseId);
    root.dataset.target = alpha; root.dataset.eligible = String(r.eligible);
    for (const button of $$<HTMLButtonElement>('[data-target-select]', root)) button.setAttribute('aria-pressed', String(button.dataset.targetSelect === alpha));
    for (const button of $$<HTMLButtonElement>('[data-case]', root)) button.setAttribute('aria-pressed', String(button.dataset.case === caseId));
    text('[data-case-text]', r.example.text); text('[data-prediction]', r.example.answerName);
    text('[data-case-answer]', r.example.answer); text('[data-case-probability]', r.example.probability.toFixed(5));
    text('[data-cutoff]', r.threshold === null ? 'None at this target' : r.threshold.toFixed(6));
    text('[data-test-label]', r.example.labelName); text('[data-verdict]', r.example.answer === r.example.label ? 'Right in this test.' : 'Wrong in this test.');
    text('[data-certificate-state]', r.threshold === null ? 'No certificate at this target' : r.eligible ? 'Covered by this certificate' : 'Below the recorded cutoff');
    text('[data-destination]', r.eligible ? 'Route automatically' : 'Human review');
    text('[data-route-reason]', r.threshold === null ? ' The model still predicts; this policy reviews every answer.' : r.eligible ? ' This prediction reaches the recorded cutoff.' : ' Keep this prediction as a suggestion for a person.');
    for (const lane of $$<HTMLElement>('[data-lane]', root)) lane.classList.toggle('is-selected', lane.dataset.lane === (r.eligible ? 'route' : 'review'));
    text('[data-covered]', n(r.covered)); text('[data-review]', n(r.review));
    text('[data-share]', `${pct(r.covered / record.testN)} of the whole inbox`); text('[data-review-share]', `${pct(r.review / record.testN)} of the whole inbox`);
    text('[data-error-count]', r.covered ? `${n(r.errors)} of ${n(r.covered)}` : 'No certified predictions');
    text('[data-error-rate]', r.wrongRate === null ? 'Not applicable' : pct(r.wrongRate));
    text('[data-target-note]', r.threshold === null ? 'No certificate at this target in this recording. The model still predicts; the application reviews every answer.' : 'A certified prediction can still be wrong. The hatched part shows mistakes inside the certified population.');
    root.querySelector('[data-bar-certified]')!.setAttribute('width', String(1000 * r.covered / record.testN));
    root.querySelector('[data-bar-errors]')!.setAttribute('x', String(1000 * (r.covered - r.errors) / record.testN));
    root.querySelector('[data-bar-errors]')!.setAttribute('width', String(1000 * r.errors / record.testN));
    root.querySelector('[data-population-bar]')!.setAttribute('aria-label', `${n(r.covered)} certified, ${n(r.review)} for review; ${r.errors} certified predictions were wrong.`);
    if (animate && !motion.matches) routeMotion = root.querySelector('[data-route-marker]')!.animate([
      { opacity: 1, transform: 'translate(0px,0px)' },
      { opacity: 1, transform: 'translate(60px,0px)', offset: .4 },
      { opacity: 1, transform: `translate(60px,${r.eligible ? -25 : 25}px)`, offset: .65 },
      { opacity: 0, transform: `translate(135px,${r.eligible ? -25 : 25}px)` },
    ], { duration: 850, easing: 'ease-in-out' });
  };
  const change = () => { players.forEach(p => p.finish(false)); render(true); };
  for (const button of $$<HTMLButtonElement>('[data-target-select]', root)) button.addEventListener('click', () => { alpha = button.dataset.targetSelect!; change(); });
  for (const button of $$<HTMLButtonElement>('[data-case]', root)) button.addEventListener('click', () => { caseId = button.dataset.case!; change(); });
  motion.addEventListener('change', () => { if (motion.matches) routeMotion?.cancel(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) routeMotion?.cancel(); });
  root.querySelector<HTMLElement>('[data-static-targets]')!.hidden = true;
  render();
}
for (const control of $$<HTMLElement>('[data-enhance]')) control.hidden = false;

// Optional repeated-split evidence retains its recorded controls.
const rs = document.querySelector<HTMLElement>('[data-tc-resplit]');
if (rs) {
  const data = JSON.parse(rs.dataset.tcResplit!);
  const setups = $$<HTMLButtonElement>('[data-setup]', rs), alphas = $$<HTMLButtonElement>('[data-alpha]', rs);
  let setup = setups[0].dataset.setup!, alpha = '0.05';
  const draw = () => {
    const s = scatter({ splits: data[setup].by[alpha], alpha: Number(alpha), label: data[setup].label });
    rs.querySelector('[data-tc-scatter]')!.innerHTML = s.svg;
    for (const k of ['held', 'over', 'nothing'] as const) rs.querySelector(`[data-count="${k}"]`)!.textContent = String(s[k]);
  };
  setups.forEach(b => b.addEventListener('click', () => { setup = b.dataset.setup!; setups.forEach(o => o.setAttribute('aria-pressed', String(o === b))); draw(); }));
  alphas.forEach(b => b.addEventListener('click', () => { alpha = b.dataset.alpha!; alphas.forEach(o => o.setAttribute('aria-pressed', String(o === b))); draw(); }));
}
// Existing deep links reveal their evidence without changing the canonical route.
const revealHash = () => {
  let target: HTMLElement | null;
  try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
  if (target instanceof HTMLDetailsElement) target.open = true;
  for (let node = target?.parentElement; node; node = node.parentElement) if (node instanceof HTMLDetailsElement) node.open = true;
};
revealHash(); window.addEventListener('hashchange', revealHash);
