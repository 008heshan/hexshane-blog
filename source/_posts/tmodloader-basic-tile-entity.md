---
title: Basic ModTileEntity Guide
date: 2026-08-23 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic ModTileEntity Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile-Entity)。

本篇讲的是所有 tile entity（方块实体）共通的那套东西。前提是你已经会建文件、写类，也知道"继承"是什么意思。ExampleMod 里的 [BasicTileEntity.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/TileEntities/BasicTileEntity.cs) 就是一个最基本的方块实体，可以对着它一起看。

# 什么是 Tile Entity？

首先得分清 `Tile`（方块）和 tile entity：方块位于世界里的固定坐标，只能通过 `Main.tile` 访问，它存不了额外数据，也没办法在游戏更新时跑代码；tile entity 则是挂在某个 `Tile` 上的一坨附加数据，自带一个 `Update` 方法，通常和方块配合起来让方块有动态行为。

两者的区别就在更新频率上：tile entity 每个游戏 tick 都能跑代码，而普通方块只有等世界更新循环对它调用 `RandomUpdate` 时才有机会跑一次。

所以简单说，只要一个方块需要存额外数据、或者需要稳定地跑代码，就得给它绑一个对应的 tile entity。

# 做一个 Tile Entity

三样东西凑齐才算完整：`ModItem` 放下 `ModTile`，`ModTile` 在被放置时把 `ModTileEntity` 挂到自己身上。三个类缺一不可。

## 先做物品

第一步是搞一个能放下 `ModTile` 的 `ModItem`。关键是 `ModItem.SetDefaults` 里设置 `Item.createTile` 的那一行，写法可以参考 ExampleMod 的 [Placeable Items](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Content/Items/Placeable)。

## 再做 Tile Entity

搭一个 `ModTileEntity` 要用到它类里的几个钩子。

### IsTileValidForEntity(int x, int y)

这个钩子在加载世界时运行，也会在服务端放置实体时运行。只要它返回 `false`，就说明这个位置不合法，tile entity 会被自动干掉。标准写法大致是这样：

```cs
public override bool IsTileValidForEntity(int x, int y)
{
    Tile tile = Main.tile[x, y];
    //The MyTile class is shown later
    return tile.HasTile && tile.TileType == ModContent.TileType<MyTile>();
}
```

### LoadData / SaveData / NetSend / NetReceive

