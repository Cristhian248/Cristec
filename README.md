# CRISTEC — Configurador de instalaciones

Web estática en español para cotizar electricidad y domótica. Sin dependencias de producción ni compilación.

## Diseño
Estudio visual de producto: navegación horizontal, superficies claras, placas representativas que reflejan las opciones elegidas y resumen integrado. En celular, primero se ve la placa, luego los controles. El total y la consulta permanecen disponibles en la barra inferior.

## Funciones
- Instalación eléctrica: interruptores, enchufes, placas mixtas, acabados y cableado.
- Domótica: placas Wi-Fi de 1–3 canales, control AC / IR y preferencias de control.
- Desglose del estimado y solicitud por WhatsApp al número original de CRISTEC.
- Datos opcionales del cliente, borrador local, reinicio con confirmación e impresión / PDF.
- Controles por teclado, etiquetas accesibles, reducción de movimiento y diseño móvil.

Los valores originales se conservan: placas eléctricas Gs. 50.000 / 100.000 / 150.000; mixtas Gs. 100.000 / 130.000 / 160.000; domótica Gs. 120.000 / 185.000 / 250.000; cableado Gs. 12.000/m; control AC / IR Gs. 150.000/equipo. Son referencias, no presupuestos definitivos. La cantidad cotizada corresponde a placas con la misma configuración, no a habitaciones.

## Archivos
- `index.html`: estructura y formularios.
- `assets/styles.css`: composición, placas ilustrativas, móvil e impresión.
- `assets/quote.js`: cálculo, validación y mensajes.
- `assets/app.js`: controles, vistas y persistencia.
- `tests/*.test.js`: pruebas sin dependencias con Node.js.
- `tests/browser-smoke.cjs`: comprobación opcional en Chrome vía CDP.

## Abrir localmente
Desde este directorio:

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:8765`. También puede abrirse `index.html` directamente; el guardado local depende de los permisos del navegador.

## Pruebas

```bash
node --test tests/*.test.js
```

Para comprobar la interfaz real, mantener el servidor local y abrir una instancia aislada de Chrome con `--headless=new --remote-debugging-port=9226 --user-data-dir=<carpeta-temporal>`. Después:

```bash
node tests/browser-smoke.cjs
```

El chequeo prueba cálculos, vistas, colores, persistencia, WhatsApp, impresión, reinicio y ancho móvil de 390 px. Genera una captura y un PDF de prueba en `CR_QA_DIR` o el directorio de ejecución. No envía mensajes ni cambia datos remotos. `CR_SERVICE_URL` permite cambiar el servidor objetivo; usar solo sitios de prueba autorizados.

## Publicación y privacidad
GitHub Pages sirve `main` desde la raíz. Los archivos se publican tal cual, sin build ni claves de API. Los datos del cliente permanecen en `localStorage` del navegador hasta que se abre y envía la solicitud en WhatsApp. No hay backend, analíticas ni envío automático de formularios.
