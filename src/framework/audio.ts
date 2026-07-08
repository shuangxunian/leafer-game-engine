import type { Scene } from "../core/index.js";
import { System } from "../core/index.js";

export type AudioMetadata = Record<string, unknown>;

export type AudioAssetDefinition = {
  id: string;
  source?: string;
  durationSeconds?: number;
  preload?: boolean;
  metadata?: AudioMetadata;
};

export type AudioCueDefinition = {
  id: string;
  assetId: string;
  channelId?: string;
  volume?: number;
  loop?: boolean;
  metadata?: AudioMetadata;
};

export type AudioChannelDefinition = {
  id: string;
  volume?: number;
  muted?: boolean;
  metadata?: AudioMetadata;
};

export type AudioManifestDefinition = {
  assets?: readonly AudioAssetDefinition[];
  cues?: readonly AudioCueDefinition[];
  channels?: readonly AudioChannelDefinition[];
};

export type DefinedAudioAsset = {
  id: string;
  source?: string;
  durationSeconds?: number;
  preload: boolean;
  metadata?: AudioMetadata;
};

export type DefinedAudioCue = {
  id: string;
  assetId: string;
  channelId: string;
  volume: number;
  loop: boolean;
  metadata?: AudioMetadata;
};

export type DefinedAudioChannel = {
  id: string;
  volume: number;
  muted: boolean;
  metadata?: AudioMetadata;
};

export type DefinedAudioManifest = {
  assets: DefinedAudioAsset[];
  cues: DefinedAudioCue[];
  channels: DefinedAudioChannel[];
};

export type AudioRuntimeChannelState = {
  id: string;
  volume: number;
  muted: boolean;
};

export type AudioRuntimeOperationType = "play" | "stop" | "pause" | "resume" | "set-volume" | "set-muted";

export type AudioRuntimeOperation = {
  sequence: number;
  type: AudioRuntimeOperationType;
  cueId?: string;
  assetId?: string;
  channelId?: string;
  volume?: number;
  muted?: boolean;
  loop?: boolean;
};

export type AudioPlaybackDispatch = void | Promise<void>;

export type AudioPlaybackAdapter = {
  play(operation: AudioRuntimeOperation): AudioPlaybackDispatch;
  stop(operation: AudioRuntimeOperation): AudioPlaybackDispatch;
  pause(operation: AudioRuntimeOperation): AudioPlaybackDispatch;
  resume(operation: AudioRuntimeOperation): AudioPlaybackDispatch;
  setVolume(operation: AudioRuntimeOperation): AudioPlaybackDispatch;
  setMuted(operation: AudioRuntimeOperation): AudioPlaybackDispatch;
};

export type AudioPlaybackOperationResult = {
  sequence: number;
  type: AudioRuntimeOperationType;
  status: "ok" | "error";
  error?: string;
};

export type AudioPlaybackDrainOptions = {
  clearOperations?: boolean;
};

export type AudioPlaybackSystemOptions = {
  adapter: AudioPlaybackAdapter;
  audio?: AudioRuntimeState;
  clearOperations?: boolean;
  drainOnUpdate?: boolean;
  priority?: number;
};

export type AudioRuntimePlayOptions = {
  channelId?: string;
  volume?: number;
  loop?: boolean;
};

export type AudioRuntimeStopOptions = {
  cueId?: string;
  channelId?: string;
};

export type AudioRuntimeSystemOptions = {
  manifest?: AudioManifestDefinition;
  audio?: AudioRuntimeState;
  clearOperationsOnDestroy?: boolean;
  priority?: number;
};

export type SceneAudioRuntimeBundle = Readonly<{
  system: AudioRuntimeSystem;
  audio: AudioRuntimeState;
}>;

export const DEFAULT_AUDIO_CHANNEL_ID = "master";
export const DEFAULT_AUDIO_RUNTIME_SYSTEM_PRIORITY = -240;
export const DEFAULT_AUDIO_PLAYBACK_SYSTEM_PRIORITY = -230;

export class AudioRuntimeState {
  private readonly definition: DefinedAudioManifest;
  private readonly assetsById = new Map<string, DefinedAudioAsset>();
  private readonly cuesById = new Map<string, DefinedAudioCue>();
  private readonly channelsById = new Map<string, AudioRuntimeChannelState>();
  private readonly operations: AudioRuntimeOperation[] = [];
  private nextSequence = 1;

