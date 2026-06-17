import test from "node:test";
import assert from "node:assert/strict";

import { Scene } from "../lib/core/index.js";
import { ColliderComponent, CollisionSystem, SizeComponent, TransformComponent } from "../lib/framework/index.js";

test("collision system exposes enter, stay and exit semantics", () => {
  const scene = new Scene("CollisionScene");
  const collisions = scene.addSystem(new CollisionSystem(scene));

  const player = scene.world.createEntity("player");
  const playerTransform = player.addComponent(new TransformComponent());
  player.addComponent(new SizeComponent(10, 10));
  player.addComponent(new ColliderComponent("player"));

  const hazard = scene.world.createEntity("hazard");
  const hazardTransform = hazard.addComponent(new TransformComponent());
  hazard.addComponent(new SizeComponent(10, 10));
  hazard.addComponent(new ColliderComponent("hazard"));

  scene.start();

  playerTransform.x = 0;
  playerTransform.y = 0;
  hazardTransform.x = 100;
  hazardTransform.y = 100;
  scene.lateUpdate(1 / 60);
  assert.equal(collisions.hasCollision(player), false);

  hazardTransform.x = 0;
  hazardTransform.y = 0;
  scene.lateUpdate(1 / 60);
  assert.equal(collisions.hasCollisionEnter(player, "hazard"), true);
  assert.deepEqual(collisions.getCollisionEnter(player, "hazard").map((entity) => entity.name), ["hazard"]);
  assert.equal(collisions.hasCollisionStay(player, "hazard"), false);

  scene.lateUpdate(1 / 60);
  assert.equal(collisions.hasCollisionEnter(player, "hazard"), false);
  assert.equal(collisions.hasCollisionStay(player, "hazard"), true);
  assert.deepEqual(collisions.getCollisionStay(player, "hazard").map((entity) => entity.name), ["hazard"]);

  hazardTransform.x = 100;
  hazardTransform.y = 100;
  scene.lateUpdate(1 / 60);
  assert.equal(collisions.hasCollision(player, "hazard"), false);
  assert.equal(collisions.hasCollisionExit(player, "hazard"), true);
  assert.deepEqual(collisions.getCollisionExit(player, "hazard").map((entity) => entity.name), ["hazard"]);
});

test("collision enter/stay/exit keep layer filtering", () => {
  const scene = new Scene("CollisionLayerScene");
  const collisions = scene.addSystem(new CollisionSystem(scene));

  const player = scene.world.createEntity("player");
  const playerTransform = player.addComponent(new TransformComponent());
  player.addComponent(new SizeComponent(10, 10));
  player.addComponent(new ColliderComponent("player"));

  const hazard = scene.world.createEntity("hazard");
  const hazardTransform = hazard.addComponent(new TransformComponent());
  hazard.addComponent(new SizeComponent(10, 10));
  hazard.addComponent(new ColliderComponent("hazard"));

  scene.start();

  playerTransform.x = 0;
  playerTransform.y = 0;
  hazardTransform.x = 0;
  hazardTransform.y = 0;
  scene.lateUpdate(1 / 60);

  assert.equal(collisions.hasCollisionEnter(player, "hazard"), true);
  assert.equal(collisions.hasCollisionEnter(player, "pickup"), false);
  assert.deepEqual(collisions.getCollisionEnter(player, "pickup"), []);
});

test("collision system exposes copied pair snapshots for current, enter, stay and exit", () => {
  const scene = new Scene("CollisionPairScene");
  const collisions = scene.addSystem(new CollisionSystem(scene));

  const player = scene.world.createEntity("player");
  const playerTransform = player.addComponent(new TransformComponent());
  player.addComponent(new SizeComponent(10, 10));
  player.addComponent(new ColliderComponent("player", undefined, undefined, 1, 2));

  const hazard = scene.world.createEntity("hazard");
  const hazardTransform = hazard.addComponent(new TransformComponent());
  hazard.addComponent(new SizeComponent(8, 6));
  hazard.addComponent(new ColliderComponent("hazard", undefined, undefined, 3, 4));

  scene.start();

  playerTransform.x = 0;
  playerTransform.y = 0;
  hazardTransform.x = 5;
  hazardTransform.y = 4;
  scene.lateUpdate(1 / 60);

  const enterPairs = collisions.getCollisionEnterPairs();
  assert.equal(enterPairs.length, 1);
  assert.equal(enterPairs[0].a.entity, player);
  assert.equal(enterPairs[0].a.entityId, player.id);
  assert.equal(enterPairs[0].a.entityName, "player");
  assert.equal(enterPairs[0].a.layer, "player");
  assert.deepEqual(enterPairs[0].a.rect, { x: 1, y: 2, width: 10, height: 10 });
  assert.equal(enterPairs[0].b.entity, hazard);
  assert.equal(enterPairs[0].b.entityId, hazard.id);
  assert.equal(enterPairs[0].b.entityName, "hazard");
  assert.equal(enterPairs[0].b.layer, "hazard");
  assert.deepEqual(enterPairs[0].b.rect, { x: 8, y: 8, width: 8, height: 6 });
  assert.deepEqual(collisions.getCollisionPairs("hazard").map((pair) => pair.b.entityName), ["hazard"]);
  assert.deepEqual(collisions.getCollisionPairs("pickup"), []);

  enterPairs[0].a.rect.x = 999;
  assert.equal(collisions.getCollisionEnterPairs()[0].a.rect.x, 1);

  scene.lateUpdate(1 / 60);
  assert.deepEqual(collisions.getCollisionEnterPairs(), []);
  assert.deepEqual(collisions.getCollisionStayPairs().map((pair) => `${pair.a.entityName}->${pair.b.entityName}`), [
    "player->hazard"
  ]);

  hazardTransform.x = 100;
  hazardTransform.y = 100;
  scene.lateUpdate(1 / 60);
  assert.deepEqual(collisions.getCollisionPairs(), []);
  const exitPairs = collisions.getCollisionExitPairs("player");
  assert.equal(exitPairs.length, 1);
  assert.deepEqual(exitPairs[0].a.rect, { x: 1, y: 2, width: 10, height: 10 });
  assert.deepEqual(exitPairs[0].b.rect, { x: 8, y: 8, width: 8, height: 6 });
});
