// Wraps uint8-util so torrent parsing works outside secure contexts.
// crypto.subtle only exists on https/localhost; when the web UI is opened over
// plain http from a LAN IP it is undefined and uint8-util's hash() throws
// "no web crypto support". In that case fall back to a pure-JS SHA-1.
import { hash as webHash, text2arr, arr2hex, arr2base } from 'uint8-util-original'

export * from 'uint8-util-original'

const scope = typeof window !== 'undefined' ? window : self
const webCrypto = scope.crypto || scope.msCrypto || {}
const hasSubtle = !!(webCrypto.subtle || webCrypto.webkitSubtle)

export const hash = async (data, format, algo = 'sha-1') => {
  if (hasSubtle || algo.toLowerCase() !== 'sha-1') return webHash(data, format, algo)
  if (typeof data === 'string') data = text2arr(data)
  const bytes = data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  const out = sha1(bytes)
  if (format === 'hex') return arr2hex(out)
  if (format === 'base64') return arr2base(out)
  return out
}

function sha1 (bytes) {
  const len = bytes.length
  const padded = (((len + 8) >> 6) + 1) << 6
  const buf = new Uint8Array(padded)
  buf.set(bytes)
  buf[len] = 0x80
  const view = new DataView(buf.buffer)
  view.setUint32(padded - 8, Math.floor(len / 0x20000000))
  view.setUint32(padded - 4, (len << 3) >>> 0)
  const w = new Uint32Array(80)
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0
  for (let off = 0; off < padded; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4)
    for (let i = 16; i < 80; i++) {
      const x = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]
      w[i] = (x << 1) | (x >>> 31)
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4
    for (let i = 0; i < 80; i++) {
      const f = i < 20 ? ((b & c) | (~b & d)) + 0x5a827999
        : i < 40 ? (b ^ c ^ d) + 0x6ed9eba1
          : i < 60 ? ((b & c) | (b & d) | (c & d)) + 0x8f1bbcdc
            : (b ^ c ^ d) + 0xca62c1d6
      const t = (((a << 5) | (a >>> 27)) + f + e + w[i]) | 0
      e = d; d = c; c = (b << 30) | (b >>> 2); b = a; a = t
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0
  }
  const out = new Uint8Array(20)
  const ov = new DataView(out.buffer)
  ov.setUint32(0, h0); ov.setUint32(4, h1); ov.setUint32(8, h2); ov.setUint32(12, h3); ov.setUint32(16, h4)
  return out
}
