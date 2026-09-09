# Hexshane 的博客

基于 [Hexo](https://hexo.io/) + [NexT](https://theme-next.js.org/) 的静态博客。
源码仓库：`hexshane-blog`，只提交源码，`public/` 由 CI 构建生成。

| 部署目标 | 地址 | 状态 |
| --- | --- | --- |
| GitHub Pages（项目站点） | <https://008heshan.github.io/hexshane-blog/> | 已上线 |
| Cloudflare Pages（自定义域名） | <https://hexshane.top> | 迁移中 |

## 目录结构

```
.
├─ .github/workflows/pages.yml   # GitHub Pages 自动部署工作流
├─ source/_posts/                # 文章 Markdown
├─ source/{about,tags,categories}/index.md  # 独立页面
├─ _config.yml                   # 站点主配置：url = https://hexshane.top，root = /
├─ _config.ghpages.yml           # GitHub Pages 子路径覆盖配置（仅 CI 使用）
├─ _config.next.yml              # NexT 主题配置
├─ .node-version                 # 固定 Node 版本（Cloudflare Pages / 本地 nvm 读取）
├─ package.json / package-lock.json
└─ scaffolds/                    # 新建文章模板
```

## 本地开发

```bash
npm ci                 # 安装依赖
npm run server         # 本地预览 http://localhost:4000
npm run build          # 生成 public/（面向自定义域名）
npm run build:ghpages  # 生成 public/（面向 GitHub Pages 子路径）
npm run clean          # 清理 public/ 与缓存
npx hexo new "标题"     # 新建文章
```

### 两套构建配置为什么需要

Hexo 生成的资源路径由 `url` + `root` 决定：

- 自定义域名 `https://hexshane.top` → `root: /` → 资源在 `/css/main.css`
- GitHub Pages 项目站点 `https://008heshan.github.io/hexshane-blog/` → `root: /hexshane-blog/` → 资源在 `/hexshane-blog/css/main.css`

主配置 `_config.yml` 面向自定义域名；`_config.ghpages.yml` 是 GitHub Actions 专用的覆盖配置，
通过 `hexo generate --config _config.yml,_config.ghpages.yml` 合并使用。
这样同一份源码在两种部署下都能正确加载资源，迁移期间 GitHub Pages 不会失效。

## 部署一：GitHub Pages（已完成）

1. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
2. 推送到 `main` 后 `.github/workflows/pages.yml` 自动执行 `npm ci` → `npm run build:ghpages` → 发布。
3. 站点地址：<https://008heshan.github.io/hexshane-blog/>

## 部署二：Cloudflare Pages（迁移目标）

### 1. 在 Cloudflare 创建 Pages 项目

Cloudflare 控制台 → **Workers 和 Pages** → **+** → **Pages** → **导入现有 Git 存储库** →
连接 GitHub 账号并选择仓库 `008heshan/hexshane-blog`，然后按下表填写：

| 设置项 | 值 |
| --- | --- |
| 项目名称 | `hexshane-blog`（决定临时域名 `hexshane-blog.pages.dev`） |
| 生产分支 | `main` |
| 框架预设 | `Hexo` |
| 构建命令 | `npm run build` |
| 构建输出目录 | `public` |
| 环境变量 | `NODE_VERSION` = `22`（仓库已含 `.node-version`，二选一即可） |

保存并部署后，先访问 `https://hexshane-blog.pages.dev` 验证。

> 常见报错：构建时提示 `Could not read package.json` —— 说明推送的是 `public/` 静态文件而不是 Hexo 源码。
> 本仓库提交的就是完整 Hexo 工程，不会遇到该问题。

### 2. 把域名接入 Cloudflare

1. Cloudflare 控制台 → **域（Domains）** → **添加域 / 连接域名** → 输入 `hexshane.top`。
2. Cloudflare 会分配两条名称服务器，形如：

   ```
   xxxx.ns.cloudflare.com
   yyyy.ns.cloudflare.com
   ```

3. 登录 **Spaceship** → **Domain Manager（域名管理器）** → 点击 `hexshane.top` →
   右侧 **Custom Nameservers（自定义名称服务器）** → 填入上面两条 NS → 保存。
4. 回到 Cloudflare 等待状态变为 **Active / 活跃**（几分钟到几小时）。

### 3. 绑定自定义域名

Cloudflare 控制台 → **Workers 和 Pages** → `hexshane-blog` 项目 → **自定义域** →
**设置自定义域** → 输入 `hexshane.top`（建议再加 `www.hexshane.top`）。
Cloudflare 会自动创建 `CNAME` 记录并签发免费 SSL 证书。

### 4. 迁移完成后的收尾

- 主配置已指向 `https://hexshane.top`，无需改动。
- 可选：在 GitHub 仓库 **Settings → Pages** 中停用 GitHub Pages（保留工作流作为备份亦可）。
- 可选：如需 GitHub Pages 也响应自定义域名，可在 `source/CNAME` 写入 `hexshane.top`
  （注意：写入后 GitHub Pages 项目地址会跳转到自定义域名）。

## 写文章

```bash
npx hexo new "文章标题"     # 生成 source/_posts/文章标题.md
npm run server             # 本地预览
git add -A && git commit -m "post: 文章标题" && git push   # 两个平台都会自动构建
```

## DNS 速查

| 场景 | 记录 |
| --- | --- |
| Cloudflare Pages 自定义域名 | Cloudflare 自动创建 `CNAME` → `<project>.pages.dev`（代理开启） |
| GitHub Pages 自定义域名（apex） | `A` → `185.199.108.153` / `.109.153` / `.110.153` / `.111.153` |
| GitHub Pages 自定义域名（www） | `CNAME` → `008heshan.github.io` |

## 许可

文章内容版权归作者所有，主题与脚手架遵循各自的开源许可。
