import { Box, Typography, Paper } from '@mui/material';
import { useA2uiStore } from '@/stores';
import { A2uiSurfaceRenderer } from './A2uiSurface';

export function Canvas() {
  const a2uiSurfaces = useA2uiStore((state) => state.surfaces);

  // Convert Map to array for rendering
  const surfaces = Array.from(a2uiSurfaces.values());

  if (surfaces.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2">
          Ask a question to see visualizations here
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {surfaces.map((surface) => (
        <Paper
          key={surface.surfaceId}
          elevation={1}
          sx={{
            overflow: 'hidden',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'grey.50',
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              {surface.surfaceId}
            </Typography>
          </Box>
          <A2uiSurfaceRenderer surface={surface} />
        </Paper>
      ))}
    </Box>
  );
}
