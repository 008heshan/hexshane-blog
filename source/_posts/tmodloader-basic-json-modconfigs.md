---
title: Basic ModConfig Guide
date: 2026-08-30 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic ModConfig Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-JSON-%26-ModConfigs)。

# 简介

动手之前先弄清两件事：config 到底指什么，`ModConfig` 又是怎么被处理的。config 是 configuration（配置）的缩写，多数时候说的就是「配置文件」；配置文件的格式五花八门，而 tModLoader 给 `ModConfig` 挑的是 JSON。

# JSON 是什么

JSON 的全称是 JavaScript Object Notation（JavaScript 对象表示法）。它是一种按规定格式存数据的语言，也常被拿来做数据交换。跟 XML（`.xml`）、YAML（`.yml`）这些格式相比，JSON 的功能不算多，但胜在轻量、灵活，而且不限定结构 —— 只要语法过关，你想怎么嵌套就怎么嵌套。JSON 出身于 JavaScript，如今各种语言都能解析它；说到底，JSON 本身不过就是 JavaScript 对象。它是官方注册的互联网媒体类型 `application/json`，文件扩展名用 `.json`。

# JSON 的结构

JSON 里装的东西只有两样：由「属性-值」对（attribute-value pair）拼成的数据对象，以及数组。如果你知道 [JavaScript 对象](https://www.w3schools.com/js/js_objects.asp)是怎么构造的，那 JSON 文件对你来说毫无门槛。直接看例子，下面这段 JSON 把它的基本数据类型都摆了一遍：

```json
{
	"key:": "value",
	"number": 420.7335,
	"string": "this is a string!",
	"boolean": true,
	
	"array": [
		10.20,
		"an array can hold many data types",
		false, 
		[
			"even arrays inside arrays!",
			42
		]
	],
	
	"object": {
		"name": "another object",
		"description": "we can also make objects within objects, the sky is the limit",
		"remarks": "note the JSON notation: key: value",
		"anotherObject": {
			"array": [
				"arrays inside an object inside an object? this is madness!",
				null
			]
		}
	},
	
	"arrayWithObjects": [
		{
			"name": "01001000 01100101 01101100",
			"description": "01101100 01101111" 
		},
		{
			"name": "01110111 01101111 01110010",
			"description": "01101100 01100100 00100001"
		}
	]
}
```

看到了吧，想怎么套都行。JSON 能存的基本类型就是这些：字符串、数字、布尔值、数组，还有空值 `null`。上面的例子把它们全用了一遍，顺带演示了各种组合方式。

## 注意事项

回头再看一眼那段例子。JSON 最核心的东西是「键值对」（key-value，也叫 name-value）：一个键对应一个值，写法就是 `"key": value`。

和 C# 这种要过编译器的语言不同，JSON 不要求你声明数据类型，解析时会自动判断。另一条容易栽跟头的是分隔符：元素之间要用逗号隔开，唯独最后一个元素不用 —— 你给它留个逗号也不算错，但没必要。

想把语法练熟，可以拿 [JSONLint](https://jsonlint.com/) 这个校验器折腾几下。JSON 合法它就放行；不合法，它会告诉你错在哪儿、又为什么错。

# 模组作者怎么在 Terraria 模组里用 JSON

写 tModLoader 模组时，你其实不用直接碰 JSON。要做的是写一个 `ModConfig` 类 —— 它负责声明模组的配置项，存储这件事交给 JSON 去办；具体写法参考 `ExampleConfig.cs`。

想看看自己装的模组到底存了什么配置，可以打开 `\Terraria\ModLoader\Mod Configs` 目录（Windows 上是 `%userprofile%\Documents\My Games\Terraria\ModLoader\Mod Configs`），里面的文件按 `<ModName>_<ConfigName>.json` 命名。有个细节值得留意：这类文件只记录与默认值不同的项，所以打开来可能只是一个内容为 `{}` 的空文件。平时没什么必要直接读它，不过偶尔翻翻也能看出点门道。
