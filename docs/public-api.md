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

For the sprite rendering boundary across `RenderSpriteAsset.source`, Leafer image-backed rendering, asset registry render handoff, framework DOM-free constraints, and example-owned image-like assets, see [Sprite Rendering Boundary](sprite-rendering.md).

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

`v0.24.3` adds a runtime HUD text helper. The Node-safe `framework` entrypoint now exposes `createHudText(...)`, which creates a render text node through the injected `RenderAdapter`, initializes basic position/font/visibility fields, attaches it to the `ui` layer by default, and can explicitly target the screen-space `overlay` layer. `examples/dodge-blocks` consumes this path for score/status/title/overlay text. This is runtime HUD creation, not a visual UI editor, layout designer, widget library, or content authoring workflow.

`v0.24.4` adds a runtime tile map layer view helper. The Node-safe `framework` entrypoint now exposes `createTileMapLayerView(...)`, which reads an existing `TileMap` layer, skips `null` tiles, creates render sprites for non-empty tile ids, positions those sprites with tile bounds, and attaches the generated container to the world layer by default. Callers can target the background layer or resolve tile ids to richer sprite assets. This is runtime map visualization for browser games, not tile painting, tileset management, map-to-collider generation, pathfinding, visual scene editing, or tile map authoring.

`v0.24.5` closes the playable 2D game kit stage. `examples/dodge-blocks` now exposes a small read-only gameplay snapshot from its example-owned `DodgeGameSystem`, covering phase, score, best score, survival time, active state, and hazard count. This keeps the example easy to inspect as a downstream-style mini-game without adding a generic framework snapshot API, editor UI, gameplay debugger, persistence, leaderboard backend, or content-production workflow.

`v0.25.0` starts the second playable example stage. This is a package-consumption proof stage: the next example should use existing public entrypoints through package-style imports and expose real friction before new framework abstractions are added. It is not an editor, example marketplace, visual launcher product, asset manager, or content publishing workflow.

`v0.25.1` adds the second example shell and local routing/build baseline. The repository example entry can boot `dodge-blocks` by default or `collect-stars` through a query route, and `examples/collect-stars` consumes public engine package entrypoints for a shell scene. The route is for local development and build coverage, not a polished example launcher product.

`v0.25.2` turns `collect-stars` into a minimal playable collection loop. The second example now consumes `InputActionMap`, keyboard bridge attachment, `limitMovementVector(...)`, `GameFlow`, `CollisionSystem`, `createHudText(...)`, and tile map layer view helpers to prove the existing package APIs can support a different gameplay shape from dodge-blocks. This remains example-level gameplay code, not a new framework abstraction or editor workflow.

`v0.25.3` hardens `collect-stars` package API consumption without adding new public API. The example now splits input actions, player movement, actor templates, and gameplay-loop system code into local downstream-style modules, and creates player/star ECS data through `defineActorTemplate(...)` plus `instantiateEntityTemplate(...)`. This proves the existing package-facing actor/template APIs can support a second example while avoiding a collect-stars-specific framework abstraction, editor surface, or launcher product.

`v0.25.4` closes the second playable example stage with documentation and package-boundary coverage only. `examples/dodge-blocks` and `examples/collect-stars` now stand as two downstream-style browser examples with different gameplay loops consuming the same public package APIs. No new framework API is added in this closeout; future extraction should wait for repeated friction across examples, and the boundary remains engine-package runtime/framework/docs work, not an editor, launcher, gallery, marketplace, authoring workflow, or publishing product.

`v0.26.0` starts the framework extraction stage from two playable examples. This planning pass adds no new public API; it documents candidate extraction areas such as bounded directional movement, gameplay loop state helpers, actor/runtime spawn helpers, and read-only gameplay snapshot conventions. Any later helper must be backed by repeated example friction and remain runtime/framework package work, not a visual editor, prefab authoring tool, launcher, gallery, marketplace, persistence layer, or publishing workflow.

`v0.26.1` adds `clampPositionToBounds(...)` to the Node-safe `framework` entrypoint. The helper clamps a desired `{ x, y }` position to rectangular bounds while accounting for optional bounds origin, entity width/height, and symmetric padding. Both `examples/dodge-blocks` and `examples/collect-stars` now consume it for player movement bounds. This is reusable runtime math extracted from repeated example friction, not a generic player controller, collision resolver, level editor, prefab authoring tool, input rebinding UI, launcher, gallery, or content workflow.

