# Render/View Contract

## Purpose

`leaferGame` render/view support is part of the frontend 2D game engine package.

It defines how ECS entities connect to render nodes, how render scene layers are organized, and which lifecycle boundaries belong to the engine package versus downstream game code.

It is not a scene editor, visual hierarchy editor, layer authoring tool, component value editor, asset manager, shader tool, or content production workflow.

## Render Node Ownership

`RenderNode` is the adapter-facing shape used by engine components and systems:

- position: `x`, `y`
- optional size: `width`, `height`
- transform: `rotation`, `scaleX`, `scaleY`
- visibility: `visible`
- cleanup: `destroy()`

`ViewComponent` owns the render node passed to it. When the component is destroyed, it calls `node.destroy()`.

`ViewComponent.syncFromTransform(transform, size?)` copies ECS transform data into the render node. If a `SizeComponent` is provided, width and height are copied too. If size is omitted, existing node dimensions are left untouched.

## Sprite-Capable Nodes

Sprite animation can apply frame assets only to render nodes that support `setAsset(...)`.

The framework exposes `isSpriteCapableRenderNode(...)` for this structural capability check. The guard is adapter-agnostic: custom render adapters can satisfy the contract by providing a compatible `setAsset(asset)` method on sprite nodes.

## Render Scene Layers

Every `RenderScene` exposes these layers in stable order:

1. `background`
2. `world`
3. `ui`
4. `overlay`

The Node-safe `@shuangxunian/leafer-game-engine/adapter/render-types` entrypoint exports:

- `RENDER_SCENE_LAYER_ORDER`
- `getRenderSceneLayerNames(renderScene)`

Layer responsibilities:

- `background`: non-gameplay backdrop visuals.
- `world`: gameplay and world-space nodes, including camera-driven content.
- `ui`: screen-space HUD and game UI.
- `overlay`: top-level screen-space modal, pause, status, or debug-facing overlays.

`CameraSystem` transforms the `world` layer. UI and overlay nodes should remain screen-space unless a downstream game intentionally applies its own transforms.

## Lifecycle

`RenderScene.destroy()` owns renderer-level cleanup.

If a game scene receives and owns a `RenderScene`, it should call `renderScene.destroy()` when the scene is destroyed. If another owner manages the render scene lifecycle, that ownership should be explicit in downstream code.

`examples/dodge-blocks` demonstrates the current ownership model: the example scene receives a render scene from browser runtime setup and destroys it during scene teardown.

## Tooling Boundary

Tooling can read render viewport and layer state for runtime observability. It should not mutate render layers, move nodes, edit scene graphs, or become an editor surface in this package.

Render snapshots use the shared layer order so browser panels, logs, and tests describe layers consistently.
