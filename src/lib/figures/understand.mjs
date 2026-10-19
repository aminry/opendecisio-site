// The figures of "Understand": how a question becomes a probability, the three bases side by side, what the
// calibration measured, what repeats and what does not, the evaluation card's map, how the headline compares, the
// limits, the questions and the releases. Each reads the numbers it draws from the pinned release's docs and stops the
// build when one is no longer there.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { comparison } from '../comparison.mjs';
import { slugify } from '../upstream-map.mjs';
import { readUpstream, siteRoot } from '../upstream.mjs';
import { stable } from '../launch.mjs';
import { esc, p2, panel, recorded, sourceLine } from './core.mjs';

const text = (file) => readUpstream(file);
const must = (source, re, what) => {
	const m = re.exec(source);
	if (!m) throw new Error(`docs-figures: the pinned release no longer says ${what}`);
	return m;
};
const has = (source, needle, what) => {
	if (!source.includes(needle)) throw new Error(`docs-figures: the pinned release no longer says ${what}`);
};
const md = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>');

// --- How it works -------------------------------------------------------------------------------------------------------

function onePass() {
	const readme = text('README.md');
	has(readme, "its answer is the model's distribution over the option letters at one position", 'that an answer is the distribution over the option letters at one position');
	const r = recorded();
	const q = r.items[0].questions.find((x) => x.type === 'choice');
	const letters = q.bars.map((b, i) => ({ letter: String.fromCharCode(65 + i), label: b.label, p: b.p }));
	const rows = letters.map((l, i) => {
		const y = 118 + i * 30;
		return `<text class="ft ft-s ft-code" x="414" y="${y + 13}">${l.letter}</text><text class="ft ft-s" x="436" y="${y + 13}">${esc(l.label)}</text><rect class="f-rail" x="530" y="${y}" width="120" height="14" rx="7"/><rect class="f-bar f-grow fd-${3 + Math.min(i, 5)}" x="530" y="${y}" width="${Math.max(2, 120 * l.p).toFixed(1)}" height="14" rx="7"/><text class="ft ft-n ft-xs f-pop fd-${4 + Math.min(i, 5)}" x="660" y="${y + 12}">${p2(l.p)}</text>`;
	}).join('');
	const body = `<svg class="fig__svg" viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<rect class="f-node fd-0" x="8" y="14" width="330" height="270" rx="12"/>
<text class="ft ft-k" x="22" y="40">One prompt, for one question</text>
<text class="ft ft-s f-pop fd-0" x="22" y="70">${esc(r.items[0].state.slice(0, 44))}...</text>
<text class="ft ft-s f-pop fd-1" x="22" y="100">${esc(q.ask)}</text>
${letters.map((l, i) => `<text class="ft ft-s ft-code f-pop fd-1" x="22" y="${130 + i * 22}">${l.letter}. ${esc(l.label)}</text>`).join('')}
<text class="ft ft-n f-pop fd-2" x="22" y="${130 + letters.length * 22 + 14}">Answer: ?</text>
<path class="f-line fd-2" d="M338 150L402 150" pathLength="1"/>
<text class="ft ft-d f-pop fd-2" x="370" y="138" text-anchor="middle">one pass</text>
<rect class="f-node f-node--on fd-3" x="402" y="14" width="302" height="270" rx="12"/>
<text class="ft ft-k" x="416" y="40">The distribution over the letters</text>
<text class="ft ft-d" x="416" y="64">at the one position where the answer goes;</text><text class="ft ft-d" x="416" y="84">nothing is generated</text>
${rows}
</svg>`;
	return panel({
		name: 'one-pass', label: 'One pass', title: 'A question is one prompt; its answer is read at one position, with no text generated.',
		desc: `One support-ticket question with ${letters.length} lettered options becomes one prompt. The model's distribution over the letters at the answer position is the answer: ${letters.map((l) => `${l.letter} ${l.label} ${p2(l.p)}`).join(', ')}.`,
		body, live: 7, legend: 'The state is read once per request; every question reads it from the prefix cache. The letters shown are the options in order.',
		source: `${sourceLine(r)} The mechanism is the README's "How it works".`,
	});
}

