# leaferGame

`leaferGame` 是一个基于 `Leafer` 构建的前端 2D 游戏引擎依赖包雏形。

这个项目当前的目标，不是单纯做一个小游戏 demo，也不是把 Leafer 当成“直接写玩法”的画布库来用，更不是在这个仓库里做可视化编辑器；它要沉淀的是一套可以被前端游戏项目通过 `import` 接入的运行时、框架层和 package API，让它未来逐步演进成真正可持续开发的游戏引擎或游戏框架。

典型使用目标是快速搭建 Web 页面里的轻量 2D 游戏与互动内容，例如 4399 常见小游戏、微信小游戏风格的轻量玩法原型（如抓大鹅、灌水瓶一类规则驱动小游戏）以及 galgame / 互动叙事项目。

## 当前进度

当前项目已经推进到 `v0.31.0` UI / Dialogue / Scene Flow Sprint，`0.8.x` resource loading baseline、`0.9.x` game-flow/scene-lifecycle 阶段、`0.10.x` package-facing API boundary 阶段、`0.11.x` sprite animation / asset runtime 阶段、`0.12.x` runtime services / event pipeline 阶段、`0.13.x` input actions / control mapping 阶段、`0.14.x` runtime observability hardening 阶段、`0.15.x` data-driven scene contract hardening 阶段、`0.16.x` render/view contract hardening 阶段、`0.17.x` runtime/game loop hardening 阶段、`0.18.x` level/map runtime primitives 阶段、`0.19.x` pointer/input runtime primitives 阶段、`0.20.x` collision query runtime primitives 阶段、`0.21.x` audio runtime primitives 阶段、`0.22.x` audio playback adapter 阶段、`0.24.x` playable 2D game kit 阶段、`0.25.x` second playable example 阶段、`0.26.x` framework extraction from two playable examples 阶段、`0.27.x` pointer-first puzzle interaction 阶段、`0.28.x` real sprite / image rendering 阶段、`0.29.x` responsive Web runtime 阶段和 `0.30.x` drag/drop and selection hardening 阶段都已经收口，`0.23.x` camera runtime contract hardening 阶段已经完成 viewport/coordinate conversion baseline 和 bounds/follow clamping primitives。`v0.23.3` camera read-only tooling visibility 已记录但暂缓，当前项目已经能支撑复刻一个简单 4399 风格浏览器小游戏的轻量原型，并且已经通过 `dodge-blocks`、`collect-stars` 和 `pour-sort` 三个 playable examples 验证这些能力不是单一样例专用；`0.26.x` 已从两个示例的重复痛点反推小型 framework extraction，抽出了 `clampPositionToBounds(...)`、`attachActorSpriteView(...)` 和 `randomPositionInBounds(...)`，并把 gameplay snapshot 固定为 example-owned read-only 约定。`0.27.x` 已完成 pointer-first / UI-heavy 小游戏压力测试，并在 `v0.27.1` 建立 pointer position runtime contract、在 `v0.27.2` 建立矩形命中测试和 entity picking baseline、在 `v0.27.3` 建立 source-target selection state baseline、在 `v0.27.4` 建立 `pour-sort` pointer puzzle shell 和 route baseline、在 `v0.27.5` 建立 example-owned playable pour-sort loop、在 `v0.27.6` 收口该阶段。`0.28.x` 已补齐 1.0 前必须完成的真实 sprite / image rendering baseline：`v0.28.1` 让 `RenderSpriteAsset.source` 映射到 Leafer `Image.url`，`v0.28.2` 让 `AssetRegistry` 输出干净的 render asset 副本，`v0.28.3` 让 `dodge-blocks` 示例通过 `assets + assetId` 消费 source-backed sprite assets，`v0.28.4` 补齐 sprite rendering package boundary 文档，并在 `v0.28.5` 收口该阶段。`0.29.x` 已补齐 1.0 前需要的 responsive Web runtime：`v0.29.1` 建立 render scene resize contract，`v0.29.2` 建立 opt-in browser resize bridge，`v0.29.3` 建立 resize 后仍读取最新 mount bounds 的 pointer local coordinate helper，`v0.29.4` 让共享示例入口和 standalone dodge-blocks 示例启用 `resize: true` 做 desktop/mobile-ish 视口验证，并在 `v0.29.5` 收口该阶段。`0.30.x` drag/drop and selection hardening 阶段已在 `v0.30.1` 补齐 copied selection snapshot、source-target readiness check 和显式 replace source/target helper，在 `v0.30.2` 补齐 active entity drag identity、start/current pointer position、pointer-local delta 和 complete/cancel snapshot，在 `v0.30.3` 补齐 source-target action envelope、copied action snapshot 和 allowed/blocked result，在 `v0.30.4` 让 `pour-sort` 消费 selection snapshot 与 source-target action helper，并在 `v0.30.5` 收口该阶段。`0.31.x` 开始补 UI / dialogue / scene flow，先规划 dialogue text / choice data contract、choice state helper、screen-space prompt rendering 和 narrative example；仍然不做 visual novel scripting language、branching story editor、visual editor、launcher、gallery、SDK wrapper 或发布平台。

