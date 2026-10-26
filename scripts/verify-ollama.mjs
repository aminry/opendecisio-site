// Runs the published blocks that need Ollama (mode "ollama" in
// verification/plan.mjs) against the Ollama on this machine, with the listings
// exactly as published, and writes verification/ollama.json. The CPU stand-in
// run (scripts/verify-commands.mjs) cannot serve them, and CI has no Ollama, so
// this is run by hand on a machine that has it; CI then checks that the
// listing is unchanged (scripts/checks/ollama-listing.mjs).
//
// Before running, it checks that the server is at least the version the docs
// require, and that the local copy of the model has the registry's layers.
//   node scripts/verify-ollama.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { collectBlocks } from '../src/lib/blocks.mjs';
import { siteRoot } from '../src/lib/upstream.mjs';
import { plan } from '../verification/plan.mjs';
import { parseModel, publishedLayers } from './checks/ollama-listing.mjs';

// The blocks name this address, so the check asks the same server.
const ollama = 'http://localhost:11434';
const log = (...a) => console.log('verify-ollama:', ...a);
function fail(message) {
	console.error(`verify-ollama: ${message}`);
	process.exit(1);
}

const atLeast = (a, b) => {
	const [x, y] = [a, b].map((v) => v.split('.').map(Number));
	for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
	return true;
};

const blocks = collectBlocks();
const steps = plan
	.filter((s) => s.mode === 'ollama')
	.map((s) => ({ ...s, block: blocks.find((b) => b.page === s.page && b.n === s.n && b.text.trimStart().startsWith(s.expect)) }));
for (const s of steps) if (!s.block) fail(`plan step ${s.page}#${s.n} has no block starting "${s.expect}"`);
const models = [...new Set(steps.flatMap((s) => s.models))];

// The server, at the version the docs require.
const version = (await (await fetch(`${ollama}/api/version`).catch(() => fail(`no Ollama at ${ollama}`))).json()).version;
for (const s of steps) if (!atLeast(version, s.needs)) fail(`Ollama ${version} is older than the ${s.needs} that ${s.page}#${s.n} needs`);
// Ollama 0.40.4 and later refuse the listings on the decision route, so a block is run only on a version the docs give.
for (const s of steps) if (s.upTo && !atLeast(s.upTo, version)) fail(`Ollama ${version} is later than the ${s.upTo} that ${s.page}#${s.n} works on`);

// Each local model, with the registry's layers.
const listings = {};
for (const model of models) {
	const { name, tag } = parseModel(model);
	const manifest = join(process.env.OLLAMA_MODELS ?? join(homedir(), '.ollama/models'), 'manifests/registry.ollama.ai', name, tag);
	if (!existsSync(manifest)) fail(`${model} is not pulled here (no ${manifest}); run ollama pull ${model}`);
	const local = JSON.parse(readFileSync(manifest, 'utf8')).layers.map((l) => l.digest);
	const published = await publishedLayers(model);
	if (JSON.stringify(local) !== JSON.stringify(published)) fail(`the local ${model} is not the published listing; run ollama pull ${model}`);
	listings[model] = published;
	log(`Ollama ${version}; ${model} has the registry's ${published.length} layers`);
}

const date = new Date().toISOString().slice(0, 10);
const entries = {};
for (const s of steps) {
	const r = spawnSync('bash', ['-e', '-c', s.block.text], { encoding: 'utf8', env: { ...process.env } });
	if (r.status !== 0) fail(`block ${s.n} on ${s.page} failed (exit ${r.status}):\n${r.stderr.slice(-2000)}`);
	try {
		// A pull reports on stderr, a request on stdout.
		await s.assert(r.stdout, r.stderr);
	} catch (e) {
		fail(`block ${s.n} on ${s.page} ran, but ${e.message}\n--- stdout\n${r.stdout.slice(-2000)}\n--- stderr\n${r.stderr.slice(-500)}`);
	}
	log(`ran ${s.page}#${s.n}: ${s.block.text.split('\n')[0]} ...`);
	entries[s.block.hash] = { status: 'ollama', ollama: version, models: s.models, date };
}

const record = { ollama: version, date, runner: `${process.platform}-${process.arch}`, listings, blocks: entries };
writeFileSync(join(siteRoot, 'verification/ollama.json'), JSON.stringify(record, null, '\t') + '\n');
log(`wrote verification/ollama.json: ${Object.keys(entries).length} blocks run against ${models.length} listings`);
