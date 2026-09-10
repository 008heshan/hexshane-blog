---
title: Basic Ammo Guide
description: 弹药类物品怎么写：弹药类别、让游戏自动消耗还是自己扣，以及 CanChooseAmmo 的两种用法。
date: 2026-09-08 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic Ammo Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Ammo)。

# 什么是弹药？

弹药（ammo）这套机制负责把武器、弹药物品和弹幕三者串起来。简单说：武器物品把 `Item.useAmmo` 设成某个 `AmmoID`，它该用的弹药把 `Item.ammo` 设成同一个 `AmmoID`，而这件弹药再用 `Item.shoot` 指定“这份弹药打出去时生成哪个弹幕”。

拿 `Wooden Bow`（木弓）和 `Flaming Arrow`（烈焰箭）举例：木弓设了 `Item.useAmmo = AmmoID.Arrow;`，烈焰箭设了 `Item.shoot = ProjectileID.FireArrow;` 和 `Item.ammo = AmmoID.Arrow;`。玩家用木弓射击时，Terraria 会翻一遍玩家背包，找 `Item.ammo` 跟木弓的 `Item.useAmmo` 对得上的物品。找到之后，就生成这件弹药 `Item.shoot` 对应的弹幕，同时把这份弹药消耗掉。

这里有个约定：`AmmoID` 的取值跟该类别第一件弹药物品的 `ItemID` 相同，比如 `AmmoID.Arrow` 和 `ItemID.WoodenArrow` 都等于 40；其余所有箭类的 `Item.ammo` 都写 `AmmoID.Arrow;`。

# 让武器用原版弹药

想用原版弹药，把 `Item.useAmmo` 设成对应的 `AmmoID` 就行。ExampleMod 里的 `Example Gun` 就是这么干的：`Item.useAmmo = AmmoID.Bullet;`。

# 怎么做一件原版类别的弹药？

想让自己的弹药归入某个原版弹药类别，把 `Item.ammo` 设成对应的 `AmmoID` 即可。比如 `Example Bullet` 就在它的 `SetDefaults` 里写了 `Item.ammo = AmmoID.Bullet;`。除此之外，弹药还必须定义好自己射出的弹幕 —— `Example Bullet` 给出的写法是 `Item.shoot = ModContent.ProjectileType<Projectiles.ExampleBullet>();`。

# 怎么新建一个弹药类别？

新建弹药类别，就是挑一件自己的弹药物品来“当家”：Example Mod 里有一个 `ExampleCustomAmmo` 类别，`ExampleCustomAmmo` 这件物品写了 `Item.ammo = Item.type;`，用它自己充当该弹药类别的定义者；`ExampleCustomAmmoGun` 则写 `Item.useAmmo = ModContent.ItemType<ExampleCustomAmmo>();`，跟前面原版弹药那套写法保持一致。

之后再添别的弹药，`Item.ammo` 就写 `ModContent.ItemType<ExampleCustomAmmo>()`；其它用这类弹药的武器，`Item.useAmmo` 也写 `ModContent.ItemType<ExampleCustomAmmo>()`。

# 怎么用原版物品拼出一个新的弹药类别？

用一个 `GlobalItem` 类，在 `SetDefaults` 里设置 `Item.ammo`，再在 `PickAmmo` 里把 `type` 改成你自己写的新弹幕。这里有个坑：如果这件物品默认能放置墙或物块，原版逻辑会挡掉「Ammo」那条提示，得你自己补回去。

```cs
public class AmmoModificationsGlobalItem : GlobalItem
{
	public override void SetDefaults(Item entity)
	{
		if (entity.type == ItemID.Rope)
		{
			entity.ammo = ItemID.Rope;
		}
		if (entity.type == ItemID.VineRope)
		{
			entity.ammo = ItemID.Rope;
		}
		// and so on, for SilkRope and WebRope
	}

	public override void PickAmmo(Item weapon, Item ammo, Player player, ref int type, ref float speed, ref StatModifier damage, ref float knockback)
	{
		if (ammo.type == ItemID.Rope)
		{
			type = ModContent.ProjectileType<RopeShot>();
		}
		if (ammo.type == ItemID.VineRope)
		{
			type = ModContent.ProjectileType<VineRopeShot>();
			// Ammo items usually have shootSpeed assigned which gets added to the shootSpeed of the weapon, we can replicate this behavior like this.
			// Similar thing can be done for damage and knockback, it's up to you to include this in the item tooltip though (see below)
			speed += 2f;
		}
	}

	public override void ModifyTooltips(Item item, List<TooltipLine> tooltips)
	{
		// Add ammo tooltip since it doesn't have it because the Placeable ("Can be placed") tooltip replaces it
		// Only needs to be done for placeable items (walls/blocks)
		if (item.type == ItemID.Rope || item.type == ItemID.VineRope)
		{
			int index = tooltips.FindLastIndex(tt => tt.Mod.Equals("Terraria") && tt.Name.Equals("Placeable"));
			if (index != -1)
			{
				tooltips.Insert(index + 1, new TooltipLine(Mod, "Ammo", Language.GetTextValue("LegacyTooltip.34")));
			}
		}
	}
}
```

注意：拿原版物品改出新物品，有跟别的模组撞车的风险，所以能少用就少用 —— 一来是为了保持兼容性，二来也免得玩家看糊涂。

# 武器使用多种弹药，或屏蔽掉某些弹药

[`ModItem.CanChooseAmmo`](https://docs.tmodloader.net/docs/stable/class_mod_item.html#a20ec23ea02f6acf3a68fa63aabb14917) 这个钩子可以让武器顶掉默认的选弹药逻辑。一个常见用法是让同一把武器吃好几种弹药；具体例子和补充说明看 [ExampleSpecificAmmoGun.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Weapons/ExampleSpecificAmmoGun.cs#L68)。

# 手动消耗弹药

弹药一般由武器配合游戏逻辑自动消耗，但有些场合需要模组作者自己挑、自己扣。最典型的就是手持型弹幕武器（held projectile），比如 Vortex Beater、Phantasm、Celebration Mk2 和 Phantom Phoenix。

**TODO**