// --- Choosing a base -----------------------------------------------------------------------------------------------------

function basesCompare() {
	const readme = text('README.md');
	const row = (label) => {
		const m = new RegExp(`^\\| ${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\| ([^|]+) \\| ([^|]+) \\| ([^|]+) \\|$`, 'm').exec(readme);
		if (!m) throw new Error(`docs-figures: the README's Benchmarks table no longer has the row "${label}"`);
		return m.slice(1, 4).map((x) => x.trim());
	};
	const fresh = row('New 300-token state');
	const cached = row('1,000-token state, cached');
	const mmlu = row('MMLU-Pro, accuracy');
	const gpqa = row('GPQA Diamond, accuracy');
	const mem = must(readme, /\| `gemma-4-31b` \(default\) \|[^|]*30\.6 GiB in memory[^|]*\|[\s\S]*?\| `qwen3\.6-35b-a3b` \|[^|]*?\b(\d+\.\d) GiB in memory[^|]*\|[\s\S]*?\| `gemma-4-12b` \|[^|]*?, (\d+\.\d) GiB in memory/, 'the three bases\' memory');
	has(readme, 'JevBench\'s published items 213 correct against 200 each', 'that the 31B got 213 of JevBench\'s published items right against 200 each');
	const bases = [
		{ id: 'g31', name: 'Gemma 4 31B', tag: 'the default, for accuracy', i: 2, mem: '30.6 GiB (FP8)', need: 'a 96 GB card, or a 64 GB Mac (48 GB at 4 bits)', jev: '213 correct' },
		{ id: 'qwen', name: 'Qwen3.6-35B-A3B', tag: 'for speed on long new states and answers that repeat across sessions', i: 0, mem: `${mem[1]} GiB`, need: 'a large card', jev: '200 correct' },
		{ id: 'g12', name: 'Gemma 4 12B', tag: 'for machines without a 96 GB card', i: 1, mem: `${mem[2]} GiB`, need: 'a 32 GB Mac, or a 16 GB laptop through Ollama', jev: '200 correct' },
	];
	const body = `<ul class="fig__bases">${bases.map((b, k) => `<li class="fig__base ${`base-${b.id}`} f-pop fd-${k * 2}"><b>${esc(b.name)}</b><span class="fig__tag">${esc(b.tag)}</span><dl><dt>Memory</dt><dd>${esc(b.mem)}</dd><dt>New 300-token state</dt><dd>${esc(fresh[b.i])}</dd><dt>State already read</dt><dd>${esc(cached[b.i])}</dd><dt>MMLU-Pro</dt><dd>${esc(mmlu[b.i])}</dd><dt>GPQA Diamond</dt><dd>${esc(gpqa[b.i])}</dd><dt>On JevBench's 231 published questions</dt><dd>${b.jev}</dd></dl></li>`).join('')}</ul>`;
	return panel({
		name: 'bases-compare', label: 'Three bases', title: 'One server, one flag to pick the model: the default is the most accurate, the others are faster or smaller.',
		desc: `${bases.map((b) => `${b.name}: ${b.mem} in memory, ${fresh[b.i]} for a new 300-token state, MMLU-Pro ${mmlu[b.i]}, ${b.jev} on JevBench's 231 published questions`).join('; ')}.`,
		body, live: 6, legend: 'Latency is server time on one RTX PRO 6000 at 585 W; accuracy rows are the Decision Index 0.2.1 self-run; none is a board score. The 31B was measured in its own session, so its numbers are not paired with the others.',
		source: 'Source: the README\'s Benchmarks table and "Choosing a base" at the pinned release.',
	});
}

// --- Calibration -----------------------------------------------------------------------------------------------------------

