/**
 * Minimal bencode codec for modifying .torrent files in the browser.
 * All string/bytes values are kept as Uint8Array to preserve binary integrity.
 */

export type BValue =
  | Uint8Array          // bencoded string (bytes)
  | number              // bencoded integer
  | BValue[]            // bencoded list
  | { [key: string]: BValue };  // bencoded dict

const ENC = new TextEncoder();
const DEC = new TextDecoder();

const COLON = 58;  // ':'
const I_CODE = 105; // 'i'
const L_CODE = 108; // 'l'
const D_CODE = 100; // 'd'
const E_CODE = 101; // 'e'

function decodeAt(data: Uint8Array, pos: number): [BValue, number] {
  const ch = data[pos];

  if (ch === I_CODE) {
    let end = pos + 1;
    while (data[end] !== E_CODE) end++;
    const n = parseInt(DEC.decode(data.subarray(pos + 1, end)));
    return [n, end + 1];
  }

  if (ch === L_CODE) {
    const list: BValue[] = [];
    let p = pos + 1;
    while (data[p] !== E_CODE) {
      const [v, next] = decodeAt(data, p);
      list.push(v);
      p = next;
    }
    return [list, p + 1];
  }

  if (ch === D_CODE) {
    const dict: { [key: string]: BValue } = {};
    let p = pos + 1;
    while (data[p] !== E_CODE) {
      const [k, p2] = decodeAt(data, p);
      const [v, p3] = decodeAt(data, p2);
      dict[DEC.decode(k as Uint8Array)] = v;
      p = p3;
    }
    return [dict, p + 1];
  }

  // String: <len>:<bytes>
  let colonPos = pos;
  while (data[colonPos] !== COLON) colonPos++;
  const len = parseInt(DEC.decode(data.subarray(pos, colonPos)));
  const start = colonPos + 1;
  return [data.subarray(start, start + len), start + len];
}

export function decode(data: Uint8Array): BValue {
  return decodeAt(data, 0)[0];
}

function encodeInto(chunks: Uint8Array[], value: BValue): void {
  if (value instanceof Uint8Array) {
    chunks.push(ENC.encode(String(value.length) + ':'));
    chunks.push(value);
    return;
  }
  if (typeof value === 'number') {
    chunks.push(ENC.encode('i' + value + 'e'));
    return;
  }
  if (Array.isArray(value)) {
    chunks.push(ENC.encode('l'));
    for (const item of value) encodeInto(chunks, item);
    chunks.push(ENC.encode('e'));
    return;
  }
  // dict — keys must be sorted lexicographically
  chunks.push(ENC.encode('d'));
  for (const key of Object.keys(value).sort()) {
    const kb = ENC.encode(key);
    chunks.push(ENC.encode(String(kb.length) + ':'));
    chunks.push(kb);
    encodeInto(chunks, value[key]);
  }
  chunks.push(ENC.encode('e'));
}

export function encode(value: BValue): Uint8Array {
  const chunks: Uint8Array[] = [];
  encodeInto(chunks, value);
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return out;
}

/** Convenience: encode a JS string as bencode string bytes. */
export function str(s: string): Uint8Array {
  return ENC.encode(s);
}

/** Convenience: decode bencode string bytes to JS string. */
export function toStr(v: BValue): string {
  return v instanceof Uint8Array ? DEC.decode(v) : '';
}
