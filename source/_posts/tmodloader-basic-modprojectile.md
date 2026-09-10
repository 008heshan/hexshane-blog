---
title: Basic ModProjectile Guide
date: 2026-09-05 16:30:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic ModProjectile Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile)。

动手写弹幕之前，先分清楚物品和弹幕不是一回事：物品是能放进背包里的东西，而弹幕是被武器或敌怪"打出去"的东西。

# 哪些东西用到了弹幕

Terraria 里很多东西能起作用都是靠弹幕：枪和弓打出的子弹、箭，激光，炸弹和其它投掷物，还有大多数魔法武器。另外一些你未必会往弹幕上想的：钩爪、连枷、长矛、宠物、召唤物、钻头、悠悠球。很多敌怪也会发射弹幕。

# 制作一个弹幕

要在 Terraria 里做一个弹幕，先得写一个继承自 `ModProjectile` 的类（`ModProjectile` 就是弹幕的基类，你自己的弹幕类都要继承它）。在模组的源码目录（`My Games\Terraria\tModLoader\ModSources\MyModName`）里新建一个 `.cs` 文件，用文本编辑器打开，把下面这段粘进去，其中 `NameHere` 换成你的内部名，`ModNamespaceHere` 换成模组的文件夹名/命名空间。顺带说一句常见的坑：内部名里不要出现撇号或空格，机器认不出来。