上一阶段的明确收口点是 `v0.27.6` Pointer-First Puzzle Interaction Stage Closeout；这个 closeout 只沉淀可复用 runtime/framework helper 和 example-owned 玩法验证，不能把示例玩法、编辑器、launcher、gallery 或内容生产流程塞进引擎本体。

此前的 framework extraction 收口点是 `v0.26.5` Framework Extraction Closeout From Two Playable Examples；这个 framework extraction closeout 仍然是后续提炼 helper 时的边界参考。

更准确地说，现在它已经不只是一个 Leafer demo，而是一套可运行、可测试、带示例验证的轻量 2D 游戏引擎雏形：

- `core` 已具备主循环、场景、实体、组件、系统、时间步进和生命周期管理。
- `framework` 已具备输入、input action mapping、keyboard/pointer button bindings、pointer position state、entity hit testing/picking、source-target selection state、selection snapshot / readiness helper、entity drag state baseline、source-target action envelope / validation result、变换、尺寸、视图同步、速度运动、movement vector limiting、position-to-bounds clamping、random position-in-bounds placement、actor template composition、actor sprite view attachment、runtime HUD text helper、tile map layer view helper、碰撞、音频数据契约、音频 runtime intent state、scene-owned AudioRuntimeSystem、audio playback adapter contract、deterministic audio operation draining、AudioPlaybackSystem scene integration、状态机、GameFlow、EventBus、RuntimeScheduler、RuntimeServicesSystem、相机 viewport/coordinate conversion、camera bounds/follow clamping、资源注册、异步资源加载状态、sprite frame / animation clip 数据契约、animation playback timing helpers、SpriteAnimationComponent/System、实体工厂、场景配置、组件 schema、tile map 数据契约、level spawn/region metadata 和 scene config level/map 声明集成等基础能力。
- `adapter` 已经通过渲染抽象接入 Leafer，并把显示层和游戏规则层分开。
- `runtime` 已经可以在浏览器里装配渲染、场景、动画帧循环、scene lifecycle start helper 和 opt-in browser audio playback adapter，`examples/dodge-blocks` 也已消费这条播放链路。
- `tooling` 已经具备只读 debug snapshot、浏览器 debug overlay、碰撞盒可视化、scene/entity inspector snapshot、asset load state snapshot、GameFlow snapshot、sprite animation snapshot、runtime services snapshot、input action snapshot、collision pair snapshot、audio runtime snapshot、聚合 tooling snapshot、browser tooling panel、entity row selection、selected entity detail、assets/game flow/sprite animations/audio runtime/runtime services/input actions/collisions panel section 和 schema-assisted component detail 展示。
- `examples/dodge-blocks`、`examples/collect-stars` 和 `examples/pour-sort` 作为下游消费者样例，用来验证引擎分层、异步资源加载、sprite animation、音频、输入、碰撞、相机基础、HUD、tile visual layer、actor template、可玩小游戏能力以及 pointer-first puzzle loop；`0.27.x` 已经补齐 pointer position、命中测试、entity picking 和 source-target selection state 这类 pointer-first 小游戏会用到的基础能力。

