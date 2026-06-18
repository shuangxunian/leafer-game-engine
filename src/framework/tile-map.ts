import type {
  RenderAdapter,
  RenderContainer,
  RenderScene,
  RenderSceneLayerName,
  RenderSprite,
  RenderSpriteAsset
} from "../adapter/render-types.js";

export type TileId = string | null;

export type TileCoordinate = {
  x: number;
  y: number;
};

export type TileBounds = TileCoordinate & {
  width: number;
  height: number;
};

export type TileMapViewTargetLayer = Extract<RenderSceneLayerName, "background" | "world">;

export type TileMapLayerViewTile = {
  tileId: string;
  coordinate: TileCoordinate;
  node: RenderSprite;
};

export type TileMapLayerView = {
  container: RenderContainer;
  tiles: TileMapLayerViewTile[];
};

export type TileMapLayerViewOptions = {
  tileMap: TileMap;
  layerId: string;
  renderAdapter: RenderAdapter;
  renderScene: RenderScene;
  targetLayer?: TileMapViewTargetLayer;
  resolveTileAsset?: (tileId: string, coordinate: TileCoordinate) => string | RenderSpriteAsset;
};

export type TileMapLayerDefinition = {
  id: string;
  tiles: readonly TileId[];
};

export type TileMapDefinition = {
  id: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  layers: readonly TileMapLayerDefinition[];
};

export type DefinedTileMapLayer = {
  id: string;
  tiles: TileId[];
};

export type DefinedTileMap = {
  id: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  layers: DefinedTileMapLayer[];
};

export class TileMap {
  private readonly definition: DefinedTileMap;
  private readonly layersById = new Map<string, DefinedTileMapLayer>();

  constructor(definition: TileMapDefinition) {
    this.definition = defineTileMap(definition);

    for (const layer of this.definition.layers) {
      this.layersById.set(layer.id, layer);
    }
  }

  get id(): string {
    return this.definition.id;
  }

  get width(): number {
    return this.definition.width;
  }

  get height(): number {
    return this.definition.height;
  }

  get tileWidth(): number {
    return this.definition.tileWidth;
  }

  get tileHeight(): number {
    return this.definition.tileHeight;
  }

  get layers(): DefinedTileMapLayer[] {
    return this.definition.layers.map(copyLayer);
  }

  getLayer(layerId: string): DefinedTileMapLayer | undefined {
    const layer = this.layersById.get(layerId);
    return layer ? copyLayer(layer) : undefined;
  }

  containsTile(x: number, y: number): boolean {
    return isInteger(x) && isInteger(y) && x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  getTile(layerId: string, x: number, y: number): TileId | undefined {
    if (!this.containsTile(x, y)) return undefined;

    const layer = this.layersById.get(layerId);
    if (!layer) return undefined;

    return layer.tiles[toTileIndex(x, y, this.width)];
  }

  worldToTile(x: number, y: number): TileCoordinate {
    return {
      x: Math.floor(x / this.tileWidth),
      y: Math.floor(y / this.tileHeight)
    };
  }

  tileToWorld(x: number, y: number): TileCoordinate {
    return {
      x: x * this.tileWidth,
      y: y * this.tileHeight
    };
  }

  getTileBounds(x: number, y: number): TileBounds {
    return {
      ...this.tileToWorld(x, y),
      width: this.tileWidth,
      height: this.tileHeight
    };
  }
}

export function createTileMap(definition: TileMapDefinition): TileMap {
  return new TileMap(definition);
}

export function createTileMapLayerView(options: TileMapLayerViewOptions): TileMapLayerView {
  const layer = options.tileMap.getLayer(options.layerId);
  if (!layer) {
    throw new Error(`Tile map layer "${options.layerId}" was not found.`);
  }

  const targetLayer = options.targetLayer ?? "world";
  const renderLayer = options.renderScene.layers[targetLayer];
  if (!renderLayer) {
    throw new Error(`Render scene layer "${targetLayer}" was not found.`);
  }

  const container = options.renderAdapter.createContainer();
  const tiles: TileMapLayerViewTile[] = [];

  for (let y = 0; y < options.tileMap.height; y += 1) {
    for (let x = 0; x < options.tileMap.width; x += 1) {
      const tileId = layer.tiles[toTileIndex(x, y, options.tileMap.width)];
      if (tileId === null) continue;

      const coordinate = { x, y };
      const bounds = options.tileMap.getTileBounds(x, y);
      const node = options.renderAdapter.createSprite();
      const asset = options.resolveTileAsset?.(tileId, coordinate) ?? tileId;
      node.setAsset(asset);
      node.x = bounds.x;
      node.y = bounds.y;
      node.width = bounds.width;
      node.height = bounds.height;
      container.addChild(node);
      tiles.push({
        tileId,
        coordinate,
        node
      });
    }
  }

  renderLayer.addChild(container);

  return {
    container,
    tiles
  };
}

export function defineTileMap(definition: TileMapDefinition): DefinedTileMap {
  assertNonEmptyString(definition.id, "Tile map id");
  assertPositiveInteger(definition.width, "Tile map width");
  assertPositiveInteger(definition.height, "Tile map height");
  assertPositiveInteger(definition.tileWidth, "Tile width");
  assertPositiveInteger(definition.tileHeight, "Tile height");

  if (!Array.isArray(definition.layers) || definition.layers.length === 0) {
    throw new Error("Tile map must define at least one layer.");
  }

  const expectedTileCount = definition.width * definition.height;
  const seenLayerIds = new Set<string>();
  const layers = definition.layers.map((layer) => {
    assertNonEmptyString(layer.id, "Tile map layer id");

    if (seenLayerIds.has(layer.id)) {
      throw new Error(`Duplicate tile map layer id "${layer.id}".`);
    }

    seenLayerIds.add(layer.id);

    if (!Array.isArray(layer.tiles)) {
      throw new Error(`Tile map layer "${layer.id}" tiles must be an array.`);
    }

    if (layer.tiles.length !== expectedTileCount) {
      throw new Error(
        `Tile map layer "${layer.id}" must contain ${expectedTileCount} tiles, received ${layer.tiles.length}.`
      );
    }

    return {
      id: layer.id,
      tiles: layer.tiles.map(normalizeTileId)
    };
  });

  return {
    id: definition.id,
    width: definition.width,
    height: definition.height,
    tileWidth: definition.tileWidth,
    tileHeight: definition.tileHeight,
    layers
  };
}

function copyLayer(layer: DefinedTileMapLayer): DefinedTileMapLayer {
  return {
    id: layer.id,
    tiles: [...layer.tiles]
  };
}

function toTileIndex(x: number, y: number, width: number): number {
  return y * width + x;
}

function normalizeTileId(tile: TileId): TileId {
  if (tile === null) return null;

  assertNonEmptyString(tile, "Tile id");
  return tile;
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function assertPositiveInteger(value: unknown, label: string): asserts value is number {
  if (!isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
}

function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}
