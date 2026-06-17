# Public API Inventory

This document describes the current package-facing API boundary for `@shuangxunian/leafer-game-engine`.

The project is a frontend 2D game engine dependency package. It is not an editor package.

---

## Package Entrypoints

Current package exports are defined in `package.json`:

| Entrypoint | Intended Use | Node Import Smoke Test |
| --- | --- | --- |
| `@shuangxunian/leafer-game-engine` | Browser-facing convenience root that re-exports engine layers | Not Node-safe yet |
| `@shuangxunian/leafer-game-engine/core` | Engine core: game loop, scene, world, entity, component, system, time | Yes |
| `@shuangxunian/leafer-game-engine/framework` | Reusable gameplay/framework primitives: input, collision, assets, schema, game flow | Yes |
| `@shuangxunian/leafer-game-engine/tooling` | Runtime snapshots, formatting, and panel section builders | Yes for import; DOM panel classes require browser usage |
| `@shuangxunian/leafer-game-engine/adapter` | Browser/render adapter integration, including Leafer adapter | Browser-facing |
| `@shuangxunian/leafer-game-engine/runtime` | Browser runtime assembly plus runtime helpers | Browser-facing today |

---

## Node-Safe Imports

These imports are expected to work in Node-side tests:

```ts
import { Scene } from "@shuangxunian/leafer-game-engine/core";
import { GameFlow } from "@shuangxunian/leafer-game-engine/framework";
import { createToolingSnapshot } from "@shuangxunian/leafer-game-engine/tooling";
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
import { GameFlow } from "@shuangxunian/leafer-game-engine/framework";
import { createToolingSnapshot } from "@shuangxunian/leafer-game-engine/tooling";
```

This keeps browser runtime dependencies out of tests that only need ECS, gameplay flow, assets, scene config, or snapshot formatting.

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
- `framework` should stay usable for logic tests and reusable gameplay primitives.
- `tooling` can expose structured snapshots and formatters in Node, but browser panel classes should only be constructed in a DOM environment.
- `adapter` is render-implementation-facing and can depend on Leafer.
- `runtime` currently includes browser runtime assembly, so importing the broad runtime entrypoint in Node is not guaranteed to work.
- Future `0.10.x` work should make root/subpath guidance clearer and may split browser runtime APIs into more explicit entrypoints.
