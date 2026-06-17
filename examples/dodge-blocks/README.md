# Dodge Blocks Example

`dodge-blocks` 是 `leaferGame` 当前的集成示例。

它不是一个要单独打磨成品的小游戏，而是用来验证引擎分层是否真正可用：

- browser runtime 是否能启动场景
- scene 是否能装配 systems
- entity factory 是否能创建可复用实体
- asset manifest 是否能声明示例资源
- async manifest loading 是否能在玩法启动前完成资源预加载
- browser image sprite loader 是否能作为示例消费者接入
- entity template 是否能创建玩家基础数据组件
- transform / size / view 是否能同步到渲染层
- input 是否能驱动玩家移动
- collision 是否能判断玩家和障碍物接触
- `GameFlow` 是否能管理 ready / running / paused / ended
- 玩家是否能被限制在当前 viewport 内移动
- tooling panel 是否能分区显示 runtime debug + assets + game flow + entity inspector + component schema 数据
- tooling panel 是否能点击 entity 行并显示选中状态
- tooling panel 是否能显示 selected entity detail 摘要
- tooling panel 是否能用 component schema 辅助展示 selected component 字段

## How To Run

在仓库根目录执行：

```bash
npm install
npm run dev
```

打开 Vite 输出的本地地址后，页面会启动这个示例。

## Controls

- `WASD` 或方向键移动玩家
- `Space` 或 `Enter` 开始/重新开始
- `P` 或 `Esc` 暂停/继续

## File Map

- `main.ts`
  - 创建 browser runtime
  - 调用 `bootDodgeBlocksExample(...)`

- `boot.ts`
  - 启动 `DodgeBlocksScene`
  - 在 runtime start 前预加载 asset manifest
  - 挂载 keyboard bridge
  - 挂载 browser tooling panel
  - 分区显示 runtime debug、assets、game flow、entity inspector 和 component schema 信息
  - 支持在 panel 中点击 entity 行进行选择
  - 选择 entity 后显示 selected entity detail section
  - selected detail 会结合 component schema metadata 展示字段类型、默认值和当前值
  - 在 scene destroy 时清理输入和 panel

- `dodge-blocks-scene.ts`
  - 注册 input、collision、gameplay system
  - 创建 UI 文本节点
  - 通过 asset manifest 声明 sprite assets
  - 通过 `loadManifestAsync(...)` 和 browser image sprite loader 预加载示例资源
  - 通过 entity template 创建 player 的 transform / size / collider
  - 在代码里补充 player controller 和 render view

- `dodge-game-system.ts`
  - 通过 framework `GameFlow` 管理玩法状态
  - 生成障碍物
  - 维护 score / best score
  - 检测碰撞并切换 ended

- `factories.ts`
  - 定义 hazard 的实体工厂
  - 保留运行时随机障碍物生成逻辑

- `player-controller.ts`
  - 读取 `InputSystem`
  - 更新玩家位置
  - 把玩家限制在 playfield 内

- `styles.css`
  - 示例页面的基础外观

## Minimal Boot Shape

这个示例的启动形态可以简化理解成：

```ts
import { createBrowserRuntime } from "../../src/runtime/index.js";
import { bootDodgeBlocksExample } from "./boot.js";

const runtime = createBrowserRuntime({
  mount: "game-root"
});

bootDodgeBlocksExample(runtime).catch((error) => {
  console.error("Failed to boot dodge-blocks example:", error);
});
```

`bootDodgeBlocksExample(...)` 里会创建 scene、预加载 assets、启动 runtime、绑定键盘输入，并把包含 asset state、game flow state 和 schema metadata 的 tooling snapshot 以分区 panel 的形式显示到浏览器。

## What This Example Proves

这个示例证明当前 `leaferGame` 已经不只是静态渲染封装，而是具备了一个轻量游戏 runtime 的基本闭环：

```text
browser runtime
  -> scene
  -> systems
  -> entities/components
  -> render adapter
  -> tooling panel
```

## Data-Driven Split

当前示例已经有一部分内容走数据驱动：

- `DODGE_BLOCKS_ASSET_MANIFEST` 声明 player / hazard sprite assets
- 示例通过 `loadManifestAsync(...)` 在 gameplay 启动前完成资源加载
- tooling panel 的 `Assets` section 可以显示 player / hazard 的 loaded 状态
- player 的 `transform`、`size`、`collider` 来自 `EntityTemplate`
- player 的 `ViewComponent` 和 `PlayerControllerComponent` 仍在代码中装配
- gameplay phase 使用 framework `GameFlow`，而不是示例内的本地 phase state machine
- tooling panel 的 `Game Flow` section 可以显示当前 ready / running / paused / ended 状态
- hazard 仍由 factory 生成，因为它依赖运行时随机尺寸、位置和速度

后续新增资源加载、数据驱动场景、关卡配置和 runtime tooling 能力时，这个示例可以继续作为集成验证样例。
