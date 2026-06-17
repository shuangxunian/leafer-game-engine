import type { Scene } from "../core/index.js";
import { System } from "../core/index.js";
import { EventBus } from "./events.js";
import { RuntimeScheduler, type SchedulerUpdateResult } from "./scheduler.js";

export type RuntimeServicesOptions<TEvents extends object = Record<string, unknown>> = {
  eventBus?: EventBus<TEvents>;
  scheduler?: RuntimeScheduler;
};

export type RuntimeServicesClearResult = Readonly<{
  eventListenerCount: number;
  scheduledTaskCount: number;
}>;

export class RuntimeServices<TEvents extends object = Record<string, unknown>> {
  public readonly eventBus: EventBus<TEvents>;
  public readonly scheduler: RuntimeScheduler;

  constructor(options: RuntimeServicesOptions<TEvents> = {}) {
    this.eventBus = options.eventBus ?? new EventBus<TEvents>();
    this.scheduler = options.scheduler ?? new RuntimeScheduler();
  }

  clear(): RuntimeServicesClearResult {
    return Object.freeze({
      eventListenerCount: this.eventBus.clear(),
      scheduledTaskCount: this.scheduler.clear()
    });
  }
}

export type RuntimeServicesSystemOptions<TEvents extends object = Record<string, unknown>> =
  RuntimeServicesOptions<TEvents> & {
    services?: RuntimeServices<TEvents>;
    updateScheduler?: boolean;
    clearOnDestroy?: boolean;
    priority?: number;
  };

export class RuntimeServicesSystem<TEvents extends object = Record<string, unknown>> extends System {
  public readonly services: RuntimeServices<TEvents>;
  public lastSchedulerUpdate?: SchedulerUpdateResult;
  private readonly updateScheduler: boolean;
  private readonly clearOnDestroy: boolean;

  constructor(
    scene: Scene,
    options: RuntimeServicesSystemOptions<TEvents> = {}
  ) {
    super(scene);

    this.priority = options.priority ?? -250;
    this.services = options.services ?? createRuntimeServices<TEvents>(options);
    this.updateScheduler = options.updateScheduler ?? true;
    this.clearOnDestroy = options.clearOnDestroy ?? true;
  }

  override update(deltaSeconds: number): void {
    if (!this.updateScheduler) return;

    this.lastSchedulerUpdate = this.services.scheduler.update(deltaSeconds);
  }

  override destroy(): void {
    if (this.clearOnDestroy) {
      this.services.clear();
    }
  }
}

export function createRuntimeServices<TEvents extends object = Record<string, unknown>>(
  options: RuntimeServicesOptions<TEvents> = {}
): RuntimeServices<TEvents> {
  return new RuntimeServices<TEvents>(options);
}

export function addRuntimeServices<TEvents extends object = Record<string, unknown>>(
  scene: Scene,
  options: RuntimeServicesSystemOptions<TEvents> = {}
): RuntimeServicesSystem<TEvents> {
  return scene.addSystem(new RuntimeServicesSystem<TEvents>(scene, options));
}

export function getRuntimeServices<TEvents extends object = Record<string, unknown>>(
  scene: Scene
): RuntimeServices<TEvents> | undefined {
  return scene.getSystem(RuntimeServicesSystem)?.services as RuntimeServices<TEvents> | undefined;
}
