// Interactive input anatomy and replay of recorded fast-path timing. No inference runs here.
import { fastPathFilm } from '../fast-path-film.mjs';
import { readUpstream } from '../upstream.mjs';
import { esc, panel } from './core.mjs';
import { contextView, timingView, POLICY, FACTS } from '../fast-path-demo.mjs';

const source = 'Illustrative task and flow, not a live model run or latency measurement. Behavior: task context and fast tables in the pinned task guide.';
const arrow = '<svg class="fp-arrow" viewBox="0 0 80 36" aria-hidden="true"><path d="M4 18H72m-9-8 9 8-9 8"/><circle class="fp-packet" cx="8" cy="18" r="4"/></svg>';
const step = (i, content, className = '') => `<div class="fp-step ${className}" data-fast-phase="${i}">${content}</div>`;
function scene(name, title, desc, body, note, attributes = '', sourceNote = source) {
  const tasks = readUpstream('docs/tasks.md');
  for (const phrase of ['A fast table encodes the state alone', 'The certificate is an agreement certificate.', 'Choice and yes/no questions']) {
    if (!tasks.includes(phrase)) throw new Error(`Decision fast path: the task guide no longer says ${phrase}`);
  }
  return panel({ name, label: 'Decision fast path', title, desc, interactive: true,
    body: `<div class="fp-scene" data-fast-loop data-playback="idle" ${attributes}>${body}</div><p class="fp-caption">${note}</p>`, source: sourceNote });
}

function routes() {
  const v = timingView('fast');
  const lane = (baseline) => `<div class="fp-lane"><div class="fp-lane-label"><strong>${baseline ? 'Model on every request' : 'With a decision fast path'}</strong><span ${baseline ? '' : 'data-timing-total'}>~${baseline ? v.modelMs : v.displayMs} ms</span></div>
    <svg class="fp-timeline" viewBox="0 0 600 32" aria-hidden="true"><path class="fp-rail" d="M4 16H596"/>
    ${baseline ? `<rect class="fp-model-bar" x="4" y="10" width="${v.baselineWidth}" height="12" rx="3"/>` : `<rect class="fp-cpu-bar" data-timing-cpu x="4" y="10" width="${v.cpuWidth}" height="12" rx="3"/><rect class="fp-model-bar" data-timing-model x="${4+v.cpuWidth}" y="10" width="${v.modelWidth}" height="12" rx="3"/>`}
    <circle class="fp-racer" data-timing-marker="${baseline ? 'baseline' : 'fast'}" cx="${4+(baseline ? v.baselineWidth : v.totalWidth)}" cy="16" r="4"/></svg><span class="fp-returned" data-timing-ready="${baseline ? 'baseline' : 'fast'}" aria-hidden="true">✓ Answer returned</span></div>`;
  return scene('table-fallback', 'A familiar decision can skip the model read.',
    'Follow an illustrative support request through the static CPU fast path. It returns an eligible answer or passes the request to decisio. Compare about 50 microseconds of short-text CPU work with an illustrative 50 millisecond model budget, or estimate a workload by changing the assumed fast-path share.',
    `<div class="fp-controls" data-fp-controls hidden role="group" aria-label="Request scenario">${[['fast','Classifier answers'],['fallback','Model fallback'],['average','Workload estimate']].map(([key,label])=>`<button type="button" data-timing-mode="${key}" aria-pressed="${key==='fast'}">${label}</button>`).join('')}</div>
    <div class="fp-message"><p class="fp-label">Illustrative support request</p><strong data-flow-request>“I was charged twice. Can you help?”</strong><p class="fp-small">A learned task picks the support team.</p></div>
    <div class="fp-flow-neck" aria-hidden="true">↓</div>
    <div class="fp-static-node"><div><strong class="fp-heading">Static embedding + classifier</strong><p>Read token vectors and classify on the CPU.</p></div><strong class="fp-micro">~50 µs<small>0.05 ms · short texts</small></strong></div>
    <svg class="fp-flow-fork" viewBox="0 0 600 64" preserveAspectRatio="none" aria-hidden="true"><path d="M300 0V20H150V60m-5-7 5 7 5-7"/><path d="M300 20H450V60m-5-7 5 7 5-7"/><path class="fp-flow-pulse fp-flow-pulse--fast" pathLength="200" d="M300 0V20H150V60"/><path class="fp-flow-pulse fp-flow-pulse--fallback" pathLength="200" d="M300 0V20H450V60"/></svg>
    <div class="fp-inputs fp-flow-outputs"><div class="fp-branch" data-flow-route="fast"><p class="fp-label">Eligible answer</p><strong class="fp-heading" data-flow-fast>billing</strong><p class="fp-small">Return the classifier’s answer. Skip the model read.</p></div><div class="fp-branch" data-flow-route="fallback"><p class="fp-label">Otherwise → decisio</p><strong class="fp-heading" data-flow-model>Model idle for this request</strong><p class="fp-small">The model reads the policy and facts when needed.</p></div></div>
    <div class="fp-budget"><p class="fp-timing-summary" data-timing-summary role="status">~50 µs of CPU work. No model read.</p><p class="fp-small">Illustrative time budget · model ~50 ms · static short-text path ~0.05 ms</p>
    <div class="fp-race">${lane(true)}${lane(false)}<div class="fp-scale" aria-hidden="true"><span>0 ms</span><span>Same scale · ~50 ms</span></div></div>
    <div class="fp-key"><span><i class="fp-cpu-swatch"></i>Static CPU work</span><span><i class="fp-model-swatch"></i>Model work</span></div>
    <div class="fp-workload" data-fp-controls hidden><label for="fp-share">Assumed fast-path share <output for="fp-share" data-share-label>80%</output></label><input id="fp-share" aria-label="Assumed fast-path share" type="range" min="0" max="100" step="1" value="80"/><p class="fp-small">Adjust to estimate a workload. This share is an assumption, not measured coverage.</p></div>
    <p class="fp-timing-explanation" data-timing-explanation>The static backend needs no neural-network run on the CPU. An eligible short-text answer uses about 0.05 ms of embedding and classification work; the model read is skipped.</p></div>
    <noscript><p class="fp-small">Model fallback: about 50.05 ms including the CPU check. Example workload with an assumed 80% fast-path share: 0.05 + 20% × 50 = 10.05 ms mean processing time.</p></noscript>`,
    'Illustrative routes, not live predictions. Motion is slowed down; timelines share a linear scale. The workload calculator includes every CPU check and model fallback, and excludes network, queueing and monitoring reads. Actual latency and eligible share depend on your task, text length and host.',
    'data-fast-timing data-scenario="fast"',
    'Static embedding + classifier: published short-text p50 0.05 ms (50 µs), median 22 tokens, Apple M5 Pro; x86 short-text range 0.04–0.06 ms. Longer texts cost more. The approximately 50 ms model baseline is an illustrative budget, not a new combined benchmark. Source: the pinned task guide, “What a student costs.”');
}

