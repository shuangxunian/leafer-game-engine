# leaferGame 产品路线图

## 文档目的

这份文档不讨论某一个 demo，也不只讨论当前仓库已经完成的代码。

它描述的是：

**`leaferGame` 这个产品在理想情况下希望成长成什么样子。**

也就是说，这是一份面向“产品完全形态”的路线图文档，用来统一下面几个问题：

- 我们到底想做的是一个什么产品
- 这个产品解决什么问题
- 它和普通小游戏 demo、普通画布项目、普通 Leafer 示例有什么区别
- 它未来应该具备哪些完整能力
- 当前仓库离这个目标还差哪些关键阶段

---

## 一句话定义

`leaferGame` 期望成为：

**一套建立在 Leafer 之上的、面向 2D 互动内容与小游戏开发的前端轻量游戏引擎依赖包。**

它不是单纯的渲染封装，也不是只服务单个项目的玩法代码仓库。

这里的“依赖包”是产品边界关键词：`leaferGame` 的主要交付物应该被前端游戏项目通过 `import` 消费，而不是作为一个打开后进行内容制作的编辑器应用来使用。

它的目标是同时具备：

- 游戏运行时能力
- 可复用的框架能力
- 可扩展的只读 runtime observability / developer tooling 能力
- 可被前端项目稳定接入的 package/API 边界

它不是编辑器项目，也不以在本仓库内实现可视化编辑器为目标。

这里的 `tooling`、`inspector`、`debug panel` 都指引擎包的只读开发者辅助能力，用来提高 runtime 可观测性和调试效率；它们不是可视化编辑器、属性编辑器、资产管理器或关卡制作工具，也不应该写回 scene、component、asset、level 或 input binding。

如果未来要做编辑器，那应该是另一个上层项目或独立 package，作为 `leaferGame` 的消费者存在。当前仓库只负责提供清晰、稳定、可调试的运行时与数据接口。

所以路线图里出现的“工具”“检查器”“schema”“资源”“地图”“音频”“配置”等词，都默认按引擎依赖包解释：它们要么是 runtime/framework 能力，要么是只读 observability，要么是数据契约与校验。它们不代表当前仓库要进入编辑器、资源管理器、关卡制作器或内容发布系统。

完整边界说明见 [Product Boundary](product-boundary.md)。

---

## 产品愿景

### 我们希望最终得到的不是一个 demo

我们希望最终得到的是一套可以支持下面这些事情的产品：

- 快速搭建一个 2D 小游戏
- 快速搭建一个互动型画布应用
- 快速实现带 UI 与玩法混合逻辑的内容项目
- 快速沉淀第二个、第三个、第四个项目的共用能力
- 逐步沉淀数据驱动、只读调试工具、资源运行时管理和运行时复用这些引擎包能力

换句话说，`leaferGame` 的理想形态不是：

- 一个“写完这个 demo 就结束”的代码库

而是：

- 一个“能持续支撑新内容生产”的底层产品

---

## 产品定位

从长期看，`leaferGame` 的定位应该分成四层：

### 1. 轻量 2D 游戏引擎

负责：

- 主循环
- 场景切换
- 实体与组件
- 系统调度
- 输入
- 碰撞
- 动画与时间控制
- 资源运行时注册、加载和查询
- 相机
- 调试信息

### 2. 互动内容框架

除了传统游戏能力，还要能很好支撑：

- UI 和玩法混合较重的项目
- 交互式内容页面
- 叙事型互动内容
- 卡牌、解谜、经营、棋牌、轻动作等 2D 内容
- 带业务规则与可视化状态切换的应用

### 3. 数据驱动与运行时诊断基础

架构上要适合承接：

- 配置化场景
- 实体模板
- 组件 schema
- 资源声明
- 状态流建模
- 只读 runtime diagnostics
- package-facing inspection data

### 4. 多项目复用平台

最终它不应该只服务一个 sample，而应该做到：

- 多个项目共用同一套 core/framework
- 具体内容项目以 npm 依赖或 workspace package 的形式接入
- 示例项目只是消费者，不是引擎本体

---

## 目标用户

`leaferGame` 长期想服务的并不只是“传统游戏程序”。

它更适合下面几类用户：

### 1. 前端开发者

这类用户希望：

- 用 TypeScript 开发 2D 互动项目
- 不想直接上特别重的商业游戏引擎
- 希望把前端工程能力和游戏逻辑结合起来

