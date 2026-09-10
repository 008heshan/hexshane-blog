---
title: IEntitySource
date: 2026-09-03 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[IEntitySource](https://github.com/tModLoader/tModLoader/wiki/IEntitySource)。

只要你在写 1.4 版的 tModLoader 模组，`IEntitySource` 就是绕不开的东西。这篇讲它到底用来干什么，以及日常开发中最常碰上的那几种用法。

# IEntitySource 的用途

`IEntitySource`（实体来源）和一系列 `OnSpawn` 钩子配合工作，回答同一个问题：这个 `Projectile` / `NPC` / `Item` **究竟为什么会**出现在世界里。它主要管两件事：

- 只在特定情境下生成时，才去改动 `NPC` / `Projectile` 的属性 —— 比如罐子里炸出来的炸弹，或者某个 Boss 的仆从。
- 把属性或增益从来源传递给生成出来的实体（通常是 `Projectile`），例如 NPC 旗帜 id、玩家或武器的暴击率。

Boss 召唤仆从就是个现成的例子：这些仆从带着辅助方法 `NPC.GetSource_FromAI()` 返回的 `IEntitySource` 生成，而该方法返回的实际类型是 `EntitySource_Parent`，其中 `Entity` 字段的类型为 `NPC`。于是，一个想把所有 Boss 仆从血量砍半的模组就能认出它们来。这类附加信息能撑起很多以前用模组根本做不出来的效果。

注意：`OnSpawn` 不能阻止实体生成，想拦下来目前只能用 `On` / `IL` 钩子；不过将来也许会补上这样一个钩子（真加了的话，返回的实体会是数组末尾那个 'dummy' 实体槽位）。

Example Mod 里的 `ExampleSourceDependentProjectileTweaks`、`ExampleSourceDependentItemTweaks`、`ProjectileWithGrowingDamage` 这几个类有些实际用法可以参考。

# 生命周期

别把 `IEntitySource` 存进字段。它携带的信息只在生成的那一刻才有意义；任何需要长期生效的来源信息，都得在生成时自己记到模组的字段里。至于为什么存下来是个坏主意，涉及到的东西超出这篇指南的深度，就不展开了。

# 需要传 IEntitySource 的方法

下面这些常用方法都要求传入 `IEntitySource`：

- `Gore.NewGore`
- `Gore.NewGoreDirect`
- `Gore.NewGorePerfect`
- `Player.QuickSpawnItem`
- `Player.QuickSpawnClonedItem`
- `Item.NewItem`
- `NPC.NewNPC`
- `Projectile.NewProjectile`
- `Projectile.NewProjectileDirect`

# 如何选用来源

### 拿不准就用继承自 `EntitySource_Parent` 的来源

大多数情况下，也就是去调 `GetSource_FromThis()`、`GetSource_FromAI()`、`GetSource_Loot()`、`GetSource_Death()`、`GetSource_OnHit()` 或者 `GetSource_OnHurt()`。

`EntitySource_Parent` 是其中最重要的一个来源。tML 靠它把 `bannerIdToRespondTo` / `CritChance` / `ArmorPenetration` 这些值从父级 `NPC` 或 `Player`（`EntitySource_ItemUse` 的情况则是 `Player` + `Item`）转交给生成的 `Projectile`。这些值同样会经由 `EntitySource_Parent` 从父弹幕传给子弹幕，保证最初那个「来源」值不会中途丢掉。

### 详细清单

- NPC 发射弹幕：用 `NPC.GetSource_FromAI()`
- NPC 掉落物品：走掉落池（loot）的用 `NPC.GetSource_Loot()`，其它情况用 `NPC.GetSource_DropAsItem()`。（注意：99.9% 的 NPC 物品掉落都应该改用新的掉落池系统）
- NPC 生成另一个 NPC，比如 Boss 的仆从：用 `NPC.GetSource_FromAI()`
- NPC 死亡时生成血雾（gore）：用 `NPC.GetSource_Death()`
- 弹幕生成物品，比如箭矢回收掉落：用 `Projectile.GetSource_DropAsItem()`
- 弹幕生成别的弹幕，比如分裂弹幕或会射击的仆从：用 `Projectile.GetSource_FromThis()`
- 手持的弹幕类武器消耗弹药发射别的弹幕：用 `player.GetSource_ItemUse_WithPotentialAmmo(player.HeldItem, usedAmmoItemId)`
- 在 `ModBuff.Update` 里生成仆从或宠物：用 `player.GetSource_Buff(buffIndex)`
- 饰品生成弹幕：用 `player.GetSource_Accessory(itemInstance)`，或者 `player.GetSource_Accessory_OnHurt(itemInstance, hurtInfo.DamageSource)`
- 套装奖励生成弹幕：用 `player.GetSource_FromThis("SetBonus_MySetName")`
- 在 `ModItem.UseItem` 里生成东西，以及其它没被上面覆盖到的 `ModItem` 场景：用 `player.GetSource_ItemUse(Item)`
- 玩家在 `ModItem.Shoot` 里生成弹幕：用方法传进来的那个 `source` 参数
- 方块掉落物品（`ModTile.KillMultiTile` 或 `GlobalTile.Drop`）：用 `WorldGen.GetItemSource_FromTileBreak(i, j)`
- 玩家因为丢弃物品，或者从 UISlot 里取不回物品（`player.GetItem` 溢出）而生成物品：用 `new EntitySource_OverfullInventory(player)`

# 从 IEntitySource 里取出信息

拿到来源只是一半，另一半是把 `IEntitySource` 里的信息读出来。模组端能接触到来源的地方有一批方法，名字都叫 `OnSpawn`。

比如 `GlobalProjectile.OnSpawn` 就带了 `IEntitySource source` 参数。用强制类型转换，就能把它转成我们想判断的那个具体来源类型。下面这段代码借 `is` 运算符和[属性模式](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/patterns#property-pattern)，一次把条件匹配清楚：

```cs
// Property pattern approach
if (source is EntitySource_Parent { Entity: NPC { type: NPCID.TacticalSkeleton } }) {
	// Do things here to projectiles (BulletDeadeye) spawned by the TacticalSkeleton enemy without affecting others
}
// Non property pattern approach
if (source is EntitySource_Parent parent && parent.Entity is NPC npc && npc.type == NPCID.TacticalSkeleton) {
	// Do things here to projectiles (BulletDeadeye) spawned by the TacticalSkeleton enemy without affecting others
}
```

想跟那些添加了自定义来源的模组保持最大兼容性，只要对应接口存在，判断时就用接口而不是类：

- `is IEntitySource_WithStatsFromItem`，而不是 `is EntitySource_ItemUse`
- `is IEntitySource_OnHit`，而不是 `is EntitySource_OnHit`
- `is IEntitySource_OnHurt`，而不是 `is EntitySource_OnHurt`

还有一点：多数改动都需要你手动同步。`OnSpawn` 只在生成实体的那台客户端或服务端上执行，任何要在其它客户端上体现出来的改动，都得自己想办法同步过去。[ExampleMod/Common/EntitySources](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Common/EntitySources) 里的文件就是现成的例子。
