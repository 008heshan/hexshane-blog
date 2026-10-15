/* ============================================================
   MC 新闻页数据层（mc-news.js）
   ------------------------------------------------------------
   页面只显示两张卡：**最新正式版** 与 **最新快照**。
   中文正文不在这里抓 —— 它在构建期由 tools/build-mc-news.js 从
   中文 Minecraft Wiki 抽好、存成 JSON 提交进仓库（作者要求"存下来，
   不要每次打开都去调一次"），页面只在点「展开」时才拉那一份。

   数据来源（按优先级）：
     ① 烘焍清单 /mcnews/latest.json        —— 版本号 / 日期 / 摘要 + 中文正文文件名
        点展开 → /mcnews/wiki/<版本>.json  —— 首段 +「新内容 / 更改」两节
     ② Mojang 官方接口（实时，带 CORS）     —— 页面打开时顺手核对一次：
        如果那边出现了烘焍清单还没有的更新版本，就当场把它显示出来，并说明
        "这一版的中文正文还没翻译/烘焍好，先看英文摘要"。这样既不会展示陈旧数据，
        也不需要为了发新版等我重新构建。
     ③ localStorage 上次成功的结果         —— 断网时兜底

   维护：改抽取规则跑 node tools/build-mc-news.js --offline（不联网重烘）。
   ============================================================ */
