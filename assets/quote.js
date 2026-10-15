/**
 * CRISTEC - Motor de Cotizaciones y Reglas de Negocio
 * Soporta CommonJS (Node.js tests) y browser ES/global sin dependencias
 */

const PHONE_NUMBER = '595992067705';

// Tarifas referenciales de la versión original de CRISTEC (Gs.)
const PRICES = {
  electrica: {
    individual: [50000, 100000, 150000], // 1, 2, 3 puntos para Interruptores o Enchufes
    ambos: [100000, 130000, 160000],      // 1, 2, 3 módulos mixtos
    cableMetro: 12000                   // Gs. por metro de cableado
  },
  domotica: {
    touch: [120000, 185000, 250000],     // 1, 2, 3 pulsadores táctiles Wi-Fi
    acIrUnit: 150000                    // Gs. por unidad de control AC / IR
  }
};

const DEFAULT_STATE = Object.freeze({
  mode: 'electrica', // 'electrica' | 'automatizacion' | 'precios'
  customer: Object.freeze({
    name: '',
    location: '',
    notes: ''
  }),
  electrica: Object.freeze({
    habitaciones: 1,
    puntosTotales: 1, // Cantidad física de placas / cajas rectangulares
    puntos: 1,        // Módulos por placa (1, 2 o 3)
    tipoInstalacion: 'Interruptores', // 'Interruptores' | 'Enchufes' | 'Ambos'
    color: 'white',   // 'white' | 'black'
    cableadoEnabled: false,
    cableadoMetros: 10
  }),
  automatizacion: Object.freeze({
    habitaciones: 1,
    puntosTotales: 1, // Cantidad física de placas inteligentes
    puntos: 1,        // 1, 2 o 3 canales táctiles
    color: 'black',   // 'black' | 'white'
    acEnabled: false,
    acQty: 1,
    plataformas: Object.freeze([]) // ['Amazon Alexa', 'Google Home', 'App Móvil']
  })
});

function validateQuantity(value, min = 1, max = 999) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(Math.max(parsed, min), max);
}

function sanitizeState(raw) {
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  const validModes = ['electrica', 'automatizacion', 'precios'];
  const mode = validModes.includes(raw.mode) ? raw.mode : 'electrica';

  const cust = raw.customer || {};
  const customer = {
    name: typeof cust.name === 'string' ? cust.name.slice(0, 100) : '',
    location: typeof cust.location === 'string' ? cust.location.slice(0, 100) : '',
    notes: typeof cust.notes === 'string' ? cust.notes.slice(0, 500) : ''
  };

  const el = raw.electrica || {};
  const validTipos = ['Interruptores', 'Enchufes', 'Ambos'];
  const electrica = {
    habitaciones: validateQuantity(el.habitaciones, 1, 50),
    puntosTotales: validateQuantity(el.puntosTotales, 1, 500),
    puntos: validateQuantity(el.puntos, 1, 3),
    tipoInstalacion: validTipos.includes(el.tipoInstalacion) ? el.tipoInstalacion : 'Interruptores',
    color: el.color === 'black' ? 'black' : 'white',
    cableadoEnabled: Boolean(el.cableadoEnabled),
    cableadoMetros: validateQuantity(el.cableadoMetros, 1, 1000)
  };

  const auto = raw.automatizacion || {};
  const plataformas = Array.isArray(auto.plataformas)
    ? auto.plataformas.filter(p => ['Amazon Alexa', 'Google Home', 'App Móvil'].includes(p))
    : [];
  const automatizacion = {
    habitaciones: validateQuantity(auto.habitaciones, 1, 50),
    puntosTotales: validateQuantity(auto.puntosTotales, 1, 500),
    puntos: validateQuantity(auto.puntos, 1, 3),
    color: auto.color === 'white' ? 'white' : 'black',
    acEnabled: Boolean(auto.acEnabled),
    acQty: validateQuantity(auto.acQty, 1, 50),
    plataformas
  };

  return { mode, customer, electrica, automatizacion };
}

function formatCurrency(amount) {
  const num = typeof amount === 'number' && !Number.isNaN(amount) ? amount : 0;
  return 'Gs. ' + num.toLocaleString('es-PY');
}

