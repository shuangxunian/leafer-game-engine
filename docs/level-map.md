# Level/Map Runtime Boundary

## Purpose

`leaferGame` level/map support is part of the frontend 2D game engine package.

It gives downstream games a Node-safe way to describe map-shaped runtime data, convert tile/world coordinates, declare spawn points and regions, validate level declarations, and consume that data from scene config bootstrap.

It is not a visual tile map editor, level editor, scene graph editor, component editor, asset manager, save-file format, content publishing workflow, or authoring product.

## Runtime Data Layers

### Tile Map Data

`TileMap`, `defineTileMap(...)`, and `createTileMap(...)` describe rectangular tile grids:

- map id
- width and height in tiles
- tile width and height in world units
- named layers
- tile ids or `null` cells

The tile map contract is intentionally small. It supports:

- deterministic validation
- defensive copying of layer data
- `getTile(...)`
- `containsTile(...)`
- `worldToTile(...)`
- `tileToWorld(...)`
- `getTileBounds(...)`

It does not render maps, load map assets, generate entities, create colliders, or paint tiles.

### Level Layout Data

`LevelLayout`, `defineLevelLayout(...)`, and `createLevelLayout(...)` describe level metadata:

- named spawn points
- optional spawn rotation
- rectangular regions
- region tags
- metadata objects

The level layout contract supports:

- deterministic validation
- defensive copying of spawn, region, tag, and metadata data
- lookup by spawn id or region id
- point containment checks
- region search by point
- region search by tag

It does not create gameplay objects, trigger systems, physics bodies, render overlays, or editor selections by itself.

## Scene Config Integration

Scene config can optionally declare level/map data:

```ts
const sceneConfig = {
  level: {
    tileMap: {
      id: "arena-map",
      width: 2,
      height: 2,
      tileWidth: 16,
      tileHeight: 16,
      layers: [
        {
          id: "ground",
          tiles: ["floor", "wall", null, "floor"]
        }
      ]
    },
    layout: {
      id: "arena-layout",
      spawns: [{ id: "player-start", x: 24, y: 32 }],
      regions: [{ id: "playfield", x: 0, y: 0, width: 320, height: 240 }]
    }
  }
};
```

`validateSceneConfig(...)` converts invalid level/map declarations into scene config diagnostics:

- `invalid-level`
- `invalid-tile-map`
- `invalid-level-layout`

`bootstrapSceneFromConfig(...)` returns helper instances when declarations are present:

```ts
const result = bootstrapSceneFromConfig(scene, sceneConfig, {
  validateBeforeBootstrap: true
});

const tileMap = result.level?.tileMap;
const layout = result.level?.layout;
```

Level declarations are inert bootstrap data. They do not mutate scene content by themselves.

## Example Consumption

`examples/dodge-blocks` consumes this boundary as a downstream-style browser game:

- `level.tileMap` declares a minimal playfield tile map.
- `level.layout` declares `player-start`, `playfield`, and `hazard-spawn` metadata.
- The example reads the bootstrapped `LevelLayout` helper to configure player start, reset position, and movement bounds.
- The example reads the bootstrapped `TileMap` helper to prove map-shaped runtime data is available.
- Dynamic hazards remain code-driven because their size, position, and velocity are runtime-random.

The example does not become a level editor, map renderer, entity generator, or content authoring workflow.

## Tooling Relationship

Level/map data can be observed by future read-only tooling if it remains runtime observability.

Tooling may display:

- map id and dimensions
- layer ids
- spawn ids
- region ids and tags
- scene config validation diagnostics

Tooling should not mutate tile maps, edit regions, move spawn points, paint tiles, generate entities, create colliders, save project files, or become an editor surface inside this package.

## Current Limitations

The current level/map scope intentionally does not include:

- visual map editing
- tile painting
- map asset import workflows
- map rendering
- tile animation
- collision generation
- trigger systems
- pathfinding
- physics integration
- scene graph editing
- save/load or publishing workflows

Those capabilities can be added later only if they remain reusable engine package APIs or live in an independent upper-layer editor project.

## Consumer Guidance

Use `TileMap` for stable map-shaped runtime data and coordinate helpers.

Use `LevelLayout` for spawn points, gameplay regions, and metadata that downstream games can interpret explicitly.

Use scene config level declarations for static boot-time data that benefits from validation and deterministic tests.

Keep runtime generation, rendering, collision creation, random spawning, input behavior, service wiring, and content authoring workflows in game code or future dedicated APIs until they become reusable engine contracts.
