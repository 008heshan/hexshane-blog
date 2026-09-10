---
title: Basic Minion Guide
date: 2026-08-31 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic Minion Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Minion-Guide)。

仆从（minion）本质上就是一个弹幕，可它还得被召唤出来、一直活着、能被取消，还得跟着你走、自己找目标打。这些活儿分散在三个类里。下面把它们各自管什么、怎么互相咬合讲清楚，顺带给出大多数仆从共用的那几段 AI 代码。

# 简介

仆从首先是一个弹幕（projectile）。别跟克苏鲁之脑的飞眼怪（Creeper）那种“Boss 的仆从”弄混 —— 那玩意是 NPC。所以你要继承 tModLoader 提供的 `ModProjectile` 类。

召唤用的那把武器，得继承 `ModItem`。最后还差一个 `ModBuff`，它决定仆从能不能真的待在你身边，以及能不能被取消召唤。

一共就这三个：

* [ModProjectile](#modprojectile)
* [ModItem](#moditem)
* [ModBuff](#modbuff)

听着挺唬人，其实不然 —— 后两个类基本就是照抄示例，你自己的代码几乎全写在 `ModProjectile` 里，仆从怎么行动由它说了算。真正容易绕进去的，是这几个类之间怎么衔接。所以配套的 [ExampleSimpleMinion](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Content/Projectiles/Minions) 特意把它们塞进同一个文件夹、同一个文件里，方便对照。看这一篇时强烈建议开着 [IDE](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE)，类与类的关系会直观很多。

# ModBuff

这个类负责让仆从真的被召唤出来、并且一直存活，同时支持右键点掉图标取消召唤。另外，buff 会自己给自己续期，所以它的持续时间实际上是无限的。

`Update()` 里那段代码要是漏了，可能会出两种毛病：

* 取消 buff 之后，仆从还赖着不走
* 仆从明明没被召唤，buff 却还挂在身上

你以后写的仆从，这里基本都是同一份代码，把示例里的 `ExampleSimpleMinion` 换成自己的类名就行。完整代码在[这里](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/Minions/ExampleSimpleMinion.cs#L21)。

# ModItem

这是你用来召唤仆从的武器。

## 必须实现的部分

它和别的武器大同小异，`SetDefaults()` 里有几处值得留意：

```csharp
// So the weapon doesn't damage like a sword while swinging 
Item.noMelee = true;
// The damage type of this weapon
Item.DamageType = DamageClass.Summon;
Item.buffType = ModContent.BuffType<ExampleSimpleMinionBuff>();
Item.shoot = ModContent.ProjectileType<ExampleSimpleMinion>();
```

注意这里没写 `Item.buffTime` 和 `Item.shootSpeed` —— 通常下面两行都会各配一个。原因是：buff 时间会显示在物品的提示文本里（比如“持续 1 分钟”），可仆从的持续时间本来就是无限的，写上去只会让人误解；而仆从有自己的一套移动逻辑，`shootSpeed` 在大多数情况下根本用不上。

```csharp
public override void ModifyShootStats(Player player, ref Vector2 position, ref Vector2 velocity, ref int type, ref int damage, ref float knockback) {
	position = Main.MouseWorld;
}

public override bool Shoot(Player player, EntitySource_ItemUse_WithAmmo source, Vector2 position, Vector2 velocity, int type, int damage, float knockback) {
	player.AddBuff(Item.buffType, 2);

	var projectile = Projectile.NewProjectileDirect(source, position, velocity, type, damage, knockback, Main.myPlayer);
	projectile.originalDamage = Item.damage;

	return false;
}

```

这段必不可少：有了它，“维持仆从存活、并允许正常取消召唤”的那个 buff 才会真正挂上。完整代码在[这里](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/Minions/ExampleSimpleMinion.cs#L40)。

# ModProjectile

仆从本体就写在这个文件里，你绝大部分代码都会堆在这儿。碰上弹幕相关的具体问题，先翻 [Basic Projectile Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile)。

## 必须实现的部分

（右键指定目标的那段必需代码在[下文](#插叙：右键索敌)）

先来一坨让这个弹幕被判定成“仆从”的代码。

### 默认值

在 `SetStaticDefaults()` 里：

```csharp
// Sets the amount of frames this minion has on its spritesheet
Main.projFrames[Projectile.type] = 4;
// This is necessary for right-click targeting
ProjectileID.Sets.MinionTargettingFeature[Projectile.type] = true;

Main.projPet[Projectile.type] = true; // Denotes that this projectile is a pet or minion

ProjectileID.Sets.MinionSacrificable[Projectile.type] = true; // This is needed so your minion can properly spawn when summoned and replaced when other minions are summoned
ProjectileID.Sets.CultistIsResistantTo[Projectile.type] = true; // Make the cultist resistant to this projectile, as it's resistant to all homing projectiles.
```

在 `SetDefaults()` 里：

```csharp
// Only controls if it deals damage to enemies on contact (more on that later)
Projectile.friendly = true;
// Only determines the damage type
Projectile.minion = true;
// Declares the damage type (needed for it to deal damage)
Projectile.DamageType = DamageClass.Summon; 
// Amount of slots this minion occupies from the total minion slots available to the player (more on that later)
Projectile.minionSlots = 1f;
// Needed so the minion doesn't despawn on collision with enemies or tiles
Projectile.penetrate = -1;
```

### 接触伤害

如果你的仆从是靠一头撞上去打伤害（接触伤害），需要这两个钩子：

```csharp
// Here you can decide if your minion breaks things like grass or pots
// (in this example false is returned, since having this on true might cause the queen bee larva to break and summon the boss accidently)
public override bool? CanCutTiles() {
	return false;
}

public override bool MinionContactDamage() {
	return true;
}
```

另外还得在 `AI()` 里把 `Projectile.friendly` 设成“当前有没有目标”的那个布尔值（下面会讲）。这是为了让它待机时不会去打训练假人。

### 存活检查

`AI()` 里最开头永远先写这段，同样把 `ExampleSimpleMinionBuff` 换成你自己的：

```csharp
Player player = Main.player[Projectile.owner];
if (player.dead || !player.active) {
	player.ClearBuff(ModContent.BuffType<ExampleSimpleMinionBuff>());
}
if (player.HasBuff(ModContent.BuffType<ExampleSimpleMinionBuff>())) {
	Projectile.timeLeft = 2;
}
```

到这一步，仆从技术上已经能被正常召唤了。但它什么也不会做 —— 那怎么让它真的动起来？

## 仆从 AI

仆从攻击敌人有两条路：直接撞上去造成接触伤害，或者朝敌人发射别的弹幕。移动方式也分两种：受重力影响，或者不受。`ExampleSimpleMinion` 展示的是最简单的一类：接触伤害 + 飞行（而且不与图格碰撞，又省掉一堆麻烦）。

再简单的仆从，想让它好好干活也得写不少代码。不过来回就那么几个“操作”：

* 通用行为（算好待机位置、和其他仆从错开，等等）
* 索敌（按条件挑出要打的敌人）
* 移动与攻击
* 动画与视觉效果

如果你的仆从行为更复杂，可以考虑用状态（states）的思路来设计 AI。用状态写的 NPC 示例在[这里](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/ExampleCustomAISlimeNPC.cs)，同样的概念可以套到仆从上。

下面这些代码全都写在 `AI()` 钩子里（完整写法是 `public override void AI()`）。

### 通用行为

归在这一类里的活儿有：

* 初始化一些变量
* 和其他仆从排好队（你会发现大多数仆从会依次重排到你身后）
* 玩家或仆从离得太远时，瞬移回玩家身边

不打架的时候，你大概希望仆从跟在自己附近？那就得给它一个“待机位置”，没有合适目标时它就往那儿去。待机位置可以是：

* 玩家头顶
* 玩家身后，排进召唤出来的仆从队列里

下面这段是两者的结合：

```csharp
Vector2 idlePosition = player.Center;
idlePosition.Y -= 48f;
float minionPositionOffsetX = (10 + Projectile.minionPos * 40) * -player.direction;
idlePosition.X += minionPositionOffsetX;
```

`Projectile.minionPos` 是它在召唤出来的仆从列表里的序号。后面算移动还会用到这两个变量：

```csharp
Vector2 vectorToIdlePosition = idlePosition - Projectile.Center;
float distanceToIdlePosition = vectorToIdlePosition.Length();
```

这里能做的事还有不少，具体看 `ExampleSimpleMinion` 里 `General behavior` 那个 region。

接下来才是重头戏：让它真的做点什么。

### 索敌

注意：在 1.4 里，大多数情况直接用 `Minion_FindTargetInRange` 就够了。

```
int startAttackRange = 700;
int attackTarget = -1;
Projectile.Minion_FindTargetInRange(startAttackRange, ref attackTarget, false);
```

仆从想打人，就得先知道该打谁 —— 更要紧的是知道不该打谁。先备好要用的几个变量：

```csharp
// Starting search distance
float distanceFromTarget = 700f;
Vector2 targetCenter = Projectile.position;
bool foundTarget = false;
```

然后遍历世界上所有 NPC，看它们够不够格当目标：

```csharp
for (int i = 0; i < Main.maxNPCs; i++) {
	NPC npc = Main.npc[i];
	if (npc.CanBeChasedBy()) {
		/* If we are here, that means we found an NPC that is:
		* active (alive)
		* chaseable (e.g. not a cultist archer)
		* max life bigger than 5 (e.g. not a critter)
		* can take damage (e.g. moonlord core after all it's parts are downed)
		* hostile
		* not immortal (e.g. not a target dummy)
		*/
		}
	}
}
```

在这个 `if` 里面，与 NPC 和你的仆从有关的条件随便写，比如：

```csharp
float between = Vector2.Distance(npc.Center, Projectile.Center);
bool closest = Vector2.Distance(Projectile.Center, targetCenter) > between;
bool inRange = between < distanceFromTarget;
bool lineOfSight = Collision.CanHitLine(Projectile.position, Projectile.width, Projectile.height, npc.position, npc.width, npc.height);
bool abovePlayer = player.Center.Y > npc.Center.Y;
```

把它们组合起来，大致就是这样：

```csharp
// The !foundTarget check is so it ignores any range checks
if (((closest && inRange) || !foundTarget) && lineOfSight)
```

一旦锁定目标，就更新搜索用的变量，保证最后留下的是最近的那个 NPC：

```csharp
distanceFromTarget = between;
targetCenter = npc.Center;
foundTarget = true;
```

找到目标之后，如果你的仆从打的是接触伤害，还得把 friendly 状态同步好。配合 `MinionContactDamage()`，就能做到只在有目标时才造成伤害：

```csharp
Projectile.friendly = foundTarget;
```

### 插叙：右键索敌

如果你的召唤武器要支持右键指定目标，需要在正常的索敌循环之前加上这段：

```csharp
if (player.HasMinionAttackTargetNPC) {
	NPC npc = Main.npc[player.MinionAttackTargetNPC];
	float between = Vector2.Distance(npc.Center, Projectile.Center);
	// Reasonable distance away so it doesn't target across multiple screens
	if (between < 2000f) {
		distanceFromTarget = between;
		targetCenter = npc.Center;
		foundTarget = true;
	}
}
if (!foundTarget) {
	// Regular target finding loop
}
```

再在 `SetStaticDefaults()` 里补一句：

```csharp
ProjectileID.Sets.MinionTargettingFeature[Projectile.type] = true;
```

完整代码见 `ExampleSimpleMinion` 的 `Find target` region。

### 移动与攻击

理想状态下，仆从待机时跟着你走，有敌人时就朝敌人扑过去。怎么实现？下面这个公式能在 `start` 到 `end` 之间做一次简单飞行。至于在地面上跑的仆从，会麻烦不少（文末有说明）。

```csharp
float speed = 8f;
float inertia = 40f;
Vector2 direction = end - start;
direction.Normalize();
direction *= speed;
Projectile.velocity = (Projectile.velocity * (inertia - 1) + direction) / inertia;
```

`speed` 好理解：它直线飞行时想要的速度。`inertia` 决定仆从朝 `direction` 加速时有多“迟钝” —— 值越大转得越慢，值越小动作越抽搐。`end` 是目的地的 `Vector2`（敌人目标或待机位置），`start` 最好固定用 `Projectile.Center`。

落到代码里，其实就是看 `foundTarget`：有目标就把 `targetCenter` 当 `end`，否则把 `vectorToIdlePosition` 当 `direction`；再配合前面算出来的距离做几个判断，免得仆从“粘”在目的地上不动。

接下来这套移动方式（以及射击）要用到计时器，[这篇指南](https://github.com/tModLoader/tModLoader/wiki/Time-and-Timers)可以帮上忙。

如果你的仆从要冲刺（比如致命球那样），那就是朝某个方向来一次定时的速度暴增，再额外叠一段减速。`ExampleSimpleMinion` 走的是最简路线，没写这部分。

打接触伤害的仆从是边移动边打，发射弹幕的仆从不是，所以射击代码得单独写。这段不在 `ExampleSimpleMinion` 里，而在[另一个仆从示例](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Old/Projectiles/Minions/HoverShooter.cs) `HoverShooter` 的 `AI()` 末尾。（注意：`HoverShooter` 还没移植到 1.4 的 ExampleMod，代码要自己调整。）

完整的移动代码见 `ExampleSimpleMinion` 的 `Movement` region。

### 动画与视觉效果

仆从会动了，但没有动画（前提是你给它画了 spritesheet），看上去就很呆。下面这段做的是“按固定频率从上到下一帧帧循环”：

```csharp
int frameSpeed = 5;
Projectile.frameCounter++;
if (projectile.frameCounter >= frameSpeed) {
	Projectile.frameCounter = 0;
	Projectile.frame++;
	if (Projectile.frame >= Main.projFrames[Projectile.type]) {
		Projectile.frame = 0;
	}
}
```

`frameCounter` 是游戏提供的变量，可以拿来做动画（数切换下一帧之前已经过了多少 tick）。`frame` 是这张图里的第几张（从上往下数，从 0 开始）。

视觉效果想做成什么样都随你，只是有的实现起来比别的麻烦。下面是几个简单的：

**沿 x 轴朝移动方向倾斜：**

```csharp
Projectile.rotation = Projectile.velocity.X * 0.05f;
```

**发光：**

```csharp
Lighting.AddLight(Projectile.Center, Color.White.ToVector3() * 0.78f);
```

**产生尘埃：**

```csharp
if (Main.rand.NextBool(5)) {
Dust.NewDust(Projectile.position, Projectile.width, Projectile.height, DustID.Fire);
}
```

其它手段在 [Basic Projectile Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile) 里提到过。

完整代码在[这里](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/Minions/ExampleSimpleMinion.cs#L100)。

# 常见问题

**我想让武器一次召唤两个仆从，像光棱法杖（Optic Staff）那样**

1. 在 `ModProjectile` 里把 `Projectile.minionSlots` 设成 0.5f。
2. 在 `ModItem` 的 `Shoot()` 钩子里，用 `Projectile.NewProjectile()` 再生成一个弹幕。

**我想召唤占用多个仆从栏位的弹幕，或者一次召唤多个（总占用栏位大于 1）**

如果适用的话，看上一条。另外，在 `ModItem` 的 `SetStaticDefaults()` 里，把一次使用武器会占用的仆从栏位数赋给它：

```csharp
ItemID.Sets.StaffMinionSlotsRequired[Item.type] = 2f; // 2f as an example
```

然后在 `CanUseItem()` 钩子里：

```csharp
return player.maxMinions >= ItemID.Sets.StaffMinionSlotsRequired[Item.type];
```

**我想让仆从在地面上跑，而不是飞**

把移动和各种仆从状态协调起来 —— 比如一直贴着玩家、遇敌起跳、离玩家太远就飞过去 —— 属于更进阶的内容，本篇不涉及。可以先看看下面几条。

**敌人躲到平台下面时，我的仆从不会穿下去**

仆从不会飞的话，就得用 `TileCollideStyle()` 钩子。你可能会想把 `foundTarget`、`targetCenter` 这些做成 `ModProjectile` 的字段，而不是留在 `AI()` 里当局部变量 —— 这样在这儿就不用再做一遍索敌了（见[索敌](#索敌)）。真这么做的话，记得在 `AI()` 里把它们重置回默认值，否则上一帧的状态会串到这一帧。

```csharp
if (foundTarget) {
	Vector2 toTarget = targetCenter - Projectile.Center;
	// Here we check if the NPC is below the minion and 300/16 = 18.25 tiles away horizontally
	if (toTarget.Y > 0 && Math.Abs(toTarget.X) < 300) {
		fallThrough = true;
	}
	else {
		fallThrough = false;
	}
}
else {
	fallThrough = false;
}
return base.TileCollideStyle(ref width, ref height, ref fallThrough, ref hitboxCenterFrac);
```

**我想做点原版那样、示例里却没有的东西**

最好的办法是自己去翻原版源码，方法看[这里](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adaption)。

**我想做一个星尘之龙那样的仆从**

它的代码里有相当一部分（主要是替换 / 追加体节那段）是硬编码死的。你能做的，最多就是一次性把所有需要的体节都召唤出来。
