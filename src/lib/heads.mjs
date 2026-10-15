// A column header in two lines where a model name is long: "Decisio" over
// "Qwen3.6-35B-A3B", "Surogate Rune" over "26B-A4B v3".
import { site } from '../config/site.ts';

export function twoLines(html) {
	const text = html.replace(/<[^>]+>/g, '').trim().replace(/^decisio(?=\s*·)/i, site.name);
	const dot = text.indexOf(' · ');
	if (dot !== -1) return [text.slice(0, dot), text.slice(dot + 3)];
	if (text.length <= 14 || !text.includes(' ')) return [text];
	const spaces = [...text.matchAll(/ /g)].map((m) => m.index);
	const mid = text.length / 2;
	const at = spaces.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
	return [text.slice(0, at), text.slice(at + 1)];
}
