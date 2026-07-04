import test from "node:test";
import assert from "node:assert/strict";

function installLeaferDomStubs() {
  class CanvasRenderingContext2DStub {
    createConicGradient() {
      return {};
    }
  }

  class Path2DStub {}

  class HTMLCanvasElementStub {
    constructor() {
      this.style = {};
      this.classList = { add() {} };
      this.parentElement = undefined;
      this.width = 0;
      this.height = 0;
    }

    getContext() {
      return new CanvasRenderingContext2DStub();
    }

    toDataURL() {
      return "data:image/png;base64,";
    }

    toBlob(callback) {
      callback(new Blob());
    }
  }

  class ImageStub {
    setAttribute() {}
  }

  class HTMLElementStub {
    constructor() {
      this.style = {};
      this.classList = { add() {} };
      this.children = [];
      this.parentElement = undefined;
      this.clientWidth = 0;
      this.clientHeight = 0;
    }

    appendChild(child) {
      this.children.push(child);
      child.parentElement = this;
    }

    removeChild(child) {
      this.children = this.children.filter((entry) => entry !== child);
      child.parentElement = undefined;
    }

    hasChildNodes() {
      return this.children.length > 0;
    }

    getBoundingClientRect() {
      return { x: 0, y: 0, width: this.clientWidth, height: this.clientHeight };
    }
  }

  const documentStub = {
    body: new HTMLElementStub(),
    createElement(tagName) {
      if (tagName === "canvas") return new HTMLCanvasElementStub();
      return new HTMLElementStub();
    },
    getElementById() {
      return undefined;
    }
  };

  Object.defineProperties(globalThis, {
    CanvasRenderingContext2D: { configurable: true, value: CanvasRenderingContext2DStub },
    DragEvent: { configurable: true, value: class DragEventStub {} },
    HTMLCanvasElement: { configurable: true, value: HTMLCanvasElementStub },
    HTMLElement: { configurable: true, value: HTMLElementStub },
    Image: { configurable: true, value: ImageStub },
    Path2D: { configurable: true, value: Path2DStub },
    PointerEvent: { configurable: true, value: class PointerEventStub {} },
    devicePixelRatio: { configurable: true, value: 1 },
    document: { configurable: true, value: documentStub },
    window: {
      configurable: true,
      value: {
        addEventListener() {},
        removeEventListener() {},
        requestAnimationFrame(callback) {
          return setTimeout(callback, 0);
        }
      }
    }
  });
}

installLeaferDomStubs();

async function createAdapter() {
  const { LeaferRenderAdapter } = await import("../lib/adapter/index.js");
  return new LeaferRenderAdapter();
}

test("leafer sprite adapter maps image source to the native render node", async () => {
  const adapter = await createAdapter();
  const sprite = adapter.createSprite();

  sprite.setAsset({
    id: "hero",
    source: "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E",
    width: 48,
    height: 56,
    cornerRadius: 8
  });

  assert.equal(sprite.nativeNode.url, "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E");
  assert.deepEqual(sprite.nativeNode.fill, {
    type: "image",
    mode: "stretch",
    url: "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E"
  });
  assert.equal(sprite.nativeNode.width, 48);
  assert.equal(sprite.nativeNode.height, 56);
  assert.equal(sprite.nativeNode.cornerRadius, 8);
});

test("leafer sprite adapter clears stale image source for fill-only assets", async () => {
  const adapter = await createAdapter();
  const sprite = adapter.createSprite();

  sprite.setAsset({
    id: "hero",
    source: "/assets/hero.png",
    width: 32,
    height: 32
  });
  sprite.setAsset({
    id: "shadow",
    fill: "#333333",
    width: 24,
    height: 12,
    cornerRadius: 6
  });

  assert.equal(sprite.nativeNode.url, "");
  assert.equal(sprite.nativeNode.fill, "#333333");
  assert.equal(sprite.nativeNode.width, 24);
  assert.equal(sprite.nativeNode.height, 12);
  assert.equal(sprite.nativeNode.cornerRadius, 6);
});

test("leafer render scene resize updates viewport state", async () => {
  const adapter = await createAdapter();
  const scene = adapter.createScene();

  const viewport = scene.resize(375, 667);

  assert.deepEqual(viewport, { width: 375, height: 667 });
  assert.equal(scene.width, 375);
  assert.equal(scene.height, 667);

  viewport.width = 999;
  assert.equal(scene.width, 375);
});

test("leafer render scene resize rejects invalid viewport dimensions", async () => {
  const adapter = await createAdapter();
  const scene = adapter.createScene();

  assert.throws(
    () => scene.resize(0, 640),
    /Render scene viewport width must be a finite number greater than 0/
  );
  assert.throws(
    () => scene.resize(960, Number.NaN),
    /Render scene viewport height must be a finite number greater than 0/
  );

  assert.equal(scene.width, 960);
  assert.equal(scene.height, 640);
});

test("browser runtime resize option attaches bridge and tears it down on stop", async () => {
  const { createBrowserRuntime } = await import("../lib/runtime/browser-runtime.js");
  const mountedTargets = [];
  const resizeCalls = [];
  let width = 960;
  let height = 640;
  const renderScene = {
    root: {},
    layers: {},
    get width() {
      return width;
    },
    get height() {
      return height;
    },
    mount(target) {
      mountedTargets.push(target);
    },
    resize(nextWidth, nextHeight) {
      width = nextWidth;
      height = nextHeight;
      const viewport = { width, height };
      resizeCalls.push(viewport);
      return { ...viewport };
    },
    destroy() {}
  };
  const renderAdapter = {
    createScene() {
      return renderScene;
    }
  };
  const mount = { clientWidth: 500, clientHeight: 300 };
  const observer = {
    observeCount: 0,
    disconnectCount: 0,
    observe() {
      this.observeCount += 1;
    },
    disconnect() {
      this.disconnectCount += 1;
    }
  };

  const runtime = createBrowserRuntime({
    mount,
    renderAdapter,
    resize: {
      observerFactory() {
        return observer;
      }
    }
  });

  assert.equal(runtime.resizeBridge !== undefined, true);
  assert.deepEqual(mountedTargets, [mount]);
  assert.equal(observer.observeCount, 1);
  assert.deepEqual(resizeCalls, [{ width: 500, height: 300 }]);

  runtime.stop();

  assert.equal(observer.disconnectCount, 1);
});