当前还不是成熟商业引擎，但已经走完了从“引擎骨架”到“可复用框架 + 数据驱动基础 + runtime observability / developer tooling”的第一轮产品化整理，完成了第一版资源加载管线基线，并沉淀了通用游戏流程、scene lifecycle 启动边界、sprite animation 数据契约、deterministic playback timing helpers、ECS animation component/system、示例级动画集成、动画 runtime 边界文档、第一版 runtime event bus、deterministic scheduler、scene-level runtime services integration、runtime services 只读 tooling 可见性、runtime services 边界文档、第一版 input action mapping、示例级 input action 集成、input action 只读 tooling 可见性、input action 边界文档、pointer button action binding baseline、browser pointer button bridge baseline、dodge-blocks pointer action consumption、pointer/input runtime boundary closeout、collision pair query baseline、collision pair 只读 tooling snapshot、dodge-blocks collision tooling visibility、collision query runtime boundary closeout、audio data contract baseline、audio runtime service integration、audio runtime 只读 tooling visibility、dodge-blocks audio runtime intent consumption、audio runtime boundary closeout、audio playback adapter contract baseline、audio playback system draining integration、browser audio playback adapter baseline、system observability snapshot 强化、runtime debug panel 可读性整理、dodge-blocks runtime observability 集成验证、runtime observability 边界文档、scene config validation baseline、opt-in safe scene bootstrap validation gate、dodge-blocks scene config 消费验证、scene config 边界文档、explicit ViewComponent sync contract、sprite-capable render node capability guard、Node-safe render-types subpath、render/view contract package doc、runtime phase cleanup hardening、Game.tick error boundary contract、runtime ownership boundary、tile map data contract baseline、level spawn/region data primitives、scene config level/map declaration integration、dodge-blocks level config consumption、level/map runtime boundary closeout、normalized directional movement baseline、actor template composition baseline、runtime HUD text helper baseline、tile map layer view baseline、playable example closeout baseline、collect-stars package API consumption hardening 和 second playable example stage closeout。

## 产品边界

这个仓库的产品定位是：

**一个可以被前端项目安装和接入的 2D 游戏引擎依赖包。**

它不是编辑器项目，也不计划在这个仓库里实现可视化编辑器、资产管理器、拖拽搭场景、关卡编辑或内容发布工作流。

当前代码里出现的 `tooling`、`inspector`、`debug panel` 都属于引擎包的只读开发者辅助能力：它们用于观察 runtime 状态、验证 ECS/scene/asset/game flow 数据是否正确，而不是面向最终用户的可视化编辑器，也不负责修改场景、组件、资源或关卡内容。

这个边界后续按硬约束处理：凡是需要创建、修改、保存、发布或管理内容资产的能力，都默认不进入当前仓库；只有可以表达为 runtime API、数据契约、校验逻辑、只读 snapshot、debug overlay 或示例消费验证的能力，才属于这里。

后续版本评审时也按这个规则执行：新能力必须先能说清楚自己是 runtime、framework、adapter、package API、只读 observability、数据契约、校验或示例消费验证；如果它主要服务可视化创建、修改、保存、发布内容，就应该拆到未来独立编辑器或上层工具项目。

后续如果要做编辑器，应该是另一个上层项目或独立 package；这个仓库只提供可被前端游戏项目消费的底层能力，例如 runtime、schema、snapshot、asset loading、scene config 和 tooling API。换句话说，本仓库可以产出“未来上层工具可能会消费的数据契约”，但不承载编辑器本体、编辑器 UI、资源管理器或内容生产工作流。

因此，后续版本里如果出现 `level`、`map`、`scene config`、`schema` 或 `tooling` 相关能力，它们都应先被理解为运行时数据契约、校验能力、只读观测能力或示例消费验证，而不是编辑器功能。任何需要创建、修改、保存、发布内容的 authoring workflow，都应该拆到未来独立的编辑器项目里。

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

- GitHub 仓库已创建；当前不使用 GitHub CI，提交前以本地 `npm run check`、`npm test`、`npm run build:example`、`npm run verify:package` 和 `npm audit --audit-level=moderate` 作为验证链路
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
  mount: "game-root",
  resize: true
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
- [examples/collect-stars](examples/collect-stars)
- [examples/pour-sort](examples/pour-sort)

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

