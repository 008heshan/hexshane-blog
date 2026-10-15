/* ============================================================
   MC 新闻页数据层（mc-news.js）
   ------------------------------------------------------------
   静态站没有后端，所以实时数据在**浏览器里**取：
     ① 主源：Mojang 官方启动器的补丁说明接口
        https://launchercontent.mojang.com/v2/javaPatchNotes.json   （CORS: *，实测可达）
        单版详情：<同域>/v2/<contentPath>
     ② 兜底：/mcnews/latest.json —— 构建时用 tools/fetch-mc-news.js 烘焙的快照
     ③ 再兜底：localStorage 里上次成功的结果
   三级都拿不到才显示错误提示，并说明原因。

   为什么不用 MC Wiki 的 API：wiki 对非浏览器请求返回 403（bot 拦截），
   而且它在国内的可用性不稳定。所以更新内容用 Mojang 官方说明（同样权威、且带 CORS），
   Wiki 作为「对照阅读」的外部链接 —— 点进去看中文维基也行。
   ============================================================ */
(function () {
  'use strict'

  var API = 'https://launchercontent.mojang.com/v2/'
  var LIST_URL = API + 'javaPatchNotes.json'
  var LOCAL_FALLBACK = '/mcnews/latest.json'
  var CACHE_KEY = 'mc-news-cache-v1'
  var SHOW_RECENT = 8

  var root = document.getElementById('mc-news')
  if (!root) return

  var elStatus = document.getElementById('mn-status')
  var elLatest = document.getElementById('mn-latest')
  var elList = document.getElementById('mn-list')

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // Mojang 的 body 是成品 HTML：只做防御性清洗（去脚本/事件属性），不做重排
  function sanitize(html) {
    return String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript:/gi, '')
  }

  function zhDate(iso) {
    var d = new Date(iso)
    if (isNaN(d.getTime())) return esc(iso || '')
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  }

  function typeLabel(t) {
    if (t === 'release') return '正式版'
    if (t === 'snapshot') return '快照'
    return esc(t || '')
  }

  function typeClass(t) {
    if (t === 'release') return 'mn-tag mn-tag--release'
    if (t === 'snapshot') return 'mn-tag mn-tag--snapshot'
    return 'mn-tag'
  }

  // 版本号 → wiki 链接。英文 wiki 的版本页形如 Java_Edition_26.3；
  // 中文 wiki 用搜索链接（避免不同版本的条目命名差异导致 404）
  function wikiLinks(v) {
    var en = 'https://minecraft.wiki/w/Java_Edition_' + encodeURIComponent(v).replace(/%2E/g, '.')
    var zh = 'https://zh.minecraft.wiki/w/Special:Search?search=' + encodeURIComponent('Java版' + v)
    return { en: en, zh: zh }
  }

  function status(html, isErr) {
    elStatus.className = 'mn-status' + (isErr ? ' is-error' : '')
    elStatus.innerHTML = html
  }

  function renderLatest(entry) {
    var w = wikiLinks(entry.version)
    elLatest.innerHTML =
      '<div class="mn-card">' +
        '<div class="mn-card__head">' +
          '<span class="mn-card__ver">' + esc(entry.version) + '</span>' +
          '<span class="' + typeClass(entry.type) + '">' + typeLabel(entry.type) + '</span>' +
          '<span class="mn-card__date">' + zhDate(entry.date) + '</span>' +
        '</div>' +
        '<p class="mn-card__text">' + esc(entry.shortText || '') + '…</p>' +
        '<div class="mn-actions">' +
          '<button class="mn-btn" data-detail="' + esc(entry.contentPath) + '" data-title="' + esc(entry.title) + '">展开完整更新内容</button>' +
          '<a class="mn-btn" href="' + w.en + '" target="_blank" rel="noopener">MC Wiki（英）</a>' +
          '<a class="mn-btn" href="' + w.zh + '" target="_blank" rel="noopener">中文 Wiki 查这版</a>' +
        '</div>' +
        '<div class="mn-body" hidden></div>' +
      '</div>'
  }

  function renderList(entries) {
    if (!entries.length) { elList.innerHTML = '<div class="mn-skeleton">没有更多记录。</div>'; return }
    elList.innerHTML = entries.map(function (e) {
      var w = wikiLinks(e.version)
      return '<div class="mn-item">' +
        '<div class="mn-item__head">' +
          '<span class="mn-item__title">' + esc(e.title) + '</span>' +
          '<span class="' + typeClass(e.type) + '">' + typeLabel(e.type) + '</span>' +
          '<span class="mn-item__date">' + zhDate(e.date) + '</span>' +
        '</div>' +
        '<p class="mn-item__text">' + esc((e.shortText || '').slice(0, 150)) + '…</p>' +
        '<div class="mn-actions">' +
          '<button class="mn-btn" data-detail="' + esc(e.contentPath) + '" data-title="' + esc(e.title) + '">展开更新内容</button>' +
          '<a class="mn-btn" href="' + w.en + '" target="_blank" rel="noopener">MC Wiki</a>' +
        '</div>' +
        '<div class="mn-body" hidden></div>' +
      '</div>'
    }).join('')
  }

  // 展开：按需拉单版详情，同一版只拉一次
  function bindDetails(scope) {
    scope.querySelectorAll('[data-detail]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var box = btn.closest('.mn-card, .mn-item').querySelector('.mn-body')
        if (!box) return
        if (!box.hidden) { box.hidden = true; btn.textContent = '展开更新内容'; return }
        if (box.dataset.loaded) { box.hidden = false; btn.textContent = '收起'; return }
        btn.disabled = true
        btn.textContent = '加载中…'
        fetch(API + btn.dataset.detail)
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
          .then(function (d) {
            box.innerHTML = sanitize(d.body || '<p>这一版没有正文。</p>')
            box.dataset.loaded = '1'
            box.hidden = false
            btn.textContent = '收起'
          })
          .catch(function (err) {
            box.innerHTML = '<p>取不到这一版的正文（' + esc(err.message) + '）。可点上面的 MC Wiki 链接看完整条目。</p>'
            box.hidden = false
            btn.textContent = '收起'
          })
          .then(function () { btn.disabled = false })
      })
    })
  }

  function paint(entries, source) {
    var releases = entries.filter(function (e) { return e.type === 'release' })
    var latest = releases[0] || entries[0]
    if (!latest) throw new Error('接口没有返回任何版本')
    renderLatest(latest)
    var rest = entries.filter(function (e) { return e.id !== latest.id }).slice(0, SHOW_RECENT)
    renderList(rest)
    bindDetails(root)
    status('最新正式版 <b>' + esc(latest.version) + '</b> · ' + zhDate(latest.date) +
      ' · 数据源：' + esc(source) + '（打开页面实时获取）')
  }

  function fromCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      var d = JSON.parse(raw)
      return (d && d.entries && d.entries.length) ? d : null
    } catch (e) { return null }
  }

  function saveCache(entries) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), entries: entries })) } catch (e) {}
  }

  fetch(LIST_URL)
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
    .then(function (d) {
      if (!d || !d.entries || !d.entries.length) throw new Error('返回内容为空')
      // 接口里可能混着需要翻译的旧条目，但顺序本身是按时间倒序的
      saveCache(d.entries)
      paint(d.entries, 'Mojang 官方补丁说明')
    })
    .catch(function (liveErr) {
      // ② 构建时烘焙的快照
      fetch(LOCAL_FALLBACK)
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
        .then(function (d) {
          if (!d || !d.entries || !d.entries.length) throw new Error('快照为空')
          paint(d.entries, '构建时快照（' + (d.baked || '') + '）')
          status('⚠ 没能实时连上 Mojang 接口（' + esc(liveErr.message) + '），下面是<b>构建时烘焙的快照</b>，可能不是最新版本。', true)
        })
        .catch(function () {
          // ③ 上次成功的结果
          var c = fromCache()
          if (c) {
            paint(c.entries, '本机缓存')
            status('⚠ 实时接口与快照都取不到，显示的是<b>你上次访问时缓存</b>的结果。', true)
          } else {
            elLatest.innerHTML = '<div class="mn-card">暂时取不到版本数据。可能是网络或代理挡住了 Mojang 的接口，稍后再试，或直接看 <a href="https://minecraft.wiki/w/Java_Edition_version_history" target="_blank" rel="noopener">Minecraft Wiki 版本历史</a>。</div>'
            elList.innerHTML = ''
            status('✗ 数据获取失败：' + esc(liveErr.message), true)
          }
        })
    })
})()
