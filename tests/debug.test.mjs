import test from "node:test";
import assert from "node:assert/strict";

import { Component, Game, Scene, System } from "../lib/core/index.js";
import { AssetRegistry, ComponentSchemaRegistry, createDefaultComponentSchemaRegistry } from "../lib/framework/index.js";
import {
  createComponentSchemasPanelSection,
  createComponentSchemaSnapshot,
  createDebugSnapshot,
  createEntityInspectorPanelSection,
  createRuntimeDebugPanelSection,
  createSelectedEntityDetailPanelSection,
  createSceneInspectorSnapshot,
  createToolingPanelSections,
  createToolingSnapshot,
  formatComponentSchemaSnapshot,
  formatDebugSnapshot,
  formatSceneInspectorSnapshot,
  formatToolingSnapshot,
  parseToolingPanelEntityRowId
} from "../lib/tooling/index.js";

class DebugSystem extends System {
  priority = 42;
}

class InspectorFixtureComponent extends Component {
  label = "hero";
  speed = 12;
  visible = true;
  empty = null;
  reference = { skip: true };
  callback = () => {};
}

test("debug snapshot includes scene, entity and system details", () => {
  const scene = new Scene("DebugScene");
  scene.addSystem(new DebugSystem(scene));
  scene.world.createEntity("player");
  scene.start();

  const snapshot = createDebugSnapshot(scene);

  assert.equal(snapshot.sceneName, "DebugScene");
  assert.equal(snapshot.entityCount, 1);
  assert.equal(snapshot.activeEntityCount, 1);
  assert.equal(snapshot.destroyedEntityCount, 0);
  assert.equal(snapshot.systemCount, 1);
  assert.deepEqual(snapshot.systems, [
    {
      name: "DebugSystem",
      enabled: true,
      started: true,
      priority: 42
    }
  ]);
});

test("debug snapshot can include time, render and asset details", () => {
  const game = new Game();
  const scene = new Scene("RuntimeDebugScene");
  const assets = new AssetRegistry();
  assets.registerSprite({ id: "player", fill: "#ffcf7a" });

  game.setScene(scene);
  game.tick(0.5);

  const snapshot = createDebugSnapshot(scene, {
    assets,
    game,
    renderScene: createFakeRenderScene()
  });

  assert.equal(snapshot.time?.delta, 0.5);
  assert.equal(snapshot.time?.fps, 2);
  assert.equal(snapshot.render?.width, 800);
  assert.deepEqual(snapshot.render?.layers, ["background", "world", "ui", "overlay"]);
  assert.deepEqual(snapshot.assets?.sprites, ["player"]);
});

test("debug snapshot formatting is stable and compact", () => {
  const scene = new Scene("FormatScene");
  const game = new Game();

  game.setScene(scene);
  game.tick(0.25);

  const lines = formatDebugSnapshot(
    createDebugSnapshot(scene, {
      game,
      renderScene: createFakeRenderScene()
    })
  );

  assert.deepEqual(lines.slice(0, 6), [
    "Scene FormatScene",
    "Entities 0/0",
    "Systems 0",
    "FPS 4",
    "DT 0.250s",
    "Viewport 800x600"
  ]);
});

test("scene inspector snapshot includes entity and component details", () => {
  const scene = new Scene("InspectorScene");
  const player = scene.world.createEntity("player");
  const component = player.addComponent(new InspectorFixtureComponent());
  component.enabled = false;
  const prop = scene.world.createEntity("prop");
  prop.active = false;

  const snapshot = createSceneInspectorSnapshot(scene);

  assert.equal(snapshot.sceneName, "InspectorScene");
  assert.equal(snapshot.entityCount, 2);
  assert.equal(snapshot.activeEntityCount, 1);
  assert.equal(snapshot.destroyedEntityCount, 0);
  assert.deepEqual(
    snapshot.entities.map((entity) => entity.name),
    ["player", "prop"]
  );

  assert.equal(snapshot.entities[0].id, player.id);
  assert.equal(snapshot.entities[0].active, true);
  assert.equal(snapshot.entities[0].destroyed, false);
  assert.equal(snapshot.entities[0].componentCount, 1);
  assert.deepEqual(snapshot.entities[1], {
    id: prop.id,
    name: "prop",
    active: false,
    destroyed: false,
    componentCount: 0,
    components: []
  });

  assert.deepEqual(snapshot.entities[0].components, [
    {
      name: "InspectorFixtureComponent",
      enabled: false,
      started: true,
      destroyed: false,
      data: {
        label: "hero",
        speed: 12,
        visible: true,
        empty: null
      }
    }
  ]);
});

