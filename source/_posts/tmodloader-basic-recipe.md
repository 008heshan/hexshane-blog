---
title: Basic Recipe
description: 配方三要素（材料 / 制作站 / 产物）：ModItem 与 ModSystem 两种写法、链式写法、配方条件与常见报错。
date: 2026-09-05 16:30:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic Recipe](https://github.com/tModLoader/tModLoader/wiki/Basic-Recipes)。

配方有三个地方可以写：`ModItem.AddRecipes`、`GlobalItem.AddRecipes` 和 `ModSystem.AddRecipes`。放哪儿看你自己的整理习惯，不过 `ModItem.CreateRecipe` 并不是在哪儿都能直接用，用不了的地方就换成 `Recipe.Create`。

一个配方由三部分组成：材料（Ingredients，合成时被消耗掉的物品）、制作站（Tiles，你得站在旁边的那些物块）和产物（Results，合成出来的物品）。

只要某个物品被至少一个配方当作材料用过，游戏就会自动给它加上“Material”（材料）提示，不用你手动加。

# 配方的基本结构

## 需要引用的命名空间

先确认 `.cs` 文件顶部有这几个 using，配方相关的函数都在里面：

```cs
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;
```

## 创建配方并指定产物

配方的第一步，是拿到一个 `Recipe` 类的实例，途径有两条：`Recipe.Create` 方法，或者 `ModItem.CreateRecipe` 方法。创建的时候要指定产物的类型和数量。`ModItem.CreateRecipe` 默认产物就是当前这个 `ModItem`，所以只需要给数量。数量可以不写，默认为 1：

在 `GlobalItem` 类里，得用 `Recipe.Create` 方法。下面几个例子分别用了原版物品和模组物品，也演示了默认数量和自定义数量：

```cs
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueZ); 
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueZ, 5); 
Recipe recipe = Recipe.Create(ModContent.ItemType<Content.Items.ExampleItem>());
Recipe recipe = Recipe.Create(ModContent.ItemType<Content.Items.ExampleItem>(), 10);
```
在 `ModSystem` 类里也是用 `Recipe.Create`：

```cs
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueZ); 
```
在 `ModItem` 类里，如果产物不是这个 `ModItem` 本身，就用 `Recipe.Create`：

```cs
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueZ); 
// ... And we can use "CreateRecipe" directly to create a recipe that results in this ModItem. We can optionally provide a stack size:
Recipe recipe = CreateRecipe(); 
Recipe recipe = CreateRecipe(10); 
```
## 添加材料

接下来往配方里加材料 —— 也就是合成时会被消耗掉的物品：

```cs
recipe.AddIngredient(ItemID.DirtBlock);
recipe.AddIngredient(ItemID.Ruby);
```
`AddIngredient` 还有一个可选参数用来指定数量：

```cs
recipe.AddIngredient(ItemID.Chain, 10);
```
上面的例子都是通过 `ItemID` 类来引用原版物品的。用 Visual Studio 这类趁手的 IDE 时，自动补全和智能提示会非常省事；当然你也可以[在这里查 ItemID 的名字或数值](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs#item-ids)。

要加自己模组的物品也有好几种写法，挑顺手的用就行，第一种最干净。这些写法都能再带上数量参数。下面的例子指向的都是 `ExampleMod.Content.Items` 命名空间里的 `ExampleItem` 类：

```cs
recipe.AddIngredient<Content.Items.ExampleItem>();
recipe.AddIngredient<Content.Items.ExampleItem>(10);
recipe.AddIngredient(ModContent.ItemType<Content.Items.ExampleItem>());
recipe.AddIngredient(ModContent.GetInstance<Content.Items.ExampleItem>());
recipe.AddIngredient(Mod, "ExampleItem");
```

如果代码就写在 `ModItem` 类里，也可以直接把这个 ModItem 当材料用：

```cs
recipe.AddIngredient(this, 5);
```

## 指定制作站

接着指定制作站，写法跟加物品一样。[TileID 在这里查](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Tile-IDs)。

想让它徒手就能合成的话，这一步直接跳过。

```cs
recipe.AddTile(TileID.WorkBenches);
recipe.AddTile(TileID.Anvils);
recipe.AddTile<Content.Tiles.Furniture.ExampleWorkbench>();
recipe.AddTile(ModContent.TileType<Content.Tiles.Furniture.ExampleWorkbench>());
recipe.AddTile(ModContent.GetInstance<Content.Tiles.Furniture.ExampleWorkbench>());
recipe.AddTile(Mod, "ExampleWorkbench");
```
## 注册配方

最后告诉 tModLoader 这个配方已经写完了，把它加进游戏：

```cs
recipe.Register();
```

## 原版与模组材料、制作站的写法区别

小结一下：原版物品和物块用 `TileID`、`ItemID` 类，模组内容用 `ModContent.TileType`、`ModContent.ItemType` 方法：

```cs
recipe.AddTile(TileID.WorkBenches); // Vanilla Tile
recipe.AddTile(ModContent.TileType<Content.Tiles.Furniture.ExampleWorkbench>()); // Modded Tile
recipe.AddIngredient(ItemID.Meowmere); // Vanilla Item
recipe.AddIngredient(ModContent.ItemType<Content.Items.ExampleItem>()); // Modded Item
```

## 完整的配方示例

先看两个简单的完整例子。第一个写在 `ModSystem` 类里：消耗 1 个锁链和 10 个石块，需要在工作台和铁砧旁边合成，产出 1 个 AlphabetStatueA。

```cs
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueA);
recipe.AddIngredient(ItemID.StoneBlock, 10);
recipe.AddIngredient(ItemID.Chain);
recipe.AddTile(TileID.WorkBenches);
recipe.AddTile(TileID.Anvils);
recipe.Register();
```

第二个写在 `ModItem` 类里：用 5 个 `ExampleItem` 合成 3 个该 ModItem。

```cs
Recipe recipe = CreateRecipe(3);
recipe.AddIngredient<Content.Items.ExampleItem>(5);
recipe.Register();
```

# Chain Syntax

前面那些代码啰嗦得很，用链式语法可以把它们串起来，看起来清爽不少，改起来也舒服。注意只有最后一行带分号。

```cs
Recipe.Create(ItemID.AlphabetStatueA)
	.AddIngredient(ItemID.StoneBlock, 10)
	.AddIngredient(ItemID.Chain)
	.AddTile(TileID.WorkBenches)
	.AddTile(TileID.Anvils)
	.Register();
```


# 配方组

配方组（Recipe Group）允许一个材料位置由一组同类物品里的任意一个来满足，最常见的例子就是用铁锭或铅锭都能合成同一个配方。这部分内容在[中级配方篇](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#recipegroups)里讲。

# 条件

除了材料和制作站，配方还能带条件。每一个条件都满足，配方才做得出来。

## 水、蜂蜜、岩浆、微光

水、蜂蜜、岩浆和微光严格来说不算物块，所以想让配方要求站在这些东西旁边，得用下面这几个：

```cs
recipe.AddCondition(Condition.NearWater);
recipe.AddCondition(Condition.NearLava);
recipe.AddCondition(Condition.NearHoney);
recipe.AddCondition(Condition.NearShimmer);
```
注意 `NearWater` 对水槽（Sink）同样成立，所以别再单独把水槽这个物块加进去。

## 其他原版条件

其余原版条件都列在 [Condition.cs](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/Condition.cs) 里，用法跟上面一样。

## 自定义条件

模组也可以定义自己的条件，见[中级配方篇的自定义条件一节](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#custom-conditions)。

# 一个地方写多个配方

在同一个 AddRecipes 里写多个配方时，注意别把变量名重复声明了。下面这样会报错：

```cs
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueA); 
// other code
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueB);
// other code
```
你可以把变量名起成 recipe1、recipe2 这样，但更干净的做法是干脆复用同一个变量：

```cs
Recipe recipe = Recipe.Create(ItemID.AlphabetStatueA); 
// other code
recipe = Recipe.Create(ItemID.AlphabetStatueB); 
// other code
```

如果你用的是[链式写法](#Chain-Syntax)，那就每个配方各起一行、照同样的方式往下写即可。

# 让原版物块“升级”

顺带提一个需求：你可能希望自己的 `ModTile` 也能被当成工作台、铁砧之类的制作站。做法是在 `ModTile.SetStaticDefaults` 里加上这一行：

```cs
AdjTiles = [TileID.WorkBenches];
```

# 完整示例

下面给两个完整例子：一个把配方写在 `ModItem` 类里，适合跟这个 `ModItem` 相关的配方；另一个写在 `ModSystem` 类里，适合围绕原版物品的配方。严格来说放哪儿都能跑，只是为了条理清楚，把配方放在 `ModItem` 类里有时更顺手。

## ModItem 示例

```cs
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace ExampleMod.Content.Items.Accessories
{
	public class ExampleShield : ModItem
	{
		// Other methods and fields here...

		public override void AddRecipes()
		{
			// This example showcases the more modern "chaining style" for recipe creation.
			// For a simpler example, see the ModSystem code below.
			CreateRecipe()
				.AddIngredient<ExampleItem>()
				.AddTile<ExampleWorkbench>()
				.Register();
		}
	}
}
```

## ModSystem 示例

记住在 `ModSystem` 里必须把配方的产物物品类型传进去。

```cs
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace ExampleMod.Content
{
	public class ExampleRecipes : ModSystem
	{
		// Other methods and fields here...

		public override void AddRecipes()
		{
			// Here is an example of a recipe.
			Recipe recipe = Recipe.CreateRecipe(ItemID.Wood, 999);
			recipe.AddIngredient<Content.Items.ExampleItem>();
			recipe.Register();

			// Here we reuse 'recipe', meaning we don't need to re-declare that it is a Recipe
			recipe = Recipe.CreateRecipe(ItemID.PumpkinPie, 2);
			recipe.AddIngredient(ItemID.BlueBerries, 20);
			recipe.AddTile(TileID.WorkBenches);
			recipe.Register();
		}
	}
}
```

# 常见错误

### Error CS0117 'ItemID' (or TileID) does not contain a definition for 'MyModItem'

你用了原版物品的写法去加模组物品，回头再读一遍前面的内容。

### Error CS0103 The name 'recipe' does not exist in the current context

第一个配方忘了声明成 `Recipe`。代码里第一个配方得写成 `Recipe recipe = ...`。

### Error CS0128 A local variable named 'recipe' is already defined in this scope

看上面的「一个地方写多个配方」那节。

### 游戏里找不到我写的配方

检查一下 `AddRecipes` 方法是不是写成了 `override` 而不是 `virtual`。

### No suitable method to override

`AddRecipes` 只能在 `Mod`、`ModSystem` 或 `ModItem` 里重写，别的类不行。

### 游戏里显示的制作站或材料和我的配方代码对不上

多半是把 `ItemID` 传进了 `AddTile`，或者把 `TileID` 传进了 `AddIngredient`。用错了 ID 类，等于引用到了另一个 ID。

# 相关参考

* [原版 ItemID 列表](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs#item-ids)
* [原版 TileID 列表](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs#tile-ids)
* [Recipe 文档](https://docs.tmodloader.net/docs/stable/class_recipe.html)
* [ModSystem 文档](http://docs.tmodloader.net/docs/stable/class_mod_system.html)
* [ModItem 文档](http://docs.tmodloader.net/docs/stable/class_mod_item.html)
* [GlobalItem 文档](http://docs.tmodloader.net/docs/stable/class_global_item.html)

# 基础篇不涉及的内容

配方还有几块内容留给更进阶的指南：

* [配方组 Recipe Groups](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#recipe-groups) —— 中级 —— 让一个材料位置可以由一大类物品里的任意一种满足，就像大多数用木头的配方，能收北地木也能收珍珠木（也就是“任意木材”）。
* [编辑配方 Editing Recipes](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#editing-recipes) —— 中级 —— 修改已有配方，或者禁用已有配方。
* [配方排序 Ordering Recipes](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#ordering-recipes) —— 中级 —— 自定义配方出现在合成列表里的位置。
* [微光拆解 Shimmer Decrafting](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#shimmer-decrafting) —— 中级 —— 自定义微光液体拆解时使用哪一个配方。
* [自定义条件 Custom Conditions](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#custom-conditions) —— 中级 —— 让配方必须满足自定义条件才能合成。
* [自定义材料消耗 Custom Item Consumption](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#custom-item-consumption) —— 中级 —— 让配方有条件地少消耗一些材料，比如炼药桌的效果。
* [自定义合成行为 Custom Recipe Craft Behavior](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#custom-recipe-craft-behavior) —— 中级 —— 在配方被合成之后执行代码。
* [跨模组内容 Cross-Mod Content](https://github.com/tModLoader/tModLoader/wiki/Intermediate-Recipes#cross-mod-recipes) —— 中级 —— 在你的配方里使用其他模组的物品或物块。
