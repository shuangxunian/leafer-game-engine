# Product Development Playbook

这是一套适合在早期项目里反复使用的推进方法：

**先定产品定位，再写 PRD/路线图，再拆版本迭代；每个版本都先出文档，再开发、测试、提交。**

它的目标不是让项目变慢，而是让项目在快速推进时不散架。

---

## Core Idea

每个项目都同时需要三种视角：

- **产品视角**：这个东西最终想变成什么，它解决什么问题。
- **工程视角**：当前代码怎么一步步接近那个目标。
- **迭代视角**：下一步到底做什么，做到哪里算完成。

这套流程用文档把三者连起来：

```text
Product Positioning
  -> PRD / Roadmap
  -> Stage Plan
  -> Version Task Doc
  -> Implementation
  -> Verification
  -> Git Commit
```

---

## 1. Product Positioning First

在开始大量写代码之前，先回答：

- 这个项目一句话是什么？
- 它不是为了做什么？
- 它的目标用户是谁？
- 它最终希望长成什么形态？
- 它和普通 demo、脚本、一次性项目有什么区别？
- 如果项目成功，代码结构应该支持哪些长期能力？

推荐输出：

- `docs/roadmap.md`
- 或者 `docs/product-positioning.md`

这份文档不要写成任务清单，而要写成“项目为什么存在”的说明。

### Template

```md
# Project Roadmap

## One Sentence Definition

`project-name` wants to become ...

## Product Vision

This project is not only ...

It should eventually support ...

## Target Users

- ...
- ...

## Product Layers

1. Core layer
2. Framework layer
3. Tooling layer
4. Example / application layer

## Long-Term Capabilities

- ...
- ...

## Current Gap

The current repo already has ...

It still lacks ...
```

---

## 2. PRD / Roadmap After Positioning

产品定位决定“方向”，PRD/路线图决定“阶段”。

这一层要把长期愿景拆成可落地阶段，而不是直接拆成零碎 issue。

推荐思路：

- `v0.1.x`：最小骨架
- `v0.2.x`：核心闭环
- `v0.3.x`：框架能力
- `v0.4.x`：调试与工具化
- `v0.5.x`：数据驱动/内容管线
- `v0.6.x`：编辑器/工具面板基础

版本号不必机械递增，可以根据项目节奏决定。大的阶段用 `v0.2.0`、`v0.3.0` 这种文档定方向，小的交付用 `v0.2.1`、`v0.2.2` 拆任务。

### Stage Doc Template

```md
# project-name v0.3.0

## Version Positioning

`v0.3.0` starts the next stage:

**Stage Name**

## Why This Stage

Previous stages completed ...

The next bottleneck is ...

## Stage Goals

- ...
- ...

## Suggested Patch Split

- `v0.3.1`
  - ...
- `v0.3.2`
  - ...
- `v0.3.3`
  - ...

## Scope Boundaries

This stage should include:

- ...

This stage should not include:

- ...

## Done When

- ...
- tests pass
- docs are updated
```

---

## 3. Docs First For Every Version

每个小版本先写文档，再写代码。

这一步非常重要，因为它会提前回答：

- 这次版本到底做什么？
- 什么明确不做？
- 哪些行为要保持兼容？
- 做完之后怎么验证？

推荐文件：

```text
docs/version/v0.3.1.md
docs/version/v0.3.2.md
docs/version/v0.3.3.md
```

### Version Doc Template

```md
# project-name v0.3.1

## Version Positioning

`v0.3.1` is the first delivery pass of `0.3.x`:

**Feature / Capability Name**

## Goals

After this version, the project should support:

- ...
- ...

## Scope

This version includes:

- ...

This version does not include:

- ...

## Semantics

- Existing behavior should ...
- New behavior should ...
- Future work should ...

## Done When

- ...
- tests pass
- example/build passes if relevant
```

---

## 4. Implementation Loop

每个版本按同一个循环推进：

```text
1. Inspect current code and docs
2. Write version doc
3. Update roadmap/stage links
4. Implement the smallest stable slice
5. Add or update tests
6. Update examples / README when behavior changes
7. Run verification commands
8. Inspect git diff
9. Commit with a clear message
```

