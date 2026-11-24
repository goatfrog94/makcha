// 작은 스프라이트들을 크게 키워 한 장에 나란히 (확인용)
// 사용: node tools/preview.js 출력.png 배율 그림1.png 그림2.png ...
const P = require('./png.js');
const [,, out, scale, ...files] = process.argv; const sc = +scale;
const ims = files.map(f => P.read(f));
const W = ims.reduce((a, m) => a + m.w*sc + 20, 20), H = Math.max(...ims.map(m => m.h))*sc + 40;
const o = { w: W, h: H, data: Buffer.alloc(W*H*4) };
for (let i = 0; i < W*H; i++){ o.data[i*4] = 40; o.data[i*4+1] = 46; o.data[i*4+2] = 56; o.data[i*4+3] = 255; }
let ox = 20; for (const m of ims){ for (let y = 0; y < m.h*sc; y++) for (let x = 0; x < m.w*sc; x++){ const s = (Math.floor(y/sc)*m.w + Math.floor(x/sc))*4; if (m.data[s+3]) m.data.copy(o.data, ((y+20)*W + ox + x)*4, s, s+4); } ox += m.w*sc + 20; }
P.write(out, o);
