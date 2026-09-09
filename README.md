# 受命于天，既寿永昌

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
│  ├─ about/index.md             # 关于页
│  └─ custom/                    # 自定义样式/脚本/字体/光标等静态资源
├─ themes/hexo-theme-butterfly/  # 主题（含站长改过的 _config.yml）
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

由于本站主题配置中大量资源使用根路径（`/custom/...`、`/img/...`），
在 `https://008heshan.github.io/hexshane-blog/` 这样的子路径下，这部分自定义特效资源会 404。
主站以 Cloudflare Pages 的根域名部署为准。

## 写文章

```bash
npx hexo new "文章标题"    # 生成 source/_posts/文章标题.md
npm run server            # 本地预览
git add -A && git commit -m "post: 文章标题" && git push
```

置顶：在文章 front-matter 里写 `sticky: 1`（数字越小越靠前，`0` 或不写表示不置顶）。

## 已知事项

- 主题配置中 `favicon: /img/favicon.png`，但主题 `source/img/` 下只有 `favicon.ico`，
  因此浏览器标签图标会 404（与原始站点一致，未作改动）。
- 未启用 `hexo-generator-feed` / `hexo-generator-sitemap`，站点没有 `atom.xml`、`sitemap.xml`
  （与原始站点一致）。需要时可加插件并在 `_config.yml` 中补配置。
- `/admin/` 是一个纯前端管理页，写操作通过浏览器里的 GitHub Token 调 Contents API 完成，
  请勿把长期有效的高权限 Token 保存在公共设备上。
