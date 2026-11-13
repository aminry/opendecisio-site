// Mechanism illustrations for the decision fast path. No model predictions or timings are simulated.
import { readUpstream } from '../upstream.mjs';
import { esc, panel } from './core.mjs';

const source = 'Illustrative task and flow, not a live model run or latency measurement. Behavior: task context and fast tables in the pinned task guide.';
const arrow = '<svg class="fp-arrow" viewBox="0 0 80 36" aria-hidden="true"><path d="M4 18H72m-9-8 9 8-9 8"/><circle class="fp-packet" cx="8" cy="18" r="4"/></svg>';
const step = (i, content, className = '') => `<div class="fp-step ${className}" data-fast-phase="${i}">${content}</div>`;
function scene(name, title, desc, body, note) {
  const tasks = readUpstream('docs/tasks.md');
  for (const phrase of ['A fast table encodes the state alone', 'The certificate is an agreement certificate.', 'Choice and yes/no questions']) {
    if (!tasks.includes(phrase)) throw new Error(`Decision fast path: the task guide no longer says ${phrase}`);
  }
  return panel({ name, label: 'Decision fast path', title, desc, interactive: true,
    body: `<div class="fp-scene" data-fast-loop data-playback="idle">${body}</div><p class="fp-caption">${note}</p>`, source });
}

function routes() {
  return scene('table-fallback', 'A small classifier answers eligible inputs. The model handles the rest.',
    'The changing facts enter a CPU classifier learned for this task. It answers eligible requests. Other requests go to the decisio model, which reads the fixed task context with those facts. Either route returns a typed answer; your application checks its certificate.',
    `<div class="fp-route-top">${step(0, '<p class="fp-label">Your request</p><strong class="fp-heading">New return facts</strong><p>Delivery age, condition and product category.</p><p class="fp-wire"><code>state</code></p>')}${arrow}${step(1, '<p class="fp-label">On the server CPU</p><strong class="fp-heading">Decision fast path</strong><p>A small classifier learned for this task reads the changing state.</p><p class="fp-wire"><code>fast_table</code> in the API</p>', 'fp-step--accent')}</div>
    <p class="fp-fork-label">The request takes one of these routes.</p><svg class="fp-fork" viewBox="0 0 600 64" aria-hidden="true"><path d="M450 0V18H150V60m-5-7 5 7 5-7"/><path d="M450 18V60m-5-7 5 7 5-7"/><circle class="fp-fork-marker fp-fork-marker--table" cx="450" cy="0" r="4"/><circle class="fp-fork-marker fp-fork-marker--model" cx="450" cy="0" r="4"/></svg>
    <div class="fp-routes"><section class="fp-branch fp-branch--table"><p class="fp-label">Eligible for the fast path</p><strong class="fp-heading">Return the classifier’s answer</strong><p>The model is skipped for this request.</p><p class="fp-wire"><code>answered_by: "table"</code></p></section>
    ${step(2, '<p class="fp-label">Otherwise, model fallback</p><strong class="fp-heading">Ask the decisio model</strong><p>The model reads the registered context together with this state.</p><p class="fp-wire"><code>answered_by: "decisio"</code></p>', 'fp-branch fp-branch--model')}</div>
    <p class="fp-result">Either route → typed answer → your application checks the certificate.</p>`,
    'This is a learned classifier, not an exact-string cache. The loop shows alternative requests, each taking one answer route. Your backend separately decides when an answer needs human review.');
}

function context() {
  return scene('table-context', 'Keep the policy fixed. Send only the facts that change.',
    'Register a refund policy as task context once. A later request sends one order’s facts, and the next sends another order’s facts. The policy stays the same. The fast path encodes only these changing facts; the model reads the policy as well.',
    `${step(0, '<p class="fp-label">Register once · context</p><strong class="fp-heading">The shared refund policy</strong><blockquote data-fp-context>Apply the refund window for the product category. Use the item’s condition and delivery age; send policy exceptions for review.</blockquote><p class="fp-small">Illustrative excerpt. Your real policy can contain the complete shared rules.</p>', 'fp-policy')}
    <div class="fp-context-link" aria-hidden="true"><span>One registered task</span>${arrow}</div>
    <div class="fp-inputs">${step(1, '<p class="fp-label">Request A · state</p><strong class="fp-heading">One order’s facts</strong><dl data-fp-state><div><dt>Days since delivery</dt><dd>12</dd></div><div><dt>Opened</dt><dd>No</dd></div><div><dt>Category</dt><dd>Home</dd></div></dl>')}
    ${step(2, '<p class="fp-label">Request B · state</p><strong class="fp-heading">Another order’s facts</strong><dl data-fp-state><div><dt>Days since delivery</dt><dd>45</dd></div><div><dt>Opened</dt><dd>Yes</dd></div><div><dt>Category</dt><dd>Home</dd></div></dl>')}</div>
    <p class="fp-result">Same policy and question. Different facts each time.</p>`,
    'Move only genuinely shared material into context. Keep every changing fact the decision needs in state, and do not send the policy again with each request.');
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
