# leaferGame

`leaferGame` 是一个基于 `Leafer` 构建的 2D 游戏引擎雏形项目。

这个项目当前的目标，不是单纯做一个小游戏 demo，也不是把 Leafer 当成“直接写玩法”的画布库来用，而是尝试建立一套清晰、可成长、可复用的游戏运行时结构，让它未来可以逐步演进成真正可持续开发的游戏引擎或游戏框架。

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

- [examples/dodge-blocks](/Users/shuangxunian/code/leaferGame/examples/dodge-blocks)

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
  CollisionSystem
} from "@shuangxunian/leafer-game-engine/framework";
```

职责：

- 输入桥接
- 基础变换
- 视图同步
- 速度运动
- 碰撞声明和碰撞检测

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
  ColliderDebugSystem,
  createDebugSnapshot,
  createSceneInspectorSnapshot,
  createToolingSnapshot
} from "@shuangxunian/leafer-game-engine/tooling";
```

职责：

- 浏览器调试 overlay
- 碰撞盒可视化
- runtime debug snapshot
- scene/entity inspector snapshot
- 面向工具面板的聚合 snapshot

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
- `BrowserDebugOverlay`
- `createToolingSnapshot`

这批 API 已经足够搭出一个最小的 2D 游戏原型。

## 开源协议

当前项目使用 `MIT` 协议，见 [LICENSE](/Users/shuangxunian/code/leaferGame/LICENSE)。

## 项目定位

我希望把 `leaferGame` 做成一套建立在 `Leafer` 之上的 2D 游戏层能力，核心思想是：

- `Leafer` 负责渲染、显示对象、交互基础能力
- `leaferGame` 负责游戏循环、场景切换、实体组件、输入、碰撞、玩法系统
- 具体游戏内容只建立在引擎能力之上，不直接把核心规则写死在 `Leafer` 节点里

换句话说，这个项目更像是：

- 用 `Leafer` 作为渲染和显示底座
- 在它上面抽象出自己的游戏运行时
- 最终形成一套适合做 2D 小游戏、互动内容、可视化玩法、带编辑器潜力的游戏引擎

这也是这个仓库和普通 demo 最大的区别。

## 为什么基于 Leafer 来做

选择 `Leafer`，不是因为它已经是一个完整成熟的游戏引擎，而是因为它很适合做“游戏引擎底座”：

- 它本身有比较强的 2D 图形能力
- 它有清晰的显示对象体系
- 它适合互动内容、画布应用、编辑器场景
- 它天然适合“图形系统”和“工具系统”结合

这意味着它特别适合承载下面这些方向：

- 2D 小游戏
- UI 和玩法混合较多的互动应用
- 棋牌、解谜、经营、卡牌、轻动作游戏
- 带关卡编辑器或可视化编辑能力的项目

但也正因为如此，我们不能把 `Leafer` 直接当作游戏逻辑层来写。  
如果未来想让这套东西真正可演化，就必须把“渲染”和“游戏规则”分开。

## 当前设计原则

这个项目现在遵循一个非常关键的原则：

`Leafer 只做表现层底座，游戏规则不直接写进 Leafer 节点。`

这样做的好处是：

- 后续更容易替换渲染实现
- 更容易做调试工具和编辑器
- 更容易做数据驱动
- 更容易做回放、存档、状态同步
- 更容易把玩法代码沉淀成真正可复用的框架能力

更完整的架构说明可以看：

- [架构设计文档](/Users/shuangxunian/code/leaferGame/docs/architecture.md)

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
  - 当前的聚合导出入口
  - 它代表未来发布到 npm 时更接近包入口的形态
  - 后续可以继续细化成正式的 `exports`

- `src/tooling`
  - 调试和开发辅助能力
  - 当前内容还很少，但未来这里应该逐步增加调试面板、运行时信息、可视化检查能力

- `examples`
  - 示例项目层
  - 用来放基于引擎运行的样例游戏或 playground
  - 这里的代码不是引擎本体，而是引擎的消费者示例

## 当前已经实现了什么

虽然现在仓库还只是第一阶段，但已经具备了一些明确的“引擎骨架”能力：

- 基础主循环
  - 已有 `Game` 和 `Time`，可以驱动 `update / fixedUpdate / lateUpdate`

- 运行时解耦
  - 当前已经把浏览器运行时和示例游戏入口拆开
  - 引擎入口保留在 `src/runtime`
  - 页面运行入口改到了 `examples/`
  - 这一步是未来把引擎作为 npm 依赖发布的前置整理

- 场景系统
  - 已有 `Scene` 和 `World`
  - 支持场景初始化、系统注册、实体更新

- 实体组件模型
  - 已有 `Entity + Component + System`
  - 目前是轻量组件式设计，不是重 ECS
  - 这样更直观，也更适合先快速演进

- 渲染适配层
  - 引擎层并不直接依赖具体玩法里的渲染细节
  - 已经通过 `RenderAdapter / RenderScene / RenderNode` 做了边界抽象
  - 当前底层实现接到了真实 `Leafer`

- 输入系统
  - 已有浏览器键盘桥接
  - 支持持续按下和边沿触发
  - 这对开始、暂停、重开一类状态切换很重要

- 基础玩法能力
  - 位置、尺寸、速度、碰撞、视图同步等已经有了最小实现

- 示例游戏状态流
  - 当前示例已经不是静态样板
  - 它有开始、运行、暂停、结算这些基本状态
  - 但请注意，这部分的意义主要是“验证引擎分层是否合理”，不是为了把 demo 打磨成最终产品

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

## 这个项目接下来更应该做什么

如果我们把目标定义为“做游戏引擎”，那接下来的重点确实不应该是继续打磨 demo 外观，而应该逐步补齐真正属于引擎的能力。

我认为下一阶段更值得优先投入的是这些方向：

1. 资源系统
   - 图片加载
   - 资源缓存
   - 精灵帧和动画资源管理

2. 更稳定的碰撞与物体系统
   - `ColliderComponent`
   - 统一碰撞检测入口
   - 可视化调试碰撞盒

3. 数据驱动能力
   - 场景配置
   - 实体模板
   - 组件配置
   - 为未来编辑器打基础

4. 更明确的游戏状态管理
   - 把当前 demo 里的状态流经验沉淀成框架级能力
   - 比如通用 `StateMachine`、`GameFlow`、`UIScreen` 模型

5. 工具链
   - 调试信息面板
   - 场景树检查
   - 运行时实体查看
   - 碰撞区域开关显示

6. 地图和关卡能力
   - TileMap
   - 触发器
   - 出生点和区域管理

7. 编辑器友好结构
   - 让运行时结构天然适合未来做编辑器桥接

## 当前阶段的一个重要判断

现在这个仓库更准确地说，还是：

- 一个 `Leafer` 上的 2D 游戏引擎雏形
- 一个轻量游戏框架原型
- 一个引擎架构试验田

它还不是成熟引擎，但方向已经明确了。  
最重要的事情不是继续堆玩法，而是持续把“可复用能力”从示例中提炼出来，慢慢让 `examples/*` 依赖 `src/framework`，再让 `src/framework` 依赖 `src/core` 和 `src/adapter`，而不是反过来。

如果这条路走顺了，后面你做第二个、第三个小游戏时，就不再是在“重写一个 demo”，而是在真正使用你自己的引擎。

## 关于未来发布到 npm

如果未来要把 `leaferGame` 当成依赖发布到 npm，那么现在这类结构调整是必须的。

理想状态下，未来应该形成这样的关系：

- 引擎包本身提供通用能力
  - `core`
  - `framework`
  - `adapter`
  - `runtime`

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
