// The figures of "Understand": how a question becomes a probability, the three bases side by side, what the
// calibration measured, what repeats and what does not, the evaluation card's map, how the headline compares,
// the questions and the releases. Each reads the numbers it draws from the pinned release's docs and stops the
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
	// Both boxes are as tall as the options need: one row of 30 per option below the heading, with a margin.
	const h = Math.max(270, 118 + letters.length * 30);
	const body = `<svg class="fig__svg" viewBox="0 0 720 ${h + 34}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<rect class="f-node fd-0" x="8" y="14" width="330" height="${h}" rx="12"/>
<text class="ft ft-k" x="22" y="40">One prompt, for one question</text>
<text class="ft ft-s f-pop fd-0" x="22" y="70">${esc(r.items[0].state.slice(0, 44))}...</text>
<text class="ft ft-s f-pop fd-1" x="22" y="100">${esc(q.ask)}</text>
${letters.map((l, i) => `<text class="ft ft-s ft-code f-pop fd-1" x="22" y="${130 + i * 22}">${l.letter}. ${esc(l.label)}</text>`).join('')}
<text class="ft ft-n f-pop fd-2" x="22" y="${130 + letters.length * 22 + 14}">Answer: ?</text>
<path class="f-line fd-2" d="M338 150L402 150" pathLength="1"/>
<text class="ft ft-d f-pop fd-2" x="370" y="138" text-anchor="middle">one pass</text>
<rect class="f-node f-node--on fd-3" x="402" y="14" width="302" height="${h}" rx="12"/>
<text class="ft ft-k" x="416" y="40">The distribution over the letters</text>
<text class="ft ft-d" x="416" y="64">at the one position where the answer goes;</text><text class="ft ft-d" x="416" y="84">nothing is generated</text>
${rows}
</svg>`;
	return panel({
		name: 'one-pass', label: 'One pass', title: 'A question is one prompt; its answer is read at one position, with no text generated.',
		desc: `One support-ticket question with ${letters.length} lettered options becomes one prompt. The model's distribution over the letters at the answer position is the answer: ${letters.map((l) => `${l.letter} ${l.label} ${p2(l.p)}`).join(', ')}.`,
		body, legend: 'The text is read once per request, and every question starts from that read. The letters are the options, in order.',
		source: `${sourceLine(r)} The mechanism is the README's "How it works".`,
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
		body, interactive: true, legend: 'Each links to its entry in the changelog below.', source: 'Source: CHANGELOG.md at the pinned release.',
	});
}

export const understandFigures = {
	'one-pass': onePass,
	'compare-headline': compareHeadline,
	'faq-map': faqMap,
	'release-timeline': releaseTimeline,
};
