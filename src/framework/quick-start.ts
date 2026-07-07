import type { Scene } from "../core/index.js";
import { InputSystem } from "./input.js";
import { BrowserKeyboardBridge, type BrowserKeyboardBridgeTarget } from "./keyboard.js";
import {
  BrowserPointerButtonBridge,
  BrowserPointerPositionBridge,
  createBrowserPointerLocalPositionResolver,
  type BrowserPointerButtonBridgeTarget,
  type BrowserPointerLocalPositionTarget,
  type BrowserPointerPositionResolver
} from "./pointer.js";

export type SceneInputBridgeKind = "keyboard" | "pointer-button" | "pointer-position";

export type SceneInputBridgeHandle = Readonly<{
  kind: SceneInputBridgeKind;
  attach(): void;
  detach(): void;
}>;

export type SceneKeyboardBridgeOptions = Readonly<{
  target?: BrowserKeyboardBridgeTarget;
}>;

export type ScenePointerButtonBridgeOptions = Readonly<{
  target?: BrowserPointerButtonBridgeTarget;
}>;

export type ScenePointerPositionBridgeOptions = Readonly<{
  target?: BrowserPointerButtonBridgeTarget;
  resolver?: BrowserPointerPositionResolver;
  localTarget?: BrowserPointerLocalPositionTarget;
}>;

export type SceneInputBridgeBundleOptions = Readonly<{
  keyboard?: boolean | SceneKeyboardBridgeOptions;
  pointerButtons?: boolean | ScenePointerButtonBridgeOptions;
  pointerPosition?: boolean | ScenePointerPositionBridgeOptions;
  autoAttach?: boolean;
  detachOnSceneDestroy?: boolean;
}>;

export type SceneInputBridgeBundle = Readonly<{
  input: InputSystem;
  bridges: readonly SceneInputBridgeHandle[];
  keyboard?: BrowserKeyboardBridge;
  pointerButtons?: BrowserPointerButtonBridge;
  pointerPosition?: BrowserPointerPositionBridge;
  detachOnSceneDestroy: boolean;
  attach(): void;
  detach(): void;
}>;

export function createSceneInputBridgeBundle(
  scene: Scene,
  options: SceneInputBridgeBundleOptions = {}
): SceneInputBridgeBundle {
  const input = scene.getSystem(InputSystem);
  if (!input) {
    throw new Error(`Scene "${scene.name}" must install InputSystem before creating quick-start input bridges.`);
  }

  const bridges: SceneInputBridgeHandle[] = [];
  const keyboardOptions = getBridgeOptions(options.keyboard);
  const pointerButtonOptions = getBridgeOptions(options.pointerButtons);
  const pointerPositionOptions = getBridgeOptions(options.pointerPosition);

  const keyboard = isBridgeEnabled(options.keyboard)
    ? new BrowserKeyboardBridge(input, keyboardOptions.target)
    : undefined;
  if (keyboard) {
    bridges.push(createBridgeHandle("keyboard", keyboard));
  }

  const pointerButtons = isBridgeEnabled(options.pointerButtons)
    ? new BrowserPointerButtonBridge(input, pointerButtonOptions.target)
    : undefined;
  if (pointerButtons) {
    bridges.push(createBridgeHandle("pointer-button", pointerButtons));
  }

  const pointerPositionResolver =
    pointerPositionOptions.resolver ??
    (pointerPositionOptions.localTarget
      ? createBrowserPointerLocalPositionResolver(pointerPositionOptions.localTarget)
      : undefined);
  const pointerPosition = isBridgeEnabled(options.pointerPosition)
    ? new BrowserPointerPositionBridge(input, pointerPositionOptions.target, pointerPositionResolver)
    : undefined;
  if (pointerPosition) {
    bridges.push(createBridgeHandle("pointer-position", pointerPosition));
  }

  let attached = false;
  const attach = (): void => {
    if (attached) return;

    for (const bridge of bridges) {
      bridge.attach();
    }
    attached = true;
  };
  const detach = (): void => {
    if (!attached) return;

    for (const bridge of [...bridges].reverse()) {
      bridge.detach();
    }
    attached = false;
  };

  const detachOnSceneDestroy = options.detachOnSceneDestroy ?? true;
  if (detachOnSceneDestroy) {
    installSceneDestroyCleanup(scene, detach);
  }

  const bundleBridges = Object.freeze([...bridges]);
  const bundle: SceneInputBridgeBundle = Object.freeze({
    input,
    bridges: bundleBridges,
    keyboard,
    pointerButtons,
    pointerPosition,
    detachOnSceneDestroy,
    attach,
    detach
  });

  if (options.autoAttach ?? true) {
    bundle.attach();
  }

  return bundle;
}

function createBridgeHandle(
  kind: SceneInputBridgeKind,
  bridge: Pick<SceneInputBridgeHandle, "attach" | "detach">
): SceneInputBridgeHandle {
  return Object.freeze({
    kind,
    attach: () => bridge.attach(),
    detach: () => bridge.detach()
  });
}

function installSceneDestroyCleanup(scene: Scene, cleanup: () => void): void {
  const destroyScene = scene.destroy.bind(scene);
  scene.destroy = (): void => {
    cleanup();
    destroyScene();
  };
}

function isBridgeEnabled<TOptions extends object>(option: boolean | TOptions | undefined): boolean {
  return option !== undefined && option !== false;
}

function getBridgeOptions<TOptions extends object>(option: boolean | TOptions | undefined): TOptions {
  if (typeof option === "object" && option !== null) {
    return option;
  }

  return {} as TOptions;
}
