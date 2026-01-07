import type { RendererComponentProps } from '@/types';

/**
 * A2UI Data Part renderer.
 * A2UI surfaces are rendered in the Canvas area, not in the chat.
 * This component returns null to prevent duplicate rendering in the chat.
 */
export function A2uiDataPart(_props: RendererComponentProps) {
  // A2UI surfaces are processed by the store and rendered in the Canvas component
  // We don't render anything in the chat for A2UI data parts
  return null;
}
