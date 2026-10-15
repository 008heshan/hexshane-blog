/* 临时排查：figure 里到底有什么、谁的盒子多出 20px（用完删） */
'use strict'
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.argv[2] || 'https://hexshane.top/mcnews/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const port = 9955 + Math.floor(Math.random() * 40)
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'figdom-'))
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
    for (let i = 0; i < 30; i++) { if (await evalJs(sid, `document.querySelectorAll('.mn-shot').length`) > 0) break; await sleep(500) }
    await sleep(1200)

    const dump = await evalJs(sid, `(() => {
      const fig = document.querySelector('.mn-shot');
      const kids = Array.from(fig.childNodes).map((n) => {
        if (n.nodeType === 3) return { type: 'text', text: JSON.stringify(n.nodeValue), len: n.nodeValue.length };
        const r = n.getBoundingClientRect();
        return { type: n.nodeName.toLowerCase(), cls: String(n.className||''), rect: [Math.round(r.width), Math.round(r.height)],
                 display: getComputedStyle(n).display };
      });
      const fr = fig.getBoundingClientRect();
      const img = fig.querySelector('img');
      const ir = img.getBoundingClientRect();
      // 用 offsetHeight/scrollHeight 交叉验证
      return {
        figure: { rect: [Math.round(fr.width), Math.round(fr.height)], offsetH: fig.offsetHeight, clientH: fig.clientHeight, scrollH: fig.scrollHeight,
                  cs_h: getComputedStyle(fig).height, cs_box: getComputedStyle(fig).boxSizing, cs_display: getComputedStyle(fig).display },
        img: { rect: [Math.round(ir.width), Math.round(ir.height)], offsetH: img.offsetHeight, cs_h: getComputedStyle(img).height },
        kids,
        html: fig.outerHTML.slice(0, 400)
      };
    })()`)
    console.log(JSON.stringify(dump, null, 1))
    // 放大截这张图（含边框下方一点）
    const fr2 = await evalJs(sid, `(() => { const r = document.querySelector('.mn-shot').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()`)
    const s = await send('Page.captureScreenshot', { format: 'png', clip: { x: Math.max(0, fr2[0] - 24), y: Math.max(0, fr2[1] - 16), width: fr2[2] + 48, height: Math.min(fr2[3] + 60, 900), scale: 2 } }, sid)
    fs.writeFileSync('.shots/img-geo.png', Buffer.from(s.data, 'base64'))
    console.log('已存 .shots/img-geo.png')
  } finally {
    try { ws && ws.close() } catch (e) {}
    try { child.kill() } catch (e) {}
    await sleep(200)
    try { fs.rmSync(profile, { recursive: true, force: true }) } catch (e) {}
  }
}
main().catch((e) => { console.error('ERR ' + e.message); process.exit(1) })
