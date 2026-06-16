import type { DebugSnapshot } from "./debug.js";
import { formatDebugSnapshot } from "./debug.js";

export class BrowserDebugOverlay {
  private element?: HTMLDivElement;

  constructor(private readonly target: HTMLElement = document.body) {}

  mount(): void {
    if (this.element) return;

    const element = document.createElement("div");
    element.setAttribute("data-leafer-game-debug", "true");
    Object.assign(element.style, {
      position: "fixed",
      right: "16px",
      bottom: "16px",
      zIndex: "9999",
      maxWidth: "320px",
      padding: "10px 12px",
      border: "1px solid rgba(255, 255, 255, 0.18)",
      borderRadius: "8px",
      background: "rgba(5, 13, 20, 0.82)",
      color: "#f6f3ea",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: "12px",
      lineHeight: "1.45",
      pointerEvents: "none",
      whiteSpace: "pre"
    });

    this.target.appendChild(element);
    this.element = element;
  }

  update(snapshot: DebugSnapshot): void {
    this.mount();
    if (!this.element) return;

    this.element.textContent = formatDebugSnapshot(snapshot).join("\n");
  }

  detach(): void {
    this.element?.remove();
    this.element = undefined;
  }
}
