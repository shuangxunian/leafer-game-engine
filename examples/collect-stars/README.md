# Collect Stars Example

`collect-stars` 是 `leaferGame` 的第二个示例方向，用来验证引擎 API 不只适用于 `dodge-blocks`。

当前版本推进到 `v0.25.3` package API consumption hardening：它已经不只是 shell，可以启动、移动玩家、收集星星、更新分数和倒计时，并在时间结束后重开；同时本地玩法代码已经拆成更接近下游小游戏项目的模块结构。

## Current Scope

- 通过 `examples/main.ts?example=collect-stars` 启动
- 使用 `@shuangxunian/leafer-game-engine` package-style imports
- 创建 `CollectStarsScene`
- 安装 `InputSystem` 和 `CollisionSystem`
- 从 boot path 挂载 `BrowserKeyboardBridge`
- 使用 `InputActionMap` 读取 movement / confirm 语义动作
- 使用 `limitMovementVector(...)` 保持斜向移动速度一致
- 将 input actions、player controller、actor templates 和 gameplay system 拆成示例本地模块
- 使用 `defineActorTemplate(...)` 和 `instantiateEntityTemplate(...)` 创建 player/star ECS 数据
- 使用 `GameFlow` 管理 ready / running / ended phase
- 使用 `createHudText(...)` 创建 screen-space HUD
- 使用 `createTileMap(...)` 和 `createTileMapLayerView(...)` 创建 world-space playfield visual layer
- 运行时生成 star entity，并通过 `CollisionSystem` 判断收集

## Controls

- `move:left`：`A` 或方向左键
- `move:right`：`D` 或方向右键
- `move:up`：`W` 或方向上键
- `move:down`：`S` 或方向下键
- `confirm`：`Space` 或 `Enter`

## Not In This Version

- 不生成 hazards
- 不接入 audio cues
- 不接入 tooling panel
- 不做 persisted best score、leaderboard、accounts 或 online service
- 不提供编辑器、示例市场、可视化 launcher、资产管理器或内容生产流程

## Next Step

后续 `v0.25.4` 会做第二示例 docs/stage closeout，重点说明两个 playable examples 共同证明了哪些 engine-package 能力，以及哪些能力仍然不应该进入当前仓库。
