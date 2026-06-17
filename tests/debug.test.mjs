import test from "node:test";
import assert from "node:assert/strict";

import { Component, Game, Scene, System } from "../lib/core/index.js";
import {
  AssetRegistry,
  ComponentSchemaRegistry,
  GameFlow,
  SpriteAnimationComponent,
  TransformComponent,
  createDefaultComponentSchemaRegistry
} from "../lib/framework/index.js";
import {
  createAssetsPanelSection,
  createComponentSchemasPanelSection,
  createComponentSchemaSnapshot,
  createDebugSnapshot,
  createEntityInspectorPanelSection,
  createGameFlowPanelSection,
  createRuntimeDebugPanelSection,
  createSelectedEntityDetailPanelSection,
  createSceneInspectorSnapshot,
  createSpriteAnimationSnapshot,
  createSpriteAnimationsPanelSection,
  createToolingPanelSections,
  createToolingSnapshot,
  formatComponentSchemaSnapshot,
  formatDebugAssetSnapshot,
  formatDebugGameFlowSnapshot,
  formatDebugSnapshot,
  formatSceneInspectorSnapshot,
  formatSpriteAnimationSnapshot,
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
  const flow = new GameFlow({ initialPhase: "running" });
  assets.registerSprite({ id: "player", fill: "#ffcf7a" });

  game.setScene(scene);
  game.tick(0.5);

  const snapshot = createDebugSnapshot(scene, {
    assets,
    flow,
    game,
    renderScene: createFakeRenderScene()
  });

  assert.equal(snapshot.time?.delta, 0.5);
  assert.equal(snapshot.time?.fps, 2);
  assert.equal(snapshot.render?.width, 800);
  assert.deepEqual(snapshot.render?.layers, ["background", "world", "ui", "overlay"]);
  assert.deepEqual(snapshot.assets?.sprites, ["player"]);
  assert.deepEqual(snapshot.assets?.statusCounts, {
    registered: 1,
    loading: 0,
    loaded: 0,
    failed: 0
  });
  assert.deepEqual(snapshot.assets?.spriteStates, [
    {
      id: "player",
      status: "registered"
    }
  ]);
  assert.deepEqual(snapshot.flow, {
    phase: "running",
    canUpdateGameplay: true
  });
});

