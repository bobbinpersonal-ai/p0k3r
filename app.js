/* SPADRA — app.js */
// Footer year
document.querySelectorAll('#yr').forEach(el => { el.textContent = new Date().getFullYear(); });

// ---- Shared data ----
// Estimated private-sale values (good condition), used to derive cash offers.
var MODELS = [
  { name: 'iPhone 16 Pro Max', resale: 1125 },
  { name: 'iPhone 16 Pro', resale: 975 },
  { name: 'iPhone 16 / 16 Plus', resale: 770 },
  { name: 'iPhone 15 Pro Max', resale: 670 },
  { name: 'iPhone 15 Pro', resale: 595 },
  { name: 'iPhone 15 / 15 Plus', resale: 435 },
  { name: 'iPhone 14 Pro Max', resale: 460 },
  { name: 'iPhone 14 Pro', resale: 415 },
  { name: 'iPhone 14 / 14 Plus', resale: 300 },
  { name: 'iPhone 13 Pro / Pro Max', resale: 300 },
  { name: 'iPhone 13 / 13 mini', resale: 230 },
  { name: 'iPhone 12 series', resale: 150 }
];
var BUY_FACTOR = 0.65; // we buy at ~65% of resale value

function round5(n) { return Math.round(n / 5) * 5; }

// ---- Sell page: populate models + calculator ----
var modelSel = document.getElementById('s-model');
if (modelSel) {
  MODELS.forEach(function (m, i) {
    var o = document.createElement('option');
    o.value = i; o.textContent = m.name;
    modelSel.appendChild(o);
  });
}

function calcOffer() {
  var mi = parseInt(modelSel.value, 10);
  var cond = parseFloat(document.getElementById('s-cond').value);
  var box = document.getElementById('quote-box');
  if (isNaN(mi)) {
    box.classList.add('show');
    document.getElementById('quote-amount').textContent = '—';
    box.querySelector('p').textContent = 'Pick your model first.';
    return;
  }
  var offer = round5(MODELS[mi].resale * cond * BUY_FACTOR);
  document.getElementById('quote-amount').textContent = '$' + offer;
  box.querySelector('p').textContent = 'Estimated cash offer · final quote confirmed in person after inspection';
  var condLabel = document.getElementById('s-cond').selectedOptions[0].textContent;
  // REPLACE WITH REAL NUMBER
  document.getElementById('quote-text').href =
    'sms:+15552345678?&body=' + encodeURIComponent('Hi SPADRA! Your tool estimated $' + offer + ' for my ' + MODELS[mi].name + ' (' + condLabel + '). Can you lock this in?');
  box.classList.add('show');
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ---- Shop page: render inventory ----
var SHOP = [
  { name: 'iPhone 15 Pro', spec: '128GB · Unlocked · Batt 91%', price: 649, tag: 'Best value' },
  { name: 'iPhone 15', spec: '128GB · Unlocked · Batt 89%', price: 499, tag: 'Popular' },
  { name: 'iPhone 14 Pro', spec: '128GB · Unlocked · Batt 88%', price: 479, tag: null },
  { name: 'iPhone 14', spec: '128GB · Unlocked · Batt 90%', price: 349, tag: null },
  { name: 'iPhone 13 Pro', spec: '128GB · Unlocked · New battery', price: 329, tag: 'New battery' },
  { name: 'iPhone 13', spec: '128GB · Unlocked · Batt 87%', price: 269, tag: 'Budget pick' }
];
var grid = document.getElementById('shop-grid');
if (grid) {
  SHOP.forEach(function (p) {
    var d = document.createElement('div');
    d.className = 'phone';
    // REPLACE WITH REAL NUMBER
    var sms = 'sms:+15552345678?&body=' + encodeURIComponent('Hi SPADRA! Is the ' + p.name + ' (' + p.spec + ') for $' + p.price + ' still available?');
    d.innerHTML =
      (p.tag ? '<span class="badge">' + p.tag + '</span>' : '') +
      '<div class="ph">📱</div>' +
      '<h3>' + p.name + '</h3>' +
      '<div class="spec">' + p.spec + '</div>' +
      '<div class="p">$' + p.price + '</div>' +
      '<a class="btn btn-ghost" style="width:100%" href="' + sms + '">Text to Buy</a>';
    grid.appendChild(d);
  });
}

// ---- Repairs page: booking form -> SMS ----
var repairForm = document.getElementById('repair-form');
if (repairForm) {
  repairForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = 'Hi SPADRA! Repair booking request:\n' +
      'Name: ' + document.getElementById('r-name').value + '\n' +
      'Phone: ' + document.getElementById('r-phone').value + '\n' +
      'Model: ' + document.getElementById('r-model').value + '\n' +
      'Issue: ' + document.getElementById('r-issue').value + '\n' +
      'Notes: ' + (document.getElementById('r-notes').value || '—');
    // REPLACE WITH REAL NUMBER
    window.location.href = 'sms:+15552345678?&body=' + encodeURIComponent(msg);
  });
}
