/* ============================================================
   MC 新闻烘焙（tools/build-mc-news.js）
   ------------------------------------------------------------
   背景：/mcnews/ 原来在浏览器里实时取 Mojang 补丁说明，拿到的是**英文摘要**。
   作者要中文正文（来自中文 Minecraft Wiki）并且**存下来** —— 打开页面不该每次
   都去拉 200~400KB 的 Wiki 条目。静态站没有后端，"存"就是构建期烘焙成 JSON 提交。

   两个数据源，分工明确（都很权威）：
     · 版本号 / 类型 / 发布日期 / 英文摘要 / 英文 Wiki 标题
       → Mojang 官方启动器接口 launchercontent.mojang.com
         （这是"出了新版本"最准的信号，实测 200 且带 CORS）
     · 中文正文（首段 +「新内容 / 更改」两节）
       → 中文 Minecraft Wiki 的 MediaWiki 解析接口 zh.minecraft.wiki/api.php
         （实测带 Access-Control-Allow-Origin: *。注意：直接抓 /w/ 网页会被 403，
           bot 拦截只放过 API 这个入口）

   产物（都进仓库）：
     · source/mcnews/latest.json                页面数据（紧凑，不含大段 HTML）
     · source/mcnews/wiki-cache/<版本>.json     抓下来解析好的中文正文（离线可重烘）

   用法：
     node tools/build-mc-news.js             缺哪版抓哪版（有缓存就不动），最后重写 latest.json
     node tools/build-mc-news.js --force     无视缓存全部重抓
     node tools/build-mc-news.js --offline   只用本地缓存重烘（改渲染/解析规则时用，不联网）

   自动化：.github/workflows/mc-news.yml 定时跑，有变化就提交回来触发部署。
   ============================================================ */
'use strict'

const fs = require('fs')
const path = require('path')
const wiki = require('./mc-news-wiki.js')

const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'source', 'mcnews')
const OUT_FILE = path.join(OUT_DIR, 'latest.json')

const MOJANG_LIST = 'https://launchercontent.mojang.com/v2/javaPatchNotes.json'
const ZH_API = 'https://zh.minecraft.wiki/api.php'
const EN_WIKI = (v) => 'https://minecraft.wiki/w/Java_Edition_' + encodeURIComponent(v).replace(/%2E/g, '.')
const ZH_WIKI = (v) => 'https://zh.minecraft.wiki/w/' + encodeURIComponent('Java版' + v)
/* HTTP 头只能是 ByteString —— 别往 User-Agent 里写中文（实测会直接抛
   "Cannot convert argument to a ByteString"，整个脚本第一步就挂） */
const UA = 'hexshane-blog-build/1.0 (+https://hexshane.top/mcnews/)'

const KEEP_SECTIONS = ['新内容', '更改']
const STOP_SECTIONS = ['修复', '漏洞修复', '视频', '影片', '参考', '参考文献', '导航', '注释', '画廊', '历史', '另见', '外部链接']

const argv = process.argv.slice(2)
const FORCE = argv.includes('--force')
const OFFLINE = argv.includes('--offline')
const VERBOSE = argv.includes('--verbose')

const log = (...a) => console.log('[mc-news]', ...a)
const debug = (...a) => { if (VERBOSE) console.log('[mc-news:debug]', ...a) }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchJson(url, tries = 3) {
  let lastErr
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return await res.json()
    } catch (e) {
      lastErr = e
      if (i < tries - 1) await sleep(800 * (i + 1))
    }
  }
  throw lastErr
}

/* ---------- 1. Mojang：拿版本清单 ---------- */