function calculateQuote(state) {
  const mode = state.mode || 'electrica';
  if (mode === 'precios') return {mode: 'precios', total: null};

  if (mode === 'electrica') {
    const el = state.electrica || DEFAULT_STATE.electrica;
    const plateQty = validateQuantity(el.puntosTotales, 1, 500);
    const rooms = validateQuantity(el.habitaciones, 1, 50);
    const modules = validateQuantity(el.puntos, 1, 3);
    const tipo = el.tipoInstalacion || 'Interruptores';

    const rates = tipo === 'Ambos' ? PRICES.electrica.ambos : PRICES.electrica.individual;
    const plateUnitPrice = rates[modules - 1] || rates[0];
    const platesSubtotal = plateQty * plateUnitPrice;

    const cableMeters = el.cableadoEnabled ? validateQuantity(el.cableadoMetros, 1, 1000) : 0;
    const wiringSubtotal = cableMeters * PRICES.electrica.cableMetro;
    const total = platesSubtotal + wiringSubtotal;

    let moduleDescription = '';
    if (tipo === 'Interruptores') {
      moduleDescription = `${modules} ${modules === 1 ? 'Punto de luz' : 'Puntos de luz'}`;
    } else if (tipo === 'Enchufes') {
      moduleDescription = `${modules} ${modules === 1 ? 'Enchufe' : 'Enchufes'}`;
    } else {
      if (modules === 1) moduleDescription = '1 Luz + 1 Enchufe mixto';
      else if (modules === 2) moduleDescription = '2 Luces + 1 Enchufe mixto';
      else moduleDescription = '1 Luz + 2 Enchufes mixtos';
    }

    return {
      mode: 'electrica',
      rooms,
      plateQty,
      modules,
      tipo,
      color: el.color || 'white',
      moduleDescription,
      plateUnitPrice,
      platesSubtotal,
      cableEnabled: !!el.cableadoEnabled,
      cableMeters,
      wiringSubtotal,
      acSubtotal: 0,
      total
    };
  }

  // Domótica / Automatización
  const auto = state.automatizacion || DEFAULT_STATE.automatizacion;
  const plateQty = validateQuantity(auto.puntosTotales, 1, 500);
  const rooms = validateQuantity(auto.habitaciones, 1, 50);
  const modules = validateQuantity(auto.puntos, 1, 3);
  const plateUnitPrice = PRICES.domotica.touch[modules - 1] || PRICES.domotica.touch[0];
  const platesSubtotal = plateQty * plateUnitPrice;

  const acQty = auto.acEnabled ? validateQuantity(auto.acQty, 1, 50) : 0;
  const acSubtotal = acQty * PRICES.domotica.acIrUnit;
  const total = platesSubtotal + acSubtotal;

  const switchDescription = `${modules} ${modules === 1 ? 'Punto táctil (1 canal)' : modules === 2 ? 'Puntos táctiles (2 canales)' : 'Puntos táctiles (3 canales)'}`;

  return {
    mode: 'automatizacion',
    rooms,
    plateQty,
    modules,
    color: auto.color || 'black',
    switchDescription,
    plateUnitPrice,
    platesSubtotal,
    acEnabled: !!auto.acEnabled,
    acQty,
    acSubtotal,
    wiringSubtotal: 0,
    plataformas: Array.isArray(auto.plataformas) ? [...auto.plataformas] : [],
    total
  };
}

function buildWhatsAppMessage(state) {
  if (state.mode === 'precios') return 'Hola CRISTEC, quisiera consultar los precios y recibir una cotización personalizada para mi proyecto.';
  const calc = calculateQuote(state);
  const cust = (state && state.customer) || {};
  const customerName = (cust.name || '').trim();
  const location = (cust.location || '').trim();
  const notes = (cust.notes || '').trim();

  const lines = ['Hola CRISTEC, quisiera solicitar cotización:', ''];

  if (customerName) lines.push('• Cliente: ' + customerName);
  if (location) lines.push('• Ubicación: ' + location);

  lines.push('• Solicitado:');
  if (calc.mode === 'electrica') {
    lines.push('  - ' + calc.plateQty + ' placa(s) de ' + calc.tipo + ' (' + calc.moduleDescription + ', color ' + (calc.color === 'black' ? 'Negro' : 'Blanco') + ')');
    if (calc.cableEnabled) {
      lines.push('  - Cableado: ' + calc.cableMeters + ' metro(s)');
    }
  } else {
    lines.push('  - ' + calc.plateQty + ' placa(s) Wi-Fi (' + calc.switchDescription + ', cristal ' + (calc.color === 'white' ? 'Blanco' : 'Negro') + ')');
    if (calc.acEnabled) {
      lines.push('  - Control AC / IR: ' + calc.acQty + ' equipo(s)');
    }
    if (calc.plataformas && calc.plataformas.length > 0) {
      lines.push('  - Ecosistema: ' + calc.plataformas.join(', '));
    }
  }

  if (notes) {
    lines.push('• Notas: ' + notes);
  }

  lines.push('');
  lines.push('*Presupuesto:* ' + formatCurrency(calc.total));

  return lines.join('\n');
}

function buildWhatsAppUrl(message) {
  return `https://api.whatsapp.com/send?phone=${PHONE_NUMBER}&text=${encodeURIComponent(message)}`;
}

// Exportación dual (CJS + navegador)
const quoteModule = {
  PHONE_NUMBER,
  PRICES,
  DEFAULT_STATE,
  validateQuantity,
  sanitizeState,
  formatCurrency,
  calculateQuote,
  buildWhatsAppMessage,
  buildWhatsAppUrl
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = quoteModule;
}
if (typeof window !== 'undefined') {
  window.CristecQuote = quoteModule;
}
