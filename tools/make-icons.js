// Generates icons/icon-192.png and icons/icon-512.png without any dependencies.
// A simplified version of icons/icon.svg (shapes only), rasterised with supersampling.
//   node tools/make-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function makePng(size) {
  const SS = 3; // supersampling factor
  const W = size * SS;
  const px = new Float32Array(W * W * 3);
  const put = (i, c) => { px[i * 3] = c[0]; px[i * 3 + 1] = c[1]; px[i * 3 + 2] = c[2]; };

  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const YEL = hex('#ffd23f'), BLUE = hex('#4f9be8'), DARK = hex('#2c5fa8'), INK = hex('#1c2b3a'), PINK = hex('#ffb3c6'), WHITE = [255, 255, 255], BG = [255, 255, 255];
  const COLORS = { a: hex('#ffd23f'), b: hex('#7bd389'), c: hex('#ff8c42'), d: hex('#b388eb') };

  // Shapes in a 100x100 coordinate system (same proportions as the SVG icon).
  // Mouse is drawn at centre (50, 51) with scale 0.9 of the SVG mouse units.
  const k = 0.9, cx0 = 50, cy0 = 51;
  const M = (x, y) => [cx0 + x * k, cy0 + y * k];
  const shapes = [];
  const ellipse = (x, y, rx, ry, color) => shapes.push({ t: 'e', c: M(x, y), rx: rx * k, ry: ry * k, color });
  const circle = (x, y, r, color) => ellipse(x, y, r, r, color);
  // ears (outline then fill)
  circle(-21, -19, 13.5, DARK); circle(21, -19, 13.5, DARK);
  circle(-21, -19, 12, BLUE); circle(21, -19, 12, BLUE);
  circle(-23, -22, 5.5, PINK); circle(23, -22, 5.5, PINK);
  // body
  ellipse(0, 2, 27.5, 35.5, DARK);
  ellipse(0, 2, 26, 34, BLUE);
  // eyes + nose
  circle(-9, -11, 4, INK); circle(9, -11, 4, INK);
  circle(-7.5, -12.5, 1.3, WHITE); circle(10.5, -12.5, 1.3, WHITE);
  circle(0, -30, 5, INK);
  // buttons
  circle(0, 6, 4.5, COLORS.a); circle(0, 24, 4.5, COLORS.b); circle(-10, 15, 4.5, COLORS.c); circle(10, 15, 4.5, COLORS.d);

  const R = 21.5; // rounded corner radius of the background (110/512 * 100)
  for (let j = 0; j < W; j++) {
    for (let i = 0; i < W; i++) {
      const x = ((i + 0.5) / W) * 100, y = ((j + 0.5) / W) * 100;
      // rounded square background
      const dx = Math.max(R - x, x - (100 - R), 0), dy = Math.max(R - y, y - (100 - R), 0);
      let col = dx * dx + dy * dy <= R * R ? YEL : BG;
      if (col === YEL) {
        for (const s of shapes) {
          const ex = (x - s.c[0]) / s.rx, ey = (y - s.c[1]) / s.ry;
          if (ex * ex + ey * ey <= 1) col = s.color;
        }
      }
      put(j * W + i, col);
    }
  }

  // downsample + encode (RGBA so the corners are transparent)
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const i = (y * SS + sy) * W + (x * SS + sx);
        const c = [px[i * 3], px[i * 3 + 1], px[i * 3 + 2]];
        const isBg = c[0] === BG[0] && c[1] === BG[1] && c[2] === BG[2];
        if (!isBg) { r += c[0]; g += c[1]; b += c[2]; a += 1; }
      }
      const o = y * (size * 4 + 1) + 1 + x * 4;
      if (a) { raw[o] = r / a; raw[o + 1] = g / a; raw[o + 2] = b / a; raw[o + 3] = (a / (SS * SS)) * 255; }
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

let table;
function crc32(buf) {
  if (!table) {
    table = new Int32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c; }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return ~crc;
}

const out = path.join(__dirname, '..', 'icons');
for (const size of [192, 512]) {
  const file = path.join(out, 'icon-' + size + '.png');
  fs.writeFileSync(file, makePng(size));
  console.log('wrote', file);
}
