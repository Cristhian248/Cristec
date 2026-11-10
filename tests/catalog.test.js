const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Q = require('../assets/quote.js');
const file = path.join(__dirname, '../assets/catalog.js');

test('Catalog lists the existing electrical, smart and wiring configurations at their original tariffs', () => {
  assert.ok(fs.existsSync(file), 'Catalog data module exists');
  const {PRODUCTS, CATEGORIES, getProduct} = require(file);
  assert.equal(PRODUCTS.length, 14);
  assert.equal(new Set(PRODUCTS.map(p => p.id)).size, PRODUCTS.length);
  assert.deepEqual(CATEGORIES.map(c => c.id), ['electrica', 'domotica', 'cableado']);
  for (const product of PRODUCTS) {
    assert.ok(product.title && product.description && product.unit);
    assert.ok(CATEGORIES.some(c => c.id === product.category));
    assert.strictEqual(getProduct(product.id), product);
    if (product.kind === 'touch') assert.equal(product.price, Q.PRICES.domotica.touch[product.modules - 1]);
    else if (product.kind === 'ir') assert.equal(product.price, Q.PRICES.domotica.acIrUnit);
    else if (product.kind === 'cable') assert.equal(product.price, Q.PRICES.electrica.cableMetro);
    else assert.equal(product.price, (product.kind === 'mixed' ? Q.PRICES.electrica.ambos : Q.PRICES.electrica.individual)[product.modules - 1]);
  }
  assert.equal(getProduct('does-not-exist'), undefined);
});
