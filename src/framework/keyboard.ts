import { InputSystem } from "./input.js";

export class BrowserKeyboardBridge {
  private readonly pressedKeys = new Set<string>();

  constructor(private readonly input: InputSystem) {}

  attach(): void {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  detach(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (this.pressedKeys.has(event.key)) return;
    this.pressedKeys.add(event.key);
    this.input.press(normalizeKey(event.key));
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.key);
    this.input.release(normalizeKey(event.key));
  };

  private onBlur = (): void => {
    for (const key of this.pressedKeys) {
      this.input.release(normalizeKey(key));
    }
    this.pressedKeys.clear();
  };
}

function normalizeKey(key: string): string {
  return key.toLowerCase();
}
