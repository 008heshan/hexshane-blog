---
title: Basic ModDust Guide
date: 2026-08-29 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic ModDust Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Dust)。

粒子（Dust）就是那些给武器和各种效果添上视觉细节的小粒子。有一点得先说死：**粒子纯粹是视觉表现，永远不该拿它当游戏机制**。因为 Terraria 生成多少粒子取决于玩家电脑的性能，配置吃紧时数量就会被削减 —— 把伤害判定、状态切换之类的东西挂在这些粒子上，换台机器结果就不一样了。

每颗粒子都配了一张贴图，还各自带着一套行为：有的受重力影响，有的不受；有的像被风卷起的碎屑那样乱飘，有的一直走直线。这些行为都写死在粒子自己身上，不是调用的时候现配的。

# 使用粒子

生成粒子就是调用下面这几个方法：

```c#
public static int NewDust(Vector2 Position, int Width, int Height, int Type, float SpeedX = 0f, float SpeedY = 0f, int Alpha = 0, Color newColor = default(Color), float Scale = 1f);
public static Dust NewDustDirect(Vector2 Position, int Width, int Height, int Type, float SpeedX = 0f, float SpeedY = 0f, int Alpha = 0, Color newColor = default(Color), float Scale = 1f);
public static Dust NewDustPerfect(Vector2 Position, int Type, Vector2? Velocity = null, int Alpha = 0, Color newColor = default(Color), float Scale = 1f);
```

`NewDust` 用得最多；`NewDustPerfect` 跳过了生成位置的随机化（就在你给的坐标上冒出来），某些场合反而更顺手。另一个容易踩的差别在返回值：`NewDust` 返回的是这颗粒子在 `Main.dust` 数组里的下标，另外两个直接把 `Dust` 实例交给你。

看几个例子：

```c#
// Spawning a modded dust from an npc method
Dust.NewDust(npc.position, npc.width, npc.height, ModContent.DustType<Sparkle>());

// Spawning a vanilla dust from an npc method, using DustID
Dust.NewDust(npc.position, npc.width, npc.height, DustID.Granite);

// Spawning a vanilla dust from an npc method, using DustID number (less readable)
Dust.NewDust(npc.position, npc.width, npc.height, 240);

// Spawning a random vanilla confetti dust
int dustType = Main.rand.Next(DustID.Confetti_Blue, DustID.Confetti_Yellow + 1);
int dustIndex = Dust.NewDust(npc.position, npc.width, npc.height, dustType);

// Spawn dust 73 (DustID.PinkFairy) in ModProjectile.AI, but only 1/6th of the time (so it is less frequent). Also, scaling down velocity.
if (Main.rand.Next(6) == 0)
{
	int dustnumber = Dust.NewDust(projectile.position, projectile.width, projectile.height, DustID.PinkFairy, 0f, 0f, 200, default(Color), 0.8f);
	Main.dust[dustnumber].velocity *= 0.3f;
}

// Use a for loop to spawn a lot of dust at once. Here is a Magic Mirror style dust spawning. 
for (int d = 0; d < 70; d++)
{
	Dust.NewDust(player.position, player.width, player.height, DustID.MagicMirror, 0f, 0f, 150, default(Color), 1.5f);
}
```

几个要点：`Position`、`Width`、`Height` 三个参数划出一个矩形，粒子会在这个矩形范围内随机取点冒出来。生成原版粒子和生成自己模组的粒子，差别只在第 4 个参数 —— 平时填数字或者 `DustID` 里的成员，换成 `ModContent.DustType<DustName>()` 就是你自己写的那颗。剩下那些可选参数不需要就省略。

# 特殊图案

想让粒子摆出图案，靠的是 [Geometry](https://github.com/tModLoader/tModLoader/wiki/Geometry) 那篇里的几何知识：可以一口气生成一批粒子，也可以分好几次游戏更新陆续生成，用一堆粒子拼出你要的形状。

# 查找原版粒子

原版粒子是排在一张大对照表里的，读法是：从左往右、编号从 0 开始，每行排满 100 颗；纵向上每个位置其实是同一颗粒子的 3 帧动画叠在一起，整张表一共 3 行。

完整清单也可以查 [Terraria Wiki 的 Dust IDs 页面](https://terraria.wiki.gg/wiki/Dust_IDs)。有些原版粒子官方压根没给名字，tModLoader 自己补了一批；如果官方 wiki 上找不到某个内部名，就去 [DustID.TML.cs](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/ID/DustID.TML.cs) 里翻，缺的名字都写在那儿。

不过真要挑粒子，最省事的做法还是装一个 [Modders Toolkit](https://forums.terraria.org/index.php?threads/modders-toolkit-a-mod-for-modders-doing-modding.55738/)，用它的粒子生成工具边看效果边找，需要哪颗当场就能定位。

粒子工具演示视频：

https://github.com/tModLoader/tModLoader/assets/4522492/0d42395f-3b38-43c6-9693-c096ce71ac7c

# ModDust

`ModDust` 是自定义粒子的基类，自己写的粒子都要继承它。原版粒子的贴图一律是 10x30 像素、纵向叠着同一颗粒子的 3 帧动画；`ModDust` 没这个限制，尺寸多大、几帧都随你。ExampleMod 里有很多不同写法的现成例子，照着改最快。
