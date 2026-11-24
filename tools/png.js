// 아주 작은 PNG 읽기/쓰기 (8비트 RGB/RGBA, 비월 없음). 외부 패키지 없이 그림을 자르고 줄일 때 써요.
const fs = require('fs'), zlib = require('zlib');

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = buf => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };

function read(file){
  const b = fs.readFileSync(file); let p = 8, w, h, depth, type, idat = [];
  while (p < b.length){ const len = b.readUInt32BE(p), t = b.toString('ascii', p+4, p+8), d = b.subarray(p+8, p+8+len);
    if (t === 'IHDR'){ w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; type = d[9]; if (d[12]) throw new Error('interlaced'); }
    if (t === 'IDAT') idat.push(d); if (t === 'IEND') break; p += 12 + len; }
  if (depth !== 8 || (type !== 6 && type !== 2)) throw new Error('only 8-bit RGB/RGBA');
  const ch = type === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * ch, out = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  for (let y = 0; y < h; y++){ const f = raw[y*(stride+1)], src = raw.subarray(y*(stride+1)+1, (y+1)*(stride+1));
    for (let i = 0; i < stride; i++){ const a = i >= ch ? cur[i-ch] : 0, up = prev[i], c = i >= ch ? prev[i-ch] : 0; let v = src[i];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4){ const pp = a + up - c, pa = Math.abs(pp-a), pb = Math.abs(pp-up), pc = Math.abs(pp-c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      cur[i] = v & 255; }
    for (let x = 0; x < w; x++){ const o = (y*w+x)*4; out[o] = cur[x*ch]; out[o+1] = cur[x*ch+1]; out[o+2] = cur[x*ch+2]; out[o+3] = ch === 4 ? cur[x*ch+3] : 255; }
    [prev, cur] = [cur, prev]; }
  return { w, h, data: out };
}

function write(file, img){
  const { w, h, data } = img, raw = Buffer.alloc((w*4+1)*h);
  for (let y = 0; y < h; y++){ raw[y*(w*4+1)] = 0; data.copy(raw, y*(w*4+1)+1, y*w*4, (y+1)*w*4); }
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level:9 })), chunk('IEND', Buffer.alloc(0))]));
}

function crop(img, x0, y0, cw, chh){ const out = Buffer.alloc(cw*chh*4);
  for (let y = 0; y < chh; y++) img.data.copy(out, y*cw*4, ((y0+y)*img.w + x0)*4, ((y0+y)*img.w + x0 + cw)*4);
  return { w: cw, h: chh, data: out }; }

// 평균 내어 줄이기 (부드럽게)
function resize(img, nw, nh){ const out = Buffer.alloc(nw*nh*4), sx = img.w/nw, sy = img.h/nh;
  for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++){ const s = [0,0,0,0]; let n = 0;
    for (let yy = Math.floor(y*sy); yy < Math.floor((y+1)*sy); yy++) for (let xx = Math.floor(x*sx); xx < Math.floor((x+1)*sx); xx++){ const o = (yy*img.w+xx)*4; for (let k = 0; k < 4; k++) s[k] += img.data[o+k]; n++; }
    for (let k = 0; k < 4; k++) out[(y*nw+x)*4+k] = Math.round(s[k]/n); }
  return { w: nw, h: nh, data: out }; }

module.exports = { read, write, crop, resize };