test("tooling snapshot aggregates debug data and optional inspector data", () => {
  const game = new Game();
  const scene = new Scene("ToolingScene");
  const assets = new AssetRegistry();
  scene.world.createEntity("player");
  assets.registerSprite({ id: "player", fill: "#ffcf7a" });
  game.setScene(scene);
  game.tick(0.5);

  const debugOnly = createToolingSnapshot(scene, {
    assets,
    game,
    renderScene: createFakeRenderScene()
  });

  assert.equal(debugOnly.debug.sceneName, "ToolingScene");
  assert.equal(debugOnly.debug.time?.fps, 2);
  assert.deepEqual(debugOnly.debug.assets?.sprites, ["player"]);
  assert.equal(debugOnly.inspector, undefined);

  const withInspector = createToolingSnapshot(scene, { inspector: true });

  assert.equal(withInspector.debug.sceneName, "ToolingScene");
  assert.equal(withInspector.inspector?.sceneName, "ToolingScene");
  assert.deepEqual(
    withInspector.inspector?.entities.map((entity) => entity.name),
    ["player"]
  );
});

test("tooling snapshot can include copied component schema metadata", () => {
  const scene = new Scene("SchemaToolingScene");
  const registry = new ComponentSchemaRegistry();
  registry.register({
    id: "custom",
    component: "CustomComponent",
    label: "Custom",
    fields: [{ name: "enabled", type: "boolean", default: true }]
  });

  const snapshot = createToolingSnapshot(scene, { schemas: registry });
  registry.require("custom").fields.push({ name: "late", type: "string" });

  assert.deepEqual(snapshot.schemas, {
    count: 1,
    schemas: [
      {
        id: "custom",
        component: "CustomComponent",
        label: "Custom",
        fields: [{ name: "enabled", type: "boolean", default: true }]
      }
    ]
  });
});

test("component schema snapshot formatting is stable and readable", () => {
  const registry = new ComponentSchemaRegistry();
  registry.register({
    id: "movement",
    component: "MovementComponent",
    label: "Movement",
    fields: [
      { name: "speed", type: "number", required: true, description: "Move speed." },
      { name: "mode", type: "string", default: "walk" }
    ]
  });

  assert.deepEqual(formatComponentSchemaSnapshot(createComponentSchemaSnapshot(registry)), [
    "Component Schemas 1",
    "- movement: MovementComponent (Movement) fields=2",
    "  - speed: number required - Move speed.",
    "  - mode: string default=walk"
  ]);
});

test("scene inspector snapshot formatting is stable and readable", () => {
  const scene = new Scene("InspectorFormatScene");
  const entity = scene.world.createEntity("player");
  entity.addComponent(new InspectorFixtureComponent());

  const lines = formatSceneInspectorSnapshot(createSceneInspectorSnapshot(scene));

  assert.deepEqual(lines, [
    "Inspector InspectorFormatScene",
    "Entities 1/1",
    `- #${entity.id} player [active] components=1`,
    "  - InspectorFixtureComponent enabled=true started=true data=label:hero,speed:12,visible:true,empty:null"
  ]);
});

test("tooling snapshot formatting appends inspector data when present", () => {
  const scene = new Scene("ToolingFormatScene");
  scene.world.createEntity("player");

  const lines = formatToolingSnapshot(createToolingSnapshot(scene, { inspector: true }));

  assert.deepEqual(lines, [
    "Scene ToolingFormatScene",
    "Entities 1/1",
    "Systems 0",
    "",
    "Inspector ToolingFormatScene",
    "Entities 1/1",
    `- #${scene.world.entities[0].id} player [active] components=0`
  ]);
});