### 2. 互动内容开发者

这类用户更关心：

- 场景切换
- UI 与玩法组合
- 状态机
- 配置驱动
- 内容项目开发效率

### 3. 小团队或个人开发者

这类用户希望：

- 快速做原型
- 快速验证玩法
- 把一个项目里的能力沉淀到下一个项目

### 4. 未来外部上层产品（非当前仓库目标）

未来如果真的开发可视化编辑器、资源管理器、关卡制作器或内容发布系统，它们应该是 `leaferGame` 之上的独立项目，而不是当前引擎包本体。

这类项目不是当前仓库的直接目标用户，只是潜在的下游消费者。它们可以复用：

- runtime snapshot
- scene/entity/component runtime inspection data
- component schema
- asset manifest
- scene config

但当前仓库的直接用户仍然是前端开发者、互动内容开发者、小团队和个人开发者；当前仓库交付的是依赖包，不交付编辑器应用。

因此，当前仓库可以沉淀稳定的数据契约，但不应该以未来编辑器为规划中心，也不应该在这里实现编辑器 UI、资产面板、拖拽编排、关卡制作或发布工作流。`inspector` 在本仓库里只表示只读 runtime inspection，不表示组件属性编辑面板。凡是需要创建、修改、保存、发布或管理内容资产的能力，都应该拆到未来独立上层项目。

---

## 完全形态下的产品结构

在理想状态下，`leaferGame` 应该至少由以下几个层次组成。

---

### 一、Engine Core：引擎核心层

这是整个产品最底层、最稳定的部分。

职责包括：

- `Game`
  - 主循环驱动
  - 时间步进管理
  - 场景切换入口
- `Scene`
  - 生命周期管理
  - 系统装配
  - 内容初始化边界
- `World`
  - 实体容器
  - 查询系统
  - 生命周期转发
- `Entity`
  - 组件挂载
  - 激活/销毁状态
- `Component`
  - 数据与局部行为承载
- `System`
  - 跨实体的统一行为模块
- `Time`
  - `deltaTime`
  - `fixedDelta`
  - 时间缩放
  - 暂停控制

完全形态要求：

- 生命周期严格可控
- 更新顺序明确
- 支持安全增删实体
- 支持 query/index
- 支持事件/消息桥接
- 支持调试快照

---

### 二、Framework：通用游戏框架层

这一层不是最底层骨架，但应该成为“多项目复用能力中心”。

理想能力包括：

#### 1. 输入系统

- 键盘输入
- 鼠标输入
- Pointer/Touch 输入
- 持续输入与边沿触发
- 输入映射（action map）
- 输入录制与回放基础

#### 2. 变换与运动系统

- 位置
- 旋转
- 缩放
- 速度
- 加速度
- 阻尼
- 轨迹运动

#### 3. 碰撞系统

- AABB 碰撞
- layer / mask
- trigger / solid
- enter / stay / exit
- 空间分区优化
- 可视化碰撞盒调试

#### 4. 相机系统

- 世界坐标与屏幕坐标分离
- 跟随
- 偏移
- 缩放
- 抖动
- 镜头边界
- 多层 parallax 支持

#### 5. 动画系统

- 帧动画
- 状态驱动动画
- tween / easing
- 时间轴控制
- 过渡与混合基础

#### 6. 资源系统

- 图片加载
- 音频加载
- 资源缓存
- atlas / sprite frame
- preload
- 资源注册与查找

#### 7. 状态流系统

- 通用状态机
- 游戏流程控制
- UI 状态切换
- 暂停/恢复/重开
- 关卡流转

#### 8. 数据驱动能力

- 实体模板
- 场景配置
- 组件参数配置
- 数值调优配置
- 动画/碰撞/关卡配置

完全形态要求：

- 第二个项目开始时，大部分基础玩法能力都不需要重写
- example 层只负责“组合”，framework 层负责“沉淀”

---

### 三、Adapter：渲染适配层

这一层负责把引擎抽象映射到 Leafer。

理想状态下，它应该：

- 屏蔽具体 Leafer 节点细节
- 提供稳定的渲染接口
- 让 core/framework 不直接依赖 Leafer
- 为未来替换渲染底座留下可能性

理想能力包括：

- scene / layer / node 抽象
- sprite / text / container 抽象
- 可见性、透明度、层级、锚点、缩放、旋转
- 纹理/资源绑定
- 动画节点支持
- 命中测试与交互桥接

完全形态要求：

