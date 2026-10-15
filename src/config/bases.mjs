import { site } from './site.ts';

// The colour of each base, by its --base flag. A release that adds a base
// fails the build here until the base is given a colour.
export const baseColours = {
	'qwen3.6-35b-a3b': 'base-qwen',
	'gemma-4-12b': 'base-g12',
	'gemma-4-31b': 'base-g31',
};

// How the upstream tables name each base in their column headers.
const names = [
	[/^Qwen3\.6-35B-A3B/i, 'qwen3.6-35b-a3b'],
	[/^Gemma 4 12B/i, 'gemma-4-12b'],
	[/^Gemma 4 31B/i, 'gemma-4-31b'],
];

export function colourOf(flag) {
	const colour = baseColours[flag];
	if (!colour) throw new Error(`bases: no colour for --base ${flag}; add it to src/config/bases.mjs and tokens.css`);
	return colour;
}

/** The base a table header or a player name refers to, or undefined. */
export function baseOfName(text) {
	const plain = text.replace(/<[^>]+>/g, '').replace(new RegExp(`^${site.name}, `), '').trim();
	return names.find(([re]) => re.test(plain))?.[1];
}
