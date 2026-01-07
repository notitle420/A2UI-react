import { create } from 'zustand';
import type { A2uiSurface } from '@/utils/a2ui-processor';

/**
 * A2UI Store - Dedicated state management for A2UI surfaces.
 * Separated from chat store for better responsibility separation.
 */
interface A2uiState {
  /** Map of surface ID to A2uiSurface data */
  surfaces: Map<string, A2uiSurface>;

  /** Updates the surfaces map with new data */
  updateSurfaces: (surfaces: Map<string, A2uiSurface>) => void;

  /** Gets a specific surface by ID */
  getSurface: (surfaceId: string) => A2uiSurface | undefined;

  /** Clears all surfaces */
  clearSurfaces: () => void;
}

export const useA2uiStore = create<A2uiState>((set, get) => ({
  surfaces: new Map(),

  updateSurfaces: (surfaces) => {
    set({ surfaces: new Map(surfaces) });
  },

  getSurface: (surfaceId) => {
    return get().surfaces.get(surfaceId);
  },

  clearSurfaces: () => {
    set({ surfaces: new Map() });
  },
}));
