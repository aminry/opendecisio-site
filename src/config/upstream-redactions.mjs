// Text in decisio's files at the pinned release that shows internal labels: session codes in run-folder names, the
// private repository's name, internal stage and session names. The site renders decisio's files with these edits, so
// no reader sees them (Amin, 2026-10-18); scripts/checks/internal.mjs fails the build where any such name survives, so
// an edit that stops matching at a later tag is caught there. Applied by readUpstream (src/lib/upstream.mjs).

/** Exact edits, by file: the text to find, what replaces it, and why. */
export const edits = [
	{
		file: 'EVAL_CARD.md',
		find: ' (a stage C comparison of 2026-10-05, recorded in our private records)',
		replace: '',
		why: 'an internal stage name and a private record',
	},
	{
		file: 'docs/demos/README.md',
		find: 'These tests ran on the Qwen base in the first round, before the bases session; they were not repeated on the Gemma bases.',
		replace: 'These tests ran on the Qwen base; they were not repeated on the Gemma bases.',
		why: 'an internal session name',
	},
];

// A run-folder citation whose name carries a session code after its date (`runs/2026-10-15_s12-session/K2/`,
// `runs/2026-10-17_s18-f-restart/`) becomes the record's date, with no link and no folder name; repeats of one date in a
// row collapse into one.
const RUN_WITH_SESSION = /`runs\/(\d{4}-\d{2}-\d{2})_s\d{1,2}-[^`\s]*`/g;
const REPEATED = /(decisio's run record of (\d{4}-\d{2}-\d{2}))(?:(?:,| and) decisio's run record of \2)+/g;

/** decisio's file `file` with the edits applied. */
export function redact(file, text) {
	let out = text;
	for (const e of edits) if (e.file === file) out = out.split(e.find).join(e.replace);
	return out.replace(RUN_WITH_SESSION, "decisio's run record of $1").replace(REPEATED, '$1');
}
