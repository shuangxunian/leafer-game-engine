# Sprite Animation Runtime Boundary

## Purpose

`leaferGame` sprite animation support is part of the frontend 2D game engine package.

It gives downstream games a reusable path from asset metadata to deterministic playback, ECS integration, render application, example consumption, and read-only tooling visibility.

It is not a visual timeline editor, asset browser, atlas packer, or content authoring workflow.

## Layers

### Asset Data

Sprite animation data starts in the framework asset model:

- `SpriteFrame` describes a named frame and the sprite asset it uses.
- `SpriteAnimationClip` describes ordered frame ids, default frame duration, and loop behavior.
- `AssetManifest.frames` and `AssetManifest.clips` let consumers register frames and clips alongside sprite assets.
- `AssetRegistry` stores sprites, frames, and clips, and exposes `get...` / `require...` lookup APIs.

Frame `x` and `y` metadata is preserved for future atlas/source-rect work, but current rendering applies whole sprite assets plus optional frame width/height.

### Playback Helpers

Pure helpers in `framework` handle deterministic playback:

- `createSpriteAnimationPlayback(...)`
- `advanceSpriteAnimationPlayback(...)`
- `getSpriteAnimationPlaybackFrameIndex(...)`
- `getSpriteAnimationPlaybackFrameId(...)`
- `pauseSpriteAnimationPlayback(...)`
- `resumeSpriteAnimationPlayback(...)`
- `stopSpriteAnimationPlayback(...)`

These helpers are Node-safe and do not require a render adapter, browser runtime, or scene.

### ECS Runtime

The framework ECS layer connects playback to entities:

- `SpriteAnimationComponent` stores the active clip id, playback state, current frame id, and current sprite id.
- `SpriteAnimationSystem` resolves clips/frames through `AssetRegistry`, advances playback, and can apply the current frame to a `ViewComponent` whose render node supports `setAsset(...)`.

The system can update animation state without a view component. If a view is present, it remains render-adapter agnostic and only depends on the existing sprite-capable render node contract.

### Example Consumption

`examples/dodge-blocks` consumes these APIs through package-style imports:

- declares player sprite assets, frames, and clip in the asset manifest
- preloads those assets through the existing scene lifecycle path
- attaches `SpriteAnimationComponent` to the player
- runs `SpriteAnimationSystem` as a scene system

The example remains a consumer integration sample, not engine implementation.

### Tooling Visibility

Tooling exposes read-only runtime observability:

- `createToolingSnapshot(scene, { animations: true })`
- `createSpriteAnimationSnapshot(...)`
- `formatSpriteAnimationSnapshot(...)`
- `createSpriteAnimationsPanelSection(...)`

The browser tooling panel can show entity id/name, clip id, playback status, current frame, current sprite, frame index, elapsed time, and completed loop count.

Tooling does not mutate animation state and is not an editor surface.

## Current Limitations

The current sprint intentionally does not include:

- atlas source-rect rendering
- render adapter cropping
- timeline editing
- animation blending
- animation events
- transition graphs
- skeletal animation
- particle systems
- editor or asset browser UI

Those capabilities can be added in future engine stages if they remain reusable package APIs.

## Consumer Guidance

Use `@shuangxunian/leafer-game-engine/framework` for reusable animation runtime behavior:

```ts
import {
  AssetRegistry,
  SpriteAnimationComponent,
  SpriteAnimationSystem
} from "@shuangxunian/leafer-game-engine/framework";
```

Use `@shuangxunian/leafer-game-engine/tooling` for read-only animation observability:

```ts
import {
  createToolingSnapshot,
  formatSpriteAnimationSnapshot
} from "@shuangxunian/leafer-game-engine/tooling";
```

Keep game-specific animation choices in downstream manifests and scene setup. Move only reusable behavior back into the engine package.

