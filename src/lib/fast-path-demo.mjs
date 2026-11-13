// Shared by the build, browser and film: an illustration, never a benchmark replay.
import timing from '../data/fast-path-timing.json' with {type: 'json'};
export const STATIC_TIMING = Object.freeze(timing);
export const POLICY = 'Apply the refund window for the product category. Use the item’s condition and delivery age; send policy exceptions for review.';
export const FACTS = {
  a: 'Delivered 12 days ago.\nUnopened.\nCategory: home.',
  b: 'Delivered 45 days ago.\nOpened.\nCategory: home.',
};

export function contextView(mode, facts) {
  if (!['inline', 'context'].includes(mode)) throw new Error('Unknown context view');
  const modelText = `${POLICY}\n\n${facts}`;
  const cpuText = mode === 'context' ? facts : modelText;
  return { cpuText, cpuCharacters: [...cpuText].length, modelText,
    registeredContext: mode === 'context' ? POLICY : null };
}

export function timingView(mode, fastShare = STATIC_TIMING.fastShare) {
  if (!['average', 'fast', 'fallback'].includes(mode)) throw new Error('Unknown timing view');
  if (!Number.isFinite(fastShare) || fastShare < 0 || fastShare > 100) throw new Error('Invalid fast-path share');
  const {cpuMs, modelMs} = STATIC_TIMING;
  const modelContributionMs = modelMs * (mode === 'average' ? 1-fastShare/100 : mode === 'fallback' ? 1 : 0);
  const totalMs = cpuMs + modelContributionMs, scaleMs = cpuMs + modelMs;
  return { cpuMs, modelMs, modelContributionMs, totalMs, scaleMs, fastShare,
    displayMs: Number(totalMs.toFixed(2)).toString(),
    savingPercent: Number((100 * (1 - totalMs / modelMs)).toFixed(1)),
    cpuWidth: 592 * cpuMs / scaleMs,
    modelWidth: 592 * modelContributionMs / scaleMs,
    totalWidth: 592 * totalMs / scaleMs,
    baselineWidth: 592 * modelMs / scaleMs };
}
