// Mirrors the tier + total logic in sections/spadra-stack.liquid so the money
// math can be checked without a browser.
const tiers = [{ qty: 3, percent: 40 }, { qty: 2, percent: 25 }]
  .slice().sort((a, b) => a.qty - b.qty);

function rateFor(n) {
  let best = 0;
  tiers.forEach(t => { if (n >= t.qty && t.percent > best) best = t.percent; });
  return best;
}

function total(items) {
  // items: [{price, eligible}]
  let count = 0, eligCents = 0, restCents = 0;
  items.forEach(i => {
    if (i.eligible) { count += 1; eligCents += i.price; }
    else { restCents += i.price; }
  });
  const rate = rateFor(count);
  const now = rate > 0
    ? Math.round(eligCents * (100 - rate) / 100) + restCents
    : null;
  return { count, rate, full: eligCents + restCents, now };
}

const E = p => ({ price: p, eligible: true });
const N = p => ({ price: p, eligible: false });

const cases = [
  ['1 eligible only            ', [E(6900)],                     { rate: 0,  now: null }],
  ['2 eligible                 ', [E(6900), E(6900)],            { rate: 25, now: 10350 }],
  ['3 eligible                 ', [E(6900), E(6900), E(6900)],   { rate: 40, now: 12420 }],
  ['4 eligible (best tier held)', [E(6900), E(6900), E(6900), E(6900)], { rate: 40, now: 16560 }],
  ['2 eligible + 1 ineligible  ', [E(6900), E(6900), N(5000)],   { rate: 25, now: 15350 }],
  ['1 eligible + 2 ineligible  ', [E(6900), N(5000), N(5000)],   { rate: 0,  now: null }],
  ['3 ineligible only          ', [N(5000), N(5000), N(5000)],   { rate: 0,  now: null }],
];

let fail = 0;
for (const [name, items, want] of cases) {
  const got = total(items);
  const ok = got.rate === want.rate && got.now === want.now;
  if (!ok) fail++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name}  count=${got.count} rate=${got.rate}% ` +
    `full=$${(got.full / 100).toFixed(2)} now=${got.now === null ? '(hidden)' : '$' + (got.now / 100).toFixed(2)}` +
    (ok ? '' : `   WANTED rate=${want.rate} now=${want.now}`)
  );
}
console.log(fail ? `\n${fail} FAILING` : '\nall pass');
process.exit(fail ? 1 : 0);
