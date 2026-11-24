// 제미나이가 칸으로 나눠 그린 그림(검은 줄로 구분)을 칸마다 잘라 저장해요
// 사용: node tools/grid.js 원본.png 출력폴더 모양(2x2|4rows|1) 이름1,이름2,... 출력가로폭
const P = require('./png.js');
const [,, src, outDir, mode, names, outW = 480] = process.argv;
const img = P.read(src), W = img.w, H = img.h;
const lum = (x, y) => { const o = (y*W + x)*4; return (img.data[o] + img.data[o+1] + img.data[o+2]) / 3; };
// 거의 까만 줄 찾기: 기대 위치(frac) 둘레 ±8%에서 평균 밝기가 가장 낮은 줄
function darkLine(horizontal, frac){
  const len = horizontal ? H : W, other = horizontal ? W : H, lo = Math.floor(len*(frac-.08)), hi = Math.ceil(len*(frac+.08));
  let best = -1, bv = Infinity;
  for (let i = lo; i < hi; i++){ let s = 0; for (let j = 0; j < other; j += 3) s += horizontal ? lum(j, i) : lum(i, j); s /= other/3; if (s < bv){ bv = s; best = i; } }
  // 검은 띠의 양 끝까지 넓혀요
  const isDark = i => { let s = 0; for (let j = 0; j < other; j += 3) s += horizontal ? lum(j, i) : lum(i, j); return s/(other/3) < bv + 12; };
  let a = best, b = best; while (a > 0 && isDark(a-1)) a--; while (b < len-1 && isDark(b+1)) b++;
  return [a, b];
}
const cuts = (horizontal, n) => { const r = [0]; for (let k = 1; k < n; k++){ const [a, b] = darkLine(horizontal, k/n); r.push(a, b+1); } r.push(horizontal ? H : W); return r; };
const ys = mode === '1' ? [0, H] : cuts(true, mode === '4rows' ? 4 : 2), xs = mode === '2x2' ? cuts(false, 2) : [0, W];
const list = names.split(','); let k = 0;
for (let r = 0; r < ys.length; r += 2) for (let c = 0; c < xs.length; c += 2){
  if (k >= list.length) break;
  const pad = 6, x0 = xs[c] + pad, x1 = xs[c+1] - pad, y0 = ys[r] + pad, y1 = ys[r+1] - pad;
  const crop = P.crop(img, x0, y0, x1 - x0, y1 - y0);
  const ow = +outW, oh = Math.round(ow * crop.h / crop.w);
  const small = P.resize(crop, ow, oh);
  // 색을 조금 줄여요(채널마다 8단계씩) → 도트 느낌은 그대로, 파일은 가볍게
  for (let i = 0; i < small.data.length; i += 4) for (let c = 0; c < 3; c++) small.data[i+c] = Math.min(255, Math.round(small.data[i+c] / 8) * 8);
  P.write(`${outDir}/${list[k]}.png`, small);
  console.log(list[k], `${x1-x0}x${y1-y0} → ${ow}x${oh}`); k++;
}
