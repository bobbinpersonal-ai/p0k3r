/**
 * Exercises the conditional-branch machinery in sections/native-quiz-modal.liquid
 * against the real branch data and the real catalogue.
 *
 * The quiz script is a DOM-coupled IIFE, so rather than reimplement its logic
 * here (which would only test the copy, not the shipped code) the script is
 * loaded verbatim and given the smallest fake DOM that lets it run. The click
 * handler it registers is then driven the way a shopper would drive it.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SECTION = path.join(ROOT, 'theme-src/sections/native-quiz-modal.liquid');
const BRANCHES = path.join(ROOT, 'theme-src/snippets/spadra-quiz-branches.liquid');
const CATALOG = path.join(ROOT, 'theme-src/snippets/spadra-quiz-catalog.liquid');
const REGISTRY = path.join(ROOT, 'scripts/spadra_registry.json');

function jsonFromSnippet(file, attr) {
  const s = fs.readFileSync(file, 'utf8');
  const open = s.indexOf(attr + '>') + attr.length + 1;
  return s.slice(open, s.lastIndexOf('</script>')).trim();
}

const script = fs.readFileSync(SECTION, 'utf8').match(/<script>\n([\s\S]*?)\n<\/script>/)[1];
const branchJSON = jsonFromSnippet(BRANCHES, 'data-spadra-quiz-branches');

// The catalogue snippet is Liquid, so build an equivalent one from the registry.
const reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8')).products;
const catalogJSON = JSON.stringify(Object.values(reg).map((p) => ({
  handle: p.handle,
  title: p.display_name,
  url: '/products/' + p.handle,
  price: '$44.99',
  size: (p.ingredients || []).length,
  components: p.ingredients || []
})));

// ---- smallest DOM the script will accept ----------------------------------
function el(text) {
  return {
    textContent: text == null ? '' : text,
    innerHTML: '',
    style: {},
    hidden: false,
    disabled: false,
    getAttribute: () => null,
    setAttribute() {},
    querySelector: () => null,
    addEventListener() {},
    closest: () => null
  };
}

const nodes = {
  '[data-quiz-root]': el(),
  '[data-quiz-body]': el(),
  '[data-quiz-heading]': el(),
  '[data-quiz-back]': el(),
  '[data-quiz-progress-wrap]': el(),
  '[data-quiz-progress-fill]': el(),
  '[data-quiz-progress-text]': el(),
  '[data-quiz-catalog]': el(catalogJSON),
  '[data-spadra-quiz-branches]': el(branchJSON),
  '[data-spadra-stack-discounts]': el(JSON.stringify({ eligible: [], tiers: [] })),
  '[data-spadra-ingredient-images]': el('{}'),
  '[data-spadra-specialist]': null,
  '[data-quiz-cart-error]': el()
};

let clickHandler = null;
const root = nodes['[data-quiz-root]'];
root.addEventListener = (type, fn) => { if (type === 'click') clickHandler = fn; };

const modal = {
  ...el(),
  querySelector: (sel) => (sel in nodes ? nodes[sel] : null),
  getAttribute: (a) => (a === 'data-specialist-name' ? 'Bobbin' : null),
  addEventListener() {}
};

const sandbox = {
  document: { getElementById: (id) => (id === 'spadra-quiz-modal' ? modal : null) },
  window: {},
  sessionStorage: { setItem() {}, getItem: () => null },
  console,
  fetch: () => Promise.resolve({ json: () => Promise.resolve({}) }),
  Math,
  JSON
};
vm.createContext(sandbox);
vm.runInContext(script, sandbox);

if (!clickHandler) {
  console.error('FAIL: the quiz never registered a click handler');
  process.exit(1);
}

// ---- driving it like a shopper --------------------------------------------
function choose(i) {
  clickHandler({ target: { closest: (sel) => (sel === '[data-choice]' ? { getAttribute: () => String(i) } : null) } });
}
function next() {
  clickHandler({ target: { closest: (sel) => (sel === '[data-quiz-next]' ? {} : null) } });
}
function back() {
  clickHandler({ target: { closest: (sel) => (sel === '[data-quiz-back]' ? {} : null) } });
}
function restart() {
  clickHandler({ target: { closest: (sel) => (sel === '[data-quiz-restart]' ? {} : null) } });
}
function progress() { return nodes['[data-quiz-progress-text]'].textContent; }
function heading() { return nodes['[data-quiz-heading]'].textContent; }
function results() { return nodes['[data-quiz-body]'].innerHTML; }

let failures = 0;
function check(name, cond, detail) {
  if (cond) { console.log('  ok   ' + name); return; }
  failures++;
  console.log('  FAIL ' + name + (detail ? '  -> ' + detail : ''));
}

const SOCIAL = 1;   // "I socialize often..." is the 2nd goal option
const ENERGY = 0;

// --- 1. the base quiz is untouched for a non-social shopper -----------------
console.log('\nnon-social shopper still gets the five base questions');
restart();
choose(2);           // prefer not to say
check('5 questions total', /of 5$/.test(progress()), progress());
choose(ENERGY); next();
check('goes straight to the generic challenge question',
  /biggest daily challenge/.test(heading()), heading());

// --- 2. picking the social goal opens the branch ----------------------------
console.log('\npicking the social goal opens the branch, in context');
restart();
choose(2);
choose(SOCIAL);
check('question count grows to 8', /of 8$/.test(progress()), progress());
next();
check('first branch question follows the goal immediately',
  /How often does a night out/.test(heading()), heading());
choose(3);           // most nights
check('second branch question', /When do you want the protocol/.test(heading()), heading());
choose(3);           // long game
check('third branch question', /costs you the most the next day/.test(heading()), heading());
choose(3);           // cumulative load
check('returns to the generic questions after the branch',
  /biggest daily challenge/.test(heading()), heading());

// --- 3. the heaviest-load answers route to Liver Detox ----------------------
// The two remaining questions are multi-select, and Continue is a no-op until
// something is picked, so each needs a choice before advancing.
console.log('\nsustained load + long game + cumulative worry -> Liver Detox');
choose(0); next();   // challenge: mental stress
choose(0); next();   // biggest difference: waking up sharp
choose(2);           // supplement style: open
check('Liver Detox is the top result',
  results().indexOf('Liver Detox') !== -1 && results().indexOf('Liver Detox') < 900,
  results().slice(0, 300));

// --- 4. the acute profile routes to the Party packs -------------------------
console.log('\noccasional + morning-after + cognitive -> Party packs, not Liver Detox');
restart();
choose(2);
choose(SOCIAL); next();
choose(0);           // once or twice a month
choose(1);           // the morning after
choose(0);           // cognitive
choose(0); next();
choose(0); next();
choose(2);
check('a Party protocol is recommended', /Party/.test(results()), results().slice(0, 300));
check('Liver Detox is not the headline result',
  results().indexOf('Party') < results().indexOf('Liver Detox') || results().indexOf('Liver Detox') === -1);

// --- 5. a closed branch must stop scoring -----------------------------------
console.log('\nunticking the goal closes the branch and discards its answers');
restart();
choose(2);
choose(SOCIAL); next();
choose(3); choose(3); choose(3);   // answer the whole branch
// Four steps back: the three branch questions, then the goal itself.
back(); back(); back(); back();
choose(SOCIAL);                    // untick it
check('back to 5 questions', /of 5$/.test(progress()), progress());
choose(ENERGY); next();
choose(0); next();
choose(0); next();
choose(2);
check('no branch-only protocol leaks into the result',
  !/Liver Detox|Party/.test(results()), results().slice(0, 300));

console.log(failures ? '\n' + failures + ' FAILED' : '\nall checks passed');

/* --- Meta ad vector deep-linking -------------------------------------------
 * Appended: verifies ?vector= pre-ticks the right goal. The quiz reads the
 * param at init, so each case needs a fresh evaluation of the script with a
 * different window.location.search. */
