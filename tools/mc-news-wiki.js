/* ============================================================
   中文 Minecraft Wiki 正文抽取（tools/mc-news-wiki.js）
   ------------------------------------------------------------
   目标形状（给 /mcnews/ 卡片渲染用的最小结构）：

   {
     intro: "26.3 是奔赴荒野的正式版……",           // 首段（信息框之后的第一段正文）
     sections: [
       { title: "新内容", items: [
           { text: "脆冰", lead: true,               // <p><b>名字</b></p> 这类"小标题行"
             sub: ["新的方块，自然生成于冰封洞穴的冰裂隙。", "……"],
             children: [ { text: "冻尸", lead: true, sub: [...], children: [] } ] }
       ]},
       { title: "更改", items: [...] }
     ]
   }

   Wiki 的正文长这样（实测 Java版26.4-snapshot-4）：
     <div class="mw-heading mw-heading2"><h2 id="新内容">…</h2></div>
     <div class="mw-heading mw-heading3"><h3 id="方块">…</h3></div>
     <p><b><a …>脆冰</a></b></p>
     <ul>
       <li>新的方块，自然生成于…</li>
       <li>被生物踩踏时会产生裂纹…
         <ul><li>冻尸能够在其上行走而不破坏它。</li></ul>   ← 嵌套列表
       </li>
     </ul>
   所以：h2 = 一级节（保留「新内容 / 更改」），h3 = 分组，p>p 是"小标题"，
   li 是条目，li 里的 ul 是子条目。
   ============================================================ */
'use strict'

function decodeEntities(s) {
  return String(s)
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

/* 去标签留文字：正文里的链接、粗体都只取文字 */
function textOf(html) {
  return decodeEntities(
    String(html)
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<sup[\s\S]*?<\/sup>/gi, '')
      .replace(/<span[^>]*class="[^"]*mw-editsection[^"]*"[\s\S]*$/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim()
}

/* 表格：分两类。
   · class 里带 infobox / navbox / messagebox 等 → 版式噪音，整块扔
   · 其余（正文里的内容表，例如「更改」节里的方块对照表）→ 先用占位符换出来
     存好，等去完噪音再换回去，避免被"无差别删表格"顺手清掉。 */
const TABLE_NOISE = /infobox|navbox|messagebox|ambox|mbox|metadata|navbox|toccolours|plainlinks/i

function stashTables(html, store) {
  return html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (whole) => {
    const cls = (/\bclass="([^"]*)"/i.exec(whole) || [])[1] || ''
    if (TABLE_NOISE.test(cls)) return ''
    // 太小的表（一两行）多半是版式残留，不值得留
    const text = textOf(whole)
    if (text.length < 40) return ''
    store.push(whole)
    return '\u0000TABLE' + (store.length - 1) + '\u0000'
  })
}

function restoreTables(html, store) {
  return html.replace(/\u0000TABLE(\d+)\u0000/g, (m, i) => store[Number(i)] || '')
}

/* 与"更新内容"无关的块：信息框、维护提示横幅、目录、导航盒、参考列表 */
function dropNoise(html) {
  let out = String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ol[^>]*class="[^"]*references[^"]*"[\s\S]*?<\/ol>/gi, '')
    .replace(/<span[^>]*class="[^"]*mw-editsection[^"]*"[\s\S]*?<\/span>\s*<\/span>/gi, '')
  out = dropBlocksByClass(out, '\\b(?:toc|navbox|msgbox|metadata|catlinks|printfooter|reflist)\\b')
  out = dropBlocksByClass(out, '\\bmw-collapsible\\b')
  return out
}

/* 找所有 h2/h3 的位置（含 mw-heading 包裹与裸标签两种写法） */
function findHeadings(html) {
  const marks = []
  const re = /<div[^>]*class="mw-heading mw-heading([23])"[^>]*>\s*<h\2[^>]*>([\s\S]*?)<\/h\2>\s*<\/div>/g
  let m
  while ((m = re.exec(html))) {
    marks.push({ level: Number(m[1]), start: m.index, end: m.index + m[0].length, title: textOf(m[2]).replace(/编辑$/, '').trim() })
  }
  if (marks.length) return marks
  const re2 = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/g
  while ((m = re2.exec(html))) marks.push({ level: Number(m[1]), start: m.index, end: m.index + m[0].length, title: textOf(m[2]).trim() })
  return marks
}

/* 找到与 open 标签配对的 close 位置（同标签名计数） */
function matchClose(html, from, tag) {
  const re = new RegExp('<' + tag + '\\b[^>]*>|</' + tag + '\\s*>', 'gi')
  re.lastIndex = from
  let depth = 0
  let m
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') { depth--; if (depth === 0) return m.index + m[0].length }
    else depth++
  }
  return html.length
}

/* 按 class 精确摘掉整块元素。
   踩过的坑：`/<div class="toc"[\s\S]*?<\/div>\s*<\/div>/` 这种"数两个 </div>"
   的写法看起来能用，实际贪婪跨过了正文边界 —— 实测把 32KB 正文连着标题一起删光，
   解析结果 sections 为空。所以这里一律用配平计数，不猜。 */
function dropBlocksByClass(html, classRe) {
  let out = html
  for (;;) {
    const re = new RegExp('<div\\b[^>]*class="[^"]*' + classRe + '[^"]*"[^>]*>', 'i')
    const m = re.exec(out)
    if (!m) return out
    const end = matchClose(out, m.index, 'div')
    out = out.slice(0, m.index) + out.slice(end)
  }
}

