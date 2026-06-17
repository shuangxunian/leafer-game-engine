import test from "node:test";
import assert from "node:assert/strict";

import { Scene } from "../lib/core/index.js";
import {
  CameraSystem,
  GameFlow,
  StateMachine,
  TransformComponent,
  advanceSpriteAnimationPlayback,
  createSpriteAnimationPlayback,
  defineSpriteAnimationClip,
  defineSpriteFrame,
  getSpriteAnimationPlaybackFrameId,
  getSpriteAnimationPlaybackFrameIndex,
  pauseSpriteAnimationPlayback,
  resumeSpriteAnimationPlayback,
  stopSpriteAnimationPlayback
} from "../lib/framework/index.js";

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
