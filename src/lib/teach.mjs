// The home page's "Teach it your task" section: what teaching a task and certifying its answers did, as measured, on
// two tasks, each named where it is shown:
// - learning: the Gemma 4 31B's intent heads after 10 labelled examples per intent, from the launch facts'
//   launch_facts.public.json teaching.intent_heads.gemma_4_31b (decisio's own records), checked against what the pinned release
//   prints (EVAL_CARD.md section 7.2 and the README's Benchmarks table); each quote keeps "after 10 labelled examples per
//   intent", the draws and the test items, as the block's rules ask;
// - certifying: the three-queue support-ticket task on the Gemma 4 12B on a Mac, docs/tasks.md's worked example: its
//   certificate from teaching.certified_example, checked against the docs, and the 200 answers on further tickets from
//   the run's record (runs/2026-10-14_certified-answers/results/mac_mlx/first_start_answers.json), which the docs state
//   and the facts' block does not carry.
// The project's own teach-it numbers (teaching.by_base) are not public yet; the slider shows the two
// measured amounts until they are.
import { facts } from './launch.mjs';
import { readUpstream } from './upstream.mjs';

const fail = (what) => { throw new Error(`teach: ${what}`); };
const must = (source, re, what) => re.exec(source) ?? fail(`the pinned release no longer says ${what}`);
const v = (x) => (x && typeof x === 'object' && 'value' in x ? x.value : x);
const same = (a, b, what) => { if (Math.abs(a - b) > 5e-4) fail(`${what}: launch_facts.public.json has ${a}, the release prints ${b}`); };

/** The 31B's intent heads as the release prints them (EVAL_CARD.md section 7.2 and the README's Benchmarks table, which must
 * agree), and the Qwen base's from docs/tasks.md. */
export function intentRows() {
	const card = readUpstream('EVAL_CARD.md');
	const m = must(card, /Intent heads from 10 labelled examples per intent \| BANKING77 (0\.\d+) \(plain readout (0\.\d+)\), CLINC150 (0\.\d+) \((0\.\d+)\), means of three draws; registration (\d+) s and (\d+) s/, 'the 31B\'s intent heads against its plain readout');
	const readme = readUpstream('README.md');
	const r = must(readme, /^\| Intent heads, BANKING77 \/ CLINC150 \| [^|]*\| [^|]*\| (0\.\d+) \/ (0\.\d+) \|$/m, 'the intent-head row of the README\'s Benchmarks table');
	if (r[1] !== m[1] || r[2] !== m[3]) fail('the README\'s intent-head row and the evaluation card\'s disagree about the 31B');
	const tasks = readUpstream('docs/tasks.md');
	const q = [...tasks.matchAll(/\| (BANKING77|CLINC150) intent accuracy \((\d+) options\) \| (0\.\d+) \| \*\*(0\.\d+)\*\*; \+(\d+\.\d) points \[\+(\d+\.\d), \+(\d+\.\d+)\]/g)];
	if (q.length !== 2) fail('docs/tasks.md no longer has its two intent rows');
	return {
		sets: [
			{ name: 'BANKING77', options: 77, plain: Number(m[2]), head: Number(m[1]), seconds: Number(m[5]) },
			{ name: 'CLINC150', options: 150, plain: Number(m[4]), head: Number(m[3]), seconds: Number(m[6]) },
		],
		qwen: q.map((x) => ({ name: x[1], plain: x[3], head: x[4], gain: x[5], lo: x[6], hi: x[7] })),
	};
}

/** The 31B's intent heads, from the facts' teaching block, each set checked against the release's printed figures. */
function heads() {
	const t = facts().teaching ?? fail('launch_facts.public.json has no teaching block');
	const g = t.intent_heads?.gemma_4_31b ?? fail('launch_facts.public.json has no teaching.intent_heads.gemma_4_31b');
	const per = v(g.examples_per_intent);
	const { sets } = intentRows();
	return sets.map((s) => {
		const h = g[s.name.toLowerCase()] ?? fail(`teaching.intent_heads.gemma_4_31b has no ${s.name}`);
		const row = { name: s.name, options: s.options, plain: v(h.plain), taught: v(h.taught), draws: v(h.draws), items: v(h.test_items), seconds: v(h.registration_seconds), per, wording: h.wording };
		same(row.plain, s.plain, `${s.name} plain accuracy`);
		same(row.taught, s.head, `${s.name} accuracy after ${per} examples per intent`);
		if (row.seconds !== s.seconds) fail(`${s.name} registration time: launch_facts.public.json has ${row.seconds} s, the release prints ${s.seconds} s`);
		if (!row.wording?.includes(`after ${per} labelled examples per intent`) || !row.wording.includes(`${row.draws} draws`) || !row.wording.includes(`${row.items} test items`)) fail(`the ${s.name} wording no longer carries the examples, draws and test items`);
		return row;
	});
}

