/**
 * CRISTEC - Tienda y Navegación de Catálogo
 */
(function () {
  'use strict';

  const PHONE_NUMBER = '595992067705';
  function getCatalog() { return window.CRISTEC_CATALOG || window.CristecCatalog; }
  function getQuote() { return window.CristecQuote || window.CRISTEC_QUOTE; }

  function normalizeText(str) {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function formatCurrency(amount) {
    const QUOTE = getQuote();
    if (QUOTE && typeof QUOTE.formatCurrency === 'function') {
      return QUOTE.formatCurrency(amount);
    }
    const num = typeof amount === 'number' && !Number.isNaN(amount) ? amount : 0;
    return 'Gs. ' + num.toLocaleString('es-PY');
  }

  function buildProductCard(product) {
    let mediaHtml = '';
    if (product.kind === 'touch') {
      const rings = Array.from({ length: product.modules }, () => '<div class="mini-glass-ring"></div>').join('');
      mediaHtml = `
        <div class="mini-glass">
          <span style="font-size:7px;color:#a6cda6;letter-spacing:1px;">Wi-Fi</span>
          <div style="display:flex;flex-direction:column;gap:8px;">${rings}</div>
          <span style="font:6px monospace;color:#7a8a7a;letter-spacing:1px;">CRISTEC</span>
        </div>
      `;
    } else if (product.kind === 'ir') {
      mediaHtml = `
        <div class="mini-ir">
          <span>⏻</span>
          <small style="font-size:8px;letter-spacing:1px;margin-top:4px;">IR / AC</small>
        </div>
      `;
    } else if (product.kind === 'cable') {
      mediaHtml = `
        <div class="mini-cable">
          <span>220V // CABLE</span>
        </div>
      `;
    } else {
      // Electrical modular plate (standard 3-module 4x2 architectural frame)
      const miniSocketHtml = '<div class="mini-slot mini-slot-socket"><div class="mini-socket-receptacle"><div class="mini-socket-holes"><span class="mini-universal-pin mini-pin"></span><span class="mini-universal-pin mini-pin"></span></div><span class="mini-ground"></span></div></div>';
      const miniSwitchHtml = '<div class="mini-slot mini-slot-switch"></div>';
      const miniBlankHtml = '<div class="mini-slot mini-slot-blank"></div>';

      let slotsHtml = '';
      if (product.kind === 'switch') {
        if (product.modules === 1) {
          slotsHtml = `${miniBlankHtml}${miniSwitchHtml}${miniBlankHtml}`;
        } else if (product.modules === 2) {
          slotsHtml = `${miniSwitchHtml}${miniBlankHtml}${miniSwitchHtml}`;
        } else {
          slotsHtml = `${miniSwitchHtml}${miniSwitchHtml}${miniSwitchHtml}`;
        }
      } else if (product.kind === 'socket') {
        if (product.modules === 1) {
          slotsHtml = `${miniBlankHtml}${miniSocketHtml}${miniBlankHtml}`;
        } else if (product.modules === 2) {
          slotsHtml = `${miniSocketHtml}${miniBlankHtml}${miniSocketHtml}`;
        } else {
          slotsHtml = `${miniSocketHtml}${miniSocketHtml}${miniSocketHtml}`;
        }
      } else {
        // Mixed
        if (product.modules === 1) {
          slotsHtml = `${miniSwitchHtml}${miniBlankHtml}${miniSocketHtml}`;
        } else if (product.modules === 2) {
          slotsHtml = `${miniSwitchHtml}${miniSwitchHtml}${miniSocketHtml}`;
        } else {
          slotsHtml = `${miniSwitchHtml}${miniSocketHtml}${miniSocketHtml}`;
        }
      }
      mediaHtml = `
        <div class="mini-plate mini-white">
          <div class="mini-frame">${slotsHtml}</div>
        </div>
      `;
    }

    const categoryName = product.category === 'electrica' ? 'Electricidad' : product.category === 'domotica' ? 'Domótica' : 'Cableado';
    const badgeClass = product.category === 'domotica' ? 'card-badge badge-smart' : 'card-badge';
    const whatsappText = encodeURIComponent(`Hola CRISTEC, quisiera consultar por el producto: ${product.title} (${formatCurrency(product.price)} ${product.unit}).`);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${PHONE_NUMBER}&text=${whatsappText}`;

    return `
      <article class="product-card" data-category="${product.category}" data-id="${product.id}">
        <span class="${badgeClass}">${product.badge || categoryName}</span>
        <div class="card-media" aria-hidden="true">
          ${mediaHtml}
        </div>
        <div class="card-content">
          <span class="card-category">${categoryName}</span>
          <h3 class="card-title"><a href="producto.html?id=${product.id}">${product.title}</a></h3>
          <p class="card-desc">${product.description}</p>
          <div class="card-price-row">
            <span class="card-price-label">Precio referencial</span>
            <div class="card-price">${formatCurrency(product.price)}</div>
            <span class="card-unit">${product.unit}</span>
          </div>
          <div class="card-actions">
            <a class="btn-detail" href="producto.html?id=${product.id}">Ver ficha <span aria-hidden="true">↗</span></a>
            <a class="btn-order" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">Pedir <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </article>
    `;
  }

  function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.shop-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  function initSearchForm() {
    const forms = document.querySelectorAll('form[role="search"], .shop-search');
    forms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        const input = form.querySelector('input[type="search"], input[name="q"]');
        if (input && input.value.trim()) {
          // Let browser navigate naturally if action="productos.html"
        }
      });
    });
  }

  function renderHomeProducts() {
    const container = document.getElementById('home-products');
    const CATALOG = getCatalog();
    if (!container || !CATALOG) return;
    const featured = CATALOG.PRODUCTS.filter(p => p.featured).slice(0, 8);
    container.innerHTML = featured.map(buildProductCard).join('');
  }

  function renderCatalogPage() {
    const grid = document.getElementById('catalog-grid');
    const CATALOG = getCatalog();
    if (!grid || !CATALOG) return;

    const params = new URLSearchParams(window.location.search);
    let currentCategory = params.get('categoria') || 'all';
    let currentSearch = (params.get('q') || '').trim().toLowerCase();
    let currentSort = params.get('orden') || 'featured';

    const searchInput = document.getElementById('catalog-search-input');
    if (searchInput && currentSearch) {
      searchInput.value = currentSearch;
    }

    const sortSelect = document.getElementById('catalog-sort-select');
    if (sortSelect) {
      sortSelect.value = currentSort;
      sortSelect.addEventListener('change', function () {
        currentSort = sortSelect.value;
        applyFilters();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        currentSearch = searchInput.value.trim().toLowerCase();
        applyFilters();
      });
    }

    const filterBtns = document.querySelectorAll('[data-filter-category]');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentCategory = btn.getAttribute('data-filter-category');
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    });

    function applyFilters() {
      let items = CATALOG.PRODUCTS.slice();

      if (currentCategory && currentCategory !== 'all') {
        items = items.filter(p => p.category === currentCategory);
      }

      if (currentSearch) {
        const qNorm = normalizeText(currentSearch);
        items = items.filter(p =>
          normalizeText(p.title).includes(qNorm) ||
          normalizeText(p.description).includes(qNorm) ||
          (p.subtitle && normalizeText(p.subtitle).includes(qNorm)) ||
          p.specs.some(s => normalizeText(s).includes(qNorm))
        );
      }

      if (currentSort === 'precio-asc') {
        items.sort((a, b) => a.price - b.price);
      } else if (currentSort === 'precio-desc') {
        items.sort((a, b) => b.price - a.price);
      } else if (currentSort === 'nombre') {
        items.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        // Featured first
        items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      }

      const countEl = document.getElementById('catalog-results-count');
      if (countEl) {
        countEl.textContent = `Mostrando ${items.length} ${items.length === 1 ? 'producto' : 'productos'}`;
      }

      if (items.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: #fff; border: 1px solid var(--line); border-radius: 4px;">
            <p style="font-size: 18px; font-weight: 600; margin: 0 0 8px;">No se encontraron productos con ese criterio.</p>
            <p style="color: var(--muted); font-size: 13px; margin: 0 0 16px;">Probá con otra palabra clave o restablecé los filtros.</p>
            <a href="productos.html" class="btn-detail" style="display: inline-flex;">Ver todos los productos</a>
          </div>
        `;
      } else {
        grid.innerHTML = items.map(buildProductCard).join('');
      }
    }

    // Set initial active button
    filterBtns.forEach(btn => {
      if (btn.getAttribute('data-filter-category') === currentCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    applyFilters();
  }

  function renderProductDetailPage() {
    const container = document.getElementById('product-detail-container');
    const CATALOG = getCatalog();
    if (!container || !CATALOG) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || 'placa-luz-2-puntos';
    const product = CATALOG.getProduct(id) || CATALOG.PRODUCTS[0];

    document.title = `${product.title} — CRISTEC`;

    const categoryName = product.category === 'electrica' ? 'Electricidad' : product.category === 'domotica' ? 'Domótica' : 'Cableado';
    const whatsappText = encodeURIComponent(`Hola CRISTEC, quisiera solicitar cotización por: ${product.title} (${formatCurrency(product.price)} ${product.unit}).`);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${PHONE_NUMBER}&text=${whatsappText}`;

    // Build preview element
    let galleryHtml = '';
    if (product.kind === 'touch') {
      const rings = Array.from({ length: product.modules }, () => '<div class="touch-ring"></div>').join('');
      galleryHtml = `
        <div id="detail-touch-preview" class="switch-product black-glass" style="transform:none;width:170px;height:260px;">
          <span class="wifi-icon">Wi-Fi</span>
          <div class="rings-wrapper">${rings}</div>
          <span class="device-brand">CRISTEC</span>
        </div>
        <div style="margin-top:20px;display:flex;gap:10px;align-items:center;">
          <span style="font-size:12px;color:var(--muted);">Color del cristal:</span>
          <button type="button" id="btn-color-black" style="background:#1a1f1b;color:#fff;border:1px solid #333;padding:4px 10px;font-size:11px;border-radius:3px;">Negro</button>
          <button type="button" id="btn-color-white" style="background:#f7f7f3;color:#222;border:1px solid #ccc;padding:4px 10px;font-size:11px;border-radius:3px;">Blanco</button>
        </div>
      `;
    } else if (product.kind === 'ir') {
      galleryHtml = `
        <div class="ac-controller-render" style="transform:none;width:140px;height:140px;">
          <span style="font-size:42px;">⏻</span>
          <small style="bottom:14px;font-size:10px;">IR / AC 360°</small>
        </div>
      `;
    } else if (product.kind === 'cable') {
      galleryHtml = `
        <div style="padding:40px 20px;text-align:center;">
          <div style="width:160px;height:16px;background:var(--cyan);border-radius:8px;margin:0 auto 16px;box-shadow:0 4px 12px rgba(0,124,131,0.3);"></div>
          <span style="font:12px monospace;color:var(--muted);letter-spacing:2px;">CONDUCTOR NORMALIZADO 220V</span>
        </div>
      `;
    } else {
      // Electrical modular plate (standard 3-module 4x2 architectural frame)
      const detailSocketHtml = '<div class="module-slot mod-socket"><div class="socket-receptacle"><div class="socket-holes"><div class="hole-universal hole-pin"></div><div class="hole-universal hole-pin"></div></div><div class="hole-ground"></div></div></div>';
      const detailSwitchHtml = '<div class="module-slot mod-switch"><div class="mod-switch-indicator"></div></div>';
      const detailBlankHtml = '<div class="module-slot mod-blank"></div>';

      let slotsHtml = '';
      if (product.kind === 'switch') {
        if (product.modules === 1) {
          slotsHtml = `${detailBlankHtml}${detailSwitchHtml}${detailBlankHtml}`;
        } else if (product.modules === 2) {
          slotsHtml = `${detailSwitchHtml}${detailBlankHtml}${detailSwitchHtml}`;
        } else {
          slotsHtml = `${detailSwitchHtml}${detailSwitchHtml}${detailSwitchHtml}`;
        }
      } else if (product.kind === 'socket') {
        if (product.modules === 1) {
          slotsHtml = `${detailBlankHtml}${detailSocketHtml}${detailBlankHtml}`;
        } else if (product.modules === 2) {
          slotsHtml = `${detailSocketHtml}${detailBlankHtml}${detailSocketHtml}`;
        } else {
          slotsHtml = `${detailSocketHtml}${detailSocketHtml}${detailSocketHtml}`;
        }
      } else {
        if (product.modules === 1) {
          slotsHtml = `${detailSwitchHtml}${detailBlankHtml}${detailSocketHtml}`;
        } else if (product.modules === 2) {
          slotsHtml = `${detailSwitchHtml}${detailSwitchHtml}${detailSocketHtml}`;
        } else {
          slotsHtml = `${detailSwitchHtml}${detailSocketHtml}${detailSocketHtml}`;
        }
      }
      galleryHtml = `
        <div id="detail-plate-preview" class="mech-plate white-plate" style="transform:none;width:170px;height:250px;">
          <div class="mech-frame">${slotsHtml}</div>
        </div>
        <div style="margin-top:20px;display:flex;gap:10px;align-items:center;">
          <span style="font-size:12px;color:var(--muted);">Color de la placa:</span>
          <button type="button" id="btn-color-white" style="background:#f7f7f3;color:#222;border:1px solid #ccc;padding:4px 10px;font-size:11px;border-radius:3px;">Blanco</button>
          <button type="button" id="btn-color-black" style="background:#1a1f1b;color:#fff;border:1px solid #333;padding:4px 10px;font-size:11px;border-radius:3px;">Negro</button>
        </div>
      `;
    }

    const related = CATALOG.PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);
    const relatedHtml = related.map(buildProductCard).join('');

    container.innerHTML = `
      <nav class="breadcrumb" aria-label="Ruta de navegación">
        <a href="index.html">Inicio</a>
        <span aria-hidden="true">/</span>
        <a href="productos.html">Productos</a>
        <span aria-hidden="true">/</span>
        <a href="productos.html?categoria=${product.category}">${categoryName}</a>
        <span aria-hidden="true">/</span>
        <span>${product.title}</span>
      </nav>

      <div class="product-detail-layout">
        <div class="detail-gallery">
          ${galleryHtml}
        </div>
        <div class="detail-info">
          <span class="card-category">CRISTEC · ${categoryName}</span>
          <h1>${product.title}</h1>
          <p class="detail-subtitle">${product.subtitle || ''}</p>
          <p style="font-size:15px;line-height:1.6;color:#333c33;">${product.description}</p>

          <div class="detail-price-box">
            <div>
              <span class="card-price-label">Tarifa referencial</span>
              <div class="detail-price-val">${formatCurrency(product.price)}</div>
              <span class="card-unit">${product.unit}</span>
            </div>
            <span style="font-size:11px;color:var(--muted);text-align:right;max-width:160px;">
              Instalación y materiales referenciales para Paraguay
            </span>
          </div>

          <h3 style="font-size:14px;letter-spacing:0.5px;text-transform:uppercase;margin:0 0 10px;">Especificaciones y alcance</h3>
          <ul class="detail-specs-list">
            ${product.specs.map(s => `<li>✓ ${s}</li>`).join('')}
          </ul>

          <div class="detail-actions">
            <a class="btn-whatsapp-large" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">
              Consultar o pedir por WhatsApp <span aria-hidden="true">↗</span>
            </a>
            <a class="btn-cotizador-outline" href="cotizador.html">
              Configurar instalación completa en el Cotizador <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>

      <section style="margin-top:64px;border-top:1px solid var(--line);padding-top:36px;">
        <div class="section-heading">
          <h2>Productos relacionados</h2>
          <a href="productos.html?categoria=${product.category}" class="text-link">Ver más en ${categoryName} ↗</a>
        </div>
        <div class="product-grid">
          ${relatedHtml}
        </div>
      </section>
    `;

    // Color toggles inside detail view
    const btnWhite = document.getElementById('btn-color-white');
    const btnBlack = document.getElementById('btn-color-black');
    const platePreview = document.getElementById('detail-plate-preview');
    const touchPreview = document.getElementById('detail-touch-preview');

    if (btnWhite && btnBlack) {
      btnWhite.addEventListener('click', function () {
        if (platePreview) {
          platePreview.classList.remove('black-plate');
          platePreview.classList.add('white-plate');
        }
        if (touchPreview) {
          touchPreview.classList.remove('black-glass');
          touchPreview.classList.add('white-glass');
        }
      });
      btnBlack.addEventListener('click', function () {
        if (platePreview) {
          platePreview.classList.remove('white-plate');
          platePreview.classList.add('black-plate');
        }
        if (touchPreview) {
          touchPreview.classList.remove('white-glass');
          touchPreview.classList.add('black-glass');
        }
      });
    }
  }

  function init() {
    initMobileMenu();
    initSearchForm();
    renderHomeProducts();
    renderCatalogPage();
    renderProductDetailPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