```cs
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

namespace ModNamespaceHere
{
	public class NameHere : ModProjectile
	{
		
		public override void SetDefaults()
		{
			Projectile.arrow = true;
			Projectile.width = 10;
			Projectile.height = 10;
			Projectile.aiStyle = ProjAIStyleID.Arrow; // or 1
			Projectile.friendly = true;
			Projectile.DamageType = DamageClass.Ranged;
			AIType = ProjectileID.WoodenArrowFriendly;
		}

		// Additional hooks/methods here.
	}
}
```
`.cs` 文件有了，接着把你画好的贴图（一张 `.png`）放进同一个文件夹。文件名和目录结构有什么讲究，看 [Autoload](https://github.com/tModLoader/tModLoader/wiki/Basic-Autoload)。

# 找不到我做的弹幕

物品和弹幕是两码事，这是新手最容易卡住的地方：弹幕做出来了，却没意识到还得有东西去发射它。比如一把投掷飞刀武器，物品和弹幕你都得写；弹药类物品也一样，得给它配一个专属弹幕。反过来并不总是需要两个 —— 弹幕由敌怪生成时就没有物品什么事。测弹幕最快的方式是随手写个物品，把 `Item.shoot` 指向它，例如 `Item.shoot = ModContent.ProjectileType<MyProjectile>();`。ExampleMod 里物品发射弹幕的例子很多，物品和弹幕虽然在各自的文件夹里，找起来并不难。

# SetDefaults

`SetDefaults` 是弹幕最重要的方法，弹幕的各项数值都在这里定下来：判定框的宽高、是友方还是敌方、用哪套 AI，等等。`SetDefaults` 里常设的这些值分别是什么意思，见 [Projectile Class Documentation](https://github.com/tModLoader/tModLoader/wiki/Projectile-Class-Documentation)；原版弹幕实际填了什么值，查 [Vanilla Projectile Field Values](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Projectile-Field-Values)。[ExampleMod.Content.Projectiles](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Content/Projectiles) 里有大量现成例子。

## Projectile.damage

在 `SetDefaults` 里设 `Projectile.damage` 是白费力气 —— 弹幕生成时，这个值总会被 `Projectile.NewProjectile` 传进来的伤害覆盖掉。伤害通常由发射它的物品或 NPC 决定。

## DrawOffsetX, DrawOriginOffsetY, DrawOriginOffsetX

这三个是 `ModProjectile` 的字段，用来把判定框和贴图对齐。细节见 [Drawing and Collision](#Drawing-and-Collision)。

# 其他 Hooks/Methods

[ModProjectile 文档](https://docs.tmodloader.net/docs/stable/class_mod_projectile.html)里还列了一大堆钩子，用它们才能把弹幕做出自己的味道。比如想让弹幕打中敌人时挂个 debuff，用 `OnHitNPC`；想在弹幕撞到方块时做点什么，用 `OnTileCollide`。具体怎么用，翻文档和 ExampleMod 里的实际用例。

# AI 是什么

AI 决定弹幕生成之后怎么动、怎么表现，可以说是一个弹幕最核心的部分。新手最省事的做法是先蹭原版：设置 `Projectile.aiStyle = #;` 和 `AIType = ProjectileID.NameHere;`，直接借用别的原版弹幕写好的 AI 代码。这里有个前提，你填给 `aiStyle` 的数字，必须是 `AIType` 那个弹幕自己在用的 `aiStyle` 编号。这就是所谓的"模仿原版弹幕"。等你想要更复杂的运动，就会发现模仿这条路很快就到头了。下面把模仿和自定义 AI 都讲一遍。

# 用原版 AI

拿原版 AI 快速验证想法是很好用的。做一个回旋镖试试：只要跟会飞回来的原版弹幕用同一个 `aiStyle`，回旋镖就出来了。到 [Vanilla Projectile Field Values](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Projectile-Field-Values) 里查回旋镖类弹幕，会发现它们的 `aiStyle` 都是 3：
![各种回旋镖类弹幕的 aiStyle 取值（均为 3）](/img/posts/tmodloader-basic-modprojectile/RSaxV6T.png)    

于是代码里写 `Projectile.aiStyle = 3;` 就行（把 3 换成 `ProjAIStyleID.Boomerang` 可读性更好）。想再省点事，可以直接 `Projectile.CloneDefaults(ProjectileID.EnchantedBoomerang)`，一行把其余默认值也拷过来，得到的弹幕表现几乎和原版一样：
![CloneDefaults(EnchantedBoomerang) 之后的回旋镖（没有尘土效果）](/img/posts/tmodloader-basic-modprojectile/CL2MwaF.png)     

但你会发现尘土没出来。补上 `AIType` 就能修好。`AIType` 的作用是在 `aiStyle` 的基础上再细化一层：同一个 `aiStyle` 被很多弹幕共用，想用其中某一种弹幕的具体行为，就得靠 `AIType` 指定。把 `AIType` 也补上之后，我们的附魔回旋镖副本长这样：
![再补上 AIType 之后的回旋镖（尘土效果恢复）](/img/posts/tmodloader-basic-modprojectile/39KqXhc.png)    

最终的代码：

```cs
public override void SetDefaults()
{
	Projectile.CloneDefaults(ProjectileID.EnchantedBoomerang);
	// projectile.aiStyle = 3; This line is not needed since CloneDefaults sets it already.
	AIType= ProjectileID.EnchantedBoomerang;
}
```
尘土是好看了，可只要你想改尘土颜色，或者动任何一点细节，`aiStyle` 加 `AIType` 就不够用了。这种时候得去翻 [Vanilla Code Adaption](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adaption) 指南改原版代码，或者接着往下看，自己从零写 AI。记住，`projectile.aiStyle` 配 `AIType` 只是**做原型用的工具**，模组里稍微有点意思的弹幕，基本都得自己写 AI 或者改原版代码。

# 自定义 AI

下面这些是可以塞进你自己 AI 里的东西。如果用 `Projectile.CloneDefaults` 拷过别的弹幕的默认值，记得把 `Projectile.aiStyle` 改回 0。自定义 AI 的代码全写在 `ModProjectile.AI` 方法里。

## 计时器

很多弹幕靠计时器来延迟动作。一般用 `Projectile.ai[0]` 或 `Projectile.ai[1]`，因为这两个值会自动同步；用类里的字段也可以。下面这段数到 30，也就是半秒：

```cs
Projectile.ai[0] += 1f;
if (Projectile.ai[0] >= 30f)
{
	// Half a second has passed. Reset timer, etc.
	Projectile.ai[0] = 0f;
	Projectile.netUpdate = true;
	// Do something here, maybe change to a new state.
}
```

## 重力

弹幕身上其实没有"重力"这回事，所有会往下掉的弹幕都是在 AI 里自己写的代码。做法就是每帧给 `Projectile.velocity.Y` 加一个小值：
```cs
Projectile.velocity.Y = Projectile.velocity.Y + 0.1f; // 0.1f for arrow gravity, 0.4f for knife gravity
if (Projectile.velocity.Y > 16f) // This check implements "terminal velocity". We don't want the projectile to keep getting faster and faster. Past 16f this projectile will travel through blocks, so this check is useful.
{
	Projectile.velocity.Y = 16f;
}
```

### 延迟下落

箭和投掷小刀这类弹幕都会先飞几帧，之后才开始受重力影响：
```cs
Projectile.ai[0] += 1f; // Use a timer to wait 15 ticks before applying gravity.
if (Projectile.ai[0] >= 15f)
{
	Projectile.ai[0] = 15f;
	Projectile.velocity.Y = Projectile.velocity.Y + 0.1f;
}
if (Projectile.velocity.Y > 16f)
{
	Projectile.velocity.Y = 16f;
}
```

## 空气阻力

把 `Projectile.velocity.X` 每帧乘一个小数，空气阻力就有了。配上计时器还能让它只在特定条件下生效。
```cs
Projectile.velocity.X = Projectile.velocity.X * 0.97f; // 0.99f for rolling grenade speed reduction. Try values between 0.90f and 0.99f
```

## 旋转
### 持续旋转
在 `AI` 里不断累加 `Projectile.rotation`，弹幕就能像回旋镖那样转起来。
```cs
Projectile.rotation += 0.4f * (float)Projectile.direction;
```

### 朝向飞行方向
让贴图始终对着飞行方向，箭这类弹幕很常用。贴图本身朝右的话，不用加 `MathHelper.PiOver2`（这个常量在 `Microsoft.Xna.Framework` 里）；贴图朝上就必须加。
```cs
Projectile.rotation = Projectile.velocity.ToRotation() + MathHelper.PiOver2; // projectile sprite faces up
// or
Projectile.rotation = Projectile.velocity.ToRotation(); // projectile faces sprite right
```

### spriteDirection
向左发射时贴图上下颠倒？加这一行：`Projectile.spriteDirection = Projectile.direction;`。原理和示例见 [Drawing and Collision](#Drawing-and-Collision)。

## 尘土

想要视觉效果就往 AI 里撒 Dust。位置、`DustID`、生成频率都随机化一下，看起来会舒服很多。下面是附魔回旋镖的尘土代码（aiStyle 3，AIType 为 ProjectileID.EnchantedBoomerang）：
```cs
if (Main.rand.NextBool(5)) // only spawn 20% of the time
{
	int choice = Main.rand.Next(3); // choose a random number: 0, 1, or 2
	if (choice == 0) // use that number to select dustID: 15, 57, or 58
	{
		choice = 15;
	}
	else if (choice == 1)
	{
		choice = 57;
	}
	else
	{
		choice = 58;
	}
	// Spawn the dust
	Dust.NewDust(Projectile.position, Projectile.width, Projectile.height, choice, Projectile.velocity.X * 0.25f, Projectile.velocity.Y * 0.25f, 150, default(Color), 0.7f);
}
```
### 尘土拖尾
每次 AI 更新生成一颗尘土，就是一条拖尾。

## 光照

"光照"这个词各人理解不一样，分几种情况：想加粒子就看上面尘土那一节；想让贴图不受黑暗影响，用 `ModProjectile.GetAlpha`；想让弹幕本身发白光，在 `SetDefaults` 里设 `Projectile.light = 1f;`（0 到 1 之间的任意值都行）；最后，如果你要的是带颜色的光、而且能照亮周围方块的那种（不是靠撒尘土），就在 `AI` 方法里用 `Lighting.AddLight`：
```cs
Lighting.AddLight(Projectile.Center, 0.9f, 0.1f, 0.3f); // R G B values from 0 to 1f. This is the red from the Crimson Heart pet
```

## 音效
### 循环音效
`Projectile.soundDelay` 这个字段每帧自动递减，所以只要在它归零时重新赋个值、放一次音效，循环音效就成了。下面这段来自回旋镖的 aiStyle (3)。
```cs
if (Projectile.soundDelay == 0) 
{
	Projectile.soundDelay = 8;
	Terraria.Audio.SoundEngine.PlaySound(SoundID.Item7, Projectile.position);
}
```

## 分裂 / 生成新弹幕

水晶弹和腐化者之戟的弹幕（EatersBite）都是在消亡的那一刻生成新弹幕。这种代码通常写在 `OnKill` 或 `OnTileCollide` 里，写进 `AI` 也完全可以。生成弹幕时要考虑联机兼容：务必确认 `Main.myPlayer == Projectile.owner` 成立再生成，否则容易出问题。新弹幕的伤害一般要按比例调低。[Projectile.NewProjectile](https://github.com/tModLoader/tModLoader/wiki/Projectile-Class-Documentation#public-static-int-newprojectilefloat-x-float-y-float-speedx-float-speedy-int-type-int-damage-float-knockback-int-owner--255-float-ai0--0f-float-ai1--0f-) 的参数含义和联机注意事项看文档。
```cs
// This code spawns 3 projectiles in the opposite direction of the projectile, with random variance in velocity.
if (OptionallySomeCondition && Projectile.owner == Main.myPlayer) 
{
	for (int i = 0; i < 3; i++)
	{
		// Calculate new speeds for other projectiles.
		// Rebound at 40% to 70% speed, plus a random amount between -8 and 8
		float speedX = -Projectile.velocity.X * Main.rand.NextFloat(.4f, .7f) + Main.rand.NextFloat(-8f, 8f);
		float speedY = -Projectile.velocity.Y * Main.rand.Next(40, 70) * 0.01f + Main.rand.Next(-20, 21) * 0.4f; // This is Vanilla code, a little harder to comprehend. This is just here to teach you that you can convert vanilla code to more readable code sometimes.
					
		// Spawn the Projectile.
		Projectile.NewProjectile(Projectile.GetSource_FromThis(), Projectile.position.X + speedX, Projectile.position.Y + speedY, speedX, speedY, ProjectileID.CrystalShard, (int)(Projectile.damage * 0.5), 0f, Projectile.owner, 0f, 0f);
	}
}
```

## 追踪

追踪弹幕的思路是：先找到目标，再把速度掰向目标。找目标一般是遍历 `Main.ActiveNPCs`，挑出最近的那只敌对 `NPC`；定下目标之后，把 `Projectile.velocity` 调向该目标的 `NPC.Center`。这个调整可以是一帧到位，也可以是慢慢转过去，取决于你想要的飞行手感。追踪的精度和转向的柔和程度，都能靠额外的逻辑继续调。[ExampleHomingProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleHomingProjectile.cs) 是一个基础的追踪弹幕示例。

## 跟随鼠标

跟随鼠标的做法是在 `AI` 里读 `Main.MouseWorld`，再把 `Projectile.velocity` 调整到朝鼠标的方向。这段代码只能对弹幕的拥有者执行，也就是外面套一层 `if(Main.myPlayer == projectile.owner)`。不做这个判断就会失步——每个客户端都拿自己本地的鼠标去影响这颗弹幕。别的客户端根本不知道弹幕拥有者的鼠标在哪，所以速度的变化和位置的改变都得靠 `Projectile.netUpdate` 同步过去。[MagicMissile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Old/Projectiles/MagicMissile.cs) 目前还没适配新版 tModLoader，但它展示了跟随鼠标弹幕需要写哪些代码。

## 持握弹幕

持握弹幕看起来就像被玩家握在手里，类似物品武器的拿法。做成弹幕之后，行为比做成物品好定制得多。最典型的例子是钻头，长矛、短剑、鞭子、连枷这类武器也常用持握弹幕实现。

要实现持握弹幕，你得有一个"发射"它的物品。物品里要设 `Item.channel = true;`。弹幕这边则是读 `player.channel`，判断物品是否还在使用中；只要还在用，就每帧把弹幕的位置和旋转对齐到玩家的位置和物品的旋转上。[ExampleDrillProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleDrillProjectile.cs) 是持握弹幕的范例，实现所需的代码都在里面。

## Player Owner

弹幕是玩家发射的话，可以用 `Player player = Main.player[Projectile.owner];` 拿到对应的 `Player`，之后想读什么玩家数据都行。但不是每颗弹幕都出自玩家之手，所以只在"确实由玩家发射"的弹幕里去访问玩家对象。`Projectile.owner` 用错，尤其在联机下，是会出问题的。

## 淡入 / 淡出

很多子弹生成时会淡入，免得一出来就盖在枪口上。在 `SetDefaults` 里用 `Projectile.alpha = 255;` 让弹幕生成时全透明，再到 `AI` 里每帧把透明度降下来：
```cs
if (Projectile.alpha > 0)
{
	Projectile.alpha -= 15; // Decrease alpha, increasing visibility.
}
```
[`ExampleAdvancedAnimatedProjectile`](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleAdvancedAnimatedProjectile.cs) 里既有生成时的淡入，也有消失时的淡出。

## 动画 / 多帧

弹幕动画说白了就是换一张贴图里的哪一帧来画，逻辑写在 `AI` 里。动手前先在 `SetStaticDefaults` 里设好 `Main.projFrames[Projectile.type] = #;`，也就是总帧数，然后用 `Projectile.frame` 指定当前画第几帧。不要想着拿 `.gif` 当贴图，游戏不认，动画也不是这么做的。

### 循环播放
循环动画用 `Projectile.frameCounter` 加 `Main.projFrames[Projectile.type]` 就能写。例子见 [`ExampleAdvancedAnimatedProjectile`](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleAdvancedAnimatedProjectile.cs)
```cs
// Loop through the 4 animation frames, spending 5 ticks on each.
if (++Projectile.frameCounter >= 5)
{
	Projectile.frameCounter = 0;
	if (++Projectile.frame >= Main.projFrames[Projectile.type])
	{
		Projectile.frame = 0;
	}
}
// Or, more compactly:
if (++Projectile.frameCounter >= 5)
{
	Projectile.frameCounter = 0;
	Projectile.frame = ++Projectile.frame % Main.projFrames[Projectile.type];
}
```

## 示例
### AiStyle 1
弹幕的 AiStyle 1，也就是 `ProjAIStyleID.Arrow`，游戏里一大堆简单弹幕都用它，原版代码超过 3000 行。如果你照着 [Advanced Vanilla Code Adaption](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adaption) 指南去改过它，大概率改得有点崩溃。把那些针对具体 `ProjectileID` 的代码全剥掉之后，这套 AiStyle 的骨架其实就这么点：
```cs
// Optional: if the projectile should fade in, fade it in:
if (Projectile.alpha > 0)
	Projectile.alpha -= 15;
if (Projectile.alpha < 0)
	Projectile.alpha = 0;

// Set the rotation to face the current trajectory:
Projectile.rotation = (float)Math.Atan2((double)Projectile.velocity.Y, (double)Projectile.velocity.X) + 1.57f;
// Or, this version is easier to read:
Projectile.rotation = Projectile.velocity.ToRotation() + MathHelper.PiOver2;
// Cap downward velocity, in case you add gravity to this projectile
if (Projectile.velocity.Y > 16f)
	Projectile.velocity.Y = 16f;
```
看，剥掉那些弹幕专属代码之后，AiStyle 1 只剩下几行，而且正好和前面淡入、旋转的例子对得上。

# 限制弹幕数量

大多数回旋镖武器都限制同时"在场"的弹幕数量（一般只允许 1 颗）。这个限制不属于弹幕的代码，而是发射它的物品干的事：物品在被使用前会数一下玩家当前拥有几颗该弹幕，超过上限就不让用。下面这段就是 `ModItem` 发射某个 `ModProjectile` 时实现该效果的典型写法：
```cs
public override bool CanUseItem(Player player) {
	return player.ownedProjectileCounts[Item.shoot] < 1;
}
```

# 反弹与 OnTileCollide

很多弹幕撞到实心方块会弹开。严格说这件事不算 `AI` 的一部分，它发生在 `OnTileCollide` 这个方法里。默认行为是：弹幕撞上方块后速度被迅速削掉，最终停下并被销毁。只要重写 `ModProjectile.OnTileCollide` 并返回 `false`，就能跳过这套逻辑、换成自己的；返回 `true` 则是在保留原版逻辑的前提下再补点东西。最常见的目标就是让弹幕反弹：有的弹幕会损失一部分速度，弹得比较真实；有的完全不掉速，换个方向继续原速飞。还有的只允许弹有限的次数，这通常是借用 `Projectile.penetrate` 来倒数。另外，重写 `ModProjectile.OnTileCollide` 之后，销毁弹幕、生成碰撞处的尘土、播放碰撞音效，这些都可能得你自己补上。

## OnTileCollide 示例

[ExampleBullet.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleBullet.cs#L37) 演示了有限次数反弹、碰撞尘土、碰撞音效，以及完全保留速度的反弹。

[ExampleCloneProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleCloneProjectile.cs#L51) 演示了随机播放多个碰撞音效，以及返回 `true` 保留原版碰撞逻辑；里面的 `OnKill` 还演示了爆出一小片次级弹幕。

[SparklingBall.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/SparklingBall.cs#L28) 和 ExampleBullet.cs 差不多，区别是速度每帧乘 `0.75f`，所以每弹一次都会更慢。

[ExampleAdvancedFlailProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleAdvancedFlailProjectile.cs#L315) 根据连枷的状态和速度，给出了更动态的尘土与反弹写法，还额外做了火花特效。连枷类武器的手感就来自这种动态表现。

有了这些例子，你想要什么碰撞行为都能拼出来。如果是要克隆某个原版弹幕的行为，就去 `Projectile.HandleMovement` 里搜对应的 `ProjectileID` 编号或该弹幕的 `aiStyle` 编号，相关代码就在那儿。改编指南里的 [Shadowbeam Staff Clone](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adaption#example-item-and-projectile-shadowbeam-staff-clone) 例子演示了这个过程，也演示了如何找到那些没被 `AI` 代码覆盖到的原版代码片段。

# 自定义绘制

有时候默认的绘制效果不是我们要的。重写 `PreDraw` 或 `PostDraw` 自己画，就能接着往细里调。

## 残影拖尾

"残影拖尾"就是弹幕一路飞出淡去的复制品（也可以看看上面的 [尘土拖尾](#尘土拖尾)）。实现思路是让游戏记住弹幕之前的位置，再手动把这些位置的弹幕画出来。下面是 [ExampleBullet.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleBullet.cs) 里的相关代码：

```cs
public override void SetStaticDefaults() {
	ProjectileID.Sets.TrailCacheLength[Projectile.type] = 5; // The length of old position to be recorded
	ProjectileID.Sets.TrailingMode[Projectile.type] = 0; // The recording mode
}

public override bool PreDraw(ref Color lightColor) {
	Texture2D texture = TextureAssets.Projectile[Type].Value;
	Vector2 drawOrigin = new Vector2(texture.Width * 0.5f, Projectile.height * 0.5f);
	for (int k = Projectile.oldPos.Length - 1; k > 0; k--) {
		Vector2 drawPos = (Projectile.oldPos[k] - Main.screenPosition) + drawOrigin + new Vector2(0f, Projectile.gfxOffY);
		Color color = Projectile.GetAlpha(lightColor) * ((Projectile.oldPos.Length - k) / (float)Projectile.oldPos.Length);
		Main.EntitySpriteDraw(texture, drawPos, null, color, Projectile.rotation, drawOrigin, Projectile.scale, SpriteEffects.None, 0);
	}

	return true;
}
```
这段代码里，先确认 `ProjectileID.Sets.TrailCacheLength` 和 `ProjectileID.Sets.TrailingMode` 取值合适（具体含义看它们的文档）。然后在 `PreDraw` 里倒着遍历 `Projectile.oldPos`，按"年龄"把颜色一点点调淡，逐个位置把弹幕贴图画出来。循环有意避开了第 0 项，它对应当前位置，反正方法返回 `true`，原版绘制会自己画。倒序（从最旧到最新）是必须的，这样重叠的部分才叠得对：

![image](https://github.com/user-attachments/assets/1eabb7d5-2a87-472f-9cc8-6a19d97bb2a4)    

绘制的缩放值也可以拿来做点实验。

### 带 `spriteDirection` 和 `rotation` 的残影拖尾
残影如果也需要 `rotation` 和 `spriteDirection` 的信息，用 `Projectile.oldSpriteDirection` 和 `Projectile.oldRot`。

### 带 `frame` 的残影拖尾
没有 `Projectile.oldFrame` 这种字段帮你记住 `Projectile.frame` 的历史值，不过循环动画的上一帧可以算出来：

```cs
for (int k = Projectile.oldPos.Length - 1; k > 0; k--) {
	// Calculate the frame value of this projectile in the past 
	int frameCountOfPrevious = Projectile.frameCounter - k;
	int frameAdjustment = (int)MathF.Floor((float)frameCountOfPrevious / TicksPerAnimationFrame);
	int oldFrame = Utils.ModulusPositive(Projectile.frame + frameAdjustment, Main.projFrames[Type]);

	// Change the frame that will be drawn
	Rectangle drawRectangle = texture.Frame(1, Main.projFrames[Type], 0, oldFrame);

	Vector2 drawPos = (Projectile.oldPos[k] - Main.screenPosition) + drawOrigin + new Vector2(0f, Projectile.gfxOffY);
	Color color = Projectile.GetAlpha(lightColor) * ((Projectile.oldPos.Length - k) / (float)Projectile.oldPos.Length);
	Main.EntitySpriteDraw(texture, drawPos, drawRectangle, color, Projectile.rotation, drawOrigin, Projectile.scale, SpriteEffects.None, 0);
}
```

https://github.com/user-attachments/assets/2307462e-b0f1-4195-a14c-b52268bd8dfc

## Glowmask

只要放一个名为 `[TextureName]_Glow.png` 的文件，它就会被自动当成这颗弹幕的 Glowmask（发光遮罩）：以全亮度叠在正常贴图之上。

## PreDraw/PostDraw 示例

几个可以拿来学的自定义绘制例子：

[ExampleBullet.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleBullet.cs#L62) 用 `PreDraw` 画残影拖尾。

[MinionBossPetProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Pets/MinionBossPet/MinionBossPetProjectile.cs#L67) 用 `PostDraw` 在原有贴图上叠加额外细节。

[ExampleWhipProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleWhipProjectile.cs#L88) 用 `PreDraw` 画鞭子的连线，以及一节一节的鞭身。

[ExampleAdvancedAnimatedProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleAdvancedAnimatedProjectile.cs#L102) 用 `PreDraw` 手动绘制弹幕贴图，绕开原版绘制里那些别扭的地方。

[ExampleSwingingEnergySwordProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleSwingingEnergySwordProjectile.cs#L190) 用 `PreDraw` 画出"能量剑"效果，类似 1.4.4 给永夜刃、断钢剑等武器加的那种。

# Drawing and Collision

你可能已经发现弹幕会在不该撞墙的时候撞墙，或者判定框莫名其妙。先把话说清楚：`Projectile.width` 和 `Projectile.height` 对应的是弹幕的判定框，不是贴图。这两个值几乎永远不应该不相等，判定框应该是正方形。另外，`Projectile.scale` 也不要用，原版绘制代码并没有正确处理它。绘制贴图时会尽量把贴图叠到判定框上，具体怎么叠，受 `Main.DrawProj_DrawNormalProjs` 方法里一堆数学计算影响。

## 竖直方向贴图的例子

跟着下面这个例子走一遍，碰撞和绘制的问题以及解决思路就清楚了。贴图是这样的，48x70 像素：
![竖直方向的弹幕精灵（48x70）](/img/posts/tmodloader-basic-modprojectile/y4OcJAv.png)    
这个 `ModProjectile` 里要紧的部分：
```cs
// SetDefatults
Projectile.width = 8;
Projectile.height = 8;
// AI
Projectile.rotation = Projectile.velocity.ToRotation() + MathHelper.ToRadians(90f);
```
我们的目标是让贴图里的黄色部分当判定框。黄色区域是 8x8 像素，所以 `width` 和 `height` 都设成 8。那段 `Projectile.rotation` 代码把旋转设成速度方向，另外多加 90 度，因为这张贴图是朝上的，而游戏默认期望它朝右。本篇里我们会用 [Modders Toolkit](https://steamcommunity.com/sharedfiles/filedetails/?id=2573569299) 这个模组来可视化判定框，非常好用。

可以看到判定框（那个黄方块）和贴图的尖端对不上：

https://github.com/tModLoader/tModLoader/assets/4522492/8efa67d9-5565-4076-b0af-5e1688dfde84

原版那套数学有点绕，但说到底就是把 `DrawOffsetX` 和 `DrawOriginOffsetY` 设成合适的值，把贴图的绘制位置挪一挪，让贴图正好压在判定框上。调这两个值时，可以在游戏里用 [Modders Toolkit](https://steamcommunity.com/sharedfiles/filedetails/?id=2573569299) 直接改，也可以开 [Edit and Continue](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#edit-and-continue) 边跑边调。还有个笨办法：在绘图软件里对着贴图量：
![在绘图软件里量出 DrawOffsetX / DrawOriginOffsetY](/img/posts/tmodloader-basic-modprojectile/m5DxkBm.png)   
这里是拿 Modders Toolkit 试各种值，试出来的结果记得写回 `SetDefaults` 里：

https://github.com/tModLoader/tModLoader/assets/4522492/a21ae4df-e79f-4878-84ff-d8e30dd59583

试了几轮、或者量过之后就知道，给这个 `ModProjectile.SetDefaults` 加上 `DrawOffsetX = -20;`，绘制位置和判定框就对上了。

接着让判定框落到贴图的蓝色部分。这次用 [Edit and Continue](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#edit-and-continue) 来试，下面这段录屏能看出试新值有多快：

https://github.com/tModLoader/tModLoader/assets/4522492/d17b18ad-1d4b-46fb-90ee-dfa43789e484

如你所见，加上 `DrawOriginOffsetY = -16;` 就让判定框在贴图上往下移了。

### 修掉贴图上下颠倒的问题

你可能也注意到，向左发射时贴图是倒着的。回想一下 `AI` 里这行：`Projectile.rotation = Projectile.velocity.ToRotation() + MathHelper.ToRadians(90f);`。贴图一转到左边，自然就上下颠倒了。用 `spriteDirection` 能修：它会把贴图的绘制水平翻转。做法就是在 `AI` 里 `Projectile.rotation = ...` 那行之后补上 `Projectile.spriteDirection = Projectile.direction;`。

没修之前：
![向左发射时精灵上下颠倒（未修复）](/img/posts/tmodloader-basic-modprojectile/sKUq94z.png)    
修好之后：
![设置 spriteDirection 之后恢复正常](/img/posts/tmodloader-basic-modprojectile/w3ALhDX.png)    

## 水平方向贴图的例子

贴图改成横向的话，事情会有点变化。新的水平贴图是 70x48，朝右，而不是像刚才那样朝上：
![水平方向的弹幕精灵（70x48）](/img/posts/tmodloader-basic-modprojectile/etzbzs0.png)

判定框还是对不齐：

https://github.com/tModLoader/tModLoader/assets/4522492/50312b6e-ecc8-46fe-b356-f50b9164290e

和竖直例子不同，这次直接写 `Projectile.rotation = Projectile.velocity.ToRotation();`，不用再加 90 度。试了几轮之后，判定框落在尖端上的取值是这样：
```cs
DrawOffsetX = -62;
DrawOriginOffsetY = -20; 
DrawOriginOffsetX = 31;
```
这几个数看着有点怪，是因为泰拉瑞亚内部还有一层换算。计算规则：
```cs
DrawOffsetX = Negative X pixel position of the top left corner of the intended hitbox
DrawOriginOffsetY = Negative Y pixel position of the top left corner of the intended hitbox
DrawOriginOffsetX = X pixel position of center of hitbox minus Texture Width divided by 2 
```
对照图：
![DrawOffsetX / DrawOriginOffsetY / DrawOriginOffsetX 的换算示意](/img/posts/tmodloader-basic-modprojectile/zQfxXM3.png)     
如果不想跟原版弹幕渲染代码较劲，自己画也行，见 [ExampleAdvancedAnimatedProjectile](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleAdvancedAnimatedProjectile.cs#L101)

### 再修一次贴图上下颠倒的问题

竖直贴图那次，用 `Projectile.spriteDirection` 就能解决，因为它控制的是贴图的水平翻转。但贴图本身就是横向的，一水平翻转，弹幕就变成朝后飞了：
![水平精灵翻转后变成朝向后方](/img/posts/tmodloader-basic-modprojectile/vfKrRzZ.png)    
要修就得动态地调整偏移量，并且按朝向决定要不要给旋转加上 180 度（也就是 Pi）。代码如下：
```cs
// Set both direction and spriteDirection to 1 or -1 (right and left respectively)
// Projectile.direction is automatically set correctly in Projectile.Update, but we need to set it here or the textures will draw incorrectly on the 1st frame.
Projectile.spriteDirection = Projectile.direction = (Projectile.velocity.X > 0).ToDirectionInt();
// Adding Pi to rotation if facing left corrects the drawing
Projectile.rotation = Projectile.velocity.ToRotation() + (Projectile.spriteDirection == 1 ? 0f : MathHelper.Pi);
if (Projectile.spriteDirection == 1) // facing right
{
	DrawOffsetX = -62; // These values match the values in SetDefaults
	DrawOriginOffsetY = -20;
	DrawOriginOffsetX = 31;
}
else
{
	// Facing left.
	// You can figure these values out if you flip the sprite in your drawing program.
	DrawOffsetX = 0; // 0 since now the top left corner of the hitbox is on the far left pixel.
	DrawOriginOffsetY = -20; // doesn't change
	DrawOriginOffsetX = -31; // Math works out that this is negative of the other value.
}
```
![按朝向动态调整偏移量后的最终效果](/img/posts/tmodloader-basic-modprojectile/FKfhtQ0.png)    

希望这些内容能帮你把弹幕的判定框和绘制问题都解决掉。
