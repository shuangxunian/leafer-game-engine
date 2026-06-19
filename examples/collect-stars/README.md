# Collect Stars Example

`collect-stars` 是 `leaferGame` 的第二个示例方向，用来验证引擎 API 不只适用于 `dodge-blocks`。

当前版本推进到 `v0.26.4` random position in bounds helper baseline：它已经不只是 shell，可以启动、移动玩家、收集星星、更新分数和倒计时，并在时间结束后重开；同时本地玩法代码已经拆成更接近下游小游戏项目的模块结构，作为第二个 downstream-style playable example 验证引擎 API 不只适用于 `dodge-blocks`。

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
- 使用 `attachActorSpriteView(...)` 装配 player/star 的 sprite-backed render view
- 使用 `randomPositionInBounds(...)` 在 playfield 内生成 star top-left 位置
- 运行时生成 star entity，并通过 `CollisionSystem` 判断收集
- 通过 `getGameplaySnapshot()` 暴露只读 phase、score、remaining time、active star 和 gameplay active state

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
- 不提供可修改玩法状态的 inspector 或 gameplay debugger UI
- 不做 persisted best score、leaderboard、accounts 或 online service
- 不提供编辑器、示例市场、可视化 launcher、资产管理器或内容生产流程

## Stage Closeout

`0.25.x` 已经完成第二示例阶段收口。后续如果继续推进，应优先观察 `dodge-blocks` 与 `collect-stars` 是否暴露出重复痛点，再决定是否提炼新的 runtime/framework helper；不应该为了示例数量扩张而在当前仓库里做 editor、launcher、gallery、marketplace 或内容发布工作流。

`v0.26.2` 对齐了两个 playable examples 的只读 gameplay snapshot 约定。这个 snapshot 仍然属于示例本地玩法系统，用于观察当前玩法循环是否正常，不是 framework 级 scoring/timer API，也不是可修改状态的编辑器入口。

`v0.26.3` 把 player/star 重复的 sprite view 装配切到 framework `attachActorSpriteView(...)`。这只是运行时 view attachment helper，不是 prefab 系统、spawn 系统、编辑器或资源管理器。

`v0.26.4` 把 star top-left 随机位置计算切到 framework `randomPositionInBounds(...)`。这只是 bounds 内 placement math，不是 spawn system、随机表、地图放置引擎或编辑器。
