import test from "node:test";
import assert from "node:assert/strict";

import { Scene } from "../lib/core/index.js";
import {
  AudioRuntimeState,
  AudioRuntimeSystem,
  AudioPlaybackSystem,
  AssetRegistry,
  BrowserPointerButtonBridge,
  CameraSystem,
  EventBus,
  GameFlow,
  InputActionMap,
  InputSystem,
  RuntimeScheduler,
  RuntimeServicesSystem,
  SizeComponent,
  StateMachine,
  SpriteAnimationComponent,
  SpriteAnimationSystem,
  TransformComponent,
  ViewComponent,
  addAudioRuntime,
  addAudioPlayback,
  addRuntimeServices,
  advanceSpriteAnimationPlayback,
  createAudioRuntimeState,
  createRuntimeServices,
  createSpriteAnimationPlayback,
  defineAudioAsset,
  defineAudioChannel,
  defineAudioCue,
  defineAudioManifest,
  defineKeyboardBinding,
  definePointerButtonBinding,
  defineSpriteAnimationClip,
  defineSpriteFrame,
  dispatchAudioRuntimeOperation,
  drainAudioRuntimeOperations,
  getAudioRuntime,
  getAudioPlayback,
  getPointerButtonInputId,
  getSpriteAnimationPlaybackFrameId,
  getSpriteAnimationPlaybackFrameIndex,
  getRuntimeServices,
  isSpriteCapableRenderNode,
  normalizeKeyboardKey,
  normalizePointerButton,
  pauseSpriteAnimationPlayback,
  resumeSpriteAnimationPlayback,
  stopSpriteAnimationPlayback,
  createLevelLayout,
  createTileMap,
  defineLevelLayout,
  defineTileMap
} from "../lib/framework/index.js";

test("audio manifest definitions copy assets, cues and channels", () => {
  const assetMetadata = { group: "sfx" };
  const cueMetadata = { event: "confirm" };
  const channelMetadata = { bus: "ui" };
  const manifest = defineAudioManifest({
    assets: [
      {
        id: "confirm-sound",
        source: "/audio/confirm.ogg",
        durationSeconds: 0.25,
        preload: true,
        metadata: assetMetadata
      }
    ],
    channels: [
      {
        id: "ui",
        volume: 0.8,
        muted: false,
        metadata: channelMetadata
      }
    ],
    cues: [
      {
        id: "confirm",
        assetId: "confirm-sound",
        channelId: "ui",
        volume: 0.7,
        loop: false,
        metadata: cueMetadata
      }
    ]
  });

  assetMetadata.group = "mutated";
  cueMetadata.event = "mutated";
  channelMetadata.bus = "mutated";

  assert.deepEqual(manifest, {
    assets: [
      {
        id: "confirm-sound",
        source: "/audio/confirm.ogg",
        durationSeconds: 0.25,
        preload: true,
        metadata: { group: "sfx" }
      }
    ],
    cues: [
      {
        id: "confirm",
        assetId: "confirm-sound",
        channelId: "ui",
        volume: 0.7,
        loop: false,
        metadata: { event: "confirm" }
      }
    ],
    channels: [
      {
        id: "master",
        volume: 1,
        muted: false,
        metadata: undefined
      },
      {
        id: "ui",
        volume: 0.8,
        muted: false,
        metadata: { bus: "ui" }
      }
    ]
  });
});

test("audio definition helpers apply defaults and copy metadata", () => {
  const metadata = { kind: "music" };

  assert.deepEqual(defineAudioAsset({ id: "theme", metadata }), {
    id: "theme",
    preload: false,
    metadata: { kind: "music" }
  });
  assert.deepEqual(defineAudioCue({ id: "theme:start", assetId: "theme" }), {
    id: "theme:start",
    assetId: "theme",
    channelId: "master",
    volume: 1,
    loop: false,
    metadata: undefined
  });
  assert.deepEqual(defineAudioChannel({ id: "music" }), {
    id: "music",
    volume: 1,
    muted: false,
    metadata: undefined
  });

  metadata.kind = "mutated";
  assert.deepEqual(defineAudioAsset({ id: "theme", metadata }).metadata, { kind: "mutated" });
});

test("audio manifest validation reports duplicate ids and missing references", () => {
  assert.throws(
    () => defineAudioManifest({
      assets: [{ id: "hit" }, { id: "hit" }]
    }),
    /Duplicate audio asset id "hit"/
  );
  assert.throws(
    () => defineAudioManifest({
      assets: [{ id: "hit" }],
      cues: [{ id: "missing", assetId: "missing-asset" }]
    }),
    /Audio cue "missing" references missing asset "missing-asset"/
  );
  assert.throws(
    () => defineAudioManifest({
      assets: [{ id: "hit" }],
      channels: [{ id: "sfx" }],
      cues: [{ id: "bad-channel", assetId: "hit", channelId: "music" }]
    }),
    /Audio cue "bad-channel" references missing channel "music"/
  );
  assert.throws(
    () => defineAudioCue({ id: "too-loud", assetId: "hit", volume: 2 }),
    /Audio cue "too-loud" volume must be a finite number between 0 and 1/
  );
  assert.throws(
    () => defineAudioAsset({ id: "silent", durationSeconds: 0 }),
    /Audio asset "silent" durationSeconds must be greater than 0/
  );
});

test("audio runtime state records deterministic play and stop intent", () => {
  const audio = createAudioRuntimeState({
    assets: [{ id: "hit", source: "/audio/hit.ogg" }],
    channels: [{ id: "sfx", volume: 0.75 }],
    cues: [{ id: "player:hit", assetId: "hit", channelId: "sfx", volume: 0.5 }]
  });

  assert.deepEqual(audio.playCue("player:hit"), {
    sequence: 1,
    type: "play",
    cueId: "player:hit",
    assetId: "hit",
    channelId: "sfx",
    volume: 0.5,
    loop: false
  });
  assert.deepEqual(audio.stopCue("player:hit"), {
    sequence: 2,
    type: "stop",
    cueId: "player:hit",
    assetId: "hit",
    channelId: "sfx"
  });
  assert.deepEqual(audio.stop({ channelId: "sfx" }), {
    sequence: 3,
    type: "stop",
    channelId: "sfx"
  });
  assert.deepEqual(audio.listOperations().map((operation) => operation.sequence), [1, 2, 3]);
  assert.throws(
    () => audio.stop({ cueId: "player:hit", channelId: "missing" }),
    /Audio channel "missing" is not registered/
  );
});

test("audio runtime state tracks channel volume, mute and pause intent", () => {
  const audio = new AudioRuntimeState({
    assets: [{ id: "theme" }],
    channels: [{ id: "music", volume: 0.5 }],
    cues: [{ id: "theme:start", assetId: "theme", channelId: "music", loop: true }]
  });

  assert.deepEqual(audio.setChannelVolume("music", 0.25), {
    sequence: 1,
    type: "set-volume",
    channelId: "music",
    volume: 0.25
  });
  assert.deepEqual(audio.setChannelMuted("music", true), {
    sequence: 2,
    type: "set-muted",
    channelId: "music",
    muted: true
  });
  assert.deepEqual(audio.pauseChannel("music"), {
    sequence: 3,
    type: "pause",
    channelId: "music"
  });
  assert.deepEqual(audio.resumeChannel("music"), {
    sequence: 4,
    type: "resume",
    channelId: "music"
  });
  assert.deepEqual(audio.getChannel("music"), {
    id: "music",
    volume: 0.25,
    muted: true
  });
  assert.throws(() => audio.setChannelVolume("music", -0.1), /Audio channel volume must be a finite number between 0 and 1/);
  assert.throws(() => audio.pauseChannel("missing"), /Audio channel "missing" is not registered/);
});

test("audio runtime state returns defensive manifest, channel and operation copies", () => {
  const audio = createAudioRuntimeState({
    assets: [{ id: "hit", metadata: { kind: "sfx" } }],
    cues: [{ id: "hit:play", assetId: "hit" }]
  });

  const manifest = audio.manifest;
  const channels = audio.listChannels();
  const play = audio.playCue("hit:play");
  const operations = audio.listOperations();

  manifest.assets[0].metadata.kind = "mutated";
  channels[0].volume = 0;
  play.sequence = 999;
  operations[0].sequence = 888;

  assert.deepEqual(audio.manifest.assets[0].metadata, { kind: "sfx" });
  assert.equal(audio.getChannel("master")?.volume, 1);
  assert.equal(audio.getLastOperation()?.sequence, 1);
});

