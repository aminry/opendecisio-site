// The figures of "Understand": how a question becomes a probability, and the releases. Each reads the numbers it draws from the pinned release's docs and stops the
// build when one is no longer there.
import { slugify } from '../upstream-map.mjs';
import { readUpstream } from '../upstream.mjs';
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

// --- Questions and releases -------------------------------------------------------------------------------------------------

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
	'release-timeline': releaseTimeline,
};
