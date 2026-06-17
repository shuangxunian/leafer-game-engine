# leaferGame

`leaferGame` 是一个基于 `Leafer` 构建的 2D 游戏引擎雏形项目。

这个项目当前的目标，不是单纯做一个小游戏 demo，也不是把 Leafer 当成“直接写玩法”的画布库来用，而是尝试建立一套清晰、可成长、可复用的游戏运行时结构，让它未来可以逐步演进成真正可持续开发的游戏引擎或游戏框架。

## 当前进度

当前项目已经推进到 `v0.16.2` Sprite-Capable Render Node Contract，`0.8.x` resource loading baseline、`0.9.x` game-flow/scene-lifecycle 阶段、`0.10.x` package-facing API boundary 阶段、`0.11.x` sprite animation / asset runtime 阶段、`0.12.x` runtime services / event pipeline 阶段、`0.13.x` input actions / control mapping 阶段、`0.14.x` runtime observability hardening 阶段和 `0.15.x` data-driven scene contract hardening 阶段都已经收口，`0.16.x` render/view contract hardening 阶段正在推进。

更准确地说，现在它已经不只是一个 Leafer demo，而是一套可运行、可测试、带示例验证的轻量 2D 游戏引擎雏形：

- `core` 已具备主循环、场景、实体、组件、系统、时间步进和生命周期管理。
- `framework` 已具备输入、input action mapping、变换、尺寸、视图同步、速度运动、碰撞、状态机、GameFlow、EventBus、RuntimeScheduler、RuntimeServicesSystem、相机、资源注册、异步资源加载状态、sprite frame / animation clip 数据契约、animation playback timing helpers、SpriteAnimationComponent/System、实体工厂、场景配置和组件 schema 等基础能力。
- `adapter` 已经通过渲染抽象接入 Leafer，并把显示层和游戏规则层分开。
- `runtime` 已经可以在浏览器里装配渲染、场景、动画帧循环和 scene lifecycle start helper。
- `tooling` 已经具备只读 debug snapshot、浏览器 debug overlay、碰撞盒可视化、scene/entity inspector snapshot、asset load state snapshot、GameFlow snapshot、sprite animation snapshot、runtime services snapshot、input action snapshot、聚合 tooling snapshot、browser tooling panel、entity row selection、selected entity detail、assets/game flow/sprite animations/runtime services/input actions panel section 和 schema-assisted component detail 展示。
- `examples/dodge-blocks` 作为集成样例，用来验证引擎分层、异步资源加载、sprite animation 和运行时 tooling 能力。

当前还不是成熟商业引擎，但已经走完了从“引擎骨架”到“可复用框架 + 数据驱动基础 + runtime observability / developer tooling”的第一轮产品化整理，完成了第一版资源加载管线基线，并沉淀了通用游戏流程、scene lifecycle 启动边界、sprite animation 数据契约、deterministic playback timing helpers、ECS animation component/system、示例级动画集成、动画 runtime 边界文档、第一版 runtime event bus、deterministic scheduler、scene-level runtime services integration、runtime services 只读 tooling 可见性、runtime services 边界文档、第一版 input action mapping、示例级 input action 集成、input action 只读 tooling 可见性、input action 边界文档、system observability snapshot 强化、runtime debug panel 可读性整理、dodge-blocks runtime observability 集成验证、runtime observability 边界文档、scene config validation baseline、opt-in safe scene bootstrap validation gate、dodge-blocks scene config 消费验证、scene config 边界文档、explicit ViewComponent sync contract 和 sprite-capable render node capability guard。

## 产品边界

这个仓库的产品定位是：

**一个可以被前端项目安装和接入的 2D 游戏引擎依赖包。**

它不是编辑器项目，也不计划在这个仓库里实现可视化编辑器、资产管理器、拖拽搭场景、关卡编辑或内容发布工作流。

