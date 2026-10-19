// The use-case recipes: each one's question, the script that routes on the certificate (verification/plan.mjs runs it on
// the CPU stand-in), the registration body that teaches and certifies it, and the measured result that proves it, read
// from its record (the teach-and-certify runs, decisio's EVAL_CARD.md and docs/demos/README.md at the pinned release).
// A record that stops saying a number stops the build.
import { data as tcData, baseName } from './teach-certify.mjs';
import { readUpstream } from './upstream.mjs';
import { facts } from './launch.mjs';
import { recordedValues } from './recorded.mjs';
import { runOf } from './bench-page.mjs';
import { setupLine } from './demos.mjs';

const fail = (what) => { throw new Error(`use-cases: ${what}`); };
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
const fmt = (n) => n.toLocaleString('en-US');
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The coding-agent gatekeeper's policy, as the demo ran it: each rule and its action.
const policy = () => tcData().gatekeeper.rules;

export const RECIPES = {
	'support-routing': {
		key: 'queue', type: 'choice', instructions: 'Which support queue should handle this ticket?',
		criteria: { billing: 'Invoices, charges, refunds', access: 'Login, passwords, permissions', bug: 'The product behaves wrongly', shipping: 'Orders and deliveries', other: 'Anything else' },
		text: 'My card was charged twice this month. Please refund one of the charges.',
		act: 'f"send to {answer[\'choice\']}"', person: 'f"to a person, {answer[\'choice\']} suggested"', label: 'billing',
	},
	gatekeeper: {
		key: 'rule', type: 'choice', instructions: 'Which of the team\'s rules covers this shell command?',
		get criteria() { return Object.fromEntries(policy().map((r) => [r.rule, null])); },
		text: 'rm -rf build/ && npm run build',
		get pre() { return `POLICY = {\n${policy().map((r) => `    "${r.rule}": "${r.action}",`).join('\n')}\n}\n\n`; },
		act: 'POLICY[answer["choice"]]', person: '"ask"', label: 'delete_in_workspace',
	},
	'issue-triage': {
		key: 'kind', type: 'choice', instructions: 'What kind of issue is this?',
		criteria: { bug: 'Something is broken', feature: 'A request for something new', docs: 'The documentation is wrong or missing', question: 'A question about how to use it', other: 'Anything else' },
		text: 'The scheduler crashes when a pod has no resource limits.',
		act: 'f"label {answer[\'choice\']}"', person: 'f"to a maintainer, {answer[\'choice\']} suggested"', label: 'bug',
	},
	guardrails: {
		key: 'toxic', type: 'noul', instructions: 'Is this message toxic: insulting, hateful, threatening or sexually explicit?',
		text: 'Thanks, that fixed it!',
		act: '"block" if answer["noul"] >= 0.5 else "allow"', person: '"to a moderator"', label: 'false',
	},
	'rag-gate': {
		key: 'answered', type: 'choice', instructions: 'Does the passage answer the question?',
		criteria: { yes: 'The passage answers the question', partly: 'It answers only part of it', no: 'It does not answer it' },
		text: 'Question: How long is the warranty?\\nPassage: Every product comes with a two-year warranty from the date of purchase.',
		act: '{"yes": "answer from the passage", "partly": "answer, and say what is missing", "no": "say it is not in the documents"}[answer["choice"]]', person: '"to a larger model or a person"', label: 'yes',
	},
	'document-classification': {
		key: 'type', type: 'choice', instructions: 'What type of document is this?',
		criteria: { invoice: 'A bill asking for payment', contract: 'An agreement between parties', purchase_order: 'An order placed with a supplier', receipt: 'A proof of payment', other: 'Anything else' },
		text: 'INVOICE No. 2026-117. Amount due: 1,240.00 EUR by 30 November.',
		act: 'f"file as {answer[\'choice\']}"', person: '"to a person"', label: 'invoice',
	},
};

