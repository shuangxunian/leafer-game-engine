# Public API Inventory

This document describes the current package-facing API boundary for `@shuangxunian/leafer-game-engine`.

The project is a frontend 2D game engine dependency package. It is not an editor package.

`0.10.x` completed the first package-facing API boundary baseline: entrypoints are documented, Node-safe imports are smoke-tested, package artifacts can be verified, and examples use package-style imports during local development.

`0.11.x` closed the sprite animation runtime baseline: the Node-safe `framework` entrypoint includes sprite animation data contracts, deterministic playback timing helpers, and ECS animation component/system behavior. The Node-safe `tooling` entrypoint exposes read-only sprite animation state.

For the animation-specific boundary across asset metadata, playback helpers, ECS behavior, render application, example consumption, and read-only tooling visibility, see [Sprite Animation Runtime Boundary](animation-runtime.md).

`0.12.x` closed the runtime services baseline with a Node-safe `EventBus` for deterministic gameplay/runtime event dispatch, a Node-safe `RuntimeScheduler` for update-driven delayed/repeated tasks, opt-in scene integration through `RuntimeServicesSystem`, and read-only runtime services visibility through `/tooling`.

For the runtime-services boundary across event dispatch, update-driven scheduling, scene integration, and read-only tooling visibility, see [Runtime Services Boundary](runtime-services.md).

`0.13.x` closed the input actions baseline with a Node-safe `InputActionMap`, keyboard binding normalization helpers, action-state queries that work with the existing `InputSystem`, downstream-style example consumption in `examples/dodge-blocks`, and read-only input action visibility through `/tooling`.

For the input-actions boundary across raw input state, keyboard bindings, action maps, example consumption, and read-only tooling visibility, see [Input Actions Boundary](input-actions.md).

`0.14.x` closed runtime observability hardening. The Node-safe `tooling` entrypoint now exposes more explicit read-only system debug snapshot fields, including system registration order, destroyed state, and a derived lifecycle label. Browser tooling panel section helpers also format Runtime Debug rows for clearer read-only scanning without adding mutation controls.

For the runtime-observability boundary across debug snapshots, system lifecycle state, text formatting, browser panel section formatting, aggregate tooling snapshots, and example consumption, see [Runtime Observability Boundary](runtime-observability.md).

`0.15.x` closed data-driven scene contract hardening. The Node-safe `framework` entrypoint now exposes `validateSceneConfig(...)` so downstream games can inspect scene config diagnostics before bootstrap mutates a scene, asset registry, entity list, or system list. `bootstrapSceneFromConfig(...)` also supports an opt-in `validateBeforeBootstrap` safety gate for callers that want validation diagnostics returned before any scene/entity/system/asset mutation, and `examples/dodge-blocks` now consumes that scene config path for static asset/entity declarations.

For the scene-config boundary across asset manifests, entity templates, validation diagnostics, safe bootstrap, example consumption, and non-editor data-contract limits, see [Scene Config Boundary](scene-config.md).

`0.16.x` closed render/view contract hardening. The Node-safe `framework` entrypoint exposes `ViewComponent.syncFromTransform(...)` as an explicit ECS-to-render-node sync method while preserving existing `lateUpdate(...)` behavior, and `isSpriteCapableRenderNode(...)` as a reusable guard for render nodes that can accept sprite assets. The Node-safe `adapter/render-types` entrypoint exposes `RENDER_SCENE_LAYER_ORDER` and `getRenderSceneLayerNames(...)` for stable render layer ordering.

For the render/view boundary across render nodes, view synchronization, sprite-capable nodes, render scene layers, lifecycle, and read-only tooling visibility, see [Render/View Contract](render-view-contract.md).

`0.17.x` closed runtime/game loop hardening. The `core` runtime now guarantees that scene/world phase cleanup runs even when systems or components throw during `update(...)`, `fixedUpdate(...)`, or `lateUpdate(...)`; those errors still propagate to callers. `Game.tick(...)` also has deterministic error-boundary behavior: update errors stop fixed/late work, fixed-step attempts settle the accumulator before propagating, and late errors occur after update/fixed work has completed. Runtime ownership guidance documents which objects own scenes, render resources, frame loops, and read-only tooling state.

For the runtime ownership boundary across `Game`, `Scene`, browser runtime, render scene lifecycle, tooling, and downstream error policy, see [Runtime Ownership Boundary](runtime-ownership.md).

`0.18.x` closed level/map runtime primitives. The Node-safe `framework` entrypoint now exposes `TileMap`, `defineTileMap(...)`, and `createTileMap(...)` for validated tile map data, defensive copying, tile lookup, and tile/world coordinate conversion. It also exposes `LevelLayout`, `defineLevelLayout(...)`, and `createLevelLayout(...)` for spawn point and rectangular region metadata. Scene config can now optionally declare `level.tileMap` and `level.layout`; successful bootstrap returns `TileMap` / `LevelLayout` helpers without generating entities, systems, render nodes, collisions, or editor state. `examples/dodge-blocks` consumes that path as a downstream-style package example by reading player spawn and playfield region metadata from the bootstrapped level layout.