当前代码里出现的 `tooling`、`inspector`、`debug panel` 都属于引擎包的只读开发者辅助能力：它们用于观察 runtime 状态、验证 ECS/scene/asset/game flow 数据是否正确，而不是面向最终用户的可视化编辑器，也不负责修改场景、组件、资源或关卡内容。

后续如果要做编辑器，应该是另一个上层项目或独立 package；这个仓库只提供可被前端游戏项目消费的底层能力，例如 runtime、schema、snapshot、asset loading、scene config 和 tooling API。换句话说，本仓库可以产出“未来上层工具可能会消费的数据契约”，但不承载编辑器本体、编辑器 UI、资源管理器或内容生产工作流。

更完整的边界说明见 [Product Boundary](docs/product-boundary.md)。

## 发布信息

包名：

`@shuangxunian/leafer-game-engine`

安装方式：

```bash
npm install @shuangxunian/leafer-game-engine
```

仓库地址：

- GitHub: https://github.com/shuangxunian/leafer-game-engine

包页面：

- npm: https://www.npmjs.com/package/@shuangxunian/leafer-game-engine

说明：

- GitHub 仓库已创建并接入 CI
- npm 包页面链接已经固定，发布后可直接通过上面的地址访问

## 如何选择导入入口

如果你在浏览器项目里启动游戏，可以使用 root import。这个入口会导出 `createBrowserRuntime(...)`，也会带上浏览器 runtime 和 Leafer adapter 相关能力：

```ts
import { Scene, createBrowserRuntime } from "@shuangxunian/leafer-game-engine";
```

如果你在 Node 测试、纯逻辑模块或服务端构建脚本里只需要引擎逻辑，优先使用 subpath import，避免不小心拉入浏览器 runtime：

```ts
import { Scene } from "@shuangxunian/leafer-game-engine/core";
import {
  EventBus,
  GameFlow,
  InputActionMap,
  RuntimeScheduler,
  addRuntimeServices,
  defineKeyboardBinding
} from "@shuangxunian/leafer-game-engine/framework";
import { createToolingSnapshot } from "@shuangxunian/leafer-game-engine/tooling";
```

当前 Node-safe smoke tests 覆盖 `/core`、`/framework` 和 `/tooling`。`/adapter`、`/runtime` 和 root import 当前按浏览器侧入口看待，主要通过示例构建验证。

## 安装后最小使用示例

下面这个例子演示的是：

- 如何从包里导入引擎能力
- 如何创建浏览器运行时
- 如何定义一个最小场景
- 如何在场景里放一个可见的节点

```ts
import {
  Scene,
  TransformComponent,
  ViewComponent,
  SizeComponent,
  createBrowserRuntime
} from "@shuangxunian/leafer-game-engine";

class HelloScene extends Scene {
  constructor(
    private readonly renderAdapter: ReturnType<typeof createBrowserRuntime>["renderAdapter"],
    private readonly renderScene: ReturnType<typeof createBrowserRuntime>["renderScene"]
  ) {
    super("HelloScene");
  }

  protected onStart(): void {
    const labelNode = this.renderAdapter.createText("Hello leaferGame");
    labelNode.x = 40;
    labelNode.y = 40;
    labelNode.fontSize = 28;
    this.renderScene.root.addChild(labelNode);

    const playerNode = this.renderAdapter.createSprite("player");
    this.renderScene.root.addChild(playerNode);

    const player = this.world.createEntity("Player");
    const transform = player.addComponent(new TransformComponent());
    transform.x = 120;
    transform.y = 140;

    player.addComponent(new SizeComponent(52, 52));
    player.addComponent(new ViewComponent(playerNode));
  }

  override destroy(): void {
    super.destroy();
    this.renderScene.destroy();
  }
}

const runtime = createBrowserRuntime({
  mount: "game-root"
});

const scene = new HelloScene(runtime.renderAdapter, runtime.renderScene);
runtime.start(scene);
```

配套的 HTML 挂载点可以像这样：

```html
<div id="game-root" style="width: 960px; height: 640px"></div>
```