test("audio runtime system installs scene-owned audio state", () => {
  const scene = new Scene("AudioRuntimeScene");
  const system = addAudioRuntime(scene, {
    priority: -123,
    manifest: {
      assets: [{ id: "hit" }],
      channels: [{ id: "sfx", volume: 0.75 }],
      cues: [{ id: "hit:play", assetId: "hit", channelId: "sfx" }]
    }
  });

  assert.equal(system.priority, -123);
  assert.equal(system.clearsOperationsOnDestroy, true);
  assert.equal(getAudioRuntime(scene), system.audio);

  scene.start();
  assert.deepEqual(system.audio.playCue("hit:play"), {
    sequence: 1,
    type: "play",
    cueId: "hit:play",
    assetId: "hit",
    channelId: "sfx",
    volume: 1,
    loop: false
  });
});

test("audio runtime system clears operation records on destroy by default", () => {
  const scene = new Scene("AudioRuntimeCleanupScene");
  const system = scene.addSystem(new AudioRuntimeSystem(scene, {
    manifest: {
      assets: [{ id: "theme" }],
      cues: [{ id: "theme:start", assetId: "theme" }]
    }
  }));

  system.audio.playCue("theme:start");
  assert.equal(system.audio.listOperations().length, 1);

  scene.destroy();

  assert.deepEqual(system.audio.listOperations(), []);
});

test("audio runtime system can use injected state and preserve operations", () => {
  const scene = new Scene("InjectedAudioRuntimeScene");
  const audio = createAudioRuntimeState({
    assets: [{ id: "confirm" }],
    cues: [{ id: "confirm:play", assetId: "confirm" }]
  });

  audio.playCue("confirm:play");

  const system = addAudioRuntime(scene, {
    audio,
    clearOperationsOnDestroy: false
  });

  assert.equal(system.audio, audio);
  assert.equal(system.priority, -240);
  assert.equal(system.clearsOperationsOnDestroy, false);
  assert.equal(getAudioRuntime(scene), audio);

  scene.destroy();

  assert.equal(audio.listOperations().length, 1);
  assert.equal(getAudioRuntime(new Scene("NoAudioRuntimeScene")), undefined);
});

test("audio playback adapter drains runtime operations in deterministic order", async () => {
  const audio = createAudioRuntimeState({
    assets: [{ id: "hit" }],
    channels: [{ id: "sfx" }],
    cues: [{ id: "hit:play", assetId: "hit", channelId: "sfx" }]
  });
  const calls = [];
  const adapter = {
    play: (operation) => calls.push(`play:${operation.sequence}:${operation.cueId}`),
    stop: (operation) => calls.push(`stop:${operation.sequence}:${operation.channelId}`),
    pause: (operation) => calls.push(`pause:${operation.sequence}:${operation.channelId}`),
    resume: (operation) => calls.push(`resume:${operation.sequence}:${operation.channelId}`),
    setVolume: (operation) => calls.push(`setVolume:${operation.sequence}:${operation.volume}`),
    setMuted: (operation) => calls.push(`setMuted:${operation.sequence}:${operation.muted}`)
  };

  audio.playCue("hit:play");
  audio.stop({ channelId: "sfx" });
  audio.pauseChannel("sfx");
  audio.resumeChannel("sfx");
  audio.setChannelVolume("sfx", 0.25);
  audio.setChannelMuted("sfx", true);

  assert.deepEqual(await drainAudioRuntimeOperations(audio, adapter), [
    { sequence: 1, type: "play", status: "ok" },
    { sequence: 2, type: "stop", status: "ok" },
    { sequence: 3, type: "pause", status: "ok" },
    { sequence: 4, type: "resume", status: "ok" },
    { sequence: 5, type: "set-volume", status: "ok" },
    { sequence: 6, type: "set-muted", status: "ok" }
  ]);
  assert.deepEqual(calls, [
    "play:1:hit:play",
    "stop:2:sfx",
    "pause:3:sfx",
    "resume:4:sfx",
    "setVolume:5:0.25",
    "setMuted:6:true"
  ]);
  assert.deepEqual(audio.listOperations(), []);
});

test("audio playback adapter drain reports failures and can preserve operation records", async () => {
  const audio = createAudioRuntimeState({
    assets: [{ id: "hit" }],
    cues: [{ id: "hit:play", assetId: "hit" }]
  });
  const calls = [];
  const adapter = {
    play: async (operation) => {
      calls.push(`play:${operation.sequence}`);
    },
    stop: (operation) => {
      calls.push(`stop:${operation.sequence}`);
      throw new Error("stop failed");
    },
    pause: () => {},
    resume: () => {},
    setVolume: () => {},
    setMuted: () => {}
  };

  audio.playCue("hit:play");
  audio.stopCue("hit:play");

  assert.deepEqual(await drainAudioRuntimeOperations(audio, adapter, { clearOperations: false }), [
    { sequence: 1, type: "play", status: "ok" },
    { sequence: 2, type: "stop", status: "error", error: "stop failed" }
  ]);
  assert.deepEqual(calls, ["play:1", "stop:2"]);
  assert.deepEqual(audio.listOperations().map((operation) => operation.sequence), [1, 2]);
});

test("audio playback dispatch helper routes operation types to adapter methods", async () => {
  const calls = [];
  const adapter = {
    play: (operation) => calls.push(`play:${operation.sequence}`),
    stop: (operation) => calls.push(`stop:${operation.sequence}`),
    pause: (operation) => calls.push(`pause:${operation.sequence}`),
    resume: (operation) => calls.push(`resume:${operation.sequence}`),
    setVolume: (operation) => calls.push(`setVolume:${operation.sequence}`),
    setMuted: (operation) => calls.push(`setMuted:${operation.sequence}`)
  };

  await dispatchAudioRuntimeOperation(adapter, { sequence: 1, type: "play" });
  await dispatchAudioRuntimeOperation(adapter, { sequence: 2, type: "stop" });
  await dispatchAudioRuntimeOperation(adapter, { sequence: 3, type: "pause" });
  await dispatchAudioRuntimeOperation(adapter, { sequence: 4, type: "resume" });
  await dispatchAudioRuntimeOperation(adapter, { sequence: 5, type: "set-volume", volume: 0.5 });
  await dispatchAudioRuntimeOperation(adapter, { sequence: 6, type: "set-muted", muted: true });

  assert.deepEqual(calls, [
    "play:1",
    "stop:2",
    "pause:3",
    "resume:4",
    "setVolume:5",
    "setMuted:6"
  ]);
});

test("audio playback system drains scene-owned runtime operations during update", async () => {
  const scene = new Scene("AudioPlaybackScene");
  const runtime = addAudioRuntime(scene, {
    manifest: {
      assets: [{ id: "hit" }],
      channels: [{ id: "sfx" }],
      cues: [{ id: "hit:play", assetId: "hit", channelId: "sfx" }]
    }
  });
  const calls = [];
  const playback = addAudioPlayback(scene, {
    adapter: {
      play: (operation) => calls.push(`play:${operation.sequence}:${operation.cueId}`),
      stop: (operation) => calls.push(`stop:${operation.sequence}:${operation.channelId}`),
      pause: () => {},
      resume: () => {},
      setVolume: () => {},
      setMuted: () => {}
    }
  });

  assert.equal(playback.priority, -230);
  assert.equal(playback.clearsOperations, true);
  assert.equal(playback.drainsOnUpdate, true);
  assert.equal(getAudioPlayback(scene), playback);

  scene.start();
  runtime.audio.playCue("hit:play");
  runtime.audio.stop({ channelId: "sfx" });

  scene.update(1 / 60);
  assert.equal(playback.isDraining, true);
  assert.deepEqual(await playback.drain(), [
    { sequence: 1, type: "play", status: "ok" },
    { sequence: 2, type: "stop", status: "ok" }
  ]);
  assert.deepEqual(calls, ["play:1:hit:play", "stop:2:sfx"]);
  assert.deepEqual(runtime.audio.listOperations(), []);
  assert.deepEqual(playback.listLastResults(), [
    { sequence: 1, type: "play", status: "ok" },
    { sequence: 2, type: "stop", status: "ok" }
  ]);
});

