// The repository is public: nothing in its tracked files names the project's internal records or working groups, a
// private path, or an email address. Read from `git ls-files`, so it checks exactly what a commit publishes; binary
// files and the lockfiles are skipped. With --dist it reads the built site instead: the text of every page, the
// Markdown copies and llms.txt, decisio's own pages included, as rendered from the pinned release.
//   node scripts/checks/internal.mjs [--dist]
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';

const MARKERS = [
	['a private repository', /\bRLCD\b/],
	['an internal working group', /\bLab [0-9]\b|\bTrack [0-9]+\b|\bAdvocacy's\b|\bServe's\b/],
	['an internal records path', /\bexperiments\/20\d\d-\d\d-\d\d_/],
	['a local path', /\/Users\/[a-z]|\/home\/[a-z]+\/|~\/\.claude\b/],
	['an email address', /\b[\w.+-]+@(?!example\.)[\w-]+\.(com|org|net|io|dev|ai)\b/],
	['a token', /\b(ghp|gho|github_pat|hf)_[A-Za-z0-9_]{16,}|\bsk-[A-Za-z0-9]{20,}/],
];
const SKIP = /(^|\/)package-lock\.json$|\.(png|jpe?g|webp|gif|mp4|webm|woff2?|ico|pdf)$/;
const dist = process.argv.includes('--dist');
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : /\.(html|md|txt)$/.test(e.name) ? [join(d, e.name)] : []));
const files = dist ? walk('dist') : execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter((f) => f && !SKIP.test(f) && f !== 'scripts/checks/internal.mjs');
// A built page is read as its text (scripts and styles left out); a Markdown copy or llms.txt as it is.
const textOf = (file) => {
	const raw = readFileSync(file, 'utf8');
	if (!file.endsWith('.html')) return raw;
	const doc = parse(raw, { blockTextElements: { script: false, style: false } });
	return doc.querySelector('body')?.structuredText ?? '';
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