如果你想看更完整的用法，可以直接参考仓库里的示例项目：

- [examples/dodge-blocks](examples/dodge-blocks)

如果你想了解当前 package 入口边界，可以参考：

- [docs/public-api.md](docs/public-api.md)

如果你想了解 sprite animation 的资源、播放、ECS、渲染应用和只读 tooling 边界，可以参考：

- [docs/animation-runtime.md](docs/animation-runtime.md)

如果你想了解 runtime services 的事件、调度、scene 集成和只读 tooling 边界，可以参考：

- [docs/runtime-services.md](docs/runtime-services.md)

如果你想了解 input actions 的键盘绑定、语义动作、示例消费和只读 tooling 边界，可以参考：

- [docs/input-actions.md](docs/input-actions.md)

如果你想了解 runtime observability 的 debug snapshot、system lifecycle、tooling panel section 和只读边界，可以参考：

- [docs/runtime-observability.md](docs/runtime-observability.md)

如果你想了解 scene config 的资源声明、实体模板、验证诊断、安全启动和非编辑器边界，可以参考：

- [docs/scene-config.md](docs/scene-config.md)

## 最小可运行项目目录示例

如果你是第一次把它接进自己的项目，一个最小可运行目录可以长这样：

```text
my-game/
├─ index.html
├─ package.json
├─ tsconfig.json
└─ src/
   ├─ main.ts
   └─ scenes/
      └─ hello-scene.ts
```

其中每个文件的职责可以这样理解：

- `index.html`
  - 提供浏览器挂载点，比如 `#game-root`

- `src/main.ts`
  - 负责创建运行时
  - 负责装配并启动你的第一个场景

- `src/scenes/hello-scene.ts`
  - 放你的场景定义
  - 在场景里创建实体、组件、视图节点和系统

一个最小的 `index.html` 可以像这样：

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Game</title>
  </head>
  <body>
    <div id="game-root" style="width: 960px; height: 640px"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

一个最小的 `src/main.ts` 可以像这样：

```ts
import { createBrowserRuntime } from "@shuangxunian/leafer-game-engine";
import { HelloScene } from "./scenes/hello-scene";

const runtime = createBrowserRuntime({
  mount: "game-root"
});

runtime.start(new HelloScene(runtime.renderAdapter, runtime.renderScene));
```

如果你的项目里已经有自己的构建工具，比如 `Vite`、`Rspack`、`Webpack`，那通常只需要保证：

- 能处理 TypeScript
- 浏览器里有一个挂载容器
- 入口文件里调用 `createBrowserRuntime(...)`

就可以先把第一版跑起来。

## 最小 HelloScene 完整示例

如果你希望把上面的目录示例补成一个真正能运行的最小场景，可以先写一个 `src/scenes/hello-scene.ts`：

```ts
import {
  Scene,
  TransformComponent,
  SizeComponent,
  ViewComponent
} from "@shuangxunian/leafer-game-engine";
import type { RenderAdapter, RenderScene } from "@shuangxunian/leafer-game-engine";

export class HelloScene extends Scene {
  constructor(
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene
  ) {
    super("HelloScene");
  }

  protected onStart(): void {
    const titleNode = this.renderAdapter.createText("Hello leaferGame");
    titleNode.x = 40;
    titleNode.y = 40;
    titleNode.fontSize = 28;
    this.renderScene.root.addChild(titleNode);

    const playerNode = this.renderAdapter.createSprite("player");
    this.renderScene.root.addChild(playerNode);

    const player = this.world.createEntity("Player");
    const transform = player.addComponent(new TransformComponent());
    transform.x = 120;
    transform.y = 140;

    player.addComponent(new SizeComponent(52, 52));
    player.addComponent(new ViewComponent(playerNode));
  }

  override destroy(): void {
    super.destroy();
    this.renderScene.destroy();
  }
}
```

配合前面的 `src/main.ts` 和 `index.html`，这就是一套最小可运行版本。

## 推荐的初始化步骤

