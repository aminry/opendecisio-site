// Runs decisio-examples' five integration checks (integrations/run_all.sh: LangChain, the Vercel AI SDK, n8n, TanStack AI,
// Pipecat) against decisio's CPU stand-in, started from a fresh clone of the pinned release as Get started starts it, and
// writes verification/integrations.json: the release, decisio-examples' commit, and each integration's checks and versions.
// The checks test the plumbing (paths, fields, parsing, errors), not the answers: the stand-in's model is not the default.
// The build shows the record beside the framework table and refuses one made at another release.
//
//   node scripts/verify-integrations.mjs            run the checks and write the record
//   node scripts/verify-integrations.mjs --check C  also compare the run with the committed record C (dates aside)
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pin, siteRoot } from '../src/lib/upstream.mjs';
import { answers, stopAndWait } from './server-control.mjs';

const work = process.env.VERIFY_WORK ?? join(siteRoot, '.verify-integrations');
const clone = join(work, 'decisio');
const examples = join(work, 'decisio-examples');
const url = 'http://127.0.0.1:8000';
const serverWait = Number(process.env.VERIFY_SERVER_WAIT_S ?? 900);
const recordPath = join(siteRoot, 'verification/integrations.json');
const checkAt = process.argv.indexOf('--check');
const committedPath = checkAt === -1 ? undefined : process.argv[checkAt + 1];

const log = (...a) => console.log('integrations:', ...a);
let server;
const stop = () => { if (server) try { process.kill(-server.pid, 'SIGTERM'); } catch {} };
process.on('exit', stop);
function fail(message) {
	console.error(`integrations: ${message}`);
	stop();
	process.exit(1);
}
function sh(cmd, args, opts = {}) {
	const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
	if (r.status !== 0) fail(`${cmd} ${args.join(' ')} failed:\n${r.stdout?.slice(-4000)}\n${r.stderr?.slice(-4000)}`);
	return r.stdout;
}
function fetchAt(dir, repository, commit) {
	mkdirSync(dir, { recursive: true });
	sh('git', ['-C', dir, 'init', '--quiet']);
	sh('git', ['-C', dir, 'fetch', '--quiet', '--depth', '1', `https://github.com/${repository}`, commit]);
	sh('git', ['-C', dir, 'checkout', '--quiet', 'FETCH_HEAD']);
	const head = sh('git', ['-C', dir, 'rev-parse', 'HEAD']).trim();
	if (head !== commit) fail(`the clone of ${repository} is at ${head}, not ${commit}`);
}

// The integrations the site lists, and decisio-examples at the commit the site's table comes from.
const listed = JSON.parse(readFileSync(join(siteRoot, 'src/data/integrations.json'), 'utf8'));
const source = listed.source;

rmSync(work, { recursive: true, force: true });
fetchAt(clone, pin.repository, pin.commit);
fetchAt(examples, source.repository, source.commit);
log(`fetched ${pin.repository} ${pin.tag} (${pin.commit.slice(0, 7)}) and ${source.repository} at ${source.commit.slice(0, 7)}`);

// The stand-in, as Get started runs it (src/lib/site-blocks.mjs, stand-in-start).
if (await answers(`${url}/health`)) fail(`something else answers on ${url}; stop it first`);
sh('uv', ['sync', '--extra', 'dev', '--frozen', '--quiet'], { cwd: clone });
const logPath = join(work, 'server.log');
server = spawn('bash', ['-c', 'uv run python -m decisio.serve.vllm_engine --backend hf --model Qwen/Qwen3-0.6B-Base'], { cwd: clone, detached: true, stdio: ['ignore', openSync(logPath, 'w'), openSync(logPath, 'a')] });
const started = Date.now();
while (!(await answers(`${url}/health`))) {
	if (server.exitCode !== null) fail(`the stand-in exited before it answered /health; see ${logPath}`);
	if (Date.now() - started > serverWait * 1000) fail(`the stand-in did not answer /health within ${serverWait} s; see ${logPath}`);
	await new Promise((r) => setTimeout(r, 2000));
}
log(`stand-in up in ${Math.round((Date.now() - started) / 1000)} s`);

// decisio-examples' own runner, as its README runs it.
const ids = listed.items.map((it) => it.id);
const run = spawnSync('./integrations/run_all.sh', ids, { cwd: examples, encoding: 'utf8', env: { ...process.env, DECISIO_URL: url }, maxBuffer: 64 * 1024 * 1024 });
console.log(run.stdout.split('\n').slice(-(ids.length + 3)).join('\n'));
await stopAndWait(server, { log });
server = undefined;

const items = {};
const problems = [];
for (const it of listed.items) {
	const path = join(examples, 'integrations', it.id, 'results.json');
	if (!existsSync(path)) { problems.push(`${it.name}: wrote no results.json`); continue; }
	const doc = JSON.parse(readFileSync(path, 'utf8'));
	const { passed, failed } = doc.summary;
	const versions = Object.fromEntries(Object.entries(doc.versions).filter(([k]) => k !== 'n8n-workflow'));
	items[it.id] = { passed, total: passed + failed, versions };
	if (failed) problems.push(`${it.name}: ${failed} of ${passed + failed} checks failed`);
	if (passed + failed !== it.checks) problems.push(`${it.name}: ran ${passed + failed} checks, the site's table says ${it.checks}`);
	// "langchain-typesafe" and "0.0.1a3", or several packages as "ai 7.0.131, @ai-sdk/typesafe-ai 3.0.15".
	for (const part of (/\s/.test(it.version) ? it.version : `${it.package} ${it.version}`).split(', ')) {
		const [name, version] = part.split(' ');
		if (versions[name] !== version) problems.push(`${it.name}: ran ${name} ${versions[name]}, the site's table says ${version}`);
	}
}
if (run.status !== 0 && !problems.length) problems.push(`run_all.sh exited ${run.status}:\n${run.stderr.slice(-4000)}`);
if (problems.length) fail(`${problems.length} problems\n  ${problems.join('\n  ')}`);

const record = {
	_note: "decisio-examples' integration checks, run by scripts/verify-integrations.mjs against decisio's CPU stand-in (Qwen/Qwen3-0.6B-Base, --backend hf) at the pinned release. They check the plumbing, not the answers.",
	tag: pin.tag,
	commit: pin.commit,
	examples: { repository: source.repository, commit: source.commit },
	server: 'CPU stand-in, Qwen/Qwen3-0.6B-Base, --backend hf',
	date: new Date().toISOString().slice(0, 10),
	items,
};
writeFileSync(recordPath, `${JSON.stringify(record, null, '\t')}\n`);
log(`every check passed: ${Object.entries(items).map(([id, x]) => `${id} ${x.passed}/${x.total}`).join(', ')}; wrote verification/integrations.json`);

if (committedPath) {
	const committed = JSON.parse(readFileSync(committedPath, 'utf8'));
	const shape = (r) => JSON.stringify({ tag: r.tag, commit: r.commit, examples: r.examples, server: r.server, items: r.items });
	if (shape(committed) !== shape(record)) fail(`the run does not match the committed record (dates aside):\n  committed ${shape(committed)}\n  this run  ${shape(record)}\nCommit the record this run wrote (the integrations-log artifact).`);
	log('the run agrees with the committed record');
}
