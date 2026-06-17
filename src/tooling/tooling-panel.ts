import type {
  ComponentSchemaSnapshot,
  DebugAssetSnapshot,
  DebugGameFlowSnapshot,
  DebugSnapshot,
  InspectorComponentSnapshot,
  InspectorPrimitive,
  SceneInspectorSnapshot,
  SpriteAnimationSnapshot,
  ToolingSnapshot
} from "./debug.js";
import {
  formatComponentSchemaSnapshot,
  formatDebugAssetSnapshot,
  formatDebugGameFlowSnapshot,
  formatDebugSnapshot,
  formatSceneInspectorSnapshot,
  formatSpriteAnimationSnapshot
} from "./debug.js";

export type ToolingPanelSection = {
  title: string;
  lines: string[];
};

export type ToolingPanelSelection = {
  selectedEntityId?: number;
};

const ENTITY_ROW_PATTERN = /^[->] #(\d+) /;

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

export function createAssetsPanelSection(snapshot: DebugAssetSnapshot): ToolingPanelSection {
  return {
    title: "Assets",
    lines: formatDebugAssetSnapshot(snapshot)
  };
}

export function createGameFlowPanelSection(snapshot: DebugGameFlowSnapshot): ToolingPanelSection {
  return {
    title: "Game Flow",
    lines: formatDebugGameFlowSnapshot(snapshot)
  };
}

export function createSpriteAnimationsPanelSection(snapshot: SpriteAnimationSnapshot): ToolingPanelSection {
  return {
    title: "Sprite Animations",
    lines: formatSpriteAnimationSnapshot(snapshot)
  };
}

export function createSelectedEntityDetailPanelSection(
  snapshot: SceneInspectorSnapshot,
  selection: Required<ToolingPanelSelection>,
  schemas?: ComponentSchemaSnapshot
): ToolingPanelSection {
  const selected = snapshot.entities.find((entity) => entity.id === selection.selectedEntityId);
  if (!selected) {
    return {
      title: "Selected Entity",
      lines: [`Entity #${selection.selectedEntityId} missing`]
    };
  }

  const state = selected.destroyed ? "destroyed" : selected.active ? "active" : "inactive";
  const lines = [
    `#${selected.id} ${selected.name}`,
    `State ${state}`,
    `Components ${selected.componentCount}`
  ];

  for (const component of selected.components) {
    lines.push(formatSelectedComponentDetail(component, schemas));
    lines.push(...formatSelectedComponentSchemaFields(component, schemas));
  }

  return {
    title: "Selected Entity",
    lines
  };
}

export function parseToolingPanelEntityRowId(line: string): number | undefined {
  const match = ENTITY_ROW_PATTERN.exec(line);
  if (!match) return undefined;

  return Number(match[1]);
}

export function createToolingPanelSections(snapshot: ToolingSnapshot, selection: ToolingPanelSelection = {}): ToolingPanelSection[] {
  const sections = [createRuntimeDebugPanelSection(snapshot.debug)];

  if (snapshot.debug.flow) {
    sections.push(createGameFlowPanelSection(snapshot.debug.flow));
  }

  if (snapshot.debug.assets) {
    sections.push(createAssetsPanelSection(snapshot.debug.assets));
  }

  if (snapshot.animations) {
    sections.push(createSpriteAnimationsPanelSection(snapshot.animations));
  }

  if (snapshot.inspector) {
    sections.push(createEntityInspectorPanelSection(snapshot.inspector, selection));

    if (selection.selectedEntityId !== undefined) {
      sections.push(
        createSelectedEntityDetailPanelSection(snapshot.inspector, {
          selectedEntityId: selection.selectedEntityId
        }, snapshot.schemas)
      );
    }
  }

  if (snapshot.schemas) {
    sections.push(createComponentSchemasPanelSection(snapshot.schemas));
  }

  return sections;
}

export class BrowserToolingPanel {
  private element?: HTMLDivElement;
  private selectedEntityId?: number;
  private snapshot?: ToolingSnapshot;