如果你准备新建一个自己的游戏项目，比较顺手的起步方式是：

1. 新建一个前端项目
   - 可以用 `Vite`
   - 也可以用你熟悉的其他浏览器打包工具

2. 安装依赖

```bash
npm install @shuangxunian/leafer-game-engine
```

3. 准备一个页面挂载点
   - 在 `index.html` 里放一个固定尺寸或自适应尺寸的 `#game-root`

4. 建立入口文件
   - 在 `src/main.ts` 里调用 `createBrowserRuntime(...)`
   - 启动你的第一个场景

5. 从一个最小场景开始
   - 先只创建文本和一个可见节点
   - 先确认渲染链路是通的

6. 再逐步加玩法能力
   - 输入
   - 移动
   - 碰撞
   - 状态机
   - 资源加载

如果你是第一次接这个引擎，我建议不要一上来就做复杂玩法，而是先保证下面这三件事都成立：

- 页面正常挂载
- 场景能正常启动
- 实体和视图同步能正常显示

一旦这三件事稳定，再往上加输入和碰撞会顺很多。

## 公开 API 速查表

当前包的公开入口主要分成这几类：

### 根入口

```ts
import {
  Game,
  Scene,
  Entity,
  Component,
  System,
  createBrowserRuntime
} from "@shuangxunian/leafer-game-engine";
```

适合大多数默认使用场景。

### Core

```ts
import {
  Game,
  Scene,
  World,
  Entity,
  Component,
  System,
  Time
} from "@shuangxunian/leafer-game-engine/core";
```

职责：

- 主循环
- 生命周期
- 场景管理
- 实体组件系统

### Framework

```ts
import {
  InputSystem,
  BrowserKeyboardBridge,
  TransformComponent,
  SizeComponent,
  ViewComponent,
  VelocityComponent,
  ColliderComponent,
  CollisionSystem,
  CameraSystem,
  AssetRegistry,
  createDefaultComponentSchemaRegistry,
  StateMachine,
  defineEntityFactory
} from "@shuangxunian/leafer-game-engine/framework";
```

职责：

- 输入桥接
- 基础变换
- 视图同步
- 速度运动
- 碰撞声明和碰撞检测
- 相机控制
- 资源注册
- 组件 schema
- 状态机
- 实体工厂

### Adapter

```ts
import {
  LeaferRenderAdapter
} from "@shuangxunian/leafer-game-engine/adapter";
```

职责：

- 渲染抽象
- Leafer 运行时适配

### Runtime

```ts
import {
  createBrowserRuntime
} from "@shuangxunian/leafer-game-engine/runtime";
```

职责：

- 浏览器挂载
- 主循环驱动
- 运行时装配

### Tooling

```ts
import {
  BrowserDebugOverlay,
  BrowserToolingPanel,
  ColliderDebugSystem,
  createDebugSnapshot,
  createSceneInspectorSnapshot,
  createToolingSnapshot,
  createToolingPanelSections,
  createSelectedEntityDetailPanelSection,
  parseToolingPanelEntityRowId
} from "@shuangxunian/leafer-game-engine/tooling";
```

职责：

- 浏览器调试 overlay
- 浏览器 tooling panel
- 碰撞盒可视化
- runtime debug snapshot
- scene/entity inspector snapshot
- 面向工具面板的聚合 snapshot
- runtime debug / entity inspector / component schema 分区数据
- entity row selection
- selected entity detail
- schema-assisted selected component detail
- entity row parsing helper

### 当前比较常用的第一批类

如果你刚开始接入，最常用的通常是这些：

- `Scene`
- `Entity`
- `Component`
- `createBrowserRuntime`
- `TransformComponent`
- `SizeComponent`
- `ViewComponent`
- `InputSystem`
- `BrowserKeyboardBridge`
- `ColliderComponent`
- `CollisionSystem`
- `CameraSystem`
- `AssetRegistry`
- `createDefaultComponentSchemaRegistry`
- `StateMachine`
- `defineEntityFactory`
- `BrowserDebugOverlay`
- `BrowserToolingPanel`
- `createToolingSnapshot`

