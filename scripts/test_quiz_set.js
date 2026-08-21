// Exercises the real completeSetHTML logic pulled out of native-quiz-modal.liquid,
// with the real tier table and the real eligible-handle list.
const fs = require('fs');

const disc = JSON.parse(
  fs.readFileSync('theme-src/snippets/spadra-stack-discounts.liquid', 'utf8')
    .match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
);

const STACK_DISCOUNT_HANDLES = {};
disc.eligible.forEach(h => { STACK_DISCOUNT_HANDLES[h] = true; });
const STACK_TIERS = disc.tiers.slice();

const esc = s => String(s);
const money = c => '$' + (Math.round(c) / 100).toFixed(2);
const joinList = i => i.length === 2 ? i[0] + ' and ' + i[1]
  : i.slice(0, -1).join(', ') + ' and ' + i[i.length - 1];

function rateFor(n) {
  let best = 0;
  STACK_TIERS.forEach(t => { if (n >= t.qty && t.percent > best) best = t.percent; });
  return best;
}

function completeSetHTML(packs) {
  if (packs.length < 2) return '';
  const eligible = packs.filter(p => STACK_DISCOUNT_HANDLES[p.handle]);
  const rate = rateFor(eligible.length);
  const subtotal = packs.reduce((s, p) => s + (p.price_cents || 0), 0);
  const names = packs.map(p => p.title);
  let priceLine = '';
  if (rate > 0 && subtotal) {
    const eligCents = eligible.reduce((s, p) => s + (p.price_cents || 0), 0);
    const now = Math.round(eligCents * (100 - rate) / 100) + (subtotal - eligCents);
    priceLine = `WAS ${money(subtotal)} NOW ${money(now)} [${rate}% off]`;
  }
  return { n: packs.length, eligible: eligible.length, rate, priceLine, names: joinList(names) };
}

const P = (handle, price, title) => ({ handle, price_cents: price, title });

const cases = [
  ['2 eligible packs',
    [P('brain-pack-1', 6900, 'Brain'), P('focus-pack-spadra', 6900, 'Focus')],
    { rate: 25 }],
  ['3 eligible packs',
    [P('brain-pack-1', 6900, 'Brain'), P('focus-pack-spadra', 6900, 'Focus'), P('sleep-pack-1', 6900, 'Sleep')],
    { rate: 40 }],
  ['2 eligible + 1 NOT eligible',
    [P('brain-pack-1', 6900, 'Brain'), P('focus-pack-spadra', 6900, 'Focus'), P('hair-pack-spadra', 5900, 'Hair')],
    { rate: 25 }],
  ['1 eligible + 1 NOT  (no claim)',
    [P('brain-pack-1', 6900, 'Brain'), P('hair-pack-spadra', 5900, 'Hair')],
    { rate: 0 }],
  ['3 NOT eligible      (no claim)',
    [P('hair-pack-spadra', 5900, 'Hair'), P('gut-pack-spadra', 5900, 'Gut'), P('energy-pack-spadra', 5900, 'Energy')],
    { rate: 0 }],
];

let fail = 0;
for (const [name, packs, want] of cases) {
  const got = completeSetHTML(packs);
  const ok = got.rate === want.rate;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(32)} eligible=${got.eligible}/${got.n} rate=${got.rate}%  ${got.priceLine || '(no price claim)'}`);
}
console.log(fail ? `\n${fail} FAILING` : '\nall pass');
process.exit(fail ? 1 : 0);