For the level/map boundary across tile data, coordinate helpers, spawn/region metadata, scene config integration, example consumption, and non-editor data-contract limits, see [Level/Map Runtime Boundary](level-map.md).

`0.19.x` closed pointer/input runtime primitives. The `framework` entrypoint now exposes `definePointerButtonBinding(...)`, `normalizePointerButton(...)`, and `getPointerButtonInputId(...)` so downstream games can bind semantic input actions to primary, secondary, or auxiliary pointer buttons. It also exposes `BrowserPointerButtonBridge` so browser games can write normalized pointer button state into `InputSystem`. `examples/dodge-blocks` consumes this path by binding `confirm` to primary pointer input. Tooling formatting displays pointer button bindings as read-only input action state.

`0.20.x` closed collision query runtime primitives. `CollisionSystem` now exposes structured collision pair query methods for current, enter, stay, and exit buckets so downstream games can inspect entity/layer/rect data without rebuilding pair metadata from raw entity arrays. The Node-safe `tooling` entrypoint can also expose those pairs as read-only collision snapshots and browser panel sections, and `examples/dodge-blocks` consumes that path as a downstream-style browser example. This remains AABB runtime query/observability data, not a physics simulation or collider editor.

`0.21.x` closed audio runtime primitives. The Node-safe `framework` entrypoint now exposes audio asset/cue/channel data contracts, `defineAudioManifest(...)`, `AudioRuntimeState` / `createAudioRuntimeState(...)`, and `AudioRuntimeSystem` / `addAudioRuntime(...)` / `getAudioRuntime(...)` so downstream games can describe audio intent, install scene-owned audio runtime state, inspect channel volume/mute state, and record deterministic play/stop/pause/resume operations without depending on Web Audio. The Node-safe `tooling` entrypoint can expose that state through read-only audio runtime snapshots, formatting, aggregate tooling snapshots, and browser panel sections. `examples/dodge-blocks` consumes this path as a downstream-style browser example by recording semantic audio intent for game start, pause, resume, and player-hit events. This remains runtime contract/observability work, not audio playback, decoding, mixer UI, waveform editing, or audio authoring.

`v0.22.1` starts audio playback adapter work without adding browser playback. The Node-safe `framework` entrypoint now exposes `AudioPlaybackAdapter`, `AudioPlaybackOperationResult`, `dispatchAudioRuntimeOperation(...)`, and `drainAudioRuntimeOperations(...)` so downstream games can connect recorded audio intent to an injected adapter in deterministic sequence order. The drain helper reports per-operation `ok` / `error` results and clears drained operation records by default, with an opt-out for tests or custom orchestration. This remains package-facing runtime adapter work, not Web Audio, HTMLAudioElement playback, mixer UI, waveform editing, or audio authoring.

`v0.22.2` adds opt-in scene/system integration around that contract. The Node-safe `framework` entrypoint now exposes `AudioPlaybackSystem`, `addAudioPlayback(...)`, and `getAudioPlayback(...)` so scenes can drain audio runtime operations into an injected playback adapter during updates, while tests or custom loops can still call `drain()` directly and await deterministic result records. The system stores copied last-drain results for later read-only observability work. This is still injected-adapter runtime integration, not browser playback, asset decoding, mixer controls, or audio authoring.

`v0.22.3` adds a browser-facing audio playback adapter baseline. The `/runtime` entrypoint now exports `BrowserAudioPlaybackAdapter`, which implements the framework `AudioPlaybackAdapter` contract by creating browser media elements from audio manifest asset sources and handling play/stop/pause/resume/set-volume/set-muted operations. Tests use an injected fake media element factory so behavior remains deterministic without real DOM playback. This is opt-in browser runtime integration, not a Node-safe `/framework` dependency, not a mixer, not an asset browser, and not audio authoring.

`v0.22.4` closes audio playback adapter work. `examples/dodge-blocks` now consumes the playback path as a downstream-style browser example by installing `AudioPlaybackSystem` with `BrowserAudioPlaybackAdapter` and source-backed placeholder audio manifest assets. Browser playback remains opt-in runtime consumption from `boot.ts`; tooling remains read-only, `/framework` remains DOM-free, and the example does not add playback buttons, volume sliders, mixer controls, waveform/timeline UI, asset browser UI, or audio authoring.

