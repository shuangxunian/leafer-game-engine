import type { RenderSpriteAsset } from "../adapter/index.js";

export type AssetRecord = {
  id: string;
  type: "sprite";
};

export type SpriteAsset = AssetRecord & RenderSpriteAsset & {
  type: "sprite";
};

export type AssetManifestSprite = RenderSpriteAsset;

export type AssetManifest = {
  sprites?: AssetManifestSprite[];
};

export type AssetLoadError = {
  assetId?: string;
  code: "duplicate-sprite" | "invalid-sprite-id";
  message: string;
};

export type AssetLoadResult = {
  ok: boolean;
  registeredSprites: string[];
  errors: AssetLoadError[];
};

export class AssetRegistry {
  private readonly sprites = new Map<string, SpriteAsset>();

  register(id: string, source: string): void {
    this.registerSprite({ id, source });
  }

  registerSprite(asset: RenderSpriteAsset): SpriteAsset {
    const spriteAsset: SpriteAsset = {
      ...asset,
      type: "sprite"
    };
    this.sprites.set(asset.id, spriteAsset);
    return spriteAsset;
  }

  loadManifest(manifest: AssetManifest): AssetLoadResult {
    return loadAssetManifest(this, manifest);
  }

  get(id: string): string | undefined {
    return this.getSprite(id)?.source;
  }

  getSprite(id: string): SpriteAsset | undefined {
    return this.sprites.get(id);
  }

  requireSprite(id: string): SpriteAsset {
    const asset = this.getSprite(id);
    if (!asset) {
      throw new Error(`Sprite asset "${id}" is not registered.`);
    }

    return asset;
  }

  hasSprite(id: string): boolean {
    return this.sprites.has(id);
  }

  listSprites(): SpriteAsset[] {
    return [...this.sprites.values()];
  }
}

export function loadAssetManifest(registry: AssetRegistry, manifest: AssetManifest): AssetLoadResult {
  const sprites = manifest.sprites ?? [];
  const errors = validateManifestSprites(sprites);

  if (errors.length > 0) {
    return {
      ok: false,
      registeredSprites: [],
      errors
    };
  }

  const registeredSprites = sprites.map((sprite) => registry.registerSprite(sprite).id);

  return {
    ok: true,
    registeredSprites,
    errors: []
  };
}

function validateManifestSprites(sprites: AssetManifestSprite[]): AssetLoadError[] {
  const seenSprites = new Set<string>();
  const errors: AssetLoadError[] = [];

  for (const sprite of sprites) {
    const id = typeof sprite.id === "string" ? sprite.id.trim() : "";
    if (!id) {
      errors.push({
        assetId: sprite.id,
        code: "invalid-sprite-id",
        message: "Sprite asset id must be a non-empty string."
      });
      continue;
    }

    if (seenSprites.has(id)) {
      errors.push({
        assetId: sprite.id,
        code: "duplicate-sprite",
        message: `Sprite asset "${sprite.id}" is declared more than once in the manifest.`
      });
      continue;
    }

    seenSprites.add(id);
  }

  return errors;
}
