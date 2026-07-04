import { Game, type Scene } from "../core/index.js";
import { LeaferRenderAdapter, type RenderAdapter, type RenderScene } from "../adapter/index.js";
import {
  createBrowserResizeBridge,
  type BrowserResizeBridge,
  type BrowserResizeBridgeTarget,
  type BrowserResizeObserverFactory
} from "./browser-resize.js";
import { createAnimationFrameLoop } from "./frame-loop.js";
import { createRuntimeController } from "./runtime-controller.js";

export type BrowserRuntimeResizeOptions = {
  readonly target?: BrowserResizeBridgeTarget;
  readonly observerFactory?: BrowserResizeObserverFactory;
};

export type BrowserRuntimeOptions = {
  mount: string | HTMLElement;
  fixedDelta?: number;
  maxDeltaSeconds?: number;
  renderAdapter?: RenderAdapter;
  resize?: boolean | BrowserRuntimeResizeOptions;
};

export type BrowserRuntime = {
  game: Game;
  renderAdapter: RenderAdapter;
  renderScene: RenderScene;
  resizeBridge?: BrowserResizeBridge;
  start(scene: Scene): void;
  stop(): void;
};

export function createBrowserRuntime(options: BrowserRuntimeOptions): BrowserRuntime {
  const game = new Game(options.fixedDelta);
  const renderAdapter = options.renderAdapter ?? new LeaferRenderAdapter();
  const renderScene = renderAdapter.createScene();
  renderScene.mount(options.mount);
  const resizeBridge = createBrowserRuntimeResizeBridge(options, renderScene);
  resizeBridge?.attach();

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
    resizeBridge,
    start(scene: Scene) {
      resizeBridge?.attach();
      controller.start(scene);
    },
    stop() {
      controller.stop();
      resizeBridge?.detach();
    }
  };
}

function createBrowserRuntimeResizeBridge(
  options: BrowserRuntimeOptions,
  renderScene: RenderScene
): BrowserResizeBridge | undefined {
  if (!options.resize) return undefined;

  const resizeOptions = options.resize === true ? {} : options.resize;
  const target = resizeOptions.target ?? resolveBrowserRuntimeResizeTarget(options.mount);

  return createBrowserResizeBridge({
    renderScene,
    target,
    observerFactory: resizeOptions.observerFactory
  });
}

function resolveBrowserRuntimeResizeTarget(mount: string | HTMLElement): BrowserResizeBridgeTarget {
  if (typeof mount !== "string") return mount;

  const element = document.getElementById(mount);
  if (!element) throw new Error("Browser runtime resize target not found.");

  return element;
}
