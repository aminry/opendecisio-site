// A code block's header row: its language, in the row the copy button sits in. A block with no language, or plain
// text, is what a command printed, so its row says "output" and the block takes the output look (docs.css).
const OUTPUT = new Set(['', 'text', 'txt', 'plaintext', 'output', 'ansi']);
const SHELL = new Set(['bash', 'sh', 'shell', 'zsh', 'console']);

export default function codeHeader() {
	return {
		name: 'code-header-row',
		hooks: {
			postprocessRenderedBlock: ({ codeBlock, renderData }) => {
				const lang = (codeBlock.language || '').toLowerCase();
				const isOutput = OUTPUT.has(lang);
				const label = isOutput ? 'output' : SHELL.has(lang) ? 'shell' : lang;
				const frame = renderData.blockAst;
				if (frame.tagName !== 'figure') return;
				const classes = frame.properties?.className ?? [];
				if (classes.includes('has-title')) return;
				if (isOutput) classes.push('is-output');
				// The frame's own header is added later and stays empty; this row is the one the stylesheet shows.
				frame.children.unshift({ type: 'element', tagName: 'div', properties: { className: ['cb-head'] }, children: [{ type: 'element', tagName: 'span', properties: { className: ['lang'] }, children: [{ type: 'text', value: label }] }] });
			},
		},
	};
}
