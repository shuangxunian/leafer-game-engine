# leaferGame AI Development Reference

## RAG Metadata

- Project: `@shuangxunian/leafer-game-engine`
- Current release baseline: `1.0.0`
- Product type: frontend Web 2D game engine package
- Primary audience: frontend developers and AI coding agents building lightweight browser games
- Primary use cases: 4399-style browser mini-games, WeChat-mini-game-like puzzle interactions, pointer-first sorting/grouping/pouring/matching games, basic galgame / interactive narrative flows
- Canonical package boundary: runtime/framework/adapter/tooling package APIs, not editor or publishing-platform code
- Canonical examples: `examples/dodge-blocks`, `examples/collect-stars`, `examples/pour-sort`, `examples/dialogue-choice`

---

## Project Background

`leaferGame` is a lightweight 2D game engine package built on top of `Leafer`.

The project started as a small browser-game runtime experiment and has been
shaped into a package that can be imported by downstream frontend projects. Its
current `1.0.0` baseline focuses on practical browser-game assembly rather than
commercial-engine completeness.

The engine is meant to help a developer quickly build:

- simple action games similar to common 4399 browser mini-games
- collection / dodge / survival loops
- pointer-first puzzle interactions such as sorting, grouping, pouring,
  selecting, dragging, and matching
- lightweight interactive narrative or galgame-style choice flows

The project is explicitly not:

- a visual editor
- a project generator
- a launcher or gallery
- a template marketplace
- a WeChat SDK wrapper
- an account, ads, monetization, analytics, or publishing platform
- a content authoring workflow
- a game-specific rules package

Game-specific rules belong in downstream projects or under `examples/`.

---

## 1.0.0 Summary

The `1.0.0` release baseline means the package has stable enough primitives for
small Web game development:

- ECS-style core runtime: game loop, scenes, worlds, entities, components,
  systems, time, and deterministic phase cleanup
- render adapter boundary: Leafer-backed rendering with stable render scene
  layers and image-backed sprites
- asset loading and render handoff: sprite assets can carry `source` and reach
  render nodes
- input and pointer primitives: keyboard, pointer button, pointer position,
  coordinate helpers, picking, selection, drag, and source-target action helpers
- collision queries: AABB collider components and collision pair snapshots
- camera, level, and tile primitives: viewport conversion, bounds/follow
  clamping, tile maps, level layout, spawn points, and regions
- audio runtime intent and opt-in browser playback adapter
- UI and narrative primitives: HUD text, HUD bundles, dialogue prompt data,
  choice state, and screen-space prompt rendering
- quick-start scene assembly helpers for input, systems, HUD, and audio runtime
- read-only tooling snapshots and browser debug panels
- package-boundary tests for public entrypoints, Node-safe imports, browser
  entrypoints, package metadata, and npm package artifacts

---

## How AI Agents Should Treat This Repository

When using this document as RAG context, treat the repository as a package-first
game engine, not as an app or editor.

Good AI tasks:

- add or refine reusable runtime/framework primitives
- write focused unit tests for package-facing behavior
- improve example consumption of public package APIs
- add package-facing documentation
- fix bugs while preserving public contracts
- improve package-boundary and artifact verification

Bad AI tasks for this repository:

- build a visual editor UI
- add project scaffolding CLI
- add launchers, galleries, marketplaces, publishing flows, or account systems
- implement game-specific rules in the engine package
- move DOM/browser-only dependencies into Node-safe entrypoints
- mutate examples into hidden framework APIs without repeated cross-example need

Before adding a public API, an AI agent should ask:

- Is this generic enough for more than one game shape?
- Is the need proven by examples or tests?
- Can it stay in `/framework`, `/runtime`, `/adapter`, or `/tooling` without
  leaking editor/product scope?
- Does it need package-boundary tests and documentation updates?

---

## Package Entrypoints

The public package entrypoints are defined in `package.json.exports`.