test("audio playback system can use injected audio state and preserve operations", async () => {
  const scene = new Scene("InjectedAudioPlaybackScene");
  const audio = createAudioRuntimeState({
    assets: [{ id: "confirm" }],
    cues: [{ id: "confirm:play", assetId: "confirm" }]
  });
  const calls = [];
  const playback = scene.addSystem(new AudioPlaybackSystem(scene, {
    audio,
    clearOperations: false,
    drainOnUpdate: false,
    priority: -111,
    adapter: {
      play: (operation) => calls.push(`play:${operation.sequence}`),
      stop: () => {},
      pause: () => {},
      resume: () => {},
      setVolume: () => {},
      setMuted: () => {}
    }
  }));

  assert.equal(playback.priority, -111);
  assert.equal(playback.clearsOperations, false);
  assert.equal(playback.drainsOnUpdate, false);

  audio.playCue("confirm:play");
  scene.start();
  scene.update(1 / 60);

  assert.deepEqual(calls, []);
  assert.deepEqual(await playback.drain(), [
    { sequence: 1, type: "play", status: "ok" }
  ]);
  assert.deepEqual(calls, ["play:1"]);
  assert.deepEqual(audio.listOperations().map((operation) => operation.sequence), [1]);
});

test("audio playback system records adapter failures as copied result history", async () => {
  const scene = new Scene("AudioPlaybackFailureScene");
  const audio = createAudioRuntimeState({
    assets: [{ id: "hit" }],
    cues: [{ id: "hit:play", assetId: "hit" }]
  });
  const playback = addAudioPlayback(scene, {
    audio,
    adapter: {
      play: () => {
        throw new Error("play failed");
      },
      stop: () => {},
      pause: () => {},
      resume: () => {},
      setVolume: () => {},
      setMuted: () => {}
    }
  });

  audio.playCue("hit:play");
  const results = await playback.drain();
  results[0].error = "mutated";

  assert.deepEqual(playback.listLastResults(), [
    { sequence: 1, type: "play", status: "error", error: "play failed" }
  ]);

  scene.destroy();

  assert.deepEqual(playback.listLastResults(), []);
  assert.equal(getAudioPlayback(new Scene("NoAudioPlaybackScene")), undefined);
});

test("state machine transitions call exit, enter and transition hooks in order", () => {
  const log = [];
  const flow = new StateMachine("idle", {
    states: {
      idle: {
        onExit: ({ to }) => log.push(`idle->${to}:exit`)
      },
      running: {
        onEnter: ({ from }) => log.push(`${from}->running:enter`)
      }
    },
    onTransition: ({ from, to }) => log.push(`${from}->${to}:transition`)
  });

  const changed = flow.transition("running");

  assert.equal(changed, true);
  assert.equal(flow.getState(), "running");
  assert.deepEqual(log, ["idle->running:exit", "idle->running:enter", "idle->running:transition"]);
});

test("state machine ignores same-state transitions", () => {
  const flow = new StateMachine("idle");

  assert.equal(flow.transition("idle"), false);
  assert.equal(flow.is("idle"), true);
  assert.equal(flow.matches("running", "idle"), true);
});

test("game flow moves through common gameplay phases", () => {
  const transitions = [];
  const flow = new GameFlow({
    onTransition: ({ from, to, reason }) => transitions.push(`${reason}:${from}->${to}`)
  });

  assert.equal(flow.getPhase(), "boot");
  assert.equal(flow.canUpdateGameplay(), false);
  assert.deepEqual(flow.markReady(), {
    ok: true,
    changed: true,
    from: "boot",
    to: "ready",
    reason: "ready"
  });
  assert.deepEqual(flow.start(), {
    ok: true,
    changed: true,
    from: "ready",
    to: "running",
    reason: "start"
  });
  assert.equal(flow.canUpdateGameplay(), true);
  assert.deepEqual(flow.pause(), {
    ok: true,
    changed: true,
    from: "running",
    to: "paused",
    reason: "pause"
  });
  assert.deepEqual(flow.resume(), {
    ok: true,
    changed: true,
    from: "paused",
    to: "running",
    reason: "resume"
  });
  assert.deepEqual(flow.end(), {
    ok: true,
    changed: true,
    from: "running",
    to: "ended",
    reason: "end"
  });
  assert.deepEqual(transitions, [
    "ready:boot->ready",
    "start:ready->running",
    "pause:running->paused",
    "resume:paused->running",
    "end:running->ended"
  ]);
});

test("game flow supports restart and reset semantics", () => {
  const flow = new GameFlow({ initialPhase: "ended" });

  assert.deepEqual(flow.start(), {
    ok: true,
    changed: true,
    from: "ended",
    to: "running",
    reason: "start"
  });
  assert.equal(flow.is("running"), true);
  assert.equal(flow.matches("paused", "running"), true);

  assert.deepEqual(flow.reset(), {
    ok: true,
    changed: true,
    from: "running",
    to: "ready",
    reason: "reset"
  });
  assert.equal(flow.getPhase(), "ready");
});

test("game flow treats repeated phase requests as no-ops", () => {
  const transitions = [];
  const flow = new GameFlow({
    initialPhase: "running",
    onTransition: (transition) => transitions.push(transition)
  });

  assert.deepEqual(flow.start(), {
    ok: true,
    changed: false,
    from: "running",
    to: "running",
    reason: "start"
  });
  assert.equal(flow.getPhase(), "running");
  assert.deepEqual(transitions, []);
});

test("game flow rejects invalid transitions without mutating state", () => {
  const flow = new GameFlow();

  assert.deepEqual(flow.pause(), {
    ok: false,
    changed: false,
    from: "boot",
    to: "paused",
    reason: "pause",
    error: 'Cannot pause game flow from "boot" to "paused".'
  });
  assert.equal(flow.getPhase(), "boot");

  flow.markReady();
  assert.deepEqual(flow.resume(), {
    ok: false,
    changed: false,
    from: "ready",
    to: "running",
    reason: "resume",
    error: 'Cannot resume game flow from "ready" to "running".'
  });
  assert.equal(flow.getPhase(), "ready");
});

test("input action map normalizes keyboard bindings and ignores duplicate bindings", () => {
  const actions = new InputActionMap([
    {
      id: " move:left ",
      bindings: [
        defineKeyboardBinding("A"),
        defineKeyboardBinding("a"),
        defineKeyboardBinding("ArrowLeft")
      ]
    }
  ]);

  assert.deepEqual(actions.getAction("move:left"), {
    id: "move:left",
    bindings: [
      { type: "keyboard", key: "a" },
      { type: "keyboard", key: "arrowleft" }
    ]
  });
  assert.equal(normalizeKeyboardKey("Space"), "space");
  assert.throws(() => normalizeKeyboardKey(""), /Keyboard input binding key must be a non-empty string/);
});

test("input action map queries pressed and just-pressed input state", () => {
  const input = new InputSystem();
  const actions = new InputActionMap([
    {
      id: "jump",
      bindings: [defineKeyboardBinding("Space"), defineKeyboardBinding("W")]
    }
  ]);

  assert.equal(actions.isPressed(input, "jump"), false);
  assert.equal(actions.wasPressed(input, "jump"), false);

  input.press("space");

  assert.equal(actions.isPressed(input, "jump"), true);
  assert.equal(actions.wasPressed(input, "jump"), true);

  input.lateUpdate();

  assert.equal(actions.isPressed(input, "jump"), true);
  assert.equal(actions.wasPressed(input, "jump"), false);

  input.release("space");

  assert.equal(actions.isPressed(input, "jump"), false);
});

test("input action map supports pointer button bindings", () => {
  const input = new InputSystem();
  const actions = new InputActionMap([
    {
      id: "select",
      bindings: [
        definePointerButtonBinding("Primary"),
        definePointerButtonBinding("primary"),
        defineKeyboardBinding("Enter")
      ]
    }
  ]);

  assert.deepEqual(actions.getAction("select"), {
    id: "select",
    bindings: [
      { type: "pointer-button", button: "primary" },
      { type: "keyboard", key: "enter" }
    ]
  });
  assert.equal(normalizePointerButton(" Secondary "), "secondary");
  assert.equal(getPointerButtonInputId("Auxiliary"), "pointer:auxiliary");

  input.press("pointer:primary");
  assert.equal(actions.isPressed(input, "select"), true);
  assert.equal(actions.wasPressed(input, "select"), true);

  input.lateUpdate();
  assert.equal(actions.wasPressed(input, "select"), false);

  assert.throws(() => definePointerButtonBinding("tertiary"), /Unsupported pointer button "tertiary"/);
  assert.throws(() => definePointerButtonBinding(""), /Pointer button input binding must be a non-empty string/);
});

