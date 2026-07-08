# Quick-Start Game Kit

This guide shows the smallest intended assembly path for a downstream browser
game built on `@shuangxunian/leafer-game-engine`.

It is a package-facing recipe, not a project generator. It assumes the app has
already created a browser runtime and a game scene.

---

## 1. Start A Scene With Runtime And Input

Use `startSceneWithLifecycle(...)` from `/runtime` when the scene has async
prepare work such as asset loading.

Use `createSceneQuickStartBundle(...)` from `/framework` when the scene should
install common runtime systems before browser input bridges are attached.

```ts
import { startSceneWithLifecycle } from "@shuangxunian/leafer-game-engine/runtime";
import { createSceneQuickStartBundle } from "@shuangxunian/leafer-game-engine/framework";

const scene = new MyGameScene(runtime.renderAdapter, runtime.renderScene);

const lifecycle = await startSceneWithLifecycle({
  scene,
  prepare: (preparedScene) => preparedScene.preloadAssets(),
  start: (readyScene) => runtime.start(readyScene)
});

if (!lifecycle.ok) {
  throw lifecycle.error;
}

const target = document.getElementById("game-root");
if (!target) {
  throw new Error("Game mount target was not found.");
}

const quickStart = createSceneQuickStartBundle(scene, {
  runtime: {
    input: true,
    collisions: true,
    runtimeServices: true
  },
  inputBridges: {
    keyboard: true,
    pointerButtons: { target },
    pointerPosition: { target, localTarget: target }
  }
});
```

The runtime preset and bridge choices are explicit. A keyboard-only arcade game
can omit pointer bridge options. A pointer-first puzzle can omit keyboard
bridges and keep pointer buttons plus pointer position.

---

## 2. Add HUD Text Without Owning A UI Framework

Use `createHudTextBundle(...)` for repeated screen-space labels. The game still
owns ids, text, coordinates, font sizes, visibility, and target layers.

```ts
import { createHudTextBundle } from "@shuangxunian/leafer-game-engine/framework";

const hud = createHudTextBundle(renderAdapter, renderScene, [
  { id: "title", text: "My Game", x: 24, y: 20, fontSize: 28 },
  { id: "score", text: "Score 0", x: 24, y: 58, fontSize: 20 },
  {
    id: "prompt",
    text: "Press Space to start",
    x: 220,
    y: 320,
    fontSize: 24,
    layer: "overlay",
    visible: false
  }
]);

hud.get("score").setText("Score 10");
```

This is only HUD node assembly. Layout rules, score formatting, prompt state,
menus, and overlays remain downstream game code.

---

## 3. Add Optional Scene-Owned Audio Intent

Use `createSceneAudioRuntimeBundle(...)` when a game needs semantic audio cue
intent. The helper installs or reuses `AudioRuntimeSystem` and returns the
scene-owned `AudioRuntimeState`.

```ts
import {
  createSceneAudioRuntimeBundle,
  defineAudioManifest
} from "@shuangxunian/leafer-game-engine/framework";

const audio = createSceneAudioRuntimeBundle(scene, {
  manifest: defineAudioManifest({
    assets: [{ id: "confirm", source: "/audio/confirm.ogg" }],
    channels: [{ id: "sfx", volume: 0.8 }],
    cues: [{ id: "ui:confirm", assetId: "confirm", channelId: "sfx" }]
  })
});

audio.audio.playCue("ui:confirm");
```

Browser playback remains opt-in. A browser game can explicitly install
`AudioPlaybackSystem` with `BrowserAudioPlaybackAdapter`, while tests and
Node-safe code can keep using audio intent records without media playback.

---

## 4. Keep Game Rules In The Game

The quick-start helpers intentionally stop at runtime/framework assembly:

- input bridge setup
- common scene-owned runtime systems
- keyed HUD text creation
- scene-owned audio runtime intent
- lifecycle-friendly browser boot paths

Game-specific rules stay downstream:

- scoring and timers
- enemy spawning
- puzzle validation
- dialogue routes and story content
- HUD layout policy
- audio cue trigger timing
- asset paths and manifests
- gameplay snapshots

`examples/dodge-blocks`, `examples/collect-stars`, `examples/pour-sort`, and
`examples/dialogue-choice` are the current downstream-style references for
these boundaries.

---

## Out Of Scope

This guide does not introduce a project generator, CLI scaffold, visual editor,
launcher, gallery, template marketplace, WeChat SDK wrapper, account system,
ads, monetization, analytics service, publishing workflow, asset manager UI,
HUD layout engine, audio mixer, galgame scripting language, or game-specific
rules engine.

It is not a game-specific rules engine.
