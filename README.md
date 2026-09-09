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

## 视觉主题：科幻 / 科技 / 极客皮肤

皮肤文件：`source/custom/theme/sci-fi.css`，在主题 `_config.yml` 的 `inject.head` 中
**最后**引入（覆盖 `theme-glass.css` / `nav-apple.css` 等既有样式），并注入视口 HUD 边框。

| 设计要素 | 实现 |
| --- | --- |
| 深空底色 + 星云光斑 | 覆盖 `.bg-liquid`（青 / 紫径向渐变 + 纵向暗色渐变） |
| 技术网格 | `.glass-bg::after` 46px 网格，四周渐隐（mask） |
| 扫描光带 | `.glass-bg::before` 14s 缓速循环（`prefers-reduced-motion` 下自动关闭） |
| 霓虹主色 | 青 `#22d3ee`，辅助紫 `#8b5cf6`，状态绿 `#34d399` |
| 面板 HUD | 深色玻璃 + 1px 发丝边 + 左上/右下 L 形角标 + 顶部霓虹线 |
| 视口 HUD | 四角括号 + 右下 `SYS · ONLINE ●`（纯 CSS，`aria-hidden`） |
| 首页 HUD 状态行 | `#site-title::after` 输出 `SYSTEM · READY`（仅首页） |
| 等宽字体 | 元信息 / 数字 / 标签 / 按钮 / 代码用 Fira Code，正文仍是苹方 |
| 正文 | h2 左侧霓虹竖条、h3 紫色边条、行内代码青色胶囊、引用块青色发光 |
| 代码块 | 近黑终端框 + 青色行号栏 |
| 交互 | hover 边框增亮 + 外发光，过渡 120~220ms |

- 默认深色：主题 `_config.yml` 的 `display_mode: dark`（右上角按钮仍可切到浅色）
- 浅色模式为「实验室 / 蓝图」风，所有硬编码颜色都做了浅色覆盖，可正常阅读
- 想恢复原皮肤：把 `inject.head` 里的 `sci-fi.css` 那行注释掉即可



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
- `www.hexshane.top` 目前未签发证书/未绑定，如需使用请在 Cloudflare Pages 里再添加一次自定义域。
