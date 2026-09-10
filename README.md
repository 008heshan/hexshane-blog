# 纪元 · hexshane.top

> 善姐的个人博客 —— 写点代码，也写点生活。
>
> 主线上是 **tModLoader 模组开发**（官方 Wiki 的 Easy guides 全 27 篇中文精翻已上线），
> 另外还有 Web 前端与性能折腾、工具与踩坑记录，偶尔夹一点生活杂谈。
> 写得不算快，但每一篇都想让人一遍看懂 👋

站点地址：<https://hexshane.top>　·　文章列表：<https://hexshane.top/articles/>

---

技术上的事：本站由 [Hexo](https://hexo.io/) + [Butterfly](https://butterfly.js.org/) 构建，
主题源码直接放在仓库里（`themes/hexo-theme-butterfly`，不走 npm），
主站部署在 **Cloudflare Pages**。

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
| 副标题 | 写点代码，也写点生活 |
| 作者 | HexShane（读者都喊 **善姐**） |
| 头像 | `/img/hexshane.jpg` |
| 内容方向 | Terraria / tModLoader 模组开发、Hexo、前端与性能优化 |
| 首页打字机标语 | 写点代码，也写点生活 / 折腾泰拉瑞亚模组中 🧩 / 把踩过的坑，都记在这里 / 欢迎来玩，随便逛逛 ✨ |
| 哔哩哔哩 | <https://space.bilibili.com/448793040> |
| 抖音 | <https://www.douyin.com/user/MS4wLjABAAAAVagbpZnsrACyaBI9a3H_FS4x3muOxK-DSPu4ddC7kz4> |
| 仓库 | <https://github.com/008heshan/hexshane-blog> |

## 目录结构

```
.
├─ .github/workflows/pages.yml   # GitHub Pages 备用部署（npm ci → build:ghpages → deploy）
├─ scripts/                      # Hexo 插件（generator / filter / helper）—— 会被自动加载执行
│  ├─ articles-generator.js      # /articles/ 列表页（复用首页卡片样式，支持分页）
│  ├─ index-pin-order.js         # 首页置顶：sticky 数字越小越靠前
│  ├─ admin-generator.js         # /admin/ 管理后台 + posts.json / meta.json
│  ├─ search-json.js             # /search.json 检索索引
│  ├─ fix-shiki-fences.js        # 修复 shiki 插件代码围栏贪婪匹配
│  └─ translate-posts.js         # 构建期翻译（需配置 deepl_api_key，默认不启用）
├─ tools/                        # 维护工具（只能手动调用；不能放 scripts/，那里会被自动执行）
│  └─ fix-ghpages-paths.js       # 镜像站构建后给 /custom/ 资源补子路径前缀
├─ source/
│  ├─ _posts/                    # 文章（Markdown）
│  ├─ img/posts/<文章名>/        # 文章插图（自托管，不外链图床）
│  ├─ img/favicon.svg 等         # 站点图标一套（svg + 32/180/512 png）
│  ├─ _data/announcement.yml     # 侧栏公告（后台 /admin/ 可写）
│  ├─ about/index.md             # 关于页
│  ├─ robots.txt                 # 屏蔽后台路径收录
│  └─ custom/                    # 自定义资源，按职责分目录：
│     ├─ theme/                  #   皮肤与版式：sci-fi.css（令牌 + 材质收口）、字体、TOC、阅读模式、移动端修复、主题切换动效
│     ├─ nav/                    #   导航：nav-core（外壳）、nav-search（检索）、nav-glass（滚动玻璃底）、sidebar-mask（抽屉状态机）
│     ├─ code/                   #   代码块：code-highlight.css（皮肤）、code-wrap-align.js（换行后行号对齐）
│     ├─ effects/                #   背景与特效：glass-bg / starlink / hero-fx / force-glow
│     ├─ perf/                   #   性能守门：scroll-perf（快速滚动降级）、tab-visibility（隐藏页暂停动画）
│     ├─ utils/                  #   兜底修复：anchor-fallback（锚点归一化）、anchor-offset（避让固定导航）
│     ├─ widgets/                #   页面挂件：公告悬停、作者社媒条、翻译按钮、页脚、图片放大、/articles/ 页头样式
│     ├─ admin/                  #   管理后台（admin.js / admin.css / admin-key.js / admin-space.js）
│     ├─ assets/                 #   静态资源：字体、Font Awesome、品牌 svg、vendor/（第三方插件资源本地副本）
│     └─ cursor/                 #   自定义光标
├─ themes/hexo-theme-butterfly/  # 主题（含改过的 _config.yml、admin.pug、articles.pug）
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

也可以完全不碰命令行，用站内的管理后台写文章、改公告与站点文案。

## 管理后台

仓库里带一个纯前端的管理后台（架构见 `scripts/admin-generator.js` 与
`source/custom/admin/`），日常发文章不用开编辑器：文章增删改、标签/分类重命名、
归档日期、侧栏公告、以及上文「站点文案」那几个字段都能在浏览器里改完直接提交。

它是**静态页 + 浏览器直连 GitHub API**，所以：

- 仓库里**不存在任何密钥或凭证**（写入凭证只保存在使用者的浏览器本地，不入库、不上传）
- 后台页面本身不入索引、站内也没有任何链接指向它
- 因此它的安全边界等于**你的 GitHub 账号权限**：想动站点内容，必须拿到写入凭证或 GitHub 账号；
  没有凭证的人即使打开后台也只能浏览公开信息

> 运维细节（入口方式、凭证存放位置与权限配置、密钥轮换、排错）记在**本地** `NOTES-private.md`，
> 该文件已加入 `.gitignore`，不会推到公开仓库。

### 编辑器（写文章 / 公告 / 关于页同一套）

> 踩过的坑：**点工具栏按钮会让编辑器"跳到最底部"**。原因是直接给 `textarea.value` 赋值时，
> Chromium 会把光标丢到文末并把**内部滚动位置一起甩到底部**，紧随其后的 `setSelectionRange`
> 只挪光标、不回滚滚动 —— 长文里点一次「加粗」就跳到最后一行。
> 现在所有改值的地方统一走 `setValueSelection()`：记住滚动位置 → 改值 → 放光标 → 还原滚动；
> 只有光标确实被挪出可视区（例如撤回跨了很多行）才把它带回视区中间。

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
  （`source/custom/nav/nav-glass.js`）
- **浅色模式已关闭**（主题 `darkmode.button: false`），全站只有深色
- **图片点击放大（v19）**：主题 `lightbox: medium_zoom`（原来是留空的，点图毫无反应）。
  另配 `source/custom/widgets/image-zoom.js` 增强：自然宽度 ≤ 160px 的小贴图（Terraria 的弹幕
  贴图动辄 48x70）按**整数倍**放大到约 480px 宽，并用 `image-rendering: pixelated` 最近邻缩放，
  像素点看得清、不发糊（实测 48x70 → 384x560，8 倍）；大图仍走 medium-zoom 原本的
  "适应视口"行为，不干预
- **`/articles/` 列表页改造（v19）**：原来只是把首页卡片原样铺一遍，27 篇扫下来没有层次。现在
  （样式全部限定在 `#articles-index` 内，不动首页）：
  - 页头面板：「全部 27 篇」+ 一句话说明 + 篇数/分类/标签统计 + 分类筛选胶囊（可点着跳分类页）
  - 卡片：标题放大到 1.18rem、左侧钢青竖条（悬停点亮）、分类换成强调色胶囊、摘要放开到 3 行、
    悬停抬升 2px；每张卡左上带 **01…27 序号徽章**（序号 = 系列顺序）
  - 序号在模板里按「页码偏移 + 本页序号」算，**不往文章对象上挂字段**（第一版用生成器注入
    `artIndex`，结果污染了首页卡片 —— 已改掉，现在首页/归档 0 徽章）
- **列表页摘要不再千篇一律**：`index_post_content.method: 2`（优先 `description`，没有才截正文）。
  本站文章都是"整理自官方 Wiki"的搬运稿，正文第一段永远是同一句来源说明 —— 用默认的
  method 3 会让首页与 `/articles/` 的每张卡片摘要长得一模一样。现在 27 篇都写了
  `description`（一句话中文摘要），卡片摘要与 `<meta name="description">` 都用它
- **站点图标（favicon）**：`source/img/favicon.svg` —— 取导航左上角那枚莫比乌斯 ∞（与
  `custom/assets/mobius.svg` 同一套几何），重排成方形：深空冷底 + 圆角，线体钢青到冷白渐变，
  交叉处留一道缺口做出扭转错觉。favicon 在 16px 下会糊，所以刻意做了三件事：**加粗线条、
  加大占比（图形占满 88%）、去掉网格/星点/辉光等所有细节**。
  一套四个文件：`favicon.svg`（矢量，主用）、`favicon-32.png`（PNG 兜底）、
  `apple-touch-icon.png`（180，iOS 加到桌面用）、`favicon-512.png`（备用/PWA）。
  PNG 由无头 Edge 渲染 SVG 得到（透明底），接入方式：主题 `favicon:` 指向 svg，
  另两条 `<link>` 走 `url_for` 写在 `layout/includes/head.pug`（子路径部署也不会 404）- **后台「站点文案」标签页**：`/admin/` 里除「文章 / 公告」外，多了一处文案集中入口，省得为改一句话去翻文件：
  - **关于页正文** —— 与文章/公告同一个编辑器（工具栏、Ctrl+B/K、Tab 缩进、编辑/分栏/预览、撤回重做、
    插图上传到 `source/img/about/`）。保存只覆盖正文，`source/about/index.md` 的 front-matter 与文末结构保留
  - **站点文案** —— 根 `_config.yml` 的 `subtitle` / `description`
  - **主题文案** —— 首页打字机标语（`subtitle.sub`，一行一句）与作者卡片简介（`aside.card_author.description`）
  - 实现要点：**只做外科手术式的行替换**，文件里其它配置、缩进、注释一律不动（整份重写会把注释和
    别人的配置一起吃掉）。已验证：取值/改值往返、改完只有目标行变化、带冒号与引号的值能安全往返、
    `subtitle` / `card_author` 块内其它键保留（21 项检查全过）
  - 三处保存后都等站点重新构建；没有 Token 时会明确提示「Token 无效或已过期」
- **自定义包裹层要带 `nc` 类（踩过的坑）**：主题有
  `.layout > div:first-child:not(.nc) { background: var(--card-bg) }`（深色模式 = `#121212`）。
  自己写的页面包裹层（如 `/articles/` 的 `#articles-index`）如果正好是 `.layout` 的第一个 div
  又没带 `nc`，整列会被刷上一块黑板 —— 玻璃卡片背后变成纯色，blur 无纹理可采样，面板就"发黑、
  不像玻璃"。首页的 `#recent-posts` 正是靠 `nc`（no-card）躲开它。排查办法：用 CDP 的
  `CSS.getMatchedStylesForNode` 问某个元素命中了哪条规则，或扫"大面积 + 深色背景"的元素。
- **站内锚点大小写容错**：文章锚点多是从 tModLoader 官方 Wiki 搬来的，Wiki 锚点全小写
  （`#drawing-and-collision`），而本站 Hexo 生成的标题 id 保留大小写（`Drawing-and-Collision`），
  URL 片段大小写敏感 —— 匹配不上时浏览器既不跳转也不报错。处理：正文写实际 id，
  另加 `source/custom/utils/anchor-fallback.js` 做归一化兜底（覆盖大小写、`/`、`,`、空格、中文），
  命中后用 `scrollIntoView`，仍遵守 `toc.css` 的 `scroll-margin-top`
- 文章底部「文章作者」链接走主题 `post_copyright.author_href` → B 站主页

想换回朴素样式：把 `inject.head` 里的 `sci-fi.css`、`inject.bottom` 里的
`starlink.js` / `hero-fx.js` / `author-dock.js` 注释掉即可。

## 运维备忘

- **自定义资源要带版本号**：静态托管对 `/custom/**` 没有 cache-control，不改 URL
  浏览器会长期跑旧文件。改动后记得把 `inject` 里的 `?v=YYYYMMDDx` 往上推一档
- 图片全部自托管在 `source/img/` 下，不依赖任何图床
- 管理后台的写入凭证只保存在**使用者的本机浏览器**里，仓库里没有任何密钥；换设备要重新填
  （入口方式与权限配置见本地 `NOTES-private.md`）
- 后台写操作会直接提交到仓库，触发 Cloudflare Pages 构建（约 1 分钟）
- `source/robots.txt` 里 Disallow 了后台相关路径；后台页面本身也带 `noindex`，站内没有任何链接指向它

## 内容计划：tModLoader 指南搬运进度

按 tModLoader 官方 Wiki [Home](https://github.com/tModLoader/tModLoader/wiki) 的 **Easy guides** 顺序逐篇搬过来并译成中文。
翻译约定：**代码与 API 名一律保留英文原文**，正文译成中文并化繁为简（口语、能听懂、不留机翻味）；
每篇开头保留"整理自官方 Wiki + 原文链接"的引用块，插图一律下载到 `source/img/posts/<文章名>/` 自托管。

| # | Wiki 页面 | 本地文件 | 状态 |
| --- | --- | --- | --- |
| 1 | [Basic-Prerequisites](https://github.com/tModLoader/tModLoader/wiki/Basic-Prerequisites) | `tmodloader-basic-prerequisites.md` | ✅ 已译 |
| 2 | [Spriting](https://github.com/tModLoader/tModLoader/wiki/Spriting) | `tmodloader-spriting.md` | ✅ 已译 · 11 张 imgur 图待补 |
| 3 | [Basic-Ammo](https://github.com/tModLoader/tModLoader/wiki/Basic-Ammo) | `tmodloader-basic-ammo.md` | ✅ 已译（无图） |
| 4 | [Basic-Autoload](https://github.com/tModLoader/tModLoader/wiki/Basic-Autoload) | `tmodloader-basic-autoload.md` | ✅ 已译 · 1 张 imgur 图待补 |
| 5 | [Coordinates](https://github.com/tModLoader/tModLoader/wiki/Coordinates) | `tmodloader-coordinates.md` | ✅ 已译（1 张图缺，正文已说明） |
| 6 | [Geometry](https://github.com/tModLoader/tModLoader/wiki/Geometry) | `tmodloader-geometry.md` | 🚧 已译 · 6 张图待补（代理限流） |
| 7 | [Basic-glowmask-guide](https://github.com/tModLoader/tModLoader/wiki/Basic-glowmask-guide) | `tmodloader-basic-glowmask-guide.md` | ✅ 已译 · 2 张 imgur 图待补 |
| 8 | [IEntitySource](https://github.com/tModLoader/tModLoader/wiki/IEntitySource) | `tmodloader-ientitysource.md` | ✅ 已译（无图） |
| 9 | [Localization](https://github.com/tModLoader/tModLoader/wiki/Localization) | `tmodloader-localization.md` | ✅ 已译（8429 汉字 · 35 代码块 · 3 图已本地化） |
| 10 | [Logging](https://github.com/tModLoader/tModLoader/wiki/Logging) | `tmodloader-logging.md` | ✅ 已译（图已本地化 ×2） |
| 11 | [Basic-Minion-Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Minion-Guide) | `tmodloader-basic-minion-guide.md` | ✅ 已译（无图） |
| 12 | [Basic-JSON-&-ModConfigs](https://github.com/tModLoader/tModLoader/wiki/Basic-JSON-%26-ModConfigs) | `tmodloader-basic-json-modconfigs.md` | ✅ 已译（无图） |
| 13 | [Basic-Dust](https://github.com/tModLoader/tModLoader/wiki/Basic-Dust) | `tmodloader-basic-dust.md` | ✅ 已译 · 2 张 imgur 图待补 |
| 14 | [Basic-Item](https://github.com/tModLoader/tModLoader/wiki/Basic-Item) | `tmodloader-basic-item.md` | ✅ 已译（无图；原文本身很短） |
| 15 | [Basic-Projectile](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile) | `tmodloader-basic-modprojectile.md` | ✅ 已重译（22 代码块字节一致） |
| 16 | [ModPlayer](https://github.com/tModLoader/tModLoader/wiki/ModPlayer) | `tmodloader-modplayer.md` | ✅ 已译（无图） |
| 17 | [Basic-Recipes](https://github.com/tModLoader/tModLoader/wiki/Basic-Recipes) | `tmodloader-basic-recipe.md` | ✅ 已重译（20 代码块字节一致） |
| 18 | [Basic-Tile](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile) | `tmodloader-basic-tile.md` | ✅ 已译 · imgur 图已省略（GitHub 图保留原链接） |
| 19 | [Basic-Tile-Entity](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile-Entity) | `tmodloader-basic-tile-entity.md` | ✅ 已译 · 2 张 imgur 图待补 |
| 20 | [Basic-Netcode](https://github.com/tModLoader/tModLoader/wiki/Basic-Netcode) | `tmodloader-basic-netcode.md` | ✅ 已译（无图） |
| 21 | [Basic-NPC-Drops-and-Loot-1.4](https://github.com/tModLoader/tModLoader/wiki/Basic-NPC-Drops-and-Loot-1.4) | `tmodloader-basic-npc-drops-and-loot.md` | ✅ 已译（无图） |
| 22 | [Basic-NPC-Spawning](https://github.com/tModLoader/tModLoader/wiki/Basic-NPC-Spawning) | `tmodloader-basic-npc-spawning.md` | ✅ 已重译（21 个代码块逐字保留） |
| 23 | [Basic-Sounds](https://github.com/tModLoader/tModLoader/wiki/Basic-Sounds) | `tmodloader-basic-sounds.md` | ✅ 已译 · 3 图本地化 / 1 张 imgur 待补 |
| 24 | [Time-and-Timers](https://github.com/tModLoader/tModLoader/wiki/Time-and-Timers) | `tmodloader-time-and-timers.md` | ✅ 已译 |
| 25 | [Basic-UI-Element](https://github.com/tModLoader/tModLoader/wiki/Basic-UI-Element) | `tmodloader-basic-ui-element.md` | ✅ 已译 |
| 26 | [Wall](https://github.com/tModLoader/tModLoader/wiki/Wall) | `tmodloader-wall.md` | ✅ 已译 · 5 图本地化 / 1 张 imgur 待补 |
| 27 | [Conditions](https://github.com/tModLoader/tModLoader/wiki/Conditions) | `tmodloader-conditions.md` | ✅ 已译 |

**完成情况（Easy guides 全 27 篇已全部落地）**

| 指标 | 数值 |
| --- | --- |
| 文章 | 27 篇（含就地重译的 3 篇旧文） |
| 中文正文 | 约 50,700 汉字 |
| 保留的代码块 | 235 个（逐字保留，重译的 3 篇用 Base64/SHA-256 逐块比对过） |
| 保留的外链 | 330 条 |
| 本地化插图 | 29 张（`source/img/posts/<文章名>/`） |

**待补图片（21 张，全部是 `i.imgur.com`）**：取图代理 `cors.eu.org` 目前对这个 IP 持续返回 429，
`wsrv.nl` / codetabs / allorigins / corsproxy / camo 等通道也都不可用；GitHub 图床
（`user-images.githubusercontent.com`、`github.com/user-attachments`）不受影响，已全部本地化。
处理原则：**绝不推破图** —— 取不到的图从正文删除，并把依赖配图的句子改写成能独立读通的文字。
仓库里有一个后台慢速重试任务在持续尝试，代码里的 `?v=` 已按需推进，拿到图后按
`/img/posts/<文章名>/<imgur id>.png` 插回即可（子任务报告里留了每张图的插入位置提示）。
> 抓取提示：`raw.githubusercontent.com/wiki/tModLoader/tModLoader/<页面名>.md` 直接就是 Wiki 原稿
> （本机直连时通时不通，多试几次或走代理）；原稿里的 imgur 图可用 `https://cors.eu.org/<原图地址>` 取回本地（会限流）。

## 已知事项

- 未启用 `hexo-generator-feed` / `hexo-generator-sitemap`，站点没有 `atom.xml`、`sitemap.xml`。
  需要时可加插件并在 `_config.yml` 中补配置
- `www.hexshane.top` 未签发证书/未绑定，如需使用在 Cloudflare Pages 里再添加一次自定义域
