// What the home page says, read from decisio at the pinned tag. Every number
// on the home page comes through here, so each has one upstream source.
import { code, inlineHtml, listItems, paragraph, paragraphStarting, paragraphText, sectionNodes, table, tree } from './upstream-content.mjs';
import { toString } from 'mdast-util-to-string';
import { commentsAbove } from './text.mjs';
import { pin, readUpstream } from './upstream.mjs';

const README = 'README.md';

/** The README's title, the heading the opening paragraphs sit under. */
function readmeTitle() {
	return toString(tree(README).children.find((n) => n.type === 'heading' && n.depth === 1));
}

/** The README's first sentence: what the project is. */
export function oneSentence() {
	// The first paragraph that names the project (the one before it holds the badges).
	const title = readmeTitle();
	const p = sectionNodes(README, title).find((n) => n.type === 'paragraph' && toString(n).startsWith(title));
	if (!p) throw new Error('home: the README no longer opens with a sentence naming the project');
	return toString(p).split('\n')[0];
}

/** The three bases, with their checkpoints and provenance. */
export function bases() {
	const t = table(README, 'Choosing a base', 0);
	return t.rows.map(([base, checkpoint, provenance]) => ({ base, checkpoint, provenance }));
}

/**
 * "In plain words": when to choose each base. One entry per base, found by the
 * base's name at the start of its item (the README's own words, not a position):
 * `lead` is the first line, `rest` the lines after it in the same paragraph and
 * `sub` the item's sub-bullets.
 */
export function guidance() {
	const list = sectionNodes(README, 'Choosing a base').find((n) => n.type === 'list');
	if (!list) throw new Error('home: the README "Choosing a base" no longer has its list of when to choose each base');
	return list.children.map((item) => {
		const [lead, ...rest] = inlineHtml(item.children[0]).split('\n');
		const sub = item.children.filter((c) => c.type === 'list').flatMap((l) => l.children.map((li) => inlineHtml(li.children[0])));
		return { lead: lead.replace(/<\/?strong>/g, ''), rest, sub, text: [lead, ...rest].join(' ').replace(/<[^>]+>/g, '') };
	});
}

/** The guidance entry for a `--base` flag: the item that starts with the base's name. */
export function guidanceFor(flag) {
	const key = flag.replace(/-/g, ' ').toLowerCase();
	const found = guidance().find((g) => g.text.replace(/-/g, ' ').toLowerCase().startsWith(key));
	if (!found) throw new Error(`home: the README's "Choosing a base" has no item that starts with ${flag}`);
	return found;
}

/**
 * The sentences the README's Benchmarks section keeps beside its tables, found by their opening words, not their
 * position (v0.11.1 rewrote the section: the "Where it stands" paragraph is gone, and its intent-heads, calibration
 * and evaluation-card sentences now sit in the paragraph after the comparison link).
 */
function standingLines() {
	const lines = sectionNodes(README, 'Benchmarks')
		.filter((n) => n.type === 'paragraph')
		.flatMap((n) => inlineHtml(n).split('\n'));
	const plain = (l) => l.replace(/<[^>]+>/g, '');
	const pick = (re, what) => {
		const l = lines.find((x) => re.test(plain(x)));
		if (!l) throw new Error(`home: the README's Benchmarks section no longer has its sentence on ${what}`);
		return l;
	};
	return {
		heads: pick(/^(The )?[Ii]ntent heads use labelled examples/, 'the intent heads'),
		calibration: pick(/^Calibration on JevBench/, 'calibration'),
		card: pick(/(EVAL_CARD\.md|Evaluation card) has the full tables/, 'the evaluation card'),
	};
}

/** The benchmarks table, split into the speed rows and the accuracy rows. */
export function benchmarks() {
	const t = table(README, 'Benchmarks', 0);
	const isSpeed = (row) => /server time/.test(row[0]);
	return {
		head: t.head,
		speed: t.rows.filter(isSpeed),
		accuracy: t.rows.filter((row) => !isSpeed(row)),
		// The README's records sentence; its "Measured privately" line is restated as self-run (selfRun below).
		source: sourceLines(),
		standing: standingLines(),
		// From 0.8.0: where the latency rows were measured, and how much the host matters.
		latency: paragraphStarting(README, 'Benchmarks', 'The latency rows', { optional: true })?.split('\n') ?? [],
	};
}

/** The README's example request, and the response it recorded. */
export function firstRequest() {
	const response = JSON.parse(code(README, 'Ask a question', 1));
	return {
		request: code(README, 'Ask a question', 0),
		response: response.answers,
		recorded: paragraphStarting(README, 'Ask a question', 'Response,'),
	};
}

/** The install chooser: machine, path, memory needed. */
export function machines() {
	const t = table(README, 'Install and run', 0);
	return t.rows.map(([machine, path, memory]) => ({ machine, path, memory }));
}

/**
 * What the home page's laptop path says about Ollama: the pull commands, the
 * version it needs, which listing suits which machine and what Ollama leaves
 * out, from decisio's README and docs/running.md at the pinned release, and
 * the caveat on how far the Gemma listing's memory was measured, from the run
 * record's summary.md (the docs do not state it).
 */
/** A run record named in body copy becomes a short link on the word "record", to the same place. */
export const shortRecord = (html) => html.replace(/<a ([^>]*)><code>runs\/[^<]*<\/code><\/a>/g, '<a $1>record</a>');

