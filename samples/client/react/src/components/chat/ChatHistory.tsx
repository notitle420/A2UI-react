import { useEffect, useRef, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Message } from './Message';
import type { UiMessage } from '@/types';

interface ChatHistoryProps {
  history: UiMessage[];
  emptyHistoryContent?: React.ReactNode;
}

export function ChatHistory({ history, emptyHistoryContent }: ChatHistoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Group messages by turn (user message + following agent messages)
  const historyByTurn = useMemo(() => {
    const turns: UiMessage[][] = [];
    let currentTurn: UiMessage[] = [];

    for (const message of history) {
      if (currentTurn.length === 0) {
        currentTurn.push(message);
        continue;
      }

      const lastMessage = currentTurn[currentTurn.length - 1];
      if (message.role.type === 'ui_agent' && lastMessage.role.type === 'ui_user') {
        currentTurn.push(message);
      } else {
        turns.push(currentTurn);
        currentTurn = [message];
      }
    }

    if (currentTurn.length > 0) {
      turns.push(currentTurn);
    }

    return turns;
  }, [history]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [history.length]);

  if (history.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {emptyHistoryContent || (
          <Typography
            variant="h5"
            sx={{
              background: 'linear-gradient(90deg, #217bfe 28%, #078efb 50%, #ac87eb 71%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              fontWeight: 500,
            }}
          >
            How can I help you today?
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        overflowY: 'auto',
        px: 2,
      }}
    >
      {historyByTurn.map((turn, turnIndex) => (
        <Box
          key={turnIndex}
          sx={{
            minHeight: turnIndex === historyByTurn.length - 1 ? '100%' : 'auto',
            pb: turnIndex === historyByTurn.length - 1 ? 7 : 0,
          }}
        >
          {turn.map((message) => (
            <Message key={message.id} message={message} />
          ))}
        </Box>
      ))}
    </Box>
  );
}
