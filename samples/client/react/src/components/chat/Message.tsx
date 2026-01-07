import { useMemo } from 'react';
import { Box } from '@mui/material';
import { AgentHeader } from './AgentHeader';
import { A2aRenderer } from '../a2a-renderer/A2aRenderer';
import type { UiMessage, UiMessageContent } from '@/types';
import { isAgentThought } from '@/utils/a2a';

interface MessageProps {
  message: UiMessage;
}

function containsAgentThought(content: UiMessageContent): boolean {
  if ('kind' in content.data && content.data.kind === 'text') {
    return isAgentThought(content.data);
  }
  return false;
}

export function Message({ message }: MessageProps) {
  const isAgent = message.role.type === 'ui_agent';
  const showProgressIndicator = message.status === 'pending';

  const agentThoughts = useMemo(
    () => message.contents.filter((content) => containsAgentThought(content)),
    [message.contents]
  );

  const messageContents = useMemo(
    () => message.contents.filter((content) => !containsAgentThought(content)),
    [message.contents]
  );

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isAgent ? 'flex-start' : 'flex-end',
        mb: 2,
      }}
    >
      {isAgent && message.role.type === 'ui_agent' && (
        <AgentHeader
          agentName={message.role.name}
          agentIconUrl={message.role.iconUrl}
          showProgressIndicator={showProgressIndicator}
          agentThoughts={agentThoughts}
        />
      )}

      <Box
        sx={{
          maxWidth: isAgent ? '100%' : '80%',
          ...(isAgent
            ? {}
            : {
                bgcolor: 'grey.100',
                borderRadius: '16px 16px 4px 16px',
                px: 2,
                py: 1.5,
              }),
        }}
      >
        {messageContents.map((content) => (
          <Box key={content.id} sx={{ mb: 1, '&:last-child': { mb: 0 } }}>
            <A2aRenderer uiMessageContent={content} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
