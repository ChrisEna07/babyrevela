import { deflateSync, crc32 } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../public");

const BLUE = [166, 216, 240];
const PINK = [255, 209, 224];
const WHITE = [255, 255, 255];
const GOLD = [233, 196, 106];
const GOLD_DARK = [212, 160, 23];

function lerp(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

function blend(c1, c2, t) {
  return c1.map((v, i) => Math.round(v * (1 - t) + c2[i] * t));
}

function heartInequality(x, y) {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(size, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function render(size, { heartScale, maskable }) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = maskable ? size * 0.52 : size * 0.5;
  const s = size * heartScale;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * (size - 1));
      let color = lerp(BLUE, PINK, t);

      const dx = x - size * 0.5;
      const dy = y - size * 0.5;
      const r = Math.sqrt(dx * dx + dy * dy) / (size * 0.75);
      color = blend(color, WHITE, Math.max(0, 1 - r) * 0.3);

      const hx = (x - cx) / s;
      const hy = -(y - cy) / s;
      if (heartInequality(hx, hy)) {
        color = blend(GOLD, GOLD_DARK, Math.max(0, hy));
      }

      const offset = (y * size + x) * 4;
      rgba[offset] = color[0];
      rgba[offset + 1] = color[1];
      rgba[offset + 2] = color[2];
      rgba[offset + 3] = 255;
    }
  }
  return encodePNG(size, rgba);
}

mkdirSync(outDir, { recursive: true });

const icons = [
  { name: "icon-192.png", size: 192, heartScale: 0.4, maskable: false },
  { name: "icon-512.png", size: 512, heartScale: 0.4, maskable: false },
  { name: "icon-maskable-512.png", size: 512, heartScale: 0.26, maskable: true },
  { name: "apple-touch-icon.png", size: 180, heartScale: 0.4, maskable: false },
];

for (const icon of icons) {
  const buffer = render(icon.size, icon);
  const file = resolve(outDir, icon.name);
  writeFileSync(file, buffer);
  console.log(`✓ ${icon.name} (${buffer.length} bytes)`);
}