function calibration() {
	const readme = text('README.md');
	const m = must(readme, /Calibration on JevBench, as ECE on the standard and hard tiers: (\d\.\d+) and (\d\.\d+) on the Qwen base, (\d\.\d+) and (\d\.\d+) on the Gemma 4 12B base, (\d\.\d+) and (\d\.\d+) on the Gemma 4 31B base\./, 'the ECE of the three bases on JevBench');
	const tasks = text('docs/tasks.md');
	const pooled = must(tasks, /pooled ECE 0\.(\d+) \| pooled ECE \*\*0\.(\d+)\*\*/, 'the pooled ECE before and after a registered task');
	const rows = [
		{ name: 'Qwen3.6-35B-A3B', id: 'qwen', std: Number(m[1]), hard: Number(m[2]) },
		{ name: 'Gemma 4 12B', id: 'g12', std: Number(m[3]), hard: Number(m[4]) },
		{ name: 'Gemma 4 31B', id: 'g31', std: Number(m[5]), hard: Number(m[6]) },
	];
	const max = 0.13;
	const bar = (v, y, cls, d) => `<rect class="f-rail" x="180" y="${y}" width="300" height="11" rx="5"/><rect class="f-bar ${cls} f-grow fd-${d}" x="180" y="${y}" width="${Math.max(2, (v / max) * 300).toFixed(1)}" height="11" rx="5"/><text class="ft ft-n ft-xs f-pop fd-${d + 1}" x="${(180 + (v / max) * 300 + 8).toFixed(1)}" y="${y + 10}">${v.toFixed(3)}</text>`;
	const body = `<svg class="fig__svg" viewBox="0 0 720 270" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
${rows.map((r, i) => { const y = 18 + i * 72; return `<text class="ft ft-s" x="8" y="${y + 12}">${esc(r.name)}</text><text class="ft ft-d ft-xs" x="130" y="${y + 11}">standard</text>${bar(r.std, y, `lc-${r.id} f-bar--base`, 1 + i)}<text class="ft ft-d ft-xs" x="130" y="${y + 29}">hard</text>${bar(r.hard, y + 18, `lc-${r.id} f-bar--base`, 2 + i)}`; }).join('')}
<text class="ft ft-d" x="8" y="242">ECE, expected calibration error: lower is better, 0 is perfect</text>
</svg>`;
	return panel({
		name: 'calibration', label: 'Calibration', title: 'A probability is only useful if it is honest: ECE says how far it is from how often the answer is right.',
		desc: `ECE on JevBench's standard and hard tiers: ${rows.map((r) => `${r.name} ${r.std.toFixed(3)} and ${r.hard.toFixed(3)}`).join('; ')}. A registered task lowered the pooled ECE of six held-out tasks from 0.${pooled[1]} to 0.${pooled[2]}.`,
		body, live: 6, legend: `A registered task lowered the pooled ECE of six other held-out tasks from 0.${pooled[1]} to 0.${pooled[2]}, from 20 labelled examples each.`,
		source: 'Source: the README\'s Benchmarks section and the tasks table of docs/tasks.md at the pinned release. The temperatures were fitted on a private 1,400-item suite, so its ECE figures are in-sample (EVAL_CARD.md section 4).',
	});
}

// --- Repeatability -------------------------------------------------------------------------------------------------------

