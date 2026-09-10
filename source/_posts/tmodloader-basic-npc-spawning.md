---
title: Basic NPC Spawning
description: 刷怪概率 SpawnChance 的写法：生物群系、高度、时间、难度等条件的组合，以及平衡与常见错误。
date: 2026-09-05 16:30:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic NPC Spawning](https://github.com/tModLoader/tModLoader/wiki/Basic-NPC-Spawning)。

刷怪这件事，说到底就是三个问题：什么条件下刷、刷在哪儿、刷多少。这篇把基础做法过一遍。

# 基本概念

动手之前，先理清下面几个概念。

## 平衡

`ModNPC.SpawnChance` 该返回多大的值，很难凭感觉猜准 —— 你总不希望自己的怪比原版怪刷得还密。一般 `0.1f` 或者更小的值比较合适，但别硬猜：用 [Modders Toolkit](https://forums.terraria.org/index.php?threads/modders-toolkit-a-mod-for-modders-doing-modding.55738/) 里的 NPC Spawn Tool，把你的怪和原版、其他模组的怪放在一起对比刷新率。

## Terraria 的刷怪流程

Terraria 刷怪分两步：先挑一个位置，再挨个问各个 NPC 要不要刷在这个位置。每次决定刷怪都会连带一个玩家对象（`NPCSpawnInfo.Player`），因为刷怪是围绕某个玩家发生的。多人游戏里，所有刷怪决定都由服务端来做。如果你在模组里加了自定义生物群系，却发现联机时刷怪不对劲，那多半是 `ModPlayer.SendCustomBiomes` 以及相关钩子没实现好：服务端得先拿到自定义群系布尔值的正确取值，才能做出正确判断。

## 返回值的类型

`ModNPC.SpawnChance` 返回 `float`，`ModNPC.CanTownNPCSpawn` 返回 `bool`。这两个类型不熟的话，先去补一下 C# 基础。

## ModNPC.SpawnChance

这是本篇的重点。所有靠自然刷怪出现的 `ModNPC`（Boss 和城镇 NPC 除外）都应该重写这个钩子：

```cs
public override float SpawnChance(NPCSpawnInfo spawnInfo)
{
	// Code goes here
}
```

## ModNPC.CanTownNPCSpawn

只给城镇 NPC 用，注意它返回的是 `bool` 而不是 `float`。用它可以要求城镇 NPC 满足某些条件（比如击败某个 Boss）之后才入住。

```cs
public override bool CanTownNPCSpawn(int numTownNPCs)
{
	// Code goes here
}
```

## 条件判断（if-else）

刷不刷怪，本质上是做一个"是/否"的判断，所以 if-else 得熟练。[点这里补课](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/if-else)。

### 逻辑非运算符（!）

[看这里](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/logical-negation-operator)。

    if(Main.dayTime) // if day time

    if(!Main.dayTime) // if night time

### 逻辑与、逻辑或（&& 和 ||）

[`&&`](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/conditional-and-operator) 和 [`||`](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/conditional-or-operator) 的用法先看一遍。注意 `&&` 的优先级比 `||` 高，我们会用它俩把多个条件拼在一起。

### = 与 ==

这两个别搞混：`=` 是给变量赋值，`==` 是比较两个值。千万不要写出 `if(Main.hardMode = true)` 这种代码，否则你会想不通世界怎么突然进了困难模式。

### 三元运算符

if-else 还有一种更紧凑的写法，叫三元运算符，[文档在这里](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/conditional-operator)。它把：

```cs
if (condition)
{
	return .1f;
}
else
{
	return 0f;
}
```
变成：

    return condition ? .1f : 0f;

# NPCSpawnInfo

`NPCSpawnInfo` 是一个结构体（struct），装着 Terraria 想刷怪的那个位置的全部信息，字段列表见[文档](https://docs.tmodloader.net/docs/stable/struct_n_p_c_spawn_info.html)。我们的判断逻辑就是读这些值，一步步得出最终结论。

## 玩家所处的生物群系

要在刷怪逻辑里用到玩家群系，就读 `NPCSpawnInfo` 里传进来的那个 Player，别去碰 `Main.LocalPlayer`。[Zone 布尔值一览](https://docs.tmodloader.net/docs/stable/struct_n_p_c_spawn_info.html#a7d41785192c2cd08b34bd2b684965dc0)

```cs
if(spawnInfo.Player.ZoneJungle) // Vanilla Biome aka Zone

if(spawnInfo.Player.GetModPlayer<ExamplePlayer>().ZoneExample) // Mod Biome
```

## 高度

世界生成时会往存档里存下几个高度值：`Main.worldSurface` 在出生点往下一点的位置，`Main.rockLayer` 比它更靠下，是岩石开始比泥土多的地方；`Main.maxTilesY` 则是世界 Y 坐标的最大值，也就是最底部。拿这几个值做点算术，就能写出基于高度的刷怪条件；也可以像下图这样直接用预定义好的 Zone，省得自己算：

![世界高度分区（左：数值算法 / 右：预定义 Zone）](/img/posts/tmodloader-basic-npc-spawning/9rIgSMt.png)

图右边是预定义好的 Zone，左边就是驱动这些 Zone 的算式。比如下面两段代码完全等价：

```cs
if(spawnInfo.Player.ZoneRockLayerHeight)
```   
```cs
if(spawnInfo.SpawnTileY <= Main.maxTilesY - 200 && spawnInfo.SpawnTileY > Main.rockLayer)
```

想要更精确的高度条件，用简单的算术就能做到。比如 `if(spawnInfo.spawnTileY <= Main.maxTilesY - 200 && spawnInfo.SpawnTileY > (Main.rockLayer + Main.maxTilesY - 200) / 2)` 就把生成位置限制在上面那个 `ZoneRockLayerHeight` 的下半段。预定义 Zone 用起来省心，但要更精细的行为还得自己算。另外记住：Y 坐标在天上是 0，越往下数值越大。还有，`WorldGen.lavaLine`、`WorldGen.waterLine`、`WorldGen.worldSurfaceHigh` 这些值别拿来用 —— 它们不会存进世界文件，对刷怪不生效。

## 水平位置

少数敌人会把 X 坐标也算进刷新几率，比如哥布林侦察兵（Goblin Scout）和史莱姆王（King Slime）只在世界边缘生成。这类判断用 `Main.maxTilesX` 就能写。举个例子，`SpawnCondition.GoblinScout` 内部就是靠下面这行逻辑，把生成范围限定在地图最左和最右各六分之一的区域：`Math.Abs(spawnInfo.SpawnTileX - Main.spawnTileX) > Main.maxTilesX / 3`

# 其他可用的值

除了 `NPCSpawnInfo`，`SpawnChance` 里还能读这些字段：

* `Main.dayTime` —— 白天为 `true`，夜晚为 `false`
* `NPC.downedGolemBoss` 以及[其他同类字段](https://github.com/tModLoader/tModLoader/wiki/NPC-Class-Documentation#downedboss1) —— 对应 Boss 是否已在当前世界被击败
* `Main.hardMode` —— 是否处于困难模式
* `Main.expertMode` —— 是否处于专家模式
* `Main.time` —— 白天取值从 0（凌晨 4:30）到 54000（晚上 7:30），夜晚从 0（晚上 7:30）到 32400（凌晨 4:30），要配合 `Main.dayTime` 一起用。它通常每个 tick 加 1，游戏内一小时是 3600 tick。
  * 例如 `Main.dayTime && Main.time < 18000.0` 表示凌晨 4:30 到 9:30 的清晨（因为 18000/3600 == 5）
  * 也可以用 `Utils.GetDayTimeAs24FloatStartingFromMidnight` 简化按时间刷怪的条件，例如 `Utils.GetDayTimeAs24FloatStartingFromMidnight() < 6.00f` 就是早上 6:00 之前
* `Main.raining` —— 是否正在下雨
* `NPC.AnyNPCs(NPCID.IceGolem)` —— 世界里存在这只怪时为 `true`；前面加 `!` 可以避免小 Boss 重复生成
  * `NPC.AnyNPCs(ModContent.NPCType<PartyZombie>())` —— 同理，只是换成模组 NPC
* `NPC.CountNPCS(NPCID.AngryNimbus) < 2` —— 世界中这种 NPC 少于 2 只时为 `true`
* `TileID.Sets.Conversion.Sand[spawnInfo.SpawnTileType]` —— 生成格是任意一种沙块时为 `true`。`TileID.Sets.Conversion` 里还有别的集合可能用得上
* `Math.Abs(spawnInfo.SpawnTileX - Main.spawnTileX) > Main.maxTilesX / 3` —— 生成格位于地图外侧三分之一时为 `true`
* `NPC.waveNumber` —— 事件进行到第几波
* 还想要更多？到 Discord 上找我们，我们会继续往这个列表里补。

# SpawnCondition

`SpawnCondition` 是一个类，里面预置了一批现成字段，逻辑等同于原版各种 NPC 的刷新条件，可用字段见[文档](https://docs.tmodloader.net/docs/stable/class_spawn_condition.html)。用上它能省掉不少 `SpawnChance` 判断，比如"白天出现的史莱姆"，一行就写完了：

```cs
return SpawnCondition.OverworldDaySlime.Chance * 0.1f;
```
而不用写成：
```cs
return Main.dayTime && spawnInfo.SpawnTileY <= Main.worldSurface ? 0.1f : 0f;
```
# 示例

下面每段代码都相当于写在 `ModNPC.SpawnChance` 方法里：

    public override float SpawnChance(NPCSpawnInfo spawnInfo)
    {
    	// Example Code Here
    }

### 只在自己写的 ModTile 上生成
    return spawnInfo.SpawnTileType == ModContent.TileType<Tiles.CrystalBlock>() ? .1f : 0f;
### 玩家处于自定义生物群系 / Zone 时生成
    return spawnInfo.Player.GetModPlayer<CrystalPlayer>().ZoneCrystal ? .1f : 0f;
### 在丛林神庙里生成
    return spawnInfo.SpawnTileType == TileID.LihzahrdBrick && spawnInfo.lihzahrd ? .1f : 0f;
    // or
    return SpawnCondition.JungleTemple.Chance * 0.1f;
### 日食期间生成
    return spawnInfo.SpawnTileY <= Main.worldSurface && Main.dayTime && Main.eclipse
    // or
    return SpawnCondition.SolarEclipse.Chance * 0.05f; // Remember to test this value for balance
### 玩家站在日盘砖（Sunplate）上时生成
    // Here I show off 2 ways of converting a boolean to an int. (False is 0, True is 1)
    return (Main.tile[spawnInfo.PlayerFloorX, spawnInfo.PlayerFloorY].TileType == TileID.Sunplate).ToInt() * 0.2f;
    // or
    return Convert.ToInt32(Main.tile[spawnInfo.PlayerFloorX, spawnInfo.PlayerFloorY].TileType == TileID.Sunplate) * 0.2f; // using System;

# 组合代码片段

和上面的示例一样，最终结论往往是把几段逻辑拼起来，用到的就是前面说的 `!`、`&&`、`||`。

## bool 和 float 混着用

`SpawnCondition` 的字段返回的是表示概率的 `float`，而很多其他条件只是 `bool`，混在一起写容易绕。我们来给一个"只在夜晚的蜘蛛洞里刷出"的 NPC 写 `SpawnChance`，用到 `SpawnCondition.SpiderCave` 和 `Main.dayTime`。

### 简单写法

对 C# 还不太熟的话，就把 `bool` 和 `float` 分开处理：用 `!`、`&&`、`||` 把 `bool` 条件写进 if，条件通过了再在 return 里用 `SpawnCondition`。条件不满足就返回 0，也就是不刷：

```cs
if(!Main.dayTime)
    return SpawnCondition.SpiderCave.Chance * 0.1f;
return 0;
```

### 进阶写法

用前面学过的三元运算符，这套判断可以写得更紧凑。

```cs
return !Main.dayTime ? SpawnCondition.SpiderCave.Chance * 0.1f : 0;
```

### 复杂写法

如果你觉得把 `bool` 理解成 0/1（`false` 是 0，`true` 是 1）更顺，也可以这么写。这种做法不算常见，但确实有用：

```cs
return (!Main.dayTime).ToInt() * SpawnCondition.SpiderCave.Chance * 0.1f;
```

# 常见错误

### 我的世界怎么突然进了困难模式？

新手常把 `=` 和 `==` 弄混：`=` 是赋值，`==` 才是比较。

写成 `if (Main.hardMode = true)`，等于给 `hardMode` 赋了 `true`，直接把世界推进困难模式，这显然不是你想要的。应该写 `if (Main.hardMode == true)`，或者更干脆一点：`if (Main.hardMode)`。

### CS0161 '[ClassName].SpawnChance(NPCSpawnInfo)': not all code paths return a value

这说明你的代码存在没有返回值的分支。比如：

    if (spawnInfo.Granite)
        return 0.2f;

要改成这样：

    if (spawnInfo.Granite)
        return 0.2f;
    return 0f;

### CS0029 Cannot implicitly convert type 'bool' to 'float'

这通常说明你忘了用判断结果去决定返回哪个值，参考上面那条。

# 相关参考

* [ModNPC.SpawnChance 文档](https://docs.tmodloader.net/docs/stable/class_mod_n_p_c.html#a9eb89f7c9fa0eef966bc36a29f848cd6)
* [NPCSpawnInfo 文档](https://docs.tmodloader.net/docs/stable/struct_n_p_c_spawn_info.html)
* [SpawnCondition 文档](https://docs.tmodloader.net/docs/stable/class_spawn_condition.html)

# 基础篇不涉及的内容

* `ModNPC.CheckConditions` —— 自定义城镇 NPC 的住房条件（比如松露人 Truffle）
* Mod Boss Booleans —— 相关的同步和用法请参考 ExampleMod
* `ModNPC.SpawnNPC` 的用法 —— 在生成的那一刻操作 NPC
* `GlobalNPC.EditSpawnRate` —— 调整最大刷怪数和刷新率（水蜡烛）
* `GlobalNPC.EditSpawnRange`
* `GlobalNPC.EditSpawnPool` —— 在候选池填好之后修改刷怪池
* `GlobalNPC.SpawnNPC`
