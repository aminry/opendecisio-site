// The home page's content (src/pages/index.astro): the hero's three numbers and their one conditions line, the teaching
// story told on one task (the support inbox, BANKING77 on the Gemma 4 31B), the threshold line on the same task's
// certificates, the use-case cards and the Get started blocks. Every number is read from its record here, and a record
// that stops saying it stops the build. The Good fit box's sentences are checked by src/config/sourced.mjs.
import { facts, need2, singleQuestion, stable } from './launch.mjs';
import { ALPHAS, baseName, data as tcData, datasetName, task } from './teach-certify.mjs';
import { siteBlock } from './site-blocks.mjs';
import { readUpstream } from './upstream.mjs';
import { issueTriage, recipeIds, suite31 } from './use-cases.mjs';
import { runOf } from './bench-page.mjs';

const fail = (what) => { throw new Error(`home-page: ${what}`); };
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
const fmt = (n) => n.toLocaleString('en-US');

/**
 * The hero's numbers: one question about a new 300-token text (figures.latency_on_new_state_300), and 50 questions about
 * a 3,000-token and a 32,000-token document (figures.same_box_speed), all on the Gemma 4 31B, with one line that says
 * where each was measured. The release of the same-box session is the README's own line for it.
 */
export function heroStats() {
	const m = facts().figures?.same_box_speed;
	const ours = m?.systems?.[0];
	need2(ours && /31B/.test(ours.system), 'has a same_box_speed whose first system is not the Gemma 4 31B');
	const printed = (k) => {
		const c = ours.cells50?.[k];
		need2(c?.printed && typeof c.seconds?.value === 'number', `has no 50-question cell at ${k} tokens for the 31B`);
		return c.printed.replace(/ \(\d+\)$/, '');
	};
	const one = singleQuestion();
	const release = /^- decisio (v[\d.]+) on vLLM [\d.]+ \(the 31B and the 12B at their repositories' pins\)/m.exec(readUpstream('README.md'))?.[1];
	if (!release) fail("the README no longer names the decisio release of the same-box session");
	const date = stable('speed_same_box_2026_10_11').date;
	// The first figure's run, by its record's name (runs/2026-10-06_latency-585w/, in the facts' conditions).
	const firstDate = /runs\/(\d{4}-\d{2}-\d{2})_latency/.exec(facts().figures.latency_on_new_state_300.conditions)?.[1];
	if (!firstDate) fail('the one-question figure no longer names its dated record');
	const tokens = (k) => `${Number(k).toLocaleString('en-US')}-token`;
	return {
		stats: [
			{ n: `${one.ms} ms`, l: 'for one question about a new 300-token text' },
			{ n: printed('3000'), l: `for 50 questions about a ${tokens('3000')} document` },
			{ n: printed('32000'), l: `for 50 questions about a ${tokens('32000')} document` },
		],
		conditions: `Server time on Gemma 4 31B and one RTX PRO 6000, on the plain layout: the first on decisio 0.8.1 at 585 W, on ${firstDate}; the other two on decisio ${release} at 600 W, on ${date}.`,
	};
}

/**
 * The teaching story, on one task end to end: BANKING77's support inbox on the Gemma 4 31B, taught with 10 examples per
 * intent and certified at most 5% wrong (teach_certify.json). The dots are the inbox's seeded sample of test messages,
 * each certified when its confidence is at or above the certificate's threshold, as the teach-and-certify page splits them.
 */
export function inboxStory() {
	const d = tcData();
	const ib = d.inbox;
	const t = task(ib.model, ib.dataset, ib.k, ib.draw);
	const cert = ib.targets['0.05'] ?? fail('the inbox has no 5% certificate');
	if (cert.threshold === null) fail('the inbox certified nothing at 5%');
	const answers = ib.messages.map((msg) => ({ top: msg.conf, certified: msg.conf >= cert.threshold, right: msg.answer === msg.gold })).sort((a, b) => b.top - a.top);
	const certified = answers.filter((a) => a.certified);
	if (ib.teach_n !== ib.k * ib.labels.length) fail(`the inbox taught ${ib.teach_n} examples, not ${ib.k} for each of its ${ib.labels.length} intents`);
	return {
		learn: { task: datasetName(ib.dataset), labels: ib.labels.length, base: baseName(ib.model), examples: ib.teach_n, perLabel: ib.k, before: t.untaught, after: t.accuracy },
		certify: { task: `${datasetName(ib.dataset)}'s test messages`, base: baseName(ib.model), answers, n: answers.length, certified: certified.length, wrong: certified.filter((a) => !a.right).length, threshold: cert.threshold, alpha: 0.05 },
		source: `${datasetName(ib.dataset)}'s test split, ${baseName(ib.model)} from ${d.models[ib.model].build} on ${d.models[ib.model].machine.replace(/ \(.*\)$/, '')}, decisio ${d.decisio}, ${d.dates[0]}`,
	};
}

/** The threshold line: the share of the same inbox answered on its own at each error rate, and how many of those were wrong. */
export function thresholdLine() {
	const d = tcData();
	const ib = d.inbox;
	const stops = ALPHAS.map((a) => {
		const t = ib.targets[a] ?? fail(`the inbox has no ${a} certificate`);
		return { alpha: Number(a), covered: t.covered, errors: t.errors, n: ib.test_n };
	});
	return { stops, start: 0.05, delta: d.delta, n: ib.test_n };
}

// The use-case cards: each page's title, what it decides (the index's table) and, where a run is published, one number.
const CARDS = {
	'support-routing': { title: 'Support routing', line: 'Send each ticket to the right queue.' },
	gatekeeper: { title: 'Coding-agent gatekeeper', line: "Allow, ask or block an agent's shell command, by your rules." },
	'issue-triage': { title: 'Issue triage', line: 'Label the kind of a new issue and its owning team.' },
	guardrails: { title: 'Guardrails', line: 'Flag a message that breaks a policy.' },
	'rag-gate': { title: 'RAG: answer or abstain', line: 'Answer only when a retrieved passage answers the question.' },
	'document-classification': { title: 'Document classification', line: 'Sort incoming documents by type.' },
};

/** The six cards, in the index's order, each with its one proof figure (or what stands for it). */
export function useCaseCards() {
	const g = tcData().gatekeeper;
	const { kind, run } = issueTriage();
	const suite = suite31();
	// Each card's figure, and its source note (the release, model and card or date it was measured on), apart from it.
	const proof = {
		'support-routing': ['Measured: the support inbox above.'],
		gatekeeper: [`${pct(g.at5.share[0], 0)} to ${pct(g.at5.share[1], 0)} of commands decided on their own at a 5% error rate.`, `Gemma 4 12B on a Mac, decisio ${g.decisio}, ${g.dates.join(' and ')}`],
		'issue-triage': [`${kind.untaught.accuracy.printed}% right on an issue's kind, untaught, on ${kind.test_items.toLocaleString('en-US')} kubernetes issues.`, `Gemma 4 31B, ${run.label}`],
		guardrails: [`${pct(suite.read('ToxicChat').acc)} right on ToxicChat's toxicity question.`, `Gemma 4 31B, ${runOf('gemma-4-31b')}`],
		'rag-gate': [`${pct(suite.read('SciFact').acc)} right on SciFact's claims and their evidence.`, `Gemma 4 31B, ${runOf('gemma-4-31b')}`],
		'document-classification': ['A recipe: no run on documents is published yet.'],
	};
	const ids = Object.keys(CARDS);
	if (JSON.stringify(ids) !== JSON.stringify(recipeIds)) fail('the use-case cards are not the recipes, in their order');
	return ids.map((id) => ({ id, href: `/docs/use-cases/${id}/`, ...CARDS[id], proof: proof[id][0], source: proof[id][1], measured: id !== 'document-classification' }));
}

/**
 * The Get started tabs, each a block that runs from a clean machine of its kind, and the one request and answer under them.
 * The blocks are the deploy guides' own (src/lib/site-blocks.mjs, decisio's docs/running.md), so verification/plan.mjs
 * checks them as the same text; the Mac tab joins the Mac guide's install and its default model's start.
 */
export function homeBlocks() {
	const ollama = /^## Ollama\n+```bash\n([\s\S]*?)\n```/m.exec(readUpstream('docs/running.md'))?.[1] ?? fail("docs/running.md's Ollama section no longer opens with its pull block");
	return {
		tabs: [
			{ id: 'gpu', label: 'Cloud GPU', note: 'Linux with one NVIDIA card.', blocks: [siteBlock('gpu-pip').text], href: '/docs/deploy/cloud-gpu/', guide: 'On a cloud GPU' },
			{ id: 'docker', label: 'Docker', note: 'A GPU host with Docker and the NVIDIA Container Toolkit.', blocks: [siteBlock('docker-run').text], href: '/docs/deploy/docker/', guide: 'With Docker' },
			{ id: 'mac', label: 'Mac', note: 'A Mac with Apple silicon; the guide says which build fits yours.', blocks: [`${siteBlock('mac-install').text}\n${siteBlock('mac-31b-6bit').text}`], href: '/docs/deploy/mac/', guide: 'On a Mac' },
			{ id: 'ollama', label: 'Ollama', note: 'A quick try on a laptop. Ollama builds its own prompt, so its numbers are not the ones on this page.', blocks: [ollama, siteBlock('ollama-request-gemma').text], href: '/docs/deploy/mac/#on-a-laptop-with-ollama', guide: 'With Ollama' },
		],
		request: siteBlock('first-decision-request').text,
		response: siteBlock('first-decision-response').text,
	};
}

/** Every block the home page shows, in page order, for src/lib/blocks.mjs. */
export function homeBlockTexts() {
	const b = homeBlocks();
	return [...b.tabs.flatMap((t) => t.blocks), b.request, b.response];
}

export { fmt, pct };
