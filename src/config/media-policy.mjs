// Which demo clips the site may serve. Hosted players' clips are linked on the
// repository's demos page, not embedded; Gemini has no clip anywhere.
export const hostedClip = /_(jev|haiku|luna)(\.|_)/;
export const forbiddenClip = /gemini/i;

export function servable(name) {
	return !hostedClip.test(name) && !forbiddenClip.test(name);
}
