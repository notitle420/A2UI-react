import type { Artifact, Part } from '@a2a-js/sdk';
import type { UiMessageContent } from './ui-message';

/**
 * Contextual information for rendering UI components.
 */
export interface RenderingContext {
  readonly isA2aStreamOpen: boolean;
}

/**
 * Props interface for renderer components.
 */
export interface RendererComponentProps {
  uiMessageContent: UiMessageContent;
}

/**
 * Type for a React component that renders a UiMessageContent.
 */
export type RendererComponent = React.ComponentType<RendererComponentProps>;

/**
 * Represents an entry in the renderer map.
 * It's a tuple containing the variant name string and the corresponding component.
 */
export type RendererEntry = [variantName: string, component: RendererComponent];

/**
 * Type definition for a function that attempts to resolve a content variant
 * string for a given Part.
 * Returns null if no variant can be resolved.
 */
export type PartResolver = (part: Part) => string | null;

/**
 * Unresolved variant for a2a.v1.Part.
 */
export const UNRESOLVED_PART_VARIANT = 'unresolved_part';

/**
 * Type definition for a function that attempts to resolve a content variant
 * string for a given Artifact.
 * Returns null if no variant can be resolved.
 */
export type ArtifactResolver = (artifact: Artifact) => string | null;

/**
 * Unresolved variant for a2a.v1.Artifact.
 */
export const UNRESOLVED_ARTIFACT_VARIANT = 'unresolved_artifact';
