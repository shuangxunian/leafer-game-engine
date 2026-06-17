import { InputSystem, getPointerButtonInputId, type PointerButton } from "./input.js";

export type BrowserPointerButtonBridgeTarget = {
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
};

export class BrowserPointerButtonBridge {
  private readonly pressedButtons = new Set<PointerButton>();
  private attached = false;

  constructor(
    private readonly input: InputSystem,
    private readonly target: BrowserPointerButtonBridgeTarget = window
  ) {}

  attach(): void {
    if (this.attached) return;

    this.attached = true;
    this.target.addEventListener("pointerdown", this.onPointerDown);
    this.target.addEventListener("pointerup", this.onPointerUp);
    this.target.addEventListener("pointercancel", this.onPointerCancel);
    this.target.addEventListener("blur", this.onBlur);
  }

  detach(): void {
    if (!this.attached) return;

    this.attached = false;
    this.target.removeEventListener("pointerdown", this.onPointerDown);
    this.target.removeEventListener("pointerup", this.onPointerUp);
    this.target.removeEventListener("pointercancel", this.onPointerCancel);
    this.target.removeEventListener("blur", this.onBlur);
    this.releaseAll();
  }

  private onPointerDown = (event: Event): void => {
    const button = getBrowserPointerButton(event);
    if (!button || this.pressedButtons.has(button)) return;

    this.pressedButtons.add(button);
    this.input.press(getPointerButtonInputId(button));
  };

  private onPointerUp = (event: Event): void => {
    const button = getBrowserPointerButton(event);
    if (!button) return;

    this.release(button);
  };

  private onPointerCancel = (): void => {
    this.releaseAll();
  };

  private onBlur = (): void => {
    this.releaseAll();
  };

  private release(button: PointerButton): void {
    if (!this.pressedButtons.delete(button)) return;

    this.input.release(getPointerButtonInputId(button));
  }

  private releaseAll(): void {
    for (const button of this.pressedButtons) {
      this.input.release(getPointerButtonInputId(button));
    }
    this.pressedButtons.clear();
  }
}

function getBrowserPointerButton(event: Event): PointerButton | undefined {
  const button = (event as { button?: unknown }).button;

  if (button === 0) return "primary";
  if (button === 1) return "auxiliary";
  if (button === 2) return "secondary";

  return undefined;
}
