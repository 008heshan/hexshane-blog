/* 临时排查：按视口截图（不裁剪）+ 同时输出 figure/img 的视口坐标（用完删） */
'use strict'
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.argv[2] || 'https://hexshane.top/mcnews/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const port = 9600 + Math.floor(Math.random() * 40)
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'shotv-'))
  const child = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--remote-debugging-port=' + port, '--user-data-dir=' + profile,
    '--window-size=1240,900', 'about:blank'], { stdio: 'ignore' })
  let ws, id = 0
  const pending = new Map()
  const send = (m, p, s) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p || {}, sessionId: s })) })
  const evalJs = async (sid, e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }, sid)).result.value
  try {
    let v = null
    for (let i = 0; i < 50 && !v; i++) { try { v = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json() } catch (e) { await sleep(200) } }
    ws = new WebSocket(v.webSocketDebuggerUrl)
    await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }) })
    ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result) } })
    const t = await send('Target.createTarget', { url: 'about:blank' })
    const a = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true })
    const sid = a.sessionId
    await send('Page.enable', {}, sid)
    await send('Emulation.setDeviceMetricsOverride', { width: 1240, height: 900, deviceScaleFactor: 1, mobile: false }, sid)
    await send('Page.navigate', { url: URL }, sid)
    for (let i = 0; i < 30; i++) { if (await evalJs(sid, `document.querySelectorAll('.mn-shot').length`) > 0) break; await sleep(500) }
    await sleep(2000)
    await evalJs(sid, `document.querySelector('.mn-shot').scrollIntoView({block:'start'})`)
    await sleep(1200)
    const geo = await evalJs(sid, `(() => {
      const fig = document.querySelector('.mn-shot');
      const img = fig.querySelector('img');
      const f = fig.getBoundingClientRect(), i = img.getBoundingClientRect();
      const cx = Math.round(i.left + i.width / 2);
      // 从图底往上/往下逐行采样，看那一带到底是 <img> 还是 figure 自己
      const samples = [];
      for (let y = Math.round(i.bottom) - 6; y <= Math.round(f.bottom) + 4; y += 2) {
        const el = document.elementFromPoint(cx, y);
        samples.push(y + ':' + (el ? el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ')[0] : 'null'));
      }
      return { fig: [Math.round(f.left), Math.round(f.top), Math.round(f.width), Math.round(f.height)],
               img: [Math.round(i.left), Math.round(i.top), Math.round(i.width), Math.round(i.height)],
               imgOffsetH: img.offsetHeight, imgClientH: img.clientHeight,
               figOffsetH: fig.offsetHeight, figClientH: fig.clientHeight, figScrollH: fig.scrollHeight,
               figCS_h: getComputedStyle(fig).height, figCS_minH: getComputedStyle(fig).minHeight,
               imgCS_h: getComputedStyle(img).height, imgCS_ar: getComputedStyle(img).aspectRatio,
               gap: Math.round(f.bottom - i.bottom), samples: samples };
    })()`)
    console.log(JSON.stringify(geo, null, 1))
    const s = await send('Page.captureScreenshot', { format: 'png' }, sid)
    fs.writeFileSync('.shots/img-gap.png', Buffer.from(s.data, 'base64'))
    console.log('已存 .shots/img-gap.png（满视口截图，未裁剪）')
  } finally {
    try { ws && ws.close() } catch (e) {}
    try { child.kill() } catch (e) {}
    await sleep(200)
    try { fs.rmSync(profile, { recursive: true, force: true }) } catch (e) {}
  }
}
main().catch((e) => { console.error('ERR ' + e.message); process.exit(1) })
