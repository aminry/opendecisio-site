// Only the decision fast path's explanatory scenes loop; other docs figures keep their controls.
import '../styles/fast-path.css';
const motion = matchMedia('(prefers-reduced-motion: reduce)');
for (const scene of document.querySelectorAll<HTMLElement>('[data-fast-loop]')) {
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
