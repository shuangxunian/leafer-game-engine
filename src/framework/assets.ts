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

export type AssetLoadStatus = "registered" | "loading" | "loaded" | "failed";

export type AssetLoadState = {
  id: string;
  status: AssetLoadStatus;
  error?: string;
  loadedAt?: number;
};

export type SpriteAssetLoader = (asset: SpriteAsset) => Promise<void>;

export type BrowserImageSpriteLoaderImage = {
  src: string;
  crossOrigin: string | null;
  onload: (() => void) | null;
  onerror: ((error?: unknown) => void) | null;
};

export type BrowserImageSpriteLoaderOptions = {
  crossOrigin?: string | null;
  imageFactory?: () => BrowserImageSpriteLoaderImage;
};

export type SpriteLoadResult = {
  id: string;
  status: "loaded" | "failed" | "skipped";
  error?: string;
};

export type AsyncAssetManifestLoadResult = {
  ok: boolean;
  registeredSprites: string[];
  loadedSprites: string[];
  failedSprites: string[];
  skippedSprites: string[];
  errors: AssetLoadError[];
  loadResults: SpriteLoadResult[];
};

export class AssetRegistry {
  private readonly sprites = new Map<string, SpriteAsset>();
  private readonly spriteLoadStates = new Map<string, AssetLoadState>();

  register(id: string, source: string): void {
    this.registerSprite({ id, source });
  }

  registerSprite(asset: RenderSpriteAsset): SpriteAsset {
    const spriteAsset: SpriteAsset = {
      ...asset,
      type: "sprite"
    };
    this.sprites.set(asset.id, spriteAsset);
    this.spriteLoadStates.set(asset.id, {
      id: asset.id,
      status: "registered"
    });
    return spriteAsset;
  }

  async loadSprite(id: string, loader: SpriteAssetLoader): Promise<SpriteLoadResult> {
    const asset = this.getSprite(id);
    if (!asset) {
      return {
        id,
        status: "failed",
        error: `Sprite asset "${id}" is not registered.`
      };
    }

    const currentState = this.getSpriteLoadState(id);
    if (currentState?.status === "loaded") {
      return {
        id,
        status: "skipped"
      };
    }

    this.spriteLoadStates.set(id, {
      id,
      status: "loading"
    });

    try {
      await loader(asset);
      this.spriteLoadStates.set(id, {
        id,
        status: "loaded",
        loadedAt: Date.now()
      });
      return {
        id,
        status: "loaded"
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.spriteLoadStates.set(id, {
        id,
        status: "failed",
        error: message
      });
      return {
        id,
        status: "failed",
        error: message
      };
    }
  }

  loadManifest(manifest: AssetManifest): AssetLoadResult {
    return loadAssetManifest(this, manifest);
  }

  async loadManifestAsync(manifest: AssetManifest, loader: SpriteAssetLoader): Promise<AsyncAssetManifestLoadResult> {
    return loadAssetManifestAsync(this, manifest, loader);
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

  getSpriteLoadState(id: string): AssetLoadState | undefined {
    const state = this.spriteLoadStates.get(id);
    if (!state) return undefined;

    return { ...state };
  }

  listSpriteLoadStates(): AssetLoadState[] {
    return [...this.spriteLoadStates.values()].map((state) => ({ ...state }));
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

export async function loadAssetManifestAsync(
  registry: AssetRegistry,
  manifest: AssetManifest,
  loader: SpriteAssetLoader
): Promise<AsyncAssetManifestLoadResult> {
  const sprites = manifest.sprites ?? [];
  const errors = validateManifestSprites(sprites);

  if (errors.length > 0) {
    return {
      ok: false,
      registeredSprites: [],
      loadedSprites: [],
      failedSprites: [],
      skippedSprites: [],
      errors,
      loadResults: []
    };
  }

  const registeredSprites = sprites.map((sprite) => {
    if (registry.hasSprite(sprite.id)) return sprite.id;

    return registry.registerSprite(sprite).id;
  });
  const loadResults: SpriteLoadResult[] = [];

  for (const id of registeredSprites) {
    loadResults.push(await registry.loadSprite(id, loader));
  }

  const loadedSprites = loadResults.filter((result) => result.status === "loaded").map((result) => result.id);
  const failedSprites = loadResults.filter((result) => result.status === "failed").map((result) => result.id);
  const skippedSprites = loadResults.filter((result) => result.status === "skipped").map((result) => result.id);

  return {
    ok: failedSprites.length === 0,
    registeredSprites,
    loadedSprites,
    failedSprites,
    skippedSprites,
    errors: [],
    loadResults
  };
}

export function createBrowserImageSpriteLoader(options: BrowserImageSpriteLoaderOptions = {}): SpriteAssetLoader {
  const imageFactory = options.imageFactory ?? createDefaultBrowserImage;

  return async (asset) => {
    const source = typeof asset.source === "string" ? asset.source.trim() : "";
    if (!source) {
      throw new Error(`Sprite asset "${asset.id}" must define a source before browser image loading.`);
    }

    await new Promise<void>((resolve, reject) => {
      const image = imageFactory();
      let settled = false;

      const cleanup = () => {
        image.onload = null;
        image.onerror = null;
      };

      const settleLoaded = () => {
        if (settled) return;

        settled = true;
        cleanup();
        resolve();
      };

      const settleFailed = (error?: unknown) => {
        if (settled) return;

        settled = true;
        cleanup();
        const detail = error instanceof Error && error.message ? ` ${error.message}` : "";
        reject(new Error(`Failed to load sprite asset "${asset.id}" from "${source}".${detail}`));
      };

      image.onload = settleLoaded;
      image.onerror = settleFailed;

      if (options.crossOrigin !== undefined) {
        image.crossOrigin = options.crossOrigin;
      }

      image.src = source;
    });
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

function createDefaultBrowserImage(): BrowserImageSpriteLoaderImage {
  if (typeof Image === "undefined") {
    throw new Error("Browser image sprite loading requires global Image or an imageFactory option.");
  }

  return new Image() as unknown as BrowserImageSpriteLoaderImage;
}
