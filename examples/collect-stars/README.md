# Collect Stars Example

`collect-stars` 是 `leaferGame` 的第二个示例方向，用来验证引擎 API 不只适用于 `dodge-blocks`。

当前版本推进到 `v0.25.2` gameplay loop baseline：它已经不只是 shell，可以启动、移动玩家、收集星星、更新分数和倒计时，并在时间结束后重开。

## Current Scope

- 通过 `examples/main.ts?example=collect-stars` 启动
- 使用 `@shuangxunian/leafer-game-engine` package-style imports
- 创建 `CollectStarsScene`
- 安装 `InputSystem` 和 `CollisionSystem`
- 从 boot path 挂载 `BrowserKeyboardBridge`
- 使用 `InputActionMap` 读取 movement / confirm 语义动作
- 使用 `limitMovementVector(...)` 保持斜向移动速度一致
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

后续 `v0.25.3` 会继续硬化第二示例的 package API consumption，优先观察是否真的需要从 collect-stars 提炼新的 framework helper。
