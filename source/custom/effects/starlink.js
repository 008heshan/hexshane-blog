/* ============================================================
   星链背景层（Starlink constellation, custom inject）
   ------------------------------------------------------------
   - 在 .glass-bg 背景层里追加一张固定 canvas，绘制「卫星节点 + 链路」网络
   - 节点缓慢漂移，距离阈值内的节点自动连线，线宽/透明度随距离衰减
   - 鼠标附近的节点会被点亮并连到指针，形成"正在建立链路"的感觉
   - 性能：节点数按视口面积自适应（40~110），DPR 上限 2，
     标签页隐藏时暂停，prefers-reduced-motion 下只画一帧静态图
   ============================================================ */
(function () {
  'use strict'

  var host = document.querySelector('.glass-bg') || document.body
  if (!host || host.querySelector('.sf-starlink')) return

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  var cv = document.createElement('canvas')
  cv.className = 'sf-starlink'
  cv.setAttribute('aria-hidden', 'true')
  host.appendChild(cv)
  var ctx = cv.getContext('2d')

  var dpr = Math.min(window.devicePixelRatio || 1, 2)
  var W = 0
  var H = 0
  var nodes = []
  var LINK = 132          // 连线距离阈值
  var POINTER_LINK = 170  // 指针连线半径
  var pointer = { x: -9999, y: -9999, active: false }
  var raf = 0
  var running = false

  function resize() {
    W = cv.clientWidth || window.innerWidth
    H = cv.clientHeight || window.innerHeight
    cv.width = Math.max(1, Math.round(W * dpr))
    cv.height = Math.max(1, Math.round(H * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    var target = Math.round(Math.min(110, Math.max(38, (W * H) / 17000)))
    nodes = []
    for (var i = 0; i < target; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        r: Math.random() * 1.1 + 0.45,
        tw: Math.random() * Math.PI * 2,     // 闪烁相位
        ts: 0.6 + Math.random() * 0.9        // 闪烁速度
      })
    }
    LINK = Math.max(110, Math.min(170, W * 0.11))
  }

  function frame(now) {
    var t = now * 0.001
    ctx.clearRect(0, 0, W, H)

    var i, j, n, m, dx, dy, d2, d

    // 1) 连线
    ctx.lineWidth = 0.7
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i]
      for (j = i + 1; j < nodes.length; j++) {
        m = nodes[j]
        dx = n.x - m.x
        dy = n.y - m.y
        d2 = dx * dx + dy * dy
        if (d2 > LINK * LINK) continue
        d = Math.sqrt(d2)
        var a = (1 - d / LINK) * 0.44
        ctx.strokeStyle = 'rgba(150, 185, 205, ' + a.toFixed(3) + ')'
        ctx.beginPath()
        ctx.moveTo(n.x, n.y)
        ctx.lineTo(m.x, m.y)
        ctx.stroke()
      }
    }

    // 2) 指针链路
    if (pointer.active) {
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i]
        dx = n.x - pointer.x
        dy = n.y - pointer.y
        d2 = dx * dx + dy * dy
        if (d2 > POINTER_LINK * POINTER_LINK) continue
        d = Math.sqrt(d2)
        var pa = (1 - d / POINTER_LINK) * 0.5
        ctx.strokeStyle = 'rgba(203, 226, 239, ' + pa.toFixed(3) + ')'
        ctx.beginPath()
        ctx.moveTo(n.x, n.y)
        ctx.lineTo(pointer.x, pointer.y)
        ctx.stroke()
      }
    }

    // 3) 节点
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i]
      var twinkle = 0.55 + 0.45 * Math.sin(t * n.ts + n.tw)
      ctx.fillStyle = 'rgba(210, 226, 236, ' + (0.34 + twinkle * 0.5).toFixed(3) + ')'
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.r, 0, 6.2832)
      ctx.fill()

      // 缓慢漂移
      n.x += n.vx
      n.y += n.vy
      if (n.x < -20) n.x = W + 20
      if (n.x > W + 20) n.x = -20
      if (n.y < -20) n.y = H + 20
      if (n.y > H + 20) n.y = -20
    }

    if (running) raf = requestAnimationFrame(frame)
  }

  function start() {
    if (running) return
    running = true
    raf = requestAnimationFrame(frame)
  }

  function stop() {
    running = false
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  resize()

  if (reduced) {
    frame(0)            // 只画一帧静态网络
  } else {
    start()
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop()
      else start()
    })
  }

  window.addEventListener('resize', function () {
    resize()
    if (reduced) frame(0)
  }, { passive: true })

  window.addEventListener('pointermove', function (e) {
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.active = true
  }, { passive: true })

  window.addEventListener('pointerleave', function () {
    pointer.active = false
  }, { passive: true })
})()