  constructor(definition: AudioManifestDefinition = {}) {
    this.definition = defineAudioManifest(definition);

    for (const asset of this.definition.assets) {
      this.assetsById.set(asset.id, asset);
    }

    for (const cue of this.definition.cues) {
      this.cuesById.set(cue.id, cue);
    }

    for (const channel of this.definition.channels) {
      this.channelsById.set(channel.id, {
        id: channel.id,
        volume: channel.volume,
        muted: channel.muted
      });
    }
  }

  get manifest(): DefinedAudioManifest {
    return copyManifest(this.definition);
  }

  listAssets(): DefinedAudioAsset[] {
    return this.definition.assets.map(copyAsset);
  }

  listCues(): DefinedAudioCue[] {
    return this.definition.cues.map(copyCue);
  }

  listChannels(): AudioRuntimeChannelState[] {
    return [...this.channelsById.values()].map(copyChannelState);
  }

  getAsset(id: string): DefinedAudioAsset | undefined {
    const asset = this.assetsById.get(id);
    return asset ? copyAsset(asset) : undefined;
  }

  getCue(id: string): DefinedAudioCue | undefined {
    const cue = this.cuesById.get(id);
    return cue ? copyCue(cue) : undefined;
  }

  getChannel(id: string): AudioRuntimeChannelState | undefined {
    const channel = this.channelsById.get(id);
    return channel ? copyChannelState(channel) : undefined;
  }

  playCue(cueId: string, options: AudioRuntimePlayOptions = {}): AudioRuntimeOperation {
    const cue = this.requireCue(cueId);
    const channelId = options.channelId ?? cue.channelId;
    this.requireChannel(channelId);
    const volume = options.volume ?? cue.volume;
    assertVolume(volume, "Audio play volume");
    const loop = options.loop ?? cue.loop;

    return this.recordOperation({
      type: "play",
      cueId: cue.id,
      assetId: cue.assetId,
      channelId,
      volume,
      loop
    });
  }

  stopCue(cueId: string): AudioRuntimeOperation {
    const cue = this.requireCue(cueId);

    return this.recordOperation({
      type: "stop",
      cueId: cue.id,
      assetId: cue.assetId,
      channelId: cue.channelId
    });
  }

  stop(options: AudioRuntimeStopOptions = {}): AudioRuntimeOperation {
    if (options.cueId !== undefined) {
      const cue = this.requireCue(options.cueId);
      const channelId = options.channelId ?? cue.channelId;
      this.requireChannel(channelId);
      return this.recordOperation({
        type: "stop",
        cueId: cue.id,
        assetId: cue.assetId,
        channelId
      });
    }

    if (options.channelId !== undefined) {
      this.requireChannel(options.channelId);
    }

    return this.recordOperation({
      type: "stop",
      channelId: options.channelId
    });
  }

  pauseChannel(channelId: string): AudioRuntimeOperation {
    this.requireChannel(channelId);

    return this.recordOperation({
      type: "pause",
      channelId
    });
  }

  resumeChannel(channelId: string): AudioRuntimeOperation {
    this.requireChannel(channelId);

    return this.recordOperation({
      type: "resume",
      channelId
    });
  }

  setChannelVolume(channelId: string, volume: number): AudioRuntimeOperation {
    const channel = this.requireChannel(channelId);
    assertVolume(volume, "Audio channel volume");
    channel.volume = volume;

    return this.recordOperation({
      type: "set-volume",
      channelId,
      volume
    });
  }

  setChannelMuted(channelId: string, muted: boolean): AudioRuntimeOperation {
    const channel = this.requireChannel(channelId);
    channel.muted = muted;

    return this.recordOperation({
      type: "set-muted",
      channelId,
      muted
    });
  }

  listOperations(): AudioRuntimeOperation[] {
    return this.operations.map(copyOperation);
  }

  getLastOperation(): AudioRuntimeOperation | undefined {
    const operation = this.operations.at(-1);
    return operation ? copyOperation(operation) : undefined;
  }

  clearOperations(): void {
    this.operations.length = 0;
  }

  private requireCue(id: string): DefinedAudioCue {
    assertNonEmptyString(id, "Audio cue id");
    const cue = this.cuesById.get(id);
    if (!cue) {
      throw new Error(`Audio cue "${id}" is not registered.`);
    }

    return cue;
  }

  private requireChannel(id: string): AudioRuntimeChannelState {
    assertNonEmptyString(id, "Audio channel id");
    const channel = this.channelsById.get(id);
    if (!channel) {
      throw new Error(`Audio channel "${id}" is not registered.`);
    }

    return channel;
  }

