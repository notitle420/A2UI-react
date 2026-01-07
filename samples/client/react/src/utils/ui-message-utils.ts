import type { Part } from '@a2a-js/sdk';
import { v4 as uuid } from 'uuid';
import type { PartResolver, UiMessageContent } from '@/types';
import { UNRESOLVED_PART_VARIANT } from '@/types';

/**
 * Converts a Part to a UiMessageContent.
 */
export function convertPartToUiMessageContent(
  part: Part,
  partResolvers: readonly PartResolver[],
): UiMessageContent {
  return {
    type: 'ui_message_content',
    id: uuid(),
    data: part,
    variant: resolvePartVariant(part, partResolvers),
  };
}

/**
 * Resolves the variant for a Part.
 */
function resolvePartVariant(part: Part, partResolvers: readonly PartResolver[]): string {
  for (const resolver of partResolvers) {
    const variant = resolver(part);
    if (variant !== null) {
      return variant;
    }
  }
  return UNRESOLVED_PART_VARIANT;
}