function repeatability() {
	const card = text('EVAL_CARD.md');
	const cli = text('docs/cli.md');
	const readme = text('README.md');
	has(cli, 'a question returns the same probabilities every time, alone or among other questions', 'that the Qwen base returns the same probabilities every time');
	has(card, 'differed by up to 0.113 at the served temperature, and one choice of the 60 changed', 'the 12B\'s first read against its cached read');
	has(card, 'On the Qwen base and on the Gemma 4 31B base the two reads of the same JevBench answers were identical', 'that the 31B\'s and Qwen\'s first and cached reads of the JevBench answers are identical');
	has(card, 'on a server that has already answered it, a repeat can differ (5 of 200 items, up to 0.031, no top answer changed', 'that a repeat on a server that has already answered can differ');
	has(card, 'the answers differed by up to 0.128, on 212 of 231 items; two near-tied choices changed', 'the 12B\'s change between sessions');
	has(card, 'changing 28 top answers (1.7%)', 'the 31B\'s change between sessions');
	has(card, 'on all 1,400 suite items in 4 of 5 starts', 'the Qwen base\'s restarts');
	has(readme, 'on all 1,400 suite items to 1.1e-16', 'the Qwen base\'s answers on another card');
	has(readme, 'within 0.035', 'the 12B\'s batch bound');
	has(readme, 'within 0.0073', 'the 31B\'s batch bound');
	has(readme, 'a request repeats exactly on a freshly started server, and on a server that has already answered it a repeat can differ', 'that a request repeats exactly on a freshly started server');
	const cols = ['The same request again', 'A first read against a cached read', 'Questions batched against alone', 'Another session'];
	const rows = [
		{ name: 'Qwen3.6-35B-A3B', id: 'qwen', cells: ['the same probabilities every time', 'identical', 'the same probabilities, bit for bit', 'matched an earlier record on all 1,400 suite items in 4 of 5 restarts; on another card, to 1.1e-16'] },
		{ name: 'Gemma 4 12B', id: 'g12', cells: ['not bit for bit', 'up to 0.113 on 60 new states; one choice changed', 'the same choice, probabilities within 0.035', 'up to 0.128 on 212 of 231 items; two near-tied choices changed'] },
		{ name: 'Gemma 4 31B', id: 'g31', cells: ['exact on a freshly started server; on one that has already answered it, 5 of 200 differed (up to 0.031, no top answer changed)', 'identical on the JevBench answers', 'the same choice, probabilities within 0.0073', 'near-tied answers moved; 28 top answers changed (1.7%) over 1,631 items'] },
	];
	const body = `<div class="fig__matrix" role="table" aria-label="What repeats, by base"><div class="fig__mrow fig__mhead" role="row"><span role="columnheader">Base</span>${cols.map((c) => `<span role="columnheader">${esc(c)}</span>`).join('')}</div>${rows.map((r, i) => `<div class="fig__mrow f-pop fd-${i * 2}" role="row"><span class="fig__mbase base-${r.id}" role="rowheader">${esc(r.name)}</span>${r.cells.map((c, k) => `<span role="cell" data-col="${esc(cols[k])}">${esc(c)}</span>`).join('')}</div>`).join('')}</div>`;
	return panel({
		name: 'repeatability', label: 'What repeats', title: 'What repeats depends on the base, on what the server has already answered, and on the session.',
		desc: `What repeats, by base. ${rows.map((r) => `${r.name}: ${cols.map((c, k) => `${c}, ${r.cells[k]}`).join('; ')}`).join('. ')}.`,
		body, live: 5, interactive: true, legend: 'Every bit-identity claim holds for a fixed configuration and request form: any change of rounding moves this model\'s answers.',
		source: 'Source: EVAL_CARD.md sections 4, 6.5 and 7.5, docs/cli.md "Determinism" and the README\'s "Choosing a base" at the pinned release.',
	});
}

// --- The evaluation card's map ---------------------------------------------------------------------------------------------

function evalCardMap() {
	const card = text('EVAL_CARD.md');
	const heads = [...card.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => ({ n: m[1], title: m[2], href: `#${slugify(`${m[1]}. ${m[2]}`)}` }));
	if (heads.length < 8) throw new Error('docs-figures: EVAL_CARD.md no longer has its numbered sections');
	const body = `<ol class="fig__map">${heads.map((h, i) => `<li class="f-pop fd-${Math.min(i, 10)}"><a href="${h.href}"><span class="fig__num">${h.n}</span><b>${esc(h.title)}</b></a></li>`).join('')}</ol>`;
	return panel({
		name: 'eval-card-map', label: 'The card', title: `${heads.length} sections: what was measured, on what, and what was fitted on what.`,
		desc: `The evaluation card's sections: ${heads.map((h) => `${h.n}. ${h.title}`).join('; ')}.`,
		body, live: 5, interactive: true, legend: 'Each section links to its place below.', source: 'Source: EVAL_CARD.md at the pinned release.',
	});
}

// --- How it compares -------------------------------------------------------------------------------------------------------