test("tooling snapshot formatting appends schema data when present", () => {
  const scene = new Scene("ToolingSchemaFormatScene");

  assert.deepEqual(formatToolingSnapshot(createToolingSnapshot(scene, { schemas: createDefaultComponentSchemaRegistry() })).slice(0, 8), [
    "Scene ToolingSchemaFormatScene",
    "Entities 0/0",
    "Systems 0",
    "",
    "Component Schemas 4",
    "- transform: TransformComponent (Transform) fields=5",
    "  - x: number default=0 - World x position.",
    "  - y: number default=0 - World y position."
  ]);
});

test("tooling snapshot formatting keeps debug-only output compact", () => {
  const scene = new Scene("DebugOnlyToolingScene");

  assert.deepEqual(formatToolingSnapshot(createToolingSnapshot(scene)), [
    "Scene DebugOnlyToolingScene",
    "Entities 0/0",
    "Systems 0"
  ]);
});

test("tooling panel sections expose runtime debug output", () => {
  const scene = new Scene("RuntimePanelScene");

  assert.deepEqual(createRuntimeDebugPanelSection(createDebugSnapshot(scene)), {
    title: "Runtime Debug",
    lines: ["Scene RuntimePanelScene", "Entities 0/0", "Systems 0"]
  });
});

test("entity inspector panel section exposes entity rows without repeating the section title", () => {
  const scene = new Scene("EntityPanelScene");
  const entity = scene.world.createEntity("player");
  entity.addComponent(new InspectorFixtureComponent());

  assert.deepEqual(createEntityInspectorPanelSection(createSceneInspectorSnapshot(scene)), {
    title: "Entity Inspector",
    lines: [
      "Scene EntityPanelScene",
      "Entities 1/1",
      `- #${entity.id} player [active] components=1`,
      "  - InspectorFixtureComponent enabled=true started=true data=label:hero,speed:12,visible:true,empty:null"
    ]
  });
});

test("entity inspector panel section can mark a selected entity", () => {
  const scene = new Scene("SelectedEntityPanelScene");
  const player = scene.world.createEntity("player");
  scene.world.createEntity("hazard");

  assert.deepEqual(createEntityInspectorPanelSection(createSceneInspectorSnapshot(scene), { selectedEntityId: player.id }), {
    title: "Entity Inspector",
    lines: [
      "Scene SelectedEntityPanelScene",
      "Entities 2/2",
      `Selected #${player.id} player`,
      `> #${player.id} player [active] components=0`,
      `- #${scene.world.entities[1].id} hazard [active] components=0`
    ]
  });
});

test("entity inspector panel section reports missing selected entities", () => {
  const scene = new Scene("MissingSelectionPanelScene");
  const entity = scene.world.createEntity("player");

  assert.deepEqual(createEntityInspectorPanelSection(createSceneInspectorSnapshot(scene), { selectedEntityId: 999 }), {
    title: "Entity Inspector",
    lines: [
      "Scene MissingSelectionPanelScene",
      "Entities 1/1",
      "Selected #999 missing",
      `- #${entity.id} player [active] components=0`
    ]
  });
});

test("tooling panel sections include inspector data when requested", () => {
  const scene = new Scene("PanelSectionsScene");
  scene.world.createEntity("player");

  assert.deepEqual(createToolingPanelSections(createToolingSnapshot(scene, { inspector: true })), [
    {
      title: "Runtime Debug",
      lines: ["Scene PanelSectionsScene", "Entities 1/1", "Systems 0"]
    },
    {
      title: "Entity Inspector",
      lines: [
        "Scene PanelSectionsScene",
        "Entities 1/1",
        `- #${scene.world.entities[0].id} player [active] components=0`
      ]
    }
  ]);
});

test("tooling panel sections pass selected entity state to inspector sections", () => {
  const scene = new Scene("SelectedToolingSectionsScene");
  const entity = scene.world.createEntity("player");

  assert.deepEqual(createToolingPanelSections(createToolingSnapshot(scene, { inspector: true }), { selectedEntityId: entity.id }), [
    {
      title: "Runtime Debug",
      lines: ["Scene SelectedToolingSectionsScene", "Entities 1/1", "Systems 0"]
    },
    {
      title: "Entity Inspector",
      lines: [
        "Scene SelectedToolingSectionsScene",
        "Entities 1/1",
        `Selected #${entity.id} player`,
        `> #${entity.id} player [active] components=0`
      ]
    },
    {
      title: "Selected Entity",
      lines: [`#${entity.id} player`, "State active", "Components 0"]
    }
  ]);
});

