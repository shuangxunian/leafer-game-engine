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