function compareHeadline() {
	const c = comparison();
	if (!c) throw new Error('docs-figures: the pinned release has no docs/comparison.md');
	const row = c.headline.rows.find((r) => /Decision Index 0\.2\.1/.test(r[0].replace(/<[^>]+>/g, '')));
	if (!row) throw new Error('docs-figures: the comparison\'s headline no longer has its Decision Index row');
	const names = c.headline.head.slice(1).map((h) => h.replace(/<[^>]+>/g, '').replace(/^decisio · /, ''));
	const cells = row.slice(1).map((x) => x.replace(/<[^>]+>/g, '').trim());
	const parsed = cells.map((x, i) => ({ name: names[i], value: Number(/(\d+\.\d+)/.exec(x)?.[1]), }));
	if (parsed.some((p) => !Number.isFinite(p.value))) throw new Error('docs-figures: a headline cell is not a number');
	// The 31B's value, said in the title as the launch facts' stable claim says it (launch_facts.public.json stable_claims.decision_index_021).
	const ours31 = parsed.find((p) => /31B/.test(p.name));
	if (!ours31 || !stable('decision_index_021').text.includes(`scored ${ours31.value.toFixed(2)}`)) throw new Error('docs-figures: the comparison\'s Decision Index value for the 31B is not the one in launch_facts.public.json stable_claims.decision_index_021');
	const rows = parsed.map((p, i) => {
		const y = 10 + i * 34;
		const ours = i < 3;
		return `<text class="ft ft-s" x="8" y="${y + 14}">${esc(p.name)}</text><rect class="f-rail" x="250" y="${y}" width="360" height="18" rx="9"/><rect class="f-bar${ours ? '' : ' f-bar--grey'} f-grow fd-${Math.min(i + 1, 10)}" x="250" y="${y}" width="${((p.value / 100) * 360).toFixed(1)}" height="18" rx="9"/><text class="ft ft-n f-pop fd-${Math.min(i + 2, 10)}" x="620" y="${y + 14}">${p.value.toFixed(2)}</text>`;
	}).join('');
	const body = `<svg class="fig__svg" viewBox="0 0 720 ${10 + parsed.length * 34 + 8}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${rows}</svg>`;
	return panel({
		name: 'compare-headline', label: 'Decision Index 0.2.1', title: `On the Decision Index 0.2.1, our own run of Decisio 31B scored ${ours31.value.toFixed(2)} (a self-run, not a board score).`,
		desc: `Decision Index 0.2.1, 0 to 100: ${parsed.map((p) => `${p.name} ${p.value.toFixed(2)}`).join('; ')}.`,
		body, live: 6, legend: 'Values and intervals; our values are our own runs on the Decision Index 0.2.1; the others come from the public boards as of 2026-10-05.',
		source: 'Source: docs/comparison.md at the pinned release (runs/2026-10-05_comparison/).',
	});
}

// --- Limits ------------------------------------------------------------------------------------------------------------------

function limitsMap() {
	const card = text('EVAL_CARD.md');
	const readme = text('README.md');
	const run = text('docs/running.md');
	has(card, 'One card per run and one run per configuration.', 'its first limit');
	has(card, 'so a card at 600 W may read new states faster', 'the power-limit caveat');
	has(card, '**A request repeats exactly on a freshly started server; on a server that has already answered it, a repeat can differ', 'the repeatability limit');
	has(card, 'Repeatability across sessions is not promised.', 'that repeatability across sessions is not promised');
	has(readme, 'It needs a 96 GB card on vLLM', 'the 31B\'s memory');
	has(run, 'the 31B is measured on, and needs, a 96 GB card', 'the 31B\'s memory limit');
	has(readme, 'on a 48 GB Mac (derived from the 64 GB measurement)', 'that the 31B\'s 4-bit conversion is for a 48 GB Mac');
	has(card, 'the image route was not measured', 'that the image route was measured on the Qwen base only');
	has(card, 'so the suite\'s ECE figures are in-sample', 'that the temperatures were fitted on the suite');
	const items = [
		{ t: 'One card, one session', x: 'Every figure is from one card and one run per configuration.', href: '/docs/evaluation-card/#5-limits' },
		{ t: 'Hardware', x: 'The 31B is measured on, and needs, a 96 GB card (or a 64 GB Mac, or a 48 GB one from its 4-bit conversion, a size not measured); the 12B runs on a 32 GB Mac or a 16 GB laptop.', href: '/docs/#1-pick-your-machine' },
		{ t: 'The host and the power limit', x: 'Latency depends on the CPU and on the card\'s power limit: a card at 600 W may read new states faster than the 585 W measured.', href: '/docs/guides/latency/' },
		{ t: 'Repeatability', x: 'A request repeats exactly on a freshly started server; asked again on one that has already answered it, it can differ slightly. Across sessions it is not promised.', href: '/docs/repeatability/' },
		{ t: 'Images', x: 'The image route was measured with the Qwen base only.', href: '/docs/guides/images/' },
		{ t: 'What was fitted on what', x: 'The temperatures were fitted on a private suite, so its ECE figures are in-sample.', href: '/docs/probability/' },
		{ t: 'Size', x: 'A prompt holds the context the server serves, 32,768 tokens or more on a Gemma base, and a question up to 255 options.', href: '/docs/guides/long-and-wide/' },
		{ t: 'Our own runs, and the board\'s list', x: 'The Decision Index values here are our own runs; decisio\'s rows are listed on the board\'s data file of 2026-10-14.', href: '/benchmarks/#decision-index' },
	];
	const body = `<ul class="fig__cards fig__cards--wide">${items.map((it, i) => `<li class="f-pop fd-${Math.min(i, 10)}"><a class="fig__card" href="${it.href}"><b>${esc(it.t)}</b><span>${esc(it.x)}</span></a></li>`).join('')}</ul>`;
	return panel({
		name: 'limits-map', label: 'What the numbers do not say', title: 'Eight conditions that belong beside every figure.',
		desc: `Limits: ${items.map((it) => `${it.t}: ${it.x}`).join(' ')}`,
		body, live: 6, interactive: true, legend: 'Each card links to the page that says more.', source: 'Source: EVAL_CARD.md sections 4, 5, 6.5, 6.6 and 7.5, the README and docs/running.md at the pinned release.',
	});
}

