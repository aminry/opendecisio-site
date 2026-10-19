// Facts the site writes in its own words, each beside the sentence of decisio's docs at the pinned release that it
// rests on: the page must still say it, and decisio's file must still hold the sentence. A release that changes the
// sentence fails scripts/checks/sourced.mjs, and the page is brought in step with it.
//   page: the built page; says: text on it; file: decisio's file; source: the text in that file
const migrating = 'docs/migrating.md';
const api = 'docs/api.md';

export const sourced = [
	// Call it from your code
	{ page: '/docs/use-from/', says: 'pip install typesafe-sdk==0.7.2', file: migrating, source: "TypeSafe's Python SDK 0.7.2" },
	{ page: '/docs/use-from/', says: 'more than 255 options', file: api, source: 'up to 255 options (more is 422)' },
	{ page: '/docs/use-from/', says: 'is not sent as Content-Type: application/json', file: api, source: 'any other type, or none, is refused with 415' },
	{ page: '/docs/use-from/', says: 'the server sets no CORS headers', file: api, source: 'The server sets no CORS headers' },
	{ page: '/docs/use-from/', says: 'TypeSafeUnprocessableEntityError for a 422 and TypeSafeBadRequestError for a 400', file: migrating, source: '(`TypeSafeUnprocessableEntityError`, `TypeSafeBadRequestError`)' },
	{ page: '/docs/use-from/', says: 'gives up after 10 s by default', file: migrating, source: "The SDK's default timeout is 10 s." },
	{ page: '/docs/use-from/', says: "the SDK's retries on 429 never fire; it still retries 408 and 5xx", file: migrating, source: "the SDK's retries on 429 never fire; it still retries 408 and 5xx" },
	// Move from System One
	{ page: '/docs/migrating/', says: 'decisio-gemma-4-31b-it-letters', file: migrating, source: '`decisio-gemma-4-31b-it-letters` for the default base' },
	{ page: '/docs/migrating/', says: 'decisio-gemma-4-12b-it-letters', file: migrating, source: '`decisio-gemma-4-12b-it-letters`' },
	{ page: '/docs/migrating/', says: 'decisio-qwen3.6-35b-a3b-letters', file: migrating, source: '`decisio-qwen3.6-35b-a3b-letters`' },
	{ page: '/docs/migrating/', says: 'A request without model refused with 422', file: api, source: 'System One requires it and refuses a request without it with 422' },
	{ page: '/docs/migrating/', says: 'A field it does not know refused with 400', file: api, source: 'System One refuses a request with an unknown top-level field (400' },
	{ page: '/docs/migrating/', says: 'A score with more than 10 levels refused with 422', file: api, source: 'System One refuses more than 10 with 422' },
	{ page: '/docs/migrating/', says: 'box questions supported refused with 422', file: api, source: 'A request with `"type": "box"` is refused with 422.' },
	{ page: '/docs/migrating/', says: 'rounded to two decimals', file: api, source: 'System One rounds them to two decimals' },
	{ page: '/docs/migrating/', says: 'usage.output_tokens is 1 per question', file: api, source: '`usage.output_tokens` is 1 per question' },
	{ page: '/docs/migrating/', says: 'The SDK gives up after 10 s by default', file: migrating, source: "The SDK's default timeout is 10 s." },
	{ page: '/docs/migrating/', says: "The SDK's retries on 429 never fire; it still retries 408 and 5xx", file: migrating, source: "the SDK's retries on 429 never fire; it still retries 408 and 5xx" },
];
