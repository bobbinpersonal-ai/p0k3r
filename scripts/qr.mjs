// A tiny QR encoder — byte mode, error-correction level L, versions 1-4.
//
// It exists so the printed door-knock material can carry a scannable code
// without adding a runtime dependency or calling out to an image service at
// build time. The narrow scope is the point: at level L, versions 1 through 4
// are all single-block, so there is no Reed-Solomon interleaving to get wrong,
// and 78 characters is more URL than any of our links need.
//
// Verified by scripts/qr.test.mjs, which decodes the matrix back through the
// same placement and asserts it round-trips, and cross-checks the computed
// format bits against the published table.

const EC_CODEWORDS = { 1: 7, 2: 10, 3: 15, 4: 20 };
const DATA_CODEWORDS = { 1: 19, 2: 34, 3: 55, 4: 80 };
const ALIGNMENT = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26] };

// --- GF(256) ----------------------------------------------------------------

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];

const mul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

/** The generator polynomial for `count` error-correction codewords. */
function generator(count) {
  let poly = [1];
  for (let i = 0; i < count; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= mul(poly[j], 1);
      next[j + 1] ^= mul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function reedSolomon(data, ecCount) {
  const gen = generator(ecCount);
  const rest = new Array(ecCount).fill(0);
  for (const byte of data) {
    const factor = byte ^ rest[0];
    rest.shift();
    rest.push(0);
    if (factor !== 0) {
      for (let i = 0; i < ecCount; i++) rest[i] ^= mul(gen[i + 1], factor);
    }
  }
  return rest;
}

// --- Format information -----------------------------------------------------

/**
 * BCH(15,5) over the format bits, XOR'd with the spec's fixed mask so an
 * all-zero format can't read as valid.
 */
export function formatBits(mask) {
  // 01 is level L in the two-bit EC field.
  const data = (0b01 << 3) | mask;
  let value = data << 10;
  for (let i = 4; i >= 0; i--) {
    if (value & (1 << (i + 10))) value ^= 0x537 << i;
  }
  return ((data << 10) | value) ^ 0x5412;
}

// --- Bit stream -------------------------------------------------------------

function encodeData(text, version) {
  const bytes = new TextEncoder().encode(text);
  const capacity = DATA_CODEWORDS[version];
  const bits = [];
  const push = (value, length) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };

  push(0b0100, 4); // byte mode
  push(bytes.length, 8); // 8-bit count field for versions 1-9
  for (const byte of bytes) push(byte, 8);

  // Terminator, then out to a whole byte, then the spec's alternating padding.
  const limit = capacity * 8;
  for (let i = 0; i < 4 && bits.length < limit; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    codewords.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0));
  }
  for (let i = 0; codewords.length < capacity; i++) codewords.push(i % 2 === 0 ? 0xec : 0x11);

  return codewords.concat(reedSolomon(codewords, EC_CODEWORDS[version]));
}

/** The smallest version that fits, or null when the text is too long for v4. */
export function pickVersion(text) {
  const needed = new TextEncoder().encode(text).length + 2; // mode + length header
  for (const version of [1, 2, 3, 4]) {
    if (needed <= DATA_CODEWORDS[version]) return version;
  }
  return null;
}

// --- Function patterns ------------------------------------------------------

/** The modules the data can't be written into: finders, timing, format, etc. */
export function functionPatterns(version) {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

  const set = (row, col, dark) => {
    modules[row][col] = dark;
    reserved[row][col] = true;
  };

  // Finder patterns plus their separators, one at each corner but bottom-right.
  for (const [top, left] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = top + r;
        const col = left + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3));
        set(row, col, ring !== 2 && ring <= 3);
      }
    }
  }

  // Alignment patterns, skipping the three that would sit on a finder.
  const centers = ALIGNMENT[version];
  for (const row of centers) {
    for (const col of centers) {
      const onFinder =
        (row === 6 && col === 6) ||
        (row === 6 && col === size - 7) ||
        (row === size - 7 && col === 6);
      if (onFinder) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          set(row + r, col + c, Math.max(Math.abs(r), Math.abs(c)) !== 1);
        }
      }
    }
  }

  // Timing patterns down row and column 6.
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  // The always-dark module, and the two format-information strips.
  set(size - 8, 8, true);
  for (let i = 0; i <= 8; i++) {
    if (!reserved[8][i]) set(8, i, false);
    if (!reserved[i][8]) set(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    if (!reserved[8][size - 1 - i]) set(8, size - 1 - i, false);
    if (!reserved[size - 1 - i][8]) set(size - 1 - i, 8, false);
  }

  return { size, modules, reserved };
}

