// Selected questions from existing recordings; timing always belongs to the complete recorded request.
export function heroDecisions(recording) {
 const selected=[['01-support-routing#0','choice'],['01-support-routing#2','yes/no'],['01-support-routing#0','score'],['04-tool-decision#0','choice']];
 return selected.map(([id,type])=>{
  const item=recording.items.find(item=>item.id===id),q=item?.questions.find(q=>q.type===type);
  if(!q||!Number.isFinite(item.serverMs))throw Error('Hero needs a recorded question and request timing');
  const yes=q.bars[0],top=q.bars.find(b=>b.top);
  const answer=type==='yes/no'?(yes.p>=.5?'yes':'no'):type==='score'?q.result.replace(/^expected level /,''):q.result;
  const probability=type==='yes/no'?yes.p:top?.p;
  const levels=q.bars.map(b=>Number(b.label));
  return {id:item.id,type,typeName:type==='yes/no'?'Yes/no':type==='score'?'Score':'Choice',kind:item.kind,text:item.state,question:q.ask,answer,
   detail:type==='score'?`${Math.min(...levels)}–${Math.max(...levels)}`:probability.toFixed(3),
   detailLabel:type==='score'?'Score range':type==='yes/no'?'P(yes)':'Option probability',
   options:type==='yes/no'?['yes','no']:q.bars.map(b=>b.label),serverMs:item.serverMs,questionCount:item.questions.length};
 });
}
