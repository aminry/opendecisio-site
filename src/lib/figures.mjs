// The figures in a piece of text, as the content check counts them: decimals,
// thousands, percentages and values with a unit; versions inside names and
// section numbers are not figures. Shared with scripts/checks/content.mjs.
export const FIGURE = /(?<![\w.-])(?:\d+\.\d+(?!\.\d)|\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?\s?%|\d+(?:\.\d+)?\s?(?:ms|GB|GiB|MB))(?![\w.]*\d)/g;
// "95% interval", "95% bootstrap intervals": a method's confidence level, not a measurement.
export const METHOD = /\b\d+%\s+(?:paired\s+)?(?:bootstrap\s+)?intervals?\b/gi;
export const NAMES = /\b(?:Jev|Gemini|GPT|Qwen|vLLM|Gemma|ImajevBench|kit|Decision Index|v)\s?\d+(?:\.\d+)+|\bsections?\s+\d+(?:\.\d+)*(?:(?:,\s*|\s+and\s+)\d+(?:\.\d+)*)*/gi;

export function figures(text) {
	return [...text.replace(/<[^>]+>/g, ' ').replace(METHOD, ' ').replace(NAMES, ' ').replace(/\s+/g, ' ').matchAll(FIGURE)].map((m) => m[0].replace(/\s/g, ''));
}

/** The lines of `lines` that state no figure already stated in `elsewhere`. */
export function withoutRepeats(lines, elsewhere) {
	const seen = new Set(elsewhere.flatMap((t) => figures(t)));
	return lines.filter((l) => !figures(l).some((f) => seen.has(f)));
}