test("selected entity detail panel section exposes selected component summaries", () => {
  const scene = new Scene("SelectedEntityDetailScene");
  const entity = scene.world.createEntity("player");
  entity.addComponent(new InspectorFixtureComponent());

  assert.deepEqual(createSelectedEntityDetailPanelSection(createSceneInspectorSnapshot(scene), { selectedEntityId: entity.id }), {
    title: "Selected Entity",
    lines: [
      `#${entity.id} player`,
      "State active",
      "Components 1",
      "- InspectorFixtureComponent enabled=true started=true destroyed=false data=label:hero,speed:12,visible:true,empty:null"
    ]
  });
});

test("selected entity detail panel section reports missing selections", () => {
  const scene = new Scene("MissingEntityDetailScene");

  assert.deepEqual(createSelectedEntityDetailPanelSection(createSceneInspectorSnapshot(scene), { selectedEntityId: 404 }), {
    title: "Selected Entity",
    lines: ["Entity #404 missing"]
  });
});

test("tooling panel sections omit selected detail when no entity is selected", () => {
  const scene = new Scene("UnselectedDetailScene");
  scene.world.createEntity("player");

  assert.equal(
    createToolingPanelSections(createToolingSnapshot(scene, { inspector: true })).some(
      (section) => section.title === "Selected Entity"
    ),
    false
  );
});

test("tooling panel entity row parser only matches top-level entity rows", () => {
  assert.equal(parseToolingPanelEntityRowId("- #12 player [active] components=2"), 12);
  assert.equal(parseToolingPanelEntityRowId("> #34 hazard [active] components=1"), 34);
  assert.equal(parseToolingPanelEntityRowId("  - TransformComponent enabled=true started=true"), undefined);
  assert.equal(parseToolingPanelEntityRowId("Selected #12 player"), undefined);
  assert.equal(parseToolingPanelEntityRowId("Entities 1/1"), undefined);
});

test("tooling panel sections include schema data when requested", () => {
  const scene = new Scene("PanelSchemaScene");

  assert.deepEqual(createToolingPanelSections(createToolingSnapshot(scene, { schemas: createDefaultComponentSchemaRegistry() })).slice(0, 2), [
    {
      title: "Runtime Debug",
      lines: ["Scene PanelSchemaScene", "Entities 0/0", "Systems 0"]
    },
    {
      title: "Component Schemas",
      lines: [
        "Component Schemas 4",
        "- transform: TransformComponent (Transform) fields=5",
        "  - x: number default=0 - World x position.",
        "  - y: number default=0 - World y position.",
        "  - rotation: number default=0 - Rotation in degrees.",
        "  - scaleX: number default=1 - Horizontal scale.",
        "  - scaleY: number default=1 - Vertical scale.",
        "- size: SizeComponent (Size) fields=2",
        "  - width: number required - Width in world units.",
        "  - height: number required - Height in world units.",
        "- collider: ColliderComponent (Collider) fields=5",
        "  - layer: string default=default - Collision layer id.",
        "  - width: number - Optional collider width override.",
        "  - height: number - Optional collider height override.",
        "  - offsetX: number default=0 - Collider x offset.",
        "  - offsetY: number default=0 - Collider y offset.",
        "- velocity: VelocityComponent (Velocity) fields=2",
        "  - vx: number default=0 - Horizontal velocity.",
        "  - vy: number default=0 - Vertical velocity."
      ]
    }
  ]);
});

test("component schemas panel section exposes formatted schema rows", () => {
  const snapshot = createComponentSchemaSnapshot(createDefaultComponentSchemaRegistry());

  assert.equal(createComponentSchemasPanelSection(snapshot).title, "Component Schemas");
  assert.equal(createComponentSchemasPanelSection(snapshot).lines[0], "Component Schemas 4");
});

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
