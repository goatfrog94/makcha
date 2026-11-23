// 시험용 자동 플레이 (오류 찾기와 대략적인 난이도 감각용). 페이지에서: await import('/tools/bot.js'); await botRun(seed, '조용히')
window.botRun = async function(seed, style = 'follow'){
  DBG.fast(true); DBG.battle('restarea', null, { seed });
  const S = DBG.S, A = DBG.api;
  const H = id => S.humans.find(h => h.id === id);
  const until = (cond, max) => { let t = 0; while (!S.over && !cond() && t < max){ DBG.run(.5); t += .5; } return cond(); };
  const go = (h, x, y, max = 25) => { if (!h || h.downed || h.boarded) return false; DBG.switchCtrl(h); DBG.moveCtrl(x, y); return until(() => !h.path.length || h.downed, max); };
  const rescue = () => { // 쓰러진 사람이 있으면 가까운 사람이 업어 와요
    for (const d of S.humans.filter(h => h.downed && !h.carriedBy && !h.boarded && !h.left)){
      const c = A.active().filter(h => !h.dog).sort((a,b) => A.dist(a,d)-A.dist(b,d))[0]; if (!c) return;
      DBG.switchCtrl(c); c.carryIntent = d; until(() => c.carrying || c.downed || !d.downed, 20);
      if (c.carrying) go(c, 2, 9, 30);
    }
  };
  const order = o => DBG.order(o);
  const st = style === 'sweep' ? 'sweep' : 'follow'; if (style === 'quiet') DBG.gunAll('none');
  order(st);
  go(H('man'), 23, 10); rescue();
  order(st);
  go(H('man'), 20, 5); rescue();
  go(H('choi') || H('yuri'), 28, 7); rescue();
  DBG.switchCtrl(H('man')); order(st);
  go(H('man'), 2, 9, 40); rescue();
  go(H('man'), 20, 17, 40); rescue();
  go(H('man'), 2, 9, 40); rescue();
  // 상자 든 사람 모두 버스로
  order('bus'); until(() => A.active().every(h => h === S.ctrl || h.boarded), 30); rescue();
  const c = S.ctrl && !S.ctrl.downed ? S.ctrl : A.active()[0];
  if (c){ go(c, 2, 9, 20); DBG.switchCtrl(c); DBG.depart(); DBG.depart(); }
  until(() => S.over, 5);
  return { seed, style, t:Math.round(S.t), over:S.over, why:S.why, boxes:S.delivered.length,
    people:S.humans.map(h => h.short + (h.left ? (h.downed ? '두고' : '남음') : h.rescued ? '업힘' : '탑') + (h.bitten ? '🦠' : '')).join(' '),
    hordes:S.stats.hordes, shots:S.stats.shots, downs:S.stats.downs, carries:S.stats.carries, disobey:S.stats.disobey, flee:S.stats.flee, maxN:Math.round(S.stats.maxNoise) };
};