async function fetchMojang() {
  const data = await fetchJson(MOJANG_LIST)
  const entries = (data.entries || []).filter((e) => e && e.version && e.id)
  if (!entries.length) throw new Error('Mojang 接口没返回条目')
  // 已经是时间倒序；取"最新正式版"和"最新快照"。
  // 注意：接口里 pre-release / rc 的 type 也叫 snapshot，页面只要真正的快照，
  // 所以把带 -pre- / -rc- 的排除掉（作者要的就是"最新快照"这一档）。
  const releases = entries.filter((e) => e.type === 'release')
  const snapshots = entries.filter((e) => e.type === 'snapshot' && !/-(?:pre|rc)(?:-|$)/i.test(e.version))
  return { releases, snapshots }
}

/* ---------- 2. 中文 Wiki：抓 + 解析 + 落盘 ---------- */

/* 一版一个文件，既是页面的数据、也是抓取缓存 —— 不另存一份。
   （26.3 的正文 JSON 有 250KB，仓库里存两份重复的没意义。）
   字段名跟页面读取的一致，别随意改。 */
const WIKI_DIR = 'wiki'
const WIKI_OUT_DIR = path.join(OUT_DIR, WIKI_DIR)
const WIKI_FETCH_CACHE = 'wiki-cache'   // 旧版的目录名，仅用于清理

function wikiFile(version) {
  return path.join(WIKI_OUT_DIR, version + '.json')
}

function readCache(version) {
  try {
    const j = JSON.parse(fs.readFileSync(wikiFile(version), 'utf8'))
    if (j && j.version && (j.intro || (j.sections && j.sections.length))) return j
  } catch (e) { /* 没缓存 */ }
  return null
}

/* 页面名：Java版<版本号>。重定向（改过标题的情况）先解析成最终标题再抓正文。 */
async function fetchWikiArticle(version) {
  const wanted = 'Java版' + version
  const q = await fetchJson(ZH_API + '?action=query&format=json&redirects=1&titles=' + encodeURIComponent(wanted))
  const pages = (q.query && q.query.pages) || {}
  const page = Object.values(pages)[0]
  if (!page || page.missing !== undefined) return { missing: true, title: wanted }
  const title = page.title || wanted

  // prop=revid|text 一起拿：只写 prop=text 的话返回里根本没有 parse.revid（实测）
  const p = await fetchJson(
    ZH_API + '?action=parse&format=json&prop=revid%7Ctext&disablelimitreport=1&disableeditsection=1&page=' + encodeURIComponent(title)
  )
  if (!p.parse || !p.parse.text) return { missing: true, title }
  const html = p.parse.text['*'] || ''
  const article = wiki.extractArticle(html, KEEP_SECTIONS, STOP_SECTIONS)
  return {
    title,
    // revid 在 parse 结果里的位置不固定：新版 MediaWiki 放在 parse.revid，
    // 有些版本只在 parse.revisions[0].revid（实测这个 wiki 就是后者）
    revid: p.parse.revid || (p.parse.revisions && p.parse.revisions[0] && p.parse.revisions[0].revid) || null,
    fetchedAt: new Date().toISOString().slice(0, 10),
    license: 'CC BY-NC-SA 4.0 · 中文 Minecraft Wiki',
    licenseUrl: 'https://zh.minecraft.wiki/w/Minecraft_Wiki:著作权',
    page: ZH_WIKI(version),
    intro: article.intro,
    sections: article.sections
  }
}

async function ensureWiki(version) {
  const hit = readCache(version)
  if (hit && !FORCE) { debug('缓存命中 ' + version); return hit }
  if (OFFLINE) {
    if (hit) return hit
    log('⚠ ' + version + '：离线模式且没有缓存，跳过')
    return null
  }
  let article
  try {
    article = await fetchWikiArticle(version)
  } catch (e) {
    log('⚠ ' + version + '：抓中文 Wiki 失败（' + e.message + '）—— 这一版先用 Mojang 的英文摘要')
    return null
  }
  if (article.missing) {
    log('· ' + version + '：中文 Wiki 还没有这一版条目，先用 Mojang 的英文摘要')
    return null
  }
  const rec = { version, ...article }
  fs.mkdirSync(WIKI_OUT_DIR, { recursive: true })
  fs.writeFileSync(wikiFile(version), JSON.stringify(rec, null, 1) + '\n', 'utf8')
  debug('已抓取 ' + version + ' → ' + path.relative(ROOT, wikiFile(version)) + '（' + JSON.stringify(rec).length + ' 字符）')
  return rec
}

