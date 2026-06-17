# Dodge Blocks Example

`dodge-blocks` 是 `leaferGame` 当前的集成示例。

它不是一个要单独打磨成品的小游戏，而是用来验证引擎分层是否真正可用：

- browser runtime 是否能启动场景
- scene 是否能装配 systems
- entity factory 是否能创建可复用实体
- asset manifest 是否能声明示例资源
- scene config 是否能声明静态示例内容
- scene config 是否能声明并 bootstrap level/map runtime data
- async manifest loading 是否能在玩法启动前完成资源预加载
- browser image sprite loader 是否能作为示例消费者接入
- sprite frame / animation clip 是否能作为 manifest 数据接入
- `SpriteAnimationComponent` / `SpriteAnimationSystem` 是否能作为示例消费者接入
- entity template 是否能创建玩家基础数据组件
- safe scene bootstrap 是否能在创建玩家前验证静态配置
- level layout 是否能声明 player spawn、playfield bounds 和 hazard spawn region
- tile map 是否能作为最小运行时数据契约被示例消费
- transform / size / view 是否能同步到渲染层
- input 是否能驱动玩家移动
- input action mapping 是否能把物理键盘和 pointer button input 转换成语义玩法动作
- collision 是否能判断玩家和障碍物接触
- `GameFlow` 是否能管理 ready / running / paused / ended
- 玩家是否能被限制在当前 viewport 内移动
- tooling panel 是否能分区显示 runtime debug + assets + game flow + entity inspector + component schema 数据
- Runtime Debug panel 是否能显示 time、viewport、entity counts、system order 和 system lifecycle 只读状态
- tooling panel 是否能显示 sprite animation runtime 状态
- tooling panel 是否能显示 input action mappings 和当前 action state
- tooling panel 是否能点击 entity 行并显示选中状态
- tooling panel 是否能显示 selected entity detail 摘要
- tooling panel 是否能用 component schema 辅助展示 selected component 字段

它也不是编辑器或可视化搭建工具的雏形。这个示例只作为引擎包消费者存在，用来证明 runtime、framework、asset pipeline、sprite animation、tooling snapshot 和 scene lifecycle API 能在一个真实浏览器示例里协同工作。

## How To Run

在仓库根目录执行：

```bash
npm install
npm run dev
```

打开 Vite 输出的本地地址后，页面会启动这个示例。

## Controls

示例玩法代码读取的是语义动作，而不是直接读取物理键：

- `move:left`：`A` 或方向左键
- `move:right`：`D` 或方向右键
- `move:up`：`W` 或方向上键
- `move:down`：`S` 或方向下键
- `confirm`：`Space`、`Enter` 或 primary pointer button
- `pause`：`P` 或 `Esc`

## File Map

- `main.ts`
  - 创建 browser runtime
  - 调用 `bootDodgeBlocksExample(...)`

- `boot.ts`
  - 启动 `DodgeBlocksScene`
  - 通过 `startSceneWithLifecycle(...)` 在 runtime start 前预加载 asset manifest
  - 挂载 keyboard bridge 和 pointer button bridge
  - 挂载 browser tooling panel
  - 分区显示 runtime debug、assets、game flow、sprite animations、input actions、entity inspector 和 component schema 信息
  - Runtime Debug section 展示 time / viewport / entity counts / system order / lifecycle 等只读状态
  - 支持在 panel 中点击 entity 行进行选择
  - 选择 entity 后显示 selected entity detail section
  - selected detail 会结合 component schema metadata 展示字段类型、默认值和当前值
  - 在 scene destroy 时清理输入和 panel

- `dodge-blocks-scene.ts`
  - 注册 input、collision、gameplay system
  - 创建并注入 dodge-blocks input action map
  - 创建 UI 文本节点
  - 通过 `createDodgeBlocksSceneConfig(...)` 声明静态示例内容
  - 通过 scene config 的 assets section 声明 sprite assets、sprite frames 和 animation clips
  - 通过 scene config 的 `level.tileMap` 和 `level.layout` 声明最小 map 数据、player spawn、playfield bounds 和 hazard spawn region
  - 通过 `loadManifestAsync(...)` 和 browser image sprite loader 预加载 scene config 里的示例资源
  - 通过 `bootstrapSceneFromConfig(..., { validateBeforeBootstrap: true })` 创建 player 的 transform / size / collider，并读取 bootstrapped level helpers
  - 在代码里补充 player controller、render view 和 sprite animation component

- `dodge-game-system.ts`
  - 通过 framework `GameFlow` 管理玩法状态
  - 通过 input action map 读取 `confirm` 和 `pause`
  - 生成障碍物
  - 维护 score / best score
  - 检测碰撞并切换 ended

- `factories.ts`
  - 定义 hazard 的实体工厂
  - 保留运行时随机障碍物生成逻辑