/** Every free module, in the order the spec writes data into them. */
export function placementOrder(size, reserved) {
  const cells = [];
  let upward = true;
  for (let right = size - 1; right >= 0; right -= 2) {
    const pair = right === 6 ? 5 : right; // column 6 is timing — skip past it
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (const col of [pair, pair - 1]) {
        if (col < 0 || reserved[row][col]) continue;
        cells.push([row, col]);
      }
    }
    upward = !upward;
    if (right === 6) right--; // the pair we just wrote was 5/4
  }
  return cells;
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function writeFormat(modules, size, mask) {
  const bits = formatBits(mask);
  const bit = (i) => ((bits >> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) modules[8][i] = bit(i);
  modules[8][7] = bit(6);
  modules[8][8] = bit(7);
  modules[7][8] = bit(8);
  for (let i = 9; i <= 14; i++) modules[14 - i][8] = bit(i);
  for (let i = 0; i <= 7; i++) modules[size - 1 - i][8] = bit(i);
  for (let i = 8; i <= 14; i++) modules[8][size - 15 + i] = bit(i);
  // The second copy's last bit lands on the always-dark module, so it goes
  // back afterwards — the spec spends that position on the fixed module, not
  // on format information.
  modules[size - 8][8] = true;
}

/** The spec's four penalty rules; the lowest-scoring mask is the one we use. */
function penalty(modules, size) {
  let score = 0;
  const runs = (get) => {
    for (let a = 0; a < size; a++) {
      let run = 1;
      for (let b = 1; b < size; b++) {
        if (get(a, b) === get(a, b - 1)) {
          run++;
        } else {
          if (run >= 5) score += run - 2;
          run = 1;
        }
      }
      if (run >= 5) score += run - 2;
    }
  };
  runs((a, b) => modules[a][b]);
  runs((a, b) => modules[b][a]);

  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = modules[r][c];
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) {
        score += 3;
      }
    }
  }

  const finder = [true, false, true, true, true, false, true, false, false, false, false];
  const reversed = [...finder].reverse();
  const matches = (line, at, pattern) =>
    pattern.every((want, i) => line[at + i] === want);
  for (let a = 0; a < size; a++) {
    const row = modules[a];
    const col = modules.map((line) => line[a]);
    for (const line of [row, col]) {
      for (let at = 0; at + 11 <= size; at++) {
        if (matches(line, at, finder) || matches(line, at, reversed)) score += 40;
      }
    }
  }

  const dark = modules.flat().filter(Boolean).length;
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;
  return score;
}

/** The finished module matrix: true is a dark module. */
export function encode(text) {
  const version = pickVersion(text);
  if (!version) throw new Error(`Too long for a version 4 code: ${text.length} chars`);

  const { size, modules, reserved } = functionPatterns(version);
  const codewords = encodeData(text, version);
  const cells = placementOrder(size, reserved);

  cells.forEach(([row, col], i) => {
    const byte = codewords[i >> 3];
    modules[row][col] = byte !== undefined && ((byte >> (7 - (i % 8))) & 1) === 1;
  });

  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const candidate = modules.map((line) => [...line]);
    for (const [row, col] of cells) {
      if (MASKS[mask](row, col)) candidate[row][col] = !candidate[row][col];
    }
    writeFormat(candidate, size, mask);
    const score = penalty(candidate, size);
    if (!best || score < best.score) best = { score, mask, modules: candidate };
  }

  return { version, size, mask: best.mask, modules: best.modules };
}

/** A quiet-zone-padded SVG, sized in module units so CSS can scale it freely. */
export function toSvg(text, { quiet = 4 } = {}) {
  const { size, modules } = encode(text);
  const total = size + quiet * 2;
  const path = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (modules[row][col]) path.push(`M${col + quiet} ${row + quiet}h1v1h-1z`);
    }
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="QR code">`,
    `<rect width="${total}" height="${total}" fill="#fff"/>`,
    `<path fill="#000" d="${path.join("")}"/>`,
    `</svg>`,
  ].join("");
}