/* ---------- 3. 组装 ---------- */

function pickName(record) {
  const name = (record && record.note && record.note.versionName) || ''
  return name.replace(/^Minecraft:?\s*/i, '').trim()
}

/* 页面清单里的每一项：只放"卡片不点开就要显示"的东西。
   完整中文正文按版本放 source/mcnews/wiki/<版本>.json，点「展开」时才拉 ——
   26.3 的正文 JSON 有 250KB，打开页面就白等人。 */
function toItem(e, rec) {
  const intro = (rec && rec.intro) || ''
  return {
    version: e.version,
    type: e.type,
    date: e.date,
    title: e.title || '',
    shortText: e.shortText || '',
    contentPath: e.contentPath || '',
    wiki: {
      has: !!(rec && (rec.intro || (rec.sections && rec.sections.length))),
      file: rec ? WIKI_DIR + '/' + e.version + '.json' : null,
      revid: (rec && rec.revid) || null,
      fetchedAt: (rec && rec.fetchedAt) || null,
      // 卡片上先显示首段（截到约 160 字，按句号收尾），点展开再看全文
      introLead: leadSentence(intro, 160)
    },
    links: { en: EN_WIKI(e.version), zh: ZH_WIKI(e.version) }
  }
}

/* 取首段里的头一两句，别把 160 字切在句子中间 */
function leadSentence(text, max) {
  const s = String(text || '').trim()
  if (!s) return ''
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const m = cut.match(/^[\s\S]*[。！？!?]/)
  return (m ? m[0] : cut) + '…'
}