`v0.26.2` adds no new public package API. It aligns `examples/collect-stars` with the existing `dodge-blocks` read-only gameplay snapshot convention by exposing an example-owned `getGameplaySnapshot()` path for phase, score, remaining time, active star state, and gameplay activity. This documents a downstream example pattern, not a framework scoring system, timer system, mutable inspector, visual editor, gameplay debugger UI, launcher, gallery, leaderboard, account system, or publishing workflow.

`v0.26.3` adds `attachActorSpriteView(...)` to the Node-safe `framework` entrypoint. The helper creates a sprite through an injected `RenderAdapter`, optionally assigns a sprite asset, attaches the node to a render scene layer, and adds a `ViewComponent` to an existing entity. Both playable examples consume it for sprite-backed actor views. This is a small runtime view-attachment helper, not a generic actor spawn system, prefab format, scene hierarchy editor, asset browser, visual editor, launcher, gallery, marketplace, or content workflow.

`v0.26.4` adds `randomPositionInBounds(...)` to the Node-safe `framework` entrypoint. The helper selects a random top-left `{ x, y }` position within rectangular bounds while accounting for optional bounds origin, entity width/height, and symmetric padding. Both playable examples consume it for runtime actor placement. This is reusable runtime math, not a generic spawn system, spawn scheduler, random service, enemy abstraction, collectable abstraction, map-aware placement engine, visual editor, launcher, gallery, marketplace, or content workflow.

`v0.26.5` closes the framework extraction stage from two playable examples without adding new public package API. The extracted package-facing helpers are `clampPositionToBounds(...)`, `attachActorSpriteView(...)`, and `randomPositionInBounds(...)`; the gameplay snapshot pattern remains example-owned. Player controllers, scoring/timer rules, spawn cadence, enemy/collectable behavior, prefab formats, editor UI, launcher/gallery surfaces, persistence, and content workflows remain outside the engine package.

`v0.27.0` starts the pointer-first puzzle interaction stage. This planning pass adds no new public API; it redirects the next pressure test from directional movement games toward pointer-first / UI-heavy browser games such as simple sorting, matching, bottle-pouring, object grouping, and lightweight interactive narrative flows. The stage remains engine-package runtime/framework work, not a visual editor, puzzle authoring tool, galgame script editor, SDK integration, launcher, gallery, marketplace, account system, monetization, or publishing workflow.

`v0.27.1` adds the pointer position runtime contract to the `framework` entrypoint. `InputSystem` now exposes `setPointerPosition(...)`, `getPointerPosition()`, and `clearPointerPosition()` for Node-safe gameplay code, and `BrowserPointerPositionBridge` writes browser pointer `clientX/clientY` coordinates into that state. This is pointer input state for downstream games to consume; it is not object picking, drag-and-drop, gesture recognition, UI widgets, puzzle rules, editor selection handles, scene graph mutation UI, galgame scripting, or platform SDK integration.

`v0.27.2` adds rectangle hit testing and entity picking helpers to the `framework` entrypoint. `pointInRect(...)`, `getEntityHitRect(...)`, `hitTestEntitiesAtPoint(...)`, and `pickTopEntityAtPoint(...)` let downstream games map pointer coordinates to runtime entities using `TransformComponent + SizeComponent` by default or `ColliderComponent` rectangles when requested. Results include copied rect data and optional layer/filter handling. This is runtime mini-game interaction plumbing, not editor picking, scene graph editing, selection handles, drag/drop behavior, or puzzle rules.

`v0.27.3` adds source-target selection state helpers to the `framework` entrypoint. `createSourceTargetSelectionState(...)`, `selectSourceTargetSource(...)`, `selectSourceTargetTarget(...)`, `clearSourceTargetTarget(...)`, `clearSourceTargetSelection(...)`, and `getSourceTargetSelectionPair(...)` provide a small immutable state pattern for games that select one entity and then target another entity. This supports sorting, grouping, matching, pouring, and point-and-click puzzle flows while keeping move validation, puzzle rules, visual feedback, undo, hints, progression, and editor selection UI outside the engine package.

