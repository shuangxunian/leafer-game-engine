import type {
  AudioPlaybackAdapter,
  AudioPlaybackDispatch,
  AudioRuntimeOperation,
  AudioRuntimeState
} from "../framework/index.js";

export type BrowserAudioMediaElement = {
  src: string;
  currentTime: number;
  volume: number;
  muted: boolean;
  loop: boolean;
  play(): AudioPlaybackDispatch;
  pause(): void;
};

export type BrowserAudioMediaElementFactory = (source: string) => BrowserAudioMediaElement;

export type BrowserAudioPlaybackAdapterOptions = {
  audio: AudioRuntimeState;
  createElement?: BrowserAudioMediaElementFactory;
};

type BrowserAudioPlaybackInstance = {
  sequence: number;
  cueId?: string;
  assetId: string;
  channelId?: string;
  cueVolume: number;
  media: BrowserAudioMediaElement;
};

type BrowserAudioChannelPlaybackState = {
  volume: number;
  muted: boolean;
};

export class BrowserAudioPlaybackAdapter implements AudioPlaybackAdapter {
  private readonly audio: AudioRuntimeState;
  private readonly createElement: BrowserAudioMediaElementFactory;
  private readonly channels = new Map<string, BrowserAudioChannelPlaybackState>();
  private readonly instances: BrowserAudioPlaybackInstance[] = [];

  constructor(options: BrowserAudioPlaybackAdapterOptions) {
    this.audio = options.audio;
    this.createElement = options.createElement ?? createHtmlAudioElement;

    for (const channel of this.audio.listChannels()) {
      this.channels.set(channel.id, {
        volume: channel.volume,
        muted: channel.muted
      });
    }
  }

  play(operation: AudioRuntimeOperation): AudioPlaybackDispatch {
    const assetId = requireOperationField(operation.assetId, operation, "assetId");
    const asset = this.audio.getAsset(assetId);
    if (!asset) {
      throw new Error(`Audio playback asset "${assetId}" is not registered.`);
    }

    if (!asset.source) {
      throw new Error(`Audio playback asset "${assetId}" does not define a source.`);
    }

    const channelState = this.getChannelState(operation.channelId);
    const media = this.createElement(asset.source);
    const cueVolume = operation.volume ?? 1;
    media.src = asset.source;
    media.loop = operation.loop ?? false;
    media.volume = getEffectiveVolume(cueVolume, channelState);
    media.muted = channelState.muted;

    this.instances.push({
      sequence: operation.sequence,
      cueId: operation.cueId,
      assetId,
      channelId: operation.channelId,
      cueVolume,
      media
    });

    return media.play();
  }

  stop(operation: AudioRuntimeOperation): void {
    const matching = this.findMatchingInstances(operation);

    for (const instance of matching) {
      instance.media.pause();
      instance.media.currentTime = 0;
      this.removeInstance(instance);
    }
  }

  pause(operation: AudioRuntimeOperation): void {
    for (const instance of this.findMatchingInstances(operation)) {
      instance.media.pause();
    }
  }

  resume(operation: AudioRuntimeOperation): AudioPlaybackDispatch {
    return Promise.all(this.findMatchingInstances(operation).map((instance) => instance.media.play())).then(() => {});
  }

  setVolume(operation: AudioRuntimeOperation): void {
    const channelId = requireOperationField(operation.channelId, operation, "channelId");
    const volume = operation.volume ?? 1;
    const channelState = this.getChannelState(channelId);
    channelState.volume = volume;
    this.channels.set(channelId, channelState);

    for (const instance of this.instances) {
      if (instance.channelId === channelId) {
        instance.media.volume = getEffectiveVolume(instance.cueVolume, channelState);
      }
    }
  }

  setMuted(operation: AudioRuntimeOperation): void {
    const channelId = requireOperationField(operation.channelId, operation, "channelId");
    const muted = operation.muted ?? false;
    const channelState = this.getChannelState(channelId);
    channelState.muted = muted;
    this.channels.set(channelId, channelState);

    for (const instance of this.instances) {
      if (instance.channelId === channelId) {
        instance.media.muted = muted;
      }
    }
  }

  listActiveInstances(): AudioRuntimeOperation[] {
    return this.instances.map((instance) => ({
      sequence: instance.sequence,
      type: "play",
      ...(instance.cueId !== undefined ? { cueId: instance.cueId } : {}),
      assetId: instance.assetId,
      ...(instance.channelId !== undefined ? { channelId: instance.channelId } : {}),
      volume: instance.cueVolume,
      loop: instance.media.loop
    }));
  }

  private getChannelState(channelId: string | undefined): BrowserAudioChannelPlaybackState {
    if (!channelId) {
      return { volume: 1, muted: false };
    }

    const current = this.channels.get(channelId);
    if (current) {
      return { ...current };
    }

    const channel = this.audio.getChannel(channelId);
    const fallback = {
      volume: channel?.volume ?? 1,
      muted: channel?.muted ?? false
    };
    this.channels.set(channelId, fallback);
    return { ...fallback };
  }

  private findMatchingInstances(operation: AudioRuntimeOperation): BrowserAudioPlaybackInstance[] {
    return this.instances.filter((instance) => {
      if (operation.cueId !== undefined && instance.cueId !== operation.cueId) {
        return false;
      }

      if (operation.assetId !== undefined && instance.assetId !== operation.assetId) {
        return false;
      }

      if (operation.channelId !== undefined && instance.channelId !== operation.channelId) {
        return false;
      }

      return true;
    });
  }

  private removeInstance(instance: BrowserAudioPlaybackInstance): void {
    const index = this.instances.indexOf(instance);
    if (index >= 0) {
      this.instances.splice(index, 1);
    }
  }
}

function createHtmlAudioElement(source: string): BrowserAudioMediaElement {
  return new Audio(source);
}

function getEffectiveVolume(cueVolume: number, channelState: BrowserAudioChannelPlaybackState): number {
  return Math.max(0, Math.min(1, cueVolume * channelState.volume));
}

function requireOperationField(
  value: string | undefined,
  operation: AudioRuntimeOperation,
  field: "assetId" | "channelId"
): string {
  if (value === undefined) {
    throw new Error(`Audio playback ${operation.type} operation #${operation.sequence} requires ${field}.`);
  }

  return value;
}
