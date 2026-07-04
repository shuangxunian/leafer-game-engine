import type { RenderScene } from "../adapter/render-types.js";
import {
  createRenderSceneViewport,
  getRenderSceneViewport,
  type RenderSceneViewport
} from "../adapter/render-types.js";

export type BrowserResizeRect = {
  readonly width?: number;
  readonly height?: number;
};

export type BrowserResizeEntry = {
  readonly contentRect?: BrowserResizeRect;
};

export type BrowserResizeBridgeTarget = {
  readonly clientWidth?: number;
  readonly clientHeight?: number;
  getBoundingClientRect?: () => BrowserResizeRect;
};

export type BrowserResizeObserverCallback = (entries: readonly BrowserResizeEntry[]) => void;

export type BrowserResizeObserverLike = {
  observe(target: BrowserResizeBridgeTarget): void;
  disconnect(): void;
};

export type BrowserResizeObserverFactory = (
  callback: BrowserResizeObserverCallback
) => BrowserResizeObserverLike;

export type BrowserResizeBridgeOptions = {
  readonly renderScene: Pick<RenderScene, "resize" | "width" | "height">;
  readonly target: BrowserResizeBridgeTarget;
  readonly observerFactory?: BrowserResizeObserverFactory;
};

export class BrowserResizeBridge {
  private attached = false;
  private observer?: BrowserResizeObserverLike;

  constructor(private readonly options: BrowserResizeBridgeOptions) {}

  attach(): RenderSceneViewport {
    if (this.attached) {
      return getRenderSceneViewport(this.options.renderScene);
    }

    const observer = (this.options.observerFactory ?? createDefaultBrowserResizeObserver)(this.onResize);
    observer.observe(this.options.target);
    this.observer = observer;
    this.attached = true;
    return this.sync();
  }

  sync(entry?: BrowserResizeEntry): RenderSceneViewport {
    const viewport = resolveBrowserResizeViewport(this.options.target, entry);
    if (!viewport) {
      return getRenderSceneViewport(this.options.renderScene);
    }

    return this.options.renderScene.resize(viewport.width, viewport.height);
  }

  detach(): void {
    if (!this.attached) return;

    this.attached = false;
    this.observer?.disconnect();
    this.observer = undefined;
  }

  private onResize = (entries: readonly BrowserResizeEntry[]): void => {
    this.sync(entries[0]);
  };
}

export function createBrowserResizeBridge(options: BrowserResizeBridgeOptions): BrowserResizeBridge {
  return new BrowserResizeBridge(options);
}

function resolveBrowserResizeViewport(
  target: BrowserResizeBridgeTarget,
  entry?: BrowserResizeEntry
): RenderSceneViewport | undefined {
  return (
    createBrowserResizeViewport(entry?.contentRect?.width, entry?.contentRect?.height) ??
    createBrowserResizeViewport(target.clientWidth, target.clientHeight) ??
    createBrowserResizeViewportFromRect(target)
  );
}

function createBrowserResizeViewportFromRect(
  target: BrowserResizeBridgeTarget
): RenderSceneViewport | undefined {
  if (!target.getBoundingClientRect) return undefined;

  const rect = target.getBoundingClientRect();
  return createBrowserResizeViewport(rect.width, rect.height);
}

function createBrowserResizeViewport(width: unknown, height: unknown): RenderSceneViewport | undefined {
  if (typeof width !== "number" || typeof height !== "number") return undefined;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return undefined;

  return createRenderSceneViewport(width, height);
}

function createDefaultBrowserResizeObserver(callback: BrowserResizeObserverCallback): BrowserResizeObserverLike {
  const ResizeObserverConstructor = globalThis.ResizeObserver;
  if (typeof ResizeObserverConstructor !== "function") {
    throw new Error("Browser resize bridge requires ResizeObserver or an observerFactory.");
  }

  const observer = new ResizeObserverConstructor((entries) => callback(entries));
  return {
    observe(target: BrowserResizeBridgeTarget): void {
      observer.observe(target as Element);
    },
    disconnect(): void {
      observer.disconnect();
    }
  };
}
