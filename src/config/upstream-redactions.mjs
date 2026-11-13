// Text in decisio's files at the pinned release that shows internal labels: session codes in run-folder names, the
// private repository's name, internal stage and session names. The site renders decisio's files with these edits, so
// no reader sees them; scripts/checks/internal.mjs fails the build where any such name survives, so
// an edit that stops matching at a later tag is caught there. Applied by readUpstream (src/lib/upstream.mjs).

/** Exact edits, by file: the text to find, what replaces it, and why. */
export const edits = [
	{
		file: 'docs/demos/README.md',
		find: 'These tests ran on the Qwen base in the first round, before the bases session; they were not repeated on the Gemma bases.',
		replace: 'These tests ran on the Qwen base; they were not repeated on the Gemma bases.',
		why: 'an internal session name',
	},
	{
		file: 'CHANGELOG.md',
		find: '--read-twice-under N, an opt-in for Decision Index runs (never the default)',
		replace: '--read-twice-under N, an opt-in that reads short requests twice (never the default)',
		why: "a feature described by a benchmark it was measured on, not by what it does; as decisio's edited release notes word it",
	},
	{"file": "docs/api.md", "find": "The same holds for `POST /v1/answer` and for the examples of `POST /v1/tasks` and `POST /v1/abstention/tasks`.", "replace": "The same holds for the examples of `POST /v1/tasks` and `POST /v1/abstention/tasks`.", "why": "keep the supported request behavior without verification-route annotations"},
	{"file": "docs/api.md", "find": " `POST /v1/answer` takes `adapter` too and reports it.", "replace": "", "why": "keep the supported request behavior without verification-route annotations"},
	{"file": "docs/api.md", "find": "`POST /v1/answer` takes `layout` too, and reports the layout its rows were built under in `timing.layout`.", "replace": "", "why": "keep the supported request behavior without verification-route annotations"},
	{"file": "docs/api.md", "find": "`POST /v1/answer` applies no registered task, so it answers the field with 422, and an example of a registration that names a task is 422 too.", "replace": "An example of a registration that names a task is 422.", "why": "keep the supported request behavior without verification-route annotations"},
	{"file": "docs/api.md", "find": " On `POST /v1/answer` the same facts are `timing.batch`.", "replace": "", "why": "keep the supported request behavior without verification-route annotations"},
	{"file": "docs/api.md", "find": " On `POST /v1/answer` the same facts are `timing.waited_ms` and `timing.waited_behind_registration`.", "replace": "", "why": "keep the supported request behavior without verification-route annotations"},
	{"file": "docs/api.md", "find": " (test I7)", "replace": "", "why": "keep the supported request behavior without verification-route annotations"},
];

// A run-folder citation whose name carries a session code after its date (`runs/2026-10-15_s12-session/K2/`,
// `runs/2026-10-17_s18-f-restart/`) becomes the record's date, with no link and no folder name; repeats of one date in a
// row collapse into one.
const RUN_WITH_SESSION = /`runs\/(\d{4}-\d{2}-\d{2})_s\d{1,2}-[^`\s]*`/g;
const REPEATED = /(decisio's run record of (\d{4}-\d{2}-\d{2}))(?:(?:,| and) decisio's run record of \2)+/g;

// release-please can list one commit twice in a release (0.20.0 lists 62b3d13 as two bullets, 0.2.0 lists 597f383 twice:
// a short title with its pull request beside the full title without it). CHANGELOG.md is never edited by hand, so the site
// shows one bullet per commit, in the first one's place: the longer title, with every issue link either carried.
const COMMIT = /\(\[[0-9a-f]{7}\]\(https:\/\/github\.com\/[^)]+\/commit\/([0-9a-f]{40})\)\)\s*$/;
const ISSUE = /\(\[#\d+\]\([^)]+\)\)/g;
function oneBulletPerCommit(text) {
	const out = [];
	let seen = new Map();
	for (const line of text.split('\n')) {
		if (/^## /.test(line)) seen = new Map();
		const commit = /^\* /.test(line) && COMMIT.exec(line)?.[1];
		if (!commit) { out.push(line); continue; }
		const at = seen.get(commit);
		if (at === undefined) { seen.set(commit, out.length); out.push(line); continue; }
		const title = (l) => l.replace(COMMIT, '').replace(ISSUE, '').trim();
		const [keep, other] = title(line).length > title(out[at]).length ? [line, out[at]] : [out[at], line];
		const issues = (other.match(ISSUE) ?? []).filter((i) => !keep.includes(i));
		out[at] = issues.length ? keep.replace(COMMIT, (c) => `${issues.join(' ')} ${c}`) : keep;
	}
	return out.join('\n');
}

/** decisio's file `file` with the edits applied. */
export function redact(file, text) {
	let out = file === 'CHANGELOG.md' ? oneBulletPerCommit(text) : text;
	for (const e of edits) if (e.file === file) out = out.split(e.find).join(e.replace);
	if (file === 'docs/cli.md') out = out.replace(/^\| `--revision` \|.*$/m, (row) => row.replace(/`[a-f0-9]{40}`/g, 'the model pin'));
	if (['CHANGELOG.md', 'docs/upgrading.md'].includes(file)) out = out.replace(/\s*\(`?hf download [^)\n]*--revision [a-f0-9]{40}`?\)/g, '').replace(/ at [a-f0-9]{7,40}(?=\s|\(|$)/gm, ' at a pinned revision');
	// Keep release descriptions and issue links, without publishing source-commit citations.
	out = out.replace(/\s*\(\[[a-f0-9]{7,40}\]\([^)]*\/commits?\/[a-f0-9]{7,40}\)\)/gi, '');
	out = out.replace(/\[([^\]]+)\]\([^)]*\/commits?\/[a-f0-9]{7,40}\)/gi, (_, label) => /^[a-f0-9]{7,40}$/i.test(label) ? '' : label);
	return out.replace(RUN_WITH_SESSION, "decisio's run record of $1").replace(REPEATED, '$1');
}
