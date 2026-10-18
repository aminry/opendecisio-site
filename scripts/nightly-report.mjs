// A failing nightly run is an issue, not a red mark nobody opens. Run by the `nightly-report` job of ci.yml after a full
// run on main (the schedule, or workflow_dispatch on main): it reads which jobs of this run failed and the browser
// check's problem lines (one file per browser job, in problems/), then
// - if a job failed: opens the issue labelled nightly-failure, or comments on it if one is open, with the failed jobs,
//   what failed by engine and page, the commit and the run;
// - if every job passed: closes the open issue, with the run that passed.
// Environment: GH_TOKEN, REPO (owner/name), RUN_ID, RUN_URL, SHA; DRY=1 prints what it would do and changes nothing.
//   node scripts/nightly-report.mjs [problems directory]
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const { REPO, RUN_ID, RUN_URL, SHA, DRY } = process.env;
const dir = process.argv[2] ?? 'problems';
const LABEL = 'nightly-failure';
const TITLE = 'The nightly checks are failing on main';
const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' }).trim();
const act = (what, ...args) => (DRY ? console.log(`nightly-report: would ${what}: gh ${args.map((a) => (a.includes('\n') ? `<<${a}>>` : a)).join(' ')}`) : gh(...args));

// This run's failed jobs, by name ("browsers (webkit, 1/2)"); this job is still running and is not among them.
const failed = process.env.FAILED_JOBS !== undefined
	? process.env.FAILED_JOBS.split('\n').filter(Boolean)
	: gh('run', 'view', RUN_ID, '--repo', REPO, '--json', 'jobs', '-q', '.jobs[]|select(.conclusion=="failure")|.name').split('\n').filter(Boolean);

// The browser check's problems: "webkit /docs/ (phone-light): CSP violation: ...", one variant to a line. The variants of
// one problem on one page are counted together, most first, so the issue reads by engine and page.
const files = existsSync(dir) ? readdirSync(dir, { recursive: true }).map((f) => join(dir, String(f))).filter((f) => statSync(f).isFile()) : [];
const lines = files.flatMap((f) => readFileSync(f, 'utf8').split('\n')).map((l) => l.trim()).filter(Boolean);
const grouped = new Map();
for (const l of lines) {
	const key = l.replace(/ \((?:phone|tablet|laptop|wide|desktop)-(?:light|dark)\)/, '');
	grouped.set(key, (grouped.get(key) ?? 0) + 1);
}
const top = [...grouped].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
const SHOWN = 40;
const what = top.slice(0, SHOWN).map(([l, n]) => `${l}${n > 1 ? `  (${n} variants)` : ''}`);
const more = top.length > SHOWN ? `\n... and ${top.length - SHOWN} more; every line is in the run's problems artifacts.` : '';

act('make sure the label exists', 'label', 'create', LABEL, '--repo', REPO, '--color', 'B60205', '--description', 'The nightly checks failed on main', '--force');
const open = DRY && process.env.OPEN_ISSUE !== undefined ? process.env.OPEN_ISSUE : gh('issue', 'list', '--repo', REPO, '--label', LABEL, '--state', 'open', '--json', 'number', '-q', '.[0].number // ""');

if (!failed.length) {
	if (open) act(`close #${open}`, 'issue', 'close', open, '--repo', REPO, '--comment', `The nightly checks passed on ${SHA.slice(0, 7)}, in every engine: ${RUN_URL}`);
	console.log(`nightly-report: every job passed${open ? `; #${open} closed` : '; no issue was open'}`);
	process.exit(0);
}

const body = [
	`The nightly checks failed on ${SHA.slice(0, 7)}: ${RUN_URL}`,
	'',
	'Failed jobs:',
	...failed.map((j) => `- ${j}`),
	'',
	what.length ? 'What failed, by engine and page:' : 'No browser problem lines were recorded; the failed jobs\' logs say why.',
	...(what.length ? ['```', ...what, '```', ...(more ? [more.trim()] : [])] : []),
].join('\n');
if (open) act(`comment on #${open}`, 'issue', 'comment', open, '--repo', REPO, '--body', body);
else act('open an issue', 'issue', 'create', '--repo', REPO, '--title', TITLE, '--label', LABEL, '--body', body);
console.log(`nightly-report: ${failed.length} ${failed.length === 1 ? 'job' : 'jobs'} failed; ${open ? `commented on #${open}` : 'issue opened'}`);
