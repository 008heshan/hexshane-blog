/* ============================================================
   锚点容错（anchor-fallback.js）
   ------------------------------------------------------------
   问题：文章正文里的站内锚点常是从 tModLoader 官方 Wiki 直接搬过来的，
   而 GitHub Wiki 的锚点全是小写（`#drawing-and-collision`）；
   本站在 Hexo 下生成的标题 id 保留大小写（`Drawing-and-Collision`）。
   URL 片段是【大小写敏感】的 —— 精确匹配不上时，浏览器既不会跳转，
   也不会报错，表现就是"这个超链接点了没反应"。

   方案：找不到精确 id 时，做一次归一化（小写 + 非字母数字统一成 `-`）
   再匹配文章内的标题 id，命中就滚过去。归一化同时覆盖：
   · 大小写不一致（drawing-and-collision → Drawing-and-Collision）
   · 空格 / 斜杠 / 逗号等被 marked 处理成 `-` 的差异（如 `#other-hooks-methods`）
   · 中文标题（保留汉字参与比较）

   触发点：页面载入带 # 直访、hashchange、以及正文内的站内链接点击。
   滚动交给 scrollIntoView，它会遵守 toc.css 里的 scroll-margin-top（避让固定导航）。
   ============================================================ */
(function () {
  'use strict'

  function norm(s) {
    try {
      s = decodeURIComponent(s)
    } catch (e) {
      /* 非法转义：按原样比较 */
    }
    return s
      .toLowerCase()
      .replace(/[^0-9a-z\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // 精确命中就返回 null（交回浏览器原生行为，别抢）
  function resolve(hash) {
    if (!hash || hash.length < 2) return null
    var raw = hash.charAt(0) === '#' ? hash.slice(1) : hash
    if (!raw) return null
    if (document.getElementById(raw)) return null

    var want = norm(raw)
    if (!want) return null
    var scope = document.getElementById('article-container') || document.getElementById('post') || document
    var nodes = scope.querySelectorAll('[id]')
    for (var i = 0; i < nodes.length; i++) {
      if (norm(nodes[i].id) === want) return nodes[i]
    }
    return null
  }

  function jump(hash) {
    var el = resolve(hash)
    if (!el) return false
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return true
  }

  // ① 带哈希直访 / 浏览器前进后退
  window.addEventListener('hashchange', function () {
    jump(location.hash)
  })

  // ② 正文内点击站内锚点链接：精确 id 不存在时接管
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null
    if (!a) return
    var href = a.getAttribute('href')
    if (!href || href === '#' || href.length < 2) return
    var raw = href.slice(1)
    if (document.getElementById(raw)) return // 正常锚点：不干预
    if (!jump(href)) return
    e.preventDefault()
    // 让地址栏也跟上（保持可复制分享），但不触发原生跳转
    if (history.replaceState) history.replaceState(null, '', href)
    else location.hash = href
  })

  function boot() {
    jump(location.hash)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
  // Pjax 切页后补一次（本主题未启用 Pjax，留着不亏）
  window.addEventListener('load', boot)
})()
