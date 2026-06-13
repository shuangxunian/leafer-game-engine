import test from "node:test";
import assert from "node:assert/strict";

import { Component, Entity, Game, Scene, System } from "../lib/core/index.js";

class CountingSystem extends System {
  constructor(scene) {
    super(scene);
    this.startCount = 0;
    this.updateCount = 0;
    this.fixedUpdateCount = 0;
    this.lateUpdateCount = 0;
    this.destroyCount = 0;
  }

  start() {
    this.startCount += 1;
  }

  update() {
    this.updateCount += 1;
  }

  fixedUpdate() {
    this.fixedUpdateCount += 1;
  }

  lateUpdate() {
    this.lateUpdateCount += 1;
  }

  destroy() {
    this.destroyCount += 1;
  }
}

class LoggingComponent extends Component {
  constructor(log, label, onUpdate) {
    super();
    this.log = log;
    this.label = label;
    this.onUpdate = onUpdate;
  }

  update() {
    this.log.push(this.label);
    this.onUpdate?.(this.entity);
  }
}

class LifecycleScene extends Scene {
  constructor() {
    super("LifecycleScene");
    this.system = undefined;
  }

  onStart() {
    this.system = this.addSystem(new CountingSystem(this));
  }
}

test("scene starts systems added during onStart only once", () => {
  const scene = new LifecycleScene();

  scene.start();

  assert.equal(scene.system.startCount, 1);
  assert.equal(scene.system.started, true);
});

test("scene initializes systems added after start immediately and only once", () => {
  const scene = new Scene("DynamicSystemScene");
  const system = new CountingSystem(scene);

  scene.start();
  scene.addSystem(system);
  scene.addSystem(system);

  assert.equal(system.startCount, 1);
  assert.equal(scene.systems.length, 1);
});

test("game tick runs update, fixedUpdate and lateUpdate in expected order", () => {
  const game = new Game(0.02);
  const scene = new Scene("TickScene");
  const system = scene.addSystem(new CountingSystem(scene));

  game.setScene(scene);
  game.tick(0.05);

  assert.equal(system.updateCount, 1);
  assert.equal(system.fixedUpdateCount, 2);
  assert.equal(system.lateUpdateCount, 1);
});

test("world defers entity add and remove mutations until phase boundaries", () => {
  class MutationScene extends Scene {
    constructor() {
      super("MutationScene");
      this.log = [];
      this.player = this.world.createEntity("player");
      this.player.addComponent(
        new LoggingComponent(this.log, "player", (entity) => {
          if (this.spawned) return;

          this.spawned = true;
          const spawned = this.world.createEntity("spawned");
          spawned.addComponent(new LoggingComponent(this.log, "spawned"));
          this.world.destroyEntity(entity);
        })
      );
      this.spawned = false;
    }
  }

  const scene = new MutationScene();
  scene.start();

  scene.update(1 / 60);
  assert.deepEqual(scene.log, ["player"]);
  assert.equal(scene.world.entities.some((entity) => entity.name === "player"), false);
  assert.equal(scene.world.entities.some((entity) => entity.name === "spawned"), true);

  scene.update(1 / 60);
  assert.deepEqual(scene.log, ["player", "spawned"]);
});

test("entity deactivates immediately when destroy is requested mid-update", () => {
  class DestroyMidUpdateScene extends Scene {
    constructor() {
      super("DestroyMidUpdateScene");
      this.log = [];
      const entity = this.world.createEntity("victim");
      entity.addComponent(
        new LoggingComponent(this.log, "first", (currentEntity) => {
          this.world.destroyEntity(currentEntity);
        })
      );
      entity.addComponent(new LoggingComponent(this.log, "second"));
    }
  }

  const scene = new DestroyMidUpdateScene();
  scene.start();
  scene.update(1 / 60);

  assert.deepEqual(scene.log, ["first"]);
  assert.equal(scene.world.entities.length, 0);
});

test("replacing a scene destroys the previous scene once", () => {
  class DestroyTrackingScene extends Scene {
    constructor(name) {
      super(name);
      this.destroyCalls = 0;
    }

    destroy() {
      this.destroyCalls += 1;
      super.destroy();
    }
  }

  const game = new Game();
  const first = new DestroyTrackingScene("first");
  const second = new DestroyTrackingScene("second");

  game.setScene(first);
  game.setScene(second);

  assert.equal(first.destroyCalls, 1);
  assert.equal(second.destroyCalls, 0);
});

test("destroyed scenes cannot be started again", () => {
  const scene = new Scene("DestroyedScene");

  scene.start();
  scene.destroy();

  assert.throws(() => scene.start(), /Cannot start destroyed scene/);
});