这批 API 已经足够搭出一个最小的 2D 游戏原型。

## 开源协议

当前项目使用 `MIT` 协议，见 [LICENSE](LICENSE)。

## 项目定位

我希望把 `leaferGame` 做成一套建立在 `Leafer` 之上的 2D 游戏层能力，核心思想是：

- `Leafer` 负责渲染、显示对象、交互基础能力
- `leaferGame` 负责游戏循环、场景切换、实体组件、输入、碰撞、玩法系统
- 具体游戏内容只建立在引擎能力之上，不直接把核心规则写死在 `Leafer` 节点里

换句话说，这个项目更像是：

- 用 `Leafer` 作为渲染和显示底座
- 在它上面抽象出自己的游戏运行时
- 最终形成一套适合做 2D 小游戏、互动内容和可视化玩法的前端游戏引擎依赖包

这也是这个仓库和普通 demo 最大的区别。

## 为什么基于 Leafer 来做

选择 `Leafer`，不是因为它已经是一个完整成熟的游戏引擎，而是因为它很适合做“游戏引擎底座”：

- 它本身有比较强的 2D 图形能力
- 它有清晰的显示对象体系
- 它适合互动内容、画布应用和运行时调试面板
- 它天然适合把“图形系统”和“游戏运行时”结合起来

这意味着它特别适合承载下面这些方向：

- 2D 小游戏
- UI 和玩法混合较多的互动应用
- 棋牌、解谜、经营、卡牌、轻动作游戏
- 需要清晰 runtime、配置化内容和调试工具的前端项目

但也正因为如此，我们不能把 `Leafer` 直接当作游戏逻辑层来写。  
如果未来想让这套东西真正可演化，就必须把“渲染”和“游戏规则”分开。

## 当前设计原则

这个项目现在遵循一个非常关键的原则：

`Leafer 只做表现层底座，游戏规则不直接写进 Leafer 节点。`

这样做的好处是：

- 后续更容易替换渲染实现
- 更容易做调试工具和数据驱动
- 更容易做数据驱动
- 更容易做回放、存档、状态同步
- 更容易把玩法代码沉淀成真正可复用的框架能力

更完整的架构说明可以看：

- [架构设计文档](docs/architecture.md)

## 当前项目结构

当前代码主要分成下面几层：

- `docs`
  - 项目文档和架构说明

- `src/core`
  - 引擎核心运行时
  - 包括 `Game`、`Scene`、`World`、`Entity`、`Component`、`System`、`Time`
  - 这一层负责生命周期、主循环、调度关系，是整个引擎的骨架

- `src/framework`
  - 建立在核心层之上的通用游戏能力
  - 比如输入、基础移动、碰撞、尺寸、视图同步等
  - 这一层未来应该逐步沉淀成可以跨多个游戏项目复用的模块

- `src/adapter`
  - 渲染适配层
  - 用来把引擎里的渲染抽象映射到 `Leafer`
  - 当前已经有真实的 Leafer 运行时适配器，而不是纯占位实现

- `src/runtime`
  - 运行时装配层
  - 负责浏览器环境下的引擎启动、挂载、主循环驱动
  - 这一层的意义是把“引擎怎么跑起来”和“具体游戏是什么”分开

- `src/engine.ts`
  - 当前的根聚合导出入口
  - 会重新导出 `adapter`、`core`、`framework`、`runtime`、`tooling`
  - 配合 `package.json` 里的 subpath exports 使用

- `src/tooling`
  - 调试和开发辅助能力
  - 当前已经包含 debug snapshot、browser overlay、collider visualization、scene inspector snapshot、asset load state snapshot、GameFlow snapshot、sprite animation snapshot、runtime services snapshot、input action snapshot、聚合 tooling snapshot、browser tooling panel、assets/game flow/sprite animations/runtime services/input actions panel section 和 component schema panel section
  - 这一层是引擎包内置开发体验的一部分，用来服务调试面板、场景检查和 runtime 可观测性，不承载可视化编辑器职责

