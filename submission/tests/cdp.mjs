// Minimal headless-Chrome driver over the DevTools protocol (no dependencies).
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;
const delay = ms => new Promise(r => setTimeout(r, ms));

export async function launch(outDir) {
  mkdirSync(outDir, { recursive: true });
  const profile = join(tmpdir(), 'cdp-profile-' + Date.now());
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--hide-scrollbars', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.some(t => t.type === 'page')) break; } catch {}
    await delay(200);
  }
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result)); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');

  const api = {
    send,
    async size(width, height = 900) { await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 }); },
    async goto(url) { await send('Page.navigate', { url }); await delay(1200); await api.eval('await document.fonts.ready; await new Promise(r=>setTimeout(r,300));'); },
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error('eval failed: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    },
    async shot(name, selector) {
      let clip;
      if (selector) {
        clip = await api.eval(`const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw new Error('missing ${selector}');const r=el.getBoundingClientRect();return {x:r.left+scrollX-8,y:r.top+scrollY-8,width:r.width+16,height:r.height+16,scale:1};`);
      } else {
        const m = await send('Page.getLayoutMetrics');
        clip = { x: 0, y: 0, width: m.cssContentSize.width, height: m.cssContentSize.height, scale: 1 };
      }
      const { data } = await send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
      writeFileSync(join(outDir, name + '.png'), Buffer.from(data, 'base64'));
      console.log('saved', name);
    },
    async close() { ws.close(); proc.kill(); await delay(500); try { rmSync(profile, { recursive: true, force: true }); } catch {} },
  };
  return api;
}

// Page-side helpers injected into evaluated code.
export const H = `
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
function setVal(el,v){const p=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(el,v);el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));}
const byText=(sel,t)=>$$(sel).find(e=>e.textContent.trim().includes(t));
`;
