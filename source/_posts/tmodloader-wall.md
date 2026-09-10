---
title: Wall Guide
date: 2026-08-16 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Wall Guide](https://github.com/tModLoader/tModLoader/wiki/Wall)。

# 什么是墙壁？

墙壁（wall）本身没什么绕弯的地方，做一面墙基本就是照着现成的模式走一遍。跟物块（tile）一样，一面墙由两部分组成：负责把它放下去的 `ModItem`，以及墙本体的 `ModWall`。

## 墙壁与物品的配对

`Item.createWall` 设成某个 `ModWall` 的 `WallType`，这件物品放下时就会生成那面墙；反过来，`ModWall` 通常也要指回对应的 `ModItem`。如果放置用的物品和这面墙该掉落的物品是同一件，这套配对是自动完成的，不用你操心；否则得在 `ModWall.SetStaticDefaults` 里写一句 `RegisterItemDrop(ModContent.ItemType<ItemName>());`，手动把掉落物指定上。

# 基础示例

ExampleMod 里的 `ExampleWall` 就是最基础的例子，一共 4 个文件：

- [ExampleMod/Content/Walls/ExampleWall.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Walls/ExampleWall.cs) —— `ModWall` 类本体
- [ExampleMod/Content/Walls/ExampleWall.png](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Walls/ExampleWall.png) —— 这面墙的贴图
- [ExampleMod/Content/Items/Placeable/ExampleWall.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Placeable/ExampleWall.cs) —— 负责放置 `ExampleWall` 的 `ModItem` 类
  - 注意：`ModWall.SetStaticDefaults` 里的 `Item.DefaultToPlacableWall(ModContent.WallType<Walls.ExampleWall>());` 会自动设好 `Item.createWall`，以及墙壁物品共有的其它属性。
- [ExampleMod/Content/Items/Placeable/ExampleWall.png](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Placeable/ExampleWall.png) —— `ExampleWall` 这件 `ModItem` 的贴图

`ExampleWallUnsafe` 同样是基础例子，不过只有 2 个文件：`ModWall` 类和它的贴图。它没有能放置自己的物品，所以用 `RegisterItemDrop` 注册掉落物。

# 进阶示例

动画、自定义拼接和光照的进阶写法，见 [ExampleMod/Content/Walls/ExampleWallAdvanced.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Walls/ExampleWallAdvanced.cs)。

# 贴图

墙壁贴图被切成了若干分区，用来应付“周围哪些邻居是同一种墙”的各种方位。每个方位都有 3 个可选样式；中心方位是个例外，它有 15 个 —— 也就是 5 个分区各 3 个样式，多出来的这些变化是为了打散重复图案。这些分区叫 `style`，分区里的每个样式叫 `WallFrameNumber`。`ExampleWall` 是照着 `Gemspark` 墙做的，因为它足够好懂。想要更细的例子，去翻[现成的墙壁贴图](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Prerequisites#vanilla-texture-file-reference)。

![ExampleWall 的完整贴图：按方位切成的多个 style 分区，每个分区里排着若干个 WallFrameNumber 样式](/img/posts/tmodloader-wall/ExampleWall.png)

如果用上 `Main.wallLargeFrames`，每个 `style` 还会再多出第 4 个 `WallFrameNumber`，变化更丰富。它的模板长这样：

![Main.wallLargeFrames 使用的模板：每个 style 在前三个样式之外又多一个 WallFrameNumber](/img/posts/tmodloader-wall/191140372-60a897bf-f69c-4615-bab5-57cefc84066c.png)

下面这张图说明 `Main.wallLargeFrames` 取 1（“Phlebas”）和 2（“Lazure”）时，铺出来的是固定套路，而不是随机拼的：

![同一批贴图在 wallLargeFrames 取 1（Phlebas）与取 2（Lazure）时铺出的固定图案](/img/posts/tmodloader-wall/193192050-91e6502d-8f39-4c28-8221-297562ca0f51.png)

## 动画墙壁

墙壁做成动画时，这套模板会在贴图里重复好几遍。注意：只有不用 `Main.wallLargeFrames` 的墙支持这么做。

![动画墙壁的贴图：同一套模板重复排列了多份](/img/posts/tmodloader-wall/191140761-06536d43-3b87-4ffc-b036-d3b9cf1739f0.png)

# 墙壁属性

在 `ModWall.SetStaticDefaults` 里能填不少数据，它们会影响这面墙的行为。

### Main.wallHouse

为 `true` 时，这面墙算安全墙，很多地方都会参考它。

### Main.wallDungeon

为 `true` 时，这面墙算地牢墙。

### Main.wallLight

为 `true` 时光会从背景透进来，栅栏、玻璃就属于这种。

### Main.wallLargeFrames

取 1 用 “Phlebas” 图案（Plating 那一类墙），取 2 用 “Lazure” 图案。两者都会用到第 4 个 `WallFrameNumber`。

### Main.wallBlend

赋成某个已知的 `WallID`，就能跟风格相近的墙拼在一起。比如墙的不安全版本里可以写 `Main.wallBlend[Type] = ModContent.WallType<MyWallSafe>();`。反过来就别在安全版本上再写一遍 —— 两面墙里只设其中一边。

# 让墙壁动起来

前面说过，动画墙的贴图里有好几份模板。动起来的节奏和图案，交给 `ModWall.AnimateWall` 这个钩子决定。

## 示例

下面这段让 7 帧动画循环播放，每 10 帧换一帧。想做来回摆动或更花哨的图案，多花点功夫也能实现。

```cs
public override void AnimateWall(ref byte frame, ref byte frameCounter) {
	frameCounter++;
	if (frameCounter >= 10) {
		frameCounter = 0;
		frame++;
		if (frame >= 7)
			frame = 0;
	}
	// Or, more succinctly:
	if (++frameCounter >= 10) {
		frameCounter = 0;
		frame = (byte)(++frame % 7);
	}
}
```

# 安全墙与不安全墙

Terraria 里很多墙都有安全和不安全两套。安全版就是玩家挖掉不安全版之后拿到手、能自己放下的那种；不安全版基本只出现在世界生成阶段，玩家放不了，但会参与 NPC 生成（NPC spawning）的计算。把两者拆开，玩家挖墙回去做装饰时，就不用担心在自己家里刷出某些敌怪。只要你的模组里有逻辑会参考墙壁类型来刷 NPC，这个套路就值得照抄。

# 自定义拼接

有了 `ModTile.WallFrame`，拼接逻辑想怎么写都行。这段出自 [ExampleWallAdvanced](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Walls/ExampleWallAdvanced.cs#L48) 的例子，把第 1 个样式的权重调得比另外两个更高：

![三种 WallFrameNumber 样式铺出来的实际墙面效果](/img/posts/tmodloader-wall/191853500-0208243b-68cd-4302-8984-79d5c2f81468.png)

```cs
public override bool WallFrame(int i, int j, bool randomizeFrame, ref int style, ref int frameNumber) {
	if (randomizeFrame) {
		// Here we make the chance of WallFrameNumber 0 very rare, just for visual variety: https://i.imgur.com/9Irak3p.png
		if (frameNumber == 0 && WorldGen.genRand.NextBool(3, 4)) {
			frameNumber = WorldGen.genRand.Next(1, 3);
		}
	}
	return base.WallFrame(i, j, randomizeFrame, ref style, ref frameNumber);
}
```

它跟 `WallID.Cog` 的贴图很像，可以放在一起对照着看 —— 注意其中 `WallFrameNumber` 为 0 的情况有多罕见。

## 别拿它当游戏逻辑

拼接只负责好看，别让它参与游戏逻辑：拼接结果并不同步，每个玩家看到的图案是各自的。

# 相关参考

- [Vanilla WallIDs](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs#wall-ids)
- [ModWall Documentation](https://docs.tmodloader.net/docs/stable/class_mod_wall.html)
- [ModBlockType Documentation](https://docs.tmodloader.net/docs/stable/class_mod_block_type.html) —— 里面还有 `ModTile` 和 `ModWall` 共有的其它方法和属性。
