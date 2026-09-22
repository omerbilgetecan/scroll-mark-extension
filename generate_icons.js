const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function calcCrc(buf) {
  let c;
  let crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(calcCrc(typeAndData), 0);
  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

function createPng(width, height, drawFn) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const idx = 1 + x * 4;
      row[idx] = r;
      row[idx + 1] = g;
      row[idx + 2] = b;
      row[idx + 3] = a;
    }
    rawRows.push(row);
  }
  const rawData = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Icon Drawing logic: A sleek vibrant indigo/cyan bookmark scroll icon
function drawIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  const cx = nx - 0.5;
  const cy = ny - 0.5;
  const dist = Math.sqrt(cx * cx + cy * cy);
  
  // Background rounded rect gradient
  const cornerRadius = 0.22;
  const absX = Math.abs(cx);
  const absY = Math.abs(cy);
  
  let inBg = false;
  if (absX <= 0.42 && absY <= 0.42) {
    if (absX > (0.42 - cornerRadius) && absY > (0.42 - cornerRadius)) {
      const dx = absX - (0.42 - cornerRadius);
      const dy = absY - (0.42 - cornerRadius);
      if (Math.sqrt(dx * dx + dy * dy) <= cornerRadius) inBg = true;
    } else {
      inBg = true;
    }
  }

  if (!inBg) return [0, 0, 0, 0];

  // Background Gradient: Indigo to Cyan (HSL: #6366f1 to #06b6d4)
  const bgR = Math.round(99 + (6 - 99) * ny);
  const bgG = Math.round(102 + (182 - 102) * ny);
  const bgB = Math.round(241 + (212 - 241) * ny);

  // Bookmark / Scroll symbol in center
  // Vertical ribbon / bookmark tag
  const isRibbonX = absX <= 0.16;
  const isRibbonY = ny >= 0.2 && ny <= 0.8;
  const isRibbonNotch = ny > 0.68 && (Math.abs(cx) * 1.8 < (ny - 0.68));

  if (isRibbonX && isRibbonY && !isRibbonNotch) {
    return [255, 255, 255, 245]; // White icon center
  }

  // Scroll lines (horizontal lines representing webpage content)
  if (nx >= 0.18 && nx <= 0.82) {
    if ((ny >= 0.28 && ny <= 0.33) || (ny >= 0.44 && ny <= 0.49) || (ny >= 0.60 && ny <= 0.65)) {
      if (!isRibbonX) {
        return [255, 255, 255, 140]; // Semi-transparent lines
      }
    }
  }

  return [bgR, bgG, bgB, 255];
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const pngBuf = createPng(size, size, drawIcon);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), pngBuf);
  console.log(`Generated icon${size}.png`);
});
