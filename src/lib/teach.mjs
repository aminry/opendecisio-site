// The Gemma 4 31B's intent heads, as measured: from the launch facts' launch_facts.public.json
// teaching.intent_heads.gemma_4_31b (decisio's own records), checked against what the pinned release prints
// (EVAL_CARD.md section 7.2 and the README's Benchmarks table); each quote keeps "after 10 labelled examples per intent",
// the draws and the test items, as the block's rules ask. The docs' Teach a task page draws them.
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
