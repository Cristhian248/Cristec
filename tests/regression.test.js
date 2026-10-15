const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Q = require('../assets/quote.js');

test('Price list is not mistaken for a domotics quotation', () => {
  const state = {...Q.DEFAULT_STATE, mode: 'precios'};
  assert.equal(Q.calculateQuote(state).mode, 'precios');
  assert.equal(Q.calculateQuote(state).total, null);
  const msg = Q.buildWhatsAppMessage(state);
  assert.ok(msg.includes('precios'));
  assert.ok(!msg.includes('120.000'));
});

test('Quote has a dedicated print summary and polite live total', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.ok(html.includes('id="print-customer"'));
  assert.match(html, /id="quote-total-val"[^>]*aria-live="polite"/);
});
