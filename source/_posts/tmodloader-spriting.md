---
title: Spriting
description: 画贴图的基础：帧与贴图集、像素大小必须一致、帧间留白规则、朝向约定，以及发光贴图（glowmask）。
date: 2026-09-09 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Spriting](https://github.com/tModLoader/tModLoader/wiki/Spriting)。

贴图（sprite）就是 2D 游戏里随处可见的那种平面图像。拿金锭（Gold Bar）来说，它的物品贴图是 `Item_19.png`，长这样：![金锭的物品贴图](https://user-images.githubusercontent.com/4522492/159594962-1a594c3c-cd6c-4741-b60e-f8409461d845.png)。做模组时，你往游戏里加的每一处视觉内容，基本都得自己配一张贴图。下面讲的就是画贴图的基本功，以及贴图在 tModLoader 里是怎么组织、怎么被游戏读进去的。

## 帧（Frame）

很多贴图一张图里就塞了好几"帧"（frame），这种图一般叫 贴图（sprite），通常用来做动画或者做变体。比如 GiantBee 这个弹幕，它的贴图在解包出来的原版资源里是 `Projectile_566.png`。

程序员在代码里告诉了游戏这张图有 4 帧，游戏于是知道要把这张高 96 像素的图平均切成 4 段、每段 24 像素高；绘制这个弹幕时，就在这 4 帧之间循环切换。

也有些帧是用来做"变体"的。金属锭（Metal Bars）的贴图 `Tiles_239.png` 就是这种：所有金属锭物块（tile）共用这一张。

画物块贴图本身是个独立的大话题，先看 [Basic Tile](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile#framed-vs-frameimportant-tiles) 这篇，动手画之前再跟你的程序员确认具体细节。

## 文件格式

tModLoader 的贴图必须是 `.png`。只要你没在绘图软件里乱改设置，直接存成 `.png` 就行。

## 绘图工具

**必须**有一款像样的绘画 / spriting 软件。Windows 11 之前的"画图"（MS Paint）不行 —— 它存不了透明像素，而你想画的多数贴图都要用到透明。合适的软件清单见[基础准备篇的绘图软件一节](https://github.com/tModLoader/tModLoader/wiki/Basic-Prerequisites#drawing-program)。原文的示例用的是 Aseprite，不过这几款软件的能力都差不多，用哪个都行。

Aseprite 完整版要花钱，不过它也有可以自己编译的免费版本，100% 合法、没有安全隐患，编译方法看[这份说明](https://github.com/aseprite/aseprite/blob/main/INSTALL.md)。

其它推荐的 spriting 软件还有（不限于这些）：

* [Piskel](https://www.piskelapp.com/)
* [GIMP](https://www.gimp.org/)
* [LibreSprite](https://libresprite.github.io/#!/)
* [paint.NET](https://www.getpaint.net/)

## 原版贴图资源

开工前建议先把原版贴图解包到一个方便访问的文件夹，本篇统一用 `C:\Documents\My Games\Terraria\ModLoader\VanillaTextures`。解包步骤见[这篇指南](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Prerequisites#vanilla-texture-file-reference)。我们自己画东西时，就拿这些原版贴图当尺寸和朝向的参照。

如果只是想知道某个原版贴图有多大，可以查这份[文本文件](https://forums.terraria.org/index.php?attachments=sprite-information-spreadsheet-tsv.384515/)。

## 在游戏里实时改贴图

如果只是想微调某张物块或盔甲贴图，按"改图 → 重新构建模组 → 重载模组 → 进游戏看效果"这一圈走下来，非常费时间。有个叫 Modders Toolkit 的模组可以让你在游戏里直接改贴图，怎么用看下面这个视频。改完之后记得重新构建模组，否则改动不会保留。

<details><summary>实时编辑贴图演示视频</summary><blockquote>

**操作步骤：** 下载并启用 [Modders Toolkit](https://steamcommunity.com/sharedfiles/filedetails/?id=2573569299) 模组。进游戏后点左下角的小图标，找到写着 "Click to toggle Texture Tool" 的按钮点一下，纹理工具就出来了。在列表里点你正在做的那个模组，勾上 "Watch Mod Sources"。然后用绘图软件改图 —— 你保存的瞬间，Modders Toolkit 就会察觉变化并把游戏里的贴图更新掉。

https://github.com/tModLoader/tModLoader/assets/4522492/9da8b20d-3fa8-4fd8-9724-8e844364e868

</blockquote></details>

## 动手画贴图

### 2x2 像素

Terraria 的像素画风格里，每一个"像素"其实是 2x2 的一小块像素。你不一定要跟这个风格，但得知道有这回事。要跟的话有个省力的办法：先按 1x1 正常画，画完用"Nearest Neighbor"（邻近取样）把贴图整体放大 200%。注意这样一来留白（padding）也会从 2 像素变成 1 像素。

缩放时如果贴图变得不对劲，你可能听过一个词：mixel。mixel 指的就是一张图里混着不同大小的像素，画面因此不一致、显得脏乱。建议永远按 1x1 画、再放大成 2x2，别反过来，也别两种混着用。

还有个容易踩的坑：贴图显示得太小，有人会想用 `Item.scale` 直接把显示尺寸调大。把 1x1 的贴图当 2x2 用，这样确实有用；但本来就画成 2x2 的图还想再放大（比如当 4x4 用）就不可取了 —— 一是会像前面说的那样造出 mixel，二是它跟游戏里已有的 2x2 贴图对不上。

判断标准很简单：**同一张图里的像素块大小必须一致**，一致才显得干净；混着来画面就会脏乱。

### 尺寸

贴图的尺寸指的就是它的宽和高。比如宽 20 像素、高 20 像素，那就是一张 20x20 的贴图。

贴图在缩放之前的最大尺寸是 2048x2048 —— 换算成 2x2 像素风格，也就是作画时最大 1024x1024。

## 留白（Padding）

一张图里有多帧时，帧与帧之间靠留白（padding）隔开。Terraria 默认要求每帧之间留 2 像素：横向排列的帧，就是每帧下方留 2 像素，最后一帧下面也要留。

物块的留白则加在每帧的右侧和下方。

## 动画

动画就是把若干帧放进同一张贴图，注意各帧要等距排布。

动画通常是循环播放的，也可以做成自定义的循环方式。播放速度和规律由程序员在代码里决定，细节看单独的指南：

* [弹幕动画代码指南](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile#animationmultiple-frames)

## 朝向

Terraria 里很多东西的朝向是约定俗成的：NPC 贴图通常朝左，箭类弹幕朝上，法杖朝右上。跟着这些约定走是有实际好处的 —— 负责绘制的代码本来就假定贴图朝向固定，你不按约定画，碰撞箱和绘制效果都会变得很奇怪。拿不准就翻一张最接近的原版贴图照着看。

### 发光贴图（Glowmask）

发光贴图是单独的一张贴图，绘制时不受光照影响、始终按最大亮度画出来，武器上那种发光的部件一般就靠它。举个例子：VortexDrill 的物品贴图得周围有光才看得见，而它对应的发光贴图不管周围多暗都按最大亮度绘制。

做法就是把原贴图复制一份，把不该发光的像素全部删掉；至于怎么让它正确绘制出来，得由你的程序员写代码处理。

# 实例

这里实际画一把剑的贴图。先找一张尺寸接近的原版剑贴图当参照：去 Wiki 上查一把尺寸合意的武器，就拿 [Muramasa](https://terraria.wiki.gg/wiki/Muramasa) 好了。注意 Wiki 上的物品贴图和游戏里的实际贴图并不完全一样，别直接拿来用；要在信息框里找到 "Internal Item ID: ###" 来确定 ItemID，这里数字是 155，于是打开解包好的原版贴图，找到 `Item_155.png`，用绘图软件打开它，"另存为"到你放贴图的那个文件夹。接下来就可以在这张图上照着改，保持同样的朝向和大致尺寸，别忘了 2x2 像素这回事。这么画出来的剑，进游戏后和原版武器一样大 —— 这个例子里贴图是 58x58 像素。画得多了，各种实体的尺寸约定自然会记住，那时候不看原版贴图也能直接画。

# 把像素画画好

上面讲的偏技术：贴图是怎么组织的、怎么接进模组。如果你觉得画图这件事本身就吃力，找个会画画的朋友合作也是条路。真想自己练的话，网上的学习资源很多。[tModLoader Discord 服务器](https://discord.gg/tmodloader)里的 `#spriting` 频道就特别适合请教和求反馈，下面是几个额外的学习资源：

* [The Ultimate Pixel Art Tutorial（视频）](https://www.youtube.com/watch?v=lfR7Qj04-UA)

# 预乘 Alpha（Premultiplying贴图Alphas）

代码这边，Terraria 的绘制一般要求半透明贴图的 RGB 分量预先乘上它的 A（alpha）分量，这个概念叫预乘 alpha，详细解释见[这里](https://en.wikipedia.org/wiki/Alpha_compositing#Straight_versus_premultiplied)。说白了就是：半透明贴图在游戏里看着不对劲，就得做预乘。不同绘图软件的做法不一样：

- Paint.NET：用[这个插件](https://forums.getpaint.net/topic/113378-premultiply-alpha/)
- Aseprite：用[这个脚本](https://pastebin.com/stujFj2Z)
