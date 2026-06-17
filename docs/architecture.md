# Leafer 2D Game Framework Architecture

## Design Principle

Leafer is the presentation foundation, not the place where gameplay rules live.

The framework keeps gameplay logic, render mapping, and platform concerns separate so that the codebase can evolve as a reusable frontend game engine package with runtime tooling, replay support, and more than one game project.

## Layering

### 1. Platform

Responsibilities:

- Normalize runtime environment differences
- Provide time, input, storage, audio, and network drivers
- Keep browser or host APIs out of core gameplay logic

### 2. Render Adapter

Responsibilities:

- Translate game world state into render tree operations
- Define stable render interfaces for sprites, text, containers, and scenes
- Host the Leafer-specific implementation

Rules:

- Engine core must not import Leafer directly
- Gameplay code must not manipulate Leafer nodes directly

### 3. Engine Core

Responsibilities:

- Game loop and time management
- Scene lifecycle
- Entity, component, and system orchestration
- Event flow and update scheduling

Stable objects:

- `Game`
- `Scene`
- `World`
- `Entity`
- `Component`
- `System`
- `Time`

### 4. Game Framework

Responsibilities:

- Reusable gameplay-facing modules
- Input collection
- Camera state
- Collision checks
- Animation state helpers
- Asset registration and lookup

This layer should be reusable across multiple games.

### 5. Content

Responsibilities:

- Game-specific scenes
- Characters, maps, UI, rules, and data
- Composition of framework modules into actual gameplay

## Cross-Cutting Layers

### Data

Data should drive:

- scene descriptions
- entity templates
- component configuration
- animation definitions
- gameplay tuning values

### Tooling

Tooling should support:

- debug overlays
- scene inspection
- collision visualization
- runtime stats
- future replay and snapshot support

## Dependency Direction

Use this dependency chain:

`Content -> Framework -> Engine Core -> Render Adapter -> Leafer`

`Content -> Framework -> Engine Core -> Platform`

Never reverse it.

## MVP Scope

The first milestone includes:

- scene management
- entity and component lifecycle
- update and fixed update loops
- camera state
- simple input state
- rectangle collision
- animation state machine shell
- asset registry
- debug stats snapshot

## Current Implementation Strategy

This repository starts with:

- a TypeScript runtime skeleton
- render abstractions
- a placeholder Leafer adapter
- a tiny sample scene proving the flow

The next implementation step is wiring the adapter to real Leafer objects and rendering a playable sample.

## Architecture Improvement Harness

This section turns the current architectural review into an execution harness so the repository can evolve from a playable prototype into a stable, reusable engine skeleton.

### Goal

Move the project from:

- a working prototype

Toward:

- a stable engine core
- a reusable gameplay framework
- a light engine MVP that can support more than one game sample

## Priority Roadmap

### P0 — Stability and correctness first

These items should be completed before expanding gameplay scope.

#### 1. Fix duplicate `System.start()` execution

Problem:

- `Scene.start()` and `Scene.addSystem()` can currently cause a system to start more than once.

Actions:

- adjust scene startup ordering, or
- add internal started protection to `System`

Done when:

- every system starts exactly once per scene lifetime
- systems added during `onStart()` do not initialize twice

#### 2. Prevent duplicate runtime loops

Problem:

- repeated `BrowserRuntime.start()` calls can create more than one `requestAnimationFrame` loop

Actions:

- add `isRunning` state
- guard repeated `start()` calls
- ensure `stop()` always clears runtime state

Done when:

- only one main loop can run at a time
- calling `stop()` fully stops ticking

#### 3. Add safe entity add/remove queues in `World`

Problem:

- direct mutation of `entities` during update will become unsafe as complexity grows

Actions:

- add pending add/remove queues
- flush them at deterministic frame boundaries
- make repeated destroy requests safe

Done when:

- entity creation/destruction during updates does not break iteration
- no skipped or duplicated entity updates occur

#### 4. Define destroy semantics clearly

Problem:

- ownership and cleanup boundaries are not fully explicit across scene, world, entity, component, system, and render objects

Actions:

- document ownership rules
- make high-risk destroy paths idempotent
- verify render nodes and listeners are released correctly

Done when:

- repeated destroy calls are safe
- scene switching does not leave stale nodes or listeners behind

#### 5. Add minimal regression tests for core lifecycle

Actions:

- cover `Game.tick()`
- cover `Scene.start()` lifecycle
- cover single system startup
- cover runtime start/stop
- cover world entity add/remove behavior

Done when:

- core lifecycle regressions can be caught automatically

### P1 — Make the framework reusable

#### 6. Add system priority / ordering

Actions:

