// Interactive input anatomy and replay of recorded fast-path timing. No inference runs here.
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
  const record = JSON.parse(readUpstream('runs/2026-10-30_fast-table/summary.json')).clinc150_timed;
  const v = timingView(record, 'average');
  const lane = (baseline) => `<div class="fp-lane"><div class="fp-lane-label"><strong>${baseline ? 'Model on every request' : 'With a decision fast path'}</strong><span ${baseline ? '' : 'data-timing-total'}>${baseline ? v.modelMs : v.displayMs} ms</span></div>
    <svg class="fp-timeline" viewBox="0 0 600 32" aria-hidden="true"><path class="fp-rail" d="M4 16H596"/>
    ${baseline ? `<rect class="fp-model-bar" x="4" y="10" width="${v.baselineWidth}" height="12" rx="3"/>` : `<rect class="fp-cpu-bar" data-timing-cpu x="4" y="10" width="${v.cpuWidth}" height="12" rx="3"/><rect class="fp-model-bar" data-timing-model x="${4+v.cpuWidth}" y="10" width="${v.modelWidth}" height="12" rx="3"/>`}
    <circle class="fp-racer" data-timing-marker="${baseline ? 'baseline' : 'fast'}" cx="4" cy="16" r="4"/></svg><span class="fp-returned" data-timing-ready="${baseline ? 'baseline' : 'fast'}" aria-hidden="true">✓ Answer returned</span></div>`;
  return scene('table-fallback', 'Watch the time saved when the model can be skipped.',
    'Compare a recorded model-only baseline with a decision fast path. Choose a classifier answer, a model fallback or the average of the timed sample. Both timelines use the same time scale; the animation is slowed down for readability.',
    `<div class="fp-controls" data-fp-controls hidden role="group" aria-label="Timing scenario">${[['fast','Classifier answers'],['fallback','Model fallback'],['average','Timed average']].map(([key,label])=>`<button type="button" data-timing-mode="${key}" aria-pressed="${key==='average'}">${label}</button>`).join('')}</div>
    <p class="fp-timing-summary" data-timing-summary role="status">${v.savingPercent}% lower mean time</p>
    <p class="fp-small">Recorded CLINC150 intent-classification sample · ${v.requestCount} timed requests</p>
    <div class="fp-race">${lane(true)}${lane(false)}<div class="fp-scale" aria-hidden="true"><span>0 ms</span><span>Same scale · 405 ms</span></div></div>
    <div class="fp-key"><span><i class="fp-cpu-swatch"></i>CPU classifier</span><span><i class="fp-model-swatch"></i>Model work</span></div>
    <p class="fp-timing-explanation" data-timing-explanation>The CPU check runs on every request. Only ${v.modelRequests} of ${v.requestCount} needed the model: 21.1 ms + 13% × 384 ms ≈ 71 ms on average.</p>
    <p class="fp-result">An eligible request skips the model. A fallback pays for both.</p>
    <noscript><p class="fp-small">Classifier answers: 21.1 ms. Model fallback: about 405 ms. Timed average: 71 ms, versus 384 ms for the model baseline.</p></noscript>`,
    'Replay of historical offline timings, slowed down and looped. These are not timings for the refund example below. Savings depend on the task, student and host; measure your own workload.',
    `data-fast-timing data-timing-record="${esc(JSON.stringify(record))}"`,
    'Historical offline CLINC150 run, 2026-10-30: model reads from decisio 0.35.0 with vLLM 0.31.0 on one RTX PRO 6000 Blackwell at 600 W. CPU timing uses the torch encoder described for 0.37.0 on AMD EPYC 9755, four threads. The 200-request timing sample is separate from the full test-set results. Source: the pinned fast-table timing record and task guide.');
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

export const fastPathFigures = { 'table-fallback': routes, 'table-context': context, 'table-learning': learning };
