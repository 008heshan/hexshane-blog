/* 临时排查：在线上页面里逐个注入候选修复，看哪个能把空隙归零（用完删） */
'use strict'
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.argv[2] || 'https://hexshane.top/mcnews/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const CANDIDATES = [
  ['基线（什么都不改）', ''],
  ['figure 背比例 + img 绝对定位', '.mn-shot{position:relative !important;height:auto !important;aspect-ratio:16/9}.mn-shot img{position:absolute;inset:0;width:100%;height:100%;margin:0}'],
  ['figure 固定高度（由比例算）+ img 绝对定位', '.mn-shot{position:relative !important;aspect-ratio:16/9}.mn-shot img{position:absolute;inset:0;width:100% !important;height:100% !important}'],
  ['img 绝对定位（figure 不加比例）', '.mn-shot{position:relative !important}.mn-shot img{position:absolute;inset:0;width:100%;height:100%}'],
  ['figure 用 padding-top 撑比例 + img 绝对定位', '.mn-shot{position:relative !important;height:0 !important;padding-top:56.25% !important}.mn-shot img{position:absolute;inset:0;width:100%;height:100%}']
]

async function main() {
  const port = 9640 + Math.floor(Math.random() * 40)
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'fixprobe-'))
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

    // 建一个专门放试验样式的 style 节点
    await evalJs(sid, `(() => { const s = document.createElement('style'); s.id = 'probe'; document.head.appendChild(s); return true })()`)

    const measure = `(() => {
      const fig = document.querySelector('.mn-shot');
      const img = fig.querySelector('img');
      const f = fig.getBoundingClientRect(), i = img.getBoundingClientRect();
      const card = fig.parentElement;
      const kids = Array.from(card.children).map((el) => {
        const r = el.getBoundingClientRect(), c = getComputedStyle(el);
        return { tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 24),
                 h: Math.round(r.height), top: Math.round(r.top), display: c.display, marginTop: c.marginTop, marginBottom: c.marginBottom,
                 padTop: c.paddingTop, padBottom: c.paddingBottom };
      });
      const figKids = Array.from(fig.childNodes).map((n) => n.nodeType === 3
        ? { type: 'text', v: JSON.stringify(n.nodeValue) }
        : (() => { const r = n.getBoundingClientRect(); return { type: n.nodeName.toLowerCase(), h: Math.round(r.height), display: getComputedStyle(n).display }; })());
      return { figH: Math.round(f.height), imgH: Math.round(i.height), gap: Math.round(f.bottom - i.bottom),
               cardH: Math.round(card.getBoundingClientRect().height), cardKids: kids, figKids: figKids };
    })()`

    let first = true
    for (const [name, css] of CANDIDATES) {
      await evalJs(sid, `document.getElementById('probe').textContent = ${JSON.stringify(css)}`)
      await sleep(350)
      const m = await evalJs(sid, measure)
      if (first) {
        console.log('卡片高=' + m.cardH + '，子节点：')
        m.cardKids.forEach((k) => console.log('   <' + k.tag + ' class="' + k.cls + '"> h=' + k.h + ' top=' + k.top +
          ' display=' + k.display + ' margin=' + k.marginTop + '/' + k.marginBottom + ' padding=' + k.padTop + '/' + k.padBottom))
        console.log('figure 内部：' + JSON.stringify(m.figKids))
        first = false
      }
      console.log((m.gap === 0 ? '✅' : '  ') + ' ' + String(m.gap).padStart(4) + 'px  fig=' + m.figH + ' img=' + m.imgH + '   ' + name)
    }
  } finally {
    try { ws && ws.close() } catch (e) {}
    try { child.kill() } catch (e) {}
    await sleep(200)
    try { fs.rmSync(profile, { recursive: true, force: true }) } catch (e) {}
  }
}
main().catch((e) => { console.error('ERR ' + e.message); process.exit(1) })
