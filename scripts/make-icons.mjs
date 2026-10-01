// Рисует иконки и заставку TOCHKA Fitness (SPEC_v3_3 §A2): чёрная гантель на светлой плитке.
// Запуск: node scripts/make-icons.mjs — PNG пишутся в assets/images/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'images');
const SIZE = 1024;

// Гантель в координатах 1024×1024: два «блина» 140×330 (r 28) с центрами X 300 и 724, гриф 300×80 (r 20).
const DUMBBELL = [
  { cx: 300, cy: 512, w: 140, h: 330, r: 28 },
  { cx: 724, cy: 512, w: 140, h: 330, r: 28 },
  { cx: 512, cy: 512, w: 300, h: 80, r: 20 },
];

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// Расстояние со знаком до скруглённого прямоугольника (отрицательное — внутри).
function sdRoundRect(x, y, { cx, cy, w, h, r }) {
  const qx = Math.abs(x - cx) - w / 2 + r;
  const qy = Math.abs(y - cy) - h / 2 + r;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return outside + Math.min(Math.max(qx, qy), 0) - r;
}

// Покрытие пикселя фигурой (сглаживание по расстоянию до края). scale и offset — масштаб вокруг центра и сдвиг.
// px — размер пикселя выходной картинки в единицах 1024 (для favicon больше 1).
function coverage(x0, y0, scale, px = 1) {
  const x = (x0 - SIZE / 2) / scale + 512;
  const y = (y0 - SIZE / 2) / scale + 512;
  const d = (Math.min(...DUMBBELL.map((s) => sdRoundRect(x, y, s))) * scale) / px;
  return Math.min(1, Math.max(0, 0.5 - d));
}

function draw({ width = SIZE, height = SIZE, bg, fg, scale = 1, crop, px = 1 }) {
  const [br, bgG, bb, ba] = bg ? [...hex(bg), 255] : [0, 0, 0, 0];
  const [fr, fgG, fb] = hex(fg);
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = (crop ? x + crop.x : x) * px + px / 2;
      const sy = (crop ? y + crop.y : y) * px + px / 2;
      const a = coverage(sx, sy, scale, px);
      const i = (y * width + x) * 4;
      if (ba === 255) {
        rgba[i] = Math.round(br + (fr - br) * a);
        rgba[i + 1] = Math.round(bgG + (fgG - bgG) * a);
        rgba[i + 2] = Math.round(bb + (fb - bb) * a);
        rgba[i + 3] = 255;
      } else {
        rgba[i] = fr;
        rgba[i + 1] = fgG;
        rgba[i + 2] = fb;
        rgba[i + 3] = Math.round(a * 255);
      }
    }
  }
  return png(width, height, rgba);
}

// ---- Минимальный PNG-энкодер (RGBA, 8 бит) ----

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT, { recursive: true });
const write = (name, buf) => {
  writeFileSync(join(OUT, name), buf);
  console.log(`${name} — ${buf.length} B`);
};

const LIGHT = '#ECECEA';
const INK = '#111111';
const ADAPTIVE = 0.62; // уменьшение для безопасной зоны адаптивной иконки Android

write('icon.png', draw({ bg: LIGHT, fg: INK }));
write('android-icon-foreground.png', draw({ fg: INK, scale: ADAPTIVE }));
write('android-icon-monochrome.png', draw({ fg: '#FFFFFF', scale: ADAPTIVE }));
// Заставка: только гантель (564×330 + поля), белая на прозрачном; ширину ~200 задаёт плагин expo-splash-screen.
const PAD = 8;
const crop = { x: 230 - PAD, y: 347 - PAD };
write('splash-icon.png', draw({ width: 564 + PAD * 2, height: 330 + PAD * 2, fg: '#FFFFFF', crop }));
write('favicon.png', draw({ width: 48, height: 48, bg: LIGHT, fg: INK, px: SIZE / 48 }));