`v0.27.4` adds no new public package API. It adds `examples/pour-sort` as a routed pointer-first puzzle shell that consumes existing package APIs for browser pointer position, pointer button input, entity picking, source-target selection state, actor view attachment, and HUD text. The route is local example/build coverage for a future puzzle loop; water-sort rules, move validation, liquid rendering, undo, hints, level authoring, visual editor selection handles, launcher/gallery surfaces, marketplace flows, and platform SDK integration remain outside the engine package.

`v0.27.5` adds no new public package API. It turns `examples/pour-sort` into a minimal playable pointer puzzle loop with example-owned bottle state, top-color pour validation, rendered liquid segments, move count, invalid-move feedback, solved-state detection, and a read-only gameplay snapshot. This proves existing pointer position, entity picking, selection state, actor view, and HUD helpers can support a simple bottle-pouring-style browser game while keeping exact puzzle rules, level progression, undo, hints, authoring workflows, and editor UI outside the engine package.

`v0.27.6` closes the pointer-first puzzle interaction stage without adding new public package API. The stage leaves package-facing runtime helpers for pointer position, rectangle hit testing / entity picking, and source-target selection state, plus an example-owned `pour-sort` playable loop that proves those helpers can support a simple rule-driven browser puzzle. Water-sort rules, drag/drop state, undo, hints, level progression, galgame dialogue/choice flow, visual authoring tools, launcher/gallery surfaces, marketplace flows, SDK integration, accounts, ads, monetization, and publishing workflows remain outside the engine package.

`v0.28.0` starts the real sprite / image rendering stage. This planning pass adds no new public API; it focuses the next work on making sprite asset `source` values visibly render through the Leafer adapter and proving image-like sprite consumption in examples. The stage remains adapter/runtime/example integration work, not a visual asset manager, atlas packer, sprite editor, image cropper, asset browser UI, CDN pipeline, bundled art library, marketplace, launcher, gallery, SDK wrapper, monetization, or publishing workflow.

`v0.28.1` adds the image-backed Leafer sprite adapter baseline without changing the public render contract. `RenderSpriteAsset.source` now maps to the native Leafer `Image.url`, while fill-only assets keep the existing fill/width/height/cornerRadius placeholder behavior. This is adapter behavior behind the existing `RenderSprite.setAsset(...)` surface; it is not an asset authoring API, visual asset manager, atlas packer, sprite editor, image cropper, bundled asset library, launcher, gallery, marketplace, SDK wrapper, monetization, or publishing workflow.

`v0.28.2` adds the asset loading to render asset handoff baseline. `AssetRegistry.getSpriteRenderAsset(id)` and `AssetRegistry.requireSpriteRenderAsset(id)` return copied `RenderSpriteAsset` data without registry-only metadata, `SpriteAnimationSystem` applies those render assets to sprite-capable view nodes, and `attachActorSpriteView(...)` can resolve a registered sprite through `assets + assetId`. Render nodes still receive stable asset metadata and `source` strings; the browser adapter owns how that source is rendered. This is not a DOM image object pipeline, bundler plugin, CDN policy, asset browser, atlas packer, editor, launcher, gallery, marketplace, SDK wrapper, monetization, or publishing workflow.

`v0.28.3` adds no new public package API. It updates `examples/dodge-blocks` to consume source-backed sprite assets through the existing `assets + assetId` render handoff path for player and hazard views. This proves image-like example sprite consumption through package-facing APIs while keeping art data example-owned and avoiding asset authoring tools, visual asset managers, bundled asset libraries, marketplaces, launchers, galleries, SDK wrappers, monetization, or publishing workflows.

`v0.28.4` adds no new public package API. It publishes the sprite rendering package boundary in `docs/sprite-rendering.md`, covering `RenderSpriteAsset.source`, Leafer `Image.url` mapping, `AssetRegistry.getSpriteRenderAsset(id)` / `requireSpriteRenderAsset(id)`, `SpriteAnimationSystem`, `attachActorSpriteView(...)`, example-owned data URI or local static image-like sources, and the rule that `/framework` stays DOM-free by passing metadata and `source` strings rather than browser `Image` objects. This is package documentation and publish-boundary work, not an asset editor, visual asset manager, atlas packer, image cropper, CDN pipeline, bundled art library, launcher, gallery, marketplace, SDK wrapper, monetization, or publishing workflow.

