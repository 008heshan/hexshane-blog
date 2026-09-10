# 纪元

个人博客源码。由 [Hexo](https://hexo.io/) + [Butterfly](https://butterfly.js.org/) 构建，
主站部署在 **Cloudflare Pages**，自定义域名 <https://hexshane.top>。

| 部署目标 | 地址 | 说明 |
| --- | --- | --- |
| Cloudflare Pages | <https://hexshane.top> / <https://hexshane-blog.pages.dev> | 主站，Git 集成自动构建 |
| GitHub Pages | <https://008heshan.github.io/hexshane-blog/> | 备用/历史部署 |

## 技术栈

| 组件 | 版本 |
| --- | --- |
| Hexo | 7.3.0 |
| hexo-theme-butterfly | 5.7.0（源码在 `themes/hexo-theme-butterfly`，非 npm 安装） |
| hexo-shiki-plugin-butterfly | 1.0.26（Shiki 代码高亮，明暗双主题） |
| Node.js | 22（`.node-version` 固定） |

## 站点信息

| 字段 | 值 |
| --- | --- |
| 站点标题 | 纪元 |
| 副标题 | 分享技巧与经验 |
| 作者 | HexShane |
| 头像 | `/img/hexshane.jpg` |
| GitHub | <https://github.com/008heshan> |
| keywords | Terraria / tModLoader / 模组开发 / Hexo / 前端 |

## 目录结构

```
.
├─ .github/workflows/pages.yml   # GitHub Pages 自动部署（npm ci → build:ghpages → deploy）
├─ scripts/                      # 构建期自定义生成器 / 过滤器
│  ├─ articles-generator.js      # /articles/ 列表页（复用首页卡片样式，支持分页）
│  ├─ index-pin-order.js         # 首页置顶：sticky 数字越小越靠前
│  ├─ admin-generator.js         # /admin/ 管理后台 + posts.json / meta.json
│  ├─ search-json.js             # /search.json 检索索引
│  ├─ fix-shiki-fences.js        # 修复 shiki 插件代码围栏贪婪匹配
│  └─ translate-posts.js         # 构建期翻译（需配置 deepl_api_key，默认不启用）
├─ source/
│  ├─ _posts/                    # 文章（Markdown）
│  ├─ img/posts/<文章名>/        # 文章插图（已本地化，不再外链 imgur）
│  ├─ _data/announcement.yml     # 侧边栏公告
│  ├─ about/index.md             # 关于页（含版权声明）
│  └─ custom/                    # 自定义样式/脚本/字体/光标等静态资源
├─ themes/hexo-theme-butterfly/  # 主题（含改过的 _config.yml）
├─ _config.yml                   # 站点配置：url = https://hexshane.top，root = /
├─ _config.ghpages.yml           # GitHub Pages 子路径覆盖配置（仅 CI 用）
├─ .node-version                 # Node 版本
└─ package.json / package-lock.json
```

## 本地开发

```bash
npm ci                 # 按 lockfile 安装依赖
npm run server         # 本地预览 http://localhost:4000
npm run build          # 生成 public/（面向 https://hexshane.top，root = /）
npm run build:ghpages  # 生成 public/（面向 GitHub Pages 子路径）
npm run clean          # 清理 public/ 与 db.json
```

> 本地删掉 `public/` 后请用 `npm run clean && npm run build`，
> 否则 Hexo 会依据残留的 `db.json` 判定文件未变更而跳过生成。

## 部署

### Cloudflare Pages（主站）

项目已通过 Git 集成连接本仓库，配置：

| 设置项 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 框架预设 | Hexo |
| 构建命令 | `npm run build` |
| 构建输出目录 | `public` |
| 环境变量 | `NODE_VERSION` = `22`（仓库内 `.node-version` 同值） |

推送到 `main` 即自动构建部署；自定义域 `hexshane.top` 在 Pages 项目 → 自定义域中管理，
域名 DNS 托管在 Cloudflare（NS 已从 Spaceship 迁移）。

### GitHub Pages（备用）

`.github/workflows/pages.yml` 在推送时执行 `npm ci` → `npm run build:ghpages` → 发布。

由于主题配置中大量资源使用根路径（`/custom/...`、`/img/...`），
在 `https://008heshan.github.io/hexshane-blog/` 这样的子路径下，这部分自定义特效资源会 404。
主站以 Cloudflare Pages 的根域名部署为准。

## 写文章

```bash
npx hexo new "文章标题"    # 生成 source/_posts/文章标题.md
npm run server            # 本地预览
git add -A && git commit -m "post: 文章标题" && git push
```

置顶：在文章 front-matter 里写 `sticky: 1`（数字越小越靠前，`0` 或不写表示不置顶）。

## 管理后台

访问 `/admin/`，写操作通过浏览器里的 GitHub Token 调 Contents API 完成，
默认仓库已指向 `008heshan/hexshane-blog`（可在页面里改）。
请勿把长期有效的高权限 Token 保存在公共设备上。

## 视觉主题：深空科幻皮肤

皮肤文件 `source/custom/theme/sci-fi.css`（在 `inject.head` 中**最后**引入），
动态背景由两个 canvas 脚本提供，视觉参考 <https://www.deepseek.com/harness/> 的克制风格。

| 层 | 实现 | 文件 |
| --- | --- | --- |
| 底色 | 冷黑渐变（`#0a141d → #03070b`）+ 克制的钢青辉光 + 64px 淡网格 | `sci-fi.css` |
| 星链网络 | 卫星节点缓慢漂移、距离阈值内自动连线、指针附近点亮链路 | `source/custom/effects/starlink.js` |
| 粒子无限符号 ∞ | 双纽线方形点阵 halftone（清晰 + 软化 + 辉光三层 + 颗粒噪声），呼吸缩放 + 沿曲线流动亮点 + 指针视差 | `source/custom/effects/hero-fx.js` |
| 幽灵代码 | 两处独立打字循环：大标题背后（泰拉瑞亚 / tModLoader C# 代码片段）、大标题右下角（更短的 Boss / 掉落 / 加载日志） | `source/custom/effects/hero-fx.js` |

**配色（冷峻）**：近黑冷底 `#03060a`；强调色钢青 `#9dc0d4`，亮态 `#cbe2ef`，辅助石墨蓝 `#5b7285`；
正文冷白 `#d9e4ec`，次要文字冷灰 `#7c8a95`。全部去掉了高饱和霓虹与紫色，辉光强度也压到最低。

- 大标题字体：**iFonts 航天遨游体**，从 22.5MB TTF 子集化为 87KB woff2
  （`source/custom/assets/fonts/HangtianAoyou-subset.woff2`，含 32 个常用汉字 + ASCII）
- 左上角品牌位：**莫比乌斯式无限图标**（`source/custom/assets/mobius.svg`，
  双纽线 + 交叉处扭转 + 厚度偏移）替换站名文字；文字仍在 DOM 中，读屏与 SEO 不受影响
- 顶部导航滚动动画（对齐 DSH）：
  - **透明态**：页面顶部时导航完全透明（logo / 菜单浮在内容上）
  - **玻璃底**：向下滚动 80px 后以 `0.4s ease-in-out` 淡入
  - **收窄**：同时左右边距收窄到居中 980px 宽（DSH 是 `maxWidth: 1280 → 980`），
    用 `cubic-bezier(.34,1.36,.44,1)` 模拟它的 spring 回弹
  - 实现要点：玻璃底挂在 `#nav::before` 上只过渡 `opacity`（直接过渡渐变背景无法动画）；
    宽度靠过渡 `left`/`right`（`max(16px, calc(50vw - 490px))`）实现居中收窄；
    触发用 80px 哨兵元素 + `IntersectionObserver`（不占主线程，也不受 rAF 节流影响），
    老浏览器回退到 scroll 监听。见 `source/custom/effects/nav-glass.js`
- 特异性提醒：`nav-apple.css` 用 `html[data-theme='dark'] #nav`（1,1,1）带 `!important`
  铺了渐变底，而 `#nav` 是 `<body>` 的直接子元素，所以本皮肤用 `html[data-theme] body #nav`
  （1,1,2）覆盖它
- **浅色模式已关闭**：主题 `darkmode.button: false`，导航栏不再有明暗切换按钮
- 头像已固定为圆形且禁用任何旋转（`transform/animation: none`）
- **面板材质 = 真·磨砂玻璃（v16）**：只铺一层**中性白膜**（`rgba(255,255,255,.035)`，无任何
  色相），磨砂感 100% 由 `backdrop-filter: blur(18px)` 实时模糊元素**背后真实内容**承担；
  描边/光晕也改成中性白（不再发蓝）。改法：`sci-fi.css` 令牌区
  `--sf-glass / --sf-glass-2 / --sf-glass-blur / --sf-line`（想更透就调小 alpha），
  `theme-glass.css` 的 dark 卡片 / `#page` / 移动端分支同步中性化。
  同一材质也用在代码块（`code-highlight.css`）、引用块、行内代码、标签胶囊、分页按钮上
  - 例外：`#page` / `#post` / `#archive` 这类**长文容器不开** `backdrop-filter`——
    背后就是页面底色，模糊看不出来，但每帧重采样极贵（`theme-glass.css` 里有实测记录），
    它们只铺中性薄膜
  - 提示：`prefers-reduced-motion` 与快速滚动降级仍然生效；`theme-reveal.css`
    在主题切换瞬间会临时关掉卡片 backdrop-filter
- 代码块只留**一层**卡片皮（`sci-fi.css` 第 7 节）：原来 figure / `.codeblock` / 两个内层 `pre`
  会各画一次边框，且行内 `code` 的胶囊底漏到块级 `code` 上（块级 `code` 是 inline 盒子，
  于是一行代码一个框）。现在内层一律透明无边框，行内样式用 `:not(pre) > code` 限定
- 分享条里 X（推特）图标品牌色是纯黑，深色底上看不见，已改紫色 `#8b5cf6`
- **站内锚点大小写容错**：文章里的站内锚点大多是从 tModLoader 官方 Wiki 搬来的，
  GitHub Wiki 的锚点全是小写（`#drawing-and-collision`），而本站 Hexo 生成的标题 id
  **保留大小写**（`Drawing-and-Collision`）。URL 片段大小写敏感，精确匹配不上时浏览器
  既不跳转也不报错 —— 表现就是"这个超链接点了没反应"。两层处理：
  1. 正文里写成实际 id（`tmodloader-basic-modprojectile.md` 的
     `#Drawing-and-Collision` ×2、`#Dust-Trail`）
  2. `source/custom/effects/anchor-fallback.js`：精确 id 不存在时做一次归一化
     （小写 + 非字母数字转 `-`）再匹配，覆盖大小写差异、`/`、`,`、空格、中文标题；
     命中后用 `scrollIntoView` 滚动，因此仍遵守 `toc.css` 的 `scroll-margin-top`
     （落点在固定导航下方 8px）。TOC 链接走主题 `btf.scrollToDest`，互不干扰
- 文章底部「文章作者」链接走主题 `post_copyright.author_href` → B 站主页
  <https://space.bilibili.com/448793040>
- 尊重 `prefers-reduced-motion`：星链只画一帧静态图，粒子 ∞ 静态渲染，幽灵代码不打字
- 标签页隐藏时两个 canvas 都会暂停；节点数按视口面积自适应（38~110）

想换回朴素样式：把 `inject.head` 里的 `sci-fi.css`、`inject.bottom` 里的
`starlink.js` / `hero-fx.js` 三行注释掉即可。



- 站点标题 `受命于天，既寿永昌` → `纪元`；作者 `l3AFovxs` → `HexShane`
- 头像 `/img/l3afovxs.jpg` → `/img/hexshane.jpg`；页脚/公告/关于页 GitHub 链接 → `008heshan`
- 侧边栏个人信息卡由「双人切换」改为**单人卡片**（`visit-card.js` / `visit-card.css` 已移除，
  头像与名字直接取主题 `avatar.img` 与 `config.author`）
- 站点 keywords 由个人向词条改为技术关键词
- `/admin/` 默认仓库由 `Leafmy/Leafmy_blogsource` → `008heshan/hexshane-blog`
- 主题 `favicon` 指向实际存在的 `/img/favicon.ico`（原为不存在的 `.png`，会 404）
- `package-lock.json` 的 tarball 地址由国内镜像改为官方 `registry.npmjs.org`，便于海外 CI 构建

## 已知事项

- 未启用 `hexo-generator-feed` / `hexo-generator-sitemap`，站点没有 `atom.xml`、`sitemap.xml`。
  需要时可加插件并在 `_config.yml` 中补配置。
- 文章插图**已本地化**：原先 12 张引用 `i.imgur.com`（境内不可达，页面全是破图），
  现已下载到 `source/img/posts/<文章名>/` 并改成 `/img/posts/...` 引用，不再依赖外网。
  文件名保留了原始 imgur ID，方便回溯：

  | 文章 | 图片（imgur ID） |
  | --- | --- |
  | `tmodloader-basic-modprojectile` | `RSaxV6T` 回旋镖 aiStyle 查表 · `CL2MwaF` CloneDefaults 效果 · `39KqXhc` 补 AIType 后 · `y4OcJAv` 竖直精灵 48x70 · `m5DxkBm` 量偏移 · `sKUq94z` 上下颠倒未修复 · `w3ALhDX` spriteDirection 修复 · `etzbzs0` 水平精灵 70x48 · `zQfxXM3` 偏移换算示意 · `vfKrRzZ` 水平翻转朝后 · `FKfhtQ0` 最终效果 |
  | `tmodloader-basic-npc-spawning` | `9rIgSMt` 世界高度分区示意 |

  复原办法（本机直连 imgur 不通时）：用 `https://cors.eu.org/https://i.imgur.com/<id>.png`
  可以取到原始字节；`image.thum.io` 只能截 imgur 的网页版，图会被页面裁掉，不要用。
- `www.hexshane.top` 目前未签发证书/未绑定，如需使用请在 Cloudflare Pages 里再添加一次自定义域。