/** The 31B's intent heads per set (untaught and taught accuracy, draws, test items, registration time), for the docs. */
export const taskGains = () => heads();

/** The answers, most confident first, with the counts the page states. */
function certifyFrom(answers, meta) {
	const sorted = [...answers].sort((a, b) => b.top - a.top);
	const certified = sorted.filter((a) => a.certified);
	// A certified answer is one above the threshold: in the sorted list they come first, with no gap.
	if (sorted.slice(0, certified.length).some((a) => !a.certified)) fail('the certified answers are not the most confident ones');
	return { ...meta, answers: sorted, n: sorted.length, certified: certified.length, wrong: certified.filter((a) => !a.right).length };
}

function build() {
	const sets = heads();
	const banking = sets.find((s) => s.name === 'BANKING77');

	// The worked example: its certificate, as the facts' block and docs/tasks.md give it, and its 200 answers on further
	// tickets, as the run recorded them and the docs state them.
	const ce = facts().teaching.certified_example ?? fail('launch_facts.public.json has no teaching.certified_example');
	const tasks = readUpstream('docs/tasks.md');
	const held = /On those (\d+) held-out tickets the threshold ([\d.]+) keeps (\d+) of them \((\d+)%\) with (\d+) wrong/.exec(tasks) ?? fail('docs/tasks.md no longer states its held-out result');
	const further = /The script then asked (\d+) further tickets \(none of them among the (\d+)\): (\d+) of the answers were certified and (\d+) of those were wrong/.exec(tasks) ?? fail('docs/tasks.md no longer states its further tickets');
	if (!/Gemma 4 12B \(6-bit, MLX\) on a Mac/.test(tasks)) fail('docs/tasks.md no longer says the worked example ran on the Gemma 4 12B on a Mac');
	if (v(ce.held_out_n) !== Number(held[1]) || v(ce.certified_n) !== Number(held[3]) || v(ce.errors_at_threshold) !== Number(held[5])) fail(`teaching.certified_example (${v(ce.certified_n)} of ${v(ce.held_out_n)}, ${v(ce.errors_at_threshold)} wrong) is not docs/tasks.md's held-out result (${held[3]} of ${held[1]}, ${held[5]} wrong)`);
	same(v(ce.threshold), Number(held[2]), 'the certificate\'s threshold');
	const run = JSON.parse(readUpstream('runs/2026-10-14_certified-answers/results/mac_mlx/first_start_answers.json'));
	const answers = run.map((a) => ({ top: a.top, certified: a.certified === true, right: a.choice === a.gold }));
	const certify = certifyFrom(answers, { task: 'Support tickets across three queues', base: 'Gemma 4 12B on a Mac', alpha: v(ce.alpha), delta: v(ce.delta) });
	if (certify.n !== Number(further[1]) || certify.certified !== Number(further[3]) || certify.wrong !== Number(further[4])) {
		fail(`the run's answers (${certify.certified} of ${certify.n} certified, ${certify.wrong} wrong) are not what docs/tasks.md says (${further[3]} of ${further[1]}, ${further[4]} wrong)`);
	}
	certify.taught = Number(further[2]);
	certify.heldOut = { n: v(ce.held_out_n), certified: v(ce.certified_n), wrong: v(ce.errors_at_threshold) };
	certify.threshold = v(ce.threshold);

	const label = (s) => `${s.name}, ${s.options} intents`;
	return {
		learn: { task: 'BANKING77', labels: banking.options, base: 'Gemma 4 31B', examples: banking.options * banking.per, perLabel: banking.per, before: banking.plain, after: banking.taught, seconds: banking.seconds, draws: banking.draws, items: banking.items },
		certify,
		stops: [
			{ n: 0, label: 'none', rows: sets.map((s) => ({ name: label(s), acc: s.plain })), seconds: 0 },
			{ n: banking.per, label: `${banking.per} per intent`, rows: sets.map((s) => ({ name: label(s), acc: s.taught })), seconds: banking.seconds, examples: sets.map((s) => s.options * s.per) },
		],
		alpha: certify.alpha,
		source: 'decisio\'s own records at the pinned release: the Gemma 4 31B\'s intent heads (EVAL_CARD.md section 7.2) and the certified worked example (docs/tasks.md, runs/2026-10-14_certified-answers/).',
	};
}

const SCOPE = 'These use labelled examples, so they compare the taught server with the untaught one, not with systems that see no labels.';

let memo;
export function teachData() {
	if (memo) return memo;
	const d = build();
	// The proof line under the three steps: the facts' wording for each set, as its rules ask.
	memo = { ...d, proof: { base: 'Gemma 4 31B', rows: heads().map((h) => h.wording), scope: SCOPE } };
	return memo;
}