`v0.28.5` closes the real sprite / image rendering stage without adding new public package API. The stage leaves source-backed Leafer sprite rendering, copied asset-registry render handoff, source-backed example consumption, and package-facing sprite rendering boundary docs in place. Responsive runtime behavior, drag/drop state, UI/dialogue flow, quick-start game kit helpers, visual asset management, asset authoring, launcher/gallery surfaces, marketplace flows, SDK wrappers, monetization, and publishing workflows remain outside this stage.

`v0.29.0` starts the responsive Web runtime stage without adding new public package API. The stage focuses the next work on render scene resize behavior, browser resize bridging, pointer coordinate consistency after resize, DPR / high-density display documentation or minimal handling, and example verification across desktop and mobile-ish viewports. This remains runtime/adapter/example verification work, not a responsive page builder, visual layout editor, mobile app shell, WeChat SDK wrapper, launcher, gallery, marketplace, monetization, or publishing workflow.

`v0.29.1` adds the render scene resize contract. The Node-safe `adapter/render-types` entrypoint now exposes `RenderSceneViewport`, `createRenderSceneViewport(width, height)`, and `getRenderSceneViewport(renderScene)`, and every `RenderScene` now has `resize(width, height)`. The Leafer adapter updates its viewport state and forwards valid sizes to native Leafer `resize(...)` when mounted. This is render/runtime contract work, not a browser resize observer, responsive page builder, layout editor, mobile app shell, SDK wrapper, launcher, gallery, marketplace, monetization, or publishing workflow.

`v0.29.2` adds an opt-in browser resize bridge. The `/runtime` entrypoint now exports `BrowserResizeBridge`, `createBrowserResizeBridge(...)`, and related injected-observer types. `createBrowserRuntime(...)` accepts a `resize` option that can attach this bridge after mount and detach it on `stop()`. The bridge reads `ResizeObserver` entries or target dimensions and calls `RenderScene.resize(...)`; it does not add a responsive page builder, layout system, mobile app shell, SDK wrapper, launcher, gallery, marketplace, monetization, publishing workflow, or device compatibility matrix.

`v0.29.3` adds pointer coordinate consistency after resize. The Node-safe `/framework` entrypoint now exports `createBrowserPointerLocalPositionResolver(target)` and `getBrowserPointerLocalPosition(event, target)`, which convert browser `clientX/clientY` into mount-local coordinates by reading the target bounds on each event. `examples/pour-sort` now consumes the shared resolver for pointer picking. This remains pointer coordinate plumbing, not drag/drop state, gesture recognition, multi-touch gameplay, editor selection handles, responsive layout rules, mobile app shell, SDK wrapper, launcher, gallery, marketplace, monetization, or publishing workflow.

`v0.29.4` adds no new public package API. It enables `resize: true` in the shared browser example route and the standalone `dodge-blocks` example entry so examples consume the opt-in browser resize bridge through package-facing runtime setup. This verifies desktop and mobile-ish mount sizes while keeping layout and gameplay choices example-owned; it is not a responsive page builder, launcher, gallery, design system, mobile app shell, SDK wrapper, marketplace, monetization, or publishing workflow.

`v0.29.5` closes the responsive Web runtime stage without adding new public package API. The stage leaves render scene resizing, Node-safe viewport metadata helpers, the opt-in browser resize bridge, runtime resize attachment/teardown, pointer-local coordinate helpers, and responsive example verification in place. DPR / high-density display behavior is documented as CSS-pixel viewport synchronization, with native Leafer rendering owning backing-store details. Drag/drop state, UI/dialogue flow, quick-start presets, visual layout tools, launchers, galleries, SDK wrappers, monetization, and publishing workflows remain outside this stage.

`v0.30.0` starts the drag/drop and selection hardening stage without adding new public package API. The stage focuses the next work on immutable selection snapshots, drag state bookkeeping, source-target action data, and pointer puzzle example hardening while keeping puzzle rules example-owned. It is not a gesture recognition system, multi-touch gameplay framework, editor selection layer, physics engine, water-sort rules engine, solver, launcher, gallery, marketplace, SDK wrapper, monetization, or publishing workflow.

`v0.30.1` hardens the source-target selection helpers. The `/framework` entrypoint now exports `EntitySelectionSnapshotRef`, `SourceTargetSelectionSnapshot`, `getSourceTargetSelectionSnapshot(state)`, `isSourceTargetSelectionReady(state)`, `replaceSourceTargetSelectionSource(state, entity)`, and `replaceSourceTargetSelectionTarget(state, entity, options)`. These helpers provide copied selection snapshots, generic readiness checks, and explicit immutable replacement operations for pointer-first games. They do not add drag state, drop target resolution, puzzle rules, solver logic, gesture recognition, multi-touch gameplay, editor selection handles, launcher, gallery, SDK wrapper, monetization, or publishing workflow.

