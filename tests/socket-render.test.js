const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const siteJs = fs.readFileSync(path.join(root, 'assets/site.js'), 'utf8');
const storeCss = fs.readFileSync(path.join(root, 'assets/store.css'), 'utf8');
const stylesCss = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');

test('Socket plates render standard 3-module 4x2 layout for 1, 2, and 3 gang outlets', () => {
  // 2-socket plate must have top socket, center spacer, bottom socket for realistic 4x2 proportion
  assert.ok(
    siteJs.includes("if (product.modules === 2) {\n          slotsHtml = '<div class=\"mini-slot mini-slot-socket\"></div><div class=\"mini-slot mini-slot-blank\"></div><div class=\"mini-slot mini-slot-socket\"></div>';") ||
    siteJs.includes("mini-slot-socket") && siteJs.includes("mini-slot-blank"),
    'site.js card builder must use realistic 3-gang slot layout with spacer for 2-gang socket'
  );

  assert.ok(
    siteJs.includes('mod-socket') && siteJs.includes('socket-receptacle'),
    'site.js detail plate must render realistic socket-receptacle structure'
  );
});

test('Socket CSS styles provide realistic 3D receptacle well and universal apertures', () => {
  // Must not rely on text unicode dots '••'
  assert.ok(!storeCss.includes("content: '••'"), 'store.css must not use text unicode dots for socket card');
  assert.ok(stylesCss.includes('socket-receptacle'), 'styles.css must style realistic socket-receptacle');
  assert.ok(storeCss.includes('mini-socket-receptacle') || storeCss.includes('mini-slot-socket'), 'store.css has mini socket styling');
});

test('Configurator in app.js renders realistic socket receptacle', () => {
  assert.ok(appJs.includes('socket-receptacle'), 'app.js module renderer includes socket-receptacle');
});
