// Runs verification/plan.mjs: every published code block that the CPU stand-in
// can serve is run verbatim, in order, from a fresh clone of the pinned decisio
// release, and verification/commands.json records how each block was checked.
//
//   node scripts/verify-commands.mjs            run the plan and write the record
//   node scripts/verify-commands.mjs --dry-run  only check that the plan covers every block
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { collectBlocks } from '../src/lib/blocks.mjs';
import { pin, siteRoot } from '../src/lib/upstream.mjs';
import { answers, stopAndWait } from './server-control.mjs';
import { plan } from '../verification/plan.mjs';

const dry = process.argv.includes('--dry-run');
const work = process.env.VERIFY_WORK ?? join(siteRoot, '.verify');
const clone = join(work, 'decisio');
const health = 'http://127.0.0.1:8000/health';
const serverWait = Number(process.env.VERIFY_SERVER_WAIT_S ?? 900);

const log = (...a) => console.log('verify:', ...a);
let server;
function fail(message) {
	console.error(`verify: ${message}`);
	stopServer();
	process.exit(1);
}

// 1. The plan must name every published block, and each step must find its block.
const blocks = collectBlocks();
const byPlace = new Map(blocks.map((b) => [`${b.page}#${b.n}`, b]));
// A page's blocks can differ between releases, so a place may have several steps;
// the step whose expected opening matches the block is the one that applies.
const stepFor = (b) => plan.find((s) => s.page === b.page && s.n === b.n && b.text.trimStart().startsWith(s.expect));
for (const b of blocks) {
	if (!stepFor(b)) fail(`block ${b.n} on ${b.page} is not in verification/plan.mjs (it starts: ${b.text.split('\n')[0]})`);
}
const steps = [];
for (const step of plan) {
	const block = byPlace.get(`${step.page}#${step.n}`);
	const matches = block && block.text.trimStart().startsWith(step.expect);
	if (!matches) {
		// A step for a block that only some releases have.
		if (step.optional) continue;
		if (!block) fail(`plan step ${step.page}#${step.n} has no block on the page`);
		fail(`block ${step.n} on ${step.page} starts "${block.text.split('\n')[0]}", not "${step.expect}"; the release moved or changed it`);
	}
	if (step.mode === 'same-as') {
		const other = byPlace.get(`${step.of[0]}#${step.of[1]}`);
		if (!other || other.hash !== block.hash) fail(`block ${step.n} on ${step.page} is no longer the same as ${step.of.join('#')}`);
	}
	steps.push({ ...step, block });
}
log(`${blocks.length} blocks on ${new Set(blocks.map((b) => b.page)).size} pages, all in the plan`);
if (dry) process.exit(0);

// 2. A fresh clone of the pinned release, as a newcomer would have.
function sh(cmd, args, opts = {}) {
	const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
	if (r.status !== 0) fail(`${cmd} ${args.join(' ')} failed:\n${r.stdout}\n${r.stderr}`);
	return r.stdout;
}
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
// Fetch the pinned commit itself, which is exact for a tag and works for a preview too.
mkdirSync(clone, { recursive: true });
sh('git', ['-C', clone, 'init', '--quiet']);
sh('git', ['-C', clone, 'fetch', '--quiet', '--depth', '1', `https://github.com/${pin.repository}`, pin.commit]);
sh('git', ['-C', clone, 'checkout', '--quiet', 'FETCH_HEAD']);
const head = sh('git', ['-C', clone, 'rev-parse', 'HEAD']).trim();
if (head !== pin.commit) fail(`the clone of ${pin.tag} is at ${head}, not ${pin.commit}`);
log(`fetched ${pin.repository} ${pin.tag} (${head.slice(0, 7)})`);

// 3. Run the plan.
let serverLogs = 0;
function stopServer() {
	if (!server) return;
	try {
		process.kill(-server.pid, 'SIGTERM');
	} catch {}
	server = undefined;
}
process.on('exit', stopServer);

const healthy = () => answers(health);