/* 解析 <ul>/<ol> 里的条目（含嵌套） */
function parseList(html, start, end) {
  const items = []
  const seg = html.slice(start, end)
  const liRe = /<li\b[^>]*>/gi
  let m
  while ((m = liRe.exec(seg))) {
    const liStart = m.index + m[0].length
    const liEnd = matchClose(seg, m.index, 'li')
    const inner = seg.slice(liStart, liEnd)
    // 拆出嵌套列表：第一个 <ul>/<ol> 之前是"本条目正文"，之后是子条目
    const nestMatch = /<(ul|ol)\b[^>]*>/i.exec(inner)
    let own = inner
    let children = []
    if (nestMatch) {
      own = inner.slice(0, nestMatch.index)
      const nestEnd = matchClose(inner, nestMatch.index, nestMatch[1])
      children = parseList(inner, nestMatch.index, nestEnd)
    }
    const text = textOf(own)
    if (text || children.length) items.push({ text, lead: false, sub: [], children })
    liRe.lastIndex = liEnd
  }
  return items
}

/* 解析一个节的内容：<p> 里的粗体当"小标题"，其后紧跟的列表是它的条目 */
function parseSection(html) {
  const items = []
  const pRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi
  const chunks = []
  let cursor = 0
  let m
  while ((m = pRe.exec(html))) {
    if (m.index > cursor) chunks.push({ type: 'raw', html: html.slice(cursor, m.index) })
    chunks.push({ type: 'p', html: m[1] })
    cursor = pRe.lastIndex
  }
  if (cursor < html.length) chunks.push({ type: 'raw', html: html.slice(cursor) })

  let pendingLead = null
  for (const c of chunks) {
    if (c.type === 'p') {
      const t = textOf(c.html)
      if (!t) continue
      // 整段就是一个粗体词 → 小标题行
      const isLead = /^\s*<b\b[\s\S]*<\/b>\s*$/i.test(c.html.trim()) || /^\s*<b\b/i.test(c.html.trim())
      if (isLead) pendingLead = { text: t, lead: true, sub: [], children: [] }
      else if (pendingLead) pendingLead.sub.push(t)
      else items.push({ text: t, lead: false, sub: [], children: [] })
    } else {
      // 裸的列表（或紧跟小标题的列表）
      const re = /<(ul|ol)\b[^>]*>/gi
      let lm
      let last = 0
      while ((lm = re.exec(c.html))) {
        const lEnd = matchClose(c.html, lm.index, lm[1])
        const listItems = parseList(c.html, lm.index, lEnd)
        if (pendingLead) {
          pendingLead.children.push(...listItems)
          items.push(pendingLead)
          pendingLead = null
        } else {
          items.push(...listItems)
        }
        re.lastIndex = lEnd
        last = lEnd
      }
    }
  }
  if (pendingLead) items.push(pendingLead)
  return items
}

/* 主入口：从解析接口返回的 HTML 里抽出 { intro, sections } */
function extractArticle(html, keepSections, stopSections) {
  const tables = []
  const clean = dropNoise(stashTables(String(html), tables))
  const marks = findHeadings(clean)
  const firstHeading = marks.length ? marks[0].start : clean.length
  const introHtml = clean.slice(0, firstHeading)
  // 首段：跳过信息框残留与"此条目仍需完善"之类的提示，取第一个像正文的段落
  let intro = ''
  for (const pm of introHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const t = textOf(pm[1])
    if (t.length < 12) continue
    if (/^(此条目|该条目|本条目|你可以|说明[：:])/.test(t)) continue
    if (/仍需完善|需要整理|格式指导|扩充|翻译质量/.test(t)) continue
    intro = t
    break
  }

  const sections = []
  for (let i = 0; i < marks.length; i++) {
    const h = marks[i]
    if (h.level !== 2) continue
    if (stopSections.includes(h.title)) break
    if (!keepSections.includes(h.title)) continue
    // 本节正文 = 本节标题之后，到**下一个 h2** 之前。
    // 踩过的坑：一开始写成"下一个任意级别的标题之前"，于是 h2 的正文只到它自己的
    // h3 子标题为止（只剩 `</div>` 的 43 个字符），h3 全被切在区间外 —— sections 恒为空。
    let end = clean.length
    for (let k = i + 1; k < marks.length; k++) {
      if (marks[k].level === 2) { end = marks[k].start; break }
    }
    const body = clean.slice(h.end, end)
    const subHeads = findHeadings(body)
    const items = []
    if (subHeads.length) {
      for (let j = 0; j < subHeads.length; j++) {
        const sh = subHeads[j]
        const sEnd = j + 1 < subHeads.length ? subHeads[j + 1].start : body.length
        const groupItems = parseSection(restoreTables(body.slice(sh.end, sEnd), tables))
        if (!groupItems.length) continue
        items.push({ text: sh.title, lead: true, group: true, sub: [], children: groupItems })
      }
    } else {
      items.push(...parseSection(restoreTables(body, tables)))
    }
    if (items.length) sections.push({ title: h.title, items })
  }
  return { intro, sections }
}

module.exports = {
  decodeEntities, textOf, dropNoise, dropBlocksByClass, stashTables, restoreTables,
  findHeadings, matchClose, parseList, parseSection, extractArticle
}
