import type { RendererComponent, PartResolver } from '@/types';
import { DefaultTextPart } from './DefaultTextPart';
import { A2uiDataPart } from './A2uiDataPart';
import {
  defaultTextPartResolver,
  DEFAULT_TEXT_PART_VARIANT,
  a2uiDataPartResolver,
  A2UI_DATA_PART_VARIANT,
} from './resolvers';

// Default part resolvers
export const DEFAULT_PART_RESOLVERS: PartResolver[] = [
  a2uiDataPartResolver,
  defaultTextPartResolver,
];

// Renderer registry mapping variant names to components
export const rendererRegistry = new Map<string, RendererComponent>([
  [DEFAULT_TEXT_PART_VARIANT, DefaultTextPart],
  [A2UI_DATA_PART_VARIANT, A2uiDataPart],
]);

// Function to register custom renderers
export function registerRenderer(variant: string, component: RendererComponent): void {
  rendererRegistry.set(variant, component);
}

// Function to register custom part resolvers
export function addPartResolver(resolver: PartResolver, prepend = true): PartResolver[] {
  if (prepend) {
    DEFAULT_PART_RESOLVERS.unshift(resolver);
  } else {
    DEFAULT_PART_RESOLVERS.push(resolver);
  }
  return DEFAULT_PART_RESOLVERS;
}
