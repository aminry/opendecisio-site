// The repository is public: nothing in its tracked files names the project's internal records or working groups, a
// private path, or an email address. Read from `git ls-files`, so it checks exactly what a commit publishes; binary
// files and the lockfiles are skipped. With --dist it reads the built site instead: the text of every page, the
// Markdown copies, llms.txt and the SVG charts, decisio's own pages included, as rendered from the pinned release.
//   node scripts/checks/internal.mjs [--dist]
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';

const MARKERS = [
	['a private repository', /\bRLCD\b|\brlcd[\w-]*/i],
	// Session codes and labels from the project's internal runs: "session A", run folders such as runs/2026-10-15_s12-session,
	// "bases session" and internal stage letters.
	['a session label', /\b[Ss]ession [A-Z]\b|(?<![A-Za-z0-9])s\d{1,2}-session\b|\d{4}-\d{2}-\d{2}_s\d{1,2}-|\bbases session\b|\b[Ss]tage [A-Z]\b/],
	['an internal working group', /\bLab [0-9]\b|\bTrack [0-9]+\b|\bAdvocacy's\b|\bServe's\b|\b(Site|Serve|Data|Records|Throughput|Advocacy) track\b|\bServe (is|will|owns|drops|rewords)\b/],
	// The project's own agents and tools, how it runs its work, and who decided what (a rule since 2026-10-24: the public site and
	// repository describe the product, not the process behind it).
	['an internal agent or tool', /\bBrain\b|\bCommand Center\b|\bcc-task\b|\bside session\b|\bpaseo\b|\bsubagents?\b|\binternal teacher\b/],
	['an internal run code', /\bN1[FP]?\b|\bR300\b|\b[Aa]rm [A-H][0-9]?\b|\bgate G?[0-9]+\b/],
	['a decision note', /\(Amin[,;]|\bAmin's (rule|decision|word)\b|\bchosen by Amin\b/],
	['how cards are rented', /\btraining box\b|\brented box\b|\bvast\.ai\b/],
	['an internal records path', /\bexperiments\/20\d\d-\d\d-\d\d_/],
	['a local path', /\/Users\/[a-z]|\/home\/[a-z]+\/|~\/\.claude\b/],
	['an email address', /\b[\w.+-]+@(?!example\.)[\w-]+\.(com|org|net|io|dev|ai)\b/],
	['a token', /\b(ghp|gho|github_pat|hf)_[A-Za-z0-9_]{16,}|\bsk-[A-Za-z0-9]{20,}/],
];
const SKIP = /(^|\/)package-lock\.json$|\.(png|jpe?g|webp|gif|mp4|webm|woff2?|ico|pdf|gz)$/;
const dist = process.argv.includes('--dist');
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : /\.(html|md|txt|svg)$/.test(e.name) ? [join(d, e.name)] : []));
const files = dist ? walk('dist') : execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter((f) => f && !SKIP.test(f) && f !== 'scripts/checks/internal.mjs' && f !== 'src/config/upstream-redactions.mjs');
// A built page is read as its text (scripts and styles left out); a Markdown copy or llms.txt as it is.
const textOf = (file) => {
	const raw = readFileSync(file, 'utf8');
	if (!file.endsWith('.html')) return raw;
	const doc = parse(raw, { blockTextElements: { script: false, style: false } });
	// What a reader can reach without seeing it as text counts too: link targets, sources, titles, alt text and the data
	// a page's scripts read (the home page's data blocks), one attribute to a line.
	const attrs = doc.querySelectorAll('*').flatMap((el) => Object.entries(el.attributes).filter(([k]) => /^(href|src|title|alt|aria-label|data-[\w-]+)$/.test(k)).map(([k, v]) => `[${k}] ${v}`));
	return `${doc.querySelector('body')?.structuredText ?? ''}\n${attrs.join('\n')}`;
};
const problems = [];
for (const file of files) {
	textOf(file).split('\n').forEach((line, i) => {
		for (const [what, re] of MARKERS) {
			const m = re.exec(line);
			if (m) problems.push(`${file}:${i + 1}: ${what}: "${line.slice(Math.max(0, m.index - 60), m.index + 80).trim()}"`);
		}
	});
}
if (problems.length) {
	console.error(`internal: ${problems.length} lines name what a public ${dist ? 'site' : 'repository'} should not\n  ${problems.join('\n  ')}`);
	process.exit(1);
}
console.log(dist ? `internal: ${files.length} built pages and copies name no internal record, working group, private path, email address or token` : `internal: ${files.length} tracked files name no internal record, working group, private path, email address or token`);
