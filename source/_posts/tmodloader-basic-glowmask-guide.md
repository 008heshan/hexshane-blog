---
title: Basic glowmask guide
date: 2026-09-04 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic glowmask guide](https://github.com/tModLoader/tModLoader/wiki/Basic-glowmask-guide)。

glowmask（发光遮罩）是额外的一张贴图，它只干一件事：盖在原贴图上面再画一遍，而且完全不受光照影响，于是该亮的地方就真的亮起来了。下面说清它是什么、能用在哪些地方、代码里又该怎么写。

# 什么是"遮罩"，Terraria 里怎么用？

先弄明白 mask（遮罩）本身。绘画里说遮罩，通常是"把某块区域保护起来，制作过程中不去动它"；Terraria 的思路相近，手法不太一样。给贴图套 glowmask 时，我们并不去改原贴图上的任何像素，而是另外准备一张单独的贴图（sprite），里面只放需要遮罩的那些像素。绘制时把它盖在原图上方，并且不让它的颜色受光照影响，看上去就是发光。

# Terraria 的 glowmask 长什么样？

原贴图和它的 glowmask 摆在一起，差别一眼可见：glowmask 里只保留要遮罩的像素，其余像素全部清空。既然它的职责是画"不受光照影响"的部分，那么留在图里的，多半就是现实中会反光、或者本身就发光的部位。

# glowmask 能用在哪些地方？

基本上什么都能用 —— `NPC`、弹幕（projectile）、物品（item），甚至玩家身上穿的盔甲。不过穿在身上、拿在手里的东西（盔甲与手持武器）走的是 `PlayerLayers` 那一套绘制层，属于进阶内容，基础篇不涉及。

# 怎么给贴图"套上" glowmask？

原版游戏确实自带一套 glowmask 机制，可模组内容**用不了**它 —— 那套机制不认识模组添加的贴图。另外"套上"这个说法也别太当真：glowmask 并不会真的并进原贴图，实际做法是把它当作独立的图，在原图之后单独画一遍。

## 怎么把 glowmask 画出来？

要让它盖在原图上面，就用带 `Post` 前缀的绘制钩子（`PostDraw` 系列），这些方法本就在原图绘制完之后执行，顺序自然正确。你也可以改成重写带 `Pre` 前缀的绘制钩子，完全手动接管绘制流程，只是手工活更多，除非有别的理由，不建议这么做。命名上有个常见约定：贴图文件名加 `_Glow` 或 `_Glowmask` 后缀。下面这个例子用 `PostDrawInWorld`，给掉在地上的物品画 glowmask：

```csharp
public override void PostDrawInWorld(SpriteBatch spriteBatch, Color lightColor, Color alphaColor, float rotation, float  scale, int whoAmI) 	
{
	Texture2D texture = ModContent.Request<Texture2D>("YourModName/Items/MyItem_Glowmask", AssetRequestMode.ImmediateLoad).Value;
	spriteBatch.Draw
	(
		texture,
		new Vector2
		(
			item.position.X - Main.screenPosition.X + item.width * 0.5f,
			item.position.Y - Main.screenPosition.Y + item.height - texture.Height * 0.5f + 2f
		),
		new Rectangle(0, 0, texture.Width, texture.Height),
		Color.White,
		rotation,
		texture.Size() * 0.5f,
		scale, 
		SpriteEffects.None, 
		0f
	);
}
```

这段代码只作示范，不必照抄。真正要记住的其实就几条：

- 画的是 glowmask 贴图，不是原贴图
- 颜色用 `Color.White`，至少也得是完全不透明的颜色
  - 想要不透明，就把 alpha 通道往 255 推（反过来往 0 推就是透明）。注意 XNA 的 `Color` 四个 RGBA 通道取的都是 *byte*，取值范围是 0–255
- 需要的话，把绘制原点设成中心点
  - 中心原点可以用 `texture.Size() * 0.5f` 取到
- 原贴图和 glowmask 贴图的尺寸必须一致
- 用 `ModContent.Request` 请求到的 `Texture2D` 最好缓存下来：提前请求好、存进变量，后面直接复用这个变量