  private recordOperation(operation: Omit<AudioRuntimeOperation, "sequence">): AudioRuntimeOperation {
    const recorded = {
      sequence: this.nextSequence,
      ...operation
    };
    this.nextSequence += 1;
    this.operations.push(recorded);
    return copyOperation(recorded);
  }
}

export function createAudioRuntimeState(definition: AudioManifestDefinition = {}): AudioRuntimeState {
  return new AudioRuntimeState(definition);
}

export async function drainAudioRuntimeOperations(
  audio: AudioRuntimeState,
  adapter: AudioPlaybackAdapter,
  options: AudioPlaybackDrainOptions = {}
): Promise<AudioPlaybackOperationResult[]> {
  const operations = audio.listOperations().sort((a, b) => a.sequence - b.sequence);
  const results: AudioPlaybackOperationResult[] = [];

  for (const operation of operations) {
    try {
      await dispatchAudioRuntimeOperation(adapter, operation);
      results.push({
        sequence: operation.sequence,
        type: operation.type,
        status: "ok"
      });
    } catch (error) {
      results.push({
        sequence: operation.sequence,
        type: operation.type,
        status: "error",
        error: normalizeAudioPlaybackError(error)
      });
    }
  }

  if (options.clearOperations ?? true) {
    audio.clearOperations();
  }

  return results;
}

export class AudioRuntimeSystem extends System {
  public readonly audio: AudioRuntimeState;
  private readonly clearOperationsOnDestroy: boolean;

  get clearsOperationsOnDestroy(): boolean {
    return this.clearOperationsOnDestroy;
  }

  constructor(
    scene: Scene,
    options: AudioRuntimeSystemOptions = {}
  ) {
    super(scene);

    this.priority = options.priority ?? DEFAULT_AUDIO_RUNTIME_SYSTEM_PRIORITY;
    this.audio = options.audio ?? createAudioRuntimeState(options.manifest);
    this.clearOperationsOnDestroy = options.clearOperationsOnDestroy ?? true;
  }

  override destroy(): void {
    if (this.clearOperationsOnDestroy) {
      this.audio.clearOperations();
    }
  }
}

export class AudioPlaybackSystem extends System {
  public readonly adapter: AudioPlaybackAdapter;
  public readonly audio?: AudioRuntimeState;
  private readonly clearOperations: boolean;
  private readonly drainOnUpdate: boolean;
  private pendingDrain?: Promise<AudioPlaybackOperationResult[]>;
  private lastResults: AudioPlaybackOperationResult[] = [];

  get clearsOperations(): boolean {
    return this.clearOperations;
  }

  get drainsOnUpdate(): boolean {
    return this.drainOnUpdate;
  }

  get isDraining(): boolean {
    return this.pendingDrain !== undefined;
  }

  constructor(
    scene: Scene,
    options: AudioPlaybackSystemOptions
  ) {
    super(scene);

    this.priority = options.priority ?? DEFAULT_AUDIO_PLAYBACK_SYSTEM_PRIORITY;
    this.adapter = options.adapter;
    this.audio = options.audio;
    this.clearOperations = options.clearOperations ?? true;
    this.drainOnUpdate = options.drainOnUpdate ?? true;
  }

  override update(): void {
    if (this.drainOnUpdate) {
      void this.drain();
    }
  }

  drain(): Promise<AudioPlaybackOperationResult[]> {
    if (this.pendingDrain) {
      return this.pendingDrain;
    }

    const audio = this.resolveAudio();
    if (!audio) {
      this.lastResults = [];
      return Promise.resolve([]);
    }

    const pending = drainAudioRuntimeOperations(audio, this.adapter, {
      clearOperations: this.clearOperations
    }).then((results) => {
      this.lastResults = results.map(copyPlaybackResult);
      return this.listLastResults();
    }).finally(() => {
      if (this.pendingDrain === pending) {
        this.pendingDrain = undefined;
      }
    });

    this.pendingDrain = pending;
    return pending;
  }

  listLastResults(): AudioPlaybackOperationResult[] {
    return this.lastResults.map(copyPlaybackResult);
  }

  override destroy(): void {
    this.lastResults = [];
    this.pendingDrain = undefined;
  }

  private resolveAudio(): AudioRuntimeState | undefined {
    return this.audio ?? getAudioRuntime(this.scene);
  }
}