test("browser pointer button bridge writes normalized button state into input system", () => {
  const input = new InputSystem();
  const target = createFakeEventTarget();
  const bridge = new BrowserPointerButtonBridge(input, target);
  const actions = new InputActionMap([
    {
      id: "select",
      bindings: [definePointerButtonBinding("primary")]
    }
  ]);

  bridge.attach();
  bridge.attach();
  assert.equal(target.listenerCount("pointerdown"), 1);

  target.dispatch("pointerdown", { button: 0 });
  assert.equal(input.isPressed(getPointerButtonInputId("primary")), true);
  assert.equal(input.wasPressed(getPointerButtonInputId("primary")), true);
  assert.equal(actions.isPressed(input, "select"), true);

  input.lateUpdate();
  target.dispatch("pointerdown", { button: 0 });
  assert.equal(input.wasPressed(getPointerButtonInputId("primary")), false);

  target.dispatch("pointerup", { button: 0 });
  assert.equal(input.isPressed(getPointerButtonInputId("primary")), false);
  assert.equal(actions.isPressed(input, "select"), false);
});

test("browser pointer button bridge handles secondary, auxiliary, cancel, blur and detach cleanup", () => {
  const input = new InputSystem();
  const target = createFakeEventTarget();
  const bridge = new BrowserPointerButtonBridge(input, target);

  bridge.attach();
  target.dispatch("pointerdown", { button: 2 });
  target.dispatch("pointerdown", { button: 1 });
  target.dispatch("pointerdown", { button: 3 });

  assert.equal(input.isPressed(getPointerButtonInputId("secondary")), true);
  assert.equal(input.isPressed(getPointerButtonInputId("auxiliary")), true);
  assert.equal(input.isPressed("pointer:unsupported"), false);

  target.dispatch("pointercancel", { button: -1 });
  assert.equal(input.isPressed(getPointerButtonInputId("secondary")), false);
  assert.equal(input.isPressed(getPointerButtonInputId("auxiliary")), false);

  target.dispatch("pointerdown", { button: 0 });
  target.dispatch("blur", {});
  assert.equal(input.isPressed(getPointerButtonInputId("primary")), false);

  target.dispatch("pointerdown", { button: 0 });
  bridge.detach();
  bridge.detach();
  assert.equal(input.isPressed(getPointerButtonInputId("primary")), false);
  assert.equal(target.listenerCount("pointerdown"), 0);

  target.dispatch("pointerdown", { button: 0 });
  assert.equal(input.isPressed(getPointerButtonInputId("primary")), false);
});

test("tile map data contract copies layers and supports tile lookup", () => {
  const sourceTiles = ["floor", "wall", null, "water"];
  const definition = defineTileMap({
    id: "level-1",
    width: 2,
    height: 2,
    tileWidth: 16,
    tileHeight: 12,
    layers: [
      {
        id: "terrain",
        tiles: sourceTiles
      }
    ]
  });

  sourceTiles[0] = "mutated";
  const map = createTileMap(definition);
  definition.layers[0].tiles[1] = "mutated";

  assert.equal(map.id, "level-1");
  assert.equal(map.width, 2);
  assert.equal(map.height, 2);
  assert.equal(map.tileWidth, 16);
  assert.equal(map.tileHeight, 12);
  assert.equal(map.getTile("terrain", 0, 0), "floor");
  assert.equal(map.getTile("terrain", 1, 0), "wall");
  assert.equal(map.getTile("terrain", 0, 1), null);
  assert.equal(map.getTile("missing", 0, 0), undefined);
  assert.equal(map.getTile("terrain", 2, 0), undefined);

  const layer = map.getLayer("terrain");
  layer.tiles[0] = "outside";

  assert.equal(map.getTile("terrain", 0, 0), "floor");
});

test("tile map converts between world and tile coordinates", () => {
  const map = createTileMap({
    id: "grid",
    width: 4,
    height: 3,
    tileWidth: 32,
    tileHeight: 16,
    layers: [
      {
        id: "terrain",
        tiles: new Array(12).fill(null)
      }
    ]
  });

  assert.deepEqual(map.worldToTile(0, 0), { x: 0, y: 0 });
  assert.deepEqual(map.worldToTile(31.9, 15.9), { x: 0, y: 0 });
  assert.deepEqual(map.worldToTile(32, 16), { x: 1, y: 1 });
  assert.deepEqual(map.worldToTile(-1, -1), { x: -1, y: -1 });
  assert.deepEqual(map.tileToWorld(2, 1), { x: 64, y: 16 });
  assert.deepEqual(map.getTileBounds(2, 1), { x: 64, y: 16, width: 32, height: 16 });
  assert.equal(map.containsTile(3, 2), true);
  assert.equal(map.containsTile(4, 2), false);
  assert.equal(map.containsTile(0.5, 1), false);
});

test("tile map validation reports invalid definitions clearly", () => {
  assert.throws(() => defineTileMap({
    id: "",
    width: 1,
    height: 1,
    tileWidth: 16,
    tileHeight: 16,
    layers: [{ id: "terrain", tiles: [null] }]
  }), /Tile map id must be a non-empty string/);

  assert.throws(() => defineTileMap({
    id: "bad-size",
    width: 1.5,
    height: 1,
    tileWidth: 16,
    tileHeight: 16,
    layers: [{ id: "terrain", tiles: [null] }]
  }), /Tile map width must be a positive integer/);

  assert.throws(() => defineTileMap({
    id: "bad-layer",
    width: 2,
    height: 2,
    tileWidth: 16,
    tileHeight: 16,
    layers: [{ id: "terrain", tiles: [null] }]
  }), /must contain 4 tiles, received 1/);

  assert.throws(() => defineTileMap({
    id: "duplicate-layer",
    width: 1,
    height: 1,
    tileWidth: 16,
    tileHeight: 16,
    layers: [
      { id: "terrain", tiles: [null] },
      { id: "terrain", tiles: [null] }
    ]
  }), /Duplicate tile map layer id "terrain"/);
});

test("level layout copies spawn points and regions for safe lookup", () => {
  const spawnMetadata = { team: "player" };
  const regionMetadata = { music: "forest" };
  const layoutDefinition = defineLevelLayout({
    id: "level-1",
    spawns: [
      {
        id: "player",
        x: 16,
        y: 24,
        rotation: 90,
        metadata: spawnMetadata
      }
    ],
    regions: [
      {
        id: "safe-zone",
        x: 0,
        y: 0,
        width: 64,
        height: 48,
        tags: ["safe", "music"],
        metadata: regionMetadata
      }
    ]
  });

  spawnMetadata.team = "mutated";
  regionMetadata.music = "mutated";
  const layout = createLevelLayout(layoutDefinition);
  layoutDefinition.spawns[0].metadata.team = "changed-after-create";
  layoutDefinition.regions[0].tags.push("changed-after-create");

  assert.equal(layout.id, "level-1");
  assert.deepEqual(layout.getSpawnPoint("player"), {
    id: "player",
    x: 16,
    y: 24,
    rotation: 90,
    metadata: { team: "player" }
  });
  assert.equal(layout.getSpawnPoint("missing"), undefined);
  assert.deepEqual(layout.getRegion("safe-zone"), {
    id: "safe-zone",
    x: 0,
    y: 0,
    width: 64,
    height: 48,
    tags: ["safe", "music"],
    metadata: { music: "forest" }
  });

  const region = layout.getRegion("safe-zone");
  region.tags.push("outside");
  region.metadata.music = "outside";

  assert.deepEqual(layout.getRegion("safe-zone").tags, ["safe", "music"]);
  assert.deepEqual(layout.getRegion("safe-zone").metadata, { music: "forest" });
});

test("level layout queries regions by point and tag", () => {
  const layout = createLevelLayout({
    id: "regions",
    spawns: [
      {
        id: "default",
        x: 4,
        y: 8
      }
    ],
    regions: [
      {
        id: "forest",
        x: 0,
        y: 0,
        width: 32,
        height: 32,
        tags: ["biome", "safe"]
      },
      {
        id: "danger",
        x: 16,
        y: 16,
        width: 32,
        height: 32,
        tags: ["combat"]
      }
    ]
  });

  assert.deepEqual(layout.getSpawnPoint("default"), {
    id: "default",
    x: 4,
    y: 8,
    rotation: 0,
    metadata: undefined
  });
  assert.equal(layout.containsPoint("forest", 0, 0), true);
  assert.equal(layout.containsPoint("forest", 31.999, 31.999), true);
  assert.equal(layout.containsPoint("forest", 32, 32), false);
  assert.equal(layout.containsPoint("missing", 1, 1), false);
  assert.deepEqual(layout.findRegionsContainingPoint(20, 20).map((region) => region.id), ["forest", "danger"]);
  assert.deepEqual(layout.findRegionsByTag("safe").map((region) => region.id), ["forest"]);
  assert.deepEqual(layout.findRegionsByTag("combat").map((region) => region.id), ["danger"]);
});

