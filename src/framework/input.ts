import { System } from "../core/index.js";

export class InputSystem extends System {
  private pressed = new Set<string>();
  private justPressed = new Set<string>();

  press(action: string): void {
    if (!this.pressed.has(action)) {
      this.justPressed.add(action);
    }
    this.pressed.add(action);
  }

  release(action: string): void {
    this.pressed.delete(action);
  }

  isPressed(action: string): boolean {
    return this.pressed.has(action);
  }

  wasPressed(action: string): boolean {
    return this.justPressed.has(action);
  }

  override lateUpdate(): void {
    this.justPressed.clear();
  }
}
