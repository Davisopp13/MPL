// Pure Node.js PNG icon generator — no dependencies
import { deflateSync } from 'zlib'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

// CRC32 table for PNG chunks
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xFF]
  return (c ^ 0xFFFFFFFF) >>> 0
}

function u32(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b }

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const crcVal = crc32(Buffer.concat([t, data]))
  return Buffer.concat([u32(data.length), t, data, u32(crcVal)])
}

function encodePNG(rgba, w, h) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = chunk('IHDR', Buffer.concat([u32(w), u32(h), Buffer.from([8, 6, 0, 0, 0])]))
  const rows = []
  for (let y = 0; y < h; y++) {
    rows.push(Buffer.from([0])) // filter: None
    rows.push(Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4))
  }
  const idat = chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 6 }))
  const iend = chunk('IEND', Buffer.alloc(0))
  return Buffer.concat([sig, ihdr, idat, iend])
}

function isInRoundedRect(x, y, w, h, r) {
  const cx = x < r ? r : x > w - 1 - r ? w - 1 - r : x
  const cy = y < r ? r : y > h - 1 - r ? h - 1 - r : y
  return Math.hypot(x - cx, y - cy) <= r
}

function generateIcon(size) {
  const px = new Uint8Array(size * size * 4)
  const r = Math.round(size * 0.2) // border-radius ~20%

  // Gradient: #0EA5E9 → #0284C7 (diagonal)
  const [r1, g1, b1] = [0x0E, 0xA5, 0xE9]
  const [r2, g2, b2] = [0x02, 0x84, 0xC7]

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      if (!isInRoundedRect(x, y, size, size, r)) {
        px[i + 3] = 0 // transparent
        continue
      }
      const t = (x + y) / (size * 2 - 2)
      px[i]     = Math.round(r1 + (r2 - r1) * t)
      px[i + 1] = Math.round(g1 + (g2 - g1) * t)
      px[i + 2] = Math.round(b1 + (b2 - b1) * t)
      px[i + 3] = 255
    }
  }

  // White bars (matching SVG proportions: 10/40, 20/40 x; 12/40, 18.5/40, 25/40 y; 3/40 height)
  const lh = Math.max(1, Math.round(size * 3 / 40))
  const bars = [
    { x1: Math.round(size * 10/40), x2: Math.round(size * 30/40), y: Math.round(size * 12/40) },
    { x1: Math.round(size * 10/40), x2: Math.round(size * 30/40), y: Math.round(size * 18.5/40) },
    { x1: Math.round(size * 10/40), x2: Math.round(size * 20/40), y: Math.round(size * 25/40) },
  ]

  for (const { x1, x2, y: by } of bars) {
    for (let y = by; y < by + lh; y++) {
      for (let x = x1; x < x2; x++) {
        const i = (y * size + x) * 4
        px[i] = px[i+1] = px[i+2] = px[i+3] = 255
      }
    }
  }

  return encodePNG(px, size, size)
}

const icons = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of icons) {
  writeFileSync(join(publicDir, name), generateIcon(size))
  console.log(`✓ ${name} (${size}x${size})`)
}
