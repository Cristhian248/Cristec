const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateQuote,
  formatCurrency,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  validateQuantity,
  DEFAULT_STATE
} = require('../assets/quote.js');

test('DEFAULT_STATE provides clean initial structure', () => {
  assert.equal(DEFAULT_STATE.mode, 'electrica');
  assert.equal(DEFAULT_STATE.customer.name, '');
  assert.equal(DEFAULT_STATE.electrica.habitaciones, 1);
  assert.equal(DEFAULT_STATE.electrica.puntosTotales, 1);
  assert.equal(DEFAULT_STATE.electrica.puntos, 1);
  assert.equal(DEFAULT_STATE.electrica.tipoInstalacion, 'Interruptores');
  assert.equal(DEFAULT_STATE.electrica.cableadoEnabled, false);
  assert.equal(DEFAULT_STATE.electrica.cableadoMetros, 10);
  assert.equal(DEFAULT_STATE.automatizacion.habitaciones, 1);
  assert.equal(DEFAULT_STATE.automatizacion.puntosTotales, 1);
  assert.equal(DEFAULT_STATE.automatizacion.puntos, 1);
  assert.equal(DEFAULT_STATE.automatizacion.acEnabled, false);
  assert.equal(DEFAULT_STATE.automatizacion.acQty, 1);
});

test('formatCurrency formats Paraguayan Guaraníes accurately', () => {
  assert.match(formatCurrency(0), /Gs\.\s*0/);
  assert.match(formatCurrency(120000), /Gs\.\s*120[.,]000/);
  assert.match(formatCurrency(1500000), /Gs\.\s*1[.,]500[.,]000/);
});

test('calculateQuote for electrica standard switches (50k, 100k, 150k)', () => {
  const state = {
    mode: 'electrica',
    electrica: {
      habitaciones: 2,
      puntosTotales: 4,
      puntos: 1,
      tipoInstalacion: 'Interruptores',
      color: 'white',
      cableadoEnabled: false,
      cableadoMetros: 10
    }
  };
  const res = calculateQuote(state);
  assert.equal(res.plateUnitPrice, 50000);
  assert.equal(res.platesSubtotal, 200000);
  assert.equal(res.wiringSubtotal, 0);
  assert.equal(res.total, 200000);
});

test('calculateQuote for electrica mixed modules (100k, 130k, 160k) + cableado (12k/m)', () => {
  const state = {
    mode: 'electrica',
    electrica: {
      habitaciones: 3,
      puntosTotales: 5,
      puntos: 2,
      tipoInstalacion: 'Ambos',
      color: 'black',
      cableadoEnabled: true,
      cableadoMetros: 25
    }
  };
  const res = calculateQuote(state);
  // puntos=2 in 'Ambos' -> 130,000 per plate
  assert.equal(res.plateUnitPrice, 130000);
  assert.equal(res.platesSubtotal, 650000); // 5 * 130,000
  assert.equal(res.wiringSubtotal, 300000); // 25 * 12,000
  assert.equal(res.total, 950000);
});

test('calculateQuote for automatizacion smart touch (120k, 185k, 250k) + AC (150k each)', () => {
  const state = {
    mode: 'automatizacion',
    automatizacion: {
      habitaciones: 2,
      puntosTotales: 3,
      puntos: 3,
      color: 'black',
      acEnabled: true,
      acQty: 2,
      plataformas: ['Amazon Alexa', 'Google Home']
    }
  };
  const res = calculateQuote(state);
  // 3 * 250,000 = 750,000 + 2 * 150,000 = 300,000 => 1,050,000
  assert.equal(res.plateUnitPrice, 250000);
  assert.equal(res.platesSubtotal, 750000);
  assert.equal(res.acSubtotal, 300000);
  assert.equal(res.total, 1050000);
});

test('validateQuantity clamps values within finite positive bounds', () => {
  assert.equal(validateQuantity(-5, 1, 999), 1);
  assert.equal(validateQuantity(0, 1, 999), 1);
  assert.equal(validateQuantity(15, 1, 999), 15);
  assert.equal(validateQuantity('25', 1, 999), 25);
  assert.equal(validateQuantity(1500, 1, 999), 999);
  assert.equal(validateQuantity('abc', 1, 999), 1);
  assert.equal(validateQuantity(null, 10, 500), 10);
});

test('buildWhatsAppMessage includes customer details, requested items, and budget', () => {
  const state = {
    mode: 'electrica',
    customer: {
      name: 'Carlos Benítez',
      location: 'Asunción',
      notes: 'Instalación en planta alta'
    },
    electrica: {
      habitaciones: 2,
      puntosTotales: 3,
      puntos: 1,
      tipoInstalacion: 'Interruptores',
      color: 'black',
      cableadoEnabled: true,
      cableadoMetros: 15
    }
  };
  const msg = buildWhatsAppMessage(state);
  assert.ok(msg.includes('CRISTEC'));
  assert.ok(msg.includes('Carlos Benítez'));
  assert.ok(msg.includes('Asunción'));
  assert.ok(msg.includes('3 placa(s)'));
  assert.ok(msg.includes('15 metro(s)'));
  assert.ok(msg.includes('Presupuesto:'));
  assert.ok(msg.includes('Gs. 330.000'));
});

test('buildWhatsAppUrl uses official phone 595992067705 and encodes text safely', () => {
  const text = 'Hola CRISTEC & Cotización';
  const url = buildWhatsAppUrl(text);
  assert.ok(url.startsWith('https://api.whatsapp.com/send?phone=595992067705&text='));
  assert.ok(url.includes(encodeURIComponent('Hola CRISTEC & Cotización')));
});

test('sanitizeState handles malformed or missing storage payload safely', () => {
  const { sanitizeState } = require('../assets/quote.js');
  const clean = sanitizeState(null);
  assert.equal(clean.mode, 'electrica');
  assert.equal(clean.electrica.puntosTotales, 1);

  const partial = sanitizeState({
    mode: 'automatizacion',
    automatizacion: { puntosTotales: 9999, acEnabled: true, acQty: -4 }
  });
  assert.equal(partial.mode, 'automatizacion');
  assert.equal(partial.automatizacion.puntosTotales, 500); // clamped
  assert.equal(partial.automatizacion.acQty, 1); // clamped min
});

test('calculateQuote handles edge case boundary inputs robustly', () => {
  const edge1 = calculateQuote({
    mode: 'electrica',
    electrica: {
      puntosTotales: '0',
      habitaciones: 'not-a-number',
      puntos: 99,
      tipoInstalacion: 'Enchufes',
      cableadoEnabled: true,
      cableadoMetros: -50
    }
  });
  assert.equal(edge1.plateQty, 1);
  assert.equal(edge1.rooms, 1);
  assert.equal(edge1.modules, 3); // clamped to max 3
  assert.equal(edge1.plateUnitPrice, 150000);
  assert.equal(edge1.cableMeters, 1); // clamped min 1 when enabled
  assert.equal(edge1.total, 150000 + 12000);
});

test('buildWhatsAppMessage with empty/blank customer falls back cleanly without crashing', () => {
  const msg = buildWhatsAppMessage({
    mode: 'automatizacion',
    customer: { name: '   ', location: '', notes: '' },
    automatizacion: { puntosTotales: 2, puntos: 2, acEnabled: false }
  });
  assert.ok(msg.includes('CRISTEC'));
  assert.ok(!msg.includes('Cliente:'));
  assert.ok(msg.includes('2 placa(s) Wi-Fi'));
  assert.ok(msg.includes('Presupuesto:'));
  assert.ok(msg.includes('Gs. 370.000'));
});
