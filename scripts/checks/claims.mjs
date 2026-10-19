// No rank and no comparison in public (decided 2026-10-15): every built page is read, its visible text, its titles and
// descriptions, its images' alt text and its SVG titles, for an ordinal rank ("second", "fourth of 135", "top 10",
// "highest-ranked", "ranked above") or a relative comparison ("level with Jev", "Jev-level", "ahead of", "faster than",
// "score higher"). The patterns are the project's claims scanner's; a measurement with its version and date, and a
// fact about Decisio itself, are what pages say instead (launch_facts.public.json stable_claims).
// Not read: decisio's own text as the pinned release has it (the decisio repository changes it, and the claims scanner
// reads it there), posted history marked data-history (a published title stays as it was published), code, and the page's controls.
// A multiple ("about 44 times as long") is allowed only beside the times it is made of and their date (Amin's decision).
//   node scripts/checks/claims.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';
import { pin, upstreamRoot } from '../../src/lib/upstream.mjs';

const ORDINALS = 'first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth';
const NOT_RANK_NOUN = 'question|questions|token|tokens|time|start|starts|draw|call|request|run|part|half|layer|row|step|chunk|pass|line|sentence|paragraph|gate|session|attempt|engine|stage|post|release|record|item|case|turn|state|block|copy|read|check|number|column|rental|box|card|week|day|tab|answer|answers|example|ticket|document|terminal|time|use|look';
const CONTEXT = /JevBench|\bboard\b|\bJev\b|open-weights|frozen|composite|Capability|sealed|cost axis|leaderboard|Decision Index|H2O|Quyet|Jeff|decider|Cygnet|\branked\b|\bsystems?\b|\bentr(y|ies)\b/i;
const RANK = [
	['an ordinal rank', new RegExp(`\\b(${ORDINALS})\\b(?!\\s+(${NOT_RANK_NOUN})\\b)(?![- ](party|engine|class|chance))`, 'i')],
	['"of N systems"', /\b(of|among|out of) (1[0-9]{2}(?! ?(scored|items?|questions?|tickets?|answers?|requests?|examples?|tokens?|steps?|ms|s|seconds?|GB|W)\b)(?!\))|[0-9]{2,3} (open-weights |ranked |Jev-class )?(systems|rows|models|entries))\b/],
	['an "Nth"', /\b\d+(st|nd|rd|th)\b(?! (percentile|draw|token))/],
	['"top N"', /\btop[- ]?(\d+|ten|twelve|three|five)\b/i],
	['a ranking', /\branked\b|\branks\b|\branking\b|\bhighest-ranked\b|\brank (is|of)\b/i],
	['"highest" or "leading"', /\b(highest|lowest|best|leads?|leading|leader)\b(?! (temperature|probability|confidence|logit|index|value in each))/i],
	['"#N"', /(?<![\w&])#\d{1,3}\b/],
];
const COMPARE = [
	['"than"', /\b(faster|slower|higher|lower|better|worse|more accurate|less accurate|stronger|weaker|cheaper)\b[^.|]{0,40}\bthan\b/i],
	['"ahead of" or "behind"', /\b(ahead of|behind (Jev|H2O|Quyet|Jeff|the leader|the board)|outperforms?|beats?|surpass(es)?)\b/i],
	['"level with" or "Jev-level"', /\b(level with|on par with|as accurate as|matches Jev|equal to Jev)\b|Jev-level/i],
	['"score higher"', /\bscores? (higher|lower)\b/i],
];
const COMPETITOR = /\bJev\b|Jev-|H2O|Quyet|Jeff|nimble|decider|Cygnet|Mercury|GLiDE|Surogate|other (systems|models)|the leading|open entr|leaderboard|JevBench's|the board/i;
const MULTIPLE = /\b(about )?\d+ times (as (long|fast|slow)|faster|slower|more)\b|\babout \d+ times\b/i;
// Words that read as a rank or a comparison but are not one, in this site's text.
const BENIGN = /first question|first read|first start|first sight|first paint|first step|first send|first published|first ten of \$|first week|your first|lower is better|higher is better|highest value in each|lowest confidence|lowest (to|first)|highest to lowest|more than (one|two|\d)|rather than|other than|less than|greater than|larger than (the|your)|longer than|later than|sooner than|top answer|top option|top probability|top-two|second engine|per second|seconds|second(s)? \(|half a second|in a second/i;

// decisio's own text at the pinned release, flattened, so a sentence quoted from it is recognised and left to it.
// Compared without white space or Markdown, with plain quotes: the page sets ’ and “ ” where decisio's text has ' and ", and
// a bold title runs into the sentence after it.
const flat = (t) => t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[`*>#|\s]/g, '').toLowerCase();
const walkUp = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walkUp(join(d, e.name)) : e.name.endsWith('.md') ? [join(d, e.name)] : []));
const upstream = flat(walkUp(upstreamRoot).map((f) => readFileSync(f, 'utf8')).join('\n'));
const fromUpstream = (sentence) => {
	const s = flat(sentence).replace(/[.;:,]+$/, '');
	return s.length >= 10 && upstream.includes(s);
};

// Every comparison with another system is on the benchmarks page, dated (decided 2026-10-18): the home page names one, the
// board's composite in its #board section, and the demos pages name none.
const OTHER_SYSTEM = /\b(Jev|H2O-Lightning|Quyet|Jeff-1|Cygnet|deck-31B|Gemini|GPT|Haiku|Luna|Surogate|OpenRouter)\b/i;
const OWN_RESULTS_ONLY = new Set(['/', '/demos/', '/demos/teach-and-certify/']);

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name === 'index.html' ? [join(d, e.name)] : []));
const problems = [];
let pages = 0;
for (const file of walk('dist')) {
	const route = `/${relative('dist', file).replace(/index\.html$/, '')}`;
	if (route === '/404/') continue;
	pages++;
	// A space between adjacent tags, so a card's number and its label read as two words ("66 times as long", not "timesas").
	const doc = parse(readFileSync(file, 'utf8').replace(/></g, '> <'), { blockTextElements: { script: false, style: false } });
	const texts = [doc.querySelector('title')?.text ?? '', doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '', doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? ''];
	const main = doc.querySelector('main');
	if (main) {
		main.querySelectorAll('pre, button, [data-history], .expressive-code, script, style').forEach((n) => n.remove());
		for (const img of main.querySelectorAll('img[alt]')) texts.push(img.getAttribute('alt'));
		for (const n of main.querySelectorAll('svg title, svg desc')) texts.push(n.text);
		// Each block's own text: a card, a cell, a paragraph or a list item, so a multiple is read with what stands beside it.
		for (const b of main.querySelectorAll('p, li, td, th, h1, h2, h3, h4, dt, dd, figcaption, summary, caption, svg text, .card3')) texts.push(b.structuredText);
	}
	if (main && OWN_RESULTS_ONLY.has(route)) {
		const own = parse(main.toString());
		own.querySelectorAll('#board').forEach((n) => n.remove());
		const seen = [own.structuredText, ...own.querySelectorAll('img[alt]').map((i) => i.getAttribute('alt')), ...own.querySelectorAll('svg title, svg desc').map((n) => n.text)].join(' ');
		const m = OTHER_SYSTEM.exec(seen);
		if (m) problems.push(`${route}: names another system ("${m[0]}") outside the benchmarks page: "${seen.slice(Math.max(0, m.index - 60), m.index + 60).replace(/\s+/g, ' ')}"`);
	}
	for (const block of texts) {
		const text = block.replace(/\s+/g, ' ').trim();
		if (!text) continue;
		for (const sentence of text.split(/(?<=[.!?])\s+(?=[A-Z"“(])/)) {
			if (fromUpstream(sentence)) continue;
			const s = sentence.replace(new RegExp(BENIGN.source, 'gi'), ' ');
			// A comparison is one with another system; a sentence about Decisio's own bases or settings is not one.
			const hit = [...(CONTEXT.test(s) ? RANK : []), ...(COMPETITOR.test(s) ? COMPARE : [])].find(([, re]) => re.test(s));
			if (hit) problems.push(`${route}: ${hit[0]}: "${sentence.slice(0, 150)}"`);
			// A multiple stands beside the times it is made of and their date.
			if (MULTIPLE.test(s) && !(/\d+(\.\d+)? s\b/.test(text) && /20\d\d-\d\d-\d\d/.test(text))) problems.push(`${route}: a multiple without its times and date beside it: "${sentence.slice(0, 150)}"`);
		}
	}
}
const unique = [...new Set(problems)];
if (unique.length) {
	console.error(`claims: ${unique.length} lines rank or compare (at ${pin.tag})\n  ${unique.join('\n  ')}`);
	process.exit(1);
}
console.log(`claims: ${pages} pages state measurements, not ranks or comparisons`);
