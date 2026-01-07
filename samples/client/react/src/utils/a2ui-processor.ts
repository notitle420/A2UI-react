/**
 * A2UI Message Processor for React
 * Simplified version that processes A2UI messages and builds component trees.
 */

export interface A2uiSurface {
  surfaceId: string;
  rootComponentId: string | null;
  components: Map<string, A2uiComponent>;
  dataModel: Map<string, unknown>;
  styles: Record<string, string>;
}

export interface A2uiComponent {
  id: string;
  component: Record<string, unknown>;
  weight?: string;
}

export interface BeginRenderingMessage {
  surfaceId: string;
  root: string;
  styles?: Record<string, string>;
}

export interface SurfaceUpdateMessage {
  surfaceId: string;
  components: A2uiComponent[];
}

export interface DataModelUpdateMessage {
  surfaceId: string;
  path?: string;
  contents: Array<{ key: string; valueString?: string; valueNumber?: number; valueMap?: unknown[] }>;
}

export interface A2uiMessage {
  beginRendering?: BeginRenderingMessage;
  surfaceUpdate?: SurfaceUpdateMessage;
  dataModelUpdate?: DataModelUpdateMessage;
  endRendering?: { surfaceId: string };
  deleteSurface?: { surfaceId: string };
}

/**
 * Processes A2UI messages and manages surface state.
 */
export class A2uiMessageProcessor {
  private surfaces: Map<string, A2uiSurface> = new Map();

  getSurfaces(): Map<string, A2uiSurface> {
    return this.surfaces;
  }

  getSurface(surfaceId: string): A2uiSurface | undefined {
    return this.surfaces.get(surfaceId);
  }

  clearSurfaces(): void {
    this.surfaces.clear();
  }

  processMessage(message: A2uiMessage): void {
    if (message.beginRendering) {
      this.handleBeginRendering(message.beginRendering);
    }
    if (message.surfaceUpdate) {
      this.handleSurfaceUpdate(message.surfaceUpdate);
    }
    if (message.dataModelUpdate) {
      this.handleDataModelUpdate(message.dataModelUpdate);
    }
    if (message.deleteSurface) {
      this.surfaces.delete(message.deleteSurface.surfaceId);
    }
  }

  private getOrCreateSurface(surfaceId: string): A2uiSurface {
    let surface = this.surfaces.get(surfaceId);
    if (!surface) {
      surface = {
        surfaceId,
        rootComponentId: null,
        components: new Map(),
        dataModel: new Map(),
        styles: {},
      };
      this.surfaces.set(surfaceId, surface);
    }
    return surface;
  }

  private handleBeginRendering(message: BeginRenderingMessage): void {
    const surface = this.getOrCreateSurface(message.surfaceId);
    surface.rootComponentId = message.root;
    surface.styles = message.styles ?? {};
  }

  private handleSurfaceUpdate(message: SurfaceUpdateMessage): void {
    const surface = this.getOrCreateSurface(message.surfaceId);
    for (const component of message.components) {
      surface.components.set(component.id, component);
    }
  }

  private handleDataModelUpdate(message: DataModelUpdateMessage): void {
    const surface = this.getOrCreateSurface(message.surfaceId);

    for (const item of message.contents) {
      const value = item.valueString ?? item.valueNumber ?? item.valueMap;
      this.setDataByPath(surface.dataModel, item.key, value);
    }
  }

  private setDataByPath(dataModel: Map<string, unknown>, path: string, value: unknown): void {
    // Normalize path: "chart.items[0].label" -> ["chart", "items", "0", "label"]
    const segments = path
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(s => s.length > 0);

    if (segments.length === 0) return;

    let current: Map<string, unknown> | unknown[] = dataModel;

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      const nextSegment = segments[i + 1];
      const isNextArray = /^\d+$/.test(nextSegment);

      if (current instanceof Map) {
        if (!current.has(segment)) {
          current.set(segment, isNextArray ? [] : new Map());
        }
        current = current.get(segment) as Map<string, unknown> | unknown[];
      } else if (Array.isArray(current)) {
        const index = parseInt(segment, 10);
        if (current[index] === undefined) {
          current[index] = isNextArray ? [] : new Map();
        }
        current = current[index] as Map<string, unknown> | unknown[];
      }
    }

    const finalSegment = segments[segments.length - 1];
    if (current instanceof Map) {
      current.set(finalSegment, value);
    } else if (Array.isArray(current)) {
      current[parseInt(finalSegment, 10)] = value;
    }
  }

  /**
   * Gets data from the data model by path.
   */
  getData(surfaceId: string, path: string): unknown {
    const surface = this.surfaces.get(surfaceId);
    if (!surface) return undefined;

    const segments = path
      .replace(/^\//, '')
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(s => s.length > 0);

    let current: unknown = surface.dataModel;
    for (const segment of segments) {
      if (current instanceof Map) {
        current = current.get(segment);
      } else if (Array.isArray(current) && /^\d+$/.test(segment)) {
        current = current[parseInt(segment, 10)];
      } else if (typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[segment];
      } else {
        return undefined;
      }
    }
    return current;
  }
}

/**
 * Converts a Map-based data model to a plain object for easier use in React.
 */
export function dataModelToObject(dataModel: Map<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of dataModel.entries()) {
    if (value instanceof Map) {
      result[key] = dataModelToObject(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        item instanceof Map ? dataModelToObject(item) : item
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}
