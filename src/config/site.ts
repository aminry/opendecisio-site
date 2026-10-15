// The one place the project's name and the site's addresses live.
// Renaming the project is a change to `name` alone.
export const site = {
	name: 'Decisio',
	url: 'https://opendecisio.com',
	repository: 'https://github.com/aminry/decisio',
	pypi: 'https://pypi.org/project/decisio/',
	ollama: 'https://ollama.com/aminroudaki/decisio',
	image: 'ghcr.io/aminry/decisio',
	licence: 'Apache-2.0',
} as const;

export const independence = `${site.name} is an independent open-source project, not affiliated with or endorsed by TypeSafe. Jev is TypeSafe's product name.`;

// Cloudflare Web Analytics: the site's visits are counted by the beacon in src/components/Analytics.astro, which is
// cookieless. The token is public (it is in every page's HTML). With no token no beacon is added and the Content-Security-Policy
// is not widened (scripts/headers.mjs, checked by scripts/checks/analytics.mjs). This is the token Cloudflare's automatic
// setup put in the live pages. That token is accepted by the site's own /cdn-cgi/rum (Cloudflare serves it on the zone) and
// not by cloudflareinsights.com, so the beacon is told to report there (`send.to`): the policy needs no connect host.
export const analytics = {
	token: '45f27b36d1bc40c08602f7b64605738d',
	script: 'https://static.cloudflareinsights.com',
	send: `${site.url}/cdn-cgi/rum`,
} as const;