如果你想了解 level/map 的 tile map、spawn/region、scene config 集成、示例消费和非编辑器边界，可以参考：

- [docs/level-map.md](docs/level-map.md)

如果你想了解 render node、ViewComponent、render layer、sprite-capable node 和 render scene lifecycle 边界，可以参考：

- [docs/render-view-contract.md](docs/render-view-contract.md)

如果你想了解 `Game`、`Scene`、browser runtime、RenderScene、tooling 和错误处理策略之间的 ownership 边界，可以参考：

- [docs/runtime-ownership.md](docs/runtime-ownership.md)

如果你想了解真实 sprite / image rendering 的 `source` 映射、asset registry 到 render node 的 handoff、`/framework` DOM-free 约束和非资产编辑器边界，可以参考：

- [docs/sprite-rendering.md](docs/sprite-rendering.md)

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
  mount: "game-root",
  resize: true
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
  BrowserPointerButtonBridge,
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
- `BrowserPointerButtonBridge`
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
  - 当前已经包含 debug snapshot、browser overlay、collider visualization、scene inspector snapshot、asset load state snapshot、GameFlow snapshot、sprite animation snapshot、runtime services snapshot、input action snapshot、collision pair snapshot、audio runtime snapshot、聚合 tooling snapshot、browser tooling panel、assets/game flow/sprite animations/audio runtime/runtime services/input actions/collisions panel section 和 component schema panel section
  - 这一层是引擎包内置开发体验的一部分，用来服务调试面板、场景检查和 runtime 可观测性，不承载可视化编辑器职责

- `examples`
  - 示例项目层
  - 用来放基于引擎运行的样例游戏或 playground
  - 这里的代码不是引擎本体，而是引擎的消费者示例
  - 示例通过 package-style imports 访问引擎 API，本仓库开发时由 Vite alias 和 TypeScript paths 映射回 `src`

## 当前已经实现了什么

当前已经完成了 `0.1.x` 到 `0.30.x` 的连续整理，drag/drop and selection hardening 阶段已经收口。重点已经从“能跑起来”推进到了“可复用、可数据驱动、可检查、可通过 runtime observability 辅助开发、可作为 package 被消费、可支撑轻量 playable browser game prototype”，并补齐了资源加载基线、GameFlow、scene lifecycle 启动边界、package-facing API 边界、sprite animation playback timing 基础、ECS animation component/system、示例级动画集成、动画 runtime 边界文档、deterministic event bus 基线、update-driven scheduler 基线、opt-in scene runtime services 集成模式、runtime services 只读 tooling snapshot、runtime services 边界文档、input action mapping 基线、dodge-blocks input action 集成、input action 只读 tooling snapshot、input action 边界文档、pointer button action binding baseline、browser pointer button bridge baseline、dodge-blocks pointer action consumption、pointer/input runtime boundary closeout、collision pair query baseline、collision pair 只读 tooling snapshot、dodge-blocks collision tooling visibility、collision query runtime boundary closeout、audio data contract baseline、audio runtime service integration、audio runtime 只读 tooling visibility、dodge-blocks audio runtime intent consumption、audio runtime boundary closeout、audio playback adapter contract baseline、audio playback system draining integration、browser audio playback adapter baseline、dodge-blocks opt-in audio playback consumption、camera viewport state、camera world/viewport coordinate conversion、camera bounds/follow clamping、system observability snapshot 强化、runtime debug panel 可读性整理、dodge-blocks runtime observability 集成验证、runtime observability 边界文档、scene config validation baseline、opt-in safe scene bootstrap validation gate、dodge-blocks scene config 消费验证、scene config 边界文档、explicit ViewComponent sync contract、sprite-capable render node capability guard、Node-safe render-types subpath、render/view contract package doc、runtime phase cleanup hardening、Game.tick error boundary contract、runtime ownership boundary、tile map data contract baseline、level spawn/region data primitives、scene config level/map declaration integration、dodge-blocks level config consumption、level/map runtime boundary closeout、normalized directional movement baseline、actor template composition baseline、actor sprite view attachment helper、runtime HUD text helper baseline、tile map layer view baseline、playable example closeout baseline、collect-stars gameplay loop baseline、collect-stars package API consumption hardening、second playable example stage closeout、bounded position clamp helper baseline、gameplay snapshot convention baseline、random position-in-bounds helper baseline、framework extraction closeout、pointer position runtime contract、entity picking baseline、source-target selection state baseline、pour-sort pointer puzzle playable loop、pointer-first puzzle interaction stage closeout、image-backed Leafer sprite adapter baseline、asset loading to render asset handoff、example image asset consumption、sprite rendering package boundary、real sprite / image rendering stage closeout、render scene resize contract、browser resize bridge、pointer local coordinate after resize、example responsive verification、responsive Web runtime stage closeout、selection state helper hardening、entity drag state baseline、source-target action baseline、pointer puzzle example hardening 和 drag/drop and selection stage closeout。

