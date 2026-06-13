import test from "node:test";
import assert from "node:assert/strict";

import { createAnimationFrameLoop } from "../lib/runtime/frame-loop.js";

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
