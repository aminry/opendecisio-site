import { existsSync } from 'node:fs';
import { site } from '../config/site.ts';

/**
 * The social preview image: the corrected explainer card (public/launch/social-explainer.png, 1774 x 887) when the
 * site carries it, else the one a decisio release carries (public/social-preview.png, 1280 x 640), else none.
 */
export function socialImage() {
	if (existsSync('public/launch/social-explainer.png')) return { url: `${site.url}/launch/social-explainer.png`, width: 1774, height: 887 };
	if (existsSync('public/social-preview.png')) return { url: `${site.url}/social-preview.png`, width: 1280, height: 640 };
	return undefined;
}
