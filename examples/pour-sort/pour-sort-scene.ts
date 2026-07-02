import { Scene, System } from "@shuangxunian/leafer-game-engine/core";
import type { Entity } from "@shuangxunian/leafer-game-engine/core";
import type { RenderAdapter, RenderScene, RenderText } from "@shuangxunian/leafer-game-engine/adapter";
import {
  InputSystem,
  attachActorSpriteView,
  createHudText,
  createSourceTargetSelectionState,
  defineActorTemplate,
  getPointerButtonInputId,
  getSourceTargetSelectionPair,
  instantiateEntityTemplate,
  pickTopEntityAtPoint,
  selectSourceTargetSource,
  selectSourceTargetTarget
} from "@shuangxunian/leafer-game-engine/framework";
import type { SourceTargetSelectionState } from "@shuangxunian/leafer-game-engine/framework";

const BOTTLE_WIDTH = 74;
const BOTTLE_HEIGHT = 168;
const BOTTLE_GAP = 28;
const BOTTLE_TOP = 250;
const BOTTLE_LAYER = "bottle";

const BOTTLES = [
  { id: "bottle-a", label: "A", fill: "#6cb7ff" },
  { id: "bottle-b", label: "B", fill: "#ffcf7a" },
  { id: "bottle-c", label: "C", fill: "#91d18b" },
  { id: "bottle-d", label: "D", fill: "#d69df8" }
] as const;

export type PourSortGameplaySnapshot = Readonly<{
  bottleNames: string[];
  phase: SourceTargetSelectionState["phase"];
  sourceName?: string;
  targetName?: string;
}>;

export class PourSortScene extends Scene {
  private readonly bottleEntities: Entity[] = [];
  private selection = createSourceTargetSelectionState();
  private statusNode?: RenderText;
  private hintNode?: RenderText;
  private selectionSystem?: PourSortSelectionSystem;

  constructor(
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene
  ) {
    super("PourSortScene");
  }

  getGameplaySnapshot(): PourSortGameplaySnapshot {
    return {
      bottleNames: this.bottleEntities.map((entity) => entity.name),
      phase: this.selection.phase,
      sourceName: this.selection.source?.entityName,
      targetName: this.selection.target?.entityName
    };
  }

  protected onStart(): void {
    const input = new InputSystem(this);
    this.addSystem(input);

    this.createBoard();
    this.createHud();

    this.selectionSystem = new PourSortSelectionSystem(
      this,
      input,
      this.bottleEntities,
      () => this.selection,
      (selection) => {
        this.selection = selection;
        this.syncHud();
      }
    );
    this.addSystem(this.selectionSystem);
    this.syncHud();
  }

  override destroy(): void {
    super.destroy();
    this.renderScene.destroy();
  }

  private createBoard(): void {
    const totalWidth = BOTTLES.length * BOTTLE_WIDTH + (BOTTLES.length - 1) * BOTTLE_GAP;
    const startX = Math.max(24, (this.renderScene.width - totalWidth) / 2);

    BOTTLES.forEach((bottle, index) => {
      const entity = instantiateEntityTemplate(
        this,
        defineActorTemplate({
          name: bottle.id,
          x: startX + index * (BOTTLE_WIDTH + BOTTLE_GAP),
          y: BOTTLE_TOP,
          width: BOTTLE_WIDTH,
          height: BOTTLE_HEIGHT,
          collider: { layer: BOTTLE_LAYER }
        })
      );
      attachActorSpriteView(entity, {
        renderAdapter: this.renderAdapter,
        renderScene: this.renderScene,
        asset: {
          id: bottle.id,
          fill: bottle.fill,
          width: BOTTLE_WIDTH,
          height: BOTTLE_HEIGHT,
          cornerRadius: 18
        }
      });
      this.bottleEntities.push(entity);

      createHudText(this.renderAdapter, this.renderScene, {
        text: bottle.label,
        x: startX + index * (BOTTLE_WIDTH + BOTTLE_GAP) + BOTTLE_WIDTH / 2 - 6,
        y: BOTTLE_TOP + BOTTLE_HEIGHT + 18,
        fontSize: 20
      });
    });
  }

  private createHud(): void {
    createHudText(this.renderAdapter, this.renderScene, {
      text: "Pour Sort Shell",
      x: 24,
      y: 22,
      fontSize: 30
    });
    this.statusNode = createHudText(this.renderAdapter, this.renderScene, {
      text: "",
      x: 24,
      y: 62,
      fontSize: 18
    });
    this.hintNode = createHudText(this.renderAdapter, this.renderScene, {
      text: "",
      x: 24,
      y: 92,
      fontSize: 16
    });
  }

  private syncHud(): void {
    const pair = getSourceTargetSelectionPair(this.selection);
    if (pair) {
      this.statusNode?.setText(`Source ${pair.source.entityName} -> target ${pair.target.entityName}`);
      this.hintNode?.setText("Selection pair captured. Pour rules land in the next gameplay slice.");
      return;
    }

    if (this.selection.source) {
      this.statusNode?.setText(`Source ${this.selection.source.entityName} selected`);
      this.hintNode?.setText("Pick another bottle as the target.");
      return;
    }

    this.statusNode?.setText("Pick a source bottle.");
    this.hintNode?.setText("This shell validates pointer position, picking, and source-target selection only.");
  }
}

class PourSortSelectionSystem extends System {
  override priority = 50;

  constructor(
    scene: Scene,
    private readonly input: InputSystem,
    private readonly bottles: readonly Entity[],
    private readonly getSelection: () => SourceTargetSelectionState,
    private readonly setSelection: (selection: SourceTargetSelectionState) => void
  ) {
    super(scene);
  }

  override update(): void {
    if (!this.input.wasPressed(getPointerButtonInputId("primary"))) return;

    const pointer = this.input.getPointerPosition();
    if (!pointer) return;

    const hit = pickTopEntityAtPoint(pointer, this.bottles, {
      rectSource: "collider",
      layer: BOTTLE_LAYER
    });
    if (!hit) return;

    const selection = this.getSelection();
    if (!selection.source || selection.target) {
      this.setSelection(selectSourceTargetSource(selection, hit.entity));
      return;
    }

    if (selection.source.entityId === hit.entityId) {
      this.setSelection(selectSourceTargetSource(selection, hit.entity));
      return;
    }

    this.setSelection(selectSourceTargetTarget(selection, hit.entity));
  }
}
