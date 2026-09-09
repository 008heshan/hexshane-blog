/* ============================================================
   首页 Hero 特效（custom inject）
   ------------------------------------------------------------
   1) .sf-infinity —— 粒子点阵拼出的「无限符号 ∞」，位于大标题之后（背景层）
      · 用双纽线（lemniscate of Bernoulli）参数方程采样成点阵
      · 离屏 canvas 预渲染：一层模糊辉光 + 一层清晰点阵，逐帧只做两次 drawImage
      · 呼吸缩放 + 沿曲线流动的亮点 + 指针视差
   2) .sf-code —— 大标题背后时不时"被编辑"的幽灵代码段
      · 打字机逐字输出，停顿后擦除换下一段，低透明度 + 轻微模糊
   3) prefers-reduced-motion 下：只渲染一帧静态 ∞，不跑动画与打字
   ============================================================ */
(function () {
  'use strict'

  var hero = document.querySelector('#page-header.full_page')
  if (!hero) return
  if (hero.querySelector('.sf-infinity')) return

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* ---------------- 幽灵代码层（两处：大标题背后 + 大标题右下角） ---------------- */
  function makeTypist(el, list, opts) {
    opts = opts || {}
    var speed = opts.speed || 26
    var hold = opts.hold || 2200
    var idx = 0
    var ci = 0
    var typing = true
    var holdUntil = 0
    var timer = null

    function paint() {
      el.textContent = list[idx].slice(0, ci) + (typing && !reduced ? '▌' : '')
    }

    function tick() {
      var now = Date.now()
      if (holdUntil && now < holdUntil) {
        timer = setTimeout(tick, 120)
        return
      }
      holdUntil = 0
      var full = list[idx]
      if (typing) {
        ci++
        paint()
        if (ci >= full.length) {
          typing = false
          holdUntil = now + hold
        }
        timer = setTimeout(tick, speed + Math.random() * 40)
      } else {
        ci -= 3
        if (ci <= 0) {
          ci = 0
          typing = true
          idx = (idx + 1) % list.length
          paint()
          holdUntil = now + 420
        } else {
          paint()
        }
        timer = setTimeout(tick, 14)
      }
    }

    return {
      start: function (delay) {
        paint()
        timer = setTimeout(tick, delay || 0)
      },
      stop: function () { if (timer) clearTimeout(timer); timer = null },
      staticText: function () { el.textContent = list[0] }
    }
  }

  // ① 大标题背后
  var codeEl = document.createElement('div')
  codeEl.className = 'sf-code'
  codeEl.setAttribute('aria-hidden', 'true')
  hero.insertBefore(codeEl, hero.firstChild)

  // ② 大标题右下角
  var codeBR = document.createElement('div')
  codeBR.className = 'sf-code sf-code--br'
  codeBR.setAttribute('aria-hidden', 'true')
  hero.insertBefore(codeBR, hero.firstChild)

  var snippetsMain = [
    'const kernel = await createKernel({\n  plugins: [model, tools, sandbox],\n  hot: true,\n})\nawait kernel.start()',
    'function infinity(t) {\n  const s = Math.sin(t)\n  return [Math.cos(t) / (1 + s * s),\n          s * Math.cos(t) / (1 + s * s)]\n}',
    '$ npx @deepseek-ai/dsh web\n  ➜  ready  http://127.0.0.1:53900',
    "blog.on('publish', (post) => {\n  cdn.invalidate(post.path)\n  sitemap.rebuild()\n})",
    'git add -A && git commit -m "post: 新文章"\ngit push   # → Cloudflare Pages'
  ]

  var snippetsBR = [
    '$ npm run build\n  ➜  generated 81 files in 1.9s\n  ➜  deployed  hexshane.top',
    'interface Post {\n  title: string\n  tags: string[]\n  sticky?: number\n}',
    '[dsh] plugin loaded  ui.terminal\n[dsh] plugin loaded  tools.shell\n[dsh] ready  ●',
    'export const INFINITY = (t: number) => [\n  Math.cos(t) / (1 + Math.sin(t) ** 2),\n  (Math.sin(t) * Math.cos(t)) / (1 + Math.sin(t) ** 2),\n]'
  ]

  var typistMain = makeTypist(codeEl, snippetsMain, { speed: 26, hold: 2200 })
  var typistBR = makeTypist(codeBR, snippetsBR, { speed: 30, hold: 2600 })

  if (!reduced) {
    typistMain.start(900)
    typistBR.start(2400)
  } else {
    typistMain.staticText()
    typistBR.staticText()
  }

  /* ---------------- 粒子无限符号 ---------------- */
  var cv = document.createElement('canvas')
  cv.className = 'sf-infinity'
  cv.setAttribute('aria-hidden', 'true')
  hero.insertBefore(cv, codeEl.nextSibling)
  var ctx = cv.getContext('2d')

  var dpr = Math.min(window.devicePixelRatio || 1, 2)
  var W = 0
  var H = 0
  var dotLayer = null      // 清晰方块层
  var softLayer = null     // 轻微模糊层（软化方块边缘）
  var glowLayer = null     // 大面积辉光层
  var curve = null         // 曲线采样点（用于流动亮点）
  var raf = 0
  var running = false
  var px = 0               // 指针视差
  var py = 0

  function buildLayers() {
    W = Math.max(120, Math.round(cv.clientWidth))
    H = Math.max(80, Math.round(cv.clientHeight))
    cv.width = Math.round(W * dpr)
    cv.height = Math.round(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    var a = Math.min(W * 0.4, H * 1.32)
    var cx = W / 2
    var cy = H / 2

    // 双纽线采样
    var SAMPLES = 1100
    var pts = new Float32Array(SAMPLES * 2)
    for (var i = 0; i < SAMPLES; i++) {
      var t = (i / SAMPLES) * Math.PI * 2
      var s = Math.sin(t)
      var c = Math.cos(t)
      var den = 1 + s * s
      pts[i * 2] = cx + (a * c) / den
      pts[i * 2 + 1] = cy + (a * s * c) / den
    }
    curve = { pts: pts, n: SAMPLES }

    // 点阵：网格采样到曲线的最短距离，用「小方块」拼出形状（对齐 DSH 鲸鱼的 halftone 质感）
    var off = document.createElement('canvas')
    off.width = cv.width
    off.height = cv.height
    var octx = off.getContext('2d')
    octx.setTransform(dpr, 0, 0, dpr, 0, 0)

    function hash(x, y) {
      var n = (x * 374761393 + y * 668265263) | 0
      n = (n ^ (n >> 13)) * 1274126177 | 0
      return ((n ^ (n >> 16)) >>> 0) / 4294967295
    }

    var STEP = 7          // 方块网格间距
    var BAND = 18         // 形状带的半宽（越大越厚）
    var stride = 2
    for (var y = 0; y < H; y += STEP) {
      for (var x = 0; x < W; x += STEP) {
        var best = 1e9
        for (var k = 0; k < SAMPLES; k += stride) {
          var dx = x - pts[k * 2]
          var dy = y - pts[k * 2 + 1]
          var d2 = dx * dx + dy * dy
          if (d2 < best) best = d2
        }
        var d = Math.sqrt(best)
        if (d > BAND) continue
        var falloff = 1 - d / BAND
        // 颗粒感：相邻方块亮度略有差异
        var noise = hash(x, y)
        var alpha = Math.pow(falloff, 1.1) * 0.86 * (0.6 + noise * 0.62)
        if (alpha < 0.03) continue
        var size = 3.4 + falloff * 3.4          // 中间大、边缘小
        var half = size / 2
        octx.fillStyle = 'rgba(226, 240, 255, ' + alpha.toFixed(3) + ')'
        octx.fillRect(x - half, y - half, size, size)
      }
    }
    dotLayer = off

    // 软边层 + 辉光层：DSH 那种"方块本身也是虚的"质感
    function blurCopy(src, px) {
      var c = document.createElement('canvas')
      c.width = cv.width
      c.height = cv.height
      var cx2 = c.getContext('2d')
      cx2.setTransform(dpr, 0, 0, dpr, 0, 0)
      if ('filter' in cx2) {
        cx2.filter = 'blur(' + (px * dpr).toFixed(1) + 'px)'
        cx2.drawImage(src, 0, 0, W, H)
        cx2.filter = 'none'
      } else {
        cx2.drawImage(src, 0, 0, W, H)
      }
      return c
    }

    softLayer = blurCopy(off, 2.2)
    glowLayer = blurCopy(off, 18)
  }

  function frame(now) {
    var t = now * 0.001
    ctx.clearRect(0, 0, W, H)
    if (!dotLayer) return

    var breath = 1 + 0.014 * Math.sin(t * 0.55)
    var alpha = 0.82 + 0.18 * Math.sin(t * 0.42 + 1.2)

    ctx.save()
    ctx.translate(W / 2 + px, H / 2 + py)
    ctx.scale(breath, breath)
    ctx.translate(-W / 2, -H / 2)

    ctx.globalAlpha = alpha * 0.85
    ctx.drawImage(glowLayer, 0, 0, W, H)
    ctx.globalAlpha = alpha * 0.68
    ctx.drawImage(softLayer, 0, 0, W, H)
    ctx.globalAlpha = alpha * 0.78
    ctx.drawImage(dotLayer, 0, 0, W, H)
    ctx.restore()

    // 沿曲线流动的亮点（克制版）
    if (curve && !reduced) {
      var pts = curve.pts
      var N = curve.n
      for (var i = 0; i < 14; i++) {
        var ph = (t * 0.045 + i / 14) % 1
        var idx = Math.floor(ph * N) * 2
        var x = pts[idx]
        var y = pts[idx + 1]
        var r = 1.3 + 0.9 * Math.sin(t * 2.4 + i)
        ctx.fillStyle = 'rgba(232, 248, 255, .75)'
        ctx.beginPath()
        ctx.arc(x, y, r, 0, 6.2832)
        ctx.fill()
        ctx.fillStyle = 'rgba(103, 232, 249, .14)'
        ctx.beginPath()
        ctx.arc(x, y, r * 3.6, 0, 6.2832)
        ctx.fill()
      }
    }

    if (running) raf = requestAnimationFrame(frame)
  }

  function start() {
    if (running || reduced) return
    running = true
    raf = requestAnimationFrame(frame)
  }

  function stop() {
    running = false
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  function rebuild() {
    buildLayers()
    if (reduced) frame(0)
  }

  // 等布局稳定后再测量尺寸
  setTimeout(rebuild, 60)
  setTimeout(function () { rebuild(); start() }, 700)

  var rt = 0
  window.addEventListener('resize', function () {
    clearTimeout(rt)
    rt = setTimeout(rebuild, 220)
  }, { passive: true })

  window.addEventListener('pointermove', function (e) {
    if (reduced) return
    var nx = (e.clientX / window.innerWidth - 0.5) * 26
    var ny = (e.clientY / window.innerHeight - 0.5) * 14
    px += (nx - px) * 0.06
    py += (ny - py) * 0.06
  }, { passive: true })

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stop()
      typistMain.stop()
      typistBR.stop()
    } else {
      start()
      if (!reduced) {
        typistMain.start(600)
        typistBR.start(1400)
      }
    }
  })
})()