const recipe = (id) => RECIPES[id] ?? fail(`no recipe "${id}"`);
const question = (r) => ({ type: r.type, instructions: r.instructions, ...(r.criteria ? { criteria: r.criteria } : {}) });

/** The script that asks the question and routes on the certificate: certified answers act, the rest go to a person. */
export function routeScript(id) {
	const r = recipe(id);
	const q = JSON.stringify(question(r), null, 4).replace(/: null/g, ': None');
	return `import json
import urllib.request

${r.pre ?? ''}QUESTION = ${q}


def route(text):
    request = urllib.request.Request(
        "http://127.0.0.1:8000/v1/systemone",
        data=json.dumps({"state": text, "questions": {"${r.key}": QUESTION}}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request) as response:
        answer = json.load(response)["answers"]["${r.key}"]
    # A certified answer acts on its own; anything else goes to a person.
    if answer.get("certified"):
        return ${r.act}
    return ${r.person}


print(route("${r.text}"))`;
}

/** The registration that teaches the question from your labelled examples and certifies it at 5%. */
export function teachBody(id) {
	const r = recipe(id);
	return `POST /v1/tasks
{"id": "${id}",
 "examples": [{"request": {"state": "<a past ${id === 'rag-gate' ? 'question and passage' : 'item'} of yours>", "questions": {"${r.key}": <the question above>}},
               "answer": ${r.type === 'noul' ? r.label : `"${r.label}"`}},
              ...],
 "certify": {"alpha": 0.05}}`;
}

// --- The proofs ---------------------------------------------------------------------------------------------------------

const card = () => readUpstream('EVAL_CARD.md');
// The 31B's row of the 1,400-item suite, as section 7.2 of the evaluation card gives it.
export function suite31() {
	const rows = [...card().matchAll(/^\| 1,400-item suite, accuracy \/ ECE \| (.*) \|/gm)];
	if (rows.length !== 3) fail('EVAL_CARD.md no longer has the suite row of each base');
	const row = rows[2][1];
	const read = (name) => {
		const m = new RegExp(`${name} (0\\.\\d+) / (0\\.\\d+)`).exec(row) ?? fail(`EVAL_CARD.md's 31B suite row no longer gives ${name}`);
		return { acc: Number(m[1]), ece: Number(m[2]) };
	};
	return { read };
}


// --- Issue triage: the run on kubernetes/kubernetes, in the launch facts (teaching.issue_triage) --------------------------

/** The 31B's results on the four issue questions: untaught, and the largest change teaching made. */
export function issueTriage() {
	const t = facts().teaching?.issue_triage ?? fail('launch_facts.public.json has no teaching.issue_triage');
	const b = t.by_base?.gemma_4_31b ?? fail('teaching.issue_triage has no gemma_4_31b');
	const set = (q) => b[q] ?? fail(`teaching.issue_triage.by_base.gemma_4_31b has no ${q}`);
	const [kind, sig, prio, ni] = ['kind', 'sig', 'priority', 'needs_info'].map(set);
	if (ni.score_name !== 'balanced_accuracy') fail('needs-information is no longer scored by balanced accuracy');
	if (sig.options !== 12 || !/owning SIG/.test(sig.question)) fail('the second question is no longer the owning SIG over 12 options');
	// "Works out of the box": every taught arm within a point of untaught, except the owning SIG at 1,000 examples.
	for (const x of [kind, sig, prio, ni]) {
		for (const [n, arm] of Object.entries(x.taught)) {
			const change = Math.abs(arm.accuracy.value - x.untaught.accuracy.value) * 100;
			if (!(x === sig && n === 'n1000') && change >= 1) fail(`teaching moved ${x.question} by ${change.toFixed(1)} points at ${n}; the page says under a point`);
		}
	}
	const sig1000 = sig.taught.n1000 ?? fail('the owning SIG has no 1,000-example arm');
	const niTaught = Object.values(ni.taught);
	if (!niTaught.every((a) => a.score.value <= ni.untaught.score.value)) fail('teaching no longer lowers needs-information on the 31B');
	const p = (x) => `${x.printed}%`;
	return {
		t, kind, sig, prio, ni, sig1000,
		values: {
			'triage-kind': p(kind.untaught.accuracy),
			'triage-sig': p(sig.untaught.accuracy),
			'triage-priority': p(prio.untaught.accuracy),
			'triage-needs-info': p(ni.untaught.score),
		},
	};
}

