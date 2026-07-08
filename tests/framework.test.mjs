import test from "node:test";
import assert from "node:assert/strict";

import { Scene } from "../lib/core/index.js";
import {
  AudioRuntimeState,
  AudioRuntimeSystem,
  AudioPlaybackSystem,
  AssetRegistry,
  allowSourceTargetAction,
  blockSourceTargetAction,
  BrowserKeyboardBridge,
  BrowserPointerButtonBridge,
  BrowserPointerPositionBridge,
  CameraSystem,
  CollisionSystem,
  ColliderComponent,
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
  cancelEntityDrag,
  createAudioRuntimeState,
  createBrowserPointerLocalPositionResolver,
  clearDialogueChoiceSelection,
  defineDialogueChoice,
  defineDialogueLine,
  defineDialoguePrompt,
  createDialoguePromptView,
  createDialogueChoiceState,
  createEntityDragState,
  createSceneQuickStartBundle,
  createSceneInputBridgeBundle,
  createSceneRuntimePreset,
  attachActorSpriteView,
  createRuntimeServices,
  createSourceTargetSelectionState,
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
  getBrowserPointerLocalPosition,
  getDialogueChoiceStateSnapshot,
  getDialoguePromptSnapshot,
  getResolvedDialogueChoice,
  getSelectedDialogueChoice,
  getEntityDragDelta,
  getEntityDragSnapshot,
  getEntityHitRect,
  getPointerButtonInputId,
  getSpriteAnimationPlaybackFrameId,
  getSpriteAnimationPlaybackFrameIndex,
  getRuntimeServices,
  hitTestEntitiesAtPoint,
  isSpriteCapableRenderNode,
  clampPositionToBounds,
  limitMovementVector,
  pickTopEntityAtPoint,
  pointInRect,
  randomPositionInBounds,
  clearSourceTargetSelection,
  clearSourceTargetTarget,
  completeEntityDrag,
  createSourceTargetAction,
  createSourceTargetActionFromSelection,
  createHudText,
  isEntityDragActive,
  isSourceTargetActionAllowed,
  normalizeKeyboardKey,
  normalizePointerButton,
  moveEntityDrag,
  pauseSpriteAnimationPlayback,
  resumeSpriteAnimationPlayback,
  getSourceTargetActionSnapshot,
  getSourceTargetSelectionSnapshot,
  getSourceTargetSelectionPair,
  isDialogueChoiceResolved,
  isDialogueChoiceSelected,
  isSourceTargetSelectionReady,
  replaceSourceTargetSelectionSource,
  replaceSourceTargetSelectionTarget,
  resolveDialogueChoiceSelection,
  selectDialogueChoice,
  selectSourceTargetSource,
  selectSourceTargetTarget,
  startEntityDrag,
  stopSpriteAnimationPlayback,
  createLevelLayout,
  createTileMapLayerView,
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

test("input system stores copied pointer position state", () => {
  const input = new InputSystem();

  input.setPointerPosition({ x: 12, y: 34 });

  const position = input.getPointerPosition();
  assert.deepEqual(position, { x: 12, y: 34 });

  position.x = 99;
  assert.deepEqual(input.getPointerPosition(), { x: 12, y: 34 });

  input.clearPointerPosition();
  assert.equal(input.getPointerPosition(), undefined);

  assert.throws(
    () => input.setPointerPosition({ x: Number.NaN, y: 0 }),
    /Pointer position x must be a finite number/
  );
  assert.throws(
    () => input.setPointerPosition({ x: 0, y: Number.POSITIVE_INFINITY }),
    /Pointer position y must be a finite number/
  );
});

test("browser keyboard bridge supports injected targets and cleanup", () => {
  const scene = new Scene("KeyboardBridgeScene");
  const input = new InputSystem(scene);
  const target = createFakeEventTarget();
  const bridge = new BrowserKeyboardBridge(input, target);

  bridge.attach();
  bridge.attach();
  assert.equal(target.listenerCount("keydown"), 1);

  target.dispatch("keydown", { key: "ArrowUp" });
  assert.equal(input.isPressed("arrowup"), true);
  assert.equal(input.wasPressed("arrowup"), true);

  input.lateUpdate();
  target.dispatch("keydown", { key: "ArrowUp" });
  assert.equal(input.wasPressed("arrowup"), false);

  target.dispatch("keyup", { key: "ArrowUp" });
  assert.equal(input.isPressed("arrowup"), false);

  target.dispatch("keydown", { key: "Enter" });
  bridge.detach();
  bridge.detach();
  assert.equal(input.isPressed("enter"), false);
  assert.equal(target.listenerCount("keydown"), 0);
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

test("browser pointer position bridge writes client position into input system", () => {
  const input = new InputSystem();
  const target = createFakeEventTarget();
  const bridge = new BrowserPointerPositionBridge(input, target);

  bridge.attach();
  bridge.attach();
  assert.equal(target.listenerCount("pointermove"), 1);

  target.dispatch("pointermove", { clientX: 10, clientY: 20 });
  assert.deepEqual(input.getPointerPosition(), { x: 10, y: 20 });

  target.dispatch("pointerdown", { clientX: 12, clientY: 22 });
  assert.deepEqual(input.getPointerPosition(), { x: 12, y: 22 });

  target.dispatch("pointerup", { clientX: 14, clientY: 24 });
  assert.deepEqual(input.getPointerPosition(), { x: 14, y: 24 });

  target.dispatch("pointermove", {});
  assert.deepEqual(input.getPointerPosition(), { x: 14, y: 24 });
});

test("browser pointer local resolver maps client coordinates through latest target bounds", () => {
  const input = new InputSystem();
  const target = createFakeEventTarget();
  let bounds = { left: 100, top: 50 };
  target.getBoundingClientRect = () => bounds;
  const bridge = new BrowserPointerPositionBridge(
    input,
    target,
    createBrowserPointerLocalPositionResolver(target)
  );

  bridge.attach();
  target.dispatch("pointermove", { clientX: 140, clientY: 90 });
  assert.deepEqual(input.getPointerPosition(), { x: 40, y: 40 });

  bounds = { left: 20, top: 10 };
  target.dispatch("pointermove", { clientX: 140, clientY: 90 });
  assert.deepEqual(input.getPointerPosition(), { x: 120, y: 80 });
});

test("browser pointer local position helper supports x/y bounds fallback", () => {
  const target = {
    getBoundingClientRect() {
      return { x: 8, y: 13 };
    }
  };

  assert.deepEqual(getBrowserPointerLocalPosition({ clientX: 28, clientY: 43 }, target), { x: 20, y: 30 });
  assert.equal(getBrowserPointerLocalPosition({}, target), undefined);
});

test("browser pointer position bridge clears position on cancel, blur and detach", () => {
  const input = new InputSystem();
  const target = createFakeEventTarget();
  const bridge = new BrowserPointerPositionBridge(input, target);

  bridge.attach();
  target.dispatch("pointermove", { clientX: 10, clientY: 20 });
  target.dispatch("pointercancel", {});
  assert.equal(input.getPointerPosition(), undefined);

  target.dispatch("pointerdown", { clientX: 30, clientY: 40 });
  target.dispatch("blur", {});
  assert.equal(input.getPointerPosition(), undefined);

  target.dispatch("pointermove", { clientX: 50, clientY: 60 });
  bridge.detach();
  bridge.detach();
  assert.equal(input.getPointerPosition(), undefined);
  assert.equal(target.listenerCount("pointermove"), 0);

  target.dispatch("pointermove", { clientX: 70, clientY: 80 });
  assert.equal(input.getPointerPosition(), undefined);
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

test("quick-start scene input bridge bundle attaches and detaches configured browser bridges", () => {
  const scene = new Scene("QuickStartInputScene");
  const input = scene.addSystem(new InputSystem(scene));
  const target = createFakeEventTarget();
  target.getBoundingClientRect = () => ({ left: 5, top: 10 });

  const bundle = createSceneInputBridgeBundle(scene, {
    keyboard: { target },
    pointerButtons: { target },
    pointerPosition: { target, localTarget: target }
  });

  assert.equal(bundle.input, input);
  assert.deepEqual(bundle.bridges.map((bridge) => bridge.kind), [
    "keyboard",
    "pointer-button",
    "pointer-position"
  ]);
  assert.equal(bundle.detachOnSceneDestroy, true);
  assert.equal(target.listenerCount("keydown"), 1);
  assert.equal(target.listenerCount("pointerdown"), 2);

  target.dispatch("keydown", { key: "Enter" });
  target.dispatch("pointerdown", { button: 0, clientX: 25, clientY: 40 });
  assert.equal(input.isPressed("enter"), true);
  assert.equal(input.isPressed(getPointerButtonInputId("primary")), true);
  assert.deepEqual(input.getPointerPosition(), { x: 20, y: 30 });

  scene.destroy();
  assert.equal(input.isPressed("enter"), false);
  assert.equal(input.isPressed(getPointerButtonInputId("primary")), false);
  assert.equal(input.getPointerPosition(), undefined);
  assert.equal(target.listenerCount("keydown"), 0);
  assert.equal(target.listenerCount("pointerdown"), 0);
});

test("quick-start scene input bridge bundle reports missing input system clearly", () => {
  assert.throws(
    () => createSceneInputBridgeBundle(new Scene("MissingInputScene"), { keyboard: false }),
    /must install InputSystem/
  );
});

test("quick-start scene runtime preset installs default input and runtime services", () => {
  const scene = new Scene("QuickStartRuntimePresetScene");

  const preset = createSceneRuntimePreset(scene);

  assert.equal(preset.input, scene.getSystem(InputSystem));
  assert.equal(preset.runtimeServices, scene.getSystem(RuntimeServicesSystem));
  assert.equal(preset.services, preset.runtimeServices.services);
  assert.equal(preset.collisions, undefined);
  assert.equal(scene.systems.length, 2);
});

test("quick-start scene runtime preset installs requested systems and reuses existing systems", () => {
  const scene = new Scene("QuickStartRuntimePresetReuseScene");
  const existingInput = scene.addSystem(new InputSystem(scene));
  const existingServices = scene.addSystem(new RuntimeServicesSystem(scene, { priority: -111 }));

  const preset = createSceneRuntimePreset(scene, {
    input: true,
    collisions: true,
    runtimeServices: { priority: -222 }
  });
  const secondPreset = createSceneRuntimePreset(scene, {
    input: true,
    collisions: true,
    runtimeServices: true
  });

  assert.equal(preset.input, existingInput);
  assert.equal(preset.runtimeServices, existingServices);
  assert.equal(preset.runtimeServices.priority, -111);
  assert.equal(preset.collisions, scene.getSystem(CollisionSystem));
  assert.equal(secondPreset.input, preset.input);
  assert.equal(secondPreset.collisions, preset.collisions);
  assert.equal(secondPreset.runtimeServices, preset.runtimeServices);
  assert.equal(scene.systems.filter((system) => system instanceof InputSystem).length, 1);
  assert.equal(scene.systems.filter((system) => system instanceof CollisionSystem).length, 1);
  assert.equal(scene.systems.filter((system) => system instanceof RuntimeServicesSystem).length, 1);
});

test("quick-start scene runtime preset respects explicit opt-in options", () => {
  const scene = new Scene("QuickStartRuntimePresetOptionsScene");

  const emptyPreset = createSceneRuntimePreset(scene, {});
  const collisionPreset = createSceneRuntimePreset(scene, { collisions: true });

  assert.equal(emptyPreset.input, undefined);
  assert.equal(emptyPreset.runtimeServices, undefined);
  assert.equal(emptyPreset.collisions, undefined);
  assert.equal(collisionPreset.input, undefined);
  assert.equal(collisionPreset.runtimeServices, undefined);
  assert.equal(collisionPreset.collisions, scene.getSystem(CollisionSystem));
  assert.equal(scene.systems.length, 1);
});

test("quick-start scene bundle installs runtime before browser input bridges", () => {
  const scene = new Scene("QuickStartBundleScene");
  const target = createFakeEventTarget();
  target.getBoundingClientRect = () => ({ left: 12, top: 18 });

  const bundle = createSceneQuickStartBundle(scene, {
    runtime: {
      input: true,
      collisions: true
    },
    inputBridges: {
      keyboard: { target },
      pointerButtons: { target },
      pointerPosition: { target, localTarget: target }
    }
  });

  assert.equal(bundle.runtime.input, scene.getSystem(InputSystem));
  assert.equal(bundle.runtime.collisions, scene.getSystem(CollisionSystem));
  assert.equal(bundle.runtime.runtimeServices, undefined);
  assert.equal(bundle.inputBridges?.input, bundle.runtime.input);
  assert.deepEqual(bundle.inputBridges?.bridges.map((bridge) => bridge.kind), [
    "keyboard",
    "pointer-button",
    "pointer-position"
  ]);
  assert.equal(target.listenerCount("keydown"), 1);
  assert.equal(target.listenerCount("pointerdown"), 2);

  target.dispatch("keydown", { key: "Enter" });
  target.dispatch("pointerdown", { button: 0, clientX: 22, clientY: 33 });
  assert.equal(bundle.runtime.input?.isPressed("enter"), true);
  assert.equal(bundle.runtime.input?.isPressed(getPointerButtonInputId("primary")), true);
  assert.deepEqual(bundle.runtime.input?.getPointerPosition(), { x: 10, y: 15 });

  bundle.detach();
  assert.equal(bundle.runtime.input?.isPressed("enter"), false);
  assert.equal(bundle.runtime.input?.isPressed(getPointerButtonInputId("primary")), false);
  assert.equal(bundle.runtime.input?.getPointerPosition(), undefined);
  assert.equal(target.listenerCount("keydown"), 0);
  assert.equal(target.listenerCount("pointerdown"), 0);
});

test("quick-start scene bundle keeps runtime and bridge setup explicitly optional", () => {
  const scene = new Scene("QuickStartBundleExplicitScene");

  const emptyBundle = createSceneQuickStartBundle(scene, {
    runtime: false,
    inputBridges: false
  });
  const defaultBundle = createSceneQuickStartBundle(scene);

  assert.equal(emptyBundle.runtime.input, undefined);
  assert.equal(emptyBundle.runtime.runtimeServices, undefined);
  assert.equal(emptyBundle.inputBridges, undefined);
  assert.equal(defaultBundle.runtime.input, scene.getSystem(InputSystem));
  assert.equal(defaultBundle.runtime.runtimeServices, scene.getSystem(RuntimeServicesSystem));
  assert.equal(defaultBundle.inputBridges, undefined);
  assert.equal(scene.systems.length, 2);
});

test("point hit testing includes rect edges and reports invalid inputs", () => {
  const rect = { x: 10, y: 20, width: 30, height: 40 };

  assert.equal(pointInRect({ x: 10, y: 20 }, rect), true);
  assert.equal(pointInRect({ x: 40, y: 60 }, rect), true);
  assert.equal(pointInRect({ x: 41, y: 60 }, rect), false);
  assert.equal(pointInRect({ x: 40, y: 61 }, rect), false);

  assert.throws(
    () => pointInRect({ x: Number.NaN, y: 20 }, rect),
    /Hit test point x must be a finite number/
  );
  assert.throws(
    () => pointInRect({ x: 10, y: 20 }, { x: 0, y: 0, width: -1, height: 10 }),
    /Hit test rect width must be a finite number greater than or equal to 0/
  );
});

test("entity hit testing uses transform and size by default", () => {
  const scene = new Scene("EntityHitTestScene");
  const first = scene.world.createEntity("first");
  const firstTransform = first.addComponent(new TransformComponent());
  firstTransform.x = 10;
  firstTransform.y = 20;
  first.addComponent(new SizeComponent(30, 40));

  const second = scene.world.createEntity("second");
  const secondTransform = second.addComponent(new TransformComponent());
  secondTransform.x = 15;
  secondTransform.y = 25;
  second.addComponent(new SizeComponent(20, 20));

  const misses = scene.world.createEntity("missing-size");
  misses.addComponent(new TransformComponent());

  assert.deepEqual(getEntityHitRect(first), {
    x: 10,
    y: 20,
    width: 30,
    height: 40
  });

  const hits = hitTestEntitiesAtPoint({ x: 20, y: 30 }, scene.world.getEntities());
  assert.deepEqual(hits.map((hit) => hit.entityName), ["first", "second"]);

  hits[0].rect.x = 999;
  assert.deepEqual(getEntityHitRect(first), {
    x: 10,
    y: 20,
    width: 30,
    height: 40
  });

  assert.equal(pickTopEntityAtPoint({ x: 20, y: 30 }, scene.world.getEntities())?.entityName, "second");
  assert.equal(hitTestEntitiesAtPoint({ x: 200, y: 300 }, scene.world.getEntities()).length, 0);
});

test("entity hit testing can use collider rectangles, layers and filters", () => {
  const scene = new Scene("ColliderHitTestScene");
  const slot = scene.world.createEntity("slot");
  const slotTransform = slot.addComponent(new TransformComponent());
  slotTransform.x = 100;
  slotTransform.y = 120;
  slot.addComponent(new SizeComponent(50, 50));
  slot.addComponent(new ColliderComponent("slot", 30, 20, 5, 6));

  const inactive = scene.world.createEntity("inactive");
  const inactiveTransform = inactive.addComponent(new TransformComponent());
  inactiveTransform.x = 105;
  inactiveTransform.y = 126;
  inactive.addComponent(new SizeComponent(30, 20));
  inactive.deactivate();

  assert.deepEqual(getEntityHitRect(slot, { rectSource: "collider" }), {
    x: 105,
    y: 126,
    width: 30,
    height: 20
  });
  assert.equal(getEntityHitRect(slot, { rectSource: "collider", layer: "piece" }), undefined);

  assert.deepEqual(
    hitTestEntitiesAtPoint(
      { x: 106, y: 127 },
      scene.world.entities,
      { rectSource: "collider", layer: "slot" }
    ).map((hit) => hit.entityName),
    ["slot"]
  );
  assert.deepEqual(
    hitTestEntitiesAtPoint(
      { x: 106, y: 127 },
      scene.world.entities,
      { includeInactive: true, filter: (entity) => entity.name !== "slot" }
    ).map((hit) => hit.entityName),
    ["inactive"]
  );
});

test("source-target selection tracks source, target and immutable phase changes", () => {
  const scene = new Scene("SourceTargetSelectionScene");
  const bottleA = scene.world.createEntity("bottle-a");
  const bottleB = scene.world.createEntity("bottle-b");
  const bottleC = scene.world.createEntity("bottle-c");

  const empty = createSourceTargetSelectionState();
  assert.deepEqual(empty, { phase: "empty" });
  assert.equal(getSourceTargetSelectionPair(empty), undefined);
  assert.equal(isSourceTargetSelectionReady(empty), false);
  assert.deepEqual(getSourceTargetSelectionSnapshot(empty), {
    phase: "empty",
    source: undefined,
    target: undefined,
    isReady: false
  });

  const sourceSelected = selectSourceTargetSource(empty, bottleA);
  assert.equal(empty.phase, "empty");
  assert.equal(sourceSelected.phase, "source-selected");
  assert.equal(sourceSelected.source?.entity, bottleA);
  assert.equal(sourceSelected.source?.entityId, bottleA.id);
  assert.equal(sourceSelected.source?.entityName, "bottle-a");
  assert.equal(sourceSelected.target, undefined);

  const targetSelected = selectSourceTargetTarget(sourceSelected, bottleB);
  assert.equal(sourceSelected.phase, "source-selected");
  assert.equal(sourceSelected.target, undefined);
  assert.equal(targetSelected.phase, "target-selected");
  assert.equal(targetSelected.source?.entity, bottleA);
  assert.equal(targetSelected.target?.entity, bottleB);
  assert.equal(isSourceTargetSelectionReady(targetSelected), true);

  const pair = getSourceTargetSelectionPair(targetSelected);
  assert.equal(pair?.source.entity, bottleA);
  assert.equal(pair?.target.entity, bottleB);
  assert.notEqual(pair?.source, targetSelected.source);
  assert.notEqual(pair?.target, targetSelected.target);

  const snapshot = getSourceTargetSelectionSnapshot(targetSelected);
  assert.deepEqual(snapshot, {
    phase: "target-selected",
    source: {
      entityId: bottleA.id,
      entityName: "bottle-a"
    },
    target: {
      entityId: bottleB.id,
      entityName: "bottle-b"
    },
    isReady: true
  });
  assert.equal("entity" in snapshot.source, false);
  assert.equal("entity" in snapshot.target, false);

  const nextSource = replaceSourceTargetSelectionSource(targetSelected, bottleC);
  assert.equal(nextSource.phase, "source-selected");
  assert.equal(nextSource.source?.entity, bottleC);
  assert.equal(nextSource.target, undefined);
  assert.equal(targetSelected.target?.entity, bottleB);
});

test("source-target selection reports invalid target transitions clearly", () => {
  const scene = new Scene("InvalidSourceTargetSelectionScene");
  const source = scene.world.createEntity("source");
  const target = scene.world.createEntity("target");

  assert.throws(
    () => selectSourceTargetTarget(createSourceTargetSelectionState(), target),
    /Cannot select a source-target target before selecting a source/
  );

  const sourceSelected = selectSourceTargetSource(createSourceTargetSelectionState(), source);
  assert.throws(
    () => selectSourceTargetTarget(sourceSelected, source),
    /Cannot select the same entity as both source and target/
  );

  const sameEntitySelection = selectSourceTargetTarget(sourceSelected, source, { allowSameEntity: true });
  assert.equal(sameEntitySelection.phase, "target-selected");
  assert.equal(sameEntitySelection.source?.entity, source);
  assert.equal(sameEntitySelection.target?.entity, source);

  const targetSelected = selectSourceTargetTarget(sourceSelected, target);
  const replacementTarget = replaceSourceTargetSelectionTarget(targetSelected, source, { allowSameEntity: true });
  assert.equal(replacementTarget.phase, "target-selected");
  assert.equal(replacementTarget.source?.entity, source);
  assert.equal(replacementTarget.target?.entity, source);
  assert.equal(targetSelected.target?.entity, target);

  const targetCleared = clearSourceTargetTarget(targetSelected);
  assert.deepEqual(targetCleared, {
    phase: "source-selected",
    source: {
      entity: source,
      entityId: source.id,
      entityName: "source"
    }
  });
  assert.notEqual(targetCleared.source, sourceSelected.source);
  assert.deepEqual(clearSourceTargetSelection(), { phase: "empty" });
  assert.deepEqual(clearSourceTargetTarget(createSourceTargetSelectionState()), { phase: "empty" });
});

test("source-target actions expose generic action data and copied snapshots", () => {
  const scene = new Scene("SourceTargetActionScene");
  const source = scene.world.createEntity("source");
  const target = scene.world.createEntity("target");

  const action = createSourceTargetAction(" pour ", source, target);
  assert.deepEqual(action, {
    type: "pour",
    source: {
      entityId: source.id,
      entityName: "source"
    },
    target: {
      entityId: target.id,
      entityName: "target"
    }
  });

  const snapshot = getSourceTargetActionSnapshot(action);
  assert.deepEqual(snapshot, action);
  assert.notEqual(snapshot, action);
  assert.notEqual(snapshot.source, action.source);
  assert.notEqual(snapshot.target, action.target);
  assert.equal("entity" in snapshot.source, false);
  assert.equal("entity" in snapshot.target, false);
});

test("source-target actions can be created from ready selection state", () => {
  const scene = new Scene("SourceTargetActionSelectionScene");
  const source = scene.world.createEntity("source");
  const target = scene.world.createEntity("target");
  const empty = createSourceTargetSelectionState();
  const sourceSelected = selectSourceTargetSource(empty, source);
  const targetSelected = selectSourceTargetTarget(sourceSelected, target);

  assert.throws(
    () => createSourceTargetActionFromSelection("pour", empty),
    /Cannot create a source-target action before selection is ready/
  );
  assert.throws(
    () => createSourceTargetActionFromSelection("pour", sourceSelected),
    /Cannot create a source-target action before selection is ready/
  );

  const action = createSourceTargetActionFromSelection("pour", targetSelected);
  assert.deepEqual(action, {
    type: "pour",
    source: {
      entityId: source.id,
      entityName: "source"
    },
    target: {
      entityId: target.id,
      entityName: "target"
    }
  });
  assert.equal(targetSelected.source?.entity, source);
  assert.equal(targetSelected.target?.entity, target);
});

test("source-target action validation results are deterministic and copied", () => {
  const scene = new Scene("SourceTargetActionValidationScene");
  const source = scene.world.createEntity("source");
  const target = scene.world.createEntity("target");
  const action = createSourceTargetAction("merge", source, target);

  const allowed = allowSourceTargetAction(action);
  assert.deepEqual(allowed, {
    allowed: true,
    status: "allowed",
    action
  });
  assert.equal(isSourceTargetActionAllowed(allowed), true);
  assert.notEqual(allowed.action, action);

  const blocked = blockSourceTargetAction(action, " target is full ");
  assert.deepEqual(blocked, {
    allowed: false,
    status: "blocked",
    action,
    reason: "target is full"
  });
  assert.equal(isSourceTargetActionAllowed(blocked), false);
  assert.notEqual(blocked.action.source, action.source);

  assert.throws(() => createSourceTargetAction(" ", source, target), /action type must be a non-empty string/);
  assert.throws(() => blockSourceTargetAction(action, " "), /blocked reason must be a non-empty string/);
});

test("dialogue prompt data contract normalizes line and choice data", () => {
  const prompt = defineDialoguePrompt({
    line: {
      id: " intro ",
      speaker: " Guide ",
      text: " Welcome in. "
    },
    choices: [
      {
        id: " look ",
        label: " Look around ",
        nextId: " inspect-room "
      },
      {
        id: " leave ",
        label: " Leave "
      }
    ]
  });

  assert.deepEqual(prompt, {
    line: {
      id: "intro",
      speaker: "Guide",
      text: "Welcome in."
    },
    choices: [
      {
        id: "look",
        label: "Look around",
        nextId: "inspect-room"
      },
      {
        id: "leave",
        label: "Leave"
      }
    ]
  });
});

test("dialogue prompt snapshots are copied and deterministic", () => {
  const prompt = defineDialoguePrompt({
    line: defineDialogueLine({
      id: "start",
      text: "Choose a path."
    }),
    choices: [
      defineDialogueChoice({
        id: "forest",
        label: "Forest",
        nextId: "forest-entrance"
      })
    ]
  });

  const snapshot = getDialoguePromptSnapshot(prompt);

  assert.deepEqual(snapshot, prompt);
  assert.notEqual(snapshot, prompt);
  assert.notEqual(snapshot.line, prompt.line);
  assert.notEqual(snapshot.choices, prompt.choices);
  assert.notEqual(snapshot.choices[0], prompt.choices[0]);
});

test("dialogue prompt data contract reports invalid fields clearly", () => {
  assert.throws(
    () => defineDialogueLine({ id: " ", text: "hello" }),
    /Dialogue line id must be a non-empty string/
  );
  assert.throws(
    () => defineDialogueLine({ id: "line", text: "" }),
    /Dialogue line text must be a non-empty string/
  );
  assert.throws(
    () => defineDialogueLine({ id: "line", speaker: " ", text: "hello" }),
    /Dialogue line speaker must be a non-empty string/
  );
  assert.throws(
    () => defineDialogueChoice({ id: "choice", label: " " }),
    /Dialogue choice label must be a non-empty string/
  );
  assert.throws(
    () => defineDialogueChoice({ id: "choice", label: "Continue", nextId: " " }),
    /Dialogue choice nextId must be a non-empty string/
  );
  assert.throws(
    () => defineDialoguePrompt({
      line: { id: "line", text: "hello" },
      choices: [
        { id: "repeat", label: "One" },
        { id: " repeat ", label: "Two" }
      ]
    }),
    /Dialogue prompt choice id "repeat" must be unique/
  );
});

test("dialogue choice state tracks selected choice id with copied prompt snapshots", () => {
  const prompt = defineDialoguePrompt({
    line: {
      id: "start",
      text: "Choose a route."
    },
    choices: [
      {
        id: " forest ",
        label: "Forest",
        nextId: "forest-entry"
      },
      {
        id: "town",
        label: "Town"
      }
    ]
  });

  const empty = createDialogueChoiceState(prompt);
  assert.deepEqual(empty, {
    phase: "empty",
    prompt
  });
  assert.equal(isDialogueChoiceSelected(empty), false);
  assert.equal(isDialogueChoiceResolved(empty), false);
  assert.equal(getSelectedDialogueChoice(empty), undefined);
  assert.equal(getResolvedDialogueChoice(empty), undefined);

  const emptySnapshot = getDialogueChoiceStateSnapshot(empty);
  assert.deepEqual(emptySnapshot, {
    phase: "empty",
    prompt,
    selectedChoiceId: undefined,
    resolvedChoice: undefined,
    isSelected: false,
    isResolved: false
  });
  assert.notEqual(emptySnapshot.prompt, prompt);
  assert.notEqual(emptySnapshot.prompt.line, prompt.line);
  assert.notEqual(emptySnapshot.prompt.choices, prompt.choices);

  const selected = selectDialogueChoice(empty, " forest ");
  assert.equal(empty.phase, "empty");
  assert.deepEqual(selected, {
    phase: "choice-selected",
    prompt,
    selectedChoiceId: "forest"
  });
  assert.equal(isDialogueChoiceSelected(selected), true);
  assert.equal(isDialogueChoiceResolved(selected), false);
  assert.deepEqual(getSelectedDialogueChoice(selected), {
    id: "forest",
    label: "Forest",
    nextId: "forest-entry"
  });

  const selectedChoice = getSelectedDialogueChoice(selected);
  assert.notEqual(selectedChoice, selected.prompt.choices[0]);

  const selectedSnapshot = getDialogueChoiceStateSnapshot(selected);
  assert.deepEqual(selectedSnapshot, {
    phase: "choice-selected",
    prompt,
    selectedChoiceId: "forest",
    resolvedChoice: undefined,
    isSelected: true,
    isResolved: false
  });
});

test("dialogue choice state clears and resolves selected choices deterministically", () => {
  const prompt = defineDialoguePrompt({
    line: {
      id: "start",
      text: "Choose a route."
    },
    choices: [
      {
        id: "forest",
        label: "Forest",
        nextId: "forest-entry"
      },
      {
        id: "town",
        label: "Town"
      }
    ]
  });

  const empty = createDialogueChoiceState(prompt);
  const selected = selectDialogueChoice(empty, "town");
  const cleared = clearDialogueChoiceSelection(selected);

  assert.deepEqual(cleared, {
    phase: "empty",
    prompt
  });
  assert.notEqual(cleared.prompt, selected.prompt);
  assert.equal(getSelectedDialogueChoice(cleared), undefined);

  const resolved = resolveDialogueChoiceSelection(selected);
  assert.deepEqual(resolved, {
    phase: "choice-resolved",
    prompt,
    selectedChoiceId: "town",
    resolvedChoice: {
      id: "town",
      label: "Town"
    }
  });
  assert.equal(isDialogueChoiceSelected(resolved), true);
  assert.equal(isDialogueChoiceResolved(resolved), true);
  assert.deepEqual(getResolvedDialogueChoice(resolved), {
    id: "town",
    label: "Town"
  });

  const resolvedChoice = getResolvedDialogueChoice(resolved);
  assert.notEqual(resolvedChoice, resolved.resolvedChoice);

  const resolvedSnapshot = getDialogueChoiceStateSnapshot(resolved);
  assert.deepEqual(resolvedSnapshot, {
    phase: "choice-resolved",
    prompt,
    selectedChoiceId: "town",
    resolvedChoice: {
      id: "town",
      label: "Town"
    },
    isSelected: true,
    isResolved: true
  });
  assert.notEqual(resolvedSnapshot.resolvedChoice, resolved.resolvedChoice);
});

test("dialogue choice state reports invalid transitions clearly", () => {
  const prompt = defineDialoguePrompt({
    line: {
      id: "start",
      text: "Choose a route."
    },
    choices: [
      {
        id: "forest",
        label: "Forest"
      }
    ]
  });

  const empty = createDialogueChoiceState(prompt);

  assert.throws(
    () => selectDialogueChoice(empty, " "),
    /Dialogue choice selection id must be a non-empty string/
  );
  assert.throws(
    () => selectDialogueChoice(empty, "missing"),
    /Dialogue choice id "missing" must belong to the current prompt/
  );
  assert.throws(
    () => resolveDialogueChoiceSelection(empty),
    /Cannot resolve a dialogue choice before selecting a choice/
  );
});

test("entity drag state tracks active entity positions and copied snapshots", () => {
  const scene = new Scene("EntityDragScene");
  const card = scene.world.createEntity("card");

  const idle = createEntityDragState();
  assert.deepEqual(idle, { phase: "idle" });
  assert.equal(isEntityDragActive(idle), false);
  assert.deepEqual(getEntityDragDelta(idle), { x: 0, y: 0 });
  assert.deepEqual(getEntityDragSnapshot(idle), {
    phase: "idle",
    subject: undefined,
    startPosition: undefined,
    currentPosition: undefined,
    delta: { x: 0, y: 0 },
    isActive: false
  });

  const started = startEntityDrag(idle, card, { x: 10, y: 20 });
  assert.deepEqual(idle, { phase: "idle" });
  assert.equal(started.phase, "dragging");
  assert.equal(started.subject?.entity, card);
  assert.equal(started.subject?.entityId, card.id);
  assert.equal(started.subject?.entityName, "card");
  assert.deepEqual(started.startPosition, { x: 10, y: 20 });
  assert.deepEqual(started.currentPosition, { x: 10, y: 20 });
  assert.equal(isEntityDragActive(started), true);

  const moved = moveEntityDrag(started, { x: 18, y: 26 });
  assert.notEqual(moved, started);
  assert.notEqual(moved.subject, started.subject);
  assert.notEqual(moved.startPosition, started.startPosition);
  assert.equal(started.currentPosition?.x, 10);
  assert.deepEqual(getEntityDragDelta(moved), { x: 8, y: 6 });

  const activeSnapshot = getEntityDragSnapshot(moved);
  assert.deepEqual(activeSnapshot, {
    phase: "dragging",
    subject: {
      entityId: card.id,
      entityName: "card"
    },
    startPosition: { x: 10, y: 20 },
    currentPosition: { x: 18, y: 26 },
    delta: { x: 8, y: 6 },
    isActive: true
  });
  assert.equal("entity" in activeSnapshot.subject, false);
});

test("entity drag completion and cancellation return clean snapshots and reset state", () => {
  const scene = new Scene("EntityDragFinishScene");
  const token = scene.world.createEntity("token");
  const started = startEntityDrag(createEntityDragState(), token, { x: 4, y: 5 });
  const moved = moveEntityDrag(started, { x: 7, y: 9 });

  const completed = completeEntityDrag(moved, { x: 10, y: 12 });
  assert.deepEqual(completed.state, { phase: "idle" });
  assert.deepEqual(completed.snapshot, {
    phase: "completed",
    subject: {
      entityId: token.id,
      entityName: "token"
    },
    startPosition: { x: 4, y: 5 },
    currentPosition: { x: 10, y: 12 },
    delta: { x: 6, y: 7 },
    isActive: false
  });
  assert.equal(moved.phase, "dragging");
  assert.deepEqual(moved.currentPosition, { x: 7, y: 9 });

  const cancelled = cancelEntityDrag(moved);
  assert.deepEqual(cancelled.state, { phase: "idle" });
  assert.deepEqual(cancelled.snapshot, {
    phase: "cancelled",
    subject: {
      entityId: token.id,
      entityName: "token"
    },
    startPosition: { x: 4, y: 5 },
    currentPosition: { x: 7, y: 9 },
    delta: { x: 3, y: 4 },
    isActive: false
  });
});

test("entity drag state reports invalid transitions and coordinates clearly", () => {
  const scene = new Scene("InvalidEntityDragScene");
  const piece = scene.world.createEntity("piece");
  const idle = createEntityDragState();

  assert.throws(() => moveEntityDrag(idle, { x: 1, y: 1 }), /Cannot move an entity drag before it starts/);
  assert.throws(() => completeEntityDrag(idle), /Cannot complete an entity drag before it starts/);
  assert.throws(() => cancelEntityDrag(idle), /Cannot cancel an entity drag before it starts/);
  assert.throws(
    () => startEntityDrag(idle, piece, { x: Number.NaN, y: 0 }),
    /Entity drag start position x must be a finite number/
  );
  assert.throws(
    () => moveEntityDrag(startEntityDrag(idle, piece, { x: 0, y: 0 }), { x: 1, y: Infinity }),
    /Entity drag current position y must be a finite number/
  );
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

test("tile map layer view creates sprites for non-empty tiles on the world layer", () => {
  const worldChildren = [];
  const renderAdapter = createFakeTextRenderAdapter();
  const renderScene = createFakeTileRenderScene(worldChildren);
  const map = createTileMap({
    id: "arena",
    width: 2,
    height: 2,
    tileWidth: 16,
    tileHeight: 24,
    layers: [
      {
        id: "ground",
        tiles: ["floor", null, "wall", "floor"]
      }
    ]
  });

  const view = createTileMapLayerView({
    tileMap: map,
    layerId: "ground",
    renderAdapter,
    renderScene,
    resolveTileAsset: (tileId, coordinate) => ({
      id: tileId,
      fill: `${tileId}-${coordinate.x}-${coordinate.y}`,
      width: 1,
      height: 1
    })
  });

  assert.deepEqual(worldChildren, [view.container]);
  assert.equal(view.tiles.length, 3);
  assert.deepEqual(
    view.tiles.map((tile) => ({
      tileId: tile.tileId,
      coordinate: tile.coordinate,
      x: tile.node.x,
      y: tile.node.y,
      width: tile.node.width,
      height: tile.node.height,
      asset: tile.node.asset
    })),
    [
      {
        tileId: "floor",
        coordinate: { x: 0, y: 0 },
        x: 0,
        y: 0,
        width: 16,
        height: 24,
        asset: { id: "floor", fill: "floor-0-0", width: 1, height: 1 }
      },
      {
        tileId: "wall",
        coordinate: { x: 0, y: 1 },
        x: 0,
        y: 24,
        width: 16,
        height: 24,
        asset: { id: "wall", fill: "wall-0-1", width: 1, height: 1 }
      },
      {
        tileId: "floor",
        coordinate: { x: 1, y: 1 },
        x: 16,
        y: 24,
        width: 16,
        height: 24,
        asset: { id: "floor", fill: "floor-1-1", width: 1, height: 1 }
      }
    ]
  );
});

test("tile map layer view can target background and fails clearly for missing layers", () => {
  const backgroundChildren = [];
  const renderAdapter = createFakeTextRenderAdapter();
  const renderScene = createFakeTileRenderScene([], backgroundChildren);
  const map = createTileMap({
    id: "arena",
    width: 1,
    height: 1,
    tileWidth: 8,
    tileHeight: 8,
    layers: [{ id: "background", tiles: ["sky"] }]
  });

  const view = createTileMapLayerView({
    tileMap: map,
    layerId: "background",
    renderAdapter,
    renderScene,
    targetLayer: "background"
  });

  assert.deepEqual(backgroundChildren, [view.container]);
  assert.equal(view.tiles[0].node.asset, "sky");
  assert.throws(
    () =>
      createTileMapLayerView({
        tileMap: map,
        layerId: "missing",
        renderAdapter,
        renderScene
      }),
    /Tile map layer "missing" was not found/
  );
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

test("sprite animation system hands source-backed render assets to view nodes", async () => {
  const scene = new Scene("AnimationSourceAssetScene");
  const assets = new AssetRegistry();
  assets.loadManifest({
    sprites: [
      { id: "hero-sprite-1", source: "/assets/hero-1.png", width: 32, height: 32 },
      { id: "hero-sprite-2", source: "/assets/hero-2.png", width: 32, height: 32 }
    ],
    frames: [
      { id: "hero-run-1", spriteId: "hero-sprite-1", width: 32, height: 40, durationSeconds: 0.25 },
      { id: "hero-run-2", spriteId: "hero-sprite-2", width: 36, height: 40, durationSeconds: 0.25 }
    ],
    clips: [{ id: "hero-run", frameIds: ["hero-run-1", "hero-run-2"] }]
  });
  await assets.loadSprite("hero-sprite-2", async () => {});
  const node = createFakeSpriteNode();
  const actor = scene.world.createEntity("hero");
  actor.addComponent(new SpriteAnimationComponent("hero-run"));
  actor.addComponent(new TransformComponent());
  actor.addComponent(new ViewComponent(node));
  scene.addSystem(new SpriteAnimationSystem(scene, assets));
  scene.start();

  scene.update(0.25);
  scene.lateUpdate(0.25);

  assert.deepEqual(node.asset, {
    id: "hero-sprite-2",
    source: "/assets/hero-2.png",
    width: 32,
    height: 32
  });
  assert.equal("type" in node.asset, false);
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

test("actor sprite view helper attaches a sprite view to an entity on the world layer", () => {
  const scene = new Scene("ActorSpriteViewScene");
  const worldChildren = [];
  const renderAdapter = createFakeTextRenderAdapter();
  const renderScene = createFakeTileRenderScene(worldChildren);
  const actor = scene.world.createEntity("Actor");
  actor.addComponent(new TransformComponent());

  const view = attachActorSpriteView(actor, {
    renderAdapter,
    renderScene,
    asset: { id: "actor", fill: "#ffcc00", width: 24, height: 24 }
  });

  assert.deepEqual(worldChildren, [view.node]);
  assert.equal(view.node.asset.id, "actor");
  assert.equal(actor.getComponent(ViewComponent), view.view);
});

test("actor sprite view helper can resolve registered source assets for render handoff", () => {
  const scene = new Scene("ActorSpriteViewAssetRegistryScene");
  const assets = new AssetRegistry();
  assets.registerSprite({
    id: "actor",
    source: "/assets/actor.png",
    width: 24,
    height: 24
  });
  const worldChildren = [];
  const renderAdapter = createFakeTextRenderAdapter();
  const renderScene = createFakeTileRenderScene(worldChildren);
  const actor = scene.world.createEntity("Actor");
  actor.addComponent(new TransformComponent());

  const view = attachActorSpriteView(actor, {
    renderAdapter,
    renderScene,
    assets,
    assetId: "actor"
  });

  assert.deepEqual(worldChildren, [view.node]);
  assert.deepEqual(view.node.asset, {
    id: "actor",
    source: "/assets/actor.png",
    width: 24,
    height: 24
  });
  assert.equal("type" in view.node.asset, false);
});

test("actor sprite view helper can target a custom layer and reports missing layers", () => {
  const scene = new Scene("ActorSpriteViewLayerScene");
  const backgroundChildren = [];
  const renderAdapter = createFakeTextRenderAdapter();
  const renderScene = createFakeTileRenderScene([], backgroundChildren);
  const backgroundActor = scene.world.createEntity("BackgroundActor");
  backgroundActor.addComponent(new TransformComponent());

  const view = attachActorSpriteView(backgroundActor, {
    renderAdapter,
    renderScene,
    asset: "background-actor",
    layer: "background"
  });

  assert.deepEqual(backgroundChildren, [view.node]);
  assert.equal(view.node.asset, "background-actor");

  const missingLayerScene = createFakeRenderScene(800, 600);
  delete missingLayerScene.layers.overlay;
  const overlayActor = scene.world.createEntity("OverlayActor");
  assert.throws(
    () =>
      attachActorSpriteView(overlayActor, {
        renderAdapter,
        renderScene: missingLayerScene,
        layer: "overlay"
      }),
    /Render scene layer "overlay" was not found/
  );
  assert.equal(overlayActor.getComponent(ViewComponent), undefined);
});

test("movement vector limiting keeps arcade directional movement consistent", () => {
  assert.deepEqual(limitMovementVector({ x: 0, y: 0 }), { x: 0, y: 0 });
  assert.deepEqual(limitMovementVector({ x: 1, y: 0 }), { x: 1, y: 0 });
  assert.deepEqual(limitMovementVector({ x: 0.25, y: 0.5 }), { x: 0.25, y: 0.5 });

  const diagonal = limitMovementVector({ x: 1, y: 1 });
  assert.equal(Math.hypot(diagonal.x, diagonal.y), 1);
  assert.equal(diagonal.x, diagonal.y);

  assert.deepEqual(limitMovementVector({ x: 3, y: 4 }), { x: 0.6000000000000001, y: 0.8 });
  assert.deepEqual(limitMovementVector({ x: 3, y: 4 }, 10), { x: 3, y: 4 });
  assert.deepEqual(limitMovementVector({ x: 3, y: 4 }, 2.5), { x: 1.5, y: 2 });
  assert.deepEqual(limitMovementVector({ x: 3, y: 4 }, 0), { x: 0, y: 0 });
  assert.throws(() => limitMovementVector({ x: 1, y: 0 }, -1), /maxLength must be a finite number/);
  assert.throws(() => limitMovementVector({ x: 1, y: 0 }, Number.NaN), /maxLength must be a finite number/);
});

test("movement position clamping respects bounds, size and padding", () => {
  assert.deepEqual(
    clampPositionToBounds(
      { x: -10, y: 120 },
      { width: 100, height: 80 },
      { width: 20, height: 30 }
    ),
    { x: 0, y: 50 }
  );

  assert.deepEqual(
    clampPositionToBounds(
      { x: 75, y: -50 },
      { x: 10, y: 20, width: 100, height: 80, padding: 5 },
      { width: 20, height: 30 }
    ),
    { x: 75, y: 25 }
  );

  assert.deepEqual(
    clampPositionToBounds(
      { x: 999, y: 999 },
      { x: 10, y: 20, width: 100, height: 80, padding: 5 },
      { width: 20, height: 30 }
    ),
    { x: 85, y: 65 }
  );
});

test("movement position clamping anchors oversized actors to the minimum bound", () => {
  assert.deepEqual(
    clampPositionToBounds(
      { x: 80, y: 90 },
      { x: 10, y: 20, width: 30, height: 40, padding: 5 },
      { width: 80, height: 90 }
    ),
    { x: 15, y: 25 }
  );
});

test("movement position clamping reports invalid numeric inputs", () => {
  assert.throws(
    () => clampPositionToBounds({ x: 0, y: 0 }, { width: -1, height: 10 }),
    /bounds.width must be a finite number greater than or equal to 0/
  );
  assert.throws(
    () => clampPositionToBounds({ x: 0, y: 0 }, { width: 10, height: Number.NaN }),
    /bounds.height must be a finite number greater than or equal to 0/
  );
  assert.throws(
    () => clampPositionToBounds({ x: 0, y: 0 }, { width: 10, height: 10, padding: -1 }),
    /bounds.padding must be a finite number greater than or equal to 0/
  );
  assert.throws(
    () => clampPositionToBounds({ x: 0, y: 0 }, { width: 10, height: 10 }, { width: -1 }),
    /size.width must be a finite number greater than or equal to 0/
  );
});

test("random position in bounds uses deterministic random values with size and padding", () => {
  const randomValues = [0.25, 0.75];
  const position = randomPositionInBounds(
    { x: 10, y: 20, width: 100, height: 80, padding: 5 },
    { width: 20, height: 30 },
    () => randomValues.shift()
  );

  assert.deepEqual(position, {
    x: 32.5,
    y: 55
  });
});

test("random position in bounds defaults to origin and anchors oversized actors", () => {
  assert.deepEqual(
    randomPositionInBounds(
      { width: 100, height: 80 },
      { width: 20, height: 30 },
      () => 1
    ),
    { x: 80, y: 50 }
  );

  assert.deepEqual(
    randomPositionInBounds(
      { x: 10, y: 20, width: 30, height: 40, padding: 5 },
      { width: 80, height: 90 },
      () => 0.75
    ),
    { x: 15, y: 25 }
  );
});

test("random position in bounds reports invalid inputs", () => {
  assert.throws(
    () => randomPositionInBounds({ width: -1, height: 10 }),
    /bounds.width must be a finite number greater than or equal to 0/
  );
  assert.throws(
    () => randomPositionInBounds({ width: 10, height: 10 }, { height: -1 }),
    /size.height must be a finite number greater than or equal to 0/
  );
  assert.throws(
    () => randomPositionInBounds({ width: 10, height: 10 }, {}, () => Number.NaN),
    /random\(\) for x must return a finite number between 0 and 1/
  );
  assert.throws(
    () => randomPositionInBounds({ width: 10, height: 10 }, {}, () => 1.1),
    /random\(\) for x must return a finite number between 0 and 1/
  );
});

test("hud text helper creates screen-space text on the ui layer by default", () => {
  const uiChildren = [];
  const overlayChildren = [];
  const renderAdapter = createFakeTextRenderAdapter();
  const renderScene = createFakeLayeredRenderScene(uiChildren, overlayChildren);

  const node = createHudText(renderAdapter, renderScene, {
    text: "Score 0",
    x: 24,
    y: 32,
    fontSize: 18
  });

  assert.equal(node.text, "Score 0");
  assert.equal(node.x, 24);
  assert.equal(node.y, 32);
  assert.equal(node.fontSize, 18);
  assert.equal(node.visible, true);
  assert.deepEqual(uiChildren, [node]);
  assert.deepEqual(overlayChildren, []);

  node.setText("Score 100");
  assert.equal(node.text, "Score 100");
});

test("hud text helper can target the overlay layer and initial visibility", () => {
  const uiChildren = [];
  const overlayChildren = [];
  const renderAdapter = createFakeTextRenderAdapter();
  const renderScene = createFakeLayeredRenderScene(uiChildren, overlayChildren);

  const node = createHudText(renderAdapter, renderScene, {
    text: "Paused",
    x: 120,
    y: 80,
    visible: false,
    layer: "overlay"
  });

  assert.equal(node.text, "Paused");
  assert.equal(node.x, 120);
  assert.equal(node.y, 80);
  assert.equal(node.fontSize, undefined);
  assert.equal(node.visible, false);
  assert.deepEqual(uiChildren, []);
  assert.deepEqual(overlayChildren, [node]);
});

test("dialogue prompt view creates screen-space line and choice text nodes", () => {
  const uiChildren = [];
  const overlayChildren = [];
  const renderAdapter = createFakeTextRenderAdapter();
  const renderScene = createFakeLayeredRenderScene(uiChildren, overlayChildren);
  const prompt = defineDialoguePrompt({
    line: {
      id: "start",
      speaker: "Guide",
      text: "Choose a route."
    },
    choices: [
      {
        id: "forest",
        label: "Forest"
      },
      {
        id: "town",
        label: "Town"
      }
    ]
  });

  const view = createDialoguePromptView(renderAdapter, renderScene, {
    prompt,
    x: 24,
    y: 40,
    choiceStartY: 96,
    choiceGap: 30,
    lineFontSize: 20,
    choiceFontSize: 16,
    layer: "overlay"
  });

  assert.equal(view.line.text, "Guide: Choose a route.");
  assert.equal(view.line.x, 24);
  assert.equal(view.line.y, 40);
  assert.equal(view.line.fontSize, 20);
  assert.equal(view.choices.length, 2);
  assert.equal(view.choices[0].text, "Forest");
  assert.equal(view.choices[0].x, 24);
  assert.equal(view.choices[0].y, 96);
  assert.equal(view.choices[0].fontSize, 16);
  assert.equal(view.choices[1].text, "Town");
  assert.equal(view.choices[1].y, 126);
  assert.deepEqual(uiChildren, []);
  assert.deepEqual(overlayChildren, [view.line, ...view.choices]);

  const snapshot = view.getPromptSnapshot();
  assert.deepEqual(snapshot, prompt);
  assert.notEqual(snapshot, prompt);
  assert.notEqual(snapshot.choices, prompt.choices);
});

test("dialogue prompt view updates prompt text and visibility deterministically", () => {
  const uiChildren = [];
  const overlayChildren = [];
  const renderAdapter = createFakeTextRenderAdapter();
  const renderScene = createFakeLayeredRenderScene(uiChildren, overlayChildren);
  const view = createDialoguePromptView(renderAdapter, renderScene, {
    prompt: defineDialoguePrompt({
      line: {
        id: "start",
        text: "Choose a route."
      },
      choices: [
        {
          id: "forest",
          label: "Forest"
        }
      ]
    }),
    x: 10,
    y: 20,
    choiceStartY: 50
  });

  view.setPrompt(
    defineDialoguePrompt({
      line: {
        id: "next",
        speaker: "Guide",
        text: "Pick again."
      },
      choices: [
        {
          id: "left",
          label: "Left"
        },
        {
          id: "right",
          label: "Right"
        }
      ]
    })
  );

  assert.equal(view.line.text, "Guide: Pick again.");
  assert.equal(view.choices.length, 2);
  assert.equal(view.choices[0].text, "Left");
  assert.equal(view.choices[0].y, 50);
  assert.equal(view.choices[1].text, "Right");
  assert.equal(view.choices[1].y, 78);
  assert.deepEqual(uiChildren, [view.line, ...view.choices]);
  assert.deepEqual(overlayChildren, []);

  view.setVisible(false);
  assert.equal(view.line.visible, false);
  assert.equal(view.choices[0].visible, false);
  assert.equal(view.choices[1].visible, false);

  view.setVisible(true);
  assert.equal(view.line.visible, true);
  assert.equal(view.choices[0].visible, true);
  assert.equal(view.choices[1].visible, true);
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

test("camera system exposes copied viewport state and visible world bounds", () => {
  const scene = new Scene("CameraViewportScene");
  const renderScene = createFakeRenderScene(800, 600);
  const camera = new CameraSystem(scene, renderScene);

  scene.addSystem(camera);
  scene.start();

  camera.moveTo(100, 50);
  camera.setZoom(2);

  const state = camera.getViewportState();

  assert.deepEqual(state, {
    x: 100,
    y: 50,
    zoom: 2,
    viewportWidth: 800,
    viewportHeight: 600,
    worldLayerX: 200,
    worldLayerY: 200,
    visibleWorldBounds: {
      x: -100,
      y: -100,
      width: 400,
      height: 300,
      minX: -100,
      minY: -100,
      maxX: 300,
      maxY: 200
    }
  });

  state.visibleWorldBounds.x = 999;
  assert.equal(camera.getViewportState().visibleWorldBounds.x, -100);
});

test("camera system converts between world and viewport coordinates", () => {
  const scene = new Scene("CameraCoordinateScene");
  const renderScene = createFakeRenderScene(800, 600);
  const camera = new CameraSystem(scene, renderScene);

  camera.moveTo(100, 50);
  camera.setZoom(2);

  assert.deepEqual(camera.worldToViewport({ x: 100, y: 50 }), { x: 400, y: 300 });
  assert.deepEqual(camera.worldToViewport({ x: 120, y: 80 }), { x: 440, y: 360 });
  assert.deepEqual(camera.viewportToWorld({ x: 400, y: 300 }), { x: 100, y: 50 });
  assert.deepEqual(camera.viewportToWorld({ x: 440, y: 360 }), { x: 120, y: 80 });
});

test("camera system coordinate conversion stays aligned with render layer mapping", () => {
  const scene = new Scene("CameraCoordinateRenderScene");
  const renderScene = createFakeRenderScene(960, 540);
  const camera = new CameraSystem(scene, renderScene);

  scene.addSystem(camera);
  scene.start();
  camera.moveTo(240, 120);
  camera.setZoom(1.5);
  scene.lateUpdate(1 / 60);

  const point = { x: 300, y: 180 };
  const viewportPoint = camera.worldToViewport(point);
  const worldPoint = camera.viewportToWorld(viewportPoint);

  assert.deepEqual(viewportPoint, {
    x: point.x * renderScene.layers.world.scaleX + renderScene.layers.world.x,
    y: point.y * renderScene.layers.world.scaleY + renderScene.layers.world.y
  });
  assert.deepEqual(worldPoint, point);
});

test("camera system clamps manual movement to active bounds", () => {
  const scene = new Scene("CameraBoundsScene");
  const renderScene = createFakeRenderScene(400, 300);
  const camera = new CameraSystem(scene, renderScene);

  camera.setBounds({ x: 0, y: 0, width: 1000, height: 800 });
  camera.moveTo(-100, -100);

  assert.equal(camera.x, 200);
  assert.equal(camera.y, 150);

  camera.moveTo(900, 700);

  assert.equal(camera.x, 800);
  assert.equal(camera.y, 650);
  assert.deepEqual(camera.getViewportState().visibleWorldBounds, {
    x: 600,
    y: 500,
    width: 400,
    height: 300,
    minX: 600,
    minY: 500,
    maxX: 1000,
    maxY: 800
  });
});

test("camera system returns copied bounds and can clear bounds", () => {
  const scene = new Scene("CameraBoundsCopyScene");
  const renderScene = createFakeRenderScene(400, 300);
  const camera = new CameraSystem(scene, renderScene);

  camera.setBounds({ x: 10, y: 20, width: 500, height: 400 });
  const bounds = camera.getBounds();
  assert.deepEqual(bounds, { x: 10, y: 20, width: 500, height: 400 });

  if (bounds) {
    bounds.x = 999;
  }
  assert.deepEqual(camera.getBounds(), { x: 10, y: 20, width: 500, height: 400 });

  camera.clearBounds();
  camera.moveTo(-100, -100);

  assert.equal(camera.getBounds(), undefined);
  assert.equal(camera.x, -100);
  assert.equal(camera.y, -100);
});

test("camera system clamps follow targets to active bounds", () => {
  const scene = new Scene("CameraFollowBoundsScene");
  const renderScene = createFakeRenderScene(400, 300);
  const camera = new CameraSystem(scene, renderScene);
  const player = scene.world.createEntity("player");
  const transform = player.addComponent(new TransformComponent());

  scene.addSystem(camera);
  scene.start();
  camera.setBounds({ x: 0, y: 0, width: 1000, height: 800 });
  camera.follow(player);

  transform.x = 50;
  transform.y = 50;
  scene.lateUpdate(1 / 60);

  assert.equal(camera.x, 200);
  assert.equal(camera.y, 150);

  transform.x = 980;
  transform.y = 780;
  scene.lateUpdate(1 / 60);

  assert.equal(camera.x, 800);
  assert.equal(camera.y, 650);
});

test("camera system reclamps bounds when zoom changes", () => {
  const scene = new Scene("CameraZoomBoundsScene");
  const renderScene = createFakeRenderScene(400, 300);
  const camera = new CameraSystem(scene, renderScene);

  camera.setBounds({ x: 0, y: 0, width: 1000, height: 800 });
  camera.moveTo(900, 700);

  assert.equal(camera.x, 800);
  assert.equal(camera.y, 650);

  camera.setZoom(0.5);

  assert.equal(camera.x, 600);
  assert.equal(camera.y, 500);
  assert.deepEqual(camera.getViewportState().visibleWorldBounds, {
    x: 200,
    y: 200,
    width: 800,
    height: 600,
    minX: 200,
    minY: 200,
    maxX: 1000,
    maxY: 800
  });
});

test("camera system centers on bounds when viewport is larger than bounds", () => {
  const scene = new Scene("CameraSmallBoundsScene");
  const renderScene = createFakeRenderScene(800, 600);
  const camera = new CameraSystem(scene, renderScene);

  camera.setBounds({ x: 100, y: 200, width: 300, height: 100 });
  camera.moveTo(1000, -1000);

  assert.equal(camera.x, 250);
  assert.equal(camera.y, 250);
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

function createFakeLayeredRenderScene(uiChildren, overlayChildren) {
  return {
    ...createFakeRenderScene(800, 600),
    layers: {
      background: createFakeContainer(),
      world: createFakeContainer(),
      ui: createFakeChildCollector(uiChildren),
      overlay: createFakeChildCollector(overlayChildren)
    }
  };
}

function createFakeTileRenderScene(worldChildren, backgroundChildren = []) {
  return {
    ...createFakeRenderScene(800, 600),
    layers: {
      background: createFakeChildCollector(backgroundChildren),
      world: createFakeChildCollector(worldChildren),
      ui: createFakeContainer(),
      overlay: createFakeContainer()
    }
  };
}

function createFakeTextRenderAdapter() {
  return {
    createScene() {
      return createFakeRenderScene(800, 600);
    },
    createContainer() {
      return createFakeContainer();
    },
    createSprite() {
      return createFakeSpriteNode();
    },
    createText(text = "") {
      return {
        ...createFakeContainer(),
        text,
        fontSize: undefined,
        setText(value) {
          this.text = value;
        }
      };
    }
  };
}

function createFakeChildCollector(children) {
  return {
    ...createFakeContainer(),
    addChild(node) {
      children.push(node);
    }
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
