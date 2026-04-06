declare module "leafer-ui" {
  export class Leafer {
    view: unknown;
    width?: number;
    height?: number;
    fill?: string;
    x?: number;
    y?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    visible?: boolean;
    constructor(config?: Record<string, unknown>);
    add(child: object): void;
    destroy(): void;
  }

  export class Group {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    visible?: boolean;
    add(child: object): void;
    destroy(): void;
  }

  export class Rect {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    visible?: boolean;
    fill?: string;
    cornerRadius?: number;
    constructor(config?: Record<string, unknown>);
    destroy(): void;
  }

  export class Text {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    visible?: boolean;
    text?: string;
    fill?: string;
    fontSize?: number;
    constructor(config?: Record<string, unknown>);
    destroy(): void;
  }
}
