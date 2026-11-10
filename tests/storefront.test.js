const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Storefront has navigable structure connecting home, catalog, detail, configurator and contact', () => {
  const pages = ['index.html', 'productos.html', 'producto.html', 'cotizador.html', 'contacto.html'];
  for (const page of pages) {
    assert.ok(fs.existsSync(path.join(root, page)), `Page ${page} exists on disk`);
    const content = read(page);
    assert.ok(content.includes('CRIS'), `Brand logo in ${page}`);
    assert.ok(content.includes('assets/styles.css'), `Base styles in ${page}`);
    assert.ok(content.includes('assets/store.css'), `Storefront styles in ${page}`);
    assert.ok(content.includes('595992067705'), `Official phone in ${page}`);
    assert.ok(content.includes('productos.html'), `Link to products in ${page}`);
    assert.ok(content.includes('cotizador.html'), `Link to quote in ${page}`);
  }

  const home = read('index.html');
  assert.ok(home.includes('id="home-products"'), 'Home includes product grid container');
  assert.ok(home.includes('productos.html?categoria=electrica'), 'Home has direct link to electrical category');
  assert.ok(home.includes('productos.html?categoria=domotica'), 'Home has direct link to domotics category');

  const catalog = read('productos.html');
  assert.ok(catalog.includes('id="catalog-grid"'), 'Catalog has product grid');
  assert.ok(catalog.includes('data-filter-category="all"'), 'Catalog has all category filter');
  assert.ok(catalog.includes('data-filter-category="electrica"'), 'Catalog has electrical filter');
  assert.ok(catalog.includes('id="catalog-sort-select"'), 'Catalog has sort selector');

  const detail = read('producto.html');
  assert.ok(detail.includes('id="product-detail-container"'), 'Detail has dynamic container');

  const contact = read('contacto.html');
  assert.ok(contact.includes('+595 992 067705'), 'Contact shows complete telephone');
  assert.ok(contact.includes('api.whatsapp.com'), 'Contact has direct WhatsApp link');
});
