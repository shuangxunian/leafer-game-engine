export type Updatable = {
  update?(dt: number): void;
  fixedUpdate?(dt: number): void;
  lateUpdate?(dt: number): void;
};

export type Destroyable = {
  destroy?(): void;
};