| Entrypoint | Environment | Purpose |
| --- | --- | --- |
| `@shuangxunian/leafer-game-engine` | Browser-facing convenience | Re-exports adapter, core, framework, runtime, and tooling |
| `@shuangxunian/leafer-game-engine/core` | Node-safe | ECS, scene, world, game loop, time, component/system primitives |
| `@shuangxunian/leafer-game-engine/framework` | Node-safe except explicit browser bridge construction | Gameplay/framework primitives and data contracts |
| `@shuangxunian/leafer-game-engine/tooling` | Node-safe for snapshots/formatters; browser classes require browser usage | Read-only diagnostics, snapshots, formatting, panel section helpers |
| `@shuangxunian/leafer-game-engine/adapter/render-types` | Node-safe | Render contracts, layer names, viewport helpers |
| `@shuangxunian/leafer-game-engine/adapter` | Browser/render-facing | Leafer adapter integration |
| `@shuangxunian/leafer-game-engine/runtime` | Browser-facing | Browser runtime assembly, frame loop, resize, lifecycle, audio playback adapter |

Recommended import pattern:

```ts
import { Scene, System } from "@shuangxunian/leafer-game-engine/core";
import { InputActionMap, CollisionSystem } from "@shuangxunian/leafer-game-engine/framework";
import { createBrowserRuntime } from "@shuangxunian/leafer-game-engine/runtime";
```

Use the root entrypoint only when browser boot convenience matters:

```ts
import { Scene, createBrowserRuntime } from "@shuangxunian/leafer-game-engine";
```

---

## Core Interfaces

Use `/core` for engine logic that should be testable without DOM globals.

| Symbol | Role |
| --- | --- |
| `Component` | Base class for entity data/behavior components |
| `ComponentType<T>` | Constructor type for component lookup |
| `Entity` | Owns components and active/destroy state |
| `World` | Owns entities, deferred add/remove, and component queries |
| `System` | Base class for scene systems with lifecycle/update hooks |
| `Scene` | Owns a world and ordered systems |
| `Game` | Owns the active scene and ticks update/fixed/late phases |
| `Time` | Carries delta/fixed time state |
| `Updatable` | Update lifecycle shape |
| `Destroyable` | Destroy lifecycle shape |

Typical pattern:

```ts
import { Component, Scene, System } from "@shuangxunian/leafer-game-engine/core";

class DemoScene extends Scene {}

class HealthComponent extends Component {
  constructor(public value = 3) {
    super();
  }
}

class DamageSystem extends System {
  update(): void {
    for (const entity of this.scene.world.query(HealthComponent)) {
      const health = entity.getComponent(HealthComponent);
      if (health && health.value <= 0) {
        entity.destroy();
      }
    }
  }
}

const scene = new DemoScene("DemoScene");
scene.addSystem(new DamageSystem(scene));
```

AI guidance:

- Put reusable lifecycle behavior in systems.
- Put entity-local data in components.
- Prefer `World.query(...)` and component lookups over side-channel arrays.
- Keep gameplay-specific scoring, puzzle rules, and story routing downstream.

---

## Render And Adapter Interfaces

Use `/adapter/render-types` for DOM-free render contracts and `/adapter` for
Leafer-backed browser rendering.

| Symbol | Role |
| --- | --- |
| `RENDER_SCENE_LAYER_ORDER` | Stable layer order: `background`, `world`, `ui`, `overlay` |
| `RenderSceneLayerName` | Layer name union |
| `RenderNode` | Base render node contract |
| `RenderSprite` | Sprite-capable render node contract |
| `RenderText` | Text render node contract |
| `RenderContainer` | Container render node contract |
| `RenderScene` | Scene object with width, height, layers, and destroy |
| `RenderAdapter` | Adapter contract for creating sprites/text/containers |
| `RenderSpriteAsset` | Sprite asset shape consumed by render nodes |
| `RenderSceneViewport` | Width/height viewport data |
| `getRenderSceneLayerNames(...)` | Reads stable layer names |
| `createRenderSceneViewport(...)` | Validates and creates viewport data |
| `getRenderSceneViewport(...)` | Reads viewport from a render scene |
| `LeaferRenderAdapter` | Browser-facing Leafer adapter implementation |

