// Browser smoke checks for Storefront (Home, Catalog, Product Detail, Contact)
// node tests/browser-store-smoke.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const target = await (await fetch('http://127.0.0.1:9226/json/new?about:blank', {method:'PUT'})).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject) => {ws.onopen=resolve;ws.onerror=reject;});
  let id=0;
  const pending = new Map(), errors=[];
  ws.onmessage = event => {
    const msg=JSON.parse(event.data);
    if(msg.id) {const entry=pending.get(msg.id); if(entry){clearTimeout(entry.timer);pending.delete(msg.id); msg.error?entry.reject(new Error(JSON.stringify(msg.error))):entry.resolve(msg.result);}}
    if(msg.method==='Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text);
  };
  function cdp(method,params={}) {return new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>reject(new Error('CDP timeout '+method)),15000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});}
  async function js(expression) {const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
  const base=process.env.CR_SERVICE_URL || 'http://127.0.0.1:8765';
  const out=process.env.CR_QA_DIR || process.cwd();

  try {
    await cdp('Page.enable'); await cdp('Runtime.enable');

    // 1. Test Home page
    await cdp('Page.navigate',{url:base + '/index.html'});
    for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,100));if(await js('document.querySelectorAll("#home-products .product-card").length >= 6'))break;}
    const homeCards = await js('document.querySelectorAll("#home-products .product-card").length');
    assert.ok(homeCards >= 6, 'Home displays featured products in grid: got ' + homeCards);
    const homeShot = await cdp('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(out,'cristec-home.png'),Buffer.from(homeShot.data,'base64'));

    // 2. Test Catalog page
    await cdp('Page.navigate',{url:base + '/productos.html'});
    for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,100));if(await js('document.querySelectorAll("#catalog-grid .product-card").length === 14'))break;}
    assert.equal(await js('document.querySelectorAll("#catalog-grid .product-card").length'), 14, 'Catalog displays all 14 products');

    // Filter by Domótica
    await js('document.querySelector("[data-filter-category=domotica]").click()');
    assert.equal(await js('document.querySelectorAll("#catalog-grid .product-card").length'), 4, 'Catalog filters to 4 smart products');

    // Search input
    await js('const inp = document.querySelector("#catalog-search-input"); inp.value = "tactil"; inp.dispatchEvent(new Event("input", {bubbles:true}))');
    assert.equal(await js('document.querySelectorAll("#catalog-grid .product-card").length'), 3, 'Search filters to 3 touch switches');

    const catalogShot = await cdp('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(out,'cristec-catalog.png'),Buffer.from(catalogShot.data,'base64'));

    // 3. Test Product Detail page
    await cdp('Page.navigate',{url:base + '/producto.html?id=touch-wifi-2-canales'});
    for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,100));if(await js('document.querySelector("#product-detail-container h1")?.textContent.includes("2 Canales")'))break;}
    assert.ok((await js('document.querySelector("#product-detail-container h1").textContent')).includes('2 Canales'));
    assert.ok((await js('document.querySelector(".detail-price-val").textContent')).includes('185.000'));

    // Test color toggle
    await js('document.querySelector("#btn-color-white").click()');
    assert.ok(await js('document.querySelector("#detail-touch-preview").classList.contains("white-glass")'));

    // WhatsApp link
    const waHref = await js('document.querySelector(".btn-whatsapp-large").href');
    assert.ok(waHref.includes('595992067705') && waHref.includes('2%20Canales'), 'WhatsApp link contains phone and product');

    // Mobile responsive check at 390px
    await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    assert.equal(await js('innerWidth'), 390);
    assert.equal(await js('document.documentElement.scrollWidth'), 390, 'No horizontal overflow on mobile detail');

    const detailShot = await cdp('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(out,'cristec-detail-mobile.png'),Buffer.from(detailShot.data,'base64'));

    // 4. Test Contact page
    await cdp('Page.navigate',{url:base + '/contacto.html'});
    for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,100));if(await js('document.querySelector("h1")?.textContent.includes("Hablemos")'))break;}
    assert.ok(await js('document.body.textContent.includes("+595 992 067705")'));

    assert.deepEqual(errors, []);
    console.log('BROWSER_STORE_SMOKE_PASS: Home (featured grid), Catalog (14 products, category filters, live search), Detail (touch 2CH, Gs. 185k, color toggle, WhatsApp), Mobile (390px no overflow), Contact; 0 runtime errors.');
  } finally { ws.close(); await fetch('http://127.0.0.1:9226/json/close/'+target.id); }
})().catch(e=>{console.error(e);process.exitCode=1;});
