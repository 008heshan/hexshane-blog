# Hexshane 的博客

基于 [Hexo](https://hexo.io/) + [NexT](https://theme-next.js.org/) 的静态博客，源码仓库 `hexshane-blog`，
通过 GitHub Actions / Cloudflare Pages 自动构建并部署。

- 自定义域名：<https://hexshane.top>
- GitHub Pages（阶段一）：<https://008heshan.github.io/hexshane-blog/>
- 仓库只提交源码，`public/` 由 CI 构建生成，不进入版本库

## 目录结构

```
.
├─ .github/workflows/pages.yml   # GitHub Pages 自动部署工作流
├─ source/_posts/                # 文章 Markdown
├─ source/{about,tags,categories}/index.md  # 独立页面
├─ _config.yml                   # Hexo 站点配置（url / root / 主题）
├─ _config.next.yml              # NexT 主题配置
├─ package.json / package-lock.json
└─ scaffolds/                    # 新建文章模板
```

## 本地开发

```bash
npm ci            # 安装依赖
npm run server    # 本地预览 http://localhost:4000
npm run build     # 生成静态站点到 public/
npm run clean     # 清理 public/ 与缓存
npx hexo new "标题"   # 新建文章
```

## 部署方式一：GitHub Pages（GitHub Actions）

1. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
2. 推送到 `main` 分支后，`.github/workflows/pages.yml` 会自动执行：
   `npm ci` → `npm run build` → 上传 `public/` → 发布到 GitHub Pages。
3. 项目站点地址为 `https://008heshan.github.io/hexshane-blog/`，
   因此 `_config.yml` 中设置：

   ```yaml
   url: https://008heshan.github.io/hexshane-blog
   root: /hexshane-blog/
   ```

## 部署方式二：Cloudflare Pages（切换目标）

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**，
   选择仓库 `008heshan/hexshane-blog` 和 `main` 分支。
2. 构建设置：

   | 项目 | 值 |
   | --- | --- |
   | Framework preset | Hexo |
   | Build command | `npm run build` |
   | Build output directory | `public` |
   | 环境变量 | `NODE_VERSION = 22` |

3. 在 **Custom domains** 中添加 `hexshane.top`（以及 `www.hexshane.top`）。
4. 域名需要托管在 Cloudflare：在域名注册商（当前为 Spaceship）处把 NS 改为
   Cloudflare 分配的两条名称服务器，等待 DNS 生效。
5. 切换到自定义域名后，把 `_config.yml` 改为：

   ```yaml
   url: https://hexshane.top
   root: /
   ```

   并把 `source/CNAME` 内容保持为 `hexshane.top`（GitHub Pages 侧识别自定义域名用）。

## DNS 速查

| 场景 | 记录 |
| --- | --- |
| GitHub Pages 自定义域名（apex） | `A` → `185.199.108.153` / `185.199.109.153` / `185.199.110.153` / `185.199.111.153` |
| GitHub Pages 自定义域名（www） | `CNAME` → `008heshan.github.io` |
| Cloudflare Pages 自定义域名 | 由 Cloudflare 自动创建 `CNAME` → `<project>.pages.dev`（代理开启） |

## 写文章

```bash
npx hexo new "文章标题"     # 生成 source/_posts/文章标题.md
npm run server             # 本地预览
git add -A && git commit -m "post: 文章标题" && git push   # 自动部署
```

## 许可

文章内容版权归作者所有，主题与脚手架遵循各自的开源许可。
