// After CI runs every published command (scripts/verify-commands.mjs, which writes verification/commands.json), the
// record it wrote must say what the committed one says: the same blocks, each checked the same way at the same
// release. Dates differ from run to run and are not compared. A block whose check changed, or a new block, means the
// committed record is out of date: run npm run verify and commit it.
//   node scripts/checks/verify-record.mjs <the committed commands.json, copied before the run>
import { readFileSync } from 'node:fs';

const [, , committedPath] = process.argv;
if (!committedPath) throw new Error('verify-record: name the committed record');
const committed = JSON.parse(readFileSync(committedPath, 'utf8'));
const fresh = JSON.parse(readFileSync('verification/commands.json', 'utf8'));
const shape = (e) => JSON.stringify({ status: e.status, tag: e.tag, needs: e.needs, why: e.why, record: e.record, note: e.note, runtime: e.runtime ? e.runtime.replace(/\..*$/, '') : undefined });
const problems = [];
if (committed.tag !== fresh.tag || committed.commit !== fresh.commit) problems.push(`the record is for ${committed.tag}, the run was at ${fresh.tag}`);
for (const [hash, e] of Object.entries(fresh.blocks)) {
	if (!committed.blocks[hash]) problems.push(`block ${hash} was run but is not in the committed record`);
	else if (shape(committed.blocks[hash]) !== shape(e)) problems.push(`block ${hash} was checked differently: ${shape(committed.blocks[hash])} committed, ${shape(e)} now`);
}
for (const hash of Object.keys(committed.blocks)) if (!fresh.blocks[hash]) problems.push(`block ${hash} is in the committed record but the run did not classify it`);
if (problems.length) { console.error(`verify-record: ${problems.length} problems\n  ${problems.join('\n  ')}`); process.exit(1); }
console.log(`verify-record: the run and the committed record agree on ${Object.keys(fresh.blocks).length} blocks (${Object.values(fresh.blocks).filter((e) => e.status === 'cpu').length} run on the stand-in)`);
