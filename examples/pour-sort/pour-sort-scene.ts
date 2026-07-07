import { Scene, System } from "@shuangxunian/leafer-game-engine/core";
import type { Entity } from "@shuangxunian/leafer-game-engine/core";
import type { RenderAdapter, RenderScene, RenderSprite, RenderText } from "@shuangxunian/leafer-game-engine/adapter";
import {
  InputSystem,
  attachActorSpriteView,
  allowSourceTargetAction,
  blockSourceTargetAction,
  clearSourceTargetSelection,
  createHudText,
  createSceneRuntimePreset,
  createSourceTargetActionFromSelection,
  createSourceTargetSelectionState,
  defineActorTemplate,
  getPointerButtonInputId,
  getSourceTargetActionSnapshot,
  getSourceTargetSelectionPair,
  getSourceTargetSelectionSnapshot,
  instantiateEntityTemplate,
  pickTopEntityAtPoint,
  selectSourceTargetSource,
  selectSourceTargetTarget
} from "@shuangxunian/leafer-game-engine/framework";
import type {
  SourceTargetActionSnapshot,
  SourceTargetActionValidationResult,
  SourceTargetSelectionState
} from "@shuangxunian/leafer-game-engine/framework";

const BOTTLE_WIDTH = 74;
const BOTTLE_HEIGHT = 168;
const BOTTLE_GAP = 28;
const BOTTLE_TOP = 250;
const BOTTLE_LAYER = "bottle";
const BOTTLE_CAPACITY = 2;
const LIQUID_HEIGHT = 58;
const LIQUID_INSET = 10;

const BOTTLES = [
  { id: "bottle-a", label: "A", initial: ["blue", "yellow"] },
  { id: "bottle-b", label: "B", initial: ["yellow", "blue"] },
  { id: "bottle-c", label: "C", initial: [] },
  { id: "bottle-d", label: "D", initial: [] }
] as const;

const LIQUID_COLORS = {
  blue: "#6cb7ff",
  yellow: "#ffcf7a"
} as const;

type LiquidColor = keyof typeof LIQUID_COLORS;
type PuzzlePhase = "playing" | "won";

type BottleRuntime = {
  entity: Entity;
  label: string;
  colors: LiquidColor[];
  x: number;
  y: number;
};

export type PourSortGameplaySnapshot = Readonly<{
  bottles: ReadonlyArray<Readonly<{
    colors: readonly LiquidColor[];
    name: string;
  }>>;
  moves: number;
  puzzlePhase: PuzzlePhase;
  selectionPhase: SourceTargetSelectionState["phase"];
  sourceName?: string;
  targetName?: string;
  lastAction?: SourceTargetActionSnapshot;
  lastActionStatus?: SourceTargetActionValidationResult["status"];
  lastActionReason?: string;
}>;

export class PourSortScene extends Scene {
  private readonly bottles: BottleRuntime[] = [];
  private readonly liquidNodes: RenderSprite[] = [];
  private selection = createSourceTargetSelectionState();
  private lastActionResult?: SourceTargetActionValidationResult;
  private moves = 0;
  private puzzlePhase: PuzzlePhase = "playing";
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
    const selection = getSourceTargetSelectionSnapshot(this.selection);
    const blockedReason = this.lastActionResult && !this.lastActionResult.allowed
      ? this.lastActionResult.reason
      : undefined;

