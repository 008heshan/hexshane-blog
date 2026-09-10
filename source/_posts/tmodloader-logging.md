---
title: Basic Logging Guide
date: 2026-09-01 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Introduction](https://github.com/tModLoader/tModLoader/wiki/Logging)。

tModLoader 会把各种有用的信息写进日志文件。玩家那边一旦出问题，翻日志就能找出是哪个模组在捣乱，然后把它禁用掉 —— 怎么读自己的日志，见[用户 FAQ 里「Reading client.log」那一节](https://github.com/tModLoader/tModLoader/wiki/Basic-tModLoader-Usage-FAQ#reading-clientlog)。

日志功能的底层是 [log4net](https://logging.apache.org/log4net/) 这个库，tModLoader 用它把写日志的能力开放给模组作者。对作者来说，用户发来的日志就是最好用的排错材料：靠它定位自己模组的 bug，也能看出它和谁不兼容。下面说说怎么把它用好。

# 功能

## 日志分文件记录

日志不是全塞在一个文件里，而是按来源分开，比如 `client.log` 和 `server.log`。联机时出的问题，日志落在服务端还是客户端，取决于出问题的那段代码跑在哪一边。要是目录里出现了 `client2.log` 或 `server2.log`，说明当时还同时跑着第二份客户端或服务端实例。

每条日志输出至少都带这几样通用信息：时间、日志等级（loglevel）和来源。

![记事本里打开的 client.log：时间、线程与日志等级、来源一目了然](/img/posts/tmodloader-logging/192859549-6cb6fce2-f0c2-4d9e-96f1-8540eea44483.png)

除了常规日志，还有几个专门用来排查特殊问题的日志：

- `environment.log`：环境变量的记录
- `Launch.log`：游戏真正启动之前发生的事件
- `Natives.log`：原生 dll 的问题和消息
- `terrariasteamclient.log`：负责 Terraria 游戏时长统计（playtime tracking）的那个进程的日志

## 归档

旧日志会压缩归档，留着以后回头查。它们放在 `Old` 子文件夹里，上一次游戏会话出的问题可以靠它来排查。

![Old 文件夹里按日期打包好的旧日志 zip](/img/posts/tmodloader-logging/192860671-fb01a278-2d68-43c0-afac-dcdb836001c6.png)

# 用法

`Mod` 类里自带一个 `Logger` 对象，用它就能以本模组的名义记日志。写进文件后，「来源」那一栏标的就是你的模组。

日志等级分这么几档：

- **INFO**：一般性的提示信息
- **WARN**：警告，比如出了岔子但还没造成严重后果
- **ERROR**：严重问题，比如模组失效、可能崩溃或系统功能异常
- **FATAL**：致命问题，到了应用已经没法继续做有效工作的地步
- **DEBUG**：额外的调试信息（verbose，啰嗦但对排错有用）

error 和 fatal 的界线不太好分，有个经验法则可以套：如果应用因为这个错误压根没法继续跑下去，那它就是 fatal。

```cs
Mod.Logger.Info("This is an informational log"); // at log-level INFO
Mod.Logger.InfoFormat("This is a formatted informational log from {0}", Mod.Name);

Mod.Logger.Warn("This is a warning"); // at log-level WARN
Mod.Logger.WarnFormat("This is a warning from {0}", Mod.Name);

Mod.Logger.Error("An error occurred"); // at log-level ERROR
Mod.Logger.ErrorFormat("An error occurred: {0}", e.StackTrace);

Mod.Logger.Fatal("Something fatal happened"); // at log-level FATAL
Mod.Logger.FatalFormat("Something fatal happened: {0}", e.StackTrace);

Mod.Logger.Debug("Some debug info"); // at log-level DEBUG
Mod.Logger.DebugFormat("Some debug info: ({0}, {1})", x, y);
```

上面这些写法都假定你是在某个继承自 `ModX` 的类里记日志，比如 `ModItem`、`ModSystem` 之类。如果就在 `Mod` 类里，直接写 `Logger.Info("Example Text");` 就行；如果是在别的类里，用 `ModContent.GetInstance<ModNameHere>().Logger.Info("Example Text");` 就能拿到你 `Mod` 类的 `Logger`。

# 该记些什么？

这事儿不好拿捏。总的原则是别让一堆没用的条目把日志文件撑爆。写之前先问自己一句：这条记录记下来，有什么用？日志要有用，就得有明确的目的，通常就是发现问题 —— 或者反过来，确认没有问题。理想情况下只记和这个目的相关的条目。举个例：模组里某个系统成功完成了某项任务（比如初始化），那就输出一条 info；万一失败了，就记成 warn 或 error。这样以后翻日志时，一眼就能看出这个系统当初初始化有没有出岔子。

## 做成可选项

有些日志只在少数情况下有用，对大多数玩家来说纯属刷屏，这种情况可以用 `ModConfig` 选项让玩家自己决定要不要记。[BossChecklist](https://github.com/JavidPack/BossChecklist/search?q=ModCallLogVerbose) 就是这么处理的：只对模组作者有用的日志被做成一个能打开的开关，普通玩家的日志文件就不会被塞满。
