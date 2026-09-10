---
title: 基础自定义弹幕指南
date: "2026-09-05 16:30:00"
categories:
  - Terraria 模组开发
tags:
  - tModLoader
  - Terraria
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic ModProjectile Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Projectile)。


在你开始自定义弹幕之前，你应该了解物品和弹幕之间的区别。物品是可以存放在你物品栏中的对象，而弹幕则是例如由武器或敌怪发射出来的对象。

# 哪些东西会使用弹幕？

泰拉瑞亚中的许多物品之所以能发挥作用，都是因为弹幕，包括枪和弓（分别对应子弹和箭）、激光、炸弹和其他投掷物品，以及大多数魔法武器。其他一些你可能想不到也属于弹幕的物品包括：抓钩、连枷、长矛、宠物、召唤物、钻头和悠悠球。很多敌怪也会生成弹幕。

# 制作弹幕

要在泰拉瑞亚中创建一个弹幕，你必须先创建一个“继承”自 ModProjectile 的类。为此，在你的模组源代码目录:**（My Games\Terraria\tModLoader\ModSources\MyModName）**中创建一个 .cs 文件，然后在你的文本编辑器中打开该文件。将以下内容粘贴到该文件中，把 NameHere 替换为你物品的内部名称，把 ModNamespaceHere 替换为你模组的文件夹名命名空间。（一个常见错误是在内部名称中使用撇号或空格，不要这样做，电脑无法理解。）

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

		// 这里写额外的钩子/方法.
	}
}
```
现在你已经有了一个 .cs 文件，接下来把你制作好的纹理文件（一个 .png 图像文件）放到这个 .cs 文件所在的文件夹中。 你必须阅读 [自动加载 (Autoload)](https://github.com/tModLoader/tModLoader/wiki/Basic-Autoload) 这样你就知道如何满足电脑对文件名和文件夹结构的预期要求。

# 我找不到我的弹幕
记住，物品和弹幕是不同的。一个常见的错误是，模组制作者制作了一个弹幕，却不明白他们需要让某个东西使用这个弹幕。例如，对于投刀武器，你需要同时制作一个物品和一个弹幕。弹药物品也需要一个与之关联的独特弹幕。你并不总是需要同时拥有物品和弹幕，例如当弹幕是由 NPC 生成的时候。测试弹幕最简单的方法是制作一个物品，并将 Item.shoot 设置为该弹幕。例如，Item.shoot = ModContent.ProjectileType<MyProjectile>();。请参阅 ExampleMod 中许多由物品生成的弹幕示例，它们位于不同的文件夹中，但很容易找到。

# 属性
弹幕最重要的部分是 SetDefaults 方法。SetDefaults 是你设置弹幕各种属性的地方，比如碰撞箱的宽度和高度、弹幕是友好还是敌对，以及弹幕将使用哪种 AI。请参阅 [弹幕类文档 (Projectile Class Documentation)](https://github.com/tModLoader/tModLoader/wiki/Projectile-Class-Documentation) 了解 SetDefaults 中常见设置的值的含义。你也可以通过访问 [原版弹幕字段值 (Vanilla Projectile Field Values)](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Projectile-Field-Values) 查看原版弹幕的数值。许多不同弹幕的示例可以在 [ExampleMod.Content.Projectiles](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Content/Projectiles) 中找到

## 伤害
一个常见错误是在 `SetDefaults` 中设置 `Projectile.damage`，这是无效的，因为弹幕生成时，其伤害值总是会被传入 `Projectile.NewProjectile` 的值覆盖。通常是由生成该弹幕的物品或 NPC 来决定伤害。

## DrawOffsetX, DrawOriginOffsetY, DrawOriginOffsetX
这些是与将碰撞箱正确居中到贴图相关的 ModProjectile 字段。更多请查阅 [绘制与碰撞](#绘制与碰撞)

# 其他钩子/方法
[自定义弹幕文档 (ModProjectile documentation)](https://docs.tmodloader.net/docs/stable/class_mod_projectile.html) 列出了许多其他钩子/方法，你可以用它们来让你的弹幕更具独特性。例如，如果你想在弹幕击中敌人时施加一个减益，你会使用 OnHitNPC。要在弹幕击中物块时做些什么，就使用 OnTileCollide。请参阅文档以及 ExampleMod 中的用法，了解如何正确使用它们。

# 什么是 AI
弹幕的 AI 是弹幕最重要的方面，它控制弹幕生成后如何移动等行为。对于新手模组制作者来说，最简单的方法是先通过设置 Projectile.aiStyle = #; 和 AIType = ProjectileID.NameHere; 来依赖其他原版弹幕已经使用的 AI 代码。你赋给 aiStyle 的数字必须与你用于 AIType 的弹幕所使用的 aiStyle 数字一致。这称为模仿原版弹幕。当你想要更高级的移动方式时，你会意识到模仿原版弹幕 AI 非常有限。我们将在下面讨论模仿和自定义 AI。

# 运用原版AI
你可以在[原版弹幕字段值 (Vanilla Projectile Field Values)](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Projectile-Field-Values)中查找回旋镖弹幕，你会发现所有回旋镖都使用 `aiStyle` 3:
![各种回旋镖类弹幕的 aiStyle 取值（均为 3）](/img/posts/tmodloader-basic-modprojectile/RSaxV6T.png)    

我们现在可以在代码中使用 Projectile.aiStyle = 3;。（你可以把 3 改成 ProjAIStyleID.Boomerang，让代码更具可读性。）为了让这个回旋镖更加简便，我们可以使用 Projectile.CloneDefaults(ProjectileID.EnchantedBoomerang)，这会一并复制所有其他默认值。这样做之后，你将得到一个行为几乎与原版弹幕相同的弹幕:
![CloneDefaults(EnchantedBoomerang) 之后的回旋镖（没有粒子效果）](/img/posts/tmodloader-basic-modprojectile/CL2MwaF.png)     

你会注意到粒子没有生成。我们可以通过使用 AIType 来解决这个问题。AIType 用于进一步细化 Projectile.aiStyle。每个 aiStyle 被许多不同的弹幕共享。如果我们想使用特定类型弹幕的特定行为，我们需要设置 AIType。这是我们的 EnchantedBoomerang 副本在也分配了 AIType 之后的样子：
![再补上 AIType 之后的回旋镖（粒子效果恢复）](/img/posts/tmodloader-basic-modprojectile/39KqXhc.png)    

这是生成的代码。
```cs
public override void SetDefaults()
{
	Projectile.CloneDefaults(ProjectileID.EnchantedBoomerang);
	// projectile.aiStyle = 3; This line is not needed since CloneDefaults sets it already.
	AIType= ProjectileID.EnchantedBoomerang;
}
```
那个粒子很酷，但如果你想改变那个粒子的颜色或任何其他小细节，你就不能依赖 `aiStyle` 和 `AIType`。要做出改变，你需要查阅[原版代码改编 (Vanilla Code Adaption)](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adoption)指南来调整现有代码，或者继续往下读，学习如何从零开始编写 AI 代码。记住，使用 `projectile.aiStyle` 和 `AIType` 是一种**原型制作工具**，模组中任何稍微有点意思的东西，很可能都需要编写自己的 AI 代码或改编原版代码。

# 自定义AI
本节将讨论你可以纳入你的 AI 中的各种要素。记住，如果你使用 `Projectile.CloneDefaults` 来复制其他弹幕的默认值，请将 `Projectile.aiStyle` 重新设置为 0。所有用于自定义 AI 的代码都放入 `ModProjectile.AI` 方法中。

## 计时器
许多弹幕使用计时器来延迟行动。通常我们使用 `Projectile.ai[0]` 或 `Projectile.ai[1]`，因为这些值会自动同步，但我们也可以使用类字段。这里我们数到 30，换句话说，也就是半秒。

```cs
Projectile.ai[0] += 1f;
if (Projectile.ai[0] >= 30f)
{
	// 半秒已经过去。重置计时器，或者别的什么。
	Projectile.ai[0] = 0f;
	Projectile.netUpdate = true;
	// 在这里做点什么，比如切换到一个新状态。
}
```

## 重力
弹幕实际上并不存在重力，每个受重力影响的弹幕实际上只是在其 AI 中写上了相应的代码。要实现重力，只需给 `Projectile.velocity.Y` 加上一个很小的值：
```cs
Projectile.velocity.Y = Projectile.velocity.Y + 0.1f; // 箭的重力为 0.1f，投刀的重力为 0.4f。
if (Projectile.velocity.Y > 16f) // 限制 Y 速度最大为 16f，防止速度过快导致碰撞检测失效、弹幕穿模。
{
	Projectile.velocity.Y = 16f;
}
```

### 延迟重力影响
箭和投刀弹幕都会等待若干帧后才受重力影响：
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

## 风阻
让 Projectile.velocity.X 乘以一个小于 1 的数，就能实现风阻。配合计时器，可控制触发时机。
```cs
Projectile.velocity.X = Projectile.velocity.X * 0.97f; // 0.99f 用于滚动中的手榴弹减速。可尝试 0.90f 到 0.99f 之间的值。
```

## 旋转
### 持续旋转
我们可以在 `AI` 中增大 `Projectile.rotation`，让它像回旋镖一样旋转。
```cs
Projectile.rotation += 0.4f * (float)Projectile.direction;
```

### 朝向
让弹幕沿飞行方向旋转，常用于箭之类的弹幕。如果你的弹幕贴图朝右，就不需要加上 `MathHelper.PiOver2`（位于 Microsoft.Xna.Framework 中）。如果你的弹幕贴图朝上，就需要加上。
```cs
Projectile.rotation = Projectile.velocity.ToRotation() + MathHelper.PiOver2; // 弹幕贴图面朝上方
// or
Projectile.rotation = Projectile.velocity.ToRotation(); // 弹幕贴图面朝右方
```

### 贴图方向
如果你的贴图在向左射击时上下颠倒，就需要设置这个：`Projectile.spriteDirection = Projectile.direction;` 有关解释和示例，请参阅[绘制与碰撞](#绘制与碰撞)。

## 粒子
在 AI 中生成粒子以获得视觉效果。随机化位置、`DustID` 和生成频率会让视觉效果更美观。以下是附魔回旋镖的尘埃生成（aiStyle 3，AIType ProjectileID.EnchantedBoomerang）:
```cs
if (Main.rand.NextBool(5)) // 20% 概率
{
	int choice = Main.rand.Next(3); // 从 0、1、2 中随机选一个数。
	if (choice == 0) // 使用这个随机数来选择 dustID: 15, 57, or 58
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
	// 粒子生成
	Dust.NewDust(Projectile.position, Projectile.width, Projectile.height, choice, Projectile.velocity.X * 0.25f, Projectile.velocity.Y * 0.25f, 150, default(Color), 0.7f);
}
```
### 粒子拖尾
每次 AI 更新时生成 1 个粒子，就能做出粒子拖尾效果。

## 光照
模组制作者对光照有许多不同的定义。如果你想添加粒子，请参阅粒子部分。如果你希望弹幕贴图不受黑暗影响，请参阅 `ModProjectile.GetAlpha`。如果你希望弹幕发出白光，可以在 `SetDefaults` 中设置 `Projectile.light = 1f;`（或 0 到 1 之间的任意数值）。最后，如果你想发出彩色光，且这种光不是来自生成的粒子，而是能照亮附近物块的光，可以在你的 `AI` 方法中使用 `Lighting.AddLight`:
```cs
Lighting.AddLight(Projectile.Center, 0.9f, 0.1f, 0.3f); // R G B 值范围从 0 到 1f；这是猩红之心宠物的红色。
```

## 声音
### 重复播放声音
字段 `soundDelay` 每帧会自动递减。检查它是否为 0，然后将其设置为某个值并播放声音，就能实现重复播放声音。这个示例来自回旋镖的 aiStyle（3）。
```cs
if (Projectile.soundDelay == 0) 
{
	Projectile.soundDelay = 8;
	Terraria.Audio.SoundEngine.PlaySound(SoundID.Item7, Projectile.position);
}
```

## 分裂/生成弹幕
水晶子弹 - (Crystal Bullet)或腐化者之戟 - (Scourge of the Corruptor)的弹幕(EatersBite)都会在消亡时生成新的弹幕。我们通常在 `OnKill` 或 `OnTileCollide` 中看到生成弹幕，但我们也可以在 `AI` 中这样做。生成弹幕时，我们需要注意多人兼容性，并确保只在 `Main.myPlayer == Projectile.owner` 为 true 时生成弹幕，以避免问题。按比例调低 `伤害 (Projectile.damage)` 是常见做法。请参阅 [Projectile.NewProjectile](https://github.com/tModLoader/tModLoader/wiki/Projectile-Class-Documentation#public-static-int-newprojectilefloat-x-float-y-float-speedx-float-speedy-int-type-int-damage-float-knockback-int-owner--255-float-ai0--0f-float-ai1--0f-) 了解参数以及考虑多人游戏时的用法。
```cs
// 这段代码会朝与原弹幕相反的方向生成 3 个弹幕，并具有随机速度。
if (OptionallySomeCondition && Projectile.owner == Main.myPlayer) 
{
	for (int i = 0; i < 3; i++)
	{
    // 计算其他弹幕的新速度。
    // 朝反方向飞，速度为原速度的 40% 到 70%，再加 -8 到 8 之间的随机偏移。
		float speedX = -Projectile.velocity.X * Main.rand.NextFloat(.4f, .7f) + Main.rand.NextFloat(-8f, 8f);
		float speedY = -Projectile.velocity.Y * Main.rand.Next(40, 70) * 0.01f + Main.rand.Next(-20, 21) * 0.4f; // 这是原版代码, 写法稍难理解; 放这里是为了告诉你: 有时可以把原版代码改写成更易读的形式。
					
		// 生成弹幕。
		Projectile.NewProjectile(Projectile.GetSource_FromThis(), Projectile.position.X + speedX, Projectile.position.Y + speedY, speedX, speedY, ProjectileID.CrystalShard, (int)(Projectile.damage * 0.5), 0f, Projectile.owner, 0f, 0f);
	}
}
```

## 追踪
追踪弹幕的工作方式是：先找到一个目标，然后调整速度使其指向目标。要寻找目标，通常会遍历 `Main.ActiveNPCs`，找出距离最近的敌人 `NPC`。确定目标后，调整 `Projectile.velocity`，使其指向目标的 `NPC.Center`。这种调整可以是渐进的，也可以是立即的，具体取决于你想要的弹幕飞行特性。你还可以在追踪逻辑中加入更多判断，以影响追踪的精准度和转向的突然程度。[ExampleHomingProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleHomingProjectile.cs) 展示了一个基础的追踪弹幕。

## Follow Mouse
To follow the mouse, we write code in `AI` to check `Main.MouseWorld` and adjust `Projectile.velocity` to move towards the mouse. This code must only run for the owner of the projectile using a check for `if(Main.myPlayer == projectile.owner)`. Failure to do this will lead to desync as the projectile is influenced by each users mouse locally. Other clients do not know the projectile owner's mouse position, so the resulting velocity and position changes are synced using `Projectile.netUpdate`. [MagicMissile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Old/Projectiles/MagicMissile.cs), despite not currently being updated to work on current tModLoader, shows the required code to properly implement a projectile that follows the mouse. 

## Held Projectile
Held projectiles are projectiles that appear to be held in the players hand similar to how a weapon item is held. As a projectile, it is easier to customize the behavior that it is if it were an item. The most prevalent example of held projectiles are drills, but many other weapons such as spears, shortswords, whips, and flails are commonly implemented as held projectiles. 

To implement a held projectile, you'll need an item that "shoots" the projectile. That item needs to set `Item.channel = true;`. In the projectile, code will check `player.channel` to see if the item is still being used. If it is, the projectile will be set to match the players position and item rotation. [ExampleDrillProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleDrillProjectile.cs) serves as an example of a held projectile and shows all the required code to implement a held projectile.

## Player Owner
If a projectile was spawned by a player, we can use `Player player = Main.player[Projectile.owner];` to retrieve that `Player`. Once we do that we are free to access any player data needed. Not every projectile will be spawned by a player, make sure to only access the player if the projectile is only spawned by a player. Incorrect usage of `Projectile.owner` will cause issues especially in multiplayer.

## Fade In/Out
Many bullets fade in so that when they spawn they don't overlap the gun muzzle they appear from. You can set the projectile to spawn transparent with `Projectile.alpha = 255;` in `SetDefaults`. Then, in `AI`, you can decrease that transparency each update.
```cs
if (Projectile.alpha > 0)
{
	Projectile.alpha -= 15; // Decrease alpha, increasing visibility.
}
```
[`ExampleAdvancedAnimatedProjectile`](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleAdvancedAnimatedProjectile.cs) shows using both fading in when spawning and fading out when despawning.

## Animation/Multiple Frames
Projectile animation, switching which frame of the sprite to draw, happens in `AI`. Make sure to set `Main.projFrames[Projectile.type] = #;` in `SetStaticDefaults` first. You can set `Projectile.frame` to whatever frame you want to be drawn. Do not attempt to use a .gif file for the texture, that will not work and it is not how animation is done.

