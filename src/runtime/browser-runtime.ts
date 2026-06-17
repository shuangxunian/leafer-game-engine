import { Game, type Scene } from "../core/index.js";
import { LeaferRenderAdapter, type RenderAdapter, type RenderScene } from "../adapter/index.js";
import { createAnimationFrameLoop } from "./frame-loop.js";
import { createRuntimeController } from "./runtime-controller.js";

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
  const loop = createAnimationFrameLoop((_now, deltaMilliseconds) => {
    const deltaSeconds = Math.min(deltaMilliseconds / 1000, maxDeltaSeconds);
    game.tick(deltaSeconds);
  });
  const controller = createRuntimeController({ game, loop });

  return {
    game,
    renderAdapter,
    renderScene,
    start(scene: Scene) {
      controller.start(scene);
    },
    stop() {
      controller.stop();
    }
  };
}
