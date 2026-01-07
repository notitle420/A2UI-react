import { Box, Typography } from '@mui/material';
import type { RendererComponentProps } from '@/types';
import { rendererRegistry } from './registry';

export function A2aRenderer({ uiMessageContent }: RendererComponentProps) {
  const Component = rendererRegistry.get(uiMessageContent.variant);

  if (!Component) {
    console.warn(`No renderer found for variant: ${uiMessageContent.variant}`);
    return (
      <Box sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
        <Typography variant="caption" color="warning.dark">
          Unknown content type: {uiMessageContent.variant}
        </Typography>
      </Box>
    );
  }

  return <Component uiMessageContent={uiMessageContent} />;
}
