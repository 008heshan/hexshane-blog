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

## 视觉主题：深空科幻皮肤

皮肤文件 `source/custom/theme/sci-fi.css`（在 `inject.head` 中**最后**引入），
动态背景由两个 canvas 脚本提供，视觉参考 <https://www.deepseek.com/harness/> 的克制风格。

| 层 | 实现 | 文件 |
| --- | --- | --- |
| 底色 | 深海军蓝渐变 + 大面积柔和蓝色辉光 + 64px 淡网格 | `sci-fi.css` |
| 星链网络 | 卫星节点缓慢漂移、距离阈值内自动连线、指针附近点亮链路 | `source/custom/effects/starlink.js` |
| 粒子无限符号 ∞ | 双纽线点阵（离屏预渲染：模糊辉光层 + 清晰点阵层），呼吸缩放 + 沿曲线流动亮点 + 指针视差 | `source/custom/effects/hero-fx.js` |
| 幽灵代码 | 大标题背后逐字"打字"的代码片段，低透明度 + 轻微模糊 + 上下渐隐遮罩 | `source/custom/effects/hero-fx.js` |

- 大标题字体：**iFonts 航天遨游体**，从 22.5MB TTF 子集化为 87KB woff2
  （`source/custom/assets/fonts/HangtianAoyou-subset.woff2`，含 32 个常用汉字 + ASCII）
- **浅色模式已关闭**：主题 `darkmode.button: false`，导航栏不再有明暗切换按钮
- 头像已固定为圆形且禁用任何旋转（`transform/animation: none`）
- 面板为克制的深色玻璃（1px 淡边 + 柔和投影），不使用 HUD 角标等装饰
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
- `www.hexshane.top` 目前未签发证书/未绑定，如需使用请在 Cloudflare Pages 里再添加一次自定义域。