Layer conventions:

- `background`: background visuals and map layers
- `world`: gameplay entities and world-space objects
- `ui`: screen-space HUD and dialogue prompts
- `overlay`: modal overlays or top-level prompt surfaces

AI guidance:

- Keep render contracts data-oriented and adapter-neutral.
- Use `/adapter/render-types` in tests and Node-safe code.
- Use `LeaferRenderAdapter` only in browser/runtime paths.
- Do not add editor mutation handles to render nodes.

---

## Runtime Interfaces

Use `/runtime` for browser assembly and frame-loop ownership.

| Symbol | Role |
| --- | --- |
| `createBrowserRuntime(options)` | Creates render scene, game, runtime controller, and optional resize bridge |
| `BrowserRuntimeOptions` | Browser runtime setup options |
| `BrowserRuntime` | Runtime bundle returned by browser setup |
| `createRuntimeController(options)` | Owns animation frame loop start/stop |
| `RuntimeController` | Start/stop controller for frame loop |
| `startSceneWithLifecycle(scene, options)` | Async scene prepare/start helper with transition reporting |
| `SceneLifecyclePhase` | `idle`, `loading`, `ready`, `running`, `failed` |
| `createBrowserResizeBridge(options)` | Observes container resize and updates render scene |
| `BrowserResizeBridge` | Attach/detach resize bridge |
| `BrowserAudioPlaybackAdapter` | Browser media-element implementation of audio playback adapter |

AI guidance:

- `runtime.stop()` owns the frame loop, not scene destruction.
- Browser-facing helpers can depend on DOM/browser APIs.
- Keep browser-only setup out of Node-safe `/framework` imports.
- Use injected targets/factories in tests.

---

## Framework Interfaces

Use `/framework` for reusable gameplay primitives.

### Transform, Size, View, Movement

| Symbol | Role |
| --- | --- |
| `TransformComponent` | Position/rotation/scale-style entity transform |
| `SizeComponent` | Width/height entity size |
| `VelocityComponent` | Basic velocity data |
| `ViewComponent` | Links an entity to a render node and syncs from transform |
| `isSpriteCapableRenderNode(...)` | Guard for nodes that can accept sprite assets |
| `limitMovementVector(...)` | Caps vector magnitude for consistent movement |
| `clampPositionToBounds(...)` | Clamps entity position within bounds |
| `randomPositionInBounds(...)` | Picks random top-left position within bounds |

Use these for action games, collection games, actor placement, and common
movement constraints.

### Input, Keyboard, Pointer

| Symbol | Role |
| --- | --- |
| `InputSystem` | Stores raw input and pointer position state |
| `InputActionMap` | Maps semantic actions to input bindings |
| `defineKeyboardBinding(...)` | Normalizes keyboard bindings |
| `definePointerButtonBinding(...)` | Normalizes pointer button bindings |
| `normalizeKeyboardKey(...)` | Keyboard key normalization |
| `normalizePointerButton(...)` | Pointer button normalization |
| `getPointerButtonInputId(...)` | Converts pointer button to internal input id |
| `BrowserKeyboardBridge` | Writes browser keyboard state into `InputSystem` |
| `BrowserPointerButtonBridge` | Writes pointer button state into `InputSystem` |
| `BrowserPointerPositionBridge` | Writes pointer position into `InputSystem` |
| `createBrowserPointerLocalPositionResolver(...)` | Creates local coordinate resolver |
| `getBrowserPointerLocalPosition(...)` | Reads local pointer coordinates from DOM bounds |

AI guidance:

- Game code should consume semantic actions, not raw physical keys.
- Keep action names example-owned: `move-left`, `confirm`, `select`, etc.
- Inject fake event targets in tests.

### Picking, Selection, Drag, Source-Target Actions