- 游戏逻辑永远不直接操作原始 Leafer 节点
- Adapter 是明确边界，不是“薄薄一层占位代码”

---

### 四、Runtime：运行时装配层

这一层负责把引擎真正跑起来。

理想能力包括：

- 浏览器挂载
- 帧循环驱动
- 输入桥接
- 资源初始化
- 环境能力装配
- 调试面板装配
- 多 runtime 扩展准备

长期看，runtime 不应该只局限于浏览器最小启动。

它应该能逐步承接：

- browser runtime
- preview runtime
- headless test runtime

---

### 五、Tooling：只读 Runtime Observability 层

这是产品完全形态里非常重要的一层，但它仍然属于引擎依赖包的开发者辅助能力，不是编辑器产品入口。

因为 `leaferGame` 如果只停留在“能写代码做小游戏”，那它只是轻量框架；
如果它还能提供运行时调试、状态检查和数据验证，那它才更像一个真正可复用的前端游戏引擎包。

这一层默认只读：可以观察、格式化、筛选、展开和辅助定位 runtime 状态，但不写回 scene、entity、component、asset、level、input binding 或项目文件。

理想工具能力包括：

#### 1. 调试面板

- FPS
- dt / fixed dt
- active scene
- entity 数量
- system 执行状态
- 碰撞检测统计
- 输入状态可视化

#### 2. 场景检查器

- 当前 scene 树
- entity 列表
- component 列表
- system 列表
- layer 结构

#### 3. 可视化覆盖层

- collider 边框
- camera 范围
- path / waypoint
- 触发器区域
- 锚点和原点

#### 4. 快照与回放工具

- 运行时状态快照
- 输入录制
- 回放调试
- bug 复现支持

#### 5. 开发辅助工具

- prefab 检查
- 资源引用检查
- scene 配置校验
- 性能告警

不属于这一层的能力包括：

- 可视化场景编辑
- 组件属性改值
- 资产管理器或素材浏览器
- 关卡制作、tile painting 或拖拽编排
- 内容保存、发布或项目管理工作流

---

### 六、Package-facing 能力：面向接入方的稳定边界

这一层不是编辑器 UI，而是让引擎包更容易被项目、示例、测试和未来上层工具消费。

理想能力包括：

- prefab / template
- scene schema
- component schema
- property metadata
- 可序列化状态
- runtime snapshot
- public API 稳定性
- 文档化的数据结构

长期目标不是“在引擎仓库里顺便做编辑器”，而是：

**这套引擎包本身足够清晰稳定，未来可以被独立工具或编辑器项目消费。**

---

## 产品完全形态下的典型使用方式

理想状态下，一个使用者做新项目时，大概应该是这样的体验：

1. 创建一个新前端项目
2. 安装 `leaferGame`
3. 创建一个场景配置或场景类
4. 用 prefab / template 创建玩家、敌人、障碍、UI
5. 注册资源与输入映射
6. 启动 runtime
7. 借助 debug tooling 调试
8. 逐步迭代玩法，而不是重复搭底层

也就是说，开发者应该主要在做：

- 内容组合
- 参数调优
- 玩法设计
- 资源组织

而不是每次都重写：

- 主循环
- 输入系统
- 碰撞系统
- 状态切换
- 资源加载
- 调试面板

---

## 产品与普通 demo 的根本区别

一个普通 demo 项目通常是：

- 为了证明一个想法能跑
- 代码结构高度服务当前样例
- 很多东西写死在场景里
- 下一次换项目时难以复用

而 `leaferGame` 想成为的产品应该是：

- 先为“可复用能力”设计
- 再为当前 sample 服务
- 把通用能力从 sample 中持续抽出
- 让新项目复用越来越多，而不是重复造轮子

这是最关键的产品边界。

---

## 阶段性产品目标

为了到达“完全形态”，可以把路线拆成几个阶段。

---

### 阶段 A：引擎骨架成立

目标：

- 有稳定主循环
- 有 scene/world/entity/component/system
- 有基本 runtime
- 有基础渲染适配
- 有一个 sample 证明链路可跑通

判定标准：

- 这不是单点 demo，而是已经有了引擎骨架

---

### 阶段 B：多项目可复用能力成立

目标：

- 输入、碰撞、运动、状态流沉淀到 framework
- world query 与生命周期稳定
- 示例项目开始变薄
- framework 逐渐变厚

判定标准：