// --- Questions and releases -------------------------------------------------------------------------------------------------

function faqMap() {
	const file = readFileSync(join(siteRoot, 'src/content/docs/docs/faq.md'), 'utf8');
	const qs = [...file.matchAll(/^## (.+\?)$/gm)].map((m) => m[1]);
	if (qs.length < 8) throw new Error('docs-figures: the questions page has lost its questions');
	const body = `<ul class="fig__chiplist">${qs.map((q, i) => `<li class="f-pop fd-${Math.min(i, 10)}"><a href="#${slugify(q)}">${esc(q)}</a></li>`).join('')}</ul>`;
	return panel({
		name: 'faq-map', label: 'Questions', title: `${qs.length} questions newcomers ask; each answer rests on the documentation it links to.`,
		desc: `The questions on this page: ${qs.join(' ')}`,
		body, live: 5, interactive: true, legend: 'Each question links to its answer below.', source: 'Source: this page; every answer is a pointer or a section of the pinned release.',
	});
}

function releaseTimeline() {
	const log = text('CHANGELOG.md');
	const items = [...log.matchAll(/^## \[(\d+\.\d+\.\d+)\]\([^)]*\) \((\d{4}-\d{2}-\d{2})\)$/gm)].map((m) => ({ v: m[1], date: m[2], href: `#${slugify(`${m[1]} (${m[2]})`)}` }));
	if (items.length < 6) throw new Error('docs-figures: CHANGELOG.md no longer lists its releases in "## [v](link) (date)" form');
	const shown = items.slice(0, 8);
	const body = `<ol class="fig__timeline">${shown.map((it, i) => `<li class="f-pop fd-${Math.min(i, 10)}"><a href="${it.href}"><b>${esc(it.v)}</b><span>${esc(it.date)}</span></a></li>`).join('')}</ol>`;
	return panel({
		name: 'release-timeline', label: 'Releases', title: `The last ${shown.length} of ${items.length} releases, newest first.`,
		desc: `Releases: ${shown.map((it) => `${it.v} on ${it.date}`).join('; ')}.`,
		body, live: 5, interactive: true, legend: 'Each links to its entry in the changelog below.', source: 'Source: CHANGELOG.md at the pinned release.',
	});
}

export const understandFigures = {
	'one-pass': onePass,
	'bases-compare': basesCompare,
	calibration,
	repeatability,
	'eval-card-map': evalCardMap,
	'compare-headline': compareHeadline,
	'limits-map': limitsMap,
	'faq-map': faqMap,
	'release-timeline': releaseTimeline,
};