export function addAudioRuntime(
  scene: Scene,
  options: AudioRuntimeSystemOptions = {}
): AudioRuntimeSystem {
  return scene.addSystem(new AudioRuntimeSystem(scene, options));
}

export function createSceneAudioRuntimeBundle(
  scene: Scene,
  options: AudioRuntimeSystemOptions = {}
): SceneAudioRuntimeBundle {
  const system = scene.getSystem(AudioRuntimeSystem) ?? addAudioRuntime(scene, options);

  return Object.freeze({
    system,
    audio: system.audio
  });
}

export function addAudioPlayback(
  scene: Scene,
  options: AudioPlaybackSystemOptions
): AudioPlaybackSystem {
  return scene.addSystem(new AudioPlaybackSystem(scene, options));
}

export function getAudioRuntime(scene: Scene): AudioRuntimeState | undefined {
  return scene.getSystem(AudioRuntimeSystem)?.audio;
}

export function getAudioPlayback(scene: Scene): AudioPlaybackSystem | undefined {
  return scene.getSystem(AudioPlaybackSystem);
}

export function dispatchAudioRuntimeOperation(
  adapter: AudioPlaybackAdapter,
  operation: AudioRuntimeOperation
): AudioPlaybackDispatch {
  switch (operation.type) {
    case "play":
      return adapter.play(operation);
    case "stop":
      return adapter.stop(operation);
    case "pause":
      return adapter.pause(operation);
    case "resume":
      return adapter.resume(operation);
    case "set-volume":
      return adapter.setVolume(operation);
    case "set-muted":
      return adapter.setMuted(operation);
  }
}

export function defineAudioAsset(definition: AudioAssetDefinition): DefinedAudioAsset {
  assertNonEmptyString(definition.id, "Audio asset id");

  if (definition.source !== undefined) {
    assertNonEmptyString(definition.source, `Audio asset "${definition.id}" source`);
  }

  if (definition.durationSeconds !== undefined) {
    assertPositiveFiniteNumber(definition.durationSeconds, `Audio asset "${definition.id}" durationSeconds`);
  }

  return {
    id: definition.id,
    ...(definition.source !== undefined ? { source: definition.source } : {}),
    ...(definition.durationSeconds !== undefined ? { durationSeconds: definition.durationSeconds } : {}),
    preload: definition.preload ?? false,
    metadata: copyMetadata(definition.metadata)
  };
}

export function defineAudioCue(definition: AudioCueDefinition): DefinedAudioCue {
  assertNonEmptyString(definition.id, "Audio cue id");
  assertNonEmptyString(definition.assetId, `Audio cue "${definition.id}" assetId`);
  const channelId = definition.channelId ?? DEFAULT_AUDIO_CHANNEL_ID;
  assertNonEmptyString(channelId, `Audio cue "${definition.id}" channelId`);
  const volume = definition.volume ?? 1;
  assertVolume(volume, `Audio cue "${definition.id}" volume`);

  return {
    id: definition.id,
    assetId: definition.assetId,
    channelId,
    volume,
    loop: definition.loop ?? false,
    metadata: copyMetadata(definition.metadata)
  };
}

export function defineAudioChannel(definition: AudioChannelDefinition): DefinedAudioChannel {
  assertNonEmptyString(definition.id, "Audio channel id");
  const volume = definition.volume ?? 1;
  assertVolume(volume, `Audio channel "${definition.id}" volume`);

  return {
    id: definition.id,
    volume,
    muted: definition.muted ?? false,
    metadata: copyMetadata(definition.metadata)
  };
}

export function defineAudioManifest(definition: AudioManifestDefinition): DefinedAudioManifest {
  const assets = normalizeAudioAssets(definition.assets ?? []);
  const channels = normalizeAudioChannels(definition.channels ?? []);
  const cues = normalizeAudioCues(definition.cues ?? [], assets, channels);

  return {
    assets,
    cues,
    channels
  };
}

function normalizeAudioAssets(assets: readonly AudioAssetDefinition[]): DefinedAudioAsset[] {
  if (!Array.isArray(assets)) {
    throw new Error("Audio manifest assets must be an array.");
  }

  const seenIds = new Set<string>();
  return assets.map((asset) => {
    const defined = defineAudioAsset(asset);
    assertUniqueId(defined.id, seenIds, "Duplicate audio asset id");
    return defined;
  });
}

