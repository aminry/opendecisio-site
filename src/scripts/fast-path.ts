// Automatic illustrations pause off screen and respect reduced motion.
import '../styles/fast-path.css';
import '../styles/decision-visuals.css';
import { autoStream, contextExample } from '../lib/fast-path-demo.mjs';
const motion = matchMedia('(prefers-reduced-motion: reduce)');
function loop(scene: HTMLElement, durations: number[], render: (step: number) => void) {
  let step=0,visible=false,timer:number|undefined,remaining=durations[0],started=0;
  const sync=()=>{
    const running=visible&&!document.hidden&&!motion.matches;
    if(!running&&timer!==undefined){clearTimeout(timer);timer=undefined;remaining=Math.max(0,remaining-(performance.now()-started));}
    scene.dataset.playback=motion.matches?'static':running?'running':'paused';
    render(motion.matches?0:step);
    if(running&&timer===undefined){started=performance.now();timer=window.setTimeout(()=>{timer=undefined;step++;remaining=durations[step%durations.length];sync();},remaining);}
  };
  document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);
  new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);sync();}).observe(scene);
  sync();
}
for(const scene of document.querySelectorAll<HTMLElement>('[data-fast-loop]:not([data-fast-timing]):not([data-fast-context])')) {
  const phases=[...scene.querySelectorAll<HTMLElement>('[data-fast-phase]')];
  loop(scene,[2400],step=>phases.forEach((el,i)=>el.classList.toggle('is-current',!motion.matches&&i===step%phases.length)));
}
for(const scene of document.querySelectorAll<HTMLElement>('[data-fast-timing]')) loop(scene,[4000],()=>{});
for(const scene of document.querySelectorAll<HTMLElement>('[data-fast-context]')) {
  loop(scene,[5000],step=>{
    const v=contextExample(step);scene.dataset.exampleParity=String(step%2);
    scene.querySelector('[data-context-number]')!.textContent=`New order ${v.number} / 3`;
    scene.querySelector('[data-context-facts]')!.textContent=v.facts;
  });
}
for(const scene of document.querySelectorAll<HTMLElement>('[data-fast-stream]')) {
  const get=(s:string)=>scene.querySelector<HTMLElement>(s)!;
  loop(scene,[900,900,4200],step=>{
    const index=Math.floor(step/3),phase=motion.matches?2:step%3,v=autoStream(index,phase);
    scene.dataset.phase=String(phase);scene.dataset.route=v.route;scene.dataset.exampleParity=String(index%2);scene.dataset.example=String(v.number);
    get('[data-stream-counter]').textContent=`New example ${String(v.number).padStart(2,'0')} / ${v.total}`;
    get('[data-stream-task]').textContent=v.label;
    get('[data-stream-message]').textContent=v.text;
    get('[data-stream-stage]').textContent=v.stage;
    get('[data-stream-saving]').textContent=v.route==='table'?'~50 ms model read skipped':'~50.05 ms CPU + model budget for this fallback';
    get('[data-stream-answer]').textContent=v.route==='table'?(v.completed?v.answer:'Checking…'):'Passed on';
    get('[data-stream-model]').textContent=v.route==='table'?'Read avoided':v.completed?'Ask decisio':'Waiting…';
    get('[data-stream-fast-note]').textContent=v.route==='table'?'Answer ready. Model read skipped.':'CPU check adds ~0.05 ms.';
    get('[data-stream-model-note]').textContent=v.route==='table'?'No model read for this request':'Model reads policy + facts';
    scene.querySelectorAll<HTMLElement>('[data-stream-domain]').forEach(el=>el.classList.toggle('is-current',el.dataset.streamDomain===v.domain));
    scene.querySelectorAll<HTMLElement>('[data-stream-row]').forEach((row,i)=>{
      const c=v.examples[i];row.dataset.route=c.route;
      row.querySelector('[data-row-text]')!.textContent=c.text;row.querySelector('[data-row-answer]')!.textContent=c.answer;
      row.querySelector('[data-row-route]')!.textContent=c.route==='table'?'CPU fast path':'decisio';
    });
  });
}
