/**
 * CRISTEC - Aplicación Principal y Controlador UI
 * Gestiona eventos, render reactivo, drafts en localStorage y WhatsApp URL
 */

(function () {
  'use strict';

  const {
    PHONE_NUMBER,
    PRICES,
    DEFAULT_STATE,
    validateQuantity,
    sanitizeState,
    formatCurrency,
    calculateQuote,
    buildWhatsAppMessage,
    buildWhatsAppUrl
  } = window.CristecQuote;

  const STORAGE_KEY = 'cristec_quote_draft_v2';

  // Estado en memoria mutable con inicialización desde draft guardado
  let state = loadSavedState();

  function loadSavedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return sanitizeState(parsed);
      }
    } catch (e) {
      console.warn('CRISTEC: No se pudo leer localStorage (modo restringido o corrupto)', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function saveStateDraft() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      showToast('Borrador guardado');
    } catch (e) {
      console.warn('CRISTEC: localStorage no disponible para guardar borrador', e);
    }
  }

  function showToast(msg) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  // Renders de módulos eléctricos clásicos
  function renderModuleHTML(type) {
    if (type === 'switch') {
      return '<div class="module-slot mod-switch" aria-label="Módulo de interruptor"><div class="mod-switch-indicator"></div></div>';
    } else if (type === 'socket') {
      return '<div class="module-slot mod-socket" aria-label="Módulo de enchufe/toma"><div class="socket-holes"><div class="hole-pin"></div><div class="hole-pin"></div></div><div class="hole-ground"></div></div>';
    }
    return '<div class="module-slot mod-blank" aria-label="Tapa ciega / módulo vacío"></div>';
  }

  // Actualización integral de la interfaz
  function updateUI() {
    const calc = calculateQuote(state);

    // Sincronizar vista activa
    document.querySelectorAll('[data-view-panel]').forEach(panel => {
      const mode = panel.getAttribute('data-view-panel');
      panel.style.display = mode === state.mode ? 'block' : 'none';
    });

    // Sincronizar botones de navegación lateral y móvil
    document.querySelectorAll('[data-nav-target]').forEach(btn => {
      const target = btn.getAttribute('data-nav-target');
      const isActive = target === state.mode;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // Sincronizar inputs de datos de cliente
    const nameInput = document.getElementById('input-cust-name');
    const locInput = document.getElementById('input-cust-location');
    const notesInput = document.getElementById('input-cust-notes');
    if (nameInput && document.activeElement !== nameInput) nameInput.value = state.customer.name;
    if (locInput && document.activeElement !== locInput) locInput.value = state.customer.location;
    if (notesInput && document.activeElement !== notesInput) notesInput.value = state.customer.notes;

    // Sincronizar formulario eléctrico
    const el = state.electrica;
    setVal('el-rooms-val', el.habitaciones);
    setVal('el-plates-val', el.puntosTotales);
    setVal('el-cable-val', el.cableadoMetros);

    // Placas render eléctrico
    const plateRender = document.getElementById('plate-render-elec');
    const plateFrame = document.getElementById('plate-frame-elec');
    if (plateRender && plateFrame) {
      plateRender.className = 'mech-plate ' + (el.color === 'black' ? 'black-plate' : 'white-plate');
      let slots = ['blank', 'blank', 'blank'];
      if (el.tipoInstalacion === 'Interruptores') {
        if (el.puntos === 1) slots = ['blank', 'switch', 'blank'];
        if (el.puntos === 2) slots = ['switch', 'blank', 'switch'];
        if (el.puntos === 3) slots = ['switch', 'switch', 'switch'];
      } else if (el.tipoInstalacion === 'Enchufes') {
        if (el.puntos === 1) slots = ['blank', 'socket', 'blank'];
        if (el.puntos === 2) slots = ['socket', 'blank', 'socket'];
        if (el.puntos === 3) slots = ['socket', 'socket', 'socket'];
      } else if (el.tipoInstalacion === 'Ambos') {
        if (el.puntos === 1) slots = ['switch', 'blank', 'socket'];
        if (el.puntos === 2) slots = ['switch', 'switch', 'socket'];
        if (el.puntos === 3) slots = ['switch', 'socket', 'socket'];
      }
      plateFrame.innerHTML = slots.map(renderModuleHTML).join('');
    }

    // Tipo de instalación y módulos en eléctrica
    syncOptionGroup('tipo-elec-group', el.tipoInstalacion);
    syncOptionGroup('modulos-elec-group', String(el.puntos));
    document.querySelectorAll('#modulos-elec-group [data-option-val]').forEach((btn, i) => {
      const mixed = el.tipoInstalacion === 'Ambos';
      btn.querySelector('.option-title').textContent = mixed ? ['1 luz + 1 enchufe', '2 luces + 1 enchufe', '1 luz + 2 enchufes'][i] : (i + 1) + (i === 0 ? ' módulo' : ' módulos');
      btn.querySelector('.option-price-hint').textContent = formatCurrency((mixed ? PRICES.electrica.ambos : PRICES.electrica.individual)[i]) + ' / placa';
    });
    syncColorButtons('el-color-white', 'el-color-black', el.color);

    const cableCheckbox = document.getElementById('el-cable-toggle');
    const cableSection = document.getElementById('el-cable-section');
    if (cableCheckbox) cableCheckbox.checked = el.cableadoEnabled;
    if (cableSection) cableSection.style.display = el.cableadoEnabled ? 'block' : 'none';

    // Sincronizar formulario domótica
    const auto = state.automatizacion;
    setVal('auto-rooms-val', auto.habitaciones);
    setVal('auto-plates-val', auto.puntosTotales);
    setVal('auto-ac-val', auto.acQty);

    syncOptionGroup('canales-auto-group', String(auto.puntos));
    syncColorButtons('auto-color-white', 'auto-color-black', auto.color);

    const acCheckbox = document.getElementById('auto-ac-toggle');
    const acSection = document.getElementById('auto-ac-section');
    if (acCheckbox) acCheckbox.checked = auto.acEnabled;
    if (acSection) acSection.style.display = auto.acEnabled ? 'block' : 'none';

    // Plataformas domóticas
    document.querySelectorAll('[data-platform-name]').forEach(btn => {
      const plat = btn.getAttribute('data-platform-name');
      const isIncluded = auto.plataformas.includes(plat);
      btn.classList.toggle('active', isIncluded);
      btn.setAttribute('aria-pressed', isIncluded ? 'true' : 'false');
    });

    // Render visual domótica
    const switchRenderAuto = document.getElementById('switch-render-auto');
    const ringsContainerAuto = document.getElementById('rings-container-auto');
    const acRenderAuto = document.getElementById('ac-render-auto');
    const stageCaptionAuto = document.getElementById('stage-caption-auto');

    if (switchRenderAuto && ringsContainerAuto) {
      switchRenderAuto.className = 'switch-product ' + (auto.color === 'white' ? 'white-glass' : 'black-glass');
      let ringsHtml = '';
      for (let i = 0; i < auto.puntos; i++) {
        ringsHtml += '<div class="touch-ring"></div>';
      }
      ringsContainerAuto.innerHTML = ringsHtml;
    }

    if (acRenderAuto) acRenderAuto.style.display = auto.acEnabled ? 'flex' : 'none';
    if (stageCaptionAuto) {
      stageCaptionAuto.textContent = auto.acEnabled ? 'Interruptor Wi-Fi + Control IR AC' : 'Placa Táctil Wi-Fi';
    }

    // Actualizar Panel de Cotización Sticky y Desglose
    updateQuotationPanel(calc);
  }

  function updateQuotationPanel(calc) {
    const badgeMode = document.getElementById('summary-mode-badge');
    if (badgeMode) {
      badgeMode.textContent = calc.mode === 'electrica' ? 'Eléctrico' : calc.mode === 'automatizacion' ? 'Domótica' : 'Tarifario';
    }

    const breakdownList = document.getElementById('breakdown-items-container');
    if (breakdownList) {
      let html = '';

      if (calc.mode === 'electrica') {
        html += createBreakdownRow('Habitaciones', `${calc.rooms} ambiente(s)`);
        html += createBreakdownRow(
          `Placas (${calc.plateQty} unid.)`,
          formatCurrency(calc.platesSubtotal),
          `${calc.moduleDescription} • Color ${calc.color === 'black' ? 'Negro' : 'Blanco'}`
        );
        if (calc.cableEnabled) {
          html += createBreakdownRow(
            `Cableado (${calc.cableMeters}m)`,
            formatCurrency(calc.wiringSubtotal),
            `Tarifa Gs. ${PRICES.electrica.cableMetro.toLocaleString('es-PY')}/m`
          );
        } else {
          html += createBreakdownRow('Cableado', 'No requerido / existente');
        }
      } else if (calc.mode === 'automatizacion') {
        html += createBreakdownRow('Habitaciones', `${calc.rooms} ambiente(s)`);
        html += createBreakdownRow(
          `Placas táctiles (${calc.plateQty} unid.)`,
          formatCurrency(calc.platesSubtotal),
          `${calc.switchDescription} • Cristal ${calc.color === 'white' ? 'Blanco' : 'Negro'}`
        );
        if (calc.acEnabled) {
          html += createBreakdownRow(
            `Control AC / IR (${calc.acQty} unid.)`,
            formatCurrency(calc.acSubtotal),
            `Gs. ${PRICES.domotica.acIrUnit.toLocaleString('es-PY')} c/u`
          );
        } else {
          html += createBreakdownRow('Control AC / IR', 'No incluido');
        }
        const platTxt = calc.plataformas && calc.plataformas.length > 0 ? calc.plataformas.join(', ') : 'Directo Wi-Fi';
        html += createBreakdownRow('Ecosistema', platTxt);
      } else {
        html += createBreakdownRow('Lista de precios', 'Consulte cotización personalizada');
      }

      breakdownList.innerHTML = html;
    }

    const totalFormatted = calc.mode === 'precios' ? 'A consultar' : formatCurrency(calc.total);
    const printCustomer = document.getElementById('print-customer');
    printCustomer.textContent = [state.customer.name, state.customer.location, state.customer.notes].filter(Boolean).join(' · ');
    document.getElementById('btn-print-quote').disabled = calc.mode === 'precios';
    const totalDisplay = document.getElementById('quote-total-val');
    const mobileFloatingTotal = document.getElementById('mobile-floating-total');
    if (totalDisplay) totalDisplay.textContent = totalFormatted;
    if (mobileFloatingTotal) mobileFloatingTotal.textContent = totalFormatted;

    // Actualizar enlaces directos de WhatsApp
    const waMsg = buildWhatsAppMessage(state);
    const waUrl = buildWhatsAppUrl(waMsg);

    const waBtnPrimary = document.getElementById('btn-whatsapp-quote');
    const waBtnMobile = document.getElementById('btn-whatsapp-mobile');
    if (waBtnPrimary) waBtnPrimary.href = waUrl;
    if (waBtnMobile) waBtnMobile.href = waUrl;
  }

  function createBreakdownRow(label, value, subval = '') {
    return `
      <div class="breakdown-row">
        <span class="breakdown-label">${label}</span>
        <span class="breakdown-val">
          ${value}
          ${subval ? `<span class="breakdown-subval">${subval}</span>` : ''}
        </span>
      </div>`;
  }

  function setVal(id, text) {
    const elem = document.getElementById(id);
    if (elem) {
      if ('value' in elem) elem.value = text;
      else elem.textContent = text;
    }
  }

  function syncOptionGroup(groupId, selectedVal) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('[data-option-val]').forEach(btn => {
      const val = btn.getAttribute('data-option-val');
      const isMatch = val === selectedVal;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    });
  }

  function syncColorButtons(whiteId, blackId, activeColor) {
    const btnW = document.getElementById(whiteId);
    const btnB = document.getElementById(blackId);
    if (btnW) {
      const isW = activeColor === 'white';
      btnW.classList.toggle('active', isW);
      btnW.setAttribute('aria-pressed', isW ? 'true' : 'false');
    }
    if (btnB) {
      const isB = activeColor === 'black';
      btnB.classList.toggle('active', isB);
      btnB.setAttribute('aria-pressed', isB ? 'true' : 'false');
    }
  }

  // Vinculación de Eventos e Interacciones
  function bindEvents() {
    // Navegación principal
    document.querySelectorAll('[data-nav-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-nav-target');
        state.mode = target;
        saveStateDraft();
        updateUI();
      });
    });

    // Inputs del cliente
    const bindTextInput = (id, prop) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.addEventListener('input', () => {
        state.customer[prop] = input.value;
        saveStateDraft();
        updateUI();
      });
    };
    bindTextInput('input-cust-name', 'name');
    bindTextInput('input-cust-location', 'location');
    bindTextInput('input-cust-notes', 'notes');

    // Controles numéricos eléctricos
    bindCounter('el-rooms-dec', 'el-rooms-inc', 'el-rooms-val', (delta) => {
      state.electrica.habitaciones = validateQuantity(state.electrica.habitaciones + delta, 1, 50);
    }, (val) => {
      state.electrica.habitaciones = validateQuantity(val, 1, 50);
    });

    bindCounter('el-plates-dec', 'el-plates-inc', 'el-plates-val', (delta) => {
      state.electrica.puntosTotales = validateQuantity(state.electrica.puntosTotales + delta, 1, 500);
    }, (val) => {
      state.electrica.puntosTotales = validateQuantity(val, 1, 500);
    });

    bindCounter('el-cable-dec', 'el-cable-inc', 'el-cable-val', (delta) => {
      state.electrica.cableadoMetros = validateQuantity(state.electrica.cableadoMetros + (delta * 5), 1, 1000);
    }, (val) => {
      state.electrica.cableadoMetros = validateQuantity(val, 1, 1000);
    });

    // Controles numéricos domótica
    bindCounter('auto-rooms-dec', 'auto-rooms-inc', 'auto-rooms-val', (delta) => {
      state.automatizacion.habitaciones = validateQuantity(state.automatizacion.habitaciones + delta, 1, 50);
    }, (val) => {
      state.automatizacion.habitaciones = validateQuantity(val, 1, 50);
    });

    bindCounter('auto-plates-dec', 'auto-plates-inc', 'auto-plates-val', (delta) => {
      state.automatizacion.puntosTotales = validateQuantity(state.automatizacion.puntosTotales + delta, 1, 500);
    }, (val) => {
      state.automatizacion.puntosTotales = validateQuantity(val, 1, 500);
    });

    bindCounter('auto-ac-dec', 'auto-ac-inc', 'auto-ac-val', (delta) => {
      state.automatizacion.acQty = validateQuantity(state.automatizacion.acQty + delta, 1, 50);
    }, (val) => {
      state.automatizacion.acQty = validateQuantity(val, 1, 50);
    });

    // Botones de opciones eléctricas
    bindOptionGroupClicks('tipo-elec-group', (val) => {
      state.electrica.tipoInstalacion = val;
    });
    bindOptionGroupClicks('modulos-elec-group', (val) => {
      state.electrica.puntos = parseInt(val, 10);
    });

    // Botones de color eléctrica
    const elColW = document.getElementById('el-color-white');
    const elColB = document.getElementById('el-color-black');
    if (elColW) elColW.addEventListener('click', () => { state.electrica.color = 'white'; saveAndRefresh(); });
    if (elColB) elColB.addEventListener('click', () => { state.electrica.color = 'black'; saveAndRefresh(); });

    // Checkbox cableado eléctrica
    const elCableToggle = document.getElementById('el-cable-toggle');
    if (elCableToggle) {
      elCableToggle.addEventListener('change', () => {
        state.electrica.cableadoEnabled = elCableToggle.checked;
        saveAndRefresh();
      });
    }

    // Botones de opciones domótica
    bindOptionGroupClicks('canales-auto-group', (val) => {
      state.automatizacion.puntos = parseInt(val, 10);
    });

    const autoColW = document.getElementById('auto-color-white');
    const autoColB = document.getElementById('auto-color-black');
    if (autoColW) autoColW.addEventListener('click', () => { state.automatizacion.color = 'white'; saveAndRefresh(); });
    if (autoColB) autoColB.addEventListener('click', () => { state.automatizacion.color = 'black'; saveAndRefresh(); });

    const autoAcToggle = document.getElementById('auto-ac-toggle');
    if (autoAcToggle) {
      autoAcToggle.addEventListener('change', () => {
        state.automatizacion.acEnabled = autoAcToggle.checked;
        saveAndRefresh();
      });
    }

    // Plataformas domóticas múltiples
    document.querySelectorAll('[data-platform-name]').forEach(btn => {
      btn.addEventListener('click', () => {
        const plat = btn.getAttribute('data-platform-name');
        if (state.automatizacion.plataformas.includes(plat)) {
          state.automatizacion.plataformas = state.automatizacion.plataformas.filter(p => p !== plat);
        } else {
          state.automatizacion.plataformas.push(plat);
        }
        saveAndRefresh();
      });
    });

    // Botón de reinicio con confirmación accesible
    const btnReset = document.getElementById('btn-reset-quote');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        const ok = window.confirm('¿Deseas restablecer todos los valores de la cotización a los iniciales?');
        if (ok) {
          state = JSON.parse(JSON.stringify(DEFAULT_STATE));
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch (e) {}
          showToast('Configuración reiniciada');
          updateUI();
        }
      });
    }

    // Botón de imprimir / PDF
    const btnPrint = document.getElementById('btn-print-quote');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }
  }

  function saveAndRefresh() {
    saveStateDraft();
    updateUI();
  }

  function bindCounter(decId, incId, inputId, onDelta, onDirectInput) {
    const btnDec = document.getElementById(decId);
    const btnInc = document.getElementById(incId);
    const input = document.getElementById(inputId);

    if (btnDec) {
      btnDec.addEventListener('click', () => {
        onDelta(-1);
        saveAndRefresh();
      });
    }
    if (btnInc) {
      btnInc.addEventListener('click', () => {
        onDelta(1);
        saveAndRefresh();
      });
    }
    if (input) {
      input.addEventListener('change', () => {
        onDirectInput(input.value);
        saveAndRefresh();
      });
    }
  }

  function bindOptionGroupClicks(groupId, onSelect) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('[data-option-val]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-option-val');
        onSelect(val);
        saveAndRefresh();
      });
    });
  }

  // Inicio tras cargar DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindEvents();
      updateUI();
    });
  } else {
    bindEvents();
    updateUI();
  }

})();