- Core 稳定性
  - `Game`、`Time`、`Scene`、`World`、`Entity`、`Component`、`System` 已经形成基础骨架。
  - 支持 `update / fixedUpdate / lateUpdate`。
  - `Game.tick(...)` 已经明确 update/fixed/late 错误传播和 fixed-step accumulator 结算语义。
  - 支持系统优先级和稳定执行顺序。
  - 支持场景替换、销毁保护、实体安全增删、world 查询，以及系统/组件抛错时的 phase cleanup。

- Framework 复用能力
  - 已有输入系统、浏览器键盘桥接和浏览器 pointer button 桥接。
  - 已有 `InputActionMap`、`defineKeyboardBinding(...)` 和 `definePointerButtonBinding(...)`，可以把物理键盘输入和 pointer button input 映射成 `jump`、`pause`、`move:left`、`select` 这类语义动作，示例玩法也已经改为读取语义动作。
  - `examples/dodge-blocks` 已经把 `confirm` 同时绑定到 keyboard 和 primary pointer button，验证浏览器 pointer bridge 到 semantic action 的消费链路。
  - 已有 `TransformComponent`、`SizeComponent`、`ViewComponent`、`VelocityComponent`，其中 `ViewComponent.syncFromTransform(...)` 已经把 ECS transform/size 到 render node 的同步语义显式化，`isSpriteCapableRenderNode(...)` 可以判断 render node 是否支持 sprite asset application。
  - 已有 `ColliderComponent` 和 `CollisionSystem`，支持 `enter / stay / exit` 语义、layer 过滤和 current/enter/stay/exit collision pair snapshots。
  - 已有 `defineAudioManifest(...)`、`AudioRuntimeState`、`AudioRuntimeSystem`、`addAudioRuntime(...)`、`getAudioRuntime(...)` 和 `createAudioRuntimeState(...)`，支持 Node-safe audio asset/cue/channel 数据契约、scene-owned audio runtime state、channel volume/mute state 和 deterministic play/stop/pause/resume intent records。
  - 已有 `AudioPlaybackAdapter`、`dispatchAudioRuntimeOperation(...)` 和 `drainAudioRuntimeOperations(...)`，可以把 audio runtime intent 以确定顺序交给下游注入的播放 adapter，并返回逐条 `ok/error` 结果。
  - 已有 `AudioPlaybackSystem`、`addAudioPlayback(...)` 和 `getAudioPlayback(...)`，可以在 scene update 中可选 drain audio runtime operations，并保留最近一次 drain 的只读结果副本。
  - 已有 `StateMachine` 和 `GameFlow`，可以把示例里的状态流沉淀成通用能力。
  - 已有 `EventBus`，支持同步确定性的 runtime/gameplay event 发布订阅、one-shot listener、unsubscribe、clear 和事件 envelope sequence。
  - 已有 `RuntimeScheduler`，支持通过 `update(dt)` 推进的一次性延迟任务、重复 interval 任务、cancel、clear 和大步长 catch-up。
  - 已有 `RuntimeServicesSystem`、`addRuntimeServices(...)` 和 `getRuntimeServices(...)`，可以让 scene 可选持有并推进 runtime services。
  - 已有 `CameraSystem`，能驱动 world layer 位移、缩放和跟随实体，提供 copied viewport state、`worldToViewport(...)` / `viewportToWorld(...)` 坐标转换，以及 `setBounds(...)` / `getBounds(...)` / `clearBounds()` bounds clamping。
  - 已有 `AssetRegistry`，支持 typed sprite asset 注册、查找、缺失时报错、异步加载状态、manifest 部分加载结果、sprite frame / animation clip 数据契约和浏览器图片加载适配。
  - 已有 sprite animation playback timing helpers，支持 deterministic advance、loop、non-loop completion、pause/resume/stop 和 frame-level duration override。
  - 已有 `SpriteAnimationComponent` 和 `SpriteAnimationSystem`，可以在 ECS 中推进动画状态，并通过共享 sprite-capable render node 契约把当前 frame 的 sprite asset 应用到 `ViewComponent`。
  - 已有 `defineEntityFactory`，支持把实体创建逻辑从 sample 中抽出来复用。
  - 已有 asset manifest、entity template、scene config、scene config validation、opt-in safe scene bootstrap validation gate、示例级 scene config 消费验证和 component schema registry，开始具备数据驱动内容管线基础。
  - 已有 `TileMap`、`defineTileMap(...)` 和 `createTileMap(...)`，支持 Node-safe tile map 数据契约、tile 查询和 tile/world 坐标换算。
  - 已有 `LevelLayout`、`defineLevelLayout(...)` 和 `createLevelLayout(...)`，支持 Node-safe spawn point、region metadata、区域包含和 tag 查询。
  - `scene config` 已可选声明 `level.tileMap` 和 `level.layout`，并在 bootstrap 结果中返回 `TileMap` / `LevelLayout` helper；这些声明不会自动创建实体、系统、渲染节点、碰撞或编辑器状态。
  - `examples/dodge-blocks` 已消费 scene config level/map 声明，用 `player-start` spawn 和 `playfield` region 配置玩家初始位置、重置位置和移动边界。
  - 已有 [Level/Map Runtime Boundary](docs/level-map.md) 文档，明确 level/map 是运行时数据契约，不是编辑器或内容生产工作流。

