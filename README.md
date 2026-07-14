# leaferGame

`leaferGame` 是一个基于 `Leafer` 构建的轻量 Web 2D 游戏引擎依赖包。

它面向前端开发者和 AI 编程助手，目标是快速搭建浏览器里的轻量 2D
游戏与互动内容，例如 4399 常见小游戏、微信小游戏风格的指针交互玩法
（排序、分组、灌水瓶、抓取/匹配等）以及基础 galgame / 互动叙事原型。

当前包版本：`1.0.1`。

当前能力基线：`1.0.0` Release Baseline。`1.0.1` 是文档展示更新，用于让 npm
页面同步新版 README。

## 安装

```bash
npm install @shuangxunian/leafer-game-engine
```

包地址：

- npm: https://www.npmjs.com/package/@shuangxunian/leafer-game-engine
- GitHub: https://github.com/shuangxunian/leafer-game-engine

## 这是什么

`leaferGame` 不是一次性 demo，也不是可视化编辑器。它是一套可以被前端
游戏项目通过 `import` 接入的引擎包，核心由 runtime、framework、adapter
和 tooling 几层组成。

它已经提供：

- ECS 风格核心运行时：`Game`、`Scene`、`World`、`Entity`、`Component`、
  `System`、`Time`
- 浏览器 runtime 装配：渲染场景、动画帧循环、resize bridge、scene
  lifecycle helper、可选音频播放 adapter
- 基于 Leafer 的渲染适配层，并约定稳定图层：
  `background`、`world`、`ui`、`overlay`
- 通用玩法 primitives：input action、pointer position、picking、selection、
  drag state、source-target action、碰撞查询、相机、tile map、level layout、
  资源、sprite animation、audio intent、HUD、dialogue choice
- 只读开发者 tooling：debug snapshot、scene inspector snapshot、collision
  snapshot、runtime services snapshot、audio snapshot、input action snapshot 和
  browser tooling panel section
- 面向包 API 的示例：动作躲避、收集玩法、指针优先谜题、对话选择流程

这个仓库明确不做 visual editor、project generator、launcher、gallery、
template marketplace、微信 SDK wrapper、账号系统、广告、变现、统计、发布平台
或内容生产工作流。完整边界见
[docs/product-boundary.md](docs/product-boundary.md)。

## 为什么适合 AI 开发

这个包的结构对 AI 协作很友好：

- 公开入口少，AI 不需要从一个完整应用里反推边界
- `core` / `framework` 大部分能力 Node-safe，玩法逻辑可以脱离 DOM 测试
- 数据结构清晰，组件、选择状态、source-target action、对话、资源、音频意图
  和 tooling snapshot 都容易被 AI 读取、组合和生成
- 浏览器相关能力集中在 `adapter` / `runtime` 边缘层
- 示例覆盖常见生成目标：4399 风格小游戏、收集玩法、灌水瓶/排序类指针谜题、
  dialogue choice / galgame 原型
- package-boundary tests 会约束导入入口、文档、元数据和发布文件，防止路线跑偏
- 具体游戏规则留在下游项目，避免把某个示例玩法写死进引擎

给 AI 或 RAG 使用的详细参考见：
[docs/ai-development-reference.md](docs/ai-development-reference.md)。

## 快速开始

准备一个浏览器挂载点：

```html
<div id="game-root" style="width: 960px; height: 640px"></div>
<script type="module" src="/src/main.ts"></script>
```

启动一个最小场景：

```ts
import {
  Scene,
  SizeComponent,
  TransformComponent,
  ViewComponent,
  createBrowserRuntime
} from "@shuangxunian/leafer-game-engine";
import type {
  RenderAdapter,
  RenderScene
} from "@shuangxunian/leafer-game-engine";

class HelloScene extends Scene {
  constructor(
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene
  ) {
    super("HelloScene");
  }

  protected onStart(): void {
    const title = this.renderAdapter.createText("Hello leaferGame");
    title.x = 40;
    title.y = 40;
    title.fontSize = 28;
    this.renderScene.root.addChild(title);

    const playerNode = this.renderAdapter.createSprite("player");
    this.renderScene.root.addChild(playerNode);

    const player = this.world.createEntity("Player");
    const transform = player.addComponent(new TransformComponent());
    transform.x = 120;
    transform.y = 140;

    player.addComponent(new SizeComponent(52, 52));
    player.addComponent(new ViewComponent(playerNode));
  }
}

const runtime = createBrowserRuntime({
  mount: "game-root",
  resize: true
});

runtime.start(new HelloScene(runtime.renderAdapter, runtime.renderScene));
```