- give `System` a priority field
- make execution order explicit instead of relying on registration order

Done when:

- input, movement, collision, and view synchronization can run in predictable order

#### 7. Add world query APIs

Actions:

- support queries such as `getEntitiesWith`, `getEntitiesWithAll`, and `getEntitiesWithAny`
- optionally introduce component-to-entity indexing

Done when:

- framework systems no longer need to manually scan all entities for common queries

#### 8. Add component dependency validation

Actions:

- validate required component dependencies during attach or start
- emit warnings or fail fast for invalid assemblies

Done when:

- missing dependencies like `TransformComponent` for `ViewComponent` are surfaced early

#### 9. Extract reusable gameplay state flow

Actions:

- create a small `StateMachine` or `GameFlow` abstraction
- move common start/pause/run/game-over flow out of example-specific code

Done when:

- a second example can reuse the same state-flow model

#### 10. Separate render layers

Actions:

- define layers such as `backgroundLayer`, `worldLayer`, `uiLayer`, and `overlayLayer`

Done when:

- world objects and UI are no longer mounted into the same generic root without structure

### P2 — Expand engine-facing capabilities

#### 11. Upgrade collision from minimal detection to framework feature

Actions:

- add enter/stay/exit semantics
- add filtering by layer or mask
- later introduce spatial partitioning when needed

#### 12. Evolve view synchronization into a richer presentation model

Actions:

- avoid growing one monolithic `ViewComponent`
- gradually split sprite, text, visibility, animation, and ordering concerns

#### 13. Introduce prefab / template / factory patterns

Actions:

- extract repeated entity assembly into reusable creators
- prepare for data-driven templates later

#### 14. Build a real asset system

Actions:

- resource registration
- preload and caching
- sprite/image lookup by asset id

#### 15. Make camera a real architectural concept

Actions:

- define camera state and viewport behavior
- clarify world-space vs screen-space responsibilities

### P3 — Tooling and long-term maintainability

#### 16. Add runtime debug tooling

Targets:

- fps and dt
- entity counts
- active scene
- collider visualization
- input state

#### 17. Establish a broader automated test strategy

Targets:

- core
- framework
- collision
- runtime
- lifecycle transitions

#### 18. Define stable public API boundaries

Actions:

- separate stable public API from internal and experimental modules
- ensure examples consume intended public entry points

## Suggested Delivery Schedule

### Week 1 — Stabilize the skeleton

Focus:

- fix duplicate system startup
- fix duplicate runtime loops
- add safe world add/remove queues
- define destroy semantics
- add first lifecycle tests

Expected outcome:

- a reliable engine prototype skeleton

### Week 2 — Make it reusable

Focus:

- add system priority
- add world query APIs
- add component dependency checks
- extract a reusable state machine
- split render layers

Expected outcome:

- a framework that is no longer only demo-oriented

### Month 1 — Reach lightweight engine MVP

Focus:

- upgrade collision semantics
- introduce prefab/factory patterns
- add a real asset system
- make camera operational
- add debug tooling
- expand tests

Expected outcome:

- a lightweight engine MVP capable of supporting multiple game prototypes

## Top 5 Immediate Tasks

If only a small number of changes can be done next, prioritize:

1. fix `Scene` / `System` lifecycle duplication
2. fix duplicate runtime loop creation
3. add safe world entity mutation queues
4. add system priority
5. add world query APIs

## Implementation Principle

As the engine evolves, each new general-purpose capability should move from `examples/` into `src/framework/` or `src/core/` whenever possible.

Desired direction:

- `examples/` becomes thinner
- `src/framework/` becomes richer
- `src/core/` stays small, stable, and strict

That is the practical boundary between a demo repository and an engine repository.

## v0.0.2 Lifecycle Invariants

As of `v0.0.2`, the core runtime should follow these rules:

- `Scene` owns `System` lifecycle
- `World` owns `Entity` membership
- `Entity` owns `Component` lifecycle
- `ViewComponent` owns the render node passed into it
- browser input bridges or other host listeners must have an explicit detach point

Operational rules:

- one system should only initialize once per scene lifetime
- one runtime should only drive one main loop at a time
- entity add/remove during frame execution should be deferred and flushed at deterministic phase boundaries
- destroy paths should be safe to call more than once
- scene switching should not leave stale listeners or render nodes behind

Concrete semantics:

- a destroyed `Scene` is terminal and should not be started again
- `runtime.stop()` pauses ticking but does not implicitly destroy the active scene
- `runtime.start(scene)` with a different scene replaces and destroys the previous active scene
- entities created during an update phase join the world after the outermost phase finishes
- entities destroyed during an update phase become inactive immediately and are fully removed at the next flush point
