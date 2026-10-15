/* ============================================================
   元素留白检测（tools/element-gap.js）
   ------------------------------------------------------------
   查"某个容器里是否多出一块空白"。做法：对容器里的每个"外框"元素，
   比较**外框高度**和**它直接子元素的高度之和**，差额就是多出来的空白；
   再用 elementFromPoint 逐行采样，确认那一段命中的是外框自己（而不是子元素）。

   为什么单独做这个：配图下面那条 20px 空带，肉眼看截图时一会儿有一会儿没有
   （裁剪/缩放容易骗人），只有逐行采样 + 断言"命中元素是谁"才说得清。
   实测那次 figure 435px、里面的 img 只有 413px，414~434 命中 figure 本体。

   用法：
     node tools/element-gap.js <URL> --sel ".mn-shot" [--shot out.png]
     node tools/element-gap.js <URL> --sel ".mn-card" --min 2
   退出码：0 = 没查出异常留白；1 = 有（便于当验收门禁）。
   ============================================================ */
'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const argv = process.argv.slice(2)
const url = argv[0]
if (!url || url.startsWith('--')) {
  console.error('用法：node tools/element-gap.js <URL> --sel ".选择器" [--shot out.png] [--min 2]')
  process.exit(2)
}
function arg(name, def) {
  const i = argv.indexOf('--' + name)
  if (i === -1) return def
  const v = argv[i + 1]
  return v === undefined || v.startsWith('--') ? true : v
}
const SEL = String(arg('sel', '.mn-shot'))
const SHOT = arg('shot', null)
const MIN = Number(arg('min', 2))          // 小于这个差额不算异常（1px 的边框/取整忽略）
const WIDTH = Number(arg('width', 1240))
const HEIGHT = Number(arg('height', 900))

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const chrome = CHROME_CANDIDATES.find((p) => p && fs.existsSync(p))
  if (!chrome) throw new Error('找不到 Chrome / Edge')
  const port = 9660 + Math.floor(Math.random() * 50)
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gap-'))
  const child = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', '--force-device-scale-factor=1', '--remote-debugging-port=' + port,
    '--user-data-dir=' + profile, '--window-size=' + WIDTH + ',' + HEIGHT, 'about:blank'], { stdio: 'ignore' })
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
    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false }, sid)
    await send('Page.navigate', { url }, sid)

    for (let i = 0; i < 40; i++) { if (await evalJs(sid, `document.querySelectorAll(${JSON.stringify(SEL)}).length`) > 0) break; await sleep(400) }
    await sleep(1200)

    const report = await evalJs(sid, `(() => {
      const out = [];
      document.querySelectorAll(${JSON.stringify(SEL)}).forEach((box, idx) => {
        const br = box.getBoundingClientRect();
        if (!br.height) return;
        const c = getComputedStyle(box);
        const padY = (parseFloat(c.paddingTop) || 0) + (parseFloat(c.paddingBottom) || 0);
        const borY = (parseFloat(c.borderTopWidth) || 0) + (parseFloat(c.borderBottomWidth) || 0);
        // 直接子元素里，只有参与正常流的才贡献高度 —— absolute / fixed 不参与，
        // 否则像"图片绝对定位撑满"这种正确写法会被算成"负数多余"。
        const kids = Array.from(box.children).filter((el) => {
          const p = getComputedStyle(el).position;
          return p !== 'absolute' && p !== 'fixed';
        }).map((el) => {
          const r = el.getBoundingClientRect();
          const ec = getComputedStyle(el);
          // 垂直外边距也会占位（相邻兄弟间取较大者，这里简化成各自计入，
          // 只影响"多出"的精度，不影响判断有没有一条明显空带）
          const mt = parseFloat(ec.marginTop) || 0;
          const mb = parseFloat(ec.marginBottom) || 0;
          return { tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 30),
                   h: Math.round(r.height), m: Math.round(mt + mb) };
        });
        const kidsSum = kids.reduce((s, k) => s + k.h + k.m, 0);
        const contentH = Math.round(br.height - padY - borY);
        // 逐行采样：从最后一个子元素底部往下，看命中谁
        const flow = Array.from(box.children).filter((el) => {
          const p = getComputedStyle(el).position;
          return p !== 'absolute' && p !== 'fixed';
        });
        const last = flow[flow.length - 1] || null;
        const lr = last ? last.getBoundingClientRect() : null;
        const cx = Math.round(br.left + br.width / 2);
        const samples = [];
        if (lr) {
          for (let y = Math.round(lr.bottom); y <= Math.round(br.bottom) + 2; y += 2) {
            const el = document.elementFromPoint(cx, y);
            samples.push(y + ':' + (el ? el.tagName.toLowerCase() : 'null'));
          }
        }
        out.push({
          idx, cls: String(box.className).slice(0, 40),
          box: { w: Math.round(br.width), h: Math.round(br.height) },
          padY: Math.round(padY), borY: Math.round(borY), contentH, kids, kidsSum,
          extra: contentH - kidsSum,
          boxCS: { display: c.display, aspectRatio: c.aspectRatio, height: c.height, minHeight: c.minHeight, overflow: c.overflow },
          samples
        });
      });
      return out;
    })()`)

    let bad = 0
    report.forEach((r) => {
      // "多出" = 内容盒比子元素合计高出来的部分。>0 且采样命中外框自身 → 异常留白。
      const hitsBox = r.samples.some((s) => s.endsWith(':figure') || s.endsWith(':div') || s.endsWith(':section'))
      const isBad = r.extra >= MIN && hitsBox
      if (isBad) bad++
      console.log((isBad ? '⚠' : '· ') + ' [' + r.idx + '] .' + r.cls +
        '  外框 ' + r.box.w + 'x' + r.box.h + '（内容盒 ' + r.contentH + '，padding ' + r.padY + '，border ' + r.borY + '）' +
        '  子元素合计 ' + r.kidsSum + '  多出 ' + r.extra + 'px')
      r.kids.forEach((k) => console.log('        <' + k.tag + ' class="' + k.cls + '"> ' + k.h + 'px  外边距 ' + k.m + 'px'))
      // 采样只报"值发生变化"的那几行，够看出空隙归属就行
      if (r.samples.length) {
        const brief = r.samples.filter((s, i, a) => i === 0 || s.split(':')[1] !== a[i - 1].split(':')[1])
        console.log('        底部采样（去重）：' + brief.slice(0, 6).join(' '))
      }
    })

    if (SHOT) {
      await evalJs(sid, `document.querySelector(${JSON.stringify(SEL)}).scrollIntoView({block:'start'})`)
      await sleep(800)
      const s = await send('Page.captureScreenshot', { format: 'png' }, sid)
      fs.mkdirSync(path.dirname(SHOT), { recursive: true })
      fs.writeFileSync(SHOT, Buffer.from(s.data, 'base64'))
      console.log('截图：' + SHOT)
    }

    console.log(bad ? '发现 ' + bad + ' 处异常留白' : '没发现异常留白')
    process.exitCode = bad ? 1 : 0
  } finally {
    try { ws && ws.close() } catch (e) {}
    try { child.kill() } catch (e) {}
    await sleep(200)
    try { fs.rmSync(profile, { recursive: true, force: true }) } catch (e) {}
  }
}
main().catch((e) => { console.error('出错了：' + (e && e.message)); process.exit(1) })
