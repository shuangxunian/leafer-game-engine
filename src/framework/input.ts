import { System } from "../core/index.js";

export type KeyboardInputBinding = Readonly<{
  type: "keyboard";
  key: string;
}>;

export type PointerButton = "primary" | "secondary" | "auxiliary";

export type PointerButtonInputBinding = Readonly<{
  type: "pointer-button";
  button: PointerButton;
}>;

export type InputBinding = KeyboardInputBinding | PointerButtonInputBinding;

export type InputActionDefinition = Readonly<{
  id: string;
  bindings: readonly InputBinding[];
}>;

export type InputActionDefinitionInput = Readonly<{
  id: string;
  bindings?: readonly InputBinding[];
}>;

export class InputSystem extends System {
  override priority = -200;
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

export class InputActionMap {
  private readonly actions = new Map<string, InputActionDefinition>();

  constructor(actions: readonly InputActionDefinitionInput[] = []) {
    for (const action of actions) {
      this.registerAction(action);
    }
  }

  registerAction(action: InputActionDefinitionInput): this {
    const id = normalizeActionId(action.id);
    this.actions.set(id, {
      id,
      bindings: normalizeBindings(action.bindings ?? [])
    });
    return this;
  }

  removeAction(actionId: string): boolean {
    return this.actions.delete(normalizeActionId(actionId));
  }

  hasAction(actionId: string): boolean {
    return this.actions.has(normalizeActionId(actionId));
  }

  bind(actionId: string, binding: InputBinding): this {
    const id = normalizeActionId(actionId);
    const current = this.actions.get(id);
    const bindings = current ? [...current.bindings] : [];
    const normalized = normalizeBinding(binding);
    const bindingKey = getBindingKey(normalized);

    if (!bindings.some((candidate) => getBindingKey(candidate) === bindingKey)) {
      bindings.push(normalized);
    }

    this.actions.set(id, { id, bindings });
    return this;
  }

  unbind(actionId: string, binding: InputBinding): boolean {
    const id = normalizeActionId(actionId);
    const current = this.actions.get(id);
    if (!current) return false;

    const bindingKey = getBindingKey(normalizeBinding(binding));
    const bindings = current.bindings.filter((candidate) => getBindingKey(candidate) !== bindingKey);
    const changed = bindings.length !== current.bindings.length;

    if (changed) {
      this.actions.set(id, { id, bindings });
    }

    return changed;
  }

  getAction(actionId: string): InputActionDefinition | undefined {
    const action = this.actions.get(normalizeActionId(actionId));
    return action ? copyAction(action) : undefined;
  }

  listActions(): InputActionDefinition[] {
    return [...this.actions.values()].map(copyAction);
  }

  getBindings(actionId: string): InputBinding[] {
    return this.actions.get(normalizeActionId(actionId))?.bindings.map(copyBinding) ?? [];
  }

  getActionIdsForBinding(binding: InputBinding): string[] {
    const bindingKey = getBindingKey(normalizeBinding(binding));
    const actionIds: string[] = [];

    for (const action of this.actions.values()) {
      if (action.bindings.some((candidate) => getBindingKey(candidate) === bindingKey)) {
        actionIds.push(action.id);
      }
    }

    return actionIds;
  }

  isPressed(input: InputSystem, actionId: string): boolean {
    return this.getBindings(actionId).some((binding) => isBindingPressed(input, binding));
  }

  wasPressed(input: InputSystem, actionId: string): boolean {
    return this.getBindings(actionId).some((binding) => wasBindingPressed(input, binding));
  }
}

export function defineKeyboardBinding(key: string): KeyboardInputBinding {
  return {
    type: "keyboard",
    key: normalizeKeyboardKey(key)
  };
}

export function definePointerButtonBinding(button: string): PointerButtonInputBinding {
  return {
    type: "pointer-button",
    button: normalizePointerButton(button)
  };
}

export function normalizeKeyboardKey(key: string): string {
  if (typeof key !== "string" || key.length === 0) {
    throw new Error("Keyboard input binding key must be a non-empty string.");
  }

  return key.toLowerCase();
}

export function normalizePointerButton(button: string): PointerButton {
  if (typeof button !== "string" || button.trim().length === 0) {
    throw new Error("Pointer button input binding must be a non-empty string.");
  }

  const normalized = button.trim().toLowerCase();
  if (normalized === "primary" || normalized === "secondary" || normalized === "auxiliary") {
    return normalized;
  }

  throw new Error(`Unsupported pointer button "${button}".`);
}

export function getPointerButtonInputId(button: string): string {
  return `pointer:${normalizePointerButton(button)}`;
}

function normalizeActionId(id: string): string {
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new Error("Input action id must be a non-empty string.");
  }

  return id.trim();
}

function normalizeBindings(bindings: readonly InputBinding[]): InputBinding[] {
  const normalized: InputBinding[] = [];
  const seen = new Set<string>();

  for (const binding of bindings) {
    const candidate = normalizeBinding(binding);
    const key = getBindingKey(candidate);
    if (seen.has(key)) continue;

    normalized.push(candidate);
    seen.add(key);
  }

  return normalized;
}

function normalizeBinding(binding: InputBinding): InputBinding {
  if (binding.type === "keyboard") {
    return defineKeyboardBinding(binding.key);
  }

  if (binding.type === "pointer-button") {
    return definePointerButtonBinding(binding.button);
  }

  const unsupported = binding as { type?: unknown };
  throw new Error(`Unsupported input binding type "${String(unsupported.type)}".`);
}

function getBindingKey(binding: InputBinding): string {
  if (binding.type === "keyboard") {
    return `${binding.type}:${binding.key}`;
  }

  return `${binding.type}:${binding.button}`;
}

function isBindingPressed(input: InputSystem, binding: InputBinding): boolean {
  if (binding.type === "pointer-button") {
    return input.isPressed(getPointerButtonInputId(binding.button));
  }

  return input.isPressed(binding.key);
}

function wasBindingPressed(input: InputSystem, binding: InputBinding): boolean {
  if (binding.type === "pointer-button") {
    return input.wasPressed(getPointerButtonInputId(binding.button));
  }

  return input.wasPressed(binding.key);
}

function copyAction(action: InputActionDefinition): InputActionDefinition {
  return {
    id: action.id,
    bindings: action.bindings.map(copyBinding)
  };
}

function copyBinding(binding: InputBinding): InputBinding {
  return { ...binding };
}
