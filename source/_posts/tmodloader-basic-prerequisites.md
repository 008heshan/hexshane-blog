---
title: Basic Prerequisites
description: 动手写模组之前的三样准备：看得懂 C# 基本语法、一个称手的文本编辑器、一个能存透明像素的绘图软件。
date: 2026-09-10 20:40:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic Prerequisites](https://github.com/tModLoader/tModLoader/wiki/Basic-Prerequisites)。

动手写代码之前，先把三样东西备齐：**看得懂 C# 基本语法**、**一个像样的文本编辑器**、**一个能画像素图的绘图软件**。这篇是基础系列的开场准备，看后面的指南之前先过一遍。

# C# 语法

基础篇不要求你会写多复杂的程序，但 C# 的基本语法得心里有数 —— 不然接下来那些 `class`、`override`、`if` 会看得一头雾水。建议先花点时间过一遍：

- [C# 基础语法教程](https://www.tutorialspoint.com/csharp/csharp_basic_syntax.htm)

# 文本编辑器

系统自带的记事本够用，但不够好用。你需要的编辑器至少要能**多标签打开文件、语法高亮、显示行号**，最好还能装插件、自定义快捷键 —— 这些都会让写模组顺手很多：

- [Notepad++](https://notepad-plus-plus.org/) —— 仅 Windows，轻快
- [Sublime Text](https://www.sublimetext.com/) —— 跨平台，开大文件很快
- [Vim](http://www.vim.org/) —— 键盘流，学习曲线陡
- [Visual Studio Code](https://code.visualstudio.com/) —— 跨平台，插件生态最大
- [GNU Emacs](https://www.gnu.org/software/emacs/) —— 能配置到极致

用 Notepad++ 打开一个 `.cs` 文件和用记事本打开，差距一眼可见：关键字高亮、行号、多标签，这些正是"看一眼就知道自己在哪"的东西。

# 要不要直接上 Visual Studio？

先别急。IDE（集成开发环境）留到[中级准备篇](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Prerequisites)再讲。如果你已经会写程序、或者有信心，也可以跳过文本编辑器这一步直接用 IDE；不过本篇之后的基础指南，用普通编辑器完全跟得上。

# 绘图软件

模组里的贴图（sprite）都得靠它画出来。有个坑先说清楚：**Windows 11 之前的"画图"不能用**，它存不了透明像素，画出来的图一进游戏就是一块白底。

常用的几款：

- [Krita](https://krita.org/en/) —— 免费开源，画像素画够用，[参考视频](https://youtu.be/OmnpKQITm3I)
- [GIMP](https://www.gimp.org/) —— 免费开源、功能很全，但初始配置有点绕，[视频演示](https://youtu.be/s8HDwkXq6jk?t=65)
- [Inkscape](https://inkscape.org/) —— 矢量绘图，更适合画图标类素材，[参考视频](https://www.youtube.com/watch?v=Se7WVuyIEnU)
- [Adobe Photoshop](https://www.adobe.com/products/photoshop.html) —— 功能强，但贵，而且本来不是为像素画设计的
- [Piskel](http://www.piskelapp.com/) —— 免费、在线，spriter 圈子里很流行
- [Aseprite](https://github.com/aseprite/aseprite) —— 开源（自己编译免费），也可以在 [Steam](https://store.steampowered.com/app/431730/Aseprite/) 上付费买；专为像素画而生，上手很直观

# 下一步

准备齐了就往下走：[Basic tModLoader Modding Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Modding-Guide)，先照着把最小可运行的模组跑起来，再回来看后面的基础篇。
