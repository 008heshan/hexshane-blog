---
title: Basic NPC Drops and Loot Guide
date: 2026-08-21 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic NPC Drops and Loot Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-NPC-Drops-and-Loot-1.4)。

敌人被打死之后掉什么，归根到底是一张规则表说了算的。这篇讲的就是怎么往这张表里登记规则 —— 给自家模组新增的 NPC 配掉落，或者给原版敌人加点私货。**整篇只适用于 1.4 的 tModLoader**；1.3 的 NPC 掉落是另一套完全不同的东西，需要的话看 [Basic NPC Drops and Loot](https://github.com/tModLoader/tModLoader/wiki/Basic-NPC-Drops-and-Loot)。

# 基础

Terraria 内部维护着一个规则数据库，规定每种 NPC 会掉哪些物品。这个库是在模组加载阶段填进去的，玩家翻图鉴（Bestiary）时看到的内容就来自它。我们要做的，是往库里登记规则：写在 `ModNPC` 类里，或者写在 `GlobalNPC` 类里，用的都是 `ModifyNPCLoot` 这个方法。另外，那些能开出兵器的袋类物品，结构也是同一套思路，走的是 `ModifyItemLoot`。

## 掉落系统为什么换了？

1.3 的掉落完全靠代码说了算，某个 NPC 究竟会掉什么，光看代码很难可靠地推出来。新系统换成了一张规则表：既能喂给图鉴功能，也方便别的模组微调掉落。举个 1.3 时代的典型尴尬 —— 想往某组掉落里塞一件东西，几乎必然会撞坏别人的模组；现在改掉落就稳得多。

## IItemDropRule

每一条掉落规则都是 `IItemDropRule` 的实例。它有很多种花样，后面会挨个介绍。每条规则自己负责三件事：掉什么物品、堆叠多少个、以及掉落概率。

## ModNPC.ModifyNPCLoot() vs GlobalNPC.ModifyNPCLoot() vs GlobalNPC.ModifyGlobalLoot()

放规则的地方一共三个，选错了后面会很难维护：

- 模组自己新增的 NPC，想给它配专属掉落 —— 代码写在 `ModNPC` 类的 `ModifyNPCLoot` 里。
- 想给某个特定的原版 NPC 加掉落 —— 写在一个 `GlobalNPC` 类的 `ModifyNPCLoot` 里。
- 想给所有 NPC 都加掉落（地牢宝箱钥匙、各种魂就是这种）—— 写在 `GlobalNPC.ModifyGlobalLoot` 里。

最后这种叫全局规则，不会出现在游戏的图鉴里。动手之前先想清楚该放哪儿，模组大了才不至于一团乱。

## 物品怎么填？

下面例子掉的都是原版物品 `ItemID.Shackle`（镣铐）。想换成自己模组的物品，把这个位置替换成 `ModContent.ItemType<ItemName>()` 就行。

# 完整示例

先看文件结构长什么样，具体规则怎么写放在后面的[常见掉落规则](#常见掉落规则)里讲。

为了简短，示例省掉了平时都会写的 using；但掉落规则和掉落条件**必须**引用下面这个命名空间：

```cs
using Terraria.GameContent.ItemDropRules;
```

除此之外可能还需要别的 using，示例里就不写了。

## 给模组 NPC 加掉落

```cs
namespace MyMod
{
	public class MyNPC : ModNPC
	{
		// Other code omitted from this example

		public override void ModifyNPCLoot(NPCLoot npcLoot) {
			// This is where we add item drop rules, here is a simple example:
			npcLoot.Add(ItemDropRule.Common(ItemID.Shackle, 50));
		}
	}
}
```

## 给原版 NPC 加掉落

```cs
namespace MyMod
{
	public class MyGlobalNPC : GlobalNPC
	{
		public override void ModifyNPCLoot(NPC npc, NPCLoot npcLoot) {
			// First, we need to check the npc.type to see if the code is running for the vanilla NPC we want to change
			if (npc.type == NPCID.VampireBat) {
				// This is where we add item drop rules for VampireBat, here is a simple example:
				npcLoot.Add(ItemDropRule.Common(ItemID.Shackle, 50));
			}
			// We can use other if statements here to adjust the drop rules of other vanilla NPC
		}
	}
}
```

### 特殊情况

有几个原版 Boss 得特殊对待：它们被判定为「已击杀、可以掉战利品了」的条件比较特别，需要额外包一层规则。

世界吞噬怪（Eater of Worlds）：

```c#
if (System.Array.IndexOf(new int[] { NPCID.EaterofWorldsBody, NPCID.EaterofWorldsHead, NPCID.EaterofWorldsTail }, npc.type) > -1)
{
	LeadingConditionRule leadingConditionRule = new(new Conditions.LegacyHack_IsABoss());
	leadingConditionRule.OnSuccess(/*Your rule goes here*/);
	//leadingConditionRule.OnSuccess(/*Additional rules as new lines*/);
	npcLoot.Add(leadingConditionRule);
}
```

双子魔眼（The Twins）：

```c#
if (npc.type == NPCID.Retinazer || npc.type == NPCID.Spazmatism)
{
	LeadingConditionRule leadingConditionRule = new LeadingConditionRule(new Conditions.MissingTwin());
	leadingConditionRule.OnSuccess(/*Your rule goes here*/);
	//leadingConditionRule.OnSuccess(/*Additional rules as new lines*/);
	npcLoot.Add(leadingConditionRule);
}
```

## 给所有 NPC 加掉落（全局规则）

```cs
namespace MyMod
{
	public class MyGlobalNPC : GlobalNPC
	{
		public override void ModifyGlobalLoot(GlobalLoot globalLoot) {
			// This is where we add global rules for all NPC. Here is a simple example:
			globalLoot.Add(ItemDropRule.Common(ItemID.Shackle, 50));
		}
	}
}
```

# 前置知识

## 概率（分母与分子）

给玩家看的概率通常是 25% 这种百分比，代码里却是分数。分数由分子（上面那个数）和分母（下面那个数）组成，比如 `1/4` 就对应 25%。很多掉落规则只让你填分母，分子默认是 1；当然，需要分子不为 1 的时候，也有别的构造方式可以用。

## 幸运值

// TODO: what is luck? how does it affect drops? Which rules are affected?

# 常见掉落规则

知道规则该写在哪了，接下来看规则本身怎么写。不少规则有好几种造法：最常用的是 `ItemDropRule` 类里的静态辅助方法，也可以直接用底层规则类 new 一个出来。

下面讲的每一条规则，都得注册进掉落数据库才算生效。比如你想用的是 `ItemDropRule.Common(ItemID.BeeGun)`，那最终写出来的就是 `npcLoot.Add(ItemDropRule.Common(ItemID.BeeGun));`。

## 掉落单件物品

`ItemDropRule.Common(int itemId, int chanceDenominator = 1, int minimumDropped = 1, int maximumDropped = 1)`

或者：`new CommonDrop(int itemId, int chanceDenominator, int amountDroppedMinimum = 1, int amountDroppedMaximum = 1, int chanceNumerator = 1)`

按参数里给的概率掉物品，掉出来的堆叠数量也能一起控制：

```cs
ItemDropRule.Common(ItemID.BeeGun) // Always drop 1 Bee Gun
ItemDropRule.Common(ItemID.BeeGun, 8) // Drop 1 Bee Gun 1 out of every 8 times (12.5% chance)
ItemDropRule.Common(ItemID.Torch, 4, 10, 15) // Drop a stack of 10 to 15 torches with 1 in 4 chance (25% chance)
new CommonDrop(ItemID.Torch, 5, 10, 15, 2) // Drop a stack of 10 to 15 torches with 2 in 5 chance (40% chance)
```

## 从多件物品里掉一件

`ItemDropRule.OneFromOptions(int chanceDenominator, params int[] options)`

或者 `ItemDropRule.OneFromOptionsWithNumerator(int chanceDenominator, int chanceNumerator, params int[] options)`

或者 `new OneFromOptionsDropRule(int chanceDenominator, int chanceNumerator, params int[] options)`

从一组候选物品里掉出 1 件。Boss 掉那一套武器里的其中一把，用的就是它。不过 Boss 的情况会稍微绕一点 —— 它们通常是「有条件地掉 Boss 袋」，细节看下面 LeadingConditionRule 那节。

```cs
// Drop one of these 3 items with 100% chance
ItemDropRule.OneFromOptions(1, ItemID.MagicDagger, ItemID.PhilosophersStone, ItemID.StarCloak)
// 1 in 100 or 1% chance to drop one of these 3 items. Or, effectively 0.33% chance each.
ItemDropRule.OneFromOptions(100, ItemID.AncientCobaltHelmet , ItemID.AncientCobaltBreastplate , ItemID.AncientCobaltLeggings) 
```

## 专家模式下概率不同的单件掉落

`ItemDropRule.NormalvsExpert(int itemId, int chanceDenominatorInNormal, int chanceDenominatorInExpert)`

或者 `new DropBasedOnExpertMode(IItemDropRule ruleForNormalMode, IItemDropRule ruleForExpertMode)`

很多好用的物品在专家模式下掉得更勤，就得用这条规则。

```cs
ItemDropRule.NormalvsExpert(ItemID.BlessedApple, 40, 30) // 1 in 40 (2.5%) chance in Normal. 1 in 30 (3.33%) chance in Expert
```

## 带条件掉落

`ItemDropRule.ByCondition(IItemDropRuleCondition condition, int itemId, int chanceDenominator = 1, int minimumDropped = 1, int maximumDropped = 1, int chanceNumerator = 1)`

或者 `new ItemDropWithConditionRule(int itemId, int chanceDenominator, int amountDroppedMinimum, int amountDroppedMaximum, IItemDropRuleCondition condition, int chanceNumerator = 1)`

传入一个 `IItemDropRuleCondition`，就能做出「只有满足条件才掉」的规则。

```cs
// Drop 1 Soul of Light 20% of the time if SoulOfLight condition met
new ItemDropWithConditionRule(ItemID.SoulofLight, 5, 1, 1, new Conditions.SoulOfLight()) 
// Drop 30 to 90 CrimtaneOre if the world is Crimson and not Expert mode
ItemDropRule.ByCondition(new Conditions.IsCrimsonAndNotExpert(), ItemID.CrimtaneOre, 1, 30, 90) 
```

## 前面的规则没中时再掉

分支写法见[规则串联](#规则串联)。

## 像双子魔眼那样掉落

这需要自己写一个条件，见下文。实现的时候可以把 `Conditions.MissingTwin` 的代码拿来当参考。

## 像月之碎片那样一件一件掉一堆

`new DropOneByOne(int itemId, DropOneByOne.Parameters parameters)`

`DropOneByOne` 的用法看 [MinionBossBody](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/MinionBoss/MinionBossBody.cs#L202)。

## Boss 袋

见下面的[完整的Boss示例](#完整的boss示例)。

## 每人一份（Instanced / Per Player）

// TODO

## 其它

// TODO: Add other common rules here

# 掉落条件（IItemDropRuleCondition）

很多掉落规则都允许传一个 `IItemDropRuleCondition` 进去，由它决定「要满足什么条件才会掉」。常见的条件有：当前正在发生的事件、世界里某个 Boss 是否已被击败、普通还是专家模式、当前所处生物群落，等等。

// TODO: Biome, Boss downed, Expert

## 自定义条件

需要的话，条件也能自己写。

ExampleMod 里的 `ExampleDropCondition` 就是一个现成的自定义条件例子，连它的几处调用一起看会更清楚。

### 首次击败 Boss 的条件

世纪之花（Plantera）必掉榴弹发射器和 50-149 个火箭 I，它的代码是这样的：

```cs
// First, a not expert rule is created
LeadingConditionRule notExpertRule = new LeadingConditionRule(new Conditions.NotExpert());
npcLoot.Add(notExpertRule);

// When the not expert rule is true, this firstTimeKillingPlanteraRule is attempted
LeadingConditionRule firstTimeKillingPlanteraRule = new LeadingConditionRule(new Conditions.FirstTimeKillingPlantera());
notExpertRule.OnSuccess(firstTimeKillingPlanteraRule);

// This rule drops a GrenadeLauncher and 50-149 RocketI as well
IItemDropRule greanadeLauncherRule = ItemDropRule.Common(ItemID.GrenadeLauncher);
greanadeLauncherRule.OnSuccess(ItemDropRule.Common(ItemID.RocketI, 1, 50, 150), hideLootReport: true);

// When the firstTimeKillingPlanteraRule succeeds, the greanadeLauncherRule will be attempted, dropping the items
firstTimeKillingPlanteraRule.OnSuccess(greanadeLauncherRule, hideLootReport: true);
// Otherwise, one out of these 7 rules will be attempted
firstTimeKillingPlanteraRule.OnFailedConditions(new OneFromRulesRule(1, greanadeLauncherRule, ItemDropRule.Common(ItemID.VenusMagnum), ItemDropRule.Common(ItemID.NettleBurst), ItemDropRule.Common(ItemID.LeafBlower), ItemDropRule.Common(ItemID.FlowerPow), ItemDropRule.Common(ItemID.WaspGun), ItemDropRule.Common(ItemID.Seedler)));
```

这套规则的意思是：非专家模式下，如果是头一回打死世纪之花，榴弹发射器必掉；不是第一次，就从那 7 条规则里随机中一条。关键在于 `Conditions.FirstTimeKillingPlantera` 这个条件，代码是：

```cs
public class FirstTimeKillingPlantera : IItemDropRuleCondition, IProvideItemConditionDescription
{
	public bool CanDrop(DropAttemptInfo info) => !NPC.downedPlantBoss;
	public bool CanShowItemDropInUI() => true;
	public string GetConditionDescription() => null;
}
```

重点在 `CanDrop` 方法，它只判断了一件事：`!NPC.downedPlantBoss`，也就是「Boss 还没被打败」时才允许掉。游戏就是靠这个字段记录世界里的世纪之花有没有被解决过。这里有个关键点要记住：**NPC 掉落是在 `NPC.downedPlantBoss` 这类 Boss 标记被置为 true 之前就结算的**，这个判断才能正常生效。

同样的套路可以用在别的原版 Boss 和模组 Boss 上。现成写好的只有 `FirstTimeKillingPlantera` 一个，其它 Boss 得自己实现 `IItemDropRuleCondition`，把判断换成对应的 [NPC.downedX bool](https://github.com/tModLoader/tModLoader/wiki/NPC-Class-Documentation#downedboss1)。模组 Boss 也是同一个写法，只不过标记要换成[自己 `ModSystem` 类里的 boss bool](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Common/Systems/DownedBossSystem.cs#L15)。

# 规则串联

规则可以串起来，拼出更复杂的掉落逻辑。拿蜂后（Queen Bee）举例：它有一组「四选一」的掉落 —— 33% 掉蜂窝棒，蜜蜂帽、蜜蜂衣、蜜蜂裤各 11%。写成代码是这样：

```cs
ItemDropRule.ByCondition(new Conditions.NotExpert(), ItemID.HiveWand, 3).OnFailedRoll(ItemDropRule.OneFromOptionsNotScalingWithLuck(2, ItemID.BeeHat, ItemID.BeeShirt, ItemID.BeePants))
```

先按 33% 掉蜂窝棒，且只在非专家模式下。再用 `OnFailedRoll` 接上第二条规则：从 3 件蜜蜂时装里掉一件，概率 50%。注意 `OnFailedRoll` 挂上去的规则，只有在「原规则条件成立、但随机数没中」的时候才会被尝试。既然有 66% 的概率会走到这个 50% 上，算下来就是 33% 掉出其中一件，每件各 11%。

串联还有另外两个方法：`OnSuccess` 和 `OnFailedConditions`。前者在原规则成功时执行，后者在条件不成立时执行。

用 `LeadingConditionRule` 的话，可以把一组规则挂在同一个条件底下，不用每条规则都重复写一遍条件。下面这段定义的是：非专家模式下，25% 掉蜂窝棒、50% 掉 10-30 个蜜蜂手雷。

```cs
// This code uses LeadingConditionRule to logically nest several rules under it.
LeadingConditionRule leadingConditionRule = new LeadingConditionRule(new Conditions.NotExpert());
leadingConditionRule.OnSuccess(ItemDropRule.Common(ItemID.HiveWand, 4));
leadingConditionRule.OnSuccess(ItemDropRule.Common(ItemID.Beenade, 2, 10, 30));
npcLoot.Add(leadingConditionRule);

vs
// This approach repeats the Condition code. Use whatever approach fits your logic
npcLoot.Add(ItemDropRule.ByCondition(new Conditions.NotExpert(), ItemID.HiveWand, 4));
npcLoot.Add(ItemDropRule.ByCondition(new Conditions.NotExpert(), ItemID.Beenade, 2, 10, 30));
```

另外两种常见套路：一次掉一整套护甲，或者武器带着自己的专属弹药一起掉，写法大同小异。

```cs
//Drops the full copper armor set with 20% chance. This works by dropping the helmet with 20% chance, and then the other pieces with 100% chance if succeeded.
IItemDropRule copperArmorRule = ItemDropRule.Common(ItemID.CopperHelmet, 5);
copperArmorRule.OnSuccess(ItemDropRule.Common(ItemID.CopperChainmail, 1));
copperArmorRule.OnSuccess(ItemDropRule.Common(ItemID.CopperGreaves, 1));
npcLoot.Add(copperArmorRule);

//Drops the snowball cannon with 50% chance, and with it 75-150 snowballs. hideLootReport is used to prevent the snowballs from appearing in the bestiary. This makes sense here as snowballs are tied to the snowball cannon
var snowballCannonRule = ItemDropRule.Common(ItemID.SnowballCannon, 2);
snowballCannonRule.OnSuccess(ItemDropRule.Common(ItemID.Snowball, 1, 75, 150), hideLootReport: true);
npcLoot.Add(snowballCannonRule);
```

### 常见错误

一个特别容易踩的坑：把本该串联的规则当成普通规则加进去了，结果条件看起来完全不起作用。还是上面蜂窝棒/蜜蜂手雷那个例子，如果有人写成这样，`NotExpert` 条件就等于白写：

```cs
LeadingConditionRule leadingConditionRule = new LeadingConditionRule(new Conditions.NotExpert());
npcLoot.Add(leadingConditionRule.OnSuccess(ItemDropRule.Common(ItemID.HiveWand, 4)));
npcLoot.Add(leadingConditionRule.OnSuccess(ItemDropRule.Common(ItemID.Beenade, 2, 10, 30)));
```

问题出在 `leadingConditionRule` 本身压根没被加进掉落表：`OnSuccess` 会把「刚串上去的那条规则」返回回来，于是这两条 `ItemDropRule.Common` 被顺手直接 add 了，`NotExpert` 条件自然就被绕过去了。所以写 `OnSuccess`、`OnFailedConditions`、`OnFailedRoll` 时，要当作独立语句来写，别塞进 `npcLoot.Add` 里面；等所有子规则都挂好，最后再把 `LeadingConditionRule` 加一次。

# 完整的Boss示例

Boss 的掉落跟游戏难度挂钩：专家模式下，每个玩家都会掉一个 Boss 袋；普通模式下则是把「袋子里本该开出来的东西」直接掉出来，专家专属物品除外。这个例子展示的就是这套模式。

完整的 `ModifyNPCLoot` 代码可以看 [MinionBossBody](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/MinionBoss/MinionBossBody.cs)，对应的 `ModifyItemLoot` 看 [MinionBossBag](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Consumables/MinionBossBag.cs)。下面是个最小示例：

```cs
//The important parts to handle proper difficulty drops and the boss bag are the following:
//1. The boss:
//1.1. In the ModifyNPCLoot hook
npcLoot.Add(ItemDropRule.BossBag(ModContent.ItemType<MinionBossBag>())); // BossBag rule automatically checks expert mode itself
//1.2. Put any loot that belongs in the bag based on the "not expert" condition
LeadingConditionRule notExpertRule = new LeadingConditionRule(new Conditions.NotExpert());
notExpertRule.OnSuccess(ItemDropRule.Common(ModContent.ItemType<MinionBossMask>(), 7));

//2. The bag:
//2. In the ModItem
//2.1. In SetStaticDefaults, set ItemID.Sets.BossBag to true
ItemID.Sets.BossBag[Type] = true;
//2.2. Return true in CanRightClick
public override bool CanRightClick() {
	return true;
}
//2.3. In the ModifyItemLoot hook, replicate the drops from ModNPC.ModifyNPCLoot and add expert specific drops and money
public override void ModifyItemLoot(ItemLoot itemLoot) {
	itemLoot.Add(ItemDropRule.Common(ModContent.ItemType<MinionBossMask>(), 7)); // copy of non-expert drops from ModNPC.ModifyNPCLoot
	itemLoot.Add(ItemDropRule.Common(ItemID.JungleYoyo)); // expert specific drop example
	itemLoot.Add(ItemDropRule.CoinsBasedOnNPCValue(ModContent.NPCType<MinionBossBody>())); // drop money
}
```

# 查阅原版掉落代码

想知道某个原版掉率在代码里长什么样，最直接的办法是去读反编译出来的代码。所有原版掉落都集中在 `Terraria.GameContent.ItemDropRules.ItemDropDatabase` 这个类里。用查找功能搜你关心的那个 NPC 的 NPCID 数字，就能定位到相关片段。

## 示例

// TODO: example of finding a particular rule from the code

### 击杀 NPC 的玩家

// TODO: This section is still 1.3 approach

有时候我们想对「最后打了这个 NPC 的玩家」做点什么。`NPC` 有个 `lastInteraction` 字段，默认值是 255，表示还没有玩家打过它。如果伤害全是城镇 NPC 或者陷阱造成的，NPC 死的时候 `lastInteraction` 可能还停在 255。正因为这样，给击杀者发奖励这一类代码通常会写成下面这样，必要时退回用 `FindClosestPlayer`：

```c#
int playerIndex = npc.lastInteraction;
if (!Main.player[playerIndex].active || Main.player[playerIndex].dead)
{
	playerIndex = npc.FindClosestPlayer(); // Since lastInteraction might be an invalid player fall back to closest player.
}
Player player = Main.player[playerIndex];
// Other code affecting the player. Might need ModPackets if relevant.
```

# 修改掉落

掉落不只能加，也能改。具体做法看 [ExampleNPCLoot](https://github.com/tModLoader/tModLoader/blob/1.4/ExampleMod/Common/GlobalNPCs/ExampleNPCLoot.cs)。

# 基础篇不涉及的内容

* 还没写，想看什么告诉我们。
