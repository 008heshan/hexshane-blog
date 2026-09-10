---
title: Basic ModItem Guide
description: 物品最小实现：ModItem 模板、SetDefaults 与本地化键，以及内部命名的注意事项。
date: 2026-08-28 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic ModItem Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Item)。

这篇讲的是所有物品共用的那套东西：怎么建一个物品类、`SetDefaults` 里该填什么、物品的名字和提示文字又从哪儿来。原文已更新到 1.4.4，想翻 1.3 时代的老版本请点[这里](https://github.com/tModLoader/tModLoader/wiki/Basic-Item/f240adbd4e8629200547bd80057207a0182382d4)。

# 什么是物品？

`Item`（物品）、`Projectile`（弹幕）、`Tile`（物块）是三个不同的概念，刚上手时很容易绕晕。最典型的一个例子：有人想往配方里加工作台，填的却是工作台物品，而他真正需要的是工作台物块。回旋镖这类武器也一样，它是「物品 + 弹幕」两件东西配合出来的 —— 概念不复杂，但写的时候心里得有这根弦。

# 做一个物品

要往 Terraria 里加物品，先写一个类继承 `ModItem`，它是 tModLoader 里所有物品类的基类。在模组的源码目录 `My Games\Terraria\tModLoader\ModSources\MyModName` 下新建一个 `.cs` 文件，用编辑器打开，把下面这段粘进去 —— `NameHere` 换成你物品的内部名，`ModNamespaceHere` 换成模组的文件夹名 / 命名空间：

```cs
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace ModNamespaceHere
{
    public class NameHere : ModItem
    {
        public override void SetDefaults()
        {
            Item.width = 20;
            Item.height = 20;
            Item.maxStack = 9999;
            Item.value = 100;
            Item.rare = ItemRarityID.Blue;
            // Set other Item.X values here
        }

        public override void AddRecipes()
        {
            // Recipes here. See Basic Recipe Guide
        }
    }
}
```

内部名这里最常见的错是写成带撇号或带空格的名字，别这么干，计算机读不懂。

接下来把你画好的贴图（`.png` 文件）放到跟这个 `.cs` 文件同一个目录里。文件名和目录结构要怎么摆计算机才认，看 [Autoload](https://github.com/tModLoader/tModLoader/wiki/Basic-Autoload)。

# SetDefaults

物品最重要的部分就是 `SetDefaults`：这件物品用什么弹药、体积多大、能放置成哪个物块，都在这个方法里设。这些字段的常见含义查 [Item Class Documentation](https://github.com/tModLoader/tModLoader/wiki/Item-Class-Documentation)；想看原版物品都填了些什么值，翻 [Vanilla Item Field Values](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Item-Field-Values)；各种物品的现成例子在 [ExampleMod.Content.Items](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Content/Items) 里有很多。

# 本地化（Localization）

模组构建过一次之后，本地化文件里就会自动补上新物品的条目。这个文件通常位于 `My Games\Terraria\tModLoader\ModSources\MyModName\Localization\en-US_Mods.MyModName.hjson`。物品对应两条：`DisplayName` 默认取类名，并按大写字母把单词拆开；`Tooltip` 默认是空的。想改成自己的文案，直接编辑这个文件就行：

```
Items: {
	NameHere: {
		DisplayName: Name Here
		Tooltip: This is a modded item.
	}
}
```

提示文字要显示成多行的话，语法见 [Localization 页面的 Multiline 一节](https://github.com/tModLoader/tModLoader/wiki/Localization#multiline)。
