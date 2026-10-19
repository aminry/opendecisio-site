// Outputs the site shows as recorded from a decisio server, with the release that recorded them (docs/STYLE_GUIDE.md,
// "Numbers"; Amin, 2026-10-18). scripts/checks/recorded.mjs finds every page that shows one (by its marker text) and fails
// a page showing an output older than the pinned minor release unless the page says which release recorded it.
// `pending` names the pages that do not say so yet, while the re-record at the pinned release is under way; the list may
// only shrink, and it goes once the outputs are recorded again.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { siteRoot } from '../lib/upstream.mjs';

const facts = () => JSON.parse(readFileSync(join(siteRoot, 'src/data/launch/launch_facts.public.json'), 'utf8'));

export const recordedOutputs = [
	{
		name: 'the recorded decisions (decisio-examples, support routing and three more)',
		version: () => facts().figures.recorded_decisions.run.decisio_version,
		marker: 'I was charged twice for October',
		pending: { why: 'the re-record at the pinned release, on the next card session', pages: ['/docs/faq/', '/docs/scale/'] },
	},
	{
		name: 'the routing example (decisio-examples example 5)',
		version: () => facts().figures.routing_example5.record.decisio_version,
		marker: 'Escalate only when unsure',
	},
];
