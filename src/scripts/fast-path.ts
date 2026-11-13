// Only the decision fast path's explanatory scenes loop; other docs figures keep their controls.
import '../styles/fast-path.css';
import { contextView, timingView, FACTS } from '../lib/fast-path-demo.mjs';
const motion = matchMedia('(prefers-reduced-motion: reduce)');
for (const scene of document.querySelectorAll<HTMLElement>('[data-fast-loop]:not([data-fast-timing])')) {
  const phases = [...scene.querySelectorAll<HTMLElement>('[data-fast-phase]')];
  let position = 0, visible = false, timer: number | undefined, remaining = 2400, started = 0;
  const stop = () => {
    if (timer === undefined) return;
    clearTimeout(timer); timer = undefined;
    remaining = Math.max(0, remaining - (performance.now() - started));
  };
  const sync = () => {
    const running = visible && !document.hidden && !motion.matches;
    if (!running) stop();
    scene.dataset.playback = motion.matches ? 'static' : running ? 'running' : 'paused';
    phases.forEach((phase, i) => phase.classList.toggle('is-current', !motion.matches && position === i));
    if (running && timer === undefined) {
      started = performance.now();
      timer = window.setTimeout(() => {
        timer = undefined; remaining = 2400; position = (position + 1) % phases.length; sync();
      }, remaining);
    }
  };
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); }).observe(scene);
  sync();
}

// A common clock and scale make the early finish visible, including the fallback cost.
for (const scene of document.querySelectorAll<HTMLElement>('[data-fast-timing]')) {
  const share = scene.querySelector<HTMLInputElement>('#fp-share')!;
  const get = <T extends Element = HTMLElement>(selector: string) => scene.querySelector<T>(selector)!;
  let mode = 'fast', visible = false, animations: Animation[] = [];
  const sync = () => {
    const running = visible && !document.hidden && !motion.matches;
    scene.dataset.playback = motion.matches ? 'static' : running ? 'running' : 'paused';
    for (const animation of animations) running ? animation.play() : animation.pause();
  };
  const render = () => {
    const v = timingView(mode, Number(share.value));
    scene.dataset.scenario = mode;
    scene.dataset.fastShare = String(v.fastShare);
    get('[data-share-label]').textContent = `${v.fastShare}%`;
    get('[data-timing-total]').textContent = `~${v.displayMs} ms`;
    get('[data-timing-summary]').textContent = mode === 'average' ? `${Math.abs(v.savingPercent)}% ${v.savingPercent<0?'more':'less'} processing time in this example`
      : mode === 'fast' ? '~50 µs of CPU work. No model read.' : 'Fallback adds ~0.05 ms before the model.';
    get('[data-timing-explanation]').textContent = mode === 'average'
      ? `Assume ${v.fastShare}% of requests skip the model. Every request pays ${v.cpuMs} ms on the CPU; ${100-v.fastShare}% also pay the ${v.modelMs} ms model budget: about ${v.displayMs} ms mean processing time. This is an estimate, not a measured result.`
      : mode === 'fast' ? 'The static backend needs no neural-network run on the CPU. An eligible short-text answer uses about 0.05 ms of embedding and classification work; the model read is skipped.'
      : 'The static check costs about 0.05 ms, then decisio handles the request. With a 50 ms model budget, the total is about 50.05 ms. The CPU check adds little to a fallback.';
    get('[data-flow-request]').textContent = mode === 'average' ? 'An example workload of recurring support requests'
      : mode === 'fast' ? '“I was charged twice. Can you help?”' : '“My new team cannot open last month’s invoice.”';
    get('[data-flow-fast]').textContent = mode === 'average' ? `${v.fastShare}% skip the model` : mode === 'fast' ? 'billing' : 'Pass this request on';
    get('[data-flow-model]').textContent = mode === 'average' ? `${100-v.fastShare}% need decisio` : mode === 'fast' ? 'Model idle for this request' : 'Model reads policy + facts';
    get('[data-timing-cpu]').setAttribute('width', String(v.cpuWidth));
    get('[data-timing-model]').setAttribute('width', String(v.modelWidth));
    scene.querySelectorAll<HTMLButtonElement>('[data-timing-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.timingMode === mode)));
    animations.forEach(animation => animation.cancel());
    animations = [];
    for (const [name, ms, width] of [['baseline', v.modelMs, v.baselineWidth], ['fast', v.totalMs, v.totalWidth]] as const) {
      const marker = get<SVGCircleElement>(`[data-timing-marker="${name}"]`);
      marker.setAttribute('cx', String(4+width));
      if (!motion.matches) {
        marker.setAttribute('cx','4');
        const end = `translateX(${width}px)`;
        animations.push(marker.animate([{transform:'translateX(0)',offset:0}, {transform:end,offset:0.85*ms/v.scaleMs}, {transform:end,offset:1}], {duration:4000,iterations:Infinity,easing:'linear'}));
      }
      const ready = get(`[data-timing-ready="${name}"]`);
      if (!motion.matches) {
        const finish=0.85*ms/v.scaleMs;
        animations.push(ready.animate([{opacity:0,offset:0},{opacity:0,offset:Math.max(0,finish-0.0001)},{opacity:1,offset:finish},{opacity:1,offset:1}],{duration:4000,iterations:Infinity}));
      }
    }
    sync();
  };
  scene.querySelectorAll<HTMLButtonElement>('[data-timing-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.timingMode!; render(); }));
  share.addEventListener('input', () => { mode = 'average'; render(); });
  scene.querySelectorAll<HTMLElement>('[data-fp-controls]').forEach(control => { control.hidden = false; });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', render);
  new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); }).observe(scene);
  render();
}

for (const scene of document.querySelectorAll<HTMLElement>('[data-fast-context]')) {
  const get = (selector: string) => scene.querySelector<HTMLElement>(selector)!;
  const editor = scene.querySelector<HTMLTextAreaElement>('textarea')!;
  let mode = 'context';
  const render = () => {
    const v = contextView(mode, editor.value);
    get('[data-cpu-input]').textContent = v.cpuText;
    get('[data-model-input]').textContent = v.modelText;
    get('[data-cpu-count]').textContent = `${v.cpuCharacters} characters`;
    get('[data-cpu-note]').textContent = mode === 'context' ? 'Only the changing facts enter the classifier.' : 'The classifier re-reads the policy with every request.';
    get('[data-context-location]').textContent = mode === 'context' ? 'Registered once as task context.' : 'Repeated in state with every request.';
    get('[data-context-flow]').textContent = mode === 'context' ? 'Policy stored once + new facts per request' : 'Policy and facts sent together in every state';
    get('[data-context-summary]').textContent = mode === 'context' ? 'The CPU reads fewer characters. The model still has the full policy.' : 'The CPU reads the policy too. The model receives the same information.';
    scene.querySelectorAll<HTMLButtonElement>('[data-context-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.contextMode === mode)));
  };
  scene.querySelectorAll<HTMLButtonElement>('[data-context-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.contextMode!; render(); }));
  scene.querySelectorAll<HTMLButtonElement>('[data-facts]').forEach(button => button.addEventListener('click', () => { editor.value = FACTS[button.dataset.facts as keyof typeof FACTS]; render(); }));
  editor.addEventListener('input', render);
  scene.querySelectorAll<HTMLElement>('[data-fp-controls]').forEach(control => { control.hidden = false; });
  render();
}
