import { useRef, useCallback } from 'react';
import type { Part } from '@a2a-js/sdk';
import { A2uiMessageProcessor, type A2uiMessage } from '@/utils/a2ui-processor';
import { useA2uiStore } from '@/stores/a2ui-store';

/**
 * Type guard for A2UI messages.
 * A2UI messages have one of: beginRendering, surfaceUpdate, dataModelUpdate, endRendering, deleteSurface
 */
function isA2uiMessage(data: unknown): data is A2uiMessage {
  if (!data || typeof data !== 'object') return false;
  return (
    'beginRendering' in data ||
    'surfaceUpdate' in data ||
    'dataModelUpdate' in data ||
    'endRendering' in data ||
    'deleteSurface' in data
  );
}

/**
 * Hook to manage A2UI message processing.
 *
 * Replaces the global `const a2uiProcessor = new A2uiMessageProcessor()` pattern
 * with proper React lifecycle management.
 *
 * @example
 * const { processA2uiParts, reset, getSurface } = useA2uiProcessor();
 *
 * // Process parts from API response
 * processA2uiParts(responseParts);
 *
 * // Reset on conversation clear
 * reset();
 */
export function useA2uiProcessor() {
  // Use ref to maintain processor instance across renders
  const processorRef = useRef<A2uiMessageProcessor>(new A2uiMessageProcessor());

  // Get store actions
  const updateSurfaces = useA2uiStore((state) => state.updateSurfaces);
  const clearSurfaces = useA2uiStore((state) => state.clearSurfaces);

  /**
   * Processes A2UI data parts from an API response.
   * Extracts A2UI messages from data parts and updates the store.
   */
  const processA2uiParts = useCallback(
    (parts: Part[]) => {
      const processor = processorRef.current;

      for (const part of parts) {
        if (part.kind === 'data' && part.data && typeof part.data === 'object') {
          const data = part.data as A2uiMessage;
          if (isA2uiMessage(data)) {
            processor.processMessage(data);
          }
        }
      }

      // Sync processor state to Zustand store
      updateSurfaces(processor.getSurfaces());
    },
    [updateSurfaces]
  );

  /**
   * Resets the processor and clears all surfaces.
   * Call this when clearing conversation history.
   */
  const reset = useCallback(() => {
    processorRef.current.clearSurfaces();
    clearSurfaces();
  }, [clearSurfaces]);

  /**
   * Gets a specific surface by ID.
   */
  const getSurface = useCallback((surfaceId: string) => {
    return processorRef.current.getSurface(surfaceId);
  }, []);

  return {
    processA2uiParts,
    reset,
    getSurface,
  };
}
