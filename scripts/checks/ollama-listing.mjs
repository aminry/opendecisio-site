// The Ollama listings must still be the ones the site's Ollama blocks were run
// against: each one's published layers (weights, projector, system prompt,
// parameters) are compared with the ones verification/ollama.json recorded.
// A re-pushed listing fails here until scripts/verify-ollama.mjs runs again.
//   node scripts/checks/ollama-listing.mjs
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../..', import.meta.url).pathname;

/** "ns/name[:tag]" as its registry path and tag. */
export function parseModel(model) {
	const [name, tag = 'latest'] = model.split(':');
	return { name, tag };
}

/** The listing's layer digests as the registry publishes them. */
export async function publishedLayers(model) {
	const { name, tag } = parseModel(model);
	const r = await fetch(`https://registry.ollama.ai/v2/${name}/manifests/${tag}`, {
		headers: { Accept: 'application/vnd.docker.distribution.manifest.v2+json' },
	});
	if (!r.ok) throw new Error(`ollama-listing: the registry answered ${r.status} for ${model}`);
	return (await r.json()).layers.map((l) => l.digest);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const record = JSON.parse(readFileSync(join(root, 'verification/ollama.json'), 'utf8'));
	let stale = 0;
	for (const [model, layers] of Object.entries(record.listings)) {
		const now = await publishedLayers(model);
		if (JSON.stringify(now) === JSON.stringify(layers)) {
			console.log(`ollama-listing: ${model} is the listing run on ${record.date} (${now.length} layers match)`);
			continue;
		}
		stale++;
		console.error(`ollama-listing: ${model} on the registry is not the listing the blocks were run against on ${record.date}; run node scripts/verify-ollama.mjs on a machine with Ollama.`);
		console.error(`  recorded  ${layers.join(' ')}\n  published ${now.join(' ')}`);
	}
	if (stale) process.exit(1);
}