async function main() {
  const started = Date.now()
  let prev = null
  try { prev = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) } catch (e) { /* 首次 */ }
  const prevByVersion = {}
  if (prev) for (const it of [prev.latest, prev.snapshot]) if (it) prevByVersion[it.version] = it

  // Mojang 清单（离线时用上一次的版本号，只重烘正文）
  let releases, snapshots, mojangOk = true
  if (OFFLINE) {
    mojangOk = false
    if (!prev || !prev.latest) throw new Error('没有 latest.json 可以当版本清单，离线模式跑不了')
    releases = [prev.latest]
    snapshots = prev.snapshot ? [prev.snapshot] : []
    log('离线模式：沿用上次的版本号 ' + [prev.latest.version, prev.snapshot && prev.snapshot.version].filter(Boolean).join(' / '))
  } else {
    try {
      const m = await fetchMojang()
      releases = m.releases
      snapshots = m.snapshots
    } catch (e) {
      if (!prev || !prev.latest) throw e
      log('⚠ Mojang 接口取不到（' + e.message + '），沿用上次的版本号，只重烘正文')
      mojangOk = false
      releases = [prev.latest]
      snapshots = prev.snapshot ? [prev.snapshot] : []
    }
  }

  const latest = releases[0]
  const snapshot = snapshots[0]
  if (!latest) throw new Error('没有正式版条目')

  const targets = [latest, snapshot].filter(Boolean)
  /* 还要顺带把"上一轮是当前版本、这一轮已经不是"的那一版也刷一遍中文正文：
     它每 2~4 周才变一次，刷到的机会只有它被顶上来的那一两轮，错过了就得等下次。
     反正也是按版本单独落文件，多一份不占首页带宽。 */
  const wanted = new Set()
  for (const it of [prev && prev.latest, prev && prev.snapshot]) if (it && it.version) wanted.add(it.version)
  for (const t of targets) wanted.add(t.version)
  const fetchList = [...wanted].map((v) => ({ version: v }))

  let changed = false
  const wikiByVersion = {}
  for (const t of fetchList) {
    const rec = await ensureWiki(t.version)
    wikiByVersion[t.version] = rec
    if (rec) {
      const old = prevByVersion[t.version]
      const wasSame = prev && ((prev.latest && prev.latest.version === t.version) || (prev.snapshot && prev.snapshot.version === t.version))
      if (!wasSame || !old || !old.wiki || old.wiki.revid !== rec.revid) changed = true
    }
  }

  const out = {
    baked: new Date().toISOString().slice(0, 10),
    bakedAt: new Date().toISOString(),
    mojangOk,
    source: MOJANG_LIST,
    wikiSource: ZH_API,
    latest: toItem(latest, wikiByVersion[latest.version]),
    snapshot: snapshot ? toItem(snapshot, wikiByVersion[snapshot.version]) : null
  }

  // 版本号变了也算变化
  if (!prev || !prev.latest || prev.latest.version !== out.latest.version) changed = true
  const prevSnap = prev && prev.snapshot ? prev.snapshot.version : null
  const nextSnap = out.snapshot ? out.snapshot.version : null
  if (prevSnap !== nextSnap) changed = true

  fs.mkdirSync(OUT_DIR, { recursive: true })

  const text = JSON.stringify(out, null, 1) + '\n'
  /* "有没有变化"要看**实质内容**，不能把"运行环境状态"算进去：
       · baked / bakedAt 是时间戳 —— 否则每次跑都"有变化"，CI 会每小时提交一次
         只有时间戳不同的无意义提交
       · mojangOk 反映"这一次跑的时候连没连上 Mojang" —— 本地离线跑是 false、
         CI 联网跑是 true，两边来回翻，同样会刷出无意义提交
         实测踩过：本地跑完 --offline 提交，CI 第一次跑就只提交了 mojangOk true→false。
     另外离线/降级运行时**沿用上一次的值**，不要把它写坏。 */
  if (!mojangOk && prev && typeof prev.mojangOk === 'boolean') out.mojangOk = prev.mojangOk

  const strippable = (o) => {
    if (!o) return o
    const c = JSON.parse(JSON.stringify(o))
    delete c.baked; delete c.bakedAt; delete c.mojangOk
    return c
  }
  const same = prev && JSON.stringify(strippable(prev)) === JSON.stringify(strippable(out))

  const describe = (item) => {
    if (!item) return '无快照'
    const rec = wikiByVersion[item.version]
    const size = rec ? JSON.stringify(rec.sections || []).length : 0
    return '中文正文 ' + size + ' 字符' + (rec && rec.revid ? '（rev ' + rec.revid + '）' : '')
  }
  if (same && !FORCE) {
    log('实质内容没有变化，latest.json 保持原样（' + (Date.now() - started) + 'ms）')
    log('  最新正式版 ' + out.latest.version + ' · ' + describe(out.latest))
    if (out.snapshot) log('  最新快照   ' + out.snapshot.version + ' · ' + describe(out.snapshot))
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'changed=false\n')
    return
  }
  fs.writeFileSync(OUT_FILE, text, 'utf8')
  log('已写入 ' + path.relative(ROOT, OUT_FILE) + '（' + text.length + ' 字符，' + (Date.now() - started) + 'ms）')
  log('  最新正式版 ' + out.latest.version + '（' + out.latest.date.slice(0, 10) + '）· ' + describe(out.latest))
  if (out.snapshot) log('  最新快照   ' + out.snapshot.version + '（' + out.snapshot.date.slice(0, 10) + '）· ' + describe(out.snapshot))
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'changed=' + (changed ? 'true' : 'false') + '\n')
}

main().catch((e) => {
  console.error('[mc-news] 烘焙失败：' + (e && e.message))
  if (VERBOSE && e && e.stack) console.error(e.stack)
  process.exit(1)
})