(function () {
  'use strict'

  var API = 'https://launchercontent.mojang.com/v2/'
  var LIST_URL = API + 'javaPatchNotes.json'
  var BAKED_URL = '/mcnews/latest.json'
  var CACHE_KEY = 'mc-news-cache-v3'
  /* 一次渲染多少条：26.3 的完整改动有 1400 行，一口气塞进 DOM 会明显卡 */
  var CHUNK = 150

  var root = document.getElementById('mc-news')
  if (!root) return

  var elStatus = document.getElementById('mn-status')
  var elCards = document.getElementById('mn-cards')

  var state = {
    baked: null,
    entries: null,      // Mojang 实时清单（可能没有）
    source: '',
    stale: null,        // 烘焍清单还没跟上的最新版本
    wikiCache: {}
  }

  /* ---------- 小工具 ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function zhDate(iso) {
    var d = new Date(iso)
    if (isNaN(d.getTime())) return esc(String(iso || '').slice(0, 10))
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

  /* 版本号 → Wiki 链接。中文条目名形如「Java版26.3」 */
  function wikiLinks(v) {
    return {
      en: 'https://minecraft.wiki/w/Java_Edition_' + encodeURIComponent(v).replace(/%2E/g, '.'),
      zh: 'https://zh.minecraft.wiki/w/' + encodeURIComponent('Java版' + v)
    }
  }

  /* 实时清单里挑"最新正式版"和"最新快照"（pre-release / rc 不算快照那一档） */
  function pickLatest(entries) {
    var releases = entries.filter(function (e) { return e.type === 'release' })
    var snaps = entries.filter(function (e) {
      return e.type === 'snapshot' && !/-(?:pre|rc)(?:-|$)/i.test(e.version)
    })
    return { release: releases[0] || entries[0] || null, snapshot: snaps[0] || null }
  }

  function flat(text) {
    return String(text == null ? '' : text).replace(/\s+/g, ' ').trim()
  }

  function status(html, isErr) {
    elStatus.className = 'mn-status' + (isErr ? ' is-error' : '')
    elStatus.innerHTML = html
  }

  /* ---------- 卡片 ---------- */

  function cardHtml(item, kind) {
    var w = item.links ? { en: item.links.en, zh: item.links.zh } : wikiLinks(item.version)
    var hasWiki = !!(item.wiki && item.wiki.has)
    var lead = hasWiki ? flat(item.wiki.introLead) : ''
    var fallback = flat(item.shortText)
    var text = lead || fallback
    var label = kind === 'release' ? '最新正式版' : '最新快照'
    var fetched = hasWiki && item.wiki.fetchedAt ? item.wiki.fetchedAt : ''
    var rev = hasWiki && item.wiki.revid ? 'rev ' + item.wiki.revid : ''

    return '' +
      '<article class="mn-card" data-version="' + esc(item.version) + '" data-file="' + esc(hasWiki ? item.wiki.file : '') + '">' +
        /* 版本大图：Mojang 补丁说明自带的 540×540 配图，构建期就下到本站，
           所以页面不依赖第三方图床。用 16:9 容器从中心裁切（原图是方的，
           横幅比例更贴近启动器里的观感）。 */
        (item.image && item.image.file
          ? '<figure class="mn-shot">' +
              '<img src="/mcnews/' + esc(item.image.file) + '" alt="' + esc('Minecraft ' + item.version + ' 版本配图') + '" loading="lazy" decoding="async">' +
            '</figure>'
          : '') +
        '<div class="mn-card__kind">' + label + '</div>' +
        '<div class="mn-card__head">' +
          '<span class="mn-card__ver">' + esc(item.version) + '</span>' +
          '<span class="' + typeClass(item.type) + '">' + typeLabel(item.type) + '</span>' +
          '<span class="mn-card__date">' + zhDate(item.date) + '</span>' +
        '</div>' +
        (text
          ? '<p class="mn-card__text">' + esc(text) + '</p>'
          : '<p class="mn-card__text mn-card__text--muted">这一版还没有可显示的中文说明。</p>') +
        (!lead && fallback
          ? '<p class="mn-card__note">（上面这句来自 Mojang 官方说明的英文摘要 —— 中文 Wiki 的条目还没建好 / 还没翻译）</p>'
          : '') +
        (hasWiki && (fetched || rev)
          ? '<p class="mn-card__meta">正文整理自中文 Minecraft Wiki' + (fetched ? ' · 抓取于 ' + esc(fetched) : '') + (rev ? ' · ' + esc(rev) : '') + '</p>'
          : '') +
        '<div class="mn-actions">' +
          (hasWiki
            ? '<button class="mn-btn" data-expand>展开完整更新内容</button>'
            : '<button class="mn-btn" data-expand data-fallback="1">展开（中文条目还没有）</button>') +
          '<a class="mn-btn" href="' + w.zh + '" target="_blank" rel="noopener">中文 Wiki</a>' +
          '<a class="mn-btn" href="' + w.en + '" target="_blank" rel="noopener">MC Wiki（英）</a>' +
        '</div>' +
        '<div class="mn-body" hidden></div>' +
      '</article>'
  }

  function render() {
    var baked = state.baked
    var live = state.entries ? pickLatest(state.entries) : null
    var items = []

    /* 烘焍的卡片（正常路径） */
    if (baked && baked.latest) {
      items.push({ item: baked.latest, kind: 'release' })
      if (baked.snapshot) items.push({ item: baked.snapshot, kind: 'snapshot' })
    }

    /* 实时清单里有更新版本 → 补一张卡，并标注正文还没跟上 */
    if (live) {
      var have = {}
      items.forEach(function (x) { have[x.item.version] = 1 })
      if (live.release && !have[live.release.version]) {
        state.stale = live.release.version
        items.unshift({ item: liveItem(live.release), kind: 'release' })
      }
      if (live.snapshot && !have[live.snapshot.version]) {
        state.stale = state.stale || live.snapshot.version
        items.push({ item: liveItem(live.snapshot), kind: 'snapshot' })
      }
    }

    /* 极端情况：烘焍与实时都没有 */
    if (!items.length) {
      elCards.innerHTML = '<div class="mn-card mn-card--empty">暂时取不到版本数据。' +
        '可能是网络挡住了 Mojang 的接口，稍后再试，或直接看 ' +
        '<a href="https://zh.minecraft.wiki/w/Java%E7%89%88%E7%89%88%E6%9C%AC%E5%8E%86%E5%8F%B2" target="_blank" rel="noopener">中文 Wiki 的版本历史</a>。</div>'
      return
    }

    elCards.innerHTML = items.map(function (x) { return cardHtml(x.item, x.kind) }).join('')
    bindCards()
    describeStatus(items)
  }

  /* 实时接口的条目 → 卡片数据（没有中文正文，走英文摘要；也没有本地大图） */
  function liveItem(e) {
    var links = wikiLinks(e.version)
    return {
      version: e.version, type: e.type, date: e.date, title: e.title,
      shortText: e.shortText, contentPath: e.contentPath,
      image: null,
      wiki: { has: false, file: null, introLead: '' },
      links: { en: links.en, zh: links.zh },
      _live: true
    }
  }

  function describeStatus(items) {
    var rel = null
    var snap = null
    items.forEach(function (x) {
      if (x.kind === 'release') rel = x.item
      if (x.kind === 'snapshot') snap = x.item
    })
    var parts = []
    if (rel) parts.push('最新正式版 <b>' + esc(rel.version) + '</b> · ' + zhDate(rel.date))
    if (snap) parts.push('最新快照 <b>' + esc(snap.version) + '</b> · ' + zhDate(snap.date))
    var src = state.baked
      ? '正文：中文 Minecraft Wiki（构建时烘焍' + (state.baked.baked ? '，' + esc(state.baked.baked) : '') + '）'
      : '正文：Mojang 官方说明（实时）'
    var warn = ''
    if (state.stale) {
      warn = '<br>⚠ 检测到 <b>' + esc(state.stale) + '</b> 是本页烘焍之后才发布的 —— 已经先显示出来了，' +
        '它的中文说明要等下一次自动烘焍（每天检查一次）。'
    }
    status(parts.join(' · ') + '<br>' + src + warn, !!state.stale)
  }

  /* ---------- 展开正文（按需拉那一版的中文正文） ---------- */

  function bindCards() {
    elCards.querySelectorAll('.mn-card').forEach(function (card) {
      var btn = card.querySelector('[data-expand]')
      if (!btn) return
      var box = card.querySelector('.mn-body')
      var ver = card.getAttribute('data-version')
      var file = card.getAttribute('data-file')

      btn.addEventListener('click', function () {
        if (!box.hidden) {
          box.hidden = true
          btn.textContent = btn.dataset.fallback === '1' ? '展开（中文条目还没有）' : '展开完整更新内容'
          return
        }
        if (box.dataset.loaded) {
          box.hidden = false
          btn.textContent = '收起'
          return
        }
        btn.disabled = true
        btn.textContent = '加载中…'
        loadWiki(ver, file)
          .then(function (payload) {
            if (!payload || !payload.sections || !payload.sections.length) {
              box.innerHTML = '<p class="mn-empty">中文 Wiki 的「Java版' + esc(ver) + '」条目现在还没有「新内容 / 更改」小节（可能是刚发布的快照，条目还在写）。想看最新内容可以点上面的中文 Wiki 链接。</p>'
            } else {
              box.innerHTML = '<div class="mn-doc">' + renderDoc(payload) + '</div>' +
                '<p class="mn-credit">正文整理自 <a href="' + esc(payload.page || wikiLinks(ver).zh) + '" target="_blank" rel="noopener">中文 Minecraft Wiki</a>' +
                (payload.revid ? '（rev ' + esc(payload.revid) + '）' : '') +
                '，以 <a href="' + esc(payload.licenseUrl || 'https://zh.minecraft.wiki/w/Minecraft_Wiki:%E8%91%97%E4%BD%9C%E6%9D%83') + '" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a> 提供。</p>'
            }
            box.dataset.loaded = '1'
            box.hidden = false
            btn.textContent = '收起'
          })
          .catch(function (err) {
            box.innerHTML = '<p class="mn-empty">取不到这一版的中文正文（' + esc(err.message) + '）。可以点上面的中文 Wiki 链接看完整条目。</p>'
            box.hidden = false
            btn.textContent = '收起'
          })
          .then(function () { btn.disabled = false })
      })
    })
  }

  function loadWiki(ver, file) {
    if (state.wikiCache[ver]) return Promise.resolve(state.wikiCache[ver])
    if (!file) return Promise.resolve(null)
    return fetch('/mcnews/' + file)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(function (d) { state.wikiCache[ver] = d; return d })
  }

  /* ---------- 正文渲染 ---------- */

  function renderDoc(doc) {
    var html = ''
    if (doc.intro) html += '<p class="mn-doc__intro">' + esc(flat(doc.intro)) + '</p>'
    /* 待渲染的条目先攒成任务，分块插入，避免一口气 1400 行卡住主线程 */
    var queue = []
    var n = 0
    ;(doc.sections || []).forEach(function (sec) {
      var id = 'mn-sec-' + (++n)
      html += '<section class="mn-doc__sec">' +
        '<h3 class="mn-doc__h">' + esc(sec.title) + '</h3>' +
        '<div class="mn-doc__body" id="' + id + '"></div>' +
        '</section>'
      queue.push({ id: id, items: sec.items || [] })
    })
    /* 先给占位，等这段 HTML 插进 DOM 之后再填内容 */
    setTimeout(function () { fillQueue(queue) }, 0)
    return html
  }

  function fillQueue(queue) {
    queue.forEach(function (job) {
      var host = document.getElementById(job.id)
      if (!host) return
      /* 平铺成"分组标题 / 条目"的线性序列，方便分块渲染 */
      var list = []
      job.items.forEach(function (it) {
        if (it.group) {
          list.push({ t: 'group', text: it.text })
          ;(it.children || []).forEach(function (c) { list.push({ t: 'entry', item: c }) })
        } else {
          list.push({ t: 'entry', item: it })
        }
      })

      var shown = 0
      var more = null
      function renderChunk() {
        var end = Math.min(shown + CHUNK, list.length)
        var html = ''
        for (var k = shown; k < end; k++) {
          var node = list[k]
          html += node.t === 'group'
            ? '<h4 class="mn-doc__g">' + esc(node.text) + '</h4>'
            : entryHtml(node.item)
        }
        shown = end
        if (more) { more.remove(); more = null }
        host.insertAdjacentHTML('beforeend', html)
        if (shown < list.length) {
          more = document.createElement('button')
          more.className = 'mn-more'
          more.textContent = '继续显示（还有 ' + (list.length - shown) + ' 条）'
          more.addEventListener('click', renderChunk)
          host.appendChild(more)
        }
      }
      renderChunk()
    })
  }

  function entryHtml(item) {
    var lead = flat(item.text)
    var html = lead
      ? '<div class="mn-doc__item"><p class="mn-doc__lead">' + esc(lead) + '</p>'
      : '<div class="mn-doc__item">'
    if (item.sub && item.sub.length) {
      html += '<ul class="mn-doc__sub">' + item.sub.map(function (s) { return '<li>' + esc(flat(s)) + '</li>' }).join('') + '</ul>'
    }
    if (item.children && item.children.length) {
      html += '<ul class="mn-doc__kids">' + item.children.map(function (c) {
        return '<li>' + (flat(c.text) ? '<span class="mn-doc__kid">' + esc(flat(c.text)) + '</span>' : '') +
          (c.sub && c.sub.length ? '<ul>' + c.sub.map(function (s) { return '<li>' + esc(flat(s)) + '</li>' }).join('') + '</ul>' : '') +
          '</li>'
      }).join('') + '</ul>'
    }
    return html + '</div>'
  }

  /* ---------- 取数 ---------- */

  function saveCache(payload) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(payload)) } catch (e) {}
  }

  function fromCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      var d = JSON.parse(raw)
      return d && d.baked ? d : null
    } catch (e) { return null }
  }

  /* 给 fetch 加超时：Mojang 那个域名在国内时通时不通，实测会出现
     "TLS 握手直接卡住"（ECONNRESET / 一直不返回）。没有超时的话，
     Promise.all 永远不 resolve —— 页面就停在骨架屏上，连烘焍好的数据都出不来。 */
  function fetchJson(url, ms) {
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null
    var timer = setTimeout(function () { if (ctl) ctl.abort() }, ms || 8000)
    return fetch(url, { cache: 'no-cache', signal: ctl ? ctl.signal : undefined })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status)
        return r.json()
      })
      .then(function (d) { clearTimeout(timer); return d }, function (e) { clearTimeout(timer); throw e })
  }

  function boot() {
    /* 先只等烘焍清单：它就在自己站点上，快且稳。
       拿到就立刻渲染，不再等 Mojang 实时核对 —— 那一步只是"看看有没有更新的版本"，
       不该挡着正文显示（实测它卡住时整页会停在"加载中…"）。 */
    fetchJson(BAKED_URL, 6000).then(function (baked) {
      if (baked && baked.latest) {
        state.baked = baked
        saveCache({ baked: baked })
      } else {
        /* 构建期数据没取到（本地没跑烘焙 / 网络问题）→ 用本机缓存兜底。
           注意这里不能 return：后面还要靠实时清单出卡片，
           之前漏了这一步的 render()，页面就永远停在"加载中…"。 */
        var c = fromCache()
        if (c) state.baked = c.baked
        state.bakedFailed = true
      }
      render()
      checkLive()
    })
  }

  /* 实时核对：Mojang 接口出了更新的版本就当场补一张卡。
     失败**不报警**：正文来自构建期烘焍，本来就不依赖它；
     原来那句"没连上 Mojang 实时接口，版本可能不是最新"在国内会时常见到，
     等于拿一句吓人的话去说一件其实没影响的事。 */
  function checkLive() {
    fetchJson(LIST_URL, 8000).then(function (live) {
      if (!live || !live.entries || !live.entries.length) return finishLive(false)
      state.entries = live.entries
      render()
      finishLive(true)
    }, function () { finishLive(false) })
  }

  function finishLive(ok) {
    if (ok) return
    if (state.bakedFailed && !state.baked) {
      status('⚠ 没取到版本数据（本地烘焍清单与本机缓存都没有）。' +
        '可以直接看 <a href="https://zh.minecraft.wiki/w/Java%E7%89%88%E7%89%88%E6%9C%AC%E5%8E%86%E5%8F%B2" target="_blank" rel="noopener">中文 Wiki 的版本历史</a>。', true)
    }
  }

  boot()
})()