- Adapter 和 Runtime
  - 引擎层通过 `RenderAdapter / RenderScene / RenderNode` 隔离渲染实现。
  - `RenderScene` 已有稳定的 `background / world / ui / overlay` layer contract，并通过 Node-safe `@shuangxunian/leafer-game-engine/adapter/render-types` 的 `RENDER_SCENE_LAYER_ORDER` 和 `getRenderSceneLayerNames(...)` 暴露顺序语义。
  - 当前底层已经接入真实 `Leafer`。
  - `createBrowserRuntime(...)` 可以完成浏览器挂载、渲染场景创建和动画帧循环。
  - `runtime.stop()` 已明确只停止 animation frame loop，不销毁 active scene 或 mounted render scene。
  - 已有 `startSceneWithLifecycle(...)`，可以在 scene start 前编排 async prepare / ready / running / failed 边界。
  - 已有 `BrowserAudioPlaybackAdapter`，可以在浏览器 runtime 中按需消费 audio manifest source，并把 audio runtime operations 转成 media element 操作。
  - `examples/dodge-blocks` 已通过 `AudioPlaybackSystem` 和 `BrowserAudioPlaybackAdapter` 可选消费 placeholder audio source，验证从 audio intent 到 browser playback adapter 的下游接入链路。
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
  - 已有 collision pair snapshot 和 `Collisions` panel section，可以只读展示 current/enter/stay/exit 碰撞对摘要。
  - 已有 audio runtime snapshot 和 `Audio Runtime` panel section，可以只读展示 audio system 状态、manifest summary、channel state 和 operation records。
  - 已有 `BrowserToolingPanel`，可以分区展示 runtime debug、assets、game flow、audio runtime、collisions、entity inspector 和 component schema metadata。
  - 已有 entity row selection，可以在浏览器 tooling panel 中选择 entity。
  - 已有 selected entity detail section，可以显示选中实体的状态、组件和 primitive data。
  - 已有 schema-assisted selected component detail，可以结合 component schema 展示字段类型、默认值和当前值。

