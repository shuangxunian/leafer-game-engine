export type ComponentSchemaFieldType = "boolean" | "number" | "string";

export type ComponentSchemaField = {
  name: string;
  type: ComponentSchemaFieldType;
  required?: boolean;
  default?: string | number | boolean;
  description?: string;
};

export type ComponentSchema = {
  id: string;
  component: string;
  label?: string;
  fields: ComponentSchemaField[];
};

export class ComponentSchemaRegistry {
  private readonly schemas = new Map<string, ComponentSchema>();

  register(schema: ComponentSchema): this {
    const normalized = normalizeSchemaId(schema.id);
    if (!normalized) {
      throw new Error("Component schema id must be a non-empty string.");
    }

    this.schemas.set(normalized, {
      ...schema,
      id: normalized,
      fields: [...schema.fields]
    });
    return this;
  }

  get(id: string): ComponentSchema | undefined {
    return this.schemas.get(normalizeSchemaId(id));
  }

  require(id: string): ComponentSchema {
    const schema = this.get(id);
    if (!schema) {
      throw new Error(`Component schema "${id}" is not registered.`);
    }

    return schema;
  }

  has(id: string): boolean {
    return Boolean(this.get(id));
  }

  list(): ComponentSchema[] {
    return [...this.schemas.values()];
  }
}

export function createDefaultComponentSchemaRegistry(): ComponentSchemaRegistry {
  return new ComponentSchemaRegistry()
    .register({
      id: "transform",
      component: "TransformComponent",
      label: "Transform",
      fields: [
        { name: "x", type: "number", default: 0, description: "World x position." },
        { name: "y", type: "number", default: 0, description: "World y position." },
        { name: "rotation", type: "number", default: 0, description: "Rotation in degrees." },
        { name: "scaleX", type: "number", default: 1, description: "Horizontal scale." },
        { name: "scaleY", type: "number", default: 1, description: "Vertical scale." }
      ]
    })
    .register({
      id: "size",
      component: "SizeComponent",
      label: "Size",
      fields: [
        { name: "width", type: "number", required: true, description: "Width in world units." },
        { name: "height", type: "number", required: true, description: "Height in world units." }
      ]
    })
    .register({
      id: "collider",
      component: "ColliderComponent",
      label: "Collider",
      fields: [
        { name: "layer", type: "string", default: "default", description: "Collision layer id." },
        { name: "width", type: "number", description: "Optional collider width override." },
        { name: "height", type: "number", description: "Optional collider height override." },
        { name: "offsetX", type: "number", default: 0, description: "Collider x offset." },
        { name: "offsetY", type: "number", default: 0, description: "Collider y offset." }
      ]
    })
    .register({
      id: "velocity",
      component: "VelocityComponent",
      label: "Velocity",
      fields: [
        { name: "vx", type: "number", default: 0, description: "Horizontal velocity." },
        { name: "vy", type: "number", default: 0, description: "Vertical velocity." }
      ]
    });
}

function normalizeSchemaId(id: string): string {
  return id.trim().toLowerCase();
}
