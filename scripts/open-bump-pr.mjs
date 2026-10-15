// Used by .github/workflows/bump-decisio.yml: commits the working tree's
// changes to a new branch through GitHub's GraphQL API, so GitHub signs the
// commit, and opens the pull request that moves the site to the new release.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const { BUMP_TAG: tag, BUMP_BRANCH: branch, VERIFY_OUTCOME: outcome, RUN_URL: runUrl, GITHUB_REPOSITORY: repo } = process.env;
const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });

const base = git('rev-parse', 'HEAD').trim();
const changes = git('status', '--porcelain', '--untracked-files=all', '--', 'upstream.json', 'src/data/media.json', 'public/posters', 'verification/commands.json')
	.split('\n')
	.filter(Boolean)
	.map((line) => ({ status: line.slice(0, 2).trim(), path: line.slice(3) }));
if (!changes.length) throw new Error('bump: nothing changed');

const additions = changes.filter((c) => c.status !== 'D').map((c) => ({ path: c.path, contents: readFileSync(c.path).toString('base64') }));
const deletions = changes.filter((c) => c.status === 'D').map((c) => ({ path: c.path }));

gh('api', `repos/${repo}/git/refs`, '-f', `ref=refs/heads/${branch}`, '-f', `sha=${base}`);

const headline = `chore: build the site from decisio ${tag}`;
const body = 'The pin, the clips and posters, and the record of every published command run again on the CPU stand-in.';
const query = `mutation($input: CreateCommitOnBranchInput!) { createCommitOnBranch(input: $input) { commit { oid } } }`;
const input = { branch: { repositoryNameWithOwner: repo, branchName: branch }, message: { headline, body }, expectedHeadOid: base, fileChanges: { additions, deletions } };
writeFileSync('/tmp/bump-commit.json', JSON.stringify({ query, variables: { input } }));
const oid = JSON.parse(gh('api', 'graphql', '--input', '/tmp/bump-commit.json')).data.createCommitOnBranch.commit.oid;

const verified = outcome === 'success';
const prBody = [
	`Moves the site from the previous pin to decisio [${tag}](https://github.com/aminry/decisio/releases/tag/${tag}).`,
	'',
	verified
		? 'Every published command the CPU stand-in can serve ran again from a fresh clone of the release, and `verification/commands.json` records the run.'
		: `**The command check failed**, so \`verification/commands.json\` still records the previous release and the build will refuse to start. The log is in the [run](${runUrl}) (artifact \`verify-log\`).`,
	'',
	'Review before merging:',
	'- the preview deployment, page by page, against the release notes;',
	'- any docs page the build could not assemble (a renamed heading or a new section is named in the build log);',
	'- new or changed code blocks, which need a step in `verification/plan.mjs`.',
	'',
	`Changed: ${changes.map((c) => `\`${c.path}\``).join(', ')}. Commit ${oid.slice(0, 7)}, signed by GitHub.`,
].join('\n');
writeFileSync('/tmp/bump-pr.md', prBody);
console.log(gh('pr', 'create', '--repo', repo, '--base', 'main', '--head', branch, '--title', headline, '--body-file', '/tmp/bump-pr.md'));
