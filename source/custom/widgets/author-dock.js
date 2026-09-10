/* ============================================================
   作者卡片 · 右侧滑出社媒条（author-dock.js）
   ------------------------------------------------------------
   把一条竖排图标条挂到作者卡片（#aside-content .card-info）右缘：
   鼠标移到卡片上 → 向右滑出；移到图标条上保持展开，移开自动收起。
   触屏/小屏不做滑出（CSS 里改成卡片下方常显的一行）。

   为什么挂在 #aside-content 而不是卡片内部：
   卡片 .card-widget 自带 overflow: hidden，放在里面滑出去会被裁掉；
   #aside-content 及上层祖先都是 overflow: visible，所以安全。
   位置用「相对 #aside-content 的绝对定位」算，滚动时跟着卡片走，
   不需要监听 scroll。
   ============================================================ */
(function () {
  'use strict'

  var LINKS = [
    {
      site: 'douyin',
      name: '抖音',
      icon: 'fab fa-tiktok',
      url: 'https://www.douyin.com/user/MS4wLjABAAAAVagbpZnsrACyaBI9a3H_FS4x3muOxK-DSPu4ddC7kz4?from_tab_name=main'
    },
    {
      site: 'bilibili',
      name: '哔哩哔哩',
      icon: 'fab fa-bilibili',
      url: 'https://space.bilibili.com/448793040'
    },
    {
      site: 'github',
      name: 'GitHub 仓库',
      icon: 'fab fa-github',
      url: 'https://github.com/008heshan/hexshane-blog'
    }
  ]

  function build() {
    var card = document.querySelector('#aside-content .card-info')
    if (!card) return
    var host = card.parentElement
    if (!host || host.querySelector('.author-dock')) return

    var dock = document.createElement('div')
    dock.className = 'author-dock'
    dock.id = 'author-dock'
    dock.setAttribute('role', 'navigation')
    dock.setAttribute('aria-label', '我的社媒链接')

    LINKS.forEach(function (l) {
      var a = document.createElement('a')
      a.className = 'author-dock__item'
      a.href = l.url
      a.target = '_blank'
      a.rel = 'noopener'
      a.title = l.name
      a.setAttribute('aria-label', l.name)
      a.setAttribute('data-site', l.site)
      var i = document.createElement('i')
      i.className = l.icon
      i.setAttribute('aria-hidden', 'true')
      a.appendChild(i)
      dock.appendChild(a)
    })

    host.appendChild(dock)
    card.classList.add('dock-ready')

    // 触屏/小屏走 CSS 常显分支，不需要定位与悬停逻辑
    var mq = window.matchMedia('(max-width: 900px), (hover: none)')

    function place() {
      if (mq.matches) {
        // 小屏走 CSS 常显分支：清掉 JS 设的等高水平布局
        dock.style.height = ''
        return
      }
      var hostRect = host.getBoundingClientRect()
      var cardRect = card.getBoundingClientRect()
      var gap = 8                        // 与卡片之间的间距
      var w = dock.offsetWidth || 48
      // 高度与作者卡片齐平（图标由 CSS space-evenly 均分）
      dock.style.height = Math.round(cardRect.height) + 'px'
      var top = cardRect.top - hostRect.top
      var left = (cardRect.right - hostRect.left) + gap
      // 右侧空间不足时把图标条压回，保证整条都在视口内
      var room = window.innerWidth - cardRect.right
      if (room < w + gap + 6) left = (cardRect.right - hostRect.left) + Math.max(0, room - w - 6)
      dock.style.top = Math.round(top) + 'px'
      dock.style.left = Math.round(left) + 'px'
    }

    var closeTimer = 0
    function open() {
      if (mq.matches) return
      clearTimeout(closeTimer)
      place()
      dock.classList.add('is-open')
      card.classList.add('dock-open')
    }
    function closeSoon() {
      clearTimeout(closeTimer)
      closeTimer = setTimeout(function () {
        dock.classList.remove('is-open')
        card.classList.remove('dock-open')
      }, 220)
    }

    card.addEventListener('mouseenter', open)
    card.addEventListener('mouseleave', closeSoon)
    dock.addEventListener('mouseenter', function () { clearTimeout(closeTimer) })
    dock.addEventListener('mouseleave', closeSoon)
    // 键盘可达：Tab 进卡片里的链接/图标时也展开
    card.addEventListener('focusin', open)
    card.addEventListener('focusout', closeSoon)
    dock.addEventListener('focusin', open)
    dock.addEventListener('focusout', closeSoon)

    window.addEventListener('resize', function () {
      if (dock.classList.contains('is-open')) place()
    }, { passive: true })

    // 字体加载后图标尺寸可能变化，重算一次
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { place() })
    }
    place()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build)
  } else {
    build()
  }
})()
