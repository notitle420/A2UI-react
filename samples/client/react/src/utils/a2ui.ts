import type { Part } from '@a2a-js/sdk';
import { isA2aDataPart } from './type-guards';

// A2UI message types
export interface BeginRenderingMessage {
  surfaceId: string;
  catalogUri?: string;
  rootComponent?: unknown;
}

export interface SurfaceUpdateMessage {
  surfaceId: string;
  updates: unknown[];
}

export interface DataModelUpdate {
  surfaceId: string;
  dataModelId: string;
  data: unknown;
}

export interface DeleteSurfaceMessage {
  surfaceId: string;
}

export type ServerToClientMessage =
  | { beginRendering: BeginRenderingMessage }
  | { surfaceUpdate: SurfaceUpdateMessage }
  | { dataModelUpdate: DataModelUpdate }
  | { deleteSurface: DeleteSurfaceMessage };

/**
 * Extracts A2UI ServerToClientMessages from an array of A2A Parts.
 */
export function extractA2uiDataParts(parts: Part[]): ServerToClientMessage[] {
  return parts.reduce<ServerToClientMessage[]>((messages, part) => {
    if (isA2aDataPart(part)) {
      if (part.data && typeof part.data === 'object') {
        const data = part.data as Record<string, unknown>;
        if ('beginRendering' in data) {
          messages.push({
            beginRendering: data['beginRendering'] as BeginRenderingMessage,
          });
        } else if ('surfaceUpdate' in data) {
          messages.push({
            surfaceUpdate: data['surfaceUpdate'] as SurfaceUpdateMessage,
          });
        } else if ('dataModelUpdate' in data) {
          messages.push({
            dataModelUpdate: data['dataModelUpdate'] as DataModelUpdate,
          });
        } else if ('deleteSurface' in data) {
          messages.push({
            deleteSurface: data['deleteSurface'] as DeleteSurfaceMessage,
          });
        }
      }
    }
    return messages;
  }, []);
}
