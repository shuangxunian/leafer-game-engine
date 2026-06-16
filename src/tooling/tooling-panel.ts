import type { ToolingSnapshot } from "./debug.js";
import { formatToolingSnapshot } from "./debug.js";

export class BrowserToolingPanel {
  private element?: HTMLDivElement;

  constructor(private readonly target: HTMLElement = document.body) {}

  mount(): void {
    if (this.element) return;

    const element = document.createElement("div");
    element.setAttribute("data-leafer-game-tooling", "true");
    Object.assign(element.style, {
      position: "fixed",
      right: "16px",
      top: "16px",
      zIndex: "9999",
      width: "min(420px, calc(100vw - 32px))",
      maxHeight: "calc(100vh - 32px)",
      overflow: "auto",
      padding: "12px 14px",
      border: "1px solid rgba(255, 255, 255, 0.18)",
      borderRadius: "12px",
      background: "rgba(5, 13, 20, 0.88)",
      boxShadow: "0 18px 48px rgba(0, 0, 0, 0.28)",
      color: "#f6f3ea",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: "12px",
      lineHeight: "1.5",
      pointerEvents: "none",
      whiteSpace: "pre-wrap"
    });

    this.target.appendChild(element);
    this.element = element;
  }

  update(snapshot: ToolingSnapshot): void {
    this.mount();
    if (!this.element) return;

    this.element.textContent = formatToolingSnapshot(snapshot).join("\n");
  }

  detach(): void {
    this.element?.remove();
    this.element = undefined;
  }
}
