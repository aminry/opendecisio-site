// Pages the docs rewrite moves or merges (docs/STYLE_GUIDE.md, the approved structure): each old address answers with
// a permanent redirect to its new home, so no link from outside breaks. scripts/redirects.mjs writes them to
// dist/_redirects, which Cloudflare's static assets apply; scripts/checks/redirects.mjs checks that every target exists
// and that no moved page is still built at its old address.
//   { from: '/docs/old-page/', to: '/docs/new-page/#section', why: 'merged into ...' }
export const redirects = [
	{ from: '/docs/quickstart/', to: '/docs/#1-pick-your-machine', why: 'Choose your machine merged into Get started (docs rewrite, batch 2)' },
	{ from: '/docs/first-request/', to: '/docs/#4-read-the-answer', why: 'Your first decision merged into Get started (docs rewrite, batch 2)' },
	{ from: '/docs/use-from/python/', to: '/docs/use-from/', why: 'Python merged into Call it from your code (docs rewrite, batch 2)' },
	{ from: '/docs/use-from/javascript/', to: '/docs/use-from/', why: 'JavaScript and TypeScript merged into Call it from your code (docs rewrite, batch 2)' },
	{ from: '/docs/use-from/frameworks/', to: '/docs/use-from/#use-a-framework', why: 'Frameworks merged into Call it from your code (docs rewrite, batch 2)' },
];
