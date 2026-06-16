import type { RenderSpriteAsset } from "../adapter/index.js";

export type AssetRecord = {
  id: string;
  type: "sprite";
};

export type SpriteAsset = AssetRecord & RenderSpriteAsset & {
  type: "sprite";
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
