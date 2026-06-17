# Product Boundary

## 一句话定位

`leaferGame` 是一个可以被前端项目安装和接入的轻量 2D 游戏引擎依赖包。

它的直接用户是前端开发者、互动内容开发者和小游戏开发者，而不是使用可视化工具制作内容的最终编辑器用户。

## 本仓库要做什么

本仓库应该持续沉淀这些通用引擎能力：

- `core`：主循环、时间、场景、实体、组件、系统和生命周期。
- `framework`：输入、碰撞、相机、GameFlow、资源、sprite animation、实体工厂、场景配置和组件 schema。
- `adapter`：把引擎抽象映射到具体渲染实现，例如 Leafer。
- `runtime`：浏览器环境下的启动、挂载、帧循环和 scene lifecycle 装配。
- `tooling`：runtime snapshot、debug overlay、inspector snapshot、panel section、schema/asset/game-flow 状态展示等开发者辅助能力。
- `examples`：作为下游消费者样例，验证引擎 API、包边界和集成方式。

## 本仓库不做什么

本仓库不是编辑器项目，也不应该在这里实现：

- 可视化场景编辑器。
- 资产管理器或素材浏览器。
- 拖拽搭场景、关卡编辑、时间轴编辑。
- 面向非开发者的内容生产工作流。
- 内容发布、项目管理、编辑器插件市场等产品层能力。

这些能力以后可以做，但应该属于另一个上层项目或独立 package，而不是当前引擎包本体。

## Tooling 和编辑器的边界

`tooling`、`inspector`、`debug panel` 在本仓库中的定义是：

**开发者辅助能力，用来观察 runtime 状态、验证数据、定位问题。**

它们可以读取和展示：

- runtime debug snapshot
- scene/entity/component inspector data
- asset loading state
- GameFlow state
- component schema metadata
- sprite animation playback/debug state
- runtime services state
- input action mapping and live action state

它们不应该在当前仓库中变成：

- 内容编辑入口
- 可视化 authoring UI
- 运行时内容修改器
- 资产导入/整理工具
- 关卡制作工具

即使 `tooling` 包含选择、展开、过滤或分区展示等交互，它也只服务“看清楚 runtime 发生了什么”，不负责修改场景、组件、资源或关卡内容。

如果未来的独立编辑器需要这些数据，它应该通过本包暴露的稳定 runtime、schema、snapshot、asset、scene config 和 tooling API 来消费，而不是把编辑器实现放回这个仓库。

## 判断一个需求是否属于本仓库

可以用下面几个问题判断：

- 它是否能被多个游戏项目复用？
- 它是否属于 runtime、framework、adapter、tooling 或 package API 的基础能力？
- 它是否能通过测试验证，而不是依赖某个具体编辑器界面？
- 它是否让下游项目更容易接入引擎，而不是把本仓库变成内容生产工具？

如果答案大多是“是”，它大概率属于本仓库。

如果需求主要是拖拽、编排、资源管理、关卡制作、可视化编辑或发布工作流，它应该进入未来的独立编辑器项目。
