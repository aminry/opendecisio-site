import examples from '../data/fast-path-examples.json' with {type:'json'};
// Shared by the build, browser and film: an illustration, never a benchmark replay.
import timing from '../data/fast-path-timing.json' with {type: 'json'};
export const STATIC_TIMING = Object.freeze(timing);
export const POLICY = 'Apply the refund window for the product category. Use the item’s condition and delivery age; send policy exceptions for review.';
export const FACTS = {
  a: 'Delivered 12 days ago.\nUnopened.\nCategory: home.',
  b: 'Delivered 45 days ago.\nOpened.\nCategory: home.',
};

export function contextView(mode, facts) {
  if (!['inline', 'context'].includes(mode)) throw new Error('Unknown context view');
  const modelText = `${POLICY}\n\n${facts}`;
  const cpuText = mode === 'context' ? facts : modelText;
  return { cpuText, cpuCharacters: [...cpuText].length, modelText,
    registeredContext: mode === 'context' ? POLICY : null };
}

export function timingView(mode, fastShare = STATIC_TIMING.fastShare) {
  if (!['average', 'fast', 'fallback'].includes(mode)) throw new Error('Unknown timing view');
  if (!Number.isFinite(fastShare) || fastShare < 0 || fastShare > 100) throw new Error('Invalid fast-path share');
  const {cpuMs, modelMs} = STATIC_TIMING;
  const modelContributionMs = modelMs * (mode === 'average' ? 1-fastShare/100 : mode === 'fallback' ? 1 : 0);
  const totalMs = cpuMs + modelContributionMs, scaleMs = cpuMs + modelMs;
  return { cpuMs, modelMs, modelContributionMs, totalMs, scaleMs, fastShare,
    displayMs: Number(totalMs.toFixed(2)).toString(),
    savingPercent: Number((100 * (1 - totalMs / modelMs)).toFixed(1)),
    cpuWidth: 592 * cpuMs / scaleMs,
    modelWidth: 592 * modelContributionMs / scaleMs,
    totalWidth: 592 * totalMs / scaleMs,
    baselineWidth: 592 * modelMs / scaleMs };
}

export const STREAMS = examples;
export function streamView(domain, index, phase) {
  if (!Object.hasOwn(STREAMS,domain) || !Number.isInteger(index) || index<0 || ![0,1,2].includes(phase)) throw new Error('Unknown example stream state');
  const task=STREAMS[domain], position=index%task.cases.length, current=task.cases[position];
  return {...current,label:task.label,question:task.question,context:task.context,
    position,completed:phase===2,
    stage:phase===0?'New request':phase===1?'CPU fast path reads it':current.route==='table'?'Answer returned. Model skipped.':'Passed to decisio.',
    examples:Array.from({length:3},(_,i)=>task.cases[(position+i+1)%task.cases.length])};
}

export function autoStream(index, phase) {
  if (!Number.isInteger(index) || index<0) throw new Error('Invalid automatic example');
  const domains=Object.keys(STREAMS), count=4, total=domains.length*count;
  const number=index%total, domain=domains[Math.floor(number/count)];
  return {...streamView(domain,number%count,phase),domain,number:number+1,total};
}
export function contextExample(index) {
  if (!Number.isInteger(index) || index<0) throw new Error('Invalid context example');
  const task=STREAMS.refund, position=index%3, facts=task.cases[position].text;
  return {number:position+1,policy:task.context,facts,cpuText:facts,modelText:task.context+'\n\n'+facts};
}
