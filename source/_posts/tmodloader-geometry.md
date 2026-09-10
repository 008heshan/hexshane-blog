---
title: Geometry
description: 写弹幕/位移绕不开的向量基础：长度、归一化、旋转、朝向目标，以及速度和加速度的直觉。
date: 2026-09-05 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Geometry](https://github.com/tModLoader/tModLoader/wiki/Geometry)。

# 为什么需要几何

想做点视觉上花哨的效果、或者有点意思的行为，多少都得懂一点几何。这篇讲的就是 tModLoader 模组开发里最基础的那部分几何用法。

比如把 `Dust` 或弹幕排成一个弧形撒出去、让敌怪朝玩家射击、写追踪（homing）逻辑，全都要用到它。基础概念讲完，后半篇会给出这些例子的具体代码。

# 前置知识

## 几何基础

做游戏开发的程序员，几何几乎是必修课。Terraria 是 2D 游戏，用得上的几何知识并不深，但**向量（Vector）的基本概念必须熟**。

## 坐标系

Terraria 里同时存在好几套坐标系，如果你之前没做过图形相关的东西，X、Y 正方向可能会让你意外。先看 [Coordinates](https://github.com/tModLoader/tModLoader/wiki/Coordinates) 这一页，把世界坐标（world coordinates）和 X、Y 的正方向搞清楚。

## 旋转

旋转用弧度（radians）表示，不是角度（degrees）。想用角度的话，调一下 `MathHelper.ToRadians` 转换即可。一般只在"一次性赋值"的场合才用角度，比如声明这把武器散射 30 度。另外记住：旋转值为 0 时朝向右边；因为 Y 轴向下，所以转 90 度指向正下方。

# Vector2

`Vector2` 是个结构体（struct），表示几何意义上的二维向量。它只有两个字段 `X` 和 `Y`，分别是这个二维向量在 X、Y 方向上的分量大小。在 tModLoader 里 `Vector2` 主要有两种用途。

一是表示位置。`Player`、`Projectile`、`Dust`、`NPC` 等很多游戏对象，位置都用 `Vector2` 存。

二是表示速度（velocity），也就是物体在 X、Y 两个方向上跑得多快。举个例子：玩家当前位置是 `3, 7`，速度是 `4, 8`，那游戏每次更新位置，玩家就按这个速度挪一次。上例更新一次后位置变成 `7, 15` —— 因为 `3 + 4 = 7`、`7 + 8 = 15`。看得出来，向量相加就是把各个分量分别相加。若向量 A 表示位置、向量 B 表示速度，那么经过 X 个单位时间后，新位置等于 `A + X * B`。

下面的视频用 Terraria 的坐标系演示了这件事，注意每一帧（tick）位置变化的量正好等于玩家的速度。还要记住游戏每秒更新 60 次，所以速度的单位是"每个更新周期移动多少世界坐标单位"，不是"每秒多少"。

https://github.com/tModLoader/tModLoader/assets/4522492/e5c11e4c-b6d8-43c0-bbe5-9feb07105ced

向量也能表示两点之间的差值。最典型的例子是敌怪朝玩家发射弹幕：想让敌怪射得准，代码得先知道往哪个方向射。方向可以用 `player.position` 减去 `npc.position` 算出来。向量相减和相加一个道理，X 跟 X 相减、Y 跟 Y 相减，从 A 指向 B 的向量公式就是 `vector = B - A`。

假设敌怪在 `14, 4`、玩家在 `3, 12`，拿玩家位置减敌怪位置，结果是 `-11, 8`。这个向量在代码里还不能直接用 —— 它表示的是位置的原始差值，不是方向。想把它变成方向、再拿去生成弹幕，看下面 `Vector2.Normalize` 那一节。

### position 与 Center

顺带说一个容易踩的点：`Player.position` 指的是实体左上角，不是中心，游戏就是这么设计的。所以代码里其实很少直接用 `Player.position`，更常用的是 `Player.Center`，它指向实体中心。（所有实体都可以看成一个矩形碰撞箱。）`NPC.Center` 和 `Projectile.Center` 同理。后面的内容统一用 `.Center`，因为它更符合直觉。

## 加速度

游戏更新弹幕之类的物体位置时，会把当前速度叠加到当前位置上，每秒做 60 次，单位是世界坐标。像子弹这种弹幕，这样处理就够了；但我们还可以引入"加速度"，让它随时间改变速度，做出更有意思的轨迹。加速度会出现在各种 `AI` 方法和碰撞相关方法里，拿它模拟重力、空气阻力、追踪都行。

### 重力

模拟重力就是每次更新时给实体加一个正的 Y 方向速度。游戏默认给玩家加重力；NPC 只要 `NPC.noGravity` 为 false 就受重力影响；`Dust` 也有 `noGravity` 字段。弹幕不受重力影响，想让它往下掉，得自己在 `ModProjectile.AI` 里加重力。[Basic Projectile](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile#gravity) 里讲了重力的各种实现细节。

```cs
Projectile.velocity.Y = Projectile.velocity.Y + 0.1f;
```

### 阻力 / 空气阻力

空气阻力的模拟见 [Basic Projectile](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile#wind-resistance)。简单说就是每次把速度的某个分量乘上一个略小于 1 的系数，让它慢慢衰减。

### 追踪

最简单形式的追踪，本质上就是朝目标方向持续加速。见 [Basic Projectile](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile#homing)。

### 碰撞与反弹

弹幕撞到实心物块时速度会瞬间反向，于是弹了起来。细节见 [Basic Projectile](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile#bounce-and-ontilecollide)。

### 加速度可视化示例

下面这个视频把上面大部分内容汇总演示了一遍。红色箭头是速度，蓝色箭头是加速度。看手里剑（Shuriken）那组：加速度略微指向左下 —— 向左的分量来自空气阻力，向下的分量来自重力。另外值得注意的是，手里剑刚生成的三分之一秒内没有任何力作用在它身上，这是用计时器实现的，见 [delayed gravity](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile#delayed-gravity) 那一节，也是它轨迹有意思的原因。手雷没有空气阻力，所以只看得到重力；它撞上物块的一瞬间会出现一个很大的力，那就是让速度反向的碰撞力。

https://github.com/tModLoader/tModLoader/assets/4522492/c6ee3ea3-1485-419b-b113-41cf2a23ea07

## Vector2.Normalize

处理向量时，很多时候我们并不关心它有多长，只关心它指向哪个方向。想象一个敌怪，东边 100 单位处站着一个玩家，同一方向上 1000 单位处还站着另一个玩家。把敌怪到两个玩家的向量分别算出来，它们方向相同，但后者长度是前者的 10 倍。要是直接在 `AI` 里拿这两个向量去生成弹幕，射向第二个玩家的弹幕速度会是第一个的 10 倍。这显然不行 —— 我们希望不管玩家离多远，敌怪的弹幕速度都一致。（这里假设是子弹类弹幕；如果你想让敌怪扔手雷，那确实得把距离考虑进去，但上限不超过敌怪预期的最大投掷速度。这种进阶 AI 行为不在本篇讨论范围。）

解决办法就是"归一化"（normalize）：把向量缩放成长度为 1，得到的就是所谓的单位向量（unit vector）。你可以用学校里学的勾股定理手算，不过 `Vector2` 类本身就带这个功能。但别直接用普通的 `Normalize` 方法 —— 它有除零的风险，会把游戏搞崩。要用的是 `SafeNormalize`：

```cs
// This code would likely be located in a ModNPC.AI method
// Note that player would be defined earlier in this code somehow, likely by using NPC.TargetClosest(); and Player player = Main.player[NPC.target];
// First, calculate the vector from the npc to the player by subtracting the two vectors in the correct order (Vector from A to B is B - A)
Vector2 vectorFromNpcToPlayer = player.Center - NPC.Center;
// Next, call SafeNormalize to scale the vector down to a length of 1 (aka, a unit vector), this results in a vector that only represents a direction
Vector2 directionFromNpcToPlayer = vectorFromNpcToPlayer.SafeNormalize(Vector2.UnitX);
// Next, we need our npc to have some intended shoot velocity. You'll want to experiment to find a good speed.
float shootVelocity = 10;
// Finally, we spawn the projectile in the intended direction with the intended initial velocity by multiplying the vector by our shootVelocity
Projectile.NewProjectile(source, NPC.Center, directionFromNpcToPlayer * shootVelocity, ProjectileID.BombSkeletronPrime, 5, 0, Main.myPlayer);
```

## Vector2.ToRotation

拿到一个 `Vector2`（归一化与否都行），调它的 `ToRotation` 方法就能算出对应的旋转值。恶魔眼（Demon Eye）这类飞行敌怪会转过来面向目标，用的就是这个。你可以用"敌怪指向玩家"的向量设置敌怪朝向，也可以用敌怪当前的速度设置 `NPC.rotation`。如果想让敌怪慢慢转向目标、而不是瞬间对准玩家，就得另外处理。

```cs
// First, calculate a Vector pointing towards what you want to look at
Vector2 vectorFromNpcToPlayer = player.Center - NPC.Center;
// Second, use the ToRotation method to turn that Vector2 into a float representing a rotation in radians.
float desiredRotation = vectorFromNpcToPlayer.ToRotation();
// Now we can do 1 of 2 things. The simplest approach is to use the rotation value directly
NPC.rotation = desiredRotation;
// A second approach is to use that rotation to turn the npc while obeying a max rotational speed. Experiment until you get a good value.
NPC.rotation = NPC.rotation.AngleTowards(desiredRotation, 0.02f); 
```

## 向量的乘法

向量乘一个 float 就能缩放。通常缩放的是归一化后的向量，比如上面 `Vector2.Normalize` 那个例子：我们拿到一个指向玩家的单位向量，乘上想要的射出速度，得到一个方向不变、但长很多的向量。把它填进 `Projectile.NewProjectile` 的 `velocity` 参数，弹幕就会以期望的速度朝期望的方向飞出去。

向量乘法还有别的用法。比如 [ExampleAdvancedFlailProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleAdvancedFlailProjectile.cs#L328) 里就把弹幕速度向量乘了 `0.2f` 或 `0.4f`（也就是 `bounceFactor` 变量），相当于把速度砍到原来的一小部分，让连枷撞上物块时有一种沉甸甸的手感。

## Vector2 的长度

不用勾股定理也能轻松求向量长度。求长度在很多场合都有用，比如敌怪要等玩家进入一定范围才开火 —— 判断敌怪到玩家向量的长度就够了。

```cs
// We can use the Length method of Vector2 to determine the length of an existing Vector2
Vector2 vectorFromNpcToPlayer = player.Center - NPC.Center;
float distanceBetweenPlayerAndNpc = vectorFromNpcToPlayer.Length();
// Or, we can use the Vector2.Distance method to calculate the length between 2 existing Vector2
float distanceBetweenPlayerAndNpc = Vector2.Distance(player.Center, NPC.Center);
// Then, use that value in your logic
if(distanceBetweenPlayerAndNpc < 300) {
    // Player is within range, spawn projectile here
}
```

### 长度的平方

如果你写的是遍历一大堆实体、找最近目标这种吃性能的代码，就该知道：用长度的平方更划算，也就是 `Vector2.DistanceSquared` 或 `Vector2.LengthSquared`。

## Vector2 的旋转

旋转向量用处很多，最常见的场景是给武器加散射误差。把一个原始 `Vector2` 交给 `RotatedByRandom`，就得到一个新的 `Vector2`，它被随机旋转至多给定的弧度。实际效果见 [ExampleShotgun.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Weapons/ExampleShotgun.cs#L38)。注意这么算出来的分布并不均匀 —— 对这个效果来说恰好合适。

也可以做非随机的旋转，用 `RotatedBy`。例如把向量旋转 `MathHelper.Pi / 2` 或 `MathHelper.ToRadians(90)`，就得到与原向量垂直的向量，拿它做分裂弹幕正合适。反复旋转还能算出一组构成弧线的向量，[ExampleGun.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Weapons/ExampleGun.cs#L79) 里吸血鬼刀那个例子就是这么做的。

# 随机向量

用随机向量给视觉效果和行为加变化很省事。生成随机向量的办法有好几种，下面每种都配了游戏内生成若干 `Dust` 的示例视频，方便对比效果。

## 圆内随机

这是最常用的做法，结果分布也很均匀。

```cs
// Normal approach
Vector2 speed = Main.rand.NextVector2Circular(1f, 1f);
// Generate vectors within an arc only. 
Vector2 speed = Main.rand.NextVector2Unit((float)MathHelper.Pi / 4, (float)MathHelper.Pi / 2) * Main.rand.NextFloat();
// NextVector2Circular allows supplying the width and height radii, for an oval distribution
Vector2 speed = Main.rand.NextVector2Circular(0.5f, 1f);
```

https://github.com/tModLoader/tModLoader/assets/4522492/07341fea-ad1f-4418-b464-c0a28093e96d

https://github.com/tModLoader/tModLoader/assets/4522492/d330ee58-8bda-4cc6-b37c-16b71daf321b

https://github.com/tModLoader/tModLoader/assets/4522492/80677a4e-6719-4a75-9d20-9665415b4a49

## 圆周上随机

让随机向量的端点落在圆周上，得到的随机向量长度（模长）就恒定。

```cs
// Normal approach
Vector2 speed = Main.rand.NextVector2Unit();
// Optional parameters allow for specifying a range of rotations. In this example, the start rotation is  MathHelper.Pi / 4 and it can be up to MathHelper.Pi / 2 more than that.
Vector2 speed = Main.rand.NextVector2Unit((float)MathHelper.Pi / 4, (float)MathHelper.Pi / 2);
```

https://github.com/tModLoader/tModLoader/assets/4522492/ada40247-d17c-4dc0-a7cd-87b531e0cd74

https://github.com/tModLoader/tModLoader/assets/4522492/35c9caa2-a907-4e97-91c7-731e62a317b5

## 正方形内随机

Terraria 的老代码里有一种挺怪的随机向量写法，X 和 Y 两个分量各自随机生成：

```cs
float xSpeed = Main.rand.NextFloat(-1f, 1f);
float ySpeed = Main.rand.NextFloat(-1f, 1f);
// Another approach
Vector2 speed = Utils.RandomVector2(Main.rand, -1f, 1f);
```

乍看没问题，但这个写法的分布其实很怪，可能不是你想要的：向量会比预期更长，向着一个假想正方形的四个角伸出去。下面的视频里那个形状就是证据。

https://github.com/tModLoader/tModLoader/assets/4522492/5bd85be8-15a8-4a1f-bea3-8a5d4a9e6809

## 正方形边上随机

没什么用。

# 示例

现在几何基础有了，也见过几个实现这些想法的 `Vector2` 方法，可以真正拿几何给模组写点有意思的行为了。

下面的例子里会拿 `Dust` 或弹幕来演示技巧，但两者可以互换。记得查一下你所调用方法的签名，搞清每个参数是干什么的。

## 撒出一圈 / 一团的随机效果

这就是上面随机向量那一节用的代码。这里用 for 循环生成 50 个 `Dust`，每个都带一个落在圆周上的随机向量。注意向量乘了 5 做放大，让 `Dust` 飞得足够远。

```cs
for (int i = 0; i < 50; i++) {
	Vector2 speed = Main.rand.NextVector2CircularEdge(1f, 1f);
	Dust d = Dust.NewDustPerfect(Main.LocalPlayer.Top, DustID.BlueCrystalShard, speed * 5, Scale: 1.5f);
	d.noGravity = true;
}
```

稍微用点几何就能让生成位置不再挤在同一处：给 `Main.LocalPlayer.Top` 加上 `speed * 32`，`Dust` 就会从一个小圆上冒出来再向外扩散，而不是全部从同一个点出发。

```cs
Dust d = Dust.NewDustPerfect(Main.LocalPlayer.Top + speed * 32, DustID.BlueCrystalShard, speed * 2, Scale: 1.5f);
```

速度调小了，是为了更容易看清效果。

https://github.com/tModLoader/tModLoader/assets/4522492/9b9913f2-afaa-487d-ab7c-df3b81739fcb

## 朝目标射击

[ExampleWormHead](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/ExampleWorm.cs#L73) 里演示了敌怪朝玩家发射弹幕的基本套路。

说白了就是：算出从发射源指向目标的向量，把它归一化，再乘上射击速度。注意要像示例里那样，只有攻击冷却、距离、视线检查都通过时才执行这段代码。

```cs
// The geometry of shooting towards a target:
Vector2 direction = (target.Center - NPC.Center).SafeNormalize(Vector2.UnitX); // normalized vector pointing towards the target
Vector2 velocity = direction * 7f; // shoot velocity
Projectile.NewProjectile(..., velocity, ...); // Use that velocity in NewProjectile where appropriate
```

## 面向目标

用 [Vector2.ToRotation](https://github.com/tModLoader/tModLoader/wiki/Geometry#vector2torotation) 就能让实体面向目标。如果你的贴图不是朝右画的，可能还得再加上 `MathHelper.Pi / 2`，把实体多转 90 度。另外要知道，弹幕或 NPC 朝向左边时有时会做水平翻转，这是靠 `spriteDirection` 这个 bool 实现的。如果它为 true，你可能得再补 180 度，也就是加 `MathHelper.Pi`：

```cs
// At the end of ModProjectile.AI
if (Projectile.spriteDirection == -1) { 
	Projectile.rotation += MathHelper.Pi;
}
```

# 延伸阅读

这篇吃透之后，接着了解一下碰撞会很有用。