- `examples`
  - 示例项目层
  - 用来放基于引擎运行的样例游戏或 playground
  - 这里的代码不是引擎本体，而是引擎的消费者示例
  - 示例通过 package-style imports 访问引擎 API，本仓库开发时由 Vite alias 和 TypeScript paths 映射回 `src`

## 当前已经实现了什么

当前已经完成了 `0.1.x` 到 `0.15.x` 的连续整理，`0.16.x` render/view contract hardening 阶段正在推进。重点已经从“能跑起来”推进到了“可复用、可数据驱动、可检查、可通过 runtime observability 辅助开发、可作为 package 被消费”，并补齐了资源加载基线、GameFlow、scene lifecycle 启动边界、package-facing API 边界、sprite animation playback timing 基础、ECS animation component/system、示例级动画集成、动画 runtime 边界文档、deterministic event bus 基线、update-driven scheduler 基线、opt-in scene runtime services 集成模式、runtime services 只读 tooling snapshot、runtime services 边界文档、input action mapping 基线、dodge-blocks input action 集成、input action 只读 tooling snapshot、input action 边界文档、system observability snapshot 强化、runtime debug panel 可读性整理、dodge-blocks runtime observability 集成验证、runtime observability 边界文档、scene config validation baseline、opt-in safe scene bootstrap validation gate、dodge-blocks scene config 消费验证、scene config 边界文档、explicit ViewComponent sync contract 和 sprite-capable render node capability guard。

- Core 稳定性
  - `Game`、`Time`、`Scene`、`World`、`Entity`、`Component`、`System` 已经形成基础骨架。
  - 支持 `update / fixedUpdate / lateUpdate`。
  - 支持系统优先级和稳定执行顺序。
  - 支持场景替换、销毁保护、实体安全增删和 world 查询。

- Framework 复用能力
  - 已有输入系统和浏览器键盘桥接。
  - 已有 `InputActionMap` 和 `defineKeyboardBinding(...)`，可以把物理键盘输入映射成 `jump`、`pause`、`move:left` 这类语义动作，示例玩法也已经改为读取语义动作。
  - 已有 `TransformComponent`、`SizeComponent`、`ViewComponent`、`VelocityComponent`，其中 `ViewComponent.syncFromTransform(...)` 已经把 ECS transform/size 到 render node 的同步语义显式化，`isSpriteCapableRenderNode(...)` 可以判断 render node 是否支持 sprite asset application。
  - 已有 `ColliderComponent` 和 `CollisionSystem`，支持 `enter / stay / exit` 语义和 layer 过滤。
  - 已有 `StateMachine` 和 `GameFlow`，可以把示例里的状态流沉淀成通用能力。
  - 已有 `EventBus`，支持同步确定性的 runtime/gameplay event 发布订阅、one-shot listener、unsubscribe、clear 和事件 envelope sequence。
  - 已有 `RuntimeScheduler`，支持通过 `update(dt)` 推进的一次性延迟任务、重复 interval 任务、cancel、clear 和大步长 catch-up。
  - 已有 `RuntimeServicesSystem`、`addRuntimeServices(...)` 和 `getRuntimeServices(...)`，可以让 scene 可选持有并推进 runtime services。
  - 已有 `CameraSystem`，能驱动 world layer 位移、缩放和跟随实体。
  - 已有 `AssetRegistry`，支持 typed sprite asset 注册、查找、缺失时报错、异步加载状态、manifest 部分加载结果、sprite frame / animation clip 数据契约和浏览器图片加载适配。
  - 已有 sprite animation playback timing helpers，支持 deterministic advance、loop、non-loop completion、pause/resume/stop 和 frame-level duration override。
  - 已有 `SpriteAnimationComponent` 和 `SpriteAnimationSystem`，可以在 ECS 中推进动画状态，并通过共享 sprite-capable render node 契约把当前 frame 的 sprite asset 应用到 `ViewComponent`。
  - 已有 `defineEntityFactory`，支持把实体创建逻辑从 sample 中抽出来复用。
  - 已有 asset manifest、entity template、scene config、scene config validation、opt-in safe scene bootstrap validation gate、示例级 scene config 消费验证和 component schema registry，开始具备数据驱动内容管线基础。

