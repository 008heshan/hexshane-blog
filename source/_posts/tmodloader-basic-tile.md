---
title: Basic ModTile Guide
date: 2026-08-24 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic ModTile Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Tile)。
>
> 搬运说明：原文配图很多，其中托管在 imgur 的图在当前网络下取不到，已省略（相关段落都改写成了不依赖配图也能读懂的说明）；GitHub 上的图片与动图保留了原链接。

# 什么是 Tile？

先把这个概念理清：**物品（Item）在背包里，物块（Tile）在世界里**。游戏里很多东西都是"放下去变成方块"的物品，但物品和它放出来的方块之间并没有强制绑定 —— 只是一个负责放、一个负责掉回来。当然，你加的方块基本都会有对应的物品。

容易混淆的是：**墙（Wall）和电线（Wire）也塞在 `Tile` 这个结构里**。世界里的每个图格坐标都对应一个 `Tile` 结构，全部存在 `Main.tile` 里 —— 也就是说 `Tile` 里装的不只是"方块"数据。想直接操作这个结构的话看 [Tile Class Documentation](https://docs.tmodloader.net/docs/stable/struct_tile.html)。

## 物品 ⟷ 方块的配对

物品的 `Item.createTile` 指向某个 `ModTile` 的 `TileType`，放下去就是这个方块；方块有多个样式（style）时，用 `Item.placeStyle` 指定放哪一种（见下文[多种样式](#多种样式)）。挖掉方块时，`ModTile` 会自动把物品掉回来 —— 这个过程是自动的，特殊方块可以自己接管：

- `ModTile.RegisterItemDrop`：手动给特定样式登记掉落
- `ModTile.GetItemDrops`：完全自己控制掉落
- `TileLoader.GetItemDropFromTypeAndStyle`：按"方块类型 + 样式"反查该掉什么物品

[ExampleTrap.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleTrap.cs) 就是用了自定义样式的方块，所以自己写了掉落逻辑。

### 放方块的物品代码

放方块的物品一般简单到只有这么几行，另外常见的做法就是再补一个[配方](https://github.com/tModLoader/tModLoader/wiki/Basic-Recipes)：

```cs
public class MyTable : ModItem
{
	public override void SetDefaults() {
		Item.DefaultToPlaceableTile(ModContent.TileType<MyMod.Tiles.Furniture.MyTable>(), 0);
		Item.value = 150;
	}
}
```

# 做一个 Tile

方块要继承 `ModTile`。在模组源码目录（`My Games\Terraria\tModLoader\ModSources\MyModName`）里建一个 `.cs` 文件，把下面这段贴进去，`NameHere` 换成方块内部名、`ModNamespaceHere` 换成你的命名空间：

```cs
using Microsoft.Xna.Framework;
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace ModNamespaceHere
{
	public class NameHere : ModTile
	{
		public override void SetStaticDefaults()
		{
			Main.tileSolid[Type] = true;
			Main.tileMergeDirt[Type] = true;
			Main.tileBlockLight[Type] = true;
			Main.tileLighted[Type] = true;
			DustType = DustID.Stone;
			AddMapEntry(new Color(200, 200, 200));
			// Set other values here
		}
	}
}
```

内部名别用撇号或空格（很常见的坑），然后把画好的贴图 `.png` 放到和这个 `.cs` 同一个文件夹。文件名和目录结构的要求见 [Autoload](https://github.com/tModLoader/tModLoader/wiki/Basic-Autoload)。

# Framed 与 FrameImportant

方块分两类：

- **Framed**（也叫 Terrain / 地形方块）：1x1，会根据邻居自动变形 —— 泥土、石头、木材都是这类。
- **FrameImportant**（也叫 MultiTile / 家具）：不会自动变，通常大于 1x1 —— 桌子、椅子、床都是这类。

注意不是所有 1x1 都是 Framed：金属锭（`MetalBars`）就是 1x1 的 FrameImportant，它放在别的方块旁边不会像地形那样变。

FrameImportant 的方块可以有多个"样式"，贴图里还会留出空白，那就是留白（padding），后面细说。

# 坐标

**图格坐标是世界坐标的 1/16**。凡是同时涉及方块和其它实体（NPC、玩家、弹幕）的计算，都要记住这一条。细节看 [Coordinates](https://github.com/tModLoader/tModLoader/wiki/Coordinates)。

# 留白（Padding）

画贴图时尺寸要按规矩来：**每个图格 16x16，右侧和下方各留 2 像素**，一格总共占 18x18。懒得手算可以用 [tSpritePadder](https://forums.terraria.org/index.php?threads/tspritepadder-ready-to-use-sprites-for-terraria-tiles.96177/) 这个工具。

# SetStaticDefaults 里放什么

`SetStaticDefaults` 决定这个方块的"性格"：实不实心、能不能站、岩浆会不会烧掉它等等。**照着 ExampleMod 里最接近的方块抄一份再改**，比自己从零想快得多；[ExampleMod 的 ModTile](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Content/Tiles) 就是最好的参照物。

下面这些行大多是把某个值设成 `true`，说明**默认值是 `false`** —— 所以不用把默认值也写一遍，那是白占地方。

## MinPick

`MinPick` 是破坏这个方块所需的**最低镐力**：设成 50，就得用镐力高于 50% 的镐才挖得动。默认 `0`，任何镐都能挖。原版很少用，主要是卡进度 —— 比如丛林神庙的蜥蜴砖 `MinPick` 是 210，防止玩家早期挖进去。原版镐力见 [Pickaxe Power](https://terraria.wiki.gg/wiki/Pickaxe_power)。

## MineResist

`MineResist` 是个**倍率**，用来控制方块多难挖（默认 100 点"血量"）：`2f` 就变成 200，`0.5f` 就减半成 50。默认 `1f`。它通常和 `MinPick` 一起出现。常用原版数值：

| 方块 | MineResist |
| --- | --- |
| 默认 | 1f |
| 泥土、沙、黏土、泥、淤泥、灰烬、雪、雪泥、硬化沙块 | 0.5f |
| 尖刺、木尖刺 | 0.5f |
| 黑檀石、猩红石、珍珠石、地牢砖 | 2f |
| 钴、钯金 | 2f |
| 秘银、山铜 | 3f |
| 墓碑 | 3f（"值得一战的种子"世界为 4f） |
| 精金、钛金 | 4f |
| 蜥蜴砖 | 4f |
| 叶绿 | 5f |

## Main.tileSolid[Type] = true;

实心。弹幕会撞上它，NPC 和玩家能站在上面。

## Main.tileSolidTop[Type] = true;

能站上去但不算实心 —— 放下来的金属锭、桌子、铁砧都是这类。

## Main.tileTable[Type] = true;

有些东西（比如瓶子）只能放在"桌子"上，平顶的家具方块记得设这个。

## Main.tileMergeDirt[Type] = true;

这个地形方块会利用贴图里额外的帧和泥土**融合**。

## Main.tileSpelunker / tileShine / tileShine2 / tileValue

这几个和金属探测器、矿石发光有关，用法见 [ExampleOre](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleOre.cs)。

## Main.tileBlockLight[Type] = true;

挡光：光线穿过它时会衰减。

## Main.tileLighted[Type] = true;

方块自己会发光。发光颜色用 `ModifyLight` 钩子设置。

## Main.tileLavaDeath / tileWaterDeath

被岩浆 / 水碰到就毁掉。

## Main.tileNoAttach[Type] = true;

别的方块不能附在它上面。

## Main.tileCut[Type] = true;

能被武器直接砍掉（草丛、藤蔓那类）。

## Main.tileLargeFrames[Type] = 1 或 2;

见下文[自定义变化图案](#Main-tileLargeFrames-Type-2-或-2x2-平铺图案)。

## Other（不展开的冷门项）

`Main.tileBouncy`、`tileAlch`、`tileStone`、`tileAxe`、`tileHammer`、`tileNoSunLight`、`tileDungeon`、`tileRope`、`tileBrick`、`tileMoss`、`tileNoFail`、`tileObsidianKill`、`tilePile`、`tileBlendAll`、`tileGlowMask`、`tileContainer`、`tileSign`、`tileMerge[Type][otherType]`、`tileSand`、`tileFlame`、`tileFrame`、`tileFrameCounter` —— 用得少，需要时翻[文档](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#documentation)或原版源码。

## Main.tileFrameImportant[Type] = true;

标记为 FrameImportant。这里的 frame 指的是"这张贴图里该画哪一块"，是个坐标：地形方块的 frame 不用存，世界加载时算出来就行；FrameImportant 的必须存进世界，所以才"重要"。**只要你用了 `TileObjectData`，就得设这一项** —— 基本就是除了泥土、矿石这些基础建材之外的所有方块。

## 其它属性：DustType、AdjTiles 等

见 [ModTile 文档](https://docs.tmodloader.net/docs/stable/class_mod_tile.html#properties)（记得展开 "Properties inherited from [ModBlockType](https://docs.tmodloader.net/docs/stable/class_mod_block_type.html)" 那一节，`DustType`、`HitSound` 这些继承来的属性在那里面）。

## AddToArray(ref TileID.Sets.RoomNeeds.????);

让方块在"房屋判定"里充当光源、椅子或桌子：

```cs
AddToArray(ref TileID.Sets.RoomNeeds.CountsAsTable);
AddToArray(ref TileID.Sets.RoomNeeds.CountsAsDoor);
AddToArray(ref TileID.Sets.RoomNeeds.CountsAsTorch);
AddToArray(ref TileID.Sets.RoomNeeds.CountsAsChair);
```

## AddMapEntry

设置方块在地图上的颜色和可选文字，[ExampleMod 里有很多用法](https://github.com/search?q=repo%3AtModLoader%2FtModLoader+AddMapEntry+path%3AExampleMod&type=Code)。

# 地形（Framed）方块

世界的大部分由地形方块构成：泥土、沙、木材、石头……它们绝大多数是实心的（`Main.tileSolid[Type] = true;`）。之所以叫 "framed"，是因为游戏会**根据周围方块自动决定用贴图里的哪一帧** —— 有的帧对应"孤零零一块"，有的对应"上下都有邻居"。

模板图（原文配了两张 2x2 的模板，一张不与泥土融合、一张设 `Main.tileMergeDirt[Type] = true;` 会融合）在这里：[不与泥土融合的模板](https://github.com/user-attachments/assets/85654015-ccb4-40f9-8703-3d9ee9525fc8)、[与泥土融合的模板](https://github.com/user-attachments/assets/6c8393fd-d14d-4727-8e07-0eb064377a53)。

还有一种是 **Gemspark 排布**：不看 4 个邻居而是看 8 个邻居，另外多一些"角落没有邻居"的帧，好处是边缘线能正确衔接。用它要额外加这段：

```cs
public override bool TileFrame(int i, int j, ref bool resetFrame, ref bool noBreak) {
	Framing.SelfFrame8Way(i, j, Main.tile[i, j], resetFrame);
	return false;
}
```

完整例子见 [ExampleGemsparkBlock.cs](https://github.com/tModLoader/tModLoader/blob/1.4.4/ExampleMod/Content/Tiles/ExampleGemsparkBlock.cs)。

## 变化（Variation）

默认情况下，游戏放方块时会自动在 **3 种变化**之间随机 —— 这就是 `Tile.TileFrameNumber`。代价是贴图得画三套，但看起来自然得多。

## 自定义 Framing

方块的拼接逻辑可以完全自己写，比如让它和别的非泥土方块融合：见 [ExampleCustomFramingTile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleCustomFramingTile.cs)。

## 自定义变化图案

随机变化不总是好看。像月锈砖、光滑大理石块这类方块会用自定义变化代码，做成**固定图案**。[ExampleCustomFramingTile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleCustomFramingTile.cs) 里演示的是逐行交替的图案。

### `Main.tileLargeFrames[Type] = 2;` 或 2x2 平铺图案

月锈砖的纹路要互相接得上，它设 `Main.tileLargeFrames[Type] = 2;`，让变化按 **2x2 平铺**重复。这个图案用 4 种变化而不是 3 种，所以贴图里会多出一套来放第 4 种；第 5、6 种其实用不到，是第 4 种的重复。

### `Main.tileLargeFrames[Type] = 1;` 或 3x4 图案

光滑大理石块用的是 3x4 的大图案，设 `Main.tileLargeFrames[Type] = 1;`。同样，第 5、6 种用不到，贴图里重复一份就行。

## 动画

会动的地形方块，是把整张贴图**竖直方向复制一遍或多遍**，代码见 [ExampleLivingFireTile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleLivingFireTile.cs)，贴图排布见 [ExampleLivingFireTile.png](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleLivingFireTile.png)。

# TileObjectData（FrameImportant / 多方块）

只要不是 Framed 地形方块，就必须设 `Main.tileFrameImportant[Type] = true;`，并在 `SetStaticDefaults` 里配 `TileObjectData`。这类方块尺寸随便（1x1 到多大都行），可以有多种"样式"，每种样式还能有"备选摆放"。

## 多种样式

用样式可以少写很多重复代码：一个 `ModTile` 文件管好几种样式，每个放置它的物品 `Item.createTile` 相同、`Item.placeStyle` 不同。`Item.DefaultToPlaceableTile` 会把 `createTile` 和 `placeStyle` 一起设好。

也可以在 `ModTile` 的各个方法里按样式做特殊处理：[ExampleTorch.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleTorch.cs) 就是一个方块两种样式，各有不同的液体放置规则、光色和鼠标悬停图标。

样式在贴图里怎么排，见下文 [StyleHorizontal](#StyleHorizontal)、[StyleMultiplier](#StyleMultiplier)、[StyleWrapLimit](#StyleWrapLimit)。

## TileObjectData 的基本结构

在 `SetStaticDefaults` 里用 `TileObjectData.newTile` 描述方块。有三种写法：**复制模板**、**复制某个已有方块**、**从零写**。

- 复制模板最省事，适合常见的家具（比如从 `Style2x2` 复制就是标准的 2x2、放地上、免疫岩浆）。
- 但模板可能带来**意料之外的行为**：`Style4x2` 是 4x2，可它自带左右两种摆放 —— 床需要，桌子就不需要了。
- 尺寸在原模板里没有对应项时，直接手写更省心，也能确保行为就是你要的。

顺序上只有一条铁律：`addTile` 必须**最后**，`CopyFrom`（如果用了）必须**最先**，颠倒就会出错。

```
Use TileObjectData.newTile.CopyFrom if desired
Adjust settings on TileObjectData.newTile
Adjust settings on TileObjectData.newAlternate if needed (explained later)
Adjust settings on TileObjectData.newSubTile if needed (explained later)
TileObjectData.addTile(Type);
```

## 从零写 TileObjectData

```cs
TileObjectData.newTile.UsesCustomCanPlace = true;
TileObjectData.newTile.StyleHorizontal = true;
TileObjectData.newTile.Width = 2;
TileObjectData.newTile.Height = 2;
TileObjectData.newTile.CoordinateWidth = 16;
TileObjectData.newTile.CoordinateHeights = [16, 16];
TileObjectData.newTile.CoordinatePadding = 2;
TileObjectData.newTile.AnchorBottom = new AnchorData(AnchorType.SolidTile | AnchorType.SolidWithTop | AnchorType.Table | AnchorType.SolidSide, TileObjectData.newTile.Width, 0);
// Additional edits here, such as lava immunity, alternate placements, and subtiles
TileObjectData.addTile(Type);
```

## CopyFrom 模板

原版自带一批模板，名字基本自解释：

```cs
StyleSwitch
StyleTorch
Style4x2 // Beds, has left and right placements
Style2x2
Style1x2
Style1x1
StyleAlch
StyleDye
Style2x1
Style6x3
StyleSmallCage
StyleOnTable1x1 // placeable on tables only, like bottles
Style1x2Top // "Hangs" from attaching to tiles above.
Style1xX
Style2xX
Style3x2
Style3x3
Style3x4
Style3x3Wall
```

一般是先复制一个模板再改。[ExampleChair.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/Furniture/ExampleChair.cs) 就是先 `TileObjectData.newTile.CopyFrom(TileObjectData.Style1x2);`，然后调整：

```cs
TileObjectData.newTile.CoordinateHeights = [16, 18]; // the default is 16, 16
TileObjectData.newTile.CoordinatePaddingFix = new Point16(0, 2); // We added two more pixels
```

最后一定要 `TileObjectData.addTile(Type);`。

## 从指定方块 CopyFrom

也可以从某个具体方块复制，那样连更细的行为一起抄过来：从 `Style1x2` 复制得到普通的 1x2，而从 `TileID.Chair` 复制得到的 1x2 会**自带左右摆放**。注意 `CopyFrom` 不会复制"样式特有的行为"（比如某些黑曜石家具的免疫岩浆），要连这些一起抄得用 `FullCopyFrom`。

## Width / Height

按图格单位改宽高：`TileObjectData.newTile.Width = 3;`（同理 `Height`）。改完多半还得跟着改 `AnchorBottom`（改了宽）或 `CoordinateHeights`（改了高）。

## Origin

设置"鼠标点在哪一格"，以图格为单位、从右上角算起。默认 `new Point16(0, 0)`；设成 `new Point16(2, 0)` 就是往右数 2 格。

## CoordinateHeights

这个 `int` 数组定义**每一行**子格的高度，元素个数必须和 `Height` 完全一致，否则报错。数组里的值**不含留白**。

绝大多数情况都填 16；只有最底下那一行填 18，让贴图能稍微延伸进下方的地面里：

```cs
TileObjectData.newTile.CoordinateHeights = [16, 16, 18]; // Extend into grass tiles.
```

延伸的好处是方块看起来真的"埋"在土里 —— 草地贴图并不会把它那 16x16 全部盖住，会有小缝；底层用 18 就能遮住这些缝（注意这似乎需要 `solid` 为 false）。反过来用 `[16, 16, 16]` 的话，方块会像是浮在草上。想达到类似效果也可以用 [DrawYOffset](#DrawYOffset) 把整个方块往下挪。

### 非 16 / 18 的值

可以，但极少用，一般是 1x1 的方块（大尺寸方块各行会互相盖住）。比如珊瑚是 24x26：

```cs
TileObjectData.newTile.CoordinateHeights = [26];
TileObjectData.newTile.CoordinateWidth = 24;
TileObjectData.newTile.DrawYOffset = -8;
```

## DrawYOffset

把方块绘制位置整体上下平移。最常见的用法是"往下压 2 像素"，让方块像坐在土里：`TileObjectData.newTile.DrawYOffset = 2;`。挂着的方块（旗帜、灯笼）用负值。旗帜方块（如 [ExampleWideBannerTile](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/Furniture/ExampleWideBannerTile.cs)）还会配合[备选摆放](#newAlternate：备选摆放样式)，挂在平台下面时偏移 -2 或 -10 像素。

## DrawXOffset

同 `DrawYOffset`，方向换成 X。典型例子是开关：不同朝向下用不同的 `DrawXOffset`，看起来才自然。

## CoordinateWidth / CoordinatePadding

`CoordinateWidth` 是每个子格的宽度（同一方块内所有子格共用，所以是 `int` 不是数组），不复制样式的话记得设成 16。`CoordinatePadding` 是贴图里子格之间的留白，**按惯例固定 2**，右和下各 2 像素；不是从模板复制的就一定自己写上，否则会出现奇怪的画面瑕疵。

```cs
TileObjectData.newTile.CoordinateWidth = 16;
TileObjectData.newTile.CoordinatePadding = 2;
```

## AnchorBottom / AnchorLeft / AnchorRight / AnchorTop

锚点（Anchor）定义"必须有哪些邻居方块才允许放置"。最常见的是 `AnchorBottom` 锚在整宽的实心方块上；也能做更复杂的，比如只锚半边、锚左或锚右。用 `CopyFrom` 一般会连锚点一起继承，但**如果你改了宽或高，就得回头修锚点**：

```cs
TileObjectData.newTile.Width = 3; // This must be above the code assigning AnchorBottom
TileObjectData.newTile.AnchorBottom = new AnchorData(AnchorType.SolidTile, TileObjectData.newTile.Width, 0);
```

自定义 `AnchorBottom` 的例子：`AnchorData` 构造函数的第 2 个参数是宽度、第 3 个是"从第几格开始要求锚定"；第 1 个参数是描述可用锚定类型的位掩码。下面这段的意思是前 2 格下面被挖掉方块就一起碎，第 3 格被挖不影响：

```cs
TileObjectData.newTile.AnchorBottom = new AnchorData(AnchorType.SolidTile, TileObjectData.newTile.Width - 1, 0);
```

再比如要求"上方必须为空"的 `AnchorTop` —— 在珊瑚上方放一块方块，珊瑚就会碎：

```cs
TileObjectData.newTile.AnchorTop = new AnchorData(AnchorType.EmptyTile, TileObjectData.newTile.Width, 0);
```

所有锚点默认都是空的。但如果用了 `CopyFrom`，你可能想清掉继承来的某个锚点，把它设成 `AnchorData.Empty` 即可：

```cs
TileObjectData.newTile.AnchorBottom = AnchorData.Empty;
```

### 组合多个 AnchorType

`AnchorData` 的第 1 个参数可以用逻辑或 `|` 把多个 `AnchorType` 组合起来，只要**满足其中任意一种**就算锚定成功。例如 [ExampleWideBannerTile](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/Furniture/ExampleWideBannerTile.cs)：

```cs
TileObjectData.newTile.AnchorTop = new AnchorData(AnchorType.SolidTile | AnchorType.SolidSide | AnchorType.SolidBottom | AnchorType.PlanterBox, TileObjectData.newTile.Width, 0);
```

它还用[备选摆放](#newAlternate：备选摆放样式)定义了另一种只锚 `AnchorType.PlatformNonHammered` 的摆放，专门给"挂在平台下"的情况一个自己的 `DrawYOffset`。

## Direction

方块允许被放置的朝向。默认 `None`，也就是玩家朝哪边都能放。配合备选摆放，就能做到"朝左放是一种贴图、朝右放是另一种"—— 椅子、床都是这么做的，惯例上正面朝左算普通摆放、朝右算备选：

```cs
TileObjectData.newTile.CopyFrom(TileObjectData.Style1x2);
TileObjectData.newTile.Direction = TileObjectDirection.PlaceLeft;
TileObjectData.newAlternate.CopyFrom(TileObjectData.newTile);
TileObjectData.newAlternate.Direction = TileObjectDirection.PlaceRight;
TileObjectData.addAlternate(1); // Facing right will use the second texture style
TileObjectData.addTile(Type);
```

## StyleHorizontal

默认情况下样式在贴图里是**竖着排**的，改 `TileObjectData.newTile.StyleHorizontal = true;` 就变成横着排 —— 原版大多数 `TileObjectData` 模板本来就是横向的。

## StyleWrapLimit

样式很多时用它控制换行，免得贴图变成特别长或特别高的一条。设 `StyleWrapLimit = 111;` 就是"0~110 在第一行、111~221 在第二行……"。只有一行的样式就不用设。注意它算的是**摆放样式**，如果用了备选或随机样式，那不一定等于方块样式数。

## StyleMultiplier

给备选摆放和随机样式在贴图里**留位置**。它应该设成"备选摆放数 × `RandomStyleRange`"，这样同一方块样式的各种摆放才会被游戏当成同一个样式。火把就是把 `StyleMultiplier` 和 `StyleWrapLimit` 都设成 6 再加 `StyleHorizontal = true`，效果是每种方块样式独占一行。

## StyleLineSkip

和 `StyleMultiplier` 类似，但它是**在行与行之间**留空间（`StyleHorizontal` 为 true 时即多加几行），可以拿来放"开/关"状态、生长阶段或者动画帧。即使不用 `StyleWrapLimit` 也建议设一下，掉落计算才准。

## RandomStyleRange

放置时随机挑一个摆放样式，比如珊瑚是 `RandomStyleRange = 6`，6 种随机摆放。**要配合 `StyleMultiplier` 用**，否则掉落会不对：

```cs
TileObjectData.newTile.RandomStyleRange = 6;
```

## UsesCustomCanPlace

永远设成 `true`。复制模板的话它已经是 `true`，从零写就别忘。

## 电线、状态切换

想让方块"开/关"切换，就要在贴图里多用几帧；具体放哪取决于 `StyleLineSkip` 和 `StyleHorizontal`。设置正确的话，这些"状态"仍算同一个方块样式。看 [ExampleLamp.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleLamp.cs) 里 `HitWire` 怎么改 `TileFrameX` 换贴图。

## DrawFlipHorizontal / DrawFlipVertical

设为 true 后，预览时偶数 X（或 Y）坐标会画成水平（或垂直）翻转的。**真正的方块也得跟着翻**，要在 `ModTile.SetSpriteEffects` 里复现同样的逻辑：

```cs
public override void SetSpriteEffects(int i, int j, ref SpriteEffects spriteEffects) {
	if (i % 2 == 0) {
		spriteEffects = SpriteEffects.FlipHorizontally;
	}
}
```

## Other

`TileObjectData` 还有一堆本指南没讲到的项（`AnchorWall`、`AnchorValidTiles`、`AnchorValidWalls`、`WaterDeath`、`LavaPlacement`、`HookCheck`、`HookPostPlaceMyPlayer`、`FlattenAnchors`、`DrawStepDown` 等等）。要搞清它们的用法，去翻[文档](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#documentation)或反编译原版看 `TileObjectData.Initialize`。

## addTile(Type);

不调用它模组就加载不正常。它必须是 `SetStaticDefaults` 里和 `TileObjectData` 相关的**最后一行**：

```cs
TileObjectData.addTile(Type);
```

## newAlternate：备选摆放样式

有些方块有备选摆放：床和椅子有左/右朝向，火把有"锚在下方/左侧/右侧/墙上"几种。还有些是"多个原点都能放同一种摆放"——比如关着的门，点门框任意位置都能放。这些都靠 `TileObjectData.newAlternate` 注册，注册时可以给每种备选改不同属性。

套路是：`CopyFrom` 当前的 `TileObjectData.newTile` → 改 `TileObjectData.newAlternate` → `TileObjectData.addAlternate(摆放样式编号)` 收尾。顺序上要在 `newTile` 之后、`newSubTile` 之前、`addTile` 之前；另外记得设 [`StyleMultiplier`](#StyleMultiplier)。

例子参见[上文 Direction 一节](#Direction)、[ExampleTorch.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleTorch.cs) 与 [ExampleSign.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleSign.cs)（不同锚点）、[ExampleDoorClosed.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/Furniture/ExampleDoorClosed.cs)（同一摆放注册多个放置原点）。

## newSubTile — 按方块样式做特殊行为

`Main.tileWaterDeath` 这类东西是按**方块类型**索引的 —— 可诅咒火把和脓血火把明明能在水下用，它们却又和其它火把同属一个类型。怎么做到的？靠 `TileObjectData.newSubTile`：它允许给同一个方块类型的**不同样式**套不同属性。

套路和 `newAlternate` 一样：`CopyFrom` → 改 `TileObjectData.newSubTile` → `TileObjectData.addSubTile(样式编号)`；如果用了备选摆放，还要加 `TileObjectData.newSubTile.LinkedAlternates = true;`。位置在 `newTile`、`newAlternate` 之后，`addTile` 之前。

下面这段就是让"样式 1"能在岩浆和水里放置（完整例子见 [ExampleTorch](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleTorch.cs)）：

```cs
// previous code TileObjectData.newTile and TileObjectData.newAlternate code above

TileObjectData.newSubTile.CopyFrom(TileObjectData.newTile);
TileObjectData.newSubTile.LinkedAlternates = true;
TileObjectData.newSubTile.WaterDeath = false;
TileObjectData.newSubTile.LavaDeath = false;
TileObjectData.newSubTile.WaterPlacement = LiquidPlacement.Allowed;
TileObjectData.newSubTile.LavaPlacement = LiquidPlacement.Allowed;
TileObjectData.addSubTile(1);

// Other TileObjectData.newSubTile and TileObjectData.addTile(Type); code below
```

# 从 Tile 反查样式

用 `TileObjectData.GetTileStyle(Tile)` 可以查出已放置方块的样式，主要用来在 `ModTile` 的各种方法里按样式分支。比如 [ExampleTorch.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleTorch.cs) 在 `ModifyLight` 里按样式给不同光色：

```cs
// In ModifyLight
int style = TileObjectData.GetTileStyle(Main.tile[i, j]);
if (style == 0) {
	r = 0.9f;
	g = 0.9f;
	b = 0.9f;
}
else if (style == 1) {
	r = 0.5f;
	g = 1.5f;
	b = 0.5f;
}
```

它也用同样的办法设置鼠标悬停时显示的图标 —— 这里配合 `TileLoader.GetItemDropFromTypeAndStyle` 反查对应物品：

```cs
// In MouseOver
int style = TileObjectData.GetTileStyle(Main.tile[i, j]);
player.cursorItemIconID = TileLoader.GetItemDropFromTypeAndStyle(Type, style);
```

# 动画

**做动画时不要去改方块的 `TileFrameX` / `TileFrameY`** —— 动画过程中方块的这些值应当保持不变。可参考的例子：[ExampleAnimatedGlowmaskTile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleAnimatedGlowmaskTile.cs)（状态切换 + 动画）、[ExampleAnimatedTile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleAnimatedTile.cs)（更多动画选项）、[ExampleLivingFireTile.png](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleLivingFireTile.png)（会动的地形方块贴图）。

# 完整示例

地形方块：

- [ExampleBlock.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/ExampleBlock.cs) —— 典型地形块

FrameImportant 方块：

- [ExampleTable.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/Furniture/ExampleTable.cs) —— 典型家具
- [TileObjectDataShowcase.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/TileObjectDataShowcase.cs) —— 把备选摆放、多种样式、动画、状态、随机样式全串起来的高级示例

# 相关链接

- [Vanilla TileIDs](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs#tile-ids)
- [ModTile 文档](https://docs.tmodloader.net/docs/stable/class_mod_tile.html)
- [ModBlockType 文档](https://docs.tmodloader.net/docs/stable/class_mod_block_type.html) —— `ModTile` 和 `ModWall` 共有的成员在这里
- [TileObjectData 文档](https://docs.tmodloader.net/docs/stable/class_tile_object_data.html)
