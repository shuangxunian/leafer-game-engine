# Scene Config Boundary

## Purpose

`leaferGame` scene config support is part of the frontend 2D game engine package.

It gives downstream games a JSON-like way to declare static boot-time scene content, validate that content in Node-safe tests, and optionally stop bootstrap before runtime state is mutated.

It is not a visual scene editor, component editor, asset manager, save-file format, content publishing workflow, remote content pipeline, or authoring product.

## Layers

### Asset Manifest Data

Scene configs can include an `assets` section backed by the existing framework asset manifest model:

- `sprites` declare renderable sprite assets.
- `frames` declare sprite animation frame metadata.
- `clips` declare sprite animation clips.
- Validation reuses asset manifest diagnostics.

Asset config is still plain engine data. Browser image loading remains an explicit runtime concern through `loadManifestAsync(...)` and a caller-provided loader.

### Entity Template Data

Scene configs can include an `entities` section backed by entity templates:

- `name` gives the entity a readable runtime name.
- `components` declare framework component types and component data.
- Built-in component template types currently include `transform`, `size`, `collider`, and `velocity`.
- Custom component templates can be registered through `EntityTemplateRegistry`.

This layer is useful for static boot-time entities. Runtime-random entities, render-node wiring, controller closures, and gameplay-specific services should remain code-driven.

### System Declarations

Scene configs can include a `systems` section when the caller provides a `SceneSystemRegistry`.

System config is intentionally registry-backed so downstream games decide which system types are allowed. Validation reports missing or unknown system types before bootstrap when requested.

## Validation

Use `validateSceneConfig(...)` from `/framework` when a game wants deterministic diagnostics without mutating runtime state:

```ts
import { validateSceneConfig } from "@shuangxunian/leafer-game-engine/framework";

const validation = validateSceneConfig(sceneConfig, {
  assets,
  entityRegistry,
  systemRegistry
});
```

Validation returns:

- `ok`
- `errors`
- stable error `code`
- stable error `path`
- readable `message`

Validation does not register assets, create entities, add systems, or call system factories. It may instantiate component template data in isolation to convert expected component data problems into diagnostics.

## Safe Bootstrap

Use `bootstrapSceneFromConfig(...)` with `validateBeforeBootstrap: true` when a game wants scene config diagnostics before mutation:

```ts
import { bootstrapSceneFromConfig } from "@shuangxunian/leafer-game-engine/framework";

const result = bootstrapSceneFromConfig(scene, sceneConfig, {
  assets,
  entityRegistry,
  systemRegistry,
  validateBeforeBootstrap: true
});

if (result.validation && !result.validation.ok) {
  // Report diagnostics and do not continue scene startup.
}
```

When validation fails in this mode, bootstrap returns empty `entities` and `systems`, does not register assets, and includes the validation result.

Default bootstrap behavior remains compatible for callers that do not opt into validation.

## Example Consumption

`examples/dodge-blocks` consumes scene config as a downstream-style game:

- `createDodgeBlocksSceneConfig(...)` declares static boot-time content.
- The config's `assets` section is used for async browser resource preloading.
- The config's `entities` section creates the player's `transform`, `size`, and `collider` components.
- The example opts into safe bootstrap through `validateBeforeBootstrap: true`.
- Player render view, input controller, sprite animation component, and dynamic hazard spawning remain code-driven.

This split is intentional. Scene config should carry stable static data; gameplay behavior and runtime-generated content should stay in code until a reusable engine abstraction emerges.

## Tooling Relationship

Scene config diagnostics are package-facing engine data. They can be logged, tested, or displayed by read-only tooling, but they are not an editor model.

Tooling may observe validation results and runtime state. Tooling should not mutate scene config, entities, components, systems, assets, or input bindings inside this package.

## Current Limitations

The current scene config scope intentionally does not include:

- async validation
- remote asset existence checks
- render-node declarations
- serialized gameplay state
- save-file migration
- prefab inheritance
- editor UI
- drag-and-drop scene authoring
- component value editing
- asset browser workflows

Those capabilities can be added later only if they remain reusable package APIs or live in an independent upper-layer editor project.

## Consumer Guidance

Use scene config for static boot-time content that benefits from data review and deterministic tests.

Keep runtime behavior, render adapter objects, closures, random spawning, input mapping ownership, service wiring, and content authoring workflows outside scene config until they become reusable engine contracts.
