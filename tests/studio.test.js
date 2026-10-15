const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = () => fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
test('Product studio replaces admin sidebar and opens with configuration', () => {
  assert.ok(html().includes('class="product-studio"'));
  assert.ok(!html().includes('class="app-sidebar"'));
  assert.ok(html().indexOf('id="tipo-elec-group"') < html().indexOf('id="input-cust-name"'));
});