// --- How many labelled examples a recipe needs -------------------------------------------------------------------------

/**
 * The fewest labelled examples a recipe can be certified from at 5%: the server holds back half of them (docs/tasks.md,
 * "half by default"), a 5% certificate needs 59 held back (docs/tasks.md's table at the default 90%), and the half it
 * teaches from needs 10 per option for the intent head (the README). A yes/no question has no intent head.
 */
export function floor(id) {
	const tasks = readUpstream('docs/tasks.md');
	const held = Number((/^\| 0\.05 \| (\d+) \| \d+ \|$/m.exec(tasks) ?? fail("docs/tasks.md's table no longer gives the fewest held-back examples at 0.05"))[1]);
	if (!/\(half by default\)/.test(tasks)) fail('docs/tasks.md no longer says the server holds back half the examples');
	const per = Number((/\((\d+) per option for the intent head, and \d+ held out to certify at the defaults/.exec(readUpstream('README.md')) ?? fail('the README no longer says how many examples per option the intent head needs'))[1]);
	const r = recipe(id);
	const options = r.type === 'noul' ? 0 : Object.keys(r.criteria).length;
	const total = 2 * Math.max(held, per * options);
	return { held, per, options, total };
}

const FLOOR_NOUN = { 'support-routing': 'tickets', gatekeeper: 'commands', 'issue-triage': 'issues', guardrails: 'messages', 'rag-gate': 'question and passage pairs', 'document-classification': 'documents' };

/** The recipe's floor in one sentence. */
const floorSentence = (id) => {
	const f = floor(id);
	const noun = FLOOR_NOUN[id] ?? fail(`no noun for ${id}'s examples`);
	const teach = f.options && f.per * f.options > f.held ? `; the other half teaches, at ${f.per} per option for this question's ${f.options} options` : '';
	return `Send at least ${f.total.toLocaleString('en-US')} labelled ${noun}. The server holds back half to certify, and a 5% certificate needs ${f.held} of those${teach}. More examples certify a larger share.`;
};

/** A value a page names in its own words, read from its record (`:value{name="..."}`). */
export function value(name) {
	const ib = tcData().inbox;
	const t5 = ib.targets['0.05'] ?? fail('the inbox has no 5% certificate');
	const others = { 'inbox-certified-5': pct(t5.covered / ib.test_n) };
	for (const id of Object.keys(RECIPES)) others[`floor-${id}`] = floorSentence(id);
	const v = { ...issueTriage().values, ...others, ...recordedValues() }[name];
	if (v === undefined) fail(`no value "${name}"`);
	return v;
}

const PROOFS = {
	'support-routing': () => {
		const d = tcData();
		const ib = d.inbox;
		const t = ib.targets['0.05'] ?? fail('the inbox has no 5% certificate');
		const triage = /^\| Gemma 4 31B \| ([\d.]+)% \[[^\]]+\] \| ([\d.]+)% \[/m.exec(readUpstream('docs/demos/README.md')) ?? fail("docs/demos/README.md's triage table has no 31B row");
		return [
			`<b>${pct(t.covered / ib.test_n)}</b> of a support inbox's messages answered on their own at a 5% error target, ${pct(t.errors / t.covered)} of them wrong: BANKING77's 77 intents, ${baseName(ib.model)} taught with ${ib.k} examples per intent, ${fmt(ib.test_n)} test messages, decisio ${d.decisio}, ${d.dates[0]}.`,
			`<b>${triage[1]}%</b> of 400 held-out tickets routed right over 20 queues by ${baseName('g31')} with the plain question, and ${triage[2]}% after teaching it from 200 labelled tickets: decisio's triage demo, decisio ${setupLine().version}, one RTX PRO 6000, ${setupLine().date}.`,
		];
	},
	gatekeeper: () => {
		const d = tcData();
		const g = d.gatekeeper;
		return [
			`<b>${pct(g.at5.share[0], 0)} to ${pct(g.at5.share[1], 0)}</b> of a coding agent's shell commands decided on their own at a 5% error target, with the wrong action on ${pct(g.at5.wrong_action[0])} to ${pct(g.at5.wrong_action[1])} of them: ${g.rules.length} rules, ${baseName(g.model)} on a Mac (${d.models[g.model].build}), taught with ${g.per_rule} labelled commands per rule, ${g.draws} draws, ${fmt(g.test_n)} test commands, decisio ${g.decisio}, ${g.dates[0]}.`,
			`When a kind of command no rule names rose to ${pct(g.drift.new_kind_share, 0)} of the traffic, none of its ${g.drift.new_kind} commands was certified.`,
		];
	},
	guardrails: () => {
		const tox = suite31().read('ToxicChat');
		return [
			`<b>${pct(tox.acc)}</b> right on ToxicChat's toxicity question, with a calibration error of ${tox.ece}, on ${baseName('g31')}, untaught, in decisio's 1,400-item suite: ${runOf('gemma-4-31b')} (its evaluation card, section 7.2). The model's default settings were tuned on that same suite, so that calibration error is its best case.`,
			'Other guardrails, such as off-topic or prompt-injection checks, follow the same recipe; no run of them is published.',
		];
	},
	'rag-gate': () => {
		const s = suite31();
		const sci = s.read('SciFact');
		const bool = s.read('BoolQ');
		return [
			`<b>${pct(sci.acc)}</b> right on SciFact, does the evidence support the claim, and <b>${pct(bool.acc)}</b> on BoolQ, yes or no over a passage, on ${baseName('g31')}, untaught, in decisio's 1,400-item suite: ${runOf('gemma-4-31b')} (its evaluation card, section 7.2).`,
			'Those measure the reading, not a whole retrieval pipeline: no end-to-end run of this gate is published.',
		];
	},
	'issue-triage': () => {
		const { t, kind, sig, prio, ni, sig1000 } = issueTriage();
		const p = (x) => `${x.printed}%`;
		return [
			`<b>${p(kind.untaught.accuracy)}</b> right on the kind of an issue (macro-F1 ${p(kind.untaught.score)}) and <b>${p(sig.untaught.accuracy)}</b> on its owning SIG, the ${sig.options} most frequent (macro-F1 ${p(sig.untaught.score)}), by Gemma 4 31B, untaught, on ${fmt(kind.test_items)} real kubernetes/kubernetes issues.`,
			`It works out of the box: teaching changed accuracy by under a point, except on the owning SIG at ${fmt(sig1000.examples)} examples, ${p(sig.untaught.accuracy)} to ${p(sig1000.accuracy)} (macro-F1 ${p(sig.untaught.score)} to ${p(sig1000.score)}).`,
			`Priority is ${p(prio.untaught.accuracy)} right, and needs-information has a balanced accuracy of ${p(ni.untaught.score)}, which teaching lowers slightly.`,
			`These figures are ${t.reporting_sentence}.`,
			esc(t.licence_line),
		];
	},
	'document-classification': () => ['A recipe: decisio is measured on short texts, such as the intent sets of the support inbox; no run on long documents is published.'],
};

/** The measured result of a recipe, as a list. */
export function proofHtml(id) {
	const p = (PROOFS[id] ?? fail(`no proof for "${id}"`))();
	return `<ul class="proof">${p.map((x) => `<li>${x}</li>`).join('')}</ul>`;
}

export const recipeIds = Object.keys(RECIPES);
