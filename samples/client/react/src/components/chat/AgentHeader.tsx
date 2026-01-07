import { useState } from 'react';
import { Box, IconButton, Typography, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Avatar } from './Avatar';
import type { UiMessageContent } from '@/types';

interface AgentHeaderProps {
  agentName?: string;
  agentIconUrl?: string;
  showProgressIndicator?: boolean;
  statusText?: string;
  agentThoughts?: readonly UiMessageContent[];
}

export function AgentHeader({
  agentName,
  agentIconUrl,
  showProgressIndicator = false,
  statusText,
  agentThoughts,
}: AgentHeaderProps) {
  const [expanded, setExpanded] = useState(false);
  const hasThoughts = agentThoughts && agentThoughts.length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar iconUrl={agentIconUrl} showProgressIndicator={showProgressIndicator} />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle2" fontWeight="medium">
            {agentName || 'Agent'}
          </Typography>
          {statusText && (
            <Typography variant="caption" color="text.secondary">
              {statusText}
            </Typography>
          )}
        </Box>
        {hasThoughts && (
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Hide thoughts' : 'Show thoughts'}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>

      {hasThoughts && (
        <Collapse in={expanded}>
          <Box
            sx={{
              ml: 5,
              p: 1.5,
              bgcolor: 'action.hover',
              borderRadius: 1,
              borderLeft: 2,
              borderColor: 'primary.main',
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Agent thoughts
            </Typography>
            {agentThoughts.map((thought, index) => (
              <Typography key={index} variant="body2" color="text.secondary">
                {typeof thought.data === 'object' && 'text' in thought.data
                  ? String(thought.data.text)
                  : JSON.stringify(thought.data)}
              </Typography>
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