| Symbol | Role |
| --- | --- |
| `pointInRect(...)` | Generic rectangle hit test |
| `getEntityHitRect(...)` | Derives entity hit rect from size or collider |
| `hitTestEntitiesAtPoint(...)` | Returns entity hit-test results |
| `pickTopEntityAtPoint(...)` | Selects top hit entity |
| `createSourceTargetSelectionState()` | Empty source-target selection |
| `selectSourceTargetSource(...)` | Selects source ref |
| `selectSourceTargetTarget(...)` | Selects target ref |
| `replaceSourceTargetSelectionSource(...)` | Replaces source while preserving immutable state pattern |
| `replaceSourceTargetSelectionTarget(...)` | Replaces target |
| `clearSourceTargetTarget(...)` | Clears target only |
| `clearSourceTargetSelection()` | Resets selection |
| `getSourceTargetSelectionPair(...)` | Reads selected pair |
| `isSourceTargetSelectionReady(...)` | Checks source+target readiness |
| `getSourceTargetSelectionSnapshot(...)` | Returns copied read-only snapshot |
| `createEntitySelectionRef(entity)` | Creates immutable entity selection ref |
| `createEntityDragState()` | Empty drag state |
| `startEntityDrag(...)` | Starts drag with pointer position |
| `moveEntityDrag(...)` | Updates drag current pointer |
| `completeEntityDrag(...)` | Completes drag |
| `cancelEntityDrag(...)` | Cancels drag |
| `isEntityDragActive(...)` | Checks drag activity |
| `getEntityDragDelta(...)` | Reads pointer delta |
| `getEntityDragSnapshot(...)` | Returns copied drag snapshot |
| `createSourceTargetAction(...)` | Creates generic source-target action |
| `createSourceTargetActionFromSelection(...)` | Creates action from selected pair |
| `getSourceTargetActionSnapshot(...)` | Copies action |
| `allowSourceTargetAction(...)` | Allowed result envelope |
| `blockSourceTargetAction(...)` | Blocked result envelope with reason |
| `isSourceTargetActionAllowed(...)` | Result guard |

Use these for water-sort, merge, match, inventory, grouping, and other
pointer-first interactions. The engine provides generic state and action
envelopes; downstream examples own puzzle validation rules.

### Collision

| Symbol | Role |
| --- | --- |
| `Rect` | AABB rectangle |
| `intersects(a, b)` | AABB intersection test |
| `ColliderComponent` | Entity collision rectangle/layer data |
| `CollisionSystem` | Maintains current/enter/stay/exit collision pairs |
| `CollisionPairSnapshot` | Read-only pair snapshot |
| `CollisionPairEntrySnapshot` | Per-pair entry snapshot |

Use this for lightweight collision queries, not physics simulation.

### Assets And Sprite Animation

| Symbol | Role |
| --- | --- |
| `AssetRegistry` | Registers sprites, tracks load state, exposes render assets |
| `loadAssetManifest(...)` | Registers manifest synchronously |
| `loadAssetManifestAsync(...)` | Registers and loads assets with async loader |
| `createBrowserImageSpriteLoader(...)` | Browser image loader for sprite assets |
| `defineSpriteFrame(...)` | Declares sprite frame |
| `defineSpriteAnimationClip(...)` | Declares animation clip |
| `createSpriteAnimationPlayback(...)` | Creates playback state |
| `advanceSpriteAnimationPlayback(...)` | Advances playback by delta |
| `pauseSpriteAnimationPlayback(...)` | Pauses playback |
| `resumeSpriteAnimationPlayback(...)` | Resumes playback |
| `stopSpriteAnimationPlayback(...)` | Stops playback |
| `getSpriteAnimationPlaybackFrameIndex(...)` | Reads frame index |
| `getSpriteAnimationPlaybackFrameId(...)` | Reads frame id |
| `SpriteAnimationComponent` | ECS animation component |
| `SpriteAnimationSystem` | Applies animation frames to render nodes |
| `AnimationStateMachine` | Simple animation state machine |

AI guidance:

- Asset authoring tools stay outside this package.
- Manifests and source paths can be example-owned or downstream-owned.
- Use `AssetRegistry` snapshots for diagnostics instead of mutating assets from tooling.

### Audio

