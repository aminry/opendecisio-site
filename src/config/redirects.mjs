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
	{ from: '/docs/quickstart/gpu-server/', to: '/docs/deploy/cloud-gpu/', why: 'GPU server became On a cloud GPU (docs rewrite, batch 3)' },
	{ from: '/docs/quickstart/docker/', to: '/docs/deploy/docker/', why: 'Docker became With Docker (docs rewrite, batch 3)' },
	{ from: '/docs/quickstart/mac-mlx/', to: '/docs/deploy/mac/', why: 'Mac with MLX merged into On a Mac or a laptop (docs rewrite, batch 3)' },
	{ from: '/docs/quickstart/ollama/', to: '/docs/deploy/mac/#on-a-laptop-with-ollama', why: 'Ollama merged into On a Mac or a laptop (docs rewrite, batch 3)' },
	{ from: '/docs/quickstart/cpu-stand-in/', to: '/docs/deploy/development/', why: 'CPU stand-in became For development (docs rewrite, batch 3)' },
	{ from: '/docs/guides/probability/', to: '/docs/tasks/certify/#pick-a-line-by-hand', why: 'Use the probability merged into Certify answers (docs rewrite, batch 4)' },
	{ from: '/docs/guides/many-questions/', to: '/docs/scale/#1-ask-many-questions-in-one-request', why: 'Many questions about one text merged into Scale (docs rewrite, batch 5)' },
	{ from: '/docs/guides/latency/', to: '/docs/scale/#2-plan-for-the-first-read', why: 'Make it fast merged into Scale (docs rewrite, batch 5)' },
	{ from: '/docs/guides/long-and-wide/', to: '/docs/scale/#3-plan-for-long-texts', why: 'Long documents and many options merged into Scale (docs rewrite, batch 5)' },
	{ from: '/docs/health/', to: '/docs/operating/#2-watch-it', why: 'Health and monitoring merged into Operate (docs rewrite, batch 5)' },
	{ from: '/docs/guides/images/', to: '/docs/images/', why: 'Images became Ask about images (docs rewrite, batch 5)' },
	{ from: '/docs/probability/', to: '/docs/how-it-works/#2-one-decision-and-its-probabilities', why: 'What the probability means merged into How it works (docs rewrite, batch 7)' },
	{ from: '/docs/repeatability/', to: '/docs/how-it-works/#what-repeats', why: 'Repeatability merged into How it works (docs rewrite, batch 7)' },
	{ from: '/docs/comparison/', to: '/benchmarks/#compares', why: 'How it compares moved into Benchmarks, beside a hosted service and open entries (docs rewrite, batch 9)' },
	{ from: '/docs/demos/', to: '/demos/', why: 'The demos write-up folded into Demos (docs rewrite, batch 9)' },
	{ from: '/docs/faq/', to: '/docs/how-it-works/', why: 'Questions: each answer moved to the page where its question comes up (docs rewrite, batch 10)' },
];
