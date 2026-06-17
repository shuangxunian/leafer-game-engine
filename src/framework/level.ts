export type LevelMetadata = Record<string, unknown>;

export type LevelSpawnPointDefinition = {
  id: string;
  x: number;
  y: number;
  rotation?: number;
  metadata?: LevelMetadata;
};

export type LevelRegionDefinition = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tags?: readonly string[];
  metadata?: LevelMetadata;
};

export type LevelLayoutDefinition = {
  id: string;
  spawns?: readonly LevelSpawnPointDefinition[];
  regions?: readonly LevelRegionDefinition[];
};

export type DefinedLevelSpawnPoint = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  metadata?: LevelMetadata;
};

export type DefinedLevelRegion = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tags: string[];
  metadata?: LevelMetadata;
};

export type DefinedLevelLayout = {
  id: string;
  spawns: DefinedLevelSpawnPoint[];
  regions: DefinedLevelRegion[];
};

export class LevelLayout {
  private readonly definition: DefinedLevelLayout;
  private readonly spawnsById = new Map<string, DefinedLevelSpawnPoint>();
  private readonly regionsById = new Map<string, DefinedLevelRegion>();

  constructor(definition: LevelLayoutDefinition) {
    this.definition = defineLevelLayout(definition);

    for (const spawn of this.definition.spawns) {
      this.spawnsById.set(spawn.id, spawn);
    }

    for (const region of this.definition.regions) {
      this.regionsById.set(region.id, region);
    }
  }

  get id(): string {
    return this.definition.id;
  }

  get spawns(): DefinedLevelSpawnPoint[] {
    return this.definition.spawns.map(copySpawnPoint);
  }

  get regions(): DefinedLevelRegion[] {
    return this.definition.regions.map(copyRegion);
  }

  getSpawnPoint(id: string): DefinedLevelSpawnPoint | undefined {
    const spawn = this.spawnsById.get(id);
    return spawn ? copySpawnPoint(spawn) : undefined;
  }

  getRegion(id: string): DefinedLevelRegion | undefined {
    const region = this.regionsById.get(id);
    return region ? copyRegion(region) : undefined;
  }

  containsPoint(regionId: string, x: number, y: number): boolean {
    const region = this.regionsById.get(regionId);
    return region ? containsPoint(region, x, y) : false;
  }

  findRegionsContainingPoint(x: number, y: number): DefinedLevelRegion[] {
    return this.definition.regions
      .filter((region) => containsPoint(region, x, y))
      .map(copyRegion);
  }

  findRegionsByTag(tag: string): DefinedLevelRegion[] {
    assertNonEmptyString(tag, "Level region tag");

    return this.definition.regions
      .filter((region) => region.tags.includes(tag))
      .map(copyRegion);
  }
}

export function createLevelLayout(definition: LevelLayoutDefinition): LevelLayout {
  return new LevelLayout(definition);
}

export function defineLevelLayout(definition: LevelLayoutDefinition): DefinedLevelLayout {
  assertNonEmptyString(definition.id, "Level layout id");

  const spawns = normalizeSpawns(definition.spawns ?? []);
  const regions = normalizeRegions(definition.regions ?? []);

  return {
    id: definition.id,
    spawns,
    regions
  };
}

function normalizeSpawns(spawns: readonly LevelSpawnPointDefinition[]): DefinedLevelSpawnPoint[] {
  if (!Array.isArray(spawns)) {
    throw new Error("Level layout spawns must be an array.");
  }

  const seenIds = new Set<string>();

  return spawns.map((spawn) => {
    assertNonEmptyString(spawn.id, "Level spawn id");
    assertUniqueId(spawn.id, seenIds, "Duplicate level spawn id");
    assertFiniteNumber(spawn.x, "Level spawn x");
    assertFiniteNumber(spawn.y, "Level spawn y");

    const rotation = spawn.rotation ?? 0;
    assertFiniteNumber(rotation, "Level spawn rotation");

    return {
      id: spawn.id,
      x: spawn.x,
      y: spawn.y,
      rotation,
      metadata: copyMetadata(spawn.metadata)
    };
  });
}

function normalizeRegions(regions: readonly LevelRegionDefinition[]): DefinedLevelRegion[] {
  if (!Array.isArray(regions)) {
    throw new Error("Level layout regions must be an array.");
  }

  const seenIds = new Set<string>();

  return regions.map((region) => {
    assertNonEmptyString(region.id, "Level region id");
    assertUniqueId(region.id, seenIds, "Duplicate level region id");
    assertFiniteNumber(region.x, "Level region x");
    assertFiniteNumber(region.y, "Level region y");
    assertPositiveFiniteNumber(region.width, "Level region width");
    assertPositiveFiniteNumber(region.height, "Level region height");

    return {
      id: region.id,
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
      tags: normalizeTags(region.tags ?? [], region.id),
      metadata: copyMetadata(region.metadata)
    };
  });
}

function normalizeTags(tags: readonly string[], regionId: string): string[] {
  if (!Array.isArray(tags)) {
    throw new Error(`Level region "${regionId}" tags must be an array.`);
  }

  const seenTags = new Set<string>();

  return tags.map((tag) => {
    assertNonEmptyString(tag, "Level region tag");

    if (seenTags.has(tag)) {
      throw new Error(`Duplicate level region tag "${tag}" on region "${regionId}".`);
    }

    seenTags.add(tag);
    return tag;
  });
}

function containsPoint(region: DefinedLevelRegion, x: number, y: number): boolean {
  return x >= region.x && y >= region.y && x < region.x + region.width && y < region.y + region.height;
}

function copySpawnPoint(spawn: DefinedLevelSpawnPoint): DefinedLevelSpawnPoint {
  return {
    id: spawn.id,
    x: spawn.x,
    y: spawn.y,
    rotation: spawn.rotation,
    metadata: copyMetadata(spawn.metadata)
  };
}

function copyRegion(region: DefinedLevelRegion): DefinedLevelRegion {
  return {
    id: region.id,
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    tags: [...region.tags],
    metadata: copyMetadata(region.metadata)
  };
}

function copyMetadata(metadata: LevelMetadata | undefined): LevelMetadata | undefined {
  return metadata ? { ...metadata } : undefined;
}

function assertUniqueId(id: string, seenIds: Set<string>, message: string): void {
  if (seenIds.has(id)) {
    throw new Error(`${message} "${id}".`);
  }

  seenIds.add(id);
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function assertFiniteNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

function assertPositiveFiniteNumber(value: unknown, label: string): asserts value is number {
  assertFiniteNumber(value, label);

  if (value <= 0) {
    throw new Error(`${label} must be greater than 0.`);
  }
}
