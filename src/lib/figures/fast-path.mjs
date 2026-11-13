// Automatic task illustrations. These show example inputs and component budgets.
import {proofStrip, jobExamples} from '../fast-path-story.mjs';
import { fastPathFilm } from '../fast-path-film.mjs';
import { readUpstream } from '../upstream.mjs';
import { esc, panel } from './core.mjs';
import { contextExample, timingView } from '../fast-path-demo.mjs';

const source = 'Illustrative task and flow, not a live model run or latency measurement. Behavior: task context and fast tables in the pinned task guide.';
function scene(name, title, desc, body, note, attributes = '', sourceNote = source) {
  const tasks = readUpstream('docs/tasks.md');
  for (const phrase of ['A fast table encodes the state alone', 'The certificate is an agreement certificate.', 'Choice and yes/no questions']) {
    if (!tasks.includes(phrase)) throw new Error(`Decision fast path: the task guide no longer says ${phrase}`);
  }
  return panel({ name, label: 'Decision fast path', title, desc, interactive: true,
    body: `<div class="fp-scene" data-fast-loop data-playback="idle" ${attributes}>${body}</div><p class="fp-caption">${note}</p>`, source: sourceNote });
}

function routes() {
 const fast=timingView('fast'),fallback=timingView('fallback'),average=timingView('average',80);
 return scene('table-budget','Three costs. One clear picture.',
  'A fast answer uses about 0.05 ms of short-text CPU work. A fallback adds the model budget. With an assumed 80 percent fast-path share, the illustrative mean processing time is about 10.05 ms instead of the 50 ms model budget.',
  `<div class="fp-budget-grid"><div class="fp-cost-card"><span class="fp-label">Fast answer</span><strong>~50 µs</strong><p>0.05 ms on the CPU<br/>Model read skipped</p><div class="fp-cost-done" aria-hidden="true">✓ Done on the CPU</div></div><div class="fp-cost-card"><span class="fp-label">Needs the model</span><strong>~${fallback.displayMs} ms</strong><p>${fast.cpuMs} ms CPU + ${fallback.modelMs} ms model budget</p><svg class="fp-cost-clock" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18"/><circle class="fp-clock-progress" cx="22" cy="22" r="18" pathLength="100"/></svg></div><div class="fp-cost-card fp-cost-card--total"><span class="fp-label">Example workload</span><strong>~${average.displayMs} ms</strong><p>Mean with an <b>assumed 80%</b> fast-path share</p><div class="fp-cost-dots" aria-hidden="true">${Array.from({length:10},(_,i)=>`<i class="${i<8?'fp-dot-fast':'fp-dot-model'}"></i>`).join('')}</div></div></div><p class="fp-budget-equation">Every request pays the CPU check. Only fallbacks pay the model read.<br/><b>0.05 + 20% × 50 ≈ 10.05 ms</b> in this example.</p>`,
  'The 80% share and ~50 ms model budget are example assumptions, not a combined benchmark. Network, queueing and monitoring reads are excluded. Measure your own task and host.',
  'data-fast-timing',
  'Static embedding + classifier: published short-text p50 0.05 ms (50 µs), median 22 tokens, Apple M5 Pro; x86 range 0.04–0.06 ms. Longer texts cost more. Source: the pinned task guide.');
}

function context() {
 const view=contextExample(0);
 return scene('table-context','Store the policy once. Change only the facts.',
  'One policy stays registered as context. Three orders arrive automatically as state. The CPU classifier reads only each order’s facts. The model reads the policy together with those facts when needed.',
  `<div class="fp-simple-context"><div class="fp-fixed-policy"><span class="fp-label">context · registered once</span><strong class="fp-heading">The policy stays here</strong><p data-fp-context>${esc(view.policy)}</p><span class="fp-policy-fixed">Fixed for this task</span></div><div class="fp-changing-facts"><div class="fp-arrival-label"><span data-context-number>New order 1 / 3</span><span>state</span></div><strong class="fp-heading">Only these facts change</strong><p data-context-facts>${esc(view.facts)}</p></div></div><div class="fp-read-map"><p><b>CPU fast path</b><span>Reads the new facts</span></p><p><b>Model, if needed</b><span>Reads policy + new facts</span></p></div>`,
  'Illustrative orders, not live predictions. Keep all changing facts the decision needs in state. Changing the registered context requires teaching and certification again.',
  'data-fast-context');
}

function learning() {
 return scene('table-learning','Teach it. Check it. Then let it answer.',
   'Collect human-labelled examples or model answers. Fit a small candidate, certify it on separate examples and check time saving. Activate it only if it qualifies; otherwise keep the model available.',
   `<ol class="fp-learning">${[['Collect examples','Use human labels or answers supplied by decisio.'],['Fit a candidate','Learn the recurring choice from those examples.'],['Certify and time','Check separate examples and the saving on this host.'],['Activate if qualified','Answer eligible requests; pass the rest to decisio.']].map(([title,body],i)=>`<li class="fp-step" data-fast-phase="${i}"><span class="fp-step-number">${i+1}</span><strong class="fp-heading">${title}</strong><p>${body}</p></li>`).join('')}</ol>`,
   'If a candidate does not qualify, keep the model path. Learning from model answers gives an agreement certificate, which concerns matching the model, including its mistakes.');
}

export const fastPathFigures = { 'table-film': fastPathFilm, 'table-fallback': proofStrip, 'table-jobs': jobExamples, 'table-budget': routes, 'table-context': context, 'table-learning': learning };