这个循环的价值是：每一轮都能停在一个可解释、可测试、可提交的状态。

---

## 5. Development Rules

推荐默认规则：

- 每一版只解决一个主题。
- 不把“未来肯定需要”塞进当前版本。
- 优先做纯函数和可测试边界，再接 UI/运行时。
- 示例项目只验证集成，不把引擎能力写死在示例里。
- 文档要写清楚“不做什么”，这比写“做什么”更能防止失控。
- 如果改了用户可见行为，README 或 example docs 要同步。
- 如果新增能力，至少要有一个测试证明它的边界。

---

## 6. Testing And Verification

每个项目可以定义自己的验证命令。

TypeScript / frontend 项目常见组合：

```bash
npm run check
npm test
npm run build
```

如果有 example：

```bash
npm run build:example
```

如果是文档-only 改动，可以不强行跑完整测试，但提交说明里要清楚写明是 docs-only。

### Verification Checklist

- type check passed
- unit tests passed
- example build passed
- README/docs updated
- no unrelated files in git diff
- generated files are intentional

---

## 7. Git Commit Discipline

每个版本完成后提交一次。

推荐 commit message：

```text
feat: add runtime snapshot formatting for v0.4.1
feat: add browser tooling panel for v0.6.2
docs: add product development playbook
fix: keep player inside viewport
```

提交前一定看：

```bash
git status --short
git diff --stat
git diff
```

原则：

- 不提交无关文件。
- 不提交本地 IDE 配置，除非项目明确需要。
- 不把多个版本混在一个 commit。
- 不在没验证的情况下提交功能代码。

---

## 8. Version Numbering Guidance

版本号服务于沟通，不服务于仪式感。

推荐：

- `v0.2.0`：阶段规划文档，不一定包含大量代码。
- `v0.2.1`：阶段内第一个交付切片。
- `v0.2.2`：阶段内第二个交付切片。
- `v0.3.0`：进入下一个大阶段。

不要强迫每个阶段都正好 5 个 patch。阶段应该根据产品和工程边界自然结束。

判断是否该进入下一阶段：

- 当前阶段的核心目标已经可以被示例或测试证明。
- 继续加功能会开始偏离当前主题。
- 下一批工作需要新的产品定位或架构边界。

---

## 9. Good Iteration Size

一个好的版本切片通常满足：

- 1 到 6 个核心文件改动。
- 1 份版本文档。
- 1 到 5 个测试。
- 可以用一句话解释。
- 可以独立回滚。
- 做完后项目状态明显更清晰。

如果一个版本开始包含很多主题，应该拆。

---

## 10. When Working With An AI Coding Agent

可以直接这样给指令：

```text
先 review 当前项目和文档，规划下一步。
```

```text
按你说的来，先出版本文档，再实现。
```

```text
继续推进，记得补充好文档，做完提交到 git。
```

```text
review 一下 README，要说明现在做到哪里了。
```

AI 协作时最好让它保持这个顺序：

```text
inspect -> plan/doc -> implement -> test -> diff review -> commit -> summarize next step
```

不要一开始就让它“直接大改”。先让它理解产品定位和当前阶段，后面的代码质量会高很多。

---

## 11. Definition Of Done

一个版本可以算完成，当它满足：

- 文档说明了版本定位、范围、非范围和完成标准。
- 代码实现了文档里的最小目标。
- 测试覆盖了关键行为。
- 示例或 README 反映了用户可见变化。
- 验证命令通过。
- git diff 没有无关改动。
- commit message 能说明这个版本做了什么。

---

## 12. Why This Works

这套方法的核心不是“多写文档”。

它真正解决的是早期项目最容易遇到的几个问题：

- 写着写着不知道项目到底是什么。
- 功能越加越散，代码没有产品方向。
- 每次都想做太大，结果没有稳定提交点。
- README 永远落后于实际代码。
- 测试只在坏掉以后才补。
- demo 和框架边界混在一起。

用这套流程之后，每次推进都会留下三样东西：

- 一个更清晰的产品判断。
- 一个更稳定的工程切片。
- 一个可以继续往下走的版本锚点。

这就是它最值钱的地方。
