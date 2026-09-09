---
title: 你好，Hexo
date: 2026-09-09 17:07:00
updated: 2026-09-09 17:07:00
tags:
  - Hexo
  - 博客
categories:
  - 建站
---

欢迎来到 **Hexshane 的博客** 🎉

这个站点由 [Hexo](https://hexo.io/) 驱动，主题为 [NexT](https://theme-next.js.org/)，
源码托管在 GitHub，并通过 GitHub Actions / Cloudflare Pages 自动构建部署。

## 常用命令

```bash
# 本地预览（http://localhost:4000）
npm run server

# 新建文章
npx hexo new "文章标题"

# 清理并重新生成静态文件
npm run clean && npm run build

# 只提交源码，推送后由 CI 自动构建部署
git add -A && git commit -m "post: 新文章" && git push
```

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `source/_posts/` | 文章 Markdown 源文件 |
| `source/` | 页面、图片等静态资源 |
| `themes/` | 自定义主题（当前使用 npm 安装的 `hexo-theme-next`） |
| `_config.yml` | 站点主配置 |
| `_config.next.yml` | NexT 主题配置 |
| `public/` | 生成的静态站点（已被 `.gitignore` 忽略） |

## 下一步

- 在 `_config.yml` 中完善站点标题、作者、关键词
- 在 `_config.next.yml` 中调整菜单、社交链接、配色
- 写第一篇文章，然后 `git push` 等待自动部署