function context() {
  const view = contextView('context', FACTS.a);
  return scene('table-context', 'Try moving the policy out of each request.',
    'Edit the changing facts and switch between repeating the policy in state and registering it as context. See exactly what the CPU classifier and the model receive. The model keeps the same information in either arrangement.',
    `<div class="fp-controls" data-fp-controls hidden role="group" aria-label="Policy placement"><button type="button" data-context-mode="inline" aria-pressed="false">Repeat policy in state</button><button type="button" data-context-mode="context" aria-pressed="true">Use task context</button></div>
    <div class="fp-inputs fp-edit-inputs">${step(0, `<p class="fp-label">Shared rules</p><strong class="fp-heading">The refund policy</strong><blockquote data-fp-context>${esc(POLICY)}</blockquote><p class="fp-small" data-context-location>Registered once as task context.</p>`, 'fp-policy')}
    <div class="fp-facts"><div data-fp-controls hidden><div class="fp-presets" role="group" aria-label="Example order"><button type="button" data-facts="a">Order A</button><button type="button" data-facts="b">Order B</button></div><label class="fp-heading" for="fp-facts">Changing facts</label><textarea id="fp-facts" rows="4" maxlength="2000" spellcheck="false">${esc(FACTS.a)}</textarea><p class="fp-small">Edit these facts to follow your own request.</p></div><noscript><strong class="fp-heading">Changing facts</strong><div class="fp-text">${esc(FACTS.a)}</div></noscript></div></div>
    <div class="fp-context-link" aria-hidden="true"><span data-context-flow>Policy stored once + new facts per request</span>${arrow}</div>
    <div class="fp-inputs">${step(1, `<p class="fp-label">CPU fast path reads</p><strong class="fp-heading" data-cpu-count>${view.cpuCharacters} characters</strong><div class="fp-text fp-text--facts" data-cpu-input>${esc(view.cpuText)}</div><p class="fp-small" data-cpu-note>Only the changing facts enter the classifier.</p>`, 'fp-cpu-input')}
    ${step(2, `<p class="fp-label">Model reads, if needed</p><strong class="fp-heading">Policy + changing facts</strong><div class="fp-text" data-model-input>${esc(view.modelText)}</div><p class="fp-small">The model has the same information in both modes.</p>`, 'fp-model-input')}</div>
    <p class="fp-result" data-context-summary role="status">The CPU reads fewer characters. The model still has the full policy.</p>`,
    'Illustrative input builder; no model is called and no refund answer is predicted. The two modes represent separate task registrations: moving policy into context requires teaching and certifying that task again. Smaller state can reduce classifier work; this example does not estimate a speed or accuracy gain.', 'data-fast-context');
}

function learning() {
  return scene('table-learning', 'Learn a candidate. Activate it only when it qualifies.',
    'Learning can start from human-labelled examples or from requests answered by the model. A candidate learns patterns in the changing state, is certified on held-out examples and is timed on the host. It becomes a fast path only if certification and the required saving pass. Otherwise the model remains available.',
    `<div class="fp-starts"><div><strong class="fp-heading">Start with human labels</strong><p>Your examples show the answers you want.</p><p class="fp-wire">Correctness: <code>gold</code></p></div><div><strong class="fp-heading">Or learn from traffic</strong><p>The model answers first and supplies learning data.</p><p class="fp-wire">Model agreement: <code>agreement</code></p></div></div>
    <ol class="fp-learning">${[['Fit a candidate', 'Learn patterns from the changing state.'], ['Certify it', 'Check separate examples at your error target.'], ['Time it on this host', 'Include the classifier cost and model fallbacks.']].map(([title, text], i) => `<li class="fp-step" data-fast-phase="${i}"><strong class="fp-heading">${title}</strong><p>${text}</p>${arrow}</li>`).join('')}</ol>
    <div class="fp-gate"><strong>Candidate qualifies?</strong><p>Activate it when certification and saving checks pass. A refit must also improve on the active version; otherwise keep the current serving path.</p></div>`,
    'An agreement certificate concerns matching the model, including its mistakes. A labelled task can also learn and retain gold certification while it has enough held-out human labels. The animation shows the process, not a training schedule.');
}

export const fastPathFigures = { 'table-film': fastPathFilm, 'table-fallback': routes, 'table-context': context, 'table-learning': learning };