test("level layout validation reports invalid definitions clearly", () => {
  assert.throws(() => defineLevelLayout({
    id: "",
    spawns: [],
    regions: []
  }), /Level layout id must be a non-empty string/);

  assert.throws(() => defineLevelLayout({
    id: "bad-spawn",
    spawns: [
      { id: "player", x: 0, y: 0 },
      { id: "player", x: 1, y: 1 }
    ],
    regions: []
  }), /Duplicate level spawn id "player"/);

  assert.throws(() => defineLevelLayout({
    id: "bad-region",
    spawns: [],
    regions: [
      {
        id: "zone",
        x: 0,
        y: 0,
        width: 0,
        height: 10
      }
    ]
  }), /Level region width must be greater than 0/);

  assert.throws(() => defineLevelLayout({
    id: "bad-tags",
    spawns: [],
    regions: [
      {
        id: "zone",
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        tags: ["safe", "safe"]
      }
    ]
  }), /Duplicate level region tag "safe" on region "zone"/);
});

test("input action map can bind and unbind keyboard inputs", () => {
  const actions = new InputActionMap();

  actions
    .bind("pause", defineKeyboardBinding("Escape"))
    .bind("pause", defineKeyboardBinding("escape"))
    .bind("pause", definePointerButtonBinding("primary"))
    .bind("pause", definePointerButtonBinding("Primary"))
    .bind("confirm", defineKeyboardBinding("Enter"));

  assert.deepEqual(actions.listActions(), [
    {
      id: "pause",
      bindings: [
        { type: "keyboard", key: "escape" },
        { type: "pointer-button", button: "primary" }
      ]
    },
    {
      id: "confirm",
      bindings: [{ type: "keyboard", key: "enter" }]
    }
  ]);
  assert.deepEqual(actions.getActionIdsForBinding(defineKeyboardBinding("ESCAPE")), ["pause"]);
  assert.deepEqual(actions.getActionIdsForBinding(definePointerButtonBinding("PRIMARY")), ["pause"]);
  assert.equal(actions.unbind("pause", defineKeyboardBinding("Escape")), true);
  assert.equal(actions.unbind("pause", defineKeyboardBinding("Escape")), false);
  assert.deepEqual(actions.getBindings("pause"), [{ type: "pointer-button", button: "primary" }]);
  assert.equal(actions.unbind("pause", definePointerButtonBinding("primary")), true);
  assert.deepEqual(actions.getBindings("pause"), []);
  assert.equal(actions.removeAction("confirm"), true);
  assert.equal(actions.hasAction("confirm"), false);
});

test("input action map returns copied action definitions", () => {
  const actions = new InputActionMap([
    {
      id: "fire",
      bindings: [defineKeyboardBinding("F")]
    }
  ]);

  const listed = actions.listActions();
  listed[0].bindings[0].key = "mutated";

  assert.deepEqual(actions.getBindings("fire"), [{ type: "keyboard", key: "f" }]);
  assert.deepEqual(actions.getAction("missing"), undefined);
  assert.equal(actions.isPressed(new InputSystem(), "missing"), false);
  assert.throws(() => actions.registerAction({ id: " " }), /Input action id must be a non-empty string/);
});

test("event bus dispatches events in subscription order with stable envelopes", () => {
  const bus = new EventBus();
  const log = [];

  bus.on("damage", (payload, event) => {
    log.push(`first:${payload.amount}:${event.type}:${event.sequence}`);
  });
  bus.on("damage", (payload, event) => {
    log.push(`second:${payload.amount}:${event.type}:${event.sequence}`);
  });

  const firstEvent = bus.emit("damage", { amount: 3 });
  const secondEvent = bus.emit("damage", { amount: 5 });

  assert.equal(Object.isFrozen(firstEvent), true);
  assert.deepEqual(firstEvent, {
    type: "damage",
    payload: { amount: 3 },
    sequence: 1
  });
  assert.deepEqual(secondEvent, {
    type: "damage",
    payload: { amount: 5 },
    sequence: 2
  });
  assert.deepEqual(log, [
    "first:3:damage:1",
    "second:3:damage:1",
    "first:5:damage:2",
    "second:5:damage:2"
  ]);
  assert.equal(bus.listenerCount("damage"), 2);
  assert.equal(bus.listenerCount(), 2);
});

test("event bus supports once listeners and explicit unsubscribe handles", () => {
  const bus = new EventBus();
  const log = [];

  const persistent = bus.on("ready", () => log.push("persistent"));
  const once = bus.once("ready", () => log.push("once"));

  assert.equal(persistent.active, true);
  assert.equal(once.active, true);
  assert.equal(bus.listenerCount("ready"), 2);

  bus.emit("ready", undefined);
  bus.emit("ready", undefined);

  assert.deepEqual(log, ["persistent", "once", "persistent"]);
  assert.equal(persistent.active, true);
  assert.equal(once.active, false);
  assert.equal(bus.listenerCount("ready"), 1);

  assert.equal(persistent.unsubscribe(), true);
  assert.equal(persistent.unsubscribe(), false);
  assert.equal(persistent.active, false);
  assert.equal(bus.listenerCount("ready"), 0);
});

test("event bus can remove listeners by handler and clear listeners", () => {
  const bus = new EventBus();
  const log = [];
  const handler = () => log.push("handler");

  bus.on("tick", handler);
  bus.on("tick", handler);
  bus.on("done", () => log.push("done"));

  assert.equal(bus.off("tick", handler), 2);
  assert.equal(bus.listenerCount("tick"), 0);
  assert.equal(bus.listenerCount(), 1);

  bus.emit("tick", undefined);
  bus.emit("done", undefined);

  assert.deepEqual(log, ["done"]);
  assert.equal(bus.clear("done"), 1);
  assert.equal(bus.clear("done"), 0);
  assert.equal(bus.listenerCount(), 0);

  bus.on("a", () => {});
  bus.on("b", () => {});
  assert.equal(bus.clear(), 2);
  assert.equal(bus.listenerCount(), 0);
});

test("event bus handles listener mutation during dispatch deterministically", () => {
  const bus = new EventBus();
  const log = [];
  let secondSubscription;

  bus.on("tick", () => {
    log.push("first");
    secondSubscription.unsubscribe();
    bus.on("tick", () => log.push("late"));
  });

  secondSubscription = bus.on("tick", () => log.push("second"));

  bus.emit("tick", undefined);
  bus.emit("tick", undefined);

  assert.deepEqual(log, ["first", "first", "late"]);
});

test("event bus reports invalid listener configuration clearly", () => {
  const bus = new EventBus();

  assert.throws(() => bus.on("", () => {}), /Event type must be a non-empty string/);
  assert.throws(() => bus.on("tick", undefined), /Event listener for "tick" must be a function/);
  assert.throws(() => bus.emit(" ", undefined), /Event type must be a non-empty string/);
});

test("runtime scheduler runs one-shot tasks in deterministic due-time order", () => {
  const scheduler = new RuntimeScheduler();
  const log = [];

  scheduler.schedule(0.5, (context) => log.push(`second:${context.id}:${context.scheduledTimeSeconds}`));
  scheduler.schedule(0.25, (context) => log.push(`first:${context.id}:${context.scheduledTimeSeconds}`));
  scheduler.schedule(0.5, (context) => log.push(`third:${context.id}:${context.scheduledTimeSeconds}`));

  assert.equal(scheduler.elapsedSeconds, 0);
  assert.equal(scheduler.taskCount(), 3);

  assert.deepEqual(scheduler.update(0.25), {
    elapsedSeconds: 0.25,
    deltaSeconds: 0.25,
    firedCount: 1,
    taskCount: 2
  });
  assert.deepEqual(log, ["first:2:0.25"]);

  assert.deepEqual(scheduler.update(0.25), {
    elapsedSeconds: 0.5,
    deltaSeconds: 0.25,
    firedCount: 2,
    taskCount: 0
  });
  assert.deepEqual(log, ["first:2:0.25", "second:1:0.5", "third:3:0.5"]);
});

