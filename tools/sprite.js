// 제미나이 스프라이트 시트(분홍 #FF00FF 배경) → 게임용 작은 도트 그림
// 사용: node tools/sprite.js 원본.png 출력폴더 높이 이름1,이름2,...
const P = require('./png.js');
const [,, src, outDir, outH = 40, names = ''] = process.argv;
const img = P.read(src);
// 분홍 배경 + 제미나이 반짝이 표시(연분홍)까지 배경으로 봐요
// 배경색은 그림마다 조금씩 달라서 네 귀퉁이에서 재요
const BG = (() => { const p = [[8,8],[img.w-9,8],[8,img.h-9],[img.w-9,img.h-9]].map(([x,y]) => (y*img.w+x)*4); return [0,1,2].map(k => p.reduce((t,o) => t + img.data[o+k], 0) / 4); })();
const likeBg = o => { const r = img.data[o], g = img.data[o+1], b = img.data[o+2];
  if (Math.hypot(r - BG[0], g - BG[1], b - BG[2]) < 75) return true;
  return (r > 200 && b > 170 && r - g > 50 && b - g > 35); };
// 배경은 "가장자리에서 이어진 배경색"만이에요. 캐릭터 몸 안의 비슷한 색(보라색 괴물 등)은 지우지 않아요
const BGM = new Uint8Array(img.w * img.h);
{ const q = []; const push = i => { if (!BGM[i] && likeBg(i*4)){ BGM[i] = 1; q.push(i); } };
  for (let x = 0; x < img.w; x++){ push(x); push((img.h-1)*img.w + x); } for (let y = 0; y < img.h; y++){ push(y*img.w); push(y*img.w + img.w-1); }
  while (q.length){ const i = q.pop(), x = i % img.w, y = (i / img.w) | 0;
    if (x > 0) push(i-1); if (x < img.w-1) push(i+1); if (y > 0) push(i-img.w); if (y < img.h-1) push(i+img.w); } }
const isBg = o => BGM[o >> 2] === 1 || (img.data[o] > 200 && img.data[o+2] > 170 && img.data[o] - img.data[o+1] > 50 && img.data[o+2] - img.data[o+1] > 35 && likeBg(o));

// 1) 캐릭터 덩어리 찾기: 배경이 아닌 열들의 묶음 (작은 반짝이 표시는 버려요)
const colN = []; for (let x = 0; x < img.w; x++){ let n = 0; for (let y = 0; y < img.h; y++) if (!isBg((y*img.w+x)*4)) n++; colN.push(n); }
let runs = []; let st = -1;
for (let x = 0; x <= img.w; x++){ const on = x < img.w && colN[x] > 3; if (on && st < 0) st = x; if (!on && st >= 0){ if (x - st > 8) runs.push([st, x]); st = -1; } }
// 이름 수보다 덩어리가 많으면(거품·소품이 떨어져 있을 때) 가장 가까운 덩어리끼리 합쳐요
const want = names ? names.split(',').length : 0;
while (want && runs.length > want){
  let bi = 0; for (let i = 1; i < runs.length - 1; i++) if (runs[i+1][0] - runs[i][1] < runs[bi+1][0] - runs[bi][1]) bi = i;
  // 아주 작은 조각은 가까운 쪽으로 붙이고, 아니면 틈이 가장 좁은 둘을 합쳐요
  runs.splice(bi, 2, [runs[bi][0], runs[bi+1][1]]);
}
// 덩어리가 모자라면(소품이 옆 사람과 닿았을 때) 가장 넓은 덩어리를 가장 얇은 곳에서 갈라요
while (want && runs.length < want){
  let wi = 0; runs.forEach((r, i) => { if (r[1] - r[0] > runs[wi][1] - runs[wi][0]) wi = i; });
  const [a, b] = runs[wi]; let cut = a, best = Infinity;
  for (let x = Math.floor(a + (b - a) * .3); x < a + (b - a) * .7; x++) if (colN[x] < best){ best = colN[x]; cut = x; }
  runs.splice(wi, 1, [a, cut], [cut + 1, b]);
}
if (!want) runs = runs.filter(r => r[1] - r[0] > 40);
const boxes = runs.map(([x0, x1]) => {
  // 세로로 가장 큰 덩어리만 (아래쪽 반짝이 표시 제외)
  const rowN = []; for (let y = 0; y < img.h; y++){ let n = 0; for (let x = x0; x < x1; x++) if (!isBg((y*img.w+x)*4)) n++; rowN.push(n); }
  let best = null, s = -1;
  for (let y = 0; y <= img.h; y++){ const on = y < img.h && rowN[y] > 2; if (on && s < 0) s = y; if (!on && s >= 0){ if (!best || y - s > best[1] - best[0]) best = [s, y]; s = -1; } }
  return { x0, x1, y0: best[0], y1: best[1] };
});

