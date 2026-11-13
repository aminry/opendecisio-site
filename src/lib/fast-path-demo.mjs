// Shared by the build and browser: no inference and no network requests.
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

export function timingView(record, mode) {
  if (!['average', 'fast', 'fallback'].includes(mode)) throw new Error('Unknown timing view');
  const { n, deferred, table_ms_mean: cpuMs, decisio_ms_per_deferred_request: modelMs } = record;
  if (![n, deferred, cpuMs, modelMs].every(Number.isFinite) || n <= 0 || deferred < 0 || deferred > n || cpuMs <= 0 || modelMs <= 0) {
    throw new Error('Invalid recorded timing sample');
  }
  const modelContributionMs = modelMs * (mode === 'average' ? deferred / n : mode === 'fallback' ? 1 : 0);
  const totalMs = cpuMs + modelContributionMs, scaleMs = cpuMs + modelMs;
  return { cpuMs, modelMs, modelContributionMs, totalMs, scaleMs,
    requestCount: n, modelRequests: deferred,
    displayMs: mode === 'fast' ? String(cpuMs) : String(Math.round(totalMs)),
    savingPercent: Math.round(100 * (1 - totalMs / modelMs)),
    cpuWidth: 592 * cpuMs / scaleMs,
    modelWidth: 592 * modelContributionMs / scaleMs,
    totalWidth: 592 * totalMs / scaleMs,
    baselineWidth: 592 * modelMs / scaleMs };
}
