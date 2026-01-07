import { useMemo } from 'react';
import { Box, Paper, Typography, IconButton, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import { GoogleMap as GoogleMapComponent, Marker, useJsApiLoader } from '@react-google-maps/api';

export interface MapPin {
  lat: number;
  lng: number;
  name?: string;
  description?: string;
  background?: string;
  borderColor?: string;
  glyphColor?: string;
}

interface GoogleMapProps {
  title?: string;
  zoom?: number;
  center?: { lat: number; lng: number };
  pins?: MapPin[];
}

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '4px',
};

const defaultCenter = {
  lat: 34.0626,
  lng: -118.3759,
};

export function GoogleMap({ title, zoom = 10, center, pins = [] }: GoogleMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['marker'],
  });

  const mapCenter = useMemo(() => center || defaultCenter, [center]);

  if (loadError) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Error loading Google Maps</Typography>
      </Paper>
    );
  }

  if (!isLoaded) {
    return (
      <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 2,
        maxWidth: 800,
        mx: 'auto',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">{title}</Typography>
        <Box>
          <IconButton size="small">
            <DownloadIcon />
          </IconButton>
          <IconButton size="small">
            <ShareIcon />
          </IconButton>
        </Box>
      </Box>

      <GoogleMapComponent
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        options={{
          mapId: '4506f1f5f5e6e8e2',
        }}
      >
        {pins.map((pin, index) => (
          <Marker
            key={index}
            position={{ lat: pin.lat, lng: pin.lng }}
            title={pin.name}
          />
        ))}
      </GoogleMapComponent>
    </Paper>
  );
}
