/* ============================================================
   无头 Chrome 交互验收（tools/browser-shot.js）
   ------------------------------------------------------------
   `chrome --headless --screenshot` 只能截图，点不了按钮、拿不到控制台报错。
   这个脚本直连 DevTools 协议（Node 22 自带 WebSocket，不需要 puppeteer），
   可以：打开页面 → 收集 console / 页面异常 / 失败请求 → 按选择器点击几轮 →
   每轮截图。用来验收"需要交互才看得到"的东西（例如 /mcnews/ 点「展开」后的正文）。

   用法：
     node tools/browser-shot.js <URL> --out .shots/xxx.png [选项]
     选项：
       --width 1300 --height 900     视口尺寸（设备像素比固定 1）
       --click "选择器"              点一次；可重复，按给出的顺序依次点
       --wait 1200                   每次点击后等待毫秒（默认 900）
       --settle 3000                 页面加载后等待毫秒（默认 2500）
       --full                        截整页（默认只截视口）
       --json                        额外把采集到的日志/异常打成 JSON

   退出码：0 正常；非 0 表示有页面异常或请求失败（方便当验收门禁用）。
   ============================================================ */
'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const argv = process.argv.slice(2)
const url = argv[0]
if (!url || url.startsWith('--')) {
  console.error('用法：node tools/browser-shot.js <URL> --out <图片> [--click 选择器]…')
  process.exit(2)
}

function arg(name, def) {
  const i = argv.indexOf('--' + name)
  if (i === -1) return def
  const v = argv[i + 1]
  return v === undefined || v.startsWith('--') ? true : v
}
function argAll(name) {
  const out = []
  argv.forEach((a, i) => { if (a === '--' + name) out.push(argv[i + 1]) })
  return out.filter((v) => v && !v.startsWith('--'))
}

const OUT = arg('out', '.shots/shot.png')
const WIDTH = Number(arg('width', 1300))
const HEIGHT = Number(arg('height', 900))
const SETTLE = Number(arg('settle', 2500))
const WAIT = Number(arg('wait', 900))
const CLICKS = argAll('click')
const FULL = !!arg('full', false)
const AS_JSON = !!arg('json', false)

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (p && fs.existsSync(p)) return p
  throw new Error('找不到 Chrome / Edge 可执行文件')
}

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url)
  return res.json()
}

