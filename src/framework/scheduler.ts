export type SchedulerTaskContext = Readonly<{
  id: number;
  elapsedSeconds: number;
  scheduledTimeSeconds: number;
  firedCount: number;
}>;

export type SchedulerTaskCallback = (context: SchedulerTaskContext) => void;

export type SchedulerTask = {
  readonly id: number;
  readonly active: boolean;
  readonly firedCount: number;
  cancel(): boolean;
};

export type RepeatScheduleOptions = {
  startDelaySeconds?: number;
  maxRuns?: number;
};

export type SchedulerUpdateResult = Readonly<{
  elapsedSeconds: number;
  deltaSeconds: number;
  firedCount: number;
  taskCount: number;
}>;

type SchedulerTaskEntry = {
  id: number;
  order: number;
  active: boolean;
  dueAtSeconds: number;
  callback: SchedulerTaskCallback;
  intervalSeconds?: number;
  remainingRuns?: number;
  firedCount: number;
};

export class RuntimeScheduler {
  private readonly tasks = new Map<number, SchedulerTaskEntry>();
  private nextTaskId = 1;
  private nextTaskOrder = 1;
  private elapsedSecondsValue = 0;
  private currentUpdateMaxOrder = Number.POSITIVE_INFINITY;

  get elapsedSeconds(): number {
    return this.elapsedSecondsValue;
  }

  schedule(delaySeconds: number, callback: SchedulerTaskCallback): SchedulerTask {
    this.assertDelay(delaySeconds, "Schedule delay");
    this.assertCallback(callback);

    return this.addTask({
      dueAtSeconds: this.elapsedSecondsValue + delaySeconds,
      callback
    });
  }

  repeat(
    intervalSeconds: number,
    callback: SchedulerTaskCallback,
    options: RepeatScheduleOptions = {}
  ): SchedulerTask {
    this.assertPositive(intervalSeconds, "Repeat interval");
    this.assertCallback(callback);

    const startDelaySeconds = options.startDelaySeconds ?? intervalSeconds;
    this.assertDelay(startDelaySeconds, "Repeat start delay");

    if (options.maxRuns !== undefined) {
      if (!Number.isInteger(options.maxRuns) || options.maxRuns <= 0) {
        throw new Error("Repeat maxRuns must be a positive integer.");
      }
    }

    return this.addTask({
      dueAtSeconds: this.elapsedSecondsValue + startDelaySeconds,
      callback,
      intervalSeconds,
      remainingRuns: options.maxRuns
    });
  }

  update(deltaSeconds: number): SchedulerUpdateResult {
    this.assertDelay(deltaSeconds, "Scheduler delta");

    this.elapsedSecondsValue += deltaSeconds;
    this.currentUpdateMaxOrder = this.nextTaskOrder - 1;
    let firedCount = 0;

    try {
      while (true) {
        const dueTasks = this.collectDueTasks();
        if (dueTasks.length === 0) break;

        for (const task of dueTasks) {
          if (!task.active || !this.tasks.has(task.id)) continue;
          if (task.dueAtSeconds > this.elapsedSecondsValue) continue;

          this.fireTask(task);
          firedCount += 1;
        }
      }
    } finally {
      this.currentUpdateMaxOrder = Number.POSITIVE_INFINITY;
    }

    return Object.freeze({
      elapsedSeconds: this.elapsedSecondsValue,
      deltaSeconds,
      firedCount,
      taskCount: this.taskCount()
    });
  }

  clear(): number {
    let removed = 0;

    for (const task of this.tasks.values()) {
      if (task.active) {
        task.active = false;
        removed += 1;
      }
    }

    this.tasks.clear();
    return removed;
  }

  taskCount(): number {
    let count = 0;

    for (const task of this.tasks.values()) {
      if (task.active) count += 1;
    }

    return count;
  }

  private addTask(
    task: Pick<SchedulerTaskEntry, "dueAtSeconds" | "callback" | "intervalSeconds" | "remainingRuns">
  ): SchedulerTask {
    const entry: SchedulerTaskEntry = {
      id: this.nextTaskId,
      order: this.nextTaskOrder,
      active: true,
      firedCount: 0,
      ...task
    };
    this.nextTaskId += 1;
    this.nextTaskOrder += 1;
    this.tasks.set(entry.id, entry);

    return {
      id: entry.id,
      get active() {
        return entry.active;
      },
      get firedCount() {
        return entry.firedCount;
      },
      cancel: () => this.cancelTask(entry)
    };
  }

  private collectDueTasks(): SchedulerTaskEntry[] {
    return [...this.tasks.values()]
      .filter((task) => task.active && task.dueAtSeconds <= this.elapsedSecondsValue)
      .sort((left, right) => {
        if (left.dueAtSeconds !== right.dueAtSeconds) {
          return left.dueAtSeconds - right.dueAtSeconds;
        }

        return left.order - right.order;
      })
      .filter((task) => task.order <= this.currentUpdateMaxOrder);
  }

  private fireTask(task: SchedulerTaskEntry): void {
    task.firedCount += 1;
    const context = Object.freeze({
      id: task.id,
      elapsedSeconds: this.elapsedSecondsValue,
      scheduledTimeSeconds: task.dueAtSeconds,
      firedCount: task.firedCount
    });

    if (task.intervalSeconds === undefined) {
      this.tasks.delete(task.id);
      task.active = false;
      task.callback(context);
      return;
    }

    if (task.remainingRuns !== undefined) {
      task.remainingRuns -= 1;
    }

    const completed = task.remainingRuns !== undefined && task.remainingRuns <= 0;

    if (completed) {
      this.tasks.delete(task.id);
      task.active = false;
    } else {
      task.dueAtSeconds += task.intervalSeconds;
    }

    task.callback(context);
  }

  private cancelTask(task: SchedulerTaskEntry): boolean {
    if (!task.active) return false;

    task.active = false;
    this.tasks.delete(task.id);
    return true;
  }

  private assertDelay(value: number, label: string): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${label} must be a finite non-negative number.`);
    }
  }

  private assertPositive(value: number, label: string): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`${label} must be a finite positive number.`);
    }
  }

  private assertCallback(callback: SchedulerTaskCallback): void {
    if (typeof callback !== "function") {
      throw new Error("Scheduler callback must be a function.");
    }
  }
}
