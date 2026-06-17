# Public API Inventory

This document describes the current package-facing API boundary for `@shuangxunian/leafer-game-engine`.

The project is a frontend 2D game engine dependency package. It is not an editor package.

`0.10.x` completed the first package-facing API boundary baseline: entrypoints are documented, Node-safe imports are smoke-tested, package artifacts can be verified, and examples use package-style imports during local development.

`0.11.x` closed the sprite animation runtime baseline: the Node-safe `framework` entrypoint includes sprite animation data contracts, deterministic playback timing helpers, and ECS animation component/system behavior. The Node-safe `tooling` entrypoint exposes read-only sprite animation state.

For the animation-specific boundary across asset metadata, playback helpers, ECS behavior, render application, example consumption, and read-only tooling visibility, see [Sprite Animation Runtime Boundary](animation-runtime.md).

`0.12.x` starts the runtime services baseline with a Node-safe `EventBus` for deterministic gameplay/runtime event dispatch, a Node-safe `RuntimeScheduler` for update-driven delayed/repeated tasks, and opt-in scene integration through `RuntimeServicesSystem`.

---

## Package Entrypoints

Current package exports are defined in `package.json`:

| Entrypoint | Intended Use | Node Import Smoke Test |
| --- | --- | --- |
| `@shuangxunian/leafer-game-engine` | Browser-facing convenience root that re-exports engine layers | Not Node-safe yet |
| `@shuangxunian/leafer-game-engine/core` | Engine core: game loop, scene, world, entity, component, system, time | Yes |
| `@shuangxunian/leafer-game-engine/framework` | Reusable gameplay/framework primitives: input, collision, assets, sprite animation, schema, game flow, event bus, scheduler, runtime services | Yes |
| `@shuangxunian/leafer-game-engine/tooling` | Runtime snapshots, formatting, and panel section builders | Yes for import; DOM panel classes require browser usage |
| `@shuangxunian/leafer-game-engine/adapter` | Browser/render adapter integration, including Leafer adapter | Browser-facing |
| `@shuangxunian/leafer-game-engine/runtime` | Browser runtime assembly plus runtime helpers | Browser-facing today |

---

## Node-Safe Imports

These imports are expected to work in Node-side tests:

```ts
import { Scene } from "@shuangxunian/leafer-game-engine/core";
import {
  EventBus,
  GameFlow,
  RuntimeScheduler,
  RuntimeServicesSystem,
  SpriteAnimationComponent,
  SpriteAnimationSystem,
  addRuntimeServices,
  createSpriteAnimationPlayback
} from "@shuangxunian/leafer-game-engine/framework";
import { createToolingSnapshot, formatSpriteAnimationSnapshot } from "@shuangxunian/leafer-game-engine/tooling";
```

The smoke tests intentionally use the real package name so they exercise `package.json` exports.

---

## Recommended Import Patterns

Use the root package entrypoint for browser game bootstrapping:

```ts
import { Scene, createBrowserRuntime } from "@shuangxunian/leafer-game-engine";
```

Use subpath entrypoints for pure engine logic, framework primitives, and Node-side tests:

```ts
import { Scene } from "@shuangxunian/leafer-game-engine/core";
import {
  EventBus,
  GameFlow,
  RuntimeScheduler,
  RuntimeServicesSystem,
  SpriteAnimationComponent,
  SpriteAnimationSystem,
  addRuntimeServices,
  createSpriteAnimationPlayback
} from "@shuangxunian/leafer-game-engine/framework";
import { createToolingSnapshot, formatSpriteAnimationSnapshot } from "@shuangxunian/leafer-game-engine/tooling";
```

This keeps browser runtime dependencies out of tests that only need ECS, gameplay flow, event dispatch, update-driven scheduling, scene runtime service ownership, assets, sprite animation playback/system behavior, scene config, or snapshot formatting.

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
import { createBrowserRuntime } from "@shuangxunian/leafer-game-engine/runtime";
import { LeaferRenderAdapter } from "@shuangxunian/leafer-game-engine/adapter";
```

They should be verified through browser/example builds until the package is split into more granular runtime subpaths.

---

## Current Boundary Notes

- `core` should stay independent from browser and rendering implementations.
- `framework` should stay usable for logic tests and reusable gameplay primitives, including sprite animation timing helpers, component/system behavior, deterministic runtime event dispatch, update-driven scheduling, and opt-in scene runtime service integration.
- `tooling` can expose structured snapshots and formatters in Node, including read-only sprite animation state, but browser panel classes should only be constructed in a DOM environment.
- `adapter` is render-implementation-facing and can depend on Leafer.
- `runtime` currently includes browser runtime assembly, so importing the broad runtime entrypoint in Node is not guaranteed to work.
- Future package-boundary work may split browser runtime APIs into more explicit entrypoints.

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
- all JS and type declaration targets from `package.json` exports

It also checks that development-only paths such as `src`, `tests`, `examples`, `dist`, `scripts`, and `node_modules` are not included.
