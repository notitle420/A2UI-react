import { create } from 'zustand';

export interface AnyComponentNode {
  type: string;
  properties?: Record<string, unknown>;
  children?: AnyComponentNode[];
}

interface CanvasState {
  surfaceId: string | null;
  contents: AnyComponentNode[] | null;
  openSurfaceInCanvas: (surfaceId: string, contents: AnyComponentNode[]) => void;
  closeCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  surfaceId: null,
  contents: null,

  openSurfaceInCanvas: (surfaceId, contents) => {
    set({ surfaceId, contents: [...contents] });
  },

  closeCanvas: () => {
    set({ surfaceId: null, contents: null });
  },
}));