- Adapter 和 Runtime
  - 引擎层通过 `RenderAdapter / RenderScene / RenderNode` 隔离渲染实现。
  - 当前底层已经接入真实 `Leafer`。
  - `createBrowserRuntime(...)` 可以完成浏览器挂载、渲染场景创建和动画帧循环。
  - 已有 `startSceneWithLifecycle(...)`，可以在 scene start 前编排 async prepare / ready / running / failed 边界。
  - 示例入口已经和引擎入口拆开，`examples/*` 是消费者而不是引擎本体。

- Tooling 初步成型
  - 已有 `createDebugSnapshot(...)` 和 `formatDebugSnapshot(...)`。
  - 已有 `BrowserDebugOverlay`，可以在浏览器中显示运行时调试信息。
  - 已有 `ColliderDebugSystem`，可以在 world layer 可视化碰撞盒。
  - 已有 `createSceneInspectorSnapshot(...)`，可以导出 scene/entity/component 结构化检查数据。
  - 已有 `createToolingSnapshot(...)`，作为面向工具面板的聚合入口。
  - system debug snapshot 已经包含 system name、registration order、enabled/started/destroyed、priority 和派生 lifecycle。
  - Runtime Debug panel section 已经使用更适合浏览器面板阅读的只读摘要行。
  - 已有 asset load state snapshot 和 `Assets` panel section，可以展示 registered/loading/loaded/failed 状态。
  - 已有 GameFlow snapshot 和 `Game Flow` panel section，可以展示当前 gameplay phase。
  - 已有 sprite animation snapshot 和 `Sprite Animations` panel section，可以展示 entity、clip、status、frame、sprite、elapsed 和 loops。
  - 已有 runtime services snapshot 和 `Runtime Services` panel section，可以只读展示 EventBus listener/emitted count、scheduler elapsed/task count 和 latest scheduler update。
  - 已有 input action snapshot 和 `Input Actions` panel section，可以只读展示 action id、keyboard bindings、pressed 和 justPressed。
  - 已有 `BrowserToolingPanel`，可以分区展示 runtime debug、assets、game flow、entity inspector 和 component schema metadata。
  - 已有 entity row selection，可以在浏览器 tooling panel 中选择 entity。
  - 已有 selected entity detail section，可以显示选中实体的状态、组件和 primitive data。
  - 已有 schema-assisted selected component detail，可以结合 component schema 展示字段类型、默认值和当前值。

- 工程验证
  - 当前有覆盖 core、framework、assets、factory、collision、tooling、runtime 的自动测试。
  - 当前测试数为 169 个。
  - `npm run check`、`npm test`、`npm run build:example`、`npm run verify:package` 是当前主要验证入口。

## 当前 demo 的意义

仓库里现在确实带了一个小游戏样例，并且它已经被放到了 `examples/` 目录下。它的目的不是为了“做一个完整小游戏成品”，而是为了验证下面这些引擎能力是否站得住：

- 场景能不能驱动
- 实体组件模型是否顺手
- 输入系统是否够用
- 渲染适配层和 Leafer 的边界是否合理
- 碰撞和基础玩法逻辑是否能稳定落在框架层
- 状态切换是否能在不污染核心层的情况下实现

所以你可以把当前 demo 理解成：

“这套引擎骨架的第一份集成测试样例”

而不是项目的终点。

## 如何运行

本项目当前使用 `Vite + TypeScript`。

启动方式：

```bash
npm install
npm run dev
```

如果只想做类型检查：

```bash
npm run check
```

如果想做生产构建验证：

```bash
npm run build:example
```

