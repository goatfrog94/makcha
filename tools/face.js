// 큰 도트 스프라이트(키 약 115px)에서 머리 부분을 정사각형으로 잘라 카드 얼굴(48px)을 만들어요
// 사용: node tools/face.js 큰스프라이트폴더 출력폴더 이름1,이름2,...
const P = require('./png.js');
const [,, inDir, outDir, names] = process.argv, S = 48;
for (const id of names.split(',')){
  const m = P.read(`${inDir}/${id}.png`);
  // 맨 위 불투명 줄 = 머리 꼭대기. 머리는 대략 키의 42%
  let top = 0; while (top < m.h && ![...Array(m.w).keys()].some(x => m.data[(top*m.w+x)*4+3])) top++;
  const headH = Math.round(m.h * .42);
  // 머리 줄들의 가로 무게중심
  let sx = 0, n = 0; for (let y = top; y < top + headH; y++) for (let x = 0; x < m.w; x++) if (m.data[(y*m.w+x)*4+3]){ sx += x; n++; }
  const cx = Math.round(sx / Math.max(1, n));
  const out = Buffer.alloc(S * S * 4), x0 = cx - S/2, y0 = top - 3;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++){
    const X = x0 + x, Y = y0 + y; if (X < 0 || Y < 0 || X >= m.w || Y >= m.h) continue;
    m.data.copy(out, (y*S+x)*4, (Y*m.w+X)*4, (Y*m.w+X)*4+4); }
  P.write(`${outDir}/${id}.png`, { w: S, h: S, data: out });
}
console.log('faces', names);