test("debug asset snapshot includes copied load states", async () => {
  const scene = new Scene("AssetStateDebugScene");
  const assets = new AssetRegistry();
  assets.registerSprite({ id: "player", source: "/assets/player.png" });
  assets.registerSprite({ id: "broken", source: "/assets/broken.png" });
  assets.registerSprite({ id: "ui", fill: "#ffffff" });

  await assets.loadSprite("player", async () => {});
  await assets.loadSprite("broken", async () => {
    throw new Error("Missing image");
  });

  const snapshot = createDebugSnapshot(scene, { assets }).assets;

  assert.deepEqual(snapshot?.statusCounts, {
    registered: 1,
    loading: 0,
    loaded: 1,
    failed: 1
  });
  assert.equal(snapshot?.spriteStates[0].id, "player");
  assert.equal(snapshot?.spriteStates[0].status, "loaded");
  assert.equal(typeof snapshot?.spriteStates[0].loadedAt, "number");
  assert.deepEqual(snapshot?.spriteStates.slice(1), [
    {
      id: "broken",
      status: "failed",
      error: "Missing image"
    },
    {
      id: "ui",
      status: "registered"
    }
  ]);

  assets.registerSprite({ id: "late", source: "/assets/late.png" });
  assert.equal(snapshot?.spriteStates[1].error, "Missing image");
  assert.equal(snapshot?.spriteStates.some((state) => state.id === "late"), false);
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

test("debug asset snapshot formatting is stable and readable", async () => {
  const assets = new AssetRegistry();
  assets.registerSprite({ id: "player", source: "/assets/player.png" });
  assets.registerSprite({ id: "broken", source: "/assets/broken.png" });

  await assets.loadSprite("player", async () => {});
  await assets.loadSprite("broken", async () => {
    throw new Error("Network failed");
  });

  const snapshot = createDebugSnapshot(new Scene("AssetFormatScene"), { assets }).assets;

  assert.deepEqual(formatDebugAssetSnapshot(snapshot), [
    "Assets sprites=2 registered=0 loading=0 loaded=1 failed=1",
    "- player loaded",
    "- broken failed error=Network failed"
  ]);
});

test("debug game flow snapshot formatting is stable and readable", () => {
  assert.deepEqual(formatDebugGameFlowSnapshot({
    phase: "paused",
    canUpdateGameplay: false
  }), [
    "Game Flow paused",
    "Gameplay inactive"
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
  const flow = new GameFlow({ initialPhase: "paused" });
  scene.world.createEntity("player");
  assets.registerSprite({ id: "player", fill: "#ffcf7a" });
  game.setScene(scene);
  game.tick(0.5);

  const debugOnly = createToolingSnapshot(scene, {
    assets,
    flow,
    game,
    renderScene: createFakeRenderScene()
  });

  assert.equal(debugOnly.debug.sceneName, "ToolingScene");
  assert.equal(debugOnly.debug.time?.fps, 2);
  assert.deepEqual(debugOnly.debug.assets?.sprites, ["player"]);
  assert.equal(debugOnly.debug.flow?.phase, "paused");
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

test("tooling snapshot can include sprite animation state", () => {
  const scene = new Scene("AnimationToolingScene");
  const entity = scene.world.createEntity("player");
  const animation = entity.addComponent(new SpriteAnimationComponent("player-idle"));
  animation.playback = {
    clipId: "player-idle",
    status: "playing",
    elapsedSeconds: 0.5,
    frameIndex: 1,
    completedLoops: 2
  };
  animation.currentFrameId = "player-idle-2";
  animation.currentSpriteId = "player-focus";

  const snapshot = createToolingSnapshot(scene, { animations: true });

  assert.deepEqual(snapshot.animations, {
    count: 1,
    animations: [
      {
        entityId: entity.id,
        entityName: "player",
        clipId: "player-idle",
        status: "playing",
        elapsedSeconds: 0.5,
        frameIndex: 1,
        completedLoops: 2,
        currentFrameId: "player-idle-2",
        currentSpriteId: "player-focus"
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

test("sprite animation snapshot formatting is stable and readable", () => {
  assert.deepEqual(formatSpriteAnimationSnapshot({
    count: 1,
    animations: [
      {
        entityId: 7,
        entityName: "player",
        clipId: "player-idle",
        status: "paused",
        elapsedSeconds: 0.125,
        frameIndex: 0,
        completedLoops: 3,
        currentFrameId: "player-idle-1",
        currentSpriteId: "player"
      }
    ]
  }), [
    "Sprite Animations 1",
    "- #7 player clip=player-idle status=paused frame=player-idle-1 sprite=player index=0 elapsed=0.125s loops=3"
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

test("tooling snapshot formatting appends animation data when present", () => {
  const scene = new Scene("AnimationToolingFormatScene");
  const entity = scene.world.createEntity("player");
  const animation = entity.addComponent(new SpriteAnimationComponent("player-idle"));
  animation.currentFrameId = "player-idle-1";
  animation.currentSpriteId = "player";

  assert.deepEqual(formatToolingSnapshot(createToolingSnapshot(scene, { animations: true })), [
    "Scene AnimationToolingFormatScene",
    "Entities 1/1",
    "Systems 0",
    "",
    "Sprite Animations 1",
    `- #${entity.id} player clip=player-idle status=playing frame=player-idle-1 sprite=player index=0 elapsed=0.000s loops=0`
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

test("tooling snapshot formatting includes flow data when present", () => {
  const scene = new Scene("FlowToolingFormatScene");
  const flow = new GameFlow({ initialPhase: "running" });

  assert.deepEqual(formatToolingSnapshot(createToolingSnapshot(scene, { flow })), [
    "Scene FlowToolingFormatScene",
    "Entities 0/0",
    "Systems 0",
    "Flow running gameplay=active"
  ]);
});

test("tooling panel sections expose runtime debug output", () => {
  const scene = new Scene("RuntimePanelScene");

  assert.deepEqual(createRuntimeDebugPanelSection(createDebugSnapshot(scene)), {
    title: "Runtime Debug",
    lines: ["Scene RuntimePanelScene", "Entities 0/0", "Systems 0"]
  });
});

test("asset panel section exposes asset load states", async () => {
  const assets = new AssetRegistry();
  assets.registerSprite({ id: "player", source: "/assets/player.png" });
  await assets.loadSprite("player", async () => {});
  const snapshot = createDebugSnapshot(new Scene("AssetPanelScene"), { assets }).assets;

  assert.deepEqual(createAssetsPanelSection(snapshot), {
    title: "Assets",
    lines: [
      "Assets sprites=1 registered=0 loading=0 loaded=1 failed=0",
      "- player loaded"
    ]
  });
});

test("game flow panel section exposes current flow state", () => {
  assert.deepEqual(createGameFlowPanelSection({
    phase: "ready",
    canUpdateGameplay: false
  }), {
    title: "Game Flow",
    lines: [
      "Game Flow ready",
      "Gameplay inactive"
    ]
  });
});

test("sprite animations panel section exposes animation state", () => {
  assert.deepEqual(createSpriteAnimationsPanelSection({
    count: 0,
    animations: []
  }), {
    title: "Sprite Animations",
    lines: ["Sprite Animations 0"]
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

test("tooling panel sections include asset data when requested", () => {
  const scene = new Scene("AssetSectionsScene");
  const assets = new AssetRegistry();
  assets.registerSprite({ id: "player", fill: "#ffcf7a" });

  assert.deepEqual(createToolingPanelSections(createToolingSnapshot(scene, { assets })), [
    {
      title: "Runtime Debug",
      lines: [
        "Scene AssetSectionsScene",
        "Entities 0/0",
        "Systems 0",
        "Sprites 1 registered=1 loading=0 loaded=0 failed=0"
      ]
    },
    {
      title: "Assets",
      lines: [
        "Assets sprites=1 registered=1 loading=0 loaded=0 failed=0",
        "- player registered"
      ]
    }
  ]);
});

test("tooling panel sections include flow data when requested", () => {
  const scene = new Scene("FlowSectionsScene");
  const flow = new GameFlow({ initialPhase: "running" });

  assert.deepEqual(createToolingPanelSections(createToolingSnapshot(scene, { flow })), [
    {
      title: "Runtime Debug",
      lines: [
        "Scene FlowSectionsScene",
        "Entities 0/0",
        "Systems 0",
        "Flow running gameplay=active"
      ]
    },
    {
      title: "Game Flow",
      lines: [
        "Game Flow running",
        "Gameplay active"
      ]
    }
  ]);
});

test("tooling panel sections include animation data when requested", () => {
  const scene = new Scene("AnimationSectionsScene");
  const entity = scene.world.createEntity("player");
  entity.addComponent(new SpriteAnimationComponent("player-idle"));

  assert.deepEqual(createToolingPanelSections(createToolingSnapshot(scene, { animations: true })), [
    {
      title: "Runtime Debug",
      lines: ["Scene AnimationSectionsScene", "Entities 1/1", "Systems 0"]
    },
    {
      title: "Sprite Animations",
      lines: [
        "Sprite Animations 1",
        `- #${entity.id} player clip=player-idle status=playing frame=<unset> sprite=<unset> index=0 elapsed=0.000s loops=0`
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

test("tooling panel sections pass schema metadata to selected entity details", () => {
  const scene = new Scene("SchemaSelectedToolingSectionsScene");
  const entity = scene.world.createEntity("player");
  entity.addComponent(new TransformComponent());

  const sections = createToolingPanelSections(
    createToolingSnapshot(scene, {
      inspector: true,
      schemas: createDefaultComponentSchemaRegistry()
    }),
    { selectedEntityId: entity.id }
  );

  assert.deepEqual(sections[2], {
    title: "Selected Entity",
    lines: [
      `#${entity.id} player`,
      "State active",
      "Components 1",
      "- TransformComponent (Transform) enabled=true started=true destroyed=false data=x:0,y:0,rotation:0,scaleX:1,scaleY:1",
      "  - x: number default=0 value=0 - World x position.",
      "  - y: number default=0 value=0 - World y position.",
      "  - rotation: number default=0 value=0 - Rotation in degrees.",
      "  - scaleX: number default=1 value=1 - Horizontal scale.",
      "  - scaleY: number default=1 value=1 - Vertical scale."
    ]
  });
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

test("selected entity detail panel section can use component schema metadata", () => {
  const scene = new Scene("SchemaSelectedEntityDetailScene");
  const entity = scene.world.createEntity("player");
  const transform = entity.addComponent(new TransformComponent());
  transform.x = 24;
  transform.y = 48;

  assert.deepEqual(
    createSelectedEntityDetailPanelSection(
      createSceneInspectorSnapshot(scene),
      { selectedEntityId: entity.id },
      createComponentSchemaSnapshot(createDefaultComponentSchemaRegistry())
    ),
    {
      title: "Selected Entity",
      lines: [
        `#${entity.id} player`,
        "State active",
        "Components 1",
        "- TransformComponent (Transform) enabled=true started=true destroyed=false data=x:24,y:48,rotation:0,scaleX:1,scaleY:1",
        "  - x: number default=0 value=24 - World x position.",
        "  - y: number default=0 value=48 - World y position.",
        "  - rotation: number default=0 value=0 - Rotation in degrees.",
        "  - scaleX: number default=1 value=1 - Horizontal scale.",
        "  - scaleY: number default=1 value=1 - Vertical scale."
      ]
    }
  );
});

test("selected entity detail panel section reports missing and unset schema field values", () => {
  const scene = new Scene("MissingSchemaValueDetailScene");
  const entity = scene.world.createEntity("player");
  entity.addComponent(new InspectorFixtureComponent());
  const schemas = new ComponentSchemaRegistry().register({
    id: "fixture",
    component: "InspectorFixtureComponent",
    label: "Fixture",
    fields: [
      { name: "label", type: "string", required: true },
      { name: "missingRequired", type: "number", required: true },
      { name: "missingOptional", type: "boolean" }
    ]
  });

  assert.deepEqual(
    createSelectedEntityDetailPanelSection(
      createSceneInspectorSnapshot(scene),
      { selectedEntityId: entity.id },
      createComponentSchemaSnapshot(schemas)
    ).lines.slice(3),
    [
      "- InspectorFixtureComponent (Fixture) enabled=true started=true destroyed=false data=label:hero,speed:12,visible:true,empty:null",
      "  - label: string required value=hero",
      "  - missingRequired: number required value=<missing>",
      "  - missingOptional: boolean value=<unset>"
    ]
  );
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
