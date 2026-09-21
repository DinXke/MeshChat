#!/usr/bin/env node
// Schermafbeeldingen voor docs/screenshots via headless Chrome + DevTools-protocol (echte wachttijd,
// WebGL via SwiftShader, mobiele emulatie). Vereist: node src/serve.js . op :8765. Gebruik: node src/tools/shots.js [naam ...]
const { spawn } = require('child_process'); const fs = require('fs'); const path = require('path'); const os = require('os');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = path.resolve(__dirname, '../../docs/screenshots'); fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:8765/meshchat.html?mock=1&fresh=1&lang=en&theme=dark';
const PORT = 9333;
const SHOTS = [
  { name: 'channel', view: 'channel', w: 1400, h: 860, wait: 4000 },
  { name: 'dm', view: 'dm', w: 1400, h: 860, wait: 4000 },
  { name: 'repeater', view: 'repeater', w: 1400, h: 860, wait: 8000 },
  { name: 'room', view: 'room', w: 1400, h: 860, wait: 9000 },
  { name: 'map', view: 'map', w: 1400, h: 860, wait: 16000, map: true },
  { name: 'contacts', view: 'contacts', w: 1400, h: 860, wait: 4000 },
  { name: 'settings-map', view: 'settings:map', w: 1400, h: 860, wait: 4000 },
  { name: 'settings-region', view: 'settings:region', w: 1400, h: 860, wait: 4000 },
  { name: 'path', view: 'path', w: 1400, h: 860, wait: 4000 },
  { name: 'about', view: 'about', w: 1400, h: 860, wait: 4000 },
  { name: 'mobile-channel', view: 'channel', w: 390, h: 844, wait: 4000, mobile: true },
  { name: 'mobile-map', view: 'map', w: 390, h: 844, wait: 16000, mobile: true, map: true },
];
const only = process.argv.slice(2);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

class CDP { // minimale DevTools-client op de ingebouwde WebSocket van Node
  constructor(url) { this.ws = new WebSocket(url); this.id = 0; this.pending = new Map(); this.events = []; this.ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && this.pending.has(d.id)) { const { res, rej } = this.pending.get(d.id); this.pending.delete(d.id); d.error ? rej(new Error(d.error.message)) : res(d.result); } else if (d.method) this.events.push(d.method); }; }
  open() { return new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; }); }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.pending.set(id, { res, rej })); }
  close() { this.ws.close(); }
}
async function main() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'meshchat-shots-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars', '--window-size=1400,900', 'about:blank'], { stdio: 'ignore' });
  try {
    let version = null; for (let i = 0; i < 40 && !version; i++) { try { version = await (await fetch(`http://localhost:${PORT}/json/version`)).json(); } catch (e) { await sleep(250); } }
    if (!version) throw new Error('Chrome DevTools niet bereikbaar');
    for (const s of SHOTS) {
      if (only.length && !only.includes(s.name)) continue;
      const tab = await (await fetch(`http://localhost:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
      const c = new CDP(tab.webSocketDebuggerUrl); await c.open();
      await c.send('Page.enable'); await c.send('Runtime.enable');
      await c.send('Emulation.setDeviceMetricsOverride', { width: s.w, height: s.h, deviceScaleFactor: 1, mobile: !!s.mobile });
      if (s.mobile) await c.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36' });
      await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
      await c.send('Page.navigate', { url: `${BASE}&shot=${s.name}#view=${s.view}` });
      await sleep(s.wait);
      if (s.map) { // wachten tot de stijl en de tegels er zijn (max 30 s extra)
        for (let i = 0; i < 30; i++) { const r = await c.send('Runtime.evaluate', { expression: 'typeof mapObj !== "undefined" && mapObj && mapObj.isStyleLoaded() && mapObj.areTilesLoaded() && Object.keys(mapObj.style.sourceCaches.protomaps._tiles).length > 0', returnByValue: true }); if (r.result.value) break; await sleep(1000); }
        await c.send('Runtime.evaluate', { expression: 'mapFitAll(); const rpt=[...S.contacts.values()].find(c=>c.name==="RPT-Genk"); rpt && mapAnimatePacket(mapPacketPath(rpt.pub, ["a1"]), "#4ea1ff", 60000); 1', returnByValue: true });
        await sleep(2500);
      }
      const shot = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      fs.writeFileSync(path.join(OUT, s.name + '.png'), Buffer.from(shot.data, 'base64'));
      console.log(`${s.name}: ${Buffer.from(shot.data, 'base64').length} bytes`);
      c.close(); await fetch(`http://localhost:${PORT}/json/close/${tab.id}`).catch(() => {});
    }
  } finally { chrome.kill(); try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {} }
}
main().catch(e => { console.error(e); process.exit(1); });
