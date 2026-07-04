import test from "node:test";
import assert from "node:assert/strict";

import { Game, Scene } from "../lib/core/index.js";
import { createAudioRuntimeState, drainAudioRuntimeOperations } from "../lib/framework/index.js";
import { BrowserAudioPlaybackAdapter } from "../lib/runtime/browser-audio.js";
import { createBrowserResizeBridge } from "../lib/runtime/browser-resize.js";
import { createAnimationFrameLoop } from "../lib/runtime/frame-loop.js";
import { createRuntimeController } from "../lib/runtime/runtime-controller.js";
import { startSceneWithLifecycle } from "../lib/runtime/scene-lifecycle.js";

function createFakeAudioFactory() {
  const elements = [];

  return {
    elements,
    createElement(source) {
      const element = {
        src: source,
        currentTime: 0,
        volume: 1,
        muted: false,
        loop: false,
        playCount: 0,
        pauseCount: 0,
        play() {
          this.playCount += 1;
        },
        pause() {
          this.pauseCount += 1;
        }
      };
      elements.push(element);
      return element;
    }
  };
}

function createFakeResizeScene(initialWidth = 960, initialHeight = 640) {
  let width = initialWidth;
  let height = initialHeight;
  const resizeCalls = [];

  return {
    resizeCalls,
    scene: {
      get width() {
        return width;
      },
      get height() {
        return height;
      },
      resize(nextWidth, nextHeight) {
        width = nextWidth;
        height = nextHeight;
        const viewport = { width, height };
        resizeCalls.push(viewport);
        return { ...viewport };
      }
    }
  };
}

test("animation frame loop only schedules one callback and can restart after stop", () => {
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
  const callbacks = new Map();
  const cancelled = [];
  let nextFrameId = 1;
  const frameTimes = [];

  globalThis.requestAnimationFrame = (callback) => {
    const id = nextFrameId++;
    callbacks.set(id, callback);
    return id;
  };

  globalThis.cancelAnimationFrame = (id) => {
    cancelled.push(id);
    callbacks.delete(id);
  };

  try {
    const loop = createAnimationFrameLoop((now, deltaMilliseconds) => {
      frameTimes.push({ now, deltaMilliseconds });
    });

    loop.start();
    assert.equal(callbacks.size, 1);

    loop.start();
    assert.equal(callbacks.size, 1);

    const [firstFrameId, firstFrame] = callbacks.entries().next().value;
    callbacks.delete(firstFrameId);
    firstFrame(16);
    assert.equal(callbacks.size, 1);
    assert.equal(frameTimes.length, 1);

    loop.stop();
    assert.equal(callbacks.size, 0);
    assert.equal(cancelled.length, 1);

    loop.start();
    assert.equal(callbacks.size, 1);
  } finally {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  }
});

test("runtime controller stop only owns the frame loop, not scene cleanup", () => {
  class OwnedScene extends Scene {
    constructor() {
      super("OwnedScene");
      this.destroyCount = 0;
    }

    destroy() {
      this.destroyCount += 1;
      super.destroy();
    }
  }

  const game = new Game();
  const scene = new OwnedScene();
  const calls = [];
  const loop = {
    running: false,
    reset() {
      calls.push("reset");
    },
    start() {
      this.running = true;
      calls.push("start");
    },
    stop() {
      this.running = false;
      calls.push("stop");
    }
  };
  const controller = createRuntimeController({ game, loop });

  controller.start(scene);

  assert.equal(scene.started, true);
  assert.equal(loop.running, true);
  assert.equal(game.activeScene, scene);
  assert.deepEqual(calls, ["reset", "start"]);

  controller.stop();

  assert.equal(loop.running, false);
  assert.equal(scene.started, true);
  assert.equal(scene.destroyCount, 0);
  assert.equal(game.activeScene, scene);
  assert.deepEqual(calls, ["reset", "start", "stop"]);
});