- 第二个 sample 可以明显复用第一阶段沉淀出的能力

---

### 阶段 C：轻量引擎 MVP 成立

目标：

- 资源系统可用
- 相机系统可用
- collision 语义完整
- prefab/template 初步可用
- 调试 tooling 初步可用

判定标准：

- 可以稳定支撑多个小型 2D 原型项目

---

### 阶段 D：数据驱动与工具友好形态成立

目标：

- 数据驱动能力增强
- schema 明确
- scene / prefab 可配置化
- runtime 调试能力增强
- 支持更强的内容生产流程

判定标准：

- 项目不再只是“代码框架”，而是具备稳定的引擎包 API、数据接口和 runtime tooling

---

### 阶段 E：产品完全形态

理想中的完全形态包括：

- 稳定的 core
- 丰富的 framework
- 明确的 adapter 边界
- 成熟的 runtime 装配
- 完整的 debug tooling
- 稳定的数据驱动配置与 public API
- 多项目复用能力
- 可发布、可接入、可扩展的产品化形态

到这个阶段，`leaferGame` 应该能被看作：

**一个面向 2D 互动内容与小游戏开发的轻量引擎平台。**

---

## 我们不追求什么

为了让路线清晰，也要明确不追求什么。

`leaferGame` 的目标不一定是：

- 做成一个重型 3D 引擎
- 和 Unity / Unreal 在全维度竞争
- 一开始就追求极致性能和工业级大世界能力
- 服务所有游戏类型

它更适合聚焦：

- 2D
- 小中型项目
- 互动内容
- 前端生态友好
- 数据驱动和 runtime tooling
- 开发效率与结构清晰度

---

## 成功标准

如果未来我们说 `leaferGame` 做成功了，我认为至少应该满足下面这些标准：

### 技术上

- 能支撑多个不同 sample，而不是只服务一个 demo
- 通用能力沉淀在 framework/core，不散落在 examples
- 生命周期、渲染边界、输入、碰撞、状态流都稳定
- 具备可调试、可维护、可演进的结构

### 产品上

- 新项目接入成本低
- 能明显加快 2D 互动项目原型开发速度
- 使用者可以把精力更多放在内容和玩法上
- 有稳定的只读调试工具、数据接口和多项目复用能力

### 组织上

- 文档清楚
- API 边界清楚
- 示例项目能承担“最佳实践”的作用
- 架构方向长期一致，不因单个 demo 偏航

---

## 路线图原则

最后，用几条原则总结这份 roadmap：

1. **先做稳定骨架，再做丰富功能**
2. **先抽通用能力，再扩 demo 内容**
3. **先保证边界清晰，再追求功能堆叠**
4. **examples 是消费者，不是引擎本体**
5. **framework 负责复用，core 负责稳定，adapter 负责隔离，runtime 负责装配，tooling 负责只读观测和调试效率**
6. **所有结构设计都要服务当前引擎包边界；未来编辑器只能作为独立上层项目消费这些接口**
7. **inspector/debug panel 是 runtime 开发辅助，不是编辑器产品入口**

---

## 当前到目标之间的核心差距

从当前仓库状态到“产品完全形态”，中间至少还差这些关键能力：

- 更稳定的生命周期管理
- 更完整的 framework 复用层
- 更正式的资源系统
- 更真实的 camera 和 collision 体系
- 更强的数据驱动能力
- 更系统的只读 runtime observability / developer tooling
- 更明确的 public API 和 package 接入边界
- 更成熟的测试与 API 管理

这并不意味着当前方向错了。

恰恰相反，这说明：

**当前仓库已经有了一个正确的起点，接下来要做的是持续把“引擎产品形态”从原型里提炼出来。**

---

## 近期执行版本

当前已经完成 `0.8.x` resource loading baseline，并进入 `0.9.x` Game Flow And Scene Lifecycle 收口：

- [v0.9.0](version/v0.9.0.md)
- [v0.9.1](version/v0.9.1.md)
- [v0.9.2](version/v0.9.2.md)
- [v0.9.3](version/v0.9.3.md)
- [v0.9.4](version/v0.9.4.md)
- [v0.9.5](version/v0.9.5.md)

这一阶段的重点不是扩玩法，也不是在本仓库里做编辑器，而是把通用游戏流程和 scene lifecycle 作为引擎包能力补出来：

- framework-level `GameFlow`
- start / running / pause / resume / end / reset 语义
- 示例作为消费者迁移到通用 flow
- flow state tooling visibility
- scene loading / ready / running 边界
- 最小回归测试落地

