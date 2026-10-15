const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('index.html structure has all required semantics, ids, and accessible elements', () => {
  const htmlPath = path.join(__dirname, '../index.html');
  const content = fs.readFileSync(htmlPath, 'utf8');

  // Verificación de recursos enlazados
  assert.ok(content.includes('assets/styles.css'), 'styles.css is linked');
  assert.ok(content.includes('assets/quote.js'), 'quote.js is included');
  assert.ok(content.includes('assets/app.js'), 'app.js is included');

  // Teléfono oficial inmutable
  assert.ok(content.includes('+595 992 067705'), 'Official phone displayed');
  assert.ok(content.includes('595992067705'), 'Official phone in tel link');

  assert.equal((content.match(/href="tel:\+595992067705"/g) || []).length, 2, 'Both phone links dial the complete number');

  // Elementos del configurador y panel de cotización
  const requiredIds = [
    'input-cust-name',
    'input-cust-location',
    'input-cust-notes',
    'el-rooms-val',
    'el-plates-val',
    'el-cable-val',
    'tipo-elec-group',
    'modulos-elec-group',
    'el-color-white',
    'el-color-black',
    'plate-render-elec',
    'plate-frame-elec',
    'el-cable-toggle',
    'auto-rooms-val',
    'auto-plates-val',
    'auto-ac-val',
    'canales-auto-group',
    'auto-color-white',
    'auto-color-black',
    'auto-ac-toggle',
    'switch-render-auto',
    'rings-container-auto',
    'summary-mode-badge',
    'breakdown-items-container',
    'quote-total-val',
    'btn-whatsapp-quote',
    'btn-print-quote',
    'btn-reset-quote',
    'mobile-floating-total',
    'btn-whatsapp-mobile'
  ];

  for (const id of requiredIds) {
    assert.ok(content.includes(`id="${id}"`), `Missing essential UI element: #${id}`);
  }

  // Verificación de accesibilidad
  assert.ok(content.includes('aria-label='), 'Has accessible aria-labels');
  assert.ok(content.includes('aria-pressed='), 'Has state toggles with aria-pressed');
  assert.ok(content.includes('role="status"'), 'Has polite status toast');
});

test('styles.css supports product layout, responsive controls, reduced motion and print', () => {
  const cssPath = path.join(__dirname, '../assets/styles.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.ok(css.includes('.product-studio'), 'Defines the product studio composition');
  assert.ok(css.includes('.service-switch'), 'Defines direct service navigation');
  assert.ok(css.includes('prefers-reduced-motion'), 'Includes motion reduction query');

  // Responsive & Print
  assert.match(css, /@media\s*\(max-width:\s*420px\)/, 'Handles small mobile viewport (390px)');
  assert.ok(css.includes('@media print'), 'Includes dedicated print stylesheet');
});