test("runtime scheduler supports repeated tasks and catch-up updates", () => {
  const scheduler = new RuntimeScheduler();
  const log = [];

  const task = scheduler.repeat(0.25, (context) => {
    log.push(`${context.firedCount}@${context.scheduledTimeSeconds}->${context.elapsedSeconds}`);
  }, { maxRuns: 4 });

  const result = scheduler.update(1);

  assert.deepEqual(result, {
    elapsedSeconds: 1,
    deltaSeconds: 1,
    firedCount: 4,
    taskCount: 0
  });
  assert.equal(task.active, false);
  assert.equal(task.firedCount, 4);
  assert.deepEqual(log, [
    "1@0.25->1",
    "2@0.5->1",
    "3@0.75->1",
    "4@1->1"
  ]);
});

test("runtime scheduler supports cancellation and clearing", () => {
  const scheduler = new RuntimeScheduler();
  const log = [];

  const cancelled = scheduler.schedule(0.1, () => log.push("cancelled"));
  scheduler.schedule(0.1, () => log.push("kept"));

  assert.equal(cancelled.active, true);
  assert.equal(cancelled.cancel(), true);
  assert.equal(cancelled.cancel(), false);
  assert.equal(cancelled.active, false);

  scheduler.update(0.1);
  assert.deepEqual(log, ["kept"]);
  assert.equal(scheduler.taskCount(), 0);

  scheduler.schedule(1, () => log.push("late"));
  scheduler.repeat(1, () => log.push("repeat"));
  assert.equal(scheduler.clear(), 2);
  assert.equal(scheduler.clear(), 0);
  assert.equal(scheduler.taskCount(), 0);
  scheduler.update(2);
  assert.deepEqual(log, ["kept"]);
});

test("runtime scheduler handles task mutation during update deterministically", () => {
  const scheduler = new RuntimeScheduler();
  const log = [];
  let secondTask;

  scheduler.schedule(0, () => {
    log.push("first");
    secondTask.cancel();
    scheduler.schedule(0, () => log.push("late"));
  });
  secondTask = scheduler.schedule(0, () => log.push("second"));

  scheduler.update(0);
  assert.deepEqual(log, ["first"]);
  assert.equal(scheduler.taskCount(), 1);

  scheduler.update(0);
  assert.deepEqual(log, ["first", "late"]);
});

test("runtime scheduler reports invalid timing inputs clearly", () => {
  const scheduler = new RuntimeScheduler();

  assert.throws(() => scheduler.schedule(-1, () => {}), /Schedule delay must be a finite non-negative number/);
  assert.throws(() => scheduler.schedule(0, undefined), /Scheduler callback must be a function/);
  assert.throws(() => scheduler.repeat(0, () => {}), /Repeat interval must be a finite positive number/);
  assert.throws(() => scheduler.repeat(1, () => {}, { startDelaySeconds: -1 }), /Repeat start delay must be a finite non-negative number/);
  assert.throws(() => scheduler.repeat(1, () => {}, { maxRuns: 0 }), /Repeat maxRuns must be a positive integer/);
  assert.throws(() => scheduler.update(Number.POSITIVE_INFINITY), /Scheduler delta must be a finite non-negative number/);
});

test("runtime services system advances scheduler during scene updates", () => {
  const scene = new Scene("RuntimeServicesScene");
  const system = addRuntimeServices(scene);
  const log = [];

  system.services.scheduler.schedule(0.5, (context) => log.push(`scheduled:${context.elapsedSeconds}`));

  assert.equal(system.priority, -250);
  assert.equal(getRuntimeServices(scene), system.services);

  scene.start();
  scene.update(0.25);
  assert.deepEqual(log, []);
  assert.deepEqual(system.lastSchedulerUpdate, {
    elapsedSeconds: 0.25,
    deltaSeconds: 0.25,
    firedCount: 0,
    taskCount: 1
  });

  scene.update(0.25);
  assert.deepEqual(log, ["scheduled:0.5"]);
  assert.deepEqual(system.lastSchedulerUpdate, {
    elapsedSeconds: 0.5,
    deltaSeconds: 0.25,
    firedCount: 1,
    taskCount: 0
  });
});

test("runtime services system can use injected services and disabled scheduler updates", () => {
  const scene = new Scene("InjectedRuntimeServicesScene");
  const eventBus = new EventBus();
  const scheduler = new RuntimeScheduler();
  const services = createRuntimeServices({ eventBus, scheduler });
  const log = [];

  eventBus.on("ping", () => log.push("event"));
  scheduler.schedule(0, () => log.push("scheduled"));

  const system = addRuntimeServices(scene, {
    services,
    updateScheduler: false,
    clearOnDestroy: false,
    priority: 123
  });

  assert.equal(system.services, services);
  assert.equal(system.priority, 123);
  assert.equal(getRuntimeServices(scene), services);

  scene.start();
  scene.update(1);

  services.eventBus.emit("ping", undefined);
  assert.deepEqual(log, ["event"]);
  assert.equal(services.scheduler.taskCount(), 1);
  assert.equal(system.lastSchedulerUpdate, undefined);

  scene.destroy();
  assert.equal(services.eventBus.listenerCount(), 1);
  assert.equal(services.scheduler.taskCount(), 1);
});

test("runtime services clear listeners and tasks on system destroy by default", () => {
  const scene = new Scene("RuntimeServicesCleanupScene");
  const system = scene.addSystem(new RuntimeServicesSystem(scene));

  system.services.eventBus.on("done", () => {});
  system.services.scheduler.schedule(1, () => {});

  scene.start();
  assert.equal(system.services.eventBus.listenerCount(), 1);
  assert.equal(system.services.scheduler.taskCount(), 1);

  scene.destroy();

  assert.equal(system.services.eventBus.listenerCount(), 0);
  assert.equal(system.services.scheduler.taskCount(), 0);
});

test("runtime services can be created and cleared without a scene", () => {
  const services = createRuntimeServices();

  services.eventBus.on("event", () => {});
  services.scheduler.schedule(1, () => {});

  assert.deepEqual(services.clear(), {
    eventListenerCount: 1,
    scheduledTaskCount: 1
  });
  assert.deepEqual(services.clear(), {
    eventListenerCount: 0,
    scheduledTaskCount: 0
  });
  assert.equal(getRuntimeServices(new Scene("NoRuntimeServicesScene")), undefined);
});

test("sprite frame and animation clip helpers return isolated data contracts", () => {
  const frameInput = {
    id: "hero-run-1",
    spriteId: "hero",
    x: 0,
    y: 0,
    width: 32,
    height: 32,
    durationSeconds: 0.08
  };
  const clipInput = {
    id: "hero-run",
    frameIds: ["hero-run-1", "hero-run-2"],
    frameDurationSeconds: 0.08,
    loop: true
  };
  const frame = defineSpriteFrame(frameInput);
  const clip = defineSpriteAnimationClip(clipInput);

  frameInput.x = 99;
  clipInput.frameIds.push("mutated");

  assert.deepEqual(frame, {
    id: "hero-run-1",
    spriteId: "hero",
    x: 0,
    y: 0,
    width: 32,
    height: 32,
    durationSeconds: 0.08
  });
  assert.deepEqual(clip, {
    id: "hero-run",
    frameIds: ["hero-run-1", "hero-run-2"],
    frameDurationSeconds: 0.08,
    loop: true
  });
});

test("sprite animation playback advances looping clips deterministically", () => {
  const clip = defineSpriteAnimationClip({
    id: "hero-run",
    frameIds: ["hero-run-1", "hero-run-2", "hero-run-3"],
    frameDurationSeconds: 0.25
  });

  const initial = createSpriteAnimationPlayback(clip);
  const secondFrame = advanceSpriteAnimationPlayback(initial, clip, 0.25);
  const looped = advanceSpriteAnimationPlayback(secondFrame, clip, 0.5);

  assert.deepEqual(initial, {
    clipId: "hero-run",
    status: "playing",
    elapsedSeconds: 0,
    frameIndex: 0,
    completedLoops: 0
  });
  assert.equal(getSpriteAnimationPlaybackFrameId(clip, initial), "hero-run-1");
  assert.equal(secondFrame.frameIndex, 1);
  assert.equal(getSpriteAnimationPlaybackFrameId(clip, secondFrame), "hero-run-2");
  assert.deepEqual(looped, {
    clipId: "hero-run",
    status: "playing",
    elapsedSeconds: 0.75,
    frameIndex: 0,
    completedLoops: 1
  });
  assert.equal(getSpriteAnimationPlaybackFrameId(clip, looped), "hero-run-1");
});

