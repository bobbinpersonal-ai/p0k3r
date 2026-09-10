// Round-trips the encoder: rebuild the matrix, undo the mask, read the data
// modules back in placement order and check the bytes come out as they went
// in. A decoder that shares the encoder's placement can't catch a placement
// bug on its own, so the format bits are checked against the published table
// separately, and the finder/timing patterns are asserted by position.

import assert from "node:assert";
import {
  encode,
  formatBits,
  functionPatterns,
  pickVersion,
  placementOrder,
  toSvg,
} from "./qr.mjs";

let pass = 0;
const check = (name, fn) => {
  try {
    fn();
    pass++;
    console.log(`PASS  ${name}`);
  } catch (err) {
    console.log(`FAIL  ${name}\n        ${err.message}`);
    process.exitCode = 1;
  }
};

// The 15-bit format strings for level L, masks 0-7, straight out of the spec.
const PUBLISHED_L = [
  0b111011111000100, 0b111001011110011, 0b111110110101010, 0b111100010011101,
  0b110011000101111, 0b110001100011000, 0b110110001000001, 0b110100101110110,
];

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

function decode(text) {
  const { version, size, mask, modules } = encode(text);
  const { reserved } = functionPatterns(version);
  const cells = placementOrder(size, reserved);

  const bits = cells.map(([row, col]) => {
    const dark = MASKS[mask](row, col) ? !modules[row][col] : modules[row][col];
    return dark ? 1 : 0;
  });
  const read = (at, length) =>
    bits.slice(at, at + length).reduce((acc, bit) => (acc << 1) | bit, 0);

  assert.strictEqual(read(0, 4), 0b0100, "mode is byte mode");
  const length = read(4, 8);
  const bytes = Array.from({ length }, (_, i) => read(12 + i * 8, 8));
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

check("format bits match the published level-L table", () => {
  PUBLISHED_L.forEach((want, mask) => assert.strictEqual(formatBits(mask), want, `mask ${mask}`));
});

check("picks the smallest version that fits", () => {
  assert.strictEqual(pickVersion("a".repeat(17)), 1);
  assert.strictEqual(pickVersion("a".repeat(18)), 2);
  assert.strictEqual(pickVersion("a".repeat(78)), 4);
  assert.strictEqual(pickVersion("a".repeat(79)), null);
});

check("round-trips every length up to the version-4 limit", () => {
  for (let n = 1; n <= 78; n++) {
    const text = "https://lovemeafter.com/".slice(0, Math.min(n, 24)).padEnd(n, "x");
    assert.strictEqual(decode(text), text, `length ${n}`);
  }
});

check("round-trips the real links", () => {
  for (const url of [
    "https://lovemeafter.com/yard?source=door-knock",
    "https://lovemeafter.com/drive?source=door-knock",
    "https://lovemeafter.com",
  ]) {
    assert.strictEqual(decode(url), url);
  }
});

check("finder, timing and dark modules land where they belong", () => {
  const { size, modules } = encode("https://lovemeafter.com/yard?source=door-knock");
  for (const [top, left] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    assert.ok(modules[top][left], "finder corner is dark");
    assert.ok(!modules[top + 1][left + 1], "finder ring is light");
    assert.ok(modules[top + 3][left + 3], "finder centre is dark");
  }
  for (let i = 8; i < size - 8; i++) {
    assert.strictEqual(modules[6][i], i % 2 === 0, `timing row at ${i}`);
    assert.strictEqual(modules[i][6], i % 2 === 0, `timing column at ${i}`);
  }
  assert.ok(modules[size - 8][8], "the always-dark module is dark");
});

check("svg carries one rect per dark module and a quiet zone", () => {
  const { size, modules } = encode("https://lovemeafter.com");
  const svg = toSvg("https://lovemeafter.com");
  const dark = modules.flat().filter(Boolean).length;
  assert.strictEqual((svg.match(/M\d+ \d+h1v1h-1z/g) || []).length, dark);
  assert.ok(svg.includes(`viewBox="0 0 ${size + 8} ${size + 8}"`), svg.slice(0, 120));
});

check("refuses text it cannot encode rather than truncating", () => {
  assert.throws(() => encode("a".repeat(200)), /version 4/);
});

console.log(`\n${pass} passed`);