严格来说这几个方法不是必需的，但方块实体十有八九得存自己的数据、还得把它们同步出去 —— 这本来就是它存在的主要理由。存读数据看[存档与读档](https://github.com/tModLoader/tModLoader/wiki/Saving-and-loading-using-TagCompound)，网络同步看[网络同步指南](https://github.com/tModLoader/tModLoader/wiki/Basic-Netcode#modtileentity)，不熟的话先补一下。一般来说，值得存盘的东西也同样值得同步：同步没做对，客户端跟实体交互时读到的就是错的值。

[BasicTileEntity](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/TileEntities/BasicTileEntity.cs#L58) 那个例子演示的就是存一个 `int`、再把它同步出去。这里先把这几个方法都重写出来，内容留空。

### Update

`Update` 是每帧执行实体逻辑的地方。技术上它同样不是必需的，但等你往 `ModTileEntity` 里加功能时总会用到，所以也先重写着，暂时留空。`ModTileEntity` 里其余的钩子都是可选的，本篇不涉及。

## 最后做方块

前提是先做好一个普通的 `frameImportant` 多方块（multitile，写法见 [Basic ModTile Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile)）。在此基础上只要再加几行，就能让它被放置时自动生成 tile entity。

### SetDefaults() / SetStaticDefaults()

在 `TileObjectData.addTile(Type);` 这一行**之前**加上：

```cs
// MyTileEntity refers to the tile entity mentioned in the previous section
TileObjectData.newTile.HookPostPlaceMyPlayer = ModContent.GetInstance<MyTileEntity>().Generic_HookPostPlaceMyPlayer;

// This is required so the hook is actually called.
TileObjectData.newTile.UsesCustomCanPlace = true; // This will already be set if using CopyFrom to clone an existing TileObjectData template.
```

### KillMultiTile(int i, int j, int frameX, int frameY)

在这个钩子里加上一行：

```cs
// ModTileEntity.Kill() handles checking if the tile entity exists and destroying it if it does exist in the world for you
// The tile coordinate parameters already refer to the top-left corner of the multitile
ModContent.GetInstance<MyTileEntity>().Kill(i, j);
```

## 最小模板

下面是一个能跑的最小例子，包含所需的 `ModItem`、`ModTileEntity` 和 `ModTile`。

```cs
public class MyItem : ModItem
{
	public override void SetDefaults() {
		Item.DefaultToPlaceableTile(ModContent.TileType<MyTile>());
	}

	public override void AddRecipes() {
		CreateRecipe().AddIngredient(ItemID.Wood).Register();
	}
}

public class MyTileEntity : ModTileEntity
{
	public override bool IsTileValidForEntity(int x, int y) {
		Tile tile = Main.tile[x, y];
		return tile.HasTile && tile.TileType == ModContent.TileType<MyTile>();
	}

	public override void SaveData(TagCompound tag) {
	}

	public override void LoadData(TagCompound tag) {
	}

	public override void NetSend(BinaryWriter writer) {
	}

	public override void NetReceive(BinaryReader reader) {
	}

	public override void Update() {
	}
}

public class MyTile : ModTile
{
	public override void SetStaticDefaults() {
		Main.tileFrameImportant[Type] = true;

		TileObjectData.newTile.CopyFrom(TileObjectData.Style2x2);
		TileObjectData.newTile.CoordinateHeights = [16, 18];
		TileObjectData.newTile.StyleHorizontal = true;

		// This is the important line!
		TileObjectData.newTile.HookPostPlaceMyPlayer = ModContent.GetInstance<MyTileEntity>().Generic_HookPostPlaceMyPlayer; 

		TileObjectData.addTile(Type);
	}

	public override void KillMultiTile(int i, int j, int frameX, int frameY) {
		ModContent.GetInstance<MyTileEntity>().Kill(i, j);
	}
}
```

# 其他

## 从 ModTile 访问 ModTileEntity

玩家是靠着和 `ModTile` 互动来跟 `ModTileEntity` 打交道的。用 `TileEntity.TryGet` 就能取到指定坐标上的那个 `ModTileEntity` 实例，适合放进 `ModTile.RightClick`、`ModTile.SetDrawPositions`、`ModTile.MouseOver` 这类方法里。

拿到实例之后能做的事很多：开一个 UI、刷物品、显示提示文字、显示 tooltip、自定义方块的视觉效果等等。[BasicTileEntityTile](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/TileEntities/BasicTileEntity.cs#L96) 里那几个方法就是 `TileEntity.TryGet` 的正确用法示例。

注意写法：`TryGet` 要放在 `if` 判断里。少数情况下这个 `ModTileEntity` 可能并不存在，所以像下面这样写防御性代码，把这个情况考虑进去：

```cs
// This hook goes in your ModTile
public override bool RightClick(int i, int j)
{
	if (TileEntity.TryGet(i, j, out MyTileEntity entity))
	{
		// Do things to your entity here
	}
}
```

## 把 Tile Entity 画出来

Tile entity 本身是不可见的，除非所属的 `ModTile` 拿它来做自定义的视觉效果，否则它不会有任何画面。这在调试时很麻烦 —— 你没法一眼确认某个 `ModTileEntity` 到底存不存在。

最快的验证办法：在 `ModTileEntity.Update` 里加上 `Dust.QuickDust(Position.X, Position.Y, Color.Red);`，实体存在的话就会在那里冒红点：

![在 ModTileEntity.Update 里用 Dust.QuickDust 画出的红点，用来确认实体存在](/img/posts/tmodloader-basic-tile-entity/2f883cef-f818-493f-a549-a6e7eb122eb5.png)

另一个选择是装 [Modders Toolkit](https://steamcommunity.com/sharedfiles/filedetails/?id=2573569299) 这类模组，它带一个开关，能把所有 tile entity 的位置都可视化出来：

![Modders Toolkit 的 tile entity 可视化开关效果](/img/posts/tmodloader-basic-tile-entity/9e3012a0-b9d9-4f84-835d-d8e87fde42f3.png)

# 示例

- [BasicTileEntity.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/TileEntities/BasicTileEntity.cs) 是最主要的例子，涵盖了绝大部分你可能想要的功能，同时短到能读懂。
- [SimplePylonTileEntity](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/TileEntities/SimplePylonTileEntity.cs) 和 [AdvancedPylonTileEntity](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/TileEntities/AdvancedPylonTileEntity.cs) 都是 `TEModdedPylon` 类。`TEModdedPylon` 自身就继承自 `ModTileEntity`，逻辑全都自己实现了。拿它学 `ModTileEntity` 的钩子意义不大，但要知道一点：晶塔（pylon）就是 tile entity。
