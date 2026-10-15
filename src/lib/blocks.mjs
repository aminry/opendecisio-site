// Every code block the site publishes, page by page, as the build renders it:
// the docs pages through the same upstream plugin, and the home page's blocks.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import remarkUpstream from './remark-upstream.mjs';
import { blockHash } from './checks.mjs';
import { install, laptop } from './home.mjs';
import { siteBlock } from './site-blocks.mjs';
import { siteRoot } from './upstream.mjs';

const contentRoot = join(siteRoot, 'src/content/docs');
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : /\.mdx?$/.test(e.name) ? [join(dir, e.name)] : []));

export function collectBlocks() {
	const out = [];
	for (const path of walk(contentRoot).sort()) {
		const page = '/' + relative(contentRoot, path).replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '') + '/';
		const processor = unified().use(remarkParse).use(remarkFrontmatter).use(remarkGfm).use(remarkDirective).use(remarkUpstream, { annotate: false });
		const tree = processor.runSync(processor.parse(readFileSync(path, 'utf8')), { path });
		let n = 0;
		visit(tree, 'code', (node) => {
			n += 1;
			out.push({ page, n, hash: blockHash(node.value), lang: node.lang, text: node.value });
		});
	}
	const home = [laptop().pull, siteBlock('ollama-request-gemma').text, install('GPU server')];
	home.forEach((text, i) => out.push({ page: '/', n: i + 1, hash: blockHash(text), lang: 'sh', text }));
	return out;
}