### Looping/Cycling
You can use `Projectile.frameCounter` and `Main.projFrames[Projectile.type]` to implement a looping animation. Example: [`ExampleAdvancedAnimatedProjectile`](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleAdvancedAnimatedProjectile.cs)
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

## Examples
### AiStyle 1
Projectile AiStyle 1, also known as `ProjAIStyleID.Arrow`, used for many simple projectiles in the game, is over 3000 lines long. If you have tried to adapt this AI using the [Advanced Vanilla Code Adaption](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adaption) guide, you might have been frustrated. Here is brief outline of that AiStyle without all the ProjectileID-specific code:
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
As you can see, the Projectile AiStyle of 1 without all the ProjectileID specific code is only a few lines of code, and matches up with the fade-in and rotation examples above.

# Limited Projectile Count
Most boomerang weapons have a limit to the number of active projectiles they can have "out" at one time (usually only 1). This isn't part of the projectile code, but rather a behavior of the item spawning the projectiles. The item usually checks how many projectiles owned by the player are in the game world and prevents the item from being used if it is greater than the desired limit. The following code is an example of this typical effect in a `ModItem` spawning a specific `ModProjectile`:
```cs
public override bool CanUseItem(Player player) {
	return player.ownedProjectileCounts[Item.shoot] < 1;
}
```

