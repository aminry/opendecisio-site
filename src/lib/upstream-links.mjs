// Rewrites links inside an upstream file's Markdown: to the site's page when
// the site includes the target, otherwise to GitHub at the pinned tag.
import { posix } from 'node:path';
import { visit } from 'unist-util-visit';
import { pin } from './upstream.mjs';
import { inclusionMap, titleFor } from './upstream-map.mjs';
import { servable } from '../config/media-policy.mjs';

const HF_CHECKPOINT = /^(?:aminry\/decisio-(?:gemma-4-31b|gemma-4-12b|qwen3\.6-35b-a3b)|google\/gemma-4-(?:12B|31B)-it|Qwen\/Qwen3\.6-35B-A3B-FP8)$/;

// A link whose words are a decisio file's name ("`docs/running.md`") and that now lands on a site page reads as that
// page's title, so the reader sees where it goes.
function relabel(node, path) {
	const only = node.children?.length === 1 ? node.children[0] : null;
	if (only?.type !== 'inlineCode' || !/(^|\/)[\w.-]+\.md$/.test(only.value)) return;
	const title = titleFor(path);
	if (title) node.children = [{ type: 'text', value: title }];
}

export function rewriteLinks(nodes, file, map = inclusionMap()) {
	const base = posix.dirname(file);
	const root = { type: 'root', children: nodes };
	// A run record, a repository path or a top-level file named in code becomes a
	// link: to the site's page when the site includes that file, else to GitHub at the tag.
	visit(root, 'inlineCode', (node, index, parent) => {
		if (!parent || parent.type === 'link' || index === undefined) return;
		// The checkpoints a base is served from, as Hugging Face repositories (the three aminry/decisio-* ones
		// and the official ones they copy): each links to its repository.
		if (HF_CHECKPOINT.test(node.value)) {
			parent.children[index] = { type: 'link', url: `https://huggingface.co/${node.value}`, children: [node], data: { resolved: true } };
			return;
		}
		const value = node.value.replace(/\s+section\s.*$/, '');
		const path = value.match(/^((?:runs|docs|examples|patches|benchmarks|scripts|docker|tests|src)\/[\w./-]*|[A-Z][A-Z_-]+\.md|Dockerfile|compose\.yaml)$/)?.[1];
		if (!path || /[*{}]/.test(path)) return;
		const route = map.routeFor(path.replace(/\/$/, ''), undefined);
		const isDir = path.endsWith('/') || !/\.[a-z]+$/i.test(path.split('/').pop());
		const url = route ? route.path + (route.anchor ? `#${route.anchor}` : '') : `https://github.com/${pin.repository}/${isDir ? 'tree' : 'blob'}/${pin.tag}/${path.replace(/\/$/, '')}`;
		parent.children[index] = { type: 'link', url, children: [node], data: { resolved: true } };
		if (route) relabel(parent.children[index], route.path);
	});
	visit(root, ['link', 'image', 'definition'], (node) => {
		// The first release's changelog heading compares the tag with itself (release-please's link, kept as written):
		// it goes to that release instead, which an empty comparison does not show.
		const same = new RegExp(`^https://github\\.com/${pin.repository.replace('/', '\\/')}/compare/(v[\\d.]+)\\.\\.\\.\\1$`).exec(node.url ?? '');
		if (same) node.url = `https://github.com/${pin.repository}/releases/tag/${same[1]}`;
		const url = node.url;
		if (node.data?.resolved || !url || /^[a-z]+:/i.test(url) || url.startsWith('//')) return;
		let [target, anchor] = url.split('#');
		const resolved = target ? posix.normalize(posix.join(base, target)) : file;
		if (node.type === 'image') {
			const media = resolved.match(/^docs\/demos\/media\/(.+)$/);
			if (media && !servable(media[1])) throw new Error(`upstream: ${file} embeds ${media[1]}, which the site may not show`);
			node.url = media ? `/media/upstream/${media[1]}` : `https://raw.githubusercontent.com/${pin.repository}/${pin.commit}/${resolved}`;
			return;
		}
		const clip = resolved.match(/^docs\/demos\/media\/(.+)$/);
		if (clip) {
			// The site serves the release's own clips; hosted players' clips stay on the repository's demos page.
			node.url = servable(clip[1]) ? `/media/upstream/${clip[1]}` : `https://github.com/${pin.repository}/blob/${pin.tag}/docs/demos/README.md#watch-it-play`;
			return;
		}
		const route = map.routeFor(resolved, anchor);
		if (route) {
			node.url = route.path + (route.anchor ? `#${route.anchor}` : '');
			relabel(node, route.path);
		} else {
			node.url = `https://github.com/${pin.repository}/blob/${pin.tag}/${resolved}${anchor ? `#${anchor}` : ''}`;
		}
	});
}

