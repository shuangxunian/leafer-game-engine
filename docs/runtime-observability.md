# Runtime Observability Boundary

## Purpose

`leaferGame` runtime observability is part of the frontend 2D game engine package.

It gives downstream games and engine developers a deterministic way to inspect runtime state while debugging integration issues.

It is not an editor surface, system control panel, component value editor, scene graph editor, asset manager, dashboard product, or content authoring workflow.

## Layers

### Debug Snapshot

`createDebugSnapshot(...)` reads current scene/runtime state and returns plain data:

- scene name
- entity counts
- active/destroyed entity counts
- system count
- system name, registration order, enabled state, started state, destroyed state, priority, and derived lifecycle
- optional time state from `Game`
- optional viewport/layer state from `RenderScene`
- optional asset load state
- optional `GameFlow` state

Snapshot creation is read-only. It does not mutate scenes, worlds, entities, components, systems, assets, render nodes, timers, or input state.

### System Observability

System snapshot rows expose two ordering concepts:

- `order`: registration order assigned by `Scene.addSystem(...)`
- array order: current execution order after priority/order sorting

The derived lifecycle is based on existing runtime flags:

- `pending`: enabled but not started yet
- `running`: enabled and started
- `disabled`: disabled and not destroyed
- `destroyed`: disposed system

This is observation only. Tooling does not enable, disable, reorder, create, or destroy systems.

### Text Formatting

`formatDebugSnapshot(...)` keeps a compact text representation for logs, overlays, tests, and simple debugging output.

It is deterministic and can be tested in Node.

### Browser Tooling Panel Sections

`createRuntimeDebugPanelSection(...)` formats the same runtime debug snapshot into lines that are easier to scan inside `BrowserToolingPanel`.

The Runtime Debug panel section can show:

- scene name
- active/total/destroyed entity counts
- system total
- time/fps/delta/elapsed/fixed-delta state
- viewport and render layers
- asset status counts
- game flow phase
- system order, priority, lifecycle, enabled, started, and destroyed flags

Browser panel section formatting is presentation-only. It does not add mutation controls.

### Aggregate Tooling Snapshot

`createToolingSnapshot(...)` composes runtime debug data with optional read-only sections:

- assets
- game flow
- sprite animations
- input actions
- runtime services
- scene/entity/component inspector data
- component schemas

The aggregate snapshot remains a data composition helper for runtime observability. It is not an editor data model.

### Example Consumption

`examples/dodge-blocks` consumes runtime observability as a downstream-style example:

- passes `runtime.game` into `createToolingSnapshot(...)` for time state
- passes `runtime.renderScene` into `createToolingSnapshot(...)` for viewport/layer state
- mounts `BrowserToolingPanel`
- refreshes read-only panel data on an interval
- detaches the panel when the scene is destroyed

The example proves package consumption and observability integration. It does not become a visual editor.

## Current Limitations

The current runtime observability scope intentionally does not include:

- system enable/disable controls
- system reordering controls
- component value editing
- scene graph editing
- entity creation/deletion controls
- asset browser or asset management UI
- timeline editing
- scripting graph UI
- persistence for tooling panel state
- npm publishing

Those capabilities can be added in future upper-layer projects only if they consume this package as a dependency. They should not turn this repository into an editor product.

## Consumer Guidance

Use `@shuangxunian/leafer-game-engine/tooling` for read-only runtime observability:

```ts
import {
  BrowserToolingPanel,
  createDebugSnapshot,
  createRuntimeDebugPanelSection,
  createToolingSnapshot,
  formatDebugSnapshot
} from "@shuangxunian/leafer-game-engine/tooling";
```

Use runtime observability to debug and verify engine integration. Keep content editing, authoring workflows, asset management, and runtime mutation controls outside this package.
