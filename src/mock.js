// Mock companion for in-browser testing (paste into console). Simulates a MeshCore companion radio.
(async () => {
  const P = (s) => Uint8Array.from(s.match(/../g).map(h => parseInt(h, 16)));
  const str = (s, n) => { const o = new Uint8Array(n); o.set(te.encode(s).subarray(0, n)); return o; };
  const now = () => Math.floor(Date.now() / 1000);
  const selfPub = 'e27b14c9' + '00'.repeat(28);
  const contacts = [
    { pub: 'a1c49f02' + '11'.repeat(28), type: 2, name: 'RPT-Genk', path: 'a1', lat: 50.965, lon: 5.501 },
    { pub: '7f3311aa' + '22'.repeat(28), type: 2, name: 'RPT-Hasselt-Toren', path: '', lat: 50.93, lon: 5.34 },
    { pub: 'c07e5566' + '33'.repeat(28), type: 3, name: 'Limburg-BBS', path: 'a17f', lat: 0, lon: 0 },
    { pub: '3f9a7788' + '44'.repeat(28), type: 1, name: 'Sofie', path: 'a1', lat: 0, lon: 0 },
    { pub: '88b09900' + '55'.repeat(28), type: 1, name: 'Wim_ON4WS', path: '', lat: 0, lon: 0 },
    { pub: '5d21aabb' + '66'.repeat(28), type: 4, name: 'SNS-Diest', path: 'a17fc2', lat: 50.98, lon: 5.05 },
  ];
  const contactFrame = (code, c) => cat([code], P(c.pub), [c.type, 0, c.path ? c.path.length / 2 : 0xFF], padBytes(P(c.path || '00'), 64), str(c.name, 32), u32le(now() - 600), i32le(Math.round(c.lat * 1e6)), i32le(Math.round(c.lon * 1e6)), u32le(now() - 600));
  const chans = [{ name: 'Public', secret: PUBLIC_KEY_HEX }, { name: '#belgium', secret: await hashtagKey('#belgium') }];
  let queue = [];
  const mock = {
    kind: 'Mock', onFrame: null, onClose: null,
    async connect() { setTimeout(() => this.push(cat([0x88, 30, -90 & 255], P('15'), [0x02], P('a1'), te.encode('x'))), 200); },
    push(f) { setTimeout(() => this.onFrame && this.onFrame(f), 60); },
    async send(p) {
      const c = p[0];
      const reply = (f) => this.push(f instanceof Uint8Array ? f : Uint8Array.from(f));
      switch (c) {
        case 1: reply(cat([5, 1, 22, 22], P(selfPub), i32le(50930700), i32le(5337800), [0, 0, 0, 0], u32le(869618), u32le(250000), [11, 5], te.encode('Bjorn'))); break;
        case 22: reply(cat([13, 8, 50, 8], u32le(123456), str('21 Sep 2026', 12), str('Heltec WiFi LoRa 32 V3', 40), str('v1.12.0-mock', 20), [0, 0])); break;
        case 5: reply(cat([9], u32le(now() - 5))); break;
        case 20: reply(cat([12], [0xD2, 0x0F], u32le(120), u32le(1400))); break;
        case 64: reply([28]); break;
        case 4: reply(cat([2], u32le(contacts.length))); for (const ct of contacts) reply(contactFrame(3, ct)); reply(cat([4], u32le(now()))); break;
        case 31: { const ch = chans[p[1]]; reply(ch ? cat([18, p[1]], str(ch.name, 32), P(ch.secret)) : cat([18, p[1]], new Uint8Array(48))); break; }
        case 32: { chans[p[1]] = { name: cstr(p, 2, 32), secret: hex(p.subarray(34, 50)) }; reply([0]); break; }
        case 10: { const m = queue.shift(); reply(m || [10]); break; }
        case 2: { const ack = P('deadbeef'); reply(cat([6, 0], ack, u32le(2500))); const prefix = hex(p.subarray(7, 13)); const ct = contacts.find(x => x.pub.startsWith(prefix)); const text = td.decode(p.subarray(13));
          setTimeout(() => this.push(cat([0x82], ack, u32le(842))), 700);
          if (ct && ct.type === 2 && p[1] === 1) setTimeout(() => { queue.push(cat([16, 28, 0, 0], P(ct.pub).subarray(0, 6), [1, 1], u32le(now()), te.encode(text === 'ver' ? 'MeshCore v1.12.0 (Build: 21 Sep 2026)' : text === 'neighbors' ? '7f3311aa:45:27\n5d21aabb:300:-10\ncafebabe:900:12' : text === 'region' ? '*\n eu F\n  bx\n   be^ F\n    be-vlg\n    be-vli\n    behss' : text.startsWith('get ') ? ({ radio: '> 869.618,250,11,5', tx: '> 22', af: '> 1.0', repeat: '> on', 'flood.max': '> 64', 'advert.interval': '> 240', 'flood.advert.interval': '> 3', rxdelay: '> 0', txdelay: '> 0.5', 'direct.txdelay': '> 0', lat: '> 50.965', lon: '> 5.502' }[text.slice(4)] || 'Unknown config: ' + text.slice(4)) : text === 'clock' ? '22:15 - 22/9/2026 UTC' : 'OK'))); this.push([0x83]); }, 900);
          if (ct && ct.type === 3 && p[1] === 0) setTimeout(() => { queue.push(cat([16, 30, 0, 0], P(ct.pub).subarray(0, 6), [2, 2], u32le(now()), P(selfPub).subarray(0, 4), te.encode(text))); queue.push(cat([16, 24, 0, 0], P(ct.pub).subarray(0, 6), [2, 2], u32le(now()), P(contacts[3].pub).subarray(0, 4), te.encode('welkom in de room, Bjorn!'))); this.push([0x83]); }, 1200);
          break; }
        case 3: { reply([0]); setTimeout(() => { this.push(cat([0x88, 26, -95 & 255], P('15'), [0x01], P('a1'), te.encode('grp'))); queue.push(cat([17, 26, 0, 0], [p[2], 1, 0], u32le(now()), te.encode('Sofie: ' + 'ontvangen: ' + td.decode(p.subarray(7)) + ' — top Bjorn!'))); this.push([0x83]); }, 1500); break; }
        case 26: { reply(cat([6, 0], P('01020304'), u32le(3000))); const ct = contacts.find(x => x.pub === hex(p.subarray(1, 33))); setTimeout(() => this.push(cat([td.decode(p.subarray(33)) === 'password' ? 0x85 : 0x86, 1], P(ct.pub).subarray(0, 6), u32le(now()), [7, 3])), 900); break; }
        case 50: { // SEND_BINARY_REQ: [50][pub 32][req...]; alleen REQ_TYPE_GET_NEIGHBOURS (6) nagebootst
          const req = p.subarray(33); const tag = P('0b0c0d0e'); reply(cat([6, 0], tag, u32le(3000)));
          if (req[0] === 6) {
            const cnt = req[2], off = req[3] | (req[4] << 8), plen = req[6];
            const known = ['7f3311aa2222', '5d21aabb6666', 'c07e55663333'];
            const fake = Array.from({ length: 25 }, (_, i) => known[i] || (i.toString(16).padStart(2, '0') + 'facade' + i.toString(16).padStart(4, '0')));
            const rows = []; for (let i = off; i < Math.min(fake.length, off + cnt) && rows.length * (plen + 5) + plen + 5 <= 126; i++) rows.push(cat(P(fake[i].padEnd(plen * 2, '0').slice(0, plen * 2)), u32le(30 + i * 97), [(20 - i) & 255]));
            setTimeout(() => this.push(cat([0x8C, 0], tag, [fake.length & 255, fake.length >> 8], [rows.length & 255, rows.length >> 8], ...rows)), 400);
          }
          break; }
        case 27: { reply(cat([6, 0], P('0a0b0c0d'), u32le(3000))); const ct = contacts.find(x => x.pub === hex(p.subarray(1, 33))); setTimeout(() => this.push(cat([0x87, 0], P(ct.pub).subarray(0, 6), [0x14, 0x10], [2, 0], i32le(-104).slice(0, 2), i32le(-98).slice(0, 2), u32le(18420), u32le(4070), u32le(3600 * 3), u32le(86400 * 3 + 3600 * 14), u32le(3000), u32le(1070), u32le(15000), u32le(3420), [1, 0], [26, 0], [5, 0], [9, 0], u32le(5000))), 800); break; }
        case 39: { reply(cat([6, 0], P('0e0f1011'), u32le(3000))); const ct = contacts.find(x => x.pub === hex(p.subarray(4, 36))); setTimeout(() => this.push(cat([0x8B, 0], P((ct || { pub: selfPub }).pub).subarray(0, 6), [1, 0x74, 0x01, 0x9B, 1, 0x67, 0x00, 0xB6, 1, 0x68, 0x8E])), 700); break; }
        case 52: { reply(cat([6, 1], P('12131415'), u32le(5000))); const ct = contacts.find(x => x.pub === hex(p.subarray(2, 34))); setTimeout(() => this.push(cat([0x8D, 0], P(ct.pub).subarray(0, 6), [2], P('a17f'), [2], P('7fa1'))), 1000); break; }
        case 36: { reply(cat([6, 0], p.subarray(1, 5), u32le(4000))); const path = p.subarray(10); setTimeout(() => this.push(cat([0x89, 0, path.length, 0], p.subarray(1, 9), path, Uint8Array.from({ length: path.length + 1 }, (_, i) => 20 + i * 4))), 900); break; }
        case 56: { const t = p[1]; reply(t === 0 ? cat([24, 0], [0xD2, 0x0F], u32le(50000), [0, 0], [1]) : t === 1 ? cat([24, 1], i32le(-105).slice(0, 2), [(-98) & 255, 30], u32le(120), u32le(400)) : cat([24, 2], u32le(1842), u32le(407), u32le(300), u32le(107), u32le(1500), u32le(342), u32le(12))); break; }
        case 43: reply(cat([23], u32le(0), u32le(1000))); break;
        case 59: reply([25, 0x1E, 0]); break;
        case 60: reply(cat([26], u32le(869495), u32le(869495))); break;
        case 17: reply(cat([11, 0x11, 0x00], P(selfPub), u32le(now()), new Uint8Array(64), [0x81 | 0x10], i32le(50930700), i32le(5337800), te.encode('Bjorn'))); break;
        case 30: { const ct = contacts.find(x => x.pub === hex(p.subarray(1, 33))); reply(ct ? contactFrame(3, ct) : [1, 2]); break; }
        default: reply([0]);
      }
    },
    async close() { this.onClose && this.onClose(); },
  };
  queue.push(cat([17, 30, 0, 0], [1, 2, 0], u32le(now() - 120), te.encode('Wim_ON4WS: Goeiemorgen allemaal, iemand RPT-Genk zien vandaag?')));
  queue.push(cat([17, 36, 0, 0], [1, 1, 0], u32le(now() - 60), te.encode('Sofie: @Bjorn ja, komt net door met SNR 9')));
  queue.push(cat([16, 20, 0, 0], P(contacts[3].pub).subarray(0, 6), [0xFF, 0], u32le(now() - 30), te.encode('hey, direct berichtje voor jou')));
  S.connecting = true; setStatus('st-busy', 'Verbinden…');
  await S.client.connect(mock); await afterConnect(); setStatus('st-on', 'Verbonden · Mock'); S.connecting = false;
  window.__mock = mock; return 'mock connected';
})();