function runWithVector(vec) {
  let handler = null;
  const n2 = JSON.parse(JSON.stringify({}));
  const nodes2 = {};
  Object.keys(nodes).forEach((k) => { nodes2[k] = el(nodes[k] ? nodes[k].textContent : ''); });
  const root2 = nodes2['[data-quiz-root]'];
  root2.addEventListener = (t, fn) => { if (t === 'click') handler = fn; };
  const modal2 = {
    ...el(),
    querySelector: (sel) => (sel in nodes2 ? nodes2[sel] : null),
    getAttribute: () => 'Bobbin',
    addEventListener() {},
  };
  const sb = {
    document: { getElementById: (id) => (id === 'spadra-quiz-modal' ? modal2 : null) },
    window: { location: { search: vec ? `?vector=${vec}` : '' } },
    URLSearchParams,
    sessionStorage: { setItem() {}, getItem: () => null },
    console, fetch: () => Promise.resolve({ json: () => Promise.resolve({}) }), Math, JSON,
  };
  vm.createContext(sb);
  vm.runInContext(script, sb);
  // advance past the audience question to see the goal question's state
  handler({ target: { closest: (s) => (s === '[data-choice]' ? { getAttribute: () => '2' } : null) } });
  return nodes2['[data-quiz-body]'].innerHTML;
}

console.log('\nMeta ad vector deep-linking pre-ticks the right goal');
const VECTOR_EXPECT = {
  party: 'socialize often',
  executive: 'focus, memory',
  athlete: 'energy and stamina',
  eco: 'healthy aging',
};
let vFail = 0;
Object.entries(VECTOR_EXPECT).forEach(([vec, needle]) => {
  const html = runWithVector(vec);
  // the pre-ticked option is the one rendered aria-checked="true"
  const checked = /<button[^>]*aria-checked="true"[^>]*>[\s\S]*?<span>([^<]*)</.exec(html);
  const got = checked ? checked[1] : '(none)';
  const ok = got.toLowerCase().includes(needle);
  if (!ok) vFail++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ?vector=${vec.padEnd(9)} -> ${got.slice(0, 55)}`);
});
const none = runWithVector(null);
const anyChecked = /aria-checked="true"/.test(none);
console.log(`  ${!anyChecked ? 'ok  ' : 'FAIL'} no param -> nothing pre-ticked`);
if (anyChecked) vFail++;
const bogus = runWithVector('not-a-real-vector');
const bogusChecked = /aria-checked="true"/.test(bogus);
console.log(`  ${!bogusChecked ? 'ok  ' : 'FAIL'} unknown param -> ignored, nothing pre-ticked`);
if (bogusChecked) vFail++;
console.log(vFail ? `\n${vFail} VECTOR CHECKS FAILED` : '\nall vector checks passed');
process.exit(failures + vFail ? 1 : 0);