下面是此前已经执行过的版本链，作为阶段记录保留：

- [v0.2.0](version/v0.2.0.md)

这个版本开始不再沿用 `v0.0.x` 的文档命名，而是用更接近阶段里程碑的 minor 版本：

- `0.1.x` 对应稳定骨架
- `0.2.x` 对应框架复用能力
- `0.3.x` 对应 engine-facing 能力扩张

其中 `0.2.x` 当前建议拆成两个 patch 批次：

- [v0.2.1](version/v0.2.1.md)
- [v0.2.2](version/v0.2.2.md)

下一阶段建议进入：

- [v0.3.0](version/v0.3.0.md)

其中第一批建议先做：

- [v0.3.1](version/v0.3.1.md)

接着建议进入：

- [v0.3.2](version/v0.3.2.md)

再下一步建议进入：

- [v0.3.3](version/v0.3.3.md)

随后建议进入：

- [v0.3.4](version/v0.3.4.md)

最后补齐：

- [v0.3.5](version/v0.3.5.md)

完成 `0.3.x` 后，下一阶段建议进入：

- [v0.4.0](version/v0.4.0.md)

第一批建议先做：

- [v0.4.1](version/v0.4.1.md)

接着建议进入：

- [v0.4.2](version/v0.4.2.md)

再下一步建议进入：

- [v0.4.3](version/v0.4.3.md)

最后收口：

- [v0.4.4](version/v0.4.4.md)

完成 `0.4.x` 后，下一阶段建议进入：

- [v0.5.0](version/v0.5.0.md)

其中第一批建议先做：

- [v0.5.1](version/v0.5.1.md)

接着建议进入：

- [v0.5.2](version/v0.5.2.md)

再下一步建议进入：

- [v0.5.3](version/v0.5.3.md)

随后建议进入：

- [v0.5.4](version/v0.5.4.md)

最后收口：

- [v0.5.5](version/v0.5.5.md)

完成 `0.5.x` 后，下一阶段建议进入：

- [v0.6.0](version/v0.6.0.md)

其中第一批建议先做：

- [v0.6.1](version/v0.6.1.md)

接着建议进入：

- [v0.6.2](version/v0.6.2.md)

再下一步建议进入：

- [v0.6.3](version/v0.6.3.md)

随后建议进入：

- [v0.6.4](version/v0.6.4.md)

最后收口：

- [v0.6.5](version/v0.6.5.md)

完成 `0.6.x` 后，下一阶段建议进入：

- [v0.7.0](version/v0.7.0.md)

其中第一批建议先做：

- [v0.7.1](version/v0.7.1.md)

接着建议进入：

- [v0.7.2](version/v0.7.2.md)

再下一步建议进入：

- [v0.7.3](version/v0.7.3.md)

随后建议进入：

- [v0.7.4](version/v0.7.4.md)

最后收口：

- [v0.7.5](version/v0.7.5.md)

完成 `0.7.x` 后，下一阶段建议进入：

- [v0.8.0](version/v0.8.0.md)

其中第一批建议先做：

- [v0.8.1](version/v0.8.1.md)

接着建议进入：

- [v0.8.2](version/v0.8.2.md)

再下一步建议进入：

- [v0.8.3](version/v0.8.3.md)

随后建议进入：

- [v0.8.4](version/v0.8.4.md)

最后收口：

- [v0.8.5](version/v0.8.5.md)

完成 `0.8.x` 后，下一阶段建议进入：

- [v0.9.0](version/v0.9.0.md)

其中第一批建议先做：

- [v0.9.1](version/v0.9.1.md)

接着建议进入：

- [v0.9.2](version/v0.9.2.md)

再下一步建议进入：

- [v0.9.3](version/v0.9.3.md)

随后建议进入：

- [v0.9.4](version/v0.9.4.md)

最后收口：

- [v0.9.5](version/v0.9.5.md)

完成 `0.9.x` 后，下一阶段建议进入：

- [v0.10.0](version/v0.10.0.md)

其中第一批建议先做：

- [v0.10.1](version/v0.10.1.md)

接着建议进入：

- [v0.10.2](version/v0.10.2.md)

再下一步建议进入：

- [v0.10.3](version/v0.10.3.md)

随后建议进入：

- [v0.10.4](version/v0.10.4.md)

最后收口：

- [v0.10.5](version/v0.10.5.md)

