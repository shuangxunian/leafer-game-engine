# Runtime Ownership Boundary

`leaferGame` runtime ownership rules are part of the frontend 2D game engine package contract.

They explain which object creates, starts, stops, or destroys runtime resources when a browser game consumes `@shuangxunian/leafer-game-engine`.

This document is not an editor architecture, app-shell lifecycle model, visual debugger lifecycle, project manager, save/load format, or content publishing workflow.

---

## Core Ownership

### Game

`Game` owns:

- the active `Scene`
- fixed-step accumulator state
- `Time` progression
- scene replacement through `setScene(...)`

When `Game.setScene(nextScene)` receives a different scene, it destroys the previous active scene before starting the next scene.

When `Game.setScene(sameScene)` receives the current scene again, it does not destroy or recreate the scene. If the scene is not started yet, it starts it.

`Game.tick(deltaSeconds)` advances the active scene. Runtime errors from update hooks propagate to the caller; `Game` does not swallow them, restart scenes, or install global error handlers.

### Scene

`Scene` owns:

- systems registered on the scene
- the `World`
- scene start/destroy flags

`Scene.destroy()` destroys systems and the world. It is idempotent.

Scenes can optionally own external resources, such as a `RenderScene`, if downstream code passes those resources into the scene and documents that ownership. In that case the scene should release those resources in `destroy()`.

### World, Entity, Component, System

`World` owns its entities and deferred entity mutation queues.

`Entity` owns its components.

`System` and `Component` own only their own lifecycle state and any resources they explicitly create.

Runtime phase cleanup is guaranteed even when systems or components throw during `update(...)`, `fixedUpdate(...)`, or `lateUpdate(...)`; errors still propagate.

---

## Browser Runtime Ownership

`createBrowserRuntime(...)` creates:

- a `Game`
- a `RenderAdapter`
- a mounted `RenderScene`
- an animation frame loop

The returned browser runtime owns the animation frame loop.

`runtime.start(scene)`:

- calls `game.setScene(scene)`
- resets frame timing
- starts the animation frame loop

`runtime.stop()`:

- stops the animation frame loop
- does not destroy the active scene
- does not destroy the mounted render scene
- does not clear game time, assets, systems, or tooling state

This makes `stop()` a pause/teardown-of-loop operation, not a full runtime disposal API.

If a downstream game needs full disposal, it should explicitly stop the runtime and then destroy the owned scene/render resources according to its own ownership model.

---

## Render Scene Ownership

`RenderScene` owns renderer-level resources such as the mounted Leafer instance and render layers.

`RenderScene.destroy()` releases renderer-level resources.

The default browser runtime creates and mounts a `RenderScene`, but it does not automatically destroy it in `runtime.stop()`.

A downstream game should choose one explicit owner:

- scene-owned render scene: pass the `RenderScene` into a scene and destroy it from `Scene.destroy()`
- app-owned render scene: stop the runtime and destroy the `RenderScene` from app-level teardown
- test-owned render scene: use a fake or injected render adapter and assert lifecycle calls directly

Avoid implicit shared ownership. If both app code and scene code call `renderScene.destroy()`, the render adapter should tolerate idempotent cleanup where possible, but downstream code should still keep ownership explicit.

---

## Tooling Ownership

`tooling` APIs are read-only runtime observability helpers.

They can read:

- game time and active scene state
- scene/system/entity/component snapshots
- render scene viewport/layer state
- asset, input action, sprite animation, runtime services, and game-flow state

They should not own, start, stop, destroy, or mutate runtime resources.

Browser tooling panels can keep local UI state such as selection or expanded rows, but that state remains read-only navigation over runtime snapshots. It is not scene editing, component editing, asset management, or content authoring.

---

## Error Ownership

Runtime errors belong to the caller that drives the runtime.

The engine guarantees cleanup of internal phase flags and accumulator state where documented, but it does not hide errors by default.

Downstream games can decide whether to:

- let errors surface to browser/dev tooling
- catch errors around `runtime.start(...)` or manual `game.tick(...)`
- show their own error UI
- stop the loop and destroy resources explicitly

Those policies are application-level decisions, not hidden engine behavior.

---

## Package Guidance

Use `@shuangxunian/leafer-game-engine/runtime` or the root entrypoint for browser runtime assembly.

Use `@shuangxunian/leafer-game-engine/core` for Node-safe game loop, scene, world, entity, component, system, and time primitives.

Use `@shuangxunian/leafer-game-engine/tooling` for read-only runtime observability.

Keep editor products, content authoring workflows, asset managers, scene graph mutation UI, and publishing workflows outside this package.