`v0.23.1` starts camera runtime contract hardening. The Node-safe `framework` entrypoint now exposes `CameraSystem` viewport inspection and coordinate conversion behavior through copied viewport state, `worldToViewport(...)`, and `viewportToWorld(...)`. Camera `x` / `y` remain the world-space center, viewport coordinates use render viewport pixels, and UI/overlay layers remain screen-space. This is runtime camera math, not visual scene editing, camera timeline authoring, editor handles, or content production tooling.

`v0.23.2` adds camera bounds and follow clamping primitives. `CameraSystem` now supports `setBounds(...)`, `getBounds(...)`, and `clearBounds()`, clamps manual `moveTo(...)` and follow target centers to the active world-space bounds, and handles bounds smaller than the visible viewport by centering on the constrained axis. This remains deterministic runtime movement constraint behavior, not camera authoring UI, editor gizmos, cinematic sequencing, or timeline tooling.

`v0.24.1` starts the playable 2D game kit stage. The Node-safe `framework` entrypoint now exposes `limitMovementVector(...)`, a small gameplay helper for capping directional movement magnitude while preserving direction. `examples/dodge-blocks` consumes it so diagonal player movement no longer becomes faster than axis-aligned movement. This is reusable runtime gameplay math, not a character editor, physics simulation, input rebinding UI, or content authoring workflow.

`v0.24.2` adds actor template composition on top of the existing entity template pipeline. The Node-safe `framework` entrypoint now exposes `defineActorTemplate(...)`, which turns common actor fields into `transform`, `size`, optional `collider`, optional `velocity`, and extra component declarations that can still be instantiated by `instantiateEntityTemplate(...)`. `examples/dodge-blocks` consumes this path for the player template. This is code/runtime composition, not a visual prefab editor, hierarchy editor, asset browser, or content authoring workflow.

---

## Package Entrypoints

Current package exports are defined in `package.json`:

| Entrypoint | Intended Use | Node Import Smoke Test |
| --- | --- | --- |
| `@shuangxunian/leafer-game-engine` | Browser-facing convenience root that re-exports engine layers | Not Node-safe yet |
| `@shuangxunian/leafer-game-engine/core` | Engine core: game loop, scene, world, entity, component, system, time | Yes |
| `@shuangxunian/leafer-game-engine/adapter/render-types` | Render contracts: render nodes, scene layers, layer order helpers | Yes |
| `@shuangxunian/leafer-game-engine/framework` | Reusable gameplay/framework primitives: input, collision, assets, sprite animation, schema, game flow, event bus, scheduler, runtime services | Yes |
| `@shuangxunian/leafer-game-engine/tooling` | Runtime snapshots, formatting, and panel section builders | Yes for import; DOM panel classes require browser usage |
| `@shuangxunian/leafer-game-engine/adapter` | Browser/render adapter integration, including Leafer adapter | Browser-facing |
| `@shuangxunian/leafer-game-engine/runtime` | Browser runtime assembly plus runtime helpers | Browser-facing today |

---

## Node-Safe Imports

These imports are expected to work in Node-side tests:

```ts
import { Scene } from "@shuangxunian/leafer-game-engine/core";
import { RENDER_SCENE_LAYER_ORDER, getRenderSceneLayerNames } from "@shuangxunian/leafer-game-engine/adapter/render-types";
import {
  BrowserPointerButtonBridge,
  EventBus,
  GameFlow,
  InputActionMap,
  LevelLayout,
  RuntimeScheduler,
  RuntimeServicesSystem,
  SpriteAnimationComponent,
  SpriteAnimationSystem,
  TileMap,
  addRuntimeServices,
  bootstrapSceneFromConfig,
  createLevelLayout,
  createTileMap,
  createRuntimeServices,
  createSpriteAnimationPlayback,
  defineLevelLayout,
  defineTileMap,
  defineKeyboardBinding,
  definePointerButtonBinding,
  getRuntimeServices,
  getPointerButtonInputId,
  isSpriteCapableRenderNode,
  normalizePointerButton,
  validateSceneConfig
} from "@shuangxunian/leafer-game-engine/framework";
import {
  createInputActionSnapshot,
  createToolingSnapshot,
  formatInputActionSnapshot,
  formatRuntimeServicesSnapshot,
  formatSpriteAnimationSnapshot
} from "@shuangxunian/leafer-game-engine/tooling";
```

The smoke tests intentionally use the real package name so they exercise `package.json` exports.

`BrowserPointerButtonBridge` can be imported from `/framework` in Node-side smoke tests, but its default target is browser `window`; Node tests should inject a small event target when constructing it.

---

## Recommended Import Patterns

Use the root package entrypoint for browser game bootstrapping:

```ts
import { Scene, createBrowserRuntime } from "@shuangxunian/leafer-game-engine";
```

Use subpath entrypoints for pure engine logic, framework primitives, and Node-side tests:

