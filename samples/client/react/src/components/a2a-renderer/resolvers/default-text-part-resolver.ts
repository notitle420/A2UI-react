import type { Part } from '@a2a-js/sdk';
import type { PartResolver } from '@/types';

export const DEFAULT_TEXT_PART_VARIANT = 'default_text_part';

export const defaultTextPartResolver: PartResolver = (part: Part): string | null => {
  if (part.kind === 'text') {
    return DEFAULT_TEXT_PART_VARIANT;
  }
  return null;
};
