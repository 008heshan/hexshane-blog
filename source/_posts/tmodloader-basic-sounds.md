---
title: Basic Sound Guide
description: 音效播放：SoundStyle 的字段、音量与音调、循环音效、实例数限制，以及几个常见错误。
date: 2026-08-19 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic Sound Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-Sounds)。

这一篇对应 1.4 版本；如果你还在用 1.3，看[这一版旧页面](https://github.com/tModLoader/tModLoader/wiki/Basic-Sounds/0dd271b8a344c26fb1a1b375b1250d4f7069c626)。

# 简介

tModLoader 里能放声音的地方非常多，这篇讲清楚声音是怎么组织的、该怎么用。

# 声音基础

动手之前先分清两个概念。一个是声音资源本身（sound asset），它对应磁盘上的一个声音文件，比如某个 `.wav`；另一个是 `SoundStyle`，它是个对象，代表某个声音资源外加一整套播放设置。

## 声音资源

模组的声音文件放在你的 ModSources 目录里，原版 Terraria 的声音则在游戏安装目录里。文件格式 `.wav`、`.ogg`、`.mp3`、`.xnb` 都行。举个例子，[ExampleMod](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Assets/Sounds/Items/Guns) 里有个 `ExampleGun.ogg`，路径是 `ExampleMod\Assets\Sounds\Items\Guns\ExampleGun.ogg`。而 Terraria 安装目录的 `C:\Program Files (x86)\Steam\steamapps\common\Terraria\Content\Sounds` 下躺着几百个声音文件，它们是 `.xnb`，一种双击打不开、也听不了的特殊格式 —— 想在自己电脑上试听，走下面的[提取（Extract）](#提取（Extract）)一节。

## SoundStyle

现成的 `SoundStyle` 都在 `Terraria.ID.SoundID` 类里；你也可以自己新建，用来做已有音效的变体，或者播放自己模组里的音频。

新建 `SoundStyle` 需要声音文件的路径，**不带扩展名**。拿到路径就能建对象、存起来以后用：

```cs
// Creating a SoundStyle from a sound file in this Mod, then playing it
SoundStyle ExampleGunSoundStyle = new SoundStyle("ExampleMod/Assets/Sounds/Items/Guns/ExampleGun");
SoundEngine.PlaySound(ExampleGunSoundStyle);

// Creating a SoundStyle from a sound file from Terraria, then playing it
SoundStyle CoinsSoundStyle = new SoundStyle("Terraria/Sounds/Coins");
SoundEngine.PlaySound(CoinsSoundStyle);
```

不想存变量也可以直接播：

```cs
// Creating a SoundStyle from a sound file in this Mod, then playing it
SoundEngine.PlaySound(new SoundStyle("ExampleMod/Assets/Sounds/Items/Guns/ExampleGun"));

// Creating a SoundStyle from a sound file from Terraria, then playing it
SoundEngine.PlaySound(new SoundStyle("Terraria/Sounds/Coins"));
```

`SoundStyle` 还能继续调节音量、音调、重叠行为等等，见下面的[自定义播放参数](#自定义播放参数)。

# 播放声音

有些声音会自动播，有些得你手动调。

## 预设事件音效

最常用的做法就是"某件事发生时响一声"。比如 `Item` 被使用时，`Item.UseSound` 会自动播放 —— 你只要把 `SoundStyle` 赋给这些现成的字段，到点它自己就响。

可以赋值的字段有 `Item.UseSound`、`NPC.HitSound`、`NPC.DeathSound`、`ModWall.HitSound` 和 `ModTile.HitSound`，赋值一般写在对应的 `SetDefaults` 重写里。下面几个例子既用了现成的 `SoundStyle`，也用了自己建的：

```cs
// using Terraria.ID; needed at top of .cs file

public override void SetDefaults()
{
	// other code
	Item.UseSound = SoundID.Item1;  // sword swing sound
}

public override void SetDefaults()
{
	// other code
	NPC.HitSound = SoundID.NPCHit24; // Giant Tortoise hit sound
	NPC.DeathSound = SoundID.NPCDeath4; // Bat death sound
}

// using Terraria.Audio; additionally needed at top of .cs file for this example

public override void SetDefaults()
{
	// other code
	Item.UseSound = new SoundStyle($"ExampleMod/Assets/Sounds/Items/Guns/ExampleGun"); // Sound file from this mod
}
```

其它的现成音效可以靠 [Intellisense](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#autocomplete--intellisense) 翻出来，但要有心理准备：大部分名字相当笼统。要找某个具体的声音，看下面的[找音效](#找音效)一节。

用现成的 `SoundStyle`，等于把它自带的那套播放设置一并继承下来，细节见[自定义播放参数](#自定义播放参数)。

## 手动播放声音

手动播放用 `SoundEngine.PlaySound`。这个方法属于 `Terraria.Audio;` 命名空间，所以 `.cs` 文件顶部得有 `using Terraria.Audio;`。

它有两个参数：第一个是 `SoundStyle`，必填；第二个是可选的 `Vector2`，表示声音在世界坐标中的位置。位置不传，声音就没有声像变化，听起来像在屏幕正中响。

播放一个现成音效，直接调就行：

```cs
SoundEngine.PlaySound(SoundID.Item59); // piggy bank oink
```

想让声音从特定位置发出，就把位置作为第二个参数传进去（世界坐标）。下面这段假设代码写在 `ModProjectile` 里：

```cs
SoundEngine.PlaySound(SoundID.Item59, Projectile.Center); // piggy bank oink
```

### 这段代码放哪儿？

哪儿合适放哪儿，不过最常见的是 `ModNPC.AI` 和 `ModProjectile.AI`。配合随机数或者计时器，你的内容会显得更自然。

# 自定义播放参数

`SoundID` 里不少现成的 `SoundStyle` 是预先配好参数的。比如你播 `SoundID.NPCHit24`，会发现它比 `new SoundStyle("Terraria/Sounds/NPC_Hit_24")` 轻一半 —— 每个 `SoundStyle` 身上都挂着这类配置数据。

要改这些参数得用 [`with` 表达式](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/with-expression)。`with` 做的事说白了就是复制一个已有对象，只改你指定的那几项。举例：`ModNPC` 里写了 `NPC.HitSound = SoundID.NPCHit4;`，听着音量对这个敌人偏高，那就复制一份、把音量调小：`NPC.HitSound = SoundID.NPCHit4 with { Volume = 0.7f };`。

`with` 对原版音效和模组音效都有效，也能一次改好几项。常用的几项凑在一起是这样：

```cs
NPC.HitSound = SoundID.NPCHit4 with { 
    Volume = 0.5f, 
    Pitch = 0.5f, 
    PitchVariance = 0.1f, 
    MaxInstances = 3, 
    SoundLimitBehavior = SoundLimitBehavior.IgnoreNew 
};
```

## Volume

音量，默认 `1f`（100%），取值范围 `0f` 到 `1f`。

## Pitch

音调，可高可低，默认 `0f`。下限 `-1f` 是降一个八度，上限 `1f` 是升一个八度。

## PitchVariance

音调浮动量：每次播放时给音调叠一点随机值。重复播放的音效有了它就不那么腻。

## MaxInstances

同一个声音最多能同时播几个实例，默认 `1`。想让声音互相叠起来就调大它。

## SoundLimitBehavior

`MaxInstances` 到顶之后怎么办。默认 `ReplaceOldest`，也就是把最早的那个重新开始播；另一个选项 `IgnoreNew`，直接无视这次新的播放请求。

## IsLooped

声音要不要循环，默认 false。用之前**务必**先看下面的[循环音效](#循环音效)一节。

## Variation

可以给一个 `SoundStyle` 挂多个声音文件，让它们随机播。做法是文件名主体保持一致，末尾接一个序号。比如 `SoundStyle ExampleGunsSoundStyle = new SoundStyle("ExampleMod/Assets/Sounds/Items/Guns/ExampleGun_", 3);` 就会在 `ExampleGun_1`、`ExampleGun_2`、`ExampleGun_3` 里等概率挑一个。

### 权重与指定变体后缀

想要按权重随机、或者精确指定用哪些后缀，用 `SoundStyle` 的其它构造函数重载就行。

![Intellisense 里列出的 SoundStyle 构造函数重载，含变体数量、变体后缀与权重等参数](/img/posts/tmodloader-basic-sounds/176332504-3d5f41a1-0420-48bf-ae38-ed3adb62334e.png)

原版鸭子的叫声就是个典型例子。它挂在 `Zombie_` 这组文件上，主要有两个变体 `Zombie_10` 和 `Zombie_11`，另外还有个极稀有的 `Zombie_12` —— 那是真人录的一声"quack"，听着挺瘆人。代码用权重把天平压向两个正常叫声：`Zombie_10` 和 `Zombie_11` 各 300f，`Zombie_12` 只有 1f。也就是说平均每 601 次鸭叫里才会混进一次 `Zombie_12`：

```cs
SoundStyle quack = new SoundStyle("Terraria/Sounds/Zombie_", stackalloc (int, float)[] { (10, 300f), (11, 300f), (12, 1f) });
```

## Position

位置决定声音相对屏幕位置听起来有多响，也决定左右声道哪边更重，好让玩家听出方向。注意 Position 不是 `SoundStyle` 的属性，而是 `SoundEngine.PlaySound` 的第二个参数。它可以不传，不传就正常播放，既没有声像偏移也没有音量衰减。

# 活动音效（Active Sounds）

电子游戏里的音效，绝大多数时候"放完不管"就够了。fire and forget 是游戏编程里的说法：发动一个动作，让它自己跑完，之后不再插手。大部分音效短得没必要中途停掉或调音量、调音调，为它维护一套状态不值当。

但确实有些场合需要盯着正在播的声音、随时改它，最典型的就是长音效和循环音效。

tModLoader 管这类声音叫"活动音效"（Active Sound）。

[ActiveSoundShowcaseProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ActiveSoundShowcaseProjectile.cs) 是一份能上手的参考，强烈建议开 `ExampleMod`，在游戏里拿 `ActiveSoundShowcase` 这件物品自己试。这一节和那个文件对着看最有效。

想用好活动音效，先认识下面几个类：

### SlotId

前面一直在调 `SoundEngine.PlaySound`，但从没管过它的返回值 —— 其实它是有返回值的，返回一个 `SlotId` 实例。把这个 `SlotId` 存成类字段，之后就能靠它把那次播放对应的声音找回来。

再配合 `SoundEngine.TryGetActiveSound`，`SlotId` 就能取到对应的 `ActiveSound`，然后动手改。

### ActiveSound

`ActiveSound` 对应某个 `SoundStyle` 当前正在播放的一个实例。模组代码一般用 `SlotId` 或 `SoundStyle` 把它取出来操作。

用 `SoundEngine.FindActiveSound`，可以拿 `SoundStyle` 反查 `ActiveSound`。不过 `SoundEngine.TryGetActiveSound` 更常见 —— 同一个 `SoundStyle` 可能有好几个实体在同时播，靠 `SoundStyle` 反查很容易取错那一个。

### SoundUpdateCallback

`SoundEngine.PlaySound` 的第三个参数（可选）是一个 `SoundUpdateCallback` 委托。你可以传一个方法进去：它接收一个 `ActiveSound` 参数、返回 bool，声音每次随游戏更新时都会被调用一次。这是动态改声音的主要手段；当然，按代码设计在别的地方改也完全可以。

## 跟随声源移动位置

现在可以动手处理活动音效最常见的用途了：动态改声音位置。NPC 或者弹幕发出的短音效，玩家一般察觉不到它没有跟着动；但长音效不跟着移动就很明显。要改位置，取到 `ActiveSound` 再改它的属性即可。

### 长音效跟随示例

```cs
public class MyNPC : ModNPC
{
	SlotId wooshSoundSlot;
	SoundStyle wooshSoundStyle = new SoundStyle("ModMod/Sounds/whoosh");

	public override void AI() {
		// other AI code...

		// Check if the sound is already playing...
		if (!SoundEngine.TryGetActiveSound(wooshSoundSlot, out var activeSound)) {
			// if it isn't, play the sound and remember the SlotId
			wooshSoundSlot = SoundEngine.PlaySound(wooshSoundStyle, NPC.Center);
		}
		else {
			// if it is playing, update the location of the sound to match the NPCs position
			activeSound.Position = NPC.Center;
		}
	}
}
```

## 停止音效

声源中途没了，声音也能提前停：逻辑和上面一样，只是这回在 `ActiveSound` 上调用 `Stop` 方法。放在代码里任何合适的位置都行。

## 动态修改音量

同理，改 `ActiveSound` 实例上的 `Volume` 字段，就能实时调整音量。

## 动态修改音调

还是同理，改 `ActiveSound` 实例上的 `Pitch` 字段，就能实时调整音调。

## 用 SoundUpdateCallback 的写法

循环音效那节讲的 `SoundUpdateCallback` 写法在这里同样好用 —— 它能把所有声音逻辑收在一个地方。

## 循环音效

上面这些手法应付长音效够了，但用在循环音效上有可能让声音一直播到关游戏。举例：一个设成循环的声音起了头，结果实体那边抛了异常、或者代码出岔子，跟踪它的"活动音效"失活了 —— 没人叫它停，它就老老实实永远循环下去。

正因如此，处理循环音效时**一定**要用 `SoundEngine.PlaySound` 的 `SoundUpdateCallback` 参数。事实上，即使不是循环音效，很多人也会觉得这套写法比前面用 `SlotId` 的更省事。

做一个循环音效很简单：给要播的 `SoundStyle` 加上 `IsLooped = true`。

### SoundUpdateCallback 示例

把 `SoundUpdateCallback` 委托作为参数传给 `SoundEngine.PlaySound`，你提供的方法每帧都会被调用，声音的位置和其它属性就能在那儿更新；委托的返回值决定要不要把声音停掉。下面这个例子里，弹幕每帧更新声音位置，弹幕失效时声音随之停止 —— 当然你也可以按别的条件来判断。

```cs
public class MyProjectile : ModProjectile
{
	SlotId loopingSoundSlot;
	SoundStyle loopingSoundStyle = new SoundStyle("ModMod/Sounds/loopSound") {
		IsLooped = true,
	};

	public override void AI() {
		// other AI code...

		// Check if the sound is already playing...
		if (!SoundEngine.TryGetActiveSound(loopingSoundSlot, out var activeSound)) {
			// if it isn't, play the sound and remember the SlotId
			var tracker = new ProjectileAudioTracker(Projectile);
			loopingSoundSlot = SoundEngine.PlaySound(loopingSoundStyle, Projectile.position, soundInstance => {
				// This example is inlined, see ActiveSoundShowcaseProjectile.cs for other approaches
				soundInstance.Position = Projectile.position;
				return tracker.IsActiveAndInGame();
			});
		}
	}
}

```

**注意**：让 `Projectile` 跟踪声音时，必须用 `ProjectileAudioTracker` 实例，否则会撞上某些罕见边界情况。[ActiveSoundShowcaseProjectile.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Projectiles/ActiveSoundShowcaseProjectile.cs) 里的示例展示了正确用法。`NPC` 的话，检查 `.active` 一般就够了；其它情况就得自己确认逻辑能让声音在某个时刻正常停掉。

# 移植原版代码与旧版 tModLoader 代码

旧版本 tModLoader 以及反编译出来的 Terraria 代码，播放声音用的不是 `SoundStyle` 这一套。想拿这类代码来用，得先改。比如你可能见到 `SoundEngine.PlaySound(12);` 或者 `SoundEngine.PlaySound(4, (int)base.position.X, (int)base.position.Y, 7);`，直接丢进模组会报 `No overload for method 'PlaySound' takes 4 arguments` 之类的错。

修法是：去[官方 Terraria Wiki 的 Sound IDs 页面](https://terraria.wiki.gg/wiki/Sound_IDs)查那个声音，找到跟你手头参数对应的那一行，改写成 `SoundID` 里的条目。偶尔会有对不上的地方，比如 "NPC Hit 50" 对应 `SoundID.NPCHit50`、"NPC Killed 18" 对应 `SoundID.NPCDeath18`。实在拿不准就靠常识和 [Intellisense](https://github.com/tModLoader/tModLoader/wiki/Why-Use-an-IDE#autocomplete--intellisense) 判断 —— 还报错就说明没改对。

看个简单的例子：

```cs
// Old code
SoundEngine.PlaySound(12);
```

翻开 wiki，找到 ID 为 12 的那一行：

![Terraria Wiki 的 Sound IDs 表格，ID 12 那一行标出了序号 ① 与内部名称 MenuTick ②](/img/posts/tmodloader-basic-sounds/171317783-e1dc3817-13e5-4444-abd9-4451f23a04aa.png)

信息到手，代码就能改了：

```cs
// Fixed code
SoundEngine.PlaySound(SoundID.MenuTick);
```

有时原版代码会给第二、第三个参数传 `-1`，这代表位置为空，忽略即可。也可能碰到某个在 wiki 上只有一条记录的声音，参数里带个 `1` 当 "Style"，同样忽略：

```cs
// Old
SoundEngine.PlaySound(12, -1, -1, 1);
// Fixed
SoundEngine.PlaySound(SoundID.MenuTick);
```

有时候会出现两个数字（一个 "Type" 一个 "Style"），在 wiki 上的写法是前一个数字后面跟一个括号里的数字：

```cs
// Old code
SoundEngine.PlaySound(4, (int)base.position.X, (int)base.position.Y, 7);
```

还是去 wiki 找 ID 为 4、style 为 7 的那一条，页面上显示成 `4 (7)`：

![Sound IDs 表格里写成 4 (7) 的那一行，对应内部名称 NPCDeath7](/img/posts/tmodloader-basic-sounds/171318331-62a11319-12a1-48d3-b905-87df52a199b7.png)

照着改就行。顺带一提，`SoundEngine.PlaySound` 的第二个参数现在是 `Vector2`，所以位置可以整个传进去，不用再把 `X` 和 `Y` 拆成两个坐标：

```cs
// Fixed code
SoundEngine.PlaySound(SoundID.NPCDeath7, base.position);
```

偶尔旧代码还会设音量或音调偏移，这类用上面[自定义播放参数](#自定义播放参数)里讲的 `with` 表达式处理：

```cs
// Old
SoundEngine.PlaySound(12, -1, -1, 1, 0.75f, 0.3f);
// Fixed code A: Taking into account the volume and pitch settings of the existing SoundStyle, if any. This is a direct adaptation of the old code
SoundStyle adjusted = SoundID.MenuTick with {
	Volume = SoundID.MenuTick.Volume * 0.75f,
	Pitch = SoundID.MenuTick.Pitch + 0.3f,
};
SoundEngine.PlaySound(adjusted);
// Fixed code B: Ignoring the existing volume and pitch settings inherited by the existing SoundStyle. This is technically different, but might be useful to know. Note that pitch has 1f added to it.
SoundEngine.PlaySound(SoundID.MenuTick with { Volume= 0.75f, Pitch = 1.3f });
```

A 是把旧代码直译过来 —— 在原 `SoundStyle` 自带的音量和音调基础上再叠加；B 则无视继承来的那套设置，技术上跟旧代码并不完全等价，但值得知道。注意 B 里音调是加了 `1f` 的。

想移植自己模组里的旧代码，就按上面 [SoundStyle](#SoundStyle) 那节的办法，给那个声音建一个 `SoundStyle`。

# 找音效

对很多模组来说，复用 Terraria 自带的声音是个好主意。原版有 700 多个声音，但想找出某个具体的是真费劲。常见的路子有三条：

1. 把所有声音提取出来，用播放器一个个听
2. 从你记得的某个物品或 NPC 反查它用的声音
3. 翻源码，找到播放这个声音的那段代码

## 提取（Extract）

Terraria 的声音是 `.xnb` 文件，在电脑上没法直接播。[TConvert](https://forums.terraria.org/index.php?threads/tconvert-extract-content-files-and-convert-them-back.61706/) 能把它们提取成 `.wav`，之后 VLC 或者随便什么播放器都能放。一口气顺下来听，是快速找到合适音效的办法。

## 在 Terraria Wiki 上找

到[官方 Terraria Wiki 的 Sound IDs 页面](https://terraria.wiki.gg/wiki/Sound_IDs)，任何声音都能查到、也能当场试听。表里的 internal name 一列，就是你要写的 `SoundID` 字段名。已知某个敌人或物品会发出某个声音、想把它是哪一条查出来，用这个办法最快。

## 辅助找声音的模组

有些模组专门帮你找声音、试声音：

[Modders Toolkit](https://forums.terraria.org/index.php?threads/modders-toolkit-a-mod-for-modders-doing-modding.55738/) 有个记录声音的开关，能看出是哪段代码触发了播放，也能看到模组声音的路径、声音类型和 style。它还能试音量和音调参数，并生成可以直接粘进模组的播放代码。

## 源码（需要专家级前置知识）

用 `ItemID` 或 `NPCID` 的数字去搜 `NPC.SetDefaults` 或者 `Item.SetDefaults`，很容易找到你想要的那个声音。

但 Terraria 里播放的声音不全是 `UseSound`、`HitSound`、`DeathSound` 这几项数据，所以想找特殊情况下才响的声音，只能翻源码。比如你可能好奇鸭子偶尔叫的那几声在哪：搜鸭子 NPCID 362，会看到结果里有一处 `SoundEngine.PlaySound(30, (int)position.X, (int)position.Y);`，嵌在「白天 + 1/200 概率」的条件里。拿到这些信息，就能正确实现一只新鸭子了。

这段代码要按 tModLoader 的写法改掉，也就是改成 `SoundEngine.PlaySound(SoundID.Duck, position);`。

## 电子表格

原版物品和 NPC 的 UseSound、HitSound、DeathSound 可以在这里查：

- [Vanilla Item Field Values](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Item-Field-Values)
- [Vanilla NPC Field Values](https://github.com/tModLoader/tModLoader/wiki/Vanilla-NPC-Field-Values)

注意：这些表目前有点过时，里面的数字要自己换算成 `SoundID` 字段。比如某个物品的 `UseSound` 写着 "20"，你得写成 `SoundID.Item20`。

## 从别处找声音

想从网上找音效，尽量挑那些明确允许免费、合法使用的声音。

# 常见错误

### The name SoundID doesn't exist in the current context

在源文件顶部加 `using Terraria.ID;`。

### The name SoundEngine doesn't exist in the current context

在源文件顶部加 `using Terraria.Audio;`。

### The type or namespace name 'SoundStyle' could not be found (are you missing a using directive or an assembly reference?)

在源文件顶部加 `using Terraria.Audio;`。

### "Ensure that the specified stream contains valid PCM mono or stereo wave data."

把 `.wav` 丢进 [Audacity](http://www.audacityteam.org/download/)，用 `File->Export Audio->Wav (Microsoft) signed 16-bit PCM` 重新导出。供参考，Wav 文件必须满足以下条件：

1. 必须是 PCM wave 文件
2. 只能是单声道或立体声
3. 必须是 8 位或 16 位
4. 采样率必须在 8,000 Hz 到 48,000 Hz 之间

## 相关链接

- [Vanilla SoundIDs](https://github.com/tModLoader/tModLoader/wiki/Vanilla-Content-IDs#sound-ids)

## 基础篇不涉及的内容

音乐（Music）—— 音乐是另一套完全不同的机制。