```ts
import { Scene } from "@shuangxunian/leafer-game-engine/core";
import { RENDER_SCENE_LAYER_ORDER, getRenderSceneLayerNames } from "@shuangxunian/leafer-game-engine/adapter/render-types";
import {
  BrowserPointerButtonBridge,
  EventBus,
  GameFlow,
  InputActionMap,
  LevelLayout,
  RuntimeScheduler,
  RuntimeServicesSystem,
  SpriteAnimationComponent,
  SpriteAnimationSystem,
  TileMap,
  addRuntimeServices,
  bootstrapSceneFromConfig,
  createLevelLayout,
  createTileMap,
  createRuntimeServices,
  createSpriteAnimationPlayback,
  defineLevelLayout,
  defineTileMap,
  defineKeyboardBinding,
  definePointerButtonBinding,
  getRuntimeServices,
  getPointerButtonInputId,
  isSpriteCapableRenderNode,
  normalizePointerButton,
  validateSceneConfig
} from "@shuangxunian/leafer-game-engine/framework";
import {
  createInputActionSnapshot,
  createToolingSnapshot,
  formatInputActionSnapshot,
  formatRuntimeServicesSnapshot,
  formatSpriteAnimationSnapshot
} from "@shuangxunian/leafer-game-engine/tooling";
```

This keeps browser runtime dependencies out of tests that only need ECS, gameplay flow, event dispatch, update-driven scheduling, scene runtime service ownership, assets, sprite animation playback/system behavior, scene config, level/map declarations, or snapshot formatting.

---

## Local Example Import Boundary

The repository examples also use package-style imports:

```ts
import { createBrowserRuntime } from "@shuangxunian/leafer-game-engine";
import { Scene } from "@shuangxunian/leafer-game-engine/core";
```

During local development, `vite.config.ts` and `tsconfig.json` map those imports back to `src`. This keeps example code close to downstream consumer code without requiring a prebuilt `lib` folder for every edit.

Published consumers do not use these local aliases; they resolve through `package.json` exports.

---

## Browser-Facing Imports

These entrypoints may import Leafer or DOM-dependent code:

```ts
import { createBrowserRuntime } from "@shuangxunian/leafer-game-engine";
import { BrowserAudioPlaybackAdapter, createBrowserRuntime } from "@shuangxunian/leafer-game-engine/runtime";
import { LeaferRenderAdapter } from "@shuangxunian/leafer-game-engine/adapter";
```

They should be verified through browser/example builds until the package is split into more granular runtime subpaths. For Node-safe render contracts, prefer `@shuangxunian/leafer-game-engine/adapter/render-types`; importing the broad adapter entrypoint can pull render-adapter dependencies.

---

## Current Boundary Notes

- `core` should stay independent from browser and rendering implementations, and should preserve scene/world phase cleanup invariants even when runtime hooks throw.
- `framework` should stay usable for logic tests and reusable gameplay primitives, including input action mapping, pointer button action bindings, browser pointer button bridging, collision pair query snapshots, audio data contracts/runtime intent state, scene-owned audio runtime system integration, audio playback adapter contracts, update-driven audio playback draining system integration, deterministic audio operation draining, camera viewport/coordinate conversion helpers, camera bounds/follow clamping primitives, sprite animation timing helpers, component/system behavior, deterministic runtime event dispatch, update-driven scheduling, opt-in scene runtime service integration, data-driven scene config validation, safe scene config bootstrap, render/view synchronization, render-node capability checks, tile map data contracts, level spawn/region metadata, and optional scene config level/map declarations.
- `tooling` can expose structured snapshots and formatters in Node, including read-only system lifecycle state, sprite animation state, runtime services state, input action state, collision pair state, and audio runtime state, but browser panel classes should only be constructed in a DOM environment.
- `adapter` is render-implementation-facing and can depend on Leafer. It owns render scene layer naming/order helpers.
- `runtime` currently includes browser runtime assembly and browser audio playback adapter exports. Browser examples can inject those adapters into framework systems, but importing the broad runtime entrypoint in Node is not guaranteed to work.
- Future package-boundary work may split browser runtime APIs into more explicit entrypoints, but `0.17.x` runtime/game loop hardening guarantees are now documented and covered by package verification.

---

## Package Artifact Verification

Before publishing, run:

```bash
npm run verify:package
```

This command builds the library through `npm pack --dry-run --json` and checks the package artifact includes:

- `package.json`
- `README.md`
- `LICENSE`
- `docs/public-api.md`
- `docs/product-boundary.md`
- `docs/animation-runtime.md`
- `docs/runtime-services.md`
- `docs/input-actions.md`
- `docs/runtime-observability.md`
- `docs/scene-config.md`
- `docs/level-map.md`
- `docs/render-view-contract.md`
- all JS and type declaration targets from `package.json` exports

It also checks that development-only paths such as `src`, `tests`, `examples`, `dist`, `scripts`, and `node_modules` are not included.
