// An image in a post, `![alt](/launch/name.svg)`, that has a dark twin `/launch/name-dark.svg` in public/ becomes the
// pair the home page's charts are (LaunchImage.astro): both, lazy, and the one for the theme in use shown by CSS
// (.lc in site.css). Each image carries its width and height (read from the SVG's own, so its room is reserved before
// it loads and the page below it does not move). A picture with no twin is left as it is.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { visit } from 'unist-util-visit';

export default function rehypeThemedImages() {
	return (tree) => {
		visit(tree, 'element', (node, index, parent) => {
			if (node.tagName !== 'img' || !parent || index === undefined) return;
			const src = String(node.properties?.src ?? '');
			const m = /^(\/launch\/.+)(\.(?:svg|png))$/.exec(src);
			if (!m || m[1].endsWith('-dark') || !existsSync(join(process.cwd(), 'public', `${m[1]}-dark${m[2]}`))) return;
			const size = m[2] === '.svg' ? /<svg[^>]*\swidth="(\d+)"[^>]*\sheight="(\d+)"/.exec(readFileSync(join(process.cwd(), 'public', `${m[1]}${m[2]}`), 'utf8').slice(0, 600)) : null;
			const dims = size ? { width: Number(size[1]), height: Number(size[2]) } : {};
			const img = (cls, file) => ({ type: 'element', tagName: 'img', properties: { ...node.properties, ...dims, src: file, className: ['lc__img', cls], loading: 'lazy', decoding: 'async' }, children: [] });
			parent.children[index] = { type: 'element', tagName: 'span', properties: { className: ['lc'] }, children: [img('lc__img--light', src), img('lc__img--dark', `${m[1]}-dark${m[2]}`)] };
		});
	};
}