function normalizeAudioChannels(channels: readonly AudioChannelDefinition[]): DefinedAudioChannel[] {
  if (!Array.isArray(channels)) {
    throw new Error("Audio manifest channels must be an array.");
  }

  const seenIds = new Set<string>();
  const normalized = channels.map((channel) => {
    const defined = defineAudioChannel(channel);
    assertUniqueId(defined.id, seenIds, "Duplicate audio channel id");
    return defined;
  });

  if (!seenIds.has(DEFAULT_AUDIO_CHANNEL_ID)) {
    normalized.unshift(defineAudioChannel({ id: DEFAULT_AUDIO_CHANNEL_ID }));
  }

  return normalized;
}

function normalizeAudioCues(
  cues: readonly AudioCueDefinition[],
  assets: readonly DefinedAudioAsset[],
  channels: readonly DefinedAudioChannel[]
): DefinedAudioCue[] {
  if (!Array.isArray(cues)) {
    throw new Error("Audio manifest cues must be an array.");
  }

  const seenIds = new Set<string>();
  const assetIds = new Set(assets.map((asset) => asset.id));
  const channelIds = new Set(channels.map((channel) => channel.id));

  return cues.map((cue) => {
    const defined = defineAudioCue(cue);
    assertUniqueId(defined.id, seenIds, "Duplicate audio cue id");

    if (!assetIds.has(defined.assetId)) {
      throw new Error(`Audio cue "${defined.id}" references missing asset "${defined.assetId}".`);
    }

    if (!channelIds.has(defined.channelId)) {
      throw new Error(`Audio cue "${defined.id}" references missing channel "${defined.channelId}".`);
    }

    return defined;
  });
}

function copyManifest(manifest: DefinedAudioManifest): DefinedAudioManifest {
  return {
    assets: manifest.assets.map(copyAsset),
    cues: manifest.cues.map(copyCue),
    channels: manifest.channels.map(copyChannel)
  };
}

function copyAsset(asset: DefinedAudioAsset): DefinedAudioAsset {
  return {
    id: asset.id,
    ...(asset.source !== undefined ? { source: asset.source } : {}),
    ...(asset.durationSeconds !== undefined ? { durationSeconds: asset.durationSeconds } : {}),
    preload: asset.preload,
    metadata: copyMetadata(asset.metadata)
  };
}

function copyCue(cue: DefinedAudioCue): DefinedAudioCue {
  return {
    id: cue.id,
    assetId: cue.assetId,
    channelId: cue.channelId,
    volume: cue.volume,
    loop: cue.loop,
    metadata: copyMetadata(cue.metadata)
  };
}

function copyChannel(channel: DefinedAudioChannel): DefinedAudioChannel {
  return {
    id: channel.id,
    volume: channel.volume,
    muted: channel.muted,
    metadata: copyMetadata(channel.metadata)
  };
}

function copyChannelState(channel: AudioRuntimeChannelState): AudioRuntimeChannelState {
  return {
    id: channel.id,
    volume: channel.volume,
    muted: channel.muted
  };
}

function copyOperation(operation: AudioRuntimeOperation): AudioRuntimeOperation {
  return {
    sequence: operation.sequence,
    type: operation.type,
    ...(operation.cueId !== undefined ? { cueId: operation.cueId } : {}),
    ...(operation.assetId !== undefined ? { assetId: operation.assetId } : {}),
    ...(operation.channelId !== undefined ? { channelId: operation.channelId } : {}),
    ...(operation.volume !== undefined ? { volume: operation.volume } : {}),
    ...(operation.muted !== undefined ? { muted: operation.muted } : {}),
    ...(operation.loop !== undefined ? { loop: operation.loop } : {})
  };
}

function copyMetadata(metadata: AudioMetadata | undefined): AudioMetadata | undefined {
  return metadata ? { ...metadata } : undefined;
}

function copyPlaybackResult(result: AudioPlaybackOperationResult): AudioPlaybackOperationResult {
  return {
    sequence: result.sequence,
    type: result.type,
    status: result.status,
    ...(result.error !== undefined ? { error: result.error } : {})
  };
}

function normalizeAudioPlaybackError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function assertUniqueId(id: string, seenIds: Set<string>, message: string): void {
  if (seenIds.has(id)) {
    throw new Error(`${message} "${id}".`);
  }

  seenIds.add(id);
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function assertPositiveFiniteNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than 0.`);
  }
}

function assertVolume(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be a finite number between 0 and 1.`);
  }
}
