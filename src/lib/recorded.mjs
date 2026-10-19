// The site's recorded outputs at the pinned release: the twelve recorded decisions replayed, decisio-examples example 5
// run again, and docs/tasks.md's worked certificate on the Gemma 4 31B, all recorded on decisio 0.17.0 in one session on one
// card (src/data/recorded/2026-10-19_decisio-0.17.0/, its run.json says what each folder is). Every file is checked
// against files.json, and the build stops if a file, the release or the card is not what the pages say.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { siteRoot } from './upstream.mjs';

const DIR = join(siteRoot, 'src/data/recorded/2026-10-19_decisio-0.17.0');
const fail = (what) => { throw new Error(`recorded: ${what}`); };
const sha = (b) => createHash('sha256').update(b).digest('hex');

let memo;
function files() {
	if (memo) return memo;
	const want = JSON.parse(readFileSync(join(DIR, 'files.json'), 'utf8'));
	const raw = {};
	for (const [name, h] of Object.entries(want)) {
		raw[name] = readFileSync(join(DIR, name));
		if (sha(raw[name]) !== h) fail(`${name} is not the file files.json records`);
	}
	memo = raw;
	return raw;
}
const json = (name) => JSON.parse((files()[name] ?? fail(`no ${name}`)).toString('utf8'));

/** The session: the release, the engine, the card and its power limit, and the date. */
export function session() {
	const f = files();
	const run = JSON.parse(readFileSync(join(DIR, 'run.json'), 'utf8'));
	const versions = Object.fromEntries(f['versions.txt'].toString().trim().split('\n').map((l) => l.split('==')));
	const gpu = /^(NVIDIA RTX PRO 6000 Blackwell[^,]*), (\d+) MiB, ([\d.]+) W$/.exec(f['gpu.txt'].toString().trim()) ?? fail('gpu.txt is not one RTX PRO 6000 with its power limit');
	if (Number(gpu[3]) !== run.power_limit_w) fail(`the card's power limit is ${gpu[3]} W, not run.json's ${run.power_limit_w} W`);
	for (const s of [json('replay/summary.json').decisio, json('certify/first_start_task_response.json').certificate.stack.decisio]) if (s !== versions.decisio) fail(`a record is of decisio ${s}, not ${versions.decisio}`);
	return { decisio: versions.decisio, vllm: versions.vllm, card: gpu[1], powerW: run.power_limit_w, date: run.date, base: json('replay/summary.json').base };
}

/** The twelve replayed decisions, by id: each request as it was sent again, its answers and its server time. */
export function replay() {
	const sum = json('replay/summary.json');
	const records = files()['replay/records.jsonl'].toString().trim().split('\n').map((l) => JSON.parse(l));
	if (records.length !== sum.items || sum.same_choices_as_recorded !== sum.items) fail(`the replay has ${records.length} records, ${sum.same_choices_as_recorded} of ${sum.items} with the recorded choices`);
	const ms = Object.fromEntries(sum.rows.map((r) => [r.id, Number(r.server_ms)]));
	return new Map(records.map((r) => [r.id, { request: r.request, answers: r.response.answers, serverMs: ms[r.id] ?? fail(`no server time for ${r.id}`) }]));
}

/** decisio-examples example 5 on the 31B: the report's sweep, recomputed from the decisions at the preset. */
export function example5() {
	const rep = json('example5/report.json');
	const run = JSON.parse(readFileSync(join(DIR, 'run.json'), 'utf8')).example5;
	const decisions = gunzipSync(files()['example5/decisions.jsonl.gz']).toString().trim().split('\n').map((l) => JSON.parse(l));
	if (decisions.length !== rep.questions) fail(`example 5 has ${decisions.length} decisions, not the report's ${rep.questions}`);
	const at = rep.at_preset;
	const kept = decisions.filter((d) => d.p >= at.keep_at);
	if (kept.length !== at.kept || kept.filter((d) => d.chose !== d.gold).length !== at.errors - at.errors_escalated) fail('example 5\'s decisions disagree with its report at the preset');
	return { ...rep, run, sweep: rep.sweep.filter((s) => s.keep_at <= 0.95) };
}

/** docs/tasks.md's worked certificate on the 31B: the registration's certificate and status, and two answers after it. */
export function certificate() {
	const res = json('certify/first_start_task_response.json');
	const c = res.certificate;
	const sum = json('certify/restart_result.json').certificate_of_the_first_start;
	for (const k of ['threshold', 'certified_n', 'errors_at_threshold', 'n', 'alpha', 'delta']) if (c[k] !== sum[k]) fail(`the certificate's ${k} is not the run's own summary`);
	return { certificate: c, status: { state: res.status.state, text: res.status.text }, samples: json('certify/first_start_sample_answers.json'), base: c.stack.base };
}

const pc = (x) => `${(x * 100).toFixed(1)}%`;
const n0 = (x) => x.toLocaleString('en-US');

/** Example 5's sweep as a docs table: each line, the share kept, how often the kept answers were right, the wrong ones escalated. */
export function example5Table() {
	const e = example5();
	const heads = ['Keep at or above', 'Answered on its own', 'Right among those (95% interval)', 'Wrong answers escalated'];
	const rows = e.sweep.map((s) => [String(s.keep_at), `${n0(s.kept)} (${pc(s.kept / e.questions)})`, `${pc(s.accuracy_kept)} (${pc(s.accuracy_kept_ci95[0])} to ${pc(s.accuracy_kept_ci95[1])})`, `${s.errors_escalated} of ${s.errors}`]);
	return `<div class="table-wrap"><table class="docs-table"><thead><tr>${heads.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td data-label="${heads[i]}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

/** The numbers and labels the docs state in their own words about these records (`:value{name="..."}`). */
export function recordedValues() {
	const s = session();
	const { certificate: c } = certificate();
	const e = example5();
	const box = `Gemma 4 31B from its FP8 checkpoint, decisio ${s.decisio}, one RTX PRO 6000 at ${s.powerW} W, ${s.date}`;
	return {
		'certify-result': `answers with a top probability of at least ${c.threshold.toFixed(4)} are certified: ${c.certified_n} of the ${c.n} held-back tickets, ${c.errors_at_threshold} of them wrong`,
		'certify-recorded': `Recorded on ${box}; the response is abridged.`,
		'example5-recorded': `decisio-examples' example 5, Escalate only when unsure: ${n0(e.questions)} ARC-Challenge questions, a public benchmark the model may have seen, on ${box}`,
	};
}
