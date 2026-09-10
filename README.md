# 纪元 · hexshane.top

个人技术博客的完整源码。由 [Hexo](https://hexo.io/) + [Butterfly](https://butterfly.js.org/) 构建，
主题源码直接放在仓库里（`themes/hexo-theme-butterfly`，不走 npm），
主站部署在 **Cloudflare Pages**，自定义域名 <https://hexshane.top>。

| 部署目标 | 地址 | 说明 |
| --- | --- | --- |
| Cloudflare Pages | <https://hexshane.top> / <https://hexshane-blog.pages.dev> | 主站，推 `main` 自动构建 |
| GitHub Pages | <https://008heshan.github.io/hexshane-blog/> | 备用部署（子路径下部分自定义资源会 404，以主站为准） |

## 技术栈

| 组件 | 版本 |
| --- | --- |
| Hexo | 7.3.0 |
| hexo-theme-butterfly | 5.7.0（源码在仓库内） |
| hexo-shiki-plugin-butterfly | 1.0.26（Shiki 代码高亮，明暗双主题） |
| Node.js | 22（`.node-version` 固定） |

## 站点信息

| 字段 | 值 |
| --- | --- |
| 站点标题 | 纪元 |
| 副标题 | 分享技巧与经验 |
| 作者 | HexShane |
| 头像 | `/img/hexshane.jpg` |
| 内容方向 | Terraria / tModLoader 模组开发、Hexo、前端与性能优化 |
| 哔哩哔哩 | <https://space.bilibili.com/448793040> |
| 抖音 | <https://www.douyin.com/user/MS4wLjABAAAAVagbpZnsrACyaBI9a3H_FS4x3muOxK-DSPu4ddC7kz4> |
| 仓库 | <https://github.com/008heshan/hexshane-blog> |

## 目录结构

```
.
├─ .github/workflows/pages.yml   # GitHub Pages 备用部署（npm ci → build:ghpages → deploy）
├─ scripts/                      # 构建期自定义生成器 / 过滤器
│  ├─ articles-generator.js      # /articles/ 列表页（复用首页卡片样式，支持分页）
│  ├─ index-pin-order.js         # 首页置顶：sticky 数字越小越靠前
│  ├─ admin-generator.js         # /admin/ 管理后台 + posts.json / meta.json
│  ├─ search-json.js             # /search.json 检索索引
│  ├─ fix-shiki-fences.js        # 修复 shiki 插件代码围栏贪婪匹配
│  └─ translate-posts.js         # 构建期翻译（需配置 deepl_api_key，默认不启用）
├─ source/
│  ├─ _posts/                    # 文章（Markdown）
│  ├─ img/posts/<文章名>/        # 文章插图（自托管，不外链图床）
│  ├─ _data/announcement.yml     # 侧栏公告（后台 /admin/ 可写）
│  ├─ about/index.md             # 关于页
│  └─ custom/                    # 自定义样式 / 脚本 / 字体 / 图标等静态资源
├─ themes/hexo-theme-butterfly/  # 主题（含改过的 _config.yml、admin.pug）
├─ _config.yml                   # 站点配置：url = https://hexshane.top，root = /
├─ _config.ghpages.yml           # GitHub Pages 子路径覆盖配置（仅 CI 用）
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

> 删掉 `public/` 之后请用 `npm run clean && npm run build`，
> 否则 Hexo 会依据残留的 `db.json` 判定文件未变化而跳过生成。

## 部署

推送到 `main` 即自动构建部署（Cloudflare Pages → Git 集成）：

| 设置项 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 框架预设 | Hexo |
| 构建命令 | `npm run build` |
| 构建输出目录 | `public` |
| 环境变量 | `NODE_VERSION` = `22` |

自定义域 `hexshane.top` 在 Pages 项目 → 自定义域里管理，DNS 托管在 Cloudflare。

## 写文章

```bash
npx hexo new "文章标题"    # 生成 source/_posts/文章标题.md
npm run server            # 本地预览
git add -A && git commit -m "post: 文章标题" && git push
```

置顶：front-matter 里写 `sticky: 1`（数字越小越靠前，`0` 或不写表示不置顶）。

也可以完全不碰命令行，用后台 `/admin/` 写（见下）。

## 管理后台 /admin/

浏览器里直接用 GitHub Token 调 Contents API 读写仓库，凭证只存在本机浏览器
（localStorage，`admin_github_token`）。默认仓库 `008heshan/hexshane-blog`。

**Token 权限**：细粒度 Token 勾 `Contents: Read and write`（并把仓库加进授权范围），
经典 Token 勾 `repo`。写失败时会明确区分两种 403：**权限不足**（附 GitHub 原文）与
**接口限流**（附剩余额度与恢复时间）。注意"能看不能写"是正常的 —— 文章列表读的是站点
自己的 `/admin/posts.json`，不需要 Token；只有保存/删除才要写权限。

功能：文章列表与检索、新建/编辑/删除文章、标签与分类重命名（批量改写 front-matter）、
归档、侧栏公告、后台密钥轮换、Token 设置。

### 编辑器（写文章 / 公告同一套）

- Markdown 工具栏：加粗、斜体、删除线、标题、引用、列表、行内代码、代码块、链接、
  插入图片、外链图片、表格、分割线
- 快捷键：`Ctrl+B` 加粗、`Ctrl+I` 斜体、`Ctrl+K` 链接、`Ctrl+S` 保存、`Tab` / `Shift+Tab` 缩进、
  列表与引用回车自动续行、选中文字输入成对符号自动包裹
- 三种视图：编辑 / 分栏 / 预览；字数·行数统计；本地草稿自动保存（刷新后可恢复）
- **插入图片**（三种方式，都会自动上传到仓库并插入引用）：
  1. 点工具栏图钉 → 选文件（可多选）
  2. 直接 `Ctrl+V` 粘贴截图
  3. 把图片文件拖进输入框
  - 文章图片 → `source/img/posts/<文章名>/`，插入 `![文件名](/img/posts/…)`
  - 公告图片 → `source/img/announce/`，插入 `<img src="/img/announce/…">`
  - 同名文件会自动改名（`x.png` → `x-2.png`），不会覆盖仓库里已有的图

### 公告怎么渲染

侧栏公告写进 `source/_data/announcement.yml` 的 `content`，模板里用 Hexo 的
`markdown()`（底层 `hexo-renderer-marked`）渲染，所以：

- **Markdown 会真的生效**：工具栏写出来的 `**加粗**`、`- 列表`、`[链接](…)`、`` `代码` `` 等
- **HTML 原样保留**：marked 放行内联 / 块级 HTML，老的 `<p>` / `<b>` / `<ul>` 公告不受影响
- **两者可以混用**（HTML 区块照旧，Markdown 部分正常转成标签）
- 编辑器里的预览是「HTML 原样 + Markdown 转换」的近似渲染，最终效果以构建后的侧栏为准

## 视觉主题：深空科幻皮肤

皮肤文件 `source/custom/theme/sci-fi.css`（在 `inject.head` 里**最后**引入，
覆盖 theme-glass / nav-apple 等既有样式）。动态背景由 canvas 脚本提供。

| 层 | 实现 | 文件 |
| --- | --- | --- |
| 底色 | 冷黑渐变（`#0a141d → #03070b`）+ 克制的钢青辉光 + 64px 淡网格 | `sci-fi.css` |
| 星链网络 | 卫星节点缓慢漂移、距离阈值内自动连线、指针附近点亮链路 | `source/custom/effects/starlink.js` |
| 粒子无限符号 ∞ | 双纽线方形点阵 halftone（清晰 + 软化 + 辉光三层 + 颗粒噪声），呼吸缩放 + 沿曲线流动亮点 + 指针视差 | `source/custom/effects/hero-fx.js` |
| 幽灵代码 | 两处独立打字循环：大标题背后（泰拉瑞亚 / tModLoader C# 片段）、右下角（Boss / 掉落 / 加载日志） | `source/custom/effects/hero-fx.js` |
| 作者卡片社媒条 | 挂在作者卡片右缘，悬停时向右滑出：抖音 / B站 / GitHub 仓库（只有图标）；小屏与触屏改成卡片下方常显一行 | `source/custom/widgets/author-dock.js` + `.css` |

**配色（冷峻）**：近黑冷底 `#03060a`；强调色钢青 `#9dc0d4`，亮态 `#cbe2ef`，辅助石墨蓝 `#5b7285`；
正文冷白 `#d9e4ec`，次要文字冷灰 `#7c8a95`。去掉了高饱和霓虹，辉光强度压到最低。

### 玻璃材质（v18）

面板 = **中性白膜 + 实时背景模糊**，全部无色相。**首页卡片与文章面板铺的是同一层膜**
（都是 `--sf-glass`，没有渐变蒙层），所以两者通透度完全一致；卡片多出来的只有
`backdrop-filter` —— 模糊只改变"背后长什么样"，不会让面板更不透明。

| 令牌（`sci-fi.css` 顶部） | 默认值 | 作用 |
| --- | --- | --- |
| `--sf-glass` | `rgba(255,255,255,.055)` | 白膜浓度（调小更透，调大更"厚"）；卡片 / 文章面板 / `#page` 共用 |
| `--sf-glass-2` | `rgba(255,255,255,.075)` | 浮层（检索弹窗、作者卡片滑出条）用 |
| `--sf-glass-sheen` | 顶部白 7% → 1.2% | 顶部白色高光，只用在**代码块**上提质感（卡片刻意不用，否则会比文章面板白一档） |
| `--sf-glass-line` / `-strong` | 白 12% / 20% | 描边与悬停描边 |
| `--sf-glass-blur` | `20px` | 实时模糊半径 |

- 用在：首页卡片、侧栏卡片、文章面板、`#page`、文章版权块、检索弹窗、代码块、引用块、
  行内代码、标签胶囊、分页按钮；`theme-glass.css`（dark 卡片 / `#post` `#archive` `#page` /
  移动端）与之共用同一批令牌
- **为什么白膜不能省**：Chromium 在硬件加速不可用或 GPU 进程回退时会**静默丢掉
  `backdrop-filter`**，只靠实时模糊的"玻璃"会直接消失（看起来像没做效果）。所以元素自身的
  白膜负责质感，blur 只负责锦上添花；另附 `@supports not (backdrop-filter…)` 分支，
  没有 blur 时自动把白膜加厚一档
- 刻意**不开** `backdrop-filter` 的地方：`#post` / `#archive` / `#page` 长文容器（背后就是
  页面底色，模糊看不出来，每帧重采样却很贵）与代码块（一篇文章十几个，纯色背景下模糊无差别，
  却会堆出十几层合成层，既掉帧又容易触发合成层上限导致的偶发模糊失效）
- 其他细节：代码块只留**一层**卡片皮（内层 `.codeblock` / `pre` / `code` 一律透明无边框，
  行内 code 样式用 `:not(pre) > code` 限定）；分享条 X 图标品牌色纯黑→改紫色 `#8b5cf6`；
  头像固定圆形且禁用旋转；尊重 `prefers-reduced-motion`；标签页隐藏时 canvas 暂停

### 其他实现细节

- 大标题字体：**iFonts 航天遨游体**，从 22.5MB TTF 子集化为 87KB woff2
  （`source/custom/assets/fonts/HangtianAoyou-subset.woff2`，含 32 个常用汉字 + ASCII）
- 左上角品牌位：**莫比乌斯式无限图标**（`source/custom/assets/mobius.svg`）替换站名文字，
  文字仍在 DOM 中，读屏与 SEO 不受影响
- 顶部导航滚动动画：顶部透明 → 滚动 80px 后玻璃底 0.4s 淡入，同时居中收窄到 980px
  （`cubic-bezier(.34,1.36,.44,1)` 模拟 spring 回弹）；触发用哨兵元素 + `IntersectionObserver`
  （`source/custom/effects/nav-glass.js`）
- **浅色模式已关闭**（主题 `darkmode.button: false`），全站只有深色
- **站内锚点大小写容错**：文章锚点多是从 tModLoader 官方 Wiki 搬来的，Wiki 锚点全小写
  （`#drawing-and-collision`），而本站 Hexo 生成的标题 id 保留大小写（`Drawing-and-Collision`），
  URL 片段大小写敏感 —— 匹配不上时浏览器既不跳转也不报错。处理：正文写实际 id，
  另加 `source/custom/effects/anchor-fallback.js` 做归一化兜底（覆盖大小写、`/`、`,`、空格、中文），
  命中后用 `scrollIntoView`，仍遵守 `toc.css` 的 `scroll-margin-top`
- 文章底部「文章作者」链接走主题 `post_copyright.author_href` → B 站主页

想换回朴素样式：把 `inject.head` 里的 `sci-fi.css`、`inject.bottom` 里的
`starlink.js` / `hero-fx.js` / `author-dock.js` 注释掉即可。

## 运维备忘

- **自定义资源要带版本号**：静态托管对 `/custom/**` 没有 cache-control，不改 URL
  浏览器会长期跑旧文件。改动后记得把 `inject` 里的 `?v=YYYYMMDDx` 往上推一档
- 图片全部自托管在 `source/img/` 下，不依赖任何图床
- `/admin/` 的 Token 只存在访问者的浏览器里；换设备要重新填
- 后台写操作会直接提交到仓库，触发 Cloudflare Pages 构建（约 1 分钟）

## 内容计划：tModLoader 指南搬运进度

按 tModLoader 官方 Wiki [Home](https://github.com/tModLoader/tModLoader/wiki) 的 **Easy guides** 顺序逐篇搬过来并译成中文。
翻译约定：**代码与 API 名一律保留英文原文**，正文译成中文并化繁为简（口语、能听懂、不留机翻味）；
每篇开头保留"整理自官方 Wiki + 原文链接"的引用块，插图一律下载到 `source/img/posts/<文章名>/` 自托管。

| # | Wiki 页面 | 本地文件 | 状态 |
| --- | --- | --- | --- |
| 1 | [Basic-Prerequisites](https://github.com/tModLoader/tModLoader/wiki/Basic-Prerequisites) | `tmodloader-basic-prerequisites.md` | ✅ 已译 |
| 2 | [Spriting](https://github.com/tModLoader/tModLoader/wiki/Spriting) | — | ⬜ 待搬 |
| 3 | [Basic-Ammo](https://github.com/tModLoader/tModLoader/wiki/Basic-Ammo) | — | ⬜ 待搬 |
| 4 | [Basic-Autoload](https://github.com/tModLoader/tModLoader/wiki/Basic-Autoload) | — | ⬜ 待搬 |
| 5 | [Coordinates](https://github.com/tModLoader/tModLoader/wiki/Coordinates) | — | ⬜ 待搬 |
| 6 | [Geometry](https://github.com/tModLoader/tModLoader/wiki/Geometry) | — | ⬜ 待搬 |
| 7 | [Basic-glowmask-guide](https://github.com/tModLoader/tModLoader/wiki/Basic-glowmask-guide) | — | ⬜ 待搬 |
| 8 | [IEntitySource](https://github.com/tModLoader/tModLoader/wiki/IEntitySource) | — | ⬜ 待搬 |
| 9 | [Localization](https://github.com/tModLoader/tModLoader/wiki/Localization) | — | ⬜ 待搬 |
| 10 | [Logging](https://github.com/tModLoader/tModLoader/wiki/Logging) | — | ⬜ 待搬 |
| 11 | [Basic-Minion-Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Minion-Guide) | — | ⬜ 待搬 |
| 12 | [Basic-JSON-&-ModConfigs](https://github.com/tModLoader/tModLoader/wiki/Basic-JSON-%26-ModConfigs) | — | ⬜ 待搬 |
| 13 | [Basic-Dust](https://github.com/tModLoader/tModLoader/wiki/Basic-Dust) | — | ⬜ 待搬 |
| 14 | [Basic-Item](https://github.com/tModLoader/tModLoader/wiki/Basic-Item) | — | ⬜ 待搬 |
| 15 | [Basic-Projectile](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile) | `tmodloader-basic-modprojectile.md` | 🚧 原文已搬、待重译 |
| 16 | [ModPlayer](https://github.com/tModLoader/tModLoader/wiki/ModPlayer) | — | ⬜ 待搬 |
| 17 | [Basic-Recipes](https://github.com/tModLoader/tModLoader/wiki/Basic-Recipes) | `tmodloader-basic-recipe.md` | 🚧 原文已搬、待重译 |
| 18 | [Basic-Tile](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile) | — | ⬜ 待搬 |
| 19 | [Basic-Tile-Entity](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile-Entity) | — | ⬜ 待搬 |
| 20 | [Basic-Netcode](https://github.com/tModLoader/tModLoader/wiki/Basic-Netcode) | — | ⬜ 待搬 |
| 21 | [Basic-NPC-Drops-and-Loot-1.4](https://github.com/tModLoader/tModLoader/wiki/Basic-NPC-Drops-and-Loot-1.4) | — | ⬜ 待搬 |
| 22 | [Basic-NPC-Spawning](https://github.com/tModLoader/tModLoader/wiki/Basic-NPC-Spawning) | `tmodloader-basic-npc-spawning.md` | 🚧 原文已搬、待重译 |
| 23 | [Basic-Sounds](https://github.com/tModLoader/tModLoader/wiki/Basic-Sounds) | — | ⬜ 待搬 |
| 24 | [Time-and-Timers](https://github.com/tModLoader/tModLoader/wiki/Time-and-Timers) | — | ⬜ 待搬 |
| 25 | [Basic-UI-Element](https://github.com/tModLoader/tModLoader/wiki/Basic-UI-Element) | — | ⬜ 待搬 |
| 26 | [Wall](https://github.com/tModLoader/tModLoader/wiki/Wall) | — | ⬜ 待搬 |
| 27 | [Conditions](https://github.com/tModLoader/tModLoader/wiki/Conditions) | — | ⬜ 待搬 |

> 抓取提示：`raw.githubusercontent.com/wiki/tModLoader/tModLoader/<页面名>.md` 直接就是 Wiki 原稿
> （本机直连时通时不通，多试几次或走代理）；原稿里的 imgur 图可用 `https://cors.eu.org/<原图地址>` 取回本地（会限流）。

## 已知事项

- 未启用 `hexo-generator-feed` / `hexo-generator-sitemap`，站点没有 `atom.xml`、`sitemap.xml`。
  需要时可加插件并在 `_config.yml` 中补配置
- `www.hexshane.top` 未签发证书/未绑定，如需使用在 Cloudflare Pages 里再添加一次自定义域
