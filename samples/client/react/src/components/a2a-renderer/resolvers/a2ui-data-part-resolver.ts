import type { Part } from '@a2a-js/sdk';
import type { PartResolver } from '@/types';

export const A2UI_DATA_PART_VARIANT = 'a2ui_data_part';

/**
 * Checks if a data part is an A2UI message.
 * A2UI messages have one of: beginRendering, surfaceUpdate, dataModelUpdate, endRendering, deleteSurface
 */
function isA2uiDataPart(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  return (
    'beginRendering' in data ||
    'surfaceUpdate' in data ||
    'dataModelUpdate' in data ||
    'endRendering' in data ||
    'deleteSurface' in data
  );
}

export const a2uiDataPartResolver: PartResolver = (part: Part): string | null => {
  if (part.kind === 'data' && isA2uiDataPart(part.data)) {
    return A2UI_DATA_PART_VARIANT;
  }
  return null;
};
