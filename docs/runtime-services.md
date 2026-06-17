# Runtime Services Boundary

## Purpose

`leaferGame` runtime services are part of the frontend 2D game engine package.

They give downstream games a small, deterministic way to coordinate cross-system behavior without coupling every system directly to every other system.

They are not an editor service container, visual scripting runtime, app framework, network bus, analytics SDK, or browser dashboard.

## Layers

### Event Bus

`EventBus` is a synchronous, deterministic event primitive in `framework`.

It supports:

- `on(...)` subscriptions
- `once(...)` one-shot subscriptions
- explicit unsubscribe handles
- listener removal by handler
- listener cleanup with `clear(...)`
- stable event envelopes with type, payload, timestamp, and sequence metadata
- deterministic listener ordering, including listener mutation during dispatch

Use it for gameplay/runtime communication such as damage events, scene events, audio triggers, checkpoint notifications, and UI-facing game state signals.

Avoid using it as a global editor message bus or cross-process transport.

### Runtime Scheduler

`RuntimeScheduler` is an update-driven task scheduler in `framework`.

It supports:

- one-shot delayed tasks
- repeated interval tasks
- cancellation by task id
- scheduler cleanup with `clear(...)`
- deterministic due-time ordering
- catch-up behavior when a large `dt` advances multiple intervals

The scheduler advances only when game code calls `update(dt)`. It does not depend on `setTimeout`, `setInterval`, DOM APIs, workers, or browser animation frames.

### Runtime Services

`RuntimeServices` groups the default coordination services:

- `eventBus`
- `scheduler`

Consumers can create standalone services with `createRuntimeServices(...)`, or inject an existing `EventBus` / `RuntimeScheduler` when they need shared ownership in tests or custom scene setup.

### Scene Integration

`RuntimeServicesSystem` is the opt-in scene integration point.

It lets a scene own runtime services and can advance the scheduler during scene updates:

```ts
import { Scene } from "@shuangxunian/leafer-game-engine/core";
import {
  addRuntimeServices,
  getRuntimeServices
} from "@shuangxunian/leafer-game-engine/framework";

const scene = new Scene("GameScene");
addRuntimeServices(scene);

const services = getRuntimeServices(scene);
services?.eventBus.emit("game:start", { levelId: "level-1" });
```

This integration stays optional. A `Scene` does not automatically own runtime services.

### Tooling Visibility

Tooling exposes read-only runtime services observability:

- `createToolingSnapshot(scene, { runtimeServices: true })`
- `createRuntimeServicesSnapshot(...)`
- `formatRuntimeServicesSnapshot(...)`
- `createRuntimeServicesPanelSection(...)`

The snapshot can show whether services are installed, system priority, scheduler update settings, listener count, emitted event count, scheduler elapsed time, scheduled task count, and the latest scheduler update result.

Tooling does not mutate listeners, events, scheduled tasks, services, scenes, or systems.

## Current Limitations

The current sprint intentionally does not include:

- global app/service containers
- dependency injection frameworks
- editor service graphs
- visual scripting
- cross-scene event routing
- network transport
- worker-thread scheduling
- cron-like scheduling
- analytics SDK integration
- browser-only dashboards as the source of truth

Those capabilities can be added in future engine stages only if they remain reusable package APIs and do not turn this repository into an editor product.

## Consumer Guidance

Use `@shuangxunian/leafer-game-engine/framework` for runtime services:

```ts
import {
  EventBus,
  RuntimeScheduler,
  addRuntimeServices,
  createRuntimeServices,
  getRuntimeServices
} from "@shuangxunian/leafer-game-engine/framework";
```

Use `@shuangxunian/leafer-game-engine/tooling` for read-only runtime services observability:

```ts
import {
  createToolingSnapshot,
  formatRuntimeServicesSnapshot
} from "@shuangxunian/leafer-game-engine/tooling";
```

Keep project-specific event names, payload shapes, scheduling choices, and scene orchestration in downstream games. Move only reusable coordination primitives back into the engine package.