test("sprite animation playback completes non-looping clips at the final frame", () => {
  const clip = defineSpriteAnimationClip({
    id: "hero-jump",
    frameIds: ["hero-jump-1", "hero-jump-2", "hero-jump-3"],
    frameDurationSeconds: 0.25,
    loop: false
  });

  const initial = createSpriteAnimationPlayback(clip);
  const completed = advanceSpriteAnimationPlayback(initial, clip, 0.8);
  const unchanged = advanceSpriteAnimationPlayback(completed, clip, 0.8);

  assert.deepEqual(completed, {
    clipId: "hero-jump",
    status: "completed",
    elapsedSeconds: 0.75,
    frameIndex: 2,
    completedLoops: 1
  });
  assert.equal(getSpriteAnimationPlaybackFrameId(clip, completed), "hero-jump-3");
  assert.deepEqual(unchanged, completed);
});

test("sprite animation playback can pause, resume and stop without mutating previous state", () => {
  const clip = defineSpriteAnimationClip({
    id: "hero-idle",
    frameIds: ["hero-idle-1", "hero-idle-2"],
    frameDurationSeconds: 0.25
  });

  const initial = createSpriteAnimationPlayback(clip);
  const advanced = advanceSpriteAnimationPlayback(initial, clip, 0.25);
  const paused = pauseSpriteAnimationPlayback(advanced);
  const stillPaused = advanceSpriteAnimationPlayback(paused, clip, 0.5);
  const resumed = resumeSpriteAnimationPlayback(stillPaused);
  const afterResume = advanceSpriteAnimationPlayback(resumed, clip, 0.25);
  const stopped = stopSpriteAnimationPlayback(afterResume);
  const stillStopped = advanceSpriteAnimationPlayback(stopped, clip, 0.5);

  assert.equal(initial.frameIndex, 0);
  assert.equal(advanced.frameIndex, 1);
  assert.equal(paused.status, "paused");
  assert.deepEqual(stillPaused, paused);
  assert.equal(resumed.status, "playing");
  assert.equal(afterResume.frameIndex, 0);
  assert.deepEqual(stopped, {
    clipId: "hero-idle",
    status: "stopped",
    elapsedSeconds: 0,
    frameIndex: 0,
    completedLoops: 0
  });
  assert.deepEqual(stillStopped, stopped);
});

test("sprite animation playback can use frame-specific durations", () => {
  const clip = defineSpriteAnimationClip({
    id: "hero-charge",
    frameIds: ["hero-charge-1", "hero-charge-2", "hero-charge-3"],
    frameDurationSeconds: 0.1
  });
  const frames = [
    defineSpriteFrame({ id: "hero-charge-1", spriteId: "hero", durationSeconds: 0.2 }),
    defineSpriteFrame({ id: "hero-charge-2", spriteId: "hero", durationSeconds: 0.05 }),
    defineSpriteFrame({ id: "hero-charge-3", spriteId: "hero" })
  ];

  assert.equal(getSpriteAnimationPlaybackFrameIndex(clip, 0.19, { frames }), 0);
  assert.equal(getSpriteAnimationPlaybackFrameIndex(clip, 0.2, { frames }), 1);
  assert.equal(getSpriteAnimationPlaybackFrameIndex(clip, 0.25, { frames }), 2);
});

test("sprite animation playback reports invalid timing inputs clearly", () => {
  assert.throws(
    () =>
      createSpriteAnimationPlayback({
        id: "empty",
        frameIds: []
      }),
    /Sprite animation clip "empty" must include at least one frame id/
  );
  assert.throws(
    () =>
      createSpriteAnimationPlayback({
        id: "untimed",
        frameIds: ["untimed-1"]
      }),
    /Sprite animation clip "untimed" needs frameDurationSeconds or frame "untimed-1" durationSeconds/
  );
  assert.throws(
    () =>
      advanceSpriteAnimationPlayback(
        createSpriteAnimationPlayback({
          id: "hero-run",
          frameIds: ["hero-run-1"],
          frameDurationSeconds: 0.1
        }),
        {
          id: "hero-run",
          frameIds: ["hero-run-1"],
          frameDurationSeconds: 0.1
        },
        -0.1
      ),
    /deltaSeconds must be greater than or equal to 0/
  );
  assert.throws(
    () =>
      getSpriteAnimationPlaybackFrameIndex(
        {
          id: "hero-run",
          frameIds: ["hero-run-1"],
          frameDurationSeconds: 0.1
        },
        0,
        { frames: [] }
      ),
    /Sprite animation clip "hero-run" references missing frame "hero-run-1" in playback frames/
  );
});

test("sprite animation system advances components and applies sprite frames to view nodes", () => {
  const scene = new Scene("AnimationScene");
  const assets = createAnimationAssets();
  const node = createFakeSpriteNode();
  const actor = scene.world.createEntity("hero");
  const animation = actor.addComponent(new SpriteAnimationComponent("hero-run"));
  actor.addComponent(new TransformComponent());
  actor.addComponent(new ViewComponent(node));
  scene.addSystem(new SpriteAnimationSystem(scene, assets));
  scene.start();

  scene.update(0.25);
  scene.lateUpdate(0.25);

  assert.equal(animation.currentFrameId, "hero-run-2");
  assert.equal(animation.currentSpriteId, "hero-sprite-2");
  assert.equal(animation.playback.frameIndex, 1);
  assert.equal(node.asset.id, "hero-sprite-2");
  assert.equal(node.width, 36);
  assert.equal(node.height, 40);
});

test("sprite animation component can pause, resume and stop through the animation system", () => {
  const scene = new Scene("AnimationControlsScene");
  const assets = createAnimationAssets();
  const actor = scene.world.createEntity("hero");
  const animation = actor.addComponent(new SpriteAnimationComponent("hero-run"));
  actor.addComponent(new TransformComponent());
  scene.addSystem(new SpriteAnimationSystem(scene, assets));
  scene.start();

  animation.pause();
  scene.update(0.5);
  assert.equal(animation.playback.status, "paused");
  assert.equal(animation.currentFrameId, "hero-run-1");

  animation.resume();
  scene.update(0.25);
  assert.equal(animation.playback.status, "playing");
  assert.equal(animation.currentFrameId, "hero-run-2");

  animation.stop();
  scene.update(0.25);
  assert.equal(animation.playback.status, "stopped");
  assert.equal(animation.playback.elapsedSeconds, 0);
  assert.equal(animation.currentFrameId, "hero-run-1");
});

test("sprite animation component can switch clips and reset playback", () => {
  const scene = new Scene("AnimationSwitchScene");
  const assets = createAnimationAssets();
  const node = createFakeSpriteNode();
  const actor = scene.world.createEntity("hero");
  const animation = actor.addComponent(new SpriteAnimationComponent("hero-run"));
  actor.addComponent(new TransformComponent());
  actor.addComponent(new ViewComponent(node));
  scene.addSystem(new SpriteAnimationSystem(scene, assets));
  scene.start();

  scene.update(0.5);
  animation.play("hero-idle");
  scene.update(0);
  scene.lateUpdate(0);

  assert.deepEqual(animation.playback, {
    clipId: "hero-idle",
    status: "playing",
    elapsedSeconds: 0,
    frameIndex: 0,
    completedLoops: 0
  });
  assert.equal(animation.currentFrameId, "hero-idle-1");
  assert.equal(node.asset.id, "hero-sprite-1");
});

test("sprite animation system can update animation state without a view component", () => {
  const scene = new Scene("HeadlessAnimationScene");
  const assets = createAnimationAssets();
  const actor = scene.world.createEntity("headless-hero");
  const animation = actor.addComponent(new SpriteAnimationComponent("hero-run"));
  scene.addSystem(new SpriteAnimationSystem(scene, assets));
  scene.start();

  scene.update(0.25);
  scene.lateUpdate(0.25);

  assert.equal(animation.currentFrameId, "hero-run-2");
  assert.equal(animation.currentSpriteId, "hero-sprite-2");
});

