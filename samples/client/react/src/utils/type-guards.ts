import type { DataPart, Part, TextPart } from '@a2a-js/sdk';

/**
 * Type guard to check if an A2A Part is a TextPart.
 */
export function isA2aTextPart(part: Part): part is TextPart {
  return 'kind' in part && part.kind === 'text';
}

/**
 * Type guard to check if an A2A Part is a DataPart.
 */
export function isA2aDataPart(part: Part): part is DataPart {
  return 'kind' in part && part.kind === 'data';
}

/**
 * Type guard to check if a given data object is an A2A Part.
 */
export function isA2aPart(data: unknown): data is Part {
  return data !== null && typeof data === 'object' && 'kind' in data;
}
