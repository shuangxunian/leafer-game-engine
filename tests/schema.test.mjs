import test from "node:test";
import assert from "node:assert/strict";

import {
  ComponentSchemaRegistry,
  createDefaultComponentSchemaRegistry
} from "../lib/framework/index.js";

test("default component schema registry exposes common framework schemas", () => {
  const registry = createDefaultComponentSchemaRegistry();

  assert.deepEqual(
    registry.list().map((schema) => schema.id),
    ["transform", "size", "collider", "velocity"]
  );
  assert.equal(registry.has("Transform"), true);
  assert.equal(registry.require(" transform ").component, "TransformComponent");
});

test("component schemas expose stable field metadata", () => {
  const registry = createDefaultComponentSchemaRegistry();

  assert.deepEqual(registry.require("transform").fields, [
    { name: "x", type: "number", default: 0, description: "World x position." },
    { name: "y", type: "number", default: 0, description: "World y position." },
    { name: "rotation", type: "number", default: 0, description: "Rotation in degrees." },
    { name: "scaleX", type: "number", default: 1, description: "Horizontal scale." },
    { name: "scaleY", type: "number", default: 1, description: "Vertical scale." }
  ]);

  assert.deepEqual(registry.require("size").fields, [
    { name: "width", type: "number", required: true, description: "Width in world units." },
    { name: "height", type: "number", required: true, description: "Height in world units." }
  ]);
});

test("component schema registry supports custom schemas", () => {
  const registry = new ComponentSchemaRegistry();

  registry.register({
    id: "tag",
    component: "TagComponent",
    label: "Tag",
    fields: [{ name: "tag", type: "string", required: true }]
  });

  assert.deepEqual(registry.require("TAG"), {
    id: "tag",
    component: "TagComponent",
    label: "Tag",
    fields: [{ name: "tag", type: "string", required: true }]
  });
});

test("component schema registry fails clearly for missing schemas", () => {
  const registry = new ComponentSchemaRegistry();

  assert.equal(registry.get("missing"), undefined);
  assert.throws(() => registry.require("missing"), /Component schema "missing" is not registered/);
});

test("component schema registry rejects empty schema ids", () => {
  const registry = new ComponentSchemaRegistry();

  assert.throws(
    () =>
      registry.register({
        id: "   ",
        component: "BrokenComponent",
        fields: []
      }),
    /Component schema id must be a non-empty string/
  );
});
