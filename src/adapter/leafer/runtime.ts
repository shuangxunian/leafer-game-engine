import { Group, Leafer, Rect, Text } from "leafer-ui";
import type { RenderAdapter, RenderContainer, RenderNode, RenderScene, RenderSprite, RenderText } from "../render-types.js";

type LeaferLikeNode = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  visible?: boolean;
  destroy?: () => void;
};

class LeaferNodeWrapper implements RenderNode {
  constructor(protected readonly rawNode: LeaferLikeNode) {}

  get nativeNode(): LeaferLikeNode {
    return this.rawNode;
  }

  get x(): number {
    return this.rawNode.x ?? 0;
  }

  set x(value: number) {
    this.rawNode.x = value;
  }

  get y(): number {
    return this.rawNode.y ?? 0;
  }

  set y(value: number) {
    this.rawNode.y = value;
  }

  get width(): number | undefined {
    return this.rawNode.width;
  }

  set width(value: number | undefined) {
    this.rawNode.width = value;
  }

  get height(): number | undefined {
    return this.rawNode.height;
  }

  set height(value: number | undefined) {
    this.rawNode.height = value;
  }

  get rotation(): number {
    return this.rawNode.rotation ?? 0;
  }

  set rotation(value: number) {
    this.rawNode.rotation = value;
  }

  get scaleX(): number {
    return this.rawNode.scaleX ?? 1;
  }

  set scaleX(value: number) {
    this.rawNode.scaleX = value;
  }

  get scaleY(): number {
    return this.rawNode.scaleY ?? 1;
  }

  set scaleY(value: number) {
    this.rawNode.scaleY = value;
  }

  get visible(): boolean {
    return this.rawNode.visible ?? true;
  }

  set visible(value: boolean) {
    this.rawNode.visible = value;
  }

  destroy(): void {
    this.rawNode.destroy?.();
  }
}

class LeaferContainerWrapper extends LeaferNodeWrapper implements RenderContainer {
  private children: LeaferLikeNode[] = [];

  constructor(private container: Leafer | Group) {
    super(container);
  }

  setContainer(container: Leafer | Group): void {
    this.container = container;
    this.children.forEach((child) => this.container.add(child as object));
  }

  addChild(node: RenderNode): void {
    const nativeNode = (node as LeaferNodeWrapper).nativeNode;
    this.children.push(nativeNode);
    this.container.add(nativeNode as object);
  }
}

class LeaferSpriteWrapper extends LeaferNodeWrapper implements RenderSprite {
  constructor(private readonly rect: Rect) {
    super(rect);
    this.rect.width = 52;
    this.rect.height = 52;
    this.rect.cornerRadius = 14;
  }

  setAsset(assetId: string): void {
    this.rect.fill = assetId === "player" ? "#ffcf7a" : "#6cb7ff";
  }
}

class LeaferTextWrapper extends LeaferNodeWrapper implements RenderText {
  constructor(private readonly label: Text) {
    super(label);
    this.label.fontSize = 18;
    this.label.fill = "#f6f3ea";
  }

  setText(text: string): void {
    this.label.text = text;
  }

  get fontSize(): number | undefined {
    return this.label.fontSize;
  }

  set fontSize(value: number | undefined) {
    this.label.fontSize = value;
  }
}

class LeaferSceneWrapper implements RenderScene {
  private leafer?: Leafer;
  public readonly root: LeaferContainerWrapper;

  constructor() {
    const bootstrapRoot = new Group();
    this.root = new LeaferContainerWrapper(bootstrapRoot);
  }

  mount(target: string | HTMLElement): void {
    const element = typeof target === "string" ? document.getElementById(target) : target;
    if (!element) throw new Error("Render mount target not found.");

    if (this.leafer) {
      this.leafer.destroy();
    }

    const leafer = new Leafer({
      view: element,
      width: element.clientWidth || 960,
      height: element.clientHeight || 640,
      fill: "#0d2235"
    });

    this.leafer = leafer;
    this.root.setContainer(leafer);
  }

  destroy(): void {
    this.leafer?.destroy();
    this.leafer = undefined;
  }
}

export class LeaferRenderAdapter implements RenderAdapter {
  createScene(): RenderScene {
    return new LeaferSceneWrapper();
  }

  createContainer(): RenderContainer {
    return new LeaferContainerWrapper(new Group());
  }

  createSprite(assetId = ""): RenderSprite {
    const sprite = new LeaferSpriteWrapper(new Rect());
    sprite.setAsset(assetId);
    return sprite;
  }

  createText(text = ""): RenderText {
    const label = new LeaferTextWrapper(new Text());
    label.setText(text);
    return label;
  }
}