test("sprite animation system reports invalid animation setup clearly", () => {
  const missingClipScene = new Scene("MissingClipScene");
  const missingClipAssets = createAnimationAssets();
  const missingClipActor = missingClipScene.world.createEntity("hero");
  missingClipActor.addComponent(new SpriteAnimationComponent("missing"));
  missingClipScene.addSystem(new SpriteAnimationSystem(missingClipScene, missingClipAssets));
  missingClipScene.start();
  assert.throws(
    () => missingClipScene.update(0),
    /Sprite animation clip "missing" is not registered/
  );

  const missingFrameScene = new Scene("MissingFrameScene");
  const missingFrameAssets = new AssetRegistry();
  missingFrameAssets.registerAnimationClip({ id: "broken", frameIds: ["missing-frame"], frameDurationSeconds: 0.25 });
  const missingFrameActor = missingFrameScene.world.createEntity("hero");
  missingFrameActor.addComponent(new SpriteAnimationComponent("broken"));
  missingFrameScene.addSystem(new SpriteAnimationSystem(missingFrameScene, missingFrameAssets));
  missingFrameScene.start();
  assert.throws(
    () => missingFrameScene.update(0),
    /Sprite frame "missing-frame" is not registered/
  );

  const missingSpriteScene = new Scene("MissingSpriteScene");
  const missingSpriteAssets = new AssetRegistry();
  missingSpriteAssets.registerSpriteFrame({ id: "orphan-frame", spriteId: "missing-sprite" });
  missingSpriteAssets.registerAnimationClip({ id: "orphan", frameIds: ["orphan-frame"], frameDurationSeconds: 0.25 });
  const missingSpriteActor = missingSpriteScene.world.createEntity("hero");
  missingSpriteActor.addComponent(new SpriteAnimationComponent("orphan"));
  missingSpriteActor.addComponent(new TransformComponent());
  missingSpriteActor.addComponent(new ViewComponent(createFakeSpriteNode()));
  missingSpriteScene.addSystem(new SpriteAnimationSystem(missingSpriteScene, missingSpriteAssets));
  missingSpriteScene.start();
  missingSpriteScene.update(0);
  assert.throws(
    () => missingSpriteScene.lateUpdate(0),
    /Sprite asset "missing-sprite" is not registered/
  );

  const nonSpriteScene = new Scene("NonSpriteAnimationScene");
  const nonSpriteAssets = createAnimationAssets();
  const nonSpriteActor = nonSpriteScene.world.createEntity("hero");
  nonSpriteActor.addComponent(new SpriteAnimationComponent("hero-run"));
  nonSpriteActor.addComponent(new TransformComponent());
  nonSpriteActor.addComponent(new ViewComponent(createFakeContainer()));
  nonSpriteScene.addSystem(new SpriteAnimationSystem(nonSpriteScene, nonSpriteAssets));
  nonSpriteScene.start();
  nonSpriteScene.update(0);
  assert.throws(
    () => nonSpriteScene.lateUpdate(0),
    /ViewComponent node does not support sprite assets/
  );
});

test("sprite-capable render node guard detects setAsset support", () => {
  const spriteNode = createFakeSpriteNode();
  const containerNode = createFakeContainer();

  assert.equal(isSpriteCapableRenderNode(spriteNode), true);
  assert.equal(isSpriteCapableRenderNode(containerNode), false);
  assert.equal(isSpriteCapableRenderNode(null), false);
  assert.equal(isSpriteCapableRenderNode({ setAsset: "not-a-function" }), false);
});

test("view component can explicitly sync transform and optional size to render node", () => {
  const node = createFakeContainer();
  const view = new ViewComponent(node);
  const transform = new TransformComponent();
  transform.x = 12;
  transform.y = 34;
  transform.rotation = 45;
  transform.scaleX = 2;
  transform.scaleY = 3;

  view.syncFromTransform(transform);

  assert.equal(node.x, 12);
  assert.equal(node.y, 34);
  assert.equal(node.rotation, 45);
  assert.equal(node.scaleX, 2);
  assert.equal(node.scaleY, 3);
  assert.equal(node.width, undefined);
  assert.equal(node.height, undefined);

  view.syncFromTransform(transform, new SizeComponent(64, 48));

  assert.equal(node.width, 64);
  assert.equal(node.height, 48);
});

test("view component lateUpdate delegates transform and size sync", () => {
  const scene = new Scene("ViewSyncScene");
  const node = createFakeContainer();
  const entity = scene.world.createEntity("actor");
  const transform = entity.addComponent(new TransformComponent());
  entity.addComponent(new SizeComponent(20, 30));
  entity.addComponent(new ViewComponent(node));
  transform.x = 100;
  transform.y = 120;
  transform.rotation = 15;
  transform.scaleX = 1.5;
  transform.scaleY = 0.75;

  scene.start();
  scene.lateUpdate(1 / 60);

  assert.equal(node.x, 100);
  assert.equal(node.y, 120);
  assert.equal(node.rotation, 15);
  assert.equal(node.scaleX, 1.5);
  assert.equal(node.scaleY, 0.75);
  assert.equal(node.width, 20);
  assert.equal(node.height, 30);
});

test("view component owns and destroys its render node", () => {
  let destroyCalls = 0;
  const node = {
    ...createFakeContainer(),
    destroy() {
      destroyCalls += 1;
    }
  };
  const view = new ViewComponent(node);

  view.destroy();

  assert.equal(destroyCalls, 1);
});

test("camera system maps world layer from position and zoom", () => {
  const scene = new Scene("CameraScene");
  const renderScene = createFakeRenderScene(800, 600);
  const camera = new CameraSystem(scene, renderScene);

  scene.addSystem(camera);
  scene.start();

  camera.moveTo(100, 50);
  camera.setZoom(2);
  scene.lateUpdate(1 / 60);

  assert.equal(renderScene.layers.world.scaleX, 2);
  assert.equal(renderScene.layers.world.scaleY, 2);
  assert.equal(renderScene.layers.world.x, 200);
  assert.equal(renderScene.layers.world.y, 200);
});

test("camera system can follow an entity using transform position and offset", () => {
  const scene = new Scene("CameraFollowScene");
  const renderScene = createFakeRenderScene(800, 600);
  const camera = new CameraSystem(scene, renderScene);

  scene.addSystem(camera);
  const player = scene.world.createEntity("player");
  const transform = player.addComponent(new TransformComponent());
  transform.x = 120;
  transform.y = 80;

  scene.start();
  camera.follow(player, 10, 20);
  scene.lateUpdate(1 / 60);

  assert.equal(camera.x, 130);
  assert.equal(camera.y, 100);
  assert.equal(renderScene.layers.world.x, 270);
  assert.equal(renderScene.layers.world.y, 200);
});

function createAnimationAssets() {
  const assets = new AssetRegistry();
  assets.loadManifest({
    sprites: [
      { id: "hero-sprite-1", fill: "#ffcf7a", width: 32, height: 32 },
      { id: "hero-sprite-2", fill: "#6cb7ff", width: 32, height: 32 }
    ],
    frames: [
      { id: "hero-run-1", spriteId: "hero-sprite-1", width: 32, height: 40, durationSeconds: 0.25 },
      { id: "hero-run-2", spriteId: "hero-sprite-2", width: 36, height: 40, durationSeconds: 0.25 },
      { id: "hero-idle-1", spriteId: "hero-sprite-1", width: 32, height: 40, durationSeconds: 0.5 }
    ],
    clips: [
      { id: "hero-run", frameIds: ["hero-run-1", "hero-run-2"] },
      { id: "hero-idle", frameIds: ["hero-idle-1"], loop: false }
    ]
  });

  return assets;
}

function createFakeEventTarget() {
  const listeners = new Map();

  return {
    addEventListener(type, listener) {
      const current = listeners.get(type) ?? new Set();
      current.add(listener);
      listeners.set(type, current);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    dispatch(type, event) {
      for (const listener of listeners.get(type) ?? []) {
        if (typeof listener === "function") {
          listener(event);
        } else {
          listener.handleEvent(event);
        }
      }
    },
    listenerCount(type) {
      return listeners.get(type)?.size ?? 0;
    }
  };
}

function createFakeSpriteNode() {
  return {
    ...createFakeContainer(),
    asset: undefined,
    setAsset(asset) {
      this.asset = asset;
    }
  };
}

function createFakeRenderScene(width, height) {
  return {
    root: createFakeContainer(),
    layers: {
      background: createFakeContainer(),
      world: createFakeContainer(),
      ui: createFakeContainer(),
      overlay: createFakeContainer()
    },
    width,
    height,
    mount() {},
    destroy() {}
  };
}

function createFakeContainer() {
  return {
    x: 0,
    y: 0,
    width: undefined,
    height: undefined,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    visible: true,
    addChild() {},
    destroy() {}
  };
}
