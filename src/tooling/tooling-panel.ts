import type { ComponentSchemaSnapshot, DebugSnapshot, SceneInspectorSnapshot, ToolingSnapshot } from "./debug.js";
import { formatComponentSchemaSnapshot, formatDebugSnapshot, formatSceneInspectorSnapshot } from "./debug.js";

export type ToolingPanelSection = {
  title: string;
  lines: string[];
};

export type ToolingPanelSelection = {
  selectedEntityId?: number;
};

export function createRuntimeDebugPanelSection(snapshot: DebugSnapshot): ToolingPanelSection {
  return {
    title: "Runtime Debug",
    lines: formatDebugSnapshot(snapshot)
  };
}

export function createEntityInspectorPanelSection(
  snapshot: SceneInspectorSnapshot,
  selection: ToolingPanelSelection = {}
): ToolingPanelSection {
  const lines = [`Scene ${snapshot.sceneName}`, ...formatSceneInspectorSnapshot(snapshot).slice(1)];

  if (selection.selectedEntityId !== undefined) {
    const selected = snapshot.entities.find((entity) => entity.id === selection.selectedEntityId);
    lines.splice(2, 0, selected ? `Selected #${selected.id} ${selected.name}` : `Selected #${selection.selectedEntityId} missing`);

    if (selected) {
      const selectedRow = `- #${selected.id} `;
      const rowIndex = lines.findIndex((line) => line.startsWith(selectedRow));
      if (rowIndex >= 0) {
        lines[rowIndex] = `>${lines[rowIndex].slice(1)}`;
      }
    }
  }

  return {
    title: "Entity Inspector",
    lines
  };
}

export function createComponentSchemasPanelSection(snapshot: ComponentSchemaSnapshot): ToolingPanelSection {
  return {
    title: "Component Schemas",
    lines: formatComponentSchemaSnapshot(snapshot)
  };
}

export function createToolingPanelSections(snapshot: ToolingSnapshot, selection: ToolingPanelSelection = {}): ToolingPanelSection[] {
  const sections = [createRuntimeDebugPanelSection(snapshot.debug)];

  if (snapshot.inspector) {
    sections.push(createEntityInspectorPanelSection(snapshot.inspector, selection));
  }

  if (snapshot.schemas) {
    sections.push(createComponentSchemasPanelSection(snapshot.schemas));
  }

  return sections;
}

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
      whiteSpace: "normal"
    });

    this.target.appendChild(element);
    this.element = element;
  }

  update(snapshot: ToolingSnapshot): void {
    this.mount();
    if (!this.element) return;

    this.renderSections(createToolingPanelSections(snapshot));
  }

  detach(): void {
    this.element?.remove();
    this.element = undefined;
  }

  private renderSections(sections: ToolingPanelSection[]): void {
    if (!this.element) return;

    this.element.replaceChildren(
      ...sections.map((section) => {
        const sectionElement = document.createElement("section");
        Object.assign(sectionElement.style, {
          margin: "0 0 12px"
        });

        const titleElement = document.createElement("div");
        titleElement.textContent = section.title;
        Object.assign(titleElement.style, {
          margin: "0 0 6px",
          color: "#f7cf68",
          fontWeight: "700",
          letterSpacing: "0.04em",
          textTransform: "uppercase"
        });

        const bodyElement = document.createElement("pre");
        bodyElement.textContent = section.lines.join("\n");
        Object.assign(bodyElement.style, {
          margin: "0",
          color: "#f6f3ea",
          font: "inherit",
          whiteSpace: "pre-wrap"
        });

        sectionElement.append(titleElement, bodyElement);
        return sectionElement;
      })
    );
  }
}