`v0.30.2` adds the entity drag state baseline. The `/framework` entrypoint now exports `EntityDragPointerPosition`, `EntityDragRef`, `EntityDragSnapshotRef`, `EntityDragState`, `EntityDragSnapshot`, `EntityDragTransition`, `createEntityDragState()`, `startEntityDrag(state, entity, pointerPosition)`, `moveEntityDrag(state, pointerPosition)`, `completeEntityDrag(state, pointerPosition?)`, `cancelEntityDrag(state, pointerPosition?)`, `isEntityDragActive(state)`, `getEntityDragDelta(state)`, and `getEntityDragSnapshot(state)`. These helpers provide generic active entity drag identity, copied start/current pointer positions, pointer-local deltas, and deterministic completed/cancelled snapshots. They do not add drop target resolution, source-target action validation, gesture recognition, multi-touch gameplay, physics simulation, puzzle rules, editor drag handles, launcher, gallery, SDK wrapper, monetization, or publishing workflow.

`v0.30.3` adds the source-target action baseline. The `/framework` entrypoint now exports `SourceTargetActionRef`, `SourceTargetAction`, `SourceTargetActionSnapshot`, `SourceTargetActionValidationResult`, `createSourceTargetAction(type, source, target)`, `createSourceTargetActionFromSelection(type, state)`, `getSourceTargetActionSnapshot(action)`, `allowSourceTargetAction(action)`, `blockSourceTargetAction(action, reason)`, and `isSourceTargetActionAllowed(result)`. These helpers provide generic source id / target id action data, copied deterministic action snapshots, and explicit allowed/blocked result envelopes. They do not add drop target resolution, water-sort validation, match-3 validation, merge rules, inventory rules, scoring, solvers, gesture recognition, multi-touch gameplay, physics simulation, editor drag handles, launcher, gallery, SDK wrapper, monetization, or publishing workflow.

`v0.30.4` adds no new public package API. It hardens `examples/pour-sort` so the pointer puzzle example consumes `getSourceTargetSelectionSnapshot(state)`, `createSourceTargetActionFromSelection(type, state)`, `allowSourceTargetAction(action)`, `blockSourceTargetAction(action, reason)`, and `getSourceTargetActionSnapshot(action)` while keeping pour-sort rules example-owned. Water-sort validation, match-3 validation, merge rules, inventory rules, solvers, scoring, undo/hint systems, gesture recognition, multi-touch gameplay, physics simulation, editor drag handles, launcher, gallery, SDK wrapper, monetization, and publishing workflow remain outside the engine package.

`v0.30.5` closes the drag/drop and selection hardening stage without adding new public package API. The stage leaves copied selection snapshots/readiness, immutable selection replacement helpers, entity drag state snapshots/deltas, source-target action envelopes, copied action snapshots, explicit allowed/blocked action results, and `pour-sort` example consumption in place. Drop target resolution, puzzle rules, solvers, undo/hint systems, gesture recognition, multi-touch gameplay, physics simulation, editor drag handles, editor selection handles, visual layout tools, launcher, gallery, marketplace, SDK wrapper, accounts, ads, monetization, mobile app shells, and publishing workflows remain outside the engine package.

`v0.31.0` starts the UI / dialogue / scene flow stage without adding new public package API. The stage focuses the next work on dialogue text and choice data contracts, choice state helpers, screen-space prompt rendering, scene-flow transitions, and a narrative example while keeping story content and UI layout example-owned. It is not a visual novel scripting language, branching story editor, dialogue timeline editor, visual UI builder, scene graph editor, launcher, gallery, marketplace, SDK wrapper, account system, ads, monetization, analytics service, mobile app shell, or publishing workflow.

