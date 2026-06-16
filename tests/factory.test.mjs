import test from "node:test";
import assert from "node:assert/strict";

import { Component, Scene } from "../lib/core/index.js";
import {
  ColliderComponent,
  EntityTemplateRegistry,
  SizeComponent,
  TransformComponent,
  VelocityComponent,
  defineEntityFactory,
  instantiateEntityTemplate
} from "../lib/framework/index.js";

test("entity factory creates entities from shared context", () => {
  const factory = defineEntityFactory(({ scene }, options) => {
    const entity = scene.world.createEntity(options.name);
    const transform = entity.addComponent(new TransformComponent());
    transform.x = options.x;
    transform.y = options.y;
    return entity;
  });

  const scene = new Scene("FactoryScene");
  const entity = factory.create(
    {
      scene,
      renderAdapter: createFakeRenderAdapter(),
      renderScene: createFakeRenderScene()
    },
    {
      name: "Spawned",
      x: 12,
      y: 34
    }
  );

  assert.equal(entity.name, "Spawned");
  assert.equal(entity.getComponent(TransformComponent)?.x, 12);
  assert.equal(entity.getComponent(TransformComponent)?.y, 34);
});

test("entity template instantiates built-in data components", () => {
  const scene = new Scene("TemplateScene");

  const entity = instantiateEntityTemplate(scene, {
    name: "TemplatedPlayer",
    components: [
      {
        type: "transform",
        data: { x: 12, y: 34, rotation: 0.5, scaleX: 2, scaleY: 3 }
      },
      {
        type: "size",
        data: { width: 52, height: 48 }
      },
      {
        type: "collider",
        data: { layer: "player", offsetX: 1, offsetY: 2 }
      },
      {
        type: "velocity",
        data: { vx: 10, vy: -20 }
      }
    ]
  });

  const transform = entity.getComponent(TransformComponent);
  const size = entity.getComponent(SizeComponent);
  const collider = entity.getComponent(ColliderComponent);
  const velocity = entity.getComponent(VelocityComponent);

  assert.equal(entity.name, "TemplatedPlayer");
  assert.equal(transform?.x, 12);
  assert.equal(transform?.y, 34);
  assert.equal(transform?.rotation, 0.5);
  assert.equal(transform?.scaleX, 2);
  assert.equal(transform?.scaleY, 3);
  assert.equal(size?.width, 52);
  assert.equal(size?.height, 48);
  assert.equal(collider?.layer, "player");
  assert.deepEqual(collider?.getRect(), { x: 13, y: 36, width: 52, height: 48 });
  assert.equal(velocity?.vx, 10);
  assert.equal(velocity?.vy, -20);
});

test("entity template supports custom component registry entries", () => {
  class TagComponent extends Component {
    constructor(tag) {
      super();
      this.tag = tag;
    }
  }

  const scene = new Scene("CustomTemplateScene");
  const registry = new EntityTemplateRegistry().register("tag", (data) => {
    if (!data || typeof data !== "object" || !("tag" in data) || typeof data.tag !== "string") {
      throw new Error("Invalid tag component data.");
    }

    return new TagComponent(data.tag);
  });

  const entity = instantiateEntityTemplate(
    scene,
    {
      name: "Tagged",
      components: [{ type: "tag", data: { tag: "enemy" } }]
    },
    { registry }
  );

  assert.equal(entity.getComponent(TagComponent)?.tag, "enemy");
});

test("entity template fails clearly for unknown component types", () => {
  const scene = new Scene("UnknownTemplateScene");

  assert.throws(
    () =>
      instantiateEntityTemplate(scene, {
        components: [{ type: "missing", data: {} }]
      }),
    /Unknown entity template component type "missing"/
  );
});

test("entity template fails clearly for invalid component data", () => {
  const scene = new Scene("InvalidTemplateScene");

  assert.throws(
    () =>
      instantiateEntityTemplate(scene, {
        components: [{ type: "size", data: { width: "wide", height: 20 } }]
      }),
    /Invalid entity template data for "size.width": expected number/
  );
});

function createFakeRenderAdapter() {
  return {
    createScene() {
      return createFakeRenderScene();
    },
    createContainer() {
      return createFakeContainer();
    },
    createSprite() {
      return createFakeNode();
    },
    createText() {
      return {
        ...createFakeNode(),
        fontSize: 0,
        setText() {}
      };
    }
  };
}

function createFakeRenderScene() {
  return {
    root: createFakeContainer(),
    layers: {
      background: createFakeContainer(),
      world: createFakeContainer(),
      ui: createFakeContainer(),
      overlay: createFakeContainer()
    },
    width: 800,
    height: 600,
    mount() {},
    destroy() {}
  };
}

function createFakeContainer() {
  return {
    ...createFakeNode(),
    addChild() {}
  };
}

function createFakeNode() {
  return {
    x: 0,
    y: 0,
    width: undefined,
    height: undefined,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    visible: true,
    destroy() {}
  };
}
