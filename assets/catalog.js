/**
 * CRISTEC - Catálogo de Productos y Soluciones
 * Compatible con Node.js (CommonJS) y navegadores web.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const Q = require('./quote.js');
    module.exports = factory(Q);
  } else {
    const Q = root.CristecQuote || root.CRISTEC_QUOTE || {};
    const catalog = factory(Q);
    root.CRISTEC_CATALOG = catalog;
    root.CristecCatalog = catalog;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Q) {
  'use strict';

  const CATEGORIES = [
    {
      id: 'electrica',
      name: 'Electricidad',
      shortTitle: 'Interruptores y tomas',
      description: 'Placas modulares residenciales y comerciales de 1 a 3 módulos en blanco y negro.',
      count: 9
    },
    {
      id: 'domotica',
      name: 'Domótica',
      shortTitle: 'Interruptores táctiles Wi-Fi',
      description: 'Placas táctiles de cristal templado y control inteligente para iluminación y climatización.',
      count: 4
    },
    {
      id: 'cableado',
      name: 'Cableado',
      shortTitle: 'Instalación y conductores',
      description: 'Conductores normalizados, canalización y tendido eléctrico seguro por metro lineal.',
      count: 1
    }
  ];

  const PRODUCTS = [
    {
      id: 'placa-luz-1-punto',
      category: 'electrica',
      kind: 'switch',
      modules: 1,
      title: 'Placa con 1 Punto de Luz',
      subtitle: 'Interruptor unipolar modular',
      description: 'Placa rectangular para una tecla de encendido simple. Mecanismo de accionamiento suave con contactos de cobre electrolítico.',
      price: Q.PRICES.electrica.individual[0],
      unit: 'por placa armada',
      specs: ['1 Módulo interruptor', 'Tensión 220V ~ 10A', 'Chasis metálico reforzado', 'Colores blanco y negro'],
      badge: 'Básico',
      colors: ['white', 'black'],
      featured: true
    },
    {
      id: 'placa-luz-2-puntos',
      category: 'electrica',
      kind: 'switch',
      modules: 2,
      title: 'Placa con 2 Puntos de Luz',
      subtitle: 'Doble interruptor unipolar',
      description: 'Control independiente para dos circuitos de iluminación en una misma caja rectangular estándar.',
      price: Q.PRICES.electrica.individual[1],
      unit: 'por placa armada',
      specs: ['2 Módulos interruptor', 'Tensión 220V ~ 10A cada uno', 'Fácil conexión posterior', 'Colores blanco y negro'],
      badge: 'Más pedido',
      colors: ['white', 'black'],
      featured: true
    },
    {
      id: 'placa-luz-3-puntos',
      category: 'electrica',
      kind: 'switch',
      modules: 3,
      title: 'Placa con 3 Puntos de Luz',
      subtitle: 'Triple interruptor unipolar',
      description: 'Máxima capacidad de control en una sola boca. Ideal para salas principales, pasillos o circuitos combinados.',
      price: Q.PRICES.electrica.individual[2],
      unit: 'por placa armada',
      specs: ['3 Módulos interruptor', 'Tensión 220V ~ 10A', 'Diseño compacto y alineado', 'Colores blanco y negro'],
      badge: 'Capacidad completa',
      colors: ['white', 'black'],
      featured: false
    },
    {
      id: 'placa-toma-1-enchufe',
      category: 'electrica',
      kind: 'socket',
      modules: 1,
      title: 'Placa con 1 Tomacorriente',
      subtitle: 'Toma simple con puesta a tierra',
      description: 'Tomacorriente seguro con traba para niños y borne de tierra. Para electrodomésticos y equipos de consumo estándar.',
      price: Q.PRICES.electrica.individual[0],
      unit: 'por placa armada',
      specs: ['1 Tomacorriente 2P+T', 'Capacidad 10A/16A ~ 250V', 'Norma de seguridad vigente', 'Colores blanco y negro'],
      badge: 'Básico',
      colors: ['white', 'black'],
      featured: false
    },
    {
      id: 'placa-toma-2-enchufes',
      category: 'electrica',
      kind: 'socket',
      modules: 2,
      title: 'Placa con 2 Tomacorrientes',
      subtitle: 'Doble toma con puesta a tierra',
      description: 'Doble conexión simultánea en dormitorios, escritorios y mesadas de trabajo sin necesidad de adaptadores.',
      price: Q.PRICES.electrica.individual[1],
      unit: 'por placa armada',
      specs: ['2 Tomacorrientes 2P+T', '10A/16A independientes', 'Chasis de anclaje firme', 'Colores blanco y negro'],
      badge: 'Estándar',
      colors: ['white', 'black'],
      featured: true
    },
    {
      id: 'placa-toma-3-enchufes',
      category: 'electrica',
      kind: 'socket',
      modules: 3,
      title: 'Placa con 3 Tomacorrientes',
      subtitle: 'Triple toma de alta densidad',
      description: 'Tres puestos de conexión en un único bastidor. Configuración óptima para centros de entretenimiento y estaciones de trabajo.',
      price: Q.PRICES.electrica.individual[2],
      unit: 'por placa armada',
      specs: ['3 Tomacorrientes 2P+T', 'Conexión reforzada', 'Distribución simétrica', 'Colores blanco y negro'],
      badge: 'Alta densidad',
      colors: ['white', 'black'],
      featured: false
    },
    {
      id: 'placa-mixta-1-luz-1-toma',
      category: 'electrica',
      kind: 'mixed',
      modules: 1,
      title: 'Placa Mixta: 1 Luz + 1 Enchufe',
      subtitle: 'Combinación versátil para accesos',
      description: 'Interruptor y tomacorriente combinados en la misma placa. Práctica para entradas, cabeceras de cama y baños.',
      price: Q.PRICES.electrica.ambos[0],
      unit: 'por placa armada',
      specs: ['1 Llave de luz + 1 Toma 2P+T', 'Aislamiento interno seguro', 'Diseño armónico', 'Colores blanco y negro'],
      badge: 'Combinada',
      colors: ['white', 'black'],
      featured: true
    },
    {
      id: 'placa-mixta-2-luces-1-toma',
      category: 'electrica',
      kind: 'mixed',
      modules: 2,
      title: 'Placa Mixta: 2 Luces + 1 Enchufe',
      subtitle: 'Doble interruptor y toma integrado',
      description: 'Control de dos circuitos lumínicos más un tomacorriente auxiliar en una sola caja 4x2.',
      price: Q.PRICES.electrica.ambos[1],
      unit: 'por placa armada',
      specs: ['2 Interruptores + 1 Toma', 'Distribución balanceada', 'Contactos de plata/cobre', 'Colores blanco y negro'],
      badge: 'Combinada',
      colors: ['white', 'black'],
      featured: false
    },
    {
      id: 'placa-mixta-1-luz-2-tomas',
      category: 'electrica',
      kind: 'mixed',
      modules: 3,
      title: 'Placa Mixta: 1 Luz + 2 Enchufes',
      subtitle: 'Interruptor y doble toma',
      description: 'Iluminación y doble alimentación auxiliar para mesadas de cocina, oficinas y áreas de taller.',
      price: Q.PRICES.electrica.ambos[2],
      unit: 'por placa armada',
      specs: ['1 Llave + 2 Tomas 2P+T', 'Estructura rígida', 'Certificación normalizada', 'Colores blanco y negro'],
      badge: 'Combinada',
      colors: ['white', 'black'],
      featured: false
    },
    {
      id: 'touch-wifi-1-canal',
      category: 'domotica',
      kind: 'touch',
      modules: 1,
      title: 'Interruptor Táctil Wi-Fi (1 Canal)',
      subtitle: 'Placa de cristal inteligente',
      description: 'Panel táctil capacitivo de vidrio templado. Encendido manual sensible al tacto, control por voz y app desde cualquier lugar.',
      price: Q.PRICES.domotica.touch[0],
      unit: 'por unidad instalada',
      specs: ['1 Pulsador táctil con aro LED', 'Conectividad Wi-Fi 2.4 GHz', 'Compatible con Alexa y Google Home', 'Cristal templado anti-rayas'],
      badge: 'Smart Touch',
      colors: ['black', 'white'],
      featured: true
    },
    {
      id: 'touch-wifi-2-canales',
      category: 'domotica',
      kind: 'touch',
      modules: 2,
      title: 'Interruptor Táctil Wi-Fi (2 Canales)',
      subtitle: 'Doble pulsador inteligente',
      description: 'Control de dos zonas de luz independientes con doble anillo luminoso tenue para localización nocturna.',
      price: Q.PRICES.domotica.touch[1],
      unit: 'por unidad instalada',
      specs: ['2 Canales táctiles independientes', 'Automatizaciones y horarios en app', 'Cero desgaste mecánico', 'Cristal templado negro o blanco'],
      badge: 'Destacado domótica',
      colors: ['black', 'white'],
      featured: true
    },
    {
      id: 'touch-wifi-3-canales',
      category: 'domotica',
      kind: 'touch',
      modules: 3,
      title: 'Interruptor Táctil Wi-Fi (3 Canales)',
      subtitle: 'Triple pulsador inteligente',
      description: 'La solución más completa para domótica en caja estándar. Escenas personalizadas y control centralizado de iluminación.',
      price: Q.PRICES.domotica.touch[2],
      unit: 'por unidad instalada',
      specs: ['3 Canales táctiles', 'Modo escena y grupos', 'Retroiluminación LED discreta', 'Montaje sobre caja estándar 4x2'],
      badge: 'Máximo control',
      colors: ['black', 'white'],
      featured: true
    },
    {
      id: 'control-ac-ir-smart',
      category: 'domotica',
      kind: 'ir',
      modules: 1,
      title: 'Control Inteligente AC / Infrarrojo',
      subtitle: 'Emisor IR 360° Wi-Fi',
      description: 'Automatizá tu acondicionador de aire o TV. Programá temperaturas, rutinas de apagado y encendé el clima antes de llegar a casa.',
      price: Q.PRICES.domotica.acIrUnit,
      unit: 'por equipo',
      specs: ['Cobertura IR 360 grados', 'Curva de temperatura programable', 'Integración con Google y Alexa', 'Sin cables a la vista'],
      badge: 'Climatización',
      colors: ['black'],
      featured: true
    },
    {
      id: 'cableado-instalacion-metro',
      category: 'cableado',
      kind: 'cable',
      modules: 1,
      title: 'Cableado y Canalización por Metro',
      subtitle: 'Material ignífugo + mano de obra',
      description: 'Tendido de conductores antillama normalizados, cañería embutida o a la vista, guía y empalmes bajo norma técnica.',
      price: Q.PRICES.electrica.cableMetro,
      unit: 'por metro lineal',
      specs: ['Cable antiflama normalizado', 'Cálculo de sección adecuada', 'Tendido prolijo y rotulado', 'Garantía de instalación'],
      badge: 'Infraestructura',
      colors: [],
      featured: false
    }
  ];

  function getProduct(id) {
    return PRODUCTS.find(function (p) { return p.id === id; });
  }

  return {
    CATEGORIES: CATEGORIES,
    PRODUCTS: PRODUCTS,
    getProduct: getProduct
  };
});
