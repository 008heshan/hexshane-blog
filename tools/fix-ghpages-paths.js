/* ============================================================
   GitHub Pages 镜像站的资源路径修正（构建后处理）
   ------------------------------------------------------------
   背景：主站部署在 https://hexshane.top（root: /），
   备用镜像部署在 https://008heshan.github.io/hexshane-blog/（root: /hexshane-blog/）。
   Hexo 的 url_for() 会给主题自带资源补上 root 前缀，但**我们自己在主题
   _config.yml 的 inject 里写死的 HTML 字符串**（/custom/theme/sci-fi.css、
   /custom/nav/*.js、字体、图标…）不经过 url_for —— 于是镜像站上这 40 多个
   资源全部 404，皮肤/玻璃/导航/字体/特效全丢，看起来就是"主题崩了"。

   这个脚本在 ghpages 构建之后跑一遍：把产物里以 /custom/ 开头的绝对路径
   补上 /hexshane-blog 前缀（HTML 的 href/src 与 CSS 的 url() 都处理），
   顺便覆盖 JS 里出现的同类字符串。只在镜像构建里使用，主站不受影响。

   用法：node tools/fix-ghpages-paths.js [root]（放在 tools/ 而不是 scripts/：Hexo 会递归加载
         scripts/ 下所有 .js 当插件执行，维护工具放那里会在每次构建时被误执行）
         root 默认取 _config.ghpages.yml 里的 root（/hexshane-blog/）
   ============================================================ */
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT_DIR = path.join(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT_DIR, 'public')

function readRootArg() {
  if (process.argv[2]) return process.argv[2]
  try {
    const cfg = fs.readFileSync(path.join(ROOT_DIR, '_config.ghpages.yml'), 'utf8')
    const m = /^root:\s*['"]?([^'"\s]+)['"]?/m.exec(cfg)
    if (m) return m[1]
  } catch (e) { /* 用默认值 */ }
  return '/hexshane-blog/'
}

const ROOT = '/' + String(readRootArg()).replace(/^\/+|\/+$/g, '') + '/'   // 形如 /hexshane-blog/
const PREFIX = ROOT.replace(/\/$/, '')                                     // 形如 /hexshane-blog
/* 需要补前缀的绝对路径。除了自研资源目录 /custom/，还有三处是 JS 里的**字面量**，
   它们同样以 / 开头、同样在子路径下 404（Hexo 的 url_for 管不到字符串里的路径）：
     · /search.json   —— 站内检索索引（nav-search.js）
     · /translations/ —— 预翻译 JSON（translate-btn.js）
     · /admin/        —— 后台页面与 posts.json / meta.json（nav-search.js 跳转、admin.js 拉取）
   注意只匹配"以引号/括号/空白开头的整段路径"，避免误伤 /custom/ 之外的普通文本。 */
const NEEDLES = ['/custom/', '/search.json', '/translations/', '/admin/']
const TARGET_EXT = new Set(['.html', '.css', '.js', '.json', '.xml'])

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, out)
    else if (TARGET_EXT.has(path.extname(entry.name).toLowerCase())) out.push(p)
  }
  return out
}

function fixText(text) {
  let hits = 0
  let out = text
  for (const needle of NEEDLES) {
    // 已经是 /hexshane-blog/… 的不要重复加前缀
    const re = new RegExp('(^|[^\\w/])' + needle.replace(/[/.]/g, '\\$&'), 'g')
    out = out.replace(re, (match, before) => {
      hits++
      return before + PREFIX + needle
    })
  }
  return { out, hits }
}

function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error('找不到 public/，请先跑 ghpages 构建')
    process.exit(1)
  }
  const files = walk(PUBLIC_DIR, [])
  let changedFiles = 0
  let totalHits = 0
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8')
    if (!NEEDLES.some((n) => src.includes(n))) continue
    const { out, hits } = fixText(src)
    if (hits > 0 && out !== src) {
      fs.writeFileSync(file, out, 'utf8')
      changedFiles++
      totalHits += hits
    }
  }
  console.log(`[ghpages] 已修正 ${changedFiles} 个文件、${totalHits} 处绝对路径 → 统一加 "${PREFIX}" 前缀`)

  // 自检：产物里不应再出现未加前缀的绝对引用（四条规则全查）
  const leftovers = []
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8')
    for (const needle of NEEDLES) {
      const re = new RegExp('(^|[^\\w/])' + needle.replace(/[/.]/g, '\\$&'), 'g')
      const m = src.match(re)
      if (m) leftovers.push(path.relative(PUBLIC_DIR, file) + ' ×' + m.length + ' (' + needle + ')')
    }
  }
  if (leftovers.length) {
    console.error('[ghpages] 仍有未修正的引用：\n  ' + leftovers.slice(0, 10).join('\n  '))
    process.exit(1)
  }
  console.log('[ghpages] 自检通过：产物中已无未加前缀的绝对引用（' + NEEDLES.join(' / ') + '）')
}

// ⚠️ 必须只在"被 node 直接调用"时执行：
// Hexo 会把 scripts/ 下的所有文件当插件加载，若无脑跑 main()，普通构建
// （hexo generate）也会执行到它 —— 产物还没生成就报错并中断构建。
if (require.main === module) main()
else module.exports = { fixText, PREFIX, NEEDLES }
