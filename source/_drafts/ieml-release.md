---
title: IEML
date: 2026-09-11 12:00:00
updated: 2026-09-11 12:00:00
comments: false
---

<div id="ieml-page" class="pp">

  <!-- ============ Hero ============ -->
  <section class="pp-hero">
    <div class="pp-hero__head">
      <span class="pp-hero__kind">Minecraft 启动器 · Rust + Tauri 2</span>
      <h1 class="pp-hero__title">IEML</h1>
      <p class="pp-hero__tagline">极简 Minecraft 启动器 —— 不做"功能最多"，做<strong>最快、最小、最好用</strong>的那个。</p>
    </div>
    <div class="pp-hero__meta">
      <span class="pp-badge pp-badge--ver">v0.1.0</span>
      <span class="pp-hero__dot">·</span>
      <span>Windows x64</span>
      <span class="pp-hero__dot">·</span>
      <span>安装包 2.40 MB / 绿色版 6.59 MB</span>
      <span class="pp-hero__dot">·</span>
      <span>主进程内存 30.5 MB</span>
    </div>
    <div class="pp-actions">
      <a class="pp-btn pp-btn--primary" href="#pp-download"><i class="fas fa-download"></i> 下载 v0.1.0</a>
      <a class="pp-btn" href="#pp-features">看看它能做什么</a>
      <a class="pp-btn" href="#pp-changelog">更新日志</a>
    </div>
  </section>

  <!-- ============ 为什么是它 ============ -->
  <section class="pp-section" id="pp-features">
    <h2 class="pp-h2">为什么值得一装</h2>
    <div class="pp-grid">
      <div class="pp-card">
        <i class="fas fa-feather pp-card__icon"></i>
        <h3>真的小</h3>
        <p>NSIS 安装程序 <b>2.40 MB</b>、绿色版裸 exe <b>6.59 MB</b>。用系统自带的 WebView2，不打包 Chromium（Electron 光壳就约 150 MB）。前端产物 355 kB，gzip 后约 110 kB。</p>
      </div>
      <div class="pp-card">
        <i class="fas fa-microchip pp-card__icon"></i>
        <h3>内核是 Rust</h3>
        <p>zip 解压、SHA1 边下边算、并发下载、进程管理全在 Rust 侧；主进程工作集 <b>30.5 MB</b>。界面用 React 18 + TypeScript + Vite，样式手写不引 UI 框架。</p>
      </div>
      <div class="pp-card">
        <i class="fas fa-gauge-high pp-card__icon"></i>
        <h3>真下载、真启动</h3>
        <p>不是演示壳：实际下过 1.20.1（<b>912 条版本清单 → 88 个库 → 3598 个资源文件</b>，355 秒、峰值 67 MB/s）并真实启动，日志里 <b>7/7 初始化标记</b>全部命中。</p>
      </div>
      <div class="pp-card">
        <i class="fas fa-life-ring pp-card__icon"></i>
        <h3>「装完之后」那一半也有</h3>
        <p>日志 / 控制台 / 崩溃分析 / 启动失败界面 / 停止游戏都在。崩溃首屏给的是<b>原因 + 建议动作</b>而不是堆栈；导出报告自动脱敏，并明确告诉你处理了哪些敏感信息。</p>
      </div>
      <div class="pp-card">
        <i class="fas fa-layer-group pp-card__icon"></i>
        <h3>加载器按三层理解</h3>
        <p>基础加载器（Forge / NeoForge / Fabric / Quilt）<b>严格单选</b>，OptiFine、LiteLoader 是受约束的附加层，Fabric API 这类前置包<b>自动补齐</b>。不可用的组合会给出具体理由，不是一个灰色复选框。</p>
      </div>
      <div class="pp-card">
        <i class="fas fa-ban pp-card__icon"></i>
        <h3>Mod 绝不偷偷更新</h3>
        <p>Mod、API、游戏版本、加载器是四角绑定，任何一角变动都可能让游戏起不来 —— 所以启动器只在后台检查并打角标，<b>更新永远要你手动点</b>，旧文件先进回收站。</p>
      </div>
    </div>
  </section>

  <!-- ============ 界面 ============ -->
  <section class="pp-section">
    <h2 class="pp-h2">界面</h2>
    <div class="pp-shots">
      <figure class="pp-shot"><img src="/img/ieml/versions.png" alt="版本列表页：一行一个版本，整行可点进入版本二级页"><figcaption>版本列表 · 一行一个版本，整行可点</figcaption></figure>
      <figure class="pp-shot"><img src="/img/ieml/overview.png" alt="版本概览页：全是动作，补全文件 / 查看日志 / 图标与名称 / 复制版本"><figcaption>版本概览 · 只有动作，没有一个是"值"</figcaption></figure>
      <figure class="pp-shot"><img src="/img/ieml/mods.png" alt="Mod 管理页：筛选、搜索、启用禁用、更新、批量"><figcaption>Mod 管理 · 筛选 / 启停 / 批量</figcaption></figure>
      <figure class="pp-shot"><img src="/img/ieml/light-theme.png" alt="浅色主题下的版本列表页"><figcaption>浅色主题</figcaption></figure>
    </div>
    <p class="pp-note">界面结构参照 PCL2 的「正副级页面」：一级侧栏固定 4 项，进入某个版本后整条侧栏换成<b>该版本的二级页</b> —— 「我在第几层」由侧栏自己回答。</p>
  </section>

  <!-- ============ 当前版本 ============ -->
  <section class="pp-section">
    <h2 class="pp-h2">当前版本</h2>
    <div class="pp-meta">
      <div class="pp-meta__row"><span>版本号</span><b>v0.1.0</b></div>
      <div class="pp-meta__row"><span>平台</span><b>Windows x64（macOS / Linux 未实测）</b></div>
      <div class="pp-meta__row"><span>安装程序</span><b>IEML_0.1.0_x64-setup.exe · 2.40 MB</b></div>
      <div class="pp-meta__row"><span>绿色版</span><b>ieml.exe · 6.59 MB</b></div>
      <div class="pp-meta__row"><span>技术栈</span><b>Rust · Tauri 2.x · React 18 · TypeScript · Vite</b></div>
      <div class="pp-meta__row"><span>依赖</span><b>系统 WebView2（Win11 自带）</b></div>
      <div class="pp-meta__row"><span>测试</span><b>200+ 项自动化测试（类型 / 前端 / 端到端 / Rust）</b></div>
    </div>
  </section>

  <!-- ============ 功能状态（诚实表） ============ -->
  <section class="pp-section">
    <h2 class="pp-h2">功能状态：能做什么，不能做什么</h2>
    <p class="pp-note">发布页最容易骗人的地方就是把"打算做"写成"已支持"。所以这里分成两栏，<b>没做完的照实写</b>。</p>
    <div class="pp-two">
      <div class="pp-card">
        <h3><i class="fas fa-circle-check pp-ok"></i> 已经能用</h3>
        <ul class="pp-list">
          <li>真实下载与真实启动（1.20.1 实测通过）</li>
          <li>自动获取 Java（Adoptium，带 SHA256 校验与实跑验证）</li>
          <li>微软账号登录（设备码流程，令牌进系统密钥环）</li>
          <li>离线模式</li>
          <li>Fabric / Quilt 安装（profile JSON）</li>
          <li>Mod 管理：扫描 / 状态判定 / 启停 / 批量</li>
          <li>崩溃分析与脱敏导出</li>
          <li>版本隔离、内存自动分配（数字是算出来的并给依据）</li>
        </ul>
      </div>
      <div class="pp-card">
        <h3><i class="fas fa-circle-exclamation pp-warn"></i> 还没做完</h3>
        <ul class="pp-list">
          <li>Forge / NeoForge 官方安装器执行 —— <b>当前会明确拒绝并说明原因，不假装成功</b></li>
          <li>整合包（.mrpack）：清单解析已通，建实例 / 按清单下载 / 覆盖文件未完成</li>
          <li>从 Modrinth 直接下载 Mod 放进 mods/</li>
          <li>暂停按钮：引擎支持断点续传，界面还没做</li>
          <li>macOS / Linux 未实测</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- ============ 更新日志 ============ -->
  <section class="pp-section" id="pp-changelog">
    <h2 class="pp-h2">更新日志</h2>
    <ol class="pp-log">
      <li class="pp-log__item">
        <div class="pp-log__head"><b>v0.1.0</b><span class="pp-log__date">2026-09</span><span class="pp-log__tag pp-log__tag--new">首个公开发布</span></div>
        <ul>
          <li>从零构建的启动器骨架：Rust 内核 + Tauri 2 外壳 + React 前端，三层架构（UI / bridge / domain）</li>
          <li>真实下载链路打通：版本清单 → 库（按架构过滤）→ 资源文件 → natives 解压</li>
          <li>真实启动：参数拼装、进程管理、stdout/stderr 重定向到日志、游玩时长统计</li>
          <li>PCL2 式正副级页面结构（一级 4 项 / 二级整条替换），深浅两套主题</li>
          <li>加载器三层模型与兼容性规则、Mod 四角绑定与手动更新策略</li>
          <li>崩溃分析 + 脱敏导出、镜像默认源（BMCLAPI）</li>
        </ul>
      </li>
    </ol>
  </section>

  <!-- ============ 下载 ============ -->
  <section class="pp-section" id="pp-download">
    <h2 class="pp-h2">下载</h2>
    <div class="pp-download">
      <a class="pp-dl" href="#"><i class="fas fa-file-zipper"></i><b>安装程序 · 2.40 MB</b><span class="pp-ph">待填：NSIS 安装包下载地址</span></a>
      <a class="pp-dl" href="#"><i class="fas fa-hard-drive"></i><b>绿色版 · 6.59 MB</b><span class="pp-ph">待填：裸 exe 下载地址</span></a>
      <a class="pp-dl" href="#"><i class="fab fa-github"></i><b>源码 / 发布页</b><span class="pp-ph">待填：仓库或 Release 链接</span></a>
    </div>
  </section>

  <!-- ============ 常见问题 ============ -->
  <section class="pp-section">
    <h2 class="pp-h2">常见问题</h2>
    <details class="pp-faq" open>
      <summary>和 PCL2 / HMCL 比，它凭什么存在？</summary>
      <p>不拼功能数量。同一件事上它只做三个取舍：体积小一个量级、内核放 Rust、界面按"正副级页面"重新组织过。加载器兼容性、Mod 更新策略这些规则是从 PCL2 / HMCL 的实现里读出来重写的，不是拍脑袋。</p>
    </details>
    <details class="pp-faq">
      <summary>为什么必须联网才能下游戏？官方源不是很慢吗？</summary>
      <p>本机实测 <code>maven.fabricmc.net</code>、<code>maven.neoforged.net</code>、<code>maven.quiltmc.org</code>、<code>api.curseforge.com</code> <b>全部不可达</b>，所以 <b>BMCLAPI 是默认下载源</b>，Mojang 官方源作为可选。</p>
    </details>
    <details class="pp-faq">
      <summary>会给 Mod 自动更新吗？</summary>
      <p>不会。Mod、API、游戏版本、加载器是四角绑定，任何一角变动都可能让游戏起不来。启动器只在启动时检查并打角标，更新永远需要你手动点，旧文件先进回收站。</p>
    </details>
    <details class="pp-faq">
      <summary>崩溃日志导出会不会泄露账号信息？</summary>
      <p>导出前会自动脱敏（账号令牌 / 用户名 / IP），并且会<b>主动告诉你处理了什么</b>，而不是默默替换掉。</p>
    </details>
  </section>

  <!-- ============ 反馈 ============ -->
  <section class="pp-section pp-section--foot">
    <h2 class="pp-h2">反馈与支持</h2>
    <p>用着有问题、有想法，或者想催某个"还没做完"的功能，直接找我：<a href="https://github.com/008heshan">GitHub</a> ·
      <a href="https://space.bilibili.com/448793040">B 站</a> ·
      <a href="https://www.douyin.com/user/MS4wLjABAAAAVagbpZnsrACyaBI9a3H_FS4x3muOxK-DSPu4ddC7kz4">抖音</a></p>
  </section>

</div>
