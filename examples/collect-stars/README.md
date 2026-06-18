# Collect Stars Example

`collect-stars` 是 `leaferGame` 的第二个示例方向，用来验证引擎 API 不只适用于 `dodge-blocks`。

当前版本还是 `v0.25.1` shell baseline，不是完整小游戏。它只负责证明第二个示例可以被本地 example route 启动、可以通过 package-style imports 消费引擎能力、可以创建 scene / HUD / tile-backed playfield，并且可以进入浏览器 build。

## Current Scope

- 通过 `examples/main.ts?example=collect-stars` 启动
- 使用 `@shuangxunian/leafer-game-engine` package-style imports
- 创建 `CollectStarsScene`
- 安装基础 `InputSystem`
- 使用 `GameFlow` 记录 shell phase
- 使用 `createHudText(...)` 创建 screen-space HUD
- 使用 `createTileMap(...)` 和 `createTileMapLayerView(...)` 创建 world-space playfield visual layer

## Not In This Version

- 不包含完整 gameplay loop
- 不生成 collectibles
- 不实现 score、timer、hazards、win/lose 状态
- 不接入 audio cues
- 不接入 tooling panel
- 不提供编辑器、示例市场、可视化 launcher、资产管理器或内容生产流程

## Next Step

`v0.25.2` 会在这个 shell 上补 collection/chase gameplay loop，让它和 `dodge-blocks` 的躲避下落物玩法区分开。
