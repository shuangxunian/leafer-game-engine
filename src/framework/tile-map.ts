export type TileId = string | null;

export type TileCoordinate = {
  x: number;
  y: number;
};

export type TileBounds = TileCoordinate & {
  width: number;
  height: number;
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