`v0.31.1` adds the dialogue text / choice data contract baseline. The `/framework` entrypoint now exports `DialogueLine`, `DialogueChoice`, `DialoguePrompt`, `DialoguePromptSnapshot`, `DialogueLineInput`, `DialogueChoiceInput`, `DialoguePromptInput`, `defineDialogueLine(input)`, `defineDialogueChoice(input)`, `defineDialoguePrompt(input)`, and `getDialoguePromptSnapshot(prompt)`. These helpers provide normalized dialogue line data, normalized choice data, copied prompt snapshots, and duplicate choice id validation. They do not add choice selection state, scene transitions, prompt rendering, a visual novel scripting language, branching story editor, dialogue timeline editor, localization management, save/load framework, story graph mutation UI, visual UI builder, launcher, gallery, marketplace, SDK wrapper, monetization, analytics, mobile app shell, or publishing workflow.

`v0.31.2` adds the choice state helper baseline. The `/framework` entrypoint now exports `DialogueChoiceStatePhase`, `DialogueChoiceState`, `DialogueChoiceStateSnapshot`, `createDialogueChoiceState(prompt)`, `selectDialogueChoice(state, choiceId)`, `clearDialogueChoiceSelection(state)`, `resolveDialogueChoiceSelection(state)`, `getSelectedDialogueChoice(state)`, `getResolvedDialogueChoice(state)`, `isDialogueChoiceSelected(state)`, `isDialogueChoiceResolved(state)`, and `getDialogueChoiceStateSnapshot(state)`. These helpers provide immutable current-prompt choice state, selected choice id tracking, prompt-owned choice validation, copied choice state snapshots, and a deterministic resolved choice handoff for downstream flow logic. They do not add scene transitions, story graph traversal, choice effects, visual novel scripting, branching story editor, dialogue timeline editor, localization management, save/load framework, visual UI builder, launcher, gallery, marketplace, SDK wrapper, monetization, analytics, mobile app shell, or publishing workflow.

`v0.31.3` adds the screen-space prompt view baseline. The `/framework` entrypoint now exports `DialoguePromptViewOptions`, `DialoguePromptView`, and `createDialoguePromptView(renderAdapter, renderScene, options)`. This helper builds on `createHudText(...)` to create screen-space dialogue line and choice text nodes, attach them to the `ui` layer by default or `overlay` when requested, update the displayed prompt, toggle visibility, and return copied prompt snapshots. It does not add a visual UI builder, layout engine, theme system, component library, visual novel scripting language, branching story editor, dialogue timeline editor, story graph traversal, localization management, save/load framework, launcher, gallery, marketplace, SDK wrapper, monetization, analytics, mobile app shell, or publishing workflow.

`v0.31.4` adds no new public package API. It adds `examples/dialogue-choice` as a routed narrative example shell that consumes `defineDialoguePrompt(...)`, `createDialogueChoiceState(prompt)`, `selectDialogueChoice(state, choiceId)`, `resolveDialogueChoiceSelection(state)`, `getDialogueChoiceStateSnapshot(state)`, `createDialoguePromptView(renderAdapter, renderScene, options)`, `InputActionMap`, `BrowserKeyboardBridge`, `GameFlow`, and `startSceneWithLifecycle(...)`. The example validates prompt rendering, keyboard choice focus, choice resolution, and a read-only gameplay snapshot while keeping prompt content, choice effects, scene transitions, and layout example-owned. It does not add a visual novel scripting language, branching story editor, timeline editor, story graph traversal, reusable story format, visual UI builder, launcher, gallery, marketplace, SDK wrapper, monetization, analytics, mobile app shell, or publishing workflow.

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
  createTileMapLayerView,
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
  createTileMapLayerView,
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
- `framework` should stay usable for logic tests and reusable gameplay primitives, including input action mapping, pointer button action bindings, browser pointer button bridging, collision pair query snapshots, audio data contracts/runtime intent state, scene-owned audio runtime system integration, audio playback adapter contracts, update-driven audio playback draining system integration, deterministic audio operation draining, camera viewport/coordinate conversion helpers, camera bounds/follow clamping primitives, sprite animation timing helpers, component/system behavior, deterministic runtime event dispatch, update-driven scheduling, opt-in scene runtime service integration, data-driven scene config validation, safe scene config bootstrap, render/view synchronization, render-node capability checks, tile map data contracts, tile map layer view runtime consumption, level spawn/region metadata, and optional scene config level/map declarations.
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
- `docs/runtime-ownership.md`
- `docs/sprite-rendering.md`
- all JS and type declaration targets from `package.json` exports

It also checks that development-only paths such as `src`, `tests`, `examples`, `dist`, `scripts`, and `node_modules` are not included.