完成 `0.10.x` 后，下一阶段建议进入：

- [v0.11.0](version/v0.11.0.md)

其中第一批建议先做：

- [v0.11.1](version/v0.11.1.md)

接着建议进入：

- [v0.11.2](version/v0.11.2.md)

再下一步建议进入：

- [v0.11.3](version/v0.11.3.md)

随后建议进入：

- [v0.11.4](version/v0.11.4.md)

最后收口：

- [v0.11.5](version/v0.11.5.md)

完成 `0.11.x` 后，下一阶段建议进入：

- [v0.12.0](version/v0.12.0.md)

其中第一批建议先做：

- [v0.12.1](version/v0.12.1.md)

接着建议进入：

- [v0.12.2](version/v0.12.2.md)

再下一步建议进入：

- [v0.12.3](version/v0.12.3.md)

随后建议进入：

- [v0.12.4](version/v0.12.4.md)

最后收口：

- [v0.12.5](version/v0.12.5.md)

完成 `0.12.x` 后，下一阶段建议进入：

- [v0.13.0](version/v0.13.0.md)

其中第一批建议先做：

- [v0.13.1](version/v0.13.1.md)

接着建议进入：

- [v0.13.2](version/v0.13.2.md)

再下一步建议进入：

- [v0.13.3](version/v0.13.3.md)

最后收口：

- [v0.13.4](version/v0.13.4.md)

完成 `0.13.x` 后，下一阶段建议进入：

- [v0.14.0](version/v0.14.0.md)

其中第一批建议先做：

- [v0.14.1](version/v0.14.1.md)

接着建议进入：

- [v0.14.2](version/v0.14.2.md)

再下一步建议进入：

- [v0.14.3](version/v0.14.3.md)

最后收口：

- [v0.14.4](version/v0.14.4.md)

完成 `0.14.x` 后，下一阶段建议进入：

- [v0.15.0](version/v0.15.0.md)

其中第一批建议先做：

- [v0.15.1](version/v0.15.1.md)
- [v0.15.2](version/v0.15.2.md)
- [v0.15.3](version/v0.15.3.md)
- [v0.15.4](version/v0.15.4.md)

完成 `0.15.x` 后，下一阶段建议进入：

- [v0.16.0](version/v0.16.0.md)

其中第一批建议先做：

- [v0.16.1](version/v0.16.1.md)
- [v0.16.2](version/v0.16.2.md)
- [v0.16.3](version/v0.16.3.md)
- [v0.16.4](version/v0.16.4.md)

完成 `0.16.x` 后，下一阶段建议进入：

- [v0.17.0](version/v0.17.0.md)

其中第一批建议先做：

- [v0.17.1](version/v0.17.1.md)
- [v0.17.2](version/v0.17.2.md)
- [v0.17.3](version/v0.17.3.md)
- [v0.17.4](version/v0.17.4.md)

完成 `0.17.x` 后，下一阶段建议进入：

- [v0.18.0](version/v0.18.0.md)

其中第一批建议先做：

- [v0.18.1](version/v0.18.1.md)
- [v0.18.2](version/v0.18.2.md)
- [v0.18.3](version/v0.18.3.md)
- [v0.18.4](version/v0.18.4.md)
- [v0.18.5](version/v0.18.5.md)

完成 `0.18.x` 后，下一阶段建议进入：

- [v0.19.0](version/v0.19.0.md)

其中第一批建议先做：

- [v0.19.1](version/v0.19.1.md)

接着建议进入：

- [v0.19.2](version/v0.19.2.md)

再下一步建议进入：

- [v0.19.3](version/v0.19.3.md)

最后收口：

- [v0.19.4](version/v0.19.4.md)

完成 `0.19.x` 后，下一阶段建议进入：

- [v0.20.0](version/v0.20.0.md)

其中第一批建议先做：

- [v0.20.1](version/v0.20.1.md)

接着建议进入：

- [v0.20.2](version/v0.20.2.md)

最后收口：

- [v0.20.3](version/v0.20.3.md)

完成 `0.20.x` 后，下一阶段建议进入：

- [v0.21.0](version/v0.21.0.md)

其中第一批建议先做：

- [v0.21.1](version/v0.21.1.md)

接着建议进入：

- [v0.21.2](version/v0.21.2.md)

再下一步建议进入：

- [v0.21.3](version/v0.21.3.md)

最后收口：

- [v0.21.4](version/v0.21.4.md)

