import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navigationProblems } from './docs-navigation.mjs';

test('every page is discoverable exactly once', () => {
	assert.deepEqual(navigationProblems([{ items: [{ slug: 'docs' }, { slug: 'docs/api' }] }], ['docs', 'docs/api'], []), []);
});

test('an existing page missing from navigation is reported', () => {
	assert.deepEqual(navigationProblems([{ items: [{ slug: 'docs' }] }], ['docs', 'docs/api'], []), ['docs/api: page is missing from navigation']);
});

test('a sidebar link to a missing page is reported', () => {
	assert.deepEqual(navigationProblems([{ items: [{ slug: 'docs/api' }] }], [], []), ['docs/api: navigation points to a missing page']);
});

test('a page listed in two groups is reported', () => {
	assert.deepEqual(navigationProblems([{ items: [{ slug: 'docs' }] }, { items: [{ slug: 'docs' }] }], ['docs'], []), ['docs: page appears more than once in navigation']);
});

test('a moved route cannot remain a navigable page', () => {
	assert.deepEqual(navigationProblems([{ items: [{ slug: 'docs/old' }] }], ['docs/old'], [{ from: '/docs/old/', to: '/docs/' }]), ['docs/old: moved page is still in navigation']);
});
