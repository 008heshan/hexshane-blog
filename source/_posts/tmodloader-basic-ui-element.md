---
title: Basic UI Element Guide
date: 2026-08-17 20:00:00
tags:
  - tModLoader
  - Terraria
categories:
  - Terraria 模组开发
---

> 本文内容整理自 tModLoader 官方 Wiki（Terraria 模组开发指南），原文：[Basic UI Element Guide](https://github.com/tModLoader/tModLoader/wiki/Basic-UI-Element)。

在屏幕上画一个普通的 UI 元素（这里拿按钮举例），最少需要三个类：`UIElement` 是按钮本身，`UIState` 是承载它的画布，最后还要有一个从 `ModSystem` 继承的类，负责在游戏渲染界面的时候把画布画出来。三个类各管一段，少一段都看不到东西。

# 用途

这篇讲的是在屏幕上画出一个最简单 UI 元素的最低要求。哪怕只是一个按钮，也要分好几步走；把这套流程理顺了，之后搭更复杂的界面才不会卡住。

# 整体流程

下图画出了整个过程用到的类，以及它们之间的先后关系。注意：直到最后一步，UI 元素才真正被画到屏幕上。

![UI 元素的三个类与绘制流程：按钮类 UIElement 放到画布 UIState 上，再由模组 ModSystem 启用并绘制](/img/posts/tmodloader-basic-ui-element/80857675-c28f0000-8c08-11ea-95df-39712a2159c3.png)

# 制作按钮

做按钮本身没什么花头：新建一个类，继承原版代码里的 `UIElement`。

```cs
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using Terraria.UI;
using Terraria;
using Terraria.ModLoader;

namespace YourMod.UI
{
    class PlayButton : UIElement
    {
        Color color = new Color(50, 255, 153);

        public override void Draw(SpriteBatch spriteBatch)
        {
            spriteBatch.Draw((Texture2D)ModContent.Request<Texture2D>("Terraria/Images/UI/ButtonPlay"), new Vector2(Main.screenWidth + 20, Main.screenHeight -20) / 2f, color);
        }   
    }
}
```

几点说明：

- 类名就按元素本身的用途起，这里是一个显示播放符号的按钮。
- `spriteBatch.Draw` 里用的贴图是原版资源 —— 播放按钮的那张图本身。
- 传给 `spriteBatch.Draw` 的 `Vector2` 参数用的是玩家能看到的**屏幕**坐标，不是**世界**坐标。这里让 UI 元素出现在屏幕正中、再偏一点的位置，免得正好压在玩家身上。

# 把按钮放进 UIState（画布）

这块的正式叫法是 `UIState`。不过把它理解成"画家作画的那张画布"会更好上手 —— 只要你想，往上面扔几百个按钮都行。真这么干的话，得让按钮的构造函数能接收自定义的起始坐标，否则这几百个按钮会全部叠在同一个位置。

姑且把这个画布叫做菜单栏，虽说眼下它只会装一个按钮。

```cs
using Terraria.UI;

namespace YourMod.UI
{
    class MenuBar : UIState
    {
        public PlayButton playButton;

        public override void OnInitialize()
        {
            playButton = new PlayButton();

            Append(playButton);
        }
    }
}
```

注意两点：

- 这里只实例化了一个按钮，坐标用的就是 `PlayButton` 类里的默认值（画在屏幕中央）。
- 必须用 `Append()` 把 `playButton` 挂到 `UIState` 上，后面绘制的时候它才会显示出来。

# 把 UIState（画布）画到屏幕上

有意思的部分来了。现在按钮已经躺在 `MenuBar` 这个画布上了，接下来把它"复制"一份交给 `UserInterface`，再叫游戏去画。可以这么理解：`MenuBar` 那块画布是原件，`UserInterface` 是复印件；或者说 `MenuBar` 是印章，`UserInterface` 是盖出来的墨迹。

下面这些代码要写在继承了 `ModSystem` 的类里。

首先要给这个 `ModSystem` 类加上 `[Autoload(Side = ModSide.Client)]` 标注，这样模组在服务器上加载时才不会报错。目的是确保 UI 代码不在服务端执行 —— 服务端加载不了贴图、字体这些图形资源，跑 UI 代码必然出错。

```cs
namespace YourMod.UI
{
	[Autoload(Side = ModSide.Client)]
	public class MenuBarSystem : ModSystem
	{
```

接着声明一个 `UIState` 类型的变量，也就是上面那个装着单个按钮的 `MenuBar`。

```cs
internal MenuBar MenuBar;
```

再声明一个 `UserInterface` 类型的变量，待会儿用它来接住 `MenuBar`。这个类不用自己写，也不用继承。

```cs
private UserInterface _menuBar;
```

然后在 `Load()` 里把这两个变量赋上实际实例，并把 `MenuBar` 交给 `UserInterface`。如果在模组加载时忘了调 `Activate()`，游戏一启动就会崩，报 _Object reference not set to an instance of an object_。

```cs
public override void Load()
{
    MenuBar = new MenuBar();
    MenuBar.Activate();
    _menuBar = new UserInterface();
    _menuBar.SetState(MenuBar);
}
```

下一段我没完全搞懂，但推测是必须的，所以照写。

```cs
public override void UpdateUI(GameTime gameTime)
{
    _menuBar?.Update(gameTime);
}
```

最后这段最麻烦。据说这些代码一个都不能少，我也没法给你讲清它内部是怎么运作的。简单说，`UserInterface` 拿到需要的一切之后，真正的绘制就发生在这里。要是漏了这段，整个 UI 都会消失。

```cs
public override void ModifyInterfaceLayers(List<GameInterfaceLayer> layers)
{
    int mouseTextIndex = layers.FindIndex(layer => layer.Name.Equals("Vanilla: Mouse Text"));
    if (mouseTextIndex != -1)
    {
        layers.Insert(mouseTextIndex, new LegacyGameInterfaceLayer(
            "YourMod: A Description",
            delegate
            {
                _menuBar.Draw(Main.spriteBatch, new GameTime());
                return true;
            },
            InterfaceScaleType.UI)
        );
    }
}
```

# 结果

走到这里，屏幕上应该出现这样一个按钮了。看得出来它还称不上什么菜单栏……没关系，以后往上面加更多 `UIElement`、把它们排布开就行。

![运行效果：屏幕中央出现一个原版播放按钮贴图的绿色按钮](/img/posts/tmodloader-basic-ui-element/80858632-6380b980-8c0f-11ea-950e-c4740ef506c1.png)

说实话这玩意儿算不上多惊艳，但你已经可以顺着这个思路往下做，想要什么元素就加什么元素。

想快速摸清 `UIElement` 都能干什么，可以新建一个类继承它、先不写任何东西，然后在类的大括号里右键 → 快速操作 → 自动生成重写。这样就能看到有哪些方法可以重写 —— 你会发现 `Draw()` 就在列表里。既然 `Draw()` 看起来是在画 `SpriteBatch`，那就继续右键 `SpriteBatch` 看它的定义，能挖出更多想法。仔细看会发现，在我们的 `UIElement` 代码里调 `Draw()` 的写法其实有好几种。

# 中等难度的例子

如果你还想要更多手把手的示例，去看 Example Mod 里的 `ExampleCoinUI`，研究他们是怎么实现那些 UI 元素的，代码在[这里](https://github.com/tModLoader/tModLoader/tree/stable/ExampleMod/Common/UI/ExampleCoinsUI)。对照上面讲的三个类去看，应该能看明白。你会发现他们没用 `UIElement`，而是换成了别的类来实现特定的 UI 部件（`UIPanel` 和 `UIImageButton`）。

感谢 Scalie 和 absoluteAquarian 帮我理清这些东西。
