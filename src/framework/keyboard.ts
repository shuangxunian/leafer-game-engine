import { InputSystem, normalizeKeyboardKey } from "./input.js";

export type BrowserKeyboardBridgeTarget = {
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
};

export class BrowserKeyboardBridge {
  private readonly pressedKeys = new Set<string>();
  private attached = false;

  constructor(
    private readonly input: InputSystem,
    private readonly target: BrowserKeyboardBridgeTarget = window
  ) {}

  attach(): void {
    if (this.attached) return;

    this.attached = true;
    this.target.addEventListener("keydown", this.onKeyDown);
    this.target.addEventListener("keyup", this.onKeyUp);
    this.target.addEventListener("blur", this.onBlur);
  }

  detach(): void {
    if (!this.attached) return;

    this.attached = false;
    this.target.removeEventListener("keydown", this.onKeyDown);
    this.target.removeEventListener("keyup", this.onKeyUp);
    this.target.removeEventListener("blur", this.onBlur);
    this.onBlur();
  }

  private onKeyDown = (event: Event): void => {
    const key = getBrowserKeyboardKey(event);
    if (!key || this.pressedKeys.has(key)) return;

    this.pressedKeys.add(key);
    this.input.press(normalizeKeyboardKey(key));
  };

  private onKeyUp = (event: Event): void => {
    const key = getBrowserKeyboardKey(event);
    if (!key) return;

    this.pressedKeys.delete(key);
    this.input.release(normalizeKeyboardKey(key));
  };

  private onBlur = (): void => {
    for (const key of this.pressedKeys) {
      this.input.release(normalizeKeyboardKey(key));
    }
    this.pressedKeys.clear();
  };
}

function getBrowserKeyboardKey(event: Event): string | undefined {
  const key = (event as { key?: unknown }).key;
  return typeof key === "string" ? key : undefined;
}