export function laptop() {
	if (!code(README, 'Ollama', 0).includes('aminroudaki/decisio-gemma')) throw new Error('home: the pinned release does not document the Gemma Ollama listing (decisio #106); the home page offers it');
	const lines = (start) => paragraphStarting(README, 'Ollama', start).split('\n');
	const find = (ls, re, what) => {
		const l = ls.find((x) => re.test(x.replace(/<[^>]+>/g, '')));
		if (!l) throw new Error(`home: the Ollama section no longer has its sentence on ${what}`);
		return l;
	};
	const readme = lines('Requires Ollama');
	const options = listItems('docs/running.md', 'Ollama', 0);
	if (options.length !== 2 || !/16 GB laptops/.test(options[0])) throw new Error('home: docs/running.md "Ollama" no longer lists the Gemma and Qwen listings in that order; revisit laptop()');
	// The record the Gemma line cites says how far its figures reach.
	const record = options[0].match(/<code>(runs\/[^<]+)<\/code>/)?.[1];
	if (!record) throw new Error('home: the Gemma line of docs/running.md no longer names its run record');
	const summary = `${record.replace(/\/$/, '')}/summary.md`;
	const caveat = tree(summary).children.filter((n) => n.type === 'paragraph').flatMap((n) => toString(n).split('\n')).find((l) => /^It was measured on/.test(l));
	if (!caveat) throw new Error(`home: ${summary} no longer says how far its measurement reaches; revisit laptop()`);
	return {
		pull: commentsAbove(code(README, 'Ollama', 0)),
		requires: find(readme, /^Requires Ollama/, 'the version it needs'),
		options: [shortRecord(`${options[0]} ${caveat}`), options[1]],
		caveat,
		own: find(readme, /^Ollama builds its own prompt/, 'its own prompt and numbers'),
	};
}

/** The commands of each install path. */
export function install(heading) {
	return code(README, heading, 0);
}

/** The demo clips the README shows, with their captions. */
export function clips() {
	const t = table(README, 'Watch it play', 0);
	// Below an empty header, the table alternates a row of GIFs and a row of captions.
	const out = [];
	const rows = t.rows;
	for (let r = 0; r < rows.length; r += 2) {
		rows[r].forEach((cell, i) => {
			const gif = cell.match(/src="([^"]+)"/)?.[1];
			const caption = rows[r + 1]?.[i] ?? '';
			if (!gif) return;
			const name = gif.split('/').pop().replace(/\.gif$/, '');
			out.push({ name, caption: caption.replace(/\s*\(<a[^)]*<\/a>\)\s*$/, '') });
		});
	}
	return out;
}

export function sectionText(file, heading) {
	return sectionNodes(file, heading).map((n) => toString(n));
}

/** The example request's JSON body, from the curl command in the README. */
export function requestBody() {
	const command = code(README, 'Ask a question', 0);
	const body = command.match(/-d '([\s\S]*)'\s*$/)?.[1];
	if (!body) throw new Error('home: the README example no longer has a -d body');
	return JSON.parse(body);
}

/** The record each Benchmarks column comes from, as the README's sentence under the table names them. */
export function benchmarkRecords() {
	const text = paragraphText(README, 'Benchmarks', 0);
	if (!text.startsWith('Each base with its own defaults')) throw new Error('home: the README Benchmarks section no longer opens with its records sentence');
	const m = text.match(/the Qwen and Gemma 4 12B bases in one session \((runs\/[^)]+)\), Gemma 4 31B in its own \((runs\/[^)]+)\), image input in another \((runs\/[^)]+)\)/);
	if (m) return { 'qwen3.6-35b-a3b': m[1], 'gemma-4-12b': m[1], 'gemma-4-31b': m[2], image: m[3] };
	// From 0.12.0 the README names only runs/; each base's record is where the evaluation card says its numbers come from.
	const card = readUpstream('EVAL_CARD.md');
	const shared = /one session on one card \(\d{4}-\d{2}-\d{2}, `(runs\/[^`]+\/)`\), where the Qwen base was measured beside it/.exec(card);
	const own = /one session on one card \(\d{4}-\d{2}-\d{2}, `(runs\/[^`]+gemma-4-31b[^`]*\/)`\)/.exec(card);
	const image = /^\| Image input,[^\n]*?`(runs\/[^`/]+\/)/m.exec(card);
	if (!shared || !own || !image) throw new Error('home: neither the README Benchmarks sentence nor the evaluation card names the benchmark records in the expected form; update benchmarkRecords()');
	return { 'qwen3.6-35b-a3b': shared[1], 'gemma-4-12b': shared[1], 'gemma-4-31b': own[1], image: image[1] };
}

/** How the site states what the Benchmarks figures are, where the README calls them private runs. */
const selfRunSentence = 'These are self-runs with the public harnesses, not board scores.';
export let selfRun = '';

/** The README's records sentences; a "Measured privately" line is replaced by the site's self-run sentence. */
function sourceLines() {
	const lines = paragraphStarting(README, 'Benchmarks', 'Each base with its own defaults').split('\n');
	const kept = lines.filter((l) => !/^Measured privately/.test(l.replace(/<[^>]+>/g, '')));
	selfRun = kept.length < lines.length ? selfRunSentence : '';
	return kept;
}
