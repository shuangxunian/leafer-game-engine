# API Stability Audit

This document records the stabilization baseline for the public API surface of
`@shuangxunian/leafer-game-engine`.

It started as a 1.0 release-candidate preparation note and now records the
`v1.0.0` release baseline. It does not introduce new runtime APIs.

It treats the current package entrypoints as the 1.0 release shape.

---

## Public Entrypoints

The package intentionally exposes these entrypoints:

| Entrypoint | Status Toward 1.0 | Boundary |
| --- | --- | --- |
| `@shuangxunian/leafer-game-engine` | Browser-facing convenience entrypoint | Re-exports engine layers for browser game boot paths |
| `@shuangxunian/leafer-game-engine/core` | Stable candidate | Node-safe ECS, scene, world, game loop, time, and system primitives |
| `@shuangxunian/leafer-game-engine/framework` | Stable candidate with normal additive growth only | Node-safe gameplay/framework primitives and data contracts |
| `@shuangxunian/leafer-game-engine/tooling` | Stable candidate for read-only diagnostics | Runtime snapshots, formatting helpers, and browser panel section builders |
| `@shuangxunian/leafer-game-engine/adapter/render-types` | Stable candidate | Node-safe render contracts and layer helpers |
| `@shuangxunian/leafer-game-engine/adapter` | Browser/render integration | Leafer adapter integration and browser-facing render assembly |
| `@shuangxunian/leafer-game-engine/runtime` | Browser runtime assembly | Browser runtime, frame loop, lifecycle, resize, and opt-in audio playback helpers |

The current export map is the intended 1.0 candidate shape. New entrypoints
should require a concrete repeated downstream need and a package-boundary test.

---

## Node-Safe Boundary

These entrypoints must remain importable in Node-side tests:

- `/core`
- `/framework`
- `/tooling`
- `/adapter/render-types`

Node-safe entrypoints must not require DOM globals at import time. Browser bridge
classes can stay in `/framework` only when they accept injected targets for
tests and do not touch browser globals until construction or explicit use.

---

## Browser-Facing Boundary

These entrypoints can remain browser-facing:

- root package entrypoint
- `/adapter`
- `/runtime`

Browser-facing code can depend on Leafer or browser APIs, but it should stay
explicitly opt-in from downstream game boot paths.

---

## Package File Boundary

Package-facing docs should ship with the npm package when they explain public
entrypoints, runtime ownership, quick-start assembly, or 1.0 API stability.

The `v0.33.0` package file baseline includes:

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
- `docs/quick-start-game-kit.md`
- `docs/api-stability-audit.md`
- `docs/ai-development-reference.md`
- `docs/project-history.md`

Version notes under `docs/version/` remain repository history rather than npm
package payload by default.

`v0.33.1` hardens package artifact verification so `npm run verify:package`
derives required package-facing docs from `package.json.files`, keeps export-map
targets checked, and rejects `docs/version/` release-history files from the npm
package.

`v0.33.2` locks public entrypoint documentation by deriving package entrypoint
names from the package export map and requiring both this audit and
`docs/public-api.md` to mention every public entrypoint.

`v0.33.3` aligns package metadata with the public export map by requiring
package `main` / `types` metadata to match the root export targets and by
checking built JavaScript and declaration targets for every public entrypoint.

`v1.0.0` keeps the same public entrypoint shape and promotes the stabilized
package/API boundary to the first release baseline.

---

## Change Policy After 1.0.0

Allowed after 1.0:

- additive docs that clarify existing APIs
- package-boundary tests that lock expected entrypoints and published files
- small bug fixes that preserve current public contracts
- example cleanup that keeps examples as downstream package consumers
- additive helper APIs only when repeated example friction proves a generic need

Avoid after 1.0:

- removing or renaming public exports
- adding broad new entrypoints
- moving browser-only dependencies into Node-safe entrypoints
- turning examples into engine-owned game rules
- adding a project generator, visual editor, launcher, gallery, marketplace,
  SDK wrapper, account system, ads, monetization, analytics, publishing flow, or
  content authoring workflow

If a breaking change becomes unavoidable after `1.0.0`, it should be documented
in `docs/public-api.md`, covered by tests, and handled as a major-version
boundary.

---

## 1.0 Drift Check

This audit keeps the project pointed at a lightweight Web 2D game engine
package:

- public entrypoints are explicit
- Node-safe subpaths stay Node-safe
- browser-only assembly stays opt-in
- package-facing docs ship with the package
- game-specific rules stay in downstream examples
- editor, launcher, marketplace, SDK, monetization, and publishing surfaces stay
  out of this repository
