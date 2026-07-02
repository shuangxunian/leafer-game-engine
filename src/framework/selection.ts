import type { Entity } from "../core/index.js";

export type EntitySelectionRef = Readonly<{
  entity: Entity;
  entityId: number;
  entityName: string;
}>;

export type SourceTargetSelectionPhase = "empty" | "source-selected" | "target-selected";

export type SourceTargetSelectionState = Readonly<{
  phase: SourceTargetSelectionPhase;
  source?: EntitySelectionRef;
  target?: EntitySelectionRef;
}>;

export type SourceTargetSelectionPair = Readonly<{
  source: EntitySelectionRef;
  target: EntitySelectionRef;
}>;

export type SelectSourceTargetTargetOptions = Readonly<{
  allowSameEntity?: boolean;
}>;

export function createSourceTargetSelectionState(): SourceTargetSelectionState {
  return {
    phase: "empty"
  };
}

export function selectSourceTargetSource(
  state: SourceTargetSelectionState,
  entity: Entity
): SourceTargetSelectionState {
  return {
    phase: "source-selected",
    source: createEntitySelectionRef(entity)
  };
}

export function selectSourceTargetTarget(
  state: SourceTargetSelectionState,
  entity: Entity,
  options: SelectSourceTargetTargetOptions = {}
): SourceTargetSelectionState {
  if (!state.source) {
    throw new Error("Cannot select a source-target target before selecting a source.");
  }

  if (!options.allowSameEntity && state.source.entityId === entity.id) {
    throw new Error("Cannot select the same entity as both source and target.");
  }

  return {
    phase: "target-selected",
    source: copyEntitySelectionRef(state.source),
    target: createEntitySelectionRef(entity)
  };
}

export function clearSourceTargetTarget(state: SourceTargetSelectionState): SourceTargetSelectionState {
  if (!state.source) return createSourceTargetSelectionState();

  return {
    phase: "source-selected",
    source: copyEntitySelectionRef(state.source)
  };
}

export function clearSourceTargetSelection(): SourceTargetSelectionState {
  return createSourceTargetSelectionState();
}

export function getSourceTargetSelectionPair(
  state: SourceTargetSelectionState
): SourceTargetSelectionPair | undefined {
  if (!state.source || !state.target) return undefined;

  return {
    source: copyEntitySelectionRef(state.source),
    target: copyEntitySelectionRef(state.target)
  };
}

export function createEntitySelectionRef(entity: Entity): EntitySelectionRef {
  return {
    entity,
    entityId: entity.id,
    entityName: entity.name
  };
}

function copyEntitySelectionRef(ref: EntitySelectionRef): EntitySelectionRef {
  return {
    entity: ref.entity,
    entityId: ref.entityId,
    entityName: ref.entityName
  };
}
