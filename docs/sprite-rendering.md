# Sprite Rendering Boundary

This document describes the package-facing sprite rendering boundary for
`@shuangxunian/leafer-game-engine`.

The goal is real visual asset rendering for lightweight Web 2D games. A
downstream game should be able to declare a sprite asset with a stable `source`,
hand that asset through framework helpers, and see the image-like source reach
the browser render adapter.

This is runtime/render integration, not an asset authoring workflow.

---

## Runtime Contract

Sprite rendering uses the existing render asset shape:

- `RenderSpriteAsset.source` carries an image-like URL or data URI string.
- `RenderSpriteAsset.fill`, `width`, `height`, and `cornerRadius` remain usable
  for placeholder rectangle rendering.
- `RenderSprite.setAsset(...)` is still the render node boundary.

The Leafer adapter maps `RenderSpriteAsset.source` to the native Leafer
`Image.url`. If an asset has no `source`, fill-based placeholder behavior stays
available so examples and tests can still use simple colored shapes.

The render contract passes metadata and source strings. It does not require a
loaded DOM image object, canvas image object, decoded bitmap, or framework-owned
media element.

---

## Asset Registry Handoff

`AssetRegistry` owns package-facing sprite asset records and exposes render-safe
copies for view nodes:

- `AssetRegistry.getSpriteRenderAsset(id)` returns a copied render asset or
  `undefined`.
- `AssetRegistry.requireSpriteRenderAsset(id)` returns a copied render asset or
  throws if the id is missing.

Those helpers strip registry-only state and hand render nodes stable asset
metadata plus `source` strings.

`SpriteAnimationSystem` consumes `requireSpriteRenderAsset(...)` when applying
animation frames to sprite-capable render nodes. `attachActorSpriteView(...)`
can also resolve a registered sprite with `assets + assetId`, create the sprite
view, and attach the view component without callers reaching into registry
internals.

---

## Node-Safe Boundary

The `/framework` entrypoint stays DOM-free.

Framework helpers can carry ids, dimensions, fills, frame metadata, animation
state, and `source` strings, but they should not create browser `Image`
instances, fetch image bytes, decode bitmaps, inspect files, or depend on Leafer
browser classes. Browser-facing rendering remains the job of `/adapter`,
`/runtime`, and downstream browser applications.

This keeps Node-side logic tests able to use asset and animation helpers without
installing a DOM or canvas implementation.

---

## Example Consumption

Examples can use data URI or local static image-like sources as example-owned
art data. The `dodge-blocks` example proves this path by declaring
source-backed sprite assets and consuming them through `assets + assetId` for
player and hazard views.

Example art choices remain local to examples. Game-specific visuals, puzzle
rules, level data, and content decisions should not become engine package API
unless repeated downstream friction proves a small runtime/framework helper is
needed.

---

## Out Of Scope

Sprite rendering support does not add:

- a visual asset manager
- an asset editor
- an atlas packer
- a sprite editor
- an image cropper
- a CDN pipeline
- a bundled art library
- a marketplace
- a launcher or gallery
- a WeChat SDK wrapper
- accounts, ads, monetization, or publishing workflow

Those can be future downstream products, but this package should stay focused
on runtime, framework, adapter, package API, read-only tooling, and example
consumption boundaries.
