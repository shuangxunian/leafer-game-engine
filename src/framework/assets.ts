export class AssetRegistry {
  private readonly assets = new Map<string, string>();

  register(id: string, source: string): void {
    this.assets.set(id, source);
  }

  get(id: string): string | undefined {
    return this.assets.get(id);
  }
}
