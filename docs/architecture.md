# Leafer 2D Game Framework Architecture

## Design Principle

Leafer is the presentation foundation, not the place where gameplay rules live.

The framework keeps gameplay logic, render mapping, and platform concerns separate so that the codebase can evolve toward tools, editors, replay, and more than one game project.

## Layering

### 1. Platform

Responsibilities:

- Normalize runtime environment differences
- Provide time, input, storage, audio, and network drivers
- Keep browser or host APIs out of core gameplay logic

### 2. Render Adapter

Responsibilities:

- Translate game world state into render tree operations
- Define stable render interfaces for sprites, text, containers, and scenes
- Host the Leafer-specific implementation

Rules:

- Engine core must not import Leafer directly
- Gameplay code must not manipulate Leafer nodes directly

### 3. Engine Core

Responsibilities:

- Game loop and time management
- Scene lifecycle
- Entity, component, and system orchestration
- Event flow and update scheduling

Stable objects:

- `Game`
- `Scene`
- `World`
- `Entity`
- `Component`
- `System`
- `Time`

### 4. Game Framework

Responsibilities:

- Reusable gameplay-facing modules
- Input collection
- Camera state
- Collision checks
- Animation state helpers
- Asset registration and lookup

This layer should be reusable across multiple games.

### 5. Content

Responsibilities:

- Game-specific scenes
- Characters, maps, UI, rules, and data
- Composition of framework modules into actual gameplay

## Cross-Cutting Layers

### Data

Data should drive:

- scene descriptions
- entity templates
- component configuration
- animation definitions
- gameplay tuning values

### Tooling

Tooling should support:

- debug overlays
- scene inspection
- collision visualization
- runtime stats
- future replay and snapshot support

## Dependency Direction

Use this dependency chain:

`Content -> Framework -> Engine Core -> Render Adapter -> Leafer`

`Content -> Framework -> Engine Core -> Platform`

Never reverse it.

## MVP Scope

The first milestone includes:

- scene management
- entity and component lifecycle
- update and fixed update loops
- camera state
- simple input state
- rectangle collision
- animation state machine shell
- asset registry
- debug stats snapshot

## Current Implementation Strategy

This repository starts with:

- a TypeScript runtime skeleton
- render abstractions
- a placeholder Leafer adapter
- a tiny sample scene proving the flow

The next implementation step is wiring the adapter to real Leafer objects and rendering a playable sample.
