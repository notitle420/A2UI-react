import { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import { Box, TextField, IconButton, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import { useSendMessage } from '@/hooks';

export function InputArea() {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, cancelStream, isStreaming } = useSendMessage();

  const handleSubmit = useCallback(() => {
    if (query.trim() === '') return;

    cancelStream();
    sendMessage(query);
    setQuery('');
  }, [query, sendMessage, cancelStream]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleStop = useCallback(() => {
    cancelStream();
    textareaRef.current?.focus();
  }, [cancelStream]);

  return (
    <Box
      sx={{
        position: 'relative',
        px: 2,
        pb: 3,
        pt: 3,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -24,
          left: 0,
          right: 0,
          height: 48,
          background: 'linear-gradient(180deg, transparent 0%, background.paper 60%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <TextField
          inputRef={textareaRef}
          multiline
          minRows={1}
          maxRows={10}
          placeholder="Ask a question"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            },
          }}
        />
        {isStreaming ? (
          <IconButton
            onClick={handleStop}
            color="secondary"
            sx={{
              bgcolor: 'secondary.light',
              '&:hover': { bgcolor: 'secondary.main', color: 'white' },
            }}
          >
            <StopIcon />
          </IconButton>
        ) : (
          <IconButton
            onClick={handleSubmit}
            disabled={query.trim() === ''}
            color="primary"
            sx={{
              bgcolor: 'primary.light',
              '&:hover': { bgcolor: 'primary.main', color: 'white' },
              '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
            }}
          >
            <SendIcon />
          </IconButton>
        )}
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', textAlign: 'center', mt: 1 }}
      >
        AI may make mistakes. Check important info.
      </Typography>
    </Box>
  );
}