# Bounce and OnTileCollide
Many projectiles bounce when colliding with a solid tile. This behavior is technically not part of the `AI` as it happens in a method called `OnTileCollide`. By default, when a projectile collides with a tile, the velocity is quickly reduced so that the projectile will come to a stop and the projectile will be killed. By overriding `ModProjectile.OnTileCollide` and returning `false`, we can avoid that logic and implement our own logic. If we return `true`, we can add additional logic while keeping the vanilla logic. The most common use of this is to allow your projectile to bounce. Some projectiles bounce realistically by losing some velocity, while others bounce unrealistically and maintain their original speed in a new direction. Some projectiles have limited bounces, which is usually done by taking advantage of `Projectile.penetrate` to count down bounces. When overriding `ModProjectile.OnTileCollide`, killing the projectile, spawning tile collision dust, and playing collision sounds are all things that might need to be implemented. 

## OnTileCollide Examples

[ExampleBullet.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleBullet.cs#L37) shows off limited bounces, tile collision dust, tile collision sounds, and bouncing while preserving the velocity completely.

[ExampleCloneProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleCloneProjectile.cs#L51) shows off multiple random collision sounds and returning true to keep the original collision logic. `OnKill` shows off spawning a small eruption of secondary projectiles.

[SparklingBall.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/SparklingBall.cs#L28) is similar to ExampleBullet.cs except the velocity is scaled by `0.75f`, thereby slowing the projectile down on every bounce.

[ExampleAdvancedFlailProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleAdvancedFlailProjectile.cs#L315) shows off more dynamic examples of dust and bounce behaviors derived from the flail state and velocity. It also shows off an additional behavior of spawning a sparks visual effect. This dynamic behavior provides the signature feel of Flail weapons.

With the above examples, you can craft the tile collision behavior you want. If you are attempting to clone a vanilla projectile behavior, search `Projectile.HandleMovement` for the `ProjectileID` number or the projectile `aiStyle` number to find the relevant code. The [Shadowbeam Staff Clone](https://github.com/tModLoader/tModLoader/wiki/Advanced-Vanilla-Code-Adaption#example-item-and-projectile-shadowbeam-staff-clone) example in the adaption guide shows this and other thought processes required to find vanilla code fragments not covered by the `AI` code.

# Custom Drawing
Sometimes the default drawing behavior is not what we want. We can override `PreDraw` or `PostDraw` to manually draw a projectile to customize it further.

## Afterimage Trail
An "afterimage trail" is when a projectile draws a faded copy of itself trailing behind it. (See also the [Dust Trail section](#Dust-Trail).) We can implement an afterimage trail by telling the game to remember previous projectile positions and then manually drawing the projectile at those positions. The following code is relevant code from [ExampleBullet.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleBullet.cs):

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
In this code, first we make sure `ProjectileID.Sets.TrailCacheLength` and `ProjectileID.Sets.TrailingMode` have appropriate values, see their documentation for more information. Next, in `PreDraw` we iterate over the `Projectile.oldPos` entries in reverse and draw the projectile sprite with color values faded depending on their "age". The for loop makes sure not to draw entry 0, since that corresponds to the current position and will automatically be drawn since we are returning `true` from this method. Iterating in reverse, from oldest to newest, is important. It makes the overlapping draws look correct:

![image](https://github.com/user-attachments/assets/1eabb7d5-2a87-472f-9cc8-6a19d97bb2a4)    

Modders can experiment with changing the draw scale as well.

### Afterimage Trail with `spriteDirection` and `rotation`
`Projectile.oldSpriteDirection` and `Projectile.oldRot` can be used to facilitate a afterimage trail that needs `rotation` and `spriteDirection` information.

### Afterimage Trail with `frame`
There is no `Projectile.oldFrame` to remember previous values of `Projectile.frame`, but with some math a previous animation frame for a cycling animation can be calculated as follows:

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
A file named `[TextureName]_Glow.png` will automatically be used as a glowmask texture for this projectile, meaning it will draw at full brightness over the normal texture.

## PreDraw/PostDraw Examples
Here are some examples of custom drawing to learn from:

[ExampleBullet.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleBullet.cs#L62) uses `PreDraw` to draw an afterimage trail.

[MinionBossPetProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Pets/MinionBossPet/MinionBossPetProjectile.cs#L67) shows off using `PostDraw` to draw additional details over the existing sprite.

[ExampleWhipProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleWhipProjectile.cs#L88) uses `PreDraw` to draw a line and individual whip segments.

[ExampleAdvancedAnimatedProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleAdvancedAnimatedProjectile.cs#L102) uses `PreDraw` to draw the projectile texture manually to avoid fighting against vanilla projectile drawing oddities.

[ExampleSwingingEnergySwordProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleSwingingEnergySwordProjectile.cs#L190) uses `PreDraw` to draw an "energy sword" effect similar to the 1.4.4 changes made to Night's Edge, Excalibur, and others.

# Drawing and Collision
You may find yourself noticing that your projectile is hitting walls when it shouldn't or otherwise having a weird hitbox. First off, it is worth reiterating that `Projectile.width` and `Projectile.height` correspond to the hitbox of the projectile, NOT the sprite used. You almost never want `width` or `height` to be different, it should be square. You also never want to use `Projectile.scale` since the vanilla drawing code doesn't really take it into account correctly. The drawing of the sprite attempts to overlay the hitbox with the sprite, the drawing of this sprite is influenced by various bits of math done in the `Main.DrawProj_DrawNormalProjs` method.

## Vertical Sprite Example
Lets work through this example as we explore collision and drawing issues and work to solve them. Here is the sprite, it is 48x70 pixels:    
![竖直方向的弹幕精灵（48x70）](/img/posts/tmodloader-basic-modprojectile/y4OcJAv.png)    
The important parts of this `ModProjectile` are as follows:    
```cs
// SetDefatults
Projectile.width = 8;
Projectile.height = 8;
// AI
Projectile.rotation = Projectile.velocity.ToRotation() + MathHelper.ToRadians(90f);
```
Our goal is to have the yellow part of this projectile be the hitbox. The yellow area is 8 by 8 pixels, so we set `width` and `height` to 8 already. The `Projectile.rotation` code there sets the rotation to the velocity while adding 90 degrees of rotation, since the sprite we happen to be using faces up instead of to the right as is expected by the game. In this guide, we'll be using the [Modders Toolkit](https://steamcommunity.com/sharedfiles/filedetails/?id=2573569299) mod to visualize hitboxes. This is very useful.

Here we see the hitbox, the yellow square, doesn't match up with the tip of our sprite:

https://github.com/tModLoader/tModLoader/assets/4522492/8efa67d9-5565-4076-b0af-5e1688dfde84

The math for what vanilla code is doing is a little confusing, but basically we need to set `DrawOffsetX` and `DrawOriginOffsetY` to values that offset the drawing of our sprite in an attempt to properly place the sprite over the hitbox. If you are attempting this, either use [Modders Toolkit](https://steamcommunity.com/sharedfiles/filedetails/?id=2573569299) to change the offset values in-game or use [Edit and Continue](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#edit-and-continue) to adjust the values in-game. Another approach is to just measure it out on the sprite itself in your graphics program:    
![在绘图软件里量出 DrawOffsetX / DrawOriginOffsetY](/img/posts/tmodloader-basic-modprojectile/m5DxkBm.png)   
Here we see testing various values with Modders Toolkit. Make sure to replicate these values in your `SetDefaults` code:     

https://github.com/tModLoader/tModLoader/assets/4522492/a21ae4df-e79f-4878-84ff-d8e30dd59583

After some experimentation or measuring, we know that adding `DrawOffsetX = -20;` to this `ModProjectile.SetDefaults` will fix the positioning of the drawing relative to the hitbox.

Lets now try to position the hitbox over the blue portion of our sprite. This time, lets use [Edit and Continue](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#edit-and-continue) to accomplish this. In the clip below, you can see how quickly we can test out new values:    

https://github.com/tModLoader/tModLoader/assets/4522492/d17b18ad-1d4b-46fb-90ee-dfa43789e484

As you saw, we added `DrawOriginOffsetY = -16;` to position the hitbox lower on the sprite.

### Fixing upside-down sprite problem
You might've noticed that the sprite is upside down when fired to the left. Remember that in our `AI`, we have this line of code: `Projectile.rotation = Projectile.velocity.ToRotation() + MathHelper.ToRadians(90f);`. If we rotate our sprite to the left, then it is upside-down. We can fix this with `spriteDirection`. `spriteDirection` will flip the drawing of the sprite horizontally. To implement this, simply add `Projectile.spriteDirection = Projectile.direction;` to the `AI` code after the `Projectile.rotation = ...` line. 

No fix:     
![向左发射时精灵上下颠倒（未修复）](/img/posts/tmodloader-basic-modprojectile/sKUq94z.png)    
Fixed:     
![设置 spriteDirection 之后恢复正常](/img/posts/tmodloader-basic-modprojectile/w3ALhDX.png)    

## Horizontal Sprite Example
Things change a little if your sprite is oriented horizontally. Here is our new horizontal sprite, which is now 70x48 and oriented horizontally, pointing to the right instead of up as before:    
![水平方向的弹幕精灵（70x48）](/img/posts/tmodloader-basic-modprojectile/etzbzs0.png)

Once again, we can see that the hitbox doesn't line up:    

https://github.com/tModLoader/tModLoader/assets/4522492/50312b6e-ecc8-46fe-b356-f50b9164290e

Unlike the vertical example, this time we set `Projectile.rotation = Projectile.velocity.ToRotation();` directly instead of adding additional 90 degrees. After some experimentation, we arrive at the following for a hitbox on the tip:
```cs
DrawOffsetX = -62;
DrawOriginOffsetY = -20; 
DrawOriginOffsetX = 31;
```
These values are a bit odd because of some math Terraria is doing, so here is the algorithm for calculating them:
```cs
DrawOffsetX = Negative X pixel position of the top left corner of the intended hitbox
DrawOriginOffsetY = Negative Y pixel position of the top left corner of the intended hitbox
DrawOriginOffsetX = X pixel position of center of hitbox minus Texture Width divided by 2 
```
Here is a diagram:    
![DrawOffsetX / DrawOriginOffsetY / DrawOriginOffsetX 的换算示意](/img/posts/tmodloader-basic-modprojectile/zQfxXM3.png)     
If you don't like fighting against the vanilla projectile rendering code, you can always draw the projectile yourself as seen in [ExampleAdvancedAnimatedProjectile](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleAdvancedAnimatedProjectile.cs#L101)

### Fixing upside-down sprite problem again
With the vertical sprite, using `Projectile.spriteDirection` works because it controls a horizontal flip of the projectile sprite. Using a horizontal sprite, a horizontal flip makes the sprite move facing backwards:    
![水平精灵翻转后变成朝向后方](/img/posts/tmodloader-basic-modprojectile/vfKrRzZ.png)    
To fix this, we need to adjust the offsets dynamically and conditionally add 180 degrees or Pi to the rotation. Here is the code:
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

Hopefully these answers can help you solve your projectile hitbox and drawing issues.

