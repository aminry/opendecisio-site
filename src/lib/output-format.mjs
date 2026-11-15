// The output a command printed, set the way the docs set any JSON: two-space indentation and the same few colours
// (key, string, number), with every token as the record has it. Plain text stays as it is.
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TOKEN = /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}[\],:]/g;

/** Valid JSON text, re-indented and highlighted as HTML. Numbers and strings are kept exactly as written. */
export function jsonHtml(text) {
	const tokens = text.match(TOKEN) ?? [];
	const span = (cls, t) => `<span class="${cls}">${esc(t)}</span>`;
	let out = '';
	let depth = 0;
	const nl = () => `\n${'  '.repeat(depth)}`;
	for (let i = 0; i < tokens.length; i++) {
		const t = tokens[i];
		if (t === '{' || t === '[') {
			const close = t === '{' ? '}' : ']';
			if (tokens[i + 1] === close) {
				out += span('j-p', t + close);
				i++;
			} else {
				depth++;
				out += span('j-p', t) + nl();
			}
		} else if (t === '}' || t === ']') {
			depth--;
			out += nl() + span('j-p', t);
		} else if (t === ',') out += span('j-p', ',') + nl();
		else if (t === ':') out += span('j-p', ':') + ' ';
		else if (t[0] === '"') out += span(tokens[i + 1] === ':' ? 'j-k' : 'j-s', t);
		else out += span('j-n', t);
	}
	return out;
}

const parses = (t) => {
	try {
		JSON.parse(t);
		return true;
	} catch {
		return false;
	}
};

/** What a command printed, as HTML, and whether any of it was JSON. A first line that is not JSON (a status code) stays plain. */
export function outputHtml(stdout) {
	const text = stdout.replace(/\s+$/, '');
	const lines = text.split('\n');
	for (let i = 0; i < lines.length; i++) {
		if (!/^\s*[{[]/.test(lines[i])) continue;
		const rest = lines.slice(i).join('\n');
		if (parses(rest)) return { html: (i ? `${esc(lines.slice(0, i).join('\n'))}\n` : '') + jsonHtml(rest), json: true };
		break;
	}
	return { html: esc(text), json: false };
}