async function main() {
  const chrome = findChrome()
  const port = 9500 + Math.floor(Math.random() * 400)
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mn-shot-'))

  const child = spawn(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + profile,
    '--window-size=' + WIDTH + ',' + HEIGHT,
    'about:blank'
  ], { stdio: 'ignore' })

  const logs = []
  const errors = []
  const failed = []
  /* Network.loadingFailed 只给 requestId、不给 URL —— 只记一句"某个脚本失败了"
     根本没法排查（实测踩过 ERR_BLOCKED_BY_ORB，看不出是哪个资源）。
     所以把 requestWillBeSent 里的 URL / 类型存下来，失败时配对回填。 */
  const reqMeta = {}
  let ws
  let id = 0
  const pending = new Map()

  function send(method, params, sessionId) {
    const msgId = ++id
    return new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject })
      ws.send(JSON.stringify({ id: msgId, method, params: params || {}, sessionId }))
    })
  }

  try {
    // 等 DevTools 端口起来
    let version = null
    for (let i = 0; i < 50 && !version; i++) {
      try { version = await getJson('http://127.0.0.1:' + port + '/json/version') } catch (e) { await sleep(200) }
    }
    if (!version) throw new Error('DevTools 端口没起来')

    ws = new WebSocket(version.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true })
      ws.addEventListener('error', reject, { once: true })
    })

    ws.addEventListener('message', (ev) => {
      let m
      try { m = JSON.parse(ev.data) } catch (e) { return }
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id)
        pending.delete(m.id)
        m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result)
        return
      }
      if (m.method === 'Runtime.consoleAPICalled') {
        logs.push({
          type: m.params.type,
          text: (m.params.args || []).map((a) => a.value !== undefined ? a.value : (a.description || a.type)).join(' ')
        })
      }
      if (m.method === 'Runtime.exceptionThrown') {
        const d = m.params.exceptionDetails || {}
        errors.push((d.exception && (d.exception.description || d.exception.value)) || d.text || 'unknown exception')
      }
      if (m.method === 'Network.requestWillBeSent') {
        reqMeta[m.params.requestId] = { url: m.params.request.url, type: m.params.type }
      }
      if (m.method === 'Network.loadingFailed') {
        const meta = reqMeta[m.params.requestId] || {}
        failed.push(m.params.errorText + ' · ' + (meta.type || m.params.type || '?') + ' · ' + (meta.url || m.params.requestId))
      }
    })

    // 新建一个页签并 attach
    const target = await send('Target.createTarget', { url: 'about:blank' })
    const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true })
    const sid = attached.sessionId

    await send('Runtime.enable', {}, sid)
    await send('Network.enable', {}, sid)
    await send('Page.enable', {}, sid)
    await send('Emulation.setDeviceMetricsOverride',
      { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false }, sid)

    await send('Page.navigate', { url }, sid)
    await sleep(SETTLE)

    const shots = []
    async function shoot(tag) {
      let params = { format: 'png' }
      if (FULL) params.captureBeyondViewport = true
      const res = await send('Page.captureScreenshot', params, sid)
      const file = tag ? OUT.replace(/\.png$/i, '-' + tag + '.png') : OUT
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, Buffer.from(res.data, 'base64'))
      shots.push(file)
      return file
    }

    // 没指定 --click 时也先截一张，便于对比
    await shoot(CLICKS.length ? '0' : '')

    for (let i = 0; i < CLICKS.length; i++) {
      const sel = CLICKS[i]
      const js = `(() => {
        const els = document.querySelectorAll(${JSON.stringify(sel)});
        if (!els.length) return 'NOT_FOUND';
        const el = els[0];
        el.scrollIntoView({ block: 'center' });
        el.click();
        return 'CLICKED:' + els.length;
      })()`
      const r = await send('Runtime.evaluate', { expression: js, returnByValue: true, awaitPromise: false }, sid)
      const val = r.result && r.result.value
      if (val === 'NOT_FOUND') errors.push('点击选择器没找到元素：' + sel)
      else logs.push({ type: 'action', text: sel + ' → ' + val })
      await sleep(WAIT)
      await shoot(String(i + 1))
    }

    // 再等一会儿，让异步渲染（分块插入 DOM）落定后再补一张最终态
    await sleep(600)
    await shoot('final')

    if (AS_JSON) {
      const jsonFile = OUT.replace(/\.png$/i, '') + '.log.json'
      fs.writeFileSync(jsonFile, JSON.stringify({ url, logs, errors, failed, shots }, null, 1))
      console.log('日志：' + jsonFile)
    }

    console.log('截图：' + shots.join('\n      '))
    if (failed.length) console.log('请求失败：\n  ' + failed.slice(0, 10).join('\n  '))
    if (errors.length) console.log('页面异常：\n  ' + errors.slice(0, 10).join('\n  '))
    const badLogs = logs.filter((l) => l.type === 'error' || l.type === 'warning')
    if (badLogs.length) console.log('控制台告警：\n  ' + badLogs.slice(0, 10).map((l) => l.type + ': ' + l.text).join('\n  '))

    process.exitCode = (errors.length || failed.length) ? 1 : 0
  } finally {
    try { if (ws) ws.close() } catch (e) {}
    try { child.kill() } catch (e) {}
    await sleep(200)
    try { fs.rmSync(profile, { recursive: true, force: true }) } catch (e) {}
  }
}

main().catch((e) => {
  console.error('出错了：' + (e && e.message))
  process.exit(1)
})
