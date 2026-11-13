import test from 'node:test';
import assert from 'node:assert/strict';
import { weightedScore, manualAction } from '../../src/lib/figure-math.mjs';

test('score marker uses the weighted mean, including fractional positions', () => {
	assert.ok(Math.abs(weightedScore([0.1, 0.2, 0.6, 0.1]) - 1.7) < 1e-12);
	assert.ok(Math.abs(weightedScore([0.05, 0.05, 0.2, 0.7]) - 2.55) < 1e-12);
});
test('score reaches the first and last level for a certain distribution', () => {
	assert.equal(weightedScore([1, 0, 0, 0]), 0);
	assert.equal(weightedScore([0, 0, 0, 1]), 3);
});
test('a misleading distribution cannot be drawn as a score', () => {
	for (const p of [[], [0.4, 0.4], [-0.1, 1.1], [NaN, 1], [Infinity, 0]]) assert.throws(() => weightedScore(p));
});
test('manual policy accepts its boundary and reviews values below it', () => {
	assert.equal(manualAction(0.9, 0.9), 'act');
	assert.equal(manualAction(0.899, 0.9), 'review');
	assert.equal(manualAction(0.95, 0.9), 'act');
});
test('manual policy handles the ends of the probability range', () => {
	assert.equal(manualAction(0, 0), 'act');
	assert.equal(manualAction(1, 1), 'act');
	assert.equal(manualAction(0.95, 1), 'review');
});
test('manual policy refuses invalid probabilities and lines', () => {
	for (const [p, line] of [[NaN, 0.9], [0.9, Infinity], [-0.1, 0.9], [0.9, 1.1]]) assert.throws(() => manualAction(p, line));
});