更完整的启动路径，包括 runtime preset、浏览器输入桥接、HUD、scene lifecycle
和音频 runtime 装配，见
[docs/quick-start-game-kit.md](docs/quick-start-game-kit.md)。

## 导入入口

建议按环境选择 subpath import，避免 Node 逻辑测试误拉浏览器 runtime：

| 入口 | 用途 |
| --- | --- |
| `@shuangxunian/leafer-game-engine` | 浏览器侧便捷入口 |
| `@shuangxunian/leafer-game-engine/core` | Node-safe ECS、scene、world、game loop、time |
| `@shuangxunian/leafer-game-engine/framework` | Node-safe 玩法 primitives 和数据契约 |
| `@shuangxunian/leafer-game-engine/tooling` | 只读 snapshot 和 formatter |
| `@shuangxunian/leafer-game-engine/adapter/render-types` | Node-safe 渲染契约和图层 helper |
| `@shuangxunian/leafer-game-engine/adapter` | 浏览器 Leafer render adapter |
| `@shuangxunian/leafer-game-engine/runtime` | 浏览器 runtime 装配和 lifecycle helper |

推荐写法：

```ts
import { Scene, System } from "@shuangxunian/leafer-game-engine/core";
import {
  CollisionSystem,
  InputActionMap
} from "@shuangxunian/leafer-game-engine/framework";
import { createBrowserRuntime } from "@shuangxunian/leafer-game-engine/runtime";
```

完整公开 API 清单见 [docs/public-api.md](docs/public-api.md)。

## 示例

示例是引擎包的下游消费者，不是隐藏框架代码。

- [examples/dodge-blocks](examples/dodge-blocks)：4399 风格躲避 / 生存循环
- [examples/collect-stars](examples/collect-stars)：收集玩法和共享 framework helper
- [examples/pour-sort](examples/pour-sort)：指针优先 source-target 谜题，规则留在示例
- [examples/dialogue-choice](examples/dialogue-choice)：基础对话和选项流程

本地运行：

```bash
npm install
npm run dev
```

构建示例：

```bash
npm run build:example
```

## 文档索引

- [AI Development Reference](docs/ai-development-reference.md)：项目背景、优势、
  公开接口、AI prompt 模板和 RAG 切分建议
- [Public API](docs/public-api.md)：包入口和公开 runtime surface
- [Quick-Start Game Kit](docs/quick-start-game-kit.md)：推荐的下游小游戏装配方式
- [Product Boundary](docs/product-boundary.md)：哪些能力属于当前引擎包，哪些不属于
- [API Stability Audit](docs/api-stability-audit.md)：1.0 package/API 边界和包产物规则
- [Architecture](docs/architecture.md)：分层和依赖方向
- [Project History](docs/project-history.md)：从旧 README 迁出的详细阶段进度和历史说明

专题文档：

- [Animation Runtime](docs/animation-runtime.md)
- [Input Actions](docs/input-actions.md)
- [Level/Map Runtime Boundary](docs/level-map.md)
- [Render/View Contract](docs/render-view-contract.md)
- [Runtime Observability](docs/runtime-observability.md)
- [Runtime Ownership](docs/runtime-ownership.md)
- [Runtime Services](docs/runtime-services.md)
- [Scene Config](docs/scene-config.md)
- [Sprite Rendering](docs/sprite-rendering.md)

## 本地开发

```bash
npm install
npm run check
npm test
npm run build:example
npm run verify:package
npm audit --audit-level=moderate
```

当前仓库不使用 GitHub CI；发布前以本地验证链路和 package-boundary tests 作为
主要质量门。

## License

MIT. See [LICENSE](LICENSE).
