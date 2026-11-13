import {esc} from './figures/core.mjs';
import {STREAMS, streamView} from './fast-path-demo.mjs';
export function requestStream() {
  const v=streamView('support',0,2);
  return `<figure class="fp-demo" data-fast-stream data-playback="idle" data-phase="2" data-route="table" aria-label="Illustrative request stream: a CPU fast path answers familiar decisions and passes other requests to decisio.">
    <div class="fp-demo-top"><strong>Watch a request find its answer</strong><span>Illustration</span></div>
    <div class="fp-demo-controls" data-stream-controls hidden role="group" aria-label="Choose an example task">${Object.entries(STREAMS).map(([id,task])=>`<button type="button" data-stream-domain="${id}" aria-pressed="${id==='support'}">${esc(task.label)}</button>`).join('')}</div>
    <div class="fp-incoming"><span>Incoming request</span><p data-stream-message>${esc(v.text)}</p></div>
    <div class="fp-demo-wire" aria-hidden="true"><i></i></div>
    <div class="fp-demo-node"><span class="fp-demo-mark" aria-hidden="true">↗</span><div><strong>Decision fast path</strong><span data-stream-stage>${esc(v.stage)}</span></div><b>~50 µs<small>short texts</small></b></div>
    <svg class="fp-demo-fork" viewBox="0 0 500 48" preserveAspectRatio="none" aria-hidden="true"><path d="M250 0C250 25 125 20 125 48"/><path d="M250 0C250 25 375 20 375 48"/><path class="fp-demo-hot fp-demo-hot--table" pathLength="100" d="M250 0C250 25 125 20 125 48"/><path class="fp-demo-hot fp-demo-hot--decisio" pathLength="100" d="M250 0C250 25 375 20 375 48"/></svg>
    <div class="fp-demo-answers"><div data-stream-output="table"><span>Fast path answers</span><strong data-stream-answer>billing</strong><small>Model read skipped</small></div><div data-stream-output="decisio"><span>Otherwise → decisio</span><strong data-stream-model>Ready when needed</strong><small>Reads policy + facts</small></div></div>
    <div class="fp-demo-examples"><div class="fp-demo-examples-head"><span>Other example requests</span><button type="button" data-stream-next data-stream-controls hidden>Next example</button></div>${v.examples.map((c,i)=>`<div class="fp-demo-row" data-stream-row="${i}"><span data-row-text>${esc(c.text)}</span><b data-row-answer>${esc(c.answer)}</b><small data-row-route>${c.route==='table'?'CPU fast path':'decisio'}</small></div>`).join('')}</div>
    <figcaption>Sample outcomes show the two routes. No live inference or measured answer share.</figcaption>
    <p class="sr-only" role="status" data-stream-status></p>
  </figure>`;
}
export function proofStrip() {
 return `<figure class="fig fp-proof" aria-label="Fast path benefits"><div><strong>~50 µs</strong><span>Static embedding + classifier, short texts</span></div><div><strong>Keep decisio available</strong><span>The model answers requests passed on</span></div><div><strong>One shared context</strong><span>Send only the facts that change</span></div><figcaption>Published static p50: 0.05 ms for median 22-token texts on Apple M5 Pro; x86 range 0.04–0.06 ms. Longer texts cost more. Source: the pinned task guide.</figcaption></figure>`;
}
export function jobExamples() {
 return `<figure class="fig fp-jobs" aria-label="Illustrative recurring text decision jobs">${Object.entries(STREAMS).map(([id,task])=>`<section><div class="fp-job-copy"><div class="fp-job-title"><span>${id==='support'?'Support inbox':id==='moderation'?'Community queue':'Returns desk'}</span><strong>${id==='support'?'Send each ticket to the right team.':id==='moderation'?'Sort new posts as they arrive.':'Check each return against your policy.'}</strong></div><p class="fp-job-context">${esc(task.context)}</p></div><div class="fp-job-list">${task.cases.slice(0,3).map(c=>`<div><span>${esc(c.text)}</span><b>${esc(c.answer)}</b></div>`).join('')}</div><p class="fp-job-fallback">Unfamiliar request or policy exception? Keep the model in the route.</p></section>`).join('')}<figcaption>Illustrative inputs and outcomes for choice or yes/no tasks. These are not measured task results.</figcaption></figure>`;
}
