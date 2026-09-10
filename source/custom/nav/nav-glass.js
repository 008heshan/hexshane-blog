/* ============================================================
   顶部导航滚动玻璃底（custom inject）
   ------------------------------------------------------------
   参照 DeepSeek Harness 的导航动画：
   - 页面顶部时导航完全透明，只有 logo / 菜单浮在内容之上
   - 向下滚动超过阈值后，给 <html> 加 .is-scrolled
   - 玻璃底由 CSS 的 #nav::before 承载，只过渡它的 opacity（0.4s ease-in-out）
     —— 这样能平滑淡入，而直接过渡渐变背景是动画不起来的

   触发方式：页面顶部放一个 80px 高的哨兵元素，用 IntersectionObserver 监听。
   比监听 scroll 事件更省（不占主线程），也不受 rAF 节流影响；
   老浏览器回退到 scroll 监听。
   ============================================================ */
(function () {
  'use strict'

  var root = document.documentElement
  var THRESHOLD = 80

  function setScrolled(on) {
    if (on) root.classList.add('is-scrolled')
    else root.classList.remove('is-scrolled')
  }

  if ('IntersectionObserver' in window) {
    var sentinel = document.createElement('div')
    sentinel.className = 'sf-scroll-sentinel'
    sentinel.setAttribute('aria-hidden', 'true')
    document.body.insertBefore(sentinel, document.body.firstChild)

    new IntersectionObserver(function (entries) {
      setScrolled(!entries[0].isIntersecting)
    }, { threshold: 0 }).observe(sentinel)
    return
  }

  // 回退：scroll 监听
  var ticking = false
  function apply() {
    var y = window.pageYOffset || root.scrollTop || 0
    setScrolled(y > THRESHOLD)
    ticking = false
  }
  function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(apply)
  }
  apply()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})()
