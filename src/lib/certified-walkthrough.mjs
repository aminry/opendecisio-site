// One recorded task. Changing the error target changes eligibility, never its predictions.
const TARGETS = ['0.02', '0.05', '0.1'];
const fail = (message) => { throw new Error(`certified walkthrough: ${message}`); };
export function makeWalkthrough(inbox, recording, recordedVersion) {
  if (recording.recordedOn !== recordedVersion || recording.schema !== 'certified_walkthrough/1' || recording.model !== inbox.model || recording.dataset !== inbox.dataset || recording.k !== inbox.k || recording.draw !== inbox.draw) fail('case source does not match the inbox');
  if (!Number.isInteger(inbox.test_n) || inbox.test_n <= 0) fail('invalid test population');
  for (const alpha of TARGETS) {
    const target = inbox.targets[alpha];
    if (!target || !Number.isInteger(target.covered) || target.covered < 0 || target.covered > inbox.test_n || !Number.isInteger(target.errors) || target.errors < 0 || target.errors > target.covered) fail(`invalid counts at ${alpha}`);
    if (target.threshold === null ? target.covered !== 0 : !Number.isFinite(target.threshold) || target.threshold < 0 || target.threshold > 1) fail(`invalid cutoff at ${alpha}`);
  }
  if (new Set(recording.cases.map(c => c.id)).size !== recording.cases.length || recording.cases.length !== 3) fail('three distinct explanation cases are required');
  for (const example of recording.cases) {
    if (!Number.isInteger(example.testIndex) || example.testIndex < 0 || example.testIndex >= inbox.test_n || !example.text || !inbox.labels.includes(example.answer) || !inbox.labels.includes(example.label) || !Number.isFinite(example.probability) || example.probability < 0 || example.probability > 1) fail(`invalid recorded case ${example.id}`);
  }
  return { targets: inbox.targets, testN: inbox.test_n, teachN: inbox.teach_n, heldN: inbox.cal_n, cases: recording.cases };
}
export function selectResult(record, alpha, caseId) {
  if (!TARGETS.includes(alpha)) fail(`unrecorded target ${alpha}`);
  const example = record.cases.find(c => c.id === caseId);
  if (!example) fail(`unknown case ${caseId}`);
  const target = record.targets[alpha];
  return {
    example, threshold: target.threshold,
    eligible: target.threshold !== null && example.probability >= target.threshold,
    covered: target.covered, review: record.testN - target.covered, errors: target.errors,
    wrongRate: target.covered ? target.errors / target.covered : null,
  };
}
