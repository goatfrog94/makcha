// 여정 전체를 빠르게 넘겨 보며 화면·저장·통합안 장치(부품, 별, 돌아온 대원)를 확인해요.
// 페이지에서: await import('/tools/runall.js?'+Date.now()); runAll({ loseAt:2 })
window.runAll = async function(opt = {}){
  const log = [], seen = new Set();
  const $ = q => document.querySelector(q);
  const vis = () => !$('#modal').classList.contains('hidden');
  let battles = 0, guard = 0;
  DBG.fast(true);
  if (!DBG.C){ $('#t-skip').click(); }
  while (guard++ < 400){
    const C = DBG.C, S = DBG.S;
    if (S && !S.over && !vis()){
      battles++;
      if (S.ghost) log.push(`전투${battles} ${S.def.name}: 돌아온 대원 ${S.ghost}`);
      const pb = S.boxes.find(b => b.kind === 'part'); if (pb){ pb.taken = true; S.delivered.push(pb); log.push(`전투${battles} ${S.def.name}: 부품 ${pb.part}`); }
      if (opt.loseAt === battles){ const h = S.humans.find(h => h.id !== 'man' && !h.dog && !h.noFight); if (h){ h.downed = true; h.hp = 0; log.push(`전투${battles}: ${h.id} 두고 옴`); } }
      if (opt.bot){ const res = botPlay(); log.push('  ' + res); if (!S.over){ DBG.win(); } } else DBG.win();
      continue;
    }
    if (!vis()) break;
    const box = $('#mbox'), h2 = (box.querySelector('h2') || {}).textContent || '';
    if (box.querySelector('#t-new')){ log.push('처음 화면으로 돌아옴'); break; }
    if (/끝/.test(h2) && !seen.has(h2)){ const st = [...box.querySelectorAll('.story')].map(e => e.textContent).join(' '); const m = st.match(/⭐[^)]*\)/); log.push(h2 + (m ? ' | ' + m[0] : '') + ' | 부품 ' + Object.keys(C.parts || {}).join(',') + ' | 남은 사람 ' + C.roster.filter(id => ['ok','hurt'].includes(C.people[id].status)).length + ' | 식량 ' + C.food); }
    if (/엔딩|에필로그/.test(h2) || box.querySelector('#e-title')){ log.push('엔딩: ' + h2); break; }
    if (box.querySelector('#r-over')){ log.push('여정 끝: ' + h2); box.querySelector('#r-over').click(); break; }
    if (box.querySelector('#g-title')){ log.push('게임오버: ' + h2 + ' / ' + ((box.querySelector('.story') || {}).textContent || '').slice(0, 80)); break; }
    const pick = ['#r-next', '#b-go', '#d-go', '#a-next', '#sg-go', '#s-go'].map(q => box.querySelector(q)).find(Boolean)
      || (opt.last ? [...box.querySelectorAll('.choice:not(.off)')].pop() : box.querySelector('.choice:not(.off)')) || box.querySelector('button.go') || box.querySelector('button');
    if (!pick){ log.push('버튼 없음: ' + h2); break; }
    if (h2 && !seen.has(h2)){ seen.add(h2); }
    pick.click();
    await new Promise(r => setTimeout(r, 0));
  }
  const C = DBG.C;
  log.push('부품: ' + Object.keys((C && C.parts) || {}).join(','));
  if (C) log.push('별: ' + C.roster.filter(id => C.people[id].star).map(id => id + '★' + C.people[id].star).join(' '));
  log.push('마지막 화면: ' + (($('#mbox h2') || {}).textContent || ''));
  return log.join('\n');
};
