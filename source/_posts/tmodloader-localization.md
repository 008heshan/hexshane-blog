---
title: Localization
date: 2026-09-02 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Localization](https://github.com/tModLoader/tModLoader/wiki/Localization)。

> 这篇指南是按 tModLoader v1.4.4 写的。旧版 tModLoader 的本地化文件不会自动更新，文中有些方法也不存在 —— 但基本概念是通用的。

原文还提供 [中文版](https://github.com/tModLoader/tModLoader/wiki/zh‐Localization‐本地化) 和 [Русская версия | Russian version](https://github.com/tModLoader/tModLoader/wiki/ru-Localization-Локализация) 两个页面。

# 什么是本地化？

本地化（localization）要做的事很简单：让说别的语言的玩家也能顺畅地玩你的模组。玩家在游戏里看到的每一段文字 —— 物品名、提示、对话 —— 都装在所谓的"本地化文件"（localization file）里。举个例子，ExampleMod 里有件物品英文叫 "Paper Airplane"，俄语版叫 "Бумажный самолётик"。有了本地化，俄语玩家不用先学英语就能看懂这个模组的内容。

这些文件本身很好上手，不懂编程的人也能给模组做翻译。翻完之后既可以交给模组作者，也可以单独发成一个新模组，让更多人用上。

**哪怕你压根没打算支持第二种语言，只要模组里有文字，你就得用本地化文件 —— 只不过只写你自己那一种语言而已。**

这篇讲的是模组开发者视角的本地化。如果你是想给别人的模组做翻译，或者想给 tModLoader 本身贡献翻译，请去看 [Contributing Localization](https://github.com/tModLoader/tModLoader/wiki/Contributing-Localization)。

# 支持的语言

目前 tModLoader 支持下面这些语言（locale），表格里同时给出了对应的默认文件名。注意：如果用[前缀写法](https://github.com/tModLoader/tModLoader/wiki/Localization#translation-file-names)，文件名是可以不一样的。

| 语言 | 语言代码 | 文件名 |
| --- | --- | --- |
| 英语 English | en-US | en-US.hjson |
| 德语 German | de-DE | de-DE.hjson |
| 意大利语 Italian | it-IT | it-IT.hjson |
| 法语 French | fr-FR | fr-FR.hjson |
| 简体中文 Simplified Chinese | zh-Hans | zh-Hans.hjson |
| 西班牙语 Spanish | es-ES | es-ES.hjson |
| 俄语 Russian | ru-RU | ru-RU.hjson |
| 巴西葡萄牙语 Brazilian Portuguese | pt-BR | pt-BR.hjson |
| 波兰语 Polish | pl-PL | pl-PL.hjson |

以下语言要 1.4.5 才有：

| 语言 | 语言代码 | 文件名 |
| --- | --- | --- |
| 日语 Japanese | ja-JP | ja-JP.hjson |
| 韩语 Korean | ko-KR | ko-KR.hjson |
| 繁体中文 Traditional Chinese | zh-Hant | zh-Hant.hjson |

# 从 1.4.3 迁移到 1.4.4

如果你的模组上次更新还停留在 1.4.3，这一节请仔细看完。

从 tModLoader v2023.01 起，所有本地化都改在 `.hjson` 文件里做，**不再支持在代码里声明翻译**。这么改之后，翻译的管理清爽很多，别人给模组做翻译也更容易。想看这个改动背后的完整理由，可以翻 [Major Localization Changes 提案](https://github.com/tModLoader/tModLoader/issues/3074)。

**动手之前先把模组源码目录备份一份**，尤其是你没用 Git 之类版本控制的话。

## 在 1.4.3 上导出本地化文件

第一步得借旧版 tModLoader 把翻译导出来。用 Steam 把 tModLoader 切到 `1.4.3-legacy` 分支（[版本切换方法](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#switch-to-stable-tmodloader-or-to-preview-tmodloader)）。

版本切对之后启动游戏，启用你的模组，进 `Mod Sources` 菜单，在列表里找到它。模组那一栏有个绿色箭头按钮，鼠标悬停会显示 "Export 1.4.4+ localization files"，点下去。

![Mod Sources 列表里的绿色箭头，悬停提示 Export 1.4.4+ localization files](/img/posts/tmodloader-localization/210681409.png)

然后打开 `ModSources` 文件夹，进到模组的本地化文件目录（如果之前根本没有本地化文件，就直接进模组根目录），你会看到一批新生成的 `.hjson.new` 文件：

![导出后目录里多出的 en-US.hjson.new、ru-RU.hjson.new、zh-Hans.hjson.new 等文件](/img/posts/tmodloader-localization/210681629.png)

用文本编辑器打开这些新文件确认内容对不对：原先 `.hjson` 里的条目应该都在，另外还会补上模组里其它内容对应的新条目。看着没问题就往下走。

### 键名变化

有不少键的结构变了。导出时会自动套用新格式，但你自己手写的自定义键、以及仍在用旧键名结构的代码，得由作者手动修。比如 `Mods.{ModName}.ItemName.{ContentName}` 现在变成了 `Mods.{ModName}.Items.{ContentName}.DisplayName`。

新旧键名对照如下：

```
Mods.{ModName}.DamageClassName.{ContentName}		Mods.{ModName}.DamageClasses.{ContentName}.DisplayName
Mods.{ModName}.InfoDisplayName.{ContentName}		Mods.{ModName}.InfoDisplays.{ContentName}.DisplayName
Mods.{ModName}.BiomeName.{ContentName}			Mods.{ModName}.Biomes.{ContentName}.DisplayName
Mods.{ModName}.BuffName.{ContentName}			Mods.{ModName}.Buffs.{ContentName}.DisplayName
Mods.{ModName}.BuffDescription.{ContentName}		Mods.{ModName}.Buffs.{ContentName}.Description
Mods.{ModName}.ItemName.{ContentName}			Mods.{ModName}.Items.{ContentName}.DisplayName
Mods.{ModName}.ItemTooltip.{ContentName}		Mods.{ModName}.Items.{ContentName}.Tooltip
Mods.{ModName}.NPCName.{ContentName}			Mods.{ModName}.NPCs.{ContentName}.DisplayName
Mods.{ModName}.Prefix.{ContentName}			Mods.{ModName}.Prefixes.{ContentName}.DisplayName
Mods.{ModName}.ProjectileName.{ContentName}		Mods.{ModName}.Projectiles.{ContentName}.DisplayName
Mods.{ModName}.ResourceDisplaySet.{ContentName}		Mods.{ModName}.ResourceDisplaySets.{ContentName}.DisplayName
Mods.{ModName}.Containers.{ContentName}			Mods.{ModName}.Tiles.{ContentName}.ContainerName
Mods.{ModName}.MapObject.{ContentName}			Mods.{ModName}.Tiles.{ContentName}.MapEntry
Mods.{ModName}.Keybind.{ContentName}			Mods.{ModName}.Keybinds.{ContentName}.DisplayName
```

## 切回 1.4.4 并重新构建模组

在 Steam 里把分支切回 `None`，回到 1.4.4（[版本切换方法](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#switch-to-stable-tmodloader-or-to-preview-tmodloader)）。

启动之后你会发现模组加载失败（多半你之前启用的一堆模组也一起挂掉）—— 这是预期现象。进 `Mod Sources` 菜单，按 "Run tModPorter" 按钮。除了其它改动，它会把所有走旧本地化写法的代码一并清掉。

![Mod Sources 菜单里的 Run tModPorter 按钮](/img/posts/tmodloader-localization/210683375.png)

接着拿那些 `.hjson.new` 文件去替换现有的 `.hjson`：先把现有的 `.hjson` 删掉，再把 `.hjson.new` 改名成 `.hjson`。如果系统不让你改扩展名，得先[让资源管理器显示文件扩展名](https://github.com/tModLoader/tModLoader/assets/4522492/2f901fe9-db01-4bff-b930-449220419ae7)。

之后打开 Visual Studio 把剩下的编译错误清干净，重新构建，模组应该就能跑了。跑通以后，可以在源码里搜 `// Tooltip.SetDefault("This is a modded Item.");` 或者 `// DisplayName.SetDefault("Example Sword");` 这类行删掉 —— 它们不会再被用到。（直接在项目里搜 `.SetDefault(` 就能把大部分这类行揪出来。）

想批量查找的话，下面两条正则能帮上忙（找到后替换成空字符串）。两者都需要 Notepad++ 这类支持 ". matches newline" 的工具：

- 单行注释：`\s+// [\w.]+SetDefault\(".+?;`
- 多行注释：`\s+/\*[\s\w.]+SetDefault\(".+?\*/`

在 Notepad++ 里对整个模组跑一遍的快捷流程：随便打开一个文件 → Ctrl+F → "Find in Files" 标签页 → 勾上底部的 "Regular Expression" 和 ". matches newline" → "Filters:" 填 `*.cs` → "Directory:" 点右侧按钮定位到模组根目录 → 正则粘进 "Find what:"，"Replace with:" 留空 → 按 "Replace in Files"。手滑改错了，按一次 Ctrl+Z 就能全部撤销。还是建议用 git 之类的版本管理，方便逐条回退、也能顺便检查结果。

# 本地化工作流程

本地化文件是在模组加载结束时更新的。也就是说，加了新内容之后必须先构建并加载一次模组，本地化文件才会跟着更新；更新完再去编辑 `.hjson` 填翻译；填完还要再构建、重载一次，翻译才会在游戏里生效。

不想白干活的话，把这个顺序记牢：

1. 往模组里加新内容，比如一个新的 `ModItem`
2. Build and Reload Mod
3. 这时 `.hjson` 里已经自动补上了新内容的条目，编辑 `.hjson`，给新内容写上英文名
4. Build and Reload Mod
5. 非英语的 `.hjson` 这时也补上了对应的占位条目，翻译者或作者可以接着填

如果翻译者直接把改好的 `.hjson` 发给你，要小心它可能被覆盖：模组加载时，tModLoader 一旦发现 `.tmod` 文件比 `.hjson` 新，就会拿旧内容把它盖回去。真遇到这种情况，正确做法是**先构建再加载/重载** —— 你可以关掉 tModLoader 用 Visual Studio 构建，也可以在启动 tModLoader 时按住 Shift 跳过加载模组，然后马上进 `Mod Sources` 构建。要是忘了这一步、发现刚翻译好的 `.hjson` 被还原成旧内容，把新版 `.hjson` 再拷回 ModSources 目录，然后构建加重载就行。

## 实时更新

ModSources 目录里的 `.hjson` 一保存，tModLoader 就会检测到，并在游戏运行时自动重新加载。有了这个机制，改完不用重新构建、重载就能立刻看到效果。但别忘了：**发布之前一定要重新构建一次**，否则改动不会进到发布的模组里。

下面是这个功能的实际效果：作者编辑 `en-US.hjson` 并保存，把 `ExampleWings` 这件物品的英文显示名和提示改掉，几秒后游戏里就变了：

https://user-images.githubusercontent.com/4522492/229942438-26604fd7-9073-436c-b2ab-d99b4f2efeb7.mp4

# 本地化是怎么运作的

游戏里每一段文字 —— 从物品名到主菜单上的字 —— 都走本地化。每段文字本质上是一对数据：一个本地化键（key）和一个本地化值（value）。比如玩家创建小世界时，游戏拿 `UI.WorldSizeSmall` 这个键去查当前语言对应的翻译值，选英语就显示 "Small"；换成别的语言，查的还是同一个键，只是取到的值不一样了。Terraria 的作者是用英语写代码的，所以大部分键跟它对应的英文值长得非常像。

在 tModLoader 里，模组用 `.hjson` 文件来规整地存放键和值，每种语言一个文件。熟悉 JSON 的话，看这些文件不会有障碍。

一个简单的例子：

Filename: **tModLoader/ModSources/ExampleMod/en-US.hjson**
```
Mods: {
	ExampleMod: {
		Items: {
			ExampleItem: {
				DisplayName: Example Item
				Tooltip: This is a modded Item.
			}
		}
	}
}
```

这里面有两个核心概念：本地化键和本地化值。键是把每一层嵌套里 `:` 左边的文字拼起来得到的，`:` 右边则是值。上面这个例子表达了两组键值：`Mods.ExampleMod.Items.ExampleItem.DisplayName` 对应 `Example Item`，`Mods.ExampleMod.Items.ExampleItem.Tooltip` 对应 `This is a modded Item.`。语法看着复杂也没关系，作者基本不需要手动编辑这些文件，游戏会自动更新它们。

模组加载时，tModLoader 会把当前语言对应的所有本地化文件找出来读进内存。游戏要显示文字时，就用键去内存里查，取出正确的文本。翻译在内存里以 `LocalizedText` 对象的形式保存，可以用 `Language.GetText` 方法从键拿到这个对象，再用它的 `Value` 属性取出值；或者直接用 `Language.GetTextValue` 方法，一步从键拿到值：

```cs
string hivePackDialogue = Language.GetTextValue("Mods.ExampleMod.Dialogue.ExampleTravelingMerchant.HiveBackpackDialogue");
or
string hivePackDialogue = Language.GetText("Mods.ExampleMod.Dialogue.ExampleTravelingMerchant.HiveBackpackDialogue").Value;
or
LocalizedText hivePackDialogueLocalizedText = Language.GetText("Mods.ExampleMod.Dialogue.ExampleTravelingMerchant.HiveBackpackDialogue");
string hivePackDialogue = hivePackDialogueLocalizedText.Value;
```

## 本地化键

tModLoader 会给绝大多数内容自动分配翻译键，格式是 `Mods.{ModName}.{Category}.{ContentName}.{DataName}`。其中 `ModName` 是模组的内部名，`Category` 由内容类型决定，`ContentName` 是内容的内部名（通常就是类名），`DataName` 指明类里的哪个键。

举例来说，`ModItem` 的 `Category` 是 `Items`，它还有两块数据：`DisplayName` 和 `Tooltip`。一个名叫 `ExampleMod` 的模组里加了个叫 `ExampleItem` 的 `ModItem` 类，那么 `.hjson` 里就会生成两个键：`Mods.ExampleMod.Items.ExampleItem.DisplayName` 和 `Mods.ExampleMod.Items.ExampleItem.Tooltip`。

**注意：** 键里不要出现空格和其它特殊字符。

## 替换（Substitution）

如果某些文字在本地化文件里反复出现，或者你想直接复用游戏里已有的文本，可以用"替换"来让文件保持干净。替换的写法是在值里放 `{$KeyHere}`，游戏加载时会把这一段换成那个键对应的本地化文本。

比如游戏本身就有 `Right Click To Open` 这句话的翻译，存在 `CommonItemTooltip.RightClickToOpen` 键里。模组想复用它，写 `Tooltip: "{$CommonItemTooltip.RightClickToOpen}"`，玩家看到的就会是自己语言下的那句提示。物品名、其它常见提示之类的现成翻译同样可以拿来用。

模组内部的翻译也能互相引用。比如 [ExampleMod 的本地化文件](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Localization/en-US.hjson) 里写了 `MapObject.ExamplePylonTile: "{$Mods.ExampleMod.ItemName.ExamplePylonItem}"`，直接把 `Mods.ExampleMod.ItemName.ExamplePylonItem` 键里的翻译搬过来用。

很多替换文本里带 `{0}`、`{1}`，这些是留给作者填值的占位符，机制见[字符串格式化一节](https://github.com/tModLoader/tModLoader/wiki/Localization#string-formatting)。

### 复用游戏已有的物品提示

给自己的物品用上游戏原版的提示文本是个好习惯 —— 说法统一、还自带各种语言的翻译，玩家看着也顺眼。所有这类键都以 `CommonItemTooltip.` 开头，完整清单如下：

```
// Added by Terraria
"UsesLife": "Uses {0} life",
"UsesMana": "Uses {0} mana",
"RestoresLife": "Restores {0} life",
"RestoresLifeRange": "Restores from {0} to {1} life",
"RestoresMana": "Restores {0} mana",
"MinuteDuration": "{0} minute duration",
"SecondDuration": "{0} second duration",
"PlaceableOnXmasTree": "Placeable on a christmas tree",
"String": "Increases yoyo range",
"Counterweight": "Throws a counterweight after hitting an enemy with a yoyo",
"BannerBonus": "Nearby players get a bonus against: ",
"BannerBonusReduced": "Nearby players get a small bonus against: ",
"SpecialCrafting": "Used for special crafting",
"DevItem": "'Great for impersonating devs!'",
"FlightAndSlowfall": "Allows flight and slow fall",
"PressDownToHover": "Press Down to toggle hover\nPress Up to deactivate hover",
"PressUpToBooster": "Hold Up to boost faster!",
"RightClickToOpen": "<right> to open",
"RightClickToClose": "<right> to close",
"MinorStats": "Minor improvements to all stats",
"MediumStats": "Medium improvements to all stats",
"MajorStats": "Major improvements to all stats",
"TipsyStats": "Minor improvements to melee stats & lowered defense",
"EtherianManaCost10": "Costs 10 Etherian Mana per use while defending an Eternia Crystal",
"GolfBall": "Can be hit with a golf club",
"Sentry": "Summons a sentry",
"GolfIron": "A well-rounded club best for mid-range distances\nGolf balls will carry a good distance with decent vertical loft",
"GolfPutter": "A specialized club for finishing holes\nGolf balls will stay close to the ground over short distances for precision shots",
"GolfWedge": "A specialized club for sand pits or tall obstacles\nGolf balls will gain tons of vertical loft but will not carry very far",
"GolfDriver": "A powerful club for long distances\nGolf balls will carry very far, with little vertical loft",
"Kite": "Kites can be flown on windy days\nReel it in with <right>",
"LavaFishing": "Allows fishing in lava",
"CreativeSacrificeNeeded": "Research {0} more to unlock duplication",
"CreativeSacrificeComplete": "Duplication unlocked",
"TeleportationPylon": "Teleport to another pylon when 2 villagers are nearby\nYou can only place one per type and in the matching biome",
"Whips": "Your summons will focus struck enemies",
"WizardHatDuringAnniversary": "Increases your max number of minions by 1",
"MechSummonDuringEverything": "'Part of a set'",
"MechdusaSummonNotDuringEverything": "'It has no effect in this world'",
"LuminiteVariant": "'A forbidden building material from beyond'",

// Added by tModLoader
"IncreasesMaxLifeBy": "Increases maximum life by {0}",
"IncreasesMaxManaBy": "Increases maximum mana by {0}",
"IncreasesMaxLifeByPercent": "Increases maximum life by {0}%",
"IncreasesMaxManaByPercent": "Increases maximum mana by {0}%",

"IncreasesBowDamageByPercent": "Increases bow damage by {0}%",
"IncreasesGunDamageByPercent": "Increases gun damage by {0}%",
"IncreasesSpecialistDamageByPercent": "Increases specialist ranged damage by {0}%",

"IncreasesWhipRangeByPercent": "Increases whip range by {0}%",
"IncreasesMaxMinionsBy": "Increases your max number of minions by {0}",
"IncreasesMaxSentriesBy": "Increases your max number of sentries by {0}",

"IncreasesFishingPowerBy": "Increases fishing power by {0}",

"PermanentlyIncreasesMaxLifeBy": "Permanently increases maximum life by {0}",
"PermanentlyIncreasesMaxManaBy": "Permanently increases maximum mana by {0}",

"ReducesDamageTakenByPercent": "Reduces damage taken by {0}%",

"PercentChanceToSaveAmmo": "{0}% chance to save ammo",
"PercentReducedManaCost": "{0}% reduced mana cost",

"PercentIncreasedMiningSpeed": "{0}% increased mining speed",
"PercentIncreasedMovementSpeed": "{0}% increased movement speed",

"ArmorPenetration": "{0} armor penetration",
"PercentIncreasedDamage": "{0}% increased damage",
"PercentIncreasedCritChance": "{0}% increased critical strike chance",
"PercentIncreasedDamageCritChance": "{0}% increased damage and critical strike chance",

"PercentIncreasedMagicDamage": "{0}% increased magic damage",
"PercentIncreasedMagicCritChance": "{0}% increased magic critical strike chance",
"PercentIncreasedMagicDamageCritChance": "{0}% increased magic damage and critical strike chance",

"PercentIncreasedMeleeDamage": "{0}% increased melee damage",
"PercentIncreasedMeleeCritChance": "{0}% increased melee critical strike chance",
"PercentIncreasedMeleeDamageCritChance": "{0}% increased melee damage and critical strike chance",
"PercentIncreasedMeleeSpeed": "{0}% increased melee speed",

"PercentIncreasedRangedDamage": "{0}% increased ranged damage",
"PercentIncreasedRangedCritChance": "{0}% increased ranged critical strike chance",
"PercentIncreasedRangedDamageCritChance": "{0}% increased ranged damage and critical strike chance",

"PercentIncreasedSummonDamage": "{0}% increased summon damage",
"SummonTagDamage": "{0} summon tag damage",
"PercentSummonTagCritChance": "{0}% summon tag critical strike chance"
```

### 其它现成的翻译

除了专供物品提示的 `CommonItemTooltip.` 系列，原版游戏里任何一个翻译键都能引用。比如 `NPCName.BlueSlime` 就是蓝色史莱姆本地化名称的键。想查全部键，可以下载 [Terraria Workshop 指南里 Advanced Language Packs 一节](https://forums.terraria.org/index.php?threads/the-ultimate-guide-to-content-creation-and-use-for-the-terraria-workshop.100652/#advancedlanguagepack) 提到的那份 `.CSV` 文件。

另外注意：模组内容的翻译键**不**遵循原版内容那套固定格式。比如 ExampleMod 里的 `PartyZombie`，它的翻译键是 `Mods.ExampleMod.NPCs.PartyZombie.DisplayName`。模组内容的键不一定按某个默认规律生成，写代码时别假设它一定长什么样。

### 替换键的作用域简写

如果替换键和它所在的那个值的键共享同一段作用域，替换键可以简写。ExampleMod 的本地化文件里，`Mods.ExampleMod.Items.ExamplePetItem.DisplayName` 的值被设成 `"{$Common.PaperAirplane}"`。这时游戏会在当前作用域里逐层往上找，最后命中 `Mods.ExampleMod.Common.PaperAirplane` 并把它替换进来。用这个技巧，替换键里的 `Mods.ModName` 可以省掉；跟所在键重合的部分越多，能省掉的部分就越多。

查找顺序是这样的：把替换键接到当前键后面试一次，再去掉当前键最后一段试一次，如此逐段回退，直到命中一个已存在的键。以上面那对键值为例：

- `Mods.ExampleMod.Items.ExamplePetItem.DisplayName.Common.PaperAirplane` —— 不存在
- `Mods.ExampleMod.Items.ExamplePetItem.Common.PaperAirplane` —— 不存在
- `Mods.ExampleMod.Items.Common.PaperAirplane` —— 不存在
- `Mods.ExampleMod.Common.PaperAirplane` —— 存在，于是用它做替换

### 覆盖内容的本地化键

如果模组里很多物品共用同一句翻译，可以让它们都指向同一个翻译键：重写对应的属性，返回 `Language.GetOrRegister` 的结果即可。

```cs
public override LocalizedText Tooltip => Language.GetOrRegister("Mods.ExampleMod.Common.SomeSharedTooltip");
```

用了继承的话，只需要在基类里写一次；某个子类需要不一样的翻译时，再单独重写即可。想给内容添加默认属性之外的翻译，见[添加可本地化的属性](https://github.com/tModLoader/tModLoader/wiki/Localization#adding-localizable-properties)。

还可以写 `public override LocalizedText Tooltip => LocalizedText.Empty;` 来表示这个内容不生成翻译键，本地化文件会干净一些。

## 字符串格式化

翻译里可以留出位置，等真正用到的时候再填文本进去，这就是 C# 常规的[字符串格式化](https://learn.microsoft.com/en-us/dotnet/api/system.string.format?view=net-7.0#insert-a-string)。用 `string.Format` 方法，或者用 `Language.GetTextValue` 的几个重载都行，细节见下面的占位符一节。

### 占位符

翻译条目里会出现 `Missing mod: {0} required by {1}` 这样的东西。`{0}`、`{1}` 就是占位符，游戏会按代码逻辑把文本填进去，用法和普通 C# 里的 `string.Format` 是一回事。想翻得准确，有时候得进游戏里看一眼实际显示效果才明白该怎么用。

### 把数值绑定到翻译上

很多翻译条目里都有 `{0}`、`{1}` 这样的占位符。比如 `CommonItemTooltip.IncreasesMaxMinionsBy` 的值是 `Increases your max number of minions by {0}`，想把它用在饰品上，就得想办法把具体数字填进 `{0}`。

先在 `.hjson` 里给物品指定提示：

```
ExampleMinionBoostAccessory: {
	DisplayName: Minion Booster
	Tooltip: "{$CommonItemTooltip.IncreasesMaxMinionsBy}"
}
```

然后把这个值"绑"上去。假设这件饰品要让最大召唤物数 +3，做法是重写 `Tooltip` 属性，对原提示调用 `WithFormatArgs` 方法，占位符就会被传进去的值填上。推荐在类里用 `static readonly int` 字段存这类数值 —— 下面例子里 `MaxMinionIncrease` 在代码和提示中各用了一次，用字段能让行为跟提示同步改动；加上 `readonly` 可以防止运行时误改（那样改对 `WithFormatArgs` 是不生效的），也能避免手滑写错导致提示和实际效果对不上。

```cs
public class ExampleMinionBoostAccessory : ModItem
{
	public static readonly int MaxMinionIncrease = 3;

	public override LocalizedText Tooltip => base.Tooltip.WithFormatArgs(MaxMinionIncrease);

	public override void UpdateEquip(Player player) {
		player.maxMinions += MaxMinionIncrease; // Increase how many minions the player can have by three
	}
	
	// other code...
}
```

### LocalizedText.Format 方法

上一节用 `LocalizedText.WithFormatArgs` 把值绑到了 `LocalizedText` 实例上，适合一次赋值、长期不变的情况。有时候要填的值本身会变，每次显示都得重新算，那就得用 `LocalizedText.Format` 方法：同样是传参数填占位符，但它直接返回最终的 `string`，不会把值绑到 `LocalizedText` 上。这类调用要放在游戏运行期间才执行的代码里，比如 `ModItem.ModifyTooltips`。

```cs
public class ExampleCustomResourceWeapon : ModItem
{
	private int exampleResourceCost; // Add our custom resource cost

	public static LocalizedText UsesXExampleResourceText { get; private set; }

	public override void SetStaticDefaults() {
		UsesXExampleResourceText = this.GetLocalization("UsesXExampleResource");
	}

	public override void SetDefaults() {
		exampleResourceCost = 5; // Imagine exampleResourceCost changes dynamically in other logic in this item

		// ... other item defaults code
	}

	public override void ModifyTooltips(List<TooltipLine> tooltips) {
		tooltips.Add(new TooltipLine(Mod, "ExampleResourceCost", UsesXExampleResourceText.Format(exampleResourceCost)));
	}
}
```

### 多个可格式化替换并存

一条翻译引用多个替换时，占位符编号可能撞车。比如一件饰品同时用了 `CommonItemTooltip.IncreasesMaxManaBy` 和 `CommonItemTooltip.IncreasesMaxMinionsBy`，这两句里都只有 `{0}`，直接绑值就会互相打架。tModLoader 为此提供了偏移语法：在替换键后面加 `@` 和一个数字，就能把这个键里的占位符编号整体后移这么多位。写起来就是 `{$KeyHere@OffsetNumberHere}`。[ExampleBreastplate.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Armor/ExampleBreastplate.cs) 是个不错的范例：

**[tModLoader.json](https://github.com/tModLoader/tModLoader/blob/stable/patches/tModLoader/Terraria/Localization/Content/en-US/tModLoader.json) 里已有的 CommonItemTooltip 条目**
```
"CommonItemTooltip": {
	"IncreasesMaxManaBy": "Increases maximum mana by {0}",
	"IncreasesMaxMinionsBy": "Increases your max number of minions by {0}",
	// and so on
```

**ExampleMod/Localization/en-US.hjson**
```
ExampleBreastplate: {
	DisplayName: Example Breastplate
	Tooltip:
		'''
		This is a modded body armor.
		Immunity to 'On Fire!'
		{$CommonItemTooltip.IncreasesMaxManaBy}
		{$CommonItemTooltip.IncreasesMaxMinionsBy@1}
		'''
}
```

**ExampleMod/Content/Items/Armor/ExampleBreastplate.cs**
```cs
public class ExampleBreastplate : ModItem
{
	public static readonly int MaxManaIncrease = 20;
	public static readonly int MaxMinionIncrease = 1;

	public override LocalizedText Tooltip => base.Tooltip.WithFormatArgs(MaxManaIncrease, MaxMinionIncrease);

	public override void UpdateEquip(Player player) {
		player.buffImmune[BuffID.OnFire] = true; // Make the player immune to Fire
		player.statManaMax2 += MaxManaIncrease; // Increase how many mana points the player can have by 20
		player.maxMinions += MaxMinionIncrease; // Increase how many minions the player can have by one
	}
}
```
从这个例子里能看出来，`Tooltip.WithFormatArgs(MaxManaIncrease, MaxMinionIncrease)` 是想把 `MaxManaIncrease` 填进 `{0}`、`MaxMinionIncrease` 填进 `{1}`。因为本地化条目里写的是 `{$CommonItemTooltip.IncreasesMaxMinionsBy@1}`，那句原本的 `{0}` 就被当成 `{1}` 来解释，`MaxMinionIncrease` 才能落到提示里正确的位置上。

这一套看着有点绕，直接把提示文本写死在本地化文件里当然更省事。但用得对的话收益很可观：模组里很大一部分文本会自动跟着翻译成别的语言，而且能大幅减少将来因为一个笔误而让人看糊涂的情况。

想看点更复杂的用法，可以看 [ExampleStatBonusAccessory.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Accessories/ExampleStatBonusAccessory.cs) 和它对应的 [en-US.hjson](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Localization/en-US.hjson#L164) 条目。

### 为动态内容拼装翻译

极少数情况下，翻译要引用另一个模组里内容的名字，而组合是在运行时才生成的，没法提前写死一条翻译。

**建议：**
> 不要因为英语里句式总是固定的，就想着去拼装组合翻译 —— 别的语言未必有对应的句式。更好的做法是尽量多写几条具体、独立的翻译。举个例子，你可能会想写 `{0} damage`，然后把伤害类型名（`melee`、`ranged`、`magic`）替换进去。英语里这样没问题，但其它语言可能需要改变句子结构，或者根据替换词补上额外的语法成分。比如 `ranged damage` 可能译成"远程伤害"，而 `melee damage` 得译成"近战攻击造成的伤害"，硬拼出来的"近战伤害"或"近战造成的伤害"在语法上就不一定说得通。

一个典型的场景：模组要给游戏里每种弹药都自动加一件无限弹药物品。`WithFormatArgs` 的参数可以传别的 `LocalizedText`；你也可以直接重写某个 `LocalizedText` 属性，返回一个完全不同的 `LocalizedText`（见下面例子里的 `Tooltip`）。

```
InfiniteAmmoItem.DisplayName: "Infinite {0}"
```

```cs
public class InfiniteAmmoItem : ModItem
{
    Item baseAmmoItem;
    
    public override LocalizedText DisplayName => base.DisplayName.WithFormatArgs(baseAmmoItem.DisplayName);

    public override LocalizedText Tooltip => baseAmmoItem.Tooltip;
}
```

### ModConfig 里的用法

`ModConfig` 元素的 `Label` 和 `Tooltip` 也能用文本替换。通过 `LabelArgs` 和 `TooltipArgs` 这两个特性把值传给对应的翻译即可。注意以 `$` 开头的字符串会被当作翻译键处理。[ModConfigShowcaseLabels.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Common/Configs/ModConfigShowcases/ModConfigShowcaseLabels.cs) 里的 `InterpolatedTextA`、`InterpolatedTextB`、`InterpolatedTextC` 三个例子演示了这个能力。

## 复数形式（Pluralization）

用占位符表示数量时会碰到一个尴尬问题：`{0} minutes ago` 在数字正好是 1 的时候，英语该说 "1 minute ago" 而不是 "1 minutes ago"。这就是复数形式要解决的事。

作为占位符的延伸，tModLoader 支持按语言规则做基数词复数变化。英语里名词有两种形式，一种对应数量 1，一种对应多个，比如 "1 dog" 和 "3 dogs"；别的语言规则各不相同。为了照顾这些差异，翻译里可以用一段特殊语法来正确变复数。看这个例子：`{0} {^0:mod;mods} filtered by enabled filter.` —— `{0}` 是填数字的占位符，`{^0:mod;mods}` 则是让游戏去看第 0 个占位符的值，据此在 `mod` 和 `mods` 之间选一个。

英语、德语、意大利语、西班牙语、葡萄牙语都是值为 1 时用第一种形式，其它值用第二种；法语是 0 或 1 用第一种，其余用第二种；中文不管数量多少都只有一种形式。波兰语和俄语的规则更复杂一些，可以在 [Unicode 的 Language Plural Rules 页面](https://www.unicode.org/cldr/charts/43/supplemental/language_plural_rules.html) 上查。那些表格里基数词形式的排列顺序，就是 tModLoader 采用的顺序。

## 聊天标签（Chat Tags）

用[聊天标签](https://terraria.wiki.gg/wiki/Chat#Tags)可以给本地化值加上颜色和物品图标。想看例子，在 [ExampleMod 的本地化文件](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Localization/en-US.hjson)里找 `ExampleTooltipsItem`。

## NetworkText 类

多人游戏里，我们希望文本按每个客户端自己选的语言显示，而不是按服务端或发消息那个客户端所用的语言。`NetworkText` 类就是干这个的。你会注意到，跟网络消息打交道的方法都用 `NetworkText` 参数来传文本 —— 它既能用本地化键，也能直接拿 `LocalizedText` 对象，从而在多人环境下把消息正确地发出去。具体写法可以看 `NetworkText` 的文档和示例。

## 时机问题

模组里的本地化值在加载早期是拿不到的。比如在模组加载的早期阶段执行 `string text = Language.GetTextValue("MyKeyHere");`，拿到的会是 "MyKeyHere" 这个键名本身，而不是 `.hjson` 里写的值。同理，对那些还没注册的键，`Language.GetText` 方法会返回一个占位的 `LocalizedText`。

经验法则是：访问本地化**值**，一定要等到 `SetupContent` 阶段或之后。也就是说 `SetStaticDefaults`、`PostSetupContent` 这类方法适合取值（当然也适合取 `LocalizedText` 实例）。反过来，只要键已经存在于本地化文件里、或者用 `Language.GetOrRegister` 注册过，那么早在 `Load` 阶段就可以获取并缓存 `LocalizedText` 实例了 —— 这一点对 UI 代码尤其重要，也正因如此，`UIState` 适合在 `PostSetupContent` 里初始化，甚至等进游戏之后再初始化。

# 自动更新的本地化文件

有新的内容或翻译键出现时，tModLoader 会自动更新 `.hjson` 文件。英语文件被当作其它语言的模板，注释和排版都会自动继承过去。

为了效率，本地化文件只在游戏认为合适的时候更新：模组必须位于 `ModSources` 目录里，当前加载的必须是本地构建的模组，而且只有文件修改时间早于模组（或模组引用的其它模组）时才会更新。另外要留神：直接测试一个旧的 `.tmod` 文件可能会用旧内容覆盖你的 `.hjson`，所以推荐用 Git，或者备份一份模组源码，方便随时还原。

## 添加内容

往模组里加了新内容（比如一个 `ModItem`）之后，这份内容一开始是没有翻译的。这时构建并重载模组：加载完成后 `.hjson` 会自动更新，英语文件里多出新内容的默认条目，非英语文件里也会出现同样的条目，但被注释掉了。要把它翻出来，就编辑 `.hjson` 写上想要的文字，保存，再构建加重载一次。如果编辑器问你编码，记得存成 UTF-8。

## HJSON 语法

`.hjson` 文件装的是 Hjson 数据。Hjson 跟 JSON 很像，但更照顾人眼阅读。[Hjson 官网](https://hjson.github.io/)有完整的语法说明，不过大多数作者照着例子写就能上手。

### 多行文本

一段文字要跨多行时，用下面的写法，注意缩进要一致：

```
SomeKey: 
	'''
	This translation key has 2 lines.
	This is the 2nd line!
	'''
```

也可以用 `\n` 代替，但可读性差，不推荐。注意只有加了引号，`\n` 才会被当成换行解释。tModLoader 更新 `.hjson` 时会自动把这种写法转成上面的多行格式：

```
SomeKey: "This translation key has 5 lines and low readability.\nThis is the 2nd line!\nThis is the 3rd line!\nThis is the 4th line!\nThis is the 5th line!"
```

### 特殊字符

如果翻译值要以 `{}[],:` 或空白字符开头，就必须加引号；其它情况下引号可以省略。值里需要真正的 `"` 字符时，可以用多行语法：

```
ExamplePetBuff: {
	DisplayName: "{$Mods.ExampleMod.Common.PaperAirplane}"
	Description: '''"Let this pet be an example to you!"'''
}
```

### tModLoader 扩展的 HJSON 语法

#### 颜色

`[c/color:text]` 可以显示带颜色的文字，其中 `color` 是十六进制颜色码。

例子：

```
Yes: "[c/008000:yes]"
No: "[c/FF0000:no]"
```

显示出来时，'yes' 是绿色，'no' 是红色。

#### 物品图标

`[i:ItemID]` 和 `[i:ItemClassName]` 可以在消息里显示物品。`ItemID` 就是物品的 `type`；模组物品没有固定的 `type`，所以改用 `[i:ModName/ItemName]`，其中 `ModName` 是模组类名，`ItemName` 是物品类名。

`[i/pPrefixID:ItemID]` 可以显示带修饰语的物品，`PrefixID` 是修饰语的 `type`。

`[i/sStack:ItemID]` 可以显示指定堆叠数量的物品，`Stack` 就是堆叠数。

例子：

```
Label: "[i:ImproveGame/StarburstWand] tIMBALoader"
Tooltip: "[i/p57:HiveBackpack] is a funky accessory while [i/s1145:2] is just dirt"
```

这个例子里，`Label` 会显示成"(星怒法杖的图标) tIMBALoader"，`StarburstWand` 是 Quality of Life 模组里的物品；`Tooltip` 里则会显示一个"无情 蜂巢背包"和一个堆叠数为 1145 的土块。

#### 按键提示

`<KeybindName>` 可以显示按键的本地化名称，目前只支持左键 `<left>` 和右键 `<right>`，`KeybindName` 就是按键绑定的名字。

例子：

```
Tip: "<right> to use it's special attack"
```

其中的 `<right>` 会显示成"右键"在当前语言下的说法。

## 注释

`.hjson` 支持多种注释风格，tModLoader 用它们表达两类不同的含义。

行首用 `#` 的是真正的注释，供作者自己记事用。这种注释要紧挨着它说明的那个键写在上方 —— 放错位置的话，tModLoader 自动更新本地化文件时会把注释弄丢或者挪错地方。

例子：

```
ExampleCanStackItem: {
	DisplayName: Example CanStack Item: Gift Bag
	# References a language key that says "Right Click To Open" in the language of the game
	Tooltip: "{$CommonItemTooltip.RightClickToOpen}"
}
```

`#` 注释也会从英语文件复制到非英语文件里，正好可以提示翻译者某个自定义翻译键是在哪儿用的。

用 `/* */` 或 `//` 的注释则是 tModLoader 的标记，表示某个非英语键还没翻译，方便作者看出哪些语言还有缺口。翻译者把值翻好之后，把注释符号去掉即可。作者自己不要拿这种注释写普通注释 —— 游戏自动更新 `.hjson` 时它们会被丢掉。

## 本地化文件的文件名

模组里所有 `.hjson` 文件都会被当成本地化文件尝试加载，因此放哪个目录都行。不过按惯例，推荐放在模组源码根目录下名为 "Localization" 的文件夹里。模组生成器也遵循这个惯例，会生成 `Localization/en-US.hjson` 作为起点。

文件名开头，或者所在文件夹的名字里，必须包含有效的语言代码，用来判断这个文件属于哪种语言。

### 语言代码（Culture）

支持的语言（也叫 culture）有：英语（"en-US"）、德语（"de-DE"）、意大利语（"it-IT"）、法语（"fr-FR"）、西班牙语（"es-ES"）、俄语（"ru-RU"）、中文（"zh-Hans"）、葡萄牙语（"pt-BR"）、波兰语（"pl-PL"）。这些代码标明 `.hjson` 文件对应哪种语言。想开始支持一门新语言，见[添加一门新语言](https://github.com/tModLoader/tModLoader/wiki/Localization#adding-a-new-language)。

### 前缀（Prefix）

`.hjson` 文件名的前缀表示文件里所有条目共享一段公共前缀。最常见的用法是把 `Mods` 和 `ModNameHere` 这两层省掉，文件缩进更浅，有些人写起来更顺手。绝大多数模组确实用不到自己模组前缀之外的翻译值。

比如文件叫 `Localization/en-US_Mods.ExampleMod.hjson`，它就继承了 `Mods.ExampleMod` 前缀，文件内容可以直接从 `Items` 这一层开始写。

匹配规则是：文件路径先按文件夹切分，再按下划线切分，找到语言代码之后，紧接着的那一段就是前缀。下面这些写法都表示"这是英语文件，并且使用 `Mods.ExampleMod` 前缀"：

```
Localization/en-US_Mods.ExampleMod.hjson
Localization/en-US/Mods.ExampleMod.hjson
en-US_Mods.ExampleMod.hjson
en-US/Mods.ExampleMod.hjson
Localization/CoolBoss/en-US_Mods.ExampleMod.hjson
```

### 不是本地化文件的 .hjson

文件名里不带语言代码的 `.hjson` 不会被当成本地化文件，你可以把它当普通"数据"文件用，用途随意。如果文件名里带语言代码、但跟英语模板文件名对不上，它会被改名成 `{filename}.legacy`，其中的本地化条目也不会被加载。遇到这种改名，就该检查英语模板文件是否需要更新，或者把这些条目迁移到已有的本地化文件里。这是刻意设计的，为的是让所有本地化文件的布局和文件名保持一致。

## 拆成多个文件

可以用多个 `.hjson` 文件来组织翻译。比如模组里同时有 `en-US_Mods.ExampleMod.Items.hjson` 和 `en-US_Mods.ExampleMod.hjson`，前者可以专门放所有物品的翻译，后者放剩下的。新内容会自动落到已有条目跟它翻译键最接近的那个 `.hjson` 文件里。

拆了文件之后，你只需要编辑英语文件，然后构建并重载模组，其它语言的文件会自动调整成同样的布局。

# 添加自定义翻译键

新内容的条目会自动填进 `.hjson`，除此之外也可以手动往文件里加自定义翻译键。

**注意：** 自定义键里同样不要出现空格和其它特殊字符。

## 手动添加键

对大多数自定义键来说，手动添加并不是推荐做法 —— 容易写错，也没法充分利用本地化系统的能力。常规做法见[添加可本地化的属性](https://github.com/tModLoader/tModLoader/wiki/Localization#adding-localizable-properties)。当然，某些场合下手动加键还是有用的。

手动加键就是照着 `.hjson` 语法直接写条目。比如 ExampleMod 里有个 "Common" 分类，里面的条目全是手动加的，因为它们不被 tModLoader 的类直接使用。

假设起始文件是这样：

```
Mods: {
	ExampleMod: {
    		Common: {
			PaperAirplane: Paper Airplane
		}
        
		Currencies.ExampleCustomCurrency: example currency
   	 }
}
```

照着 `PaperAirplane` 的样子加一行，就能添一个 `Mods.ExampleMod.Common.NewKey` 键；照着 `Common` 分类的写法，可以新建一个 `Uncommon` 分类；照着 `Currencies.ExampleCustomCurrency` 的样子，可以写只占一行的条目。三种写法合起来是这样：

```
Mods: {
	ExampleMod: {
    		Common: {
			PaperAirplane: Paper Airplane
        		HotDog: Hot dog
		}
        
 		Uncommon: {
            		Helicopter: Example Helicopter
       		}
        
		Currencies.ExampleCustomCurrency: example currency
        	Currencies.DirtCurrency: piles of dirt
    	}
}
```

要注意：本地化文件自动更新时，怎么组织和排版由 tModLoader 决定，条目可能会被挪位置，但数据不会丢。

## 添加可本地化的属性

你可以给类加上 `LocalizedText` 属性，用法很多。写对了的话，这些属性会自动填进 `.hjson` 文件，直接就能开始翻译。

[ExampleHealingPotion.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Items/Consumables/ExampleHealingPotion.cs) 就是一个例子：`ExampleHealingPotion` 用了一个叫 `RestoreLifeText` 的 `LocalizedText` 属性，放在动态提示里。

基本步骤就三步：

1. 在类里加一个 static 的 `LocalizedText` 属性
2. 在 `SetStaticDefaults` 里用 `this.GetLocalization` 方法给它赋值
3. 需要的时候通过这个属性取本地化文本

例如：

```cs
public class ExampleHealingPotion : ModItem
{
	// Step 1: Make a static LocalizedText property
	public static LocalizedText RestoreLifeText { get; private set; }

	public override void SetStaticDefaults() {
		// Step 2: Assign RestoreLifeText to the result of GetLocalization
		RestoreLifeText = this.GetLocalization(nameof(RestoreLifeText));
	}

	public override void ModifyTooltips(List<TooltipLine> tooltips) {
		TooltipLine line = tooltips.FirstOrDefault(x => x.Mod == "Terraria" && x.Name == "HealLife");

		if (line != null) {
			// Change the text to 'Heals max/2 (max/4 when quick healing) life'
			// Step 3: Retrieve the localized text. This example uses the Format method because it has placeholders to populate, but the Value property could be used otherwise
			line.Text = Language.GetTextValue("CommonItemTooltip.RestoresLife", RestoreLifeText.Format(Main.LocalPlayer.statLifeMax2 / 2, Main.LocalPlayer.statLifeMax2 / 4));
		}
	}
}

```

上面这个例子里，`.hjson` 会自动多出一条 `RestoreLifeText` 条目，跟原有的 `DisplayName`、`Tooltip` 并列，作者随后把它填成了英文文本：

```
ExampleHealingPotion: {
	DisplayName: Example Healing Potion
	Tooltip: ""
	RestoreLifeText: "{0} ({1} when quick healing)"
}
```

**注意**

`LocalizedText` 实例应该静态保存，最好在加载期间注册并获取一次。上面 `ExampleHealingPotion` 的例子在 `SetStaticDefaults` 里完成注册，并把取到的 `LocalizedText` 缓存进 `RestoreLifeText` 属性。嫌缓存麻烦的话，每次用的时候现取也行，只是有一点性能开销。另外记住：想让翻译自动填进 `.hjson`，这个属性必须在加载期间至少被访问一次。

### 从本地化属性里取文本

在类里，可以直接用 `LocalizedText` 属性给玩家显示本地化文本：

```cs
Main.NewText(SomeLocalizedTextProperty.Value);
```

文本里带占位符时，用 `Format` 方法填值，有几个占位符就传几个参数：

```cs
Main.NewText(SomeLocalizedTextPropertyWithPlaceholders.Format(Main.LocalPlayer.statLifeMax2, Main.LocalPlayer.statManaMax2));
```

### 可继承的本地化属性

用继承的时候，不一定要用 static 属性 —— 在基类里写一个只读（get-only）属性，或者在子类里写一个非 static 属性，效果一样。继承本身让逻辑和翻译都能复用，代码和 `.hjson` 文件都能保持干净，不用反复抄。

设想模组里有若干物品共用一个基类：可以在基类上加一个属性来保存每个子类各自的 `LocalizedText`。注意这个属性必须在 `SetStaticDefaults` 期间被访问过，它才会自动出现在 `.hjson` 文件里。

**基类：MyBaseClass**
```cs
public LocalizedText SpecialMessage => this.GetLocalization(nameof(SpecialMessage));

public override void SetStaticDefaults() {
	_ = SpecialMessage;
}
```

如果 `ClassA` 和 `ClassB` 都继承自 `MyBaseClass`，`.hjson` 里就会自动补上 `SpecialMessage` 的占位条目：

```
ClassA: {
	DisplayName: Class A 
	Tooltip: ""
	SpecialMessage: Mods.ExampleMod.Items.ClassA.SpecialMessage
}

ClassB: {
	DisplayName: Class B
	Tooltip: ""
	SpecialMessage: Mods.ExampleMod.Items.ClassB.SpecialMessage
}
```

如果 `ClassA` 或 `ClassB` 重写了 `SetStaticDefaults`，记得保留 `base.SetStaticDefaults()`，否则基类那段代码不会执行。

`GetLocalization` 生成的键形如 `Mods.{ModName}.{LocalizationCategory}.{ContentName}.{suffix}`。如果需要的键不在这个规律里，可以改用 `Language.GetOrRegister("Mods.ModName.Full.Key.Here");` 或者 `Mod.GetLocalization("Full.Key.Here");`（后者是个快捷方式，会自动在键前面补上 "Mods.ModName."；它比本文其它地方用的 `ILocalizedModType.GetLocalization` 更通用，因为不会带上 `{LocalizationCategory}.{ContentName}.` 那两段）。另外注意，由于 C# 的设计，调用 `GetLocalization` 时必须带 `this.` 前缀，不能省。反过来，如果在继承来的属性里写完整的键，共享的翻译就能只存在于一个公共键里；需要自己那份翻译的子类，重写该属性、用自己的键调 `this.GetLocalization` 即可。

### 另一个例子

[ExampleChest.cs](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/Tiles/Furniture/ExampleChest.cs) 演示了怎么用自定义键。默认情况下，tModLoader 会为每个 `ModTile` 注册一个形如 `Mods.{ModName}.Tiles.{ContentName}.MapEntry` 的翻译键，方便给物块加地图条目（地图条目决定了全屏地图上鼠标悬停到该物块时显示的文字）。但 `ExampleChest` 需要两条地图条目，这时用 `GetLocalization` 就能轻松往本地化文件里加新键：

```cs
AddMapEntry(new Color(200, 200, 200), this.GetLocalization("MapEntry0"), MapChestName);
AddMapEntry(new Color(0, 141, 63), this.GetLocalization("MapEntry1"), MapChestName);
```

这段代码的结果是本地化文件里多出这两个键，等着被翻译成其它语言：

```
ExampleChest: {
	MapEntry0: Example Chest
	MapEntry1: Locked Example Chest
}
```

在 ExampleChest.cs 的其它位置，这些键是用 `GetLocalization` 动态取出来的：

```cs
public override LocalizedText DefaultContainerName(int frameX, int frameY) {
	int option = frameX / 36;
	return this.GetLocalization("MapEntry" + option);
}
```

键是动态生成的时候，这个套路很好用。

### ModType 与 ILocalizedModType

实现了自定义 `ModType` 的模组可以让它实现 `ILocalizedModType` 接口，本地化就省事多了：在类继承列表里加上 `, ILocalizedModType`，再实现 `LocalizationCategory` 属性，写成 `public string LocalizationCategory => "MyModTypeCategory";`。然后自定义 `ModType` 类里的每个 `LocalizedText` 都可以用 `public virtual LocalizedText DisplayName => this.GetLocalization(nameof(DisplayName), PrettyPrintName);` 这种写法，它们就能像其它现成的 `ModType` 类那样，在 `.hjson` 里被正确归类。

还要确保每个 `LocalizedText` 都在模组加载期间被访问过，它们才会自动填进 `.hjson`。要是你的逻辑里本来没访问，就在 `ModType.SetupContent` 方法里给类里每个 `LocalizedText` 补一句 `_ = DisplayName;`。

**深入一点：** `GetLocalization` 是个辅助方法，用来简化代码、避免打错字。它等价于拿完整键去调 `Language.GetOrRegister`；同理 `GetLocalizedValue` 等价于 `Language.GetTextValue`，`GetLocalizationKey` 则可以在需要时取出生成的那个键。

`GetLocalization` 和 `Language.GetOrRegister` 都有第二个可选参数 `makeDefaultValue`，用来指定"翻译不存在时用什么值兜底"的函数。比如传 `() => ""`，默认值就是空字符串，而不是键名本身。传 `PrettyPrintName` 则能实现常见的效果：拿内容的内部名，在大写字母之间插入空格。本地化是可选的、或者你有合适的默认值时，就该用这个参数。

### LocalizedText[]

用数组可以一次性存下许多相关的 `LocalizedText`。比如下面这段会把 "DrawMode_0" 到 "DrawMode_4" 的条目读进数组：

```cs
public static LocalizedText[] DrawModeText { get; private set; }

public override void SetStaticDefaults() {
	DrawModeText = Enumerable.Range(0, 5).Select(i => this.GetLocalization($"DrawMode_{i}")).ToArray();
}
```

另一个办法是用 `Language.FindAll` 把所有共享同一前缀的键都读出来，条目不是数字编号时很好用。不过它也会把别的模组提供的键一并读进来，最终数量不确定。[ExampleTownPet.SetNPCNameList](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Content/NPCs/TownPets/ExampleTownPet.cs#L136) 就是用这个办法加载一组有名字、没有编号的键：

```cs
LocalizedText[] Options = Language.FindAll(Lang.CreateDialogFilter(this.GetLocalizationKey("Options.")));
```

另外，翻原版代码时你会看到 `Language.RandomFromCategory` 方法，它从共享同一"分类"/前缀的所有条目里随机取一个 `LocalizedText` 返回。这个方法不适合模组使用，想达到同样效果，应该用 `Lang.CreateDialogFilter` 配合 `Language.SelectRandom`：

```cs
LocalizedText randomOption = Language.SelectRandom(Lang.CreateDialogFilter(this.GetLocalizationKey("Options.")));
```

# 添加一门新语言

默认情况下，tModLoader 只会在已经出现在 `.hjson` 里的语言上生成和更新本地化文件。想加一门新语言，就建一个文本文件，命名方式跟现有本地化文件一样 —— 建一个就够了。文件路径或所在文件夹里要带上语言代码：英语（"en-US"）、德语（"de-DE"）、意大利语（"it-IT"）、法语（"fr-FR"）、西班牙语（"es-ES"）、俄语（"ru-RU"）、中文（"zh-Hans"）、葡萄牙语（"pt-BR"）、波兰语（"pl-PL"）。文件建好、扩展名正确之后重新构建模组，它就会自动填上待翻译的条目；同时还会按英语 hjson 的组织结构生成其它文件。

英语以外所有本地化文件的注释和组织结构都继承自英语文件。想给翻译者署名，就统一写在英语文件顶部的注释里，它会传播到各非英语文件中去。

英语本地化文件可以随便整理，其它语言的文件会自动跟着调整。拆了文件的话，只需编辑英语文件，然后构建并重载模组，其它语言会自动对齐同样的布局；从英语文件里删掉的键，也会从其它语言文件里相应删掉。总之，作者通常只需要跟英语文件打交道，其余语言会自动跟上。

# 覆盖 Terraria 原有的键

原版 Terraria 的本地化值也是可以替换的，语法跟模组条目完全一样。但要注意，Terraria 的键没有 `Mods.ModNameHere` 前缀，所以这些本地化必须放进不带前缀的文件里，比如 `en-US.hjson`，而且得手动敲进去 —— 键也得自己查。[All Localizations.csv](https://forums.terraria.org/index.php?attachments/all-localizations-csv.391802/) 这个文件（来自[官方资源包指南](https://forums.terraria.org/index.php?threads/the-ultimate-guide-to-content-creation-and-use-for-the-terraria-workshop.100652/#languagepack)）列出了所有现成的本地化键。[ExampleMod/Localization/en-US.hjson](https://github.com/tModLoader/tModLoader/blob/stable/ExampleMod/Localization/en-US.hjson) 的文件最末尾就有一个例子，改写了 `UI.PlayerIsNotCreativeAndWorldIsCreative` 键的值。

多个模组改同一个键时，最后加载的那个模组说了算。

# 常见问题

## 为什么我的翻译条目会消失？

多半是同一个本地化键出现在了多个文件里。游戏更新本地化文件时会去掉重复条目，每个键在每种语言里只留在一个文件中。很多作者没注意到模组模板本身就自带一个 `Localization` 文件夹（里面有 `en-US_Mods.ModName.hjson`），于是在项目里另起了一个 `.hjson` 文件，键就重复了。解决办法很简单：两份文件只留一份，另一份删掉。

另一种可能：你往非英语文件里加了自定义键，却没同步加到英语文件里。tModLoader 加载模组时会以英语条目为模板更新所有本地化文件，英语文件里没有的键会在更新时被删掉。所以自定义条目务必保证在英语文件里存在。

## 为什么我的本地化文件被改名成 `filename.hjson.legacy`？

被 tModLoader 改名成 `hjson.legacy`，说明它检测到这个文件里一条条目都没有。原因可能跟上面"翻译条目消失"的情况类似。