async function startServer(command) {
	const previous = server;
	server = undefined;
	await stopAndWait(previous, { log });
	for (let i = 0; i < 30 && (await healthy()); i++) await new Promise((r) => setTimeout(r, 1000));
	if (await healthy()) fail('something else answers on 127.0.0.1:8000; stop it first');
	const logPath = join(work, `server-${++serverLogs}.log`);
	const out = openSync(logPath, 'w');
	server = spawn('bash', ['-c', command], { cwd: clone, detached: true, stdio: ['ignore', out, out] });
	const started = Date.now();
	while (!(await healthy())) {
		if (server.exitCode !== null) fail(`the server exited before it answered /health; see ${logPath}`);
		if (Date.now() - started > serverWait * 1000) fail(`the server did not answer /health within ${serverWait} s; see ${logPath}`);
		await new Promise((r) => setTimeout(r, 2000));
	}
	log(`server up in ${Math.round((Date.now() - started) / 1000)} s: ${command}`);
}

function run(script) {
	const started = Date.now();
	const r = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], { cwd: clone, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
	if (r.status !== 0) fail(`this block failed (exit ${r.status}):\n${script}\n--- stdout\n${r.stdout.slice(-4000)}\n--- stderr\n${r.stderr.slice(-4000)}`);
	log(`ran in ${Math.round((Date.now() - started) / 1000)} s: ${script.split('\n')[0]}${script.includes('\n') ? ' ...' : ''}`);
	return r.stdout;
}

// A check decisio's CI ran on the pinned commit, which must have passed.
async function ciPassed(name) {
	const headers = process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {};
	const r = await fetch(`https://api.github.com/repos/${pin.repository}/commits/${pin.commit}/check-runs?per_page=100`, { headers });
	if (!r.ok) fail(`could not read decisio's checks on ${pin.commit.slice(0, 7)}: ${r.status}`);
	const run = (await r.json()).check_runs.find((c) => c.name === name);
	if (run?.conclusion !== 'success') fail(`decisio's check "${name}" on ${pin.commit.slice(0, 7)} is ${run?.conclusion ?? 'missing'}, not success`);
	log(`decisio's CI check "${name}" passed on ${pin.commit.slice(0, 7)}`);
}

const ctx = {
	fileHasContent: (name) => existsSync(join(clone, name)) && statSync(join(clone, name)).size > 2,
};

