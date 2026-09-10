/* ============================================================
   图片放大增强（配合主题 lightbox: medium_zoom）
   ------------------------------------------------------------
   问题：Terraria 的贴图很小（例如 48x70 的弹幕、70x48 的精灵），
   medium-zoom 只把图放到"原始尺寸"，放大后还是那么小，等于没放大。
   做法：
   · 小图（自然宽度 ≤ 160px）→ 按整数倍放大到 ~480px 宽，并用
     image-rendering: pixelated 做最近邻缩放，像素点看得清、不发糊；
   · 大图（截图/示意图）保持 medium-zoom 原本的"适应视口"行为，
     不动它的尺寸，仅统一加上 pixelated 之外的处理（不干预）。
   触发：点击正文里的图片后（medium-zoom 会创建 .medium-zoom-image--opened），
   在下几帧内检查并施加放大；关闭时清掉内联样式。
   ============================================================ */
(function () {
  'use strict'

  var MAX_SMALL = 160          // 自然宽度不超过它就当"像素画小图"
  var TARGET_W = 480           // 小图放大后的目标宽度
  var PATCH_CLASS = 'zoom-pixelated'

  function openedImage() {
    return document.querySelector('.medium-zoom-image--opened') ||
      document.querySelector('.medium-zoom-overlay ~ img')
  }

  function patch() {
    var img = openedImage()
    if (!img || img.dataset.zoomTuned === '1') return
    img.dataset.zoomTuned = '1'
    var nw = img.naturalWidth || 0
    if (!nw || nw > MAX_SMALL) return          // 大图交给 medium-zoom 原样处理
    var k = Math.max(2, Math.min(8, Math.round(TARGET_W / nw)))
    img.classList.add(PATCH_CLASS)
    img.style.imageRendering = 'pixelated'
    img.style.width = (nw * k) + 'px'
    img.style.height = 'auto'
    img.style.maxWidth = '90vw'
    img.style.maxHeight = '85vh'
  }

  function unpatch() {
    var img = document.querySelector('img.' + PATCH_CLASS)
    if (!img) return
    img.classList.remove(PATCH_CLASS)
    img.style.imageRendering = ''
    img.style.width = ''
    img.style.height = ''
    img.style.maxWidth = ''
    img.style.maxHeight = ''
    img.dataset.zoomTuned = ''
  }

  // 点击正文图片后，medium-zoom 需要一两帧才把图挂到 overlay 上
  document.addEventListener('click', function (e) {
    var t = e.target
    if (!t || t.tagName !== 'IMG') return
    if (!t.closest || !t.closest('#article-container, .post-content')) return
    var tries = 0
    var timer = setInterval(function () {
      patch()
      if (++tries > 12) clearInterval(timer)
    }, 16)
    setTimeout(unpatch, 0)
  }, true)

  // 关闭放大（点 overlay / 按 Esc）时把内联样式清干净
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') unpatch()
  })
  document.addEventListener('click', function (e) {
    if (e.target && e.target.classList && e.target.classList.contains('medium-zoom-overlay')) unpatch()
  }, true)
})()
