import { Game, type Scene } from "../core/index.js";
import { LeaferRenderAdapter, type RenderAdapter, type RenderScene } from "../adapter/index.js";

export type BrowserRuntimeOptions = {
  mount: string | HTMLElement;
  fixedDelta?: number;
  maxDeltaSeconds?: number;
  renderAdapter?: RenderAdapter;
};

export type BrowserRuntime = {
  game: Game;
  renderAdapter: RenderAdapter;
  renderScene: RenderScene;
  start(scene: Scene): void;
  stop(): void;
};

export function createBrowserRuntime(options: BrowserRuntimeOptions): BrowserRuntime {
  const game = new Game(options.fixedDelta);
  const renderAdapter = options.renderAdapter ?? new LeaferRenderAdapter();
  const renderScene = renderAdapter.createScene();
  renderScene.mount(options.mount);

  const maxDeltaSeconds = options.maxDeltaSeconds ?? 1 / 20;
  let previousTime = performance.now();
  let animationFrameId = 0;

  const frame = (now: number): void => {
    const deltaSeconds = Math.min((now - previousTime) / 1000, maxDeltaSeconds);
    previousTime = now;
    game.tick(deltaSeconds);
    animationFrameId = requestAnimationFrame(frame);
  };

  return {
    game,
    renderAdapter,
    renderScene,
    start(scene: Scene) {
      game.setScene(scene);
      previousTime = performance.now();
      animationFrameId = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(animationFrameId);
    }
  };
}
