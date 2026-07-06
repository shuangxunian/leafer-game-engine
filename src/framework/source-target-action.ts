import type { Entity } from "../core/index.js";
import {
  getSourceTargetSelectionPair,
  type EntitySelectionRef,
  type SourceTargetSelectionState
} from "./selection.js";

export type SourceTargetActionRef = Readonly<{
  entityId: number;
  entityName: string;
}>;

export type SourceTargetAction = Readonly<{
  type: string;
  source: SourceTargetActionRef;
  target: SourceTargetActionRef;
}>;

export type SourceTargetActionSnapshot = SourceTargetAction;

export type SourceTargetActionValidationResult = Readonly<
  | {
      allowed: true;
      status: "allowed";
      action: SourceTargetActionSnapshot;
    }
  | {
      allowed: false;
      status: "blocked";
      action: SourceTargetActionSnapshot;
      reason: string;
    }
>;

export function createSourceTargetAction(
  type: string,
  source: Entity,
  target: Entity
): SourceTargetAction {
  return {
    type: normalizeActionType(type),
    source: createSourceTargetActionRef(source),
    target: createSourceTargetActionRef(target)
  };
}

export function createSourceTargetActionFromSelection(
  type: string,
  state: SourceTargetSelectionState
): SourceTargetAction {
  const pair = getSourceTargetSelectionPair(state);
  if (!pair) {
    throw new Error("Cannot create a source-target action before selection is ready.");
  }

  return createSourceTargetActionFromSelectionPair(type, pair.source, pair.target);
}

export function getSourceTargetActionSnapshot(action: SourceTargetAction): SourceTargetActionSnapshot {
  return copySourceTargetAction(action);
}

export function allowSourceTargetAction(action: SourceTargetAction): SourceTargetActionValidationResult {
  return {
    allowed: true,
    status: "allowed",
    action: copySourceTargetAction(action)
  };
}

export function blockSourceTargetAction(
  action: SourceTargetAction,
  reason: string
): SourceTargetActionValidationResult {
  return {
    allowed: false,
    status: "blocked",
    action: copySourceTargetAction(action),
    reason: normalizeBlockedReason(reason)
  };
}

export function isSourceTargetActionAllowed(result: SourceTargetActionValidationResult): boolean {
  return result.allowed;
}

function createSourceTargetActionFromSelectionPair(
  type: string,
  source: EntitySelectionRef,
  target: EntitySelectionRef
): SourceTargetAction {
  return {
    type: normalizeActionType(type),
    source: createSourceTargetActionRef(source),
    target: createSourceTargetActionRef(target)
  };
}

function createSourceTargetActionRef(ref: Entity | EntitySelectionRef): SourceTargetActionRef {
  if ("id" in ref) {
    return {
      entityId: readEntityId(ref.id),
      entityName: readEntityName(ref.name)
    };
  }

  return {
    entityId: readEntityId(ref.entityId),
    entityName: readEntityName(ref.entityName)
  };
}

function copySourceTargetAction(action: SourceTargetAction): SourceTargetActionSnapshot {
  return {
    type: normalizeActionType(action.type),
    source: copySourceTargetActionRef(action.source, "Source-target action source"),
    target: copySourceTargetActionRef(action.target, "Source-target action target")
  };
}

function copySourceTargetActionRef(ref: SourceTargetActionRef, label: string): SourceTargetActionRef {
  return {
    entityId: readEntityId(ref.entityId, `${label} entityId`),
    entityName: readEntityName(ref.entityName, `${label} entityName`)
  };
}

function normalizeActionType(type: string): string {
  const normalized = type.trim();
  if (normalized.length === 0) {
    throw new Error("Source-target action type must be a non-empty string.");
  }

  return normalized;
}

function normalizeBlockedReason(reason: string): string {
  const normalized = reason.trim();
  if (normalized.length === 0) {
    throw new Error("Source-target action blocked reason must be a non-empty string.");
  }

  return normalized;
}

function readEntityId(value: number, label = "Source-target action entityId"): number {
  if (Number.isInteger(value) && value >= 0) return value;

  throw new Error(`${label} must be an integer greater than or equal to 0.`);
}

function readEntityName(value: string, label = "Source-target action entityName"): string {
  const normalized = value.trim();
  if (normalized.length > 0) return normalized;

  throw new Error(`${label} must be a non-empty string.`);
}
