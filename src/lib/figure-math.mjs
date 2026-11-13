// Shared by the rendered illustrations and their controls; these are policy examples, not model inference.
const probability = (value) => {
	if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('Expected a probability between 0 and 1');
	return value;
};

/** The position on an ordered rubric, from a valid probability distribution. */
export function weightedScore(values) {
	if (!Array.isArray(values) || !values.length) throw new Error('Expected a nonempty distribution');
	const sum = values.reduce((total, value) => total + probability(value), 0);
	if (Math.abs(sum - 1) > 1e-9) throw new Error('A probability distribution must sum to 1');
	return values.reduce((total, value, index) => total + index * value, 0);
}

/** A manual policy accepts the line itself; it does not certify an answer. */
export function manualAction(value, threshold) {
	return probability(value) >= probability(threshold) ? 'act' : 'review';
}
