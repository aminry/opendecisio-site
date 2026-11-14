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
    body: `<div class="fp-scene decision-visual" data-fast-loop data-playback="idle" ${attributes}>${body}</div><p class="fp-caption">${note}</p>`, source: sourceNote });
}

function routes() {
 const fast=timingView('fast'),fallback=timingView('fallback'),average=timingView('average',80);
 return scene('table-budget','Three costs. One clear picture.',
  'A fast answer uses about 0.05 ms of short-text CPU work. A fallback adds the model budget. With an assumed 80 percent fast-path share, the illustrative mean processing time is about 10.05 ms instead of the 50 ms model budget.',
  `<div class="fp-workload-saving" data-workload-saving><strong>${average.savingPercent}%</strong><span>less processing time in this illustrative workload<small>Assumes 80% fast-path answers · excludes network and queueing</small></span></div><div class="fp-budget-grid"><div class="fp-cost-card"><span class="fp-label">Fast answer</span><strong>~50 µs</strong><p>0.05 ms on the CPU<br/>Model read skipped</p><div class="fp-cost-done" aria-hidden="true">✓ Done on the CPU</div></div><div class="fp-cost-card"><span class="fp-label">Needs the model</span><strong>~${fallback.displayMs} ms</strong><p>${fast.cpuMs} ms CPU + ${fallback.modelMs} ms model budget</p><svg class="fp-cost-clock" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18"/><circle class="fp-clock-progress" cx="22" cy="22" r="18" pathLength="100"/></svg></div><div class="fp-cost-card fp-cost-card--total"><span class="fp-label">Example workload</span><strong>~${average.displayMs} ms</strong><p>Mean with an <b>assumed 80%</b> fast-path share</p><div class="fp-cost-dots" aria-hidden="true">${Array.from({length:10},(_,i)=>`<i class="${i<8?'fp-dot-fast':'fp-dot-model'}"></i>`).join('')}</div></div></div><p class="fp-budget-equation">Every request pays the CPU check. Only fallbacks pay the model read.<br/><b>0.05 + 20% × 50 ≈ 10.05 ms</b> in this example.</p>`,
  'The 80% share and ~50 ms model budget are example assumptions, not a combined benchmark. Network, queueing and monitoring reads are excluded. Measure your own task and host.',
  'data-fast-timing',
  'Static embedding + classifier: published short-text p50 0.05 ms (50 µs), median 22 tokens, Apple M5 Pro; x86 range 0.04–0.06 ms. Longer texts cost more. Source: the pinned task guide.');
}

function context() {
 const view=contextExample(0);
 return scene('table-context','Store the policy once. Change only the facts.',
  'One policy stays registered as context. Three orders arrive automatically as state. The CPU classifier reads only each order’s facts. The model reads the policy together with those facts when needed.',
  `<div class="fp-simple-context"><div class="fp-fixed-policy"><span class="fp-label">context · registered once</span><strong class="fp-heading">The policy stays here</strong><p data-fp-context>${esc(view.policy)}</p><span class="fp-policy-fixed">Fixed for this task</span></div><div class="fp-changing-facts"><div class="fp-arrival-label"><span data-context-number>New order 1 / 3</span><span>state</span></div><strong class="fp-heading">Only these facts change</strong><p data-context-facts>${esc(view.facts)}</p></div></div><div class="fp-read-map"><article data-context-consumer="cpu"><span class="fp-label">CPU fast path</span><div class="fp-consumer-inputs"><span class="fp-input-pill fp-input-pill--facts">New facts</span></div><svg viewBox="0 0 240 26" aria-hidden="true"><path d="M0 13h240"/><path class="dv-trace" d="M0 13h240"/></svg><div class="fp-context-processor"><svg viewBox="0 0 40 40" aria-hidden="true"><rect x="9" y="9" width="22" height="22" rx="4"/><path d="M15 3v6M25 3v6M15 31v6M25 31v6M3 15h6M3 25h6M31 15h6M31 25h6M15 15h10v10H15z"/></svg><div><strong>Small CPU classifier</strong><span>The policy stays out of its input</span></div></div></article><article data-context-consumer="model"><span class="fp-label">Model, if needed</span><div class="fp-consumer-inputs"><span class="fp-input-pill">Stored policy</span><b>+</b><span class="fp-input-pill fp-input-pill--facts">New facts</span></div><svg viewBox="0 0 240 26" aria-hidden="true"><path d="M0 13h240"/><path class="dv-trace" d="M0 13h240"/></svg><div class="fp-context-processor"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="6"/><circle cx="7" cy="7" r="3"/><circle cx="33" cy="7" r="3"/><circle cx="7" cy="33" r="3"/><circle cx="33" cy="33" r="3"/><path d="m9 9 7 7m8 8 7 7M9 31l7-7m8-8 7-7"/></svg><div><strong>decisio model</strong><span>Reads the policy together with the facts</span></div></div></article></div>`,
  'Illustrative orders, not live predictions. Keep all changing facts the decision needs in state. Changing the registered context requires teaching and certification again.',
  'data-fast-context');
}

function learning() {
 const art=[
  '<rect x="25" y="12" width="56" height="45" rx="6"/><rect x="33" y="20" width="56" height="45" rx="6"/><path d="M44 33h32M44 43h25M44 53h32M95 40h43"/><rect class="fp-art-active" x="146" y="19" width="45" height="44" rx="8"/><path class="fp-art-active" d="m155 40 9 9 17-22"/>',
  '<path d="M20 40h35M165 40h35"/><rect x="65" y="10" width="90" height="60" rx="9"/>'+Array.from({length:8},(_,i)=>`<rect class="fp-art-active fp-art-weight" x="${77+i%4*18}" y="${23+Math.floor(i/4)*21}" width="11" height="12" rx="2"/>`).join(''),
  '<path class="fp-art-active" d="M34 9h47v39L57 69 34 48zM44 35l10 10 18-25"/><circle cx="151" cy="39" r="28"/><path class="fp-art-active" d="M151 21v18l17 10M142 5h18"/>',
  '<path d="M105 5v29H48v20M105 34h57v20"/><rect class="fp-art-active" x="13" y="55" width="73" height="22" rx="6"/><rect x="128" y="55" width="73" height="22" rx="6"/><path class="fp-art-active" d="m37 66 6 6 13-15"/>'
 ];
 return scene('table-learning','Teach it. Check it. Then let it answer.',
   'Collect human-labelled examples or model answers. Fit a small candidate, certify it on separate examples and check time saving. Activate it only if it qualifies; otherwise keep the model available.',
   `<ol class="fp-learning">${[['Collect examples','Use human labels or answers supplied by decisio.'],['Fit a candidate','Learn the recurring choice from those examples.'],['Certify and time','Check separate examples and the saving on this host.'],['Activate if qualified','Answer eligible requests; pass the rest to decisio.']].map(([title,body],i)=>`<li class="fp-step" data-fast-phase="${i}"><span class="fp-step-number">${i+1}</span><strong class="fp-heading">${title}</strong><svg class="fp-learning-art" viewBox="0 0 220 85" aria-hidden="true">${art[i]}</svg><p>${body}</p></li>`).join('')}</ol>`,
   'If a candidate does not qualify, keep the model path. Learning from model answers gives an agreement certificate, which concerns matching the model, including its mistakes.');
}

export const fastPathFigures = { 'table-film': fastPathFilm, 'table-fallback': proofStrip, 'table-jobs': jobExamples, 'table-budget': routes, 'table-context': context, 'table-learning': learning };
