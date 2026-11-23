// 자동 시험 (오류 찾기와 대략적인 난이도 감각용)
// 한 지도: await import('/tools/bot3.js'); botMap('abbey', ['man','arin','kwan','old','geum','kal'], 1)
// 지금 벌어진 전투를 끝까지: botPlay()
window.botPlay = function(maxSec = 300){
  DBG.fast(true);
  const S = DBG.S, A = DBG.api;
  const goal = b => S.def.goalKinds ? S.def.goalKinds.includes(b.kind) : (b.kind !== 'bonus' && b.kind !== 'part' && (b.kind !== 'med' || S.mapId === 'school'));
  const done = () => S.bossDead || (S.obj === 'loot' && S.delivered.filter(goal).length >= S.need) || (S.obj === 'hold' && S.holdDone);
  const rescue = c => { const d = S.humans.find(h => h.downed && !h.carriedBy && !h.boarded && !h.left && !h.dog && A.dist(h,c) < 8); if (d && !c.carrying){ c.carryIntent = d; return true; } return false; };
  S.paused = false;
  DBG.order(S.obj === 'hold' ? 'hold' : 'sweep');
  let t = 0, cultAt = 0;
  while (!S.over && t < maxSec){
    let c = S.ctrl;
    if (!c || c.downed || c.boarded || c.left){ const n = A.active().find(h => !h.noFight); if (!n){ DBG.run(1); t++; continue; } DBG.switchCtrl(n); c = n; }
    if (c.carrying || c.box || done()){ if (!c.path.length) DBG.moveCtrl(2, 9); if (done()) DBG.order('bus'); }
    else if (!rescue(c) && S.obj !== 'hold'){
      let tgt = null;
      if (S.obj === 'boss') tgt = S.zombies.filter(z => z.type === 'tower' || z.type === 'cult' || S.boss === z).sort((a,b) => A.dist(a,c) - A.dist(b,c))[0];
      else tgt = S.boxes.filter(b => !b.taken && goal(b)).sort((a,b) => A.dist(a,c) - A.dist(b,c))[0];
      if (tgt && tgt.type === 'apc' && tgt.face){ tgt = { x: tgt.x - tgt.face[0]*1.5, y: tgt.y - tgt.face[1]*1.5 }; if (A.dist(tgt,c) > .8) c.path = []; }
      if (tgt && !c.path.length) DBG.moveCtrl(Math.floor(tgt.x), Math.floor(tgt.y));
    }
    DBG.run(1); t++;
    if (S.cultOut && !cultAt) cultAt = t;
    if (done() && A.active().every(h => h.x < 2.95 || h.noFight)){ DBG.depart(); DBG.depart(); }
  }
  if (!S.over){ DBG.order('bus'); const c = S.ctrl; if (c && !c.downed) DBG.moveCtrl(2, 9); DBG.run(25); DBG.depart(); DBG.depart(); }
  return [S.mapId, Math.round(S.t) + '초', S.success ? '성공' : '실패(' + (S.why || '시간') + ')', '쓰러짐' + S.stats.downs, '두고옴' + S.humans.filter(h => h.left).length, '무리' + S.stats.hordes, cultAt ? '교주등장' + cultAt + '초' : '', S.spared ? '항복' : ''].join(' ');
};
window.botMap = function(map, party, seed){
  DBG.fast(true); DBG.battle(map, party, { seed });
  return map + ' seed' + seed + ' ' + botPlay();
};
