// Pages the docs rewrite moves or merges (docs/STYLE_GUIDE.md, the approved structure): each old address answers with
// a permanent redirect to its new home, so no link from outside breaks. scripts/redirects.mjs writes them to
// dist/_redirects, which Cloudflare's static assets apply; scripts/checks/redirects.mjs checks that every target exists
// and that no moved page is still built at its old address.
//   { from: '/docs/old-page/', to: '/docs/new-page/#section', why: 'merged into ...' }
export const redirects = [];