test("browser resize bridge observes target size and detaches cleanly", () => {
  const { scene, resizeCalls } = createFakeResizeScene();
  const target = { clientWidth: 320, clientHeight: 240 };
  let callback;
  const observer = {
    observed: [],
    disconnectCount: 0,
    observe(nextTarget) {
      this.observed.push(nextTarget);
    },
    disconnect() {
      this.disconnectCount += 1;
    }
  };
  const bridge = createBrowserResizeBridge({
    renderScene: scene,
    target,
    observerFactory(nextCallback) {
      callback = nextCallback;
      return observer;
    }
  });

  assert.deepEqual(bridge.attach(), { width: 320, height: 240 });
  assert.deepEqual(bridge.attach(), { width: 320, height: 240 });
  assert.deepEqual(observer.observed, [target]);
  assert.deepEqual(resizeCalls, [{ width: 320, height: 240 }]);

  callback([{ contentRect: { width: 375, height: 667 } }]);
  assert.deepEqual(resizeCalls.at(-1), { width: 375, height: 667 });
  assert.equal(scene.width, 375);
  assert.equal(scene.height, 667);

  target.clientWidth = 414;
  target.clientHeight = 736;
  assert.deepEqual(bridge.sync(), { width: 414, height: 736 });

  bridge.detach();
  bridge.detach();
  assert.equal(observer.disconnectCount, 1);
});

test("browser audio playback adapter plays and stops fake media elements", async () => {
  const audio = createAudioRuntimeState({
    assets: [{ id: "hit", source: "/audio/hit.ogg" }],
    channels: [{ id: "sfx", volume: 0.5 }],
    cues: [{ id: "hit:play", assetId: "hit", channelId: "sfx", volume: 0.8 }]
  });
  const fakeAudio = createFakeAudioFactory();
  const adapter = new BrowserAudioPlaybackAdapter({
    audio,
    createElement: fakeAudio.createElement
  });

  audio.playCue("hit:play", { loop: true });
  audio.stopCue("hit:play");

  assert.deepEqual(await drainAudioRuntimeOperations(audio, adapter), [
    { sequence: 1, type: "play", status: "ok" },
    { sequence: 2, type: "stop", status: "ok" }
  ]);
  assert.equal(fakeAudio.elements.length, 1);
  assert.equal(fakeAudio.elements[0].src, "/audio/hit.ogg");
  assert.equal(fakeAudio.elements[0].loop, true);
  assert.equal(fakeAudio.elements[0].volume, 0.4);
  assert.equal(fakeAudio.elements[0].playCount, 1);
  assert.equal(fakeAudio.elements[0].pauseCount, 1);
  assert.equal(fakeAudio.elements[0].currentTime, 0);
  assert.deepEqual(adapter.listActiveInstances(), []);
});

test("browser audio playback adapter handles pause, resume, volume and mute by channel", async () => {
  const audio = createAudioRuntimeState({
    assets: [
      { id: "theme", source: "/audio/theme.ogg" },
      { id: "hit", source: "/audio/hit.ogg" }
    ],
    channels: [
      { id: "music", volume: 1 },
      { id: "sfx", volume: 1 }
    ],
    cues: [
      { id: "theme:start", assetId: "theme", channelId: "music", volume: 0.75 },
      { id: "hit:play", assetId: "hit", channelId: "sfx", volume: 0.5 }
    ]
  });
  const fakeAudio = createFakeAudioFactory();
  const adapter = new BrowserAudioPlaybackAdapter({
    audio,
    createElement: fakeAudio.createElement
  });

  audio.playCue("theme:start");
  audio.playCue("hit:play");
  audio.pauseChannel("music");
  audio.resumeChannel("music");
  audio.setChannelVolume("music", 0.25);
  audio.setChannelMuted("music", true);

  assert.deepEqual(await drainAudioRuntimeOperations(audio, adapter), [
    { sequence: 1, type: "play", status: "ok" },
    { sequence: 2, type: "play", status: "ok" },
    { sequence: 3, type: "pause", status: "ok" },
    { sequence: 4, type: "resume", status: "ok" },
    { sequence: 5, type: "set-volume", status: "ok" },
    { sequence: 6, type: "set-muted", status: "ok" }
  ]);

  const [music, sfx] = fakeAudio.elements;
  assert.equal(music.pauseCount, 1);
  assert.equal(music.playCount, 2);
  assert.equal(music.volume, 0.1875);
  assert.equal(music.muted, true);
  assert.equal(sfx.playCount, 1);
  assert.equal(sfx.pauseCount, 0);
  assert.equal(sfx.volume, 0.5);
  assert.equal(sfx.muted, false);
  assert.deepEqual(adapter.listActiveInstances().map((operation) => operation.sequence), [1, 2]);
});

