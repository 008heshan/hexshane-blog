/* 临时排查：卡片配图的几何（渲染框 / 原图尺寸 / 容器留白）用完删 */
'use strict'
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.argv[2] || 'https://hexshane.top/mcnews/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const port = 9920 + Math.floor(Math.random() * 60)
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'imggeo-'))
  const child = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--remote-debugging-port=' + port, '--user-data-dir=' + profile,
    '--window-size=1400,1000', 'about:blank'], { stdio: 'ignore' })
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
    await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false }, sid)
    await send('Page.navigate', { url: URL }, sid)
    await sleep(6000)
    // 等卡片真的渲染出来（页面是 JS 建卡的，固定 sleep 不够稳）
    for (let i = 0; i < 30; i++) {
      const n = await evalJs(sid, `document.querySelectorAll('.mn-shot').length`)
      if (n > 0) break
      await sleep(500)
    }
    await evalJs(sid, `document.querySelector('.mn-shot').scrollIntoView({block:'center'})`)
    await sleep(800)
    // 同一时刻量：等图解码完 + 两帧静态
    await evalJs(sid, `Promise.all(Array.from(document.images).map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r })))`)
    await sleep(400)

    const info = await evalJs(sid, `(() => {
      const out = [];
      document.querySelectorAll('.mn-shot').forEach((fig) => {
        const img = fig.querySelector('img');
        const fr = fig.getBoundingClientRect();
        const ir = img.getBoundingClientRect();
        const cf = getComputedStyle(fig);
        const ci = getComputedStyle(img);
        out.push({
          figRect: [Math.round(fr.left), Math.round(fr.top), Math.round(fr.width), Math.round(fr.height)],
          imgRect: [Math.round(ir.left), Math.round(ir.top), Math.round(ir.width), Math.round(ir.height)],
          natural: [img.naturalWidth, img.naturalHeight],
          complete: img.complete,
          figMargin: cf.margin, figBorder: cf.borderTopWidth, figRadius: cf.borderRadius, figOverflow: cf.overflow,
          imgAspectRatioCss: ci.aspectRatio, imgObjectFit: ci.objectFit, imgHeightCss: ci.height, imgWidthCss: ci.width,
          figPadBottom: cf.paddingBottom, figLineHeight: cf.lineHeight, figFontSize: cf.fontSize,
          gapBelow: Math.round(fr.bottom - ir.bottom), gapAbove: Math.round(ir.top - fr.top)
        });
      });
      return out;
    })()`)
    console.log(JSON.stringify(info, null, 1))
    // 单独把第一张卡片的图区裁出来看
    const fig = info[0] && info[0].figRect
    if (fig) {
      const clip = { x: fig[0] - 30, y: fig[1] - 10, width: fig[2] + 60, height: fig[3] + 40, scale: 1 }
      await send('Runtime.evaluate', { expression: `document.querySelector('.mn-shot').scrollIntoView({block:'center'})` }, sid)
      await sleep(600)
      const fr2 = await evalJs(sid, `(() => { const r = document.querySelector('.mn-shot').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()`)
      const s = await send('Page.captureScreenshot', { format: 'png', clip: { x: Math.max(0, fr2[0] - 30), y: Math.max(0, fr2[1] - 12), width: fr2[2] + 60, height: fr2[3] + 44, scale: 2 } }, sid)
      fs.writeFileSync('.shots/img-geo.png', Buffer.from(s.data, 'base64'))
      console.log('已存 .shots/img-geo.png（图区放大裁剪）')
    }
  } finally {
    try { ws && ws.close() } catch (e) {}
    try { child.kill() } catch (e) {}
    await sleep(200)
    try { fs.rmSync(profile, { recursive: true, force: true }) } catch (e) {}
  }
}
main().catch((e) => { console.error('ERR ' + e.message); process.exit(1) })
