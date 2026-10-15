// Real-browser smoke checks. Start local server :8765 and Chrome CDP :9226.
// node tests/browser-smoke.cjs
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
  try {
    await cdp('Page.enable'); await cdp('Runtime.enable');
    await cdp('Page.navigate',{url:base});
    for(let i=0;i<40;i++){if(await js('!!window.CristecQuote && !!document.querySelector("#btn-whatsapp-quote") && document.querySelector("#btn-whatsapp-quote").href.includes("phone=")'))break;await new Promise(r=>setTimeout(r,100));}
    await js('localStorage.clear(); location.reload()');
    for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,100));if(await js('!!document.querySelector("#btn-whatsapp-quote") && document.querySelector("#btn-whatsapp-quote").href.includes("phone=")'))break;}
    assert.equal(await js('document.querySelector("#quote-total-val").textContent'),'Gs. 50.000');
    await js('document.querySelector("#el-plates-inc").click();document.querySelector("#el-cable-toggle").click()');
    assert.equal(await js('document.querySelector("#quote-total-val").textContent'),'Gs. 220.000');
    await js('document.querySelector("[data-nav-target=automatizacion]").click();document.querySelector("#canales-auto-group [data-option-val=\\"2\\"]").click();document.querySelector("#auto-ac-toggle").click()');
    assert.equal(await js('document.querySelector("#quote-total-val").textContent'),'Gs. 335.000');
    assert.equal(await js('document.querySelectorAll("#rings-container-auto .touch-ring").length'),2);
    await js('document.querySelector("#auto-color-white").click()');
    assert.ok(await js('document.querySelector("#switch-render-auto").classList.contains("white-glass")'));
    await js('document.querySelector(".project-details").open=true; document.querySelector("#input-cust-name").value="Prueba QA";document.querySelector("#input-cust-name").dispatchEvent(new Event("input",{bubbles:true}))');
    assert.ok(await js('new URL(document.querySelector("#btn-whatsapp-quote").href).searchParams.get("text").includes("Prueba QA")'));
    await cdp('Page.reload');
    for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,100));if(await js('document.querySelector("#input-cust-name")?.value==="Prueba QA"'))break;}
    assert.equal(await js('document.querySelector("#input-cust-name").value'),'Prueba QA');
    for(const mode of ['electrica','automatizacion','precios']){
      await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
      await js(`document.querySelector('[data-nav-target=${mode}]').click()`);
      assert.equal(await js('innerWidth'),390,mode+' viewport');
      assert.equal(await js('document.documentElement.scrollWidth'),390,mode+' overflow');
    }
    assert.equal(await js('document.querySelector("#quote-total-val").textContent'),'A consultar');
    assert.ok(!(await js('new URL(document.querySelector("#btn-whatsapp-quote").href).searchParams.get("text")')).includes('335.000'));
    await js('document.querySelector("[data-nav-target=automatizacion]").click()');
    const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    const out=process.env.CR_QA_DIR || process.cwd();
    fs.writeFileSync(path.join(out,'cristec-mobile.png'),Buffer.from(shot.data,'base64'));
    await cdp('Emulation.setEmulatedMedia',{media:'print'});
    assert.equal(await js('getComputedStyle(document.querySelector(".configuration")).display'),'none');
    assert.equal(await js('getComputedStyle(document.querySelector(".print-heading")).display'),'block');
    await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    const pdf=await cdp('Page.printToPDF',{printBackground:true,preferCSSPageSize:true});
    fs.writeFileSync(path.join(out,'cristec-print.pdf'),Buffer.from(pdf.data,'base64'));
    await cdp('Emulation.setEmulatedMedia',{media:'screen'});
    await js('window.confirm=()=>true;document.querySelector("#btn-reset-quote").click()');
    assert.equal(await js('document.querySelector("#quote-total-val").textContent'),'Gs. 50.000');
    await js('Storage.prototype.setItem=()=>{throw new Error("QA blocked storage")};document.querySelector("#el-plates-inc").click()');
    assert.equal(await js('document.querySelector("#quote-total-val").textContent'),'Gs. 100.000');
    assert.deepEqual(errors,[]);
    await js('localStorage.clear()');
    console.log('BROWSER_SMOKE_PASS: electrical, domotics, colors, preview, WhatsApp, persistence, 390px x3, prices, print, reset, blocked storage; no runtime exceptions.');
  } finally { ws.close(); await fetch('http://127.0.0.1:9226/json/close/'+target.id); }
})().catch(e=>{console.error(e);process.exitCode=1;});
