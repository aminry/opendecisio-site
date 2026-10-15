// Links to decisio files and run records at the pinned tag.
import { pin } from './upstream.mjs';

export function recordUrl(path) {
	const kind = /\/$/.test(path) ? 'tree' : 'blob';
	return `https://github.com/${pin.repository}/${kind}/${pin.tag}/${path.replace(/\/$/, '')}`;
}
