---
title: Basic Autoloading Guide
date: 2026-09-07 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic Autoloading Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Autoload)。

自动加载（autoload）本质上是 tModLoader 替你做的一次"合理猜测"：它按一套固定规律推断哪个东西该配哪张贴图，省掉你手写加载代码的功夫。基础篇只聊贴图的自动加载，因为这正是新手最关心、也最容易卡住的地方。

物品（`Item`）、弹幕（`Projectile`）、NPC 都要有贴图才能正常工作，其中任何一个没配上贴图，模组就**加载不起来**。tModLoader 没法凭空知道你想给谁配哪张图，但它能按自己熟悉的那套规律猜一把。

规律是这样的：

1. 起点是模组源码目录（Mod Sources）：`C:\Documents\My Games\Terraria\tModLoader\ModSources`
2. 接上这个类所在的命名空间，把命名空间里的 `.` 换成 `\`：`namespace ExampleMod.NPCs` → `C:\Documents\My Games\Terraria\tModLoader\ModSources\ExampleMod\NPCs`
3. 再接上类名，末尾补 `.png`：`public class FlutterSlime : ModNPC` → `C:\Documents\My Games\Terraria\tModLoader\ModSources\ExampleMod\NPCs\FlutterSlime.png`

一句话概括：到"类所属命名空间对应的文件夹"里，找文件名和类名相同的那个 `.png`。

落到实操上无非三件事：`.cs` 文件和 `.png` 文件放在同一个目录；`.cs` 里的类名和 `.png` 的文件名对得上；顺手让 `.cs` 文件自己的文件名也跟这两者保持一致，以后翻代码不容易认错。还有一个硬性条件 —— 从 Mod Sources 目录往下数的文件夹层级必须和命名空间完全一致（目录结构里，命名空间的 `.` 就写成 `\`）。

### 额外贴图

除了一张主贴图，某些类型的内容还会有别的贴图被自动加载。下面是最常见的几种：

- 饰品：如果它在玩家身上有绘制，类上会标注 `[AutoloadEquip(EquipType.Something)]`。这类物品要单独准备一张贴图，文件名后缀对应装备类型，比如 `_Back`、`_Shield`。
- 城镇 NPC 与 Boss：类上分别标注 `[AutoloadHead]`、`[AutoloadBossHead]` 时，会自动加载后缀为 `_Head`、`_Head_Boss` 的贴图 —— 画在小地图上的那个头像就是它们。
- 物块：设了 `TileID.Sets.HasOutlines` 的物块会自动加载后缀为 `_Highlight` 的贴图，里面是智能交互（smart interact）时显示的轮廓高亮。
- 坐骑与矿车：它们本身也需要贴图。另外，后缀为 `_Back`（画在玩家身后）、`_Front`（画在玩家身前）以及[其它类型](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/ModLoader/MountTextureType.cs)的附加贴图同样会被自动加载；坐骑想正常工作，至少得有其中一张。

# 音乐

音乐文件得放在名为 `Music` 的文件夹或其子文件夹里，才会被当作音乐自动加载。不满足这个条件的文件，模组作者可以用 `MusicLoader.AddMusic` 手动加进来。

# 背景

背景贴图的规矩一样：文件放在名为 `Backgrounds` 的文件夹或其子文件夹中，才会被自动加载成背景贴图。不符合条件的贴图，用 `BackgroundTextureLoader.AddBackgroundTexture` 手动加载。