| Symbol | Role |
| --- | --- |
| `defineAudioAsset(...)` | Declares audio asset |
| `defineAudioCue(...)` | Declares semantic audio cue |
| `defineAudioChannel(...)` | Declares channel |
| `defineAudioManifest(...)` | Declares manifest |
| `AudioRuntimeState` | Records deterministic audio intent |
| `createAudioRuntimeState(...)` | Creates runtime audio state |
| `AudioRuntimeSystem` | Scene-owned audio runtime system |
| `AudioPlaybackAdapter` | Injected adapter contract |
| `dispatchAudioRuntimeOperation(...)` | Dispatches recorded operation to adapter |
| `drainAudioRuntimeOperations(...)` | Drains operation queue |
| `AudioPlaybackSystem` | Drains audio runtime operations during scene updates |
| `addAudioRuntime(...)` | Adds audio runtime system |
| `getAudioRuntime(...)` | Reads audio runtime state |
| `addAudioPlayback(...)` | Adds playback system |
| `getAudioPlayback(...)` | Reads playback system |
| `createSceneAudioRuntimeBundle(...)` | Installs/reuses audio runtime in a scene |

Audio runtime records intent. Browser playback is opt-in through `/runtime`.

### Events, Scheduler, Runtime Services

| Symbol | Role |
| --- | --- |
| `EventBus` | Deterministic event dispatch |
| `RuntimeScheduler` | Update-driven delayed/repeated task scheduler |
| `RuntimeServices` | Groups event bus and scheduler |
| `RuntimeServicesSystem` | Scene-owned runtime services system |
| `createRuntimeServices(...)` | Creates services |
| `addRuntimeServices(...)` | Installs services system |
| `getRuntimeServices(...)` | Reads services from scene |

Use these for runtime coordination that should be testable without timers or DOM.

### State, Game Flow, Scene Config, Schema

| Symbol | Role |
| --- | --- |
| `StateMachine<TState>` | Generic finite-state helper |
| `GameFlow` | Game phase helper: boot, ready, running, paused, ended |
| `SceneSystemRegistry` | Maps scene config system ids to factories |
| `validateSceneConfig(...)` | Validates scene config before mutation |
| `bootstrapSceneFromConfig(...)` | Registers assets/entities/systems from config |
| `ComponentSchemaRegistry` | Stores component metadata for tooling |
| `createDefaultComponentSchemaRegistry()` | Default schemas for common components |

Scene config is runtime data. It is not a visual scene editor format.

### Entity Factory And Actor Helpers

| Symbol | Role |
| --- | --- |
| `defineEntityFactory(...)` | Declares entity factory |
| `EntityTemplateRegistry` | Stores component factories by id |
| `createDefaultEntityTemplateRegistry()` | Default template registry |
| `instantiateEntityTemplate(...)` | Creates entity from component declarations |
| `defineActorTemplate(...)` | Common actor template composition |
| `attachActorSpriteView(...)` | Adds render sprite view to an entity |

Use actor helpers to reduce repeated setup across small games. Do not turn
example-specific enemies, stars, bottles, or dialogue routes into engine APIs.

### Tile Map, Level Layout, Camera

| Symbol | Role |
| --- | --- |
| `TileMap` | Validated tile map helper |
| `defineTileMap(...)` | Declares tile map data |
| `createTileMap(...)` | Creates tile map helper |
| `createTileMapLayerView(...)` | Renders tile map layer through adapter |
| `LevelLayout` | Spawn point and region metadata helper |
| `defineLevelLayout(...)` | Declares level layout |
| `createLevelLayout(...)` | Creates level layout helper |
| `CameraSystem` | Viewport, world/viewport conversion, bounds/follow clamping |

Tile and level data are inert runtime data. They do not create entities or
colliders by themselves unless downstream code decides to consume them.

### HUD, Dialogue, Quick Start

