# leaferGame 1.0 Review Outline

## Purpose

This is a local working outline for keeping the project pointed at `1.0.0`.

It is intentionally short. Before starting or closing each implementation slice, review the current work against this outline to avoid drifting into editor, launcher, marketplace, or one-off demo work.

Keep this file as the lightweight project review checklist while moving toward `1.0.0`.

---

## 1.0 Definition

`leaferGame 1.0.0` should be:

**A lightweight Web 2D game engine package that lets a frontend developer quickly build common browser mini-games and interactive content.**

It should support:

- 4399-style browser mini-games
- WeChat-mini-game-like lightweight puzzle interactions
- pointer-first games such as sorting, grouping, pouring, matching, selecting, and dragging
- basic galgame / interactive narrative flows

It does not need to be:

- a mature commercial engine
- a visual editor
- a full content production suite
- a publishing platform
- a marketplace
- a WeChat SDK wrapper

---

## Required 1.0 Capability Areas

### 1. Real Visual Asset Rendering

Required before 1.0:

- image-backed sprite rendering
- asset `source` should reach the Leafer render node
- enough sprite support for simple characters, items, backgrounds, icons, and puzzle objects
- examples should use at least some real image-like assets instead of only colored rectangles

Not required before 1.0:

- advanced atlas packing
- skeletal animation
- particle editors
- visual asset manager UI

### 2. Responsive Web Runtime

Required before 1.0:

- runtime can react to container resize
- viewport width/height can update safely
- pointer coordinates can be mapped consistently after resize
- DPR / high-density display behavior is at least documented or minimally handled
- examples remain usable on desktop and mobile-ish viewports

Not required before 1.0:

- full device compatibility matrix
- platform-specific publishing wrappers
- mobile app shell

### 3. Pointer-First Interaction

Required before 1.0:

- pointer position state
- pointer viewport/local coordinate helpers
- world coordinate conversion where camera is involved
- rectangle hit testing / entity picking
- selection state pattern
- basic drag/drop or source-target interaction baseline
- pointer-first playable example

Not required before 1.0:

- complex gesture recognition
- multi-touch gameplay systems
- visual editor selection handles

### 4. Fast Game Assembly

Required before 1.0:

- a small "game kit" or quick-start layer that reduces boilerplate for common scenes
- clear setup path for input, render scene, systems, HUD, assets, and flow
- examples should feel like downstream games, not engine internals
- a new small game should not require copy-pasting large scene files

Not required before 1.0:

- no-code authoring
- template marketplace
- project generator CLI unless clearly necessary

### 5. UI, Dialogue, And Scene Flow

Required before 1.0:

- enough screen-space UI primitives for menus, prompts, overlays, and status text
- basic scene transition / route pattern
- dialogue or choice-flow baseline sufficient for a galgame-style prototype
- example proving simple interactive narrative flow

Not required before 1.0:

- full VN scripting language
- branching story editor
- save-file migration framework
- character/background asset authoring workflow

### 6. Package/API Stability

Required before 1.0:

- public entrypoints are intentional and documented
- Node-safe subpaths remain Node-safe
- browser-only subpaths are clearly marked
- core lifecycle and package-boundary tests stay green
- no large public API churn immediately before 1.0

Not required before 1.0:

- perfect API surface
- every possible gameplay abstraction

---

## Suggested Road To 1.0

### `0.27.x` Pointer-First Puzzle Interaction

Goal:

- move beyond keyboard/directional movement examples
- build pointer-first runtime primitives
- start a puzzle-style example

Likely slices:

- pointer position runtime contract
- rectangle hit testing / entity picking
- source-target selection pattern
- pointer puzzle example shell
- pointer puzzle playable loop
- stage closeout

### `0.28.x` Real Sprite / Image Rendering

Goal:

- make `source` assets visibly render through the Leafer adapter
- stop relying mostly on colored rectangle placeholders

Likely slices:

- image-backed sprite adapter baseline
- asset loading to render asset handoff
- example image asset consumption
- sprite rendering docs / package boundary

### `0.29.x` Responsive Runtime

Goal:

- make Web page game runtime behave sanely across container sizes and mobile-ish viewports

Likely slices:

- render scene resize contract
- browser resize bridge
- pointer coordinate conversion after resize
- example responsive verification

### `0.30.x` Drag/Drop And Selection

Goal:

- support common puzzle interactions like dragging objects, selecting sources/targets, pouring/sorting/matching

Likely slices:

- selection state helper or pattern
- drag state baseline
- source-target action baseline
- pointer puzzle example hardening

### `0.31.x` UI / Dialogue / Scene Flow

Goal:

- support lightweight galgame / interactive narrative prototypes

Likely slices:

- dialogue text / choice data contract
- scene flow / transition helper
- narrative example shell
- narrative example playable flow

### `0.32.x` Quick-Start Game Kit

Goal:

- reduce boilerplate for building a new small Web game

Likely slices:

- scene setup helper
- runtime services preset
- input + HUD + audio setup convention
- quick-start README example

### `0.33.x` To `0.35.x` Stabilization And 1.0 RC

Goal:

- stop expanding scope
- stabilize API
- harden examples
- close gaps before `1.0.0`

Likely slices:

- API audit
- package boundary audit
- example cleanup
- test hardening
- 1.0 release candidate docs

---

## Drift Checks Before Each Slice

Before implementation, ask:

- Does this help a developer build a Web mini-game faster?
- Is this runtime/framework/package work rather than editor or platform work?
- Can it be validated through tests or a small example?
- Is it generic enough for more than one game shape?
- If it is game-specific, does it stay inside `examples/`?

If the answer is no, do not implement it in the engine package.

---

## Drift Checks After Each Slice

Before commit/push, check:

- Did the change stay scoped?
- Did public API grow only where necessary?
- Did examples remain downstream consumers?
- Did tests cover the new behavior?
- Did `npm run check` and `npm test` pass?
- Did this avoid editor, launcher, marketplace, account, monetization, or publishing scope?

---

## Commit / Push Rule

After each small completed implementation slice:

- run verification
- commit the non-doc code changes
- push to `origin/main`
- do not commit `docs/` changes unless explicitly asked

Local docs can still be used for planning and review.
