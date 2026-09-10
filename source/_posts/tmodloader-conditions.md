---
title: Conditions
description: Condition 类怎么用：预定义条件、自定义条件与描述，以及在配方、商店、掉落里的实际应用。
date: 2026-08-15 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Conditions](https://github.com/tModLoader/tModLoader/wiki/Conditions)。

"这个配方得站在墓地里才能做""这件商品打完机械 Boss 才开卖""这个掉落只在白天出" —— 这类"什么条件下才行"的判断，在 tModLoader 里统一交给 `Condition`（条件）管。配方、城镇 NPC 商店、NPC 掉落都在用它，别的地方也能顺手拿来当判断用。

注意：这篇指南对应 tModLoader v1.4.4。老版本的 tModLoader 里没有这个通用的 `Condition` 类。

# Condition 类

`Condition` 说白了是一个 [record](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record)，里面只装两样东西：一个是 `LocalizedText` 类型的 `Description`（描述），一个是 [`Func<bool>`](https://learn.microsoft.com/en-us/dotnet/api/system.func-1?view=net-6.0) 类型的 `Predicate`（判定）。一个负责给玩家看，一个负责给游戏算。

这个类在 `Terraria` 命名空间下。

## 描述

每个 Condition 都带一句描述。描述是个 `LocalizedText`，也就是指向本地化文件里某个键的特殊 `string`，具体机制见[本地化指南](https://github.com/tModLoader/tModLoader/wiki/Localization)。

写描述的要诀是短、说到点上。绝大多数描述以 "In"、"Near"、"When"、"During"、"Before"、"After" 这类词开头，比如 "After defeating King Slime"（击败史莱姆王之后）、"In a Hallow biome"（在神圣生物群系里）、"During a Blood Moon"（血月期间）、"Before defeating the Pirates"（击败海盗之前）、"When the vendor is happy enough to sell pylons"（NPC 开心到愿意卖晶塔时）。也有以 "Not" 开头的，例如 "Not in an Drunk world"。另外，描述结尾不加标点。

读描述用 `.Description`。比如 `Condition.TimeDay.Description` 拿到的就是 `During daytime` 这句。

为什么非要一句描述？因为要在好几处地方告诉玩家"这东西什么时候才有"。玩家把材料递给向导时，界面会显示需要哪个制作站、还要满足哪些条件（比如身处墓地生物群系）；模组自己也常常想把这句话展示出来，*Recipe Browser* 就是靠它告诉玩家某个物品怎么获取的。

## Predicate

判定是一段 `Func<bool>`，它决定这个 Condition 什么时候成立，取出来用 `Condition.TheCondition.Predicate`。要是你只想要一个普通的 `bool`，加 `.IsMet()` 更省事 —— 比如 `Condition.TimeDay.IsMet()` 返回的就是"现在是不是白天"。

# 预定义 Condition

现成的 Condition 有很多，生物群系判断、世界里哪些 Boss 已经被打过，都替你写好了。想翻全，看这两个文件就够了：

- [Condition.cs](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/Condition.cs)
  - 所有预定义 Condition 以及它们各自的判定，都写在这个文件里。
- [描述文本所在的本地化文件](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/Localization/Content/en-US/tModLoader.json#L762)
  - 每个预定义 Condition 对应的描述文字在 tModLoader 的本地化文件里。

# 组合多个 Condition

往配方、商店条目或者 NPC 掉落里加 Condition 时，可以一次加好几个。但关系要说清楚：它们是 AND，也就是全都必须满足，不会有"满足其一即可"这回事。

举个例子，某个物品在神圣生物群系里能买到，但在 Remix 世界（*Don't Dig Up* 世界）里不行，那就同时挂上 `Condition.InHallow` 和 `Condition.NotRemixWorld`，玩家看到的提示就是这两行：

```
In a Hallow biome
Not in a Remix world
```

AND 很好办，OR 却做不到。要 OR 的情况并不多见，原版里有一处：`NightAfterEvilOrHardmode`，描述是 "During the night after defeating the Eater of Worlds or Brain of Cthulhu, or anytime in Hardmode"，军火商靠它出售邪箭。真想把几个 Condition 按 OR 组合起来，只能自己写一个。

# 自定义 Condition

预定义的那批再好用，也总有需要自己造的时候。

自定义一个 Condition，其实就是声明一个 `Condition` 类型的变量，给它一句描述加一个判定：

```cs
//        Our variable                      Description (LocalizedText) Predicate (Func<bool>)
Condition OurConditionsName = new Condition("Our description key here", () => true);
```

前面说过 OR 做不到，但自己写的 Condition 完全可以把几个 bool OR 起来。比如条件是"打败了世纪之花或者石巨人"，就这样：

```cs
Condition DownedPlanteraOrGolem = new Condition("Mods.YourModHere.Conditions.DownedPlanteraOrGolem", () => NPC.downedPlantBoss || NPC.downedGolemBoss);

// Alternately, we can use other Condition's predicates in our predicate by adding `IsMet()` to the other Condition.
// It may be easier and more clear to use another Condition's predicate. 
Condition DownedPlanteraOrGolem = new Condition("Mods.YourModHere.Conditions.DownedPlanteraOrGolem", () => Condition.DownedPlantera.IsMet() || Condition.DownedGolem.IsMet());
```

注意第二种写法：直接借用别的 Condition 的判定 —— 在它后面接 `IsMet()` 就行。多数情况下这样更清楚，也更好维护。

你会看到描述那里填的是一个本地化键，这样做是为了给模组加多语言支持时不必回头改 Condition 的代码，真正的描述文字写进[本地化文件](#本地化)里。

```cs
Condition InJungleOrDownedQueenBee = new Condition("Mods.YourModHere.Conditions.InJungleOrDownedQueenBee", () => Condition.InJungle.IsMet() || Condition.DownedQueenBee.IsMet())
```

（这行原文结尾漏了分号，照原文保留；自己写的时候记得补上。）

下面这个例子是商人用来卖鼓组（Drum Set）的，条件为：打败世界吞噬怪/克苏鲁之脑之后，或者打败骷髅王之后，或者已经进入困难模式。`"Conditions.DownedB2B3HM"` 这段本地化文本 tModLoader 里已经有了。

```cs
Condition drumSetCondition = new Condition("Conditions.DownedB2B3HM", () => NPC.downedBoss2 || NPC.downedBoss3 || Main.hardMode);
```

再看一个进阶一点的：检查怪物图鉴的填写进度。这个 Condition 是带参数的，动物学家的很多商品都靠它。`"Conditions.BestiaryPercentage"` 同样是 tModLoader 里现成的本地化文本。

```cs
Condition BestiaryFilledPercent(int percent) => new Condition(Language.GetText("Conditions.BestiaryPercentage").WithFormatArgs(percent),
  () => Main.GetBestiaryProgressReport().CompletionPercent >= percent/100f);
```

## 本地化

描述写成键名，是为了以后加多语言时不用动 Condition 那部分代码。本地化文件大概长这样，更细的规矩见[本地化指南](https://github.com/tModLoader/tModLoader/wiki/Localization)：

```text
Mods: {
	YourModHere: {
		Conditions: {
			ConditionName: This is where we write the description
			InJungleOrDownedQueenBee: While in the Jungle or after defeating Queen Bee
			DownedPlanteraOrGolem: After defeating Plantera or after defeating Golem
		}
	}
}
```

## 建立一个 Conditions 类

某个 Condition 在模组里要反复用到，就没必要每次都重新造一个 —— 抽个类集中放更好。做法很简单，一个静态类就行：

```cs
public static class OurModConditions
{
	public static Condition DownedPlanteraOrGolem = new Condition("Mods.YourModHere.Conditions.DownedPlanteraOrGolem", () => Condition.DownedPlantera.IsMet() || Condition.DownedGolem.IsMet());
	
	public static Condition PlayerIsMale = new Condition("Mods.YourModHere.Conditions.PlayerIsMale", () => Main.LocalPlayer.Male);
	public static Condition PlayerIsFemale = new Condition("Mods.YourModHere.Conditions.PlayerIsFemale", () => !Main.LocalPlayer.Male);
	
	public static Condition PlayerHasAtLeast100Mana = new Condition("Mods.YourModHere.Conditions.PlayerHasAtLeast100Mana", () => Main.LocalPlayer.statManaMax2 >= 100);
}
```

之后需要这个条件时，写 `OurModConditions.DownedPlanteraOrGolem` 就行。

另外还可以参考 [ExampleConditions.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Common/ExampleConditions.cs)。

# 在配方里

配方用 `recipe.AddCondition()` 挂 Condition。下面这个配方要求玩家站在墓地生物群系里：

```cs
Recipe.Create(ItemID.Tombstone)
	.AddIngredient(ItemID.StoneBlock, 10)
	.AddTile(TileID.HeavyWorkBench)
	.AddCondition(Condition.InGraveyard)
	.Register();
```

配方本身的更多内容见[基础配方指南](https://github.com/tModLoader/tModLoader/wiki/Basic-Recipes)。

# 在城镇 NPC 商店里

给商店条目挂上 Condition，就能决定它什么时候出现在货架上：

```cs
// Here, our item will be available after any Mechanical Boss has been defeated.
npcShop.Add(ItemID.HallowedBar, Condition.DownedMechBossAny);

// Here our item will be available during Full Moons and New Moons.
npcShop.Add(ItemID.MoonCharm, Condition.MoonPhases04);

// Here our item will be available in the Hallow biome AND while below the surface.
// Adding multiple conditions will require that ALL conditions are met for the item to appear.
npcShop.Add(ItemID.CrystalShard, Condition.InHallow, Condition.InBelowSurface);
```

可以看到，同一个摊位可以一次挂多个 Condition，但按前面的规矩，得全部满足才会出现。现成的例子见 [Example Person's shop](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/ExamplePerson.cs#L281)。

# 在 NPC 掉落里

Condition 还能拿来当掉落条件（drop condition）—— 比起自己实现 `IItemDropRuleCondition` 或 `LeadingRuleCondition`，这条路通常省事得多。好处还不止省事：因为 Condition 自带描述，怪物图鉴里会顺便写明这个物品的获取条件。任何普通 Condition 后面接一个 `.ToDropCondition()`，它就成了掉落条件：

```cs
Condition.TimeDay.ToDropCondition(ShowItemDropInUI.Always)
```

`ToDropCondition()` 至少要传一个参数，用来决定这个物品在图鉴里怎么显示：`ShowItemDropInUI.Always` 是不管条件满没满足都显示，`ShowItemDropInUI.WhenConditionSatisfied` 是条件满足时才有，`ShowItemDropInUI.Never` 则是永远不显示。第二个参数决定要不要把 Condition 的描述也显示出来，默认为 `true`。

完整的掉落写法如下。这个例子里，Example Sword 会一直出现在图鉴中，并额外带一行 "Drops: During daytime" 的提示：

```cs
npcLoot.Add(ItemDropRule.ByCondition(Condition.TimeDay.ToDropCondition(ShowItemDropInUI.Always), ModContent.ItemType<ExampleSword>()));
```

NPC 掉落的更多内容见[基础 NPC 掉落指南](https://github.com/tModLoader/tModLoader/wiki/Basic-NPC-Drops-and-Loot-1.4)。

# 在 ModHair 里

`ModHair` 可以用 Condition 决定这个[发型](https://terraria.wiki.gg/wiki/Hairstyles)什么时候出现在发型师的店里。原版里绝大多数发型一直都买得到，少数几个要求先打败某个 Boss。

```cs
public override IEnumerable<Condition> GetUnlockConditions() {
	yield return Condition.DownedMartians;
}
```

想让发型永远可用，不重写 `GetUnlockConditions()` 就行。`ModHair` 的更多内容见 [ExampleHair](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Hairs/ExampleHair.cs)。

# 其它用法

任何地方都能把 Condition 当 `bool` 用，加个 `.IsMet()` 即可。比起手写一串判断，用 Condition 通常更好读。

举个例子：`NPC.downedMechBoss1`、`NPC.downedMechBoss2`、`NPC.downedMechBoss3` 分别对应哪个机械 Boss？要么死记编号，要么每次都去翻 [NPC 类文档](https://github.com/tModLoader/tModLoader/wiki/NPC-Class-Documentation#downedboss1)。换成 Condition 就没这烦恼：`Condition.DownedDestroyer.IsMet()`、`Condition.DownedTwins.IsMet()`、`Condition.DownedSkeletronPrime.IsMet()` 一眼就懂，也不用记哪个数字对应哪个 Boss。

还有一些 Condition 本身就把好几个 bool 拼在一起。要判断三个机械 Boss 是不是都打过了，不必写 `NPC.downedMechBoss1 && NPC.downedMechBoss2 && NPC.downedMechBoss3`，一句 `Condition.DownedMechBossAll.IsMet()` 就够了。

最后一个坑：涉及玩家的 Condition 内部一律读 `Main.LocalPlayer`。如果你手头已经有 `Player player` 实例，或者正在遍历 `Main.player[]`，那就不合适了 —— 这些场合直接用原来的字段，比如 `player.ZoneJungle`。
