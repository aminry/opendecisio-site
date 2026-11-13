// The sidebar, page breadcrumbs and text indexes share this reader-oriented order.
// Collapsed groups open automatically when they contain the current page.
export const docsGroups = [
	{
		label: 'Start',
		collapsed: false,
		items: [
			{ slug: 'docs/introduction', label: 'What is decisio?', shape: 'guide' },
			{ slug: 'docs', label: 'Quickstart', shape: 'guide' },
			{ slug: 'docs/build-request', label: 'Build a request', shape: 'guide' },
			{ slug: 'docs/use-from', label: 'Call it from your code', shape: 'guide' },
		],
	},
	{
		label: 'Questions and answers',
		collapsed: false,
		items: [
			{ slug: 'docs/concepts/questions', label: 'Choose a question type', shape: 'guide' },
			{ slug: 'docs/concepts/choice', label: 'Choose an option', shape: 'guide' },
			{ slug: 'docs/concepts/noul', label: 'Ask yes or no', shape: 'guide' },
			{ slug: 'docs/concepts/score', label: 'Rate on a scale', shape: 'guide' },
			{ slug: 'docs/concepts/probabilities', label: 'Use the probabilities', shape: 'guide' },
			{ slug: 'docs/images', label: 'Ask about images', shape: 'guide' },
			{ slug: 'docs/how-it-works', label: 'How it works', shape: 'guide' },
		],
	},
	{
		label: 'Examples',
		collapsed: true,
		items: [
			{ slug: 'docs/use-cases', label: 'Use cases', shape: 'guide' },
			{ slug: 'docs/use-cases/support-routing', label: 'Support routing', shape: 'guide' },
			{ slug: 'docs/use-cases/gatekeeper', label: 'Coding-agent gatekeeper', shape: 'guide' },
			{ slug: 'docs/use-cases/issue-triage', label: 'Issue triage', shape: 'guide' },
			{ slug: 'docs/use-cases/guardrails', label: 'Guardrails', shape: 'guide' },
			{ slug: 'docs/use-cases/rag-gate', label: 'RAG: answer or abstain', shape: 'guide' },
			{ slug: 'docs/use-cases/document-classification', label: 'Document classification', shape: 'guide' },
		],
	},
	{
		label: 'Teach and trust',
		collapsed: true,
		items: [
			{ slug: 'docs/tasks', label: 'Teach a task', shape: 'guide' },
			{ slug: 'docs/tasks/certify', label: 'Certify answers', shape: 'guide' },
			{ slug: 'docs/tasks/dynamic', label: 'Teach a task whose options change', shape: 'guide' },
			{ slug: 'docs/tasks/context', label: 'Send a fixed text once', shape: 'guide' },
			{ slug: 'docs/tasks/fast-table', label: 'Answer short tasks faster', shape: 'guide' },
			{ slug: 'docs/tasks/drift', label: 'Watch for drift', shape: 'guide' },
		],
	},
	{
		label: 'Run on your hardware',
		collapsed: true,
		items: [
			{ slug: 'docs/bases', label: 'Choosing a model', shape: 'reference' },
			{ slug: 'docs/deploy/cloud-gpu', label: 'On a cloud GPU', shape: 'guide' },
			{ slug: 'docs/deploy/docker', label: 'With Docker', shape: 'guide' },
			{ slug: 'docs/deploy/mac', label: 'On a Mac or a laptop', shape: 'guide' },
			{ slug: 'docs/deploy/tuned-12b', label: 'Serve the tuned 12B', shape: 'guide' },
			{ slug: 'docs/deploy/adapter', label: 'Serve your own adapter', shape: 'guide' },
			{ slug: 'docs/deploy/development', label: 'For development (CPU)', shape: 'guide' },
		],
	},
	{
		label: 'Operate and improve',
		collapsed: true,
		items: [
			{ slug: 'docs/operating', label: 'Operate', shape: 'guide' },
			{ slug: 'docs/scale', label: 'Scale', shape: 'guide' },
			{ slug: 'docs/concurrency', label: 'Batch concurrent requests', shape: 'guide' },
			{ slug: 'docs/layout', label: 'Choose the prompt layout', shape: 'guide' },
			{ slug: 'docs/think', label: 'Think when unsure', shape: 'guide' },
			{ slug: 'docs/upgrading', label: 'Upgrade', shape: 'guide' },
			{ slug: 'docs/troubleshooting', label: 'Troubleshoot', shape: 'guide' },
			{ slug: 'docs/migrating', label: 'Move from System One', shape: 'guide' },
		],
	},
	{
		label: 'Reference',
		collapsed: true,
		items: [
			{ slug: 'docs/api', label: 'HTTP API', shape: 'reference' },
			{ slug: 'docs/flags', label: 'Server flags', shape: 'reference' },
			{ slug: 'docs/limits', label: 'Requirements and limits', shape: 'reference' },
			{ slug: 'docs/glossary', shape: 'reference' },
			{ slug: 'docs/releases', label: 'Release notes', shape: 'reference' },
			{ slug: 'docs/evaluation-card', label: 'Evaluate your task', shape: 'guide' },
		],
	},
];

/** The group a docs page belongs to, and the pages around it in sidebar order. */
export const docsOrder = docsGroups.flatMap((g) => g.items.map((i) => ({ group: g.label, slug: i.slug })));
export const groupOf = (slug) => docsOrder.find((p) => p.slug === slug.replace(/^\/|\/$/g, ''))?.group;