const date = new Date().toISOString().slice(0, 10);
const entries = {};
// What a block printed, as its page shows it: a step that names `show` keeps that function's view of the output (trimmed
// to what the page needs), and the page renders it under the block (src/lib/checks.mjs).
const shown = (step, stdout) => {
	if (!step.show) return {};
	const text = String(step.show(stdout)).replace(/\s+$/, '');
	if (!text) fail(`block ${step.n} on ${step.page} has a show that kept nothing of its output`);
	if (text.length > 4000) fail(`block ${step.n} on ${step.page} shows ${text.length} characters of output; trim it in its show`);
	return { stdout: text, ...(step.trimmed && { trimmed: true }) };
};
for (const step of steps) {
	const { block } = step;
	const text = block.text.trim();
	switch (step.mode) {
		case 'run': {
			const stdout = run(text);
			if (step.assert) {
				try {
					await step.assert(stdout, ctx);
				} catch (e) {
					fail(`block ${step.n} on ${step.page} ran, but ${e.message}\n--- stdout\n${stdout.slice(-2000)}`);
				}
			}
			entries[block.hash] = { status: 'cpu', tag: pin.tag, date, ...(step.note && { note: step.note }), ...shown(step, stdout) };
			break;
		}
		case 'run-then-server': {
			if (step.ci) await ciPassed(step.ci);
			const lines = text.split('\n').filter((l) => l.trim() && !(step.skip ?? []).includes(l.trim()));
			const last = lines.pop();
			if (lines.length) run(lines.join('\n'));
			await startServer(last);
			entries[block.hash] = { status: 'cpu', tag: pin.tag, date, ...(step.note && { note: step.note }) };
			break;
		}
		case 'python': {
			// A Python block, run with the packages it needs, against the server that is up.
			const withs = (step.with ?? []).flatMap((w) => ['--with', w]);
			const r = spawnSync('uv', ['run', '--no-project', ...withs, 'python', '-c', text], { cwd: clone, encoding: 'utf8' });
			if (r.status !== 0) fail(`this Python block failed (exit ${r.status}):\n${text}\n--- stderr\n${r.stderr.slice(-4000)}`);
			log(`ran Python with ${(step.with ?? []).join(', ') || 'no extra packages'}: ${text.split('\n')[0]} ...`);
			if (step.assert) {
				try {
					await step.assert(r.stdout, ctx);
				} catch (e) {
					fail(`block ${step.n} on ${step.page} ran, but ${e.message}\n--- stdout\n${r.stdout.slice(-2000)}`);
				}
			}
			entries[block.hash] = { status: 'cpu', tag: pin.tag, date, ...(step.note && { note: step.note }), ...shown(step, r.stdout) };
			break;
		}
		case 'node': {
			// A JavaScript or TypeScript block, run with Node against the server that is up. Node's own fetch is the client, so
			// the block needs no package; TypeScript is run by stripping its types (`ts: true`).
			const file = join(work, `block-${block.hash}.${step.ts ? 'ts' : 'mjs'}`);
			writeFileSync(file, `${text}\n`);
			const args = step.ts ? ['--experimental-strip-types', '--no-warnings', file] : [file];
			const r = spawnSync('node', args, { cwd: clone, encoding: 'utf8' });
			if (r.status !== 0) fail(`this ${step.ts ? 'TypeScript' : 'JavaScript'} block failed (exit ${r.status}):\n${text}\n--- stderr\n${r.stderr.slice(-4000)}`);
			log(`ran ${step.ts ? 'TypeScript' : 'JavaScript'} with node ${process.version}: ${text.split('\n')[0]} ...`);
			if (step.assert) {
				try {
					await step.assert(r.stdout, ctx);
				} catch (e) {
					fail(`block ${step.n} on ${step.page} ran, but ${e.message}\n--- stdout\n${r.stdout.slice(-2000)}`);
				}
			}
			entries[block.hash] = { status: 'cpu', tag: pin.tag, date, runtime: `node ${process.version}`, ...(step.note && { note: step.note }) };
			break;
		}
		case 'verbatim':
			entries[block.hash] = { status: 'verbatim', needs: step.needs, ...(step.record && { record: step.record }) };
			break;
		case 'shown':
			// A block this check cannot run (it needs hardware the runner has not, or decisio wrote it and has not run it):
			// shown as it is, and its line says why.
			if (!step.why) fail(`block ${step.n} on ${step.page} is shown, not run, and its step gives no why`);
			entries[block.hash] = { status: 'shown', why: step.why, ...(step.record && { record: step.record }) };
			break;
		case 'output':
			entries[block.hash] = { status: 'output', ...(step.record && { record: step.record }) };
			break;
		case 'example':
			entries[block.hash] = { status: 'example' };
			break;
		case 'ollama': {
			// Run apart, on a machine with Ollama; its record must cover this block as it is now.
			const path = join(siteRoot, 'verification/ollama.json');
			const recorded = existsSync(path) && JSON.parse(readFileSync(path, 'utf8')).blocks[block.hash];
			if (!recorded) fail(`block ${step.n} on ${step.page} needs Ollama and has no record in verification/ollama.json; run node scripts/verify-ollama.mjs on a machine with Ollama`);
			break;
		}
		case 'same-as':
			break;
		default:
			fail(`unknown mode ${step.mode} at ${step.page}#${step.n}`);
	}
}
stopServer();

const record = { tag: pin.tag, commit: pin.commit, date, runner: `${process.platform}-${process.arch}`, blocks: entries };
writeFileSync(join(siteRoot, 'verification/commands.json'), JSON.stringify(record, null, '\t') + '\n');
log(`wrote verification/commands.json: ${Object.values(entries).filter((e) => e.status === 'cpu').length} blocks run, ${Object.keys(entries).length} classified`);