| Symbol | Role |
| --- | --- |
| `createHudText(...)` | Creates one screen-space text node |
| `createHudTextBundle(...)` | Creates keyed text nodes |
| `defineDialogueLine(...)` | Declares dialogue line |
| `defineDialogueChoice(...)` | Declares dialogue choice |
| `defineDialoguePrompt(...)` | Declares prompt |
| `getDialoguePromptSnapshot(...)` | Copies prompt |
| `createDialogueChoiceState(...)` | Creates choice state |
| `selectDialogueChoice(...)` | Selects choice |
| `clearDialogueChoiceSelection(...)` | Clears selected choice |
| `resolveDialogueChoiceSelection(...)` | Resolves current choice |
| `getSelectedDialogueChoice(...)` | Reads selected choice |
| `getResolvedDialogueChoice(...)` | Reads resolved choice |
| `isDialogueChoiceSelected(...)` | Selection guard |
| `isDialogueChoiceResolved(...)` | Resolution guard |
| `getDialogueChoiceStateSnapshot(...)` | Copies choice state |
| `createDialoguePromptView(...)` | Creates screen-space prompt view |
| `createSceneInputBridgeBundle(...)` | Installs keyboard/pointer bridges |
| `createSceneRuntimePreset(...)` | Installs common systems |
| `createSceneQuickStartBundle(...)` | Combines runtime preset and input bridges |

Dialogue primitives support basic galgame-style prototypes. Story content,
routes, effects, save files, and localization remain downstream-owned.

---

## Tooling Interfaces

Use `/tooling` for read-only diagnostics.

| Symbol | Role |
| --- | --- |
| `createDebugSnapshot(...)` | Scene/system/entity/time/render/asset summary |
| `formatDebugSnapshot(...)` | Text rows for debug snapshot |
| `createSceneInspectorSnapshot(...)` | Read-only entity/component inspection |
| `formatSceneInspectorSnapshot(...)` | Text rows for inspector |
| `createToolingSnapshot(...)` | Aggregated runtime/tooling snapshot |
| `formatToolingSnapshot(...)` | Text rows for aggregate snapshot |
| `createRuntimeServicesSnapshot(...)` | Runtime services state |
| `formatRuntimeServicesSnapshot(...)` | Text rows for runtime services |
| `createAudioRuntimeSnapshot(...)` | Audio runtime state |
| `formatAudioRuntimeSnapshot(...)` | Text rows for audio runtime |
| `createInputActionSnapshot(...)` | Input action state |
| `formatInputActionSnapshot(...)` | Text rows for input actions |
| `createCollisionSnapshot(...)` | Collision pair state |
| `formatCollisionSnapshot(...)` | Text rows for collisions |
| `createComponentSchemaSnapshot(...)` | Component schema metadata |
| `formatComponentSchemaSnapshot(...)` | Text rows for schemas |
| `createSpriteAnimationSnapshot(...)` | Sprite animation state |
| `formatSpriteAnimationSnapshot(...)` | Text rows for sprite animation |
| `createRuntimeDebugPanelSection(...)` | Browser panel section data |
| `createEntityInspectorPanelSection(...)` | Entity panel section |
| `createComponentSchemasPanelSection(...)` | Schema panel section |
| `createAssetsPanelSection(...)` | Asset panel section |
| `createGameFlowPanelSection(...)` | Game flow panel section |
| `createSpriteAnimationsPanelSection(...)` | Animation panel section |
| `createAudioRuntimePanelSection(...)` | Audio panel section |
| `createInputActionsPanelSection(...)` | Input panel section |
| `createCollisionsPanelSection(...)` | Collision panel section |
| `createRuntimeServicesPanelSection(...)` | Runtime services panel section |
| `createSelectedEntityDetailPanelSection(...)` | Selected entity details |
| `createToolingPanelSections(...)` | Aggregated panel sections |
| `parseToolingPanelEntityRowId(...)` | Parses entity row selection |
| `BrowserDebugOverlay` | Browser debug overlay |
| `BrowserToolingPanel` | Browser tooling panel |
| `ColliderDebugSystem` | Visual collider debug nodes |

Tooling must remain read-only. It can observe runtime state and build text/panel
representations, but it should not mutate scenes, entities, components, assets,
input bindings, levels, or project files.

---

## Common AI Build Recipes

