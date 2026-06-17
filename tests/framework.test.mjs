import test from "node:test";
import assert from "node:assert/strict";

import { Scene } from "../lib/core/index.js";
import {
  CameraSystem,
  GameFlow,
  StateMachine,
  TransformComponent,
  defineSpriteAnimationClip,
  defineSpriteFrame
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
