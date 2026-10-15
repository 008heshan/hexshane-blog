/* 构建时烘焙 MC 版本快照，作为 /mcnews/ 页面的兜底数据。
   手动跑：node tools/fetch-mc-news.js
   产物：source/mcnews/latest.json（提交进仓库；页面实时取不到时用它） */
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'source', 'mcnews', 'latest.json')
const LIST_URL = 'https://launchercontent.mojang.com/v2/javaPatchNotes.json'
const KEEP = 30

async function main() {
  const res = await fetch(LIST_URL, { headers: { 'User-Agent': 'hexshane-blog-build' } })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const data = await res.json()
  const entries = (data.entries || []).slice(0, KEEP).map((e) => ({
    id: e.id, title: e.title, version: e.version, type: e.type,
    date: e.date, shortText: e.shortText, contentPath: e.contentPath
  }))
  if (!entries.length) throw new Error('接口没返回条目')
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify({
    baked: new Date().toISOString().slice(0, 10),
    source: LIST_URL,
    entries
  }, null, 2) + '\n', 'utf8')
  const latest = entries.find((e) => e.type === 'release') || entries[0]
  console.log('[mc-news] 快照已烘焙：' + entries.length + ' 条 → ' + path.relative(ROOT, OUT))
  console.log('[mc-news] 其中最新正式版：' + latest.version + '（' + latest.date + '）')
}

main().catch((e) => { console.error('[mc-news] 烘焙失败：' + e.message); process.exit(1) })
