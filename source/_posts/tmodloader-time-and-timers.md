---
title: Basic Time and Timers Guide
description: 计时器怎么写：别用循环、用 ai[] 或 timeLeft、取模与插值，以及游戏时间与世界时间的取用。
date: 2026-08-18 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic Time and Timers Guide](https://github.com/tModLoader/tModLoader/wiki/Time-and-Timers)。

*本指南已更新到 1.4，想看旧的 1.3 版本页面点[这里](https://github.com/tModLoader/tModLoader/wiki/Time-and-Timers/ecf72a76ff8f2643414d2dd2095a7c0f7b01024e)。*

写模组的时候，你迟早会想让某个动作晚点发生，或者别做得那么频繁 —— 这就是时间和计时器要解决的问题。下面把跟时间相关的概念挨个过一遍，免得你在代码里埋下自己都没察觉的坑。

# 冷却时间

冷却（cooldown）本质就是个计时器，区别只在于它往往配一个触发条件，而不是无休止地重复。这篇里的所有思路都能拿来写冷却：按自定义按键、冲刺（dash），各种场合都一样。

# 别用循环

写计时器最要紧的一点：调用那些钩子和方法的，是游戏自己的主循环。你代码里写的循环不会变成计时器 —— 它在纳秒之内就转完了该转的次数，然后接着往下执行。计时器必须建立在「游戏循环每 tick 调用一次这些方法」这个前提上。下面两个是模组作者最常犯的错。

## 常见错误示范

第一个例子误以为 `while` 循环会让代码在这儿等 60 tick 再往下走。并不会：循环转 60 次，紧接着就执行下面的代码。正确做法是把计时器存进非局部变量，并且把循环去掉，后面几个例子都是这么写的。

```cs
int timer = 60;
while (timer > 0)
{
    timer--;
}
// Other code intended to run after timer expires
```

***

第二个例子同样不行：`timer` 定义在同一个作用域里，永远涨不过 60 —— 它从 0 开始，自增到 1，下一 tick 又从 0 开始。把 `int timer = 0;` 这类定义挪到方法外面（一般是放到类里）就行，细节见下面的「用新字段做计时器」一节。

```cs
int timer = 0;
timer++;
if (timer > 60)
{
    // Other code intended to run after timer expires
    timer = 0;
}
```

# 现实时间、游戏时间与世界时间

先弄清楚这几种「时间」分别指什么。

**现实时间（Wall Time）** 是现实世界里真实流逝的时间。写模组几乎不该碰它，因为我们的效果通常要跟游戏、跟游戏世界保持同样的节奏。用现实时间意味着：游戏暂停了、或者帧率掉下来在慢放，你写的事件照样在跑 —— 这会引出一堆 bug。

**世界时间（World Time）** 是世界自己报告的时间。用得不对会出很荒唐的事，比如附魔日晷（enchanted sundial）生效时，事件以极快的速度接连发生。

**游戏时间（Game Time）** 才是绝大多数玩法效果该用的东西。Terraria 的目标是每秒 60 帧，但机器扛不住的时候游戏会整体慢放。逻辑里用游戏时间计数，效果就能维持同样的相对速度。举个例子：某个敌怪本该每秒攻击一次，若用现实时间，跑 30 FPS 的玩家要躲的攻击次数就翻倍了。

总结一下：几乎什么都用游戏时间，别用现实时间；只有跟世界昼夜循环绑在一起的东西才用世界时间。

# 游戏时间

游戏时间是我们写玩法计时器时的主力。它跟帧率挂钩，所以效果出现的频率和游戏本身一致 —— 想在模组里实现一个「计时器」，这基本就是你要的行为。

游戏时间以 tick 为单位。tick 指的是游戏逻辑更新一次：每过一个 tick，弹幕按速度前进一段，其它东西也各自往前走一步。机器够好的话，一秒有 60 tick，所以一个想持续 2 秒的效果要数到 120 tick。提醒一句：玩家跑不满 60 FPS 又关掉了跳帧（frame skip）时，这个「2 秒」并不精确 —— 不过没关系，游戏里别的东西也一样被拖慢了。

按 tick 数实现的计时器很简单：在类里放一个字段，每次 `Update` / `AI` 之类的调用里给它加一，然后拿 `if` 判断有没有到目标值，到了就执行你要的动作，比如生成一个 `Projectile`。如果这个动作要重复触发，就在 `if` 里把计时器归零。（反过来写也行：给计时器一个初始值，一路减到 0 —— 效果一样，看个人习惯。）

## 常用字段

* `Main.GameUpdateCount` - 每加载一次世界就重置为 0。每 tick 加 1，游戏暂停期间也在加。
* `Player.miscCounter` - 每 tick 加 1，在 0 到 299 之间循环。适合用来驱动玩家的视觉表现。
* `NPC.ai[]` 和 `Projectile.ai[]` - 原版代码里很常见的做法：直接拿这两个数组当计时器。
* [`Projectile.timeLeft`](https://github.com/tModLoader/tModLoader/wiki/Projectile-Class-Documentation#timeleft) - 一路倒数到 0，到 0 弹幕就自动消失。默认是 3600（60 秒），可以在 `SetDefaults` 里改。可以当个简单计时器用，一般用来数生成之后过了多少 tick，或者离消失还有多久。见下面的例子。
* [`Projectile.extraUpdates`](https://github.com/tModLoader/tModLoader/wiki/Projectile-Class-Documentation#extraupdates)/`Projectile.MaxUpdates` - 它会让 `Projectile.Update` 在一个 tick 里跑多次，以实现特殊效果。如果你写的计时器快得不对劲，多半是它的锅 —— 得按多出来的 Update 次数把计时逻辑换算一下。

## 示例

下面的例子都用 `ModNPC.AI` 或 `ModProjectile.AI` 来推进计时器。

### 用 Projectile.ai[] 做计时器（NPC.ai[] 同理）

（这里拿 `Projectile.ai[]` 举例，`NPC.ai[]` 的用法完全一样）

如果你写的是自己实现的 AI，或者确认所用的 `aiStyle` 没有占用那两个 ai 槽位（NPC 是 4 个），就可以拿 `Projectile.ai[]` 当计时器。它自带联机同步，用起来挺方便 —— 前提是你得先查清楚这个槽位确实没人用：

```cs
Projectile.ai[0]++;
if(Projectile.ai[0] > 120) {
    // Our timer has finished, do something here:
    // SoundEngine.PlaySound, Dust.NewDust, Projectile.NewProjectile, etc. Up to you.
    Projectile.ai[0] = 0;
}
```

[ExampleAdvancedAnimatedProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ExampleAdvancedAnimatedProjectile.cs#L79) 就是个现成的例子：它用计时器让弹幕在 50 tick 里淡入，然后淡出。

用属性包一层，代码会好读很多：

```cs
public float Timer {
	get => Projectile.ai[0];
	set => Projectile.ai[0] = value;
}

public override void AI() {
	// Other code...
	Timer++;
	if (Timer > 120) {
		// Our timer has finished, do something here:
		// SoundEngine.PlaySound, Dust.NewDust, Projectile.NewProjectile, etc. Up to you.
		Timer = 0;
	}
	// Other code...
}
```

[ExampleCustomAISlimeNPC.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/ExampleCustomAISlimeNPC.cs#L178) 用的就是这个写法。

### 用新字段做计时器

`NPC.ai[]` 和 `Projectile.ai[]` 由游戏自动做联机同步，但你也可以在 `ModNPC` 或 `ModProjectile` 里自己加字段。这样读起来清楚得多，代价是这份数据可能得你手动同步 —— 想了解细节去看 [Multiplayer Compatibility](https://github.com/tModLoader/tModLoader/wiki/Multiplayer-Compatibility#npc--modnpc)。也有些数据本来就不需要同步，平时多留心哪些该同步、哪些不用。

加个字段当计时器很简单：

```cs
public class ExampleBullet : ModProjectile
{
	public int Timer;

	public override void SetDefaults() {
		// code here
	}

	public override void AI() {
		Timer++;
		if (Timer > 120) {
			// Our timer has finished, do something here:
			// SoundEngine.PlaySound, Dust.NewDust, Projectile.NewProjectile, etc. Up to you.
			Timer = 0;
		}
	}
}
```

ExampleMod 里例子很多：[Abomination 的 Send/ReceiveExtraAI](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Old/NPCs/Abomination/Abomination.cs#L231)、[更多例子](https://github.com/tModLoader/tModLoader/search?utf8=%E2%9C%93&q=SendExtraAI+path:ExampleMod&type=Code)。

### 用 Projectile.timeLeft 做一次性计时

只需要在生成后第 X tick 做一件事的话，可以直接借 `Projectile.timeLeft`（也许你想在 `ModProjectile.SetDefaults` 里把它改小一点）：

```cs
// when the projectile has 1 seconds left in its life 
if(Projectile.timeLeft == 60) {
    // do something here.
} 
```

### 取模计时器

纯视觉的东西可以偷个懒，直接拿 `Main.GameUpdateCount` 做计时。玩法逻辑别这么干 —— 不精确，会出问题。

```cs
if(Main.GameUpdateCount % 60 == 0) {
   // Dust.NewDust or some other visual effect.
}
```

再看一个例子：让 4 种颜色每 1 秒切换一次。`GameUpdateCount` 除以 60 就变成了「秒」，再对 4 取模就能循环起来。这段代码来自 `ModifyTooltips` 方法，不过思路放到别的地方也通用。

```cs
switch (Main.GameUpdateCount / 60 % 4)
{
	case 0:
		line.OverrideColor = new Color(254, 105, 47);
		break;
	case 1:
		line.OverrideColor = new Color(34, 221, 151);
		break;
	case 2:
		line.OverrideColor = new Color(190, 30, 209);
		break;
	case 3:
		line.OverrideColor = new Color(0, 106, 185);
		break;
}
```

### 循环、往复与插值效果

要做一个随时间变化的视觉效果，可以交给计时器控制。比如让 tooltip 的颜色在两个颜色之间过渡 —— 用计时器控制「离第二个颜色还有多近」，这就叫插值（interpolation）。做法是用取模计时器，再把结果除以周期：`(Main.GameUpdateCount % 60) / 60f` 会从 0 慢慢走向 1，60 次游戏更新（1 秒）之后回到 0 重来。把这个值丢给 `Color.Lerp`，拿到的就是落在两个颜色之间的结果。

**循环**

```cs
float lerpAmount = (Main.GameUpdateCount % 60) / 60f;
Color color = Color.Lerp(Color.Red, Color.Green, fade); 
```

游戏每次更新都跑一遍这段，颜色就会在一秒里从红过渡到绿，然后跳回红。改 60 就能调节奏。类似的还有 `MathHelper.Lerp`、`Utils.MultiLerp`，可以自己试着玩。

**往复**

另一种做法是往复（cycling）：从 0 插值到 1，再回到 0。这样能避开循环那种「啪」地跳回去的突兀感。`Utils.PingPongFrom01To010` 接收一个 0 到 1 的值，把它在 0 和 1 之间来回插值而不产生跳变。下面的例子就是红 → 绿 → 红，然后重复。

```cs
float lerpAmount = Utils.PingPongFrom01To010((Main.GameUpdateCount % 60) / 60f);
Color color = Color.Lerp(Color.Red, Color.Green, fade); 
```

`Utils.Turn01ToCyclic010` 作用一样，但走的是余弦波那样平滑的路径。想要更顺、避免中途突然反向，就用它。

# 世界时间

世界时间通常和游戏时间同步推进，但有些场合两者的差别很关键：游戏暂停时世界时间不走；附魔日晷生效期间，时间是平时的 60 倍速；旅途模式（Journey Mode）也能调世界时间。另外要注意，模组同样可能改变时间流速 —— 比如 HerosMod 能把时间停住，这时候靠世界时间做玩法效果就会失灵。

## 常用字段

* `Main.dayTime` - 白天为 true，夜晚为 false
* `Main.time` - 白天是 0（凌晨 4:30）到 54000（晚上 7:30）之间的值，夜晚是 0（晚上 7:30）到 32400（凌晨 4:30）之间的值，要配合 `Main.dayTime` 使用。它通常每 tick 加 1（见 `Main.dayRate`）。游戏里每个小时等于 3600 tick。
  * 例如：`Main.dayTime && Main.time < 18000.0` 表示早晨 4:30 到 9:30（因为 18000/3600 == 5）
* `Main.dayRate` - 正常是 1，附魔日晷生效期间是 60。这个值会在 `Main.UpdateTime` 方法里被加到 `Main.time` 上。

## 典型用途

* [NPC 生成](https://github.com/tModLoader/tModLoader/wiki/Basic-NPC-Spawning)
* 世界更新事件，例如 [ExampleWorld 里的火山事件](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Old/ExampleWorld.cs#L336)（原文这里还挂着 TODO）

# 现实时间

刚上手的时候，你可能去搜过「c# timer」，然后看到一堆用 `System.Timers` 的写法。那些跟电子游戏、跟 tModLoader 模组完全不搭边，它们属于现实时间。该用哪种，回去看上面的[世界时间](#世界时间)和[游戏时间](#游戏时间)。再说一遍：用 `System.Timers` 基本一定是错的 —— 玩家一暂停游戏或者点开附魔日晷，你的代码就会出问题。

`Thread.Sleep` 同理，用它等一段时间再执行会把游戏卡死。想让代码「过一会儿再跑」，得自己利用游戏循环写逻辑。

现实时间对模组作者也有一个正当用途：测一段代码的性能，比如世界生成的方法快不快。这种时候放心用：

```cs
var stopWatch = Stopwatch.StartNew();
// Code to measure
ModContent.GetInstance<ExampleMod>().Logger.Info($"{stopWatch.ElapsedMilliseconds} milliseconds have elapsed.");
```
