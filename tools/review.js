// 검토용 측정: 주인공이 목표 상자를 돌며 가져오는 동안 대원들이 얼마나 혼자 떨어져 포위되는지 잰다.
// 페이지에서: await import('/tools/review.js?'+Date.now()); await measure('alley', ['man','yuri','arin','kwan','baek','cheol'], { order:'follow', gun:'save' }, [1,2,3,4,5])
window.measure = async function(mapId, party, opt = {}, seeds = [1,2,3,4,5]){
  const agg = { far:{}, runs:0, ok:0, t:0, downs:0, hordes:0, shots:0, maxN:0, lone:{}, loneDown:{}, quirk:0 };
  for (const seed of seeds){
    DBG.fast(true); DBG.battle(mapId, party, { seed });
    const S = DBG.S, A = DBG.api;
    if (opt.order) DBG.order(opt.order);
    if (opt.gun && DBG.gunAll) DBG.gunAll(opt.gun);
    const man = S.humans[0];
    const goals = S.boxes.filter(b => b.kind !== 'bonus').map(b => [Math.floor(b.x), Math.floor(b.y)]);
    goals.push([2,9]);
    let gi = 0, t = 0;
    const sample = () => {
      const lead = S.ctrl;
      for (const h of S.humans){
        if (h.boarded || h.left || h.downed || h === lead) continue;
        const zn = S.zombies.filter(z => !z.asleep && A.dist(z,h) <= 1.6).length;
        const far = lead ? A.dist(h, lead) > 5 : false;
        if (far) agg.far[h.id] = (agg.far[h.id] || 0) + .5;
        if (far && zn >= 3){ agg.lone[h.id] = (agg.lone[h.id] || 0) + .5; }
      }
    };
    const downedBefore = new Set();
    while (!S.over && t < 240){
      if (man.downed || man.boarded){ /* 주인공이 쓰러지면 그대로 둠 */ }
      else if (!man.path.length && !man.carrying){
        if (gi < goals.length){ const [x,y] = goals[gi++]; DBG.switchCtrl(man); DBG.moveCtrl(x, y); }
        else { if (opt.order) DBG.order('bus'); DBG.switchCtrl(man); DBG.moveCtrl(2,9); if (man.x < 3) { DBG.depart(); DBG.depart(); } }
      }
      DBG.run(.5); t += .5; sample();
      for (const h of S.humans) if (h.downed && !downedBefore.has(h.id)){ downedBefore.add(h.id);
        const lead = S.ctrl; if (lead && A.dist(h, lead) > 5) agg.loneDown[h.id] = (agg.loneDown[h.id] || 0) + 1; }
    }
    agg.runs++; if (S.success) agg.ok++; agg.t += S.t; agg.downs += S.stats.downs; agg.hordes += S.stats.hordes; agg.shots += S.stats.shots; agg.maxN += S.stats.maxNoise; agg.quirk += S.stats.quirk;
  }
  const n = agg.runs;
  return `${mapId} ${JSON.stringify(opt)}: 성공 ${agg.ok}/${n}, 평균 ${Math.round(agg.t/n)}초, 쓰러짐 ${(agg.downs/n).toFixed(1)}, 무리 ${(agg.hordes/n).toFixed(1)}, 총 ${Math.round(agg.shots/n)}발, 최고소란 ${Math.round(agg.maxN/n)}, 버릇 ${(agg.quirk/n).toFixed(1)}`
    + ` | 5칸 넘게 떨어진 시간(초/판) ${Object.entries(agg.far).map(([k,v]) => k+' '+(v/n).toFixed(0)).join(', ')}`
    + ` | 혼자 포위된 시간(초/판) ${Object.entries(agg.lone).map(([k,v]) => k+' '+(v/n).toFixed(1)).join(', ') || '없음'}`
    + ` | 혼자 떨어져 쓰러짐(판당) ${Object.entries(agg.loneDown).map(([k,v]) => k+' '+(v/n).toFixed(1)).join(', ') || '없음'}`;
};