完成 `0.21.x` 后，下一阶段建议进入：

- [v0.22.0](version/v0.22.0.md)

其中第一批建议先做：

- [v0.22.1](version/v0.22.1.md)

下一步建议继续：

- [v0.22.2](version/v0.22.2.md)

随后进入：

- [v0.22.3](version/v0.22.3.md)

最后收口：

- [v0.22.4](version/v0.22.4.md)

`0.22.x` 已完成 audio playback adapter 阶段：Node-safe adapter contract、scene/system draining、browser runtime adapter、dodge-blocks opt-in playback consumption 和非编辑器/非 mixer 边界都已文档化并测试。

完成 `0.22.x` 后，下一阶段建议进入：

- [v0.23.0](version/v0.23.0.md)

这一阶段建议优先补齐 camera runtime contract：

- camera viewport/world coordinate conversion
- camera bounds and follow clamping
- read-only camera tooling visibility
- dodge-blocks camera consumption and boundary closeout

其中第一批建议先做：

- [v0.23.1](version/v0.23.1.md)

下一步建议继续：

- [v0.23.2](version/v0.23.2.md)

随后进入：

- [v0.23.3](version/v0.23.3.md)

`v0.23.3` 的 camera read-only tooling visibility 已记录但暂缓。它仍然属于只读 runtime observability，不是编辑器；但在当前产品对齐后，下一阶段优先回到“能做出可玩小游戏”的 framework/runtime 能力。

完成 `v0.23.2` 后，下一阶段建议进入：

- [v0.24.0](version/v0.24.0.md)

这一阶段建议优先补齐 playable 2D game kit：

- normalized directional movement
- actor/prefab-like gameplay composition helpers
- runtime HUD/game UI helpers
- tile/level visual consumption
- stronger playable example closeout

其中第一批建议先做：

- [v0.24.1](version/v0.24.1.md)

下一步建议继续：

- [v0.24.2](version/v0.24.2.md)

随后进入：

- [v0.24.3](version/v0.24.3.md)

下一步建议继续：

- [v0.24.4](version/v0.24.4.md)

`0.24.x` 最后建议收口：

- [v0.24.5](version/v0.24.5.md)

完成 `0.24.x` 后，下一阶段建议进入：

- [v0.25.0](version/v0.25.0.md)

这一阶段建议优先增加第二个 playable example，验证现有 framework/runtime 能力不是 dodge-blocks 专用。

其中第一批建议先做：

- [v0.25.1](version/v0.25.1.md)

下一步建议继续：

- [v0.25.2](version/v0.25.2.md)

继续硬化第二示例的 package API consumption：

- [v0.25.3](version/v0.25.3.md)

收口第二个 playable example 阶段：

- [v0.25.4](version/v0.25.4.md)

完成两个 playable examples 后，下一阶段建议从重复痛点反推 framework extraction：

- [v0.26.0](version/v0.26.0.md)

第一批从两个示例重复移动边界逻辑开始：

- [v0.26.1](version/v0.26.1.md)

下一步对齐两个示例的只读 gameplay snapshot 约定：

- [v0.26.2](version/v0.26.2.md)

继续从 actor/view 装配重复代码中抽取小型 runtime helper：

- [v0.26.3](version/v0.26.3.md)

继续审计 runtime spawn/random placement 重复逻辑：

- [v0.26.4](version/v0.26.4.md)

`0.26.x` 最后建议收口：

- [v0.26.5](version/v0.26.5.md)

完成 `0.26.x` framework extraction 后，下一阶段建议用 pointer-first / UI-heavy 小游戏继续压力测试引擎包边界：

- [v0.27.0](version/v0.27.0.md)

第一批先补 pointer position runtime contract：

- [v0.27.1](version/v0.27.1.md)

继续补 pointer-first 小游戏常用的命中测试 / picking baseline：

- [v0.27.2](version/v0.27.2.md)

继续补 source-target selection state pattern，让点选来源再点目标的规则游戏有轻量状态基础：

- [v0.27.3](version/v0.27.3.md)

继续补第三个 pointer-first puzzle example shell，用路由和示例骨架验证已有 pointer/picking/selection 能力：

- [v0.27.4](version/v0.27.4.md)

继续把 pointer puzzle shell 做到可玩闭环，但规则仍留在 example-owned 代码里：

- [v0.27.5](version/v0.27.5.md)

