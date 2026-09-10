---
title: Coordinates
date: 2026-09-06 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Coordinates](https://github.com/tModLoader/tModLoader/wiki/Coordinates)。

# 坐标系统

写物块（Tile）、弹幕（Projectile）或者绘制相关的代码时，很多人会被 Terraria 里五花八门的坐标系绕晕。这篇把它们一个个讲清楚。

## 共同点

所有坐标系都共享同一条规则：X 轴从左向右递增，Y 轴从上向下递增，**向下是 Y 的正方向，向上是 Y 的负方向**。每个坐标系的原点，都落在它所描述对象的左上角。

## 世界坐标

玩家、NPC、弹幕（Projectile）、粒子（Dust）用的都是世界坐标（World Coordinates）。它通常写成 `Vector2`，也就是说 `X` 和 `Y` 都是 `float`，可以带小数 —— `3943.23`、`2334.213` 这种非整数完全合法。屏幕缩放为 100% 时，显示器上的 1 像素恰好等于世界空间的 1 个单位；世界坐标 `0, 0` 就落在整个世界的左上角。

## 物块坐标

物块用的是物块坐标（Tile Coordinates），它只出现在与物块相关的方法以及 `Main.tile` 数组里。物块坐标一般用 `Point` 或 `Point16` 表示，因此 `X`、`Y` 必须是整数。

## 屏幕坐标

屏幕坐标（严格说是窗口坐标）用于在屏幕上绘制内容、摆放 UI 元素这类场合。手动绘制实体时最常犯的错误，就是直接拿实体自身的位置去画 —— 这样画不对，因为绘制代码只认屏幕空间坐标，不认世界坐标。想把东西画在正确的位置，记得先减去 `Main.screenPosition`。

### 绘制物块

物块并不一定总是画在屏幕上的同一处。如果你在写 `ModTile.SpecialDraw`、`PostDraw` 或 `PreDraw`，代码里要先写上 `Vector2 zero = Main.drawToScreen ? Vector2.Zero : new Vector2(Main.offScreenRange);`，然后给每一处 `spriteBatch.Draw` 调用都加上这个 `zero`。这么做是为了兼容切换光照模式（Lighting mode）时绘制坐标发生的偏移。按 `Shift+F9` 可以快速切换光照模式，方便验证你的代码在各种模式下都画得对。

## 坐标转换

### 物块 <--> 世界坐标

每个物块占据世界坐标空间里 16x16 的一块区域。把物块坐标乘以 16，得到的世界坐标就指向该物块的左上角。用 `Vector2.ToWorldCoordinates` 能把这段计算简化掉；`Point.ToWorldCoordinates` 还会自动给 X 和 Y 各加 8，直接返回物块中心的世界坐标。

```cs
// Finding the tile exactly behind the player.
Point tileLocation = Main.LocalPlayer.Center.ToTileCoordinates();
Tile tile = Main.tile[tileLocation.X, tileLocation.Y];
Tile theSameTile = Main.tile[tileLocation]; // Point and Point16 can be used to index directly into Main.tile

// Spawning dust in World coordinates from the tiles Tile coordinates
Point16 position = new Point16(i, j);
Dust.NewDustDirect(position.ToWorldCoordinates(), 4, 4, dustChoice, 0f, 0f, 100, default, 1f);
```

### 世界坐标 <--> 屏幕坐标

手动绘制物块时，要记得前面提到的 `Main.drawToScreen`。

## 相关字段

### Main.MouseWorld

鼠标当前位置的世界坐标。遗憾的是，它不支持缩放（zoom）。

### Main.MouseScreen

鼠标的屏幕坐标。`Main.mouseX` 和 `Main.mouseY` 取的就是同一个值。

# 示例

（原文这里配了一张示意图，用来直观演示下面的换算过程；搬运时该图未能本地化，故略去。）

这个例子的换算过程是这样的：白色线条画出物块的格子范围，红点标出各个物块换算成世界坐标后落在哪里。右下角那个物块的物块坐标是 `3548, 256`，乘以 16 就得到世界坐标 `56768, 4096`。蜗牛的位置显示在黄框里 —— 实体的坐标锚在它自己的左上角，所以把刚才那个物块的世界坐标再加上 `0, 16`，得到 `56768, 4112`，和上面那只蜗牛的头顶位置非常接近（那只蜗牛实际还比这个点往右偏了 1 像素）。

再补两个实际会用到的例子：

```cs
// spawn 50 coordinates above the player center
Vector2 spawnPosition = player.Center + new Vector2(0, -50);

// Tile coordinates are used to index tiles in the world, here given an `i` and `j` representing X and Y
Tile tileLeft = Main.tile[i - 1, j];
```
