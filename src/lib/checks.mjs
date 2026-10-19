// How each published code block was checked, read from verification/commands.json.
// A block is known by the sha256 of its text, so a changed block is a new block
// that must be checked again before the site builds.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pin, siteRoot } from './upstream.mjs';

const escHtml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const blockHash = (text) => createHash('sha256').update(text.trim()).digest('hex').slice(0, 16);

let memo;
function load() {
	if (!memo) {
		const path = join(siteRoot, 'verification/commands.json');
		memo = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { blocks: {} };
		// The blocks run against Ollama, on a machine that has it (scripts/verify-ollama.mjs).
		const ollama = join(siteRoot, 'verification/ollama.json');
		if (existsSync(ollama)) memo.blocks = { ...memo.blocks, ...JSON.parse(readFileSync(ollama, 'utf8')).blocks };
	}
	return memo;
}

/** The check recorded for a block, or an error naming the block and what to run. */
export function checkOf(text, where) {
	const hash = blockHash(text);
	const entry = load().blocks[hash];
	if (!entry) {
		throw new Error(`checks: the code block ${hash} on ${where} has not been checked (first line: ${text.trim().split('\n')[0]}). Run npm run verify, or classify it in verification/plan.mjs.`);
	}
	if (entry.status === 'cpu' && entry.tag !== pin.tag) {
		throw new Error(`checks: the code block ${hash} on ${where} was checked at ${entry.tag}, not at ${pin.tag}. Run npm run verify.`);
	}
	return entry;
}

// A run record is a link on its name, to the folder at the pinned tag (the path is on the page it leads to).
// A record named by a full address (a run kept in another repository, at its own commit) is linked as it is.
const record = (path) => `<a href="${/^https:/.test(path) ? path : `https://github.com/${pin.repository}/tree/${pin.tag}/${path.replace(/\/$/, '')}`}">run record</a>`;

/** The line shown under a block. */
export function checkHtml(entry, { moved = false } = {}) {
	// One element for the text, so a link or code inside it stays in the line
	// (the line is a flex row: the dot, then the text).
	// A block shown with its comments moved above their commands says so: the commands are the ones checked.
	const line = (text, cls = '') => `<p class="checked${cls}"><span>${text}${moved ? ' Its comments are shown above their commands.' : ''}</span></p>`;
	switch (entry.status) {
		case 'cpu':
			return line(`Run against the CPU stand-in at ${entry.tag} on ${entry.date}${entry.note ? `: ${entry.note}` : ''}${entry.stdout ? (entry.trimmed ? '. It printed, trimmed to the fields this page uses:' : '. It printed:') : '.'}`, ' checked--cpu') + (entry.stdout ? `<pre class="checked__out" tabindex="0"><code>${escHtml(entry.stdout)}</code></pre>` : '');
		case 'verbatim':
			return line(`Needs ${entry.needs}: taken as it is from decisio's checked docs${entry.record ? `, ${record(entry.record)}` : ''}.`);
		case 'shown':
			return line(`Shown, not run: ${entry.why}${entry.record ? `; ${record(entry.record)}` : ''}.`);
		case 'output':
			return line(`Recorded output${entry.record ? `, ${record(entry.record)}` : ''}.`);
		case 'ollama':
			return line(`Run against Ollama ${entry.ollama} with ${entry.models.join(' and ')}, the listing as published, on ${entry.date}; the answers are Ollama's, not the default model's on a decisio server.`);
		case 'example':
			return line('A shape to fill in, not a command to run.');
		default:
			throw new Error(`checks: unknown status ${entry.status}`);
	}
}