如果想构建未来发布到 npm 的库产物：

```bash
npm run build:lib
```

如果想本地预演 npm 打包结果：

```bash
npm pack
```

如果想在发布前检查 npm 包产物是否包含正确文件、排除开发目录：

```bash
npm run verify:package
```

## 这个项目接下来更应该做什么

如果我们把目标定义为“做游戏引擎”，那接下来的重点不应该是继续打磨 demo 外观，而应该继续把当前已经有的 runtime、framework、tooling 往产品化方向推进。

`0.7.x` 已经把 selection-aware read-only runtime tooling 阶段收口了，`0.8.x` 完成了资源加载和 asset pipeline 基线，`0.9.x` 完成了 Game Flow 和 Scene Lifecycle 基线，`0.10.x` 完成了 package-facing API boundary 基线，`0.11.x` 已经把 sprite animation 从数据契约推进到 playback helper、ECS component/system、示例集成、tooling 可见性和 runtime 边界文档，`0.12.x` 已经完成 deterministic EventBus、RuntimeScheduler、opt-in scene runtime services、runtime services tooling visibility 和 runtime services 边界文档，`0.13.x` 已经完成 input action mapping、示例集成、tooling visibility 和边界文档，`0.14.x` 已经完成 runtime observability hardening、示例验证和边界文档，`0.15.x` 已经完成 data-driven scene contract hardening。下一阶段更值得优先投入的是这些方向：

1. 更克制的只读 runtime observability / inspector
   - 系统状态查看
   - 输入状态查看
   - asset loading 状态展示
   - inspector 面板的可读性和可访问性 polish
   - 不提供场景编辑、组件改值、资源管理或关卡制作入口

2. 更正式的资源加载
   - 图片加载
   - 资源缓存
   - 加载状态和错误处理
   - 精灵帧、图集和动画资源管理

3. 更完整的数据驱动能力
   - 组件配置
   - 配置校验和默认值
   - 为配置化内容和多项目复用打基础

4. 更完整的游戏流和 UI 状态
   - 在 `StateMachine` 之上沉淀 `GameFlow`
   - 暂停、重开、结算、菜单等通用状态模型
   - UI 层和玩法层的关系约束

5. 地图和关卡能力
   - TileMap
   - 触发器
   - 出生点和区域管理
   - 关卡数据加载和切换

6. 引擎包 API 友好结构
   - 组件 schema
   - 实体选择和层级信息
   - 资源引用检查
   - 让运行时结构适合被上层工具或独立产品消费

## 当前阶段的一个重要判断

现在这个仓库更准确地说，是：

- 一个 `Leafer` 上的 2D 游戏引擎雏形
- 一个轻量游戏框架原型
- 一个已经具备初步工具链的互动内容运行时底座

它还不是成熟引擎，但已经不只是一次性 demo。  
最重要的事情仍然不是继续堆玩法，而是持续把“可复用能力”从示例中提炼出来，让 `examples/*` 依赖 `src/framework`，让 `src/framework` 依赖 `src/core` 和 `src/adapter`，再让 `src/tooling` 服务调试、检查和开发体验。

如果这条路走顺了，后面你做第二个、第三个小游戏时，就不再是在“重写一个 demo”，而是在真正使用你自己的引擎。

## 关于未来发布到 npm

如果未来要把 `leaferGame` 当成依赖发布到 npm，那么现在这类结构调整是必须的。

理想状态下，未来应该形成这样的关系：

- 引擎包本身提供通用能力
  - `core`
  - `framework`
  - `adapter`
  - `runtime`
  - `tooling`

- 具体游戏项目只依赖引擎包
  - 自己定义场景
  - 自己组织资源
  - 自己写玩法系统

- 示例游戏只是一份消费者样例
  - 它不应该反过来成为引擎入口

也就是说，当前仓库里的 `examples/` 最终应该被看作：

- example
- playground
- integration test sample

而不应该等同于引擎本体。

## PS
此项目没有一行代码手写
