import { Box, CircularProgress } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface AvatarProps {
  iconUrl?: string;
  showProgressIndicator?: boolean;
  size?: 'small' | 'large';
}

export function Avatar({ iconUrl, showProgressIndicator = false, size = 'small' }: AvatarProps) {
  const iconSize = size === 'large' ? 32 : 20;

  return (
    <Box
      sx={{
        position: 'relative',
        height: 32,
        width: 32,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {iconUrl ? (
        <Box
          component="img"
          src={iconUrl}
          alt="Agent avatar"
          sx={{
            width: iconSize,
            height: iconSize,
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <AutoAwesomeIcon
          sx={{
            width: iconSize,
            height: iconSize,
            color: 'primary.main',
          }}
        />
      )}
      {showProgressIndicator && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={32} thickness={2} />
        </Box>
      )}
    </Box>
  );
}
