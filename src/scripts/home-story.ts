// The explanatory clock is separate from model timings. One visible scene plays at a time.
import {autoStream} from '../lib/fast-path-demo.mjs';
const motion=matchMedia('(prefers-reduced-motion:reduce)');
type Scene={el:HTMLElement;step:number;remaining:number;started:number;timer?:number;rendered?:string;durations:number[]};
const scenes:Scene[]=[...document.querySelectorAll<HTMLElement>('[data-motion-scene]')].map(el=>({el,step:0,remaining:el.hasAttribute('data-home-cert')?5000:900,started:0,durations:el.hasAttribute('data-home-cert')?[5000,5000,6000]:[900,900,4200]}));
const text=(el:HTMLElement,key:string,value:string)=>{el.querySelector<HTMLElement>(`[data-${key}]`)!.textContent=value;};
function render(s:Scene){
 const key=motion.matches?'static':String(s.step);if(s.rendered===key)return;s.rendered=key;
 const phase=motion.matches?2:s.step%3,index=motion.matches?0:Math.floor(s.step/3),el=s.el;
 el.dataset.phase=String(phase);el.dataset.parity=String(index%2);el.dataset.step=String(s.step);
 if(el.hasAttribute('data-home-core')){
  const items=JSON.parse(el.dataset.records!),v=items[index%items.length];
  text(el,'core-counter',`Support ticket ${index%items.length+1} / ${items.length}`);text(el,'core-text',v.text);text(el,'core-question',v.question);
  text(el,'core-options',`${v.options.slice(0,3).join(' · ')} · +${v.options.length-3}`);text(el,'core-answer',phase===2?v.answer:'Checking…');
  text(el,'core-probability',phase===2?v.probability.toFixed(3):'…');
 }else if(el.hasAttribute('data-home-cert')){
  const items=JSON.parse(el.dataset.records!),v=items[index%items.length];
  text(el,'cert-counter',`Selected case ${index%items.length+1} / ${items.length}`);text(el,'cert-text',v.text);text(el,'cert-answer',v.answerName);
  el.querySelectorAll<HTMLElement>('[data-teach-stage]').forEach((node,i)=>node.classList.toggle('is-current',!motion.matches&&phase===i));
  el.querySelectorAll<HTMLElement>('[data-cert-route]').forEach(node=>node.classList.toggle('dv-selected',phase===2&&node.dataset.certRoute===(v.eligible?'auto':'review')));
  el.querySelector('[data-cert-path]')!.setAttribute('d',v.eligible?'M250 0v20Q250 30 230 30H145Q125 30 125 50v6':'M250 0v20Q250 30 270 30H355Q375 30 375 50v6');
  text(el,'cert-status',phase===0?'Teach categories from labelled examples.':phase===1?'Check the target on separate held-back examples.':v.eligible?'Correctness certificate qualifies. Your backend can route.':'Below the recorded cutoff. Your backend requests review.');
  text(el,'cert-truth',v.answer===v.label?'this test prediction was right.':'this prediction was wrong, despite qualifying.');
 }else{
  // All four cases belong to the support task whose context stays fixed above the facts.
  const v=autoStream(index%4,phase);el.dataset.route=v.route;
  text(el,'fast-counter',`New facts ${index%4+1} / 4`);text(el,'fast-text',v.text);
  text(el,'fast-answer',v.route==='table'?(phase===2?v.answer:'Checking…'):'Passed on');text(el,'fast-model',v.route==='table'?'Read avoided':phase===2?'Ask decisio':'Waiting…');
  el.querySelectorAll<HTMLElement>('[data-fast-route]').forEach(node=>node.classList.toggle('dv-selected',phase===2&&node.dataset.fastRoute===v.route));
  el.querySelector('[data-fast-path-line]')!.setAttribute('d',v.route==='table'?'M250 0C250 30 125 20 125 56':'M250 0C250 30 375 20 375 56');
  text(el,'fast-status',phase!==2?'Checking whether this request can use the fast path.':v.route==='table'?'Model read skipped for this request.':'CPU check + model budget: about 50.05 ms in this example.');
 }
}
function sync(){
 let active:Scene|undefined,closest=Infinity;
 if(!document.hidden&&!motion.matches)for(const s of scenes){const r=s.el.getBoundingClientRect();if(r.bottom>80&&r.top<innerHeight){const distance=Math.abs((r.top+r.bottom)/2-innerHeight/2);if(distance<closest){closest=distance;active=s;}}}
 for(const s of scenes){
  const running=s===active;
  if(!running&&s.timer!==undefined){clearTimeout(s.timer);s.timer=undefined;s.remaining=Math.max(0,s.remaining-(performance.now()-s.started));}
  s.el.dataset.playback=motion.matches?'static':running?'running':'paused';render(s);
  if(running&&s.timer===undefined){s.started=performance.now();s.timer=window.setTimeout(()=>{s.timer=undefined;s.step++;s.remaining=s.durations[s.step%3];sync();},s.remaining);}
 }
}
let queued=false;
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});}
new IntersectionObserver(queue,{threshold:[0,.25,.5,.75,1]}).observe(document.querySelector('.hp-hero')!);
for(const s of scenes)new IntersectionObserver(queue,{threshold:[0,.25,.5,.75,1]}).observe(s.el);
addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);sync();

for(const tabs of document.querySelectorAll<HTMLElement>('[data-tabs]')){
 const buttons=[...tabs.querySelectorAll<HTMLButtonElement>('[role=tab]')],panels=[...tabs.querySelectorAll<HTMLElement>('[role=tabpanel]')];
 const select=(i:number)=>{buttons.forEach((b,k)=>{b.setAttribute('aria-selected',String(i===k));b.tabIndex=i===k?0:-1;});panels.forEach((p,k)=>p.classList.toggle('on',i===k));};
 buttons.forEach((b,i)=>{b.addEventListener('click',()=>select(i));b.addEventListener('keydown',e=>{let next=i;if(e.key==='ArrowRight')next=(i+1)%buttons.length;else if(e.key==='ArrowLeft')next=(i+buttons.length-1)%buttons.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=buttons.length-1;else return;e.preventDefault();select(next);buttons[next].focus();});});
}
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-copy-box]')){
 button.hidden=false;button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(button.parentElement!.dataset.copyText!);button.textContent='Copied';}catch{button.textContent='Copy failed';}setTimeout(()=>button.textContent='Copy',1500);});
}