- 工程验证
  - 当前有覆盖 core、framework、assets、factory、collision、tooling、runtime 的自动测试。
  - 当前测试数为 266 个。
  - `npm run check`、`npm test`、`npm run build:example`、`npm run verify:package` 是当前主要验证入口。

## 当前 examples 的意义

仓库里现在带了两个小游戏样例，并且它们都放在 `examples/` 目录下。它们的目的不是为了“做完整小游戏成品”，而是为了验证下面这些引擎能力是否站得住：

- 场景能不能驱动
- 实体组件模型是否顺手
- 输入系统是否够用
- 渲染适配层和 Leafer 的边界是否合理
- 碰撞和基础玩法逻辑是否能稳定落在框架层
- 状态切换是否能在不污染核心层的情况下实现

所以你可以把当前 examples 理解成：

“这套引擎骨架的下游消费者集成测试样例”

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

如果我们把目标定义为“做前端游戏引擎依赖包”，那接下来的重点不应该继续滑向只读 tooling polish，也不应该在这个仓库里做编辑器，而应该优先补“开发者真的拿它复刻一个简单 4399 小游戏时会缺的基础能力”。

当前已经可以支撑轻量浏览器小游戏原型：有主循环、场景、ECS、输入动作、碰撞查询、GameFlow、资源加载、sprite animation、audio intent/playback、level layout、tile map visual layer、HUD helper、基础 actor composition、相机基础、浏览器 runtime，以及 `dodge-blocks` 与 `collect-stars` 两个 playable loops。它还不是成熟商业引擎，但 `0.24.x` 已经把“复刻一个简单 4399 风格小游戏”的第一轮引擎包能力收口，`0.25.x` 已经证明这些能力可以服务第二种玩法形态。后续如果继续增强，更值得优先投入的是这些方向：

`0.26.x` 的重点不是继续扩大示例数量，而是从这两个 examples 的重复代码和重复语义里谨慎提炼小型 runtime/framework helper。任何提炼都必须保持 package API 边界，不能把示例玩法、编辑器、launcher、gallery 或内容生产流程塞进引擎本体。

1. Playable movement primitives
   - 方向输入转移动向量
   - 斜向移动归一化
   - 简单速度限制和边界限制
   - 从示例里抽掉一部分重复玩法数学

2. Actor / prefab-like runtime helpers
   - 玩家、敌人、投射物、道具、拾取物这类常见实体组合
   - transform / size / view / collider / animation 的轻量组合入口
   - 仍然是代码和 runtime API，不是拖拽搭场景

3. Runtime HUD / game UI helpers
   - 分数、状态、提示、结算 overlay
   - UI 层和 gameplay 层的边界
   - screen-space 节点，不做编辑器 UI

4. Tile / level visual consumption
   - 消费已有 `TileMap` / `LevelLayout`
   - 让地图数据能生成运行时显示层
   - 不做 tile map 编辑器、画刷或保存工作流

5. More playable example pressure tests
   - 在已有 `dodge-blocks` 与 `collect-stars` 之外，继续用小样例验证重复痛点
   - 复用 movement / actor / HUD / tile layer / input / collision / audio / GameFlow 这条链路
   - tooling 保持辅助观察，不抢产品主线

## 当前阶段的一个重要判断

现在这个仓库更准确地说，是：

- 一个 `Leafer` 上的 2D 游戏引擎雏形
- 一个轻量游戏框架原型
- 一个已经具备初步工具链的互动内容运行时底座

它还不是成熟引擎，但已经不只是一次性 demo。  
最重要的事情仍然不是继续堆玩法，而是持续把“可复用能力”从示例中提炼出来，让 `examples/*` 依赖 `src/framework`，让 `src/framework` 依赖 `src/core` 和 `src/adapter`，再让 `src/tooling` 服务调试、检查和开发体验。

如果这条路继续走顺，后面你做第三个、第四个小游戏时，就不再是在“重写一个 demo”，而是在真正使用你自己的引擎。

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