// 2) 모두 같은 비율로 줄여요 (가장 큰 캐릭터 키 = outH)
const maxH = Math.max(...boxes.map(b => b.y1 - b.y0));
const k = maxH / outH;
const list = names ? names.split(',') : boxes.map((_, i) => 'sprite' + i);
boxes.forEach((b, i) => {
  const ow = Math.ceil((b.x1 - b.x0) / k), oh = Math.ceil((b.y1 - b.y0) / k);
  const out = Buffer.alloc(ow * oh * 4);
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++){
    let bg = 0, n = 0; const s = [0, 0, 0];
    const xs = Math.floor(b.x0 + x * k), xe = Math.min(b.x1, Math.floor(b.x0 + (x + 1) * k)), ys = Math.floor(b.y0 + y * k), ye = Math.min(b.y1, Math.floor(b.y0 + (y + 1) * k));
    // 칸 가운데쪽만 봐요 (가장자리 섞인 색을 피해서 또렷하게)
    const mx = Math.max(1, Math.floor((xe - xs) / 4)), my = Math.max(1, Math.floor((ye - ys) / 4));
    for (let yy = ys + my; yy < ye - my; yy++) for (let xx = xs + mx; xx < xe - mx; xx++){
      const o = (yy * img.w + xx) * 4; if (isBg(o)){ bg++; continue; } s[0] += img.data[o]; s[1] += img.data[o+1]; s[2] += img.data[o+2]; n++; }
    const p = (y * ow + x) * 4;
    if (n > bg){ out[p] = s[0]/n; out[p+1] = s[1]/n; out[p+2] = s[2]/n; out[p+3] = 255; }
  }
  // 분홍 배경이 번진 보랏빛 → 어두운 테두리색. 단, 투명한 곳과 맞닿은 가장자리만 (보라색 몸통은 그대로)
  const edge = (x, y) => [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => { const nx = x+dx, ny = y+dy; return nx < 0 || ny < 0 || nx >= ow || ny >= oh || !out[(ny*ow+nx)*4+3]; });
  const fix = [];
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++){ const p = (y*ow+x)*4; if (!out[p+3] || !edge(x,y)) continue;
    const [r, g, bb] = [out[p], out[p+1], out[p+2]]; if (r > g + 25 && bb > g + 25 && Math.abs(r - bb) < 70) fix.push(p); }
  for (const p of fix){ out[p] = 34; out[p+1] = 28; out[p+2] = 38; }
  // 떨어져 있는 작은 얼룩(배경의 흐린 자국 등)은 지워요: 가장 큰 덩어리의 35%보다 작은 조각
  const lab = new Int32Array(ow * oh).fill(-1), sizes = [];
  for (let s0 = 0; s0 < ow * oh; s0++){ if (lab[s0] >= 0 || !out[s0*4+3]) continue;
    const id = sizes.length, q = [s0]; lab[s0] = id; let n = 0;
    while (q.length){ const c = q.pop(); n++; const cx = c % ow, cy = (c / ow) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){ const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= ow || ny >= oh) continue; const nn = ny * ow + nx; if (lab[nn] < 0 && out[nn*4+3]){ lab[nn] = id; q.push(nn); } } }
    sizes.push(n); }
  const big = Math.max(0, ...sizes);
  for (let s0 = 0; s0 < ow * oh; s0++) if (lab[s0] >= 0 && sizes[lab[s0]] < big * .35) out[s0*4+3] = 0;
  P.write(`${outDir}/${list[i]}.png`, { w: ow, h: oh, data: out });
  console.log(list[i], ow + 'x' + oh);
});