### Build A 4399-Style Action Mini-Game

Recommended APIs:

- `/core`: `Scene`, `System`, `Component`
- `/framework`: `InputSystem`, `InputActionMap`, `CollisionSystem`,
  `ColliderComponent`, `GameFlow`, `createHudTextBundle(...)`,
  `defineActorTemplate(...)`, `instantiateEntityTemplate(...)`,
  `attachActorSpriteView(...)`, `clampPositionToBounds(...)`,
  `randomPositionInBounds(...)`
- `/runtime`: `createBrowserRuntime(...)`
- `/tooling`: `createToolingSnapshot(...)`

Keep scoring, hazard spawning, win/lose rules, and difficulty curves in the game
project or example.

### Build A Pointer-First Puzzle Game

Recommended APIs:

- pointer bridges and pointer local coordinate helpers
- `pickTopEntityAtPoint(...)`
- `createSourceTargetSelectionState(...)`
- `selectSourceTargetSource(...)`
- `selectSourceTargetTarget(...)`
- `createSourceTargetActionFromSelection(...)`
- `allowSourceTargetAction(...)` / `blockSourceTargetAction(...)`
- `createEntityDragState(...)`, `startEntityDrag(...)`, `moveEntityDrag(...)`,
  `completeEntityDrag(...)`

Keep puzzle-specific validation, solver logic, undo/hint systems, and level
authoring outside the engine package.

### Build A Basic Galgame / Interactive Narrative

Recommended APIs:

- `defineDialogueLine(...)`
- `defineDialogueChoice(...)`
- `defineDialoguePrompt(...)`
- `createDialogueChoiceState(...)`
- `selectDialogueChoice(...)`
- `resolveDialogueChoiceSelection(...)`
- `createDialoguePromptView(...)`
- `GameFlow`
- `InputActionMap`
- `createHudTextBundle(...)`

Keep story routes, character scripts, background selection, save/load, and
localization downstream-owned.

---

## Recommended AI Prompt Template

Use this when asking another AI agent to implement a game or feature with this
package:

```text
You are working with @shuangxunian/leafer-game-engine 1.0.0.

Use public package entrypoints only:
- @shuangxunian/leafer-game-engine/core for ECS/runtime logic
- @shuangxunian/leafer-game-engine/framework for gameplay primitives
- @shuangxunian/leafer-game-engine/runtime for browser boot/runtime setup
- @shuangxunian/leafer-game-engine/tooling for read-only diagnostics

Keep game-specific rules in the downstream game/example.
Do not add editor, launcher, gallery, marketplace, SDK wrapper, account,
ads, monetization, analytics, or publishing workflows.

Prefer existing helpers:
- InputActionMap and pointer bridges for input
- CollisionSystem for AABB collision queries
- AssetRegistry and source-backed sprite assets for visuals
- createSceneQuickStartBundle for scene setup
- createHudTextBundle for simple HUD
- source-target selection/action helpers for pointer puzzles
- dialogue helpers for interactive narrative

Add tests for reusable behavior and keep package-boundary tests green.
```

---

## RAG Chunking Hints

For retrieval systems, chunk this document by headings:

- `Project Background`
- `1.0.0 Summary`
- `How AI Agents Should Treat This Repository`
- `Package Entrypoints`
- each `Core`, `Render`, `Runtime`, `Framework`, and `Tooling` subsection
- each `Common AI Build Recipes` subsection

High-signal terms for retrieval:

- Web 2D game engine
- Leafer render adapter
- ECS scene world entity component system
- package entrypoints
- Node-safe framework
- browser runtime
- pointer-first puzzle
- source-target selection
- entity drag state
- dialogue prompt view
- quick-start scene bundle
- runtime observability
- read-only tooling
- package boundary

---

## Development And Verification Commands

Use these before committing changes:

```bash
npm run check
npm test
npm run build:example
npm run verify:package
npm audit --audit-level=moderate
git diff --check
```

The package verification command checks the npm artifact through
`npm pack --dry-run --json`, including public export targets, package-facing
docs, and development-only file exclusions.