收口 `0.27.x` pointer-first puzzle interaction 阶段，记录已经抽出的 pointer/picking/selection helper、example-owned puzzle rules，以及 galgame / 互动叙事仍待后续专门补齐：

- [v0.27.6](version/v0.27.6.md)

完成 pointer-first puzzle baseline 后，下一阶段建议补 1.0 前必须完成的真实 sprite / image rendering，让 asset `source` 能真正抵达 Leafer render node：

- [v0.28.0](version/v0.28.0.md)

第一批先补 Leafer adapter 的 image-backed sprite baseline：

- [v0.28.1](version/v0.28.1.md)

下一步补 asset loading 到 render asset 的明确 handoff：

- [v0.28.2](version/v0.28.2.md)

继续用示例证明 source-backed sprite asset consumption：

- [v0.28.3](version/v0.28.3.md)

继续补 sprite rendering 的 package-facing 边界文档：

- [v0.28.4](version/v0.28.4.md)

收口 `0.28.x` real sprite / image rendering 阶段：

- [v0.28.5](version/v0.28.5.md)

完成 real sprite / image rendering baseline 后，下一阶段建议补 responsive Web runtime，让容器尺寸变化、viewport 状态和 pointer 坐标转换在桌面和 mobile-ish 视口下保持一致：

- [v0.29.0](version/v0.29.0.md)

第一批先补 render scene resize contract：

- [v0.29.1](version/v0.29.1.md)

第二批补 opt-in browser resize bridge：

- [v0.29.2](version/v0.29.2.md)

第三批补 resize 后 pointer local coordinate helper：

- [v0.29.3](version/v0.29.3.md)

第四批补 example responsive verification：

- [v0.29.4](version/v0.29.4.md)

收口 `0.29.x` responsive Web runtime 阶段：

- [v0.29.5](version/v0.29.5.md)

完成 responsive Web runtime baseline 后，下一阶段建议补 drag/drop and selection hardening，让选择、拖拽、source-target action 这类 pointer-first puzzle 交互更容易复用：

- [v0.30.0](version/v0.30.0.md)

第一批先补 selection state helper hardening：

- [v0.30.1](version/v0.30.1.md)

第二批补 entity drag state baseline：

- [v0.30.2](version/v0.30.2.md)

第三批补 source-target action baseline：

- [v0.30.3](version/v0.30.3.md)

第四批补 pointer puzzle example hardening：

- [v0.30.4](version/v0.30.4.md)

收口 `0.30.x` drag/drop and selection hardening 阶段：

- [v0.30.5](version/v0.30.5.md)

完成 drag/drop and selection baseline 后，下一阶段建议补 UI / dialogue / scene flow，让 galgame / 互动叙事原型也有轻量 package-facing 基础：

- [v0.31.0](version/v0.31.0.md)

第一批先补 dialogue text / choice data contract baseline：

- [v0.31.1](version/v0.31.1.md)

第二批补 choice state helper baseline：

- [v0.31.2](version/v0.31.2.md)

第三批补 screen-space prompt view baseline：

- [v0.31.3](version/v0.31.3.md)

第四批补 narrative example shell and route baseline：

- [v0.31.4](version/v0.31.4.md)

第五批补 narrative example playable flow：

- [v0.31.5](version/v0.31.5.md)

收口 `0.31.x` UI / dialogue / scene flow 阶段：

- [v0.31.6](version/v0.31.6.md)

### `0.32.x` Quick-Start Game Kit 阶段

目标：

- 减少搭建一个新 Web 小游戏时反复复制的 scene boot glue
- 把 input、pointer、HUD、audio、runtime services 这类通用装配路径逐步收束成小而明确的 package-facing helper
- 让示例继续像下游游戏，而不是像引擎内部测试夹具

边界：

- 只做 runtime/framework/package-facing convenience
- 不做 project generator、CLI scaffold、visual editor、launcher、gallery、template marketplace、WeChat SDK wrapper、账号/广告/变现/发布流程
- 不把具体玩法规则、水排序规则、match-3 规则、galgame story format 或内容生产流程放进引擎包

第一批补 scene input bridge bundle baseline：

- [v0.32.0](version/v0.32.0.md)

第二批补 scene runtime preset baseline：

- [v0.32.1](version/v0.32.1.md)

第三批补 scene quick-start bundle baseline：

- [v0.32.2](version/v0.32.2.md)

第四批补 HUD text bundle baseline：

- [v0.32.3](version/v0.32.3.md)