    return {
      bottles: this.bottles.map((bottle) => ({
        colors: [...bottle.colors],
        name: bottle.entity.name
      })),
      moves: this.moves,
      puzzlePhase: this.puzzlePhase,
      selectionPhase: selection.phase,
      sourceName: selection.source?.entityName,
      targetName: selection.target?.entityName,
      lastAction: this.lastActionResult
        ? getSourceTargetActionSnapshot(this.lastActionResult.action)
        : undefined,
      lastActionStatus: this.lastActionResult?.status,
      lastActionReason: blockedReason
    };
  }

  protected onStart(): void {
    const { input } = createSceneRuntimePreset(this, { input: true });
    if (!input) throw new Error("InputSystem was not initialized.");

    this.createBoard();
    this.createHud();

    this.selectionSystem = new PourSortSelectionSystem(
      this,
      input,
      this.bottles.map((bottle) => bottle.entity),
      () => this.selection,
      (selection) => {
        this.applySelection(selection);
      }
    );
    this.addSystem(this.selectionSystem);
    this.renderLiquids();
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
          fill: "#244056",
          width: BOTTLE_WIDTH,
          height: BOTTLE_HEIGHT,
          cornerRadius: 18
        }
      });
      this.bottles.push({
        entity,
        label: bottle.label,
        colors: [...bottle.initial] as LiquidColor[],
        x: startX + index * (BOTTLE_WIDTH + BOTTLE_GAP),
        y: BOTTLE_TOP
      });

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

  private applySelection(selection: SourceTargetSelectionState): void {
    if (this.puzzlePhase === "won") {
      this.selection = clearSourceTargetSelection();
      this.syncHud();
      return;
    }

    const pair = getSourceTargetSelectionPair(selection);
    if (!pair) {
      this.selection = selection;
      this.syncHud();
      return;
    }

    const source = this.findBottle(pair.source.entityId);
    const target = this.findBottle(pair.target.entityId);
    const action = createSourceTargetActionFromSelection("pour", selection);
    if (!source || !target) {
      this.lastActionResult = blockSourceTargetAction(action, "Selected bottle disappeared.");
      this.selection = clearSourceTargetSelection();
      this.syncHud("Selected bottle disappeared.");
      return;
    }

    const result = pourTopColor(source.colors, target.colors, BOTTLE_CAPACITY);
    this.selection = clearSourceTargetSelection();

    if (!result.ok) {
      this.lastActionResult = blockSourceTargetAction(action, result.reason);
      this.syncHud(result.reason);
      return;
    }

    this.lastActionResult = allowSourceTargetAction(action);
    source.colors = result.source;
    target.colors = result.target;
    this.moves += 1;
    this.puzzlePhase = isPourSortSolved(this.bottles.map((bottle) => bottle.colors), BOTTLE_CAPACITY)
      ? "won"
      : "playing";
    this.renderLiquids();
    this.syncHud(`Poured ${result.color} from ${source.label} to ${target.label}.`);
  }

  private syncHud(message?: string): void {
    if (this.puzzlePhase === "won") {
      this.statusNode?.setText(`Solved in ${this.moves} moves.`);
      this.hintNode?.setText("The puzzle loop is example-owned; engine helpers only supplied input, picking, and selection.");
      return;
    }

    const pair = getSourceTargetSelectionPair(this.selection);
    if (pair) {
      this.statusNode?.setText(`Source ${pair.source.entityName} -> target ${pair.target.entityName}`);
      this.hintNode?.setText(message ?? "Trying the move.");
      return;
    }

    if (this.selection.source) {
      this.statusNode?.setText(`Source ${this.selection.source.entityName} selected`);
      this.hintNode?.setText(message ?? "Pick another bottle as the target.");
      return;
    }

    this.statusNode?.setText(`Moves ${this.moves}. Pick a source bottle.`);
    this.hintNode?.setText(message ?? "Pour matching top colors into empty or matching bottles.");
  }

  private renderLiquids(): void {
    this.liquidNodes.forEach((node) => node.destroy());
    this.liquidNodes.length = 0;

    for (const bottle of this.bottles) {
      bottle.colors.forEach((color, index) => {
        const node = this.renderAdapter.createSprite();
        node.setAsset({
          id: `${bottle.entity.name}-${color}-${index}`,
          fill: LIQUID_COLORS[color],
          width: BOTTLE_WIDTH - LIQUID_INSET * 2,
          height: LIQUID_HEIGHT,
          cornerRadius: 10
        });
        node.x = bottle.x + LIQUID_INSET;
        node.y = bottle.y + BOTTLE_HEIGHT - LIQUID_INSET - LIQUID_HEIGHT * (index + 1);
        this.renderScene.layers.world.addChild(node);
        this.liquidNodes.push(node);
      });
    }
  }

  private findBottle(entityId: number): BottleRuntime | undefined {
    return this.bottles.find((bottle) => bottle.entity.id === entityId);
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

type PourResult =
  | Readonly<{
      color: LiquidColor;
      ok: true;
      source: LiquidColor[];
      target: LiquidColor[];
    }>
  | Readonly<{
      ok: false;
      reason: string;
    }>;

export function pourTopColor(
  source: readonly LiquidColor[],
  target: readonly LiquidColor[],
  capacity = BOTTLE_CAPACITY
): PourResult {
  if (source.length === 0) {
    return { ok: false, reason: "Source bottle is empty." };
  }

  if (target.length >= capacity) {
    return { ok: false, reason: "Target bottle is full." };
  }

  const color = source[source.length - 1];
  const targetTop = target[target.length - 1];
  if (targetTop !== undefined && targetTop !== color) {
    return { ok: false, reason: "Top colors do not match." };
  }

  return {
    color,
    ok: true,
    source: source.slice(0, -1),
    target: [...target, color]
  };
}

export function isPourSortSolved(
  bottles: readonly (readonly LiquidColor[])[],
  capacity = BOTTLE_CAPACITY
): boolean {
  return bottles.every((bottle) => {
    if (bottle.length === 0) return true;
    if (bottle.length !== capacity) return false;
    return bottle.every((color) => color === bottle[0]);
  });
}
