import {pin} from './upstream.mjs';
import {readFileSync} from 'node:fs';

export const skillsPackage = JSON.parse(readFileSync('src/data/skills.json','utf8'));
const atLeast=(a,b)=>{const[x,y]=[a,b].map(v=>v.split('.').map(Number));for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i];return true;};
export function packageProblems(meta, release) {
    const problems=[];
    if(meta.repository!=='aminry/decisio-skills')problems.push('unknown skills repository');
    if(!/^\d+\.\d+\.\d+$/.test(meta.version??''))problems.push('invalid package version');
    if(meta.archive!==`decisio-skills-${meta.version}.zip`)problems.push('archive does not match its version');
    if(!/^[a-f0-9]{64}$/.test(meta.sha256??''))problems.push('invalid archive digest');
    // The skills work with the latest decisio from their floor on (minDecisio): a package is accepted while its floor is at
    // or below the documented release, so a decisio release needs no new package.
    if(!/^\d+\.\d+\.\d+$/.test(meta.minDecisio??''))problems.push('invalid skills floor (minDecisio)');
    else if(!atLeast(release.replace(/^v/,''),meta.minDecisio))problems.push('skills need a later decisio than the documented release');
    if(JSON.stringify(meta.skills)!==JSON.stringify(['decisio-setup','decisio-request','decisio-integrate']))problems.push('unexpected workflow inventory');
    return problems;
}
const configProblems=packageProblems(skillsPackage,pin.tag);
if(configProblems.length)throw new Error(configProblems.join('; '));
export const skillsReleaseUrl = `https://github.com/${skillsPackage.repository}/releases/tag/v${skillsPackage.version}`;
export const skillsArchiveUrl = `https://github.com/${skillsPackage.repository}/releases/download/v${skillsPackage.version}/${skillsPackage.archive}`;
export function skillsBlock(name) {
    const m=skillsPackage;
    const script=`"$DECISIO_SKILLS/decisio-skills-${m.version}/scripts/install.mjs"`;
    const commands={
        'skills-download': `DECISIO_PROJECT="$PWD"
: "\${DECISIO_SKILLS:=$HOME/.cache/decisio-skills}"
mkdir -p "$DECISIO_SKILLS"
curl --fail --location --output "$DECISIO_SKILLS/${m.archive}" \\
  ${skillsArchiveUrl}
node --input-type=module -e 'import {readFileSync} from "node:fs"; import {createHash} from "node:crypto"; if (createHash("sha256").update(readFileSync(process.argv[1])).digest("hex") !== "${m.sha256}") throw new Error("Archive checksum mismatch"); console.log("Archive checksum matches");' "$DECISIO_SKILLS/${m.archive}" &&
python3 -m zipfile --extract "$DECISIO_SKILLS/${m.archive}" "$DECISIO_SKILLS"`,
        'skills-codex': `node ${script} install --host codex --scope project --project "$DECISIO_PROJECT"`,
        'skills-claude': `node ${script} install --host claude --scope project --project "$DECISIO_PROJECT"`,
        'skills-personal': `node ${script} install --host codex --scope user`,
        'skills-select': `node ${script} install --host codex --scope project --project "$DECISIO_PROJECT" --skill decisio-request`,
        'skills-update': `node ${script} install --host codex --scope project --project "$DECISIO_PROJECT" --update`,
        'skills-uninstall-codex': `node ${script} uninstall --host codex --scope project --project "$DECISIO_PROJECT"`,
        'skills-uninstall-claude': `node ${script} uninstall --host claude --scope project --project "$DECISIO_PROJECT"`,
    };
    if(!(name in commands))throw new Error(`unknown skills command ${name}`);
    return {lang:'bash',text:commands[name]};
}
export function evidenceProblems(record, blocks, meta=skillsPackage) {
    const problems=[];
    if(record.version!==meta.version||record.sha256!==meta.sha256)problems.push('skills evidence names another package');
    for(const block of blocks){const entry=record.blocks?.[block.hash];if(!entry||entry.status!=='skills'||entry.version!==meta.version||entry.sha256!==meta.sha256)problems.push(`unchecked package command ${block.hash}`);}
    return problems;
}
export function skillsReleaseNote() {
    return `<p class="src-note">Skills package <a href="${skillsReleaseUrl}">${skillsPackage.version}</a>, for decisio ${skillsPackage.minDecisio} or later. <a href="${skillsArchiveUrl}">Download the ZIP</a>.</p>`;
}
