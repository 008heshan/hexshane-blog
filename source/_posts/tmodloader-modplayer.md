---
title: ModPlayer Guide
description: 用 ModPlayer 给玩家挂效果：ResetEffects 为什么每帧重算、钩子怎么挑、多个 ModPlayer 的职责划分。
date: 2026-08-26 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[ModPlayer Guide](https://github.com/tModLoader/tModLoader/wiki/ModPlayer)。

想让玩家在满足某个条件时获得某种效果，基本都得靠 `ModPlayer`。它负责把状态挂在玩家身上，再让这些状态去改变玩家的行为 —— 这篇讲的就是这套"如果 X，就做 Y"的写法。

# ModPlayer 是什么

`ModPlayer` 是用来给玩家添加数据和功能的类。每个玩家身上都会自动挂一份你写的每个 `ModPlayer` 类的实例，于是它实际充当了原版 `Player` 类的一条延伸。

日常用法就两步：先用 `ModPlayer` 存状态，再拿这些状态去驱动逻辑，从而影响玩家的行为。

# 如果 X，就做 Y

`ModPlayer` 最常见的用法，是在某个条件成立时让玩家做点什么 —— 换成一句话就是"如果 X，就做 Y"。这里用"饰品给玩家附加某个效果"来举例，不过同样的思路对增益、护甲、药水一样成立。下面跟着 [SimpleModPlayer](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Common/Players/SimpleModPlayer.cs) 的代码走一遍。

先在这个 `ModPlayer` 里加个字段，记录效果当前是否生效：

```cs
public bool FrostBurnSummon;
```

接着用 `ResetEffects` 把它恢复成默认值。游戏的设计是每次更新时重算所有玩法效果和属性数值，这个钩子就是为这件事准备的：

```cs
public override void ResetEffects() {
	FrostBurnSummon = false;
}
```

然后是"做 Y"：拿这个字段去驱动玩法逻辑。做什么都行，比如玩家受伤时、打中敌人时、回血时，或者每次游戏更新时。具体做法通常是去 `ModPlayer` 里找一个和目标效果对得上的钩子，[ModPlayer 文档](https://docs.tmodloader.net/docs/stable/class_mod_player.html) 和 ExampleMod 里的各种示例都能帮你找到最合适的那个。这个例子里用的是 `ModPlayer.OnHitNPCWithProj`：

```cs
public override void OnHitNPCWithProj(Projectile proj, NPC target, NPC.HitInfo hit, int damageDone) {
	if ((proj.minion || ProjectileID.Sets.MinionShot[proj.type]) && FrostBurnSummon && !proj.noEnchantments) {
		target.AddBuff(BuffID.Frostburn, 60 * Main.rand.Next(3, 6));
	}
}
```

最后补上"如果 X"：在一定条件下把效果挂到玩家身上。因为这个例子是饰品，所以正确的位置是 `ModItem.UpdateAccessory`：

```cs
public override void UpdateAccessory(Player player, bool hideVisual) {
	player.GetModPlayer<SimpleModPlayer>().FrostBurnSummon = true;
}
```

到这就齐了。效果的实际逻辑由 `ModPlayer` 负责，而饰品、增益、护甲这些只负责告诉玩家"这个效果应该生效"。

注意：你可能会以为饰品里应该直接写着它提供的效果代码，但游戏不是这么设计的。做饰品的升级版时这点尤其明显 —— 升级版饰品里只要把原饰品设过的那些 `ModPlayer` 字段照设一遍，再补一点额外效果就行，玩法逻辑不必写两份。

# 多个 ModPlayer 类

一个模组可以有很多个 `ModPlayer` 类，而且我们强烈建议这么做。具体来说，建议让每个 `ModPlayer` 只担一件事：管钓鱼数值调整的那个类，就不该同时塞进最大生命值的调整。

# 更多资料

`ExampleMod` 里有一大批 [`ModPlayer` 示例](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Common/Players)，每个都带注释说明，可以拿来研究再搬进自己的模组。

其它相关 Wiki 页面：

- [用 TagCompound 保存和加载数据](https://github.com/tModLoader/tModLoader/wiki/Saving-and-loading-using-TagCompound) —— 想做持久生效的效果就看这篇，那种效果得自己负责存档与读档。
- [ModPlayer 文档](https://docs.tmodloader.net/docs/stable/class_mod_player.html) —— 在文档里翻 `ModPlayer` 的各个钩子，找到适合你想要的玩法效果的那个。