test("browser audio playback adapter reports missing asset and source failures", async () => {
  const audio = createAudioRuntimeState({
    assets: [
      { id: "silent" },
      { id: "hit", source: "/audio/hit.ogg" }
    ],
    cues: [
      { id: "silent:play", assetId: "silent" },
      { id: "hit:play", assetId: "hit" }
    ]
  });
  const fakeAudio = createFakeAudioFactory();
  const adapter = new BrowserAudioPlaybackAdapter({
    audio,
    createElement: fakeAudio.createElement
  });

  audio.playCue("silent:play");
  assert.deepEqual(await drainAudioRuntimeOperations(audio, adapter, { clearOperations: false }), [
    {
      sequence: 1,
      type: "play",
      status: "error",
      error: 'Audio playback asset "silent" does not define a source.'
    }
  ]);

  assert.deepEqual(
    await drainAudioRuntimeOperations(audio, adapter, { clearOperations: false }),
    [
      {
        sequence: 1,
        type: "play",
        status: "error",
        error: 'Audio playback asset "silent" does not define a source.'
      }
    ]
  );

  assert.throws(
    () => adapter.play({ sequence: 99, type: "play", assetId: "missing" }),
    /Audio playback asset "missing" is not registered/
  );
});

test("scene lifecycle helper prepares and starts a scene in order", async () => {
  const scene = new Scene("PreparedScene");
  const transitions = [];
  const calls = [];

  const result = await startSceneWithLifecycle({
    scene,
    prepare: async (preparedScene) => {
      calls.push(`prepare:${preparedScene.name}`);
      return { assetsLoaded: true };
    },
    start: (startedScene) => {
      calls.push(`start:${startedScene.name}`);
      startedScene.start();
    },
    onTransition: ({ from, to }) => transitions.push(`${from}->${to}`)
  });

  assert.deepEqual(result, {
    ok: true,
    phase: "running",
    scene,
    prepareResult: { assetsLoaded: true }
  });
  assert.equal(scene.started, true);
  assert.deepEqual(calls, ["prepare:PreparedScene", "start:PreparedScene"]);
  assert.deepEqual(transitions, ["idle->loading", "loading->ready", "ready->running"]);
});

test("scene lifecycle helper can start without prepare", async () => {
  const scene = new Scene("NoPrepareScene");
  const transitions = [];

  const result = await startSceneWithLifecycle({
    scene,
    start: (startedScene) => startedScene.start(),
    onTransition: ({ from, to }) => transitions.push(`${from}->${to}`)
  });

  assert.equal(result.ok, true);
  assert.equal(result.prepareResult, undefined);
  assert.equal(scene.started, true);
  assert.deepEqual(transitions, ["idle->loading", "loading->ready", "ready->running"]);
});

test("scene lifecycle helper reports prepare failures without starting", async () => {
  const scene = new Scene("PrepareFailureScene");
  const error = new Error("Asset preload failed");
  const transitions = [];
  let started = false;

  const result = await startSceneWithLifecycle({
    scene,
    prepare: async () => {
      throw error;
    },
    start: () => {
      started = true;
    },
    onTransition: ({ from, to }) => transitions.push(`${from}->${to}`)
  });

  assert.deepEqual(result, {
    ok: false,
    phase: "failed",
    scene,
    error
  });
  assert.equal(started, false);
  assert.equal(scene.started, false);
  assert.deepEqual(transitions, ["idle->loading", "loading->failed"]);
});

test("scene lifecycle helper reports start failures after readiness", async () => {
  const scene = new Scene("StartFailureScene");
  const error = new Error("Mount failed");
  const transitions = [];

  const result = await startSceneWithLifecycle({
    scene,
    prepare: () => "ready",
    start: () => {
      throw error;
    },
    onTransition: ({ from, to }) => transitions.push(`${from}->${to}`)
  });

  assert.deepEqual(result, {
    ok: false,
    phase: "failed",
    scene,
    error
  });
  assert.deepEqual(transitions, ["idle->loading", "loading->ready", "ready->failed"]);
});
