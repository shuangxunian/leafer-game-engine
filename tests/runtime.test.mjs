import test from "node:test";
import assert from "node:assert/strict";

import { Game, Scene } from "../lib/core/index.js";
import { createAnimationFrameLoop } from "../lib/runtime/frame-loop.js";
import { createRuntimeController } from "../lib/runtime/runtime-controller.js";
import { startSceneWithLifecycle } from "../lib/runtime/scene-lifecycle.js";

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