  constructor(private readonly target: HTMLElement = document.body) {}

  getSelectedEntityId(): number | undefined {
    return this.selectedEntityId;
  }

  selectEntity(entityId: number): void {
    this.selectedEntityId = entityId;
    this.renderCurrentSnapshot();
  }

  clearSelection(): void {
    this.selectedEntityId = undefined;
    this.renderCurrentSnapshot();
  }

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
      pointerEvents: "auto",
      whiteSpace: "normal"
    });

    this.target.appendChild(element);
    this.element = element;
  }

  update(snapshot: ToolingSnapshot): void {
    this.mount();
    if (!this.element) return;

    this.snapshot = snapshot;
    this.renderCurrentSnapshot();
  }

  detach(): void {
    this.element?.remove();
    this.element = undefined;
  }

  private renderCurrentSnapshot(): void {
    if (!this.snapshot) return;

    this.renderSections(
      createToolingPanelSections(this.snapshot, {
        selectedEntityId: this.selectedEntityId
      })
    );
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

        const bodyElement = document.createElement("div");
        Object.assign(bodyElement.style, {
          margin: "0",
          color: "#f6f3ea",
          font: "inherit",
          whiteSpace: "pre-wrap"
        });
        bodyElement.append(...section.lines.map((line) => this.createLineElement(line)));

        sectionElement.append(titleElement, bodyElement);
        return sectionElement;
      })
    );
  }

  private createLineElement(line: string): HTMLDivElement {
    const lineElement = document.createElement("div");
    lineElement.textContent = line;

    const entityId = parseToolingPanelEntityRowId(line);
    if (entityId === undefined) return lineElement;

    lineElement.setAttribute("role", "button");
    lineElement.setAttribute("tabindex", "0");
    lineElement.setAttribute("data-leafer-game-entity-id", String(entityId));
    lineElement.title = `Select entity #${entityId}`;
    Object.assign(lineElement.style, {
      cursor: "pointer",
      borderRadius: "6px",
      padding: "1px 4px",
      marginLeft: "-4px"
    });
    lineElement.addEventListener("click", (event) => {
      event.stopPropagation();
      this.selectEntity(entityId);
    });
    lineElement.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      event.stopPropagation();
      this.selectEntity(entityId);
    });

    return lineElement;
  }
}

function formatSelectedComponentDetail(component: InspectorComponentSnapshot, schemas?: ComponentSchemaSnapshot): string {
  const schema = findComponentSchema(component, schemas);
  const label = schema?.label ? ` (${schema.label})` : "";
  const data = Object.entries(component.data);
  const dataText = data.length ? ` data=${data.map(([key, value]) => `${key}:${String(value)}`).join(",")}` : "";

  return `- ${component.name}${label} enabled=${component.enabled} started=${component.started} destroyed=${component.destroyed}${dataText}`;
}

function formatSelectedComponentSchemaFields(component: InspectorComponentSnapshot, schemas?: ComponentSchemaSnapshot): string[] {
  const schema = findComponentSchema(component, schemas);
  if (!schema) return [];

  return schema.fields.map((field) => {
    const value = component.data[field.name];
    const valueText = formatSchemaFieldValue(value, Boolean(field.required));
    const requiredText = field.required ? " required" : "";
    const defaultText = field.default === undefined ? "" : ` default=${String(field.default)}`;
    const descriptionText = field.description ? ` - ${field.description}` : "";

    return `  - ${field.name}: ${field.type}${requiredText}${defaultText} value=${valueText}${descriptionText}`;
  });
}

function findComponentSchema(component: InspectorComponentSnapshot, schemas?: ComponentSchemaSnapshot) {
  return schemas?.schemas.find((schema) => schema.component === component.name);
}

function formatSchemaFieldValue(value: InspectorPrimitive | undefined, required: boolean): string {
  if (value !== undefined) return String(value);

  return required ? "<missing>" : "<unset>";
}
