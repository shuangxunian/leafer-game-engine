import test from "node:test";
import assert from "node:assert/strict";

import { Scene } from "../lib/core/index.js";
import {
  AssetRegistry,
  CameraSystem,
  EventBus,
  GameFlow,
  RuntimeScheduler,
  StateMachine,
  SpriteAnimationComponent,
  SpriteAnimationSystem,
  TransformComponent,
  ViewComponent,
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
