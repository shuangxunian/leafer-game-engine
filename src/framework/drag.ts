import type { Entity } from "../core/index.js";

export type EntityDragPointerPosition = Readonly<{
  x: number;
  y: number;
}>;

export type EntityDragRef = Readonly<{
  entity: Entity;
  entityId: number;
  entityName: string;
}>;

export type EntityDragSnapshotRef = Readonly<{
  entityId: number;
  entityName: string;
}>;

export type EntityDragPhase = "idle" | "dragging";

export type EntityDragSnapshotPhase = EntityDragPhase | "completed" | "cancelled";

export type EntityDragState = Readonly<{
  phase: EntityDragPhase;
  subject?: EntityDragRef;
  startPosition?: EntityDragPointerPosition;
  currentPosition?: EntityDragPointerPosition;
}>;

export type EntityDragSnapshot = Readonly<{
  phase: EntityDragSnapshotPhase;
  subject?: EntityDragSnapshotRef;
  startPosition?: EntityDragPointerPosition;
  currentPosition?: EntityDragPointerPosition;
  delta: EntityDragPointerPosition;
  isActive: boolean;
}>;

export type EntityDragTransition = Readonly<{
  state: EntityDragState;
  snapshot: EntityDragSnapshot;
}>;

export function createEntityDragState(): EntityDragState {
  return {
    phase: "idle"
  };
}

export function startEntityDrag(
  _state: EntityDragState,
  entity: Entity,
  pointerPosition: EntityDragPointerPosition
): EntityDragState {
  return {
    phase: "dragging",
    subject: createEntityDragRef(entity),
    startPosition: copyPointerPosition(pointerPosition, "Entity drag start position"),
    currentPosition: copyPointerPosition(pointerPosition, "Entity drag current position")
  };
}

export function moveEntityDrag(
  state: EntityDragState,
  pointerPosition: EntityDragPointerPosition
): EntityDragState {
  assertActiveEntityDrag(state, "move");

  return {
    phase: "dragging",
    subject: copyEntityDragRef(state.subject),
    startPosition: copyPointerPosition(state.startPosition, "Entity drag start position"),
    currentPosition: copyPointerPosition(pointerPosition, "Entity drag current position")
  };
}

export function completeEntityDrag(
  state: EntityDragState,
  pointerPosition?: EntityDragPointerPosition
): EntityDragTransition {
  return finishEntityDrag(state, "completed", pointerPosition);
}

export function cancelEntityDrag(
  state: EntityDragState,
  pointerPosition?: EntityDragPointerPosition
): EntityDragTransition {
  return finishEntityDrag(state, "cancelled", pointerPosition);
}

export function isEntityDragActive(state: EntityDragState): boolean {
  return state.phase === "dragging" && state.subject !== undefined;
}

export function getEntityDragDelta(state: EntityDragState): EntityDragPointerPosition {
  if (!isEntityDragActive(state)) return { x: 0, y: 0 };

  const startPosition = copyPointerPosition(state.startPosition, "Entity drag start position");
  const currentPosition = copyPointerPosition(state.currentPosition, "Entity drag current position");

  return {
    x: currentPosition.x - startPosition.x,
    y: currentPosition.y - startPosition.y
  };
}

export function getEntityDragSnapshot(state: EntityDragState): EntityDragSnapshot {
  if (!isEntityDragActive(state)) {
    return {
      phase: "idle",
      subject: undefined,
      startPosition: undefined,
      currentPosition: undefined,
      delta: { x: 0, y: 0 },
      isActive: false
    };
  }

  return createEntityDragSnapshot(state, "dragging", true);
}

function finishEntityDrag(
  state: EntityDragState,
  phase: "completed" | "cancelled",
  pointerPosition?: EntityDragPointerPosition
): EntityDragTransition {
  assertActiveEntityDrag(state, phase === "completed" ? "complete" : "cancel");

  const finishedState =
    pointerPosition === undefined
      ? state
      : moveEntityDrag(state, pointerPosition);

  return {
    state: createEntityDragState(),
    snapshot: createEntityDragSnapshot(finishedState, phase, false)
  };
}

function createEntityDragRef(entity: Entity): EntityDragRef {
  return {
    entity,
    entityId: entity.id,
    entityName: entity.name
  };
}

function copyEntityDragRef(ref: EntityDragRef | undefined): EntityDragRef {
  if (!ref) {
    throw new Error("Cannot copy missing entity drag subject.");
  }

  return {
    entity: ref.entity,
    entityId: ref.entityId,
    entityName: ref.entityName
  };
}

function createEntityDragSnapshot(
  state: EntityDragState,
  phase: EntityDragSnapshotPhase,
  isActive: boolean
): EntityDragSnapshot {
  const subject = copyEntityDragRef(state.subject);

  return {
    phase,
    subject: {
      entityId: subject.entityId,
      entityName: subject.entityName
    },
    startPosition: copyPointerPosition(state.startPosition, "Entity drag start position"),
    currentPosition: copyPointerPosition(state.currentPosition, "Entity drag current position"),
    delta: getEntityDragDelta(state),
    isActive
  };
}

function copyPointerPosition(
  pointerPosition: EntityDragPointerPosition | undefined,
  label: string
): EntityDragPointerPosition {
  if (!pointerPosition) {
    throw new Error(`${label} is required.`);
  }

  return {
    x: readFiniteNumber(pointerPosition.x, `${label} x`),
    y: readFiniteNumber(pointerPosition.y, `${label} y`)
  };
}

function assertActiveEntityDrag(state: EntityDragState, action: "move" | "complete" | "cancel"): asserts state is
  EntityDragState & Required<Pick<EntityDragState, "subject" | "startPosition" | "currentPosition">> {
  if (!isEntityDragActive(state)) {
    throw new Error(`Cannot ${action} an entity drag before it starts.`);
  }
}

function readFiniteNumber(value: number, label: string): number {
  if (Number.isFinite(value)) return value;

  throw new Error(`${label} must be a finite number.`);
}