- `player-controller.ts`
  - 读取 `InputSystem` 和 input action map
  - 更新玩家位置
  - 把玩家限制在 scene config level layout 声明的 playfield 内

- `input-actions.ts`
  - 定义示例级语义动作
  - 把 `WASD`、方向键、`Space`、`Enter`、primary pointer button、`P` 和 `Esc` 映射到 gameplay actions

- `styles.css`
  - 示例页面的基础外观

## Minimal Boot Shape

这个示例的启动形态可以简化理解成：

```ts
import { createBrowserRuntime } from "@shuangxunian/leafer-game-engine";
import { bootDodgeBlocksExample } from "./boot.js";

const runtime = createBrowserRuntime({
  mount: "game-root"
});

bootDodgeBlocksExample(runtime).catch((error) => {
  console.error("Failed to boot dodge-blocks example:", error);
});
```

`bootDodgeBlocksExample(...)` 里会创建 scene，通过 scene lifecycle helper 预加载 assets 并启动 runtime、绑定键盘和 pointer button 输入，再把包含 asset state、game flow state、sprite animation state 和 schema metadata 的 tooling snapshot 以分区 panel 的形式显示到浏览器。

Runtime Debug panel 会消费 `runtime.game` 和 `runtime.renderScene`，因此可以显示时间步进、viewport、entity counts、system totals、system order 和 system lifecycle。这里的 tooling 仍然只是观察 runtime 状态，不提供系统开关、组件改值、场景编辑或资产管理入口。

示例代码使用 `@shuangxunian/leafer-game-engine` package-style imports 来模拟真实消费者项目；在本仓库开发时，这些导入会通过 Vite alias 和 TypeScript paths 指回 `src`。

## What This Example Proves

这个示例证明当前 `leaferGame` 已经不只是静态渲染封装，而是具备了一个轻量游戏 runtime 的基本闭环：

```text
browser runtime
  -> scene
  -> scene lifecycle
  -> systems
  -> entities/components
  -> game flow
  -> render adapter
  -> tooling panel
```

## Data-Driven Split

当前示例已经有一部分内容走数据驱动：

- `createDodgeBlocksSceneConfig(...)` 声明静态示例内容
- scene config 的 `assets` section 声明 player / hazard sprite assets，以及 player sprite frames / animation clip
- scene config 的 `level.tileMap` 声明最小 playfield tile map，用来证明 tile map runtime data 可以被示例 bootstrap 和读取
- scene config 的 `level.layout` 声明 `player-start` spawn、`playfield` region 和 `hazard-spawn` region
- 示例通过 `loadManifestAsync(...)` 在 gameplay 启动前加载 scene config 里的资源
- 示例通过 `startSceneWithLifecycle(...)` 复用 runtime 层的 prepare / ready / running / failed 启动边界
- tooling panel 的 `Assets` section 可以显示 player / hazard 的 loaded 状态
- tooling panel 的 `Runtime Debug` section 可以显示 time / viewport / entity counts / system order / lifecycle 只读摘要
- tooling panel 的 `Sprite Animations` section 可以显示 player 当前 clip / frame / sprite / playback 状态
- tooling panel 的 `Input Actions` section 可以显示 action id、keyboard bindings、pressed 和 justPressed
- player 的 `transform`、`size`、`collider` 来自 scene config entity template
- player 静态基础数据通过 `bootstrapSceneFromConfig(..., { validateBeforeBootstrap: true })` 创建
- player 初始位置和重置位置读取 scene config level layout 的 `player-start` spawn
- player movement bounds 读取 scene config level layout 的 `playfield` region
- player 的 `ViewComponent`、`PlayerControllerComponent` 和 `SpriteAnimationComponent` 仍在代码中装配
- player movement、start/restart 和 pause/resume 使用 `InputActionMap`，而不是在 gameplay 代码里硬编码物理键
- `confirm` 同时消费 keyboard 和 primary pointer button bindings，验证 browser pointer bridge 到 semantic action 的链路
- gameplay phase 使用 framework `GameFlow`，而不是示例内的本地 phase state machine
- tooling panel 的 `Game Flow` section 可以显示当前 ready / running / paused / ended 状态
- hazard 仍由 factory 生成，因为它依赖运行时随机尺寸、位置和速度，不适合放进静态 scene config；scene config 只声明 `hazard-spawn` region 作为运行时参考数据

这个示例不会把 level/map 声明变成编辑器、地图渲染器或自动生成器。它只是证明下游游戏可以显式读取引擎返回的 `TileMap` / `LevelLayout` helper，并由游戏代码决定如何使用这些运行时数据。

后续新增资源加载、数据驱动场景、关卡配置和 runtime tooling 能力时，这个示例可以继续作为集成验证样例。
