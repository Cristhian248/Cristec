const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Home exposes a real catalog route and the existing configurator on its own page', () => {
  assert.ok(fs.existsSync(path.join(root, 'cotizador.html')), 'The configurator has its own navigable page');
  const home = read('index.html');
  assert.match(home, /href="productos\.html"/);
  assert.match(home, /href="cotizador\.html"/);
  assert.match(home, /data-page="inicio"/);
  const quote = read('cotizador.html');
  assert.match(quote, /id="quote-total-val"/);
  assert.match(quote, /id="tipo-elec-group"/);
  assert.match(quote, /assets\/app\.js/);
  assert.match(quote, /href="productos\.html"/);
});
